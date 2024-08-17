import type { EOTPOperation } from "#constants";
import OTPModel from "#models/OTPModel";
import SessionModel from "#models/SessionModel";
import UserModel from "#models/UserModel";
import { getCurrentTimestamp } from "#utils";
import _ from "lodash";

// Sessions
export async function createNewUserSession(userId: string) {
    const user = await UserModel.findById(userId);
    if (_.isEmpty(user)) {
        throw new Error(`Cannot find any user with this user id: ${userId}`);
    }
    const session = await SessionModel.create({ user: user.id });
    return session.id;
}

export async function invalidateUserSessionById(sessionId: string) {
    try {
        const session = await SessionModel.findByIdAndDelete(sessionId);
        if (_.isEmpty(session)) {
            return false;
        }
        return true;
    } catch (error) {
        console.error(
            `Failed to invalidate the session. Session id: ${sessionId}`,
        );
        return false;
    }
}

export async function invalidateAllSessionsByUserId(userId: string) {
    try {
        const deleted = await SessionModel.deleteMany({ userId });
        if (_.isEmpty(deleted)) {
            return false;
        }
        return true;
    } catch (error) {
        console.error(`Failed to invlaidate all sessions. user id: ${userId}`);
    }
}

export async function getUserBySessionId(sessionId: string) {
    try {
        const session = await SessionModel.findById(sessionId);
        if (_.isEmpty(session)) {
            return null;
        }
        return session.user;
    } catch (error) {
        console.error(
            `Failed to get email id by session id. Session id: ${sessionId}`,
        );
    }
}

export async function getSessionIdsByUserId(userId: string) {
    try {
        const sessions = await SessionModel.find({ userId });
        if (_.isEmpty(sessions)) {
            return null;
        }
        return _.map(sessions, (session) => {
            return session.id;
        });
    } catch (error) {
        console.error(
            `Failed to get session ids by user id. user id: ${userId}`,
        );
    }
}

export async function isUserLoggedIn(userId: string, sessionId: string) {
    const sessions = await getSessionIdsByUserId(userId);
    if (_.includes(sessions, sessionId)) {
        return true;
    }
    return false;
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
        console.error(
            `Failed to check if user can send OTP. Email id: ${email}`,
        );
        return false;
    }
}

interface IGenerateNewOTPForEmailParams {
    email: string;
    name?: string;
    operation: EOTPOperation;
    password?: string;
    newEmail?: string;
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
            email: params.email,
            name: params.name,
            password: params.password,
            operation: params.operation,
        });
        return createdOTP.otp;
    } catch (error) {
        console.error(
            `Failed to get generate new OTP. Email id: ${params.email}`,
        );
        console.error(error);
        return null;
    }
}

export async function deleteOTPForUser(email: string) {
    try {
        await OTPModel.deleteMany({ email });
        return true;
    } catch (error) {
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
        console.error(`Failed to check user OTP. Email id: ${email}`);
        return false;
    }
}
