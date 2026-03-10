# Concept Scorer Component (Phase 1.4)

## Purpose & Responsibility

The Concept Scorer evaluates and ranks all generated startup concepts against a consistent set of dimensions. It transforms the set of concept sketches from Concept Generator into a prioritized, scored list that guides the selection phase and provides rationale for why certain concepts are more promising than others.

**Core responsibilities:**
- Score each concept against 5–7 key evaluation dimensions
- Apply consistent, documented scoring rubrics
- Provide dimension-by-dimension breakdowns (not just a single composite score)
- Normalize scores and produce a ranked list
- Document the scoring rationale for each concept and dimension
- Flag high-risk assumptions for each concept
- Provide clear decision support for the human review gate

The output is a scored, ranked concept list with sufficient detail that a human reviewer can understand why concepts ranked as they did and can override if they have domain expertise.

---

## Inputs

**Primary Input:**
- **Concept Sketches** (from Concept Generator, 1.3)
  - 8–12 fully specified concepts, each with:
    - Problem addressed
    - Agent architecture
    - Customer value proposition
    - Initial positioning and pricing
    - Technical feasibility assessment

**Secondary Inputs:**
- **Landscape Report** (from Landscape Analyst, 1.1)
  - Incumbent positioning, pricing, market size
  - Value chain and barriers to entry

- **Pain Point Catalog** (from Pain Extractor, 1.2)
  - Pain severity and frequency
  - Willingness-to-pay signals
  - Customer personas

- **Phase 0 Signals** (enabling technology, market timing)

---

## Outputs

**Primary Output: Scored & Ranked Concept List (structured document)**

```json
{
  "market_id": "string",
  "market_name": "string",
  "scoring_date": "ISO 8601 date",
  "scoring_methodology": "string (description of approach)",
  "total_concepts_scored": "integer",

  "scoring_rubric": {
    "dimensions": [
      {
        "dimension": "string (e.g., 'Disruption Potential')",
        "weight": "percentage (out of 100%)",
        "scale": "1-10 or custom",
        "definition": "string (what this dimension measures)",
        "scoring_criteria": [
          {
            "score": "integer",
            "description": "string (what earns this score)"
          }
        ]
      }
    ],
    "total_weight": "100%",
    "composite_score_formula": "string (how are weighted scores combined?)"
  },

  "concept_scores": [
    {
      "rank": "integer",
      "concept_id": "string",
      "concept_name": "string",
      "composite_score": "number (0-100)",
      "composite_percentile": "number (how does this compare to other concepts?)",

      "dimension_scores": [
        {
          "dimension": "string",
          "weight": "percentage",
          "raw_score": "integer (0-10)",
          "weighted_score": "number",
          "rationale": "string (why this score?)",
          "evidence": "string (what evidence supports this score?)"
        }
      ],

      "key_strengths": [
        "string (what this concept does well)"
      ],

      "key_weaknesses": [
        "string (what risks or challenges)"
      ],

      "critical_assumptions": [
        {
          "assumption": "string",
          "confidence": "high|medium|low",
          "impact": "high|medium|low (if wrong, how much does it hurt?)",
          "validation_approach": "string (how to test this assumption)"
        }
      ],

      "scoring_comments": "string (overall assessment and any nuances)",

      "recommendation": "strong_advance|advance|marginal|reconsider|reject",
      "reasoning": "string (why this recommendation?)"
    }
  ],

  "top_concepts_summary": [
    {
      "rank": "integer",
      "concept_name": "string",
      "composite_score": "number",
      "one_liner": "string (why is this ranked here?)"
    }
  ],

  "dimension_analysis": {
    "disruption_potential": {
      "average_score": "number",
      "range": "string (min–max)",
      "insights": "string (which concepts are most disruptive?)"
    },
    "agent_readiness": {
      "average_score": "number",
      "range": "string",
      "insights": "string (which concepts best leverage agents?)"
    },
    "feasibility": {
      "average_score": "number",
      "range": "string",
      "insights": "string (which concepts are most buildable?)"
    },
    "differentiation": {
      "average_score": "number",
      "range": "string",
      "insights": "string (which concepts are most defensible?)"
    },
    "revenue_clarity": {
      "average_score": "number",
      "range": "string",
      "insights": "string (which concepts have clearest path to revenue?)"
    }
  ],

  "scoring_insights": {
    "high_consensus_concepts": [
      "string (concepts where all scorers/dimensions agree they're strong)"
    ],
    "controversial_concepts": [
      "string (concepts where there's disagreement or wide variance in dimension scores)"
    ],
    "assumption_risk_summary": [
      "string (critical assumptions shared across concepts, flagged for validation)"
    ],
    "recommendation_summary": "string (overall guidance for Concept Selector gate)"
  },

  "research_gaps": [
    {
      "gap": "string",
      "impact": "high|medium|low",
      "suggested_research": "string (how to fill before Phase 2?)"
    }
  ]
}
```

