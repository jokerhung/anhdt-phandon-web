import "server-only";
import { z } from "zod";
import { PASSWORD_HASH_PATTERN } from "@/lib/auth/password-hash";

const PLACEHOLDER_PASSWORD_HASH = "scrypt:v1:REPLACE_WITH_SALT:REPLACE_WITH_HASH";

const allowedOriginSchema = z.string().trim().url().refine((value) => {
  try {
    const url = new URL(value);
    return /^https?:\/\/[^/?#\\]+\/?$/i.test(value)
      && !url.username && !url.password && !url.hostname.includes("*")
      && url.pathname === "/" && !url.search && !url.hash;
  } catch {
    return false;
  }
}, "Origin phải là HTTP/HTTPS cụ thể, không chứa wildcard, tài khoản hoặc đường dẫn")
  .transform((value) => new URL(value).origin);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  ADMIN_USERNAME: z.string().trim().min(1, "ADMIN_USERNAME là bắt buộc").max(128),
  ADMIN_PASSWORD_HASH: z
    .string()
    .refine((value) => value !== PLACEHOLDER_PASSWORD_HASH, "ADMIN_PASSWORD_HASH vẫn là giá trị placeholder")
    .regex(PASSWORD_HASH_PATTERN, "ADMIN_PASSWORD_HASH không đúng định dạng scrypt:v1:salt:hash"),
  SESSION_TTL_SECONDS: z.coerce.number().int().min(300).max(86400).default(28800),
  APP_ORIGIN: z.string().url().refine((value) => !value.endsWith("/"), "APP_ORIGIN không được kết thúc bằng dấu /") ,
  ALLOWED_ORIGINS: z.string().default("")
    .transform((value) => value.trim() ? value.split(",") : [])
    .pipe(z.array(allowedOriginSchema))
    .transform((origins) => [...new Set(origins)]),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GOOGLE_DRIVE_FOLDER_ID: z.string().optional(),
  SHEETS_CACHE_TTL_SECONDS: z.coerce.number().int().min(1).max(3600).default(60),
  APP_TIME_ZONE: z.string().default("Asia/Ho_Chi_Minh"),
  TRUST_PROXY: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  DEPLOYMENT_VERSION: z.string().trim().min(1).max(128).optional(),
}).superRefine((env, context) => {
  if (env.NODE_ENV !== "production") return;
  const origin = new URL(env.APP_ORIGIN);
  if (origin.protocol !== "https:") context.addIssue({ code: "custom", path: ["APP_ORIGIN"], message: "Production yêu cầu HTTPS" });
  if (env.ADMIN_USERNAME.toLowerCase() === "admin") context.addIssue({ code: "custom", path: ["ADMIN_USERNAME"], message: "Production không dùng username mặc định" });
  if (!env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) context.addIssue({ code: "custom", path: ["GOOGLE_APPLICATION_CREDENTIALS"], message: "Production yêu cầu Google credential" });
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
