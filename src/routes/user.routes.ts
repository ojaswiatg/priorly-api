import UserController from "#controllers/user.controller";
import {
    doesPasswordMatch,
    isUserAuthenticated,
} from "#middlewares/auth.middle";
import { validateOTP } from "#middlewares/user.middle";
import { Router } from "express";

// change name

const router = Router();

router.post("/signup", validateOTP, UserController.signup); // catches an email sent by /auth/signup
router.post("/forgot", validateOTP, UserController.forgotPassword); // catches an email sent by /auth/forgot

router.post(
    "/change/email",
    isUserAuthenticated,
    validateOTP,
    UserController.changeEmail,
); // catches an email sent by /auth/change

router.post(
    "/change/password",
    isUserAuthenticated,
    doesPasswordMatch,
    UserController.changePassword,
);

router.post("/change/name", isUserAuthenticated, UserController.changeName);

export default router;
