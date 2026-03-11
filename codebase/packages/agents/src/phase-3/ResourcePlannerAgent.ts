import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { z } from 'zod';
import type { AgentInput } from '@company-builder/types';
import type { Concept } from '@company-builder/types';
import { ResourcePlannerInputSchema, ResourcePlannerOutputSchema } from '../schemas';

// ---------------------------------------------------------------------------
// Input context shape
// ---------------------------------------------------------------------------

interface ResourcePlannerContext {
  conceptId: string;
  concept: Concept;
  agentArchitecture: Record<string, unknown>;
  financialProjection: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// LLM output shape
// ---------------------------------------------------------------------------

interface HiringPlanEntry {
  role: string;
  headcount: number;
  startMonth: number;
  annualCostPerHead: number;
  isAgent: boolean;
}

interface TechStackEntry {
  category: string;
  tools: string[];
}

interface ResourcePlannerLLMResponse {
  upfrontBuildCost: number;
  hiringPlan: HiringPlanEntry[];
  runwayMonths: number;
  techStack: TechStackEntry[];
  totalFundingNeeded: number;
  burnRateMonthly: number;
}

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

export class ResourcePlannerAgent extends Agent {
  protected getInputSchema(): z.ZodType<unknown> {
    return ResourcePlannerInputSchema;
  }

  protected getOutputSchema(): z.ZodType<unknown> {
    return ResourcePlannerOutputSchema;
  }

  protected getOutputTableName(): string {
    return 'blueprints';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const ctx = ResourcePlannerInputSchema.parse(input.context);
    const { concept, agentArchitecture, financialProjection } = ctx;

    const systemPrompt = `You are the Resource Planner (Phase 3, Step 3.5) for the Company Builder platform.

Your responsibility is to translate all Phase 3 specifications into a concrete, financially realistic resource plan: how much capital is needed, who to hire and when, what technology to buy, and how long the startup can survive on its initial funding.

## Planning Methodology

### Upfront Build Cost
The cost to build the MVP before any revenue:
- Engineering hours × average developer rate ($150-200/hour contractor, $100-150/hour FTE blended)
- Infrastructure setup (domain, hosting, CI/CD, monitoring, staging environment)
- Design and UX (if applicable — $5-15k for basic design system and user flows)
- Legal and compliance (incorporation $1-3k, terms of service and privacy policy review $2-5k)
- Agent infrastructure (Supabase/database setup, Claude API integration, testing)
- Typical range for AI SaaS MVP: $30k-$200k depending on complexity

### Hiring Plan Design
Plan hiring in three stages:
- **Month 1 (Founding team)**: Absolute minimum to build and sell the MVP
  - Founder handles CEO + product + sales in Month 1
  - Technical co-founder or lead engineer (if not a technical founder)
  - Cost: $0 for equity-compensated founders; $150-200k/year fully-loaded for first engineering hire
- **Month 3-6 (Core team)**: Add specialized roles as revenue ramps
  - GTM / sales hire: $80-120k base = $104-160k fully-loaded
  - Second engineer: $140-180k base = $182-234k fully-loaded
  - Customer success (often a hybrid with agents): $60-90k base = $78-117k fully-loaded
- **Month 7-12 (Growth team)**: Add roles only when revenue justifies the cost
  - Additional engineers: only if product velocity is a constraint
  - Head of marketing: only if content/SEO requires dedicated ownership

For each hire:
- **role**: Exact title (e.g., "Lead Full-Stack Engineer", "GTM Lead / Head of Sales")
- **headcount**: Number of people in this role
- **startMonth**: When this person starts (1 = Month 1)
- **annualCostPerHead**: Fully-loaded annual cost including salary × 1.3-1.4 for taxes/benefits/equipment
- **isAgent**: true if this is an AI agent "role" (counted separately from human headcount)

### Runway Calculation
Runway = Total funding available / Average monthly burn rate

Average monthly burn rate (first 12 months):
= (Sum of all monthly burns) / 12

Monthly burn = Operating expenses - Revenue (burn is negative EBITDA)

Operating expenses include:
- Salaries (all human employees, fully-loaded)
- Infrastructure and hosting (AWS/GCP/Vercel costs, scales with customers)
- LLM API costs (from agent architecture compute estimates)
- SaaS tools (GitHub, Slack, Figma, Linear, HubSpot, etc. — typically $500-2k/month for small team)
- Legal, accounting, HR: ~$2-4k/month fixed overhead
- Marketing / GTM spend (from GTM plan)

Be conservative: assume revenue ramps 20-30% slower than projected.

### Tech Stack Selection
For each category, choose the optimal tool with:
- Fast time-to-market (weeks, not months to launch)
- Low fixed cost (serverless/pay-per-use preferred for early stage)
- Strong LLM integration support
- No premature optimization (avoid Kubernetes, microservices, distributed queues until needed)

Required categories to cover:
- Backend (language + framework + hosting)
- Frontend (framework + deployment)
- Database (primary data store + caching if applicable)
- LLM API (primary model provider + fallback if applicable)
- Authentication (managed auth service)
- Payments (payment processor + billing)
- Email (transactional email + marketing email)
- Monitoring & Observability (error tracking + APM + logging)
- Analytics (product analytics + business intelligence)
- Communication (internal: Slack; external: support chat if applicable)

### Total Funding Needed
= Upfront build cost + (Monthly burn × planned runway months) + 20% contingency buffer

Funding strategy:
- < $250k: Bootstrap or friends & family
- $250k-$750k: Angel / pre-seed
- $750k-$2M: Seed round
- > $2M: Series A (only if unit economics are proven and growth is clear)

## Quality Standards
- Monthly burn rate must be realistic: $20k-$80k/month for lean seed stage, $80k-$200k for growth
- Runway months must be ≥ 12 (less than 12 is existentially risky)
- Total funding needed must equal: upfrontBuildCost + (burnRateMonthly × runwayMonths) × 1.2 contingency
- Tech stack tools should be real, named services (not "a cloud provider" but "AWS EC2 + RDS" or "Vercel + Supabase")
- Hiring plan must be phased (not everyone hired on Day 1)`;

    const userMessage = `Create the complete resource and funding plan for this AI-first startup.

## Concept
**Title:** ${concept.title}
**Summary:** ${concept.summary ?? 'Not provided'}
**Value Proposition:** ${concept.value_proposition ?? 'Not provided'}
**Target Customer Segment:** ${concept.target_customer_segment ?? 'Not provided'}
**Agent Architecture Sketch:** ${concept.agent_architecture_sketch ?? 'Not provided'}

## Agent Architecture (from Step 3.2)
${JSON.stringify(agentArchitecture, null, 2)}

## Financial Projection (from Step 3.1)
${JSON.stringify(financialProjection, null, 2)}

## Required Output

Return a JSON object with EXACTLY this structure:

{
  "upfrontBuildCost": number — total cost to build MVP before launch, in USD,
  "hiringPlan": [
    {
      "role": "string — exact job title",
      "headcount": number — number of people in this role,
      "startMonth": number — month when this role starts (1 = Month 1),
      "annualCostPerHead": number — fully-loaded annual cost per person in USD,
      "isAgent": boolean — true if this is an AI agent role (not human)
    }
  ],
  "runwayMonths": number — months of runway with planned funding,
  "techStack": [
    {
      "category": "string — technology category (e.g., 'Backend', 'Database', 'LLM API')",
      "tools": ["string", ...] — specific named tools/services in this category
    }
  ],
  "totalFundingNeeded": number — total capital required in USD (build cost + burn + 20% buffer),
  "burnRateMonthly": number — average monthly cash burn in USD during runway period
}

Design a lean, realistic resource plan that gives this startup the best chance of reaching PMF.`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(
    response: Anthropic.Message,
  ): Promise<ResourcePlannerLLMResponse> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let parsed: ResourcePlannerLLMResponse;
    try {
      parsed = JSON.parse(cleaned) as ResourcePlannerLLMResponse;
    } catch {
      throw new Error(
        `ResourcePlannerAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 300)}`,
      );
    }

    if (typeof parsed.upfrontBuildCost !== 'number' || parsed.upfrontBuildCost <= 0) {
      throw new Error('ResourcePlannerAgent: upfrontBuildCost is missing or invalid');
    }
    if (!Array.isArray(parsed.hiringPlan) || parsed.hiringPlan.length === 0) {
      throw new Error('ResourcePlannerAgent: hiringPlan is missing or empty');
    }
    if (typeof parsed.runwayMonths !== 'number' || parsed.runwayMonths < 1) {
      throw new Error('ResourcePlannerAgent: runwayMonths is missing or invalid');
    }
    if (!Array.isArray(parsed.techStack) || parsed.techStack.length === 0) {
      throw new Error('ResourcePlannerAgent: techStack is missing or empty');
    }

    return parsed;
  }