**Secondary Outputs:**
- **Score Card Template:** One-page summary for each concept (name, scores, recommendation)
- **Dimension Distribution Charts:** Visualization of score distribution across concepts by dimension
- **Assumption Risk Matrix:** 2x2 matrix of assumptions by confidence × impact

---

## Core Logic / Algorithm

### High-Level Scoring Process

1. **Define Scoring Rubric**
   - Select 5–7 key evaluation dimensions
   - Define weight for each dimension (sum to 100%)
   - Create detailed scoring criteria for each dimension (what earns 1 point? 5? 10?)
   - Ensure rubric is aligned with market context and company builder thesis

2. **Calibrate Scoring Anchors**
   - For each dimension, identify what "excellent", "good", "mediocre", and "poor" look like
   - Use existing companies or prior concepts as reference points if available
   - Document calibration so scoring is consistent

3. **Score Each Concept**
   - For each concept, evaluate on each dimension
   - Assign raw score (1–10 scale)
   - Document rationale and evidence

4. **Weight and Normalize**
   - Apply dimension weights to raw scores
   - Calculate composite score (weighted average)
   - Rank concepts by composite score

5. **Dimension Analysis**
   - For each dimension, analyze:
     - Which concepts excel? Which struggle?
     - What does this tell us about viability?
     - Are there dimension-specific risks?

6. **Critical Assumption Analysis**
   - For each concept, identify 2–3 critical assumptions
   - Rate confidence and impact
   - Flag assumptions that need validation in Phase 2

7. **Synthesize & Recommend**
   - Overall: Is this concept likely to work?
   - Recommendation: Advance to validation? Reconsider? Reject?
   - Notes: Key nuances for human reviewer

---

## Scoring Dimensions

### Recommended Dimension Set (adjust as needed per market)

**Dimension 1: Disruption Potential (Weight: 25%)**
- Measures: How fundamentally does this concept change the market? How much better/different is it vs. incumbents?
- Scoring criteria:
  - 9–10: Structural business model change; would force incumbent response; creates new market segment
  - 7–8: Significant operational improvement (40%+ cost reduction); new customer segment
  - 5–6: Meaningful improvement (20–40% advantage) but model is similar to incumbents
  - 3–4: Incremental improvement; unlikely to reshape market
  - 1–2: Minor feature addition; easily copied by incumbents

**Dimension 2: Agent Readiness (Weight: 20%)**
- Measures: What percentage of operations can be agent-handled from day 1? How core are agents to the value?
- Scoring criteria:
  - 9–10: 85%+ of value-creation work is agent-handled; agents are the competitive advantage
  - 7–8: 70–85% of work is agent-handled; agents are central to operations
  - 5–6: 50–70% of work is agent-handled; agents are significant but not all-in
  - 3–4: 30–50% of work is agent-handled; mostly human-centric with AI enhancement
  - 1–2: <30% of work is agent-handled; not really "agent-first"

**Dimension 3: Feasibility (Weight: 20%)**
- Measures: Can this be built with technology available today? Are there technical showstoppers?
- Scoring criteria:
  - 9–10: All required capabilities exist; low technical risk; proven approaches
  - 7–8: All capabilities exist; moderate technical integration complexity
  - 5–6: Core capabilities exist but some edge cases require research; moderate risk
  - 3–4: Some required capabilities are immature; would need 6–12 months R&D; moderate-high risk
  - 1–2: Depends on capabilities that don't exist; would require 18+ months or breakthroughs; high risk

