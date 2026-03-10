# Market Classifier — Component Specification

## 1. Purpose & Responsibility

The Market Classifier is the opportunity mapper of Phase 0. Its core responsibility is to take detected signals and map them to specific markets, industries, and problem spaces—transforming raw signals into structured opportunity candidates.

**Role in pipeline:** Acts as the third stage of the discovery funnel. It aggregates related signals, clusters them by market/industry/problem, determines which sectors are being affected, and identifies which specific problems within those sectors are becoming newly solvable due to the converging signals.

**What it owns:**
- Market taxonomy (definition and maintenance)
- Signal-to-market mapping (which signals apply to which markets)
- Market opportunity candidate creation and updates
- Agent-readiness assessment (what % of work can be automated in this space)
- Market candidate deduplication and merge logic

---

## 2. Inputs

**Source:** Detected signals from Signal Detector (0.2).

**Input data structure:**

```json
{
  "id": "signal_uuid",
  "signal_type": "tech_breakthrough|model_release|regulatory_shift|market_disruption|hiring_pattern|funding_surge|customer_pain",
  "title": "string",
  "description": "string",
  "confidence": 0.95,
  "severity": "critical|high|medium|low",
  "key_entities": {
    "companies": ["string"],
    "technologies": ["string"],
    "industries": ["string"]
  },
  "affected_industries": ["string"],
  "automation_potential": "high|medium|low",
  "time_sensitivity": "urgent|normal|low",
  "related_signals": ["signal_id"],
  "signal_cluster_id": "cluster_uuid"
}
```

**Consumption pattern:** Continuous or daily batch (processes signals from past 7–30 days).

---

## 3. Outputs

**Destination:** Market opportunity store (document database) and opportunity index.

**Data structure — Market Opportunity Candidate:**

```json
{
  "id": "opp_uuid",
  "name": "string (descriptive market opportunity name)",
  "description": "string (2-3 sentence summary)",
  "target_market": "string (industry or market segment)",
  "specific_problem": "string (the exact inefficiency or pain point)",
  "problem_statement": "string (longer description of the problem and why it matters)",
  "enabling_signals": [
    {
      "signal_id": "signal_uuid",
      "signal_type": "tech_breakthrough|regulatory_shift|...",
      "relevance": "direct|contextual|supporting",
      "strength": 0.95
    }
  ],
  "converging_signals_count": 3,
  "total_signal_strength": 0.92,  // aggregate confidence
  "affected_industries": [
    {
      "industry": "string",
      "subsector": "string",
      "relevance": "primary|secondary|tangential"
    }
  ],
  "agent_readiness": {
    "score": 0.75,  // 0–1, how much work can be automated
    "breakdown": {
      "customer_facing": 0.80,
      "operations": 0.70,
      "support": 0.85,
      "analysis": 0.75,
      "other": 0.65
    },
    "reasoning": "detailed explanation of why this score"
  },
  "key_technologies": ["LLMs", "Agentic workflows", "Multimodal AI"],
  "time_sensitivity": "urgent|normal|low",
  "market_maturity": "nascent|emerging|growth|mature",
  "incumbent_response_risk": "high|medium|low",  // how quickly will incumbents adapt
  "created_at": "ISO 8601",
  "updated_at": "ISO 8601",
  "last_signal_date": "ISO 8601",
  "metadata": {
    "signal_sources": ["newsapi", "arxiv", "producthunt"],
    "geographic_focus": ["US", "EU"],
    "requires_review": false
  }
}
```

**Example outputs:**
- 2–8 market opportunity candidates created per week
- Each candidate backed by 2–5 converging signals
- Candidates span multiple industries

---

## 4. Core Logic / Algorithm

### 4.1 Market Taxonomy

The Market Classifier operates against a predefined taxonomy of markets and industries. This taxonomy is structured as:

