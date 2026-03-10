import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { AgentInput, ContentItem, SignalInsert, SignalType, ImpactRating, SignalEntities } from '@company-builder/types';

interface SignalDetectorContext {
  contentItems: ContentItem[];
}

interface DetectedSignalRaw {
  content_item_id: string;
  signal_type: string;
  summary: string;
  confidence: number;
  impact_rating: string;
  entities: {
    companies: string[];
    technologies: string[];
    trends: string[];
  };
  reasoning: string;
}

interface SignalDetectorLLMResponse {
  signals: DetectedSignalRaw[];
}

const VALID_SIGNAL_TYPES = new Set<SignalType>([
  'tech_breakthrough',
  'regulatory_shift',
  'market_event',
  'customer_pain',
]);

const VALID_IMPACT_RATINGS = new Set<ImpactRating>(['low', 'medium', 'high', 'critical']);

export class SignalDetectorAgent extends Agent {
  protected getOutputTableName(): string {
    return 'signals';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const context = input.context as unknown as SignalDetectorContext;
    const { contentItems } = context;

    const systemPrompt = `You are the Signal Detector agent for the Company Builder platform's Phase 0 Discovery pipeline.

Your role is the pattern recognition engine that transforms normalized content items into actionable disruption signals. You analyze tech news, research papers, product announcements, regulatory filings, and market events to identify signals that indicate emerging opportunities for agent-first automation.

# Signal Types You Must Detect

You detect exactly four signal types mapped to the platform taxonomy:

## 1. tech_breakthrough
A significant advance in AI or adjacent technology that lowers the barrier to automation or enables entirely new capabilities.

Detection criteria:
- New AI capabilities with benchmark evidence (e.g., "reaches 98% accuracy on X")
- New model releases from known AI labs (OpenAI, Anthropic, Google DeepMind, Meta, Mistral, etc.)
- Open-source model releases that change the accessibility frontier
- Efficiency/cost breakthroughs (same capability at 10x lower cost)
- Multimodal capabilities (vision, audio, video) reaching production grade
- Agentic capabilities (tool use, multi-step reasoning, long-horizon tasks)

Examples:
- "GPT-4 Vision reaches 98% accuracy on medical imaging tasks"
- "Meta releases LLaMA 3 70B open-source, competitive with GPT-4"
- "New inference optimization cuts LLM hosting costs by 80%"

## 2. regulatory_shift
New government regulation, policy change, or deregulation that affects automation deployment, labor, AI governance, or data access.

Detection criteria:
- New laws or proposed legislation affecting AI/automation
- Regulatory relaxation that opens business models
- Compliance requirements creating new market needs
- Government mandates affecting specific industries
- Court rulings or executive orders affecting AI use

Examples:
- "EU AI Act classifies business automation as low-risk, enabling deployment"
- "SEC requires automated audit trails for AI-assisted financial decisions"
- "FDA approves AI-only diagnostic tools without physician review"

## 3. market_event
Major structural changes in market landscape: acquisitions, bankruptcies, pricing shifts, consolidation, market exits, or competitive repositioning that create openings for new entrants.

Detection criteria:
- Acquisition of an AI/automation player (market validation or incumbent defense)
- Bankruptcy/failure of an incumbent (market gap opening)
- Major pricing changes that disrupt existing relationships
- Market exits (players abandoning a space)
- Significant funding rounds indicating investor conviction
- Hiring surges indicating market motion or skill shortages

Examples:
- "Coupa acquired by private equity at $8B — signals incumbent fatigue"
- "Series A company raises $50M for AI-driven HR automation"
- "Major ERP vendor announces 200 layoffs in support division"

## 4. customer_pain
Evidence of customer dissatisfaction, inefficiency, manual workarounds, or unmet needs in a specific domain that an agent-first business could address.

Detection criteria:
- Explicit expressions of frustration with current tools/processes
- Evidence of manual workarounds that should be automated
- Job postings that describe high-volume repetitive work
- Industry surveys showing low satisfaction or high labor intensity
- Forum posts, reviews, or support threads describing pain

Examples:
- "Reddit accounting thread: 'I spend 20 hours/week on data entry'"
- "G2 review: 'Our invoice processing takes 5 days because everything is manual'"
- "Job posting: 300+ openings for 'data entry specialists' at Fortune 500"

# Detection Principles

## Conservative Scoring (Confidence 0.0 – 1.0)
- **0.90–1.00**: Definitive evidence from authoritative source (official announcement, regulatory text, primary research)
- **0.75–0.89**: Strong evidence from credible secondary source; clear implications
- **0.60–0.74**: Moderate evidence; requires interpretation; plausible alternative readings exist
- **< 0.60**: Do NOT report — too speculative; wait for corroboration

Only emit signals with confidence >= 0.65.

## Impact Rating
- **critical**: Market-moving event; affects multiple industries; irreversible change
- **high**: Significant signal; directly enables new automation; clear market impact
- **medium**: Noteworthy but narrower scope; one industry or use case
- **low**: Contextual signal; supporting evidence for a trend

## Entity Extraction
For each signal, extract:
- **companies**: AI labs, startups, enterprises, regulators directly involved
- **technologies**: Specific AI models, frameworks, capabilities enabling the opportunity
- **trends**: Macro trends this signal is part of (e.g., "multimodal AI", "agent adoption", "AI regulation")

## Critical Rule: One Signal Per Content Item Per Type
Do not emit multiple signals of the same type from the same content item. If one item has both a tech_breakthrough and a market_event, emit both — they are separate signals.

## Quality Over Quantity
It is better to emit 0 signals than to emit noise. If a content item contains no genuine signal (>= 0.65 confidence), emit nothing for it.

## Automation Lens
Always ask: "Does this signal indicate a market or workflow that AI agents could automate or disrupt?" If the answer is unclear, lower the confidence score accordingly.

Respond with ONLY valid JSON. Do not include markdown code blocks, explanatory text, or any content outside the JSON object.`;

    const itemDescriptions = contentItems.map((item) => {
      const metadata = item.metadata as Record<string, unknown> | null;
      const entities = metadata?.entities as Record<string, unknown> | null;
      const topics = Array.isArray(metadata?.preliminary_topics)
        ? (metadata.preliminary_topics as string[]).join(', ')
        : 'none';
      const sourceRank = typeof metadata?.source_rank === 'string' ? metadata.source_rank : 'unknown';

      return `---
Content Item ID: ${item.id}
Source: ${item.source_id} | Source Rank: ${sourceRank}
Published: ${item.published_at ?? 'unknown'}
Title: ${item.title}
Body: ${item.body ?? '(no body)'}
URL: ${item.url ?? 'N/A'}
Preliminary Topics: ${topics}
Entities Detected: ${entities ? JSON.stringify(entities) : 'none'}`;
    }).join('\n\n');

    const userMessage = `Analyze the following ${contentItems.length} content item(s) for disruption signals. For each signal you detect with confidence >= 0.65, emit a signal record.

CONTENT ITEMS:
${itemDescriptions}

Return a JSON object with this exact structure:
{
  "signals": [
    {
      "content_item_id": "<exact content item ID from above>",
      "signal_type": "tech_breakthrough|regulatory_shift|market_event|customer_pain",
      "summary": "<2-3 sentence explanation of the signal and why it matters for AI disruption>",
      "confidence": <0.65 to 1.0>,
      "impact_rating": "low|medium|high|critical",
      "entities": {
        "companies": ["company1", "company2"],
        "technologies": ["tech1", "tech2"],
        "trends": ["trend1", "trend2"]
      },
      "reasoning": "<1-2 sentences explaining the specific evidence from the content item>"
    }
  ]
}

If no signals meet the confidence threshold, return: {"signals": []}`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(response: Anthropic.Message): Promise<SignalInsert[]> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';

    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let parsed: SignalDetectorLLMResponse;
    try {
      parsed = JSON.parse(cleaned) as SignalDetectorLLMResponse;
    } catch {
      throw new Error(`SignalDetectorAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 200)}`);
    }

    if (!Array.isArray(parsed.signals)) {
      throw new Error('SignalDetectorAgent: LLM response missing "signals" array');
    }

    const now = new Date().toISOString();

    return parsed.signals
      .filter((s: DetectedSignalRaw) => {
        const typeOk = VALID_SIGNAL_TYPES.has(s.signal_type as SignalType);
        const confidenceOk = typeof s.confidence === 'number' && s.confidence >= 0.65;
        return typeOk && confidenceOk;
      })
      .map((s: DetectedSignalRaw): SignalInsert => {
        const impactRating: ImpactRating = VALID_IMPACT_RATINGS.has(s.impact_rating as ImpactRating)
          ? (s.impact_rating as ImpactRating)
          : 'medium';

        const entities: SignalEntities = {
          companies: Array.isArray(s.entities?.companies) ? s.entities.companies : [],
          technologies: Array.isArray(s.entities?.technologies) ? s.entities.technologies : [],
          trends: Array.isArray(s.entities?.trends) ? s.entities.trends : [],
        };

        return {
          content_item_id: s.content_item_id,
          signal_type: s.signal_type as SignalType,
          summary: s.summary,
          confidence: Math.min(1, Math.max(0, s.confidence)),
          detected_at: now,
          detected_by: 'signal-detector-agent',
          entities,
          impact_rating: impactRating,
          is_archived: false,
        };
      });
  }

  protected async persistOutput(output: unknown, _input: AgentInput): Promise<void> {
    const signals = output as SignalInsert[];

    if (signals.length === 0) {
      return;
    }

    const { error } = await this.supabase.from(this.getOutputTableName()).insert(signals);

    if (error !== null) {
      throw new Error(`SignalDetectorAgent: Failed to persist signals: ${error.message}`);
    }
  }
}
