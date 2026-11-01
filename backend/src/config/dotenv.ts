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
  // Web addresses allowed to call this API from a browser or the mobile app. The Vite dev server needs no entry.
  CORS_ORIGINS: z
    .string()
    .default("capacitor://localhost,http://localhost")
    .transform((origins) => origins.split(",").map((origin) => origin.trim())),
  // Signs session tokens. The default is for local development only, like the demo sign-in itself.
  JWT_SECRET: z.string().min(16).default("local-demo-secret-not-for-production"),
  TEST_ACCOUNTS_ENABLED: booleanFlag("true"),
  // Who may send hours from their own time tracking, as supplierId:key pairs (ADR-0017). These are demo keys.
  SUPPLIER_API_KEYS: z
    .string()
    .default("supplier-1:demo-consultis-key,supplier-2:demo-nordlicht-key")
    .transform((pairs) =>
      pairs
        .split(",")
        .map((pair) => pair.trim().split(":"))
        .filter((pair): pair is [string, string] => pair.length === 2 && pair[0] !== "" && pair[1] !== "")
        .map(([supplierId, key]) => ({ supplierId, key })),
    ),
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