```
Market Taxonomy:
├── Industry (e.g., "Financial Services")
│   ├── Segment (e.g., "Accounting", "Lending", "Insurance")
│   │   ├── Subsegment (e.g., "Invoice Processing", "Underwriting")
│   │   └── Problem Spaces (e.g., "Manual data entry", "Claims triage")
│   └── ... other segments
├── Industry
│   └── ...

Example:
├── Financial Services
│   ├── Accounting
│   │   ├── Invoice Processing
│   │   │   ├── Manual invoice data entry
│   │   │   ├── Reconciliation
│   │   │   └── Expense categorization
│   │   └── Reporting & Compliance
│   │       ├── Journal entry generation
│   │       └── Audit preparation
│   ├── Lending
│   │   ├── Loan Origination
│   │   │   ├── Application processing
│   │   │   ├── Credit assessment
│   │   │   └── Documentation
│   │   └── Collections
│   │       ├── Debtor contact & negotiation
│   │       └── Payment tracking
│   └── Insurance
│       ├── Claims Processing
│       │   ├── Claims triage
│       │   ├── Document verification
│       │   └── Settlement calculation
│       └── Risk Underwriting
│           ├── Medical underwriting
│           └── Property assessment
├── Customer Service & Support
│   ├── Tier 1 Support
│   │   ├── FAQ response
│   │   ├── Ticket routing
│   │   └── Knowledge search
│   └── Tech Support
│       ├── Troubleshooting
│       └── Installation guidance
├── HR & Recruiting
│   ├── Recruiting
│   │   ├── Job description generation
│   │   ├── Resume screening
│   │   ├── Interview coordination
│   │   └── Candidate outreach
│   └── Employee Onboarding
│       ├── Document processing
│       ├── Policy training
│       └── Access provisioning
├── Marketing & Sales
│   ├── Content Creation
│   │   ├── Blog post writing
│   │   ├── Email generation
│   │   └── Ad copy
│   └── Lead Management
│       ├── Prospect research
│       ├── Lead scoring
│       └── Outreach sequencing
├── Software Development
│   ├── Code Generation & Completion
│   ├── Testing & QA
│   ├── Documentation
│   └── DevOps & Monitoring
└── ... more industries
```

The taxonomy is versioned and maintained in a configuration/database store. It's expanded and refined over time based on discovered opportunities.

### 4.2 Signal-to-Market Mapping

For each signal, determine which markets/industries/problems it affects:

```python
def map_signal_to_markets(signal: Signal) -> List[MarketMapping]:
    """
    Given a signal, identify all relevant markets in the taxonomy.

    Returns: List of (market_hierarchy, relevance_score) tuples
    """

    mappings = []

    # Rule 1: Match by affected_industries
    if signal.affected_industries:
        for industry_name in signal.affected_industries:
            taxonomy_matches = find_taxonomy_nodes(industry_name)
            for node in taxonomy_matches:
                mappings.append(MarketMapping(
                    market_node=node,
                    relevance="primary",  # signal explicitly lists it
                    match_strength=0.95
                ))

    # Rule 2: Match by key_entities (companies in specific verticals)
    company_market_map = load_company_industry_map()  # known map of companies to industries
    for company in signal.key_entities.companies:
        industries = company_market_map.get(company, [])
        for industry in industries:
            taxonomy_matches = find_taxonomy_nodes(industry)
            for node in taxonomy_matches:
                mappings.append(MarketMapping(
                    market_node=node,
                    relevance="secondary",  # inferred from company vertical
                    match_strength=0.70
                ))

    # Rule 3: Match by technologies (tech breakthrough signals)
    if signal.signal_type == "tech_breakthrough":
        tech_use_case_map = load_technology_use_case_map()
        for tech in signal.key_entities.technologies:
            use_cases = tech_use_case_map.get(tech, [])
            for use_case in use_cases:
                # Find markets where this use_case is relevant
                relevant_nodes = find_markets_for_use_case(use_case)
                for node in relevant_nodes:
                    mappings.append(MarketMapping(
                        market_node=node,
                        relevance="contextual",
                        match_strength=signal.automation_potential_score(use_case)
                    ))

    # Rule 4: LLM-based reasoning for ambiguous signals
    if not mappings or len(mappings) < 2:
        llm_mappings = llm_infer_market_mappings(signal)
        mappings.extend(llm_mappings)

    # Deduplicate and return
    unique_mappings = {}
    for mapping in mappings:
        key = mapping.market_node.id
        if key not in unique_mappings or mapping.match_strength > unique_mappings[key].match_strength:
            unique_mappings[key] = mapping

    return list(unique_mappings.values())
```

