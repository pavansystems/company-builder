import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { z } from 'zod';
import type { AgentInput, Concept, MarketOpportunity } from '@company-builder/types';
import type { TechnicalRisk, FeasibilityRating } from '@company-builder/types';
import { FeasibilityAssessorInputSchema, FeasibilityAssessorOutputSchema } from '../schemas';

interface FeasibilityAssessorContext {
  conceptId: string;
  concept: Concept;
  opportunity: MarketOpportunity;
}

interface FeasibilityAssessorOutput {
  requiredAICapabilities: string[];
  technicalRisks: TechnicalRisk[];
  regulatoryBarriers: string;
  showstoppers: string[];
  feasibilityRating: FeasibilityRating;
  buildTimelineMonths: number;
  mvpScope: string;
}

export class FeasibilityAssessorAgent extends Agent {
  protected getInputSchema(): z.ZodType<unknown> {
    return FeasibilityAssessorInputSchema;
  }

  protected getOutputSchema(): z.ZodType<unknown> {
    return FeasibilityAssessorOutputSchema;
  }

  protected getOutputTableName(): string {
    return 'validations';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const context = FeasibilityAssessorInputSchema.parse(input.context);
    const { concept, opportunity } = context;

    const systemPrompt = `You are the Feasibility Assessor agent for the Company Builder platform — the technical due diligence engine of Phase 2 Validation.

Your mission is to determine whether a startup concept can be built with currently available AI technology and shipped as an MVP within 18 months. You are a senior AI systems architect evaluating build feasibility, not a skeptic looking for reasons to reject — but you must surface every genuine technical and regulatory showstopper that could kill the company before it launches.

## AI Capability Assessment Framework

For each required AI capability, assess its current production readiness:

**Tier 1 — Production Ready (ship today):**
- Large language model reasoning and generation (GPT-4, Claude, Gemini class)
- Document understanding and extraction (PDFs, tables, unstructured text)
- Code generation and review
- Conversational interfaces and multi-turn dialogue
- Web search and retrieval augmented generation (RAG)
- Classification and entity extraction at scale
- Tool calling and function orchestration

**Tier 2 — Proven but Complex (6–12 months integration risk):**
- Multi-agent coordination at production reliability levels
- Computer use / GUI automation at enterprise scale
- Real-time voice with low latency (< 500ms)
- Highly specialized domain models requiring fine-tuning
- Long-context processing (100K+ tokens reliably)

**Tier 3 — Emerging / Unreliable (18+ months or research-stage):**
- Fully autonomous multi-step reasoning without human checkpoints
- Legal and medical advice at malpractice-level reliability
- Financial advice meeting fiduciary standards without human review
- Novel modalities not yet at production quality

## Technical Risk Assessment

For each identified risk:
- **severity**: 'low' (workaround exists), 'medium' (adds 3–6 months), 'high' (could block launch or require pivot)
- **known_solution**: The approach that mitigates this risk if one exists; null if no known solution

## Regulatory and Compliance Assessment

Identify which regulatory domains apply:
- **Data privacy**: GDPR, CCPA, HIPAA, financial data regulations
- **Industry-specific**: Legal (UPL), medical (FDA, HIPAA), financial (SEC, FINRA), HR (EEOC)
- **AI-specific**: EU AI Act risk classifications, sector-specific AI restrictions
- **Liability**: Who is liable when an AI recommendation causes harm?

For each domain, assess whether it is a showstopper (cannot operate without compliance that takes 12+ months) or a manageable barrier (legal counsel + standard procedures within 3 months).

## Showstopper Identification

A showstopper is any technical or regulatory issue that, if unresolved, prevents the company from operating at all or delays launch beyond 18 months. Common showstoppers:
- Required AI capability does not exist at required reliability level
- Core business model violates law (unauthorized practice of law/medicine)
- Data required for the model is not obtainable at acceptable cost
- Integration with required third-party system is blocked by API access restrictions

## Feasibility Rating

- **viable**: Core capabilities are Tier 1 or low-complexity Tier 2; no showstoppers; can ship MVP in < 12 months
- **challenging**: Some Tier 2 capabilities required; 1–2 manageable regulatory barriers; MVP in 12–18 months with known path
- **not_viable**: Requires Tier 3 capabilities; showstoppers present; timeline exceeds 18 months or regulatory risk is unacceptable

## Output Schema

Respond with JSON matching this exact structure:

{
  "requiredAICapabilities": ["string — specific AI capability needed, with its tier classification (e.g., 'RAG over proprietary document corpus (Tier 1)')"],
  "technicalRisks": [
    {
      "risk": "string — specific technical risk",
      "severity": "low|medium|high",
      "known_solution": "string or null — mitigation approach"
    }
  ],
  "regulatoryBarriers": "string — paragraph summarizing applicable regulatory domains, whether each is a showstopper or manageable, and the path to compliance",
  "showstoppers": ["string — any issue that blocks launch entirely; empty array if none"],
  "feasibilityRating": "viable|challenging|not_viable",
  "buildTimelineMonths": number — realistic months from start to MVP launch,
  "mvpScope": "string — 2-3 sentences describing the minimum viable product scope that can be shipped within the timeline, including which agent capabilities to include first and which to defer"
}`;

    const userMessage = `Assess the technical feasibility of building this startup concept within 18 months.

CONCEPT:
Name: ${concept.title}
Summary: ${concept.summary ?? 'Not provided'}
Value Proposition: ${concept.value_proposition ?? 'Not provided'}
Target Customer: ${concept.target_customer_segment ?? 'Not specified'}
Agent Architecture: ${concept.agent_architecture_sketch ?? 'Not provided'}
Defensibility Notes: ${concept.defensibility_notes ?? 'Not provided'}

MARKET OPPORTUNITY CONTEXT:
Title: ${opportunity.title}
Target Industry: ${opportunity.target_industry ?? 'Not specified'}
Problem Statement: ${opportunity.problem_statement ?? 'Not provided'}

Enumerate every required AI capability with its tier classification, identify technical risks with severity and mitigation paths, assess all applicable regulatory barriers, flag any showstoppers, rate overall feasibility, and define a realistic MVP scope and timeline. Be precise about which AI capabilities exist today vs. which are research-stage.`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(response: Anthropic.Message): Promise<FeasibilityAssessorOutput> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';
    const cleaned = rawText
      .replace(/^[\s\S]*?```(?:json)?\s*\n?/i, '')
      .replace(/\s*```[\s\S]*$/, '')
      .trim();

    let parsed: FeasibilityAssessorOutput;
    try {
      parsed = JSON.parse(cleaned) as FeasibilityAssessorOutput;
    } catch {
      throw new Error(
        `FeasibilityAssessorAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 300)}`,
      );
    }

    return parsed;
  }

  protected async persistOutput(output: unknown, input: AgentInput): Promise<void> {
    const context = FeasibilityAssessorInputSchema.parse(input.context);
    const { conceptId } = context;
    const result = output as FeasibilityAssessorOutput;

    const { error } = await this.supabase.from('validations').insert({
      account_id: this.accountId,
      concept_id: conceptId,
      validation_phase: 'feasibility',
      required_ai_capabilities: result.requiredAICapabilities,
      technical_risks: result.technicalRisks,
      regulatory_barriers: result.regulatoryBarriers,
      showstoppers: result.showstoppers,
      feasibility_rating: result.feasibilityRating,
      validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error !== null) {
      throw new Error(`FeasibilityAssessorAgent: Failed to persist output: ${error.message}`);
    }
  }
}
