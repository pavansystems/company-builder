import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { z } from 'zod';
import type { AgentInput } from '@company-builder/types';
import type { Concept } from '@company-builder/types';
import { GtmStrategistInputSchema, GtmStrategistOutputSchema } from '../schemas';

// ---------------------------------------------------------------------------
// Input context shape
// ---------------------------------------------------------------------------

interface GtmStrategistContext {
  conceptId: string;
  concept: Concept;
  customerValidation: Record<string, unknown>;
  unitEconomics: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// LLM output shape
// ---------------------------------------------------------------------------

interface IcpOutput {
  title: string;
  companySize: string;
  industry: string;
  painLevel: number;
}

interface ChannelOutput {
  name: string;
  type: 'inbound' | 'outbound' | 'partnership';
  estimatedCac: number;
  timeToFirstRevenue: string;
}

interface LaunchPhase {
  phase: 'pre-launch' | 'launch' | 'growth';
  startDay: number;
  endDay: number;
  milestones: string[];
  kpis: string[];
}

interface MessagingFramework {
  headline: string;
  valueProps: string[];
  objectionHandlers: string[];
}

interface GtmStrategistLLMResponse {
  targetSegment: string;
  icp: IcpOutput;
  channels: ChannelOutput[];
  launchTimeline: LaunchPhase[];
  messagingFramework: MessagingFramework;
}

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

export class GtmStrategistAgent extends Agent {
  protected getInputSchema(): z.ZodType<unknown> {
    return GtmStrategistInputSchema;
  }

  protected getOutputSchema(): z.ZodType<unknown> {
    return GtmStrategistOutputSchema;
  }

