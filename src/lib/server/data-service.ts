import "server-only";
import { buildSlip, formatSlipDate, summarizePackageRows } from "@/lib/domain";
import { DomainDataError } from "@/lib/server/api";
import { getEnv } from "@/lib/server/env";
import { getSnapshotCache } from "@/lib/server/snapshot-cache";

export async function getLots(fileId: string, sheetId: number) {
  const snapshot = await getSnapshotCache().getOrLoad(fileId, sheetId);
  return { lots: snapshot.index.lots(), snapshotId: snapshot.id, fetchedAt: snapshot.fetchedAt };
}
export function getPackages(fileId: string, sheetId: number, snapshotId: string, lot: string) {
  const snapshot = getSnapshotCache().getSnapshot(fileId, sheetId, snapshotId);
  if (!snapshot.index.lots().includes(lot)) throw new DomainDataError("LOT_NOT_FOUND", "Lô không tồn tại trong dữ liệu đã chọn.", 404);
  return { packages: snapshot.index.packages(lot), snapshotId, fetchedAt: snapshot.fetchedAt };
}
export function getPackageSummary(fileId: string, sheetId: number, snapshotId: string, lot: string, packageId: string) {
  const snapshot = getSnapshotCache().getSnapshot(fileId, sheetId, snapshotId);
  const rows = snapshot.index.rows(lot, packageId);
  if (rows.length === 0) throw new DomainDataError("PACKAGE_NOT_FOUND", "Kiện không tồn tại trong lô đã chọn.", 404);
  return { lot, package: packageId, ...summarizePackageRows(rows), snapshotId, fetchedAt: snapshot.fetchedAt };
}

export function getSlip(fileId: string, sheetId: number, snapshotId: string, lot: string, packageId: string, now = new Date()) {
  const snapshot = getSnapshotCache().getSnapshot(fileId, sheetId, snapshotId);
  const rows = snapshot.index.rows(lot, packageId);
  if (rows.length === 0) throw new DomainDataError("PACKAGE_NOT_FOUND", "Kiện không tồn tại trong lô đã chọn.", 404);
  const slip = buildSlip(lot, packageId, rows, formatSlipDate(now, getEnv().APP_TIME_ZONE));
  return slip ? { printable: true, slip, source: { sheetTitle: snapshot.title }, snapshotId, fetchedAt: snapshot.fetchedAt } : { printable: false, reason: "UNALLOCATED", message: "Chưa phân bổ", source: { sheetTitle: snapshot.title }, snapshotId, fetchedAt: snapshot.fetchedAt };
}
