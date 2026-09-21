import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createPasswordVerifier, type PasswordVerifier } from "@/lib/auth/password";
import { LoginRateLimiter } from "@/lib/auth/rate-limit";
import { SessionStore } from "@/lib/auth/session-store";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { getEnv } from "@/lib/server/env";

interface AuthRuntime {
  username: string;
  verifier: PasswordVerifier;
  sessions: SessionStore;
  limiter: LoginRateLimiter;
}

declare global {
  var __phanDonAuthRuntime: Promise<AuthRuntime> | undefined;
}

async function initializeAuth(): Promise<AuthRuntime> {
  const env = getEnv();
  return {
    username: env.ADMIN_USERNAME,
    verifier: createPasswordVerifier(env.ADMIN_PASSWORD_HASH),
    sessions: new SessionStore({ ttlSeconds: env.SESSION_TTL_SECONDS }),
    limiter: new LoginRateLimiter(),
  };
}

export function getAuthRuntime(): Promise<AuthRuntime> {
  globalThis.__phanDonAuthRuntime ??= initializeAuth();
  return globalThis.__phanDonAuthRuntime;
}

export async function authenticate(username: string, password: string): Promise<boolean> {
  const auth = await getAuthRuntime();
  const passwordMatches = await auth.verifier.verify(password);
  return username === auth.username && passwordMatches;
}

export async function hasAdminSession(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return (await getAuthRuntime()).sessions.validate(token);
}

export async function requireAdminPage(nextPath = "/"): Promise<void> {
  if (!(await hasAdminSession())) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
}

export async function requireAdminApi(): Promise<Response | null> {
  if (await hasAdminSession()) return null;
  return unauthorizedResponse();
}

export function unauthorizedResponse(): Response {
  return Response.json(
    { error: "UNAUTHORIZED", message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." },
    { status: 401, headers: { "Cache-Control": "private, no-store" } },
  );
}
