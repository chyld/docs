// tests/health.test.ts
import { describe, test, expect } from "bun:test";

describe("Basic GET documents", () => {
  test("returns 200", async () => {
    const res = await fetch("http://localhost:3000/api/documents");
    expect(res.status).toBe(200);
  });
});

