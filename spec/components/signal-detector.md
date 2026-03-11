# Signal Detector — Component Specification

## 1. Purpose & Responsibility

The Signal Detector is the pattern recognition engine of Phase 0. Its core responsibility is to analyze the normalized content stream from the Source Scanner and identify meaningful signals—events, trends, breakthroughs, and shifts—that indicate emerging opportunities for agent-first disruption.

**Role in pipeline:** Acts as the second stage of the discovery funnel. It transforms raw content into actionable signals by applying domain-specific pattern recognition and reasoning. Weak or noise signals are filtered out; meaningful signals are tagged and passed downstream to the Market Classifier.

**What it owns:**
- Signal pattern definition and maintenance (what constitutes each signal type)
- Continuous analysis of content for signal presence
- Signal classification, scoring, and deduplication
- Detection of signal clusters (multiple reinforcing signals on the same topic)
- Signal archival and historical tracking (for trend analysis)

---

## 2. Inputs

**Source:** Normalized content items from Source Scanner (0.1).

**Consumption pattern:** The Signal Detector operates in one of two modes:
1. **Streaming:** Consumes items as they arrive (near-real-time)
2. **Batch:** Processes accumulated items daily or weekly

**Input data structure:**

```json
{
  "id": "norm_uuid",
  "title": "string",
  "description": "string",
  "body_snippet": "string",
  "url": "string",
  "source_type": "newsapi|arxiv|producthunt|patent|regulatory",
  "source_name": "string",
  "published_date": "ISO 8601",
  "entities": {
    "companies": [{"name": "string", "confidence": "high|medium|low"}],
    "technologies": [{"name": "string", "confidence": "..."}],
    "people": [{"name": "string", "confidence": "..."}],
    "industries": [{"name": "string", "confidence": "..."}]
  },
  "preliminary_topics": ["topic1", "topic2"],
  "metadata": {
    "word_count": "number",
    "source_rank": "high|medium|low",
    "language": "en"
  }
}
```

---

## 3. Outputs

**Destination:** Signal store (document database) and signal index.

**Data structure — Detected Signal:**

```json
{
  "id": "signal_uuid",
  "signal_type": "tech_breakthrough|model_release|regulatory_shift|market_disruption|hiring_pattern|funding_surge|customer_pain",
  "title": "string (3-5 words summary)",
  "description": "string (2-3 sentence explanation)",
  "detected_at": "ISO 8601",
  "confidence": 0.95,  // 0.0 to 1.0, strength of evidence
  "severity": "critical|high|medium|low",
  "time_sensitivity": "urgent|normal|low",  // how quickly does the market move
  "source_items": [
    {
      "item_id": "norm_uuid",
      "relevance_score": 0.9,
      "excerpt": "quoted snippet from item"
    }
  ],
  "key_entities": {
    "companies": ["OpenAI", "Anthropic"],
    "technologies": ["LLMs", "Agentic Workflows"],
    "industries": ["Software", "Enterprise"]
  },
  "related_signals": ["signal_id_1", "signal_id_2"],  // clusters
  "signal_cluster_id": "cluster_uuid",  // groups related signals
  "trend_direction": "emerging|accelerating|plateauing|declining",
  "actionability": "directly_applicable|contextual|informational",
  "automation_impact": "high|medium|low",  // how much automation potential
  "notes": "analyst notes or caveats",
  "metadata": {
    "detection_method": "pattern_match|llm_reasoning|rule_based",
    "requires_review": false,
    "version": 1
  }
}
```

**Example outputs (one per 2–5 content items):**
- 20–50 signals detected per week
- Signals range from high-confidence pattern matches to LLM-reasoned insights
- Signals tagged with which source items support them

---

## 4. Core Logic / Algorithm

### 4.1 Signal Types & Detection Patterns

#### **A. Tech Breakthrough**

**Definition:** A significant advance in AI or adjacent technology that lowers the barrier to automation or enables new capabilities.

**Detection patterns:**
- Keywords: "breakthrough", "first time", "new capability", "SOTA", "state-of-the-art", "significant improvement"
- Entities: Known AI labs (OpenAI, DeepMind, Anthropic, Meta, etc.) announcing new results
- Source type: arXiv papers with high citation potential, model release announcements, tech blogs
- Signal confidence: High if from high-rank sources; lower if from speculative blogs
- Specific examples:
  - "GPT-4 reaches 90% accuracy on Bar exam" (capability threshold crossed)
  - "New multimodal model processes video with 10x faster inference" (efficiency breakthrough)
  - "Open-source LLM reaches competitive performance at 1/10th the cost" (accessibility breakthrough)

