import type { Request, Response } from "express";
import _ from "lodash";
import type { ZodError } from "zod";

import { getFormattedZodErrors, logURL } from "#utils";
import {
    API_ERROR_MAP,
    EServerResponseCodes,
    EServerResponseRescodes,
} from "#constants";

import { AuthSignupRequest, type TAuthSignupRequest } from "#schemas";
import { generateNewOTPForEmail, sendMail } from "#helpers";

async function signup(req: Request, res: Response) {
    logURL(req);
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
        const otp = generateNewOTPForEmail(userArgs.email, userArgs.password);

        if (!otp) {
            return res.status(EServerResponseCodes.CONFLICT).json({
                rescode: EServerResponseRescodes.ERROR,
                message:
                    "Please wait for some time before requesting a new OTP",
                error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}}: OTP already requested`,
            });
        }

        sendMail({
            emailTo: userArgs.email,
            subject: "Verify your Priorly account",
            templateFileName: "signup",
            context: {
                otp,
            },
        })
            .then(async () => {
                console.info(
                    `auth/signup: Mail sent successfuly to ${userArgs.email}`,
                );
            })
            .catch((error) => {
                console.error(
                    `Auth/Signup: Failed to send mail to ${userArgs.email}`,
                );
                console.error(error);
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
