import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { z } from 'zod';
import type { AgentInput, MarketOpportunity } from '@company-builder/types';
import { LandscapeAnalystInputSchema, LandscapeAnalystOutputSchema } from '../schemas';

interface LandscapeAnalystContext {
  opportunityId: string;
  opportunity: MarketOpportunity;
}

interface IncumbentEntry {
  name: string;
  marketShare: string;
  weakness: string;
}

interface EmergingPlayer {
  name: string;
  stage: string;
  angle: string;
}

interface LandscapeAnalystOutput {
  incumbents: IncumbentEntry[];
  emergingPlayers: EmergingPlayer[];
  technologyTrends: string[];
  maturityLevel: 'nascent' | 'emerging' | 'growing' | 'mature';
  agentDisruptionAngle: string;
}

export class LandscapeAnalystAgent extends Agent {
  protected getInputSchema(): z.ZodType<unknown> {
    return LandscapeAnalystInputSchema;
  }

  protected getOutputSchema(): z.ZodType<unknown> {
    return LandscapeAnalystOutputSchema;
  }

  protected getOutputTableName(): string {
    return 'validations';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const context = LandscapeAnalystInputSchema.parse(input.context);
    const { opportunity } = context;

    const systemPrompt = `You are the Landscape Analyst agent for the Company Builder platform — the foundational intelligence engine of Phase 1 Ideation.

Your responsibility is to build a comprehensive, structured map of the current market state for a given opportunity. You are not merely listing companies — you are performing a systematic competitive intelligence operation that will serve as the authoritative reference for all downstream analysis in Phase 1: Pain Extractor, Concept Generator, and Concept Scorer.

## Core Analytical Mission

You think systematically about markets. For every opportunity, you must identify:

**Incumbents:** Who are the established players with meaningful market share? For each, you document their market position (as a percentage or a qualitative description), and critically their most exploitable public weakness — a structural vulnerability that an agent-first challenger could exploit. Weaknesses to look for include: legacy technology stacks, premium pricing that squeezes out SMBs, human-labor-intensive delivery models, poor API integrations, slow feature velocity, or geographic blind spots.

**Emerging Players:** Who are the fast-moving challengers, well-funded startups, or niche specialists that signal market motion? For each, capture their funding/growth stage and their specific strategic angle — what makes them different from incumbents?

**Technology Trends:** What are the macro-level technology forces shaping this market? Think: AI capability improvements, cloud migration, API economy growth, open-source disruption, regulatory-driven tech adoption, or hardware cost changes. List 4–8 specific, actionable trends — not generic observations.

**Market Maturity:** Assess the market's lifecycle stage with precision:
- **nascent**: Category barely exists; customers solving problem manually or not at all; no clear leader
- **emerging**: 2–5 players with product-market fit; accelerating investment; no dominant incumbent
- **growing**: Clear leaders exist with significant revenue; market expanding 15%+ annually; standardization underway
- **mature**: Dominant players with 40%+ market share; commoditization pressure; growth slowing to single digits

**Agent Disruption Angle:** This is your single most important output. Articulate the precise way that an AI-agent-first business could structurally outperform incumbents in this market. This is not a generic "AI can automate things" statement — it must be specific to this market's value chain and labor dependencies. Where are humans currently doing repetitive, high-volume, or context-switching work that agents could do at 1/10th the cost?

## Quality Standards

- Be specific: name actual companies, cite observable behaviors, and avoid generic "players in this space" language
- Be honest about confidence: if you're estimating market share from public signals rather than verified data, phrase it as an estimate
- Be actionable: every incumbents' weakness should be something a founder could exploit within 18 months
- Focus on the agent-first opportunity: always filter your analysis through the lens of "what does this mean for an AI agent-first business?"

## Output Format

Respond with a JSON object matching this exact schema:

{
  "incumbents": [
    {
      "name": "string — company name",
      "marketShare": "string — percentage (e.g., '~35%') or qualitative (e.g., 'dominant', 'significant player')",
      "weakness": "string — specific, exploitable structural weakness observable from public data"
    }
  ],
  "emergingPlayers": [
    {
      "name": "string — company name",
      "stage": "string — funding stage, founding year context, or growth signal (e.g., 'Series B, $40M raised', 'bootstrapped, growing 300% YoY')",
      "angle": "string — what makes this player different from incumbents"
    }
  ],
  "technologyTrends": ["string — specific, named technology trend shaping this market"],
  "maturityLevel": "nascent|emerging|growing|mature",
  "agentDisruptionAngle": "string — precise description of the agent-first disruption opportunity, including which workflow steps agents could own and what the cost or speed advantage would be"
}`;

    const userMessage = `Analyze the following market opportunity and produce a landscape report.

OPPORTUNITY:
Title: ${opportunity.title}
Description: ${opportunity.description ?? 'Not provided'}
Target Market: ${opportunity.target_market ?? 'Not specified'}
Target Industry: ${opportunity.target_industry ?? 'Not specified'}
Problem Statement: ${opportunity.problem_statement ?? 'Not provided'}
Enabling Signals: ${opportunity.enabling_signals?.join('; ') ?? 'None listed'}
Estimated Market Size: ${opportunity.market_size_estimate != null ? `$${opportunity.market_size_estimate.toLocaleString()}` : 'Unknown'}
Competitive Density: ${opportunity.competitive_density ?? 'Unknown'}
Agent Readiness Tag: ${opportunity.agent_readiness_tag ?? 'Unknown'}

Deliver a comprehensive landscape analysis covering: 3–6 incumbents with their market positions and specific weaknesses, 2–4 emerging players with their stage and competitive angle, 4–8 technology trends shaping this space, the market maturity level, and a precise agent disruption angle that identifies exactly which human workflows agents could automate and at what economic advantage.`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(response: Anthropic.Message): Promise<LandscapeAnalystOutput> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';
    const cleaned = rawText
      .replace(/^```json\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    let parsed: LandscapeAnalystOutput;
    try {
      parsed = JSON.parse(cleaned) as LandscapeAnalystOutput;
    } catch {
      throw new Error(
        `LandscapeAnalystAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 300)}`,
      );
    }

    return parsed;
  }

  protected async persistOutput(output: unknown, input: AgentInput): Promise<void> {
    const context = LandscapeAnalystInputSchema.parse(input.context);
    const { opportunityId } = context;

    const { error } = await this.supabase.from('validations').insert({
      concept_id: opportunityId,
      validation_phase: 'landscape' as const,
      output: output,
      validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error !== null) {
      throw new Error(`LandscapeAnalystAgent: Failed to persist output: ${error.message}`);
    }
  }
}
