import "server-only";
import { DriveService, type SpreadsheetFile } from "@/lib/google/drive-service";
import { SheetsService, type SheetTab } from "@/lib/google/sheets-service";
import { DomainDataError } from "@/lib/server/api";
import { SnapshotCache, publishSnapshotCache, type Snapshot } from "@/lib/server/snapshot-cache";

interface Catalog {
  files: SpreadsheetFile[];
  tabs: Map<string, SheetTab[]>;
  snapshots: Map<string, Snapshot>;
  errors: Map<string, DomainDataError>;
  fetchedAt: string;
  cache: SnapshotCache;
  pendingTabs: Map<string, Promise<SheetTab[]>>;
}
const key = (fileId: string, sheetId: number) => `${fileId}:${sheetId}`;

async function loadCatalog(): Promise<Catalog> {
  const drive = new DriveService();
  const sheets = new SheetsService();
  const files = await drive.listSpreadsheets(true);
  const tabs = new Map<string, SheetTab[]>();
  const cache = new SnapshotCache({
    readValues: async (fileId, sheetId, force) => {
      // A timed refresh rechecks access and resolves the current tab title.
      if (force) return sheets.readValues(fileId, sheetId, true);
      const tab = tabs.get(fileId)?.find((item) => item.sheetId === sheetId);
      if (!tab) throw new DomainDataError("SHEET_NOT_FOUND", "Tab không có trong cache. Hãy bấm Làm mới.", 404);
      return sheets.readTabValues(fileId, tab.title);
    },
  }, { ttlSeconds: Infinity, retentionSeconds: Infinity, maxSources: Infinity, maxSnapshots: Infinity });
  const snapshots = new Map<string, Snapshot>();
  const errors = new Map<string, DomainDataError>();
  // Atomic replacement; removed files and old preview IDs disappear together.
  publishSnapshotCache(cache);
  return { files, tabs, snapshots, errors, cache, pendingTabs: new Map(), fetchedAt: new Date().toISOString() };
}

declare global {
  var __phanDonCatalog: Catalog | undefined;
  var __phanDonCatalogPending: Promise<Catalog> | undefined;
  var __phanDonCatalogError: unknown;
}

export async function getCatalog(force = false): Promise<Catalog> {
  if (globalThis.__phanDonCatalogPending) return globalThis.__phanDonCatalogPending;
  if (!force && globalThis.__phanDonCatalog) return globalThis.__phanDonCatalog;
  if (!force && globalThis.__phanDonCatalogError) throw globalThis.__phanDonCatalogError;
  globalThis.__phanDonCatalogPending = loadCatalog().then((catalog) => {
    globalThis.__phanDonCatalog = catalog;
    globalThis.__phanDonCatalogError = undefined;
    return catalog;
  }).catch((error) => {
    globalThis.__phanDonCatalogError = error;
    throw error;
  }).finally(() => { globalThis.__phanDonCatalogPending = undefined; });
  return globalThis.__phanDonCatalogPending;
}

export async function getCatalogTabs(fileId: string): Promise<SheetTab[]> {
  return loadTabs(await getCatalog(), fileId);
}

async function loadTabs(catalog: Catalog, fileId: string): Promise<SheetTab[]> {
  if (!catalog.files.some((file) => file.id === fileId)) throw new DomainDataError("FILE_NOT_FOUND", "File không có trong cache. Hãy bấm Làm mới.", 404);
  const cached = catalog.tabs.get(fileId);
  if (cached) return cached;
  const pending = catalog.pendingTabs.get(fileId);
  if (pending) return pending;
  const task = new SheetsService().listTabs(fileId, true).then((tabs) => {
    catalog.tabs.set(fileId, tabs);
    return tabs;
  }).finally(() => catalog.pendingTabs.delete(fileId));
  catalog.pendingTabs.set(fileId, task);
  return task;
}

export async function getCatalogSnapshot(fileId: string, sheetId: number): Promise<Snapshot> {
  const catalog = await getCatalog();
  const tabs = await loadTabs(catalog, fileId);
  if (!tabs.some((tab) => tab.sheetId === sheetId)) throw new DomainDataError("SHEET_NOT_FOUND", "Tab không có trong cache. Hãy bấm Làm mới.", 404);
  const error = catalog.errors.get(key(fileId, sheetId));
  if (error) throw error;
  const cached = catalog.snapshots.get(key(fileId, sheetId));
  if (cached) return cached;
  try {
    const snapshot = await catalog.cache.getOrLoad(fileId, sheetId);
    // A refresh may replace the generation while a slow sheet is loading.
    if (catalog !== globalThis.__phanDonCatalog) throw new DomainDataError("CACHE_CHANGED", "Cache đã được làm mới. Vui lòng chọn lại tab.", 409);
    catalog.snapshots.set(key(fileId, sheetId), snapshot);
    return snapshot;
  } catch (error) {
    if (error instanceof DomainDataError && error.code === "SHEET_FORMAT") catalog.errors.set(key(fileId, sheetId), error);
    throw error;
  }
}

export async function refreshCatalogSheet(fileId: string, sheetId: number): Promise<Catalog> {
  const catalog = await getCatalog();
  if (!catalog.files.some((file) => file.id === fileId)) throw new DomainDataError("FILE_NOT_FOUND", "File không có trong cache. Hãy bấm Làm mới.", 404);
  const snapshot = await catalog.cache.refresh(fileId, sheetId);
  if (catalog !== globalThis.__phanDonCatalog) throw new DomainDataError("CACHE_CHANGED", "Cache đã được làm mới. Vui lòng chọn lại tab.", 409);
  catalog.errors.delete(key(fileId, sheetId));
  catalog.snapshots.set(key(fileId, sheetId), snapshot);
  const tab = catalog.tabs.get(fileId)?.find((item) => item.sheetId === sheetId);
  if (tab) tab.title = snapshot.title;
  return catalog;
}
