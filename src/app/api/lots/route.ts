import { apiError, fileIdSchema, jsonNoStore, sheetIdSchema } from "@/lib/server/api";
import { getLots } from "@/lib/server/data-service";
import { guardApi } from "@/lib/server/route-auth";
export const runtime = "nodejs";
export async function GET(request: Request) { const denied = await guardApi(); if (denied) return denied; try { const p = new URL(request.url).searchParams; return jsonNoStore(await getLots(fileIdSchema.parse(p.get("fileId")), sheetIdSchema.parse(p.get("sheetId")))); } catch (error) { return apiError(error); } }
