// Sends email through nodemailer. No feature uses this yet, because there are no user records
// with addresses. See docs/adr/0008-email-with-nodemailer.md.
import { env } from "../config/dotenv.ts";
import { getMailTransporter } from "../config/mailer.ts";

export type Email = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail(email: Email): Promise<void> {
  if (env.MAIL_MOCK) {
    console.log(`[MAIL_MOCK] To: ${email.to} | Subject: ${email.subject}`);
    return;
  }
  await getMailTransporter().sendMail({ from: env.MAIL_FROM, ...email });
}
