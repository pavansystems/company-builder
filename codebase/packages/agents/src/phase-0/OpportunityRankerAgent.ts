import Anthropic from '@anthropic-ai/sdk';
import { Agent, computeWeightedScore } from '@company-builder/core';
import type { z } from 'zod';
import type { AgentInput, MarketOpportunity, OpportunityScoreInsert } from '@company-builder/types';
import { OpportunityRankerInputSchema, OpportunityRankerOutputSchema } from '../schemas';

interface OpportunityRankerContext {
  opportunities: MarketOpportunity[];
}

interface DimensionScoreRaw {
  score: number; // 0-100
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface RawOpportunityScoreResult {
  market_opportunity_id: string;
  market_size_score: number;
  signal_convergence_score: number;
  agent_readiness_score: number;
  competitive_density_score: number;
  timing_confidence_score: number;
  dimensions: {
    market_size: DimensionScoreRaw;
    signal_convergence: DimensionScoreRaw;
    agent_readiness: DimensionScoreRaw;
    competitive_density: DimensionScoreRaw;
    timing_confidence: DimensionScoreRaw;
  };
  scoring_rationale: string;
}

interface OpportunityRankerLLMResponse {
  scored_opportunities: RawOpportunityScoreResult[];
}

// Scoring weights: must sum to 1.0
// Note: computeWeightedScore operates on 0-100 scale
const SCORING_WEIGHTS: Record<string, number> = {
  market_size: 0.25,
  signal_convergence: 0.20,
  agent_readiness: 0.25,
  competitive_density: 0.15,
  timing_confidence: 0.15,
};

export class OpportunityRankerAgent extends Agent {
  protected getInputSchema(): z.ZodType<unknown> {
    return OpportunityRankerInputSchema;
  }

  protected getOutputSchema(): z.ZodType<unknown> {
    return OpportunityRankerOutputSchema;
  }

