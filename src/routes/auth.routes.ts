import { Router } from "express";

import AuthController from "#controllers/auth.controller";

import {
    isAuthenticated,
    isUserAlreadyLoggedIn,
} from "#middlewares/auth.middle";
import {
    canSendAnotherEmail,
    isEmailAlreadyTaken,
} from "#middlewares/user.middle";

const router = Router();

router.post(
    "/signup",
    isUserAlreadyLoggedIn,
    isEmailAlreadyTaken,
    canSendAnotherEmail,
    AuthController.signup,
); // sends an email caught by /user/signup

router.post("/login", AuthController.login);

router.post("/forgot", canSendAnotherEmail, AuthController.forgotPassword); // sends email caught by auth/setpass
router.put("/setpass", AuthController.setPassword); // catches email sent by auth/forgot

router.get("/logout", isAuthenticated, AuthController.logout);
router.get("/logout/all", isAuthenticated, AuthController.logoutAll);

export default router;
