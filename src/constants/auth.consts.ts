import type { CookieOptions } from "express";

export enum EOTPOperation {
    SIGNUP,
    CHANGE_EMAIL,
    FORGOT_PASSWORD,
}

export const AUTH_COOKIE: CookieOptions = {
    secure: false,
    httpOnly: true,
    maxAge: 3 * 24 * 60 * 60, // expires in 3 days
    sameSite: "strict",
};
