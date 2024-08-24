import { redisClient } from "#config/redis";
import type { EOTPOperation } from "#constants";
import OTPModel from "#models/OTPModel";
import { getCurrentTimestamp } from "#utils";
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";

const USER_SESSION_PREFIX = "user:sessions";

// CSRF Tokens
export function generateNewCSRFToken() {
    const token = uuidv4();
    return token;
}

// Sessions
export async function addSessionToUserSet(userId: string, sessionId: string) {
    try {
        await redisClient.sadd(`${USER_SESSION_PREFIX}:${userId}`, sessionId);
        return true;
    } catch (error) {
        console.error("Failed to add session id to user set");
        return false;
    }
}

export async function removeSessionFromUserSet(
    userId: string,
    sessionId: string,
) {
    try {
        await redisClient.srem(`${USER_SESSION_PREFIX}:${userId}`, sessionId);
        return true;
    } catch (error) {
        console.error("Failed to remove session id from user set");
        return false;
    }
}

export async function removeAllSessionFromUserSet(
    userId: string,
    sessionIdToExcept?: string,
) {
    const sessionIds = await redisClient.smembers(
        `${USER_SESSION_PREFIX}:${userId}`,
    );

    try {
        for (const sessionId of sessionIds) {
            let sessionExistForThisId = await redisClient.exists(
                `sess:${sessionId}`,
            );

            // manually setting sessionExistForThisId to 0 when exceptThisSession is true
            if (sessionIdToExcept && sessionId === sessionIdToExcept) {
                sessionExistForThisId = 0;
            }

            if (sessionExistForThisId) {
                await redisClient.del(`sess:${sessionId}`);
                await removeSessionFromUserSet(userId, sessionId);
            }
        }

        if (!sessionIdToExcept) {
            // when no session id to except, delete the entire mapping itself
            await redisClient.del(`${USER_SESSION_PREFIX}:${userId}`);
        }

        return true;
    } catch (error) {
        console.error("Failed to remove all session ids from user set");
        return false;
    }
}

// OTP
async function canUserSendOTP(email: string) {
    try {
        const otpDoc = await OTPModel.findOne({ email });
        if (_.isEmpty(otpDoc)) {
            // if OTP does not exist then we return true
            return true;
        }

        const ONE_MINUTE = 60 * 1000;
        const currTime = getCurrentTimestamp();
        const prevTime = otpDoc.createdOn;

        if (currTime && prevTime && currTime - prevTime >= ONE_MINUTE) {
            // deletes the previous OTP
            await OTPModel.deleteOne({ email });
            return true;
        }

        return false;
    } catch (error) {
        console.error("helper/auth: canUserSendOTP");
        console.error(
            `Failed to check if user can send OTP. Email id: ${email}`,
        );
        return false;
    }
}

interface IGenerateNewOTPForEmailParams {
    email: string;
    name?: string;
    newEmail?: string;
    operation: EOTPOperation;
    password?: string;
}

export async function generateNewOTPForEmail(
    params: IGenerateNewOTPForEmailParams,
) {
    try {
        const canSendOTP = await canUserSendOTP(params.email);
        if (!canSendOTP) {
            return null;
        }

        // delete previously created otp if it is there for the user
        await OTPModel.deleteOne({ email: params.email });

        // Keep finding unique OTP until it is found but with a certain timelimit

        const endTime = Date.now() + 30 * 1000; // Run this loop for max of 30 seconds only
        let otp, otpFound;

        do {
            const currTime = Date.now();
            if (currTime > endTime) {
                throw new Error(
                    "Cannot generate unique OTP: time limit exceeded",
                );
            }

            otp = Math.floor(100000 + Math.random() * 900000);
            otpFound = await OTPModel.findOne({ otp });
        } while (!_.isEmpty(otpFound));

        // create new otp
        const createdOTP = await OTPModel.create({
            otp,
            ...params,
        });
        return createdOTP.otp;
    } catch (error) {
        console.error("helper/auth: generateNewOTPForEmail");
        console.error(`Failed to generate new OTP. Email id: ${params.email}`);
        console.error(error);
        return null;
    }
}

export async function deleteOTPForUser(email: string) {
    try {
        await OTPModel.deleteMany({ email });
        return true;
    } catch (error) {
        console.error("helper/auth: deleteOTPForUser");
        console.error(`Failed to delete user OTP. Email id: ${email}`);
        return false;
    }
}

export async function isValidOTPForUser(email: string, otp: number) {
    try {
        const otpDoc = await OTPModel.findOne({ email });
        if (otpDoc && otpDoc.otp === otp) {
            return true;
        }
        return false;
    } catch (error) {
        console.error("helper/auth: isValidOTPForUser");
        console.error(`Failed to check user OTP. Email id: ${email}`);
        return false;
    }
}
