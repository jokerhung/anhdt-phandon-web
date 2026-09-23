import { getCatalog } from "@/lib/server/catalog-cache";
import { apiError, jsonNoStore } from "@/lib/server/api";
import { guardApi } from "@/lib/server/route-auth";
export const runtime = "nodejs";
export async function GET() { const denied = await guardApi(); if (denied) return denied; try { const catalog = await getCatalog(); return jsonNoStore({ files: catalog.files, fetchedAt: catalog.fetchedAt, invalidSheets: catalog.errors.size }); } catch (error) { return apiError(error); } }
