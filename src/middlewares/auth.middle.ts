import type { Request, Response, NextFunction } from "express";
import _ from "lodash";

import {
    API_ERROR_MAP,
    EServerResponseCodes,
    EServerResponseRescodes,
} from "#constants";

import UserModel from "#models/UserModel";
import SessionModel from "#models/SessionModel";

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

        const userId = session.userId;
        req.params.userId = userId;

        next();
    } catch (error) {
        console.error("Internal server error. Path: auth/isUserAuthenticated");
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
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}`,
            message: "Faild to verify details, please try again later",
        });
    }
}
