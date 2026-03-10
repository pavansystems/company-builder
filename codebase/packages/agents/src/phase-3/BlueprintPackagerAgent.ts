import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { AgentInput } from '@company-builder/types';

// ---------------------------------------------------------------------------
// Input context shape
// ---------------------------------------------------------------------------

interface BlueprintPackagerContext {
  conceptId: string;
  blueprintId: string;
}

// ---------------------------------------------------------------------------
// Fetched data shape (from Supabase)
// ---------------------------------------------------------------------------

interface BlueprintRow {
  id: string;
  concept_id: string;
  revenue_model: string | null;
  pricing_tiers: unknown[] | null;
  financial_projection: unknown[] | null;
  financial_projection_months: number | null;
  expansion_revenue_opportunities: Record<string, unknown> | null;
  agent_roles: unknown[] | null;
  human_roles: unknown[] | null;
  escalation_protocols: unknown[] | null;
  operational_cost_breakdown: Record<string, unknown> | null;
  gtm_target_segment: string | null;
  gtm_channels: unknown[] | null;
  gtm_messaging_framework: string | null;
  gtm_launch_timeline: Record<string, unknown> | null;
  agent_gtm_activities: string[] | null;
  human_gtm_activities: string[] | null;
  risks: unknown[] | null;
  upfront_build_cost: number | null;
  monthly_operating_cost: number | null;
  hiring_plan: unknown[] | null;
  technology_stack: Record<string, unknown> | null;
  funding_milestones: unknown[] | null;
  runway_months: number | null;
  executive_summary: string | null;
  is_finalized: boolean;
  updated_at: string;
}

interface ConceptRow {
  id: string;
  title: string;
  summary: string | null;
  value_proposition: string | null;
  target_customer_segment: string | null;
  pain_points_addressed: string[] | null;
  agent_architecture_sketch: string | null;
  defensibility_notes: string | null;
}

interface ValidationRow {
  id: string;
  concept_id: string;
  verdict: string | null;
  confidence: number | null;
  summary: string | null;
  tam_estimate: number | null;
  sam_estimate: number | null;
  som_estimate: number | null;
  cac: number | null;
  ltv: number | null;
  ltv_cac_ratio: number | null;
  gross_margin_percent: number | null;
  breakeven_months: number | null;
}

// ---------------------------------------------------------------------------
// LLM output shape
// ---------------------------------------------------------------------------

interface KeyMetrics {
  tam: number;
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  runwayMonths: number;
  agentToHumanRatio: number;
}

interface BlueprintPackagerLLMResponse {
  executiveSummary: string;
  keyMetrics: KeyMetrics;
  investmentThesis: string;
  topRisks: string[];
  readinessScore: number;
}

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

export class BlueprintPackagerAgent extends Agent {
  protected getOutputTableName(): string {
    return 'blueprints';
  }

  /**
   * Overrides buildPrompts to first fetch the complete blueprint, concept, and
   * validation data from Supabase, then construct a comprehensive prompt.
   */
  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const ctx = input.context as unknown as BlueprintPackagerContext;
    const { conceptId, blueprintId } = ctx;

    // -----------------------------------------------------------------------
    // Fetch 1: Full blueprint row
    // -----------------------------------------------------------------------
    const { data: blueprintData, error: blueprintError } = await this.supabase
      .from('blueprints')
      .select('*')
      .eq('id', blueprintId)
      .single();

    if (blueprintError !== null) {
      throw new Error(
        `BlueprintPackagerAgent: Failed to fetch blueprint ${blueprintId}: ${blueprintError.message}`,
      );
    }
    if (blueprintData === null) {
      throw new Error(
        `BlueprintPackagerAgent: Blueprint ${blueprintId} not found`,
      );
    }

    const blueprint = blueprintData as BlueprintRow;

