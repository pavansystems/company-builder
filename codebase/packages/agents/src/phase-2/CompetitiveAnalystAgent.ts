import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { z } from 'zod';
import type { AgentInput, Concept, MarketOpportunity } from '@company-builder/types';
import type { CompetitorProfile, VulnerabilityMap, CompetitiveIntensity } from '@company-builder/types';
import { CompetitiveAnalystInputSchema, CompetitiveAnalystOutputSchema } from '../schemas';

interface CompetitiveAnalystContext {
  conceptId: string;
  concept: Concept;
  opportunity: MarketOpportunity;
}

interface CompetitiveAnalystOutput {
  competitors: CompetitorProfile[];
  vulnerabilityMap: VulnerabilityMap;
  competitiveIntensity: CompetitiveIntensity;
  entryBarriers: string[];
  disruptionWindow: string;
}

export class CompetitiveAnalystAgent extends Agent {
  protected getInputSchema(): z.ZodType<unknown> {
    return CompetitiveAnalystInputSchema;
  }

  protected getOutputSchema(): z.ZodType<unknown> {
    return CompetitiveAnalystOutputSchema;
  }

  protected getOutputTableName(): string {
    return 'validations';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const context = CompetitiveAnalystInputSchema.parse(input.context);
    const { concept, opportunity } = context;

    const systemPrompt = `You are the Competitive Analyst agent for the Company Builder platform — the strategic intelligence engine of Phase 2 Validation.

Your mission is to map the incumbent competitive landscape for a specific startup concept, identify the structural vulnerabilities that an agent-first challenger can exploit, and assess whether a credible disruption window exists. A venture capitalist would use your output to stress-test the concept's market entry thesis.

## Analytical Framework

### Incumbent Profiling
For each significant incumbent or competitor, you must assess:
- **Pricing model and price point**: What do they charge and to whom?
- **Core product weaknesses**: Where do customers suffer most? What do review sites reveal?
- **Human-intensive operations**: Which parts of their value chain are expensive because they rely on humans?
- **Market share signal**: Public revenue, funding, or customer count estimates
- **Strategic posture**: Are they defending, expanding, or retreating?

Focus on 3–6 competitors that collectively represent 80%+ of the addressable market. Include both direct competitors (same product category) and indirect competitors (alternative approaches customers use today).

### Vulnerability Mapping
An agent-first entrant has three structural advantages to quantify:
- **Cost advantages**: Where is the incumbent's cost base 2–5x higher due to labor? (Support headcount, manual processing, human QA)
- **Speed advantages**: Where does human decision-making create delays that agents eliminate? (Turnaround time, batch processing vs. real-time)
- **Quality advantages**: Where do human errors, inconsistency, or scale limits create quality gaps that agents close?

For each advantage category, provide concrete, specific claims — not generic statements. Reference specific incumbent workflow patterns or well-known operational characteristics.

### Competitive Intensity Assessment
Rate the competitive intensity as 'low', 'moderate', or 'high':
- **low**: Fragmented market, no dominant player above 30% share, limited VC investment, incumbents have not yet responded to AI disruption
- **moderate**: 1–2 established players with defensible positions, some AI adoption underway, moderate funding activity
- **high**: Entrenched incumbents with network effects or switching costs, well-funded AI-native competitors already in market, rapid innovation cycle

### Disruption Window
Assess whether there is a credible 18–36 month window to establish a position before:
- Incumbents complete their AI transformation
- Well-funded AI-native competitors lock up the customer base
- Regulatory or technical barriers close off the entry angle

## Output Schema

Respond with JSON matching this exact structure:

{
  "competitors": [
    {
      "name": "string — competitor name",
      "pricing": "string — pricing model and estimated price point",
      "weaknesses": ["string — specific operational or product weakness that an agent-first entrant can exploit"],
      "market_share": "string or null — estimated market share or revenue signal"
    }
  ],
  "vulnerabilityMap": {
    "cost_advantages": ["string — specific cost advantage over incumbents with estimated magnitude"],
    "speed_advantages": ["string — specific speed advantage with estimated time improvement"],
    "quality_advantages": ["string — specific quality advantage with concrete mechanism"]
  },
  "competitiveIntensity": "low|moderate|high",
  "entryBarriers": ["string — specific barrier to entry this concept must overcome"],
  "disruptionWindow": "string — 2-3 sentences assessing whether and why a disruption window exists in the next 18-36 months"
}`;

    const userMessage = `Analyze the competitive landscape for this startup concept.

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
Enabling Signals: ${opportunity.enabling_signals?.join('; ') ?? 'None listed'}

Identify 3–6 key competitors (direct and indirect), map the specific vulnerabilities an agent-first entrant can exploit across cost, speed, and quality dimensions, rate the competitive intensity, and assess the disruption window. Be specific — cite actual competitor characteristics, pricing patterns, and operational weaknesses that are publicly observable.`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(response: Anthropic.Message): Promise<CompetitiveAnalystOutput> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';
    const cleaned = rawText
      .replace(/^[\s\S]*?```(?:json)?\s*\n?/i, '')
      .replace(/\s*```[\s\S]*$/, '')
      .trim();

    let parsed: CompetitiveAnalystOutput;
    try {
      parsed = JSON.parse(cleaned) as CompetitiveAnalystOutput;
    } catch {
      throw new Error(
        `CompetitiveAnalystAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 300)}`,
      );
    }

    return parsed;
  }

  protected async persistOutput(output: unknown, input: AgentInput): Promise<void> {
    const context = CompetitiveAnalystInputSchema.parse(input.context);
    const { conceptId } = context;
    const result = output as CompetitiveAnalystOutput;

    const { error } = await this.supabase.from('validations').insert({
      concept_id: conceptId,
      validation_phase: 'competitive',
      competitors: result.competitors,
      vulnerability_map: result.vulnerabilityMap,
      competitive_intensity: result.competitiveIntensity,
      validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error !== null) {
      throw new Error(`CompetitiveAnalystAgent: Failed to persist output: ${error.message}`);
    }
  }
}
