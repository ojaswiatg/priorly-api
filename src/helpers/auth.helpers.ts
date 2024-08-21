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
        return null;
    }
    const session = await SessionModel.create({ user: userId });
    return session.id as string;
}

export async function invalidateUserSessionById(sessionId: string) {
    const session = await SessionModel.findByIdAndDelete(sessionId);
    if (_.isEmpty(session)) {
        return false;
    }
    return true;
}

export async function invalidateAllSessionsByUserId(userId: string) {
    const deleted = await SessionModel.deleteMany({ userId });
    if (_.isEmpty(deleted)) {
        return false;
    }
    return true;
}

export async function getUserBySessionId(sessionId: string) {
    const session = await SessionModel.findById(sessionId);
    if (_.isEmpty(session)) {
        return null;
    }
    return session.user;
}

export async function getSessionIdsByUserId(userId: string) {
    const sessions = await SessionModel.find({ userId });
    if (_.isEmpty(sessions)) {
        return null;
    }
    return _.map(sessions, (session) => {
        return session.id;
    });
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
