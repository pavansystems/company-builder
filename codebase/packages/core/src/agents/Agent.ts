import Anthropic from '@anthropic-ai/sdk';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AgentInput, AgentOutput } from '@company-builder/types';
import {
  AgentError,
  AgentInputError,
  AgentLLMError,
  AgentPersistenceError,
} from './AgentError';
import { withRetry } from './retryPolicy';
import { estimateCost } from './costTracker';
import { logger } from '../utils/logger';

export interface AgentConstructorConfig {
  name: string;
  description: string;
  supabaseUrl: string;
  supabaseKey: string;
  anthropicApiKey: string;
  modelId?: string;
  maxTokens?: number;
  temperature?: number;
}

const JSON_INSTRUCTION =
  'Respond with ONLY valid JSON. Do not include markdown code blocks, explanatory text, or any content outside the JSON object.';

export abstract class Agent {
  protected readonly config: Required<AgentConstructorConfig>;
  protected readonly supabase: SupabaseClient;
  protected readonly claude: Anthropic;

  constructor(config: AgentConstructorConfig) {
    this.config = {
      modelId: 'claude-opus-4-6',
      maxTokens: 4096,
      temperature: 0.7,
      ...config,
    };

    this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey, {
      auth: { persistSession: false },
    });

    this.claude = new Anthropic({ apiKey: this.config.anthropicApiKey });
  }

  // ---------------------------------------------------------------------------
  // Abstract methods — subclasses must implement these
  // ---------------------------------------------------------------------------

  /**
   * Build the system prompt and user message from the agent input.
   * The system prompt will automatically have the JSON instruction appended.
   */
  protected abstract buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }>;

  /**
   * Parse the raw LLM response into domain-specific structured output.
   */
  protected abstract parseResponse(response: Anthropic.Message): Promise<unknown>;

  /**
   * Return the Supabase table name where this agent's output should be persisted.
   */
  protected abstract getOutputTableName(): string;

  // ---------------------------------------------------------------------------
  // Main entry point
  // ---------------------------------------------------------------------------

  /**
   * Run the full agent lifecycle:
   * 1. Create agent_run record (status: running)
   * 2. Validate input
   * 3. Build prompts
   * 4. Call LLM with retries
   * 5. Parse response
   * 6. Persist output
   * 7. Update agent_run record (completed)
   * 8. Return structured AgentOutput
   */
  async run(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    const runId = crypto.randomUUID();

    logger.info('Agent run started', {
      agentName: this.config.name,
      runId,
      pipelineItemId: input.pipeline_item_id,
    });

    // Stage 1: Create agent_run record
    await this.createAgentRun(runId, input);

    try {
      // Stage 2: Validate input
      this.validateInput(input);

      // Stage 3: Build prompts
      const { systemPrompt, userMessage } = await this.buildPrompts(input);

      // Append JSON-only instruction to system prompt
      const fullSystemPrompt = `${systemPrompt}\n\n${JSON_INSTRUCTION}`;

      // Stage 4: Call LLM with retries
      const llmResponse = await this.callLLMWithRetries(fullSystemPrompt, userMessage);

      // Stage 5: Parse response
      const parsedOutput = await this.parseResponse(llmResponse);

      // Stage 6: Persist output
      await this.persistOutput(parsedOutput, input);

      // Stage 7: Update agent_run with completion metrics
      const durationMs = Date.now() - startTime;
      const inputTokens = llmResponse.usage.input_tokens;
      const outputTokens = llmResponse.usage.output_tokens;
      await this.logCost(runId, inputTokens, outputTokens, durationMs);

      const estimatedCostUsd = estimateCost(this.config.modelId, inputTokens, outputTokens);

      logger.info('Agent run completed', {
        agentName: this.config.name,
        runId,
        durationMs,
        inputTokens,
        outputTokens,
        estimatedCostUsd,
      });

      // Stage 8: Return structured output
      const agentOutput: AgentOutput = {
        success: true,
        data: parsedOutput as Record<string, unknown>,
        tokens_used: inputTokens + outputTokens,
        cost_usd: estimatedCostUsd,
        duration_ms: durationMs,
      };

      return agentOutput;
    } catch (error) {
      return this.handleError(error, runId);
    }
  }

  // ---------------------------------------------------------------------------
  // Concrete helper methods
  // ---------------------------------------------------------------------------

  protected validateInput(input: AgentInput): void {
    if (input === null || input === undefined) {
      throw new AgentInputError('Input is required');
    }

    if (typeof input.context !== 'object' || input.context === null) {
      throw new AgentInputError('Input must have a context object');
    }

    if (typeof input.instructions !== 'string' || input.instructions.trim().length === 0) {
      throw new AgentInputError('Input must have a non-empty instructions string');
    }
  }

  protected async callLLMWithRetries(
    systemPrompt: string,
    userMessage: string,
  ): Promise<Anthropic.Message> {
    return withRetry(
      async () => {
        try {
          const response = await this.claude.messages.create({
            model: this.config.modelId,
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
          });
          return response;
        } catch (error) {
          throw new AgentLLMError(
            `LLM call failed: ${error instanceof Error ? error.message : String(error)}`,
            error,
          );
        }
      },
      3,
      1000,
    );
  }

  protected async persistOutput(output: unknown, input: AgentInput): Promise<void> {
    const tableName = this.getOutputTableName();

    const { error } = await this.supabase.from(tableName).upsert(
      {
        pipeline_item_id: input.pipeline_item_id,
        output_data: output,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'pipeline_item_id' },
    );

    if (error !== null) {
      throw new AgentPersistenceError(
        `Failed to persist output to ${tableName}: ${error.message}`,
        error,
      );
    }
  }

  protected async logCost(
    runId: string,
    inputTokens: number,
    outputTokens: number,
    durationMs: number,
  ): Promise<void> {
    const costUsd = estimateCost(this.config.modelId, inputTokens, outputTokens);
    const durationSeconds = durationMs / 1000;

    const { error } = await this.supabase
      .from('agent_runs')
      .update({
        status: 'success',
        tokens_input: inputTokens,
        tokens_output: outputTokens,
        cost_usd: costUsd,
        execution_duration_seconds: durationSeconds,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    if (error !== null) {
      // Non-fatal: log the failure but don't throw
      logger.warn('Failed to update agent_run cost metrics', {
        runId,
        error: error.message,
      });
    }
  }

  protected async handleError(error: unknown, runId: string): Promise<never> {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    logger.error('Agent run failed', {
      agentName: this.config.name,
      runId,
      error: errorMessage,
    });

    // Update agent_run record to failed status
    await this.supabase
      .from('agent_runs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    // Re-throw as AgentError if not already one
    if (error instanceof AgentError) {
      throw error;
    }

    throw new AgentError(errorMessage, 'UNKNOWN_ERROR', error);
  }

  private async createAgentRun(runId: string, input: AgentInput): Promise<void> {
    const { error } = await this.supabase.from('agent_runs').insert({
      id: runId,
      agent_name: this.config.name,
      pipeline_item_id: input.pipeline_item_id,
      input_data: { context: input.context, instructions: input.instructions },
      status: 'partial' as const, // Use 'partial' as the "running" sentinel; updated to 'success' or 'failed' on completion
      started_at: new Date().toISOString(),
    });

    if (error !== null) {
      // Non-fatal: warn and continue — not being able to log a run shouldn't abort execution
      logger.warn('Failed to create agent_run record', {
        runId,
        agentName: this.config.name,
        error: error.message,
      });
    }
  }
}