### 4.3 Market Opportunity Candidate Creation

When a signal (or cluster of signals) maps to a market:

```python
def create_or_update_opportunity(
    market_node: TaxonomyNode,
    signals: List[Signal],
    signal_mappings: List[MarketMapping]
):
    """
    Create a market opportunity candidate or update existing one.

    Logic:
    1. Check if opportunity already exists for this market + problem space
    2. If new: create opportunity
    3. If exists: merge signals, update agent-readiness, update timestamps
    """

    opportunity_key = (market_node.id, extract_primary_problem(market_node))

    existing_opportunity = db.query_opportunity(
        market_node_id=market_node.id,
        problem_space=opportunity_key.problem
    )

    # Build enabling signals list
    enabling_signals = []
    total_strength = 0
    for signal in signals:
        # Find matching mapping for this signal
        mapping = find_mapping_for_signal(signal, signal_mappings)
        if mapping:
            enabling_signals.append({
                "signal_id": signal.id,
                "signal_type": signal.signal_type,
                "relevance": mapping.relevance,
                "strength": mapping.match_strength * signal.confidence
            })
            total_strength += mapping.match_strength * signal.confidence

    agent_readiness = assess_agent_readiness(
        market_node=market_node,
        problem_space=opportunity_key.problem,
        key_technologies=[t for s in signals for t in s.key_entities.technologies]
    )

    affected_industries = extract_industries_from_taxonomy(market_node)

    if existing_opportunity:
        # Update existing opportunity
        existing_opportunity.enabling_signals.extend(enabling_signals)
        existing_opportunity.converging_signals_count = len(existing_opportunity.enabling_signals)
        existing_opportunity.total_signal_strength = mean([s["strength"] for s in existing_opportunity.enabling_signals])
        existing_opportunity.updated_at = now()
        existing_opportunity.last_signal_date = max(existing_opportunity.last_signal_date, max([s.detected_at for s in signals]))
        db.save(existing_opportunity)
    else:
        # Create new opportunity
        opportunity = MarketOpportunitieCandidate(
            name=generate_opportunity_name(market_node, opportunity_key.problem),
            description=generate_description(market_node, signals),
            target_market=market_node.industry,
            specific_problem=opportunity_key.problem,
            problem_statement=generate_problem_statement(market_node, signals),
            enabling_signals=enabling_signals,
            converging_signals_count=len(enabling_signals),
            total_signal_strength=mean([s["strength"] for s in enabling_signals]),
            affected_industries=affected_industries,
            agent_readiness=agent_readiness,
            key_technologies=extract_technologies(signals),
            time_sensitivity=determine_time_sensitivity(signals),
            market_maturity=assess_market_maturity(market_node),
            incumbent_response_risk=assess_incumbent_risk(market_node),
            created_at=now()
        )
        db.save(opportunity)
```

### 4.4 Agent-Readiness Assessment

For each opportunity, score how much of the value chain can be handled by agents:

```python
def assess_agent_readiness(
    market_node: TaxonomyNode,
    problem_space: str,
    key_technologies: List[str]
) -> AgentReadiness:
    """
    Score how much of the work in this problem space can be automated.

    Returns breakdown by function area + overall score.
    """

    # Base scores by problem type (from domain knowledge)
    base_scores = {
        "data_entry": 0.95,            # Agents excellent at this
        "document_processing": 0.85,   # OCR + understanding
        "customer_triage": 0.75,       # Classify but needs human for edge cases
        "scheduling": 0.90,            # Straightforward automation
        "research": 0.80,              # Data gathering, summarization
        "code_generation": 0.70,       # Works but requires review
        "content_creation": 0.60,      # Useful but quality varies
        "decision_making": 0.40,       # Risky without human oversight
        "relationship_building": 0.20  # Requires human trust
    }

    problem_type = infer_problem_type(problem_space)
    base_score = base_scores.get(problem_type, 0.50)

    # Adjust based on required technologies
    tech_difficulty = assess_technology_difficulty(key_technologies)
    tech_adjustment = -0.10 if tech_difficulty == "high" else (0.05 if tech_difficulty == "low" else 0)

    # Adjust based on market maturity
    market_adjustment = 0.10 if market_node.maturity == "mature" else (0.05 if market_node.maturity == "growth" else 0)

    # Breakdown by function area (if applicable)
    breakdown = {
        "customer_facing": estimate_automation_by_function(problem_space, "customer_facing"),
        "operations": estimate_automation_by_function(problem_space, "operations"),
        "support": estimate_automation_by_function(problem_space, "support"),
        "analysis": estimate_automation_by_function(problem_space, "analysis"),
        "other": 0.60  # default for miscellaneous
    }

    overall_score = mean(list(breakdown.values()))

    return AgentReadiness(
        score=min(1.0, max(0.0, overall_score)),
        breakdown=breakdown,
        reasoning=generate_reasoning(problem_type, base_score, tech_adjustment, breakdown)
    )
```