**Dimension 4: Differentiation & Defensibility (Weight: 15%)**
- Measures: Why would competitors struggle to copy this? What creates sustainable advantage?
- Scoring criteria:
  - 9–10: Multiple defensibility mechanisms (data moat, switching costs, network effects); hard to commoditize
  - 7–8: Clear defensibility (proprietary data, switching costs); competitor response would take 2+ years
  - 5–6: Some differentiation (first-mover, switching costs) but could be commoditized in 1–2 years
  - 3–4: Minimal defensibility; incumbents could copy core logic in <12 months
  - 1–2: No defensibility; commoditized; competitors have inherent advantages

**Dimension 5: Revenue Clarity (Weight: 10%)**
- Measures: Is there an obvious, compelling way to charge money? Would customers pay?
- Scoring criteria:
  - 9–10: Clear revenue model; willingness-to-pay signals from pain catalog; pricing is defensible
  - 7–8: Clear revenue model; reasonable pricing; some validation of willingness to pay
  - 5–6: Revenue model is plausible but unproven; pricing may need market testing
  - 3–4: Revenue model is unclear or depends on adoption that's uncertain
  - 1–2: No clear way to monetize; would struggle to generate revenue

**Dimension 6: Market Fit (Weight: 10%)**
- Measures: Does this concept address a real, large, urgent pain? Target market size and urgency?
- Scoring criteria:
  - 9–10: Addresses top pain theme from catalog; large target market (100K+ potential customers); high urgency
  - 7–8: Addresses top 2–3 pain themes; sizeable market (50K+ customers); real urgency
  - 5–6: Addresses identifiable pain; moderate market (20K+ customers); moderate urgency
  - 3–4: Addresses a real pain but may be niche; smaller market (<20K); lower urgency
  - 1–2: Pain is unclear or niche; very small market; customers may not prioritize

*Note: Some markets may want different dimensions. Adjust to fit market context.*

---

## Data Sources & Integrations

### Scoring Reference Data
- **Landscape Report:** Incumbent positioning, market size, barriers
- **Pain Catalog:** Pain severity/frequency, customer willingness to pay
- **Market Data:** Industry reports, analyst estimates, competitive pricing
- **Technical Benchmarks:** LLM capability matrices, tool-use frameworks, integration difficulty

### Tools for Scoring
- **Scoring Database:** Store all dimension scores and rationales
- **Rubric Templates:** Standardized rubric definitions for consistency
- **Comparable Analysis:** Reference prior concepts or companies for calibration

---

## Agent Prompt Strategy

### System Prompt / Role Definition

```
You are a venture capital analyst and startup evaluator with deep expertise in
technology, markets, and competitive strategy. Your task is to evaluate startup
concepts against a consistent rubric and produce a transparent, well-reasoned ranking.

You score analytically and honestly. You distinguish between:
- Concepts that are genuinely disruptive vs. incremental
- Ideas that leverage agents well vs. ideas that just add "AI"
- Feasible concepts vs. those depending on breakthroughs
- Defensible business models vs. commoditizable ones

You score across multiple dimensions (disruption, feasibility, market fit, etc.)
rather than a single gut "like it / don't like it" judgment. This allows nuance:
a concept might score high on disruption but low on feasibility, which is important info.

When scoring, you:
1. Reference the concept's content directly (don't invent strengths/weaknesses)
2. Compare against incumbent approaches (not in a vacuum)
3. Use the rubric consistently (a 7 means the same thing for every concept)
4. Document your reasoning clearly (why did you give this score?)
5. Flag critical assumptions that might invalidate the score

Your scoring should help humans make better decisions, not replace their judgment.
```

### Task Structure & Prompting

