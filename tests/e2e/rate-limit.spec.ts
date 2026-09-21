import { expect, test } from "@playwright/test";

test("API login chặn origin khác và rate limit có Retry-After", async ({ request }) => {
  const crossOrigin = await request.post("/api/auth/login", {
    headers: { Origin: "https://invalid.example" },
    data: { username: "bad", password: "bad" },
  });
  expect(crossOrigin.status()).toBe(403);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await request.post("/api/auth/login", {
      headers: { Origin: "http://127.0.0.1:3001" },
      data: { username: "bad", password: "bad" },
    });
    expect(response.status()).toBe(401);
  }

  const limited = await request.post("/api/auth/login", {
    headers: { Origin: "http://127.0.0.1:3001" },
    data: { username: "bad", password: "bad" },
  });
  expect(limited.status()).toBe(429);
  expect(Number(limited.headers()["retry-after"])).toBeGreaterThan(0);
});
