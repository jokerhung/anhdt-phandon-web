import { normalizeHeader } from "@/lib/domain/text";
import type { Allocation, ParseResult, SheetRow } from "@/lib/domain/types";

const FORMAT_ERROR = "Bảng này không đúng định dạng phân đơn";

function parseHeader(value: string): string {
  const normalized = normalizeHeader(value).replace(/\s+/g, " ");
  // Packing-list headers used by the 190926 source. Keep Q'TY/CTN
  // distinct: it is quantity per carton, not the row's total quantity.
  const aliases: Record<string, string> = {
    "ctn no.": "kien",
    "ctn no": "kien",
    "item no.": "sku",
    "item no": "sku",
    "q'ty": "sl",
    "q’ty": "sl",
  };
  return aliases[normalized] ?? normalized;
}

export function parseSheet(values: string[][], sheetTitle = ""): ParseResult {
  const headerIndex = values.slice(0, 10).findIndex((row) => {
    const names = row.map(parseHeader);
    return ["lo", "kien", "sku"].every((name) => names.includes(name));
  });
  if (headerIndex < 0) return { ok: false, message: `${FORMAT_ERROR}: thiếu hàng tiêu đề Lô/Kiện/SKU` };

  const rawHeader = values[headerIndex];
  const header = rawHeader.map(parseHeader);
  const col = (name: string) => header.findIndex((value) => value === name);
  const lo = col("lo");
  const kien = col("kien");
  const sku = col("sku");
  const sl = col("sl");
  const ton = col("ton");
  const moTa = col("description");
  if ([lo, kien, sku, sl].some((index) => index < 0)) return { ok: false, message: `${FORMAT_ERROR}: thiếu cột Lô/Kiện/SKU/SL` };
  if (sl <= sku || sl >= header.length - 1) return { ok: false, message: `${FORMAT_ERROR}: không có khối đơn vị sau SL` };

  // Support both the legacy blank-pair terminator and compact sheets whose
  // customer block ends at Tồn or the end of the header. Sheets API omits
  // trailing empty cells, including the final customer's status header.
  const units: number[] = [];
  let end = header.length;
  for (let index = sl + 1; index < header.length; index += 2) {
    if (index === ton || (header[index] === "" && (header[index + 1] ?? "") === "")) {
      end = index;
      break;
    }
    if (header[index] === "" || (header[index + 1] ?? "") !== "") {
      return { ok: false, message: `${FORMAT_ERROR}: cặp cột đơn vị/trạng thái không hợp lệ` };
    }
    units.push(index);
  }
  if (units.length === 0) {
    return { ok: false, message: `${FORMAT_ERROR}: cặp cột đơn vị/trạng thái không hợp lệ` };
  }
  if (ton >= 0 && ton < end) return { ok: false, message: `${FORMAT_ERROR}: cột Tồn nằm trong khối đơn vị` };

  const rows: SheetRow[] = [];
  for (let index = headerIndex + 1; index < values.length; index += 1) {
    const row = values[index];
    if (row.every((cell) => cell.trim() === "")) continue;
    const cell = (column: number) => row[column] ?? "";
    // Skip incomplete/separator rows without stopping the rest of the sheet.
    // Do not fill identifiers from the preceding row or treat "0" as empty.
    if ([lo, kien, sku].some((column) => cell(column).trim() === "")) continue;
    const allocations: Allocation[] = units.map((unit) => ({ khach: rawHeader[unit], soLuong: cell(unit), trangThai: cell(unit + 1) }));
    rows.push({
      lo: cell(lo), kien: cell(kien), sku: cell(sku), moTa: moTa >= 0 ? cell(moTa) : "",
      tenSheet: sheetTitle, slSheet: cell(sl), ton: ton >= 0 ? cell(ton) : "", allocations,
    });
  }
  return { ok: true, rows, distributors: units.map((unit) => rawHeader[unit]), headerRow: headerIndex };
}
