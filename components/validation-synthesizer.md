# Validation Synthesizer Component Specification

## 1. Purpose & Responsibility

The **Validation Synthesizer** is the final gate of Phase 2. It aggregates all validation findings from the five preceding agents (Market Sizer, Competitive Analyst, Customer Validator, Feasibility Assessor, Economics Modeler) into a single, authoritative go/no-go recommendation.

This component doesn't generate new research—it synthesizes, cross-checks, and makes judgment calls about contradictions. Its core responsibility is to answer: **"Should this concept move to Phase 3 (Blueprint) for detailed development, or should it be archived?"**

The Validation Synthesizer owns:
- Integration of all Phase 2 findings
- Consistency checking across reports
- Contradiction resolution and trade-off analysis
- Confidence scoring and risk highlighting
- Go/no-go recommendation with clear rationale
- Early warning flags (what would break this concept)
- Pathway recommendations (if conditional, what needs to be proven)

## 2. Inputs

### Primary Inputs
All five Phase 2 component outputs:

1. **Market Size Report** (from Phase 2.1)
2. **Competitive Intelligence Report** (from Phase 2.2)
3. **Customer Validation Report** (from Phase 2.3)
4. **Feasibility Assessment Report** (from Phase 2.4)
5. **Unit Economics Model** (from Phase 2.5)

Plus original concept definition from Phase 1.

### Data Structure Input
```json
{
  concept_id: string,
  phase_2_reports: {
    market_sizer: {report_id, tam, sam, som, growth_trajectory, confidence},
    competitive_analyst: {report_id, competitive_landscape, vulnerabilities, advantages, confidence},
    customer_validator: {report_id, pain_validation, early_adopters, willingness_to_pay, confidence},
    feasibility_assessor: {report_id, feasibility_verdict, cost_estimate, risks, confidence},
    economics_modeler: {report_id, unit_economics_verdict, ltv_cac_ratio, breakeven_months, confidence}
  }
}
```

## 3. Outputs

### Primary Output
A **Validation Summary & Go/No-Go Recommendation** document:

```json
{
  report_id: string (UUID),
  concept_id: string,
  generated_at: ISO8601 timestamp,
  executive_recommendation: {
    verdict: "go" | "conditional_go" | "no_go",
    confidence_pct: number (0-100),
    confidence_level: "high" | "medium" | "low",
    recommendation_summary: string (1-2 sentences),
    key_rationale: [string] (top 3 reasons for verdict)
  },
  validation_scorecard: {
    category: string,
    score: number (0-10),
    confidence: "high" | "medium" | "low",
    narrative: string
  },
  phase_2_findings_summary: {
    market_sizing: {
      tam_estimate_usd: number,
      sam_estimate_usd: number,
      som_year_1_usd: number,
      market_assessment: string,
      risk_factors: [string],
      confidence: "high" | "medium" | "low"
    },
    competitive_landscape: {
      barriers_to_entry: "high" | "medium" | "low",
      incumbent_vulnerability: "high" | "medium" | "low",
      competitive_advantage_defensibility: "strong" | "moderate" | "weak",
      key_threat: string,
      summary: string
    },
    customer_demand: {
      pain_validation_strength: "strong" | "moderate" | "weak",
      early_adopter_readiness: "ready_now" | "readying_6m" | "longer_term",
      willingness_to_pay_confidence: "high" | "medium" | "low",
      market_timing: "favorable" | "neutral" | "unfavorable"
    },
    technical_feasibility: {
      verdict: "go" | "conditional" | "no_go",
      critical_risks: [string],
      buildability_timeline_months: number,
      key_uncertainty: string (if conditional)
    },
    unit_economics: {
      verdict: "strong" | "viable" | "marginal" | "unviable",
      ltv_cac_ratio: number,
      payback_period_months: number,
      breakeven_customer_count: number,
      margin_structure: string (e.g., "90% gross margin")
    }
  },
  cross_component_consistency: {
    market_size_vs_addressable_target: {
      alignment: "strong" | "moderate" | "weak",
      analysis: string,
      flag_if_misaligned: boolean
    },
    willingness_to_pay_vs_pricing_strategy: {
      alignment: "strong" | "moderate" | "weak",
      analysis: string
    },
    competitive_advantages_vs_feasibility: {
      alignment: "strong" | "moderate" | "weak",
      analysis: string,
      concern_if_misaligned: string
    },
    unit_economics_vs_market_size: {
      alignment: "strong" | "moderate" | "weak",
      analysis: string,
      example: string (e.g., "Market size $500M supports $10M ARR target by Year 3")
    }
  },
  key_validation_assumptions: [
    {
      assumption: string,
      confidence: "high" | "medium" | "low",
      if_wrong_by_50_pct: string (impact on verdict),
      mitigation_or_validation_path: string
    }
  ],
  highest_risk_factors: [
    {
      risk: string,
      severity: "critical" | "high" | "medium",
      likelihood: "high" | "medium" | "low",
      impact_on_verdict: string,
      early_warning_indicators: [string]
    }
  ],
  success_milestones_for_phase_3: [
    {
      milestone: string,
      description: string,
      measurable_target: string,
      timeline: string
    }
  ],
  areas_of_disagreement_or_uncertainty: [
    {
      aspect: string,
      report_1_finding: string,
      report_2_finding: string,
      synthesis_conclusion: string
    }
  ],
  recommendation_if_conditional_go: {
    condition: string (e.g., "Proceed to Phase 3 only if AI capability quality is validated within 4 weeks"),
    validation_approach: string,
    decision_criteria: string,
    timeline: string
  },
  go_to_phase_3_checklist: [
    {
      task: string,
      status: "complete" | "pending" | "blocked",
      owner: string (optional)
    }
  ],
  data_sources_consolidated: [
    {
      component: string (e.g., "market_sizer"),
      key_data_sources: [string],
      data_quality: "high" | "medium" | "low"
    }
  ],
  analyst_notes: string
}
```

