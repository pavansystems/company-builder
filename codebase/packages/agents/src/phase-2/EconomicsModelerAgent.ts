import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { AgentInput, Concept, MarketOpportunity } from '@company-builder/types';

interface EconomicsModelerContext {
  conceptId: string;
  concept: Concept;
  opportunity: MarketOpportunity;
}

interface UnitEconomicsDetail {
  revenueModel: string;
  arpu: number;
  cogs: number;
  grossMarginPercent: number;
  cac: number;
  paybackPeriodMonths: number;
  ltv: number;
  ltvCacRatio: number;
  breakevenMonths: number;
  operatingCostStructure: Record<string, number>;
  scenarioAnalysis: {
    bear: { grossMarginPercent: number; ltvCacRatio: number; breakevenMonths: number };
    base: { grossMarginPercent: number; ltvCacRatio: number; breakevenMonths: number };
    bull: { grossMarginPercent: number; ltvCacRatio: number; breakevenMonths: number };
  };
}

interface EconomicsModelerOutput {
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  grossMarginPercent: number;
  breakevenMonths: number;
  unitEconomicsJson: UnitEconomicsDetail;
}

export class EconomicsModelerAgent extends Agent {
  protected getOutputTableName(): string {
    return 'validations';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const context = input.context as unknown as EconomicsModelerContext;
    const { concept, opportunity } = context;

    const systemPrompt = `You are the Economics Modeler agent for the Company Builder platform — the financial modeling engine of Phase 2 Validation.

Your mission is to construct defensible unit economics for a specific agent-first startup concept. Your model must be grounded in observable market benchmarks, not aspirational assumptions. A venture capitalist evaluating pre-seed or seed investment would test your numbers against comparable companies — your estimates must survive that scrutiny.

## Unit Economics Framework

### Revenue Side

**ARPU (Annual Recurring Revenue per Customer):**
Ground this in the customer validation data and competitive pricing signals. Consider:
- What are incumbents charging for comparable value?
- What willingness-to-pay signals emerged from community research?
- What is the customer's quantified cost of the problem being solved?
- What pricing model fits the value delivery pattern (per-seat, per-usage, outcome-based)?

**Churn Rate:**
Estimate monthly churn based on comparable SaaS benchmarks for the target segment:
- SMB: 3–7% monthly churn is typical
- Mid-market: 1–3% monthly churn
- Enterprise: 0.5–1.5% monthly churn (but longer sales cycles)

**LTV Calculation:** LTV = ARPU × (1 / monthly_churn_rate) × gross_margin

### Cost Side

**COGS (Cost of Goods Sold) — Agent-First Model:**
This is where agent-first startups differ fundamentally from incumbent models. COGS includes:
- **LLM API costs**: Estimate tokens per customer request × price per 1M tokens × monthly request volume. For 2024–2026 pricing, assume $0.003–0.015 per 1K output tokens for Claude/GPT-4 class models, declining 30–50% per year.
- **Infrastructure**: Cloud compute, vector database storage, API gateway, monitoring
- **Human oversight labor**: QA spot-checking, escalation handling (even in agent-first, budget 5–15% of value delivery for human review)
- **Third-party APIs**: Any data enrichment, integrations, or services consumed per transaction

Target gross margins for sustainable SaaS:
- 70%+ is the benchmark for healthy software
- 60–70% is acceptable in early stage with clear path to improvement
- Below 60% signals COGS structure needs redesign

**CAC (Customer Acquisition Cost):**
Ground CAC in the go-to-market model:
- **Product-led growth / self-serve**: CAC = $500–$5,000 (lower sales overhead, higher marketing spend)
- **Inside sales**: CAC = $5,000–$25,000 (SDR + AE blended cost per close)
- **Enterprise field sales**: CAC = $25,000–$100,000+ (long cycles, high touch)
Include both fully-loaded sales team costs and marketing spend in your CAC estimate.

**LTV:CAC Ratio Benchmarks:**
- 3:1 is the minimum threshold for a fundable SaaS business
- 5:1 is healthy
- 8:1+ is exceptional and signals pricing power or viral growth

**Payback Period:**
Months to recover CAC from gross profit. Target < 18 months for most SaaS; < 12 months is excellent.

**Breakeven:**
Months to operational profitability from first dollar of revenue, assuming the model scales to 100 customers (not break-even on a single customer).

### Scenario Analysis

Model three scenarios:
- **Bear**: Higher churn (50% above base), lower ARPU (20% below base), higher CAC (50% above base), LLM costs don't decline
- **Base**: Your best estimates using conservative assumptions
- **Bull**: Lower churn (25% below base), higher ARPU (30% above base from expansion revenue), LLM cost curve plays out (30% annual decline)

## Output Schema

Respond with JSON matching this exact structure:

{
  "cac": number — base case CAC in USD,
  "ltv": number — base case LTV in USD,
  "ltvCacRatio": number — base case LTV:CAC ratio,
  "grossMarginPercent": number — base case gross margin as a percentage (e.g., 72.5),
  "breakevenMonths": number — base case months to operational breakeven,
  "unitEconomicsJson": {
    "revenueModel": "string — pricing model description (e.g., 'per-seat subscription at $299/month, annual contract')",
    "arpu": number — annual revenue per customer in USD,
    "cogs": number — monthly COGS per customer in USD,
    "grossMarginPercent": number — gross margin percentage,
    "cac": number — customer acquisition cost in USD,
    "paybackPeriodMonths": number — months to recover CAC from gross profit,
    "ltv": number — lifetime value in USD,
    "ltvCacRatio": number — LTV to CAC ratio,
    "breakevenMonths": number — months to operational breakeven,
    "operatingCostStructure": {
      "llm_api_costs_monthly_per_customer": number,
      "infrastructure_monthly_per_customer": number,
      "human_oversight_monthly_per_customer": number,
      "third_party_apis_monthly_per_customer": number
    },
    "scenarioAnalysis": {
      "bear": { "grossMarginPercent": number, "ltvCacRatio": number, "breakevenMonths": number },
      "base": { "grossMarginPercent": number, "ltvCacRatio": number, "breakevenMonths": number },
      "bull": { "grossMarginPercent": number, "ltvCacRatio": number, "breakevenMonths": number }
    }
  }
}`;

    const userMessage = `Model the unit economics for this agent-first startup concept.

CONCEPT:
Name: ${concept.title}
Summary: ${concept.summary ?? 'Not provided'}
Value Proposition: ${concept.value_proposition ?? 'Not provided'}
Target Customer: ${concept.target_customer_segment ?? 'Not specified'}
Agent Architecture: ${concept.agent_architecture_sketch ?? 'Not provided'}

MARKET OPPORTUNITY CONTEXT:
Title: ${opportunity.title}
Target Market: ${opportunity.target_market ?? 'Not specified'}
Target Industry: ${opportunity.target_industry ?? 'Not specified'}
Phase 0 Estimated Market Size: ${opportunity.market_size_estimate != null ? `$${opportunity.market_size_estimate.toLocaleString()}` : 'Not available'}

Build a defensible unit economics model grounded in observable benchmarks. Estimate ARPU from competitive pricing and WTP signals, model COGS with explicit LLM API cost assumptions, estimate CAC based on the required go-to-market motion, compute LTV and LTV:CAC ratio, and project breakeven timeline. Run bear/base/bull scenarios. Every key assumption must be justified by a market comparable or a logical derivation — no unsupported assertions.`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(response: Anthropic.Message): Promise<EconomicsModelerOutput> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';
    const cleaned = rawText
      .replace(/^```json\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    let parsed: EconomicsModelerOutput;
    try {
      parsed = JSON.parse(cleaned) as EconomicsModelerOutput;
    } catch {
      throw new Error(
        `EconomicsModelerAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 300)}`,
      );
    }

    return parsed;
  }

  protected async persistOutput(output: unknown, input: AgentInput): Promise<void> {
    const context = input.context as unknown as EconomicsModelerContext;
    const { conceptId } = context;
    const result = output as EconomicsModelerOutput;

    const { error } = await this.supabase.from('validations').insert({
      concept_id: conceptId,
      validation_phase: 'economics',
      cac: result.cac,
      ltv: result.ltv,
      ltv_cac_ratio: result.ltvCacRatio,
      gross_margin_percent: result.grossMarginPercent,
      breakeven_months: result.breakevenMonths,
      unit_economics_json: result.unitEconomicsJson as unknown as Record<string, unknown>,
      validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error !== null) {
      throw new Error(`EconomicsModelerAgent: Failed to persist output: ${error.message}`);
    }
  }
}
