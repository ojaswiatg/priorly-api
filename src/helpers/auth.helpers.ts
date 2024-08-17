import _ from "lodash";

import SessionModel from "#models/SessionModel";
import OTPModel from "#models/OTPModel";

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
        // no need to check timelimit, the document deletes itself automatically in 1 minute - check schema definition for more details

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
        const otp = Math.floor(1000 + Math.random() * 9000);
        const canSendOTP = await canUserSendOTP(email);

        if (!canSendOTP) {
            return null;
        }

        await OTPModel.deleteOne({ email });
        const createdOTP = await OTPModel.create({ otp, email, password });
        return createdOTP;
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
