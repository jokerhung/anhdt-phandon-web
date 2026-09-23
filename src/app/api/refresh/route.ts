import type { NextRequest } from "next/server";
import { apiError, jsonNoStore, fileIdSchema, sheetIdSchema } from "@/lib/server/api";
import { z } from "zod";
import { guardPost } from "@/lib/server/route-auth";
import { getCatalog, refreshCatalogSheet } from "@/lib/server/catalog-cache";
export const runtime = "nodejs";
const sheetRefreshSchema = z.object({ fileId: fileIdSchema, sheetId: sheetIdSchema });
export async function POST(request: NextRequest) {
  const denied = await guardPost(request); if (denied) return denied;
  try {
    const scope = new URL(request.url).searchParams.get("scope");
    let catalog;
    if (scope === "sheet") {
      const body = sheetRefreshSchema.parse(await request.json());
      catalog = await refreshCatalogSheet(body.fileId, body.sheetId);
    } else {
      catalog = await getCatalog(true);
    }
    return jsonNoStore({ files: catalog.files, fetchedAt: catalog.fetchedAt, invalidSheets: catalog.errors.size });
  } catch (error) { return apiError(error); }
}