**Phase 1: Rubric Definition & Calibration**
```
Define the scoring rubric for this market. Dimensions should be:
- Aligned with market context (from landscape and pain catalog)
- Distinct from each other (not overlapping)
- Comprehensive (cover what matters: disruption, feasibility, market fit, etc.)

I suggest:
- Disruption Potential (25%): How much does this change the market?
- Agent Readiness (20%): How much work do agents handle?
- Feasibility (20%): Can we build this with today's tech?
- Differentiation (15%): Why can't competitors copy it?
- Revenue Clarity (10%): Is there a clear path to money?
- Market Fit (10%): Does it address real, urgent pain?

For each dimension, define what 1/5/10 means:
- 10 = Excellent / clearly satisfies this criterion
- 5 = Adequate / moderately satisfies this criterion
- 1 = Poor / doesn't satisfy this criterion

Use specific, measurable descriptions (avoid vague language like "good").

Example for "Disruption Potential":
- 9–10: Structural business model change; incumbent response required; new market
- 7–8: Significant operational advantage (40%+ better); new customer segment
- 5–6: Meaningful advantage (20–40%) but similar business model
- 3–4: Incremental improvement
- 1–2: Minor feature; easily copied

Output: Full rubric with all dimensions and scoring criteria defined.
```

**Phase 2: Score Calibration**
```
Before scoring all concepts, calibrate your scoring using reference points.

For each dimension, identify:
1. What does a 9–10 look like in real companies? (examples)
2. What does a 5–6 look like? (examples)
3. What does a 1–2 look like? (examples)

This helps ensure scoring is consistent. Example for "Agent Readiness":
- 9–10: Tesla's autonomous driving (vehicle handles most driving autonomously)
- 5–6: Current tax software (software handles routine returns; escalates complex ones)
- 1–2: Grammarly (AI enhances human writing but doesn't replace the writer)

Document these reference points so you score consistently across all concepts.
```

**Phase 3: Score Each Concept**
```
For each concept, evaluate on each dimension:

TEMPLATE:
Concept: [Name]

DISRUPTION POTENTIAL (Weight 25%)
- Score: [1–10]
- Rationale: [Why this score? Compare to incumbents' approach]
- Evidence: [What in the concept description supports this?]

AGENT READINESS (Weight 20%)
- Score: [1–10]
- Rationale: [What % of work is agent-handled? Is this truly agent-first?]
- Evidence: [Agent architecture specification from concept sketch]

FEASIBILITY (Weight 20%)
- Score: [1–10]
- Rationale: [Are required capabilities available? Technical risks?]
- Evidence: [Reference to concept's feasibility assessment and AI capability matrix]

DIFFERENTIATION (Weight 15%)
- Score: [1–10]
- Rationale: [Why can't competitors copy this? Defensibility mechanisms?]
- Evidence: [Moats: data, switching costs, network effects, speed?]

REVENUE CLARITY (Weight 10%)
- Score: [1–10]
- Rationale: [Is pricing obvious? Is there willingness to pay?]
- Evidence: [Revenue model from concept + willingness-to-pay signals from pain catalog]

MARKET FIT (Weight 10%)
- Score: [1–10]
- Rationale: [Real pain? Large market? Urgent need?]
- Evidence: [Pain severity/frequency from catalog; estimated market size]

COMPOSITE SCORE: [Sum of (raw_score × weight) / 100]
Percentile: [Where does this rank among all concepts?]

KEY STRENGTHS: [What does this concept do particularly well?]
KEY WEAKNESSES: [What are the risks or challenges?]

CRITICAL ASSUMPTIONS:
1. Assumption: [What must be true?]
   Confidence: [High/Medium/Low]
   Impact: [If wrong, how much does it hurt?]
   Validation: [How would we test this in Phase 2?]
```

**Phase 4: Dimension Analysis**
```
After scoring all concepts:

For each dimension, analyze:
- Average score across all concepts
- Range (highest and lowest)
- Which concepts excel? Which struggle?
- Insights: What does this tell us about market viability?

Example: If "Feasibility" dimension has average score 6.5, with range 4–9:
- Insights: "Technical feasibility is a key differentiator. High-feasibility concepts (9) build
on proven LLM capabilities; low-feasibility ones (4) depend on immature vision/reasoning."
```

**Phase 5: Critical Assumption Analysis**
```
Across all concepts, identify:
- Shared assumptions (what do ALL concepts assume?)
- High-impact assumptions (if wrong, this concept fails?)
- Low-confidence assumptions (we're uncertain about these)

Flag these for Phase 2 validation.

Example: "All concepts assume customers will adopt AI agent-handled workflows. This is
a critical shared assumption (high impact) with medium confidence. Phase 2 validation
should explicitly test this through customer interviews."
```

