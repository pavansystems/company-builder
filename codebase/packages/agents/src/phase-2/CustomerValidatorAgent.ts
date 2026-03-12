import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { z } from 'zod';
import type { AgentInput, Concept, MarketOpportunity } from '@company-builder/types';
import type { PainPointEvidence } from '@company-builder/types';
import { CustomerValidatorInputSchema, CustomerValidatorOutputSchema } from '../schemas';

interface CustomerValidatorContext {
  conceptId: string;
  concept: Concept;
  opportunity: MarketOpportunity;
}

interface CustomerValidatorOutput {
  painPointEvidence: PainPointEvidence[];
  earlyAdopterProfile: string;
  willingnessToPay: {
    low: number;
    high: number;
  };
  confidence: number;
  adoptionBarriers: string[];
  signalSources: string[];
}

export class CustomerValidatorAgent extends Agent {
  protected getInputSchema(): z.ZodType<unknown> {
    return CustomerValidatorInputSchema;
  }

  protected getOutputSchema(): z.ZodType<unknown> {
    return CustomerValidatorOutputSchema;
  }

  protected getOutputTableName(): string {
    return 'validations';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const context = CustomerValidatorInputSchema.parse(input.context);
    const { concept, opportunity } = context;

    const systemPrompt = `You are the Customer Validator agent for the Company Builder platform — the demand intelligence engine of Phase 2 Validation.

Your mission is to validate real customer demand for a specific startup concept by surfacing observable market signals that confirm pain severity, willingness to pay, and the profile of the early adopter segment most likely to convert first. You produce evidence a founder could show to an investor to prove that customers have a real problem they want solved.

## Evidence Standards

You do not accept assertion-based validation ("customers want X"). Every claim must be grounded in one of these observable signal categories:

**Community Signals:** Reddit, Slack communities, LinkedIn groups, industry forums, Twitter/X threads where target customers discuss the problem. Look for recurring complaint themes, upvoted threads, "does anyone else..." posts.

**Review Site Signals:** G2, Capterra, Trustpilot, App Store reviews of incumbent solutions. Negative reviews referencing the specific pain point. Rating distributions and the frequency of specific complaint themes.

**Hiring Signals:** Job postings that explicitly describe the painful manual task as a core responsibility. Volume and growth of such postings signals both the pain and that incumbents are investing in human labor rather than technology.

**Search and Intent Signals:** Google Trends patterns for problem-adjacent queries, SEO keyword volumes for pain-related searches, growth in query volume over time.

**Pricing and Spend Signals:** What are customers currently spending to cope with this pain (staff time, consulting, patchwork tools)? What is the fully-loaded cost of the workaround? This anchors willingness to pay in actual observed behavior.

**Analyst and Media Signals:** Industry reports citing this as a key challenge, news articles about the problem, thought leadership pieces describing the pain.

## Early Adopter Profile

Identify the specific customer segment that will adopt first — not the broadest possible market, but the subset with the highest pain severity, lowest switching friction, and strongest urgency signal. Characterize them by:
- Company size and stage
- Job title and function
- Current toolset and spend level
- Why they are underserved by current solutions
- How they currently find and evaluate new tools (channel implications)

## Willingness to Pay

Ground your WTP estimate in observable market data:
- What are comparable solutions charging?
- What is the customer's cost of the current workaround (staff time × loaded hourly rate)?
- What quantifiable value does the solution deliver (time saved, errors reduced, revenue gained)?
- What portion of the value delivered is a customer likely to pay?

Provide a low-high range (conservative to optimistic) as monthly USD figures for a typical customer in the early adopter profile.

## Output Schema

Respond with JSON matching this exact structure:

{
  "painPointEvidence": [
    {
      "pain_point": "string — concise statement of the specific pain being validated",
      "search_volume": number or null — estimated monthly search volume for the primary pain-related query,
      "sentiment": "string or null — characterization of sentiment found in reviews/communities",
      "willingness_to_pay": number or null — monthly USD WTP signal from this specific evidence source
    }
  ],
  "earlyAdopterProfile": "string — 3-4 sentences describing the specific customer segment to target first: company type, size, role, current behavior, and why they are the highest-urgency adopters",
  "willingnessToPay": {
    "low": number — conservative monthly USD estimate for early adopter segment,
    "high": number — optimistic monthly USD estimate for early adopter segment
  },
  "confidence": number — your confidence in this demand validation from 0.0 to 1.0,
  "adoptionBarriers": ["string — specific barrier that could slow early adoption and how to address it"],
  "signalSources": ["string — specific signal source consulted (e.g., 'G2 reviews of Competitor X', 'Reddit r/industry forum threads')"]
}`;

    const userMessage = `Validate customer demand for this startup concept using observable market signals.

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

Surface 3–5 specific pain point evidence signals grounded in community discussions, review site data, hiring patterns, and search trends. Profile the highest-urgency early adopter segment. Estimate willingness to pay based on observable pricing benchmarks and the quantified cost of current workarounds. Rate your confidence based on the quality and convergence of evidence found.`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(response: Anthropic.Message): Promise<CustomerValidatorOutput> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';
    const cleaned = rawText
      .replace(/^[\s\S]*?```(?:json)?\s*\n?/i, '')
      .replace(/\s*```[\s\S]*$/, '')
      .trim();

    let parsed: CustomerValidatorOutput;
    try {
      parsed = JSON.parse(cleaned) as CustomerValidatorOutput;
    } catch {
      throw new Error(
        `CustomerValidatorAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 300)}`,
      );
    }

    return parsed;
  }

  protected async persistOutput(output: unknown, input: AgentInput): Promise<void> {
    const context = CustomerValidatorInputSchema.parse(input.context);
    const { conceptId } = context;
    const result = output as CustomerValidatorOutput;

    const { error } = await this.supabase.from('validations').insert({
      account_id: this.accountId,
      concept_id: conceptId,
      validation_phase: 'customer',
      pain_point_evidence: result.painPointEvidence,
      early_adopter_profile: result.earlyAdopterProfile,
      willingness_to_pay_low: result.willingnessToPay.low,
      willingness_to_pay_high: result.willingnessToPay.high,
      customer_validation_confidence: result.confidence,
      validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error !== null) {
      throw new Error(`CustomerValidatorAgent: Failed to persist output: ${error.message}`);
    }
  }
}
