import "server-only";
import type { sheets_v4 } from "googleapis";
import { getGoogleClients } from "@/lib/google/client";
import { withGoogleRetry } from "@/lib/google/retry";

/** True when the basic filter really hides rows (some column has a condition or hidden values). */
function isFiltering(filter: sheets_v4.Schema$BasicFilter | null | undefined): boolean {
  if (!filter) return false;
  const specs = [...Object.values(filter.criteria ?? {}), ...(filter.filterSpecs ?? []).map((spec) => spec.filterCriteria ?? {})];
  return specs.some((spec) => spec && Object.keys(spec).length > 0);
}

/**
 * Write to Google Sheets after clearing any active filter on the tab, so every row
 * of the package is visible while it is colored and filled. The filter range and its
 * sort rules stay in place; only the hiding conditions are removed.
 * Errors are thrown as-is so callers keep mapping them with mapGoogleError.
 */
export async function applyUpdatesClearingFilter(fileId: string, sheetId: number, requests: sheets_v4.Schema$Request[]): Promise<{ filterCleared: boolean }> {
  const { sheets } = getGoogleClients();
  const meta = await withGoogleRetry(() => sheets.spreadsheets.get({ spreadsheetId: fileId, fields: "sheets(properties(sheetId),basicFilter(range,sortSpecs,criteria,filterSpecs))" }));
  const filter = meta.data.sheets?.find((sheet) => sheet.properties?.sheetId === sheetId)?.basicFilter;
  const unfilter: sheets_v4.Schema$Request[] = filter && filter.range && isFiltering(filter)
    ? [{ setBasicFilter: { filter: { range: filter.range, ...(filter.sortSpecs?.length ? { sortSpecs: filter.sortSpecs } : {}) } } }]
    : [];
  await withGoogleRetry(() => sheets.spreadsheets.batchUpdate({ spreadsheetId: fileId, requestBody: { requests: [...unfilter, ...requests] } }));
  return { filterCleared: unfilter.length > 0 };
}
