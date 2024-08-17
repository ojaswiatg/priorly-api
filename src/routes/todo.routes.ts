import TodoController from "#controllers/todo.controllers";
import { Router } from "express";

const router = Router();

router.get("/all", TodoController.getAllTodos);

export default router;