**Phase 6: Recommendation & Synthesis**
```
For each concept, provide:

RECOMMENDATION: [Advance / Marginal / Reconsider / Reject]
- Advance: Top-tier; should move to Phase 2 validation
- Marginal: Could work but significant risks; might advance if human reviewer agrees
- Reconsider: Promising but needs refinement before validation
- Reject: Fundamental issues; unlikely to succeed

REASONING: [Why this recommendation? Key factors in the decision?]

Overall Synthesis:
- Which 2–3 concepts are most promising? Why?
- Are there common patterns or themes?
- What's the biggest risk across the portfolio?
- What would improve the top concepts?
```

### Few-Shot Examples

**Example 1: Scoring a Legal Tech Concept**

**Concept:** "Contract Intelligence Agent"

Scores:
- Disruption: 7 (significant improvement in research efficiency; incumbent response possible)
- Agent Readiness: 8 (85% of research is agent-handled; core to product)
- Feasibility: 9 (document understanding + LLM research are proven)
- Differentiation: 6 (data moat from firm feedback; but could be commoditized in 2 years)
- Revenue: 8 (clear pricing: $400/month per user; willingness to pay validated)
- Market Fit: 8 (addresses top pain: research time burden; large market: 50K+ lawyers)

Composite: (7 × 0.25) + (8 × 0.20) + (9 × 0.20) + (6 × 0.15) + (8 × 0.10) + (8 × 0.10) = 7.8

Recommendation: **Advance.** Clear value proposition, proven technology, sizeable market. Main risk is differentiation — similar concepts could emerge quickly.

**Example 2: Scoring a VC Due Diligence Concept**

**Concept:** "Deal Research Agent Suite"

Scores:
- Disruption: 9 (transforms deal process; incumbent manual approach would become obsolete)
- Agent Readiness: 7 (core research is agent-handled; but final judgment still human)
- Feasibility: 7 (LLM research proven; integration with VC data sources is moderate risk)
- Differentiation: 5 (data access is key moat; but large research databases are commoditizing)
- Revenue: 6 (pricing unclear: per-deal? subscription? Willingness to pay is high but model unproven)
- Market Fit: 9 (addresses top pain: 200+ hours per deal; urgent need; premium customer segment)

Composite: (9 × 0.25) + (7 × 0.20) + (7 × 0.20) + (5 × 0.15) + (6 × 0.10) + (9 × 0.10) = 7.4

Recommendation: **Advance.** High disruption and market fit. Revenue model and differentiation are risks; should be validated in Phase 2.

### Edge Case Handling

**Problem:** Two concepts have identical scores
- **Solution:** That's fine; tie-breaking happens at human review stage. Document nuances that might differentiate them (e.g., "Concept A has higher technical risk but better market fit").

**Problem:** A concept scores low on one dimension but the team feels it's still promising
- **Solution:** That's valid feedback. The scoring should help inform the decision, not override human judgment. Note in the score: "Low feasibility score reflects technology immaturity, but this could be addressed with a 12-month R&D investment."

**Problem:** Rubric doesn't fit the market (e.g., "Disruption Potential" isn't relevant in a highly innovative market)
- **Solution:** Adjust rubric. Score should reflect what matters in that market context.

**Problem:** Multiple scorers give widely different scores to the same concept
- **Solution:** This is useful information. Document the disagreement and flag the concept as "controversial." Have scorers discuss and reconcile, or note the different perspectives for human reviewer.

---

## Error Handling & Edge Cases

### Scoring Quality Issues

**Problem:** Scores are biased (e.g., consistently high on concepts addressing "obvious" pain)
- **Solution:** Use reference examples and rubric definitions to calibrate. Score blind (without knowing prior scores) to reduce anchoring bias.

**Problem:** Scoring lacks transparency (hard to understand why Concept A scored higher than B)
- **Solution:** Require written rationale for every score. Ensure dimension-by-dimension breakdown is clear so human can see where concepts diverge.

**Problem:** Critical assumption is missed or underestimated
- **Solution:** This is why secondary validation in Phase 2 is important. Scoring surface-level assumptions; Phase 2 goes deep. Flag highest-risk assumptions clearly.

