import "server-only";
import { randomUUID } from "node:crypto";
import { LabelIndex, parseSheet, type SheetRow } from "@/lib/domain";
import { SheetsService } from "@/lib/google/sheets-service";
import { DomainDataError, SnapshotExpiredError } from "@/lib/server/api";
import { getEnv } from "@/lib/server/env";

export interface Snapshot {
  id: string; fileId: string; sheetId: number; title: string; fetchedAt: string;
  rows: SheetRow[]; index: LabelIndex;
}

interface SnapshotCacheOptions { ttlSeconds?: number; retentionSeconds?: number; maxSources?: number; maxSnapshots?: number; now?: () => number }

export class SnapshotCache {
  private readonly current = new Map<string, Snapshot>();
  private readonly snapshots = new Map<string, { snapshot: Snapshot; expiresAt: number }>();
  private readonly inflight = new Map<string, Promise<Snapshot>>();
  private readonly ttlMs: number; private readonly retentionMs: number; private readonly maxSources: number; private readonly maxSnapshots: number; private readonly now: () => number;

  constructor(private readonly sheets = new SheetsService(), options: SnapshotCacheOptions = {}) {
    this.ttlMs = (options.ttlSeconds ?? getEnv().SHEETS_CACHE_TTL_SECONDS) * 1000;
    this.retentionMs = (options.retentionSeconds ?? Math.max(300, (options.ttlSeconds ?? getEnv().SHEETS_CACHE_TTL_SECONDS) * 5)) * 1000;
    this.maxSources = options.maxSources ?? 20; this.maxSnapshots = options.maxSnapshots ?? 60; this.now = options.now ?? Date.now;
  }

  async getOrLoad(fileId: string, sheetId: number): Promise<Snapshot> {
    this.prune(); const key = this.key(fileId, sheetId); const existing = this.current.get(key);
    if (existing && this.now() - Date.parse(existing.fetchedAt) <= this.ttlMs) return existing;
    return this.load(fileId, sheetId, false);
  }

  async refresh(fileId: string, sheetId: number): Promise<Snapshot> { return this.load(fileId, sheetId, true); }

  getSnapshot(fileId: string, sheetId: number, snapshotId: string): Snapshot {
    this.prune(); const entry = this.snapshots.get(snapshotId);
    if (!entry || entry.snapshot.fileId !== fileId || entry.snapshot.sheetId !== sheetId) throw new SnapshotExpiredError();
    return entry.snapshot;
  }

  private load(fileId: string, sheetId: number, force: boolean): Promise<Snapshot> {
    const key = this.key(fileId, sheetId); const pending = this.inflight.get(key);
    if (pending) return pending;
    const promise = (async () => {
      if (!force) { const existing = this.current.get(key); if (existing && this.now() - Date.parse(existing.fetchedAt) <= this.ttlMs) return existing; }
      const data = await this.sheets.readValues(fileId, sheetId, force);
      const parsed = parseSheet(data.rows, data.title);
      if (!parsed.ok) throw new DomainDataError("SHEET_FORMAT", parsed.message);
      const snapshot: Snapshot = { id: randomUUID(), fileId, sheetId, title: data.title, fetchedAt: new Date(this.now()).toISOString(), rows: parsed.rows, index: LabelIndex.fromRows(parsed.rows) };
      this.publish(key, snapshot); return snapshot;
    })().finally(() => this.inflight.delete(key));
    this.inflight.set(key, promise); return promise;
  }

  private publish(key: string, snapshot: Snapshot) {
    if (!this.current.has(key) && this.current.size >= this.maxSources) this.current.delete(this.current.keys().next().value as string);
    this.current.delete(key); this.current.set(key, snapshot);
    this.snapshots.set(snapshot.id, { snapshot, expiresAt: this.now() + this.retentionMs });
    while (this.snapshots.size > this.maxSnapshots) this.snapshots.delete(this.snapshots.keys().next().value as string);
  }
  private prune() { for (const [id, entry] of this.snapshots) if (entry.expiresAt <= this.now()) this.snapshots.delete(id); }
  private key(fileId: string, sheetId: number) { return `${fileId}:${sheetId}`; }
}

declare global { var __phanDonSnapshotCache: SnapshotCache | undefined }
export function getSnapshotCache(): SnapshotCache { globalThis.__phanDonSnapshotCache ??= new SnapshotCache(); return globalThis.__phanDonSnapshotCache; }
