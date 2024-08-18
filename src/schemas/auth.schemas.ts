import { z } from "zod";
import {
    UserDetailsResponseSchema,
    userEmailSchema,
    userNameSchema,
    userPasswordSchema,
} from "./user.schemas";

// Requests
export const AuthSignupRequest = z
    .object({
        name: userNameSchema,
        email: userEmailSchema,
        password: userPasswordSchema,
        confirmPassword: userPasswordSchema,
    })

    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export const AuthLoginRequest = z.object({
    email: z.string(),
    password: z.string(),
});

export const AuthChangeEmailRequestSchema = z.object({
    newEmail: userEmailSchema,
});

export type TAuthSignupRequest = z.infer<typeof AuthSignupRequest>;
export type TAuthLoginRequest = z.infer<typeof AuthLoginRequest>;
export type TAuthChangeEmailRequestSchema = z.infer<
    typeof AuthChangeEmailRequestSchema
>;

// Responses
export const AuthChangeEmailResponseSchmea = UserDetailsResponseSchema;
export type TAuthChangeEmailResponseSchmea = z.infer<
    typeof AuthChangeEmailResponseSchmea
>;
