# Company Builder — Technical Design Reference: Agent Architecture

**Audience:** Developers building any agent-type component in Company Builder.

**Purpose:** This document is the single reference for how to build, deploy, and operate ALL agent-based components in the Company Builder platform. 18 of the 26 components are agents (signal-detector, market-classifier, opportunity-ranker, landscape-analyst, pain-extractor, concept-generator, concept-scorer, market-sizer, competitive-analyst, customer-validator, feasibility-assessor, economics-modeler, validation-synthesizer, business-designer, agent-architect, gtm-strategist, risk-analyst, resource-planner, blueprint-packager). This document ensures they all follow a consistent pattern.

**Tech Stack:**
- UI: Next.js (hosted on Vercel)
- Data store: Supabase (Postgres + realtime + edge functions)
- Hosting: Vercel (serverless functions + edge functions)
- Security: Cloudflare (in front of Vercel)
- LLM: Anthropic Claude API (primary)

---

## 1. Agent Architecture Pattern

### 1.1 Standard Agent Structure

Every agent in Company Builder follows a single, consistent structure with four stages:

```
INPUT INTAKE → LLM REASONING → OUTPUT PRODUCTION → PERSISTENCE
```

**Input Intake Stage:**
- Agent is triggered (by orchestrator, webhook, scheduled job, or direct API call)
- Agent loads input from Supabase (a row in a task table, or a stored JSON document)
- Agent validates input schema and ensures all required fields exist
- Agent optionally fetches additional context from external sources (APIs, web scraping, internal knowledge bases)

**LLM Reasoning Stage:**
- Agent constructs a system prompt (static + context-specific instructions)
- Agent builds the user message (input data formatted for the LLM, optionally with structured context)
- Agent calls Claude API with input
- Agent handles streaming, retries, rate limiting, and token costs
- Agent extracts the response and validates the output schema

**Output Production Stage:**
- Agent formats the LLM output into the target schema
- Agent runs validation and optional quality checks
- Agent may trigger downstream agents or services
- Agent may call external APIs to persist or publish results

**Persistence Stage:**
- Agent writes output to Supabase (inserts/updates the results table)
- Agent records execution metadata (timestamp, tokens used, cost, any errors)
- Agent updates task status to "completed" or "failed"
- Agent emits events for downstream subscribers

### 1.2 Base Agent Class and Framework Pattern

All agents inherit from a common `Agent` base class that handles boilerplate:

