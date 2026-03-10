import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { AgentInput, Concept, MarketOpportunity } from '@company-builder/types';
import type { ValidationVerdict, ValidationRisk, Validation } from '@company-builder/types';

interface ValidationSynthesizerContext {
  conceptId: string;
  concept: Concept;
  opportunity: MarketOpportunity;
}

interface ValidationSynthesizerOutput {
  verdict: ValidationVerdict;
  confidence: number;
  summary: string;
  keyAssumptions: string[];
  risks: ValidationRisk[];
  goConditions: string[];
  noGoConditions: string[];
}

export class ValidationSynthesizerAgent extends Agent {
  protected getOutputTableName(): string {
    return 'validations';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const context = input.context as unknown as ValidationSynthesizerContext;
    const { conceptId, concept, opportunity } = context;

    // Fetch all prior validation phases for this concept from Supabase
    const { data: validations, error } = await this.supabase
      .from('validations')
      .select('*')
      .eq('concept_id', conceptId)
      .in('validation_phase', ['market_sizing', 'competitive', 'customer', 'feasibility', 'economics']);

    if (error !== null) {
      throw new Error(`ValidationSynthesizerAgent: Failed to fetch prior validations: ${error.message}`);
    }

    const priorValidations = (validations ?? []) as Validation[];

    // Extract each phase's data for the prompt
    const marketSizing = priorValidations.find((v) => v.validation_phase === 'market_sizing');
    const competitive = priorValidations.find((v) => v.validation_phase === 'competitive');
    const customer = priorValidations.find((v) => v.validation_phase === 'customer');
    const feasibility = priorValidations.find((v) => v.validation_phase === 'feasibility');
    const economics = priorValidations.find((v) => v.validation_phase === 'economics');

    const systemPrompt = `You are the Validation Synthesizer agent for the Company Builder platform — the final decision-making engine of Phase 2 Validation.

Your mission is to synthesize five independent validation analyses (market sizing, competitive landscape, customer demand, technical feasibility, and unit economics) into a single, investment-grade verdict on whether this concept should proceed to Phase 3 Blueprint. This is the most consequential output in the entire pipeline — it determines whether significant resources are committed to building a full business blueprint.

## Synthesis Philosophy

You do not simply average the five analyses. You weigh them based on their relevance to the concept's specific risk profile and surface the critical path — the single chain of assumptions that, if broken, would cause the entire concept to fail.

**Verdict Criteria:**

- **'go'**: All five dimensions are fundamentally sound. No showstoppers. LTV:CAC ratio ≥ 3:1. Market opportunity is large enough to support venture-scale returns. Technical path is clear. Customer demand is validated. Competitive entry window is open.

- **'go_with_caution'**: The concept has genuine merit on most dimensions, but one significant risk requires specific mitigation before it can be recommended without reservation. The risk must be addressable — it cannot be a structural impossibility. Specify exactly what must be resolved, by whom, and by when.

- **'no_go'**: One or more fundamental showstoppers are present that cannot be resolved through normal startup execution. Examples: core AI capability does not exist; business model violates law; market is too small to support a venture-scale outcome; economics are structurally broken even in the bull case.

## Risk Assessment

For each risk you identify:
- Be specific — not "market risk" but "The target SMB segment historically churns at 5%+ monthly on workflow tools, which compresses LTV to $X and requires CAC to remain below $Y to maintain a viable ratio"
- Rate severity honestly: 'low' (manageable), 'medium' (requires active mitigation), 'high' (threatens viability)
- Provide a concrete mitigation — not generic advice but a specific action with a measurable outcome

## Key Assumptions

Identify 3–5 critical assumptions that, if wrong by 50%, would materially change the verdict. Each assumption should be:
- Testable (there is a way to verify it)
- Specific (not vague market observations)
- Material (if wrong, the verdict changes)

## Go / No-Go Conditions

For 'go_with_caution' verdicts, specify:
- **Go conditions**: Specific, measurable milestones that, when achieved, convert the verdict to a full 'go' (e.g., "Pilot with 10 paying customers at ≥$500/month with < 5% monthly churn over 90 days")
- **No-go conditions**: Specific triggers that would convert the verdict to 'no_go' if the caution materializes (e.g., "If CAC exceeds $15,000 after first 3 sales hires, go-to-market motion is not viable")

For 'go' verdicts: populate go_conditions with key milestones to validate in early execution; leave no_go_conditions as empty array.
For 'no_go' verdicts: leave go_conditions as empty array; populate no_go_conditions with the specific reasons.

## Output Schema

Respond with JSON matching this exact structure:

{
  "verdict": "go|go_with_caution|no_go",
  "confidence": number — your confidence in this verdict from 0.0 to 1.0,
  "summary": "string — 4-6 sentences covering: what the concept is, what the validation found (strengths and risks), what the verdict is and why, and what Phase 3 must accomplish",
  "keyAssumptions": ["string — each critical assumption with its testability and materiality"],
  "risks": [
    {
      "risk": "string — specific, quantified risk description",
      "severity": "low|medium|high",
      "mitigation": "string — concrete mitigation action with measurable outcome"
    }
  ],
  "goConditions": ["string — specific measurable milestone (for go and go_with_caution verdicts)"],
  "noGoConditions": ["string — specific trigger that would kill the concept (for go_with_caution and no_go verdicts)"]
}`;

    const marketSizingSection = marketSizing
      ? `TAM: $${(marketSizing.tam_estimate ?? 0).toLocaleString()}
SAM: $${(marketSizing.sam_estimate ?? 0).toLocaleString()}
SOM: $${(marketSizing.som_estimate ?? 0).toLocaleString()}
Growth Rate: ${marketSizing.growth_rate_percent != null ? `${marketSizing.growth_rate_percent}%` : 'N/A'}
Methodology: ${marketSizing.market_sizing_methodology ?? 'Not provided'}
Confidence: ${marketSizing.tam_confidence != null ? marketSizing.tam_confidence : 'N/A'}`
      : 'Not completed';

    const competitiveSection = competitive
      ? `Competitive Intensity: ${competitive.competitive_intensity ?? 'N/A'}
Competitors: ${JSON.stringify(competitive.competitors ?? [], null, 2)}
Vulnerability Map: ${JSON.stringify(competitive.vulnerability_map ?? {}, null, 2)}`
      : 'Not completed';

    const customerSection = customer
      ? `Early Adopter Profile: ${customer.early_adopter_profile ?? 'Not provided'}
WTP Range: $${customer.willingness_to_pay_low ?? 0}–$${customer.willingness_to_pay_high ?? 0}/month
Confidence: ${customer.customer_validation_confidence ?? 'N/A'}
Pain Point Evidence: ${JSON.stringify(customer.pain_point_evidence ?? [], null, 2)}`
      : 'Not completed';

    const feasibilitySection = feasibility
      ? `Feasibility Rating: ${feasibility.feasibility_rating ?? 'N/A'}
Showstoppers: ${JSON.stringify(feasibility.showstoppers ?? [], null, 2)}
Required AI Capabilities: ${JSON.stringify(feasibility.required_ai_capabilities ?? [], null, 2)}
Regulatory Barriers: ${feasibility.regulatory_barriers ?? 'None identified'}
Technical Risks: ${JSON.stringify(feasibility.technical_risks ?? [], null, 2)}`
      : 'Not completed';

    const economicsSection = economics
      ? `CAC: $${economics.cac ?? 0}
LTV: $${economics.ltv ?? 0}
LTV:CAC Ratio: ${economics.ltv_cac_ratio ?? 0}
Gross Margin: ${economics.gross_margin_percent ?? 0}%
Breakeven: ${economics.breakeven_months ?? 0} months
Unit Economics Detail: ${JSON.stringify(economics.unit_economics_json ?? {}, null, 2)}`
      : 'Not completed';

    const userMessage = `Synthesize the Phase 2 validation results for this concept and render a final verdict.

CONCEPT:
Name: ${concept.title}
Summary: ${concept.summary ?? 'Not provided'}
Value Proposition: ${concept.value_proposition ?? 'Not provided'}
Target Customer: ${concept.target_customer_segment ?? 'Not specified'}

MARKET OPPORTUNITY:
Title: ${opportunity.title}
Target Market: ${opportunity.target_market ?? 'Not specified'}
Target Industry: ${opportunity.target_industry ?? 'Not specified'}

--- PHASE 2.1: MARKET SIZING ---
${marketSizingSection}

--- PHASE 2.2: COMPETITIVE ANALYSIS ---
${competitiveSection}

--- PHASE 2.3: CUSTOMER VALIDATION ---
${customerSection}

--- PHASE 2.4: FEASIBILITY ASSESSMENT ---
${feasibilitySection}

--- PHASE 2.5: UNIT ECONOMICS ---
${economicsSection}

Synthesize these five validation analyses into a single investment-grade verdict. Weigh the dimensions based on the concept's specific risk profile. Surface the critical path of assumptions. Identify the 2–4 highest-impact risks with specific mitigations. Define go and no-go conditions where applicable. Your verdict must be defensible — a venture investor should be able to read your summary and understand exactly why you reached this conclusion.`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(response: Anthropic.Message): Promise<ValidationSynthesizerOutput> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';
    const cleaned = rawText
      .replace(/^```json\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    let parsed: ValidationSynthesizerOutput;
    try {
      parsed = JSON.parse(cleaned) as ValidationSynthesizerOutput;
    } catch {
      throw new Error(
        `ValidationSynthesizerAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 300)}`,
      );
    }

    return parsed;
  }

  protected async persistOutput(output: unknown, input: AgentInput): Promise<void> {
    const context = input.context as unknown as ValidationSynthesizerContext;
    const { conceptId } = context;
    const result = output as ValidationSynthesizerOutput;

    const { error } = await this.supabase.from('validations').insert({
      concept_id: conceptId,
      validation_phase: 'synthesis',
      verdict: result.verdict,
      confidence: result.confidence,
      summary: result.summary,
      key_assumptions: result.keyAssumptions,
      risks: result.risks,
      validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error !== null) {
      throw new Error(`ValidationSynthesizerAgent: Failed to persist output: ${error.message}`);
    }
  }
}
