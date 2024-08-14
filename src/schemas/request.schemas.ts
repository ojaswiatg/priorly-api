import { z } from "zod";

export const GenericRequestBodySchema = z.object({
    id: z.string(),
});

export type TGenericRequestBodySchema = z.infer<
    typeof GenericRequestBodySchema
>;
