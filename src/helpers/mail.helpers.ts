import path from "node:path";
import { fileURLToPath } from "node:url";

import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import type { NodemailerExpressHandlebarsOptions } from "nodemailer-express-handlebars";

import { generateNewOTPForEmail } from "#helpers";

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

interface ISendMailParams {
    emailTo: string;
    subject: string;
    templateFileName: string;
    context: Record<string, unknown>;
}

interface ISendOTPParams extends Omit<ISendMailParams, "context"> {}

const APP_EMAIL = String(process.env.SMTP_MAIL);

const hbsOptions: NodemailerExpressHandlebarsOptions = {
    viewEngine: {
        defaultLayout: false as unknown as string,
    },
    viewPath: path.join(__dirname, "../assets/emails"),
};

const mailTransporter = nodemailer
    .createTransport({
        service: "gmail",
        auth: {
            user: String(process.env.SMTP_MAIL),
            pass: String(process.env.SMTP_PASS),
        },
    })
    .use("compile", hbs(hbsOptions));

export async function sendMail(params: ISendMailParams) {
    // non auth operations - create user, forgot password, after change password
    // messages - welcome (after user creation), deletion (after account deletion)

    const mailOptions = {
        from: APP_EMAIL,
        to: params.emailTo,
        subject: params.subject,
        template: params.templateFileName,
        context: params.context,
    };

    await mailTransporter.sendMail(mailOptions);
}

export async function sendOTP(params: ISendOTPParams) {
    // auth operations - change email, after change passowrd
    // Validate if user can send otp separately so that we can work synchronously here - otpStore.canSendOTP

    const otp = await generateNewOTPForEmail(params.emailTo);

    const mailOptions = {
        from: APP_EMAIL,
        to: params.emailTo,
        subject: params.subject,
        template: params.templateFileName,
        context: { otp },
    };

    await mailTransporter.sendMail(mailOptions);
}
