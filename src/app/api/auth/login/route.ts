import { NextRequest, NextResponse } from "next/server";
import { authenticate, getAuthRuntime } from "@/lib/auth/auth-service";
import { LOGIN_BODY_LIMIT_BYTES, SESSION_COOKIE } from "@/lib/auth/constants";
import { isJsonContentType, parseLoginBody } from "@/lib/auth/login-payload";
import type { LoginErrorCode } from "@/lib/auth/login-messages";
import { getClientKey, hasValidOrigin } from "@/lib/auth/origin";
import { safeInternalRedirect } from "@/lib/auth/redirect";
import { getEnv } from "@/lib/server/env";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "private, no-store" };

function jsonError(message: string, status: number, extraHeaders: Record<string, string> = {}): NextResponse {
  return NextResponse.json({ message }, { status, headers: { ...noStore, ...extraHeaders } });
}

/**
 * Form gốc của trình duyệt (JS chưa hydrate, chunk cũ sau khi deploy, JS bị chặn) không đọc được JSON trả về,
 * nên mọi phản hồi cho luồng này là redirect về trang đăng nhập kèm mã lỗi.
 */
function redirectToLogin(code: LoginErrorCode, next: string | null): NextResponse {
  const search = new URLSearchParams({ error: code });
  if (next) search.set("next", next);
  return new NextResponse(null, { status: 303, headers: { ...noStore, Location: `/login?${search.toString()}` } });
}

function redirectAfterLogin(next: string | null, session: { token: string; expiresAt: Date }): NextResponse {
  const response = new NextResponse(null, {
    status: 303,
    headers: { ...noStore, Location: safeInternalRedirect(next) },
  });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: session.token,
    httpOnly: true,
    sameSite: "lax",
    secure: getEnv().NODE_ENV === "production",
    path: "/",
    expires: session.expiresAt,
  });
  return response;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const contentType = request.headers.get("content-type");
  const isJson = isJsonContentType(contentType);
  const queryNext = request.nextUrl.searchParams.get("next");

  if (!hasValidOrigin(request)) {
    return isJson
      ? jsonError("Yêu cầu không hợp lệ.", 403)
      : redirectToLogin("origin", queryNext);
  }

  const tooLargeMessage = "Dữ liệu đăng nhập quá lớn.";
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > LOGIN_BODY_LIMIT_BYTES) {
    return isJson ? jsonError(tooLargeMessage, 413) : redirectToLogin("too-large", queryNext);
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > LOGIN_BODY_LIMIT_BYTES) {
    return isJson ? jsonError(tooLargeMessage, 413) : redirectToLogin("too-large", queryNext);
  }

  const body = parseLoginBody(raw, contentType);
  if (!body.ok) {
    return isJson
      ? jsonError("Dữ liệu đăng nhập không hợp lệ.", body.reason === "malformed" ? 400 : 401)
      : redirectToLogin("invalid", queryNext);
  }

  const next = body.payload.next ?? queryNext;

  try {
    const clientKey = getClientKey(request);
    const auth = await getAuthRuntime();
    const allowance = auth.limiter.check(clientKey);
    if (!allowance.allowed) {
      const retryAfter = String(allowance.retryAfterSeconds ?? 60);
      return isJson
        ? jsonError("Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.", 429, { "Retry-After": retryAfter })
        : redirectToLogin("rate-limit", next);
    }

    if (!(await authenticate(body.payload.username, body.payload.password))) {
      auth.limiter.recordFailure(clientKey);
      return isJson ? jsonError("Thông tin đăng nhập không đúng.", 401) : redirectToLogin("credentials", next);
    }

    auth.limiter.reset(clientKey);
    const session = auth.sessions.create();
    if (!isJson) return redirectAfterLogin(next, session);

    const response = NextResponse.json(
      { ok: true, redirectTo: safeInternalRedirect(next) },
      { headers: noStore },
    );
    response.cookies.set({
      name: SESSION_COOKIE,
      value: session.token,
      httpOnly: true,
      sameSite: "lax",
      secure: getEnv().NODE_ENV === "production",
      path: "/",
      expires: session.expiresAt,
    });
    return response;
  } catch (error) {
    console.error("[auth/login] Không xử lý được yêu cầu đăng nhập", error);
    return isJson
      ? jsonError("Máy chủ gặp lỗi xử lý đăng nhập. Vui lòng liên hệ quản trị viên kiểm tra cấu hình và nhật ký máy chủ.", 500)
      : redirectToLogin("server", next);
  }
}