  protected getOutputTableName(): string {
    return 'opportunity_scores';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const context = OpportunityRankerInputSchema.parse(input.context);
    const { opportunities } = context;

    const systemPrompt = `You are the Opportunity Ranker agent for the Company Builder platform's Phase 0 Discovery pipeline.

Your role is to score market opportunity candidates across five independent dimensions and provide the raw scores that will be combined into a composite ranking. You are a venture analyst and opportunity scout with deep expertise in AI/agent disruption, market sizing, and competitive dynamics.

# Scoring Framework

You score each opportunity on five dimensions, each on a scale of 0–100:

## Dimension 1: Market Size Score (weight: 25%)
Estimate the total addressable market (TAM) or serviceable addressable market (SAM) for this specific opportunity. Score based on the revenue opportunity available to an agent-first business.

Scoring curve:
- 0–19: TAM < $100M (niche, hard to build venture-scale company)
- 20–34: TAM $100M–$500M (respectable but limited ceiling)
- 35–49: TAM $500M–$1B (solid opportunity)
- 50–64: TAM $1B–$5B (strong opportunity)
- 65–79: TAM $5B–$20B (excellent)
- 80–89: TAM $20B–$100B (massive market)
- 90–100: TAM > $100B (generational opportunity)

Use bottom-up reasoning: (number of addressable customers) × (realistic annual contract value). Be conservative. State your assumptions.

## Dimension 2: Signal Convergence Score (weight: 20%)
How strong and diverse is the evidence base supporting this opportunity?

Scoring factors:
- Number of independent signals (more = stronger)
- Diversity of signal types (tech_breakthrough + customer_pain + regulatory_shift > just one type)
- Recency of signals (signals from last 30 days score higher)
- Average confidence of signals (higher confidence = higher score)

Scoring:
- 0–29: Single weak signal or no signals (don't create opportunities without signals)
- 30–49: Single signal, moderate confidence
- 50–64: 1-2 signals, decent confidence, single type
- 65–79: 2-3 signals, good confidence, mixed types
- 80–89: 3+ strong signals with high confidence, diverse types
- 90–100: 4+ high-confidence signals across 3+ types, very recent

## Dimension 3: Agent Readiness Score (weight: 25%)
How much of the value chain in this opportunity can AI agents automate or dramatically augment?

This is the most important predictor of a defensible agent-first moat. High agent-readiness means agents are the core product, not just a feature.

Scoring:
- 0–29: Mostly relationship-driven or high-judgment work; agents are a minor feature
- 30–49: Some automation possible but core work requires human judgment
- 50–64: 40–60% automatable; agents are meaningful but humans still do most value-add work
- 65–79: 60–80% automatable; agents handle core workflow, humans handle exceptions
- 80–89: 80–90% automatable; agents are the product; humans supervise and handle edge cases
- 90–100: >90% automatable; near-full agent replacement of human labor in this domain

Key factors:
- Data-driven work (high) vs. relationship-driven (low)
- Structured inputs/outputs (high) vs. ambiguous (low)
- High volume, repetitive tasks (high) vs. bespoke, creative (low)
- Clear success metrics (high) vs. subjective quality (low)

## Dimension 4: Competitive Density Score (weight: 15%)
How crowded is the space? Fewer competitors and weaker incumbents = higher score.

Note: A COMPLETELY empty market may indicate no real demand or extreme technical difficulty — penalize slightly.

Scoring:
- 0–19: Extremely crowded (20+ well-funded players, multiple unicorns defending the space)
- 20–34: Very crowded (10-20 significant players, hard to differentiate)
- 35–49: Crowded (6-10 established players; significant investment required to compete)
- 50–64: Moderate (3-5 players; market validated but there's room)
- 65–79: Sparse (1-2 early-stage competitors; first-mover advantages available)
- 80–89: Nascent (0-1 competitors; emerging space with real demand signals)
- 90–100: Whitespace with strong demand evidence (rare and extremely valuable)

## Dimension 5: Timing Confidence Score (weight: 15%)
How confident are we that the window of opportunity is open RIGHT NOW (not 2 years ago, not 2 years from now)?

Timing is critical: entering too early wastes capital; entering too late means no market share.

Scoring factors:
- Recency of enabling signals (very recent = higher score)
- Technology readiness (required AI capabilities are production-grade, not research-stage)
- Regulatory environment (favorable or neutral vs. hostile)
- Market momentum (other companies launching in space = window is open)
- Incumbent complacency (slow-moving incumbents = longer window)

Scoring:
- 0–29: Window appears closed (old signals, or market already saturated with AI solutions)
- 30–49: Window unclear; too early or timing uncertain
- 50–64: Window potentially open; technology approaching readiness
- 65–79: Window open; signals are recent; technology is production-ready
- 80–89: Window clearly open; multiple converging factors right now; urgency is real
- 90–100: Exceptional timing; rare confluence of factors creating a brief, high-value window

# Scoring Principles

## Be Specific in Reasoning
Don't say "large market." Say "$3–5B SAM based on 50,000 mid-market accounting firms at $50K–$100K/year ACV."

## Account for What You Don't Know
If information is missing or unclear:
- Use medium confidence (0.5 for market size confidence)
- Explain what assumptions you're making
- Don't inflate scores based on incomplete information

## Avoid Dimension Correlation Bias
Score each dimension independently. Agent readiness and market size should not inflate each other.

## Calibration Guide
A well-balanced high-potential opportunity should score:
- market_size: 60–80
- signal_convergence: 65–85
- agent_readiness: 70–90
- competitive_density: 50–75
- timing_confidence: 65–85
- composite (weighted): 65–82

Don't grade inflate. A score of 85+ on any dimension should be exceptional and clearly justified.

Respond with ONLY valid JSON. Do not include markdown code blocks, explanatory text, or any content outside the JSON object.`;

    const opportunityDescriptions = opportunities.map((opp) => {
      return `Opportunity ID: ${opp.id}
Title: ${opp.title}
Target Market: ${opp.target_market ?? 'N/A'}
Target Industry: ${opp.target_industry ?? 'N/A'}
Problem Statement: ${opp.problem_statement ?? 'N/A'}
Description: ${opp.description ?? 'N/A'}
Agent Readiness Tag: ${opp.agent_readiness_tag ?? 'N/A'}
Market Size Estimate: ${opp.market_size_estimate != null ? `$${(opp.market_size_estimate / 1e9).toFixed(1)}B` : 'unknown'}
Market Size Confidence: ${opp.market_size_confidence ?? 'unknown'}
Competitive Density: ${opp.competitive_density ?? 'unknown'}
Enabling Signal IDs: ${Array.isArray(opp.enabling_signals) ? opp.enabling_signals.join(', ') : 'none'}
Signal Count: ${Array.isArray(opp.enabling_signals) ? opp.enabling_signals.length : 0}
Created At: ${opp.created_at}`;
    }).join('\n\n---\n\n');

    const userMessage = `Score the following ${opportunities.length} market opportunity candidate(s) across all five dimensions. For each, provide independent dimension scores (0–100) and reasoning.

OPPORTUNITIES TO SCORE:
${opportunityDescriptions}

SCORING WEIGHTS FOR REFERENCE:
- Market Size: 25%
- Signal Convergence: 20%
- Agent Readiness: 25%
- Competitive Density: 15%
- Timing Confidence: 15%

Return a JSON object with this structure:
{
  "scored_opportunities": [
    {
      "market_opportunity_id": "<exact opportunity ID from above>",
      "market_size_score": <0-100>,
      "signal_convergence_score": <0-100>,
      "agent_readiness_score": <0-100>,
      "competitive_density_score": <0-100>,
      "timing_confidence_score": <0-100>,
      "dimensions": {
        "market_size": {
          "score": <0-100>,
          "confidence": "high|medium|low",
          "reasoning": "<specific reasoning with numbers/evidence>"
        },
        "signal_convergence": {
          "score": <0-100>,
          "confidence": "high|medium|low",
          "reasoning": "<specific reasoning>"
        },
        "agent_readiness": {
          "score": <0-100>,
          "confidence": "high|medium|low",
          "reasoning": "<specific reasoning — what % of tasks can agents handle?>"
        },
        "competitive_density": {
          "score": <0-100>,
          "confidence": "high|medium|low",
          "reasoning": "<specific reasoning — how many players, how well funded?>"
        },
        "timing_confidence": {
          "score": <0-100>,
          "confidence": "high|medium|low",
          "reasoning": "<specific reasoning — why is window open now?>"
        }
      },
      "scoring_rationale": "<2-3 sentence overall narrative connecting all dimensions>"
    }
  ]
}`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(response: Anthropic.Message): Promise<OpportunityScoreInsert[]> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';

    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let parsed: OpportunityRankerLLMResponse;
    try {
      parsed = JSON.parse(cleaned) as OpportunityRankerLLMResponse;
    } catch {
      throw new Error(`OpportunityRankerAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 200)}`);
    }

    if (!Array.isArray(parsed.scored_opportunities)) {
      throw new Error('OpportunityRankerAgent: LLM response missing "scored_opportunities" array');
    }

    const now = new Date().toISOString();

    return parsed.scored_opportunities.map((raw: RawOpportunityScoreResult): OpportunityScoreInsert => {
      // Clamp all dimension scores to 0-100
      const marketSizeScore = Math.min(100, Math.max(0, raw.market_size_score ?? 50));
      const signalConvergenceScore = Math.min(100, Math.max(0, raw.signal_convergence_score ?? 50));
      const agentReadinessScore = Math.min(100, Math.max(0, raw.agent_readiness_score ?? 50));
      const competitiveDensityScore = Math.min(100, Math.max(0, raw.competitive_density_score ?? 50));
      const timingConfidenceScore = Math.min(100, Math.max(0, raw.timing_confidence_score ?? 50));

      // Use the shared computeWeightedScore utility from @company-builder/core
      const dimensions: Record<string, number> = {
        market_size: marketSizeScore,
        signal_convergence: signalConvergenceScore,
        agent_readiness: agentReadinessScore,
        competitive_density: competitiveDensityScore,
        timing_confidence: timingConfidenceScore,
      };

      const compositeScore = computeWeightedScore(dimensions, SCORING_WEIGHTS);

      // Build reasoning text combining LLM reasoning with composite score
      const dimensionSummary = raw.dimensions
        ? Object.entries(raw.dimensions)
            .map(([dim, d]) => `${dim}: ${d.score}/100 (${d.confidence}) — ${d.reasoning}`)
            .join(' | ')
        : '';

      const reasoning = [
        raw.scoring_rationale ?? '',
        dimensionSummary ? `Dimension breakdown: ${dimensionSummary}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      return {
        market_opportunity_id: raw.market_opportunity_id,
        scored_at: now,
        scored_by: 'opportunity-ranker-agent',
        market_size_score: marketSizeScore,
        signal_convergence_score: signalConvergenceScore,
        agent_readiness_score: agentReadinessScore,
        competitive_density_score: competitiveDensityScore,
        timing_confidence_score: timingConfidenceScore,
        composite_score: Math.round(compositeScore * 10) / 10, // round to 1 decimal
        weight_market_size: SCORING_WEIGHTS.market_size ?? 0,
        weight_signal_convergence: SCORING_WEIGHTS.signal_convergence ?? 0,
        weight_agent_readiness: SCORING_WEIGHTS.agent_readiness ?? 0,
        weight_competitive_density: SCORING_WEIGHTS.competitive_density ?? 0,
        weight_timing_confidence: SCORING_WEIGHTS.timing_confidence ?? 0,
        reasoning: reasoning || null,
      };
    });
  }

  protected async persistOutput(output: unknown, _input: AgentInput): Promise<void> {
    const scores = output as OpportunityScoreInsert[];

    if (scores.length === 0) {
      return;
    }

    const { error } = await this.supabase.from(this.getOutputTableName()).insert(scores);

    if (error !== null) {
      throw new Error(`OpportunityRankerAgent: Failed to persist opportunity scores: ${error.message}`);
    }
  }
}
