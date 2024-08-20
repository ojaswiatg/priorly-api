import {
    API_ERROR_MAP,
    EServerResponseCodes,
    EServerResponseRescodes,
} from "#constants";
import TodoModel from "#models/TodoModel";
import {
    TodoDetailsResponseSchema,
    TodoUpdateChangesSchema,
    type TTodoDetailsResponseSchema,
    type TTodoUpdateChangesSchema,
} from "#schemas";
import { getCurrentTimestamp, getFormattedZodErrors } from "#utils";
import type { NextFunction, Request, Response } from "express";
import _ from "lodash";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

export async function doesTodoExist(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const todoId = req.query.id as string;

    if (!todoId || !isValidObjectId(todoId)) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to fetch todo details",
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Invalid id`,
        });
    }

    try {
        const foundTodo = await TodoModel.findById(todoId);

        if (_.isEmpty(foundTodo)) {
            return res.status(EServerResponseCodes.NOT_FOUND).json({
                rescode: EServerResponseRescodes.ERROR,
                message: "Failed to fetch todo details",
                error: `${API_ERROR_MAP[EServerResponseCodes.NOT_FOUND]}: Todo does not exist`,
            });
        }

        const todo = TodoDetailsResponseSchema.merge(
            z.object({ userId: z.string() }),
        ).parse(foundTodo);

        req.body.todo = todo;
        req.query.todoId = todoId;

        next();
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Failed to get the todo details",
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Todo lookup failed`,
        });
    }
}

export async function isUserOwnerOfTodo(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const userId = req.query.userId as string; // guaranteed by isUserAuthenticated middleware
    const todo = req.body.todo as TTodoDetailsResponseSchema & {
        userId: string;
    }; // guaranteed by doesTodoExist middleware

    if (todo.userId !== userId) {
        return res.status(EServerResponseCodes.UNAUTHORIZED).json({
            rescode: EServerResponseRescodes.ERROR,
            error: "You don't have permission to read or update this todo item",
            message: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Not authorised`,
        });
    }
    next();
}

export async function parseTodoUpdates(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const changes = req.body?.changes; // taking id in body, will require some extra work of processing the request.

    const failedMessage = "Failed to update the todo item";

    if (_.isEmpty(changes)) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: failedMessage,
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: No change to udpate`,
        });
    }

    const isValidRequestData = TodoUpdateChangesSchema.safeParse(changes);
    if (!isValidRequestData.success) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: failedMessage,
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Invalid request`,
            errors: getFormattedZodErrors(isValidRequestData.error),
        });
    }

    // if todo has done/deleted changes, then don't allow any other changes
    if (
        (changes.isDone ||
            changes.isDone === false ||
            changes.isDeleted ||
            changes.isDeleted === false) &&
        _.values(changes).length > 1
    ) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: failedMessage,
            error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Cannot apply more changes when toggling deleted or done`,
        });
    }

    // clone the updates
    const updates = _.cloneDeep(changes) as TTodoUpdateChangesSchema & {
        completedOn: number | null;
        deletedOn: number | null;
    };

    if (changes.isDone) {
        // if the todo has been marked as done then we set it to the current timestamp,
        updates.completedOn = getCurrentTimestamp();
    } else if (changes.isDone === false) {
        updates.completedOn = null;
    }

    if (changes.isDeleted) {
        updates.deletedOn = getCurrentTimestamp();
    } else if (changes.isDeleted === false) {
        updates.deletedOn = null;
    }

    try {
        const todo = req.body.todo; // guaranteed by doesTodoExistMiddleware

        // if todo is deleted then forbid other changes other than recovery
        if (
            todo.isDeleted &&
            (changes.isDeleted || _.values(changes).length > 1)
        ) {
            return res.status(EServerResponseCodes.BAD_REQUEST).json({
                rescode: EServerResponseRescodes.ERROR,
                message: failedMessage,
                error: `${API_ERROR_MAP[EServerResponseCodes.BAD_REQUEST]}: Cannot apply any changes to a deleted item`,
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: failedMessage,
            error: `${API_ERROR_MAP[EServerResponseCodes.INTERNAL_SERVER_ERROR]}: Todo lookup failed`,
        });
    }

    req.body.updates = updates;
    req.query.failedMessage = failedMessage;

    next();
}