### Dimension Issues

**Problem:** Two dimensions are overlapping (e.g., "Feasibility" and "Technical Risk" measure similar things)
- **Solution:** Consolidate. Use a cleaner rubric with non-overlapping dimensions.

**Problem:** Dimension weights don't reflect market priorities (e.g., weighting "Revenue Clarity" at 10% when market is very price-sensitive)
- **Solution:** Adjust weights to reflect market context. Weights should be set upfront based on market analysis, not arbitrary.

### Concept Issues

**Problem:** Concept is under-specified (not enough detail to score fairly)
- **Solution:** This is a Concept Generator problem. Scorers should flag concepts as "needs clarification" and send back for refinement.

**Problem:** Concept addresses a pain that might not be real/large
- **Solution:** Score low on "Market Fit" and flag for Phase 2 validation. That's what Phase 2 is for.

---

## Performance & Scaling

### Expected Throughput & Latency

- **Per-Concept Scoring Time:** 30–45 minutes (8–12 concepts = 4–8 hours total scoring work)
- **Expected Quality:** Consistent, transparent scoring with clear dimension breakdowns
- **Latency Requirement:** Should complete within 1 business day

### Parallelization

- **Multiple Scorers:** If using multiple scorers (different perspectives), parallelize scoring and reconcile
- **Dimension Assignment:** Can assign different scorers to score different dimensions, then aggregate

---

## Dependencies

### Upstream Dependencies
- **Concept Generator (1.3):** Consumes concept sketches
- **Landscape Analyst (1.1):** References for competitor benchmarking
- **Pain Extractor (1.2):** References for market fit assessment

### Downstream Dependencies
- **Concept Selector (1.5):** Consumes ranked scores; uses recommendations to inform selection
- **Phase 2 (Validation):** Selected concepts are validated; scoring provides hypothesis to validate

### External Dependencies
- **Rubric database:** Store scoring rubrics for consistency across markets
- **Reference data:** Historical scores, comparable companies for calibration

---

## Success Metrics

### Primary Metrics

1. **Scoring Consistency:** Multiple scorers rating the same concept produce similar scores (correlation > 0.85). ✓ = success
2. **Transparency:** For each concept and dimension, there's a documented rationale that explains the score. A human reviewer can understand the reasoning. ✓ = success
3. **Rubric Alignment:** All scores align with rubric definitions (a 7 means the same thing across all concepts). ✓ = success
4. **Recommendation Clarity:** Clear recommendation (Advance/Marginal/Reconsider/Reject) with documented reasoning. ✓ = success

### Secondary Metrics

5. **Dimension Accuracy:** After Phase 2 validation, scores on "Feasibility" and "Market Fit" dimensions correlate with validation results.
6. **Assumption Identification:** Critical assumptions flagged in scoring are validated in Phase 2; few surprises emerge.
7. **Ranking Stability:** If re-scoring same concepts weeks later, top-ranked concepts remain at top.

### How to Measure

- **During scoring:** Do scores align with rubric definitions? Are rationales clear?
- **After selection:** Did human reviewers agree with top-ranked concepts, or override significantly?
- **After Phase 2:** Did validated concepts match the scoring predictions (especially on Feasibility and Market Fit)?

---

## Implementation Notes

### Suggested Tech Stack

**Scoring Engine:**
- Python with Anthropic SDK (Claude Opus for detailed scoring and rationale)
- Agentic loop: Agent evaluates each concept, produces scores, provides rationales

**Scoring Management:**
- **PostgreSQL:** Store all scores, rationales, rubric definitions
- **MongoDB:** Flexible schema for storing concept scores with variable detail levels
- **Redis:** Cache rubrics and reference calibration data

**Analysis & Visualization:**
- **Pandas/NumPy:** Calculate composite scores, percentiles, statistics
- **Matplotlib/Plotly:** Visualize score distributions, dimension heatmaps
- **Seaborn:** Create score comparison matrices

**Output:**
- **Markdown/PDF:** Export scored concept list as readable document
- **JSON:** Structured export for downstream components

### Implementation Phases

**Phase 1: MVP (Week 1–2)**
- Implement basic scoring loop (evaluate concept against rubric)
- Calculate composite scores and rank
- Output: JSON list of scores by concept
- Manual human validation of rubrics

