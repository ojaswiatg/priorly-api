import { z } from "zod";

export const GenericSuccessResponseSchema = z.object({
    status: z.string(),
    message: z.string(),
    data: z.any(),
});

export type TGenericSuccessResponseSchema = z.infer<
    typeof GenericSuccessResponseSchema
>;

export const ErrorResponseSchema = z.object({
    status: z.string(),
    message: z.string(),
    error: z.string(),
});

export type TErrorResponseSchema = z.infer<typeof ErrorResponseSchema>;
