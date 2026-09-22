import "server-only";
import { getEnv } from "@/lib/server/env";

export function hasValidOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    // Browser Origin headers are serialized origins, never URLs with paths or credentials.
    if (parsed.origin !== origin || !["http:", "https:"].includes(parsed.protocol)) return false;
    const env = getEnv();
    return origin === new URL(env.APP_ORIGIN).origin || env.ALLOWED_ORIGINS.includes(origin);
  } catch {
    return false;
  }
}

export function getClientKey(request: Request): string {
  const env = getEnv();
  if (env.TRUST_PROXY) {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwarded) return forwarded;
  }
  return "direct-client";
}
