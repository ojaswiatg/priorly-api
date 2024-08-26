import { Router } from "express";

import AuthRouter from "./auth.routes";
import OAuthRouter from "./oauth.routes";
import TodoRouter from "./todo.routes";
import UserRouter from "./user.routes";

import { isUserAuthenticated } from "#middlewares/auth.middle";

const router = Router();

router.use("/oauth", OAuthRouter);
router.use("/auth", AuthRouter);
router.use("/user", UserRouter);
router.use("/todo", isUserAuthenticated, TodoRouter);

export default router;