**Detection logic:**

```
IF (title OR body) CONTAINS (high_confidence_keywords) AND
   (source_rank == "high" OR source_type == "arxiv") AND
   (entity.type == "ai_lab" OR entity.type == "ai_company") AND
   (preliminary_topic == "AI Capability" OR "Model Release")
THEN
  confidence = base_confidence * source_credibility * keyword_strength
  IF confidence > 0.7 THEN emit signal
```

#### **B. Model Release**

**Definition:** Announcement of a new AI model (closed-source, open-source, or commercial) with specified capabilities or benchmarks.

**Detection patterns:**
- Keywords: "release", "launch", "available now", "open-source", "available on HuggingFace"
- Entities: OpenAI, Anthropic, Meta, Google, HuggingFace, etc.
- Source type: Official announcements, product launches, arXiv
- Artifact: Model name, size, benchmark scores
- Signal confidence: Very high if official announcement; medium if third-party report

**Detection logic:**

```
IF preliminary_topic CONTAINS "Model Release" AND
   (source_type == "official_blog" OR entity MATCHES known_ai_labs) AND
   (body CONTAINS model_name_pattern OR "model" + number_of_parameters)
THEN
  confidence = 0.95 if official, 0.70 if third-party
  EXTRACT model_details (name, size, release_date, access_level)
  EMIT signal with details
```

#### **C. Regulatory Shift**

**Definition:** New government regulation, policy change, or deregulation that affects automation, labor, AI deployment, or data access.

**Detection patterns:**
- Keywords: "regulation", "law", "bill", "legislation", "deregulation", "compliance", "ban", "restrict"
- Entities: Government agencies (FDA, SEC, FTC, EU parliament, etc.), countries
- Source type: SEC Edgar, regulatory watchlist, news
- Artifacts: Bill number, effective date, scope
- Signal confidence: High for official government sources; medium for news interpretation

**Detection logic:**

```
IF source_type == "regulatory" OR source_name CONTAINS ("SEC", "Patent", "Register") THEN
  confidence = 0.95 (official source)
ELSE IF (body CONTAINS regulatory_keywords) AND (source_rank == "high") THEN
  confidence = 0.75
ELSE IF (body CONTAINS regulatory_keywords) THEN
  confidence = 0.50

IF confidence > threshold THEN
  EXTRACT scope (geographic, industry, technology, timeline)
  DETERMINE impact (favorable_for_automation | restrictive | neutral)
  EMIT signal
```

#### **D. Market Disruption**

**Definition:** Major shifts in market structure: acquisitions, bankruptcies, pricing changes, consolidation, market exits, or competitive repositioning.

**Detection patterns:**
- Keywords: "acquired", "bankruptcy", "merger", "pricing change", "exit", "acquisition", "valuation"
- Entities: Public companies, startups, specific sectors
- Source type: News, SEC filings, TechCrunch, VentureBeat
- Artifacts: Deal size, companies involved, valuation
- Signal confidence: High if from official sources or major news; medium otherwise

**Detection logic:**

```
IF (body CONTAINS disruption_keywords) AND
   (entity.type == "company" OR "startup") AND
   (source_rank == "high" OR source_type == "news_api")
THEN
  disruption_type = classify(body: "acquisition|bankruptcy|pricing|exit|consolidation")
  confidence = source_credibility * keyword_strength
  IF confidence > 0.65 THEN
    EXTRACT involved_parties, deal_value, market_impact
    EMIT signal with type and impact
```

#### **E. Hiring Pattern**

**Definition:** Evidence of rapid hiring, layoffs, or skill-shortage hiring in a specific domain, indicating market motion or labor bottleneck.

**Detection patterns:**
- Keywords: "hiring spree", "hiring freeze", "laying off", "recruiting", "skill shortage", "talent gap", "job postings surge"
- Entities: Companies, job categories (data scientists, ML engineers, customer service, etc.)
- Source type: News, LinkedIn trends, job board data, company announcements
- Artifacts: Company, roles, volume, timeframe
- Signal confidence: Medium (hiring is noisy; requires verification)

**Detection logic:**