### Secondary Output
Supporting documents:
- Validation scorecard visual (radar chart or table of 0-10 scores across dimensions)
- Risk register summary (top 5 risks with severity)
- Assumption sensitivity analysis (which assumptions would change the verdict)
- Phase 3 readiness checklist
- Executive briefing deck (1-2 slide summary for stakeholder review)

## 4. Core Logic / Algorithm

### Step 1: Parse and Validate All Input Reports

1. **Confirm all 5 reports are present** and complete
2. **Extract key metrics** from each:
   - Market Sizer: TAM, SAM, SOM, growth rate, confidence
   - Competitive Analyst: Competitive advantage magnitude, threat assessment, vulnerability
   - Customer Validator: Pain validation strength, WTP, early adopter readiness
   - Feasibility Assessor: Go/conditional/no-go, timeline, critical risks
   - Economics Modeler: LTV, CAC, LTV:CAC ratio, breakeven timeline, verdict

3. **Validate consistency of confidence levels** across reports
   - If all reports have "high" confidence → verdict confidence should be higher
   - If mixed confidence levels → verdict confidence should be "medium"
   - If any report has "no-go" or critical risk → overall confidence capped at "medium"

### Step 2: Build Validation Scorecard

Rate the concept across 8 key dimensions on a 0-10 scale:

**1. Market Size & Opportunity (0-10)**
- Score 9-10: TAM >$100M, SAM >$50M, growing at 20%+ CAGR
- Score 7-8: TAM $50-100M, SAM >$20M, growing 10-20% CAGR
- Score 5-6: TAM $10-50M, SAM $5-20M, growing 5-10% CAGR
- Score 3-4: TAM <$10M or stagnant growth
- Score 0-2: TAM clearly too small or shrinking
*Confidence multiplier: Apply confidence level (high = full score, medium = -1 point, low = -2 points)*

**2. Customer Pain & Demand Validation (0-10)**
- Score 9-10: Pain strongly validated, customers actively seeking solution, high WTP
- Score 7-8: Pain moderately validated, customers considering solutions, clear WTP
- Score 5-6: Pain weakly validated or demand signal mixed
- Score 3-4: Pain is real but customers not convinced to pay
- Score 0-2: Pain weak or customers indifferent
*Source: Customer Validator report*

**3. Competitive Positioning (0-10)**
- Score 9-10: Clear competitive advantage (defensible 2+ years), entering fragmented market or attacking complacent incumbent
- Score 7-8: Competitive advantage exists but moderate defensibility, some incumbent weakness
- Score 5-6: Competitive advantage exists but hard to defend, incumbent is viable alternative
- Score 3-4: Minimal competitive advantage, incumbents can copy in <12 months
- Score 0-2: No clear advantage, incumbents are superior or equivalent
*Source: Competitive Analyst report*

**4. Technical Feasibility (0-10)**
- Score 9-10: All tech exists, proven integrations, clear implementation path, <12 months to MVP
- Score 7-8: Tech mostly exists, some integrations TBD, <18 months to MVP
- Score 5-6: Some tech uncertain or integrations complex, 18-24 months to MVP
- Score 3-4: Significant technical uncertainty or long timeline (24+ months)
- Score 0-2: Critical technology doesn't exist, no clear path forward
*Source: Feasibility Assessor report*

**5. Unit Economics (0-10)**
- Score 9-10: LTV:CAC >10:1, payback <3 months, >80% gross margin, quick to breakeven
- Score 7-8: LTV:CAC 5-10:1, payback 3-6 months, 60-80% margin, breakeven <12 months
- Score 5-6: LTV:CAC 3-5:1, payback 6-12 months, 40-60% margin, breakeven 12-18 months
- Score 3-4: LTV:CAC <3:1 or payback >12 months (risky but possible)
- Score 0-2: Unit economics don't work or require unrealistic assumptions
*Source: Economics Modeler report*

**6. Go-to-Market Clarity (0-10)**
- Score 9-10: Clear early adopter segment, proven GTM channel, realistic CAC, fast customer acquisition path
- Score 7-8: Clear early adopter, GTM channel somewhat tested, CAC achievable
- Score 5-6: Early adopter exists but GTM approach has risks
- Score 3-4: Early adopter unclear or GTM approach unproven
- Score 0-2: No clear path to acquire customers
*Source: Competitive Analyst + Customer Validator reports*

**7. Risk Assessment (0-10) [Inverse scoring: lower risk = higher score]**
- Score 9-10: Minimal risks, all mitigatable, no showstoppers
- Score 7-8: Some risks but manageable with planning
- Score 5-6: Moderate risks with some uncertainty
- Score 3-4: Significant risks requiring careful management
- Score 0-2: Critical risks or showstoppers identified
*Source: Feasibility Assessor + cross-component analysis*

**8. Defensibility & Sustainability (0-10)**
- Score 9-10: Agent-first advantage is durable 3+ years, network effects or data moats, hard to replicate
- Score 7-8: Advantage lasts 2-3 years, some defensibility
- Score 5-6: Advantage lasts 12-18 months, easily replicated by well-funded incumbent
- Score 3-4: Advantage is temporary (<12 months) or easily copied
- Score 0-2: No defensibility, immediate incumbent response expected
*Source: Competitive Analyst + Feasibility Assessor reports*

