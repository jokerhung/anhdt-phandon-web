import "server-only";
import { google, type drive_v3, type sheets_v4 } from "googleapis";
import { GoogleDataError } from "@/lib/google/errors";
import { getEnv } from "@/lib/server/env";

export interface GoogleClients { drive: drive_v3.Drive; sheets: sheets_v4.Sheets }
let clients: GoogleClients | undefined;

export function getGoogleClients(): GoogleClients {
  if (clients) return clients;
  const credentials = getEnv().GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!credentials) throw new GoogleDataError("GOOGLE_CONFIG", "Máy chủ chưa cấu hình khóa Google service account.", 503);
  const auth = new google.auth.GoogleAuth({
    keyFile: credentials,
    scopes: ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  clients = { drive: google.drive({ version: "v3", auth }), sheets: google.sheets({ version: "v4", auth }) };
  return clients;
}
