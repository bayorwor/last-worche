// Creates the nodemailer transport on first use, so MAIL_MOCK=true never needs a mail server.
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./dotenv.ts";

let transporter: Transporter | undefined;

export function getMailTransporter(): Transporter {
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
  return transporter;
}
