import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { z } from 'zod';
import type { AgentInput, Concept, MarketOpportunity } from '@company-builder/types';
import { AgentPersistenceError } from '@company-builder/core';
import { ConceptScorerInputSchema, ConceptScorerOutputSchema } from '../schemas';

interface ConceptScorerContext {
  concepts: Concept[];
  opportunity: MarketOpportunity;
}

interface ScoringRationale {
  innovation: string;
  market_fit: string;
  agent_leverage: string;
  feasibility: string;
  differentiation: string;
}

interface ConceptScoreResult {
  conceptId: string;
  innovation_score: number;
  market_fit_score: number;
  agent_leverage_score: number;
  feasibility_score: number;
  differentiation_score: number;
  composite_score: number;
  scoring_rationale: ScoringRationale;
}

interface ConceptScorerLLMResponse {
  scores: ConceptScoreResult[];
}

// Weights per specification
const WEIGHTS = {
  innovation: 0.20,
  market_fit: 0.25,
  agent_leverage: 0.25,
  feasibility: 0.15,
  differentiation: 0.15,
};

export class ConceptScorerAgent extends Agent {
  protected getInputSchema(): z.ZodType<unknown> {
    return ConceptScorerInputSchema;
  }

  protected getOutputSchema(): z.ZodType<unknown> {
    return ConceptScorerOutputSchema;
  }

