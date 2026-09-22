import { afterEach, describe, expect, it } from "vitest";
import { getEnv, resetEnvForTests } from "@/lib/server/env";
import { hashPassword } from "@/lib/auth/password-hash";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  resetEnvForTests();
});

function validEnv() {
  Object.assign(process.env, { NODE_ENV: "test" });
  process.env.ADMIN_USERNAME = "admin-test";
  process.env.ADMIN_PASSWORD_HASH = "scrypt:v1:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  process.env.APP_ORIGIN = "http://localhost:3000";
}

describe("getEnv", () => {
  it("từ chối thiếu cấu hình bắt buộc mà không lộ giá trị", () => {
    delete process.env.ADMIN_USERNAME;
    process.env.ADMIN_PASSWORD_HASH = "not-a-valid-password-hash";
    process.env.APP_ORIGIN = "http://localhost:3000";
    resetEnvForTests();

    expect(() => getEnv()).toThrow("Cấu hình máy chủ không hợp lệ: ADMIN_USERNAME");
    try {
      getEnv();
    } catch (error) {
      expect(String(error)).not.toContain("not-a-valid-password-hash");
    }
  });

  it("từ chối password hash placeholder hoặc sai định dạng", () => {
    validEnv();
    process.env.ADMIN_PASSWORD_HASH = "scrypt:v1:REPLACE_WITH_SALT:REPLACE_WITH_HASH";
    resetEnvForTests();
    expect(() => getEnv()).toThrow("ADMIN_PASSWORD_HASH");

    process.env.ADMIN_PASSWORD_HASH = "plaintext-is-not-accepted";
    resetEnvForTests();
    expect(() => getEnv()).toThrow("ADMIN_PASSWORD_HASH");
  });

  it("chấp nhận hash được tạo bởi scrypt", async () => {
    validEnv();
    process.env.ADMIN_PASSWORD_HASH = await hashPassword("password-test-at-least-16-chars");
    resetEnvForTests();
    expect(getEnv().ADMIN_PASSWORD_HASH).toMatch(/^scrypt:v1:/);
  });

  it("từ chối production không HTTPS, username mặc định hoặc thiếu Google credential", () => {
    validEnv();
    Object.assign(process.env, { NODE_ENV: "production" });
    process.env.ADMIN_USERNAME = "admin";
    process.env.APP_ORIGIN = "http://example.com";
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    resetEnvForTests();
    expect(() => getEnv()).toThrow("Cấu hình máy chủ không hợp lệ");
  });

  it("parse TTL và trusted proxy an toàn", () => {
    validEnv();
    process.env.SESSION_TTL_SECONDS = "3600";
    process.env.TRUST_PROXY = "true";
    resetEnvForTests();
    const env = getEnv();
    expect(env.SESSION_TTL_SECONDS).toBe(3600);
    expect(env.TRUST_PROXY).toBe(true);
  });
});

