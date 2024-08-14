import type { Request, Response, NextFunction } from "express";
import _ from "lodash";
import { EServerResponseCodes, EServerResponseRescodes } from "#constants";
import UserModel from "#models/UserModel";
import { isValidTurnAroundTime } from "#utils";

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
                message: `${email} is already taken. Please use a different email.`,
                error: "Duplicate email",
            });
        }
    } catch (error) {
        return res.status(EServerResponseCodes.CONFLICT).json({
            rescode: EServerResponseRescodes.ERROR,
            error: "Internal server error",
            message: "Cannot change email, please try again later.",
        });
    }
}

export async function canSendAnotherEmail(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const email = req.body.email;

    const canSendAnotherEmail = await isValidTurnAroundTime(email);
    if (!canSendAnotherEmail) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Please wait for sometime to send another email",
            error: "Bad request",
        });
    } else {
        next();
    }
}
