import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, fileIdSchema, identifierSchema, jsonNoStore, sheetIdSchema, snapshotIdSchema } from "@/lib/server/api";
import { guardPost } from "@/lib/server/route-auth";
import { markPrinted } from "@/lib/server/mark-printed";

export const runtime = "nodejs";
const schema = z.object({ fileId: fileIdSchema, sheetId: sheetIdSchema, snapshotId: snapshotIdSchema, lot: identifierSchema, packageId: identifierSchema });

export async function POST(request: NextRequest) {
  const denied = await guardPost(request); if (denied) return denied;
  try {
    const body = schema.parse(await request.json());
    return jsonNoStore(await markPrinted(body.fileId, body.sheetId, body.snapshotId, body.lot, body.packageId));
  } catch (error) { return apiError(error); }
}
