import {
    API_ERROR_MAP,
    EServerResponseCodes,
    EServerResponseRescodes,
} from "#constants";
import { addSessionToUserSet, generateNewCSRFToken } from "#helpers";
import UserModel from "#models/UserModel";
import type { Request, Response } from "express";
import _ from "lodash";

async function handleSuccess(req: Request, res: Response) {
    if (_.isEmpty(req.user)) {
        res.redirect("/api/oauth/failure");
    }

    const user = req.user as Express.User & {
        emails: { value: string }[];
        displayName: string;
    };

    const email = user.emails[0].value;

    try {
        const foundUser = await UserModel.findOne({ email });
        if (!foundUser) {
            const newUser = await UserModel.create({
                email,
                name: user.displayName,
            });
            await addSessionToUserSet(newUser.id, req.sessionID);
        }
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to login",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: User lookup failed`,
        });
    }

    const csrfToken = generateNewCSRFToken();
    return res.status(EServerResponseCodes.OK).json({
        rescode: EServerResponseRescodes.SUCCESS,
        message: "User logged in successfully",
        data: { csrfToken },
    });
}

export default {
    handleSuccess,
};