```
IF (body CONTAINS hiring_keywords) AND
   (preliminary_topic == "Hiring Pattern") AND
   (source_rank == "medium" OR "high")
THEN
  EXTRACT company, roles, volume_indicator ("spree", "massive", "aggressive" → HIGH; "hiring" → MEDIUM)
  confidence = source_credibility * volume_indicator_strength
  IF confidence > 0.60 THEN
    EMIT signal (lower confidence, flagged for human review)
```

#### **F. Funding Surge**

**Definition:** Significant capital influx into a sector, company, or technology, indicating investor confidence and market acceleration.

**Detection patterns:**
- Keywords: "funding", "raised", "investment", "Series", "IPO", "venture capital", "billion-dollar", "unicorn"
- Entities: Startups, sectors, investors
- Source type: AngelList, news, press releases
- Artifacts: Amount, company, round, sector
- Signal confidence: High if amount is specified; medium otherwise

**Detection logic:**

```
IF (body CONTAINS funding_keywords) AND
   (entity.type == "startup" OR "sector") AND
   (source_type == "venture_news" OR source_rank == "high")
THEN
  EXTRACT amount, company_or_sector, round_type
  confidence = 0.85 if amount_specified, 0.60 otherwise
  IF confidence > 0.65 THEN
    EMIT signal with funding details and sector analysis
```

#### **G. Customer Pain Signal**

**Definition:** Evidence of customer dissatisfaction, manual workarounds, or unmet needs in a specific domain, indicating readiness for disruption.

**Detection patterns:**
- Keywords: "frustration", "inefficient", "manual", "workaround", "complaint", "gap", "challenge", "struggle", "pain", "need", "wish", "instead of"
- Source type: Reddit, forums, product reviews (G2, Trustpilot, Capterra), social media, support forums
- Sentiment: Negative or frustrated
- Artifacts: Specific problem description, affected role/company type
- Signal confidence: Medium (requires aggregation; single complaint is noise)

**Detection logic:**

```
IF source_type IN ["reddit", "forum", "review_site", "twitter"] AND
   (body CONTAINS pain_keywords) AND
   (sentiment == "negative" OR "frustrated")
THEN
  confidence = 0.55  // lower baseline, requires clustering
  problem_description = extract_pain_description(body)
  affected_role_or_domain = extract_context(body)
  STORE for clustering

AFTER_BATCH: CLUSTER pain_signals_by_problem
FOR EACH cluster:
  IF cluster_size > threshold AND consistent_across_sources THEN
    confidence = 0.70  // elevated by corroboration
    EMIT aggregated_signal with problem description and evidence count
```

### 4.2 Signal Detection Pipeline

```python
for each normalized_item in stream:
    # Phase 1: Rule-based detection (fast)
    signals_rule_based = detect_signals_rule_based(item)

    # Phase 2: LLM-based reasoning (slower, applied selectively)
    if item.source_rank == "high" or item.word_count > 500:
        signals_llm = detect_signals_llm_reasoning(item)
    else:
        signals_llm = []

    # Phase 3: Combine, deduplicate, score
    all_signals = signals_rule_based + signals_llm

    for signal in all_signals:
        # Check if similar signal already exists
        existing = query_signals_by_topic_and_type(
            signal.signal_type,
            signal.key_entities,
            published_since = now - 7 days
        )

        if existing:
            # Link to existing signal cluster
            signal.signal_cluster_id = existing.signal_cluster_id
            signal.related_signals = [existing.id]
            APPEND signal to cluster (update cluster confidence)
        else:
            # New signal
            signal.signal_cluster_id = new_uuid()
            STORE signal
            EMIT to downstream (Market Classifier)

    # Phase 4: Cluster analysis (daily batch)
    CLUSTER_SIGNALS_BY_TOPIC_AND_ENTITIES()
```

### 4.3 Signal Clustering

Signals are grouped by topic and key entities to identify converging signals (multiple pieces of evidence pointing to the same opportunity):

```python
def cluster_signals():
    """Group signals by (signal_type, key_companies, key_industries)"""

    # Build a similarity graph
    signals = fetch_recent_signals(days=30)

    for i, signal1 in enumerate(signals):
        for signal2 in signals[i+1:]:
            similarity = compare_signals(signal1, signal2):
                # Companies overlap > 50%?
                # Industries overlap > 50%?
                # Same signal_type?
                # Technologies overlap > 70%?

            if similarity > 0.60:
                MERGE signals into same cluster
                BOOST cluster confidence

    # Update signal_cluster_id for all signals in cluster
    # Increase trend_direction if cluster growing
```

