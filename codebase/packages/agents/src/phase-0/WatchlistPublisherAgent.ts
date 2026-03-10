import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type {
  AgentInput,
  MarketOpportunity,
  OpportunityScore,
  WatchlistVersionInsert,
  WatchlistVersionSnapshotItem,
  WatchlistItem,
} from '@company-builder/types';

interface WatchlistPublisherContext {
  opportunities: MarketOpportunity[];
  scores: OpportunityScore[];
}

interface WatchlistPublisherLLMResponse {
  summary: string;
  editorial_notes: string;
}

interface WatchlistPublisherOutput {
  version: WatchlistVersionInsert;
  items: WatchlistItem[];
}

const TOP_N = 10;

export class WatchlistPublisherAgent extends Agent {
  protected getOutputTableName(): string {
    return 'watchlist_versions';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const context = input.context as unknown as WatchlistPublisherContext;
    const { opportunities, scores } = context;

    // Build a lookup for scores by opportunity ID
    const scoreByOpportunityId = new Map<string, OpportunityScore>();
    for (const score of scores) {
      scoreByOpportunityId.set(score.market_opportunity_id, score);
    }

    // Join opportunities with scores, filter out those with no score
    const scoredOpps = opportunities
      .map((opp) => ({ opp, score: scoreByOpportunityId.get(opp.id) }))
      .filter((entry): entry is { opp: MarketOpportunity; score: OpportunityScore } =>
        entry.score !== undefined,
      );

    // Sort by composite_score descending, take top N
    scoredOpps.sort((a, b) => (b.score.composite_score ?? 0) - (a.score.composite_score ?? 0));
    const top = scoredOpps.slice(0, TOP_N);

    const systemPrompt = `You are the Watchlist Publisher agent for the Company Builder platform's Phase 0 Discovery pipeline.

Your role is to synthesize the top-ranked market opportunities into a cohesive, executive-ready watchlist. You are the final stage of Phase 0 — your output is what the team reads to decide where to focus Phase 1 ideation.

# Your Responsibilities

1. **Write a Watchlist Summary**: A 2-4 sentence executive summary describing the current state of the opportunity landscape. What are the dominant themes? What sectors are heating up? What is the overall signal quality like this cycle?

2. **Write Editorial Notes**: 1-2 sentences of meta-commentary on this watchlist — e.g., notable patterns, concentration risk (too many opportunities in one sector), emerging macro trends reflected in the data, or cautions the team should be aware of.

# Writing Standards

- Be specific and data-driven. Reference actual markets, scores, and signals.
- Use plain language appropriate for a product team reading the watchlist.
- Avoid hype. If the data shows strong opportunities, say so with specifics. If it's a weak cycle, say so honestly.
- Reference the top opportunities by name to ground the summary.
- Focus on actionability: what should the team do with this information?

# Tone
Professional, analytical, direct. Like a weekly briefing from a senior venture analyst to a founding team.

Example good summary:
"This week's watchlist is led by three converging opportunities in financial services automation, anchored by a strong cluster of tech_breakthrough and customer_pain signals. AI-driven accounts payable automation (rank #1, score 84/100) continues to strengthen with multiple high-confidence signals from arXiv and TechCrunch. The legal document review space (rank #2, score 79/100) shows the first regulatory_shift signal from EU legal tech reform, which materially improves timing confidence. Five of the top ten opportunities have agent_readiness scores above 75, indicating a strong cohort for Phase 1 ideation."

Respond with ONLY valid JSON. Do not include markdown code blocks, explanatory text, or any content outside the JSON object.`;

    const rankDescriptions = top
      .map(({ opp, score }, i) => {
        return `Rank #${i + 1}: ${opp.title}
  - Composite Score: ${score.composite_score ?? 'N/A'}/100
  - Market Size Score: ${score.market_size_score ?? 'N/A'}/100
  - Signal Convergence Score: ${score.signal_convergence_score ?? 'N/A'}/100
  - Agent Readiness Score: ${score.agent_readiness_score ?? 'N/A'}/100
  - Competitive Density Score: ${score.competitive_density_score ?? 'N/A'}/100
  - Timing Confidence Score: ${score.timing_confidence_score ?? 'N/A'}/100
  - Target Market: ${opp.target_market ?? 'N/A'}
  - Target Industry: ${opp.target_industry ?? 'N/A'}
  - Agent Readiness Tag: ${opp.agent_readiness_tag ?? 'N/A'}
  - Market Size Estimate: ${opp.market_size_estimate !== null ? `$${(opp.market_size_estimate / 1e9).toFixed(1)}B` : 'unknown'}
  - Problem Statement: ${opp.problem_statement ?? 'N/A'}
  - Scoring Rationale: ${score.reasoning ? score.reasoning.split('\n')[0] : 'N/A'}`;
      })
      .join('\n\n');

    const userMessage = `Generate a watchlist summary and editorial notes for the following top ${top.length} opportunities (ranked by composite score).

TOP OPPORTUNITIES:
${rankDescriptions}

Total opportunities scored this cycle: ${opportunities.length}
Total with scores: ${scoredOpps.length}

Return a JSON object with this structure:
{
  "summary": "<2-4 sentence executive summary of the current opportunity landscape>",
  "editorial_notes": "<1-2 sentences of meta-commentary or cautions for the team>"
}`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(response: Anthropic.Message): Promise<WatchlistPublisherOutput> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';

    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let parsed: WatchlistPublisherLLMResponse;
    try {
      parsed = JSON.parse(cleaned) as WatchlistPublisherLLMResponse;
    } catch {
      throw new Error(`WatchlistPublisherAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 200)}`);
    }

    // We need access to the context to build the full output — but parseResponse only receives
    // the Anthropic.Message. We work around this by re-computing from the stored context
    // in persistOutput. Here we return a partial shell that will be filled in persistOutput.
    return {
      version: {
        version_number: 0, // placeholder; set in persistOutput
        published_at: new Date().toISOString(),
        snapshot_data: [],
        total_opportunities: 0,
        created_by: 'watchlist-publisher-agent',
      },
      items: [],
      // Attach LLM output as metadata for use in persistOutput
      ...({ _llmOutput: parsed } as Record<string, unknown>),
    } as WatchlistPublisherOutput;
  }

