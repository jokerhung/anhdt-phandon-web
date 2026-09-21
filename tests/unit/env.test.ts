import { afterEach, describe, expect, it } from "vitest";
import { getEnv, resetEnvForTests } from "@/lib/server/env";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  resetEnvForTests();
});

function validEnv() {
  Object.assign(process.env, { NODE_ENV: "test" });
  process.env.ADMIN_USERNAME = "admin-test";
  process.env.ADMIN_PASSWORD = "password-test-at-least-16-chars";
  process.env.APP_ORIGIN = "http://localhost:3000";
}

describe("getEnv", () => {
  it("từ chối thiếu cấu hình bắt buộc mà không lộ giá trị", () => {
    delete process.env.ADMIN_USERNAME;
    process.env.ADMIN_PASSWORD = "secret-value-that-must-not-appear";
    process.env.APP_ORIGIN = "http://localhost:3000";
    resetEnvForTests();

    expect(() => getEnv()).toThrow("Cấu hình máy chủ không hợp lệ: ADMIN_USERNAME");
    try {
      getEnv();
    } catch (error) {
      expect(String(error)).not.toContain("secret-value-that-must-not-appear");
    }
  });

  it("từ chối password placeholder hoặc quá ngắn", () => {
    validEnv();
    process.env.ADMIN_PASSWORD = "REPLACE_WITH_A_LONG_UNIQUE_PASSWORD";
    resetEnvForTests();
    expect(() => getEnv()).toThrow("ADMIN_PASSWORD");

    process.env.ADMIN_PASSWORD = "too-short";
    resetEnvForTests();
    expect(() => getEnv()).toThrow("ADMIN_PASSWORD");
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
