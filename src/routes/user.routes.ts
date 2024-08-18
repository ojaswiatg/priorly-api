import UserController from "#controllers/user.controller";
import {
    doesUserExist,
    isEmailAlreadyTaken,
    isUserAuthenticated,
} from "#middlewares/auth.middle";
import { validateOTP } from "#middlewares/user.middle";
import { Router } from "express";

// change name
// change password
// delete user

const router = Router();

router.post("/signup", validateOTP, UserController.signup); // catches an email sent by /auth/signup
router.post("/forgot", validateOTP, UserController.forgotPassword); // catches an email sent by /auth/forgot
router.post(
    "/change/email",
    isUserAuthenticated,
    doesUserExist,
    isEmailAlreadyTaken,
    validateOTP,
    UserController.changeEmail,
); // catches an email sent by /auth/change

export default router;
