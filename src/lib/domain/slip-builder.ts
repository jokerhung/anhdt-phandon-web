import { toIntOrZero } from "@/lib/domain/text";
import type { SheetRow, Slip, SlipLine } from "@/lib/domain/types";

export function buildSlip(lo: string, kien: string, rows: SheetRow[], date?: string): Slip | null {
  const matching = rows.filter((row) => row.lo === lo && row.kien === kien);
  // Every row of the package becomes a line, even when no customer was
  // allocated. Without this, SKUs that only have stock (no distributor
  // quantity) silently disappear from the slip and from Tổng SKU.
  const lines: SlipLine[] = matching.flatMap((row) => {
    const allocations = row.allocations.filter((allocation) => allocation.soLuong.trim() !== "");
    if (allocations.length === 0) {
      return [{ sku: row.sku, t: row.slSheet, khach: "", soLuong: "", ghiChu: "" }];
    }
    return allocations.map((allocation) => ({
      sku: row.sku,
      t: row.slSheet,
      khach: allocation.khach,
      soLuong: allocation.soLuong,
      // Allocation depends only on the customer's quantity, never status text.
      // Keep the printable notes cell empty regardless of OK or other remarks.
      ghiChu: "",
    }));
  });
  if (lines.length === 0) return null;
  const warehouseCodes = [...new Set(matching.map((row) => row.kienKho.trim()).filter(Boolean))];
  return {
    lo, kien, lines,
    unallocated: matching.reduce((total, row) => total + toIntOrZero(row.ton), 0),
    totalSku: new Set(lines.map((line) => line.sku)).size,
    ...(date ? { date } : {}),
    ...(warehouseCodes.length === 1 ? { kienKho: warehouseCodes[0] } : {}),
  };
}

export function formatSlipDate(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("vi-VN", { timeZone, day: "2-digit", month: "2-digit", year: "numeric" }).format(now);
}