```typescript
// lib/agents/Agent.ts
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

export interface AgentConfig {
  name: string;
  description: string;
  supabaseUrl: string;
  supabaseKey: string;
  anthropicApiKey: string;
  model?: string; // Default: "claude-3-5-sonnet-20241022"
  maxTokens?: number; // Default: 4096
  temperature?: number; // Default: 0.7
  costTrackingEnabled?: boolean;
  retryConfig?: {
    maxRetries: number;
    initialBackoffMs: number;
    maxBackoffMs: number;
  };
}

export interface AgentInput {
  taskId: string;
  pipelineRunId: string;
  phaseId: string;
  data: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface AgentOutput {
  taskId: string;
  pipelineRunId: string;
  data: Record<string, unknown>;
  metadata: {
    timestamp: string;
    executionTimeMs: number;
    tokensUsed: number;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
    model: string;
    attempts: number;
  };
}

export abstract class Agent {
  protected config: AgentConfig;
  protected supabase: ReturnType<typeof createClient>;
  protected anthropic: Anthropic;
  protected taskId: string;
  protected startTime: number;

  constructor(config: AgentConfig) {
    this.config = {
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096,
      temperature: 0.7,
      costTrackingEnabled: true,
      retryConfig: {
        maxRetries: 3,
        initialBackoffMs: 1000,
        maxBackoffMs: 30000,
      },
      ...config,
    };

    this.supabase = createClient(
      this.config.supabaseUrl,
      this.config.supabaseKey,
      {
        auth: { persistSession: false },
      }
    );

    this.anthropic = new Anthropic({
      apiKey: this.config.anthropicApiKey,
    });

    this.taskId = '';
    this.startTime = 0;
  }

  /**
   * Main entry point: run the agent
   * Handles the full lifecycle: input → reasoning → output → persistence
   */
  async run(input: AgentInput): Promise<AgentOutput> {
    this.taskId = input.taskId;
    this.startTime = Date.now();

    try {
      // Stage 1: Load and validate input
      const validatedInput = await this.validateInput(input);

      // Stage 2: Call LLM with retries
      const llmResponse = await this.callLLMWithRetries(validatedInput);

      // Stage 3: Format and validate output
      const agentOutput = await this.formatOutput(llmResponse, input);

      // Stage 4: Persist to Supabase
      await this.persistOutput(agentOutput);

      return agentOutput;
    } catch (error) {
      await this.handleError(error, input);
      throw error;
    }
  }

  /**
   * Validate input schema and fetch additional context if needed
   */
  protected async validateInput(input: AgentInput): Promise<AgentInput> {
    // Check required fields
    if (!input.taskId || !input.pipelineRunId || !input.data) {
      throw new Error('Invalid AgentInput: missing required fields');
    }

    // Call subclass-specific validation
    await this.validateInputSchema(input);

    // Optionally fetch context from external sources
    const context = await this.fetchContext(input);
    return { ...input, context };
  }

  /**
   * Subclass-specific input validation
   */
  protected async validateInputSchema(input: AgentInput): Promise<void> {
    // Overridden by subclasses
  }

  /**
   * Subclass-specific context fetching (e.g., web scraping, API calls)
   */
  protected async fetchContext(input: AgentInput): Promise<Record<string, unknown>> {
    // Overridden by subclasses
    return {};
  }

  /**
   * Call Claude API with exponential backoff retries
   */
  protected async callLLMWithRetries(
    input: AgentInput
  ): Promise<Anthropic.Message> {
    const maxRetries = this.config.retryConfig?.maxRetries ?? 3;
    const initialBackoff = this.config.retryConfig?.initialBackoffMs ?? 1000;
    const maxBackoff = this.config.retryConfig?.maxBackoffMs ?? 30000;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Get prompts from subclass
        const { systemPrompt, userMessage } = await this.buildPrompts(input);

        // Call Claude
        const response = await this.anthropic.messages.create({
          model: this.config.model!,
          max_tokens: this.config.maxTokens!,
          temperature: this.config.temperature!,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userMessage,
            },
          ],
        });

        // Log cost if enabled
        if (this.config.costTrackingEnabled) {
          await this.logCost(response.usage, input.taskId);
        }

        return response;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors
        if (error instanceof Anthropic.BadRequestError) {
          throw error;
        }

        // Retry on server errors with exponential backoff
        if (attempt < maxRetries) {
          const backoff = Math.min(
            initialBackoff * Math.pow(2, attempt - 1),
            maxBackoff
          );
          console.log(
            `Agent ${this.config.name} attempt ${attempt} failed, retrying in ${backoff}ms`,
            error
          );
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }

    throw new Error(
      `Agent ${this.config.name} failed after ${maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Build system and user prompts (overridden by subclasses)
   */
  protected async buildPrompts(
    input: AgentInput
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    throw new Error('buildPrompts must be implemented by subclass');
  }

  /**
   * Extract structured output from LLM response (overridden by subclasses)
   */
  protected async parseResponse(response: Anthropic.Message): Promise<unknown> {
    throw new Error('parseResponse must be implemented by subclass');
  }

  /**
   * Format the final output
   */
  protected async formatOutput(
    llmResponse: Anthropic.Message,
    input: AgentInput
  ): Promise<AgentOutput> {
    const parsedData = await this.parseResponse(llmResponse);

    const executionTimeMs = Date.now() - this.startTime;
    const usage = llmResponse.usage;

    // Calculate cost: Claude 3.5 Sonnet pricing (as of 2024)
    // Input: $3 per 1M tokens, Output: $15 per 1M tokens
    const inputCostUsd = (usage.input_tokens * 3) / 1_000_000;
    const outputCostUsd = (usage.output_tokens * 15) / 1_000_000;
    const estimatedCostUsd = inputCostUsd + outputCostUsd;

    return {
      taskId: input.taskId,
      pipelineRunId: input.pipelineRunId,
      data: parsedData as Record<string, unknown>,
      metadata: {
        timestamp: new Date().toISOString(),
        executionTimeMs,
        tokensUsed: usage.input_tokens + usage.output_tokens,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        estimatedCostUsd,
        model: this.config.model!,
        attempts: 1,
      },
    };
  }

  /**
   * Persist output to Supabase
   */
  protected async persistOutput(output: AgentOutput): Promise<void> {
    // Get the target table from config (overridden by subclass)
    const tableName = this.getOutputTableName();

    // Check if this is an insert or update
    const { data: existing } = await this.supabase
      .from(tableName)
      .select('id')
      .eq('task_id', output.taskId)
      .single();

    if (existing) {
      // Update existing row
      const { error } = await this.supabase
        .from(tableName)
        .update({
          result_data: output.data,
          execution_metadata: output.metadata,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('task_id', output.taskId);

      if (error) throw error;
    } else {
      // Insert new row
      const { error } = await this.supabase.from(tableName).insert([
        {
          task_id: output.taskId,
          pipeline_run_id: output.pipelineRunId,
          result_data: output.data,
          execution_metadata: output.metadata,
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
    }

    // Emit event for downstream subscribers
    await this.supabase.realtime.send(
      'broadcast',
      {
        event: 'agent_completed',
        payload: {
          taskId: output.taskId,
          agentName: this.config.name,
          timestamp: new Date().toISOString(),
        },
      }
    );
  }

  /**
   * Get the output table name (overridden by subclass)
   */
  protected getOutputTableName(): string {
    throw new Error('getOutputTableName must be implemented by subclass');
  }

  /**
   * Log LLM cost to tracking table
   */
  protected async logCost(
    usage: Anthropic.Messages.Usage,
    taskId: string
  ): Promise<void> {
    const inputCostUsd = (usage.input_tokens * 3) / 1_000_000;
    const outputCostUsd = (usage.output_tokens * 15) / 1_000_000;
    const totalCostUsd = inputCostUsd + outputCostUsd;

    const { error } = await this.supabase.from('agent_cost_logs').insert([
      {
        agent_name: this.config.name,
        task_id: taskId,
        model: this.config.model,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        estimated_cost_usd: totalCostUsd,
        logged_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.warn('Failed to log agent cost:', error);
    }
  }

  /**
   * Handle errors and update task status
   */
  protected async handleError(error: unknown, input: AgentInput): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const tableName = this.getOutputTableName();

    await this.supabase
      .from(tableName)
      .update({
        status: 'failed',
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('task_id', input.taskId);

    // Emit error event
    await this.supabase.realtime.send(
      'broadcast',
      {
        event: 'agent_failed',
        payload: {
          taskId: input.taskId,
          agentName: this.config.name,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        },
      }
    );

    console.error(`Agent ${this.config.name} failed for task ${input.taskId}:`, error);
  }
}
```

### 1.3 How Agents Are Invoked

Agents are invoked in four ways depending on the deployment context:

**1. Direct API Call (Vercel Function)**
```typescript
// app/api/agents/signal-detector/route.ts
import { SignalDetectorAgent } from '@/lib/agents/SignalDetectorAgent';

export async function POST(request: Request) {
  const input = await request.json();

  const agent = new SignalDetectorAgent({
    name: 'signal-detector',
    description: 'Detect meaningful signals from ingested content',
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_KEY!,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  });

  const output = await agent.run(input);

  return Response.json(output);
}
```

**2. Scheduled Job (Vercel Cron)**
```typescript
// app/api/cron/signal-detector.ts
import { SignalDetectorAgent } from '@/lib/agents/SignalDetectorAgent';

export async function GET(request: Request) {
  // Verify the request comes from Vercel's cron service
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Fetch all unprocessed content items
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data: items } = await supabase
    .from('ingested_content')
    .select('*')
    .eq('signals_detected', false)
    .limit(10);

  // Run agent on each item
  const agent = new SignalDetectorAgent({...});
  for (const item of items || []) {
    await agent.run({
      taskId: item.id,
      pipelineRunId: item.pipeline_run_id,
      phaseId: '0.2',
      data: { contentId: item.id },
    });
  }

  return Response.json({ processed: items?.length || 0 });
}
```

**3. Supabase Edge Function (for lower-latency, frequent execution)**
```typescript
// supabase/functions/signal-detector/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

serve(async (req: Request) => {
  const input = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Call Claude directly from edge function
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: buildSystemPrompt(),
      messages: [{
        role: 'user',
        content: buildUserMessage(input),
      }],
    }),
  });

  const llmResponse = await response.json();

  // Persist result
  await supabase.from('agent_signals').insert([{
    task_id: input.taskId,
    pipeline_run_id: input.pipelineRunId,
    result_data: parseResponse(llmResponse),
    status: 'completed',
  }]);

  return new Response(JSON.stringify(llmResponse), { status: 200 });
});
```

**4. Queue (for heavy workloads, via Vercel Background Functions or external queue like Bull/BullMQ)**
```typescript
// lib/agents/queue.ts
import Queue from 'bull';
import { SignalDetectorAgent } from '@/lib/agents/SignalDetectorAgent';

const signalDetectorQueue = new Queue('signal-detector', {
  redis: {
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT!),
  },
});

signalDetectorQueue.process(async (job) => {
  const agent = new SignalDetectorAgent({...});
  return await agent.run(job.data);
});

// Enqueue a job
export async function enqueueSignalDetection(input: AgentInput) {
  await signalDetectorQueue.add(input, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    timeout: 300000, // 5 minutes
  });
}
```

---

## 2. LLM Integration

### 2.1 How Agents Call LLMs

All agents use the Anthropic Claude API. The base `Agent` class handles all LLM calls via the `callLLMWithRetries` method. Agents never call Claude directly; they inherit the LLM infrastructure.

**Client Library:**
```bash
npm install @anthropic-ai/sdk
```

**Pattern: Always use the base class method**
```typescript
// DON'T do this in a subclass:
const response = await this.anthropic.messages.create({...});

// DO THIS instead:
const response = await this.callLLMWithRetries(input);
// This is inherited from Agent base class and handles retries, cost tracking, etc.
```

### 2.2 Prompt Management

**Where prompts live:**
- Static system prompts for each agent live in `/lib/agents/prompts/{agentName}.ts`
- Each prompt file exports a `buildSystemPrompt()` function and a `buildUserMessage()` function
- Prompts are versioned by storing a `prompt_version` field in Supabase's agent execution metadata

**Example: Signal Detector Prompts**
```typescript
// lib/agents/prompts/signal-detector.ts

export function buildSystemPrompt(): string {
  return `You are a market signal detection expert. Your role is to analyze ingested content and identify meaningful signals that indicate where AI-driven disruption is emerging.

Signal types to detect:
1. NEW AI CAPABILITIES: New model releases, breakthroughs in reasoning, multimodal improvements, agent frameworks
2. REGULATORY SHIFTS: New laws, deregulation, compliance changes that open or close markets
3. MARKET DISRUPTIONS: Acquisitions, bankruptcies, major pricing changes, consolidation
4. AUTOMATION OPPORTUNITIES: Tasks that were previously manual that AI can now handle
5. CUSTOMER PAIN: Recurring complaints, unmet needs, workarounds that indicate inefficiency

For each signal detected, extract:
- Type (one of: AI_CAPABILITY, REGULATORY, MARKET_DISRUPTION, AUTOMATION_OPPORTUNITY, CUSTOMER_PAIN)
- Confidence (HIGH, MEDIUM, LOW)
- Affected market(s) or industry
- Why it matters
- How it creates a disruption window

Output ONLY valid JSON. No markdown, no explanation.`;
}

export function buildUserMessage(input: {
  contentId: string;
  title: string;
  content: string;
  source: string;
  publishedDate: string;
}): string {
  return `Analyze this content for market signals:

TITLE: ${input.title}
SOURCE: ${input.source}
DATE: ${input.publishedDate}
CONTENT:
${input.content}

Return an array of detected signals. If no signals, return an empty array.`;
}
```

**How prompts are loaded at runtime:**
```typescript
export class SignalDetectorAgent extends Agent {
  protected async buildPrompts(
    input: AgentInput
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const { systemPrompt, userMessage } = await this.loadPrompts(input);
    return { systemPrompt, userMessage };
  }

  private async loadPrompts(
    input: AgentInput
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    // Fetch prompt version from config (or default to latest)
    const promptVersion = input.context?.promptVersion || 'latest';

    // Check if custom prompt is stored in Supabase
    const { data: customPrompt } = await this.supabase
      .from('agent_prompt_overrides')
      .select('system_prompt, user_message_template')
      .eq('agent_name', 'signal-detector')
      .eq('version', promptVersion)
      .single();

    if (customPrompt) {
      // Use custom prompt from DB
      return {
        systemPrompt: customPrompt.system_prompt,
        userMessage: this.formatUserMessageTemplate(
          customPrompt.user_message_template,
          input.data
        ),
      };
    }

    // Use default prompts from code
    const systemPrompt = buildSystemPrompt();
    const userMessage = buildUserMessage(input.data as any);

    return { systemPrompt, userMessage };
  }
}
```

### 2.3 Structured Output Handling

Claude can produce structured JSON in two ways:

**Option 1: JSON Mode (Recommended)**
Claude guarantees valid JSON output with `temperature: 0`.

```typescript
protected async buildPrompts(input: AgentInput) {
  const systemPrompt = `You are a market analyst...
Output ONLY valid JSON. No markdown.`;

  const userMessage = `Analyze this market and return a JSON object with:
{
  "market_size_usd": number,
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "rationale": string
}`;

  return { systemPrompt, userMessage };
}

protected async parseResponse(response: Anthropic.Message): Promise<unknown> {
  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Expected text response');

  // JSON mode guarantees valid JSON
  return JSON.parse(content.text);
}
```

**Option 2: Tool Use (for complex structured outputs with nested validation)**
Use Claude's tool_use feature to get guaranteed structured outputs.

```typescript
protected async callLLMWithRetries(input: AgentInput): Promise<Anthropic.Message> {
  const { systemPrompt, userMessage } = await this.buildPrompts(input);

  const response = await this.anthropic.messages.create({
    model: this.config.model!,
    max_tokens: this.config.maxTokens!,
    system: systemPrompt,
    tools: [
      {
        name: 'submit_analysis',
        description: 'Submit the market analysis results',
        input_schema: {
          type: 'object',
          properties: {
            market_size_usd: { type: 'number' },
            confidence: { enum: ['HIGH', 'MEDIUM', 'LOW'] },
            rationale: { type: 'string' },
            growth_rate: { type: 'number' },
          },
          required: ['market_size_usd', 'confidence', 'rationale'],
        },
      },
    ],
    messages: [{ role: 'user', content: userMessage }],
  });

  // Handle tool use
  if (response.stop_reason === 'tool_use') {
    const toolUseBlock = response.content.find((block) => block.type === 'tool_use');
    if (toolUseBlock && 'input' in toolUseBlock) {
      return {
        ...response,
        parsed_tool_input: toolUseBlock.input,
      };
    }
  }

  return response;
}

protected async parseResponse(response: Anthropic.Message): Promise<unknown> {
  // Claude guaranteed that the tool input matches the schema
  return (response as any).parsed_tool_input;
}
```

### 2.4 Token Management

**Handling long inputs:**

Use token estimation to avoid exceeding context windows. Claude 3.5 Sonnet has a 200K token window.

```typescript
protected async validateInput(input: AgentInput): Promise<AgentInput> {
  // Estimate tokens in the user message
  const estimatedTokens = await this.estimateTokens(input);

  const maxTokensForContext = 190_000; // Leave buffer
  const maxTokensForOutput = this.config.maxTokens!;
  const availableTokens = maxTokensForContext - maxTokensForOutput;

  if (estimatedTokens > availableTokens) {
    // Too large; need to chunk or summarize
    const chunked = await this.chunkLargeInput(input, availableTokens);
    return { ...input, data: { ...input.data, chunks: chunked } };
  }

  return input;
}

private async estimateTokens(input: AgentInput): Promise<number> {
  // Simple heuristic: ~1.3 tokens per word, ~4 characters per word
  const inputText = JSON.stringify(input.data);
  return Math.ceil((inputText.length / 4) * 1.3);
}

private async chunkLargeInput(
  input: AgentInput,
  maxTokens: number
): Promise<string[]> {
  // If input has large content field, split it into chunks
  if (typeof input.data.content === 'string') {
    const chunkSize = Math.floor((maxTokens * 4) / 1.3); // Rough conversion back
    const content = input.data.content;
    const chunks = [];

    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }

    return chunks;
  }

  return [JSON.stringify(input.data)];
}
```

**Chunking strategy for processing multiple documents:**

```typescript
protected async fetchContext(input: AgentInput): Promise<Record<string, unknown>> {
  // Suppose we need to fetch competitor data, which might be large
  const { data: competitors } = await this.supabase
    .from('competitive_intelligence')
    .select('*')
    .eq('market_id', input.data.marketId);

  if (!competitors || competitors.length === 0) {
    return { competitors: [] };
  }

  // If there are too many competitors, only include the top 5 by relevance
  const topCompetitors = competitors.slice(0, 5);

  // For each competitor, only include key fields to save tokens
  return {
    competitors: topCompetitors.map((c) => ({
      name: c.name,
      pricing: c.pricing,
      weaknesses: c.weaknesses,
      market_share: c.market_share,
    })),
  };
}
```

### 2.5 Error Handling

The base `Agent` class provides standard error handling with exponential backoff:

**Retryable errors** (rate limits, transient API errors):
- `Anthropic.RateLimitError`
- `Anthropic.InternalServerError`
- Network timeouts

**Non-retryable errors** (input validation, auth):
- `Anthropic.BadRequestError`
- `Anthropic.AuthenticationError`

```typescript
protected async callLLMWithRetries(input: AgentInput): Promise<Anthropic.Message> {
  const maxRetries = this.config.retryConfig?.maxRetries ?? 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { systemPrompt, userMessage } = await this.buildPrompts(input);
      return await this.anthropic.messages.create({
        model: this.config.model!,
        max_tokens: this.config.maxTokens!,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });
    } catch (error) {
      // Fail fast on client errors
      if (error instanceof Anthropic.BadRequestError) {
        throw new Error(`Invalid prompt: ${error.message}`);
      }

      if (error instanceof Anthropic.AuthenticationError) {
        throw new Error('Invalid API key');
      }

      // Retry on server errors
      if (attempt < maxRetries) {
        const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        console.log(`Attempt ${attempt} failed, retrying in ${backoff}ms`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      } else {
        throw error;
      }
    }
  }
}
```

### 2.6 Cost Tracking

Every agent call is logged to `agent_cost_logs` table:

```sql
CREATE TABLE agent_cost_logs (
  id BIGSERIAL PRIMARY KEY,
  agent_name TEXT NOT NULL,
  task_id TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INT NOT NULL,
  output_tokens INT NOT NULL,
  estimated_cost_usd DECIMAL(10, 6) NOT NULL,
  logged_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_cost_logs_agent_name ON agent_cost_logs(agent_name);
CREATE INDEX idx_agent_cost_logs_logged_at ON agent_cost_logs(logged_at);
```

**Cost calculation:**
```typescript
protected async logCost(usage: Anthropic.Messages.Usage, taskId: string): Promise<void> {
  // Claude 3.5 Sonnet (2024 pricing):
  // Input: $3 per 1M tokens
  // Output: $15 per 1M tokens
  const inputCostUsd = (usage.input_tokens * 3) / 1_000_000;
  const outputCostUsd = (usage.output_tokens * 15) / 1_000_000;
  const totalCostUsd = inputCostUsd + outputCostUsd;

  await this.supabase.from('agent_cost_logs').insert([
    {
      agent_name: this.config.name,
      task_id: taskId,
      model: this.config.model,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      estimated_cost_usd: totalCostUsd,
      logged_at: new Date().toISOString(),
    },
  ]);
}
```

**Monitor total spending:**
```typescript
export async function getTotalAgentCosts(supabase: SupabaseClient): Promise<{
  totalCostUsd: number;
  byAgent: Record<string, number>;
  lastUpdated: string;
}> {
  const { data } = await supabase
    .from('agent_cost_logs')
    .select('agent_name, estimated_cost_usd')
    .gte('logged_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const byAgent: Record<string, number> = {};
  let totalCostUsd = 0;

  data?.forEach((log) => {
    byAgent[log.agent_name] = (byAgent[log.agent_name] || 0) + log.estimated_cost_usd;
    totalCostUsd += log.estimated_cost_usd;
  });

  return {
    totalCostUsd,
    byAgent,
    lastUpdated: new Date().toISOString(),
  };
}
```

---

## 3. Data Contracts

### 3.1 Agent Input/Output Schemas

Every agent has a strict input schema (defined in Zod) and an output schema.

**Signal Detector Example:**
```typescript
// lib/agents/signal-detector/schemas.ts
import { z } from 'zod';

export const signalDetectorInputSchema = z.object({
  taskId: z.string().uuid(),
  pipelineRunId: z.string().uuid(),
  phaseId: z.literal('0.2'),
  data: z.object({
    contentId: z.string().uuid(),
  }),
  context: z
    .object({
      contentTitle: z.string(),
      contentBody: z.string(),
      contentSource: z.string(),
      publishedDate: z.string().datetime(),
    })
    .optional(),
});

export const signalDetectorOutputSchema = z.object({
  signals: z.array(
    z.object({
      type: z.enum([
        'AI_CAPABILITY',
        'REGULATORY_SHIFT',
        'MARKET_DISRUPTION',
        'AUTOMATION_OPPORTUNITY',
        'CUSTOMER_PAIN',
      ]),
      confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      title: z.string(),
      description: z.string(),
      affected_markets: z.array(z.string()),
      why_it_matters: z.string(),
      disruption_window_urgency: z.enum(['IMMEDIATE', 'NEAR_TERM', 'MEDIUM_TERM']),
      source_links: z.array(z.string().url()),
    })
  ),
  detection_rationale: z.string().optional(),
});

export type SignalDetectorInput = z.infer<typeof signalDetectorInputSchema>;
export type SignalDetectorOutput = z.infer<typeof signalDetectorOutputSchema>;
```

### 3.2 Reading Inputs from Supabase

```typescript
export class SignalDetectorAgent extends Agent {
  protected async validateInput(input: AgentInput): Promise<AgentInput> {
    // Validate against schema
    const validated = signalDetectorInputSchema.parse(input);

    // Fetch the content from ingested_content table
    const { data: content, error } = await this.supabase
      .from('ingested_content')
      .select('*')
      .eq('id', input.data.contentId)
      .single();

    if (error || !content) {
      throw new Error(`Content not found: ${input.data.contentId}`);
    }

    // Merge fetched content into context
    return {
      ...validated,
      context: {
        contentTitle: content.title,
        contentBody: content.body,
        contentSource: content.source_url,
        publishedDate: content.published_date,
      },
    };
  }
}
```

### 3.3 Writing Outputs to Supabase

```typescript
protected async persistOutput(output: AgentOutput): Promise<void> {
  // Validate output schema
  const validatedOutput = signalDetectorOutputSchema.parse(output.data);

  // Write to agent_signals table
  const { error } = await this.supabase.from('agent_signals').upsert(
    [
      {
        task_id: output.taskId,
        pipeline_run_id: output.pipelineRunId,
        ingested_content_id: output.data.contentId, // Foreign key
        signal_data: validatedOutput.signals,
        detection_rationale: validatedOutput.detection_rationale,
        execution_metadata: output.metadata,
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: 'task_id' }
  );

  if (error) throw error;

  // Update the ingested_content row to mark signals as detected
  await this.supabase
    .from('ingested_content')
    .update({ signals_detected: true, signals_detected_at: new Date().toISOString() })
    .eq('id', output.data.contentId);
}
```

### 3.4 Agent-to-Agent Communication

Agents **never** call each other directly. They communicate only via Supabase:

```typescript
// Example: Market Classifier waits for Signal Detector to finish
// Then reads the signals and classifies them

export class MarketClassifierAgent extends Agent {
  protected async fetchContext(input: AgentInput): Promise<Record<string, unknown>> {
    // Read output from previous agent (signal-detector)
    const { data: signals } = await this.supabase
      .from('agent_signals')
      .select('signal_data')
      .eq('pipeline_run_id', input.pipelineRunId)
      .eq('status', 'completed');

    if (!signals || signals.length === 0) {
      throw new Error('No signals found for this pipeline run');
    }

    return {
      detectedSignals: signals.flatMap((s) => s.signal_data),
    };
  }
}
```

### 3.5 Standard Envelope Format

All agent inputs follow this envelope:

```typescript
interface AgentInput {
  taskId: string; // UUID, unique per agent run
  pipelineRunId: string; // UUID, shared across all agents in a pipeline run
  phaseId: string; // e.g., "0.2", "1.3", identifies which step in the process
  data: Record<string, unknown>; // Agent-specific input data
  context?: Record<string, unknown>; // Optional context fetched from external sources
}
```

All agent outputs follow this envelope:

```typescript
interface AgentOutput {
  taskId: string;
  pipelineRunId: string;
  data: Record<string, unknown>; // Agent-specific output
  metadata: {
    timestamp: string; // ISO 8601
    executionTimeMs: number;
    tokensUsed: number;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
    model: string;
    attempts: number;
  };
}
```

---

## 4. Agent Execution Model

### 4.1 Synchronous vs. Asynchronous Execution

**Synchronous:** Agent is called via HTTP request, returns response within request lifetime.
- Used for agents with <5s execution time (e.g., concept scoring)
- Vercel max function timeout: 60s
- Best for interactive flows

```typescript
// app/api/agents/concept-scorer/route.ts
export async function POST(request: Request) {
  const input = await request.json();
  const agent = new ConceptScorerAgent({...});
  const output = await agent.run(input);
  return Response.json(output);
}
```

**Asynchronous:** Agent is queued, returns immediately with a job ID.
- Used for agents with >5s execution time (e.g., landscape analysis, market sizing)
- Task status is polled or watched via Supabase realtime
- Better for background processing

```typescript
// app/api/agents/landscape-analyst/queue/route.ts
import { enqueueSignalDetection } from '@/lib/agents/queue';

export async function POST(request: Request) {
  const input = await request.json();

  // Enqueue the job
  const job = await enqueueSignalDetection(input);

  return Response.json({
    status: 'queued',
    jobId: job.id,
    taskId: input.taskId,
    pollUrl: `/api/agents/jobs/${job.id}`,
  });
}

// app/api/agents/jobs/[jobId]/route.ts
export async function GET(request: Request, { params }: { params: { jobId: string } }) {
  const job = await signalDetectorQueue.getJob(params.jobId);

  if (!job) {
    return Response.json({ status: 'not_found' }, { status: 404 });
  }

  if (job.isCompleted()) {
    return Response.json({
      status: 'completed',
      result: job.returnvalue,
    });
  }

  if (job.isFailed()) {
    return Response.json({
      status: 'failed',
      error: job.failedReason,
    });
  }

  return Response.json({
    status: 'processing',
    progress: job.progress(),
  });
}
```

### 4.2 Long-Running Agents and Vercel Function Timeouts

Vercel Serverless Functions have a 60-second timeout by default. For agents that take longer:

**Option 1: Use Vercel Cron + Supabase Polling**
```typescript
// Schedule the agent to run periodically
// Polling clients check Supabase for results

// app/api/cron/process-landscape-analysis.ts
export async function GET(request: Request) {
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get all pending landscape analysis tasks
  const { data: tasks } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('agent_name', 'landscape-analyst')
    .eq('status', 'pending')
    .limit(5); // Process 5 at a time

  for (const task of tasks || []) {
    const agent = new LandscapeAnalystAgent({...});
    try {
      await agent.run({
        taskId: task.id,
        pipelineRunId: task.pipeline_run_id,
        phaseId: '1.1',
        data: task.input_data,
      });
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error);
    }
  }

  return Response.json({ processed: tasks?.length || 0 });
}
```

**Option 2: Use Supabase Edge Functions (longer timeout, ~5 minutes)**
```typescript
// supabase/functions/landscape-analyst/index.ts
// This runs in Deno and can take up to 5 minutes
// Much better for long-running tasks
```

**Option 3: Use BullMQ Queue with Redis**
```typescript
// Long tasks are persisted in Redis queue
// A separate worker process picks them up

// worker.ts
import Queue from 'bull';

const queue = new Queue('landscape-analyst', {
  redis: { host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT) },
});

queue.process(async (job) => {
  const agent = new LandscapeAnalystAgent({...});
  return await agent.run(job.data);
});
```

### 4.3 Queuing and Retry Patterns

Agents have built-in retry logic (exponential backoff). For queue-based execution, add retry configuration:

```typescript
export async function enqueueAgent(input: AgentInput, agentName: string) {
  const queue = getQueueForAgent(agentName);

  await queue.add(input, {
    // Retry 3 times with exponential backoff
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Start at 2s, then 4s, 8s
    },
    // Remove job after 7 days
    removeOnComplete: {
      age: 604800,
    },
    // Timeout per attempt
    timeout: 600000, // 10 minutes per attempt
  });
}
```

### 4.4 Concurrency Control

Limit the number of agents running simultaneously to avoid overwhelming the LLM API:

```typescript
// lib/agents/concurrency.ts
import pLimit from 'p-limit';