    // -----------------------------------------------------------------------
    // Fetch 2: Concept row
    // -----------------------------------------------------------------------
    const { data: conceptData, error: conceptError } = await this.supabase
      .from('concepts')
      .select('*')
      .eq('id', conceptId)
      .single();

    if (conceptError !== null) {
      throw new Error(
        `BlueprintPackagerAgent: Failed to fetch concept ${conceptId}: ${conceptError.message}`,
      );
    }

    const concept = (conceptData ?? {}) as ConceptRow;

    // -----------------------------------------------------------------------
    // Fetch 3: Most recent validation synthesis
    // -----------------------------------------------------------------------
    const { data: validationData } = await this.supabase
      .from('validations')
      .select('*')
      .eq('concept_id', conceptId)
      .order('validated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const validation = (validationData ?? {}) as Partial<ValidationRow>;

    // -----------------------------------------------------------------------
    // Build prompts
    // -----------------------------------------------------------------------

    const systemPrompt = `You are the Blueprint Packager (Phase 3, Step 3.6) for the Company Builder platform.

You are the final integration agent. You receive all Phase 3 outputs (business model, agent architecture, GTM plan, risk register, resource plan) plus the original concept and validation data, and you synthesize them into the executive summary and key metrics for the complete company blueprint.

## Your Role

You are NOT rewriting the blueprint — the blueprint already exists with all its detailed sections. Your job is to:
1. **Write an executive summary** that a founder can hand to an investor in 30 seconds — crisp, specific, compelling
2. **Extract and compute key metrics** from the blueprint data
3. **Write an investment thesis** — the 3-5 sentence case for why this company will win
4. **Identify top risks** — the 3-5 most important things to watch
5. **Compute a readiness score** — an honest, data-driven assessment of launch readiness (0-100)

## Executive Summary Guidelines

The executive summary must follow this structure (250-400 words):

**Paragraph 1 — Market & Problem (3-4 sentences)**:
- What specific market are we in? How big is it?
- What is the acute pain point customers experience today?
- Why is this problem growing or becoming more urgent now?

**Paragraph 2 — Solution & Differentiation (3-4 sentences)**:
- What does the product do? (Be specific — not "an AI platform" but "an agent that automatically...")
- How does it work at a high level? (One sentence on the agent architecture)
- Why is this better than the incumbent / alternative?

**Paragraph 3 — Business Model & Traction Path (3-4 sentences)**:
- How does it make money? (Pricing model + price points)
- What are the key unit economics? (CAC, LTV, payback period)
- What does the 12-month path to revenue look like?

**Paragraph 4 — Team, Resources & Next Steps (2-3 sentences)**:
- Who is building this and why are they positioned to win?
- How much capital is needed and what does it unlock?
- What is the single most important milestone in the next 90 days?

## Investment Thesis

3-5 sentences that articulate WHY this business will succeed:
- The market insight: what do we understand that others don't?
- The product moat: why is this hard to replicate?
- The timing advantage: why is this the right time?
- The business model leverage: how do agent economics create competitive advantage?

## Readiness Score (0-100)

Score across five dimensions (20 points each):
- **Market Validation (0-20)**: How strong is the evidence of customer pain and willingness to pay?
  - 16-20: Multiple customer interviews, LOIs signed, strong validation confidence
  - 11-15: Some customer research, reasonable evidence
  - 0-10: Weak or no customer validation
- **Business Model Clarity (0-20)**: How clear and proven are the unit economics?
  - 16-20: LTV/CAC > 5x, gross margin > 60%, clear pricing tiers
  - 11-15: LTV/CAC 3-5x, reasonable margins
  - 0-10: Unclear economics or LTV/CAC < 3x
- **Technical Feasibility (0-20)**: Can the agent architecture actually be built?
  - 16-20: No AI capability gaps, standard tools, clear tech stack
  - 11-15: Some technical risks but manageable
  - 0-10: Major unproven technical assumptions
- **GTM Readiness (0-20)**: Is there a clear, executable path to first customers?
  - 16-20: ICP defined, channels identified, messaging validated
  - 11-15: Clear ICP but channels not validated
  - 0-10: No clear GTM plan
- **Resource Adequacy (0-20)**: Is there enough capital and team to execute?
  - 16-20: 18+ months of runway, right team, right tech stack
  - 11-15: 12-18 months runway, minor resource gaps
  - 0-10: < 12 months runway or critical team gaps

## Quality Standards
- Executive summary must be specific — use actual numbers from the blueprint data
- Investment thesis must be different from the executive summary — focus on WHY WE WIN
- Top risks must be the 3-5 most critical (highest risk score or highest existential risk)
- Readiness score must be an honest assessment — score 60-75 for a well-prepared early-stage startup, 75-90 for exceptional preparation`;

    const userMessage = `Package this complete blueprint into an executive summary and key metrics.

## Concept
**Title:** ${concept.title ?? 'N/A'}
**Summary:** ${concept.summary ?? 'Not provided'}
**Value Proposition:** ${concept.value_proposition ?? 'Not provided'}
**Target Customer Segment:** ${concept.target_customer_segment ?? 'Not provided'}
**Pain Points Addressed:** ${(concept.pain_points_addressed ?? []).join('; ')}
**Agent Architecture Sketch:** ${concept.agent_architecture_sketch ?? 'Not provided'}
**Defensibility Notes:** ${concept.defensibility_notes ?? 'Not provided'}

## Validation Synthesis (Phase 2)
- Verdict: ${validation.verdict ?? 'Not available'}
- Confidence: ${validation.confidence ?? 'N/A'}
- Summary: ${validation.summary ?? 'Not available'}
- TAM: $${validation.tam_estimate?.toLocaleString() ?? 'N/A'}
- SAM: $${validation.sam_estimate?.toLocaleString() ?? 'N/A'}
- SOM: $${validation.som_estimate?.toLocaleString() ?? 'N/A'}
- CAC: $${validation.cac ?? 'N/A'}
- LTV: $${validation.ltv ?? 'N/A'}
- LTV/CAC Ratio: ${validation.ltv_cac_ratio ?? 'N/A'}
- Gross Margin: ${validation.gross_margin_percent ?? 'N/A'}%
- Breakeven Months: ${validation.breakeven_months ?? 'N/A'}

## Blueprint — Business Model (Phase 3.1)
- Revenue Model: ${blueprint.revenue_model ?? 'N/A'}
- Pricing Tiers: ${JSON.stringify(blueprint.pricing_tiers ?? [], null, 2)}
- Financial Projection (months): ${blueprint.financial_projection_months ?? 'N/A'}
- Revenue Streams: ${JSON.stringify(blueprint.expansion_revenue_opportunities ?? {}, null, 2)}
- Financial Projection: ${JSON.stringify((blueprint.financial_projection ?? []).slice(0, 3), null, 2)} (showing first 3 months)

## Blueprint — Agent Architecture (Phase 3.2)
- Agent Roles: ${JSON.stringify(blueprint.agent_roles ?? [], null, 2)}
- Human Roles: ${JSON.stringify(blueprint.human_roles ?? [], null, 2)}
- Escalation Protocols: ${JSON.stringify((blueprint.escalation_protocols ?? []).slice(0, 3), null, 2)}
- Operational Cost Breakdown: ${JSON.stringify(blueprint.operational_cost_breakdown ?? {}, null, 2)}

## Blueprint — GTM Strategy (Phase 3.3)
- Target Segment: ${blueprint.gtm_target_segment ?? 'N/A'}
- Channels: ${JSON.stringify(blueprint.gtm_channels ?? [], null, 2)}
- Launch Timeline: ${JSON.stringify(blueprint.gtm_launch_timeline ?? {}, null, 2)}
- Messaging: ${blueprint.gtm_messaging_framework ?? 'N/A'}

## Blueprint — Risk Register (Phase 3.4)
${JSON.stringify((blueprint.risks ?? []).slice(0, 8), null, 2)}

## Blueprint — Resource Plan (Phase 3.5)
- Upfront Build Cost: $${(blueprint.upfront_build_cost ?? 0).toLocaleString()}
- Monthly Operating Cost: $${(blueprint.monthly_operating_cost ?? 0).toLocaleString()}
- Runway Months: ${blueprint.runway_months ?? 'N/A'}
- Hiring Plan: ${JSON.stringify(blueprint.hiring_plan ?? [], null, 2)}
- Technology Stack: ${JSON.stringify(blueprint.technology_stack ?? {}, null, 2)}
- Funding Milestones: ${JSON.stringify(blueprint.funding_milestones ?? [], null, 2)}

## Required Output

Return a JSON object with EXACTLY this structure:

{
  "executiveSummary": "string — 250-400 word executive summary following the 4-paragraph structure",
  "keyMetrics": {
    "tam": number — total addressable market in USD (from validation data),
    "cac": number — customer acquisition cost in USD,
    "ltv": number — customer lifetime value in USD,
    "ltvCacRatio": number — LTV/CAC ratio,
    "runwayMonths": number — months of runway with planned funding,
    "agentToHumanRatio": number — ratio of agent FTE equivalents to human FTEs
  },
  "investmentThesis": "string — 3-5 sentence case for why this company will win",
  "topRisks": ["string", ...] — exactly 3-5 most critical risks (1 sentence each, starting with risk category),
  "readinessScore": number — 0-100 honest readiness score
}

Write a compelling, specific, data-driven executive summary that makes an investor want to learn more.`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(
    response: Anthropic.Message,
  ): Promise<BlueprintPackagerLLMResponse> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let parsed: BlueprintPackagerLLMResponse;
    try {
      parsed = JSON.parse(cleaned) as BlueprintPackagerLLMResponse;
    } catch {
      throw new Error(
        `BlueprintPackagerAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 300)}`,
      );
    }

    if (!parsed.executiveSummary || parsed.executiveSummary.length < 100) {
      throw new Error('BlueprintPackagerAgent: executiveSummary is missing or too short');
    }
    if (!parsed.keyMetrics || typeof parsed.keyMetrics.runwayMonths !== 'number') {
      throw new Error('BlueprintPackagerAgent: keyMetrics is missing or incomplete');
    }
    if (!Array.isArray(parsed.topRisks) || parsed.topRisks.length < 3) {
      throw new Error('BlueprintPackagerAgent: topRisks must have at least 3 items');
    }
    if (typeof parsed.readinessScore !== 'number') {
      throw new Error('BlueprintPackagerAgent: readinessScore is missing');
    }

    return parsed;
  }

  protected async persistOutput(
    output: unknown,
    input: AgentInput,
  ): Promise<void> {
    const ctx = input.context as unknown as BlueprintPackagerContext;
    const { conceptId, blueprintId } = ctx;
    const data = output as BlueprintPackagerLLMResponse;

    // Upsert with executive_summary, is_finalized, and key_metrics stored in internal_consistency_notes
    const { error } = await this.supabase
      .from('blueprints')
      .upsert(
        {
          id: blueprintId,
          concept_id: conceptId,
          executive_summary: data.executiveSummary,
          is_finalized: true,
          finalized_at: new Date().toISOString(),
          // Store key metrics and investment thesis in internal_consistency_notes as structured JSON
          internal_consistency_notes: JSON.stringify({
            keyMetrics: data.keyMetrics,
            investmentThesis: data.investmentThesis,
            topRisks: data.topRisks,
            readinessScore: data.readinessScore,
          }),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'concept_id' },
      );

    if (error !== null) {
      throw new Error(`BlueprintPackagerAgent: Failed to upsert blueprint: ${error.message}`);
    }
  }
}
