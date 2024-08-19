import type { Request, Response } from "express";
import _ from "lodash";

import { EServerResponseRescodes, EServerResponseCodes } from "#constants";

import {
    CreateTodoResponseSchema,
    CreateTodoRequestSchema,
    TodoDetailsResponseSchema,
    AllTodosRequestSchema,
    CountTodosRequestSchema,
} from "#schemas";

import { logURL } from "#utils";

import TodoModel from "#models/TodoModel";

async function create(req: Request, res: Response) {
    logURL(req);
    let reqTodo = req.body;

    if (_.isEmpty(reqTodo)) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Unable to create todo",
            error: "Bad request: Sufficient data not available",
        });
    }

    try {
        reqTodo = CreateTodoRequestSchema.parse(reqTodo);
    } catch (error) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Unable to create todo",
            error: "Bad request: Invalid data",
        });
    }

    try {
        const userID = req.query.userID;
        const createdTodo = await TodoModel.create({
            ...reqTodo,
            user: userID,
        });

        const todo = CreateTodoResponseSchema.parse({ todo: createdTodo }); // strips unnecessary keys

        return res.status(EServerResponseCodes.CREATED).json({
            rescode: EServerResponseRescodes.SUCCESS,
            message: "Todo created succesfully",
            data: {
                todo: todo,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Unable to add todo",
            error: "Internal server error",
        });
    }
}

async function all(req: Request, res: Response) {
    logURL(req);

    try {
        AllTodosRequestSchema.parse(req.body);
    } catch (error) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Unable to fetch todos",
            error: "Bad request: Request body contains invalid fields and/or values",
        });
    }

    const cursor = req.body.cursor ?? 0;
    const limit = req.body.limit ?? 10;
    const filters = req.body.filters ?? {};

    if (filters.isDeleted === null || filters.isDeleted === undefined) {
        filters.isDeleted = false;
    }

    const userID = req.query.userID;
    filters.user = userID;

    try {
        const responseTodos = await TodoModel.find(filters, null, {
            skip: cursor,
            limit,
        }); // pagination logic with skip and limit
        const todos = _.map(responseTodos, (todo) => {
            return TodoDetailsResponseSchema.parse(todo);
        });

        return res.status(EServerResponseCodes.OK).json({
            rescode: EServerResponseRescodes.SUCCESS,
            message: "Todos fetched successfully",
            data: {
                todos: todos,
                cursor: todos.length ? cursor + todos.length : -1,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Unable to fetch todos",
            error: "Internal server error",
        });
    }
}

async function count(req: Request, res: Response) {
    logURL(req);

    try {
        CountTodosRequestSchema.parse(req.body);
    } catch (error) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Unable to fetch todos",
            error: "Bad request: Request body contains invalid fields",
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
            message: "Todos fetched successfully",
            data: {
                count: count,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Unable to fetch todos",
            error: "Internal server error",
        });
    }
}

async function details(req: Request, res: Response) {
    logURL(req);
    const todo = req.body.todo; // already got this from doesTodoExist middleware

    return res.status(EServerResponseCodes.OK).json({
        rescode: EServerResponseRescodes.SUCCESS,
        message: "Fetched todo details successfully",
        data: {
            todo: todo,
        },
    });
}

async function edit(req: Request, res: Response) {
    logURL(req);
    const todoID = req.query.id as string; // taking id in query
    const updates = req.body.updates; // already there from middleware

    try {
        const updatedTodo = await TodoModel.findByIdAndUpdate(
            todoID,
            { $set: updates },
            { new: true }, // returns the updated todo otherwise old todo
        );

        const todo = TodoDetailsResponseSchema.parse(updatedTodo);
        return res.status(EServerResponseCodes.OK).json({
            rescode: EServerResponseRescodes.SUCCESS,
            message: "Todo updated successfully",
            data: {
                todo: todo,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Unable to update the todo details",
            error: "Internal server error",
        });
    }
}

async function remove(req: Request, res: Response) {
    logURL(req);
    const todoID = req.query.id as string;

    try {
        await TodoModel.findByIdAndDelete(todoID);

        return res.status(EServerResponseCodes.OK).json({
            rescode: EServerResponseRescodes.SUCCESS,
            message: "Todo deleted successfully",
            data: {
                id: todoID,
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

const TodoController = {
    create,
    all,
    count,
    details,
    edit,
    remove,
};

export default TodoController;
