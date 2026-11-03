export const LOOKUP_PREFERENCE_KEY = "phan-don:last-source:v1";

export interface LookupPreference {
  fileId: string;
  sheetId?: number;
  lot?: string;
}

/** Only IDs are remembered. Names, sheet rows, snapshots and credentials are never stored. */
export function readLookupPreference(storage: Pick<Storage, "getItem" | "removeItem">): LookupPreference | null {
  try {
    const raw = storage.getItem(LOOKUP_PREFERENCE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || !("fileId" in parsed) ||
      typeof parsed.fileId !== "string" || !/^[A-Za-z0-9_-]{1,256}$/.test(parsed.fileId)) {
      storage.removeItem(LOOKUP_PREFERENCE_KEY);
      return null;
    }
    const sheetId = "sheetId" in parsed ? parsed.sheetId : undefined;
    if (sheetId !== undefined && (typeof sheetId !== "number" || !Number.isSafeInteger(sheetId) || sheetId < 0)) {
      storage.removeItem(LOOKUP_PREFERENCE_KEY);
      return null;
    }
    const lot = "lot" in parsed ? parsed.lot : undefined;
    if (lot !== undefined && (typeof lot !== "string" || lot.length < 1 || lot.length > 256)) {
      storage.removeItem(LOOKUP_PREFERENCE_KEY);
      return null;
    }
    return { fileId: parsed.fileId, ...(sheetId === undefined ? {} : { sheetId }), ...(lot === undefined ? {} : { lot }) };
  } catch {
    return null;
  }
}

export function saveLookupPreference(storage: Pick<Storage, "setItem">, preference: LookupPreference): void {
  try { storage.setItem(LOOKUP_PREFERENCE_KEY, JSON.stringify(preference)); } catch { /* Storage may be disabled. Lookup remains usable. */ }
}

export function clearLookupPreference(storage: Pick<Storage, "removeItem">): void {
  try { storage.removeItem(LOOKUP_PREFERENCE_KEY); } catch { /* Storage may be disabled. */ }
}
