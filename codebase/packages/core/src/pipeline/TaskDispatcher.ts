import type { AgentInput, AgentOutput } from '@company-builder/types';
import { withRetry } from '../agents/retryPolicy';
import { logger, type Logger } from '../utils/logger';

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
};

export class TaskDispatcher {
  private readonly retryConfig: RetryConfig;
  private readonly log: Logger;

  constructor(
    private readonly baseUrl: string,
    private readonly cronSecret: string,
    retryConfig?: Partial<RetryConfig>,
  ) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    this.log = logger.child({ service: 'TaskDispatcher' });
  }

  /**
   * Dispatches an agent task without waiting for the result.
   * Makes a fire-and-forget POST to /api/agents/[agentName].
   */
  async dispatch(agentName: string, input: AgentInput): Promise<void> {
    const url = `${this.baseUrl}/api/agents/${agentName}`;

    this.log.info('Dispatching agent task', { agentName, url });

    // Fire-and-forget: intentionally not awaiting the response
    withRetry(
      () =>
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.cronSecret}`,
          },
          body: JSON.stringify(input),
        }),
      this.retryConfig.maxAttempts,
      this.retryConfig.baseDelayMs,
    ).catch((error: unknown) => {
      // Log dispatch errors but don't surface them — this is fire-and-forget
      this.log.error('Failed to dispatch agent task', {
        agentName,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  /**
   * Dispatches an agent task and waits for the result.
   * Makes a POST to /api/agents/[agentName] and awaits the response.
   */
  async dispatchAndWait(agentName: string, input: AgentInput): Promise<AgentOutput> {
    const url = `${this.baseUrl}/api/agents/${agentName}`;

    this.log.info('Dispatching agent task (awaiting result)', { agentName, url });

    const result = await withRetry(
      async () => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.cronSecret}`,
          },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '(unreadable body)');
          this.log.warn('Dispatch attempt failed', {
            agentName,
            httpStatus: response.status,
            maxAttempts: this.retryConfig.maxAttempts,
          });
          const err = new Error(
            `Agent dispatch failed for ${agentName}: HTTP ${response.status} — ${body}`,
          );
          // Attach status so retryPolicy can classify retryable vs non-retryable
          (err as Error & { status: number }).status = response.status;
          throw err;
        }

        return (await response.json()) as AgentOutput;
      },
      this.retryConfig.maxAttempts,
      this.retryConfig.baseDelayMs,
    );

    return result;
  }
}
