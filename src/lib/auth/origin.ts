import "server-only";
import { getEnv } from "@/lib/server/env";

export function hasValidOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(getEnv().APP_ORIGIN).origin;
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