### 4.5 Opportunity Aggregation Loop

Run daily or continuously:

```python
def classify_signals_to_markets():
    """Main loop: process recent signals and map to market opportunities"""

    recent_signals = db.query_signals(
        created_since=now - 7.days,
        already_processed=False
    )

    for signal in recent_signals:
        # Step 1: Map signal to markets
        market_mappings = map_signal_to_markets(signal)

        if not market_mappings:
            # No clear market mapping; archive signal for later
            signal.metadata["market_mapping_attempted"] = True
            db.save(signal)
            continue

        # Step 2: For each market mapping, create or update opportunity
        for mapping in market_mappings:
            market_node = mapping.market_node

            # Collect all signals for this market from the past 30 days
            related_signals = db.query_signals(
                markets=[market_node.id],
                created_since=now - 30.days,
                min_confidence=0.65
            )

            # Create or update opportunity
            create_or_update_opportunity(
                market_node=market_node,
                signals=related_signals,
                signal_mappings=[mapping]
            )

        # Mark signal as processed
        signal.metadata["market_classified"] = True
        db.save(signal)

    # Step 3: Deduplicate opportunities (merge similar ones)
    dedup_market_opportunities()

    # Step 4: Re-assess agent-readiness for all active opportunities
    update_agent_readiness_scores()

    logger.info(f"Classified {len(recent_signals)} signals; created/updated {len(market_mappings)} opportunity candidates")
```

### 4.6 Opportunity Deduplication

Merge opportunities that describe the same market opportunity from different angles:

```python
def dedup_market_opportunities():
    """Find and merge duplicate opportunities"""

    opportunities = db.query_opportunities(updated_since=now - 7.days)

    for i, opp1 in enumerate(opportunities):
        for opp2 in opportunities[i+1:]:
            similarity = compute_opportunity_similarity(opp1, opp2)
            # Consider:
            # - Same target_market (weight: 0.4)
            # - Similar specific_problem (similarity > 0.7) (weight: 0.4)
            # - Overlapping key_technologies (weight: 0.2)

            if similarity > 0.75:
                # Merge opp2 into opp1
                opp1.enabling_signals.extend(opp2.enabling_signals)
                opp1.converging_signals_count = len(opp1.enabling_signals)
                opp1.total_signal_strength = mean([s["strength"] for s in opp1.enabling_signals])
                opp1.updated_at = now()

                db.delete(opp2)
                logger.info(f"Merged opportunities {opp1.id} and {opp2.id}")
```

---

## 5. Data Sources & Integrations

**Direct dependencies:**
- Signal Detector (0.2) — signal stream
- Market taxonomy (configuration/database)
- Optional: Company industry map (Crunchbase API, manual maintenance)
- Optional: Technology use-case map (domain expert knowledge, manual maintenance)

**Optional external integrations:**
- Crunchbase API — to enrich company industry classifications
- Industry research APIs — to validate market maturity, size estimates
- External taxonomy databases — to cross-reference market definitions

**No new external data pulls required** if taxonomy is maintained internally.

---

## 6. Agent Prompt Strategy