const concurrencyLimits = new Map<string, ReturnType<typeof pLimit>>();

const CONCURRENCY_LIMITS: Record<string, number> = {
  'signal-detector': 5,
  'market-classifier': 3,
  'landscape-analyst': 2, // CPU-intensive
  'concept-generator': 3,
  // ... etc
};

function getConcurrencyLimit(agentName: string) {
  if (!concurrencyLimits.has(agentName)) {
    const limit = CONCURRENCY_LIMITS[agentName] || 5;
    concurrencyLimits.set(agentName, pLimit(limit));
  }
  return concurrencyLimits.get(agentName)!;
}

// Usage: wrap agent execution with limit
export async function runAgentWithLimit(agent: Agent, input: AgentInput) {
  const limit = getConcurrencyLimit(agent.config.name);
  return await limit(() => agent.run(input));
}
```

### 4.5 Idempotency

Agents must be idempotent: re-running the same agent with the same input should produce the same output without duplicates.

```typescript
protected async persistOutput(output: AgentOutput): Promise<void> {
  // Use upsert instead of insert to handle re-runs
  const tableName = this.getOutputTableName();

  const { error } = await this.supabase
    .from(tableName)
    .upsert(
      [
        {
          task_id: output.taskId,
          pipeline_run_id: output.pipelineRunId,
          result_data: output.data,
          execution_metadata: output.metadata,
          status: 'completed',
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'task_id' } // Key: use task_id as unique constraint
    );

  if (error) throw error;
}
```

Ensure each agent assigns a unique `task_id` based on the **input**, not a random value:

```typescript
// When enqueuing a task, create a deterministic task ID
import { createHash } from 'crypto';

function generateTaskId(agentName: string, inputData: Record<string, any>): string {
  const hash = createHash('sha256')
    .update(`${agentName}:${JSON.stringify(inputData)}`)
    .digest('hex');
  return hash.slice(0, 32); // Use first 32 chars as UUID-like ID
}

// This ensures the same input always produces the same task ID
// So re-runs will upsert instead of creating duplicates
```

---

## 5. Observability

### 5.1 Logging Strategy

All agent logs go to a structured `agent_logs` table in Supabase:

```sql
CREATE TABLE agent_logs (
  id BIGSERIAL PRIMARY KEY,
  task_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  level TEXT NOT NULL, -- 'debug', 'info', 'warn', 'error'
  message TEXT NOT NULL,
  context JSONB, -- Additional metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_logs_task_id ON agent_logs(task_id);
CREATE INDEX idx_agent_logs_agent_name ON agent_logs(agent_name);
CREATE INDEX idx_agent_logs_created_at ON agent_logs(created_at);
```

**Logging from agents:**
```typescript
protected async log(level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: Record<string, any>) {
  await this.supabase.from('agent_logs').insert([
    {
      task_id: this.taskId,
      agent_name: this.config.name,
      level,
      message,
      context,
      created_at: new Date().toISOString(),
    },
  ]);

  // Also log to console for development
  console.log(`[${this.config.name}:${level}] ${message}`, context || '');
}
```

### 5.2 Tracing

Every `pipelineRunId` is shared across all agents in a run. This enables end-to-end tracing:

```typescript
// Trace an idea through the pipeline
export async function tracePipelineRun(
  supabase: SupabaseClient,
  pipelineRunId: string
): Promise<{
  pipelineRunId: string;
  phase0: AgentOutput[]; // signal-detector, market-classifier, etc.
  phase1: AgentOutput[];
  phase2: AgentOutput[];
  phase3: AgentOutput[];
  totalExecutionMs: number;
  totalCostUsd: number;
}> {
  // Fetch all task outputs for this pipeline run
  const { data: outputs } = await supabase
    .from('agent_outputs')
    .select('*')
    .eq('pipeline_run_id', pipelineRunId)
    .order('created_at', { ascending: true });

  const grouped = groupBy(outputs, (o) => o.phase_id.split('.')[0]);

  const totalCostUsd = outputs?.reduce((sum, o) => sum + o.execution_metadata.estimated_cost_usd, 0) || 0;
  const startTime = new Date(outputs?.[0]?.created_at).getTime();
  const endTime = new Date(outputs?.[outputs.length - 1]?.created_at).getTime();

  return {
    pipelineRunId,
    phase0: grouped['0'] || [],
    phase1: grouped['1'] || [],
    phase2: grouped['2'] || [],
    phase3: grouped['3'] || [],
    totalExecutionMs: endTime - startTime,
    totalCostUsd,
  };
}
```

### 5.3 Metrics

Track key metrics per agent:

```typescript
export async function getAgentMetrics(
  supabase: SupabaseClient,
  agentName: string,
  timeWindowDays: number = 7
): Promise<{
  agentName: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number;
  avgExecutionMs: number;
  avgTokensUsed: number;
  totalCostUsd: number;
  avgCostPerRun: number;
}> {
  const since = new Date(Date.now() - timeWindowDays * 24 * 60 * 60 * 1000).toISOString();

  // Get all task results for this agent
  const { data: tasks } = await supabase
    .from('agent_tasks')
    .select('status, execution_metadata')
    .eq('agent_name', agentName)
    .gte('created_at', since);

  const totalRuns = tasks?.length || 0;
  const successfulRuns = tasks?.filter((t) => t.status === 'completed').length || 0;
  const failedRuns = tasks?.filter((t) => t.status === 'failed').length || 0;

  const avgExecutionMs =
    tasks?.reduce((sum, t) => sum + (t.execution_metadata?.execution_time_ms || 0), 0) / totalRuns || 0;
  const avgTokensUsed =
    tasks?.reduce((sum, t) => sum + (t.execution_metadata?.tokens_used || 0), 0) / totalRuns || 0;
  const totalCostUsd =
    tasks?.reduce((sum, t) => sum + (t.execution_metadata?.estimated_cost_usd || 0), 0) || 0;

  return {
    agentName,
    totalRuns,
    successfulRuns,
    failedRuns,
    successRate: totalRuns > 0 ? successfulRuns / totalRuns : 0,
    avgExecutionMs,
    avgTokensUsed,
    totalCostUsd,
    avgCostPerRun: totalRuns > 0 ? totalCostUsd / totalRuns : 0,
  };
}
```

### 5.4 Alerting

Set up alerts for agent failures and cost overages:

```typescript
export async function checkAgentHealth(supabase: SupabaseClient) {
  // Check failure rate
  const { data: metrics } = await supabase
    .rpc('get_agent_metrics_last_hour'); // Custom Postgres function

  for (const metric of metrics || []) {
    if (metric.failure_rate > 0.1) {
      // > 10% failure rate
      await sendAlert({
        type: 'high_failure_rate',
        agentName: metric.agent_name,
        failureRate: metric.failure_rate,
        failureCount: metric.failed_runs,
      });
    }

    if (metric.cost_per_run > 0.5) {
      // > $0.50 per run
      await sendAlert({
        type: 'high_cost',
        agentName: metric.agent_name,
        costPerRun: metric.cost_per_run,
      });
    }
  }
}

async function sendAlert(alert: any) {
  // Send to Slack, PagerDuty, email, etc.
  await fetch(process.env.ALERT_WEBHOOK_URL!, {
    method: 'POST',
    body: JSON.stringify(alert),
  });
}
```

---

## 6. Testing Strategy

### 6.1 Unit Testing

Mock the LLM responses:

```typescript
// __tests__/agents/SignalDetectorAgent.test.ts
import { SignalDetectorAgent } from '@/lib/agents/SignalDetectorAgent';
import { createMockSupabaseClient } from '@/test/mocks/supabase';

describe('SignalDetectorAgent', () => {
  it('should detect AI capability signals', async () => {
    const mockSupabase = createMockSupabaseClient();
    const mockAnthropicResponse: Anthropic.Message = {
      id: 'msg_123',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            signals: [
              {
                type: 'AI_CAPABILITY',
                confidence: 'HIGH',
                title: 'Claude 3.5 Sonnet Released',
                description: 'New model doubles reasoning ability',
                affected_markets: ['business intelligence', 'research'],
                why_it_matters: 'Enables new use cases in analysis',
                disruption_window_urgency: 'IMMEDIATE',
              },
            ],
          }),
        },
      ],
      model: 'claude-3-5-sonnet-20241022',
      stop_reason: 'end_turn',
      usage: { input_tokens: 100, output_tokens: 150 },
    };

    jest.spyOn(anthropic.messages, 'create').mockResolvedValue(mockAnthropicResponse);

    const agent = new SignalDetectorAgent({
      name: 'signal-detector',
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
      anthropicApiKey: 'test-key',
    });

    const output = await agent.run({
      taskId: 'task_123',
      pipelineRunId: 'run_123',
      phaseId: '0.2',
      data: { contentId: 'content_123' },
      context: {
        contentTitle: 'AI News',
        contentBody: 'Claude 3.5 released...',
        contentSource: 'news.anthropic.com',
        publishedDate: new Date().toISOString(),
      },
    });

    expect(output.data.signals).toHaveLength(1);
    expect(output.data.signals[0].type).toBe('AI_CAPABILITY');
  });
});
```

### 6.2 Integration Testing

Test with real Supabase instance (use a test database):

```typescript
describe('SignalDetectorAgent Integration', () => {
  let supabase: SupabaseClient;

  beforeAll(async () => {
    // Connect to test Supabase instance
    supabase = createClient(
      process.env.SUPABASE_TEST_URL!,
      process.env.SUPABASE_TEST_KEY!
    );

    // Clear test data
    await supabase.from('ingested_content').delete().neq('id', 'null');
    await supabase.from('agent_signals').delete().neq('id', 'null');
  });

  it('should process real content and persist signals', async () => {
    // Insert test content
    const { data: content } = await supabase
      .from('ingested_content')
      .insert([
        {
          title: 'OpenAI GPT-5 Announcement',
          body: 'OpenAI announces GPT-5 with 10x improvement in reasoning...',
          source_url: 'news.openai.com',
          published_date: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    // Run agent
    const agent = new SignalDetectorAgent({
      name: 'signal-detector',
      supabaseUrl: process.env.SUPABASE_TEST_URL!,
      supabaseKey: process.env.SUPABASE_TEST_KEY!,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const output = await agent.run({
      taskId: `task_${content.id}`,
      pipelineRunId: 'run_123',
      phaseId: '0.2',
      data: { contentId: content.id },
    });

    // Verify signals were persisted
    const { data: signals } = await supabase
      .from('agent_signals')
      .select('*')
      .eq('task_id', output.taskId);

    expect(signals).toHaveLength(1);
  });
});
```

### 6.3 Output Quality Evaluation

Define scoring rubrics to evaluate agent outputs:

```typescript
// lib/agents/evaluation/rubrics.ts
export const signalQualityRubric = {
  name: 'signal_quality',
  criteria: [
    {
      name: 'signal_relevance',
      description: 'Does the signal indicate a real disruption opportunity?',
      scores: {
        1: 'Not relevant',
        2: 'Weakly relevant',
        3: 'Relevant',
        4: 'Highly relevant',
      },
    },
    {
      name: 'market_clarity',
      description: 'Is the affected market clearly identified?',
      scores: {
        1: 'Vague or multiple markets',
        2: 'Somewhat clear',
        3: 'Clear',
        4: 'Very clear',
      },
    },
    {
      name: 'urgency_accuracy',
      description: 'Is the disruption window timing accurate?',
      scores: {
        1: 'Inaccurate',
        2: 'Somewhat accurate',
        3: 'Accurate',
        4: 'Very accurate',
      },
    },
  ],
  passThreshold: 3.0, // Average score must be >= 3.0
};

// Use in CI/CD to catch regressions
export async function evaluateAgentOutput(
  agentName: string,
  output: AgentOutput,
  goldenDataset: any[]
): Promise<{ passed: boolean; score: number; details: any[] }> {
  const rubric = getRubricForAgent(agentName);
  const scores = [];

  for (const goldenExample of goldenDataset) {
    const similarity = calculateSimilarity(output.data, goldenExample);
    scores.push(similarity);
  }

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const passed = avgScore >= rubric.passThreshold;

  return {
    passed,
    score: avgScore,
    details: scores,
  };
}
```

### 6.4 CI/CD Integration

Run tests on every commit, evaluate outputs on main branch:

```yaml
# .github/workflows/test-agents.yml
name: Test Agents

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci
      - run: npm run test:agents
      - run: npm run test:agents:integration
        if: github.ref == 'refs/heads/main'

      - name: Evaluate Agent Outputs
        if: github.ref == 'refs/heads/main'
        run: npm run evaluate:agents
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_TEST_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## 7. Code Structure

### 7.1 File/Folder Layout

```
lib/agents/
├── Agent.ts                           # Base agent class
├── AgentConfig.ts                     # Type definitions
├──
├── prompts/
│   ├── signal-detector.ts
│   ├── market-classifier.ts
│   ├── concept-generator.ts
│   └── ... (one per agent)
├──
├── schemas/
│   ├── signal-detector.ts            # Input/output schemas (Zod)
│   ├── market-classifier.ts
│   └── ... (one per agent)
├──
├── [agent-name]/
│   ├── index.ts                      # Main agent class export
│   ├── [AgentName]Agent.ts           # Agent implementation
│   ├── context.ts                    # Context fetching logic
│   └── evaluator.ts                  # Output evaluation (optional)
├──
├── queue.ts                          # Bull/Redis queue setup
├── concurrency.ts                    # Concurrency limits
├── observability.ts                  # Logging, metrics, tracing
└── utils/
    ├── token-counter.ts
    ├── cost-calculator.ts
    └── retry-logic.ts
```

### 7.2 Naming Conventions

- **Agent classes:** `{Name}Agent` (e.g., `SignalDetectorAgent`, `ConceptScorerAgent`)
- **Input schemas:** `{name}InputSchema` (e.g., `signalDetectorInputSchema`)
- **Output schemas:** `{name}OutputSchema`
- **Prompt files:** lowercase with hyphens (e.g., `signal-detector.ts`)
- **Route handlers:** `/api/agents/[agent-name]/route.ts`
- **Tests:** `{AgentName}.test.ts`

### 7.3 Shared Utilities

```typescript
// lib/agents/utils/token-counter.ts
export function estimateTokenCount(text: string): number {
  // Heuristic: ~1.3 tokens per word, ~4 characters per word
  return Math.ceil((text.length / 4) * 1.3);
}

// lib/agents/utils/cost-calculator.ts
const PRICING = {
  'claude-3-5-sonnet-20241022': {
    inputPer1M: 3,
    outputPer1M: 15,
  },
};

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model as keyof typeof PRICING];
  if (!pricing) throw new Error(`Unknown model: ${model}`);

  return (inputTokens * pricing.inputPer1M + outputTokens * pricing.outputPer1M) / 1_000_000;
}

// lib/agents/utils/retry-logic.ts
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delayMs = initialDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('Unreachable');
}
```

### 7.4 Configuration Management

Store all agent config in environment variables and a central config file:

```typescript
// lib/agents/config.ts
export const AGENT_CONFIG = {
  signalDetector: {
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4096,
    temperature: 0.7,
    timeoutMs: 300_000, // 5 minutes
    maxRetries: 3,
    concurrency: 5,
  },
  conceptGenerator: {
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 8192, // More output
    temperature: 0.9, // More creative
    timeoutMs: 600_000, // 10 minutes
    maxRetries: 2,
    concurrency: 2,
  },
  // ... one per agent
};

// Load from env vars with fallback to defaults
export function getAgentConfig(agentName: string) {
  const envKey = `AGENT_CONFIG_${agentName.toUpperCase()}`;
  const envConfig = process.env[envKey];

  if (envConfig) {
    return JSON.parse(envConfig);
  }

  return (AGENT_CONFIG as Record<string, any>)[agentName.toLowerCase()];
}
```

---

## 8. Reference Implementation: Signal Detector Agent

Here's a complete, detailed example of a real agent implementation:

```typescript
// lib/agents/signal-detector/SignalDetectorAgent.ts
import { Agent, AgentConfig, AgentInput, AgentOutput } from '../Agent';
import {
  signalDetectorInputSchema,
  signalDetectorOutputSchema,
  type SignalDetectorInput,
  type SignalDetectorOutput,
} from '@/lib/agents/schemas/signal-detector';
import { buildSystemPrompt, buildUserMessage } from '@/lib/agents/prompts/signal-detector';
import Anthropic from '@anthropic-ai/sdk';

export class SignalDetectorAgent extends Agent {
  async validateInputSchema(input: AgentInput): Promise<void> {
    signalDetectorInputSchema.parse(input);
  }

  async fetchContext(input: AgentInput): Promise<Record<string, unknown>> {
    // Fetch the ingested content from Supabase
    const { data: content, error } = await this.supabase
      .from('ingested_content')
      .select('id, title, body, source_url, published_date')
      .eq('id', input.data.contentId)
      .single();

    if (error || !content) {
      throw new Error(`Content not found: ${input.data.contentId}`);
    }

    // Check if already processed (idempotency)
    const { data: existing } = await this.supabase
      .from('agent_signals')
      .select('id')
      .eq('ingested_content_id', content.id)
      .single();

    if (existing) {
      this.log('info', 'Signal already detected for this content, skipping');
    }

    return {
      contentId: content.id,
      contentTitle: content.title,
      contentBody: content.body,
      contentSource: content.source_url,
      publishedDate: content.published_date,
    };
  }

  protected async buildPrompts(
    input: AgentInput
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const systemPrompt = buildSystemPrompt();
    const userMessage = buildUserMessage({
      contentId: input.data.contentId as string,
      title: input.context?.contentTitle as string,
      content: input.context?.contentBody as string,
      source: input.context?.contentSource as string,
      publishedDate: input.context?.publishedDate as string,
    });

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(response: Anthropic.Message): Promise<unknown> {
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Expected text response from Claude');
    }

    // Try to extract JSON from the response
    // Claude might include markdown backticks, so strip them
    let jsonText = content.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    }
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }

    const parsed = JSON.parse(jsonText.trim());

    // Validate against output schema
    return signalDetectorOutputSchema.parse(parsed);
  }

  protected getOutputTableName(): string {
    return 'agent_signals';
  }

  protected async persistOutput(output: AgentOutput): Promise<void> {
    const validatedOutput = signalDetectorOutputSchema.parse(output.data);

    // Upsert to handle re-runs
    const { error } = await this.supabase.from('agent_signals').upsert(
      [
        {
          task_id: output.taskId,
          pipeline_run_id: output.pipelineRunId,
          ingested_content_id: output.data.contentId,
          signal_data: validatedOutput.signals,
          detection_rationale: validatedOutput.detection_rationale,
          execution_metadata: output.metadata,
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'task_id' }
    );

    if (error) throw error;

    // Mark content as processed
    await this.supabase
      .from('ingested_content')
      .update({
        signals_detected: true,
        signals_detected_at: new Date().toISOString(),
      })
      .eq('id', output.data.contentId);

    // Log success
    await this.log('info', 'Signals detected and persisted', {
      signalCount: validatedOutput.signals.length,
      contentId: output.data.contentId,
    });

    // Emit event for downstream subscribers
    await this.supabase.realtime.send(
      'broadcast',
      {
        event: 'agent_completed',
        payload: {
          taskId: output.taskId,
          agentName: this.config.name,
          signalCount: validatedOutput.signals.length,
          timestamp: new Date().toISOString(),
        },
      }
    );
  }

  private async log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context?: Record<string, any>
  ) {
    await this.supabase.from('agent_logs').insert([
      {
        task_id: this.taskId,
        agent_name: this.config.name,
        level,
        message,
        context,
        created_at: new Date().toISOString(),
      },
    ]);

    const levelEmoji = { debug: '🐛', info: 'ℹ️', warn: '⚠️', error: '❌' };
    console.log(
      `[${this.config.name}:${level}] ${message}`,
      context ? JSON.stringify(context, null, 2) : ''
    );
  }
}

// Export for easy importing
export async function createSignalDetectorAgent(
  config?: Partial<AgentConfig>
): Promise<SignalDetectorAgent> {
  return new SignalDetectorAgent({
    name: 'signal-detector',
    description: 'Detect meaningful signals from ingested content',
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_KEY!,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
    ...config,
  });
}
```

**Prompts:**
```typescript
// lib/agents/prompts/signal-detector.ts
export function buildSystemPrompt(): string {
  return `You are a market signal detection expert. Your role is to analyze ingested content and identify meaningful signals that indicate where AI-driven disruption is emerging.

Signal types to detect:
1. NEW AI CAPABILITIES: New model releases, breakthroughs in reasoning, multimodal improvements, agent frameworks
2. REGULATORY SHIFTS: New laws, deregulation, compliance changes that open or close markets
3. MARKET DISRUPTIONS: Acquisitions, bankruptcies, major pricing changes, consolidation
4. AUTOMATION OPPORTUNITIES: Tasks that were previously manual that AI can now handle
5. CUSTOMER_PAIN: Recurring complaints, unmet needs, workarounds that indicate inefficiency

For each signal detected, extract:
- Type (one of: AI_CAPABILITY, REGULATORY_SHIFT, MARKET_DISRUPTION, AUTOMATION_OPPORTUNITY, CUSTOMER_PAIN)
- Confidence (HIGH, MEDIUM, LOW)
- Affected market(s) or industry
- Why it matters
- How it creates a disruption window (IMMEDIATE, NEAR_TERM, MEDIUM_TERM)

Return ONLY valid JSON. No markdown, no explanation.`;
}

export function buildUserMessage(input: {
  contentId: string;
  title: string;
  content: string;
  source: string;
  publishedDate: string;
}): string {
  return `Analyze this content for market signals:

TITLE: ${input.title}
SOURCE: ${input.source}
DATE: ${input.publishedDate}

CONTENT:
${input.content}

Return a JSON object with this structure:
{
  "signals": [
    {
      "type": "AI_CAPABILITY" | "REGULATORY_SHIFT" | "MARKET_DISRUPTION" | "AUTOMATION_OPPORTUNITY" | "CUSTOMER_PAIN",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "title": "string",
      "description": "string",
      "affected_markets": ["string", ...],
      "why_it_matters": "string",
      "disruption_window_urgency": "IMMEDIATE" | "NEAR_TERM" | "MEDIUM_TERM",
      "source_links": ["url", ...]
    }
  ],
  "detection_rationale": "string (optional)"
}

If no signals are detected, return {"signals": [], "detection_rationale": "..."}`;
}
```

**API Endpoint:**
```typescript
// app/api/agents/signal-detector/route.ts
import { createSignalDetectorAgent } from '@/lib/agents/signal-detector/SignalDetectorAgent';
import { AgentInput } from '@/lib/agents/Agent';

export const config = {
  maxDuration: 60, // 60 seconds for Vercel function
};

export async function POST(request: Request) {
  const input: AgentInput = await request.json();

  const agent = await createSignalDetectorAgent();

  try {
    const output = await agent.run(input);
    return Response.json(output, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      {
        taskId: input.taskId,
        error: message,
        status: 'failed',
      },
      { status: 500 }
    );
  }
}
```

---

## Quick Start Checklist

When building a new agent, follow this checklist:

- [ ] Create input/output Zod schemas in `lib/agents/schemas/{name}.ts`
- [ ] Create prompts in `lib/agents/prompts/{name}.ts`
- [ ] Create agent class extending `Agent` base class in `lib/agents/{name}/{Name}Agent.ts`
- [ ] Implement: `buildPrompts()`, `parseResponse()`, `getOutputTableName()`
- [ ] Optionally implement: `validateInputSchema()`, `fetchContext()`
- [ ] Create Supabase tables for inputs/outputs
- [ ] Create API route `/app/api/agents/{name}/route.ts`
- [ ] Add unit tests with mocked LLM responses
- [ ] Add integration tests with test Supabase instance
- [ ] Set concurrency limits in `AGENT_CONFIG`
- [ ] Document cost expectations
- [ ] Add to monitoring dashboard

---

## Summary

Every agent in Company Builder:

1. **Extends the base `Agent` class** for consistent LLM calling, error handling, and persistence
2. **Defines strict input/output schemas** using Zod
3. **Manages prompts** in code-coupled prompt files that can be overridden from Supabase
4. **Uses Supabase as the data layer** for all inputs, outputs, and communication
5. **Logs structured data** to Supabase for observability
6. **Tracks costs** per execution and per agent
7. **Is invoked asynchronously** via HTTP, cron, edge functions, or queues
8. **Achieves idempotency** via upserts and deterministic task IDs
9. **Is tested** with mocked LLM responses and integration tests
10. **Emits events** for downstream subscribers and real-time visibility

This pattern ensures that all 18 agents in the system are built consistently, are easy to debug, and scale predictably.
