import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { z } from 'zod';
import type { AgentInput, MarketOpportunity } from '@company-builder/types';
import { PainExtractorInputSchema, PainExtractorOutputSchema } from '../schemas';

interface PainExtractorContext {
  opportunityId: string;
  opportunity: MarketOpportunity;
  landscapeAnalysis: Record<string, unknown>;
}

interface PainPoint {
  title: string;
  description: string;
  affectedSegment: string;
  severity: number;
  evidence: string[];
  currentWorkaround: string;
}

interface PainExtractorOutput {
  painPoints: PainPoint[];
  primaryPainPoint: string;
  estimatedWTPMonthly: number;
}

export class PainExtractorAgent extends Agent {
  protected getInputSchema(): z.ZodType<unknown> {
    return PainExtractorInputSchema;
  }

  protected getOutputSchema(): z.ZodType<unknown> {
    return PainExtractorOutputSchema;
  }

  protected getOutputTableName(): string {
    return 'validations';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const context = PainExtractorInputSchema.parse(input.context);
    const { opportunity, landscapeAnalysis } = context;

    const systemPrompt = `You are the Pain Extractor agent for the Company Builder platform — the customer intelligence engine of Phase 1 Ideation.

Your mission is to identify, validate, and catalog the specific customer pain points and unmet needs within a target market, drawing on the landscape analysis produced by the Landscape Analyst before you. You transform a broad competitive overview into a data-driven understanding of what real customers actually suffer from and what they would pay to fix.

## Your Analytical Framework

You are a customer research analyst and market psychologist. You do not accept generic pain statements ("customers want better tools") — you surface specific, evidence-backed pain points that describe the exact tasks, workflows, and situations that frustrate customers.

**Pain Point Standards:**
Every pain point you produce must answer these questions:
1. What specific task or situation is causing frustration?
2. Which customer segment experiences this, and how often?
3. What have they tried so far, and why did it fail?
4. What is the quantifiable impact (time, money, errors, delays)?
5. What workaround are they currently using?
6. Would they pay to solve this? How much?

**Severity Scoring (1–10):**
- 9–10: Business-critical pain; customers lose significant revenue or customers because of it; buying decisions are made to solve it
- 7–8: High friction; materially slows business operations or increases costs; actively seeking solutions
- 5–6: Meaningful but tolerable; would adopt a solution if switching costs are low
- 3–4: Annoying but worked around; rarely a purchase trigger
- 1–2: Minor inconvenience; customers barely notice or have adapted

**Evidence Standards:**
For each pain point, provide 3–5 specific evidence signals that a researcher could verify. These should be the kinds of signals you would find in G2 reviews, Reddit industry forums, job postings, community discussions, and customer quotes — not abstract statements. Format each as a concrete, verifiable claim.

Examples of good evidence:
- "G2 reviews of [Competitor] averaging 3.7/5 with 'slow manual data entry' appearing in 40%+ of 1-3 star reviews"
- "Reddit r/[industry] has 50+ threads in past 12 months complaining about [specific pain]"
- "Job postings for '[Role]' explicitly describe '[manual task]' as primary responsibility — 200+ active listings on Indeed"
- "Incumbent pricing at $X/month forces SMBs to use manual workarounds instead"

**Willingness to Pay:**
Your WTP estimate should be grounded in observable market signals — what are incumbent solutions charging? What are customers spending on workarounds (staff time, consulting, adjacent tools)? What is the quantified cost of the pain? A customer spending $50K/year on manual workarounds has demonstrably higher WTP than one spending $5K.

## Primary Pain Point Selection

After cataloging all pain points, identify the single PRIMARY pain point — the one that is most severe, most universal across the target customer base, and most directly addressable by an agent-first business. This becomes the north star for Concept Generator.

## Output Schema

Respond with JSON matching this exact structure:

{
  "painPoints": [
    {
      "title": "string — concise problem statement (e.g., 'Manual Data Reconciliation Between Systems')",
      "description": "string — 2-3 sentences explaining the pain: what happens, when it happens, why it matters",
      "affectedSegment": "string — specific customer type and company size (e.g., 'Operations managers at mid-market logistics companies (50-500 employees)')",
      "severity": number — integer 1-10,
      "evidence": ["string — specific, verifiable evidence signal", "..."],
      "currentWorkaround": "string — exactly what customers do today to cope with this pain"
    }
  ],
  "primaryPainPoint": "string — the single most important pain point (should match a title in painPoints)",
  "estimatedWTPMonthly": number — monthly USD willingness to pay for a comprehensive solution, as an integer
}`;

    const userMessage = `Extract customer pain points for this market opportunity using the landscape analysis provided.

OPPORTUNITY:
Title: ${opportunity.title}
Problem Statement: ${opportunity.problem_statement ?? 'Not provided'}
Target Market: ${opportunity.target_market ?? 'Not specified'}
Target Industry: ${opportunity.target_industry ?? 'Not specified'}
Enabling Signals: ${opportunity.enabling_signals?.join('; ') ?? 'None listed'}

LANDSCAPE ANALYSIS (from Landscape Analyst):
${JSON.stringify(landscapeAnalysis, null, 2)}

Produce a comprehensive pain point catalog with 5–8 distinct, evidence-backed pain points. Each must include specific severity ratings (1–10), concrete evidence (5 signals per pain point), and the customer workaround currently in use. Identify the single primary pain point and provide a monthly willingness-to-pay estimate grounded in observable market signals such as incumbent pricing, workaround costs, and estimated time/labor expenditure.`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(response: Anthropic.Message): Promise<PainExtractorOutput> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';
    const cleaned = rawText
      .replace(/^[\s\S]*?```(?:json)?\s*\n?/i, '')
      .replace(/\s*```[\s\S]*$/, '')
      .trim();

    let parsed: PainExtractorOutput;
    try {
      parsed = JSON.parse(cleaned) as PainExtractorOutput;
    } catch {
      throw new Error(
        `PainExtractorAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 300)}`,
      );
    }

    return parsed;
  }

  protected async persistOutput(output: unknown, input: AgentInput): Promise<void> {
    const context = PainExtractorInputSchema.parse(input.context);
    const { opportunityId } = context;

    const { error } = await this.supabase.from('validations').insert({
      concept_id: opportunityId,
      validation_phase: 'pain_points' as const,
      output: output,
      validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      account_id: this.accountId,
    });

    if (error !== null) {
      throw new Error(`PainExtractorAgent: Failed to persist output: ${error.message}`);
    }
  }
}
