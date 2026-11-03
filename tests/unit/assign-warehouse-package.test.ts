import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseSheet } from "@/lib/domain";

const mocks = vi.hoisted(() => ({ read: vi.fn(), batch: vi.fn(), snapshot: vi.fn(), refresh: vi.fn() }));
vi.mock("@/lib/google/client", () => ({ getGoogleClients: () => ({ sheets: { spreadsheets: { batchUpdate: mocks.batch } } }) }));
vi.mock("@/lib/google/sheets-service", () => ({ SheetsService: class { readValues = mocks.read; } }));
vi.mock("@/lib/server/snapshot-cache", () => ({ getSnapshotCache: () => ({ getSnapshot: mocks.snapshot }) }));
vi.mock("@/lib/server/catalog-cache", () => ({ refreshCatalogSheet: mocks.refresh }));

import { assignWarehousePackage } from "@/lib/server/assign-warehouse-package";

const values = [
  ["Lô", "Kiện", "SKU", "SL", "Đại lý", "", "Tồn", "Kiện kho"],
  ["L1", "K1", "SKU1", "10", "", "", "10", ""],
  ["L2", "K1", "OTHER-LOT", "10", "", "", "10", ""],
  ["L1", "K2", "OTHER-PACKAGE", "10", "", "", "10", ""],
  ["L1", "K1", "SKU2", "20", "", "", "20", ""],
  ["L1", "K1", "", "", "", "", "", ""],
];

beforeEach(() => {
  vi.resetAllMocks();
  const parsed = parseSheet(values, "Tab");
  if (!parsed.ok) throw new Error(parsed.message);
  mocks.read.mockResolvedValue({ title: "Tab", rows: values });
  mocks.snapshot.mockReturnValue({ index: { rows: () => parsed.rows.filter((row) => row.lo === "L1" && row.kien === "K1") } });
  mocks.batch.mockResolvedValue({});
});

describe("assign warehouse package", () => {
  it("writes codes and the printed green color atomically only for matching SKU rows", async () => {
    await expect(assignWarehousePackage("file", 7, "snapshot", "L1", "K1", "1A1")).resolves.toMatchObject({ updatedRows: 2 });
    expect(mocks.batch).toHaveBeenCalledTimes(1);
    const { requests } = mocks.batch.mock.calls[0][0].requestBody;
    expect(requests).toHaveLength(4);
    expect(requests.filter((request: { updateCells?: unknown }) => request.updateCells).map((request: { updateCells: { start: unknown } }) => request.updateCells.start)).toEqual([
      { sheetId: 7, rowIndex: 1, columnIndex: 7 },
      { sheetId: 7, rowIndex: 4, columnIndex: 7 },
    ]);
    expect(requests.filter((request: { repeatCell?: unknown }) => request.repeatCell).map((request: { repeatCell: unknown }) => request.repeatCell)).toEqual([1, 4].map((rowIndex) => ({
      range: { sheetId: 7, startRowIndex: rowIndex, endRowIndex: rowIndex + 1, startColumnIndex: 0, endColumnIndex: 1 },
      cell: { userEnteredFormat: { backgroundColorStyle: { rgbColor: { red: 183 / 255, green: 225 / 255, blue: 205 / 255 } } } },
      fields: "userEnteredFormat.backgroundColorStyle",
    })));
    expect(mocks.refresh).toHaveBeenCalledWith("file", 7);
  });

  it("does not write or color when live package data changed", async () => {
    const changed = values.map((row) => [...row]);
    changed[1][3] = "99";
    mocks.read.mockResolvedValue({ title: "Tab", rows: changed });
    await expect(assignWarehousePackage("file", 7, "snapshot", "L1", "K1", "1A1")).rejects.toMatchObject({ code: "PACKAGE_DATA_CHANGED" });
    expect(mocks.batch).not.toHaveBeenCalled();
  });
});
