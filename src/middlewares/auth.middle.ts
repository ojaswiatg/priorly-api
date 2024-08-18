import {
    API_ERROR_MAP,
    EServerResponseCodes,
    EServerResponseRescodes,
} from "#constants";
import SessionModel from "#models/SessionModel";
import UserModel from "#models/UserModel";
import { logURL } from "#utils";
import type { NextFunction, Request, Response } from "express";
import _ from "lodash";
import { isValidObjectId } from "mongoose";

export async function isUserAuthenticated(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const sid = req.cookies.sid;

    try {
        const session = await SessionModel.findById(sid);
        if (!sid || _.isEmpty(session)) {
            return res.status(EServerResponseCodes.FORBIDDEN).json({
                rescode: EServerResponseRescodes.ERROR,
                message: "Please log in to continue",
                error: `${API_ERROR_MAP[EServerResponseCodes.FORBIDDEN]}: Invalid session`,
            });
        }

        req.params.userId = session.userId;
        req.params.email = session.email;

        next();
    } catch (error) {
        logURL(req);
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to verify user credentials",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Session lookup failed`,
        });
    }
}

export async function isEmailAlreadyTaken(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const email = req.body.email as string;

    try {
        const user = await UserModel.findOne({ email: email });

        if (_.isEmpty(user)) {
            next();
        } else {
            return res.status(EServerResponseCodes.CONFLICT).json({
                rescode: EServerResponseRescodes.ERROR,
                message:
                    "Email already taken, please use a different email or login",
                error: `${API_ERROR_MAP[EServerResponseCodes.CONFLICT]}: Email already taken`,
            });
        }
    } catch (error) {
        logURL(req);
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Faild to verify details, please try again later",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Failed to verify credentials`,
        });
    }
}

export async function isUserAlreadyLoggedIn(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const sid = req.cookies.sid;
    if (!sid || !isValidObjectId(sid)) {
        next();
        return;
    }

    try {
        const session = await SessionModel.findById(sid);
        if (!_.isEmpty(session)) {
            return res.status(EServerResponseCodes.BAD_REQUEST).json({
                rescode: EServerResponseRescodes.ERROR,
                message: "Please log out to continue",
                error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: User already logged in`,
            });
        } else {
            next();
        }
    } catch (error) {
        logURL(req);
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to verify user credentials",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Session lookup failed`,
        });
    }
}