**Composite Score:**
Average of 8 dimensions:
- 8-10: Strong validation → GO
- 6-7.9: Viable validation → CONDITIONAL GO or GO with caveats
- 4-5.9: Weak validation → CONDITIONAL GO or NO-GO
- <4: Insufficient validation → NO-GO

### Step 3: Cross-Component Consistency Checks

**Check 1: Market Size Alignment**
- Does the SAM estimate align with the early adopter segment size?
- Example: Customer Validator identifies 15,000 potential early adopters; Market Sizer estimates SAM includes 50,000 total customers. ✓ (15K is reasonable subset of 50K)
- Misalignment: Market Sizer says SAM=$500M (implying 100,000+ customers at $5K price); Customer Validator identifies only 5,000 early adopters. ✗ (Need to reconcile or flag ambiguity)

**Check 2: Willingness-to-Pay vs. Unit Economics**
- Does the price point assumed in economics match WTP from customer validation?
- Example: Economics assumes $2,000/month price; Customer Validator says WTP is $1,500-2,500. ✓ (Aligned)
- Misalignment: Economics assumes $1,000/month; Validator says WTP is only $300/month. ✗ (Economics breaks)

**Check 3: Competitive Advantage vs. Feasibility**
- Does the core competitive advantage depend on technology that the Feasibility Assessor flagged as uncertain?
- Example: Competitive advantage is "AI-driven, 70% faster review"; Feasibility says AI quality is marginal. ✗ (Risk: if AI doesn't work, advantage disappears)
- Alignment: Advantage is "agent oversight + human review hybrid"; Feasibility confirms agents + humans achievable. ✓

**Check 4: CAC Assumptions vs. Competitive Data**
- Does the CAC assumed in economics match the GTM insights from competitive analysis?
- Example: Economics assumes $100 CAC via self-serve web; Competitive Analyst notes similar product has $500+ CAC via sales. ✗ (Economics may be optimistic)

**Check 5: Unit Economics vs. Market Size**
- Do the economics scale to justify the market size opportunity?
- Example: Unit economics breaks even at 50 customers with $2K/month pricing; that's $1.2M ARR at breakeven. Market size is $500M TAM. ✓ (Market is 400x+ larger than breakeven scale)
- Misalignment: Unit economics require $100M ARR to break even; market is only $50M. ✗ (Economics don't work at market scale)

### Step 4: Identify Key Assumptions & Sensitivity

List the 5-7 most critical assumptions across all reports:

Example set:
```
Assumption 1: AI contract review achieves 95% accuracy (required for defensibility)
- From: Feasibility Assessor
- Confidence: Medium (benchmarks show 92-94% but not 95%)
- If wrong by 50% (AI only 48% accuracy): Competitive advantage eliminated, verdict flips to NO-GO
- Mitigation: 4-week R&D sprint to validate or pivot to 90% accuracy (still competitive)

Assumption 2: Monthly churn rate is 5% (not 8%)
- From: Economics Modeler
- Confidence: Medium (based on SaaS benchmarks, not this specific market)
- If wrong by 50% (8% churn instead of 5%): LTV drops 40%, breakeven pushed to Month 9 instead of Month 5
- Mitigation: Strong product, NPS targeting, customer success program

Assumption 3: Market size SAM is $840M (not $100M)
- From: Market Sizer
- Confidence: Medium (based on top-down analyst estimates + bottom-up customer counting, some uncertainty)
- If wrong by 50% (actual SAM $420M): Still a $400M+ market, verdict unchanged
- Mitigation: Actual market size discovered as pilot customers onboard

Assumption 4: Competitive advantage lasts 18+ months (not 6 months)
- From: Competitive Analyst
- Confidence: Medium-Low (depends on incumbent speed of response)
- If wrong by 50% (advantage lasts only 9 months): Still time to achieve scale, verdict probably unchanged
- Mitigation: Move fast, capture early adopters, build lock-in

Assumption 5: CAC is $358 blended (with 50% self-serve web, 30% sales, 20% partnership)
- From: Economics Modeler
- Confidence: Low (CAC not yet proven; based on benchmarks)
- If wrong by 100% (actual CAC $700): Payback extends to 2 months, still healthy
- Mitigation: Validate CAC in Phase 3 with pilot launch
```

### Step 5: Identify Highest-Risk Factors

Extract the top 3-5 risks that could invalidate the recommendation:

Example risk register:
```
Risk 1: AI quality insufficient (accuracy <90%)
- Likelihood: Medium
- Severity: CRITICAL (would eliminate competitive advantage)
- Mitigation: 4-week R&D validation required before Phase 3
- Early warning: First prototype accuracy benchmarks in Week 2

Risk 2: Incumbent price war response (competitors cut price 50%)
- Likelihood: High (incumbents have margin to sustain price war)
- Severity: HIGH (margins compress, profitability questioned)
- Mitigation: Build switching costs, focus on feature differentiation, capture early adopters fast
- Early warning: Competitor pricing changes, market commentary about price wars

Risk 3: Regulatory blocker (bar association says AI review cannot be offered)
- Likelihood: Low-Medium
- Severity: CRITICAL (product becomes illegal)
- Mitigation: Legal review during Phase 3, E&O insurance, human review backup
- Early warning: Regulatory inquiry, state bar opinions on AI in legal work

Risk 4: Data access issue (customers won't share contracts with AI due to privacy fear)
- Likelihood: Medium
- Severity: HIGH (customers won't adopt)
- Mitigation: Privacy-first approach (on-premise option, data encryption, SOC 2), security certifications
- Early warning: Pilot customer feedback, privacy objections during sales

Risk 5: Churn higher than modeled (8% vs. 5% assumption)
- Likelihood: Medium
- Severity: MEDIUM (economics still work but profitability delayed)
- Mitigation: Strong onboarding, customer success, NPS monitoring
- Early warning: Monthly NPS tracking, cohort retention curves
```

### Step 6: Determine Go/No-Go Verdict

**GO verdict criteria (all must be true):**
- Composite scorecard >7/10
- No critical/showstopper risks
- Market size >$10M SAM
- Unit economics viable (LTV:CAC >3:1, gross margin >40%)
- Feasibility assessment is "go"
- Customer pain is moderately-strongly validated
- Confidence level is "high" or "medium"

**CONDITIONAL GO verdict criteria (some met, with caveats):**
- Composite scorecard 5-7/10
- One or more conditions must be met before full go (e.g., "AI quality validation required")
- No showstopper risks identified, but significant uncertainties exist
- Risk mitigation path is clear and achievable in Phase 3
- Example: "Go to Phase 3 if AI accuracy reaches 92% in initial testing"

**NO-GO verdict criteria (any single criterion may disqualify):**
- Composite scorecard <5/10
- Feasibility assessment is "no-go" (critical technology missing)
- Market size SAM <$10M (too small to support founding team burn)
- Unit economics broken (LTV:CAC <1.5:1, payback >24 months)
- Customer pain validation is weak and no clear early adopters
- Critical, unmitigatable risk identified
- Market timing unfavorable (customers not ready for 2+ years)

### Step 7: Define Phase 3 Pathway

If verdict is GO or CONDITIONAL GO, articulate the pathway to Phase 3:

**For GO:**
- "Proceed directly to Phase 3 (Business Designer, Agent Architect, etc.)"
- No additional validation required
- Timeline: 4-6 weeks to complete Phase 3

**For CONDITIONAL GO:**
- "Proceed to Phase 3 with the following conditions:"
  1. Condition 1: Complete AI quality validation within first 2 weeks of Phase 3
  2. Condition 2: Conduct legal review with bar association to confirm regulatory path
  3. Condition 3: Validate early adopter willingness to pay via 5-10 customer conversations
- "If any condition fails, return to Phase 2 for re-assessment"
- Timeline: 4-6 weeks for Phase 3, with 2-week go/no-go decision at midpoint

**For NO-GO:**
- Archive concept with clear rationale
- Identify whether concept could be revived (e.g., "Revisit in 12 months if AI technology matures further")
- Note learnings for future concepts in similar categories

### Step 8: Synthesize Recommendation Narrative

Write a clear, compelling 2-3 paragraph summary that:
1. States the verdict clearly
2. Highlights the top 2-3 reasons for the verdict
3. Acknowledges major risks and how they'll be addressed in Phase 3
4. Calls out any major assumptions or uncertainties

Example:
```
VERDICT: CONDITIONAL GO

RECOMMENDATION:
Advance this concept to Phase 3 (Blueprint) with a clear milestone: validate AI contract
review accuracy reaches 92%+ within the first two weeks of Phase 3 development. The market
opportunity is substantial ($840M SAM, growing 15% CAGR), customer pain is well-validated
(strong frustration with incumbent pricing and slow feature development), and unit economics
are strong (LTV:CAC 65:1, 90% gross margins). Competitive advantage is defensible for 18-24
months through agent-first automation that reduces service delivery costs by 70% vs.
traditional models.

KEY RISKS:
(1) AI accuracy shortfall: If contract review accuracy cannot reach 92%, competitive
advantage disappears and the concept should be shelved. This is the primary gate for
proceeding to launch.
(2) Incumbent response: Competitors have sufficient margins to initiate a price war.
Phase 3 must plan for rapid customer acquisition and switching cost creation (integrations,
training, data lock-in) to defend against this.
(3) Regulatory uncertainty: Bar associations may restrict AI usage in contract review.
Legal review is critical in Phase 3; if bar association rules against AI, pivot to
"AI-assisted with human review" model.

NEXT STEPS:
In Phase 3, the Business Designer and Agent Architect will flesh out the detailed operating
model and build strategy, conditioned on successful AI validation. If validation succeeds,
timeline to market is 6-8 months; if it fails, the concept is archived.
```

## 5. Data Sources & Integrations

The Validation Synthesizer does not require external data sources; it integrates the outputs of Phase 2 agents. However, it may reference:

- **Analyst reports** (for market size sanity checks)
- **Public comparable valuations** (to benchmark TAM vs. company valuations)
- **Industry press** (to assess competitive landscape and M&A activity)
- **Phase 1 outputs** (landscape report, pain catalog, concept definition for context)

## 6. Agent Prompt Strategy

### System Prompt Persona

The agent adopts the role of a **seasoned startup investment committee member** with experience in:
- Deal due diligence and go/no-go decisions
- Recognizing patterns from successful and failed startups
- Making calls in the face of incomplete information
- Balancing optimism (to fund promising ideas) with pessimism (to avoid sunk costs)

Key characteristics:
- Decisive but evidence-based
- Synthesizes across domains (market, tech, customer, finance)
- Identifies trade-offs and escalates ambiguities
- Confident in verdicts but explicit about caveats

### Core Instructions

```
You are a validation synthesizer. Your job is to integrate five independent Phase 2
validation reports into a single, clear go/no-go recommendation for Phase 3.

You are NOT doing original research. You are synthesizing, questioning, and deciding.

For a given concept with five Phase 2 reports:
1. Extract the key finding from each report (verdict, confidence, top risk)
2. Build a validation scorecard across 8 dimensions (market, pain, competition, tech, economics, GTM, risk, defensibility)
3. Check for consistency across reports:
   - Does market size align with early adopter segment size?
   - Does WTP align with pricing assumptions in economics?
   - Does competitive advantage depend on uncertain tech?
   - Does unit economics scale to market size?
4. Identify the 5-7 most critical assumptions across all reports
5. Highlight the top 3-5 risks that could invalidate the recommendation
6. Make a verdict: GO, CONDITIONAL GO, or NO-GO
   - Clearly state criteria met and not met
   - For CONDITIONAL GO, specify the conditions and decision timeline
7. Articulate the Phase 3 pathway: what happens next?
8. Write a clear recommendation narrative (2-3 paragraphs) suitable for founder/investor review

Output a JSON report matching the provided schema. Be direct: explain your thinking,
acknowledge uncertainties, and call out when reports conflict.
```

### Few-Shot Examples in Prompt

**Example 1: Contract Review Concept - CONDITIONAL GO**
```
Concept: AI Contract Review for Law Firms, $1,250/month

Phase 2 Findings (Extract):
- Market Sizer: TAM $10B, SAM $840M, growth 15% CAGR, confidence HIGH
- Competitive Analyst: Incumbents entrenched ($5K+/month), new entrant has 18-month advantage window, confidence MEDIUM
- Customer Validator: Pain strongly validated (reviews complaining about cost), WTP $1K-3K/month, early adopters ready now, confidence MEDIUM-HIGH
- Feasibility Assessor: AI quality marginal (94% vs. 95% required), 4-month R&D needed, other tech straightforward, confidence MEDIUM
- Economics Modeler: LTV:CAC 65:1, payback 1 week, 90% margin, breakeven 5 customers, confidence MEDIUM

Scorecard:
1. Market: 8/10 (large SAM, growth, but dependent on willingness-to-pay at premium pricing)
2. Customer Pain: 8/10 (strongly validated, clear WTP)
3. Competitive: 7/10 (incumbent vulnerability but capable response)
4. Technical: 6/10 (AI quality uncertain, other tech straightforward)
5. Unit Economics: 9/10 (exceptional margins and payback)
6. GTM: 7/10 (early adopters identified, GTM clear but needs to move fast)
7. Risk: 6/10 (AI quality and competitive response are key risks)
8. Defensibility: 7/10 (agent-first advantage is durable if executed well)

Composite: 7.25/10 → VIABLE VALIDATION

Cross-checks:
✓ Market size ($840M SAM) > breakeven scale (5 customers × $1,250 × 12 = $75K)
✓ WTP ($1K-3K) aligns with $1,250 pricing assumption
⚠ Competitive advantage depends on AI quality (Feasibility flagged as marginal)
✓ Unit economics scale (can support growing customer base profitably)

Key Assumptions (Risk Ranking):
1. [CRITICAL] AI accuracy reaches 92%+ (required for competitive advantage)
2. [HIGH] Churn stays ≤5% per month (otherwise profitability delayed)
3. [MEDIUM] Incumbents can't respond in <18 months (defensibility window)
4. [MEDIUM] CAC stays ~$358 blended (via self-serve + sales + partnership mix)
5. [LOW] Market size estimate accurate (even if wrong by 50%, SAM still $420M+)

Highest Risks:
1. [CRITICAL] AI accuracy insufficient → Competitive advantage eliminated, proceed NO-GO
   Mitigation: 4-week R&D validation in Phase 3, go/no-go decision at week 2
2. [HIGH] Incumbent response faster than expected → Margin compression via price war
   Mitigation: Move fast, lock in early adopters, build switching costs
3. [MEDIUM] Regulatory blocker (bar association restricts AI usage)
   Mitigation: Legal review in Phase 3, human-review fallback model

VERDICT: CONDITIONAL GO

CONDITION: Proceed to Phase 3 if AI accuracy validation within 4 weeks confirms ≥92% accuracy.
If accuracy <92%, return to Phase 2 and reassess (or pivot to "AI-assisted, human-reviewed" model).

PHASE 3 PATHWAY:
- Business Designer: Refine revenue model, pricing tiers, partnership strategy
- Agent Architect: Design operational model with AI automation + human escalation
- Go/No-Go Decision: Week 2 of Phase 3, based on AI accuracy validation results
- If validation succeeds: Full Phase 3 (4-6 weeks), then Phase 4 (Blueprint)
- If validation fails: Archive concept or pivot to hybrid model

RECOMMENDATION NARRATIVE:
This is a strong market opportunity with excellent unit economics, but success hinges on
a single technical assumption: AI contract review accuracy at 92%+. The Feasibility
Assessor's report indicates current models (Claude 3 Opus, GPT-4) achieve 92-94% accuracy
on contract parsing benchmarks, but the specific obligation extraction task required for
this concept is unproven. A 4-week R&D sprint in early Phase 3 will validate this
critical assumption.

If the AI quality validation succeeds, this concept has a strong path to market. The
customer pain is real and widespread, incumbents are vulnerable to a cost-focused
disruption (their $5K+ pricing is widely complained about in reviews), and the unit
economics support rapid scaling with minimal capital. Competitive advantage is defensible
for 18-24 months, giving enough time to establish market position before incumbents
respond.

The two key execution risks to monitor are (1) competitive response faster than expected,
and (2) regulatory pushback from bar associations. Both are manageable with proactive
strategy in Phase 3, but require executive attention.

Recommend: GREEN LIGHT to Phase 3, conditioned on AI validation.
```

**Example 2: Financial Planning App for Gen Z - NO-GO**
```
Concept: AI Financial Advisor for Gen Z, $15/month

Phase 2 Findings:
- Market Sizer: TAM $100B, SAM $15B (Gen Z investable assets), growth 40% CAGR, confidence MEDIUM
- Competitive Analyst: Wealthfront, Acorns, Robinhood all compete; new entrant has weak differentiation, confidence MEDIUM-HIGH
- Customer Validator: Pain moderately validated (Gen Z wants affordable advice), WTP $5-20/month, but uncertain if "nice-to-have" vs. "must-have", confidence LOW-MEDIUM
- Feasibility Assessor: Tech straightforward, but regulatory pathway uncertain (investment advice licensing), confidence LOW
- Economics Modeler: LTV:CAC 5:1 (tight), payback 2.1 months, 67% margin, breakeven at 300+ customers, confidence MEDIUM

Scorecard:
1. Market: 7/10 (large TAM but uncertain serviceable share)
2. Customer Pain: 5/10 (desire validated but commitment to pay is uncertain)
3. Competitive: 4/10 (well-funded, established competitors; new entrant weak differentiation)
4. Technical: 7/10 (straightforward to build, but regulatory path unclear)
5. Unit Economics: 4/10 (tight margins, long payback, requires massive scale for profitability)
6. GTM: 5/10 (channel uncertain; need viral/organic to keep CAC low; unproven)
7. Risk: 3/10 (regulatory risk high, competitive risk high, product-market fit uncertain)
8. Defensibility: 2/10 (no defensible advantage; easy for incumbents to copy features)

Composite: 4.6/10 → WEAK VALIDATION

Cross-checks:
✗ WTP ($5-20/month) is much lower than most SaaS ($50+/month), implying high volume/viral requirement
✗ Unit economics work only if CAC stays <$3.50 AND churn <8%—both uncertain and optimistic
✗ Market (TAM $100B) does not help; serviceable market is uncertain due to regulatory headwinds
✗ Competitive advantage is minimal; Acorns, Robinhood, Wealthfront can all add Gen Z features immediately

Key Assumptions (Risk Ranking):
1. [CRITICAL] Regulatory path is clear (can offer investment advice without RIA license)
   Confidence: LOW - Feasibility flagged this as uncertain
2. [CRITICAL] CAC stays low through viral/organic growth (cannot afford paid marketing at scale)
   Confidence: LOW-MEDIUM - Unproven; dependent on product virality
3. [HIGH] Willingness-to-pay is at upper end ($15-20/month, not $5/month)
   Confidence: LOW - Validator noted uncertainty; survey may overstate WTP
4. [MEDIUM] Churn is low at 8% per month (Gen Z products are notoriously churn-heavy)
   Confidence: MEDIUM-LOW - Gen Z retention is weak; 10-15% monthly churn is more realistic

Highest Risks:
1. [CRITICAL] Regulatory blocker: Cannot offer investment advice without SEC registration
   Likelihood: Medium (legal gray area; regulators are tightening rules)
   Impact: Product becomes illegal or requires expensive licensing
   Mitigation: Pivot to "financial education" (not advice) – but this weakens value prop
2. [CRITICAL] CAC inflation: Paid marketing will cost $5-10+ per user to reach Gen Z
   Likelihood: High (Facebook/TikTok CPMs are rising; customer acquisition is expensive)
   Impact: Economics break (payback extends to 4+ months)
   Mitigation: Requires massive viral coefficient (very hard to achieve)
3. [HIGH] Incumbent response: Acorns/Wealthfront add "Gen Z features" in 3-6 months
   Likelihood: Very High (easy feature copy)
   Impact: Differentiation disappears, pricing pressure
   Mitigation: Build faster and lock in early adopters (risky competitive game)
4. [MEDIUM] Product-market fit uncertain: Is financial planning a "must-have" or "nice-to-have" for Gen Z?
   Likelihood: Medium (different segments have different needs)
   Impact: If nice-to-have, churn will be very high; viability questioned
   Mitigation: Segment-specific onboarding and engagement strategy

VERDICT: NO-GO

RATIONALE:
This concept fails on multiple dimensions:
(1) Unit economics are marginal at best. LTV:CAC of 5:1 is acceptable, but only if churn stays at 8% and CAC stays at $3.50. Both assumptions are optimistic for a consumer app in a price-sensitive segment.
(2) Competitive landscape is congested. Acorns ($10/month), Robinhood (free), and Wealthfront ($30K minimum) all compete. New entrant has no defensible advantage and will face immediate incumbent response.
(3) Regulatory uncertainty is high. Investment advice is regulated; fintech licensing is expensive and slow. If the product requires licensing, viability is questioned.
(4) Customer pain is soft. Gen Z wants affordable advice, but is this a priority vs. gaming, dating, social media? Customer Validator noted uncertain WTP; this is a red flag.

RECOMMENDATION:
Archive this concept. If the market shifts (e.g., regulatory clarity improves, or Gen Z spending on financial tools increases materially), revisit in 12-18 months. For now, recommend founders focus on adjacent markets where differentiation is clearer and regulations are friendlier (e.g., financial education for emerging markets, or personal budgeting for side hustlers).
```

### Edge Case Handling

1. **Reports strongly disagree (e.g., one says "go," another says "no-go"):**
   - Investigate the disagreement: Is one report more rigorous? Do they have different assumptions?
   - Synthesize: "Competitive Analyst is concerned about incumbent response speed, which Economics Modeler dismissed. Synthesizer agrees with Competitive Analyst—incumbent response is a real risk, though not a showstopper. Verdict: CONDITIONAL GO with risk mitigation."
   - Escalate: Flag for human review if disagreement is fundamental.

2. **All reports have low confidence:**
   - Market is nascent or highly uncertain
   - Verdict: CONDITIONAL GO with clear research/validation requirements in Phase 3
   - Example: "All reports have medium-low confidence due to nascent market category. Proceed to Phase 3 with expectation that market size, customer adoption, and tech stack will be re-validated in the field."

3. **One report is missing or incomplete:**
   - Cannot make verdict without full picture
   - Escalate: Request missing report before synthesis
   - Do not guess; do not average partial data

4. **Conflicting data within a report (e.g., market sizer says "high confidence" but also identifies major data gaps):**
   - Question the confidence assessment
   - Adjust synthesizer's confidence downward
   - Example: "Market Sizer claims high confidence but 30% of TAM is estimated from proxy data. Synthesizer reduces confidence to medium."

## 7. Error Handling & Edge Cases

### Consistency Conflict Resolution

**When two components conflict:**
1. **Understand the source of conflict:** Different assumptions, different methodologies, data quality
2. **Determine which is more reliable:** Primary data > Secondary > Inferred
3. **Reconcile or flag:** If reconcilable (e.g., "both are right, just different segments"), adjust for synthesis. If not, flag as a key assumption and note uncertainty.

Example:
```
Conflict: Market Sizer says TAM is $500M; Competitive Analyst's market research suggests $300M.
Investigation: Market Sizer used top-down analyst reports; Competitive Analyst used bottom-up customer counting.
Resolution: Both are valid for different reasons. Market Sizer's estimate is broader (includes adjacent segments);
Competitive Analyst's is narrower (just core segment). Synthesizer uses $500M TAM but notes that realistic SAM may be
closer to $300M if market is more concentrated than expected.
```

### Confidence Calibration

**Adjust synthesizer confidence based on:**
- All reports >high confidence → synthesis confidence = high
- Mix of high/medium → synthesis confidence = medium
- Any report has low confidence on critical assumption → synthesis confidence = medium max
- Multiple reports disagree → synthesis confidence = reduced by 1 level
- Critical assumption is unvalidated → synthesis confidence = medium max

### Verdict Inconsistency Checks

**Sanity checks on verdict:**
- If scorecard is 8/10 but verdict is NO-GO: Justify the discrepancy (probably a critical single risk)
- If scorecard is 4/10 but verdict is GO: Justify the discrepancy (probably a high-impact but lower-probability risk)
- If scorecard is 6/10 but verdict is GO without conditions: Ensure key risks are manageable in Phase 3

## 8. Performance & Scaling

### Expected Performance Characteristics

**Latency:**
- Parse and extract from 5 reports: 1-2 hours
- Build scorecard and consistency checks: 2-3 hours
- Identify key assumptions and risks: 1-2 hours
- Synthesize and write recommendation: 2-4 hours
- Peer review: 1-2 hours
- **Total: 8-14 hours per concept**

**Throughput:**
- Single concept per run
- Output: One comprehensive validation summary + go/no-go recommendation per concept

**Scaling Considerations:**
- Parallelization: Multiple synthesizers can work on different concepts simultaneously
- Reuse: Frameworks (scorecard dimensions, risk templates) can be reused across concepts
- Escalation: Complex or borderline verdicts should include human expert review

## 9. Dependencies

### Upstream Dependencies
- **Phase 2.1 (Market Sizer):** TAM, SAM, SOM estimates
- **Phase 2.2 (Competitive Analyst):** Competitive landscape and vulnerability assessment
- **Phase 2.3 (Customer Validator):** Pain validation, WTP, early adopter profiles
- **Phase 2.4 (Feasibility Assessor):** Technical feasibility, cost estimates, risks
- **Phase 2.5 (Economics Modeler):** Unit economics, LTV, CAC, breakeven projections

All five upstream dependencies must be complete before synthesis can occur.

### Downstream Dependents
- **Phase 2 Gate:** Validation Synthesizer output directly feeds the Phase 2 gate decision
- **Phase 3 (Blueprint):** If verdict is GO or CONDITIONAL GO, concept proceeds to Phase 3
- **Feedback Loop:** If verdict is NO-GO, learnings feed back to Phase 0/1 for pattern detection (e.g., "concepts in nascent AI categories tend to fail Phase 2 feasibility")

## 10. Success Metrics

### Output Quality
1. **Clarity of verdict:** GO/CONDITIONAL GO/NO-GO is unmistakable; no ambiguity
2. **Rationale strength:** Top 3 reasons for verdict are compelling and evidence-based
3. **Risk identification:** High-risk factors are explicitly called out; not buried
4. **Actionability:** For CONDITIONAL GO, conditions are specific and measurable (not vague)

### Downstream Validation
1. **Founder/investor acceptance:** Founder reviews recommendation and finds it credible (even if negative)
2. **Phase 3 readiness:** If GO, Phase 3 teams can immediately begin work without major questions
3. **Gate decision alignment:** Recommendation aligns with Phase 2 gate decision (few overrides)

### Process Metrics
1. **Component coverage:** All 5 upstream components are integrated in synthesis; no major findings overlooked
2. **Consistency check coverage:** All 5 cross-component checks are performed and documented
3. **Risk visibility:** Top 3-5 risks are clearly identified; early warning indicators are specified
4. **Confidence calibration:** Synthesizer confidence reflects uncertainty in underlying reports

## 11. Implementation Notes

### Technology Stack

**Core Agent Framework:**
- **Claude API (Opus)** for reasoning, synthesis, and judgment calls

**Data Processing:**
- **Python** for report parsing and scorecard calculation
- **Libraries:**
  - `json` (parse JSON reports, schema validation)
  - `pandas` (tabular data for consistency checks)

**Output & Storage:**
- JSON report generation (schema validation)
- Markdown for narrative and recommendations
- PDF generation for executive briefing

### Development Approach

**Phase 1: Foundation**
- Build report parsing and extraction logic
- Implement validation scorecard calculation
- Create consistency check framework

**Phase 2: Enhancements**
- Add cross-component analysis logic
- Implement assumption sensitivity analysis
- Build risk identification and severity scoring

**Phase 3: Intelligence**
- Add LLM-based reasoning for reconciling conflicts
- Implement nuanced verdict logic (GO vs. CONDITIONAL vs. NO-GO decision tree)
- Build recommendation narrative generation

### Key Implementation Details

**Report Parsing:**
```python
def extract_phase_2_findings(reports: dict[str, dict]) -> dict:
    """
    Extract key metrics and verdicts from each Phase 2 report.
    """
    findings = {
        "market_sizer": {
            "tam": reports["market_sizer"]["tam"]["estimate_usd"],
            "sam": reports["market_sizer"]["sam"]["estimate_usd"],
            "som": reports["market_sizer"]["som"]["year_1_usd"],
            "growth_cagr": reports["market_sizer"]["growth_trajectory"]["cagr_pct"],
            "confidence": reports["market_sizer"]["tam"]["confidence_level"]
        },
        # ... extract from other reports similarly
    }
    return findings

def scorecard_score(dimension: str, data: dict) -> float:
    """
    Score a single dimension 0-10.
    """
    if dimension == "market_size":
        tam = data["tam"]
        if tam > 100_000_000:
            return 9.5
        elif tam > 50_000_000:
            return 8.5
        # ... etc.
    # ... score other dimensions

def consistency_check(market_data: dict, customer_data: dict) -> dict:
    """
    Check consistency between market size and early adopter segment.
    """
    sam = market_data["sam"]
    early_adopters = customer_data["early_adopter_size_estimate"]
    ratio = early_adopters / (sam / 5000)  # normalize to customer count
    if 0.5 < ratio < 2.0:
        return {"alignment": "strong", "flag": False}
    else:
        return {"alignment": "weak", "flag": True, "explanation": f"Early adopters {early_adopters} is {ratio}x of expected"}
```

**Verdict Logic:**
```python
def determine_verdict(scorecard_avg: float,
                     critical_risks: list[dict],
                     confidence_level: str) -> tuple[str, str]:
    """
    Determine GO / CONDITIONAL GO / NO-GO verdict.
    """
    # Check for showstoppers
    has_critical_risk = any(risk["severity"] == "critical" for risk in critical_risks)

    # Check verdict thresholds
    if scorecard_avg >= 7.5 and not has_critical_risk:
        verdict = "go"
    elif scorecard_avg >= 5.5 and (not has_critical_risk or risk_mitigatable):
        verdict = "conditional_go"
    else:
        verdict = "no_go"

    # Adjust confidence
    if confidence_level == "low":
        confidence = "medium" if verdict == "go" else "low"
    else:
        confidence = confidence_level

    return verdict, confidence
```

### Testing & Validation

**Unit tests:**
- Scorecard calculation is correct (verify against hand calculations)
- Consistency check logic correctly identifies misalignments
- Verdict logic correctly categorizes scenarios

**Integration tests:**
- Reports are correctly parsed and extracted
- Consistency checks work across real Phase 2 output formats
- Downstream agents can parse verdict and recommendation

**Smoke tests:**
- Run synthesis on 3 test concepts (one GO, one CONDITIONAL GO, one NO-GO)
- Verify recommendation narratives are clear and compelling
- Confirm Phase 3 teams can act on the verdict

### Common Pitfalls & How to Avoid Them

1. **Averaging conflicting reports:**
   - Don't just average scorecard dimensions if there's disagreement
   - Investigate the source and adjust for data quality
   - Example: "Feasibility says 'go,' Economist says 'no-go' on unit economics. Don't split the difference; identify whether one is more rigorous."

2. **Overweighting optimistic reports:**
   - Watch for confirmation bias toward a predetermined verdict
   - If you find yourself gravitating toward "go," explicitly check for overlooked risks
   - If you find yourself gravitating toward "no-go," explicitly check for overlooked strengths

3. **Ignoring small red flags:**
   - A single report's "low confidence" on a critical assumption should matter
   - Example: "Feasibility says 'go' with low confidence on AI quality. This is a red flag for CONDITIONAL GO, not GO."

4. **Vague conditions for CONDITIONAL GO:**
   - "Revisit after more research" is not actionable
   - "Validate AI quality within 4 weeks with specific accuracy target" is actionable
   - Make conditions specific and measurable

5. **Recommending GO despite unresolved conflicts:**
   - If two reports fundamentally disagree on a critical factor, verdict should at minimum be CONDITIONAL GO
   - Resolve disagreements before recommending GO

### Deployment Checklist

- [ ] All 5 Phase 2 report schemas are defined and documented
- [ ] Report parsing logic is tested against real outputs
- [ ] Scorecard calculation is verified against sample concepts
- [ ] Consistency check logic is tested for common conflicts
- [ ] Verdict logic handles edge cases (missing data, low confidence, etc.)
- [ ] Recommendation narrative templates are written and reviewed
- [ ] JSON schema for output is complete and validated
- [ ] Downstream gate agents can parse verdict
- [ ] Human review workflow is defined (for borderline cases)
- [ ] Documentation and decision criteria are finalized
