import {
    API_ERROR_MAP,
    EOTPOperation,
    EServerResponseCodes,
    EServerResponseRescodes,
} from "#constants";
import {
    createNewUserSession,
    generateNewOTPForEmail,
    sendMail,
} from "#helpers";
import UserModel from "#models/UserModel";
import {
    AuthLoginRequest,
    AuthSignupRequest,
    type TAuthLoginRequest,
    type TAuthSignupRequest,
} from "#schemas";
import { getFormattedZodErrors, logURL } from "#utils";
import bcrypt from "bcrypt";
import type { CookieOptions, Request, Response } from "express";
import _ from "lodash";
import type { ZodError } from "zod";

const AUTH_COOKIE: CookieOptions = {
    secure: true,
    httpOnly: true,
    maxAge: 3 * 24 * 60 * 60, // expires in 3 days
    sameSite: "strict",
};

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
        userDetails = AuthSignupRequest.parse(userDetails);
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
                "Verification code sent, please check your email and spam folders",
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

    try {
        AuthLoginRequest.parse(userDetails);
    } catch (error) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to login",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Invalid credentials.`,
        });
    }

    try {
        const { email, password } = userDetails;
        const foundUser = await UserModel.findOne({ email });
        if (_.isEmpty(foundUser)) {
            return res.status(EServerResponseCodes.NOT_FOUND).json({
                rescode: EServerResponseRescodes.ERROR,
                message: "No user found with this email id",
                error: `${API_ERROR_MAP[EServerResponseCodes.NOT_FOUND]}: User does not exist`,
            });
        }

        const passwordMatched = await bcrypt.compare(
            password,
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

export default {
    signup,
    login,
};
