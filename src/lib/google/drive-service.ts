import "server-only";
import type { drive_v3 } from "googleapis";
import { getGoogleClients } from "@/lib/google/client";
import { mapGoogleError } from "@/lib/google/errors";
import { withGoogleRetry } from "@/lib/google/retry";
import { getEnv } from "@/lib/server/env";

export interface SpreadsheetFile { id: string; name: string; modifiedTime: string }
export interface DriveLike { files: { list(params: drive_v3.Params$Resource$Files$List): Promise<{ data: drive_v3.Schema$FileList }>; get(params: drive_v3.Params$Resource$Files$Get): Promise<{ data: drive_v3.Schema$File }> } }

export class DriveService {
  constructor(private readonly drive: DriveLike = getGoogleClients().drive) {}

  async listSpreadsheets(): Promise<SpreadsheetFile[]> {
    const folderId = getEnv().GOOGLE_DRIVE_FOLDER_ID?.trim();
    const query = "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false" + (folderId ? ` and '${folderId.replaceAll("'", "\\'")}' in parents` : "");
    const files: SpreadsheetFile[] = [];
    let pageToken: string | undefined;
    try {
      do {
        const response = await withGoogleRetry(() => this.drive.files.list({ q: query, orderBy: "modifiedTime desc", fields: "nextPageToken,files(id,name,modifiedTime)", pageSize: 1000, pageToken }));
        for (const file of response.data.files ?? []) if (file.id && file.name) files.push({ id: file.id, name: file.name, modifiedTime: file.modifiedTime ?? "" });
        pageToken = response.data.nextPageToken ?? undefined;
      } while (pageToken);
      return files;
    } catch (error) { throw mapGoogleError(error); }
  }

  async assertAllowed(fileId: string): Promise<void> {
    const folderId = getEnv().GOOGLE_DRIVE_FOLDER_ID?.trim();
    try {
      const response = await withGoogleRetry(() => this.drive.files.get({ fileId, fields: "id,mimeType,trashed,parents" }));
      const file = response.data;
      const valid = file.id === fileId && file.mimeType === "application/vnd.google-apps.spreadsheet" && !file.trashed && (!folderId || file.parents?.includes(folderId));
      if (!valid) throw Object.assign(new Error("not allowed"), { code: 404 });
    } catch (error) { throw mapGoogleError(error); }
  }
}
