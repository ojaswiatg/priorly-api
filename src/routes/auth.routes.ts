import { Router } from "express";

import AuthController from "#controllers/auth.controller";

const router = Router();

// middlewares to check - isUserAlreadyLoggedIn, isEmailAlreadyTaken, canUserSendAnotherOTP
router.post("/signup", AuthController.signup); // sends an email caught by /user/signup

export default router;