**Phase 2: Enhancement (Week 3–4)**
- Implement multi-scorer support (average or reconcile scores)
- Add dimension analysis (avg score per dimension, insights)
- Add recommendation logic (convert composite scores to recommendations)
- Assumption identification and flagging

**Phase 3: Optimization (Week 5+)**
- Scoring calibration tools (reference examples, anchoring aids)
- Visualization dashboard (score heatmaps, distribution charts)
- Explanation generation (natural language rationales)
- Comparison tools (score one concept against another)

### Code Patterns & Libraries

**Scoring Loop Pattern:**
```python
def score_concepts(concepts, rubric):
    """Score all concepts against rubric."""
    scores = []

    for concept in concepts:
        concept_score = {
            "concept_id": concept["id"],
            "concept_name": concept["name"],
            "dimension_scores": []
        }

        # Score each dimension
        for dimension in rubric["dimensions"]:
            raw_score = agent.score_dimension(
                concept,
                dimension,
                rubric
            )
            weighted_score = raw_score * (dimension["weight"] / 100)

            concept_score["dimension_scores"].append({
                "dimension": dimension["name"],
                "weight": dimension["weight"],
                "raw_score": raw_score,
                "weighted_score": weighted_score
            })

        # Calculate composite score
        composite = sum(d["weighted_score"] for d in concept_score["dimension_scores"])
        concept_score["composite_score"] = composite

        scores.append(concept_score)

    # Rank by composite score
    scores.sort(key=lambda x: x["composite_score"], reverse=True)
    return scores
```

**Rubric Definition Pattern:**
```python
RUBRIC = {
    "dimensions": [
        {
            "name": "Disruption Potential",
            "weight": 25,
            "definition": "How much does this change the market?",
            "criteria": {
                10: "Structural business model change; incumbent response required",
                8: "Significant operational advantage (40%+); new segment",
                6: "Meaningful advantage (20–40%); similar business model",
                4: "Incremental improvement",
                2: "Minor feature; easily copied"
            }
        },
        # ... other dimensions
    ]
}

def score_dimension(concept, dimension, rubric):
    """Score a single dimension for a concept."""
    prompt = f"""
    Evaluate this concept on '{dimension['name']}': {dimension['definition']}

    Rubric:
    {render_rubric_criteria(dimension['criteria'])}

    Concept:
    {render_concept(concept)}

    Score: [1–10]
    Rationale: [Why this score?]
    Evidence: [What supports this?]
    """

    result = agent.evaluate(prompt)
    return result["score"]
```

### Testing & Validation

- **Rubric validation:** Do scoring criteria clearly distinguish between score levels?
- **Consistency test:** Multiple independent scorers rate same concepts; check correlation
- **Reference test:** Score reference companies/concepts known to be high/medium/low quality
- **Dimension independence:** Check that dimensions aren't perfectly correlated (would indicate redundancy)

### Common Pitfalls to Avoid

1. **Single Number Scoring:** Avoid reducing everything to one "goodness" score. Dimension-by-dimension is more useful.
2. **Arbitrary Rubric:** Rubric should reflect market context and what matters, not generic "startup quality" criteria.
3. **Unconscious Bias:** Scores can be biased (e.g., favoring concepts that are easiest to build). Use blind scoring and rubric definitions to reduce bias.
4. **Inflated Scores:** Scorers often score higher than warranted (optimism bias). Use calibration and reference examples to anchor realistic scores.
5. **Unexplained Recommendations:** "Advance" or "Reject" recommendations should be tied to specific dimension scores and evidence, not gut feel.

---

## Example Output (Abbreviated)

**Input:**
- 8 concepts from Concept Generator
- Rubric with 6 dimensions

**Output: Top 3 Scored Concepts**

