import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/auth-service";
import { hasValidOrigin } from "@/lib/auth/origin";
import { jsonNoStore } from "@/lib/server/api";

export async function guardApi(): Promise<Response | null> { return requireAdminApi(); }
export async function guardPost(request: NextRequest): Promise<Response | null> {
  const auth = await requireAdminApi(); if (auth) return auth;
  return hasValidOrigin(request) ? null : jsonNoStore({ error: "INVALID_ORIGIN", message: "Yêu cầu không hợp lệ." }, 403);
}
