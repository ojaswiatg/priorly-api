import {
    API_ERROR_MAP,
    AUTH_COOKIE,
    EOTPOperation,
    EServerResponseCodes,
    EServerResponseRescodes,
} from "#constants";
import { createNewUserSession, sendMail } from "#helpers";
import OTPModel from "#models/OTPModel";
import SessionModel from "#models/SessionModel";
import UserModel from "#models/UserModel";
import {
    UserChangeEmailSchema,
    UserChangeForgotPasswordSchema,
    UserCreateSchema,
} from "#schemas";
import { getFormattedZodErrors, logURL } from "#utils";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import _ from "lodash";

export async function signup(req: Request, res: Response) {
    logURL(req);

    const requestData = {
        // guaranteed by validateOTP middleware
        otp: Number(req.params.otp),
        email: req.params.email,
        name: req.params.name,
        password: req.params.password,
    };

    const isValidRequestData = UserCreateSchema.safeParse(requestData);
    if (!isValidRequestData.success) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to create a new user",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Invalid request`,
            errors: getFormattedZodErrors(isValidRequestData.error),
        });
    }

    const operation = Number(req.params.operation);
    if (operation !== EOTPOperation.SIGNUP) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Please enter a valid OTP",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Invalid OTP`,
        });
    }

    try {
        // if everything is fine, we create a new user
        const newUser = {
            name: requestData.name,
            email: requestData.email,
            password: requestData.password,
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
        // delete the otp
        try {
            await OTPModel.deleteOne({ otp: requestData.otp });
        } catch (error) {
            console.error("Failed to delete last OTP");
            console.error(error);
        }
    }
}

export async function forgotPassword(req: Request, res: Response) {
    logURL(req);

    const passwordDetails = {
        // guranteed by validateOTP middleware
        otp: Number(req.params.otp),
        email: req.params.email,
        password: req.params.password,
        confirmPassword: req.body.confirmPassword,
        operation: Number(req.params.operation),
    };

    const isValidRequest =
        UserChangeForgotPasswordSchema.safeParse(passwordDetails);

    if (!isValidRequest.success) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to change the password",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Invalid password`,
            errors: getFormattedZodErrors(isValidRequest.error),
        });
    }

    try {
        const updates = { password: passwordDetails.password };
        const updatedUser = await UserModel.findOneAndUpdate(
            { email: passwordDetails.email },
            { $set: updates },
            { new: true },
        );
        if (_.isEmpty(updatedUser)) {
            // rare or impractical case, as the email is checked before sending the OTP.
            return res.status(EServerResponseCodes.NOT_FOUND).json({
                rescode: EServerResponseRescodes.ERROR,
                message: "Failed to change the password",
                error: `${API_ERROR_MAP[EServerResponseCodes.NOT_FOUND]}: User not found`,
            });
        }

        // send mail synchronously
        sendMail({
            emailTo: passwordDetails.email,
            subject: "Your Priorly password was changed",
            templateFileName: "password-changed",
            context: {},
            methodName: "user/forgot",
        });

        // delete all user sessions synchronously
        SessionModel.deleteMany({ user: updatedUser.id }).catch((error) => {
            console.error("Failed to delete all user sessions");
            console.error(error);
        });

        return res.status(EServerResponseCodes.OK).json({
            rescode: EServerResponseRescodes.SUCCESS,
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to change the password",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Password update failed`,
        });
    } finally {
        // delete the otp
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

export async function changeEmail(req: Request, res: Response) {
    logURL(req);

    const userDetails = {
        // guaranteed by validateOTP middleware
        otp: Number(req.params.otp),
        email: req.params.email,
        newEmail: req.params.newEmail,
        operation: Number(req.params.operation),
        password: req.body.password,
    };

    const isValidRequestData = UserChangeEmailSchema.safeParse(userDetails);
    if (!isValidRequestData.success) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to change the email id",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Invalid request`,
            errors: getFormattedZodErrors(isValidRequestData.error),
        });
    }

    const foundUser = req.body.user; // guranteed by doesUserExist middleware
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

    try {
        const updates = { email: userDetails.newEmail };
        const updatedUser = await UserModel.findOneAndUpdate(
            { email: userDetails.email },
            { $set: updates },
            { new: true },
        );

        // internal server error because the user should have been guranteed by doesUserExist
        if (_.isEmpty(updatedUser)) {
            return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
                rescode: EServerResponseRescodes.ERROR,
                message: "Failed to update email",
                error: `${EServerResponseCodes.INTERNAL_SERVER_ERROR}: User lookup failed`,
            });
        }

        // send email to old and new synchronously
        sendMail({
            emailTo: userDetails.email,
            subject: "Your Priorly password was changed",
            templateFileName: "email-changed-old",
            context: {
                newEmail: updatedUser.email,
            },
            methodName: "user/changeEmail",
        });

        sendMail({
            emailTo: updatedUser.email,
            subject: "Your Priorly password was changed",
            templateFileName: "email-changed-new",
            context: {},
            methodName: "user/changeEmail",
        });
    } catch (error) {
        console.error(error);
        // Since we stored data in the OTP table, we are responsible, hence internal server error
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to change the email id",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Email update failed`,
        });
    } finally {
        // delete the otp
        if (userDetails.otp) {
            try {
                await OTPModel.deleteOne({ otp: userDetails.otp });
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
    changeEmail,
};
