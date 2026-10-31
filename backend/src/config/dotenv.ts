// Loads .env and validates it once, so the rest of the code can trust `env`.
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const booleanFlag = (defaultValue: "true" | "false") =>
  z
    .enum(["true", "false"])
    .default(defaultValue)
    .transform((value) => value === "true");

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1).default("mysql://lastworche:lastworche@localhost:3306/lastworche"),
  // Signs session tokens. The default is for local development only, like the demo sign-in itself.
  JWT_SECRET: z.string().min(16).default("local-demo-secret-not-for-production"),
  AI_MOCK: booleanFlag("true"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().min(1).default("openrouter/auto"),
  MAIL_MOCK: booleanFlag("true"),
  MAIL_FROM: z.string().min(1).default("lastWorche <no-reply@lastworche.example>"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
});

export const env = envSchema.parse(process.env);
