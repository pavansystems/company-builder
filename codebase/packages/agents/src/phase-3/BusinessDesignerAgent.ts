import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { AgentInput } from '@company-builder/types';
import type { Concept } from '@company-builder/types';

// ---------------------------------------------------------------------------
// Input context shape
// ---------------------------------------------------------------------------

interface BusinessDesignerContext {
  conceptId: string;
  concept: Concept;
  validationSynthesis: Record<string, unknown>;
  marketSizing: Record<string, unknown>;
  unitEconomics: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// LLM output shape
// ---------------------------------------------------------------------------

interface RevenueStream {
  name: string;
  type: 'subscription' | 'usage' | 'transaction' | 'license';
  description: string;
  estimatedShare: number;
}

interface PricingTierOutput {
  name: string;
  priceMonthly: number;
  features: string[];
  targetSegment: string;
}

interface FinancialProjectionMonth {
  month: number;
  revenue: number;
  costs: number;
  customers: number;
}

interface BusinessDesignerLLMResponse {
  revenueStreams: RevenueStream[];
  pricingTiers: PricingTierOutput[];
  financialProjection: FinancialProjectionMonth[];
}

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

export class BusinessDesignerAgent extends Agent {
  protected getOutputTableName(): string {
    return 'blueprints';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const ctx = input.context as unknown as BusinessDesignerContext;
    const { concept, validationSynthesis, marketSizing, unitEconomics } = ctx;

    const systemPrompt = `You are the Business Designer agent (Phase 3, Step 3.1) for the Company Builder platform.

Your sole responsibility is to translate a validated AI-first product concept into a financially coherent, market-tested business model. You define:
1. **Revenue Streams** — how and where money flows into the business
2. **Pricing Tiers** — concrete price points, packaging, and feature gates for each customer segment
3. **12-Month Financial Projection** — month-by-month revenue, costs, and customer count

## Design Principles

### Revenue Model Selection
You choose from four types and explain why each stream earns its place:
- **subscription**: recurring monthly/annual fee; best for workflow tools, ongoing value delivery
- **usage**: per-API-call, per-document, per-task; best when value directly scales with consumption
- **transaction**: percentage or flat fee per transaction processed; best for payments, brokerage, marketplace
- **license**: one-time or annual fee for IP access; best for enterprise, on-prem, or embedded products

### Pricing Tier Architecture
Design 2-4 tiers that create a natural upgrade ladder:
- **Free / Starter**: enough to prove value, zero friction for early adopters
- **Growth / Pro**: the primary revenue driver; the default upgrade path
- **Business / Scale**: volume discounts + team features; capture mid-market
- **Enterprise**: custom pricing, SSO, compliance, dedicated support

Each tier must have:
- A specific monthly price (in USD) — be precise, not "contact us"
- 4-8 concrete feature bullets
- A named target segment (who exactly buys this tier?)

### Financial Projection Methodology
Build a realistic 12-month projection:
- **Month 1-2**: Pre-revenue or seed customers only. Cost > Revenue.
- **Month 3-5**: Early adopter ramp. Unit economics should be visible but not yet positive cash flow.
- **Month 6-9**: Growth inflection. Volume discounts start showing in COGS.
- **Month 10-12**: Scaling. Revenue should be covering a meaningful fraction of operating costs.

Costs include:
- Agent compute (LLM API costs, proportional to customers and usage)
- Infrastructure (hosting, database, monitoring — scales sublinearly)
- Team salaries (based on hiring plan assumption: founder + 1-2 hires in this window)
- Marketing / GTM spend (typically 20-30% of revenue target)

Revenue assumptions must be consistent with market sizing SAM/SOM and unit economics CAC/LTV.

## Output Quality Standards
- Revenue share percentages across streams must sum to 100
- Pricing tiers must have clearly differentiated value propositions — no overlapping targets
- Month-by-month projection must show logical growth curve (no sudden jumps)
- Costs in month 1 should reflect real startup burn ($10k-$50k/month typical)
- Financial projections must align with the unit economics data provided`;

    const userMessage = `Design the complete business model for this validated AI-first concept.

## Concept
**Title:** ${concept.title}
**Summary:** ${concept.summary ?? 'Not provided'}
**Value Proposition:** ${concept.value_proposition ?? 'Not provided'}
**Target Customer Segment:** ${concept.target_customer_segment ?? 'Not provided'}
**Pain Points Addressed:** ${(concept.pain_points_addressed ?? []).join('; ')}
**Agent Architecture Sketch:** ${concept.agent_architecture_sketch ?? 'Not provided'}
**Defensibility Notes:** ${concept.defensibility_notes ?? 'Not provided'}

## Validation Synthesis
${JSON.stringify(validationSynthesis, null, 2)}

## Market Sizing
${JSON.stringify(marketSizing, null, 2)}

## Unit Economics
${JSON.stringify(unitEconomics, null, 2)}

## Required Output

Return a JSON object with EXACTLY this structure:

{
  "revenueStreams": [
    {
      "name": "string — name of the revenue stream",
      "type": "subscription | usage | transaction | license",
      "description": "string — 1-2 sentences on how this stream works and why it fits",
      "estimatedShare": number — percentage of total revenue (all streams must sum to 100)
    }
  ],
  "pricingTiers": [
    {
      "name": "string — tier name (e.g., Starter, Pro, Business, Enterprise)",
      "priceMonthly": number — exact monthly price in USD (0 for free tier),
      "features": ["string", ...] — 4-8 specific feature descriptions,
      "targetSegment": "string — who buys this tier specifically"
    }
  ],
  "financialProjection": [
    {
      "month": number — 1 through 12,
      "revenue": number — monthly revenue in USD,
      "costs": number — total monthly costs in USD,
      "customers": number — total paying customers at end of month
    }
  ]
}

Design a compelling, internally consistent business model grounded in the market and unit economics data above.`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(
    response: Anthropic.Message,
  ): Promise<BusinessDesignerLLMResponse> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let parsed: BusinessDesignerLLMResponse;
    try {
      parsed = JSON.parse(cleaned) as BusinessDesignerLLMResponse;
    } catch {
      throw new Error(
        `BusinessDesignerAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 300)}`,
      );
    }

    if (!Array.isArray(parsed.revenueStreams) || parsed.revenueStreams.length === 0) {
      throw new Error('BusinessDesignerAgent: revenueStreams is missing or empty');
    }
    if (!Array.isArray(parsed.pricingTiers) || parsed.pricingTiers.length === 0) {
      throw new Error('BusinessDesignerAgent: pricingTiers is missing or empty');
    }
    if (!Array.isArray(parsed.financialProjection) || parsed.financialProjection.length === 0) {
      throw new Error('BusinessDesignerAgent: financialProjection is missing or empty');
    }

    return parsed;
  }

