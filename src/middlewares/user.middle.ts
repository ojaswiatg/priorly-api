import { EServerResponseCodes, EServerResponseRescodes } from "#constants";
import OTPModel from "#models/OTPModel";
import { ValidateOTPSchema, type TValidateOTPSchema } from "#schemas";
import { getFormattedZodErrors } from "#utils";
import type { NextFunction, Request, Response } from "express";
import _ from "lodash";

export async function validateOTP(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const otpDetails = req.body as TValidateOTPSchema;

    const isValidOTPDetails = ValidateOTPSchema.safeParse(otpDetails);
    if (!isValidOTPDetails.success) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message:
                "OTP and/or email is not valid, please check the user inputs",
            error: `${EServerResponseCodes.BAD_REQUEST}: Invalid OTP or email`,
            errors: getFormattedZodErrors(isValidOTPDetails.error),
        });
    }

    try {
        const userDetails = await OTPModel.findOne({ otp: otpDetails.otp });

        if (_.isEmpty(userDetails) || userDetails.otp !== otpDetails.otp) {
            return res.status(EServerResponseCodes.FORBIDDEN).json({
                rescode: EServerResponseRescodes.ERROR,
                message: "OTP not valid",
                error: `${EServerResponseCodes.FORBIDDEN}: Invalid OTP`,
            });
        }

        req.body.otpData = {
            otp: otpDetails.otp,
            email: userDetails.email,
            newEmail: userDetails.newEmail ?? "",
            name: userDetails.name ?? "",
            password: userDetails.password ?? "",
            operation: userDetails.operation,
        };

        next();
    } catch (error) {
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to verify the OTP",
            error: `${EServerResponseCodes.INTERNAL_SERVER_ERROR}: OTP lookup failed`,
        });
    }
}