### 4.4 LLM Reasoning (Optional, for high-value items)

For high-rank sources or longer content, invoke an LLM agent to reason about signals:

**System prompt:**

```
You are a business analyst specializing in AI disruption opportunities.
Analyze this article/research paper for signals that indicate emerging
opportunities for automation or agent-first businesses.

Look for:
1. New AI capabilities that make previously impossible automation possible
2. Regulatory or policy changes that create new business opportunities
3. Market disruptions (acquisitions, bankruptcies) that indicate weakness
4. Evidence of customer pain, frustration, or manual workarounds
5. Hiring surges indicating scaling or skill shortages
6. Technology breakthroughs that lower automation barriers

For each signal you identify:
- Signal type (tech_breakthrough, model_release, regulatory_shift, etc.)
- Title (3-5 words)
- Description (2-3 sentences explaining why this matters)
- Confidence (0.0–1.0)
- Affected industries
- Automation potential (high/medium/low)

Be conservative: only report signals with >0.65 confidence.
```

**Invocation:**

```python
if high_priority_item:
    prompt = f"""
    {system_prompt}

    Article title: {item.title}
    Content: {item.body_snippet}
    Source: {item.source_name}

    Identify signals.
    """

    response = llm_client.call_structured(
        model="gpt-4",
        prompt=prompt,
        output_schema=SignalListSchema
    )

    for signal_dict in response.signals:
        signal = Signal(**signal_dict, detection_method="llm_reasoning")
        STORE signal
```

---

## 5. Data Sources & Integrations

**Direct dependencies:**
- Source Scanner (0.1) — normalized content stream

**Optional integrations for enrichment:**
- NewsAPI sentiment analysis (for customer pain detection)
- Trend data APIs (Google Trends, SEMrush) — for keyword volume spikes
- Company data APIs (Crunchbase, PitchBook) — for funding validation
- Patent databases — for tech breakthrough confirmation

**No new external API calls required** if Source Scanner has already ingested content. Signal Detector purely analyzes stored content.

---

## 6. Agent Prompt Strategy

Signal Detector uses agent reasoning selectively on high-value content.

### 6.1 System Prompt for Signal Detection Agent

