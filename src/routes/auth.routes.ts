import { Router } from "express";

import { isEmailAlreadyTaken } from "#middlewares/auth.middle";

import AuthController from "#controllers/auth.controller";

const router = Router();

// middlewares to check - isUserAlreadyLoggedIn, canUserSendAnotherOTP
router.post("/signup", isEmailAlreadyTaken, AuthController.signup); // sends an email caught by /user/signup

export default router;
