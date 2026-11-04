import "server-only";
import type { sheets_v4 } from "googleapis";
import { getGoogleClients } from "@/lib/google/client";
import { mapGoogleError } from "@/lib/google/errors";
import { withGoogleRetry } from "@/lib/google/retry";
import { nextWarehousePackageCode, parseHeader, parseSheet } from "@/lib/domain";
import { toIntOrZero } from "@/lib/domain/text";
import { sameRows } from "@/lib/domain/same-rows";
import { SheetsService } from "@/lib/google/sheets-service";
import { DomainDataError } from "@/lib/server/api";
import { refreshCatalogSheet } from "@/lib/server/catalog-cache";
import { getSnapshotCache } from "@/lib/server/snapshot-cache";

/**
 * Package allocated to exactly one distributor: after the name is written on the
 * carton, color the Lô cell and fill "OK" into the empty Kiện kho (BO) cells.
 */
export async function completeSingleDistributorPackage(fileId: string, sheetId: number, snapshotId: string, lot: string, packageId: string) {
  const expectedSnapshot = getSnapshotCache().getSnapshot(fileId, sheetId, snapshotId);
  const expected = expectedSnapshot.index.rows(lot, packageId);
  if (!expected.length) throw new DomainDataError("PACKAGE_NOT_FOUND", "Kiện không tồn tại trong lô đã chọn.", 404);
  const distributors = new Set(expected.flatMap((row) => row.allocations.filter((allocation) => allocation.soLuong.trim() !== "").map((allocation) => allocation.khach)));
  if (distributors.size !== 1) throw new DomainDataError("NOT_SINGLE_DISTRIBUTOR", "Kiện này không phải kiện chỉ chia cho đúng 1 đại lý.");
  if (expected.some((row) => toIntOrZero(row.ton) !== 0)) throw new DomainDataError("STOCK_REMAINING", "Kiện này còn tồn kho, chưa thể hoàn thành.");

  const live = await new SheetsService().readValues(fileId, sheetId, true);
  const parsed = parseSheet(live.rows, live.title);
  if (!parsed.ok) throw new DomainDataError("SHEET_FORMAT", parsed.message);
  const current = parsed.rows.filter((row) => row.lo === lot && row.kien === packageId);
  if (!sameRows(current, expected)) {
    throw new DomainDataError("PACKAGE_DATA_CHANGED", "Dữ liệu kiện đã thay đổi. Vui lòng tải lại rồi kiểm tra lại.", 409);
  }
  const header = live.rows[parsed.headerRow].map(parseHeader);
  const warehouseColumn = header.indexOf("kien kho");
  const lotColumn = header.indexOf("lo");
  const packageColumn = header.indexOf("kien");
  const skuColumn = header.indexOf("sku");
  if (warehouseColumn < 0) throw new DomainDataError("SHEET_FORMAT", "Không tìm thấy cột Kiện kho (BO) trong Google Sheet.");

  const requests: sheets_v4.Schema$Request[] = [];
  let okCells = 0;
  for (let rowIndex = parsed.headerRow + 1; rowIndex < live.rows.length; rowIndex += 1) {
    const row = live.rows[rowIndex];
    if (row[lotColumn] !== lot || row[packageColumn] !== packageId || !row[skuColumn]?.trim()) continue;
    if (!row[warehouseColumn]?.trim()) {
      requests.push({ updateCells: {
        rows: [{ values: [{ userEnteredValue: { stringValue: "OK" } }] }],
        fields: "userEnteredValue",
        start: { sheetId, rowIndex, columnIndex: warehouseColumn },
      } });
      okCells += 1;
    }
    requests.push({ repeatCell: {
      range: { sheetId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: lotColumn, endColumnIndex: lotColumn + 1 },
      cell: { userEnteredFormat: { backgroundColorStyle: { rgbColor: { red: 183 / 255, green: 225 / 255, blue: 205 / 255 } } } },
      fields: "userEnteredFormat.backgroundColorStyle",
    } });
  }
  if (!requests.length) throw new DomainDataError("PACKAGE_NOT_FOUND", "Không tìm thấy dòng của kiện cần tô màu.", 404);
  try {
    await withGoogleRetry(() => getGoogleClients().sheets.spreadsheets.batchUpdate({ spreadsheetId: fileId, requestBody: { requests } }));
  } catch (error) { throw mapGoogleError(error); }
  await refreshCatalogSheet(fileId, sheetId);
  return { okCells };
}

