# Source Scanner — Component Specification

## 1. Purpose & Responsibility

The Source Scanner is the ingestion pipeline for Phase 0 (Discovery). Its core responsibility is to continuously monitor and normalize content from a diverse range of external sources, making that content searchable and ready for downstream signal detection.

**Role in pipeline:** Acts as the first stage of the discovery funnel. It pulls raw data from the outside world, deduplicates it, extracts structured metadata, and populates the knowledge base that feeds the Signal Detector.

**What it owns:**
- Scheduling and execution of content pulls from configured sources
- Deduplication of content across sources
- Extraction of standardized metadata (date, source, topic, entities)
- Storage and indexing of normalized content
- Versioning and archival of content history
- Health monitoring of source connectors

---

## 2. Inputs

**Source:** Configured external APIs and feeds. The component reads from:

1. **News & Blog APIs:**
   - NewsAPI (news.org, techcrunch.com, venturebeat.com, wired.com, theverge.com, etc.)
   - Medium API (tech blogs, AI research blogs)
   - Dev.to API (developer-focused content)

2. **Research Paper Repositories:**
   - arXiv API (for papers tagged with AI, agents, automation, systems)
   - SSRN API (for financial/business research)
   - Papers with Code API (for AI model releases and benchmarks)

3. **Product/Launch Platforms:**
   - Product Hunt API (new products and their upvotes/comments)
   - Hacker News API (news aggregator for tech community)
   - AngelList API (startup funding announcements)

4. **Government & Regulatory:**
   - SEC Edgar API (regulatory filings, 10-Ks, 8-Ks)
   - USPTO API (patent filings)
   - Regulatory watchlist feeds (e.g., Federal Register RSS)

5. **AI Model Releases:**
   - Hugging Face Model Hub API (for new model releases)
   - OpenAI API announcements (GPT releases, capability changes)
   - Anthropic API announcements
   - Google DeepMind announcements feed

6. **Custom RSS Feeds:**
   - User-configurable RSS feeds from blogs, research groups, industry newsletters

**Data structure per source pull:**

```json
{
  "source_type": "newsapi|arxiv|producthunt|sec|huggingface|custom_rss",
  "source_name": "TechCrunch",
  "pulled_at": "2025-03-10T14:30:00Z",
  "items": [
    {
      "raw_id": "unique_id_from_source",
      "title": "string",
      "description": "string",
      "url": "full_url",
      "published_date": "ISO 8601",
      "author": "string or null",
      "source_metadata": {
        "site": "techcrunch.com",
        "category": "ai" // source-provided category
      },
      "content_snippet": "first 500 chars of article body if available"
    }
  ]
}
```

---

## 3. Outputs

**Destination:** Normalized content store (document database) and search index.

**Data structure — Normalized Content Item:**

```json
{
  "id": "normalized_item_uuid",
  "raw_source_id": "source:unique_id",
  "title": "string",
  "description": "string",
  "body_snippet": "first 1000 chars or full text if available",
  "url": "canonical_url",
  "source_type": "newsapi|arxiv|producthunt|patent|regulatory",
  "source_name": "TechCrunch",
  "published_date": "ISO 8601",
  "ingested_date": "ISO 8601",
  "authors": ["list of author names"],
  "entities": {
    "companies": ["OpenAI", "Anthropic", "Google"],
    "technologies": ["LLMs", "Agents", "Autonomous Systems"],
    "people": ["Sam Altman"],
    "industries": ["AI", "Software"]
  },
  "preliminary_topics": ["AI capability", "Model release", "Regulation"],
  "content_hash": "sha256_hash_for_deduplication",
  "is_duplicate": false,
  "duplicate_of": "id of original if duplicate",
  "ingestion_version": 1,
  "metadata": {
    "word_count": 850,
    "has_full_text": true,
    "source_rank": "high|medium|low",  // based on source credibility
    "language": "en"
  }
}
```

