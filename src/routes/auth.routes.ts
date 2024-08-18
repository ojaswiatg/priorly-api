import AuthController from "#controllers/auth.controller";
import {
    isEmailAlreadyTaken,
    isUserAlreadyLoggedIn,
    isUserAuthenticated,
} from "#middlewares/auth.middle";
import { Router } from "express";

const router = Router();

// middlewares to check - isUserAlreadyLoggedIn, canUserSendAnotherOTP
router.post(
    "/signup",
    isUserAlreadyLoggedIn,
    isEmailAlreadyTaken,
    AuthController.signup,
); // sends an email caught by /user/signup

router.post("/login", isUserAlreadyLoggedIn, AuthController.login);

router.get("/logout", isUserAuthenticated, AuthController.logout);
router.get(
    "/logout/all",
    isUserAuthenticated,
    AuthController.logoutAllSessions,
);

// forgot password
// change email

export default router;
