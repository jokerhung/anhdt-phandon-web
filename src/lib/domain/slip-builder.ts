import { toIntOrZero } from "@/lib/domain/text";
import type { SheetRow, Slip, SlipLine } from "@/lib/domain/types";

export function buildSlip(lo: string, kien: string, rows: SheetRow[], date?: string): Slip | null {
  const matching = rows.filter((row) => row.lo === lo && row.kien === kien);
  const lines: SlipLine[] = matching.flatMap((row) => row.allocations
    .filter((allocation) => allocation.soLuong.trim() !== "")
    .map((allocation) => ({
      sku: row.sku,
      t: row.slSheet,
      khach: allocation.khach,
      soLuong: allocation.soLuong,
      ghiChu: allocation.trangThai === "OK" ? "" : allocation.trangThai,
    })));
  if (lines.length === 0) return null;
  return {
    lo, kien, lines,
    unallocated: matching.reduce((total, row) => total + toIntOrZero(row.ton), 0),
    totalSku: new Set(lines.map((line) => line.sku)).size,
    ...(date ? { date } : {}),
  };
}

export function formatSlipDate(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("vi-VN", { timeZone, day: "2-digit", month: "2-digit", year: "numeric" }).format(now);
}
