import { TODO_PRIORITY } from "#constants";
import { z } from "zod";

// Requests
const todoTitleSchema = z
    .string()
    .min(1, "Title is required")
    .max(60, "Title cannnot be more than 60 characters");

export const TodoCreateRequestSchema = z.object({
    title: todoTitleSchema,
});

export const TodoUpdateChangesSchema = z.object({
    title: todoTitleSchema.nullish(),
    description: z
        .string()
        .max(300, "Description cannot be more than 300 characters")
        .nullish(),

    priority: z.nativeEnum(TODO_PRIORITY).nullish(),

    isImportant: z.boolean().nullish(),
    isUrgent: z.boolean().nullish(),
    isDone: z.boolean().nullish(),
    isDeleted: z.boolean().nullish(),
});
// Creating validation schema for updates
const isDoneSchema = z
    .object({ isDone: z.boolean() })
    .strict({ message: "Cannot apply any changes when toggling isDone" });
const isDeletedSchema = z
    .object({ isDeleted: z.boolean() })
    .strict({ message: "Cannot apply any changes when toggling isDeleted" });

export const TodoUpdateChangesValdiationSchema = z.union([
    isDoneSchema, // only takes the isDone field
    isDeletedSchema, // only takes the isDeleted field
    TodoUpdateChangesSchema.omit({ isDone: true, isDeleted: true }).strict(), // takes everything other that isDone or isDeleted
]);
export const TodoUpdateRequestSchema = z.object({
    changes: TodoUpdateChangesSchema,
});

const TodoAllFilterSchema = z.object({
    isUrgent: z.boolean().nullish(),
    isImportant: z.boolean().nullish(),
    isDeleted: z.boolean().nullish(),
    isDone: z.boolean().nullish(),
});
export const TodoAllRequestSchema = z.object({
    cursor: z.number().nullish(),
    limit: z.number().nullish(),
    filters: TodoAllFilterSchema.nullish(),
});

export const TodoCountRequestSchema = TodoAllRequestSchema.omit({
    cursor: true,
    limit: true,
});

export type TTodoCreateRequestSchema = z.infer<typeof TodoCreateRequestSchema>;
export type TTodoUpdateChangesSchema = z.infer<typeof TodoUpdateChangesSchema>;
export type TTodoUpdateRequestSchema = z.infer<typeof TodoUpdateRequestSchema>;
export type TTodoAllRequestSchema = z.infer<typeof TodoAllRequestSchema>;
export type TTodoCountRequestSchema = z.infer<typeof TodoCountRequestSchema>;

// Responses
export const TodoDetailsResponseSchema = TodoUpdateChangesSchema.merge(
    z.object({
        id: z.string(),
        completedOn: z.number().nullish(),
        deletedOn: z.number().nullish(),
        updatedOn: z.number().nullish(),
        createdOn: z.number().nullish(),
    }),
);

export const TodoCreateResponseSchema = z.object({
    todo: TodoDetailsResponseSchema,
});

export const TodoAllResponseSchema = z.object({
    todos: z.array(TodoDetailsResponseSchema),
    cursor: z.number(),
});

export const TodoUpdateResponseSchema = TodoDetailsResponseSchema;
export const TodoDeleteResponseSchema = z.object({
    id: z.string(),
});

export type TTodoDetailsResponseSchema = z.infer<
    typeof TodoDetailsResponseSchema
>;
export type TTodoCreateResponseSchema = z.infer<
    typeof TodoCreateResponseSchema
>;
export type TTodoAllResponseSchema = z.infer<typeof TodoAllResponseSchema>;
export type TTodoUpdateResponseSchema = z.infer<
    typeof TodoUpdateResponseSchema
>;
export type TTodoDeleteResponseSchema = z.infer<
    typeof TodoDeleteResponseSchema
>;