```
You are an AI business analyst trained to identify market signals that indicate
emerging opportunities for agent-first automation.

Your job: Analyze written content (news articles, research papers, announcements)
and identify signals—events, trends, technology breakthroughs, regulatory shifts,
or market disruptions—that indicate a market or industry is becoming ripe for
disruption by AI agents.

# Signal Types (you should know these cold)

1. **Tech Breakthrough** — A new AI capability, model, or technology that makes
   previously impossible or very expensive automation now practical.
   Example: "New vision model reaches 99.5% accuracy on medical imaging"

2. **Model Release** — A new AI model (LLM, multimodal, specialized) becomes available
   and changes the competitive landscape or capability frontier.
   Example: "Meta releases LLaMA 3 with 70B parameters, open-source"

3. **Regulatory Shift** — A new law, regulation, or policy change that enables or
   restricts automation, affects labor availability, or opens new business models.
   Example: "EU passes AI Act, relaxing rules for low-risk enterprise automation"

4. **Market Disruption** — Major market structural changes: acquisition, bankruptcy,
   pricing war, market exit. Signals weakness in incumbents and potential opening.
   Example: "Competitor goes bankrupt after failing to adapt to AI-driven pricing"

5. **Hiring Pattern** — Evidence of rapid hiring, hiring freezes, or skill shortages
   in a domain. Indicates bottleneck, market motion, or company scaling.
   Example: "Company posts 50 job openings for customer service (agents could displace this)"

6. **Funding Surge** — Major capital flowing into a sector or company, indicating
   investor confidence and accelerating competition.
   Example: "AI legal tech companies raise $2B in 2024 (market heating up)"

7. **Customer Pain Signal** — Evidence of customer dissatisfaction, inefficiency,
   manual workarounds, or unmet need that an agent-first business could address.
   Example: "Reddit: 'I spend 20 hours/week doing data entry. Can't this be automated?'"

# Instructions

1. **Read the content carefully.** Understand the key facts and implications.

2. **Check for each signal type.** Does this content mention or imply any of the
   seven signal types above? Be systematic.

3. **Assess confidence.** How sure are you?
   - 0.90+: Definitive evidence; explicit statement; from authoritative source
   - 0.75–0.89: Strong evidence; from credible source; clear implications
   - 0.60–0.74: Moderate evidence; requires some interpretation; possible alternative readings
   - <0.60: Weak evidence; speculative; report only if corroborated elsewhere

4. **For each signal, provide:**
   - signal_type (one of the seven)
   - title: 3–5 word summary
   - description: 2–3 sentence explanation (why does this matter?)
   - confidence: numeric 0.0–1.0
   - severity: "critical" (market-moving), "high", "medium", "low"
   - affected_industries: which sectors are impacted?
   - automation_potential: "high" (agents can directly replace), "medium", "low"
   - time_sensitivity: "urgent" (window closing), "normal", "low"

5. **Be conservative.** Only report signals with confidence > 0.65. Don't speculate
   wildly. If you're unsure, lower the confidence or don't report it.

6. **Extract specifics:** Company names, technologies, numbers, timelines, geography.

7. **Consider follow-up questions:**
   - Why is this significant right now and not 5 years ago?
   - What automation was impossible before that's possible now?
   - Which industries or job categories does this disrupt?
   - Is this a trend or a one-off?

# Output Format

Return a JSON object:

{
  "signals": [
    {
      "signal_type": "tech_breakthrough",
      "title": "GPT-4 Vision multimodal breakthrough",
      "description": "GPT-4 Vision enables multimodal AI agents to process images, documents, and text. This expands automation to visual document processing, quality assurance, and design review tasks that were previously manual.",
      "confidence": 0.92,
      "severity": "high",
      "time_sensitivity": "normal",
      "affected_industries": ["professional services", "manufacturing", "finance"],
      "automation_potential": "high",
      "key_entities": {
        "companies": ["OpenAI"],
        "technologies": ["multimodal LLMs", "vision transformers"],
        "industries": ["enterprise software", "automation"]
      },
      "actionability": "directly_applicable",
      "reasoning": "This is a clear capability breakthrough that directly enables new agent applications..."
    }
  ]
}

Don't report any signal that seems speculative or uncertain. Quality > quantity.
```

### 6.2 Invocation Pattern

```python
# High-priority items (recent, high-rank, long content)
high_priority_items = [
    item for item in batch
    if item.source_rank == "high" or
       (item.source_rank == "medium" and item.metadata.word_count > 1000)
]

for item in high_priority_items:
    content = f"""
    Title: {item.title}
    Source: {item.source_name} ({item.published_date})

    {item.body_snippet}
    """

    signals_json = llm_agent.structured_output(
        system_prompt=SIGNAL_DETECTION_PROMPT,
        user_message=content,
        schema=SignalListSchema
    )

    for signal_dict in signals_json.signals:
        signal = Signal(
            **signal_dict,
            detection_method="llm_reasoning",
            source_items=[{"item_id": item.id, "relevance_score": 1.0}]
        )
        store_signal(signal)
```

---

## 7. Error Handling & Edge Cases

| Scenario | Handling |
|----------|----------|
| **False positive signal** (e.g., "model release" for a 2-year-old model) | Timestamp check: only flag as signal if news is recent (within 7 days of publication). LLM reasoning helps filter these. |
| **Ambiguous content** (multiple interpretations) | Lower confidence; include note: "requires review". Flag for human inspection if confidence 0.60–0.70. |
| **Non-English content** | Skip or translate. If translated, lower confidence by 0.1 (translation introduces error). |
| **Spam or low-quality source** | Use source_rank == "low" → apply higher confidence threshold (>0.75 instead of >0.65). |
| **Duplicate signals across items** | Clustering merges them; increase cluster confidence. One signal group per unique topic + entity set. |
| **Slow LLM inference** (high-priority batch backs up) | Queue high-priority items separately; process asynchronously; fallback to rule-based detection if queue > threshold. |
| **LLM hallucinates signals** | Require explicit source span extraction: LLM must quote from source for each signal. Validate quotes are in source text. |
| **Signal cluster grows indefinitely** | Set cluster size cap; if cluster > 50 signals in 30 days, move to trend tracking (different component). |
| **Missing key fields** | Allow nulls for optional fields (notes, related_signals). Require: signal_type, title, confidence, source_items. |

---

