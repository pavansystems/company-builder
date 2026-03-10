import { z } from 'zod';

export const AgentInputSchema = z.object({
  pipelineItemId: z.string().uuid().optional(),
  entityId: z.string().uuid().optional(),
  data: z.record(z.unknown()),
  context: z.record(z.unknown()).optional(),
});

export const AgentOutputSchema = z.object({
  agentName: z.string(),
  data: z.record(z.unknown()),
  metadata: z.object({
    runId: z.string().uuid(),
    inputTokens: z.number(),
    outputTokens: z.number(),
    estimatedCostUsd: z.number(),
    durationMs: z.number(),
  }),
});

export type AgentInputSchemaType = z.infer<typeof AgentInputSchema>;
export type AgentOutputSchemaType = z.infer<typeof AgentOutputSchema>;