The Market Classifier uses agent reasoning for:
- Ambiguous signal-to-market mapping (when rule-based matching doesn't yield results)
- Problem statement generation and refinement
- Market opportunity synthesis and naming

### 6.1 System Prompt for Market Classification Agent

```
You are a business strategy analyst specializing in identifying emerging market
opportunities for automation and disruption.

Your task: Given one or more signals (market events, technology breakthroughs,
regulatory shifts, customer pain points), map them to specific markets,
industries, and problem spaces where AI agents could create a new disruptive business.

# Instructions

1. **Understand the signals.** Read each signal carefully. What is the core fact
   or change? Why does it matter?

2. **Identify affected industries.** Which sectors or industries does each signal
   impact? Be specific (e.g., "accounting firms" not just "finance").

3. **Pinpoint the problem space.** What specific problem or inefficiency does this
   signal reveal? What job-to-be-done is becoming newly solvable?

   Example: Signal is "GPT-4 Vision released." Affected industries: design,
   manufacturing, insurance. Problem space: visual quality inspection and
   document verification (now automatable by agents).

4. **Assess agent-readiness.** How much of the work in this problem space could
   be handled by AI agents? Consider:
   - What percentage of tasks are data-driven vs. relationship-driven?
   - How much human judgment is currently required?
   - What % of time is spent on automatable work (data entry, research, triage)?

5. **Identify enabling technologies.** What AI capabilities make this opportunity
   newly viable right now (as opposed to 5 years ago)?

6. **Consider timing.** Is this window opening now or will it be open in 6+ months?
   What's the urgency?

7. **Assess incumbent vulnerability.** How likely are existing players to:
   - Quickly adapt their technology?
   - Cut prices to compete?
   - Acquire a new competitor?

# Output Format

For each distinct market opportunity you identify:

{
  "target_market": "specific industry or segment",
  "specific_problem": "the exact inefficiency or pain point being addressed",
  "problem_statement": "2-3 sentence description of why this is a problem and why now",
  "affected_industries": [
    {"industry": "...", "relevance": "primary|secondary|tangential"},
    ...
  ],
  "agent_readiness_score": 0.75,  // 0.0–1.0
  "agent_readiness_reasoning": "Why this score? What % of tasks can agents handle?",
  "enabling_technologies": ["LLMs", "Vision models", ...],
  "time_sensitivity": "urgent|normal|low",
  "market_maturity": "nascent|emerging|growth|mature",
  "incumbent_response_risk": "high|medium|low",
  "confidence": 0.85,  // how confident are you in this opportunity?
  "examples": [
    "Example company/service that could exist: ...",
    "Example customer: ..."
  ]
}

Be specific. Don't map signals to vague opportunities like "AI for [industry]".
Focus on concrete problems: "AI agents for accounts payable automation in
mid-market accounting firms," not "AI for finance."
```

### 6.2 Invocation Pattern

```python
async def classify_ambiguous_signals_with_llm(signals: List[Signal]) -> List[Dict]:
    """
    For signals that don't map clearly to taxonomy via rules,
    use LLM reasoning to infer market opportunities.
    """

    signal_summaries = [
        f"- {s.signal_type}: {s.title}. {s.description}"
        for s in signals
    ]

    prompt = f"""
    {MARKET_CLASSIFICATION_SYSTEM_PROMPT}

    Here are signals to analyze:

    {chr(10).join(signal_summaries)}

    Identify distinct market opportunities. Focus on specific problems,
    not generic categories.
    """

    response = await llm_client.messages.create(
        model="claude-opus-4-6",
        max_tokens=2500,
        system=MARKET_CLASSIFICATION_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}]
    )

    # Parse structured output
    opportunities = json.loads(response.content[0].text)
    return opportunities.get("opportunities", [])
```

---

## 7. Error Handling & Edge Cases

| Scenario | Handling |
|----------|----------|
| **Signal doesn't map to any taxonomy node** | Flag signal as "unclassified"; store for future review if new industry emerges. Human can suggest new taxonomy node. |
| **Signal maps to multiple markets (too broad)** | Keep all mappings; don't force aggregation. Downstream (Opportunity Ranker) will score each separately. |
| **Low-confidence signal** (confidence < 0.65) | Skip market mapping; don't create opportunities from weak signals. |
| **Opportunity appears generic or vague** (e.g., "AI for finance") | Reject; require specific problem statement. Re-run LLM reasoning or flag for human review. |
| **Duplicate opportunities (high similarity)** | Automatically merge; keep signal cross-references. |
| **Agent-readiness score seems wrong** | Flag for manual review if assessment contradicts intuition (e.g., 0.95 for "complex decision-making"). |
| **No enabling signals for opportunity** | Don't create opportunity; an opportunity must have at least 1 signal backing it. |
| **Taxonomy is incomplete** (new industry emerges) | Add new taxonomy node; backfill past opportunities. Feedback loop to taxonomy maintainer. |
| **LLM hallucinates a problem space** | Validate against known problems in taxonomy or domain knowledge; require confidence > 0.75 for new problems. |

---

## 8. Performance & Scaling

**Expected throughput:**
- Process 20–50 signals per week
- Create/update 5–15 market opportunities per week
- ~100–200 active opportunity candidates at any time

**Latency requirements:**
- Signal-to-market mapping: <5 seconds per signal
- Full classification pipeline: <30 seconds per batch of 10 signals
- Opportunity queries: <1 second (indexed)

**Scaling strategy:**

1. **Rule-based matching first:** 80% of mappings via taxonomy matching (fast)
2. **Lazy LLM reasoning:** Only invoke LLM for signals without clear mappings (10–20% of volume)
3. **Batch LLM calls:** Group ambiguous signals and call LLM once (vs. per-signal)
4. **Caching:** Cache taxonomy, company-industry map, and similarity matrices in memory
5. **Async processing:** Deduplication and agent-readiness updates run asynchronously

---

## 9. Dependencies

**Depends on:**
- Signal Detector (0.2) — signal stream
- Market taxonomy (configuration store)
- Company industry map (optional; loaded at startup)

**Depended on by:**
- Opportunity Ranker (0.4) — consumes market opportunity candidates
- Watchlist Publisher (0.5) — publishes opportunities

---

## 10. Success Metrics

1. **Coverage:** >90% of signals map to at least one market (don't lose signals)
2. **Precision:** >80% of created opportunities are actionable (manual audit sample quarterly)
3. **Deduplication:** <5% of opportunities are near-duplicates (similarity > 0.75)
4. **Agent-readiness calibration:** Assessments align with Phase 1/2 validation; if Phase 1 constantly disagrees, recalibrate
5. **Taxonomy completeness:** New signals rarely require new taxonomy nodes (< 5% of weeks)
6. **Problem statement quality:** Downstream teams find problem statements clear and specific (survey feedback)
7. **Time-to-opportunity:** Median 3–7 days from signal detection to opportunity creation
8. **Opportunity diversity:** Opportunities span ≥5 industries to avoid monoculture

---

## 11. Implementation Notes

### Suggested Tech Stack

**Language:** Python 3.11+

**Core libraries:**
- `pydantic` — Schema validation and market structures
- `redis` — Caching (taxonomy, similarity matrices)
- `sqlalchemy` or `pymongo` — Database ORM
- `anthropic` or `openai` — LLM client
- `difflib` or `fuzzywuzzy` — String similarity for dedup
- `networkx` — Optional, for taxonomy visualization
- `pandas` — Data manipulation (if needed for batch processing)

**Infrastructure:**
- **Database:** PostgreSQL (JSONB for flexible opportunity schema) or MongoDB
- **Cache:** Redis
- **Search:** Elasticsearch (for opportunity queries)
- **Monitoring:** Prometheus for classification rates and latency

### Code Structure

```
market-classifier/
├── config/
│   ├── taxonomy.json           # market taxonomy (industries, segments, problems)
│   ├── company_industry_map.json # known company → industry mappings
│   └── tech_use_case_map.json  # technology → use case mappings
├── classifiers/
│   ├── base.py                 # abstract classifier
│   ├── rule_based.py           # taxonomy matching
│   ├── llm_classifier.py       # LLM-based reasoning
│   └── similarity.py           # opportunity deduplication
├── assessors/
│   ├── agent_readiness.py      # agent-readiness scoring
│   ├── market_maturity.py      # market maturity assessment
│   └── incumbent_risk.py       # incumbent response risk
├── processors/
│   ├── opportunity_merger.py   # deduplication
│   ├── problem_extractor.py    # extract specific problems from signals
│   └── naming.py               # generate opportunity names/descriptions
├── storage/
│   ├── db.py                   # opportunity store interface
│   ├── taxonomy_store.py       # taxonomy queries
│   └── index.py                # search index
├── pipeline.py                 # main classification loop
├── main.py                     # entry point
└── tests/
    ├── test_rule_based.py
    ├── test_llm_classifier.py
    ├── test_dedup.py
    └── fixtures/
        ├── sample_signals.json
        └── sample_opportunities.json
```

### Key Implementation Details

**1. Taxonomy storage:**

```python
# taxonomy.json structure
{
  "version": "1.0",
  "industries": [
    {
      "id": "finance",
      "name": "Financial Services",
      "segments": [
        {
          "id": "accounting",
          "name": "Accounting",
          "subsegments": [
            {
              "id": "invoice_processing",
              "name": "Invoice Processing",
              "problem_spaces": [
                {
                  "id": "data_entry",
                  "name": "Manual invoice data entry",
                  "automation_potential": "high",
                  "difficulty": "low"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**2. Rule-based mapping:**

```python
def map_signal_to_markets(signal: Signal) -> List[MarketMapping]:
    mappings = []
    taxonomy = load_taxonomy()

    # Rule 1: Direct industry match
    for industry_name in signal.affected_industries:
        matches = taxonomy.search(industry_name, threshold=0.8)
        for match in matches:
            mappings.append(MarketMapping(
                market_node=match,
                relevance="primary",
                match_strength=0.95
            ))

    # Rule 2: Company vertical match
    for company in signal.key_entities.companies:
        if company in COMPANY_INDUSTRY_MAP:
            industries = COMPANY_INDUSTRY_MAP[company]
            for industry in industries:
                matches = taxonomy.search(industry)
                for match in matches:
                    mappings.append(MarketMapping(
                        market_node=match,
                        relevance="secondary",
                        match_strength=0.75
                    ))

    # Rule 3: Technology use-case mapping
    if signal.signal_type in ["tech_breakthrough", "model_release"]:
        for tech in signal.key_entities.technologies:
            if tech in TECH_USE_CASE_MAP:
                use_cases = TECH_USE_CASE_MAP[tech]
                for use_case in use_cases:
                    # Find markets where this use_case applies
                    problem_matches = taxonomy.search_problem_spaces(use_case)
                    for match in problem_matches:
                        mappings.append(MarketMapping(
                            market_node=match,
                            relevance="contextual",
                            match_strength=0.70
                        ))

    return mappings
```

**3. Agent-readiness assessment:**

```python
def assess_agent_readiness(problem_space: str, technologies: List[str]) -> AgentReadiness:
    # Base automation potential by problem type
    automation_baseline = {
        "data_entry": 0.95,
        "document_processing": 0.85,
        "customer_triage": 0.75,
        "research": 0.80,
        "analysis": 0.75,
        "code_generation": 0.65,
        "content_creation": 0.60,
        "decision_making": 0.40,
        "relationship_building": 0.20
    }

    problem_type = infer_problem_type(problem_space)
    base_score = automation_baseline.get(problem_type, 0.50)

    # Adjust by technology fit
    tech_fit = assess_technology_fit(problem_type, technologies)
    adjusted_score = base_score * (0.9 + 0.2 * tech_fit)

    # Breakdown by function
    breakdown = {
        "customer_facing": estimate_function_automation("customer_facing", problem_type),
        "operations": estimate_function_automation("operations", problem_type),
        "support": estimate_function_automation("support", problem_type),
        "analysis": estimate_function_automation("analysis", problem_type),
        "other": 0.60
    }

    return AgentReadiness(
        score=min(1.0, adjusted_score),
        breakdown=breakdown
    )
```

**4. Opportunity deduplication:**

```python
def dedup_opportunities():
    opportunities = db.query_opportunities(updated_since=now - 7.days)

    for i, opp1 in enumerate(opportunities):
        for opp2 in opportunities[i+1:]:
            # Similarity: market match + problem match
            market_sim = similar_industries(opp1.affected_industries, opp2.affected_industries)
            problem_sim = similar_problems(opp1.specific_problem, opp2.specific_problem)
            tech_sim = similar_tech_sets(opp1.key_technologies, opp2.key_technologies)

            total_sim = 0.4 * market_sim + 0.4 * problem_sim + 0.2 * tech_sim

            if total_sim > 0.75:
                # Merge
                opp1.enabling_signals.extend(opp2.enabling_signals)
                opp1.updated_at = now()
                db.save(opp1)
                db.delete(opp2)
```

### Deployment Considerations

1. **Taxonomy maintenance:** Dedicate person/team to quarterly taxonomy review and updates
2. **Company industry map:** Update quarterly from Crunchbase or manual research
3. **Agent-readiness baselines:** Validate against Phase 1/2 feedback; adjust if calibration drifts
4. **LLM costs:** Monitor token usage; limit LLM calls to ambiguous signals (20–30% of volume)
5. **Monitoring dashboards:**
   - Opportunities created/updated per week
   - Average signals per opportunity (should be 2–4)
   - Agent-readiness distribution
   - Opportunity archival rate (moved to Phase 1)

---

## Appendix: Example Market Opportunity

```json
{
  "id": "opp_invoice_processing_001",
  "name": "AI-driven accounts payable automation",
  "description": "Use vision-language models and document understanding agents to automate invoice ingestion, extraction, and reconciliation in mid-market accounting. Replaces 30–50% of AP team work.",
  "target_market": "Accounting / Accounts Payable",
  "specific_problem": "Manual invoice data entry and processing consuming 25–40% of AP team time",
  "problem_statement": "Mid-market accounting firms spend 20+ hours per week on manual invoice receipt, data extraction, categorization, and three-way reconciliation. This work is error-prone, requires training, and is a bottleneck for firm growth. Multimodal LLMs can now extract invoice data with 98%+ accuracy, enabling agent-first automation.",
  "enabling_signals": [
    {
      "signal_id": "sig_multimodal_vision",
      "signal_type": "tech_breakthrough",
      "relevance": "direct",
      "strength": 0.95
    },
    {
      "signal_id": "sig_gpt4_vision_release",
      "signal_type": "model_release",
      "relevance": "direct",
      "strength": 0.92
    },
    {
      "signal_id": "sig_ap_pain_reddit",
      "signal_type": "customer_pain",
      "relevance": "direct",
      "strength": 0.78
    }
  ],
  "converging_signals_count": 3,
  "total_signal_strength": 0.88,
  "affected_industries": [
    {
      "industry": "Accounting & Bookkeeping",
      "subsector": "Accounts Payable",
      "relevance": "primary"
    },
    {
      "industry": "Finance & Accounting Software",
      "subsector": "AP Automation",
      "relevance": "primary"
    },
    {
      "industry": "Enterprise Software",
      "subsector": "Workflow Automation",
      "relevance": "secondary"
    }
  ],
  "agent_readiness": {
    "score": 0.82,
    "breakdown": {
      "customer_facing": 0.50,
      "operations": 0.95,
      "support": 0.70,
      "analysis": 0.85,
      "other": 0.75
    },
    "reasoning": "Core work (invoice receipt, extraction, categorization) is highly automatable via vision + document understanding agents (95% operations automation). Customer interaction is limited (50%, mostly setup and exception handling). Analysis (reporting, reconciliation exceptions) is 85% automatable. Support for edge cases requires human involvement (15–20%)."
  },
  "key_technologies": ["Vision-language models", "Multimodal LLMs", "Agentic workflows", "OCR", "Document understanding"],
  "time_sensitivity": "normal",
  "market_maturity": "growth",
  "incumbent_response_risk": "medium",
  "created_at": "2024-11-15T10:30:00Z",
  "updated_at": "2024-11-20T14:00:00Z",
  "last_signal_date": "2024-11-20T12:00:00Z",
  "metadata": {
    "signal_sources": ["arxiv", "newsapi", "reddit"],
    "geographic_focus": ["US", "EU"],
    "requires_review": false
  }
}
```
