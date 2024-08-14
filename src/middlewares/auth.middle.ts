import type { Request, Response, NextFunction } from "express";

import { hasUserSession } from "#helpers/auth.helpers";
import { storeUserSession, deleteUserSession } from "#utils/auth.utils";

export async function isUserAuthenticated(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const userID = req.body.id;
    const isAuthenticated = await hasUserSession(userID);
    if (!isAuthenticated) {
        await storeUserSession(userID); // Example only

        return res.status(403).json({
            status: "error",
            message: "User not logged in",
            error: "Not authenticated",
        });
    }

    await deleteUserSession(userID); // Example only
    next();
}

export default {
    isUserAuthenticated,
};
