import UserController from "#controllers/user.controller";
import { Router } from "express";

// change name
// change password

const router = Router();

router.post("/signup", UserController.signup);

export default router;