## 8. Performance & Scaling

**Expected throughput:**
- Process 500–1000 normalized items per week
- ~30–50 signals generated per week
- Signal detection latency: <30 seconds per item (rule-based); <5 minutes per item (with LLM reasoning)

**Scaling strategy:**

1. **Rule-based first:** Detect 80–90% of signals via fast pattern matching; use LLM only on high-priority content.
2. **Async LLM processing:** Queue high-value items for LLM reasoning; process in background to avoid blocking ingest.
3. **Batch aggregation:** Run signal clustering daily, not per-item.
4. **Caching:** Cache regex patterns and entity lists in memory.

**Latency targets:**
- Rule-based detection: <500 ms per item
- Full pipeline (rule + optional LLM): <30 seconds median
- Signal availability: <5 minutes from item ingestion to downstream query

---

## 9. Dependencies

**Depends on:**
- Source Scanner (0.1) — normalized content items
- Entity lists / known entity database — for pattern matching

**Depended on by:**
- Market Classifier (0.3) — consumes detected signals
- Opportunity Ranker (0.4) — uses signal strength as input to scoring
- Watchlist Publisher (0.5) — includes signal sources in final watchlist

---

## 10. Success Metrics

1. **Signal precision:** >80% of detected signals are actionable (manual audit sample)
2. **Signal recall:** Catch >85% of major market signals (validation: compare to human-curated external lists)
3. **Confidence calibration:** Signals rated 0.85+ confidence are validated >80% of the time
4. **Time-to-signal:** Median 5–10 minutes from item ingestion to signal detection
5. **Cluster quality:** Related signals correctly grouped 90%+ of the time
6. **Human review rate:** <10% of signals require human flag-for-review (should be mostly automated)
7. **Trend tracking:** Detect emerging trends (3+ corroborating signals) within 2 weeks of trend start
8. **False positive rate:** <15% of signals don't lead to viable opportunities (will be validated in Phase 1/2)

---

## 11. Implementation Notes

### Suggested Tech Stack

**Language:** Python 3.11+

**Core libraries:**
- `regex` or `re` — Pattern matching
- `nltk` or `spacy` — NLP preprocessing (tokenization, entity extraction)
- `pydantic` — Schema validation
- `anthropic` or `openai` — LLM client (for reasoning on high-value items)
- `sqlalchemy` or `pymongo` — Database access
- `redis` — Caching, message queue for async LLM calls

**Infrastructure:**
- **Database:** PostgreSQL (primary) or MongoDB for signals
- **Async queue:** Redis + Celery (for LLM inference jobs)
- **Monitoring:** Prometheus for detection rates, latency
- **Logging:** ELK Stack or CloudWatch

### Code Structure

```
signal-detector/
├── config/
│   ├── signal_patterns.yaml     # rule-based patterns for each signal type
│   ├── keywords.json            # keyword lists (by signal type)
│   └── entity_lists.json        # known companies, techs, etc.
├── detectors/
│   ├── base.py                  # abstract detector class
│   ├── rule_based.py            # regex + keyword-based detection
│   ├── llm_reasoning.py         # LLM-based reasoning detector
│   └── signal_clustering.py     # clustering and merging logic
├── processors/
│   ├── normalizer.py            # normalize signals (dedup, score)
│   ├── clusterer.py             # cluster related signals
│   └── trend_tracker.py         # track trends over time
├── storage/
│   ├── db.py                    # signal store interface
│   └── signal_index.py          # indexing for fast queries
├── pipeline.py                  # main detection pipeline
├── main.py                      # entry point (async processing loop)
└── tests/
    ├── test_detectors.py
    ├── test_clustering.py
    └── fixtures/
        ├── sample_items.json    # test normalized items
        └── expected_signals.json # expected detections
```

### Key Implementation Details

**1. Rule-based pattern matching:**

