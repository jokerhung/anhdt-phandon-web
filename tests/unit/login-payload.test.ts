import { describe, expect, it } from "vitest";
import { isJsonContentType, parseLoginBody } from "@/lib/auth/login-payload";

describe("parseLoginBody", () => {
  it("đọc body JSON do fetch gửi", () => {
    const result = parseLoginBody(
      JSON.stringify({ username: "phandon", password: "mat-khau", next: "/preview?lot=106" }),
      "application/json; charset=utf-8",
    );
    expect(result).toEqual({
      ok: true,
      payload: { username: "phandon", password: "mat-khau", next: "/preview?lot=106" },
    });
  });

  it("đọc body form-urlencoded khi trình duyệt submit form gốc", () => {
    const result = parseLoginBody(
      "username=phandon&password=mat+khau%21&next=%2Fpreview",
      "application/x-www-form-urlencoded",
    );
    expect(result).toEqual({
      ok: true,
      payload: { username: "phandon", password: "mat khau!", next: "/preview" },
    });
  });

  it("bỏ qua next khi form không gửi", () => {
    const result = parseLoginBody("username=phandon&password=abc", "application/x-www-form-urlencoded");
    expect(result).toEqual({ ok: true, payload: { username: "phandon", password: "abc" } });
  });

  it("báo malformed khi JSON hỏng", () => {
    expect(parseLoginBody("username=phandon&password=abc", "application/json")).toEqual({
      ok: false,
      reason: "malformed",
    });
    expect(parseLoginBody("", "application/json")).toEqual({ ok: false, reason: "malformed" });
    expect(parseLoginBody("[1,2]", "application/json")).toEqual({ ok: false, reason: "malformed" });
  });

  it("báo malformed với content-type lạ", () => {
    expect(parseLoginBody("{}", "text/plain")).toEqual({ ok: false, reason: "malformed" });
    expect(parseLoginBody("{}", null)).toEqual({ ok: false, reason: "malformed" });
  });

  it("báo invalid khi thiếu hoặc quá dài", () => {
    expect(parseLoginBody(JSON.stringify({ username: "", password: "x" }), "application/json")).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(
      parseLoginBody("username=phandon", "application/x-www-form-urlencoded"),
    ).toEqual({ ok: false, reason: "invalid" });
    expect(
      parseLoginBody(JSON.stringify({ username: "a".repeat(129), password: "x" }), "application/json"),
    ).toEqual({ ok: false, reason: "invalid" });
  });
});

describe("isJsonContentType", () => {
  it("nhận diện JSON và +json", () => {
    expect(isJsonContentType("application/json")).toBe(true);
    expect(isJsonContentType("application/json; charset=utf-8")).toBe(true);
    expect(isJsonContentType("application/ld+json")).toBe(true);
    expect(isJsonContentType("application/x-www-form-urlencoded")).toBe(false);
    expect(isJsonContentType(null)).toBe(false);
  });
});
