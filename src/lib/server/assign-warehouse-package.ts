import "server-only";
import type { sheets_v4 } from "googleapis";
import { nextWarehousePackageCode, parseHeader, parseSheet } from "@/lib/domain";
import { SheetsService, quoteA1Title } from "@/lib/google/sheets-service";
import { DomainDataError } from "@/lib/server/api";
import { refreshCatalogSheet } from "@/lib/server/catalog-cache";
import { getSnapshotCache } from "@/lib/server/snapshot-cache";

function columnName(index: number): string {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
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
  if (JSON.stringify(current) !== JSON.stringify(expected)) {
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

  const updates: sheets_v4.Schema$ValueRange[] = [];
  for (let rowIndex = parsed.headerRow + 1; rowIndex < live.rows.length; rowIndex += 1) {
    const row = live.rows[rowIndex];
    if (row[lotColumn] !== lot || row[packageColumn] !== packageId || !row[skuColumn]?.trim()) continue;
    const currentCode = row[warehouseColumn]?.trim() ?? "";
    if (currentCode && currentCode !== code) throw new DomainDataError("WAREHOUSE_PACKAGE_CONFLICT", `Cột Kiện kho của kiện ${packageId} đã có mã ${currentCode}.`, 409);
    if (!currentCode) updates.push({ range: `${quoteA1Title(live.title)}!${columnName(warehouseColumn)}${rowIndex + 1}`, values: [[code]] });
  }
  if (!updates.length) return { code, updatedRows: 0, alreadyAssigned: true };

  await service.writeValues(fileId, updates);
  await refreshCatalogSheet(fileId, sheetId);
  return { code, updatedRows: updates.length, alreadyAssigned: false };
}
