import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { AgentInput, Concept, MarketOpportunity } from '@company-builder/types';

interface MarketSizerContext {
  conceptId: string;
  concept: Concept;
  opportunity: MarketOpportunity;
}

interface MarketSizerOutput {
  tam: number;
  sam: number;
  som: number;
  tamMethodology: string;
  growthRate: number;
  keyAssumptions: string[];
  confidence: 'low' | 'medium' | 'high';
}

export class MarketSizerAgent extends Agent {
  protected getOutputTableName(): string {
    return 'validations';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const context = input.context as unknown as MarketSizerContext;
    const { concept, opportunity } = context;

    const systemPrompt = `You are the Market Sizer agent for the Company Builder platform — the quantitative market intelligence engine of Phase 2 Validation.

Your mission is to produce defensible TAM, SAM, and SOM estimates for a specific startup concept. These estimates must be specific, methodologically sound, and honestly confidence-rated. A venture capitalist would review your output when making an investment decision — it must withstand scrutiny.

## Core Methodology: Dual-Approach Estimation

You always use BOTH top-down and bottom-up approaches, then triangulate:

**Top-Down:** Start from the largest relevant industry classification, then apply successive narrowing filters — geography, customer segment, use case, and realistic adoption ceiling. Each filter must be documented with its basis.

Example: Legal services globally ($500B) → US only (40% = $200B) → Corporate legal departments (10% = $20B) → Contract automation addressable subset (25% = $5B) = TAM.

**Bottom-Up:** Count addressable customers directly, then multiply by annual revenue per customer.
- B2B: (number of target companies) × (% that could feasibly adopt) × (estimated ARPU per year)
- B2C: (target population) × (% with sufficient pain and budget) × (expected ARPU)

The two methodologies should converge within 2-3x of each other. If they diverge significantly, explain why.

## TAM / SAM / SOM Definitions

- **TAM (Total Addressable Market):** The total global or relevant-geography market if 100% of potential customers adopted the concept. This is an upper bound, not a realistic target.
- **SAM (Serviceable Addressable Market):** The portion of TAM that the concept can actually serve given its initial scope — constrained by geography, language, regulatory compliance, customer segment, and distribution model.
- **SOM (Serviceable Obtainable Market):** What the concept can realistically capture in its first 3–5 years. Typically 1–5% of SAM for a new entrant in a growing market.

## Confidence Calibration

- **high**: Two or more independent data sources converge; methodology is transparent; conservative adjustments applied
- **medium**: One strong data source or two weaker ones; some assumptions required; moderate uncertainty on one key variable
- **low**: Nascent market with limited data; heavy reliance on comparables or analogies; estimates could swing 3x in either direction

## Growth Rate

Estimate the market's annual growth rate (CAGR) based on observable signals: recent funding activity, job posting trends, search volume growth, incumbent revenue growth (for public companies), and industry analyst commentary. Be specific about which signals you're using.

## Output Schema

Respond with JSON matching this exact structure:

{
  "tam": number — total addressable market in USD (annual),
  "sam": number — serviceable addressable market in USD (annual),
  "som": number — serviceable obtainable market in USD (Year 3 estimate),
  "tamMethodology": "string — detailed explanation of how TAM was calculated, including both top-down and bottom-up approaches, data sources cited, and the specific filters applied",
  "growthRate": number — estimated annual market growth rate as a decimal (e.g., 0.15 for 15%),
  "keyAssumptions": [
    "string — each critical assumption that, if wrong by 50%, would materially change the estimate"
  ],
  "confidence": "low|medium|high"
}`;

    const userMessage = `Size the market for this startup concept.

CONCEPT:
Name: ${concept.title}
Summary: ${concept.summary ?? 'Not provided'}
Value Proposition: ${concept.value_proposition ?? 'Not provided'}
Target Customer: ${concept.target_customer_segment ?? 'Not specified'}

MARKET OPPORTUNITY CONTEXT:
Title: ${opportunity.title}
Description: ${opportunity.description ?? 'Not provided'}
Target Market: ${opportunity.target_market ?? 'Not specified'}
Target Industry: ${opportunity.target_industry ?? 'Not specified'}
Problem Statement: ${opportunity.problem_statement ?? 'Not provided'}
Phase 0 Estimated Market Size: ${opportunity.market_size_estimate != null ? `$${opportunity.market_size_estimate.toLocaleString()}` : 'Not available'}
Enabling Signals: ${opportunity.enabling_signals?.join('; ') ?? 'None listed'}

Produce TAM, SAM, and SOM estimates using both top-down and bottom-up approaches. Document your methodology thoroughly including the specific filters applied at each step, the data sources you are drawing from, and your 3–5 key assumptions. Rate your confidence honestly based on data quality.`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(response: Anthropic.Message): Promise<MarketSizerOutput> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';
    const cleaned = rawText
      .replace(/^```json\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    let parsed: MarketSizerOutput;
    try {
      parsed = JSON.parse(cleaned) as MarketSizerOutput;
    } catch {
      throw new Error(
        `MarketSizerAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 300)}`,
      );
    }

    return parsed;
  }

  protected async persistOutput(output: unknown, input: AgentInput): Promise<void> {
    const context = input.context as unknown as MarketSizerContext;
    const { conceptId } = context;
    const result = output as MarketSizerOutput;

    const { error } = await this.supabase.from('validations').insert({
      concept_id: conceptId,
      validation_phase: 'market_sizing',
      tam_estimate: result.tam,
      sam_estimate: result.sam,
      som_estimate: result.som,
      growth_rate_percent: result.growthRate * 100,
      market_sizing_methodology: result.tamMethodology,
      key_assumptions: result.keyAssumptions,
      tam_confidence: result.confidence === 'high' ? 0.8 : result.confidence === 'medium' ? 0.6 : 0.4,
      validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error !== null) {
      throw new Error(`MarketSizerAgent: Failed to persist output: ${error.message}`);
    }
  }
}
