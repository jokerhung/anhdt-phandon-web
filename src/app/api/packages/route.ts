import { apiError, fileIdSchema, identifierSchema, jsonNoStore, sheetIdSchema, snapshotIdSchema } from "@/lib/server/api";
import { getPackages } from "@/lib/server/data-service";
import { guardApi } from "@/lib/server/route-auth";
export const runtime = "nodejs";
export async function GET(request: Request) { const denied = await guardApi(); if (denied) return denied; try { const p = new URL(request.url).searchParams; return jsonNoStore(getPackages(fileIdSchema.parse(p.get("fileId")), sheetIdSchema.parse(p.get("sheetId")), snapshotIdSchema.parse(p.get("snapshotId")), identifierSchema.parse(p.get("lot")))); } catch (error) { return apiError(error); } }