```python
SIGNAL_PATTERNS = {
    "tech_breakthrough": {
        "keywords": [
            r"breakthrough|SOTA|state-of-the-art|first time",
            r"significant improvement|milestone|landmark",
            r"reaches \d+% accuracy|beats previous record"
        ],
        "entities_must_include": ["ai_lab", "ai_company"],
        "source_rank_min": "medium"
    },
    "model_release": {
        "keywords": [
            r"releases?|launch|available now|open.?source",
            r"HuggingFace|model weights|available on"
        ],
        "entities_must_include": ["ai_company", "ai_lab"],
        "source_rank_min": "low"
    },
    # ... more patterns
}

def detect_signals_rule_based(item: NormalizedItem) -> List[Signal]:
    signals = []
    for signal_type, pattern_config in SIGNAL_PATTERNS.items():
        keywords = pattern_config["keywords"]
        text = f"{item.title} {item.description}".lower()

        for keyword_pattern in keywords:
            if re.search(keyword_pattern, text):
                # Calculate confidence based on:
                # - keyword_specificity (breakthrough > release > hiring)
                # - source_rank
                # - entity matches
                confidence = calculate_confidence(
                    pattern_specificity=0.85,
                    source_rank=item.metadata.source_rank,
                    entity_match_count=count_matching_entities(...)
                )

                if confidence > 0.65:
                    signal = Signal(
                        signal_type=signal_type,
                        title=extract_title(item, signal_type),
                        description=extract_description(item, signal_type),
                        confidence=confidence,
                        severity=assess_severity(item, signal_type),
                        source_items=[{
                            "item_id": item.id,
                            "relevance_score": confidence
                        }],
                        detection_method="rule_based"
                    )
                    signals.append(signal)
                    break  # Don't double-count same signal type

    return signals
```

**2. Signal clustering:**

```python
def cluster_signals_by_topic():
    """Daily batch: group signals by (type, companies, industries)"""
    signals = db.query_signals(created_since=now - 30.days)

    # Build similarity matrix
    for i in range(len(signals)):
        for j in range(i+1, len(signals)):
            similarity = compute_signal_similarity(signals[i], signals[j])
            # Similarity considers:
            # - Same signal_type (weight: 0.3)
            # - Overlapping companies (weight: 0.4)
            # - Overlapping industries (weight: 0.3)

            if similarity > 0.60:
                if not signals[i].signal_cluster_id:
                    signals[i].signal_cluster_id = new_uuid()
                signals[j].signal_cluster_id = signals[i].signal_cluster_id
                signals[j].related_signals.append(signals[i].id)

    # Merge clusters
    clusters = defaultdict(list)
    for signal in signals:
        if signal.signal_cluster_id:
            clusters[signal.signal_cluster_id].append(signal)

    for cluster_id, cluster_signals in clusters.items():
        # Boost confidence of clustered signals
        base_confidence = mean([s.confidence for s in cluster_signals])
        boost = min(0.15, 0.05 * len(cluster_signals))  # max +0.15
        boosted_confidence = min(0.99, base_confidence + boost)

        for signal in cluster_signals:
            signal.confidence = boosted_confidence
            signal.trend_direction = assess_trend([s for s in cluster_signals])
            db.save(signal)
```

**3. LLM reasoning invocation:**

```python
async def detect_signals_llm(item: NormalizedItem) -> List[Signal]:
    """Invoke LLM for high-priority items"""

    if item.metadata.word_count < 200:
        return []  # Too short, not worth LLM call

    content = f"""
    Title: {item.title}
    Source: {item.source_name}
    Published: {item.published_date}

    {item.body_snippet}
    """

    try:
        response = await llm_client.messages.create(
            model="claude-opus-4-6",
            max_tokens=1500,
            system=SIGNAL_DETECTION_SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": content
            }]
        )

        # Parse structured output
        signals_dict = json.loads(response.content[0].text)
        signals = []

        for signal_dict in signals_dict.get("signals", []):
            # Validate quotes are in source text
            if signal_dict.get("quote"):
                assert signal_dict["quote"] in item.body_snippet

            signal = Signal(
                **signal_dict,
                detection_method="llm_reasoning",
                source_items=[{
                    "item_id": item.id,
                    "relevance_score": signal_dict["confidence"]
                }]
            )
            signals.append(signal)

        return signals

    except Exception as e:
        logger.error(f"LLM signal detection failed for {item.id}: {e}")
        return []
```

### Deployment Considerations

1. **Pattern tuning:** Start with conservative patterns; monitor precision. Expand patterns over time based on audit feedback.
2. **LLM budget:** Invoke LLM only on 20–30% of high-priority items to manage costs (~$100/month for moderate volume).
3. **Cold-start:** Bootstrap pattern library from domain research; iterate based on feedback loop.
4. **Monitoring:** Track:
   - Signals generated per day
   - Signal type distribution
   - Cluster growth rate
   - Precision (manual audits quarterly)
