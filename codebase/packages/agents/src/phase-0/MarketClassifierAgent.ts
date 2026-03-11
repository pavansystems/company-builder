import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { z } from 'zod';
import type {
  AgentInput,
  Signal,
  MarketOpportunityInsert,
  AgentReadinessTag,
  CompetitiveDensity,
} from '@company-builder/types';
import { MarketClassifierInputSchema, MarketClassifierOutputSchema } from '../schemas';

interface MarketClassifierContext {
  signals: Signal[];
}

interface RawMarketOpportunity {
  title: string;
  description: string;
  target_market: string;
  target_industry: string;
  problem_statement: string;
  enabling_signals: string[];
  agent_readiness_tag: string;
  agent_readiness_reasoning: string;
  market_size_estimate: number;
  market_size_confidence: number;
  competitive_density: string;
  key_technologies: string[];
  time_sensitivity: string;
  market_maturity: string;
  incumbent_response_risk: string;
  confidence: number;
}

interface MarketClassifierLLMResponse {
  opportunities: RawMarketOpportunity[];
}

const VALID_AGENT_READINESS_TAGS = new Set<AgentReadinessTag>(['high', 'medium', 'low']);
const VALID_COMPETITIVE_DENSITY = new Set<CompetitiveDensity>(['crowded', 'moderate', 'sparse']);

export class MarketClassifierAgent extends Agent {
  protected getInputSchema(): z.ZodType<unknown> {
    return MarketClassifierInputSchema;
  }

  protected getOutputSchema(): z.ZodType<unknown> {
    return MarketClassifierOutputSchema;
  }

