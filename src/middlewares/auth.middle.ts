import type { Request, Response, NextFunction } from "express";
import _ from "lodash";

import {
    API_ERROR_MAP,
    EServerResponseCodes,
    EServerResponseRescodes,
} from "#constants";

import UserModel from "#models/UserModel";

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
