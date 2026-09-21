import { describe, expect, it } from "vitest";
import { LoginRateLimiter } from "@/lib/auth/rate-limit";

describe("LoginRateLimiter", () => {
  it("chặn sau 5 lần sai và mở lại sau cửa sổ", () => {
    let now = 0;
    const limiter = new LoginRateLimiter(5, 1_000, 100, () => now);
    for (let index = 0; index < 5; index += 1) limiter.recordFailure("ip");
    expect(limiter.check("ip").allowed).toBe(false);
    now = 1_001;
    expect(limiter.check("ip").allowed).toBe(true);
  });

  it("reset sau đăng nhập đúng", () => {
    const limiter = new LoginRateLimiter(1);
    limiter.recordFailure("ip");
    limiter.reset("ip");
    expect(limiter.check("ip").allowed).toBe(true);
  });
});
