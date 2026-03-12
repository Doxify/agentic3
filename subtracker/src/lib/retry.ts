import type { RetryConfig } from "./types";

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 200,
  maxDelayMs: 5000,
};

/** Calculate exponential backoff delay with jitter */
export const calculateDelay = (
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number => {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * baseDelayMs;
  return Math.min(exponential + jitter, maxDelayMs);
};

/** Determine whether an error is retryable */
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    // Network / timeout errors
    if (error.message.includes("ETIMEDOUT")) return true;
    if (error.message.includes("ECONNRESET")) return true;
    if (error.message.includes("ECONNREFUSED")) return true;
    if (error.message.includes("fetch failed")) return true;
  }
  return false;
};

/** Sleep for a given duration */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Execute an async function with retry logic and exponential backoff.
 * Only retries on transient/network errors; business errors throw immediately.
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> => {
  const { maxRetries, baseDelayMs, maxDelayMs } = { ...DEFAULT_CONFIG, ...config };

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }

      const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs);
      await sleep(delay);
    }
  }

  throw lastError;
};
