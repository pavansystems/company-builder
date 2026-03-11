import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { z } from 'zod';
import type { AgentInput } from '@company-builder/types';
import type { Concept } from '@company-builder/types';
import { AgentArchitectInputSchema, AgentArchitectOutputSchema } from '../schemas';

// ---------------------------------------------------------------------------
// Input context shape
// ---------------------------------------------------------------------------

interface AgentArchitectContext {
  conceptId: string;
  concept: Concept;
  businessModel: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// LLM output shape
// ---------------------------------------------------------------------------

interface AgentRoleOutput {
  name: string;
  responsibility: string;
  inputSources: string[];
  outputTargets: string[];
  toolsNeeded: string[];
  estimatedCostPerMonth: number;
}

interface HumanRoleOutput {
  title: string;
  responsibilities: string[];
  fte: number;
  annualCost: number;
}

interface EscalationProtocolOutput {
  trigger: string;
  escalateTo: 'human' | 'senior_agent';
  sla: string;
}

interface AgentArchitectLLMResponse {
  agentRoles: AgentRoleOutput[];
  humanRoles: HumanRoleOutput[];
  escalationProtocols: EscalationProtocolOutput[];
  agentToHumanRatio: number;
}

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

export class AgentArchitectAgent extends Agent {
  protected getInputSchema(): z.ZodType<unknown> {
    return AgentArchitectInputSchema;
  }

  protected getOutputSchema(): z.ZodType<unknown> {
    return AgentArchitectOutputSchema;
  }

  protected getOutputTableName(): string {
    return 'blueprints';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const ctx = AgentArchitectInputSchema.parse(input.context);
    const { concept, businessModel } = ctx;

    const systemPrompt = `You are the Agent Architect (Phase 3, Step 3.2) for the Company Builder platform.

Your responsibility is to design the full operational structure of this AI-first startup — specifying exactly which business functions are handled by AI agents, which require humans, how they interact, and when agents hand off to humans.

## Design Principles

### Agent Role Design
Each agent role must be specific and operational — not vague. For each agent you define:
- **name**: A clear, descriptive name (e.g., "Lead Qualification Agent", "Contract Review Agent")
- **responsibility**: Single sentence: "This agent does X for Y customers/use cases"
- **inputSources**: Concrete data inputs (e.g., "CRM contact records", "incoming email", "customer support tickets")
- **outputTargets**: Where output goes (e.g., "Qualified leads table", "Sales rep Slack notification", "Customer dashboard")
- **toolsNeeded**: Specific tools/APIs required (e.g., "Anthropic Claude API", "Stripe API", "Google Calendar API", "SendGrid", "Twilio")
- **estimatedCostPerMonth**: Realistic LLM API cost estimate at 100 customers (in USD). Typical range: $10-$500/month per agent depending on volume.

### Function Coverage — Map every business function
Cover these domains exhaustively:
1. **Customer Acquisition**: lead gen, outreach, qualification, demos
2. **Sales / Conversion**: proposal generation, pricing, contract, payment
3. **Product Delivery / Operations**: core product workflow, fulfillment, quality checks
4. **Customer Success**: onboarding, support, troubleshooting, renewals
5. **Data & Analytics**: reporting, anomaly detection, alerting
6. **Finance & Admin**: invoicing, reconciliation, bookkeeping summaries

For each function: assign it to an agent OR a human role. No function should be unowned.

### Human Role Design
Humans are needed when:
- Decisions require legal, ethical, or strategic judgment (e.g., contract disputes, regulatory exceptions)
- Creative work requires originality or empathy at a level agents cannot reliably match
- Novel situations outside training distribution require adaptive problem-solving
- Relationship trust requires a human presence (large enterprise relationships, board-level interactions)

For each human role:
- **title**: Actual job title (e.g., "Head of Customer Success", "Founder / CEO", "Sales Engineer")
- **responsibilities**: 3-5 specific bullet points of what they actually do
- **fte**: Full-time equivalents needed (can be 0.5 for fractional)
- **annualCost**: Fully-loaded annual cost including salary, benefits, equipment, employer taxes (multiply base salary by 1.3-1.4)

### Escalation Protocol Design
Design protocols for every high-risk failure mode:
- When does an agent hit a decision boundary and need to escalate?
- Who or what does it escalate to?
- What is the SLA for resolution?

Common escalation triggers:
- Customer complaint score above threshold
- Contract value exceeds $X
- Technical error rate above Y%
- Customer churning signals detected
- Regulatory/compliance exception detected

### Agent-to-Human Ratio
Compute: (number of agent FTEs equivalent) / (number of human FTEs)
- An agent handling a full workflow function = 1 agent FTE equivalent
- Report this ratio prominently — it is a key business model metric

## Quality Standards
- Minimum 4 agent roles, minimum 1 human role
- Every escalation protocol must have a concrete, measurable trigger (not vague)
- Cost estimates must be grounded in actual LLM pricing ($3/1M input tokens, $15/1M output tokens for Claude Opus)
- FTE counts must be realistic for a seed-stage startup (total humans < 5 in first year)`;

    const userMessage = `Design the complete agent and human operational architecture for this AI-first startup.

## Concept
**Title:** ${concept.title}
**Summary:** ${concept.summary ?? 'Not provided'}
**Value Proposition:** ${concept.value_proposition ?? 'Not provided'}
**Target Customer Segment:** ${concept.target_customer_segment ?? 'Not provided'}
**Pain Points Addressed:** ${(concept.pain_points_addressed ?? []).join('; ')}
**Agent Architecture Sketch:** ${concept.agent_architecture_sketch ?? 'Not provided'}
**Defensibility Notes:** ${concept.defensibility_notes ?? 'Not provided'}

## Business Model (from Step 3.1)
${JSON.stringify(businessModel, null, 2)}

## Required Output

Return a JSON object with EXACTLY this structure:

{
  "agentRoles": [
    {
      "name": "string — descriptive agent role name",
      "responsibility": "string — single sentence describing what this agent does",
      "inputSources": ["string", ...] — specific data sources this agent consumes,
      "outputTargets": ["string", ...] — where this agent sends its outputs,
      "toolsNeeded": ["string", ...] — specific APIs/tools this agent requires,
      "estimatedCostPerMonth": number — LLM API cost in USD/month at 100 customers
    }
  ],
  "humanRoles": [
    {
      "title": "string — job title",
      "responsibilities": ["string", ...] — 3-5 specific responsibilities,
      "fte": number — full-time equivalent headcount (0.5, 1, 2, etc.),
      "annualCost": number — fully-loaded annual cost in USD
    }
  ],
  "escalationProtocols": [
    {
      "trigger": "string — specific, measurable condition that triggers escalation",
      "escalateTo": "human | senior_agent",
      "sla": "string — time-bound resolution target (e.g., '< 4 hours', '< 1 business day')"
    }
  ],
  "agentToHumanRatio": number — ratio of agent FTE equivalents to human FTEs
}

Design a comprehensive, operationally realistic architecture that makes this an AI-first company.`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(
    response: Anthropic.Message,
  ): Promise<AgentArchitectLLMResponse> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let parsed: AgentArchitectLLMResponse;
    try {
      parsed = JSON.parse(cleaned) as AgentArchitectLLMResponse;
    } catch {
      throw new Error(
        `AgentArchitectAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 300)}`,
      );
    }

    if (!Array.isArray(parsed.agentRoles) || parsed.agentRoles.length === 0) {
      throw new Error('AgentArchitectAgent: agentRoles is missing or empty');
    }
    if (!Array.isArray(parsed.humanRoles) || parsed.humanRoles.length === 0) {
      throw new Error('AgentArchitectAgent: humanRoles is missing or empty');
    }
    if (!Array.isArray(parsed.escalationProtocols) || parsed.escalationProtocols.length === 0) {
      throw new Error('AgentArchitectAgent: escalationProtocols is missing or empty');
    }

    return parsed;
  }

