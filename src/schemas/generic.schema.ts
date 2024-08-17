import { z } from "zod";
import { EServerResponseRescodes } from "#constants";

export const APISuccessResponseSchema = z
    .object({
        rescode: z.nativeEnum(EServerResponseRescodes),
        message: z.string(),
        data: z.any(),
    })
    .strict();

export const APIErrorResponseSchema = z
    .object({
        rescode: z.nativeEnum(EServerResponseRescodes),
        message: z.string(),
        error: z.string(),
        errors: z.record(z.string(), z.string()).nullish(),
    })
    .strict();
