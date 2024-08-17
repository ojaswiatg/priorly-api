import { Router } from "express";

import AuthRouter from "./auth.routes";
import TodoRouter from "./todo.routes";
import UserRouter from "./user.routes";

// import AuthMiddleware from "#middlewares/auth.middle";

const router = Router();

router.use("/auth", AuthRouter);
router.use("/user", UserRouter);

// Middleware usage below
// router.use("/todo", AuthMiddleware.isUserAuthenticated, TodoRouter);

// Or don't use the middleware
router.use("/todo", TodoRouter);

export default router;
