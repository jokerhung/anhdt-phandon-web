import Link from "next/link";
import { PreviewPage } from "@/components/PreviewPage";
import { fileIdSchema, identifierSchema, sheetIdSchema, snapshotIdSchema } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Query = Record<string, string | string[] | undefined>;
function one(value: string | string[] | undefined): string | undefined { return typeof value === "string" ? value : undefined; }

export default async function PreviewRoute({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams;
  const parsed = {
    fileId: fileIdSchema.safeParse(one(params.fileId)),
    sheetId: sheetIdSchema.safeParse(one(params.sheetId)),
    snapshotId: snapshotIdSchema.safeParse(one(params.snapshotId)),
    lot: identifierSchema.safeParse(one(params.lot)),
    packageId: identifierSchema.safeParse(one(params.package)),
  };
  if (!parsed.fileId.success || !parsed.sheetId.success || !parsed.snapshotId.success || !parsed.lot.success || !parsed.packageId.success) {
    return <main className="grid min-h-svh place-items-center bg-muted/30 p-4"><div className="max-w-lg rounded-xl border bg-background p-6 text-center shadow-sm"><h1 className="text-xl font-semibold">Thông tin xem trước không hợp lệ</h1><p className="mt-2 text-sm text-muted-foreground">URL thiếu hoặc chứa lựa chọn không hợp lệ. Vui lòng quay lại trang tra cứu.</p><Link className="mt-4 inline-flex min-h-11 items-center text-primary underline" href="/">Quay lại tra cứu</Link></div></main>;
  }
  const profile = one(params.profile) === "a4" ? "a4" : "a7";
  return <PreviewPage profile={profile} query={{ fileId: parsed.fileId.data, sheetId: String(parsed.sheetId.data), snapshotId: parsed.snapshotId.data, lot: parsed.lot.data, packageId: parsed.packageId.data }} />;
}
