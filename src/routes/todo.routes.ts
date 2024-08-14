import { Router } from "express";
import TodoController from "#controllers/todo.controllers";

const router = Router();

router.get("/all", TodoController.getAllTodos);

export default router;
