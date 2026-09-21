import { normalizeHeader } from "@/lib/domain/text";
import type { Allocation, ParseResult, SheetRow } from "@/lib/domain/types";

const FORMAT_ERROR = "Bảng này không đúng định dạng phân đơn";

export function parseSheet(values: string[][], sheetTitle = ""): ParseResult {
  const headerIndex = values.slice(0, 10).findIndex((row) => {
    const names = row.map(normalizeHeader);
    return ["lo", "kien", "sku"].every((name) => names.includes(name));
  });
  if (headerIndex < 0) return { ok: false, message: `${FORMAT_ERROR}: thiếu hàng tiêu đề Lô/Kiện/SKU` };

  const rawHeader = values[headerIndex];
  const header = rawHeader.map(normalizeHeader);
  const col = (name: string) => header.findIndex((value) => value === name);
  const lo = col("lo");
  const kien = col("kien");
  const sku = col("sku");
  const sl = col("sl");
  const ton = col("ton");
  const moTa = col("description");
  if ([lo, kien, sku, sl].some((index) => index < 0)) return { ok: false, message: `${FORMAT_ERROR}: thiếu cột Lô/Kiện/SKU/SL` };
  if (sl <= sku || sl >= header.length - 1) return { ok: false, message: `${FORMAT_ERROR}: không có khối đơn vị sau SL` };

  let end = -1;
  for (let index = sl + 1; index < header.length - 1; index += 2) {
    if (header[index] === "" && header[index + 1] === "") {
      end = index;
      break;
    }
  }
  if (end < 0) return { ok: false, message: `${FORMAT_ERROR}: thiếu hai cột rỗng kết thúc khối đơn vị` };

  const units: number[] = [];
  for (let index = sl + 1; index < end; index += 2) units.push(index);
  if (units.length === 0 || units.some((index) => header[index] === "" || index + 1 >= end || header[index + 1] !== "")) {
    return { ok: false, message: `${FORMAT_ERROR}: cặp cột đơn vị/trạng thái không hợp lệ` };
  }
  if (ton >= 0 && ton <= end) return { ok: false, message: `${FORMAT_ERROR}: cột Tồn nằm trong khối đơn vị` };

  const rows: SheetRow[] = [];
  for (let index = headerIndex + 1; index < values.length; index += 1) {
    const row = values[index];
    if (row.every((cell) => cell.trim() === "")) continue;
    const cell = (column: number) => row[column] ?? "";
    if (cell(lo).trim() === "") {
      return { ok: false, message: `${FORMAT_ERROR}: cột Lô rỗng ở hàng ${index + 1} (có thể do nguồn gviz làm mất dữ liệu)`, rowNumber: index + 1 };
    }
    const allocations: Allocation[] = units.map((unit) => ({ khach: rawHeader[unit], soLuong: cell(unit), trangThai: cell(unit + 1) }));
    rows.push({
      lo: cell(lo), kien: cell(kien), sku: cell(sku), moTa: moTa >= 0 ? cell(moTa) : "",
      tenSheet: sheetTitle, slSheet: cell(sl), ton: ton >= 0 ? cell(ton) : "", allocations,
    });
  }
  return { ok: true, rows, distributors: units.map((unit) => rawHeader[unit]), headerRow: headerIndex };
}
