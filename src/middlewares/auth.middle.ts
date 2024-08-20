import {
    API_ERROR_MAP,
    EServerResponseCodes,
    EServerResponseRescodes,
} from "#constants";
import SessionModel from "#models/SessionModel";
import UserModel, { UserSchema } from "#models/UserModel";
import {
    IsCorrectPasswordSchema,
    userEmailSchema,
    type TIsCorrectPasswordSchema,
} from "#schemas";
import { getFormattedZodErrors, logURL } from "#utils";
import bcrypt from "bcrypt";
import type { NextFunction, Request, Response } from "express";
import _ from "lodash";
import { isValidObjectId, type InferSchemaType } from "mongoose";

export async function isUserAuthenticated(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const sid = req.cookies.sid;

    if (!sid || !isValidObjectId(sid)) {
        return res.status(EServerResponseCodes.FORBIDDEN).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Please log in to continue",
            error: `${API_ERROR_MAP[EServerResponseCodes.FORBIDDEN]}: Invalid session`,
        });
    }

    try {
        const session = await SessionModel.findById(sid);
        if (_.isEmpty(session)) {
            return res.status(EServerResponseCodes.FORBIDDEN).json({
                rescode: EServerResponseRescodes.ERROR,
                message: "Please log in to continue",
                error: `${API_ERROR_MAP[EServerResponseCodes.FORBIDDEN]}: Invalid session`,
            });
        }

        const foundUser = await UserModel.findById(session.userId);
        if (_.isEmpty(foundUser) || session.userId !== foundUser.id) {
            return res.status(EServerResponseCodes.NOT_FOUND).json({
                rescode: EServerResponseRescodes.ERROR,
                message: "User not found in this session",
                error: `${API_ERROR_MAP[EServerResponseCodes.NOT_FOUND]}: User does not exist`,
            });
        }

        req.query.userId = session.userId;
        req.query.email = foundUser.email;
        req.body.user = foundUser;

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
    // if new email is there then we check is email already taken with new email - in case of email change
    const email = (req.body.newEmail || req.body.email) as string;

    const isValidEmail = userEmailSchema.safeParse(email).success;
    if (!isValidEmail) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Please enter a valid email",
            error: `${EServerResponseCodes.BAD_REQUEST}: Invalid email id`,
        });
    }

    try {
        const user = await UserModel.findOne({ email: email });

        if (_.isEmpty(user)) {
            req.query.newEmail = req.body.newEmail;
            req.query.email = req.body.email;
            next();
        } else {
            return res.status(EServerResponseCodes.CONFLICT).json({
                rescode: EServerResponseRescodes.ERROR,
                message:
                    "This email is already taken, please use a different email",
                error: `${API_ERROR_MAP[EServerResponseCodes.CONFLICT]}: Email already taken`,
            });
        }
    } catch (error) {
        logURL(req);
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to verify details, please try again later",
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

export async function doesUserExist(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const email = req.body.email;
    const isValidEmail = userEmailSchema.safeParse(email).success;
    if (!email || !isValidEmail) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Please enter a valid email",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Invalid email id`,
        });
    }

    try {
        const user = await UserModel.findOne({ email });
        if (_.isEmpty(user)) {
            return res.status(EServerResponseCodes.NOT_FOUND).json({
                rescode: EServerResponseRescodes.ERROR,
                message: "No user found with this email id",
                error: `${API_ERROR_MAP[EServerResponseCodes.NOT_FOUND]}: User does not exist`,
            });
        }

        req.body.user = user;
        next();
    } catch (error) {
        logURL(req);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to check user info",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: User lookup failed`,
        });
    }
}

export async function doesPasswordMatch(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const userDetails = req.body as TIsCorrectPasswordSchema;

    // params email guranteed by isUserAuthenticated middleware
    userDetails.email = req.query.email || req.body.email;

    const isValidUserDetails = IsCorrectPasswordSchema.safeParse(userDetails);

    if (!isValidUserDetails.success) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to verify credentials, please try again later",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Failed to verify credentials`,
            errors: getFormattedZodErrors(isValidUserDetails.error),
        });
    }

    try {
        const foundUser = req.body.user as InferSchemaType<
            typeof UserSchema
        > & { id: string }; // guaranteed by doesUserExist or isUserAuthenticated middleware

        const passwordMatched = await bcrypt.compare(
            userDetails.password,
            foundUser?.password ?? "",
        );

        if (!passwordMatched) {
            return res.status(EServerResponseCodes.UNAUTHORIZED).json({
                rescode: EServerResponseRescodes.ERROR,
                message: "Wrong password",
                error: `${API_ERROR_MAP[EServerResponseCodes.UNAUTHORIZED]}: Wrong password`,
            });
        }

        req.query.userId = foundUser.id;
        req.query.email = foundUser.email;

        next();
    } catch (error) {
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to verify credentials",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Password lookup failed`,
        });
    }
}
