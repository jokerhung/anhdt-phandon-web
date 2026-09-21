import { describe, expect, it } from "vitest";
import { unauthorizedResponse } from "@/lib/auth/auth-service";

describe("API auth guard response", () => {
  it("trả 401 và không cho cache công khai", async () => {
    const response = unauthorizedResponse();
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toMatchObject({ error: "UNAUTHORIZED" });
  });
});
