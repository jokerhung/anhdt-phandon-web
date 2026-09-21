import "server-only";
import { z } from "zod";
import { PASSWORD_HASH_PATTERN } from "@/lib/auth/password-hash";

const PLACEHOLDER_PASSWORD_HASH = "scrypt:v1:REPLACE_WITH_SALT:REPLACE_WITH_HASH";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  ADMIN_USERNAME: z.string().trim().min(1, "ADMIN_USERNAME là bắt buộc").max(128),
  ADMIN_PASSWORD_HASH: z
    .string()
    .refine((value) => value !== PLACEHOLDER_PASSWORD_HASH, "ADMIN_PASSWORD_HASH vẫn là giá trị placeholder")
    .regex(PASSWORD_HASH_PATTERN, "ADMIN_PASSWORD_HASH không đúng định dạng scrypt:v1:salt:hash"),
  SESSION_TTL_SECONDS: z.coerce.number().int().min(300).max(86400).default(28800),
  APP_ORIGIN: z.string().url().refine((value) => !value.endsWith("/"), "APP_ORIGIN không được kết thúc bằng dấu /") ,
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GOOGLE_DRIVE_FOLDER_ID: z.string().optional(),
  SHEETS_CACHE_TTL_SECONDS: z.coerce.number().int().min(1).max(3600).default(60),
  APP_TIME_ZONE: z.string().default("Asia/Ho_Chi_Minh"),
  TRUST_PROXY: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | undefined;

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".") || "environment");
    throw new Error(`Cấu hình máy chủ không hợp lệ: ${[...new Set(fields)].join(", ")}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function resetEnvForTests(): void {
  cachedEnv = undefined;
}
