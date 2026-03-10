import Anthropic from '@anthropic-ai/sdk';
import { Agent } from '@company-builder/core';
import type { AgentInput, Source, ContentItemInsert } from '@company-builder/types';

interface SourceScannerContext {
  sources: Source[];
}

interface ScannedContentItem {
  source_id: string;
  external_id: string;
  title: string;
  body: string;
  url: string;
  published_at: string;
  content_hash: string;
  metadata: {
    word_count: number;
    has_full_text: boolean;
    source_rank: 'high' | 'medium' | 'low';
    language: string;
    entities: {
      companies: Array<{ name: string; confidence: 'high' | 'medium' | 'low' }>;
      technologies: Array<{ name: string; confidence: 'high' | 'medium' | 'low' }>;
      people: Array<{ name: string; confidence: 'high' | 'medium' | 'low' }>;
      industries: Array<{ name: string; confidence: 'high' | 'medium' | 'low' }>;
    };
    preliminary_topics: string[];
    key_insight: string;
  };
  is_duplicate: boolean;
}

interface SourceScannerLLMResponse {
  items: ScannedContentItem[];
}

export class SourceScannerAgent extends Agent {
  protected getOutputTableName(): string {
    return 'content_items';
  }

  protected async buildPrompts(
    input: AgentInput,
  ): Promise<{ systemPrompt: string; userMessage: string }> {
    const context = input.context as unknown as SourceScannerContext;
    const { sources } = context;

    const systemPrompt = `You are the Source Scanner agent for the Company Builder platform's Phase 0 Discovery pipeline.

Your role is to simulate the scanning and normalization of content from technology, startup, and market intelligence sources. For each source provided, you generate realistic content items that could plausibly have been published by that source, representing the kind of content that would be most relevant for detecting AI disruption opportunities and agent-first business signals.

# Your Core Responsibilities

1. **Content Simulation**: Generate realistic content items for each active source based on its type, name, and configuration. Each item should represent real-world content that would come from that source (RSS articles, API results, research papers, product launches, etc.).

2. **Entity Extraction**: For each content item, extract key entities:
   - **Companies**: AI labs, startups, enterprises (e.g., OpenAI, Anthropic, Google, Coupa, SAP, etc.)
   - **Technologies**: Specific AI models, capabilities, frameworks (e.g., GPT-4, LLaMA, multimodal LLMs, agentic workflows)
   - **People**: Founders, researchers, executives (when genuinely mentioned)
   - **Industries**: Sectors impacted (e.g., accounting, legal tech, healthcare, HR)

3. **Topic Tagging**: Assign preliminary topic tags from this controlled vocabulary:
   - "AI Capability" — new model capability, benchmark advance, capability threshold crossed
   - "Model Release" — new LLM, multimodal, or specialized model announcement
   - "Regulatory Shift" — new law, deregulation, compliance rule affecting AI/automation
   - "Market Disruption" — acquisition, bankruptcy, pricing change, market exit, consolidation
   - "Hiring Pattern" — rapid hiring, layoffs, skill shortages in a domain
   - "Funding" — major capital raise, new investment in AI/automation sector
   - "Technology Breakthrough" — non-AI tech enabling new automation (e.g., new hardware)
   - "Customer Pain Signal" — evidence of user dissatisfaction, manual workarounds, unmet needs

4. **Source Credibility Scoring**:
   - **high**: arXiv papers, official AI lab announcements, major tech news outlets (TechCrunch, VentureBeat, WIRED), SEC filings
   - **medium**: industry blogs, startup press releases, Product Hunt launches
   - **low**: forums, social media, unverified blogs

5. **Content Focus**: Prioritize content that signals emerging opportunities for AI agents to replace or augment human workers. Look for:
   - New AI capabilities that make previously impossible automation practical
   - Markets with high volumes of repetitive, data-driven work
   - Industries where incumbents are slow to adopt AI
   - Customer pain points that agents could address

# Source Type Guidance

- **rss**: Generate news articles, blog posts, research summaries from the named outlet
- **api**: Generate structured data items from the API source (product launches, papers, filings)
- **webpage**: Generate content items from the monitored webpage
- **research_db**: Generate research paper summaries with arxiv-style metadata

# Quality Rules

- Each content item must have a unique external_id (use format: "{source_name_slug}_{timestamp_ms}_{sequence}")
- Generate a realistic content_hash (use format: sha256-like hex string, 64 chars)
- published_at should be within the last 7 days
- body should be 200-800 characters of realistic content
- Generate 3-8 content items per source, proportional to expected source volume
- Only generate items with genuine signal value for startup opportunity detection
- is_duplicate should be false for all generated items (dedup is a real-system concern)

# Key Insight

For each item, provide a one-sentence key_insight explaining why this content is relevant for detecting agent-first business opportunities.

Respond with ONLY valid JSON. Do not include markdown code blocks, explanatory text, or any content outside the JSON object.`;

    const sourceDescriptions = sources
      .map((s) => {
        const config = s.config ? JSON.stringify(s.config) : 'no additional config';
        return `- ID: ${s.id} | Name: "${s.name}" | Type: ${s.source_type} | URL: ${s.url ?? 'N/A'} | Config: ${config}`;
      })
      .join('\n');

    const userMessage = `Scan the following ${sources.length} active source(s) and generate realistic content items that represent what these sources would currently be publishing. Focus on content that signals emerging opportunities for AI agent disruption of traditional business workflows.

SOURCES TO SCAN:
${sourceDescriptions}

For each source, generate between 3 and 8 content items. Each item must be structured as a ContentItem.

Return a JSON object with this structure:
{
  "items": [
    {
      "source_id": "<exact source ID from the list above>",
      "external_id": "<unique ID for this item within the source>",
      "title": "<realistic article/paper/post title>",
      "body": "<200-800 chars of realistic content body>",
      "url": "<realistic canonical URL>",
      "published_at": "<ISO 8601 date within last 7 days>",
      "content_hash": "<64-char hex string>",
      "is_duplicate": false,
      "metadata": {
        "word_count": <number>,
        "has_full_text": <boolean>,
        "source_rank": "high|medium|low",
        "language": "en",
        "entities": {
          "companies": [{"name": "...", "confidence": "high|medium|low"}],
          "technologies": [{"name": "...", "confidence": "high|medium|low"}],
          "people": [{"name": "...", "confidence": "high|medium|low"}],
          "industries": [{"name": "...", "confidence": "high|medium|low"}]
        },
        "preliminary_topics": ["topic1", "topic2"],
        "key_insight": "One sentence explaining signal relevance for AI opportunity detection"
      }
    }
  ]
}`;

    return { systemPrompt, userMessage };
  }

