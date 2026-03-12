import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { z } from 'zod';
import type { AgentInput } from '@company-builder/types';
import type { Concept } from '@company-builder/types';
import { RiskAnalystInputSchema, RiskAnalystOutputSchema } from '../schemas';

// ---------------------------------------------------------------------------
// Input context shape
// ---------------------------------------------------------------------------

interface RiskAnalystContext {
  conceptId: string;
  concept: Concept;
  feasibilityAssessment: Record<string, unknown>;
  competitiveAnalysis: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// LLM output shape
// ---------------------------------------------------------------------------

interface RiskItemOutput {
  id: string;
  category: 'technical' | 'market' | 'regulatory' | 'financial' | 'operational' | 'competitive';
  title: string;
  description: string;
  severity: number;
  likelihood: number;
  riskScore: number;
  mitigations: string[];
  owner: 'agent' | 'human' | 'both';
}

interface RiskAnalystLLMResponse {
  risks: RiskItemOutput[];
}

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

export class RiskAnalystAgent extends Agent {
  protected getInputSchema(): z.ZodType<unknown> {
    return RiskAnalystInputSchema;
  }

  protected getOutputSchema(): z.ZodType<unknown> {
    return RiskAnalystOutputSchema;
  }

  protected getOutputTableName(): string {
    return 'blueprints';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const ctx = RiskAnalystInputSchema.parse(input.context);
    const { concept, feasibilityAssessment, competitiveAnalysis } = ctx;

    const systemPrompt = `You are the Risk Analyst (Phase 3, Step 3.4) for the Company Builder platform.

Your responsibility is to identify, categorize, quantify, and design mitigations for every meaningful risk that could prevent this AI-first startup from succeeding. You synthesize risks from all prior phases AND add Phase 3-specific risks.

## Risk Framework

### Six Risk Categories

**1. Technical Risks**
Failure modes related to building and operating the AI systems:
- LLM accuracy below required threshold (e.g., "OCR agent misclassifies 8% of expenses — threshold is 3%")
- Hallucination rate for critical decisions (e.g., "Contract review agent confabulates missing clauses")
- Latency issues at scale (e.g., "Agent takes 45s to respond; customer SLA is 10s")
- Model deprecation / API provider risk (e.g., "Claude API pricing increases 5x; unit economics break")
- Context window limits for complex tasks
- Data quality issues (garbage in, garbage out)

**2. Market Risks**
Risks related to the market itself shifting or being different than expected:
- Total addressable market smaller than projected
- Customer willingness-to-pay lower than assumed
- Market timing (too early: customers don't yet see the problem; too late: market already saturated)
- Product-market fit not validated (customers don't convert)
- Churn rate higher than unit economics assume

**3. Regulatory Risks**
Compliance, legal, and regulatory exposure:
- GDPR / CCPA data privacy requirements for AI systems
- AI Act compliance (EU high-risk AI system classification)
- Industry-specific regulations (HIPAA for health, SOX for finance, FINRA for financial services)
- Liability for AI-generated errors in consequential decisions
- Intellectual property risks (training data, copyright of AI outputs)

**4. Financial Risks**
Capital and unit economics risks:
- Burn rate exceeds revenue ramp (runway runs out before PMF)
- LTV/CAC ratio deteriorates as competition increases CAC
- Enterprise sales cycle longer than projected (revenue delayed)
- Currency risk for international customers
- Pricing pressure from well-funded competitors offering free tiers

**5. Operational Risks**
Execution and team risks:
- Key person dependency (founder is only engineer; gets sick or leaves)
- Hiring timeline delays (can't hire senior engineer in Month 1 as planned)
- Vendor lock-in to LLM API provider
- Data infrastructure failures (customer data lost; SLA violated)
- Support escalation volume overwhelms small team

**6. Competitive Risks**
External competitive threats:
- Large incumbent adds AI features to existing product (product commoditization)
- Well-funded startup enters same space with 10x resources
- Open-source model makes agent capabilities free/free-for-use
- Customer builds their own internal tool (build vs. buy risk)
- Competitor poaches key team members

### Risk Scoring Methodology
- **severity**: 1-10 (impact if the risk materializes)
  - 1-3: minor inconvenience, easily absorbed
  - 4-6: significant setback, recovery possible with 1-3 months of work
  - 7-9: major threat, could eliminate 50%+ of value or delay launch 6+ months
  - 10: existential — company-ending if unmitigated
- **likelihood**: 1-10 (probability of occurrence in next 24 months)
  - 1-3: rare/unlikely, would require unusual circumstances
  - 4-6: plausible, could happen with ~30-50% probability
  - 7-9: likely, base case assumption should include this
  - 10: near-certain, needs to be planned for
- **riskScore**: severity × likelihood (1-100 scale; > 50 is critical, 25-50 is high, < 25 is manageable)

### Mitigation Design
For each risk, provide 2-4 specific, actionable mitigations:
- **agent-owned mitigations**: automated monitoring, circuit breakers, fallback logic, rate limiting
- **human-owned mitigations**: legal review, manual QA processes, relationship management
- **structural mitigations**: business model changes, technology choices, partnership arrangements

### Ownership Assignment
- **agent**: Mitigation can be fully automated (monitoring alerts, fallback to deterministic logic, rate limiting)
- **human**: Requires human judgment (legal strategy, customer relationship management, board decisions)
- **both**: Combination — agent detects/flags, human decides/acts

## Quality Standards
- Minimum 8 risks across at least 4 of the 6 categories
- Every risk with riskScore > 50 must have at least 3 mitigations
- No generic platitudes — each risk must be specific to this business model and technology stack
- riskScore must equal severity × likelihood (enforce mathematical consistency)
- IDs must be unique across risks (format: RISK-001, RISK-002, etc.)`;

    const userMessage = `Conduct a comprehensive risk analysis for this AI-first startup.

## Concept
**Title:** ${concept.title}
**Summary:** ${concept.summary ?? 'Not provided'}
**Value Proposition:** ${concept.value_proposition ?? 'Not provided'}
**Target Customer Segment:** ${concept.target_customer_segment ?? 'Not provided'}
**Pain Points Addressed:** ${(concept.pain_points_addressed ?? []).join('; ')}
**Agent Architecture Sketch:** ${concept.agent_architecture_sketch ?? 'Not provided'}
**Defensibility Notes:** ${concept.defensibility_notes ?? 'Not provided'}

## Feasibility Assessment (from Phase 2)
${JSON.stringify(feasibilityAssessment, null, 2)}

## Competitive Analysis (from Phase 2)
${JSON.stringify(competitiveAnalysis, null, 2)}

## Required Output

Return a JSON object with EXACTLY this structure:

{
  "risks": [
    {
      "id": "string — unique risk ID (format: RISK-001, RISK-002, ...)",
      "category": "technical | market | regulatory | financial | operational | competitive",
      "title": "string — short, specific risk title (max 10 words)",
      "description": "string — 2-3 sentence description of what the risk is, why it's relevant to this specific business, and what would trigger it",
      "severity": number — 1-10 impact severity if risk materializes,
      "likelihood": number — 1-10 probability of occurring in next 24 months,
      "riskScore": number — severity × likelihood (must equal severity * likelihood),
      "mitigations": ["string", ...] — 2-4 specific, actionable mitigation strategies,
      "owner": "agent | human | both"
    }
  ]
}

Identify all meaningful risks. Include at least 8 risks covering at least 4 categories. Prioritize specificity over completeness — a generic risk is worse than a precise one.`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(
    response: Anthropic.Message,
  ): Promise<RiskAnalystLLMResponse> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';
    const cleaned = rawText
      .replace(/^[\s\S]*?```(?:json)?\s*\n?/i, '')
      .replace(/\s*```[\s\S]*$/, '')
      .trim();

    let parsed: RiskAnalystLLMResponse;
    try {
      parsed = JSON.parse(cleaned) as RiskAnalystLLMResponse;
    } catch {
      throw new Error(
        `RiskAnalystAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 300)}`,
      );
    }

    if (!Array.isArray(parsed.risks) || parsed.risks.length < 4) {
      throw new Error(
        `RiskAnalystAgent: risks array is missing or too short (got ${(parsed.risks ?? []).length}, need ≥ 4)`,
      );
    }

    return parsed;
  }

