import TodoController from "#controllers/todo.controllers";
import { doesTodoExist, isUserOwnerOfTodo } from "#middlewares/todo.middle";
import { Router } from "express";

const router = Router();

router.post("/create", TodoController.create);
router.get(
    "/details",
    doesTodoExist,
    isUserOwnerOfTodo,
    TodoController.details,
);
router.post(
    "/delete",
    doesTodoExist,
    isUserOwnerOfTodo,
    TodoController.deleteTodo,
);
router.post("/count", TodoController.countTodos);

router.post("/all", TodoController.getAllTodos);

export default router;
