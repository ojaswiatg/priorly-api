import { Router } from "express";

import TodoRouter from "./todo.routes";
import AuthRouter from "./auth.routes";

// import AuthMiddleware from "#middlewares/auth.middle";

const router = Router();

router.use("/auth", AuthRouter);

// Middleware usage below
// router.use("/todo", AuthMiddleware.isUserAuthenticated, TodoRouter);

// Or don't use the middleware
router.use("/todo", TodoRouter);

export default router;
