import { EOTPOperation } from "#constants";
import { z } from "zod";

export const userNameSchema = z
    .string()
    .min(3, "Name should at lease contain 3 valid characters")
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
export const UserCreateSchema = z.object({
    otp: z.number(),
    email: userEmailSchema,
    name: userNameSchema,
});

export const ValidateOTPSchema = z.object({
    otp: z.number(),
    email: userEmailSchema,
    operation: z.nativeEnum(EOTPOperation),
});

export const UserChangeForgotPasswordSchema = z
    .object({
        otp: z.number(),
        email: userEmailSchema,
        password: userPasswordSchema,
        confirmPassword: userPasswordSchema,
        operation: z.nativeEnum(EOTPOperation),
    })

    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export const UserChangeEmailSchema = z.object({
    otp: z.number(),
    email: userEmailSchema,
    newEmail: userEmailSchema,
    password: z.string(),
});

export type TUserCreateSchema = z.infer<typeof UserCreateSchema>;
export type TUserChangeForgotPasswordSchema = z.infer<
    typeof UserChangeForgotPasswordSchema
>;
export type TValidateOTPSchema = z.infer<typeof ValidateOTPSchema>;

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
