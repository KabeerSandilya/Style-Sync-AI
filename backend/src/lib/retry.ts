const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 1000;

export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  baseDelayMs = DEFAULT_BASE_DELAY_MS
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = baseDelayMs * 2 ** (attempt - 1);
        console.warn(`[retry] ${label} attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms.`, error);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`[retry] ${label} failed after ${maxAttempts} attempts.`, lastError);
  throw lastError;
}