  protected getOutputTableName(): string {
    return 'market_opportunities';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const context = MarketClassifierInputSchema.parse(input.context);
    const { signals } = context;

    const systemPrompt = `You are the Market Classifier agent for the Company Builder platform's Phase 0 Discovery pipeline.

Your role is to take detected disruption signals and map them to specific markets, industries, and problem spaces — transforming raw signals into structured market opportunity candidates. You are the opportunity mapper that bridges raw evidence (signals) and actionable business opportunities.

# Your Core Mission

You are building an agent-first company builder. Every market opportunity you identify must be evaluated through the lens of:
**"Can AI agents replace or dramatically augment human workers in this market?"**

The opportunities you identify will be ranked, watchlisted, and selected for deeper ideation. Be specific, evidence-based, and honest about uncertainty.

# Signal-to-Market Mapping Process

## Step 1: Understand Each Signal
Read each signal carefully:
- What is the core fact or change?
- What does it imply for human labor?
- Which industries, job categories, or workflows are affected?
- Is this a capability unlock, a market gap, a regulatory opening, or evidence of pain?

## Step 2: Identify Affected Markets
Map signals to specific markets using the taxonomy below. Be specific:
- NOT "AI for finance" → YES "AI agents for accounts payable automation at mid-market accounting firms"
- NOT "legal tech" → YES "AI agents for contract review and due diligence in M&A transactions"
- NOT "healthcare AI" → YES "AI agents for prior authorization processing in US health insurance"

## Market Taxonomy (Prioritized for Agent-First Disruption)

### High Agent-Readiness Markets (prioritize these)
- **Financial Services / Accounting**: Invoice processing, accounts payable, reconciliation, audit prep, tax filing
- **Financial Services / Lending**: Loan origination processing, credit document review, collections outreach
- **Financial Services / Insurance**: Claims triage, document verification, underwriting data extraction
- **Customer Service / Tier-1 Support**: FAQ responses, ticket routing, knowledge retrieval, status updates
- **HR / Recruiting**: Resume screening, interview scheduling, job description generation, candidate outreach
- **Legal / Document Review**: Contract analysis, due diligence, regulatory compliance checks, e-discovery
- **Marketing / Content**: Email generation, ad copy, SEO content, social media, campaign reporting
- **Software / DevOps**: Code review automation, test generation, documentation, incident triage
- **Healthcare / Admin**: Prior authorization, medical coding, clinical documentation, referral processing
- **Supply Chain / Logistics**: Demand forecasting, vendor communications, shipment tracking, invoice reconciliation

### Emerging Agent-Readiness Markets
- **Real Estate**: Property data extraction, lease review, compliance filings
- **Education**: Personalized tutoring, curriculum generation, grading assistance
- **Government / Public Sector**: Permit processing, benefits eligibility, document digitization
- **Media / Publishing**: Content moderation, metadata tagging, translation, transcription

## Step 3: Assess Agent-Readiness
For each opportunity, assess what percentage of the work agents can handle:

**high (>70% automatable)**:
- Work is primarily data-driven, pattern-matching, or text-based
- Decisions follow clear rules with limited edge cases
- Output quality is verifiable and measurable
- Examples: data entry, document extraction, structured Q&A, code generation, email drafting

**medium (40-70% automatable)**:
- Mix of automatable tasks and tasks requiring human judgment
- Some customer relationship or trust components
- Quality harder to verify automatically
- Examples: customer service escalations, content moderation, research synthesis

**low (<40% automatable)**:
- High relationship-dependence or trust requirements
- Complex, ambiguous decision-making
- Regulatory requirements mandate human involvement
- Examples: executive strategy, complex negotiations, empathetic counseling

## Step 4: Identify Enabling Technologies
What specific AI capabilities make this opportunity viable NOW (not 5 years ago)?
- Vision-language models (multimodal document processing)
- Long-context LLMs (analyzing entire contracts or codebases)
- Agentic frameworks (multi-step task completion)
- Function calling / tool use (interacting with external systems)
- RAG (retrieval-augmented generation for knowledge bases)
- Structured output extraction (form parsing, data extraction)

## Step 5: Evaluate Market Sizing
Estimate market size (USD) using bottom-up reasoning:
- Number of potential customers × annual contract value = SAM estimate
- Be conservative; report as order of magnitude (e.g., $500M, $2B, $10B)

market_size_estimate: report as integer USD value (e.g., 2000000000 for $2B)
market_size_confidence: 0.0-1.0 (how confident you are in the estimate)

## Step 6: Assess Competitive Density
- **sparse**: 0-5 meaningful players; market underexplored or nascent
- **moderate**: 6-20 players; validated market with room for new entrants
- **crowded**: 20+ well-funded players; difficult to differentiate without strong moat

## Step 7: Consolidate and Deduplicate
If multiple signals point to the same market + problem, create ONE opportunity that references all of them. Do not create redundant opportunities for the same problem space.

# Critical Quality Rules

1. **Specificity Required**: Every opportunity must name a specific problem, not a generic market. "AI for accounting" is rejected. "AI agents for three-way invoice matching in mid-market accounting firms" is accepted.

2. **Minimum Signal Backing**: Each opportunity must be directly supported by at least one signal from the input list. Include the signal IDs in enabling_signals.

3. **Honest Confidence**: If you're not sure this is a real opportunity, set confidence < 0.75. If confidence < 0.70, consider whether it belongs in the output at all.

4. **Agent-First Angle**: Every opportunity must have a plausible agent-first business model. How would agents actually replace or augment human workers here?

5. **Timing Awareness**: Today's date context should inform whether the opportunity is emerging (window opening), active (market moving now), or established (potentially past the best entry point).

Respond with ONLY valid JSON. Do not include markdown code blocks, explanatory text, or any content outside the JSON object.`;

    const signalDescriptions = signals.map((s) => {
      const entities = s.entities
        ? `Companies: ${s.entities.companies.join(', ') || 'none'} | Technologies: ${s.entities.technologies.join(', ') || 'none'} | Trends: ${s.entities.trends.join(', ') || 'none'}`
        : 'no entities';

      return `Signal ID: ${s.id}
Type: ${s.signal_type}
Confidence: ${s.confidence ?? 'unknown'}
Impact: ${s.impact_rating ?? 'unknown'}
Detected At: ${s.detected_at}
Summary: ${s.summary}
Entities: ${entities}`;
    }).join('\n\n---\n\n');

    const userMessage = `Classify the following ${signals.length} signal(s) into specific market opportunity candidates. Group related signals into single opportunities where they point to the same market + problem space.

SIGNALS TO CLASSIFY:
${signalDescriptions}

Return a JSON object with this structure:
{
  "opportunities": [
    {
      "title": "<specific opportunity title — e.g., 'AI agents for invoice processing in mid-market accounting'>",
      "description": "<2-3 sentence description of the opportunity and why it's actionable now>",
      "target_market": "<specific market segment — e.g., 'Accounts Payable / Mid-Market Accounting'>",
      "target_industry": "<primary industry — e.g., 'Financial Services'>",
      "problem_statement": "<specific problem being solved — what exactly is inefficient, manual, or broken?>",
      "enabling_signals": ["<signal_id_1>", "<signal_id_2>"],
      "agent_readiness_tag": "high|medium|low",
      "agent_readiness_reasoning": "<why this score? what % of tasks can agents handle and which ones?>",
      "market_size_estimate": <integer USD value, e.g., 2000000000>,
      "market_size_confidence": <0.0-1.0>,
      "competitive_density": "sparse|moderate|crowded",
      "key_technologies": ["LLMs", "Vision models", "Agentic workflows", ...],
      "time_sensitivity": "urgent|normal|low",
      "market_maturity": "nascent|emerging|growth|mature",
      "incumbent_response_risk": "high|medium|low",
      "confidence": <0.0-1.0, your confidence this is a real opportunity>
    }
  ]
}

If signals don't map to any actionable market opportunity, return: {"opportunities": []}`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(response: Anthropic.Message): Promise<MarketOpportunityInsert[]> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';

    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let parsed: MarketClassifierLLMResponse;
    try {
      parsed = JSON.parse(cleaned) as MarketClassifierLLMResponse;
    } catch {
      throw new Error(`MarketClassifierAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 200)}`);
    }

    if (!Array.isArray(parsed.opportunities)) {
      throw new Error('MarketClassifierAgent: LLM response missing "opportunities" array');
    }

    const now = new Date().toISOString();

    return parsed.opportunities
      .filter((opp: RawMarketOpportunity) => opp.title && opp.target_market)
      .map((opp: RawMarketOpportunity): MarketOpportunityInsert => {
        const agentReadinessTag: AgentReadinessTag = VALID_AGENT_READINESS_TAGS.has(
          opp.agent_readiness_tag as AgentReadinessTag,
        )
          ? (opp.agent_readiness_tag as AgentReadinessTag)
          : 'medium';

        const competitiveDensity: CompetitiveDensity = VALID_COMPETITIVE_DENSITY.has(
          opp.competitive_density as CompetitiveDensity,
        )
          ? (opp.competitive_density as CompetitiveDensity)
          : 'moderate';

        return {
          title: opp.title,
          description: opp.description ?? null,
          target_market: opp.target_market ?? null,
          target_industry: opp.target_industry ?? null,
          problem_statement: opp.problem_statement ?? null,
          enabling_signals: Array.isArray(opp.enabling_signals) ? opp.enabling_signals : [],
          agent_readiness_tag: agentReadinessTag,
          market_size_estimate:
            typeof opp.market_size_estimate === 'number' ? opp.market_size_estimate : null,
          market_size_confidence:
            typeof opp.market_size_confidence === 'number'
              ? Math.min(1, Math.max(0, opp.market_size_confidence))
              : null,
          competitive_density: competitiveDensity,
          created_at: now,
          ranked_at: null,
          is_active: true,
          archived_at: null,
        };
      });
  }

  protected async persistOutput(output: unknown, _input: AgentInput): Promise<void> {
    const opportunities = output as MarketOpportunityInsert[];

    if (opportunities.length === 0) {
      return;
    }

    const { error } = await this.supabase.from(this.getOutputTableName()).insert(opportunities);

    if (error !== null) {
      throw new Error(`MarketClassifierAgent: Failed to persist market opportunities: ${error.message}`);
    }
  }
}
