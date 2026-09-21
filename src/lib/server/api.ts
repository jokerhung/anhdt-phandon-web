import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleDataError } from "@/lib/google/errors";

export const noStoreHeaders = { "Cache-Control": "private, no-store" };
export const fileIdSchema = z.string().trim().min(1).max(256).regex(/^[A-Za-z0-9_-]+$/);
export const sheetIdSchema = z.coerce.number().int().nonnegative();
export const snapshotIdSchema = z.string().uuid();
export const identifierSchema = z.string().min(1).max(256);

export function jsonNoStore(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: noStoreHeaders });
}

export function apiError(error: unknown): NextResponse {
  if (error instanceof GoogleDataError) return jsonNoStore({ error: error.code, message: error.message }, error.status);
  if (error instanceof z.ZodError) return jsonNoStore({ error: "INVALID_INPUT", message: "Dữ liệu yêu cầu không hợp lệ." }, 400);
  if (error instanceof SnapshotExpiredError) return jsonNoStore({ error: "SNAPSHOT_EXPIRED", message: "Dữ liệu đã hết hạn. Vui lòng tải lại." }, 409);
  if (error instanceof DomainDataError) return jsonNoStore({ error: error.code, message: error.message }, error.status);
  return jsonNoStore({ error: "INTERNAL_ERROR", message: "Máy chủ không thể xử lý yêu cầu." }, 500);
}

export class SnapshotExpiredError extends Error {}
export class DomainDataError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 422) { super(message); }
}
