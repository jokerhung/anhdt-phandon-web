import "server-only";
import type { sheets_v4 } from "googleapis";
import { getGoogleClients } from "@/lib/google/client";
import { mapGoogleError } from "@/lib/google/errors";
import { withGoogleRetry } from "@/lib/google/retry";
import { DriveService } from "@/lib/google/drive-service";

export interface SheetTab { sheetId: number; title: string }
export interface SheetsLike { spreadsheets: { get(params: sheets_v4.Params$Resource$Spreadsheets$Get): Promise<{ data: sheets_v4.Schema$Spreadsheet }>; values: { get(params: sheets_v4.Params$Resource$Spreadsheets$Values$Get): Promise<{ data: sheets_v4.Schema$ValueRange }> } } }

export function quoteA1Title(title: string): string { return `'${title.replaceAll("'", "''")}'`; }

export class SheetsService {
  constructor(private readonly sheets: SheetsLike = getGoogleClients().sheets, private readonly drive = new DriveService()) {}

  async listTabs(fileId: string): Promise<SheetTab[]> {
    await this.drive.assertAllowed(fileId);
    try {
      const response = await withGoogleRetry(() => this.sheets.spreadsheets.get({ spreadsheetId: fileId, fields: "sheets.properties(sheetId,title)" }));
      return (response.data.sheets ?? []).flatMap((sheet) => {
        const id = sheet.properties?.sheetId; const title = sheet.properties?.title;
        return typeof id === "number" && title ? [{ sheetId: id, title }] : [];
      });
    } catch (error) { throw mapGoogleError(error); }
  }

  async readValues(fileId: string, sheetId: number): Promise<{ title: string; rows: string[][] }> {
    const tabs = await this.listTabs(fileId);
    const tab = tabs.find((item) => item.sheetId === sheetId);
    if (!tab) throw mapGoogleError(Object.assign(new Error("sheet missing"), { code: 404 }));
    try {
      const response = await withGoogleRetry(() => this.sheets.spreadsheets.values.get({ spreadsheetId: fileId, range: quoteA1Title(tab.title), valueRenderOption: "FORMATTED_VALUE", majorDimension: "ROWS" }));
      return { title: tab.title, rows: (response.data.values ?? []).map((row) => row.map((cell) => String(cell ?? ""))) };
    } catch (error) { throw mapGoogleError(error); }
  }
}
