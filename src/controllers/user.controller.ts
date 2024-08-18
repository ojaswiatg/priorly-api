import {
    API_ERROR_MAP,
    EOTPOperation,
    EServerResponseCodes,
    EServerResponseRescodes,
} from "#constants";
import { createNewUserSession, sendMail } from "#helpers";
import OTPModel from "#models/OTPModel";
import UserModel from "#models/UserModel";
import { UserCreateSchema } from "#schemas";
import { logURL } from "#utils";
import type { CookieOptions, Request, Response } from "express";
import _ from "lodash";

const AUTH_COOKIE: CookieOptions = {
    secure: true,
    httpOnly: true,
    maxAge: 3 * 24 * 60 * 60, // expires in 3 days
    sameSite: "strict",
};

export async function signup(req: Request, res: Response) {
    logURL(req);
    const otp = req.body.otp as number;
    const email = req.body.email as string;

    let userDetails;

    // When no OTP or email (store in client Store) is there
    if (!otp || !email) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "One time password is required to create a new user",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: OTP Required`,
        });
    }

    try {
        userDetails = await OTPModel.findOne({ otp });

        // Checking for valid otp conditions and user details
        if (
            _.isEmpty(userDetails) ||
            email !== userDetails.email ||
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
        // Checking for valid user details by parsing through zod schema
        const parsedUserDetails = UserCreateSchema.parse(userDetails);

        // if everything is fine, we create a new user
        const newUser = {
            name: parsedUserDetails.name,
            email: parsedUserDetails.email,
            password: parsedUserDetails.password,
        };
        const createdUser = await UserModel.create(newUser);

        // delete the otp synchronously
        OTPModel.deleteOne({ otp }).catch((error) => {
            console.error("Failed to delete last OTP");
            console.error(error);
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

        // send mail synchronously
        const clientURI = String(process.env.CLIENT_URI);
        sendMail({
            emailTo: userDetails?.email ?? "",
            subject: "Welcome to Priorly!",
            templateFileName: "welcome",
            context: {
                loginLink: `${clientURI}/login`,
                wikiLink: `${clientURI}/wiki/eisen-matrix`,
            },
            methodName: "user/signup",
        });

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
    }
}

export default {
    signup,
};
