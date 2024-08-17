import _ from "lodash";

import SessionModel from "#models/SessionModel";
import OTPModel from "#models/OTPModel";
import { getCurrentTimestamp } from "#utils";

// Sessions
export async function createNewUserSession(email: string) {
    try {
        const session = await SessionModel.create({ email });
        return session.id;
    } catch (error) {
        console.error(`Failed to create user session. Email id: ${email}`);
        console.error(error);
    }
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

export async function invalidateAllSessionsByEmail(email: string) {
    try {
        const deleted = await SessionModel.deleteMany({ email });
        if (_.isEmpty(deleted)) {
            return false;
        }
        return true;
    } catch (error) {
        console.error(`Failed to invlaidate all sessions. email id: ${email}`);
    }
}

export async function getEmailBySessionId(sessionId: string) {
    try {
        const session = await SessionModel.findById(sessionId);
        if (_.isEmpty(session)) {
            return null;
        }
        return session.id;
    } catch (error) {
        console.error(
            `Failed to get email id by session id. Session id: ${sessionId}`,
        );
    }
}

export async function getSessionIdsByEmail(email: string) {
    try {
        const sessions = await SessionModel.find({ email });
        if (_.isEmpty(sessions)) {
            return null;
        }
        return _.map(sessions, (session) => {
            return session.id;
        });
    } catch (error) {
        console.error(
            `Failed to get session ids by email id. Email id: ${email}`,
        );
    }
}

export async function isUserLoggedIn(email: string, sessionId: string) {
    const sessions = await getSessionIdsByEmail(email);
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

export async function generateNewOTPForEmail(email: string, password?: string) {
    try {
        const canSendOTP = await canUserSendOTP(email);
        if (!canSendOTP) {
            return null;
        }

        const otp = Math.floor(1000 + Math.random() * 9000);

        // delete previously created otp if it is there
        await OTPModel.deleteOne({ email });

        // create new otp
        const createdOTP = await OTPModel.create({ otp, email, password });
        return createdOTP.otp;
    } catch (error) {
        console.error(`Failed to get generate new OTP. Email id: ${email}`);
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