5. **Testing:** Use realistic test items (actual news articles, arXiv papers) for integration tests.

---

## Appendix: Example Detected Signals

**Example 1: Tech Breakthrough**

```json
{
  "id": "sig_001",
  "signal_type": "tech_breakthrough",
  "title": "Multimodal vision-language models scale",
  "description": "New vision-language models (GPT-4 Vision, Gemini Pro Vision) reach production-grade capabilities. This enables agent automation of visual document processing, quality assurance, and design review—tasks previously requiring human eyes.",
  "detected_at": "2024-11-15T10:00:00Z",
  "confidence": 0.93,
  "severity": "high",
  "time_sensitivity": "normal",
  "source_items": [
    {
      "item_id": "norm_001",
      "relevance_score": 0.95,
      "excerpt": "GPT-4 Vision now available to all API customers..."
    },
    {
      "item_id": "norm_002",
      "relevance_score": 0.88,
      "excerpt": "Google announces Gemini Pro Vision with multimodal..."
    }
  ],
  "key_entities": {
    "companies": ["OpenAI", "Google", "Anthropic"],
    "technologies": ["Vision Transformers", "Multimodal LLMs", "Document understanding"],
    "industries": ["Enterprise software", "Professional services"]
  },
  "signal_cluster_id": "cluster_multimodal_001",
  "related_signals": ["sig_002", "sig_003"],
  "trend_direction": "accelerating",
  "actionability": "directly_applicable",
  "automation_impact": "high",
  "metadata": {
    "detection_method": "rule_based + llm_reasoning",
    "requires_review": false
  }
}
```

**Example 2: Regulatory Shift**

```json
{
  "id": "sig_004",
  "signal_type": "regulatory_shift",
  "title": "EU AI Act low-risk automation exemption",
  "description": "EU AI Act classifies routine business automation (data entry, scheduling, customer service) as 'low-risk', enabling deployment without prior authorization. Opens market for agent-first European startups.",
  "detected_at": "2024-12-01T14:00:00Z",
  "confidence": 0.97,
  "severity": "high",
  "time_sensitivity": "urgent",
  "source_items": [
    {
      "item_id": "norm_045",
      "relevance_score": 0.99,
      "excerpt": "Official EU regulation: Annex III classifies business automation as low-risk..."
    }
  ],
  "key_entities": {
    "companies": [],
    "technologies": ["AI agents", "Business automation", "RPA"],
    "industries": ["Finance", "HR", "Customer service", "All sectors"]
  },
  "signal_cluster_id": "cluster_regulation_001",
  "trend_direction": "emerging",
  "actionability": "directly_applicable",
  "automation_impact": "high",
  "metadata": {
    "detection_method": "rule_based",
    "requires_review": false,
    "regulatory_scope": "EU",
    "effective_date": "2025-01-01"
  }
}
```

**Example 3: Customer Pain Signal (Clustered)**

```json
{
  "id": "sig_cluster_pain_001",
  "signal_type": "customer_pain",
  "title": "Data entry bottleneck in accounting",
  "description": "Accounting teams report manual invoice data entry taking 20–40% of time. Frustration evident in Reddit threads, G2 reviews, and support forums. Clear target for automation.",
  "detected_at": "2024-11-20T09:00:00Z",
  "confidence": 0.78,
  "severity": "medium",
  "time_sensitivity": "normal",
  "source_items": [
    {"item_id": "norm_150", "relevance_score": 0.65, "excerpt": "Reddit: spending 30 hours/week on data entry..."},
    {"item_id": "norm_151", "relevance_score": 0.70, "excerpt": "G2 review: tedious manual invoice processing..."},
    {"item_id": "norm_152", "relevance_score": 0.68, "excerpt": "Trustpilot: software lacks automation features..."}
  ],
  "key_entities": {
    "companies": ["QuickBooks", "Sage", "Xero"],
    "technologies": ["Invoice automation", "OCR", "RPA"],
    "industries": ["Accounting", "Finance"]
  },
  "signal_cluster_id": "cluster_pain_001",
  "related_signals": ["sig_005", "sig_006"],
  "trend_direction": "accelerating",
  "actionability": "directly_applicable",
  "automation_impact": "high",
  "metadata": {
    "detection_method": "rule_based",
    "cluster_size": 3,
    "sources_represented": ["reddit", "review_site", "review_site"]
  }
}
```
