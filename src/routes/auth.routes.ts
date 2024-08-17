import AuthController from "#controllers/auth.controller";
import { isEmailAlreadyTaken } from "#middlewares/auth.middle";
import { Router } from "express";

const router = Router();

// middlewares to check - isUserAlreadyLoggedIn, canUserSendAnotherOTP
router.post("/signup", isEmailAlreadyTaken, AuthController.signup); // sends an email caught by /user/signup
// login
// logout
// forgot password
// change email

export default router;
