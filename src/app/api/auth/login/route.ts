import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, getAuthRuntime } from "@/lib/auth/auth-service";
import { LOGIN_BODY_LIMIT_BYTES, MAX_PASSWORD_LENGTH, MAX_USERNAME_LENGTH, SESSION_COOKIE } from "@/lib/auth/constants";
import { getClientKey, hasValidOrigin } from "@/lib/auth/origin";
import { safeInternalRedirect } from "@/lib/auth/redirect";
import { getEnv } from "@/lib/server/env";

export const runtime = "nodejs";

const loginSchema = z.object({
  username: z.string().min(1).max(MAX_USERNAME_LENGTH),
  password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
  next: z.string().max(2048).optional(),
});

const noStore = { "Cache-Control": "private, no-store" };

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!hasValidOrigin(request)) {
    return NextResponse.json({ message: "Yêu cầu không hợp lệ." }, { status: 403, headers: noStore });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > LOGIN_BODY_LIMIT_BYTES) {
    return NextResponse.json({ message: "Dữ liệu đăng nhập quá lớn." }, { status: 413, headers: noStore });
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > LOGIN_BODY_LIMIT_BYTES) {
    return NextResponse.json({ message: "Dữ liệu đăng nhập quá lớn." }, { status: 413, headers: noStore });
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return NextResponse.json({ message: "Dữ liệu đăng nhập không hợp lệ." }, { status: 400, headers: noStore });
  }

  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ message: "Thông tin đăng nhập không đúng." }, { status: 401, headers: noStore });
  }

  const clientKey = getClientKey(request);
  const auth = await getAuthRuntime();
  const allowance = auth.limiter.check(clientKey);
  if (!allowance.allowed) {
    return NextResponse.json(
      { message: "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau." },
      { status: 429, headers: { ...noStore, "Retry-After": String(allowance.retryAfterSeconds ?? 60) } },
    );
  }

  if (!(await authenticate(parsed.data.username, parsed.data.password))) {
    auth.limiter.recordFailure(clientKey);
    return NextResponse.json({ message: "Thông tin đăng nhập không đúng." }, { status: 401, headers: noStore });
  }

  auth.limiter.reset(clientKey);
  const session = auth.sessions.create();
  const response = NextResponse.json({ ok: true, redirectTo: safeInternalRedirect(parsed.data.next) }, { headers: noStore });
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
