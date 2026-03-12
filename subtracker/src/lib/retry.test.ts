import { describe, it, expect } from "vitest";
import { calculateDelay, isRetryableError, withRetry } from "./retry";

describe("calculateDelay", () => {
  it("increases exponentially with attempt", () => {
    const d0 = calculateDelay(0, 200, 5000);
    const d1 = calculateDelay(1, 200, 5000);
    const d2 = calculateDelay(2, 200, 5000);
    // Each should be roughly 2x the previous (plus jitter)
    expect(d1).toBeGreaterThan(d0);
    expect(d2).toBeGreaterThan(d1);
  });

  it("caps at maxDelayMs", () => {
    const delay = calculateDelay(20, 200, 5000);
    expect(delay).toBeLessThanOrEqual(5000);
  });
});

describe("isRetryableError", () => {
  it("returns true for network errors", () => {
    expect(isRetryableError(new Error("ETIMEDOUT"))).toBe(true);
    expect(isRetryableError(new Error("ECONNRESET"))).toBe(true);
    expect(isRetryableError(new Error("ECONNREFUSED"))).toBe(true);
    expect(isRetryableError(new Error("fetch failed"))).toBe(true);
  });

  it("returns false for non-network errors", () => {
    expect(isRetryableError(new Error("validation failed"))).toBe(false);
    expect(isRetryableError(new Error("not found"))).toBe(false);
  });

  it("returns false for non-Error values", () => {
    expect(isRetryableError("string error")).toBe(false);
    expect(isRetryableError(null)).toBe(false);
  });
});

describe("withRetry", () => {
  it("returns result on first success", async () => {
    const result = await withRetry(() => Promise.resolve(42));
    expect(result).toBe(42);
  });

  it("throws non-retryable errors immediately", async () => {
    let attempts = 0;
    await expect(
      withRetry(() => {
        attempts++;
        throw new Error("validation failed");
      })
    ).rejects.toThrow("validation failed");
    expect(attempts).toBe(1);
  });

  it("retries retryable errors up to maxRetries", async () => {
    let attempts = 0;
    await expect(
      withRetry(
        () => {
          attempts++;
          throw new Error("ECONNRESET");
        },
        { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 10 }
      )
    ).rejects.toThrow("ECONNRESET");
    expect(attempts).toBe(3); // initial + 2 retries
  });

  it("succeeds after transient failures", async () => {
    let attempts = 0;
    const result = await withRetry(
      () => {
        attempts++;
        if (attempts < 3) throw new Error("ETIMEDOUT");
        return Promise.resolve("ok");
      },
      { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 10 }
    );
    expect(result).toBe("ok");
    expect(attempts).toBe(3);
  });
});
