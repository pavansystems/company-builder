import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { z } from 'zod';
import type { AgentInput, Concept, ConceptScore } from '@company-builder/types';
import { AgentPersistenceError } from '@company-builder/core';
import { ConceptSelectorInputSchema, ConceptSelectorOutputSchema } from '../schemas';

interface ConceptSelectorContext {
  concepts: Concept[];
  scores: ConceptScore[];
}

interface ConceptSelectorOutput {
  selectedConceptIds: string[];
  rejectedConceptIds: string[];
  selectionRationale: string;
  confidence: number;
}

interface ConceptSelectorLLMResponse {
  selectedConceptIds: string[];
  rejectedConceptIds: string[];
  selectionRationale: string;
  confidence: number;
}

export class ConceptSelectorAgent extends Agent {
  protected getInputSchema(): z.ZodType<unknown> {
    return ConceptSelectorInputSchema;
  }

  protected getOutputSchema(): z.ZodType<unknown> {
    return ConceptSelectorOutputSchema;
  }

  protected getOutputTableName(): string {
    return 'gate_decisions';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const context = ConceptSelectorInputSchema.parse(input.context) as unknown as ConceptSelectorContext;
    const { concepts, scores } = context;

    // Build a lookup from conceptId -> score
    const scoreByConceptId = new Map<string, ConceptScore>();
    for (const score of scores) {
      scoreByConceptId.set(score.concept_id, score);
    }

    const systemPrompt = `You are the Concept Selector agent for the Company Builder platform — the Phase 1 gate that determines which concepts advance to Phase 2 deep validation.

Your mission is to select the best 2–3 concepts to advance to detailed market validation. This is a critical decision: Phase 2 is expensive (6 separate validation agents per concept), so you must be discriminating. Concepts that are weak, redundant, or undifferentiated should be firmly rejected.

## Selection Philosophy

You are not simply selecting the highest-scoring concepts — you are curating a portfolio. The ideal selection:
1. **Includes the strongest concept** by composite score (barring no fundamental showstoppers)
2. **Diversifies across market angles** — if two high-scoring concepts target identical customers with identical approaches, select only the stronger one and reject the redundant one
3. **Balances upside and risk** — a slightly lower-scoring concept with clear differentiation and defensibility may be preferable to a higher-scoring concept that depends on a single critical assumption

## Selection Rules

**Automatic criteria for rejection (even with a high score):**
- Concepts that are substantially duplicates of higher-scoring concepts (same customer + same approach + same pricing model)
- Concepts with a feasibility score of 3 or below (technology doesn't exist today)
- Concepts with agent leverage below 4 (not meaningfully agent-first)
- Concepts where the differentiation is so weak that incumbents could copy the core value proposition in under 6 months

**Criteria that support selection:**
- High composite score (≥7.0 is a strong signal)
- Strong agent leverage (≥7) indicating structural cost advantage
- High market fit (≥7) indicating the pain is real and large
- Complementary positioning relative to other selected concepts (different customer segment or mechanism)
- Clear path to 18-month MVP with available technology

## Selection Count

Select exactly 2–3 concepts. Do not select more. If fewer than 2 concepts meet the bar, select only the qualifying ones and explain why the others should not advance. If selecting fewer than 2, note this clearly.

## Output Requirements

For selected concepts, provide:
- Why this concept specifically advances (not just "it scored high")
- Which dimensions are strongest and why that matters for Phase 2 validation
- What Phase 2 must specifically validate to confirm viability

For rejected concepts, provide:
- The specific reason for rejection (not just "lower score")
- Whether it could be reconsidered and under what circumstances

## Output Schema

{
  "selectedConceptIds": ["string — concept ID"],
  "rejectedConceptIds": ["string — concept ID"],
  "selectionRationale": "string — 3-5 sentences explaining the portfolio selection strategy: why these concepts together form the right set to validate, what each brings to the portfolio, and what critical assumptions Phase 2 must test",
  "confidence": number — your confidence in this selection from 0.0 to 1.0
}`;

    // Build scored concept summaries
    const conceptSummaries = concepts
      .map((c) => {
        const score = scoreByConceptId.get(c.id);
        return `---
Concept ID: ${c.id}
Name: ${c.title}
Target Customer: ${c.target_customer_segment ?? 'Not specified'}
Value Proposition: ${c.value_proposition ?? 'Not provided'}
Summary: ${c.summary ?? 'Not provided'}
${
  score
    ? `Scores:
  - Composite: ${score.composite_score?.toFixed(2) ?? 'N/A'}
  - Innovation (Disruption Potential): ${score.disruption_potential ?? 'N/A'}/10
  - Market Fit (Revenue Clarity): ${score.revenue_clarity ?? 'N/A'}/10
  - Agent Leverage (Agent Readiness): ${score.agent_readiness ?? 'N/A'}/10
  - Feasibility: ${score.feasibility ?? 'N/A'}/10
  - Differentiation: ${score.differentiation ?? 'N/A'}/10
  - Scoring Rationale: ${score.reasoning ?? 'Not provided'}`
    : 'Scores: Not available'
}`;
      })
      .join('\n\n');

    const userMessage = `Select 2–3 concepts to advance to Phase 2 validation from the following ${concepts.length} scored concepts.

SCORED CONCEPTS (sorted by score where available):
${conceptSummaries}

Apply the selection philosophy: select the strongest concepts that form a diverse, high-quality portfolio. Reject concepts that are redundant, insufficiently agent-first, technically infeasible, or undifferentiated. Provide specific rationale for every decision — selected and rejected.`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(response: Anthropic.Message): Promise<ConceptSelectorOutput> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';
    const cleaned = rawText
      .replace(/^```json\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    let parsed: ConceptSelectorLLMResponse;
    try {
      parsed = JSON.parse(cleaned) as ConceptSelectorLLMResponse;
    } catch {
      throw new Error(
        `ConceptSelectorAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 300)}`,
      );
    }

    return {
      selectedConceptIds: parsed.selectedConceptIds ?? [],
      rejectedConceptIds: parsed.rejectedConceptIds ?? [],
      selectionRationale: parsed.selectionRationale ?? '',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    };
  }

  protected async persistOutput(output: unknown, input: AgentInput): Promise<void> {
    const result = output as ConceptSelectorOutput;
    const { selectedConceptIds, rejectedConceptIds } = result;

    const errors: string[] = [];

    // Update selected concepts' status
    if (selectedConceptIds.length > 0) {
      const { error: selectedError } = await this.supabase
        .from('concepts')
        .update({ selected_for_validation: true })
        .in('id', selectedConceptIds);

      if (selectedError !== null) {
        errors.push(`Failed to mark selected concepts: ${selectedError.message}`);
      }
    }

    // Update rejected concepts' status
    if (rejectedConceptIds.length > 0) {
      const { error: rejectedError } = await this.supabase
        .from('concepts')
        .update({ selected_for_validation: false, is_active: false })
        .in('id', rejectedConceptIds);

      if (rejectedError !== null) {
        errors.push(`Failed to mark rejected concepts: ${rejectedError.message}`);
      }
    }

    // Insert gate decision record
    const { error: gateError } = await this.supabase.from('gate_decisions').insert({
      gate_phase: 'phase_1_concept_selection',
      pipeline_item_id: input.pipeline_item_id ?? crypto.randomUUID(),
      decision: selectedConceptIds.length > 0 ? 'pass' : 'fail',
      decision_by: 'concept-selector-agent',
      decision_reason: result.selectionRationale,
      pre_decision_data: output as Record<string, unknown>,
      decided_at: new Date().toISOString(),
    });

    if (gateError !== null) {
      errors.push(`Failed to insert gate decision: ${gateError.message}`);
    }

    if (errors.length > 0) {
      throw new AgentPersistenceError(
        `ConceptSelectorAgent persistence errors: ${errors.join('; ')}`,
      );
    }
  }
}