  protected async persistOutput(
    output: unknown,
    input: AgentInput,
  ): Promise<void> {
    const ctx = RiskAnalystInputSchema.parse(input.context);
    const { conceptId } = ctx;
    const data = output as RiskAnalystLLMResponse;

    // Map to DB RiskItem shape
    const risksForDb = data.risks.map((r) => ({
      category: r.category,
      description: `[${r.id}] ${r.title}: ${r.description}`,
      severity: r.riskScore >= 50 ? ('critical' as const)
        : r.riskScore >= 25 ? ('high' as const)
        : r.severity >= 5 ? ('medium' as const)
        : ('low' as const),
      likelihood: r.likelihood >= 7 ? ('high' as const)
        : r.likelihood >= 4 ? ('medium' as const)
        : ('low' as const),
      mitigation: r.mitigations.join(' | '),
      monitoring_trigger: `Risk score: ${r.riskScore}/100. Owner: ${r.owner}. Trigger when: ${r.title.toLowerCase()} conditions detected.`,
    }));

    const { error } = await this.supabase
      .from('blueprints')
      .upsert(
        {
          account_id: this.accountId,
          concept_id: conceptId,
          risks: risksForDb,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'concept_id' },
      );

    if (error !== null) {
      throw new Error(`RiskAnalystAgent: Failed to upsert blueprint: ${error.message}`);
    }
  }
}
