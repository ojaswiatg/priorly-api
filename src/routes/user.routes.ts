import UserController from "#controllers/user.controller";
import { Router } from "express";

// change name
// change password

const router = Router();

router.post("/signup", UserController.signup); // catches an email sent by /auth/signup
router.post("/forgot", UserController.forgotPassword); // catches and email sent by /auth/forgot

export default router;