  protected getOutputTableName(): string {
    return 'blueprints';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const ctx = GtmStrategistInputSchema.parse(input.context);
    const { concept, customerValidation, unitEconomics } = ctx;

    const systemPrompt = `You are the GTM Strategist (Phase 3, Step 3.3) for the Company Builder platform.

Your responsibility is to design the concrete go-to-market plan — how this AI-first startup acquires its first customers, positions itself against incumbents, and launches to market with measurable milestones.

## Design Principles

### Ideal Customer Profile (ICP)
The ICP is not a persona — it's a crisp decision criterion for who to target first:
- **title**: The job title of the economic buyer or key influencer (not the end user)
- **companySize**: The company size range in employees that has this problem most acutely and has the budget (e.g., "50-500 employees", "500-5000 employees")
- **industry**: The most concentrated industry vertical where pain is highest
- **painLevel**: 1-10 score (10 = can't live without solving this; 7+ required for cold outreach success)

### Target Segment
A crisp 1-2 sentence definition of the total addressable segment for the first 12 months. Not TAM — the specific slice you will go after in year 1.

### Channel Strategy
Design 2-4 channels that together can acquire 100+ customers in 12 months:

**Inbound channels** (customer finds you):
- Content marketing (SEO blog, YouTube, LinkedIn thought leadership)
- Community participation (Slack communities, Reddit, Discord, industry forums)
- Product-led growth (free tier, viral loop, referral program)

**Outbound channels** (you find the customer):
- Cold email (personalized sequences; 50-100/day; expect 2-5% reply rate)
- LinkedIn outbound (connections + messages; 20-30/day; expect 10-15% acceptance)
- Cold calling (for high-ACV segments only; 50+ calls/day; expect 5% connect rate)
- Direct mail (physical mail for enterprise; 1-2% response)

**Partnership channels** (third party brings you customers):
- Agency / reseller partnerships (agencies that serve your ICP)
- Technology integrations (marketplaces: Salesforce AppExchange, HubSpot App Marketplace, Zapier)
- Referral programs (existing customers refer peers; typically 20-30% of revenue for established SaaS)

For each channel:
- **estimatedCac**: Realistic cost to acquire ONE paying customer through this channel (in USD)
  - Cold email: $200-800 CAC typical for SMB, $1000-5000 for enterprise
  - Content/SEO: $50-300 CAC once ranking (long ramp time)
  - Partnerships: $100-400 CAC (low cost but revenue share)
- **timeToFirstRevenue**: Realistic time before this channel pays off (e.g., "2-4 weeks" for outbound, "3-6 months" for SEO)

### Launch Timeline
Three phases that cover the first 90 days:

**Pre-launch (Days 1-30)**:
- Setup outbound infrastructure, build email sequences, get first 3-5 beta customers
- Milestones: working MVP, 3+ customer interviews, first paying pilot signed
- KPIs: # of outbound sequences sent, # of demos booked, # of pilots signed

**Launch (Days 31-60)**:
- Full-scale outbound, first PR, product launch on relevant platforms
- Milestones: 10-20 paying customers, first case study, public product launch
- KPIs: MRR, CAC, demo-to-close rate, churn rate

**Growth (Days 61-90)**:
- Double down on what's working, activate second channel
- Milestones: 30-50 paying customers, second channel producing revenue
- KPIs: MRR growth rate, NPS score, channel attribution

### Messaging Framework
The messaging must be sharp enough to pass the "5-second test" — can a prospect understand the value in 5 seconds?

**Headline**: One sentence that combines: [Who] + [Problem] + [Solution] + [Key Differentiation]
Example: "The expense management tool that runs itself — while Concur requires 3 hours of admin per week, [Product] uses AI agents to auto-categorize and reconcile in 10 minutes."

**Value Props** (3 props, each 1 sentence):
- Quantify outcomes (not features): "Reduces expense processing time by 90%"
- Address the core job-to-be-done: "Never manually match a receipt again"
- Reinforce the agent-first advantage: "Unlike [Incumbent], every workflow runs automatically"

**Objection Handlers** (3 common objections with responses):
- "We already use [Incumbent]": "[Incumbent] requires manual configuration; [Product] starts working in 15 minutes"
- "I'm worried about AI accuracy": "Agent accuracy is 97% on day 1; human review catches the 3% — no blind trust required"
- "What about data security?": "SOC 2 Type II compliant; your data never trains our models"

## Quality Standards
- ICP painLevel must be ≥ 7 (lower means wrong segment)
- All channel CAC estimates must be internally consistent with unit economics LTV
  (LTV/CAC ratio must be > 3x for the business to work)
- Launch timeline milestones must be specific and measurable (no vague "validate GTM")
- Messaging headline must name a specific competitor or category incumbent`;

    const userMessage = `Design the complete go-to-market strategy for this AI-first startup.

## Concept
**Title:** ${concept.title}
**Summary:** ${concept.summary ?? 'Not provided'}
**Value Proposition:** ${concept.value_proposition ?? 'Not provided'}
**Target Customer Segment:** ${concept.target_customer_segment ?? 'Not provided'}
**Pain Points Addressed:** ${(concept.pain_points_addressed ?? []).join('; ')}

## Customer Validation Data
${JSON.stringify(customerValidation, null, 2)}

## Unit Economics
${JSON.stringify(unitEconomics, null, 2)}

## Required Output

Return a JSON object with EXACTLY this structure:

{
  "targetSegment": "string — crisp 1-2 sentence definition of year-1 target segment",
  "icp": {
    "title": "string — job title of economic buyer",
    "companySize": "string — company size range (e.g., '50-500 employees')",
    "industry": "string — primary industry vertical",
    "painLevel": number — 1-10 pain severity score (must be ≥ 7)
  },
  "channels": [
    {
      "name": "string — channel name (e.g., 'Cold Email Outbound', 'LinkedIn Outreach', 'Content Marketing')",
      "type": "inbound | outbound | partnership",
      "estimatedCac": number — cost to acquire one customer in USD,
      "timeToFirstRevenue": "string — realistic timeline (e.g., '2-4 weeks', '3-6 months')"
    }
  ],
  "launchTimeline": [
    {
      "phase": "pre-launch | launch | growth",
      "startDay": number — day number when phase begins,
      "endDay": number — day number when phase ends,
      "milestones": ["string", ...] — 3-5 specific, measurable milestones,
      "kpis": ["string", ...] — 3-5 specific KPIs with targets (e.g., 'MRR > $5k', '# demos booked > 20')
    }
  ],
  "messagingFramework": {
    "headline": "string — single sentence value proposition that passes the 5-second test",
    "valueProps": ["string", ...] — exactly 3 quantified outcome statements,
    "objectionHandlers": ["string", ...] — exactly 3 objection + response pairs
  }
}

Design a go-to-market strategy that can realistically acquire 100+ customers in 12 months.`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(
    response: Anthropic.Message,
  ): Promise<GtmStrategistLLMResponse> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let parsed: GtmStrategistLLMResponse;
    try {
      parsed = JSON.parse(cleaned) as GtmStrategistLLMResponse;
    } catch {
      throw new Error(
        `GtmStrategistAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 300)}`,
      );
    }

    if (!parsed.targetSegment) {
      throw new Error('GtmStrategistAgent: targetSegment is missing');
    }
    if (!parsed.icp || typeof parsed.icp.painLevel !== 'number') {
      throw new Error('GtmStrategistAgent: icp is missing or incomplete');
    }
    if (!Array.isArray(parsed.channels) || parsed.channels.length === 0) {
      throw new Error('GtmStrategistAgent: channels is missing or empty');
    }
    if (!Array.isArray(parsed.launchTimeline) || parsed.launchTimeline.length === 0) {
      throw new Error('GtmStrategistAgent: launchTimeline is missing or empty');
    }

    return parsed;
  }

