import _ from "lodash";
import { isValidObjectId } from "mongoose";

import SessionModel from "#models/SessionModel";
import UserModel from "#models/UserModel";

export async function createNewUserSession(userId: string) {
    try {
        //  validating a new session
        if (!isValidObjectId(userId)) {
            console.error(
                `Cannot create new session. User id not valid. User id: ${userId}`,
            );
            return;
        }

        const user = UserModel.findById(userId);
        if (_.isEmpty(user)) {
            console.error(
                `Cannot create new session. User does not exist. User id: ${userId}`,
            );
            return;
        }

        // adding a new session
        const session = await SessionModel.create({ userId });
        return session.id;
    } catch (error) {
        console.error(`Failed to create user session. User id: ${userId}`);
        console.error(error);
        return;
    }
}

export async function getUserIdFromSession(sessionId: string) {
    try {
        const session = await SessionModel.findById(sessionId);
        if (_.isEmpty(session)) {
            console.error(`Session not found. Session id: ${sessionId}`);
            return;
        }
        return session.user.id;
    } catch (error) {
        console.error(
            `Failed to get user id from the sessions. Session id: ${sessionId}`,
        );
        console.error(error);
        return;
    }
}

export async function getSessionIdFromUserId(userId: string) {
    try {
        const user = UserModel.findById(userId);
        if (_.isEmpty(user)) {
            console.error(`User not found. User id: ${userId}`);
            return;
        }

        const session = await SessionModel.findOne({ user: userId });
        if (_.isEmpty(session)) {
            console.info(`User has no session. User id: ${userId}`);
            return;
        }
        return session.id;
    } catch (error) {
        console.error(
            `Failed to get user id from the sessions. Session id: ${userId}`,
        );
        console.error(error);
        return;
    }
}

export async function invalidateSessionById(sessionId: string) {
    try {
        await SessionModel.findByIdAndDelete(sessionId);
        return true;
    } catch (error) {
        console.error(`Cannot invalidate session. Session id: ${sessionId}`);
        console.error(error);
        return false;
    }
}

export async function invalidateAllSessionsByUserId(userId: string) {
    try {
        const user = UserModel.findById(userId);
        if (_.isEmpty(user)) {
            console.error(`User not found. User id: ${userId}`);
            return false;
        }

        await SessionModel.deleteMany({ user: userId });
        return true;
    } catch (error) {
        console.error(
            `Failed to invalidate all sessions for user. User id: ${userId}`,
        );
        console.error(error);
        return false;
    }
}
