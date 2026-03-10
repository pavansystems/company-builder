// Model pricing constants (per 1M tokens)
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-6': { input: 15, output: 75 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-haiku-4-5-20251001': { input: 0.25, output: 1.25 },
};

// Fallback pricing for unknown models (use Sonnet pricing as a reasonable default)
const FALLBACK_PRICING = { input: 3, output: 15 };

/**
 * Estimates the cost in USD for a given model and token usage.
 *
 * @param modelId - The Anthropic model identifier
 * @param inputTokens - Number of input tokens consumed
 * @param outputTokens - Number of output tokens generated
 * @returns Estimated cost in USD
 */
export function estimateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = PRICING[modelId] ?? FALLBACK_PRICING;
  const inputCost = (inputTokens * pricing.input) / 1_000_000;
  const outputCost = (outputTokens * pricing.output) / 1_000_000;
  return inputCost + outputCost;
}
