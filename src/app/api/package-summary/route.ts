import { apiError, fileIdSchema, identifierSchema, jsonNoStore, sheetIdSchema, snapshotIdSchema } from "@/lib/server/api";
import { getPackageSummary } from "@/lib/server/data-service";
import { guardApi } from "@/lib/server/route-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const denied = await guardApi();
  if (denied) return denied;
  try {
    const params = new URL(request.url).searchParams;
    return jsonNoStore(getPackageSummary(
      fileIdSchema.parse(params.get("fileId")),
      sheetIdSchema.parse(params.get("sheetId")),
      snapshotIdSchema.parse(params.get("snapshotId")),
      identifierSchema.parse(params.get("lot")),
      identifierSchema.parse(params.get("package")),
    ));
  } catch (error) {
    return apiError(error);
  }
}
