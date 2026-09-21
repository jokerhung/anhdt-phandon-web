import { SheetsService } from "@/lib/google/sheets-service";
import { apiError, fileIdSchema, jsonNoStore } from "@/lib/server/api";
import { guardApi } from "@/lib/server/route-auth";
export const runtime = "nodejs";
export async function GET(request: Request) { const denied = await guardApi(); if (denied) return denied; try { const fileId = fileIdSchema.parse(new URL(request.url).searchParams.get("fileId")); return jsonNoStore({ sheets: await new SheetsService().listTabs(fileId) }); } catch (error) { return apiError(error); } }
