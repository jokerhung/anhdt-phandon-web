import { NextRequest, NextResponse } from "next/server";
import { getAuthRuntime } from "@/lib/auth/auth-service";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { hasValidOrigin } from "@/lib/auth/origin";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!hasValidOrigin(request)) {
    return NextResponse.json({ message: "Yêu cầu không hợp lệ." }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  (await getAuthRuntime()).sessions.revoke(token);
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  response.cookies.set({ name: SESSION_COOKIE, value: "", httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