  protected getOutputTableName(): string {
    return 'concept_scores';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const context = ConceptScorerInputSchema.parse(input.context);
    const { concepts, opportunity } = context;

    const systemPrompt = `You are the Concept Scorer agent for the Company Builder platform — the analytical evaluation engine of Phase 1 Ideation.

Your mission is to score every submitted startup concept against a precise, five-dimensional rubric and produce a transparent, well-reasoned ranking. You transform concept sketches into a prioritized list with documented rationale that enables human reviewers and the Concept Selector to make confident selection decisions.

## Scoring Philosophy

You score analytically and honestly. You do NOT favor concepts based on novelty or ambition alone — you evaluate them against verifiable criteria grounded in the market context. You distinguish between:
- Genuine disruption vs. incremental improvement with "AI" added
- Strong agent leverage (agents doing core value creation) vs. AI-enhanced human workflows
- Feasible concepts using proven technology vs. speculative capabilities
- Defensible differentiation vs. easily replicated positioning

## Five Scoring Dimensions

### 1. Innovation Score (Weight: 20%)
Measures how fundamentally this concept departs from incumbent approaches and whether it reimagines how value is created.

- **9–10**: Structural business model change; creates a new category or eliminates an incumbent job function entirely; would force incumbent response; irreversible market shift if it succeeds
- **7–8**: Significant operational improvement (40%+ cost or speed advantage); enters from a substantially different angle than incumbents
- **5–6**: Meaningful improvement (20–40% advantage) but follows similar business model patterns to incumbents
- **3–4**: Incremental improvement; slightly better version of existing approaches
- **1–2**: Minor feature addition; easily cloned by incumbents within a few months

### 2. Market Fit Score (Weight: 25%)
Measures how directly and acutely this concept addresses the validated pain points. Does it solve the PRIMARY pain, a secondary pain, or a pain not in the catalog?

- **9–10**: Directly addresses the primary validated pain point; large, urgent target segment (50K+ potential customers); customers are actively searching for alternatives
- **7–8**: Addresses top 2–3 pain themes; sizeable market (20K+ customers); pain is real and frequent
- **5–6**: Addresses an identifiable pain but may be secondary; moderate market (10K+ customers); some urgency
- **3–4**: Pain addressed is real but niche or infrequent; smaller segment; lower urgency
- **1–2**: Pain is unclear, speculative, or not supported by the landscape/pain catalog

### 3. Agent Leverage Score (Weight: 25%)
Measures how deeply AI agents are embedded as the core value-creation mechanism — not just enhancements.

- **9–10**: Agents handle 85%+ of primary value delivery; humans handle only escalations and relationships; cost structure is fundamentally different from incumbents (60%+ lower COGS)
- **7–8**: Agents handle 70–85% of work; clear automation advantage; agent quality directly drives customer value
- **5–6**: Agents handle 50–70% of work; meaningful but not structural leverage; humans still central to delivery
- **3–4**: Agents handle 30–50% of work; AI-enhanced but fundamentally human-centric delivery
- **1–2**: Less than 30% agent-handled; not meaningfully agent-first; just AI tooling on top of human processes

### 4. Feasibility Score (Weight: 15%)
Measures whether this concept can be built with technology available today and shipped within 18 months.

- **9–10**: All required AI capabilities proven at production quality (LLMs, tool use, document understanding); straightforward integration path; no regulatory showstoppers
- **7–8**: Core capabilities proven; moderate integration complexity; known regulatory path
- **5–6**: Core capabilities exist but edge cases are challenging; some integration unknowns; regulatory review needed
- **3–4**: Some required capabilities are immature (need 6–12 months R&D); moderate-high technical risk
- **1–2**: Depends on capabilities that don't yet exist at required quality; would need 18+ months of research

### 5. Differentiation Score (Weight: 15%)
Measures the structural defensibility of the concept — why can't incumbents copy it in 12 months?

- **9–10**: Multiple hard-to-copy moats: proprietary training data, network effects, switching costs, regulatory certifications, or exclusive data partnerships
- **7–8**: Clear moat from at least one source; competitor response would require 2+ years of product overhaul
- **5–6**: Some differentiation (first-mover, switching costs) but could be commoditized in 12–24 months
- **3–4**: Minimal defensibility; incumbents could copy core logic in under 12 months with focused effort
- **1–2**: No defensibility; pure execution play with no structural advantage

## Composite Score Formula

composite = (innovation × 0.20) + (market_fit × 0.25) + (agent_leverage × 0.25) + (feasibility × 0.15) + (differentiation × 0.15)

All scores must be integers from 1–10. Composite scores will be between 1.0 and 10.0.

## Output Schema

Return a JSON object with scores for every concept:

{
  "scores": [
    {
      "conceptId": "string — exact concept ID from input",
      "innovation_score": number,
      "market_fit_score": number,
      "agent_leverage_score": number,
      "feasibility_score": number,
      "differentiation_score": number,
      "composite_score": number,
      "scoring_rationale": {
        "innovation": "string — 1-2 sentences explaining this score",
        "market_fit": "string — 1-2 sentences explaining this score",
        "agent_leverage": "string — 1-2 sentences explaining this score",
        "feasibility": "string — 1-2 sentences explaining this score",
        "differentiation": "string — 1-2 sentences explaining this score"
      }
    }
  ]
}`;

    const conceptDescriptions = concepts
      .map((c) => {
        const archSketch = c.agent_architecture_sketch
          ? (JSON.parse(c.agent_architecture_sketch) as Record<string, unknown>)
          : {};
        return `---
Concept ID: ${c.id}
Name: ${c.title}
Summary: ${c.summary ?? 'Not provided'}
Value Proposition: ${c.value_proposition ?? 'Not provided'}
Target Customer: ${c.target_customer_segment ?? 'Not specified'}
Agent Architecture: ${JSON.stringify(archSketch)}
Defensibility Notes: ${c.defensibility_notes ?? 'Not provided'}`;
      })
      .join('\n\n');

    const userMessage = `Score the following ${concepts.length} startup concepts using the five-dimensional rubric.

MARKET CONTEXT:
Title: ${opportunity.title}
Problem Statement: ${opportunity.problem_statement ?? 'Not provided'}
Target Market: ${opportunity.target_market ?? 'Not specified'}
Target Industry: ${opportunity.target_industry ?? 'Not specified'}
Enabling Signals: ${opportunity.enabling_signals?.join('; ') ?? 'None listed'}

CONCEPTS TO SCORE:
${conceptDescriptions}

Evaluate each concept rigorously on all five dimensions. Be specific in your rationale — reference the concept description, compare to incumbents, and justify each score with evidence from the market context above. Compute the composite score as: (innovation × 0.20) + (market_fit × 0.25) + (agent_leverage × 0.25) + (feasibility × 0.15) + (differentiation × 0.15).`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(response: Anthropic.Message): Promise<ConceptScoreResult[]> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';
    const cleaned = rawText
      .replace(/^[\s\S]*?```(?:json)?\s*\n?/i, '')
      .replace(/\s*```[\s\S]*$/, '')
      .trim();

    let parsed: ConceptScorerLLMResponse;
    try {
      parsed = JSON.parse(cleaned) as ConceptScorerLLMResponse;
    } catch {
      throw new Error(
        `ConceptScorerAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 300)}`,
      );
    }

    if (!Array.isArray(parsed.scores)) {
      throw new Error('ConceptScorerAgent: LLM response missing "scores" array');
    }

    // Recalculate composite scores to ensure formula is applied correctly
    return parsed.scores.map((s) => ({
      ...s,
      composite_score:
        s.innovation_score * WEIGHTS.innovation +
        s.market_fit_score * WEIGHTS.market_fit +
        s.agent_leverage_score * WEIGHTS.agent_leverage +
        s.feasibility_score * WEIGHTS.feasibility +
        s.differentiation_score * WEIGHTS.differentiation,
    }));
  }

  protected async persistOutput(output: unknown, _input: AgentInput): Promise<void> {
    const scores = output as ConceptScoreResult[];

    if (scores.length === 0) {
      return;
    }

    const rows = scores.map((s) => ({
      concept_id: s.conceptId,
      scored_at: new Date().toISOString(),
      scored_by: 'concept-scorer-agent',
      disruption_potential: s.innovation_score,
      agent_readiness: s.agent_leverage_score,
      feasibility: s.feasibility_score,
      differentiation: s.differentiation_score,
      revenue_clarity: s.market_fit_score,
      composite_score: s.composite_score,
      weight_disruption: WEIGHTS.innovation,
      weight_agent_readiness: WEIGHTS.agent_leverage,
      weight_feasibility: WEIGHTS.feasibility,
      weight_differentiation: WEIGHTS.differentiation,
      weight_revenue_clarity: WEIGHTS.market_fit,
      reasoning: JSON.stringify(s.scoring_rationale),
      account_id: this.accountId,
    }));

    const { error } = await this.supabase.from('concept_scores').insert(rows);

    if (error !== null) {
      throw new AgentPersistenceError(
        `ConceptScorerAgent: Failed to persist scores: ${error.message}`,
        error,
      );
    }
  }
}
