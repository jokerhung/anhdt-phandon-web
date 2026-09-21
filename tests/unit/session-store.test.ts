import { describe, expect, it } from "vitest";
import { SessionStore } from "@/lib/auth/session-store";

describe("SessionStore", () => {
  it("tạo, xác thực và thu hồi token", () => {
    const now = 1_000;
    const store = new SessionStore({ ttlSeconds: 60, now: () => now });
    const { token } = store.create();
    expect(store.validate(token)).toBe(true);
    store.revoke(token);
    expect(store.validate(token)).toBe(false);
  });

  it("từ chối token hết hạn tuyệt đối", () => {
    let now = 1_000;
    const store = new SessionStore({ ttlSeconds: 1, now: () => now });
    const { token } = store.create();
    now += 1_001;
    expect(store.validate(token)).toBe(false);
  });

  it("giới hạn số session", () => {
    const store = new SessionStore({ ttlSeconds: 60, maxSessions: 2 });
    const first = store.create().token;
    store.create();
    store.create();
    expect(store.size).toBe(2);
    expect(store.validate(first)).toBe(false);
  });
});
