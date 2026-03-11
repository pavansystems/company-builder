# Opportunity Ranker — Component Specification

## 1. Purpose & Responsibility

The Opportunity Ranker is the scoring and prioritization engine of Phase 0. Its core responsibility is to evaluate market opportunity candidates across multiple dimensions and produce a composite score that reflects the attractiveness and urgency of each opportunity.

**Role in pipeline:** Acts as the fourth stage of the discovery funnel. It transforms unranked opportunity candidates into a scored and ranked watchlist, using systematic multi-dimensional evaluation to separate high-potential from low-potential opportunities.

**What it owns:**
- Scoring framework definition and maintenance
- Per-dimension evaluation of each opportunity
- Composite score calculation and weighting
- Opportunity ranking and sorting
- Score sensitivity analysis and calibration
- Ranking stability tracking (so rankings don't thrash day-to-day)

---

## 2. Inputs

**Source:** Market opportunity candidates from Market Classifier (0.3).

**Input data structure:**

```json
{
  "id": "opp_uuid",
  "name": "string",
  "description": "string",
  "target_market": "string",
  "specific_problem": "string",
  "problem_statement": "string",
  "enabling_signals": [
    {
      "signal_id": "signal_uuid",
      "signal_type": "string",
      "relevance": "direct|contextual|supporting",
      "strength": 0.95
    }
  ],
  "converging_signals_count": 3,
  "total_signal_strength": 0.92,
  "affected_industries": [
    {
      "industry": "string",
      "subsector": "string",
      "relevance": "primary|secondary|tangential"
    }
  ],
  "agent_readiness": {
    "score": 0.75,
    "breakdown": {
      "customer_facing": 0.80,
      "operations": 0.70,
      "support": 0.85,
      "analysis": 0.75,
      "other": 0.65
    }
  },
  "key_technologies": ["string"],
  "time_sensitivity": "urgent|normal|low",
  "market_maturity": "nascent|emerging|growth|mature",
  "incumbent_response_risk": "high|medium|low",
  "created_at": "ISO 8601",
  "updated_at": "ISO 8601"
}
```

**Consumption pattern:** Continuous (as new opportunities are created) or batch (daily ranking run).

---

## 3. Outputs

**Destination:** Ranked opportunity store and watchlist feed to Phase 1 and publication.

**Data structure — Scored Opportunity:**

```json
{
  "id": "opp_uuid",
  "rank": 1,  // overall position in watchlist
  "composite_score": 0.87,  // 0–1, final score
  "dimensions": {
    "market_size": {
      "score": 0.75,
      "estimate": "$2–5B TAM",
      "confidence": "medium",
      "reasoning": "Estimated based on addressable accounting market"
    },
    "signal_strength": {
      "score": 0.92,
      "count": 3,
      "confidence": "high",
      "reasoning": "3 converging signals with >0.88 avg strength"
    },
    "agent_readiness": {
      "score": 0.82,
      "confidence": "high",
      "reasoning": "95% operations can be automated, 50% customer-facing"
    },
    "competitive_density": {
      "score": 0.65,
      "current_players": 12,
      "confidence": "medium",
      "reasoning": "Moderate competition; space not oversaturated"
    },
    "timing_confidence": {
      "score": 0.88,
      "confidence": "high",
      "reasoning": "Vision models now production-ready; regulatory tailwind (EU AI Act)"
    },
    "market_momentum": {
      "score": 0.70,
      "trend": "accelerating",
      "signal_frequency": "2–3 signals per month",
      "confidence": "medium",
      "reasoning": "Growing number of signals; market awareness increasing"
    }
  },
  "summary": {
    "one_liner": "AI-driven AP automation for mid-market accounting firms",
    "thesis": "Vision-language models + agentic workflows make invoice processing 95% automatable. Market ripe because: (1) multimodal models now production-grade, (2) AP teams still 80% manual, (3) EU regulation favors low-risk automation.",
    "key_strengths": [
      "Multiple enabling signals converging",
      "High agent-readiness (operations: 95%)",
      "Proven customer pain (Reddit, forums, reviews)"
    ],
    "key_risks": [
      "Incumbent AP software vendors (Coupa, SAP Concur) might respond quickly",
      "Integration complexity with legacy ERP systems",
      "Regulatory uncertainty around autonomous decisions"
    ]
  },
  "score_history": [
    {"date": "2024-11-20", "score": 0.84},
    {"date": "2024-11-27", "score": 0.86},
    {"date": "2024-12-04", "score": 0.87}
  ],
  "threshold_status": "above_gate_threshold",  // above_gate_threshold | at_gate_threshold | below_gate_threshold
  "recommended_action": "promote_to_phase_1",
  "metadata": {
    "last_scored_at": "ISO 8601",
    "score_version": 2,  // increments when scoring model changes
    "requires_review": false
  }
}
```

**Example outputs (per day/week):**
- 100–200 scored opportunities in the active watchlist
- Top 20–40 opportunities above Phase 0 gate threshold (automatic promotion)
- Rankings updated daily as new signals arrive

---

## 4. Core Logic / Algorithm

### 4.1 Scoring Dimensions

The Opportunity Ranker evaluates each opportunity across six independent dimensions, each scoring 0.0–1.0:

#### **Dimension 1: Market Size**

**Definition:** Estimated total addressable market (TAM) and serviceable addressable market (SAM).

**Scoring logic:**

```python
def score_market_size(opportunity: Opportunity) -> float:
    """
    Score based on estimated TAM/SAM.
    Larger markets = higher score, but with diminishing returns.
    """

    # Estimate TAM from industry/problem data
    # Use industry-specific benchmarks
    tam_estimate = estimate_tam(
        industries=opportunity.affected_industries,
        problem=opportunity.specific_problem
    )

    # Scoring curve: sigmoid, centered at $1B TAM
    # $500M → 0.35, $1B → 0.50, $5B → 0.80, $10B → 0.90, $50B+ → 0.95
    if tam_estimate < 100e6:
        score = 0.20
    elif tam_estimate < 500e6:
        score = 0.35 + (tam_estimate / 500e6) * 0.15
    elif tam_estimate < 5e9:
        score = 0.50 + (min(tam_estimate, 5e9) / 5e9) * 0.30
    elif tam_estimate < 50e9:
        score = 0.80 + (min(tam_estimate, 50e9) / 50e9) * 0.15
    else:
        score = 0.95

    confidence = "high" if tam_estimate can be triangulated from multiple sources else "medium" or "low"

    return {
        "score": min(1.0, score),
        "estimate": f"${tam_estimate / 1e9:.1f}B",
        "confidence": confidence,
        "reasoning": f"TAM estimate based on market size of {opportunity.target_market}"
    }
```

**Data sources for TAM estimation:**
- Industry reports (Gartner, McKinsey, analysts)
- Government labor statistics (BLS: number of workers in role)
- Public company financials (revenue in segment)
- Bottom-up: number of potential customers × average contract value

**Examples:**
- Accounting AP automation: ~$2–5B SAM (280,000 AP teams in US × 20% addressable × $50K/year value)
- Customer support automation: ~$5–15B SAM (large TAM, many use cases)
- Medical underwriting: ~$500M–$1B SAM (smaller, specialized)

#### **Dimension 2: Signal Strength**

**Definition:** Quality and convergence of detected signals supporting this opportunity.

**Scoring logic:**

```python
def score_signal_strength(opportunity: Opportunity) -> float:
    """
    Score based on:
    - Number of independent signals
    - Strength of each signal (confidence)
    - Signal type diversity (multiple signal types = higher confidence)
    """

    signals = opportunity.enabling_signals

    if not signals:
        return 0.0  # No signals = no opportunity

    # Average signal strength
    avg_strength = mean([s.strength for s in signals])

    # Count unique signal types
    signal_types = set([s.signal_type for s in signals])
    type_diversity_bonus = min(0.15, 0.03 * (len(signal_types) - 1))  # +0.03 per additional type, max +0.15

    # Decay: signals older than 30 days have reduced weight
    recency_weight = 0.0
    for signal in signals:
        days_old = (now - signal.detected_at).days
        if days_old <= 7:
            weight = 1.0
        elif days_old <= 30:
            weight = 0.5 + 0.5 * (30 - days_old) / 23
        else:
            weight = 0.0  # Older signals don't count toward strength

        recency_weight += weight

    recency_factor = recency_weight / len(signals)

    # Combine: avg_strength is 60% of score, diversity is 20%, recency is 20%
    score = 0.6 * avg_strength + 0.2 * (0.5 + type_diversity_bonus) + 0.2 * recency_factor

    confidence = "high" if len(signals) >= 3 else "medium" if len(signals) >= 2 else "low"

    return {
        "score": min(1.0, score),
        "count": len(signals),
        "signal_types": list(signal_types),
        "confidence": confidence,
        "reasoning": f"{len(signals)} converging signals with {avg_strength:.2f} avg strength, {len(signal_types)} distinct types"
    }
```

**Rationale:**
- Multiple signals = stronger evidence
- Diverse signal types (tech breakthrough + customer pain + regulatory shift) = triangulated confidence
- Recent signals = market moving now
- Minimum 2 signals required to count as "opportunity" (one signal is noise)

#### **Dimension 3: Agent Readiness**

**Definition:** How much of the value chain can be automated by agents.

**Scoring logic:**

```python
def score_agent_readiness(opportunity: Opportunity) -> float:
    """
    Use agent_readiness assessment from Market Classifier.

    High agent-readiness = more defensible moat (agents are core to ops)
    Low agent-readiness = easier to get started, but competitors can catch up
    """

    readiness = opportunity.agent_readiness.score
    breakdown = opportunity.agent_readiness.breakdown

    # Boost score if operations automation is very high (50%+ of all work)
    operations_weight = breakdown.get("operations", 0.0)
    if operations_weight > 0.80:
        ops_bonus = 0.05
    elif operations_weight > 0.60:
        ops_bonus = 0.02
    else:
        ops_bonus = 0.0

    # Penalty if customer-facing work is too high (hard to automate trust)
    customer_facing_weight = breakdown.get("customer_facing", 0.0)
    if customer_facing_weight > 0.70:
        customer_penalty = -0.05
    elif customer_facing_weight > 0.50:
        customer_penalty = -0.02
    else:
        customer_penalty = 0.0

    score = readiness + ops_bonus + customer_penalty

    confidence = "high" if readiness >= 0.70 else "medium" if readiness >= 0.50 else "low"

    return {
        "score": min(1.0, max(0.0, score)),
        "baseline_readiness": readiness,
        "confidence": confidence,
        "reasoning": f"Core operations {operations_weight:.0%} automatable; customer-facing {customer_facing_weight:.0%}"
    }
```

**Why this matters:**
- High agent-readiness opportunities are structurally defensible (hard for competitors to catch up if agents are core to your business model)
- Low agent-readiness means "nice to have agents" vs. "agents are the whole business"

#### **Dimension 4: Competitive Density**

**Definition:** How crowded is the space already? How many incumbents and startups compete?

**Scoring logic:**

```python
def score_competitive_density(opportunity: Opportunity) -> float:
    """
    Score inversely to competitive density. Fewer competitors = higher score.
    BUT: A completely empty market is suspicious (maybe no need).

    Goldilocks zone: 3–10 significant competitors.
    """

    # Count current competitors
    # Use Crunchbase, G2, market research
    competitors = query_competitors(
        market=opportunity.target_market,
        problem=opportunity.specific_problem
    )

    num_competitors = len(competitors)

    # Scoring curve
    if num_competitors == 0:
        score = 0.40  # Empty market = suspicious
    elif num_competitors <= 3:
        score = 0.85  # Very few competitors = good
    elif num_competitors <= 10:
        score = 0.70 + 0.15 * (10 - num_competitors) / 10  # Goldilocks
    elif num_competitors <= 20:
        score = 0.55
    elif num_competitors <= 50:
        score = 0.35
    else:
        score = 0.15  # Very crowded

    # Competitor strength assessment
    # Are they well-funded? Well-positioned? Or weak?
    avg_funding = mean([c.funding_raised for c in competitors])
    if avg_funding > 100e6:
        funding_penalty = -0.10
    elif avg_funding > 50e6:
        funding_penalty = -0.05
    else:
        funding_penalty = 0.0

    confidence = "high" if num_competitors > 0 else "low"

    return {
        "score": min(1.0, max(0.0, score + funding_penalty)),
        "current_players": num_competitors,
        "avg_funding": f"${avg_funding / 1e6:.0f}M",
        "confidence": confidence,
        "reasoning": f"{num_competitors} competitors (well-funded avg ${avg_funding / 1e6:.0f}M); space {'crowded' if num_competitors > 20 else 'moderately populated' if num_competitors > 10 else 'under-exploited'}"
    }
```

**Rationale:**
- No competitors → market might not exist or be too hard
- 3–10 competitors → validated market, room for new player
- 20+ competitors → difficult to differentiate; need strong moat
- Well-funded competitors → faster to respond, harder to compete on features

#### **Dimension 5: Timing Confidence**

**Definition:** How confident are we that the window is open NOW (not 2 years ago, not 2 years from now)?

**Scoring logic:**

```python
def score_timing_confidence(opportunity: Opportunity) -> float:
    """
    Score based on:
    - Signal recency (recent signals = market moving now)
    - Technology readiness (required tech is mature enough)
    - Regulatory alignment (favorable regulation or favorable regulatory gap)
    - Competitive momentum (are others launching in this space?)
    """

    # Recency: how recent are the enabling signals?
    signal_ages = [(now - s.detected_at).days for s in opportunity.enabling_signals]
    median_signal_age = median(signal_ages)

    if median_signal_age < 14:
        recency_score = 0.95
    elif median_signal_age < 30:
        recency_score = 0.85
    elif median_signal_age < 90:
        recency_score = 0.60
    else:
        recency_score = 0.30  # Old signals, maybe window has closed

    # Technology readiness: are the required tech capabilities mature?
    tech_readiness = assess_technology_readiness(opportunity.key_technologies)
    # Returns 0.0–1.0 based on maturity, availability, cost, etc.

    # Regulatory: is regulation favorable or neutral?
    regulatory_alignment = assess_regulatory_alignment(opportunity.target_market)
    # Returns 1.0 (favorable), 0.5 (neutral), 0.0 (hostile)

    # Competitive momentum: are others launching?
    competitor_momentum = assess_recent_competitor_launches(opportunity.target_market)
    # Returns 0.0–1.0 based on recent funding/launch activity in space

    score = 0.4 * recency_score + 0.3 * tech_readiness + 0.2 * regulatory_alignment + 0.1 * competitor_momentum

    confidence = "high" if median_signal_age < 30 else "medium"

    return {
        "score": min(1.0, score),
        "confidence": confidence,
        "recent_signals_age_days": median_signal_age,
        "tech_readiness": tech_readiness,
        "regulatory": regulatory_alignment,
        "competitor_momentum": competitor_momentum,
        "reasoning": f"Signals {median_signal_age} days old; tech readiness {tech_readiness:.1f}; regulatory {['hostile', 'neutral', 'favorable'][int(regulatory_alignment * 2)]}"
    }
```

**Rationale:**
- Timing is critical: entering a market 2 years too early is as bad as 2 years too late
- Recent signals indicate market movement
- Technology must be mature enough to ship (not bleeding-edge research)
- Regulation can create openings or close doors

#### **Dimension 6: Market Momentum**

**Definition:** Is the opportunity gaining traction? Is this a trend or a one-off?

**Scoring logic:**

```python
def score_market_momentum(opportunity: Opportunity) -> float:
    """
    Score based on signal frequency trends over time.
    Are signals arriving more frequently (accelerating) or less frequently (declining)?
    """

    # Query signals for this market opportunity from the past 60 days
    signals_30d = db.query_signals(opportunity_id=opportunity.id, created_since=now - 30.days)
    signals_60d = db.query_signals(opportunity_id=opportunity.id, created_since=now - 60.days)

    signal_freq_30d = len(signals_30d)
    signal_freq_60d = len(signals_60d) - signal_freq_30d  # signals from 30–60 days ago

    if signal_freq_30d == 0 and signal_freq_60d == 0:
        return {
            "score": 0.5,  # Neutral; too new to assess
            "trend": "unknown",
            "reasoning": "Insufficient history"
        }

    # Trend: is frequency increasing or decreasing?
    if signal_freq_30d > signal_freq_60d:
        trend = "accelerating"
        trend_bonus = 0.15
    elif signal_freq_30d == signal_freq_60d:
        trend = "steady"
        trend_bonus = 0.0
    else:
        trend = "declining"
        trend_bonus = -0.15

    # Baseline score from frequency
    # 0 signals/month → 0.2, 1–2/month → 0.5, 3–5/month → 0.7, 5+/month → 0.85
    signal_rate = signal_freq_30d / 30
    if signal_rate < 0.05:
        base_score = 0.2
    elif signal_rate < 0.1:
        base_score = 0.5
    elif signal_rate < 0.2:
        base_score = 0.7
    else:
        base_score = 0.85

    confidence = "high" if signal_freq_60d >= 2 else "medium" if signal_freq_30d >= 1 else "low"

    return {
        "score": min(1.0, max(0.0, base_score + trend_bonus)),
        "trend": trend,
        "signal_frequency_30d": signal_freq_30d,
        "signal_frequency_60d": signal_freq_60d,
        "confidence": confidence,
        "reasoning": f"Signal frequency {signal_freq_30d:.1f}/month, trend is {trend}"
    }
```

**Rationale:**
- Single signals can be noise
- Multiple signals over time indicate real market movement
- Accelerating signals indicate momentum; declining signals indicate window closing

### 4.2 Composite Score Calculation

Combine the six dimensions into a final score:

```python
def compute_composite_score(opportunity: Opportunity) -> float:
    """
    Weighted average of six dimensions.

    Weights reflect relative importance:
    - Signal Strength (30%): Is the data strong?
    - Timing Confidence (25%): Is the window open NOW?
    - Agent Readiness (20%): Can this be automated?
    - Market Size (15%): Is it big enough?
    - Competitive Density (5%): How crowded?
    - Market Momentum (5%): Is it accelerating?
    """

    scores = {
        "signal_strength": score_signal_strength(opportunity),
        "timing_confidence": score_timing_confidence(opportunity),
        "agent_readiness": score_agent_readiness(opportunity),
        "market_size": score_market_size(opportunity),
        "competitive_density": score_competitive_density(opportunity),
        "market_momentum": score_market_momentum(opportunity),
    }

    weights = {
        "signal_strength": 0.30,
        "timing_confidence": 0.25,
        "agent_readiness": 0.20,
        "market_size": 0.15,
        "competitive_density": 0.05,
        "market_momentum": 0.05,
    }

    composite = sum([scores[k]["score"] * weights[k] for k in scores.keys()])

    return {
        "composite_score": min(1.0, composite),
        "dimensions": scores,
        "weights": weights
    }
```

### 4.3 Ranking & Thresholding

```python
def rank_opportunities():
    """
    Score all opportunities and assign ranks.
    Apply Phase 0 gate threshold.
    """

    opportunities = db.query_opportunities()

    scored_opportunities = []
    for opp in opportunities:
        result = compute_composite_score(opp)
        opp.composite_score = result["composite_score"]
        opp.dimensions = result["dimensions"]
        scored_opportunities.append(opp)

    # Sort by composite score (descending)
    ranked = sorted(scored_opportunities, key=lambda o: o.composite_score, reverse=True)

    # Assign ranks and determine threshold status
    gate_threshold = config.get("phase_0_gate_threshold", 0.70)

    for rank, opp in enumerate(ranked, start=1):
        opp.rank = rank

        if opp.composite_score >= gate_threshold + 0.10:
            opp.threshold_status = "above_gate_threshold"
            opp.recommended_action = "promote_to_phase_1"
        elif opp.composite_score >= gate_threshold:
            opp.threshold_status = "at_gate_threshold"
            opp.recommended_action = "human_review"
        else:
            opp.threshold_status = "below_gate_threshold"
            opp.recommended_action = "continue_monitoring"

        db.save(opp)

    logger.info(f"Ranked {len(ranked)} opportunities; {sum([1 for o in ranked if o.threshold_status == 'above_gate_threshold'])} above gate")
```

### 4.4 Score Stability & Smoothing

To avoid ranking thrashing (opportunities jumping up/down daily due to single signals), apply exponential smoothing:

```python
def smooth_score(opportunity: Opportunity) -> float:
    """
    Apply exponential smoothing to composite score.

    new_score = 0.7 * current_composite + 0.3 * historical_avg
    """

    current_composite = opportunity.composite_score
    historical_scores = [s["score"] for s in opportunity.score_history[-10:]]  # last 10 days

    if not historical_scores:
        return current_composite

    historical_avg = mean(historical_scores)

    smoothed_score = 0.7 * current_composite + 0.3 * historical_avg

    return smoothed_score
```

---

## 5. Data Sources & Integrations

**Direct dependencies:**
- Market Classifier (0.3) — opportunity candidates
- Signal Detector (0.2) — signal details (for accessing full signal data)

**Optional external integrations for enrichment:**
- Crunchbase API — competitor research, funding data
- G2/Capterra APIs — customer review sentiment, pricing comparison
- Industry analyst reports (Gartner, IDC, etc.) — market size validation
- LinkedIn data (via LinkedIn API) — hiring trends as momentum proxy
- Patent databases — tech maturity assessment

**No new external APIs required** if Market Classifier has populated opportunity with sufficient data.

---

## 6. Agent Prompt Strategy

The Opportunity Ranker uses agent reasoning for:
- Narrative synthesis (generating thesis and summary)
- Market size estimation (bottom-up reasoning)
- Risk/strength identification (qualitative assessment)
- Sensitivity analysis (what if scores change)

### 6.1 System Prompt for Opportunity Synthesis Agent

```
You are a venture analyst and opportunity scout specializing in AI-driven disruption.

Your task: Given a market opportunity and its multi-dimensional scores, synthesize a
compelling narrative that explains:
1. Why this is an attractive opportunity RIGHT NOW
2. What could go wrong
3. Why or why not a team should pursue this

# Input
You'll receive an opportunity with:
- Market opportunity description
- 6 dimension scores (market size, signal strength, agent readiness, etc.)
- Enabling signals (concrete evidence supporting the opportunity)
- Competitive landscape

# Output
Produce a concise narrative covering:
1. **One-liner:** 8–10 word summary of the opportunity
2. **Thesis:** 3–5 sentences explaining the market opportunity and why it's winnable
3. **Key Strengths:** 3 major advantages (signal strength, market conditions, tech fit, etc.)
4. **Key Risks:** 3 major risks (incumbent response, regulation, tech immaturity, etc.)

# Guidelines

**Be specific.** Don't say "growing market." Say "$5B accounting TAM, growing 8% annually."

**Connect signals to narrative.** Don't list scores in isolation. Explain how they tell a story.

**Address skeptics.** What would make someone doubt this is real? Address it.

**Consider timing.** Why is this happening NOW? What changed? Why not 5 years ago?

Example good output:

One-liner: "AI agents for accounts payable automation"

Thesis: The convergence of three forces makes AP automation a $1–2B opportunity
right now: (1) Vision-language models are production-ready (GPT-4 Vision, Gemini
Vision); (2) AP teams still spend 25–40% of time on manual invoice processing; (3)
EU regulation classifies automation as low-risk, removing a regulatory headwind. The
next 18 months are critical—incumbents (Coupa, SAP Concur) will respond if they
realize the threat, but there's a 12-18 month window for a focused agent-first company
to establish product-market fit and customer lock-in before competitive response.

Key Strengths:
- Multiple converging signals (tech breakthrough + customer pain + regulatory shift)
  with 90%+ confidence validates the opportunity is real
- 95% of AP operations work is automatable via agents, creating a structural cost
  advantage of 70–80% vs. human-based competitors
- Proven customer pain (documented in Reddit, G2 reviews, support forums) means
  demand signal is real, not theoretical

Key Risks:
- Incumbent response: Coupa and SAP could integrate agent capabilities within 12–18
  months, using their installed base and relationships to defend; this is a timing race
- Regulatory uncertainty: While EU Act is favorable, future regulations could limit
  agent autonomous decision-making or require human audit trails, raising costs
- Integration complexity: AP integrates with ERP (SAP, Oracle), procurement (Ariba),
  and vendor databases; getting these integrations right is non-trivial and could
  delay scaling

Be honest. If a dimension scores low, say so. Don't BS.
```

### 6.2 Invocation Pattern

```python
async def synthesize_opportunity_narrative(opportunity: Opportunity) -> Dict:
    """
    Invoke LLM to generate narrative for opportunity.
    Synthesizes quantitative scores into qualitative story.
    """

    scores_summary = f"""
    Market Size: {opportunity.dimensions["market_size"]["estimate"]} TAM
    Signal Strength: {opportunity.dimensions["signal_strength"]["score"]:.2f} (based on {opportunity.dimensions["signal_strength"]["count"]} signals)
    Agent Readiness: {opportunity.dimensions["agent_readiness"]["score"]:.2f}
    Competitive Density: {opportunity.dimensions["competitive_density"]["current_players"]} players
    Timing Confidence: {opportunity.dimensions["timing_confidence"]["score"]:.2f}
    Market Momentum: {opportunity.dimensions["market_momentum"]["trend"]} (signals {opportunity.dimensions["market_momentum"]["signal_frequency_30d"]:.1f}/month)
    """

    signals_summary = "\n".join([
        f"- {s.signal_type}: {s.title} (confidence: {s.confidence:.2f})"
        for s in opportunity.enabling_signals[:5]  # Top 5 signals
    ])

    prompt = f"""
    {OPPORTUNITY_SYNTHESIS_PROMPT}

    Market Opportunity: {opportunity.name}

    Problem: {opportunity.specific_problem}

    Dimension Scores:
    {scores_summary}

    Supporting Signals:
    {signals_summary}

    Generate a synthesized narrative: one-liner, thesis, 3 key strengths, 3 key risks.
    """

    response = await llm_client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}]
    )

    narrative = json.loads(response.content[0].text)
    return narrative
```

---

## 7. Error Handling & Edge Cases

| Scenario | Handling |
|----------|----------|
| **Opportunity has no enabling signals** | Don't rank; archive as "invalid". Require minimum 1 signal to create opportunity. |
| **TAM estimate is very uncertain** | Lower market_size score confidence to "low"; still compute score, but flag for review. |
| **Very few competitors but massive TAM** | Score high overall, but flag "empty market" in notes. Market might not exist. |
| **All signals are stale (>90 days old)** | Lower timing_confidence score; market may have already moved. |
| **Opportunity is completely new** | score_history is empty; skip smoothing; use current_composite directly. |
| **LLM synthesis fails or hallucinates** | Fallback to template-based narrative. Manually review synthesized narratives quarterly. |
| **Score changes dramatically day-to-day** | Smoothing should dampen this. If still thrashing, investigate; may indicate real market shift or scoring model issue. |
| **Tie scores** (two opportunities with identical composite scores) | Break tie by most recent signal date (newer signals = current market). |

---

## 8. Performance & Scaling

**Expected throughput:**
- Score 100–200 active opportunities
- Update scores daily (or as new signals arrive)
- Compute latency: <500ms per opportunity

**Latency requirements:**
- Composite score computation: <1 second per opportunity
- Full ranking run: <30 seconds for 200 opportunities
- Individual scores queryable: <100ms

**Scaling strategy:**

1. **Batch processing:** Run ranking daily (not per-signal)
2. **Caching:** Cache competitor counts, TAM estimates, technology readiness assessments
3. **Async synthesis:** Generate narratives asynchronously (doesn't block ranking)
4. **Indexing:** Index opportunities by composite_score for fast top-K queries

---

## 9. Dependencies

**Depends on:**
- Market Classifier (0.3) — opportunity candidates + agent readiness assessments
- Signal Detector (0.2) — signal details and frequencies
- Configuration (gate thresholds, scoring weights)

**Depended on by:**
- Watchlist Publisher (0.5) — consumes ranked opportunities
- Phase 1 Ideation (receives top opportunities)
- Human review dashboard

---

## 10. Success Metrics

1. **Score calibration:** Opportunities scoring >0.85 move to Phase 1 and validate well (>70% receive "go" in Phase 2)
2. **Ranking stability:** Week-over-week top 10 changes by <3 positions (no thrashing)
3. **Gate effectiveness:** Opportunities above gate threshold (0.70+) are 3x more likely to validate than below-threshold
4. **Dimension balance:** No single dimension dominates; all six contribute meaningfully to final score
5. **Narrative quality:** Team finds synthesized narratives helpful and accurate (feedback survey)
6. **Scoring transparency:** Team can explain why opportunity X scored higher than Y (fully auditable)
7. **False positives rate:** <20% of ranked opportunities don't yield viable Phase 1 concepts (acceptable noise)

---

## 11. Implementation Notes

### Suggested Tech Stack

**Language:** Python 3.11+

**Core libraries:**
- `pydantic` — Score schema validation
- `numpy` — Numerical computations (scoring, weighting)
- `pandas` — Time-series analysis (score history, signal trends)
- `anthropic` or `openai` — LLM client for synthesis
- `sqlalchemy` or `pymongo` — Database access
- `redis` — Caching (competitor counts, TAM estimates)

**Infrastructure:**
- **Database:** PostgreSQL (primary) or MongoDB
- **Cache:** Redis (score history, competitor data)
- **Monitoring:** Prometheus (scoring metrics, latency)
- **Async tasks:** Celery or async Python (narrative synthesis)

### Code Structure

```
opportunity-ranker/
├── config/
│   ├── weights.yaml              # scoring dimension weights
│   ├── thresholds.yaml           # gate thresholds
│   └── scoring_curves.yaml       # score calibration curves
├── scorers/
│   ├── base.py                   # abstract scorer
│   ├── market_size.py            # TAM estimation + scoring
│   ├── signal_strength.py        # signal convergence scoring
│   ├── agent_readiness.py        # automation potential
│   ├── competitive_density.py    # competitor analysis
│   ├── timing_confidence.py      # window timing
│   └── market_momentum.py        # trend analysis
├── processors/
│   ├── composite.py              # combine dimensions → final score
│   ├── ranking.py                # sort, assign ranks, gate logic
│   ├── smoothing.py              # score stability
│   └── synthesis.py              # narrative generation (LLM)
├── storage/
│   ├── db.py                     # opportunity + score store
│   └── cache.py                  # caching layer
├── pipeline.py                   # main ranking loop
├── main.py                       # entry point
└── tests/
    ├── test_scorers.py           # unit tests for each dimension
    ├── test_composite.py         # weighting and combination tests
    ├── test_ranking.py           # ranking logic tests
    └── fixtures/
        ├── sample_opportunities.json
        └── sample_scores.json
```

### Key Implementation Details

**1. Scoring dimension template:**

```python
def score_dimension(opportunity: Opportunity, dimension_name: str) -> ScoreResult:
    """
    Template for scoring any single dimension.
    """
    # 1. Extract relevant data from opportunity
    # 2. Apply scoring logic/curve
    # 3. Assign confidence level
    # 4. Generate explanation
    # 5. Return ScoreResult

    return ScoreResult(
        score=0.0 to 1.0,
        confidence="high|medium|low",
        reasoning="explanation"
    )

class ScoreResult:
    score: float  # 0.0–1.0
    confidence: str  # high, medium, low
    reasoning: str  # explain the score
    metadata: dict  # extra context
```

**2. Composite score calculation:**

```python
def compute_composite_score(opportunity: Opportunity) -> CompositeScoreResult:
    dimensions = {
        "market_size": score_market_size(opportunity),
        "signal_strength": score_signal_strength(opportunity),
        "agent_readiness": score_agent_readiness(opportunity),
        "competitive_density": score_competitive_density(opportunity),
        "timing_confidence": score_timing_confidence(opportunity),
        "market_momentum": score_market_momentum(opportunity),
    }

    weights = {
        "market_size": 0.15,
        "signal_strength": 0.30,
        "agent_readiness": 0.20,
        "competitive_density": 0.05,
        "timing_confidence": 0.25,
        "market_momentum": 0.05,
    }

    composite = sum([dimensions[k].score * weights[k] for k in dimensions.keys()])

    # Apply smoothing
    smoothed = smooth_score(opportunity, composite)

    return CompositeScoreResult(
        composite_score=smoothed,
        dimensions=dimensions,
        weights=weights
    )
```

**3. Gate logic:**

```python
def apply_gate_logic(opportunity: Opportunity) -> str:
    gate_threshold = 0.70

    if opportunity.composite_score >= gate_threshold + 0.10:
        return "above_gate_threshold"  # Auto-promote to Phase 1
    elif opportunity.composite_score >= gate_threshold:
        return "at_gate_threshold"  # Human review recommended
    else:
        return "below_gate_threshold"  # Continue monitoring
```

**4. Score smoothing:**

```python
def smooth_score(opportunity: Opportunity, current_score: float) -> float:
    # Exponential smoothing to reduce day-to-day volatility
    score_history = [s.composite_score for s in opportunity.score_history]

    if not score_history:
        return current_score  # First score, no history to smooth

    historical_avg = mean(score_history[-10:])  # Last 10 days

    # Weighted average: 70% current, 30% historical
    smoothed = 0.7 * current_score + 0.3 * historical_avg

    return smoothed
```

### Deployment Considerations

1. **Scoring tuning:** Start with conservative weights. Adjust based on Phase 2 validation feedback.
2. **TAM estimation:** Build library of industry/problem TAM estimates; improve over time.
3. **Competitor database:** Maintain updated competitor list for each market (quarterly refresh).
4. **Calibration audits:** Every quarter, validate that opportunities scoring >0.85 do validate well. If not, adjust curves.
5. **Monitoring:**
   - Track distribution of scores (should be normal-ish, not all 0.5)
   - Alert if >3 opportunities change rank by >5 positions in a week (scoring instability)
   - Log all scoring decisions for auditability
6. **Manual overrides:** Allow human operators to adjust scores or gate status with comments for audit trail.

---

## Appendix: Example Scored Opportunity

```json
{
  "id": "opp_invoice_processing_001",
  "name": "AI-driven accounts payable automation",
  "rank": 3,
  "composite_score": 0.84,
  "dimensions": {
    "market_size": {
      "score": 0.75,
      "estimate": "$2–5B TAM",
      "confidence": "medium",
      "reasoning": "Based on 280,000 AP teams in US, $50K/year value per customer"
    },
    "signal_strength": {
      "score": 0.92,
      "count": 3,
      "signal_types": ["tech_breakthrough", "model_release", "customer_pain"],
      "confidence": "high",
      "reasoning": "3 converging signals with 0.88 average strength; recent (10 days old median)"
    },
    "agent_readiness": {
      "score": 0.82,
      "confidence": "high",
      "reasoning": "Operations 95% automatable (invoice receipt, extraction, categorization); customer-facing 50% (setup, exceptions)"
    },
    "competitive_density": {
      "score": 0.65,
      "current_players": 12,
      "confidence": "medium",
      "reasoning": "12 active competitors (e.g., Coupa, SAP Concur, Rossum); space not oversaturated but established"
    },
    "timing_confidence": {
      "score": 0.88,
      "confidence": "high",
      "recent_signals_age_days": 10,
      "tech_readiness": 0.92,
      "regulatory": 1.0,
      "reasoning": "Very recent signals; vision models production-ready; EU AI Act favorable"
    },
    "market_momentum": {
      "score": 0.70,
      "trend": "accelerating",
      "signal_frequency_30d": 2.5,
      "confidence": "medium",
      "reasoning": "2–3 signals per month, accelerating from 1–2/month in prior period"
    }
  },
  "summary": {
    "one_liner": "AI agents for accounts payable automation",
    "thesis": "Vision-language models are now production-grade, making invoice processing 95% automatable. The market is ripe: AP teams still spend 25–40% of time on manual work, and regulatory tailwinds (EU AI Act) remove barriers to agent deployment. A focused team can establish dominance in the next 12–18 months before incumbent vendors (Coupa, SAP) integrate agents into their platforms.",
    "key_strengths": [
      "Multiple converging signals (vision model release + customer pain + regulatory shift) with 90%+ confidence",
      "Massive agent-readiness: 95% of operations can be automated, creating structural 70–80% cost advantage",
      "Proven, documented customer pain across forums, reviews, support channels—demand is real, not theoretical"
    ],
    "key_risks": [
      "Incumbent response: SAP Concur and Coupa could integrate agents within 12–18 months using installed base",
      "Regulatory uncertainty: future rules could require human audit trails, raising costs and slowing deployment",
      "Integration complexity: ERP/procurement/vendor database integrations are non-trivial; could delay scaling"
    ]
  },
  "score_history": [
    {"date": "2024-11-20", "score": 0.81},
    {"date": "2024-11-27", "score": 0.83},
    {"date": "2024-12-04", "score": 0.84}
  ],
  "threshold_status": "above_gate_threshold",
  "recommended_action": "promote_to_phase_1",
  "metadata": {
    "last_scored_at": "2024-12-04T14:30:00Z",
    "score_version": 1,
    "weights_version": "default_v2"
  }
}
```