  protected async persistOutput(
    output: unknown,
    input: AgentInput,
  ): Promise<void> {
    const ctx = input.context as unknown as BusinessDesignerContext;
    const { conceptId } = ctx;
    const data = output as BusinessDesignerLLMResponse;

    // Map LLM pricing tiers to the DB PricingTier shape
    const pricingTiersForDb = data.pricingTiers.map((t) => ({
      name: t.name,
      price: t.priceMonthly,
      features: t.features,
      target_segment: t.targetSegment,
    }));

    // Map financial projection to DB FinancialProjectionMonth shape
    const financialProjectionForDb = data.financialProjection.map((m) => ({
      month: m.month,
      revenue: m.revenue,
      costs: m.costs,
      margin: m.revenue > 0 ? Math.round(((m.revenue - m.costs) / m.revenue) * 100) : 0,
    }));

    // Upsert: create the row if it doesn't exist, update only blueprint columns
    const { error } = await this.supabase
      .from('blueprints')
      .upsert(
        {
          concept_id: conceptId,
          pricing_tiers: pricingTiersForDb,
          financial_projection: financialProjectionForDb,
          financial_projection_months: data.financialProjection.length,
          // Store revenue model derived from first/dominant stream type
          revenue_model: data.revenueStreams[0]?.type === 'subscription'
            ? 'subscription'
            : data.revenueStreams[0]?.type === 'usage'
            ? 'usage_based'
            : 'hybrid',
          // Store revenue streams + additional context in expansion field
          expansion_revenue_opportunities: {
            revenue_streams: data.revenueStreams,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'concept_id' },
      );

    if (error !== null) {
      throw new Error(`BusinessDesignerAgent: Failed to upsert blueprint: ${error.message}`);
    }
  }
}