export async function assignWarehousePackage(fileId: string, sheetId: number, snapshotId: string, lot: string, packageId: string, code: string) {
  const expectedSnapshot = getSnapshotCache().getSnapshot(fileId, sheetId, snapshotId);
  const expected = expectedSnapshot.index.rows(lot, packageId);
  if (!expected.length) throw new DomainDataError("PACKAGE_NOT_FOUND", "Kiện không tồn tại trong lô đã chọn.", 404);
  if (expected.some((row) => row.allocations.some((allocation) => allocation.soLuong.trim() !== ""))) {
    throw new DomainDataError("PACKAGE_ALLOCATED", "Kiện này đã có nhà phân phối, không cần gán mã Kiện kho.");
  }

  const service = new SheetsService();
  const live = await service.readValues(fileId, sheetId, true);
  const parsed = parseSheet(live.rows, live.title);
  if (!parsed.ok) throw new DomainDataError("SHEET_FORMAT", parsed.message);
  const current = parsed.rows.filter((row) => row.lo === lot && row.kien === packageId);
  if (!sameRows(current, expected)) {
    throw new DomainDataError("PACKAGE_DATA_CHANGED", "Dữ liệu kiện đã thay đổi. Vui lòng tải lại rồi kiểm tra lại.", 409);
  }
  const nextCode = nextWarehousePackageCode(parsed.rows);
  if (code.toUpperCase() !== nextCode.toUpperCase()) {
    throw new DomainDataError("WAREHOUSE_PACKAGE_CONFLICT", `Mã Kiện kho kế tiếp hiện là ${nextCode}. Vui lòng tải lại dữ liệu.`, 409);
  }

  const header = live.rows[parsed.headerRow].map(parseHeader);
  const warehouseColumn = header.indexOf("kien kho");
  const lotColumn = header.indexOf("lo");
  const packageColumn = header.indexOf("kien");
  const skuColumn = header.indexOf("sku");
  if (warehouseColumn < 0) throw new DomainDataError("SHEET_FORMAT", "Không tìm thấy cột Kiện kho (BO) trong Google Sheet.");

  const requests: sheets_v4.Schema$Request[] = [];
  let updatedRows = 0;
  for (let rowIndex = parsed.headerRow + 1; rowIndex < live.rows.length; rowIndex += 1) {
    const row = live.rows[rowIndex];
    if (row[lotColumn] !== lot || row[packageColumn] !== packageId || !row[skuColumn]?.trim()) continue;
    const currentCode = row[warehouseColumn]?.trim() ?? "";
    if (currentCode && currentCode !== code) throw new DomainDataError("WAREHOUSE_PACKAGE_CONFLICT", `Cột Kiện kho của kiện ${packageId} đã có mã ${currentCode}.`, 409);
    if (!currentCode) {
      requests.push({ updateCells: {
        rows: [{ values: [{ userEnteredValue: { stringValue: code } }] }],
        fields: "userEnteredValue",
        start: { sheetId, rowIndex, columnIndex: warehouseColumn },
      } });
      updatedRows += 1;
    }
    requests.push({ repeatCell: {
      range: { sheetId, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: lotColumn, endColumnIndex: lotColumn + 1 },
      cell: { userEnteredFormat: { backgroundColorStyle: { rgbColor: { red: 183 / 255, green: 225 / 255, blue: 205 / 255 } } } },
      fields: "userEnteredFormat.backgroundColorStyle",
    } });
  }
  if (!requests.length) throw new DomainDataError("PACKAGE_NOT_FOUND", "Không tìm thấy dòng của kiện cần ghi mã và tô màu.", 404);

  // Write the warehouse code and color together, so a failed request cannot leave half the work done.
  try {
    await withGoogleRetry(() => getGoogleClients().sheets.spreadsheets.batchUpdate({ spreadsheetId: fileId, requestBody: { requests } }));
  } catch (error) { throw mapGoogleError(error); }
  await refreshCatalogSheet(fileId, sheetId);
  return { code, updatedRows, alreadyAssigned: updatedRows === 0 };
}
