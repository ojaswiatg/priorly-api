import {
    API_ERROR_MAP,
    AUTH_COOKIE,
    EOTPOperation,
    EServerResponseCodes,
    EServerResponseRescodes,
} from "#constants";
import {
    createNewUserSession,
    generateNewOTPForEmail,
    sendMail,
} from "#helpers";
import SessionModel from "#models/SessionModel";
import { UserSchema } from "#models/UserModel";
import {
    AuthLoginRequest,
    AuthSignupRequest,
    type TAuthLoginRequest,
    type TAuthSignupRequest,
} from "#schemas";
import { getFormattedZodErrors, logURL } from "#utils";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import _ from "lodash";
import type { InferSchemaType } from "mongoose";
import type { ZodError } from "zod";

async function signup(req: Request, res: Response) {
    // sends a mail caught by UserController.create
    logURL(req);

    // is user already logged in?

    let userDetails = req.body;

    if (_.isEmpty(userDetails)) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to create user",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Email and password are required.`,
        });
    }

    try {
        userDetails = AuthSignupRequest.parse(userDetails); // strips unnecessary keys
    } catch (error) {
        const errors = getFormattedZodErrors(error as ZodError);

        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to create user",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Invalid data.`,
            errors,
        });
    }

    try {
        delete userDetails.confirmPassword;
        const userArgs = userDetails as TAuthSignupRequest;

        // Check for user already exist - already done by middleware isEmailAlreadyTaken

        // Check and generate a new OTP
        const otp = await generateNewOTPForEmail({
            email: userArgs.email,
            name: userArgs.name,
            password: userArgs.password,
            operation: EOTPOperation.SIGNUP,
        });

        // if we couldn't generate the otp
        if (!otp) {
            return res.status(EServerResponseCodes.CONFLICT).json({
                rescode: EServerResponseRescodes.ERROR,
                message:
                    "Please wait for some time before requesting a new OTP",
                error: `${API_ERROR_MAP[EServerResponseCodes.CONFLICT]}: OTP already requested`,
            });
        }

        sendMail({
            emailTo: userArgs.email,
            subject: "Verify your Priorly account",
            templateFileName: "signup",
            context: {
                otp,
            },
            methodName: "auth/signup",
        });

        return res.status(EServerResponseCodes.OK).json({
            rescode: EServerResponseRescodes.SUCCESS,
            message:
                "Verification code sent, please check your email's inbox and spam folders",
        });
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to signup",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Failed to signup`,
        });
    }
}

async function login(req: Request, res: Response) {
    logURL(req);

    const userDetails = req.body as TAuthLoginRequest;
    if (!userDetails.email || !userDetails.password) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to login",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Email and password are required.`,
        });
    }

    const isValidUserDetais = AuthLoginRequest.safeParse(userDetails).success;
    if (!isValidUserDetais) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to login",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Invalid credentials.`,
        });
    }

    try {
        const foundUser = req.body.user as InferSchemaType<
            typeof UserSchema
        > & { id: string }; // guaranteed from doesUserExist middleware

        const passwordMatched = await bcrypt.compare(
            userDetails.password,
            foundUser.password,
        );

        if (!passwordMatched) {
            return res.status(EServerResponseCodes.UNAUTHORIZED).json({
                rescode: EServerResponseRescodes.ERROR,
                message: "Wrong password",
                error: `${API_ERROR_MAP[EServerResponseCodes.UNAUTHORIZED]}: Wrong password`,
            });
        }

        const sid = await createNewUserSession(foundUser.id);
        if (!sid) {
            return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
                rescode: EServerResponseRescodes.ERROR,
                message: "Failed to login",
                error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Session creation failed`,
            });
        }

        return res
            .cookie("sid", sid, AUTH_COOKIE)
            .status(EServerResponseCodes.OK)
            .json({
                rescode: EServerResponseRescodes.SUCCESS,
                message: "User logged in successfully",
            });
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to login",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Failed to login`,
        });
    }
}

async function logout(req: Request, res: Response) {
    logURL(req);

    const sid = req.params.sid; // sid is guranteed from the isUserAuthenticated middleware

    try {
        await SessionModel.findByIdAndDelete(sid);
        return res
            .cookie("sid", "", AUTH_COOKIE)
            .status(EServerResponseCodes.OK)
            .json({
                rescode: EServerResponseRescodes.SUCCESS,
                message: "User logged out successfully",
            });
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to logout",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Failed to logout`,
        });
    }
}

async function logoutAllSessions(req: Request, res: Response) {
    logURL(req);

    const userId = req.params.userId; // userId is guranteed from the isUserAuthenticated middleware

    try {
        await SessionModel.deleteMany({ user: userId });
        return res.status(EServerResponseCodes.OK).json({
            rescode: EServerResponseRescodes.SUCCESS,
            message: "User logged out successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to logout from all sessions",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Failed to logout from all sessions`,
        });
    }
}

async function forgotPassword(req: Request, res: Response) {
    // all error handling are being done by the individual methods

    const foundUser = req.body.user as InferSchemaType<typeof UserSchema>; // guranteed from doesUserExist middleware

    const otp = await generateNewOTPForEmail({
        email: foundUser.email,
        password: foundUser.password,
        operation: EOTPOperation.FORGOT_PASSWORD,
    });

    if (!otp) {
        return res.status(EServerResponseCodes.CONFLICT).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Please wait for some time before requesting a new OTP",
            error: `${API_ERROR_MAP[EServerResponseCodes.CONFLICT]}: OTP already requested`,
        });
    }

    sendMail({
        emailTo: foundUser.email,
        subject: "Password change request",
        templateFileName: "pre-forgot-password",
        context: {
            otp,
        },
        methodName: "auth/forgotPassword",
    });

    return res.status(EServerResponseCodes.OK).json({
        rescode: EServerResponseRescodes.SUCCESS,
        message:
            "Verification code sent, please check your email's inbox and spam folders",
    });
}

export default {
    signup,
    login,
    logout,
    logoutAllSessions,
    forgotPassword,
};