**Example outputs:**
- 500-2000 normalized items per day (depending on source volume)
- All items indexed by title, entities, date, source_type for fast search
- Deduplication ensures the same news story pulled from multiple sources is stored once with cross-references

---

## 4. Core Logic / Algorithm

### 4.1 Initialization & Configuration

1. Load configured sources from a configuration store (database table or config file):
   ```
   - NewsAPI (api_key, topics to track: ["AI", "agents", "automation"])
   - arXiv (categories: ["cs.AI", "cs.LG", "q-fin.ST"])
   - Product Hunt (api_key)
   - SEC Edgar (enabled, categories: ["technology", "software"])
   - HuggingFace Model Hub (RSS feed URL)
   - Custom RSS feeds (list of URLs)
   ```

2. Initialize database connection, search index (Elasticsearch or similar), and logging.

### 4.2 Continuous Polling Loop

Run on a schedule (e.g., every 6 hours for high-frequency sources like HN, every 24 hours for arXiv/patents):

```
FOR EACH configured_source:
  1. Fetch new items since last successful poll
     - Use source API pagination
     - Respect rate limits
     - Extract published_date to determine "new"

  2. Normalize each item
     - Extract title, description, URL, author, date
     - Attempt to fetch full text (for blogs, articles)
     - Generate content_hash from normalized content

  3. Deduplicate
     - Check content_hash against existing items
     - If hash exists, mark as duplicate, record original ID, skip storage
     - If similar title and URL, also mark as duplicate

  4. Extract entities
     - Use NER (named entity recognition) to extract companies, technologies, people
     - Match against known entity database (optional: Wikidata API)
     - Tag detected entities

  5. Tag preliminary topics
     - Use keyword matching and/or lightweight classification
     - Preliminary topics: "AI capability", "Model release", "Regulation", "Acquisition", "Bankruptcy", "Pricing change", "Hiring pattern"

  6. Score source credibility
     - Assign rank (high/medium/low) based on source type
     - NewsAPI sources from reputable outlets = high
     - ArXiv papers = high
     - Reddit discussions = low

  7. Store normalized item
     - Insert into document database
     - Index in search engine
     - Log ingestion event

  8. Handle failures
     - Timeout: Log, move to next source, retry later
     - Auth error: Alert human, disable source
     - Malformed response: Log, skip item, continue

END FOR

Update last_poll_timestamp for each source
Log daily ingestion stats (items pulled, deduplicated, stored)
```

### 4.3 Entity Extraction

For company/tech/people extraction, use a combination of:

1. **Rule-based matching:** Known lists of AI companies, model names, technologies
   - Companies: OpenAI, Anthropic, Google, Meta, etc.
   - Technologies: LLMs, transformers, agents, reinforcement learning, etc.

2. **NER model:** A lightweight transformer model (e.g., distilBERT + token classification) trained or fine-tuned on domain vocabulary to extract:
   - `PER`: Person names
   - `ORG`: Organization names
   - `TECH`: Technology/methodology names

3. **Linking:** Optional entity linking to a knowledge base (Wikidata, company database) to normalize variations (e.g., "Openai" → "OpenAI").

### 4.4 Deduplication Strategy

1. **Content hash:** SHA-256 hash of (title + description + source_name)
2. **Similarity check:** If a new item has >90% title similarity (using Levenshtein or TF-IDF) to an existing item from a different source, mark it as a duplicate cross-reference.
3. **URL normalization:** Normalize URLs (remove tracking params, scheme/www variations) and check for duplicates.

---

## 5. Data Sources & Integrations

