import "server-only";
import type { sheets_v4 } from "googleapis";
import { getGoogleClients } from "@/lib/google/client";
import { GoogleDataError, mapGoogleError } from "@/lib/google/errors";
import { SheetsService } from "@/lib/google/sheets-service";
import { withGoogleRetry } from "@/lib/google/retry";
import { parseHeader, parseSheet } from "@/lib/domain/parser";
import { toIntOrZero } from "@/lib/domain/text";
import { DomainDataError } from "@/lib/server/api";
import { getSlip } from "@/lib/server/data-service";
import { getSnapshotCache } from "@/lib/server/snapshot-cache";

export async function markPrinted(fileId: string, sheetId: number, snapshotId: string, lot: string, packageId: string) {
  const slip = getSlip(fileId, sheetId, snapshotId, lot, packageId);
  if (!slip.printable) throw new DomainDataError("UNALLOCATED", "Kiện chưa được phân bổ, không thể đánh dấu đã in.");
  const expected = getSnapshotCache().getSnapshot(fileId, sheetId, snapshotId).index.rows(lot, packageId);
  // Resolve row positions from live data: sorting/inserting rows must not color another package.
  const data = await new SheetsService().readValues(fileId, sheetId, true);
  const parsed = parseSheet(data.rows, data.title);
  if (!parsed.ok) throw new DomainDataError("SHEET_FORMAT", parsed.message);
  const current = parsed.rows.filter((row) => row.lo === lot && row.kien === packageId);
  if (JSON.stringify(current) !== JSON.stringify(expected)) {
    throw new DomainDataError("PRINT_DATA_CHANGED", "Dữ liệu kiện đã thay đổi. Vui lòng tải lại phiếu và kiểm tra trước khi đánh dấu.", 409);
  }
  const header = data.rows[parsed.headerRow].map(parseHeader);
  const lotColumn = header.indexOf("lo");
  const packageColumn = header.indexOf("kien");
  const skuColumn = header.indexOf("sku");
  const warehouseColumn = header.indexOf("kien kho");
  const shouldMarkWarehouseOk = current.some((row) => row.allocations.some((allocation) => allocation.soLuong.trim() !== ""))
    && current.reduce((total, row) => total + toIntOrZero(row.ton), 0) > 0;
  const requests = data.rows.flatMap((row, rowIndex) => {
    if (rowIndex <= parsed.headerRow || row[lotColumn] !== lot || row[packageColumn] !== packageId || !row[skuColumn]?.trim()) return [];
    const rowRequests: sheets_v4.Schema$Request[] = [{ repeatCell: {
      range: { sheetId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: lotColumn, endColumnIndex: lotColumn + 1 },
      cell: { userEnteredFormat: { backgroundColorStyle: { rgbColor: { red: 183 / 255, green: 225 / 255, blue: 205 / 255 } } } },
      fields: "userEnteredFormat.backgroundColorStyle",
    } }];
    if (shouldMarkWarehouseOk && warehouseColumn >= 0 && !row[warehouseColumn]?.trim()) rowRequests.push({ updateCells: {
      rows: [{ values: [{ userEnteredValue: { stringValue: "OK" } }] }],
      fields: "userEnteredValue",
      start: { sheetId, rowIndex, columnIndex: warehouseColumn },
    } });
    return rowRequests;
  });
  if (!requests.length) throw new DomainDataError("PACKAGE_NOT_FOUND", "Không tìm thấy ô Lô của kiện cần đánh dấu.", 404);
  try {
    await withGoogleRetry(() => getGoogleClients().sheets.spreadsheets.batchUpdate({ spreadsheetId: fileId, requestBody: { requests } }));
  } catch (error) {
    const mapped = mapGoogleError(error);
    if (mapped.code === "GOOGLE_FORBIDDEN") throw new GoogleDataError("GOOGLE_FORBIDDEN", "Không thể tô màu. Hãy cấp quyền Chỉnh sửa Google Sheets cho service account và kiểm tra vùng được bảo vệ.", 403);
    throw mapped;
  }
  const markedCells = data.rows.filter((row, rowIndex) => rowIndex > parsed.headerRow && row[lotColumn] === lot && row[packageColumn] === packageId && row[skuColumn]?.trim()).length;
  const okCells = shouldMarkWarehouseOk && warehouseColumn >= 0
    ? data.rows.filter((row, rowIndex) => rowIndex > parsed.headerRow && row[lotColumn] === lot && row[packageColumn] === packageId && row[skuColumn]?.trim() && !row[warehouseColumn]?.trim()).length
    : 0;
  return { markedCells, okCells };
}
