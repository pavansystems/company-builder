import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { z } from 'zod';
import type { AgentInput, MarketOpportunity } from '@company-builder/types';
import { AgentPersistenceError } from '@company-builder/core';
import { ConceptGeneratorInputSchema, ConceptGeneratorOutputSchema } from '../schemas';

interface ConceptGeneratorContext {
  opportunityId: string;
  opportunity: MarketOpportunity;
  painPoints: Record<string, unknown>;
  landscape: Record<string, unknown>;
}

interface GeneratedConcept {
  name: string;
  tagline: string;
  description: string;
  target_customer: string;
  core_value_prop: string;
  agent_roles: string[];
  differentiators: string[];
}

interface ConceptGeneratorLLMResponse {
  concepts: GeneratedConcept[];
}

export class ConceptGeneratorAgent extends Agent {
  protected getInputSchema(): z.ZodType<unknown> {
    return ConceptGeneratorInputSchema;
  }

  protected getOutputSchema(): z.ZodType<unknown> {
    return ConceptGeneratorOutputSchema;
  }

  protected getOutputTableName(): string {
    return 'concepts';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const context = ConceptGeneratorInputSchema.parse(input.context);
    const { opportunity, painPoints, landscape } = context;

    const systemPrompt = `You are the Concept Generator agent for the Company Builder platform — the creative engine of Phase 1 Ideation.

Your mission is to generate 5–8 genuinely distinct startup concepts that address validated customer pain points using AI agents as the primary operational infrastructure. You are not proposing features or improvements — you are sketching entirely new businesses that would be built agent-first from day one.

## Design Philosophy: Agent-First Architecture

Every concept you generate must be designed around AI agents as the core operational leverage. This means:
- Agents handle 70–85%+ of the primary value-creation work
- Human roles shrink to escalation handling, relationship management, and quality oversight
- The cost structure is fundamentally different from incumbent human-heavy models
- The concept would have a 50–80% cost advantage over traditional human-staffed competitors

This is not about "adding AI" to an existing business model — it is about reimagining who does the work.

## Ideation Frameworks

Generate concepts across multiple ideation vectors to ensure genuine diversity:

**By Pain Theme:** For each top pain point, what would a purpose-built agent-first solution look like?

**By Value Chain Stage:** Which step in the incumbent value chain is most human-intensive? What does it look like to own that step with agents?

**By Customer Segment:** Would a vertically-specialized concept (e.g., targeting healthcare vs. legal vs. finance) unlock better agent training data and switching costs?

**By Business Model:** Subscription vs. usage-based vs. marketplace vs. AI-as-a-service — different pricing models enable different customer segments.

**By Disruption Depth:** Mix incremental improvements (better version of incumbent), market model shifts (different channel or segment), and radical reimaginings (agents replace entire job category).

## Concept Quality Standards

Each concept must be GENUINELY DISTINCT. Distinctness requires at minimum ONE of these to differ substantially:
- Different target customer (segment, company size, job title)
- Different go-to-market approach (self-serve vs. enterprise sales vs. marketplace)
- Different core agent capability (research vs. generation vs. analysis vs. coordination)
- Different pricing model (subscription vs. per-transaction vs. outcome-based)

A concept that is just a minor variant of another concept will be rejected by the Concept Scorer.

## Agent Architecture Specification

For each concept, specify 2–4 concrete agent roles. Each role should describe:
- What the agent does (specific task, not "helps with X")
- What data/inputs it processes
- What output it produces
- The estimated % of the workflow this agent handles autonomously

## Output Schema

Return exactly 5–8 concepts in this JSON format:

{
  "concepts": [
    {
      "name": "string — 3-5 word company/product name",
      "tagline": "string — one sentence that explains what it does and for whom",
      "description": "string — 3-4 sentences covering: what problem it solves, how agents do the work, what the customer experience looks like, and why this beats incumbents",
      "target_customer": "string — specific customer type, company size, and industry (e.g., 'CFOs at Series B-D SaaS companies with 100-500 employees')",
      "core_value_prop": "string — the quantified value this delivers (time saved, cost reduced, revenue generated)",
      "agent_roles": ["string — specific agent role description including what it does autonomously"],
      "differentiators": ["string — concrete structural advantage over incumbents and alternatives"]
    }
  ]
}`;

    const userMessage = `Generate 5–8 distinct startup concepts for this market opportunity.

OPPORTUNITY:
Title: ${opportunity.title}
Problem Statement: ${opportunity.problem_statement ?? 'Not provided'}
Target Market: ${opportunity.target_market ?? 'Not specified'}
Target Industry: ${opportunity.target_industry ?? 'Not specified'}
Enabling Signals: ${opportunity.enabling_signals?.join('; ') ?? 'None listed'}

LANDSCAPE ANALYSIS:
${JSON.stringify(landscape, null, 2)}

PAIN POINT CATALOG:
${JSON.stringify(painPoints, null, 2)}

Generate 5–8 startup concepts that are genuinely different from each other — vary the target customer, agent architecture, pricing model, and disruption approach. Each concept must be agent-first (agents doing 70%+ of core work), grounded in the identified pain points, and structurally distinct from incumbents. Include 2–4 specific agent roles per concept and 3–5 concrete differentiators.`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(response: Anthropic.Message): Promise<GeneratedConcept[]> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';
    const cleaned = rawText
      .replace(/^[\s\S]*?```(?:json)?\s*\n?/i, '')
      .replace(/\s*```[\s\S]*$/, '')
      .trim();

    let parsed: ConceptGeneratorLLMResponse;
    try {
      parsed = JSON.parse(cleaned) as ConceptGeneratorLLMResponse;
    } catch {
      throw new Error(
        `ConceptGeneratorAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 300)}`,
      );
    }

    if (!Array.isArray(parsed.concepts)) {
      throw new Error('ConceptGeneratorAgent: LLM response missing "concepts" array');
    }

    return parsed.concepts;
  }

  protected async persistOutput(output: unknown, input: AgentInput): Promise<void> {
    const context = ConceptGeneratorInputSchema.parse(input.context);
    const { opportunityId } = context;
    const concepts = output as GeneratedConcept[];

    if (concepts.length === 0) {
      return;
    }

    const rows = concepts.map((concept) => ({
      market_opportunity_id: opportunityId,
      title: concept.name,
      summary: concept.description,
      value_proposition: concept.core_value_prop,
      target_customer_segment: concept.target_customer,
      pain_points_addressed: [],
      agent_architecture_sketch: JSON.stringify({
        agent_roles: concept.agent_roles,
        tagline: concept.tagline,
      }),
      defensibility_notes: concept.differentiators.join('\n'),
      generated_at: new Date().toISOString(),
      generated_by: 'concept-generator-agent',
      source_phase: 'generated' as const,
      is_active: true,
      selected_for_validation: false,
      account_id: this.accountId,
    }));

    const { error } = await this.supabase.from('concepts').insert(rows);

    if (error !== null) {
      throw new AgentPersistenceError(
        `ConceptGeneratorAgent: Failed to persist concepts: ${error.message}`,
        error,
      );
    }
  }
}
