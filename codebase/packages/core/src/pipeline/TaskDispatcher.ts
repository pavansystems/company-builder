import type { AgentInput, AgentOutput } from '@company-builder/types';
import { logger } from '../utils/logger';

export class TaskDispatcher {
  constructor(
    private readonly baseUrl: string,
    private readonly cronSecret: string,
  ) {}

  /**
   * Dispatches an agent task without waiting for the result.
   * Makes a fire-and-forget POST to /api/agents/[agentName].
   */
  async dispatch(agentName: string, input: AgentInput): Promise<void> {
    const url = `${this.baseUrl}/api/agents/${agentName}`;

    logger.info('Dispatching agent task', { agentName, url });

    // Fire-and-forget: intentionally not awaiting the response
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.cronSecret}`,
      },
      body: JSON.stringify(input),
    }).catch((error: unknown) => {
      // Log dispatch errors but don't surface them — this is fire-and-forget
      logger.error('Failed to dispatch agent task', {
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

    logger.info('Dispatching agent task (awaiting result)', { agentName, url });

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
      throw new Error(
        `Agent dispatch failed for ${agentName}: HTTP ${response.status} — ${body}`,
      );
    }

    const result = (await response.json()) as AgentOutput;
    return result;
  }
}