  protected async persistOutput(
    output: unknown,
    input: AgentInput,
  ): Promise<void> {
    const ctx = GtmStrategistInputSchema.parse(input.context);
    const { conceptId } = ctx;
    const data = output as GtmStrategistLLMResponse;

    // Map channels to DB GtmChannel shape
    const channelsForDb = data.channels.map((c) => ({
      channel: c.name,
      agent_handled: c.type === 'inbound', // inbound channels often have agent-driven components
      tactics: [
        `Type: ${c.type}`,
        `Estimated CAC: $${c.estimatedCac}`,
        `Time to first revenue: ${c.timeToFirstRevenue}`,
      ],
    }));

    // Build launch timeline from the three phases
    const prelaunch = data.launchTimeline.find((p) => p.phase === 'pre-launch');
    const launch = data.launchTimeline.find((p) => p.phase === 'launch');
    const growth = data.launchTimeline.find((p) => p.phase === 'growth');

    const launchTimelineForDb = {
      day_1_30: [
        ...(prelaunch?.milestones ?? []),
        ...(prelaunch?.kpis ?? []),
      ],
      day_31_60: [
        ...(launch?.milestones ?? []),
        ...(launch?.kpis ?? []),
      ],
      day_61_90: [
        ...(growth?.milestones ?? []),
        ...(growth?.kpis ?? []),
      ],
    };

    // Messaging framework as string
    const messagingFramework = [
      `Headline: ${data.messagingFramework.headline}`,
      `Value Props: ${data.messagingFramework.valueProps.join(' | ')}`,
      `Objection Handlers: ${data.messagingFramework.objectionHandlers.join(' | ')}`,
    ].join('\n\n');

    const { error } = await this.supabase
      .from('blueprints')
      .upsert(
        {
          concept_id: conceptId,
          gtm_target_segment: data.targetSegment,
          gtm_channels: channelsForDb,
          gtm_launch_timeline: launchTimelineForDb,
          gtm_messaging_framework: messagingFramework,
          // ICP stored as agent_gtm_activities for persistence
          agent_gtm_activities: [
            `ICP: ${data.icp.title} at ${data.icp.companySize} ${data.icp.industry} companies (pain level: ${data.icp.painLevel}/10)`,
            ...data.channels.filter((c) => c.type === 'inbound').map((c) => c.name),
          ],
          human_gtm_activities: data.channels
            .filter((c) => c.type === 'outbound' || c.type === 'partnership')
            .map((c) => c.name),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'concept_id' },
      );

    if (error !== null) {
      throw new Error(`GtmStrategistAgent: Failed to upsert blueprint: ${error.message}`);
    }
  }
}
