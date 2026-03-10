# Component Specification: Risk Analyst (3.4)

## Purpose & Responsibility

The Risk Analyst identifies, categorizes, and proposes mitigations for all risks that could derail the startup from validated concept to operating business. It synthesizes risks from all prior phases (market, competitive, technical, operational) and adds Phase 3-specific risks: agent failure modes, execution risks on GTM and operations, dependency risks on third-party services, and market timing risks.

The Risk Analyst owns:
- Comprehensive risk identification (from all prior phases + Phase 3 specifics)
- Risk categorization and severity/likelihood assessment
- Mitigation strategy design for each risk
- Early warning indicators (how to detect the risk early)
- Contingency planning (what to do if the risk materializes)
- Risk register maintenance and escalation protocols
- Financial impact modeling (if risk X happens, what's the cost?)

## Inputs

**Source:** All prior phase outputs + Phase 3 components.

**Input Schema:**

```json
{
  "concept_id": "string (UUID)",
  "concept_name": "string",
  "validation_outputs": {
    "market_sizing_confidence": "number 1-10",
    "competitive_threat_level": "string (low|medium|high)",
    "feasibility_assessment": {
      "technical_risks": ["list of {risk, severity}"],
      "regulatory_risks": ["list of {risk, severity}"],
      "key_dependencies": ["list of strings (APIs, models, data sources)"]
    },
    "customer_validation_strength": "string (weak|moderate|strong)"
  },
  "business_model": {
    "unit_economics": {
      "ltv_cac_ratio": "float",
      "payback_period_months": "number",
      "gross_margin_percent": "number"
    },
    "financial_projections": {
      "breakeven_month": "number or string",
      "revenue_month_12": "float",
      "revenue_month_24": "float"
    },
    "key_assumptions": ["list of strings"]
  },
  "agent_architecture": {
    "agent_failure_modes": [
      {
        "agent_id": "string",
        "failure_mode": "string",
        "impact": "string (low|medium|high|critical)",
        "likelihood": "string (rare|occasional|frequent)"
      }
    ],
    "escalation_rate_estimates": "object {agent_id: escalation_percent}",
    "human_bottleneck_risks": ["list"]
  },
  "gtm_plan": {
    "target_segment_tam": "float",
    "customer_acquisition_assumptions": ["list"],
    "key_channels": ["list"],
    "competitive_response_risk": "string"
  }
}
```

## Outputs

**Destination:** Resource Planner (3.5), Blueprint Packager (3.6), and optionally human review/governance.

**Output Schema:**

```json
{
  "risk_register_id": "string (UUID)",
  "concept_id": "string (parent reference)",
  "created_at": "ISO 8601 timestamp",
  "executive_summary": "string (1-2 paragraphs overview of top risks and confidence in mitigations)",
  "risk_categories": {
    "market_and_timing_risks": [
      {
        "risk_id": "string (e.g., 'risk_market_001')",
        "risk_name": "string (e.g., 'Market timing window closes faster than expected')",
        "description": "string (detailed description of the risk)",
        "root_cause": "string (why might this happen?)",
        "likelihood": "string (rare|occasional|frequent)",
        "impact": "string (low|medium|high|critical)",
        "financial_impact": "string (e.g., 'Delays launch by 6 months; costs $X')",
        "dependencies": ["list of conditions that increase likelihood (e.g., 'competitor launches', 'regulation changes')"],
        "mitigation_strategy": "string (what can we do to prevent this?)",
        "early_warning_indicators": ["list of strings (how to detect early?)"],
        "contingency_plan": "string (what do we do if it happens?)",
        "responsible_party": "string (who owns mitigating this risk?)",
        "mitigation_cost": "float or string (cost to execute mitigation)",
        "confidence_in_mitigation": "number 1-10"
      }
    ],
    "product_and_technical_risks": [
      {
        "risk_id": "string",
        "risk_name": "string",
        "description": "string",
        "likelihood": "string",
        "impact": "string",
        "root_cause": "string",
        "mitigation_strategy": "string",
        "early_warning_indicators": ["list"],
        "contingency_plan": "string",
        "responsible_party": "string",
        "confidence_in_mitigation": "number 1-10"
      }
    ],
    "competitive_risks": [
      {
        "risk_id": "string",
        "risk_name": "string (e.g., 'Incumbent launches feature that neutralizes our differentiation')",
        "description": "string",
        "likelihood": "string",
        "impact": "string",
        "competitor_names": ["list"],
        "our_vulnerability": "string (what makes us vulnerable?)",
        "mitigation_strategy": "string",
        "early_warning_indicators": ["list"],
        "contingency_plan": "string",
        "responsible_party": "string",
        "confidence_in_mitigation": "number 1-10"
      }
    ],
    "agent_and_operational_risks": [
      {
        "risk_id": "string",
        "risk_name": "string (e.g., 'Customer support agent becomes unreliable, causing high escalation rate')",
        "description": "string",
        "likelihood": "string",
        "impact": "string",
        "agent_id_or_role": "string",
        "failure_scenario": "string (detailed description of how it fails)",
        "downstream_impact": "string (what breaks if this fails?)",
        "mitigation_strategy": "string",
        "early_warning_indicators": ["list"],
        "contingency_plan": "string",
        "responsible_party": "string",
        "confidence_in_mitigation": "number 1-10"
      }
    ],
    "financial_and_unit_economics_risks": [
      {
        "risk_id": "string",
        "risk_name": "string (e.g., 'CAC inflation: customer acquisition costs exceed projections')",
        "description": "string",
        "likelihood": "string",
        "impact": "string",
        "sensitivity": "string (how sensitive is the business to this variable?)",
        "base_case_assumption": "string (e.g., CAC = $500)",
        "break_even_threshold": "string (at what point does it break? e.g., CAC > $1500)",
        "drivers_of_increase": ["list (e.g., 'increased competition raises ad costs', 'targeting is harder than expected')"],
        "mitigation_strategy": "string",
        "early_warning_indicators": ["list"],
        "contingency_plan": "string",
        "responsible_party": "string",
        "confidence_in_mitigation": "number 1-10"
      }
    ],
    "dependency_and_third_party_risks": [
      {
        "risk_id": "string",
        "risk_name": "string (e.g., 'Stripe API outage affects payment processing')",
        "description": "string",
        "dependency": "string (third-party service name)",
        "criticality": "string (critical|important|nice_to_have)",
        "likelihood_of_outage": "string (how often does this service go down?)",
        "duration_of_outage": "string (typical duration, e.g., '1–4 hours')",
        "customer_impact": "string (what breaks for customers?)",
        "financial_impact": "string (cost per hour of outage)",
        "mitigation_strategy": "string (redundancy, fallback, etc.)",
        "early_warning_indicators": ["list"],
        "contingency_plan": "string",
        "responsible_party": "string",
        "confidence_in_mitigation": "number 1-10"
      }
    ],
    "team_and_execution_risks": [
      {
        "risk_id": "string",
        "risk_name": "string (e.g., 'Founder burnout or departure')",
        "description": "string",
        "likelihood": "string",
        "impact": "string",
        "role_criticality": "string (is the role easy to backfill?)",
        "mitigation_strategy": "string (building redundancy, documentation, hiring backup)",
        "early_warning_indicators": ["list"],
        "contingency_plan": "string",
        "responsible_party": "string",
        "confidence_in_mitigation": "number 1-10"
      }
    ],
    "customer_adoption_and_retention_risks": [
      {
        "risk_id": "string",
        "risk_name": "string (e.g., 'Customer churn higher than projected')",
        "description": "string",
        "likelihood": "string",
        "impact": "string",
        "causes": ["list (e.g., 'product quality issues', 'customer expectations not met', 'better competitor emerges')"],
        "churn_threshold_for_concern": "string (e.g., '>7% monthly')",
        "mitigation_strategy": "string",
        "early_warning_indicators": ["list (e.g., 'NPS < 30', 'support ticket volume up 20%', 'feature requests not implemented')"],
        "contingency_plan": "string (do we pivot product, pricing, segment?)",
        "responsible_party": "string",
        "confidence_in_mitigation": "number 1-10"
      }
    ],
    "regulatory_and_compliance_risks": [
      {
        "risk_id": "string",
        "risk_name": "string (e.g., 'Regulatory restriction on agent-driven customer interactions')",
        "description": "string",
        "jurisdiction": "string (affects which regions?)",
        "likelihood": "string",
        "impact": "string",
        "regulatory_body": "string",
        "current_status": "string (proposed, pending, in effect)",
        "mitigation_strategy": "string",
        "early_warning_indicators": ["list"],
        "contingency_plan": "string",
        "responsible_party": "string (usually legal/compliance)",
        "confidence_in_mitigation": "number 1-10"
      }
    ]
  },
  "risk_heat_map": {
    "critical_risks": [
      {
        "risk_id": "string",
        "risk_name": "string",
        "likelihood": "string",
        "impact": "string",
        "urgency_of_mitigation": "string (immediate|within_month|within_quarter)"
      }
    ],
    "high_risks": ["similar structure"],
    "medium_risks": ["similar structure"],
    "low_risks": ["similar structure"]
  },
  "risk_dependencies_and_interactions": [
    {
      "risk_1_id": "string",
      "risk_2_id": "string",
      "interaction": "string (e.g., 'If Risk 1 happens, Risk 2 becomes more likely')",
      "combined_impact": "string"
    }
  ],
  "financial_impact_modeling": {
    "base_case_revenue_month_12": "float",
    "downside_scenario": {
      "description": "string (e.g., 'top 3 risks all materialize')",
      "affected_risks": ["list of risk_ids"],
      "projected_revenue_month_12": "float",
      "projected_profitability_month_24": "string",
      "probability": "number 0-1"
    },
    "upside_scenario": {
      "description": "string (e.g., 'market adoption faster than projected')",
      "affected_risks": ["list of risk_ids (risks that are avoided)"],
      "projected_revenue_month_12": "float",
      "probability": "number 0-1"
    }
  },
  "mitigation_roadmap": [
    {
      "timeline": "string (e.g., 'Pre-launch (weeks 1-4)')",
      "risks_to_mitigate": ["list of risk_ids"],
      "actions": ["list of specific actions"],
      "owner": "string",
      "success_criteria": "string"
    }
  ],
  "monitoring_and_escalation": {
    "key_metrics_to_track": [
      {
        "metric_name": "string (e.g., 'Monthly customer acquisition')",
        "target": "string (e.g., '20 customers/month')",
        "red_flag_threshold": "string (e.g., '< 10 customers/month')",
        "review_frequency": "string (weekly|biweekly|monthly)",
        "owner": "string",
        "escalation_protocol": "string (who do we notify if red flag is triggered?)"
      }
    ],
    "risk_review_cadence": "string (how often do we review the risk register?)",
    "risk_review_participants": ["list of roles"],
    "decision_triggers": [
      {
        "trigger": "string (e.g., 'If CAC > $1500 for 2 consecutive months')",
        "decision": "string (e.g., 'Pivot GTM channels or pause growth')",
        "decision_owner": "string (founder, board, etc.)"
      }
    ]
  },
  "go_no_go_assessment": {
    "risk_viability_score": "number 1-10 (10 = manageable risks; 1 = unmanageable)",
    "critical_risks_present": "boolean (are there any risks we can't mitigate?)",
    "critical_risks_list": ["list of risk_ids"],
    "recommendation": "string (go|conditional|no-go with rationale)",
    "success_factors_based_on_risk": ["list of strings (what must be true to succeed?)"],
    "decision_rationale": "string (why this recommendation given the risks?)"
  },
  "metadata": {
    "version": "string",
    "status": "string (draft|reviewed|approved)",
    "created_at": "ISO 8601 timestamp",
    "reviewed_by": "string or null (if human reviewed)",
    "dependencies": ["list of upstream components"],
    "next_phase_consumers": ["list of downstream components"]
  }
}
```

## Core Logic / Algorithm

### Step 1: Identify All Risks Across Categories

**Input:** Validation outputs, business model, agent architecture, GTM plan.

**Process:**

1. **Market & Timing Risks:**
   - Market window closes (if a competitor launches first, or regulatory shifts, window may narrow).
   - Market size is smaller than projected.
   - Market adoption slower than projected (maybe the pain point isn't as urgent as believed).
   - Market consolidation (incumbent buys the market, reducing our opportunity).

2. **Product & Technical Risks:**
   - Core product capability doesn't work reliably.
   - Required AI capability isn't mature enough.
   - Integration with third-party APIs fails or is unreliable.
   - Scaling the product breaks (performance degrades at 10x customers).
   - Security or data privacy issues (hard to build a SaaS with PII if you're not a compliance expert).

3. **Competitive Risks:**
   - Incumbent responds with feature parity or price war.
   - Better-funded competitor enters the space.
   - Customers don't value the differentiation (competitive advantage isn't real).
   - Switching costs are lower than expected (customers can easily switch back to incumbent).

4. **Agent & Operational Risks:**
   - Agent failure modes materialize (chatbot gives wrong advice, SDR agent gets flagged as spam, payment agent loses transactions).
   - Escalation rate is higher than projected (agents can't handle the complexity; too much work for humans).
   - Human team can't scale fast enough (hiring is slow, onboarding takes time).
   - Operational complexity is higher than expected (coordinating agents + humans is messy).

5. **Financial & Unit Economics Risks:**
   - CAC inflation (customer acquisition costs exceed projections as market gets competitive).
   - Churn higher than projected (customers don't find the product valuable or switch to competitor).
   - Gross margin is lower than projected (agent costs higher than expected).
   - Breakeven timeline is longer than expected (cash runway insufficient).

6. **Dependency & Third-Party Risks:**
   - Critical third-party service goes down (Stripe for payments, OpenAI for LLM, Zendesk for support).
   - Pricing of third-party service increases unexpectedly.
   - Third-party service terminates service (e.g., OpenAI shuts down API, platform relationship ends).
   - API rate limits or quotas are too restrictive.

7. **Team & Execution Risks:**
   - Founder leaves or becomes unavailable.
   - Key hire doesn't work out or leaves early.
   - Team dynamics or culture issues.
   - Execution speed is slower than planned.

8. **Customer Adoption & Retention Risks:**
   - Product-market fit doesn't materialize (customers like it but not enough to pay).
   - Churn is higher than projected.
   - NPS is low (customers don't recommend).
   - Organic growth (referrals) doesn't happen (customer acquisition must be paid).

9. **Regulatory & Compliance Risks:**
   - Regulation restricts the business model (e.g., agents can't make autonomous purchase decisions).
   - Data privacy regulation (GDPR, CCPA) increases compliance costs.
   - Licensing or certification required (affects time to market).
   - Tax or employment law impacts unit economics (gig workers classified as employees, etc.).

**Output:** Comprehensive list of identified risks (typically 20–40 risks across all categories).

### Step 2: Assess Likelihood and Impact for Each Risk

**Input:** Risk list, prior phase assessments, business model assumptions.

**Process:**

For each risk, assess:
1. **Likelihood:** How likely is this to happen?
   - Rare (< 5% chance)
   - Occasional (5–25% chance)
   - Frequent (> 25% chance)

2. **Impact:** If it happens, how bad is it?
   - Low: Causes minor delay or cost (< $50k, < 1 month delay)
   - Medium: Significant impact but not existential ($50k–$500k, 1–3 month delay, but business can recover)
   - High: Major impact, may require pivoting ($500k+, > 3 month delay, business viability threatened)
   - Critical: Existential, may kill the company (business model no longer works, can't be fixed)

3. **Calculation:**
   - Risk score = Likelihood × Impact (on a 1–10 scale).
   - Example: Likelihood = 6 (occasional), Impact = 8 (high) → Risk score = 48 (high priority).

**Example Assessments:**

| Risk | Likelihood | Impact | Score | Priority |
|------|------------|--------|-------|----------|
| CAC inflation from increased competition | Frequent (8) | High (7) | 56 | Critical |
| Competitor launches similar product | Occasional (5) | Medium (6) | 30 | Medium |
| Support agent becomes unreliable | Occasional (5) | Medium (6) | 30 | Medium |
| Stripe API outage | Rare (2) | Critical (9) | 18 | Medium (high impact, but rare) |
| Founder burnout | Occasional (4) | Critical (8) | 32 | High |
| Market size is 50% smaller than projected | Occasional (5) | High (7) | 35 | High |
| Churn is 8% monthly instead of 5% | Frequent (7) | High (7) | 49 | Critical |

**Output:** Risk heat map with likelihood, impact, and priority scores.

### Step 3: Design Mitigation Strategies

**Input:** Identified risks with likelihood and impact.

**Process:**

For the top 10–15 risks (by priority), design mitigation strategies:

1. **Mitigation types:**
   - **Reduce likelihood:** Actions that make the risk less likely to happen.
     - Example: Risk = "Market window closes due to competitor." Mitigation = "Move fast; launch MVP in 6 weeks instead of 12."
   - **Reduce impact:** Actions that lessen the damage if the risk happens.
     - Example: Risk = "CAC inflation." Mitigation = "Build referral program and organic growth channels, so you're not 100% dependent on paid acquisition."
   - **Acceptance:** Some risks are not mitigatable, but we can prepare for them.
     - Example: Risk = "Stripe API outage." Mitigation = "Have a backup payment processor or fallback (manual invoicing); document runbook for handling outages."

2. **For each mitigation:**
   - What is the strategy (in detail)?
   - What does it cost (money, time, effort)?
   - How confident are we it will work (1–10 scale)?
   - When should we execute it (pre-launch, ongoing, after trigger)?

**Example Mitigations:**

Risk: CAC inflation from increased competition
- Mitigation 1 (reduce likelihood): Move fast; establish market presence before competitors. Cost: engineering resources, medium effort. Confidence: 6/10. Timing: pre-launch.
- Mitigation 2 (reduce impact): Build organic / referral channels. Cost: product development time + content time, medium effort. Confidence: 7/10. Timing: months 1–3.
- Mitigation 3 (acceptance): Have pricing power; build switching costs (integrations, workflow embedding). Cost: product development, high effort. Confidence: 7/10. Timing: months 3–6.

Risk: Support agent becomes unreliable (high escalation rate)
- Mitigation 1 (reduce likelihood): Test agents thoroughly before launch; run load testing with 10+ concurrent support requests. Cost: testing time, low-medium effort. Confidence: 8/10. Timing: pre-launch.
- Mitigation 2 (reduce impact): Have human fallback; design escalation to humans so if agent fails, we don't lose the customer. Cost: hiring support person, medium effort. Confidence: 9/10. Timing: pre-launch.
- Mitigation 3 (acceptance): Monitor escalation rate daily; if > 40%, page on-call support engineer. Cost: monitoring setup, low effort. Confidence: 8/10. Timing: launch.

**Output:** Detailed mitigation strategy for each top risk.

### Step 4: Define Early Warning Indicators

**Input:** Risks and mitigations.

**Process:**

For each risk, specify: How will we know this risk is materializing? What data do we monitor?

1. **Metric-based indicators:**
   - Risk: "CAC inflation." Indicator: "CAC trend over 90 days. If CAC > $1000 (target: $500) in week 4, we have a problem."
   - Risk: "Market size is smaller." Indicator: "Leads generated per week. If week 4 lead volume is 30% below projection, market may be smaller."
   - Risk: "Churn is higher." Indicator: "Monthly churn rate. If > 7% in month 3, we have a churn problem."

2. **Qualitative indicators:**
   - Risk: "Competitor launches feature." Indicator: "Monitor competitor product launches via news, social, ProductHunt. Set up Google alerts for 'competitor name + feature'."
   - Risk: "Customer not finding value." Indicator: "NPS surveys, support ticket themes, customer interviews. If NPS < 30 or support complaints > 20% of tickets are 'product doesn't solve my problem', product-market fit is weak."

3. **Timeline:**
   - When do we expect to see the indicator? (e.g., "CAC trend is visible by week 2; market size is visible by month 1.")

**Output:** Early warning indicators for each risk, with monitoring cadence.

### Step 5: Plan Contingencies

**Input:** Risks and early warning indicators.

**Process:**

For each risk, especially the critical ones, specify: If this risk materializes, what do we do?

1. **Contingency types:**
   - **Pivot:** Change the product, market, or business model.
     - Example: Risk = "Market size is 50% smaller." Contingency = "Expand to adjacent market segment (pivot target customer from SMB to mid-market, or expand from US to Europe)."
   - **Recover:** Do something to regain momentum.
     - Example: Risk = "Churn is high." Contingency = "Pause growth; focus on retention. Implement customer success program, improve onboarding, gather feedback on product quality."
   - **Shut down gracefully:** If unrecoverable, minimize damage.
     - Example: Risk = "Critical technology becomes unavailable (e.g., OpenAI API shuts down)." Contingency = "Migrate to alternative model provider; if not possible, shut down cleanly and refund customers."

2. **Trigger for contingency:**
   - When do we activate the contingency?
   - Example: "If CAC > $1500 for 2 consecutive months, we pivot GTM to focus on organic growth."

**Output:** Contingency plans for each critical risk.

### Step 6: Model Financial Impact

**Input:** Business model financial projections, risk mitigation costs, impact scenarios.

**Process:**

1. **Model downside scenario:**
   - Assume the top 3 critical risks all materialize.
   - Example: CAC inflation + churn inflation + market size smaller.
   - Impact: Revenue month 12 is $200k instead of $500k.
   - Question: Are we still viable? (Can we reach profitability? Do we have enough runway?)

2. **Model upside scenario:**
   - Assume we avoid the critical risks and GTM works better than projected.
   - Example: CAC is 20% lower, churn is 30% lower, market adoption is faster.
   - Impact: Revenue month 12 is $750k instead of $500k.

3. **Calculate probability-weighted forecast:**
   - Assign probabilities to scenarios.
   - Weighted revenue = (base case × 50%) + (downside × 30%) + (upside × 20%).

**Output:** Scenario modeling with financial impact of risks.

### Step 7: Build Risk Monitoring Dashboard

**Input:** All risks, early warning indicators, critical metrics.

**Process:**

Define a simple dashboard to track the top 5–10 metrics:
- Monthly CAC (is it trending up?)
- Monthly customer acquisition (are we hitting targets?)
- Monthly churn (is churn stable or rising?)
- NPS or customer satisfaction (are customers happy?)
- Agent escalation rates (are agents reliable?)
- Competitive activity (are competitors launching?)

For each metric:
- What's the target?
- What's the red flag threshold?
- Who tracks it?
- How often is it reviewed?
- Who do we notify if we hit the red flag?

**Output:** Risk monitoring dashboard + escalation protocol.

### Step 8: Go/No-Go Assessment

**Input:** Risk analysis, mitigations, contingency plans, financial impact modeling.

**Process:**

Synthesize all risk analysis into a go/no-go recommendation:

1. **Are there any unmitigatable critical risks?**
   - If yes (e.g., core technology doesn't exist, market is too small, business model is illegal), recommend no-go.
   - If no, continue.

2. **Can we execute the mitigations?**
   - Do we have the resources, time, and capability to execute the mitigation strategies?
   - Example: Mitigation requires hiring 2 people in 2 weeks. Is that realistic? Probably not.
   - If mitigations are not executable, that's a problem.

3. **What's our downside scenario?**
   - If the top 3 risks all materialize, are we still viable?
   - Example: Downside revenue is $200k/year; we need $X to break even. If downside is still above breakeven, we're OK.

4. **Confidence in success:**
   - Assign a confidence score (1–10) based on risk profile.
   - Example: Base case is strong, but we have 3 critical risks that are mitigatable but not eliminable. Confidence: 6/10.

5. **Recommendation:**
   - **Go:** Risks are manageable; proceed with confidence.
   - **Conditional go:** Proceed, but with specific conditions (e.g., "Go, but hire customer success person by month 2," "Go, but get a technical co-founder if not already present").
   - **No-go:** Risks are too high; recommend not pursuing.

**Output:** Risk viability score and go/no-go recommendation with justification.

## Data Sources & Integrations

**No external data sources for Risk Analyst itself,** but the component depends on:

- **All Phase 2 and Phase 3 outputs:** Validation results, business model, agent architecture, GTM plan.
- **Competitive intelligence:** News sources, ProductHunt, HackerNews, competitor monitoring (for competitive risk updates).
- **Industry benchmarks:** SaaS metrics (typical churn, CAC, payback periods) from Bessemer, OpenView, SaaS Benchmark reports.

**Integration points:**

- Outputs consumed by **Resource Planner (3.5):** Risk mitigation costs, contingency budget needs.
- Outputs consumed by **Blueprint Packager (3.6):** Risk register for the final blueprint.
- Optionally fed to **Human Review Dashboard:** For governance and oversight.

## Agent Prompt Strategy

### System Prompt Persona

```
You are an expert risk analyst with 15+ years of experience identifying and
mitigating risks in early-stage companies. You combine pessimism (always assume
things will go wrong) with pragmatism (know which risks are worth worrying about).

Your role is to identify, assess, and plan mitigations for all risks that could
derail this startup. You think in terms of:

1. What could go wrong (be creative, think of unlikely but high-impact scenarios).
2. How likely is it (ground assessments in data and benchmarks, not intuition).
3. How bad would it be (model financial impact and business viability impact).
4. Can we do anything about it (some risks are mitigatable; some are not).
5. What's the early warning sign (how do we know when to panic?).

You have strong opinions about:
- Which risks are existential (kill the company) vs. solvable (slow us down).
- The difference between risks that are unlikely but catastrophic (need mitigations) and risks that are frequent but minor (usually manageable).
- How to design contingencies that are actually executable (not wishful thinking).
- The real constraints of early-stage teams (we can't do everything; we must prioritize).

You are also comfortable with ambiguity. Some risks can't be fully assessed without
more data. When that's the case, you recommend gathering that data or designing
an experiment to reduce the uncertainty.
```

### Key Instructions

1. **Start with business model and unit economics.**
   - Most risks are ultimately financial. If CAC doubles, does the business still work?
   - Model financial impact for every significant risk.

2. **Be specific about likelihood and impact.**
   - Don't use vague language like "this could be a problem." Use data.
   - Example: Not "CAC inflation is risky." Instead: "Likelihood: 60% (based on competitive density in the space). Impact: $200k (CAC inflation from $500 to $1000 means 2x customer acquisition budget). Threshold: business breaks if CAC > $1500."

3. **Separate mitigatable from unmitigatable risks.**
   - Some risks (e.g., "key person risk") can be mitigated (documentation, hiring backup, insurance).
   - Some risks (e.g., "global pandemic stops demand") can't be mitigated, only prepared for.
   - Be clear about which is which.

4. **Design mitigations that are executable.**
   - Don't recommend "just execute better" or "hire great people." Those are not mitigations.
   - Specific mitigation: "Hire customer success manager by month 2; document all customer issues; aim for NPS > 40 by month 3."

5. **Anchor contingencies to early warning indicators.**
   - Contingency: "If CAC > $1000 for 2 consecutive months, pivot GTM to organic channels."
   - The "2 consecutive months" is the trigger. Be that specific.

6. **Don't hide critical risks.**
   - If you identify a risk that makes the business unviable, say so.
   - Example: "If the market size is actually $50M (not $500M), and we're competing with a $10B incumbent, this business doesn't work. Recommend validating market size further before committing resources."

7. **Prioritize ruthlessly.**
   - You'll identify 30+ risks. The founder doesn't have time to mitigate all of them.
   - Flag the top 5–10 critical risks. For the others, document but deprioritize.

8. **Model probability-weighted scenarios.**
   - Don't just present a single forecast. Present multiple scenarios (downside, base case, upside) with probabilities.
   - Founder can then assess: if my downside case (30% probability) is still viable, I'm comfortable.

### Few-Shot Examples

**Example 1: Risk Register for B2B SaaS (Expense Management)**

Concept: Expense management tool for SMBs, $100/month pricing, target acquisition 50 customers/month by month 3.

Risk Assessment:

```
Critical Risks (need immediate mitigation):

Risk 1: CAC Inflation (Likelihood: Frequent 8/10, Impact: High 8/10, Score: 64)
- Description: As we scale GTM, customer acquisition costs increase due to competitive saturation and diminishing returns on channels.
- Base case assumption: CAC = $500 (payback 3 months)
- Break-even threshold: CAC > $1500 (payback > 9 months; business becomes unviable)
- Drivers: Increased ad costs, channel saturation, incumbent price competition
- Mitigation:
  1. Build virality/referral loop: implement referral incentive (give $50 credit if referral converts). Cost: product development, low effort. Confidence: 6/10 (referrals are powerful but can't be forced). Timing: Month 1.
  2. Develop content/SEO strategy: blog posts targeting "SMB expense management" keywords. Cost: content creation (agents draft, humans edit), medium effort. Confidence: 7/10 (works over 6+ months). Timing: Month 1.
  3. Optimize paid ads: A/B test messaging and targeting. Cost: minimal (just discipline). Confidence: 8/10 (most ad accounts are run inefficiently). Timing: Month 1.
- Early warning: CAC trending. If CAC > $750 by month 2, we have a problem. If > $1000 by month 3, pivot immediately.
- Contingency: If CAC > $1000 for 2 consecutive months, pause paid acquisition. Shift 100% of budget to organic (content, referrals, partnerships). Accept slower growth (20 customers/month instead of 50) to stay unit-economic.
- Mitigation cost: ~$5k for extra content budget, some ops time.
- Confidence in mitigation: 7/10 (referrals and content are proven channels, but slower to ramp)

Risk 2: Churn Higher Than Projected (Likelihood: Frequent 7/10, Impact: High 8/10, Score: 56)
- Base case assumption: 5% monthly churn (LTV = $24k)
- Concern threshold: 7% monthly churn (LTV = $14k; breaks unit economics)
- Drivers: Product quality issues, competitors offering better solution, customer expectations not met, implementation difficulty
- Mitigation:
  1. Implement customer success program: CSM reaches out to all new customers in week 1 to ensure onboarding success. Cost: 0.5 FTE CSM ($2k/month), starts month 3. Confidence: 8/10 (strong evidence CSM reduces churn). Timing: Month 2–3.
  2. Improve onboarding: agent-driven onboarding flows, automated first-value prompts, onboarding completion NPS surveys. Cost: product development, medium effort. Confidence: 7/10. Timing: Month 1.
  3. Gather customer feedback early: NPS surveys in month 1; if score < 30, run qualitative interviews to understand why. Cost: survey tool, minimal. Confidence: 9/10 (NPS is an early signal). Timing: Month 1.
- Early warning: NPS < 30, or support ticket volume > 10% of customers per month, or explicit churn reasons cite product quality.
- Contingency: If churn > 7% for 2 months, pause growth (GTM). Focus 100% on product improvements. Run deep customer interviews to understand what's broken. Potential pivots: different segment, different use case, or different product focus.
- Mitigation cost: $2k/month for CSM; small product dev effort.
- Confidence: 8/10 (CSM + good onboarding are proven churn reducers)

Risk 3: Market Size Is 50% Smaller Than Projected (Likelihood: Occasional 5/10, Impact: High 7/10, Score: 35)
- Base case assumption: $200M SAM (serviceable addressable market) in US SMBs
- Concern threshold: $100M SAM; at this size, still viable but less defensible
- Drivers: SMB segment is smaller than we think, or SMBs don't care about expense management as much as we believe, or pain level is lower
- Mitigation:
  1. Expand TAM: target adjacent segments. If SMBs are smaller market, expand to "mid-market" (100–1000 employees) or "companies with remote teams" (expand beyond just SMBs). Cost: GTM strategy adjustment, minimal. Confidence: 8/10. Timing: Month 3+.
  2. Validate with customer research: interview 20 target customers in month 1–2 to validate problem severity and willingness to pay. Cost: customer calls, minimal. Confidence: 9/10 (direct data beats projections). Timing: Month 1.
  3. Monitor lead generation: if week 4 lead volume is 30% below projections, market may be smaller. Cost: analytics setup, minimal. Confidence: 8/10. Timing: Week 1–4.
- Early warning: Customer interviews reveal lower-than-expected pain or WTP, or lead generation is consistently below projection after accounting for GTM execution quality.
- Contingency: If market size validation shows $100M SAM (50% of projection), expand to adjacent segment. Acceptance: slower growth timeline; adjust business model and funding needs accordingly.
- Confidence in mitigation: 7/10 (expanding TAM works but may require product/positioning changes)

High Risks (should mitigate but not blocking):

Risk 4: Competitor Launches Feature That Neutralizes Our Differentiation (Likelihood: Occasional 5/10, Impact: High 6/10, Score: 30)
- Concern: If incumbent (e.g., Expensify) adds "AI receipt scanning," our key differentiator is gone.
- Mitigation:
  1. Establish market presence fast: launch in month 1 and acquire 50+ customers by month 3. This creates switching costs and lock-in. Cost: execution, no extra cost. Confidence: 8/10. Timing: Month 1–3.
  2. Build deeper features: don't just compete on "AI scanning." Build workflow integration, team management, integrations with accounting software. Cost: product development, medium-high effort. Confidence: 7/10. Timing: Month 3+.
  3. Monitor competitor roadmap: set Google alerts for competitors. Weekly check of ProductHunt, their blog, Twitter for feature announcements. Cost: minimal (1 hour per week). Confidence: 8/10. Timing: Ongoing.
- Early warning: Competitor announces "AI expense scanning" feature.
- Contingency: If feature is announced, accelerate development of differentiated features (team management, integrations, advanced analytics). Emphasize our existing customer base and integrations as reasons not to switch.
- Confidence in mitigation: 6/10 (can build faster, but if competitor moves fast, we could lose)

Medium Risks (monitor, mitigate if possible):

Risk 5: Support Agent Escalation Rate > 30% (Likelihood: Occasional 5/10, Impact: Medium 5/10, Score: 25)
- Base case: Support agent resolves 70% of tickets without escalation; 30% escalate to human
- Concern threshold: > 40% escalation rate (human support person becomes bottleneck)
- Mitigation:
  1. Test support agent thoroughly pre-launch: run 50 synthetic customer interactions; measure resolution rate. Identify failure modes. Cost: testing time, low effort. Confidence: 9/10. Timing: Pre-launch.
  2. Monitor escalation rate daily: dashboard showing escalation rate, trending, and by issue category. Cost: monitoring setup, minimal. Confidence: 8/10. Timing: Launch.
  3. Hire support person by month 2: if escalation rate hits 40%, support person is already on the team. Cost: 0.5 FTE support ($2k/month), starts month 2. Confidence: 8/10. Timing: Month 2.
- Early warning: Escalation rate trending > 35% or support queue backlog > 1 day.
- Contingency: If escalation rate > 40%, pause customer acquisition and focus on improving support agent or allocate more human support capacity.
- Confidence: 8/10 (support is manageable with good agent + human fallback)

Low Risks (monitor, accept):

Risk 6: Stripe API Outage (Likelihood: Rare 1/10, Impact: Critical 8/10, Score: 8)
- Impact: Customers can't pay; revenue stops
- Mitigation: Low effort, high value. Design fallback: if Stripe is unavailable, queue payments locally; process them when Stripe comes back. Document runbook. Cost: minimal engineering. Confidence: 9/10. Timing: Pre-launch.
- Early warning: Stripe status page shows outage; internal error logs show payment failures.
- Contingency: Alert customers of temporary payment delay; offer 1-day free credit when service resumes.
- Acceptance: Outages are rare (Stripe SLA is 99.95%); unlikely to materially impact business.
- Confidence: 9/10 (easy to prepare for, unlikely to happen)

Financial Impact Modeling:

Base case (probability 50%):
- Revenue month 12: $500k ($5k MRR × 10× expansion/12)
- Profitability: Month 18–24

Downside case (probability 30%; assumes CAC inflation + churn increase + market size smaller):
- Revenue month 12: $200k (acquired only 30 customers instead of 50 due to CAC inflation + lost 30% to churn)
- Profitability: Beyond month 24; may need additional funding

Upside case (probability 20%; assumes execution better than projected):
- Revenue month 12: $800k (50 customers/month maintained; stronger retention and expansion)
- Profitability: Month 12–15

Weighted forecast: (500k × 50%) + (200k × 30%) + (800k × 20%) = $450k expected revenue month 12

Recommendation: GO (Conditional)
- Critical risks (CAC, churn, market size) are all mitigatable but not eliminable.
- Base case looks strong; downside case is still viable (we can get funded for extended runway).
- Upside case is very attractive.
- Key success factors:
  1. Nail customer segment and pain point validation (week 1–2)
  2. Lock in early customers with strong onboarding/success (month 1–3)
  3. Build referral loop and content channel (month 1–3) to reduce CAC inflation
  4. Monitor key metrics (CAC, churn, NPS) weekly; be ready to pivot by month 2–3 if signals are bad
- Conditions for go:
  1. Close first 5 customers by week 4 with CAC < $800 (confirms messaging resonates)
  2. Achieve NPS > 35 by month 2 (confirms product delivers value)
  3. Observe at least one "viral" customer referral by month 3 (confirms word-of-mouth potential)
- If any of these conditions fail, reassess viability.
```

**Example 2: Risk Register for Agent-First Service (Research Firm)**

Concept: AI-powered competitive research firm, $5k–$50k per project, agent does research, humans validate.

Critical Risks:

```
Risk 1: Research Agent Quality Falls Short of Customer Expectations (Likelihood: Occasional 6/10, Impact: Critical 9/10, Score: 54)
- Description: Agent-generated research is sloppy, misses key competitors, or contains factual errors. Customers expect hand-crafted, expert-level analysis.
- Base case assumption: Agent completes 60% of projects fully; 40% require significant human rework.
- Concern threshold: If > 50% of projects require rework, the agent isn't delivering promised efficiency.
- Impact: If agent quality is poor, we lose the unit economics advantage. Projects that should cost $2k to deliver now cost $5k (due to human rework).
- Mitigation:
  1. Set realistic expectations with customers: Be transparent that some projects use agent-assisted research. Charge lower price ($3k–$5k) for agent-heavy projects vs. full-human ($10k+). Cost: messaging/positioning change, no cost. Confidence: 8/10. Timing: Month 1.
  2. Build QA process: Every research project goes through QA (human researcher validates facts, checks completeness). Cost: 0.5 FTE QA person ($2k/month), starts month 1. Confidence: 9/10. Timing: Month 1.
  3. Start with "agent-light" positioning: Market as "AI-assisted research" not "AI-fully-automated research." Let humans be the face of quality. Cost: positioning change, no cost. Confidence: 9/10. Timing: Month 1.
  4. Test agent thoroughly before launch: Run 10 test research projects, have expert researcher evaluate. Cost: time, low-medium effort. Confidence: 8/10. Timing: Pre-launch.
- Early warning: Customer feedback on agent-generated sections (identify which projects were agent-heavy vs. human-heavy). If agent-generated sections consistently rated 3/5 vs. human 5/5, we have a problem.
- Contingency: If research quality is poor, pivot: (a) reduce agent automation; do 80% human, 20% agent. Accept lower margins but higher quality. Or (b) segment: agent-generated research for price-sensitive customers; human research for premium customers.
- Confidence in mitigation: 7/10 (quality control is hard with agents; requires continuous refinement)

Risk 2: Customers Expect Customization That Agent Can't Deliver (Likelihood: Frequent 7/10, Impact: High 7/10, Score: 49)
- Description: Customers ask for custom research scope, deep dives on specific competitors, industry-specific analysis. Agent can do templated research but struggles with custom.
- Mitigation:
  1. Design projects with standard scope: "Competitive analysis includes 5 key competitors, SWOT, pricing." No custom scopes. Cost: sales discipline, no cost. Confidence: 7/10 (some customers will push back). Timing: Month 1.
  2. Offer "custom research" as add-on: Standard project is $5k (agent-heavy); custom deep-dive is $20k (human-heavy). Cost: sales training, no cost. Confidence: 8/10. Timing: Month 1.
  3. Build agent capability incrementally: After first 10 projects, identify the most common custom requests. Train agent on these. Cost: ongoing training, low effort. Confidence: 6/10 (agent learning is slow). Timing: Month 3+.
- Early warning: Customers requesting custom scope; sales team gets pushback from customers on standard scope.
- Contingency: Offer custom scope at higher price to absorb human labor cost.
- Confidence: 7/10 (segmentation strategy is proven, but execution requires discipline)

Medium Risks:

Risk 3: Customer Fails to Get Value from Research (Likelihood: Occasional 5/10, Impact: Medium 6/10, Score: 30)
- Description: Research is accurate but doesn't answer the customer's real question or inform a decision. Customer thinks it was a waste of money.
- Mitigation:
  1. Discovery call before research: Spend 30 minutes on a discovery call to ensure we understand the customer's actual question. Cost: sales person time, no extra cost. Confidence: 8/10. Timing: Month 1.
  2. Interim briefing: Present initial findings to customer mid-project; get feedback. Cost: time (maybe 1–2 hours per project), low. Confidence: 8/10. Timing: Month 1.
  3. Scope clarity: Document the research scope clearly in the proposal. Cost: process discipline, no cost. Confidence: 8/10. Timing: Month 1.
- Early warning: Customer NPS < 50, or customer doesn't use the research, or follows up with complaints.
- Contingency: Offer redo or refund; gather feedback on what went wrong.
- Confidence: 8/10 (discovery calls are standard in services; should prevent most misalignment)

Low Risks:

Risk 4: Dependency on LLM Provider (Likelihood: Occasional 3/10, Impact: High 7/10, Score: 21)
- Description: OpenAI (or other LLM provider) discontinues API, increases pricing dramatically, or degrades quality.
- Mitigation:
  1. Use Claude (Anthropic API) as primary + OpenAI as backup. Cost: maintain two API integrations, minimal. Confidence: 9/10. Timing: Month 1.
  2. Monitor pricing: set alerts for pricing changes. Cost: minimal. Confidence: 8/10. Timing: Ongoing.
  3. Build pricing elasticity: if LLM costs increase, increase project prices by 10–15%. Cost: no cost, but requires customer communication. Confidence: 6/10 (customers may resist price increases). Timing: As needed.
- Early warning: Pricing announcement from LLM provider.
- Contingency: Switch to alternative provider or reduce project scope to reduce LLM usage.
- Confidence: 8/10 (LLM is a commodity; alternatives exist)

Recommendation: CONDITIONAL GO
- Core risk is research quality (agent vs. human perception). This is mitigatable with QA process and positioning.
- Key success factors:
  1. Deliver first 3 projects with strong QA (no rework needed)
  2. Customers report NPS > 40 and would pay again
  3. Establish reputation for quality to justify premium pricing
- Conditions:
  1. Hire QA person by month 1 (before we take on volume)
  2. Run 3 test projects with experts to validate quality (week 1–2)
  3. Price first projects conservatively ($3k–$5k, not $10k) to build case studies
- If QA can't scale or research quality is consistently poor, pivot to "humans do 80%, agents do 20%" model.
```

## Error Handling & Edge Cases

### Ambiguous or Contradictory Risk Assessments

**Issue:** Different people assess the same risk differently (e.g., one person thinks CAC inflation is "rare," another thinks "frequent").
- **Handling:** Document both perspectives. Resolve by running a small test (acquire 20 customers in week 1–2; measure actual CAC). Use real data, not opinions.

### Risk Assessment is Outdated

**Issue:** Risk register was created in month 1; now it's month 3 and some risks have materialized or changed.
- **Handling:** Update the risk register monthly. Remove risks that have materialized (move them to "things we dealt with"). Add new risks that emerge. Reassess likelihood/impact based on new data.

### Mitigation is More Expensive Than Accepting the Risk

**Issue:** Risk mitigation costs $50k, but the financial impact of the risk is only $20k.
- **Handling:** Don't mitigate. Accept the risk. Document the decision.

### Critical Risk Has No Viable Mitigation

**Issue:** Risk = "Incumbent responds with 50% price cut." We can't mitigate (incumbent pricing is their choice).
- **Handling:** This is an "acceptance and preparation" risk. Design contingencies (build switching costs, improve features, focus on customer relationships). Accept that margin may be lower if this happens.

## Performance & Scaling

**Risk Analyst Execution Time:**
- 1–2 weeks to identify and assess risks comprehensively.
- Iterates with all Phase 3 components.
- Monthly updates thereafter.

**Risk Monitoring:**
- Ongoing; requires 1–2 hours per week to monitor key metrics and review risk register.
- Escalation protocol if red flags are triggered (founder + board review).

## Dependencies

### Depends On

- **All Phase 2 and Phase 3 outputs:** Business model, agent architecture, GTM plan, financial projections.
- **Feasibility Report (Phase 2):** Technical risks, regulatory risks, dependency risks.

### Depended On By

- **Resource Planner (3.5):** Risk mitigation costs, contingency budget, hiring timeline for mitigation.
- **Blueprint Packager (3.6):** Risk register for the final blueprint.

## Success Metrics

1. **Comprehensiveness:**
   - All major risk categories are covered (market, product, competitive, operational, financial, dependency, team, regulatory).
   - No "blindside" risks emerge in month 1 of execution that weren't identified.

2. **Realism:**
   - Likelihood and impact assessments are grounded in data, benchmarks, and precedent (not gut feeling).
   - Mitigations are actually executable (not wishful thinking).

3. **Actionability:**
   - Founder can extract mitigation actions and early warning indicators from the risk register.
   - Risk monitoring dashboard is simple and trackable (5–10 key metrics).

4. **Decision Value:**
   - Risk register informs go/no-go decision (founder is confident or concerned based on risk profile).
   - Founder uses contingency plans if risks materialize.

5. **Alignment:**
   - Risks identified are consistent with vulnerabilities identified in validation phase.
   - No contradiction between risk profile and business model unit economics.

## Implementation Notes

### Suggested Tech Stack

**Risk Tracking:**
- Simple: Google Sheets or Notion (risk register, tracking, updates).
- Sophisticated: Looker, Tableau, or custom dashboard (metrics visualization, early warning alerts).

**Risk Monitoring:**
- Custom dashboards: Query business metrics (Google Analytics, internal DB) for key risk indicators.
- Alerting: If metric crosses threshold, auto-alert via email/Slack.

### Build Steps

1. **Identify all risks** (brainstorm across all categories).
2. **Assess likelihood and impact** for each risk (use data where possible; benchmark against similar companies).
3. **Prioritize risks** (focus on critical/high risks first).
4. **Design mitigations** for top 10–15 risks.
5. **Define early warning indicators** for each risk.
6. **Plan contingencies** if mitigations fail.
7. **Model financial impact** (downside / base / upside scenarios).
8. **Create monitoring dashboard** with key metrics and escalation protocol.
9. **Document the risk register** and share with team.

---

This specification provides a comprehensive framework for risk management across a startup's lifecycle. The key is ensuring risks are identified early, mitigations are realistic, and contingencies are ready for execution.