  protected async persistOutput(
    output: unknown,
    input: AgentInput,
  ): Promise<void> {
    const ctx = ResourcePlannerInputSchema.parse(input.context);
    const { conceptId } = ctx;
    const data = output as ResourcePlannerLLMResponse;

    // Map hiring plan to DB HiringPlanEntry shape
    const hiringPlanForDb = data.hiringPlan.map((h) => ({
      role: h.role,
      headcount: h.headcount,
      start_month: h.startMonth,
      cost_per_person: h.annualCostPerHead,
    }));

    // Convert techStack array to DB Record shape
    const techStackForDb: Record<string, string[]> = {};
    for (const entry of data.techStack) {
      techStackForDb[entry.category] = entry.tools;
    }

    // Compute funding milestones
    const fundingMilestones = [
      {
        milestone: 'MVP Launch',
        required_funding_usd: data.upfrontBuildCost,
        month: 1,
      },
      {
        milestone: 'Seed funding close',
        required_funding_usd: data.totalFundingNeeded,
        month: 2,
      },
      {
        milestone: 'Series A preparation (PMF achieved)',
        required_funding_usd: data.totalFundingNeeded * 3,
        month: Math.round(data.runwayMonths * 0.7),
      },
    ];

    const { error } = await this.supabase
      .from('blueprints')
      .upsert(
        {
          concept_id: conceptId,
          upfront_build_cost: data.upfrontBuildCost,
          hiring_plan: hiringPlanForDb,
          runway_months: data.runwayMonths,
          technology_stack: techStackForDb,
          monthly_operating_cost: data.burnRateMonthly,
          funding_milestones: fundingMilestones,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'concept_id' },
      );

    if (error !== null) {
      throw new Error(`ResourcePlannerAgent: Failed to upsert blueprint: ${error.message}`);
    }
  }
}
