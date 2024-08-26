import myPassport from "#config/passport";
import {
    API_ERROR_MAP,
    EServerResponseCodes,
    EServerResponseRescodes,
} from "#constants";

import { Router, type Request, type Response } from "express";

import OAuthController from "#controllers/oauth.controller";
import passport from "passport";

const router = Router();

// passport
router.use(myPassport.initialize());
router.use(myPassport.session());

// OAuth
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["email", "profile"],
    }),
);

router.get(
    "/google/callback",
    passport.authenticate("google", {
        successRedirect: "/api/oauth/success",
        failureRedirect: "/api/oauth/failure",
    }),
);

router.get("/success", OAuthController.handleSuccess);

router.get("/failure", (req: Request, res: Response) => {
    return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
        rescode: EServerResponseRescodes.ERROR,
        message: "Failed to login",
        error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Failed to authenticate with Google`,
    });
});

export default router;
