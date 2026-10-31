import { z } from "zod";
import { MAX_PASSWORD_LENGTH, MAX_USERNAME_LENGTH } from "@/lib/auth/constants";

export const loginSchema = z.object({
  username: z.string().min(1).max(MAX_USERNAME_LENGTH),
  password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
  next: z.string().max(2048).optional(),
});

export type LoginPayload = z.infer<typeof loginSchema>;

export type LoginBodyResult =
  | { ok: true; payload: LoginPayload }
  | { ok: false; reason: "malformed" | "invalid" };

export function isJsonContentType(contentType: string | null): boolean {
  const mediaType = (contentType ?? "").split(";")[0].trim().toLowerCase();
  return mediaType === "application/json" || mediaType.endsWith("+json");
}

/**
 * Đọc body đăng nhập từ hai nguồn:
 * - JSON: do LoginForm gửi bằng fetch.
 * - application/x-www-form-urlencoded: do trình duyệt submit form gốc khi JS chưa/hỏng hydrate.
 */
export function parseLoginBody(raw: string, contentType: string | null): LoginBodyResult {
  const mediaType = (contentType ?? "").split(";")[0].trim().toLowerCase();

  let data: Record<string, unknown>;
  if (isJsonContentType(contentType)) {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      return { ok: false, reason: "malformed" };
    }
    if (!parsedJson || typeof parsedJson !== "object" || Array.isArray(parsedJson)) {
      return { ok: false, reason: "malformed" };
    }
    data = parsedJson as Record<string, unknown>;
  } else if (mediaType === "application/x-www-form-urlencoded") {
    const params = new URLSearchParams(raw);
    data = {
      username: params.get("username") ?? "",
      password: params.get("password") ?? "",
      next: params.get("next") ?? undefined,
    };
  } else {
    return { ok: false, reason: "malformed" };
  }

  const parsed = loginSchema.safeParse(data);
  return parsed.success ? { ok: true, payload: parsed.data } : { ok: false, reason: "invalid" };
}