  protected async persistOutput(output: unknown, input: AgentInput): Promise<void> {
    const rawOutput = output as WatchlistPublisherOutput & { _llmOutput?: WatchlistPublisherLLMResponse };
    const llmOutput = rawOutput._llmOutput;

    const context = input.context as unknown as WatchlistPublisherContext;
    const { opportunities, scores } = context;

    // Build score lookup
    const scoreByOpportunityId = new Map<string, OpportunityScore>();
    for (const score of scores) {
      scoreByOpportunityId.set(score.market_opportunity_id, score);
    }

    // Join + sort + take top N
    const scoredOpps = opportunities
      .map((opp) => ({ opp, score: scoreByOpportunityId.get(opp.id) }))
      .filter((entry): entry is { opp: MarketOpportunity; score: OpportunityScore } =>
        entry.score !== undefined,
      );

    scoredOpps.sort((a, b) => (b.score.composite_score ?? 0) - (a.score.composite_score ?? 0));
    const top = scoredOpps.slice(0, TOP_N);

    // Get the next version number by querying the database
    const { data: existingVersions } = await this.supabase
      .from('watchlist_versions')
      .select('version_number')
      .order('version_number', { ascending: false })
      .limit(1);

    const firstRow = Array.isArray(existingVersions) ? existingVersions[0] : undefined;
    const lastVersionNumber =
      firstRow !== undefined && firstRow !== null
        ? (firstRow as { version_number: number }).version_number
        : 0;

    const nextVersionNumber = lastVersionNumber + 1;

    // Build snapshot items
    const snapshotItems: WatchlistVersionSnapshotItem[] = top.map(({ opp, score }, i) => ({
      id: opp.id,
      title: opp.title,
      score: score.composite_score ?? 0,
      rank: i + 1,
      target_market: opp.target_market ?? null,
      target_industry: opp.target_industry ?? null,
    }));

    // Compose the summary (LLM output + editorial notes)
    const summaryText = llmOutput
      ? `${llmOutput.summary}\n\nEditorial Notes: ${llmOutput.editorial_notes}`
      : `Watchlist version ${nextVersionNumber} — ${top.length} top opportunities ranked.`;

    // Step 1: Insert the watchlist_version
    const versionInsert: WatchlistVersionInsert = {
      version_number: nextVersionNumber,
      published_at: new Date().toISOString(),
      snapshot_data: snapshotItems,
      total_opportunities: opportunities.length,
      created_by: 'watchlist-publisher-agent',
    };

    const { data: insertedVersion, error: versionError } = await this.supabase
      .from('watchlist_versions')
      .insert(versionInsert)
      .select('id')
      .single();

    if (versionError !== null || insertedVersion === null) {
      throw new Error(
        `WatchlistPublisherAgent: Failed to insert watchlist_version: ${versionError?.message ?? 'no data returned'}`,
      );
    }

    const versionId = (insertedVersion as { id: string }).id;

    // Step 2: Update market_opportunities with ranked_at and store summary as metadata
    // We also log the editorial summary by updating the version record
    const { error: summaryError } = await this.supabase
      .from('watchlist_versions')
      .update({ created_by: `watchlist-publisher-agent | ${summaryText.slice(0, 500)}` })
      .eq('id', versionId);

    if (summaryError !== null) {
      // Non-fatal: log but don't throw
      console.warn('WatchlistPublisherAgent: Failed to store summary in version record', summaryError.message);
    }

    // Step 3: Mark each ranked opportunity with ranked_at timestamp
    const rankedAt = new Date().toISOString();
    const rankedIds = top.map(({ opp }) => opp.id);

    if (rankedIds.length > 0) {
      const { error: rankError } = await this.supabase
        .from('market_opportunities')
        .update({ ranked_at: rankedAt })
        .in('id', rankedIds);

      if (rankError !== null) {
        // Non-fatal: log but don't throw
        console.warn('WatchlistPublisherAgent: Failed to update ranked_at on opportunities', rankError.message);
      }
    }
  }
}