| Source | API/Method | Frequency | Cost | Authentication |
|--------|-----------|-----------|------|-----------------|
| NewsAPI | REST API (news.org) | 6 hours | ~$500/month for business plan | API key |
| arXiv | OAI-PMH API | 24 hours | Free | None |
| Medium | REST API + RSS | 24 hours | Free (RSS) / $ (API) | OAuth |
| Product Hunt | GraphQL API | 6 hours | Free | API token |
| Hacker News | HN API (JSON) | 1 hour | Free | None |
| SEC Edgar | REST API | 24 hours | Free | None |
| USPTO | REST API + bulk data | 24 hours | Free | None |
| Hugging Face | REST API + RSS | 6 hours | Free | None |
| Custom RSS | RSS polling | 12 hours | Varies | Varies |

**Fallback strategy:** If a primary API fails, fall back to RSS feed or manual data source. If all fail for >24 hours, alert human operator.

---

## 6. Agent Prompt Strategy

The Source Scanner is primarily a scheduled service, but uses agent reasoning for:

- **Entity extraction:** Lightweight reasoning to identify domain-relevant entities
- **Topic tagging:** Classify preliminary topics
- **Deduplication:** Reasoning about similarity

**System Prompt for Entity/Topic Agent** (runs on a sample of items or high-priority sources):

```
You are a domain expert analyzing technology and business news for startup opportunity signals.

For each article snippet provided:

1. Extract key entities:
   - Companies mentioned (focus on AI/tech/automation companies)
   - Specific AI technologies, models, or capabilities
   - People (founders, researchers, executives)
   - Industries affected

2. Assign preliminary topic tags from this set:
   - AI Capability (new model, capability breakthrough, benchmark advance)
   - Model Release (new LLM, open-source model, commercial model)
   - Regulatory Shift (new law, deregulation, compliance rule)
   - Market Disruption (acquisition, bankruptcy, pricing shift, consolidation)
   - Hiring Pattern (company expanding fast, massive hiring in an area, layoffs)
   - Funding (major capital raise, new investment in a sector)
   - Technology Breakthrough (non-AI technology that enables automation)
   - Customer Pain Signal (evidence of dissatisfaction, workaround, manual process)

3. Confidence: Rate your entity extraction confidence (high/medium/low)

Output JSON:
{
  "entities": {
    "companies": [{"name": "...", "confidence": "high|medium|low"}],
    "technologies": [{"name": "...", "confidence": "..."}],
    "people": [{"name": "...", "confidence": "..."}],
    "industries": [{"name": "...", "confidence": "..."}]
  },
  "topics": ["topic1", "topic2"],
  "key_insight": "one-sentence summary of why this is relevant for startup opportunity detection"
}
```

For high-frequency sources, this agent runs asynchronously on samples (e.g., 20% of incoming items) to improve tagging quality.

---

## 7. Error Handling & Edge Cases

| Scenario | Handling |
|----------|----------|
| **API rate limit hit** | Exponential backoff; use cached data until rate limit window resets |
| **API returns invalid JSON** | Log error with source and timestamp; skip item; continue |
| **Authentication failure** | Disable source, alert operator, log error |
| **Duplicate content (high volume)** | Log dedup rate; if >80% of a source is duplicates, investigate source quality |
| **Article text extraction fails** | Store title + snippet; flag as incomplete for operator review |
| **Null/empty fields** | Allow nulls in optional fields (author, body); reject items with null title or URL |
| **Non-English content** | Detect language; optionally skip or translate (expansion point) |
| **Paywall/access issues** | Store metadata, attempt snippet extraction; flag as incomplete |
| **Entity extraction fails** | Use NER fallback; fallback to keyword matching; graceful degradation |
| **Database write error** | Retry with exponential backoff; if persistent, alert operator |
| **Stale source (no updates in 7 days)** | Log warning; continue polling; alert after 30 days of silence |

---

## 8. Performance & Scaling

**Expected throughput:**
- ~500–1000 items ingested per day (across all sources)
- Peak ingestion during market hours, AI release announcements

**Latency requirements:**
- New content should be queryable within 5 minutes of ingestion
- Deduplication should complete within 2 minutes
- Entity extraction should complete within 10 seconds per item

