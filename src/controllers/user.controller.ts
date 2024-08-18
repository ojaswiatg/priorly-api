import {
    API_ERROR_MAP,
    AUTH_COOKIE,
    EOTPOperation,
    EServerResponseCodes,
    EServerResponseRescodes,
} from "#constants";
import { createNewUserSession, sendMail } from "#helpers";
import OTPModel from "#models/OTPModel";
import UserModel from "#models/UserModel";
import {
    UserChangePasswordRequestSchema,
    type TUserChangePasswordRequestSchema,
} from "#schemas";
import { getFormattedZodErrors, logURL } from "#utils";
import type { Request, Response } from "express";
import _ from "lodash";

export async function signup(req: Request, res: Response) {
    logURL(req);
    const otp = req.body.otp as number;

    let userDetails;

    // When no OTP is there
    if (!otp || typeof otp !== "number") {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message:
                "A valid one time password is required to create a new user",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Valid OTP Required`,
        });
    }

    try {
        userDetails = await OTPModel.findOne({ otp });

        // Checking for valid otp conditions and user details
        if (
            _.isEmpty(userDetails) ||
            userDetails.operation !== EOTPOperation.SIGNUP
        ) {
            return res.status(EServerResponseCodes.BAD_REQUEST).json({
                rescode: EServerResponseRescodes.ERROR,
                message: "Please enter a valid OTP",
                error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Invalid OTP`,
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to create user",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Failed to verify user details`,
        });
    }

    try {
        // if everything is fine, we create a new user
        const newUser = {
            name: userDetails.name,
            email: userDetails.email,
            password: userDetails.password,
        };
        const createdUser = await UserModel.create(newUser);

        // send mail synchronously
        const clientURI = String(process.env.CLIENT_URI);
        sendMail({
            emailTo: newUser.email,
            subject: "Welcome to Priorly!",
            templateFileName: "welcome",
            context: {
                loginLink: `${clientURI}/login`,
                wikiLink: `${clientURI}/wiki/eisen-matrix`,
            },
            methodName: "user/signup",
        });

        // Try to create session for user, if sid is there in response cookie, redirect to dashboard, else redirect to login page
        let sid;
        try {
            sid = await createNewUserSession(createdUser.id);
            if (!sid) {
                return res
                    .status(EServerResponseCodes.INTERNAL_SERVER_ERROR)
                    .json({
                        rescode: EServerResponseRescodes.ERROR,
                        message: "Failed to login",
                        error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Session creation failed`,
                    });
            }
        } catch (error) {
            console.error("user/signup: Failed to create user session");
            console.error(error);
        }

        // return response
        return res
            .cookie("sid", sid, AUTH_COOKIE)
            .status(EServerResponseCodes.CREATED)
            .json({
                rescode: EServerResponseRescodes.SUCCESS,
                message: "User registered successfully",
            });
    } catch (error) {
        console.error(error);
        // Since we stored data in the OTP table, we are responsible, hence internal server error
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to create user",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Failed to verify user details`,
        });
    } finally {
        // delete the otp synchronously
        try {
            await OTPModel.deleteOne({ otp });
        } catch (error) {
            console.error("Failed to delete last OTP");
            console.error(error);
        }
    }
}

export async function forgotPassword(req: Request, res: Response) {
    logURL(req);
    const passwordDetails = req.body as TUserChangePasswordRequestSchema;

    // When no OTP is there
    if (!passwordDetails.otp || typeof passwordDetails.otp !== "number") {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message:
                "A valid one time password is required to change forgotten password",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Valid OTP Required`,
        });
    }

    const isValidRequest =
        UserChangePasswordRequestSchema.safeParse(passwordDetails);

    if (!isValidRequest.success) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to change password",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Failed to change password.`,
            errors: getFormattedZodErrors(isValidRequest.error),
        });
    }

    let userDetails;
    try {
        userDetails = await OTPModel.findOne({ otp: passwordDetails.otp });
        if (
            _.isEmpty(userDetails) ||
            userDetails.operation !== EOTPOperation.FORGOT_PASSWORD
        ) {
            return res.status(EServerResponseCodes.BAD_REQUEST).json({
                rescode: EServerResponseRescodes.ERROR,
                message: "Please enter a valid OTP",
                error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Invalid OTP`,
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to change password",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: OTP lookup failed`,
        });
    }

    try {
        const updates = { password: passwordDetails.password };
        const updatedUser = await UserModel.findOneAndUpdate(
            { email: userDetails.email },
            { $set: updates },
            { new: true },
        );
        if (_.isEmpty(updatedUser)) {
            // rare or impractical case, as the email is checked before sending the OTP.
            return res.status(EServerResponseCodes.NOT_FOUND).json({
                rescode: EServerResponseRescodes.ERROR,
                message: "Failed to change password",
                error: `${API_ERROR_MAP[EServerResponseCodes.NOT_FOUND]}: User not found`,
            });
        }

        // send mail synchronously
        sendMail({
            emailTo: userDetails.email,
            subject: "Your Priorly password was changed",
            templateFileName: "password-changed",
            context: {},
            methodName: "user/forgot",
        });

        return res.status(EServerResponseCodes.OK).json({
            rescode: EServerResponseRescodes.SUCCESS,
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to change password",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: OTP lookup failed`,
        });
    } finally {
        // delete the otp synchronously
        if (passwordDetails.otp) {
            try {
                await OTPModel.deleteOne({ otp: passwordDetails.otp });
            } catch (error) {
                console.error("Failed to delete last OTP");
                console.error(error);
            }
        }
    }
}

export default {
    signup,
    forgotPassword,
};
