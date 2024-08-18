import { EServerResponseRescodes } from "#constants";
import { z } from "zod";

export const APISuccessResponseSchema = z.object({
    rescode: z.nativeEnum(EServerResponseRescodes),
    message: z.string(),
    data: z.any(),
});

export const APIErrorResponseSchema = z.object({
    rescode: z.nativeEnum(EServerResponseRescodes),
    message: z.string(),
    error: z.string(),
    errors: z.record(z.string(), z.string()).nullish(),
});
