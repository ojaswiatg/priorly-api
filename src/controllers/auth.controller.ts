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

        const verificationLinkPayload = await signData({
            userDetails: {
                email: userArgs.email,
                password: userArgs.password,
                name: userArgs.name ?? "",
            },
        });

        const serverURI = getServerURI();
        sendMail({
            emailTo: userDetails.email,
            subject: "Verify your Priorly account",
            templateFileName: "signup",
            context: {
                verificationLink: `${serverURI}/api/user/signup?details=${verificationLinkPayload}`,
            },
        })
            .then(async () => {
                console.info(
                    `Auth/Signup: Mail sent successfuly to ${userDetails.email}`,
                );
                await storetMailTimestamp(userArgs.email);
            })
            .catch((error) => {
                console.error(
                    `Auth/Signup: Failed to send mail to ${userDetails.email}`,
                );
                console.error(error);
            });

        return res.status(EServerResponseCodes.OK).json({
            rescode: EServerResponseRescodes.SUCCESS,
            message: "Verification mail sent, please check your email",
        });
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Unable to signup",
            error: "Internal server error",
        });
    }
}

export default {
    signup,
};
