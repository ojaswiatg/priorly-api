import type { Request, Response } from "express";

async function getAllTodos(req: Request, res: Response) {
    res.status(200).json({
        status: "success",
        message: "Todos fetched successfully",
        data: {
            todos: [
                {
                    id: "some todo id",
                    title: "Buy groceries",
                    description: "Get break, butter, milk, and cookies",
                    isDone: false,
                },
            ],
        },
    });
}

export default {
    getAllTodos,
};
