import { describe, expect, it } from "vitest";
import { hashPassword, verifyPasswordHash } from "@/lib/auth/password-hash";

describe("password hash", () => {
  it("tạo scrypt hash có salt và xác minh đúng mật khẩu", async () => {
    const hash = await hashPassword("password-test-at-least-16-chars");
    expect(hash).toMatch(/^scrypt:v1:/);
    await expect(verifyPasswordHash("password-test-at-least-16-chars", hash)).resolves.toBe(true);
    await expect(verifyPasswordHash("wrong-password", hash)).resolves.toBe(false);
  });

  it("tạo salt khác nhau cho cùng mật khẩu", async () => {
    const first = await hashPassword("password-test-at-least-16-chars");
    const second = await hashPassword("password-test-at-least-16-chars");
    expect(first).not.toBe(second);
  });

  it("từ chối hash hỏng và mật khẩu ngắn", async () => {
    await expect(verifyPasswordHash("candidate", "invalid")).resolves.toBe(false);
    await expect(hashPassword("too-short")).rejects.toThrow("ít nhất 16 ký tự");
  });
});

