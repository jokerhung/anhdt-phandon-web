import { DriveService } from "@/lib/google/drive-service";
import { apiError, jsonNoStore } from "@/lib/server/api";
import { guardApi } from "@/lib/server/route-auth";
export const runtime = "nodejs";
export async function GET(request: Request) { const denied = await guardApi(); if (denied) return denied; try { return jsonNoStore({ files: await new DriveService().listSpreadsheets(new URL(request.url).searchParams.get("refresh") === "1") }); } catch (error) { return apiError(error); } }
