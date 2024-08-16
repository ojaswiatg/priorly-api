import { z } from "zod";

export const userNameSchema = z
    .string()
    .max(120, "Name cannot be more that 120 characters long")
    .regex(
        /^[A-Za-z]+([.][A-Za-z]+)*([ ][A-Za-z]+([.][A-Za-z]+)*)*$/,
        "Please enter a valid name. Name can only contain letters, dashes (-) and dots (.).",
    );

export const userEmailSchema = z
    .string({ required_error: "Email is required" })
    .max(100, "Email cannot be more than 100 characters long")
    .regex(/^[\w.]+@([\w-]+\.)+[\w-]{2,4}$/g, "Please enter a valid email");

export const userPasswordSchema = z
    .string({ required_error: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters long." })
    .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter.",
    })
    .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
    })
    .regex(/\d/, {
        message: "Password must contain at least one digit.",
    })
    .regex(/[!@#$%^&*()_\-+={}[\]|;:'",.<>?/~]/, {
        message: "Password must contain at least one special character.",
    });

// Requests
export const UserChangePasswordSchema = z
    .object({
        password: userPasswordSchema,
        confirmPassword: userPasswordSchema,
    })
    .strict()
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export const UserChangeNameSchema = z.object({
    newName: userNameSchema,
});

export type TUserChangePasswordSchema = z.infer<
    typeof UserChangePasswordSchema
>;
export type TUserChangeNameSchema = z.infer<typeof UserChangeNameSchema>;

// Responses
export const UserDetailsResponseSchema = z.object({
    email: z.string(),
    name: z.string(),
});

export const UserChangeNameResponseSchema = UserDetailsResponseSchema;

export type TUserDetailsResponseSchema = z.infer<
    typeof UserDetailsResponseSchema
>;
export type TUserChangeNameResponseSchema = z.infer<
    typeof UserChangeNameResponseSchema
>;
