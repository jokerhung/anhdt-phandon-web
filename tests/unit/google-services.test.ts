import { beforeEach, describe, expect, it, vi } from "vitest";
import { DriveService, type DriveLike } from "@/lib/google/drive-service";
import { quoteA1Title, SheetsService, type SheetsLike } from "@/lib/google/sheets-service";
import { resetEnvForTests } from "@/lib/server/env";

beforeEach(() => { process.env.ADMIN_USERNAME = "test"; process.env.ADMIN_PASSWORD_HASH = "scrypt:v1:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"; process.env.APP_ORIGIN = "http://localhost:3000"; delete process.env.GOOGLE_DRIVE_FOLDER_ID; resetEnvForTests(); });

describe("Google adapters", () => {
  it("Drive theo hết phân trang", async () => {
    const list = vi.fn().mockResolvedValueOnce({ data: { files: [{ id: "1", name: "A" }], nextPageToken: "next" } }).mockResolvedValueOnce({ data: { files: [{ id: "2", name: "B" }] } });
    const drive = { files: { list, get: vi.fn() } } as unknown as DriveLike;
    expect(await new DriveService(drive).listSpreadsheets()).toEqual([{ id: "1", name: "A", modifiedTime: "" }, { id: "2", name: "B", modifiedTime: "" }]);
    expect(list).toHaveBeenCalledTimes(2);
  });

  it("folder scope được kiểm tra server-side", async () => {
    process.env.GOOGLE_DRIVE_FOLDER_ID = "allowed"; resetEnvForTests();
    const drive = { files: { list: vi.fn(), get: vi.fn().mockResolvedValue({ data: { id: "file", mimeType: "application/vnd.google-apps.spreadsheet", trashed: false, parents: ["other"] } }) } } as unknown as DriveLike;
    await expect(new DriveService(drive).assertAllowed("file")).rejects.toMatchObject({ code: "GOOGLE_NOT_FOUND" });
  });

  it("quote title và đọc FORMATTED_VALUE/ROWS theo sheetId", async () => {
    expect(quoteA1Title("O'Brien")).toBe("'O''Brien'");
    const sheets = { spreadsheets: { get: vi.fn().mockResolvedValue({ data: { sheets: [{ properties: { sheetId: 7, title: "O'Brien" } }] } }), values: { get: vi.fn().mockResolvedValue({ data: { values: [["00123"]] } }) } } } as unknown as SheetsLike;
    const drive = { assertAllowed: vi.fn() };
    const service = new SheetsService(sheets, drive as never);
    expect(await service.readValues("file", 7)).toEqual({ title: "O'Brien", rows: [["00123"]] });
    expect(sheets.spreadsheets.values.get).toHaveBeenCalledWith(expect.objectContaining({ range: "'O''Brien'", valueRenderOption: "FORMATTED_VALUE", majorDimension: "ROWS" }));
  });
});