**Scaling strategy:**

1. **Horizontal:** Run multiple Source Scanner instances on different sources to avoid blocking.
2. **Caching:** Cache API responses to reduce redundant calls during the same poll cycle.
3. **Batch processing:** Dedupe and entity extraction can run asynchronously in batches.
4. **Indexing:** Use Elasticsearch or similar for sub-second search on millions of items.
5. **Retention policy:** Archive items older than 12 months to keep active index manageable.

**Storage estimate:**
- ~50 KB per normalized item (metadata + snippet)
- 500 items/day × 365 days = 182,500 items/year
- ~9 GB/year at 50 KB/item
- Acceptable for most databases

---

## 9. Dependencies

**Depends on:**
- Configuration service (for source URLs, API keys, polling schedule)
- Database/document store (for storing normalized items)
- Search index (for fast retrieval by topic, entity, date)
- NER model (for entity extraction)

**Depended on by:**
- Signal Detector (0.2) — consumes normalized content stream
- Market Classifier (0.3) — may query for source links
- Watchlist Publisher (0.5) — traces opportunities back to original sources

---

## 10. Success Metrics

1. **Ingestion freshness:** Median time from content publication to storage < 6 hours
2. **Deduplication rate:** 10–30% of pulled items identified as duplicates (expected range)
3. **Entity extraction quality:** >90% of detected companies are true positives (manual sampling audit)
4. **Topic tagging accuracy:** >85% agreement with human review on sample (quarterly audit)
5. **Availability:** Source scanner available 99% of the time (no unplanned downtime)
6. **Error rate:** <1% of ingestion attempts result in failures that aren't retried successfully
7. **API health:** Maintain connectivity to 95%+ of configured sources at any time
8. **User feedback:** Downstream phases (Signal Detector, Market Classifier) report high-quality content, no frequent "no signals in feed" complaints

---

## 11. Implementation Notes

### Suggested Tech Stack

**Language:** Python 3.11+
- Rich ecosystem of data processing, NER, and API libraries

**Core libraries:**
- `requests` or `httpx` — HTTP client for APIs
- `feedparser` — RSS feed parsing
- `newspaper3k` or `trafilatura` — Article text extraction
- `hashlib` — Content hashing
- `spacy` + `transformers` — NER and entity extraction
- `elasticsearch-py` — Elasticsearch client
- `sqlalchemy` — Database ORM (if using SQL) or `pymongo` (if using MongoDB)
- `pydantic` — Data validation and schema definition

**Infrastructure:**
- **Database:** PostgreSQL (with JSONB for flexible metadata) or MongoDB
- **Search:** Elasticsearch 8.x+
- **Task scheduling:** APScheduler or Celery (if distributed)
- **Monitoring:** Prometheus + Grafana for ingestion metrics
- **Logging:** ELK Stack (Elasticsearch, Logstash, Kibana) or CloudWatch

### Code Structure

```
source-scanner/
├── config/
│   ├── sources.yaml          # configured sources, frequencies
│   └── entity_lists.json     # known companies, techs, people
├── connectors/
│   ├── base.py               # abstract connector class
│   ├── newsapi.py            # NewsAPI implementation
│   ├── arxiv.py              # arXiv connector
│   ├── producthunt.py        # Product Hunt connector
│   ├── sec.py                # SEC Edgar connector
│   └── rss.py                # Generic RSS connector
├── processors/
│   ├── normalizer.py         # Item normalization
│   ├── deduplicator.py       # Content deduplication
│   ├── entity_extractor.py   # NER + entity linking
│   └── topic_tagger.py       # Preliminary topic classification
├── storage/
│   ├── db.py                 # Database interface
│   └── search_index.py       # Search index interface
├── scheduler.py              # Main polling loop
├── main.py                   # Entry point
└── tests/
    ├── test_connectors.py
    ├── test_normalizer.py
    └── test_deduplicator.py
```

