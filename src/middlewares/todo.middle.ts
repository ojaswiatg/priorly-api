import {
    API_ERROR_MAP,
    EServerResponseCodes,
    EServerResponseRescodes,
} from "#constants";
import TodoModel from "#models/TodoModel";
import {
    TodoDetailsResponseSchema,
    type TTodoDetailsResponseSchema,
} from "#schemas";
import type { NextFunction, Request, Response } from "express";
import _ from "lodash";
import { isValidObjectId } from "mongoose";

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

        const todo = TodoDetailsResponseSchema.parse(foundTodo);
        req.body.todo = todo;
        req.params.todoId = todoId;
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
    const userId = req.params.userId as string; // guaranteed by isUserAuthenticated middleware

    const todo = req.body.todo as TTodoDetailsResponseSchema; // guaranteed by doesTodoExist middleware

    if (todo.user !== userId) {
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
    const todoID = req.query.id;
    const changes = req.body?.changes as TEditTodoChangesSchema; // taking id in body, will require some extra work of processing the request.

    if (_.isEmpty(changes)) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Unable to update todos",
            error: "Bad request: No changes sent to update",
        });
    }

    try {
        EditTodoChangesSchema.parse(changes);
    } catch (error) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Unable to update the todo",
            error: "Bad request: Changes contain invalid fields and/or values",
        });
    }

    if (
        (changes.isDone ||
            changes.isDone === false ||
            changes.isDeleted ||
            changes.isDeleted === false) &&
        _.values(changes).length > 1
    ) {
        return res.status(EServerResponseCodes.BAD_REQUEST).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Unable to update todos",
            error: "Bad request: Can not apply more changes when toggling deleted or done",
        });
    }

    const updates = _.cloneDeep(changes) as TEditTodoChangesSchema & {
        completedOn: number | null;
        deletedOn: number | null;
    };

    if (changes.isDone) {
        updates.reminder = null;
        updates.deadline = null;
        updates.completedOn = getCurrentTimeStamp();
    } else {
        updates.completedOn = null;
    }

    if (changes.isDeleted) {
        updates.deletedOn = getCurrentTimeStamp();
    } else {
        updates.deletedOn = null;
    }

    try {
        // if todo is deleted then forbid other changes other than recovery
        const todo = await TodoModel.findById(todoID);

        if (
            todo?.isDeleted &&
            changes.isDeleted &&
            _.values(changes).length > 1
        ) {
            return res.status(EServerResponseCodes.BAD_REQUEST).json({
                rescode: EServerResponseRescodes.ERROR,
                message: "Unable to update todos",
                error: "Bad request: Can not apply any change on deleted todo",
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(EServerResponseCodes.INTERNAL_SERVER_ERROR).json({
            rescode: EServerResponseRescodes.ERROR,
            message: "Unable to update the todo details",
            error: "Internal server error",
        });
    }

    req.body.updates = updates;
    next();
}
