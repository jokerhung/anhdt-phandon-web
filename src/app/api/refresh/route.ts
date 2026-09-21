import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, fileIdSchema, jsonNoStore, sheetIdSchema } from "@/lib/server/api";
import { guardPost } from "@/lib/server/route-auth";
import { getSnapshotCache } from "@/lib/server/snapshot-cache";
export const runtime = "nodejs";
const bodySchema = z.object({ fileId: fileIdSchema, sheetId: sheetIdSchema });
export async function POST(request: NextRequest) { const denied = await guardPost(request); if (denied) return denied; try { const body = bodySchema.parse(await request.json()); const snapshot = await getSnapshotCache().refresh(body.fileId, body.sheetId); return jsonNoStore({ lots: snapshot.index.lots(), snapshotId: snapshot.id, fetchedAt: snapshot.fetchedAt }); } catch (error) { return apiError(error); } }