### Key Implementation Details

**1. Connector abstraction:**

```python
class Connector(ABC):
    @abstractmethod
    async def fetch(self, since: datetime) -> List[RawItem]:
        """Fetch items from source since timestamp"""
        pass

    @abstractmethod
    def rate_limit_wait(self) -> float:
        """Return seconds to wait before next request"""
        pass
```

**2. Normalization:**

```python
def normalize_item(raw_item: RawItem, source_type: str) -> NormalizedItem:
    content_hash = hashlib.sha256(
        f"{raw_item.title}{raw_item.description}{source_type}".encode()
    ).hexdigest()
    return NormalizedItem(
        raw_source_id=f"{source_type}:{raw_item.id}",
        title=raw_item.title,
        url=normalize_url(raw_item.url),
        published_date=parse_date(raw_item.date),
        ingested_date=datetime.utcnow(),
        content_hash=content_hash,
        # ... other fields
    )
```

**3. Deduplication query:**

```sql
SELECT id FROM normalized_items
WHERE content_hash = %s
LIMIT 1
```

**4. Entity extraction:**

```python
from spacy import load as spacy_load
from transformers import pipeline

nlp = spacy_load("en_core_web_sm")
ner = pipeline("ner", model="dslim/bert-base-uncased-ner")

def extract_entities(text: str) -> Dict[str, List[str]]:
    doc = nlp(text)
    spacy_ents = {ent.label_: [e.text for e in doc.ents if e.label_ == ent.label_]
                  for ent in set([e.label_ for e in doc.ents])}
    # Cross-check against known lists, augment with transformer NER if needed
    return spacy_ents
```

### Deployment Considerations

1. **API keys:** Store in environment variables or secrets manager (AWS Secrets Manager, HashiCorp Vault)
2. **Rate limiting:** Use token bucket or sliding window to avoid hitting API limits
3. **Logging:** Log every API call, deduplication decision, and error for debugging
4. **Alerting:** Set up alerts for:
   - Source connectivity failures
   - Spike in error rate
   - Low freshness (items older than expected)
5. **Testing:** Mock all external APIs for unit tests; use fixtures for integration tests

---

## Appendix: Example Normalized Item

```json
{
  "id": "norm_550e8400-e29b-41d4-a716-446655440000",
  "raw_source_id": "newsapi:techcrunch_article_12345",
  "title": "OpenAI releases GPT-4 Turbo with 128K context window",
  "description": "OpenAI announces GPT-4 Turbo, expanding context from 8K to 128K tokens",
  "body_snippet": "OpenAI has released GPT-4 Turbo, a new version of its flagship language model... The model can now process up to 128K tokens in context, allowing...",
  "url": "https://techcrunch.com/2024/11/openai-gpt4-turbo",
  "source_type": "newsapi",
  "source_name": "TechCrunch",
  "published_date": "2024-11-06T15:30:00Z",
  "ingested_date": "2024-11-06T16:45:23Z",
  "authors": ["Kyle Wiggers"],
  "entities": {
    "companies": [
      {"name": "OpenAI", "confidence": "high"},
      {"name": "Anthropic", "confidence": "medium"}
    ],
    "technologies": [
      {"name": "GPT-4", "confidence": "high"},
      {"name": "LLM", "confidence": "high"},
      {"name": "Transformer", "confidence": "medium"}
    ],
    "people": [{"name": "Sam Altman", "confidence": "low"}],
    "industries": ["AI", "Software", "Enterprise Software"]
  },
  "preliminary_topics": ["Model Release", "AI Capability"],
  "content_hash": "a1b2c3d4e5f6...",
  "is_duplicate": false,
  "duplicate_of": null,
  "ingestion_version": 1,
  "metadata": {
    "word_count": 1250,
    "has_full_text": true,
    "source_rank": "high",
    "language": "en"
  }
}
```
