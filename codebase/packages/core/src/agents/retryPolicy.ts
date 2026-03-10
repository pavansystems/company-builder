import { AgentLLMError, AgentTimeoutError } from './AgentError';

function isRetryableError(error: unknown): boolean {
  if (error instanceof AgentTimeoutError) {
    return true;
  }

  // Check for Anthropic API error status codes
  if (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  ) {
    const status = (error as { status: number }).status;
    // Retry on rate limit, server errors, and overload
    return status === 429 || status === 500 || status === 529;
  }

  // Check for error messages indicating transient failures
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('rate limit') ||
      msg.includes('timeout') ||
      msg.includes('overloaded') ||
      msg.includes('529') ||
      msg.includes('500') ||
      msg.includes('429')
    );
  }

  return false;
}

function isNonRetryableError(error: unknown): boolean {
  if (error instanceof AgentLLMError) {
    // Check if the underlying cause is a 400 or 401
    if (
      error.cause !== null &&
      typeof error.cause === 'object' &&
      'status' in error.cause &&
      typeof (error.cause as { status: unknown }).status === 'number'
    ) {
      const status = (error.cause as { status: number }).status;
      return status === 400 || status === 401;
    }
  }

  if (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  ) {
    const status = (error as { status: number }).status;
    // Do not retry on bad request or auth errors
    return status === 400 || status === 401;
  }

  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Never retry on 400 bad request or 401 auth errors
      if (isNonRetryableError(error)) {
        throw error;
      }

      // Only retry on known transient errors
      if (!isRetryableError(error)) {
        throw error;
      }

      if (attempt < maxAttempts) {
        // Exponential backoff with jitter
        const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.3 * exponentialDelay;
        const delayMs = Math.floor(exponentialDelay + jitter);

        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}
