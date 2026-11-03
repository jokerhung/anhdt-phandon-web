import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, fileIdSchema, identifierSchema, jsonNoStore, sheetIdSchema, snapshotIdSchema } from "@/lib/server/api";
import { guardPost } from "@/lib/server/route-auth";
import { assignWarehousePackage } from "@/lib/server/assign-warehouse-package";

export const runtime = "nodejs";
const warehouseCodeSchema = z.string().trim().regex(/^\d+A[1-8]$/i);
const schema = z.object({ fileId: fileIdSchema, sheetId: sheetIdSchema, snapshotId: snapshotIdSchema, lot: identifierSchema, packageId: identifierSchema, code: warehouseCodeSchema });

export async function POST(request: NextRequest) {
  const denied = await guardPost(request); if (denied) return denied;
  try {
    const body = schema.parse(await request.json());
    return jsonNoStore(await assignWarehousePackage(body.fileId, body.sheetId, body.snapshotId, body.lot, body.packageId, body.code));
  } catch (error) { return apiError(error); }
}
