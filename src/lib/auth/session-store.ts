import "server-only";
import { createHash, randomBytes } from "node:crypto";

interface SessionRecord {
  tokenHash: string;
  expiresAt: number;
  createdAt: number;
}

export interface SessionStoreOptions {
  ttlSeconds: number;
  maxSessions?: number;
  now?: () => number;
}

export class SessionStore {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly ttlMs: number;
  private readonly maxSessions: number;
  private readonly now: () => number;

  constructor({ ttlSeconds, maxSessions = 256, now = Date.now }: SessionStoreOptions) {
    this.ttlMs = ttlSeconds * 1000;
    this.maxSessions = maxSessions;
    this.now = now;
  }

  create(): { token: string; expiresAt: Date } {
    this.prune();
    while (this.sessions.size >= this.maxSessions) {
      const oldest = this.sessions.keys().next().value as string | undefined;
      if (!oldest) break;
      this.sessions.delete(oldest);
    }

    const token = randomBytes(32).toString("base64url");
    const tokenHash = this.hash(token);
    const createdAt = this.now();
    const expiresAt = createdAt + this.ttlMs;
    this.sessions.set(tokenHash, { tokenHash, createdAt, expiresAt });
    return { token, expiresAt: new Date(expiresAt) };
  }

  validate(token: string | undefined): boolean {
    if (!token) return false;
    const tokenHash = this.hash(token);
    const session = this.sessions.get(tokenHash);
    if (!session) return false;
    if (session.expiresAt <= this.now()) {
      this.sessions.delete(tokenHash);
      return false;
    }
    return true;
  }

  revoke(token: string | undefined): void {
    if (token) this.sessions.delete(this.hash(token));
  }

  timing(token: string | undefined): { createdAt: number; expiresAt: number } | null {
    if (!this.validate(token)) return null;
    const session = this.sessions.get(this.hash(token!))!;
    return { createdAt: session.createdAt, expiresAt: session.expiresAt };
  }

  clear(): void {
    this.sessions.clear();
  }

  get size(): number {
    this.prune();
    return this.sessions.size;
  }

  private prune(): void {
    const now = this.now();
    for (const [key, session] of this.sessions) {
      if (session.expiresAt <= now) this.sessions.delete(key);
    }
  }

  private hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
