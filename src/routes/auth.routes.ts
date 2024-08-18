import AuthController from "#controllers/auth.controller";
import {
    doesUserExist,
    isEmailAlreadyTaken,
    isUserAlreadyLoggedIn,
    isUserAuthenticated,
} from "#middlewares/auth.middle";
import { Router } from "express";

const router = Router();

router.post(
    "/signup",
    isUserAlreadyLoggedIn,
    isEmailAlreadyTaken,
    AuthController.signup,
); // sends an email caught by /user/signup

router.post(
    "/login",
    doesUserExist,
    isUserAlreadyLoggedIn,
    AuthController.login,
);

router.get("/logout", isUserAuthenticated, AuthController.logout);
router.get(
    "/logout/all",
    isUserAuthenticated,
    AuthController.logoutAllSessions,
);

router.post("/forgot", doesUserExist, AuthController.forgotPassword); // sends an email caught by /user/forgot
router.post(
    "/change",
    isUserAuthenticated,
    doesUserExist,
    isEmailAlreadyTaken,
    AuthController.changeEmail,
); // sends an email caught by /user/change/email

export default router;