  protected async persistOutput(
    output: unknown,
    input: AgentInput,
  ): Promise<void> {
    const ctx = AgentArchitectInputSchema.parse(input.context);
    const { conceptId } = ctx;
    const data = output as AgentArchitectLLMResponse;

    // Map to DB schema types
    const agentRolesForDb = data.agentRoles.map((r) => ({
      role: r.name,
      agent_or_human: 'agent' as const,
      responsibilities: [r.responsibility],
      tools: r.toolsNeeded,
      decision_boundaries: `Escalates when: ${data.escalationProtocols
        .filter((p) => p.escalateTo === 'human')
        .map((p) => p.trigger)
        .slice(0, 2)
        .join('; ')}`,
      cost_usd_per_month: r.estimatedCostPerMonth,
    }));

    const humanRolesForDb = data.humanRoles.map((r) => ({
      role: r.title,
      responsibilities: r.responsibilities,
      headcount: r.fte,
      cost_usd_per_year: r.annualCost,
    }));

    const escalationProtocolsForDb = data.escalationProtocols.map((p) => ({
      trigger: p.trigger,
      escalation_path: p.escalateTo,
      sla_minutes: p.sla.includes('hour')
        ? parseInt(p.sla) * 60
        : p.sla.includes('minute')
        ? parseInt(p.sla)
        : null,
    }));

    // Compute operational cost breakdown
    const agentComputeCost = data.agentRoles.reduce(
      (sum, r) => sum + r.estimatedCostPerMonth,
      0,
    );
    const humanMonthlyCost = data.humanRoles.reduce(
      (sum, r) => sum + r.annualCost / 12,
      0,
    );

    const { error } = await this.supabase
      .from('blueprints')
      .upsert(
        {
          concept_id: conceptId,
          agent_roles: agentRolesForDb,
          human_roles: humanRolesForDb,
          escalation_protocols: escalationProtocolsForDb,
          operational_cost_breakdown: {
            agent_compute: Math.round(agentComputeCost),
            human: Math.round(humanMonthlyCost),
            tools: Math.round(agentComputeCost * 0.2), // Tools typically ~20% of compute
            total: Math.round(agentComputeCost + humanMonthlyCost + agentComputeCost * 0.2),
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'concept_id' },
      );

    if (error !== null) {
      throw new Error(`AgentArchitectAgent: Failed to upsert blueprint: ${error.message}`);
    }
  }
}
