import type { Request, Response } from "express";
import _ from "lodash";
import type { ZodError } from "zod";

import { getFormattedZodErrors, logURL } from "#utils";
import {
    API_ERROR_MAP,
    EOTPOperation,
    EServerResponseCodes,
    EServerResponseRescodes,
} from "#constants";

import { AuthSignupRequest, type TAuthSignupRequest } from "#schemas";
import { generateNewOTPForEmail, sendMail } from "#helpers";

async function signup(req: Request, res: Response) {
    logURL(req);
    if (req.cookies.sid) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Please log out to continue",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: User already logged in`,
        });
    }

    let userDetails = req.body;

    if (_.isEmpty(userDetails)) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Unable to create user",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Email and password required.`,
        });
    }

    try {
        userDetails = AuthSignupRequest.parse(userDetails);
    } catch (error) {
        const errors = getFormattedZodErrors(error as ZodError);

        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Unable to create user",
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
            password: userArgs.password,
            operation: EOTPOperation.SIGNUP,
        });

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
            message: "Verification code sent, please check your email",
        });
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Unable to signup",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}`,
        });
    }
}

export default {
    signup,
};
