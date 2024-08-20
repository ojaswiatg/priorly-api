import {
    API_ERROR_MAP,
    EServerResponseCodes,
    EServerResponseRescodes,
} from "#constants";
import TodoModel from "#models/TodoModel";
import {
    TodoCountRequestSchema,
    TodoCreateRequestSchema,
    TodoDetailsResponseSchema,
    type TTodoCreateRequestSchema,
} from "#schemas";
import { getFormattedZodErrors, logURL } from "#utils";
import type { Request, Response } from "express";

async function create(req: Request, res: Response) {
    logURL(req);
    const requestData = req.body as TTodoCreateRequestSchema;

    const isValidRequestData = TodoCreateRequestSchema.safeParse(requestData);
    if (!isValidRequestData.success) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to create todo",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Invalid data`,
            errors: getFormattedZodErrors(isValidRequestData.error),
        });
    }

    try {
        const userId = req.query.userId; // guaranteed by isUserAuthenticated middleware

        const createdTodo = await TodoModel.create({
            title: requestData.title,
            user: userId,
        });

        console.log("created todo: ", createdTodo);

        const todo = TodoDetailsResponseSchema.parse(createdTodo); // strips unnecessary keys

        return res.status(EServerResponseCodes.CREATED).json({
            rescode: EServerResponseRescodes.SUCCESS,
            message: "Todo added succesfully",
            data: {
                todo: todo,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to add todo",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Todo creation failed`,
        });
    }
}

async function details(req: Request, res: Response) {
    logURL(req);
    const todo = req.body.todo; // guaranteed by doesTodoExist middleware

    return res.status(EServerResponseCodes.OK).json({
        rescode: EServerResponseRescodes.SUCCESS,
        message: "Fetched todo details successfully",
        data: {
            todo: todo,
        },
    });
}

async function getAllTodos() {}

async function countTodos(req: Request, res: Response) {
    logURL(req);

    const requestData = req.body;

    const isValidRequestData = TodoCountRequestSchema.safeParse(requestData);
    if (!isValidRequestData.success) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to get todo items count",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Invalid data`,
            errors: getFormattedZodErrors(isValidRequestData.error),
        });
    }

    const filters = req.body.filters ?? {};
    if (filters.isDeleted === null || filters.isDeleted === undefined) {
        filters.isDeleted = false;
    }

    try {
        const count = await TodoModel.countDocuments(filters);

        return res.status(EServerResponseCodes.OK).json({
            rescode: EServerResponseRescodes.SUCCESS,
            message: "Fetched todo items count successfully",
            data: {
                count: count,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to get todos",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Counting documents failed`,
        });
    }
}

async function deleteTodo(req: Request, res: Response) {
    logURL(req);
    const todoId = req.query.id as string;

    try {
        await TodoModel.findByIdAndDelete(todoId);

        return res.status(EServerResponseCodes.OK).json({
            rescode: EServerResponseRescodes.SUCCESS,
            message: "Todo deleted successfully",
            data: {
                id: todoId,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Unable to delete the todo",
            error: "Internal server error",
        });
    }
}

export default {
    create,
    details,
    getAllTodos,
    countTodos,
    deleteTodo,
};