```markdown
## Concept Scores & Rankings

### 1. Contract Intelligence Agent (Composite: 7.8 / 10)

| Dimension | Raw Score | Weight | Weighted Score |
|-----------|-----------|--------|-----------------|
| Disruption Potential | 7 | 25% | 1.75 |
| Agent Readiness | 8 | 20% | 1.60 |
| Feasibility | 9 | 20% | 1.80 |
| Differentiation | 6 | 15% | 0.90 |
| Revenue Clarity | 8 | 10% | 0.80 |
| Market Fit | 8 | 10% | 0.80 |
| **Composite Score** | | | **7.8** |

**Key Strengths:**
- Strong on feasibility (proven LLM research capabilities)
- Clear revenue model ($400/month per user)
- Addresses top pain (research time burden)

**Key Weaknesses:**
- Differentiation could erode (competitors could copy)
- Assumes firms will adopt agent-first workflow

**Critical Assumptions:**
- Law firms will trust AI research enough to adopt agent-first workflows (Medium confidence, High impact)
- LLM research quality will remain accurate across contract types (High confidence)
- Integration with firm systems is feasible (Medium confidence, Medium impact)

**Recommendation:** **ADVANCE**
This concept has strong market fit, proven technology, and clear revenue model. Main risk is
differentiation; should validate in Phase 2 that firms would prefer this over building in-house
or using Westlaw/LexisNexis with existing tools. Recommend starting customer conversations
with top 5 target law firms to validate willingness to pay.

---

### 2. Deal Room Manager (Composite: 7.4 / 10)

| Dimension | Raw Score | Weight | Weighted Score |
|-----------|-----------|--------|-----------------|
| Disruption Potential | 7 | 25% | 1.75 |
| Agent Readiness | 7 | 20% | 1.40 |
| Feasibility | 8 | 20% | 1.60 |
| Differentiation | 7 | 15% | 1.05 |
| Revenue Clarity | 6 | 10% | 0.60 |
| Market Fit | 8 | 10% | 0.80 |
| **Composite Score** | | | **7.4** |

**Key Strengths:**
- High market fit (coordination friction affects 80%+ of deals)
- Good differentiation (active coordination vs. passive tools)
- Feasible with LLM + orchestration frameworks

**Key Weaknesses:**
- Revenue model less clear (per-deal? subscription? Pricing TBD)
- Agent readiness slightly lower (still requires human judgment on strategy)

**Critical Assumptions:**
- Deal coordinators will trust AI with 80% of coordination work (Medium confidence, High impact)
- Pricing model will be acceptable to law firms (Low confidence, Medium impact)
- Integration with email/Slack/case management systems is seamless (Medium confidence, Medium impact)

**Recommendation:** **ADVANCE**
Strong market fit and good feasibility. Main gaps are revenue model clarity and willingness
to pay validation. Recommend Phase 2 customer interviews focus on: (1) what firms would pay
for coordination automation, (2) biggest pain points in current deal coordination (prioritize).

---

### 3. Vertical Legal Assistant (Composite: 6.9 / 10)

| Dimension | Raw Score | Weight | Weighted Score |
|-----------|-----------|--------|-----------------|
| Disruption Potential | 6 | 25% | 1.50 |
| Agent Readiness | 7 | 20% | 1.40 |
| Feasibility | 9 | 20% | 1.80 |
| Differentiation | 8 | 15% | 1.20 |
| Revenue Clarity | 7 | 10% | 0.70 |
| Market Fit | 5 | 10% | 0.50 |
| **Composite Score** | | | **6.9** |

**Key Strengths:**
- Excellent feasibility (vertical focus reduces scope; higher success rate)
- Good differentiation (proprietary domain knowledge hard to copy)
- Strong in agent readiness (agents can handle 80%+ of work in vertical)

**Key Weaknesses:**
- Lower market fit (solves niche problem, not broad market pain)
- Lower disruption potential (domain-specific tool, not market transformation)
- Market size unclear (is this segment large enough?)

**Critical Assumptions:**
- M&A attorneys will adopt vertical tool over generic one (Medium confidence, Medium impact)
- Market size is large enough to justify ($10M+ TAM) (Low confidence, High impact)
- Proprietary M&A knowledge won't commoditize (Medium confidence, Medium impact)

**Recommendation:** **MARGINAL**
Good execution potential but market fit is unclear. Recommend Phase 2 validation focus on:
(1) How large is the M&A attorney market? (2) What's their willingness to pay for vertical tool?
(3) Can we build defensible data moat around M&A-specific training data? Could advance if Phase 2
validates market size and willingness to pay.
```

---