  protected async parseResponse(response: Anthropic.Message): Promise<ContentItemInsert[]> {
    const block = response.content[0];
    const rawText = block?.type === 'text' ? block.text : '';

    // Strip markdown code fences if present despite instructions
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let parsed: SourceScannerLLMResponse;
    try {
      parsed = JSON.parse(cleaned) as SourceScannerLLMResponse;
    } catch {
      throw new Error(`SourceScannerAgent: Failed to parse LLM response as JSON. Raw: ${rawText.slice(0, 200)}`);
    }

    if (!Array.isArray(parsed.items)) {
      throw new Error('SourceScannerAgent: LLM response missing "items" array');
    }

    const now = new Date().toISOString();

    return parsed.items.map((item: ScannedContentItem): ContentItemInsert => ({
      source_id: item.source_id,
      external_id: item.external_id ?? null,
      title: item.title,
      body: item.body ?? null,
      url: item.url ?? null,
      published_at: item.published_at ?? null,
      ingested_at: now,
      content_hash: item.content_hash ?? null,
      metadata: item.metadata as Record<string, unknown>,
      is_duplicate: item.is_duplicate ?? false,
      is_archived: false,
    }));
  }

  protected async persistOutput(output: unknown, input: AgentInput): Promise<void> {
    const items = output as ContentItemInsert[];

    if (items.length === 0) {
      return;
    }

    const { error } = await this.supabase.from(this.getOutputTableName()).insert(items);

    if (error !== null) {
      throw new Error(`SourceScannerAgent: Failed to persist content items: ${error.message}`);
    }
  }
}
