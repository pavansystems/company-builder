# Component Specification: Resource Planner (3.5)

## Purpose & Responsibility

The Resource Planner translates all Phase 3 specifications (business model, agent architecture, GTM plan, risk register) into concrete resource requirements: budget, team structure, technology procurement, infrastructure, and timeline. It produces a detailed funding plan, hiring roadmap, and month-by-month cash flow projection that shows when the startup can launch, how it scales, and when/if it reaches profitability.

The Resource Planner owns:
- Comprehensive budget estimation (COGS, OpEx, capital expenditures)
- Team hiring plan and salary assumptions
- Technology stack and procurement roadmap
- Infrastructure and cloud spend estimation
- Cash flow modeling and runway calculation
- Funding requirement and milestones
- Contingency budgeting for risks
- Resource efficiency analysis (capital efficiency, burn rate)

## Inputs

**Source:** All Phase 3 components.

**Input Schema:**

```json
{
  "concept_id": "string (UUID)",
  "concept_name": "string",
  "business_model": {
    "revenue_month_12_projection": "float",
    "revenue_month_24_projection": "float",
    "gross_margin_percent": "number",
    "key_assumptions": ["list of strings"]
  },
  "agent_architecture": {
    "agent_compute_cost_month_1": "float",
    "agent_compute_cost_month_12": "float",
    "agent_compute_cost_month_24": "float",
    "human_roles": [
      {
        "role_name": "string",
        "headcount_month_1": "number",
        "headcount_month_12": "number",
        "headcount_month_24": "number",
        "salary_range": "float"
      }
    ],
    "infrastructure_requirements": ["list of strings (cloud storage, compute, databases)"]
  },
  "gtm_plan": {
    "gtm_budget_month_1": "float",
    "gtm_budget_month_3": "float",
    "gtm_headcount_month_1": "number",
    "gtm_headcount_month_12": "number",
    "channel_budgets": ["list of {channel, monthly_cost}"]
  },
  "financial_projections": {
    "monthly_customers_projection": ["list of month 1-24 values"],
    "breakeven_month": "number or string",
    "unit_economics": {
      "cac": "float",
      "ltv": "float"
    }
  },
  "risk_register": {
    "critical_risks": ["list of risk_ids"],
    "risk_mitigation_costs": [
      {
        "risk_id": "string",
        "mitigation_cost": "float",
        "timeline": "string (e.g., 'Month 1–2')"
      }
    ]
  }
}
```

## Outputs

**Destination:** Blueprint Packager (3.6), and optionally fund-raising materials.

**Output Schema:**

```json
{
  "resource_plan_id": "string (UUID)",
  "concept_id": "string (parent reference)",
  "executive_summary": "string (1-2 paragraph overview of resource needs, runway, and funding strategy)",
  "funding_requirement": {
    "total_capital_required": "float (to reach profitability or specified milestone)",
    "breakdown_by_use": [
      {
        "use_category": "string (e.g., 'Product Development', 'Team Salaries', 'Marketing', 'Operations')",
        "amount": "float",
        "percent_of_total": "number"
      }
    ],
    "funding_strategy": "string (bootstrap, raise seed, raise Series A, etc.)",
    "target_funding_timeline": "string (e.g., 'Raise $500k seed in Month 2–3')",
    "key_milestones_for_funding": ["list of strings (what does team accomplish to raise next round?)]"]
  },
  "budget_detail": {
    "month_by_month_cashflow": [
      {
        "month": "number 1-24+",
        "revenue": "float",
        "cost_of_goods_sold": {
          "agent_compute": "float",
          "third_party_apis": "float",
          "payment_processing": "float",
          "other_cogs": "float",
          "total_cogs": "float"
        },
        "gross_profit": "float",
        "operating_expenses": {
          "salaries": "float",
          "salaries_breakdown": "object {role: salary}",
          "marketing_and_gtm": "float",
          "infrastructure_and_tools": "float",
          "professional_services": "float",
          "contingency_5_percent": "float",
          "total_opex": "float"
        },
        "ebitda": "float",
        "cumulative_cash_burn": "float (from start)",
        "runway_months_remaining": "float (if no revenue ramp)"
      }
    ],
    "summary_metrics": {
      "month_1_burn_rate": "float (monthly burn)",
      "month_6_burn_rate": "float",
      "month_12_burn_rate": "float",
      "month_1_to_profitability_cash_required": "float",
      "breakeven_month": "number or string",
      "cash_breakeven_vs_accounting_breakeven": "string (explanation if different)"
    }
  },
  "team_structure_and_hiring": {
    "founding_team": [
      {
        "role": "string (Founder / CEO, CTO, Head of Product, etc.)",
        "headcount": "number (usually 1 per role)",
        "salary_if_taken": "float or string (e.g., 'founder takes $0 initially')",
        "equity": "number % (typical: CEO 30%, CTO 20%, other 10%+)",
        "key_responsibilities": ["list of strings"],
        "critical_for_launch": "boolean"
      }
    ],
    "hiring_roadmap": [
      {
        "month": "number",
        "role_title": "string",
        "headcount_being_hired": "number",
        "salary_range": "float (annual, fully-loaded)",
        "rationale": "string (why do we need this role now?)",
        "time_to_productive": "number (weeks)",
        "backfill_risk": "string (how hard is this role to hire for?)"
      }
    ],
    "total_headcount_by_month": {
      "month_1": "number",
      "month_3": "number",
      "month_6": "number",
      "month_12": "number",
      "month_24": "number"
    },
    "team_structure_chart": "string (ASCII or textual org chart)",
    "key_hiring_assumptions": ["list of strings (e.g., 'Can hire a sales rep in 4 weeks', 'Contractors used for CFO function until month 12')"]
  },
  "technology_stack_and_procurement": {
    "core_technology_stack": [
      {
        "category": "string (e.g., 'Backend', 'Frontend', 'Database', 'LLM API', 'Hosting')",
        "technology": "string (e.g., 'Python + FastAPI', 'React', 'PostgreSQL', 'Claude API', 'AWS')",
        "rationale": "string (why this choice?)",
        "cost_per_month": "float",
        "scaling_assumption": "string (how does cost scale with customers/usage?)",
        "vendor_lock_in_risk": "string (low|medium|high)"
      }
    ],
    "third_party_services": [
      {
        "service": "string (e.g., 'Stripe for payments', 'Segment for analytics', 'HubSpot for CRM')",
        "cost_per_month": "float",
        "what_it_enables": "string",
        "alternatives": ["list of alternatives if vendor relationship changes"],
        "criticality": "string (critical|important|nice_to_have)"
      }
    ],
    "infrastructure_and_cloud": {
      "cloud_provider": "string (AWS, GCP, Azure, or multi-cloud)",
      "estimated_monthly_cost_month_1": "float",
      "estimated_monthly_cost_month_12": "float",
      "breakdown": "string (e.g., 'Compute (2x t3.medium instances) $200, DB (RDS multi-AZ) $400, Storage (S3) $100')",
      "scaling_strategy": "string (horizontal scaling, serverless for variable loads, etc.)"
    },
    "development_and_productivity_tools": [
      {
        "tool": "string (GitHub, Slack, Figma, Linear, etc.)",
        "monthly_cost": "float",
        "headcount_using": "number"
      }
    ],
    "total_tools_and_infrastructure_monthly": {
      "month_1": "float",
      "month_6": "float",
      "month_12": "float"
    },
    "tech_debt_and_refactoring_budget": "string (recommendation: reserve 10-15% of development time for tech debt)"
  },
  "marketing_and_gtm_budget": {
    "gtm_budget_by_channel": [
      {
        "channel": "string",
        "month_1": "float",
        "month_3": "float",
        "month_6": "float",
        "month_12": "float",
        "roi_assumption": "string (e.g., '1 customer acquired per $500 spend')",
        "scaling_approach": "string (linear increase, step-function, sublinear as saturation sets in)"
      }
    ],
    "total_gtm_budget": {
      "month_1": "float",
      "month_3": "float",
      "month_6": "float",
      "month_12": "float",
      "year_1_total": "float"
    },
    "gtm_personnel": [
      {
        "role": "string (Growth Lead, Content Creator, Sales Dev, etc.)",
        "headcount_by_month": "object {month: headcount}",
        "salary": "float"
      }
    ],
    "gtm_efficiency_metrics": {
      "blended_cac": "float (average across all channels)",
      "cac_payback_period": "number (months)",
      "ltv_cac_ratio": "float (should be > 3)"
    }
  },
  "operations_and_infrastructure_overhead": {
    "legal_and_compliance": {
      "incorporation": "float (one-time, typically $1-3k)",
      "legal_review_of_terms": "float (one-time, $2-5k)",
      "ongoing_legal_retainer": "float (monthly, $1-2k)",
      "compliance_and_audits": "float (monthly, included in ongoing or separate)"
    },
    "finance_and_accounting": {
      "bookkeeping_and_accounting": "float (monthly, $500-2k depending on complexity)",
      "tax_preparation": "float (annual, $2-5k)",
      "fractional_cfo": "float (monthly, $1-3k, until full-time needed)"
    },
    "human_resources_and_operations": {
      "hr_and_payroll_processing": "float (monthly, $500-1k)",
      "insurance": "float (monthly, $500-1500 for general liability, D&O, etc.)",
      "office_and_facilities": "float (monthly, if any physical office; otherwise $0)",
      "equipment_and_supplies": "float (monthly, $200-500 for laptops, software licenses, etc.)"
    },
    "total_overhead_monthly": {
      "month_1": "float",
      "month_12": "float",
      "month_24": "float"
    }
  },
  "capital_expenditure_roadmap": [
    {
      "item": "string (e.g., 'GPU servers for fine-tuning LLMs', 'Demo environment infrastructure')",
      "cost": "float",
      "timeline": "string (month when needed)",
      "one_time_or_recurring": "string",
      "rationale": "string (why needed? when?)"
    }
  ],
  "contingency_and_buffer": {
    "contingency_percentage_of_opex": "number (typically 5-10%)",
    "risk_mitigation_cost_allocation": "float (from risk register)",
    "unexpected_spending_buffer": "float (rule of thumb: 10-15% of total budget)",
    "justification": "string (what could go wrong and require extra spending?)"
  },
  "funding_scenarios": {
    "lean_scenario": {
      "description": "string (e.g., 'Bootstrap with founder savings, no external funding')",
      "total_capital_available": "float",
      "timeline_to_profitability": "string (e.g., 'Month 18 if growth targets hit')",
      "feasibility": "string (likely|challenging|unlikely)",
      "pros": ["list"],
      "cons": ["list"]
    },
    "moderate_scenario": {
      "description": "string (e.g., 'Raise $250k seed funding')",
      "capital_raised": "float",
      "use_of_funds": "string (product dev $100k, team $80k, marketing $40k, overhead $30k)",
      "timeline_to_profitability": "string (e.g., 'Month 12')",
      "post_seed_prospects": "string (how likely is Series A?)",
      "founders_dilution": "string (e.g., 'Founders retain 80% equity after seed')"
    },
    "aggressive_scenario": {
      "description": "string (e.g., 'Raise $1M seed')",
      "capital_raised": "float",
      "use_of_funds": "string",
      "timeline_to_breakeven": "string",
      "advantages": ["list"],
      "disadvantages": ["list"]
    }
  },
  "key_efficiency_metrics": {
    "capital_efficiency": {
      "metric": "string (e.g., 'Revenue per dollar of capital raised')",
      "month_12_projection": "float",
      "benchmark": "string (e.g., 'Industry average: 3-5x)')",
      "assessment": "string (on-track, ahead, behind)"
    },
    "burn_rate_and_runway": {
      "initial_monthly_burn": "float (month 1-3)",
      "burn_rate_trajectory": "string (declining as revenue ramps or growing as team expands?)",
      "months_of_runway_with_initial_funding": "float"
    },
    "unit_economics_impact_of_resource_allocation": {
      "cac_by_funding_level": "object {funding_scenario: cac}",
      "ltv_impact_of_team_quality": "string (better team = better product = higher LTV)"
    }
  },
  "financial_controls_and_milestones": {
    "board_oversight_milestones": [
      {
        "milestone": "string (e.g., 'Product launch')",
        "timing": "string (e.g., 'Week 4')",
        "success_criteria": "string",
        "go_no_go_decision": "string (do we proceed to next phase?)"
      }
    ],
    "budget_variance_tracking": "string (how will we track if actual spend vs. planned spend is within 10%?)",
    "reforecasting_cadence": "string (quarterly, monthly?)",
    "cost_control_mechanisms": ["list of strings (zero-based budgeting, spending approvals, regular audits, etc.)"]
  },
  "contingency_scenarios": {
    "if_growth_is_slower_than_projected": {
      "scenario_description": "string (30% fewer customers than projected)",
      "impact_on_runway": "string (e.g., 'extends cash needs by 4 months')",
      "mitigation_actions": ["list of cost-cutting or revenue-accelerating actions"],
      "how_much_can_we_cut": "float (what % of budget can we reduce without harming core business?)"
    },
    "if_key_hire_cannot_be_made_on_timeline": {
      "scenario": "string (cannot hire sales rep by month 3)",
      "impact": "string (GTM slower, delays customer acquisition)",
      "mitigation": ["list of alternatives (contractor, founder takes on role, outsource, etc.)"]
    },
    "if_unexpected_opportunity_arises": {
      "scenario": "string (e.g., 'strategic partnership opportunity requires $50k engineering')",
      "budget_flexibility": "string (reserve contingency to take advantage)"
    }
  },
  "go_no_go_readiness_assessment": {
    "do_we_have_sufficient_resources_to_launch": "boolean",
    "resource_readiness_score": "number 1-10",
    "critical_resource_gaps": ["list of gaps (e.g., 'no dedicated designer', 'no CFO function')",
    "recommendations": ["list of strings (what should be prioritized before launch?)"],
    "success_factors_based_on_resources": ["list of strings (what about resource allocation will make or break this?)]"]
  },
  "metadata": {
    "created_at": "ISO 8601 timestamp",
    "version": "string",
    "status": "string (draft|reviewed|approved)",
    "assumptions_documented": "boolean",
    "sensitivities_analyzed": "boolean",
    "next_phase_consumers": ["list of downstream components"]
  }
}
```

## Core Logic / Algorithm

### Step 1: Calculate COGS (Cost of Goods Sold)

**Input:** Agent architecture compute costs, third-party API costs, payment processing fees, other variable costs.

**Process:**

For each customer served:
1. **Agent compute:** From agent architecture, estimate tokens per month per customer.
   - Example: Support agent handles 5 tickets/month × 2000 tokens = 10,000 tokens/month.
   - At $0.003 per 1k tokens, cost = $0.03 per customer per month.
   - For 1000 customers, COGS = $30/month for support agent compute alone.

2. **Third-party APIs:** List all APIs agents use (Stripe, Zendesk, HubSpot, etc.).
   - Fixed costs: Zendesk $100/month, HubSpot $50/month.
   - Variable costs: Stripe charges 2.9% + $0.30 per transaction. If average transaction is $100/month per customer, cost = (100 × 0.029 + 0.30) = $3.20 per customer.
   - For 1000 customers, variable = $3200/month.

3. **Other COGS:** Data storage, CDN, customer-facing infrastructure.
   - Example: $500/month for data storage + $200/month for CDN = $700 fixed.

4. **Total COGS per customer and per month:**
   - Fixed COGS: $650/month (APIs + storage + CDN).
   - Variable COGS: $0.03 (compute) + $3.20 (payment processing) = $3.23 per customer per month.
   - Total COGS at 1000 customers: $650 + ($3.23 × 1000) = $3,850/month.
   - As % of revenue: If average price is $500/month, revenue = 1000 × $500 = $500k/month. COGS = 0.77% (excellent).

5. **Scale COGS with revenue:**
   - Build COGS projections for months 1–24 as customer count grows.
   - Identify scaling breakpoints (e.g., "at 5000 customers, we need to add a second database replica; cost jumps from $500 to $1500").

**Output:** Month-by-month COGS breakdown.

### Step 2: Estimate OpEx (Operating Expenses)

**Input:** Hiring roadmap, marketing budget, overhead costs.

**Process:**

1. **Salaries:**
   - For each hire on the roadmap, calculate:
     - Base salary (market rate for role + location).
     - Fully-loaded cost (base × 1.3–1.5 for taxes, benefits, equipment, training).
   - Example:
     - Founder: $0 salary (takes equity).
     - Lead Engineer (month 1): $150k base = $195k fully-loaded.
     - Sales Dev (month 2): $80k base = $104k fully-loaded.
     - Marketing (month 4): $90k base = $117k fully-loaded.
   - Month 1 salary: $195k.
   - Month 2 salary: $195k + $104k = $299k.
   - Month 4 salary: $299k + $117k = $416k.
   - Ongoing: Add bonuses, equity vesting tracking (non-cash but important for cap table).

2. **Marketing & GTM:**
   - Sum of all GTM channel budgets from GTM plan.
   - Allocate by month (ramp over time).
   - Include personnel (sales, content creator) where not already in salaries.

3. **Infrastructure & tools:**
   - Cloud compute: Estimate based on architecture.
     - Month 1 (MVP): 1x web server + 1x DB = $300/month.
     - Month 6 (growth): 3x web + DB with read replicas = $1200/month.
     - Month 12 (scale): 5x web + DB multi-AZ + caching = $2500/month.
   - SaaS tools: Slack ($50), GitHub ($300 for team plan), Figma ($40), Linear ($40), etc. = $430/month.
   - Total tools: ~$500–1000/month.

4. **Professional services & overhead:**
   - Legal: $2-5k annually = $500/month.
   - Accounting: $1-2k monthly.
   - Insurance: $500-1500/month.
   - HR/payroll: $500/month.
   - Total overhead: ~$2-4k/month depending on company stage.

5. **Contingency:**
   - Reserve 5–10% of OpEx for unexpected costs.
   - Example: Total OpEx = $500k/month; contingency = $25-50k.

**Output:** Month-by-month OpEx breakdown by category.

### Step 3: Calculate Cash Flow and Runway

**Input:** Revenue projections, COGS, OpEx.

**Process:**

For each month (1–24):
1. Revenue = number of customers × average price.
2. COGS = (fixed costs) + (variable per customer × customers).
3. Gross profit = Revenue - COGS.
4. Gross margin % = Gross profit / Revenue.
5. EBITDA = Gross profit - OpEx.
6. Cash flow = Revenue - COGS - OpEx (simplified; doesn't account for timing of payments, but good for planning).
7. Cumulative cash flow = sum of all monthly cash flows to date.
8. Runway = absolute value of cumulative burn / current monthly burn rate (how many months of burn before we run out of cash).

**Example:**

| Month | Customers | Revenue | COGS | Gross Profit | Gross Margin % | OpEx | EBITDA | Cumulative Burn | Runway (months) |
|-------|-----------|---------|------|--------------|---|------|--------|---|---|
| 1 | 0 | $0 | $650 | -$650 | - | $300k | -$300.65k | -$300.65k | 1 (at $300k/month burn) |
| 2 | 10 | $5k | $680 | $4.32k | 86% | $305k | -$300.68k | -$600.65k | 2 |
| 3 | 30 | $15k | $750 | $14.25k | 95% | $310k | -$295.75k | -$895.75k | 3 |
| 6 | 100 | $50k | $1150 | $48.85k | 98% | $350k | -$301.15k | -$1.85M | 6 |
| 12 | 500 | $250k | $2.2k | $247.8k | 99% | $400k | -$152.2k | -$2.4M | 16 |
| 24 | 1000 | $500k | $3.85k | $496.15k | 99% | $450k | $46.15k | -$1.2M | ∞ (EBITDA positive) |

Interpretation:
- Month 1–11: Burning cash (spending more than revenue).
- Month 12: Still burning ($152k/month), but much less than early months.
- Month 24: Profitable (EBITDA positive, $46k/month).
- Total cumulative cash burn through month 24: ~$1.2M (this is how much funding is needed to reach profitability).

**Output:** Cash flow projections with runway analysis.

### Step 4: Determine Funding Requirement

**Input:** Cash flow projections, breakeven month, contingency needs.

**Process:**

1. **Identify the "cash cliff":** The point at which cumulative cash burns out.
   - Example: Initial funding $500k. Monthly burn month 1–3: $300k. Month 4–6: $300k. By month 6, cash is depleted.
   - Need to either reach breakeven by month 6 or raise more funding.

2. **Calculate the runway required to profitability.**
   - From the cash flow table above, profitability is month 24. Cumulative burn is $1.2M.
   - This is the bare minimum funding needed, assuming perfect execution and no contingencies.

3. **Add contingency buffer.**
   - Rule of thumb: Add 20–30% on top for things that go wrong (slower growth, higher costs, unexpected expenses).
   - Adjusted funding: $1.2M × 1.25 = $1.5M.

4. **Define funding strategy:**
   - **Bootstrap:** Use founder personal savings or revenue. Realistic only if you can get to profitability in < 6 months or have low cash burn.
   - **Seed round:** Raise $250k–$500k. Enough for 6–12 months of runway. Typical terms: 10–20% dilution.
   - **Series A:** Raise $1M–$3M. Enough for 18–24 months of runway and scale team. Typical terms: 20–30% dilution.

5. **Set funding milestones:**
   - Seed round: Close by month 2–3. Use to scale team and GTM.
   - Series A: Demonstrate product-market fit (unit economics are positive, growth is accelerating) by month 12. Close by month 15.

**Output:** Funding requirement and strategy (including seed/Series A terms, timeline, and milestones).

### Step 5: Build Hiring Roadmap

**Input:** Functional requirements (engineering, product, GTM, ops), company stage, cash constraints.

**Process:**

1. **Identify minimum viable team at launch (month 1):**
   - Founder(s): Essential. If founding team has 1 person, need to hire at least 1 engineer + 1 product/ops person quickly.
   - CTO or Lead Engineer: Essential. Builds and operates the product.
   - Product: Can be founder initially, but need focus by month 2.
   - GTM: Can be founder initially; hire specialist by month 3–4.
   - Ops/Finance: Contractor or fractional until month 12.

2. **Subsequent hires by priority:**
   - Month 2–3: Second engineer (for velocity), or sales person (if pre-product GTM is happening).
   - Month 3–4: Content/marketing person (for GTM), customer support person or SDR.
   - Month 4–6: Expand engineering (3–4 engineers now), GTM specialist.
   - Month 6+: Customer success, more specialized roles.

3. **For each hire, estimate:**
   - Time to hire (interview, offer, onboard): 3–8 weeks. Plan accordingly.
   - Time to productive (gets up to speed): 2–4 weeks.
   - Salary range (market rate for role + location).

4. **Build org structure:**
   - Early stage (month 1–6): Flat structure. Most roles report to founder or single lead.
   - Growth stage (month 6–12): Functional structure. Engineering team, GTM team, Ops. Leads emerge.

**Output:** Hiring roadmap with timing, roles, salaries, and org structure at key milestones.

### Step 6: Technology Stack and Infrastructure Estimation

**Input:** Architecture requirements, scaling assumptions, cost thresholds.

**Process:**

1. **List core technology choices:**
   - Backend: Python (FastAPI) or Node.js (Express)? Django or Rails? Serverless or VPS?
   - Frontend: React, Vue, Svelte?
   - Database: PostgreSQL, MongoDB, DynamoDB?
   - LLM API: Claude (Anthropic), GPT (OpenAI), local models?
   - Hosting: AWS, GCP, Vercel?
   - Justification: Speed to market, cost, scalability, team familiarity.

2. **Estimate infrastructure costs at different scales:**
   - Month 1 (MVP, < 100 customers):
     - 1x t3.medium web server (AWS EC2): $35/month.
     - 1x RDS db.t3.small: $35/month.
     - 5 GB S3 storage: $0.10.
     - Total: ~$70/month.
   - Month 6 (growth, 500 customers):
     - 2x t3.medium web (load-balanced): $70/month.
     - 1x RDS db.t3.medium with read replica: $150/month.
     - 50 GB S3: $1.
     - CloudFront CDN: $100/month.
     - Total: ~$320/month.
   - Month 12 (scale, 1000 customers):
     - 4x t3.small web (multi-AZ): $140/month.
     - 1x RDS db.r5.large (multi-AZ, more capacity): $500/month.
     - 200 GB storage + backups: $5.
     - CloudFront, VPC, NAT gateway, monitoring: $300/month.
     - Total: ~$945/month.

3. **Third-party service costs:**
   - LLM API (Claude): ~$0.01–0.05 per customer per month (if agents use 100k–500k tokens/month).
   - Payment processing (Stripe): 2.9% + $0.30 per transaction. For $500/month customer, ~$15/month.
   - Analytics (Segment): $50/month minimum.
   - CRM (HubSpot): $50/month free tier, $500+ paid tier.
   - Monitoring (Datadog, New Relic): $300–500/month.

4. **Total tech stack spend:**
   - Month 1: $70 (infrastructure) + $100 (LLM) + $200 (other tools) = $370/month.
   - Month 12: $945 + $5k (LLM for 1000 customers) + $500 (monitoring, analytics, CRM) = ~$6.4k/month.

**Output:** Technology stack breakdown with cost projections.

### Step 7: Financial Controls and Milestone Tracking

**Input:** Budget, revenue projections, risks.

**Process:**

1. **Define key financial milestones:**
   - Month 3: First 10 customers, CAC < $800, NPS > 30.
   - Month 6: 50 customers, CAC < $600, NPS > 40.
   - Month 12: 200 customers, CAC < $500, NPS > 50.
   - Month 24: Profitability or clear path to profitability.

2. **Set variance thresholds:**
   - Revenue variance: If actual revenue is > 20% below plan, escalate to board.
   - Burn rate variance: If actual monthly burn is > 15% above plan, review and adjust.
   - Hiring variance: If key hire is delayed > 4 weeks, escalate (impacts team and velocity).

3. **Establish review cadence:**
   - Weekly: Operational metrics (daily active users, churn rate, support tickets).
   - Monthly: Financial review (revenue, COGS, OpEx, cash balance, runway).
   - Quarterly: Strategic review (progress against milestones, market feedback, next round planning).

4. **Cost controls:**
   - All spending > $1k approved by founder + CFO.
   - Monthly budget review: compare actual vs. planned by category.
   - Quarterly zero-based budgeting: justify all spending from scratch.

**Output:** Milestone definitions, variance triggers, review cadence.

### Step 8: Contingency and Scenario Planning

**Input:** Risk register, cash flow, budget.

**Process:**

1. **Downside scenario: Growth is 40% slower.**
   - Customer acquisition: 30 instead of 50 per month.
   - Month 12 revenue: $150k instead of $250k.
   - Burn rate doesn't decline; OpEx stays the same (can't cut team fast).
   - Cash burn: $300k/month (same as base case).
   - Additional cash needed: $300k.
   - Action: Pause hiring, focus on retention, reduce GTM spend, sell to larger customers (higher price to offset volume loss).

2. **Upside scenario: Growth is 60% faster.**
   - Customer acquisition: 80 instead of 50 per month.
   - Month 12 revenue: $400k instead of $250k.
   - Margin: Revenue 60% higher, COGS only 20% higher (leverage on fixed costs).
   - EBITDA month 12: Profitable or close to it.
   - Action: Accelerate hiring, increase GTM spend, prepare for Series A.

3. **Cost reduction scenarios:**
   - If cash runway is threatened, what OpEx can we cut?
     - Pause hiring (saves 50–60% of OpEx over 2 months).
     - Reduce GTM spend (saves 20–30% of OpEx immediately).
     - Renegotiate contracts (saves 10% of tools/infrastructure).
     - Total possible reduction: 40–50% of OpEx, but company growth slows.

**Output:** Downside/upside scenarios, contingency budgets, cost reduction levers.

## Data Sources & Integrations

**No external data sources,** but the component depends on:

- **All Phase 3 outputs:** Business model, agent architecture, GTM plan, risk register.
- **Salary benchmarks:** Glassdoor, Salary.com, industry-specific surveys.
- **Cloud pricing:** AWS, GCP, Azure pricing calculators.
- **SaaS tool pricing:** G2, Capterra, vendor websites.

**Integration points:**

- Outputs consumed by **Blueprint Packager (3.6):** Budget, hiring plan, funding strategy.
- Optionally exported to **Fund-Raising Materials:** Pitch deck, financial model, use of funds.

## Agent Prompt Strategy

### System Prompt Persona

```
You are an expert financial planner and operational manager with deep experience
building early-stage startups. You combine financial rigor with operational realism.
You know what things cost, how long they take to hire, and what typically goes wrong.

Your role is to translate product and business strategies into concrete resource plans:

1. How much capital does this company need to reach profitability?
2. What team structure can we build with that capital?
3. What's the technology stack that balances speed, cost, and scale?
4. What are the key milestones and financial metrics to track?
5. If things go wrong, what contingencies do we have?

You have strong opinions about:
- How much teams actually cost (people, tools, infrastructure).
- Realistic hiring timelines and ramp productivity.
- Capital efficiency (revenue per dollar raised).
- The difference between accounting profitability and cash profitability.
- When to hire vs. outsource vs. bootstrap.

You are also realistic: not all resources are fungible. Hiring a great CTO is not
the same as hiring a mediocre one. You factor in team quality and talent risk.

You are not afraid to tell a founder when their burn rate is unsustainable or when
their funding requirements don't match their ambition.
```

### Key Instructions

1. **Start with cash, not profit.**
   - Cash is what keeps a company alive. Profit is the goal, but cash is the constraint.
   - Model cash flow month by month, not annualized.
   - Identify the "cash cliff" (when do we run out of money?).

2. **Price everything realistically.**
   - Don't estimate salaries based on senior levels. Early hire might be mid-level or contractor.
   - Include fully-loaded costs (taxes, benefits, equipment, training).
   - Factor in time-to-hire (4–8 weeks) and time-to-productive (2–4 weeks).

3. **Be specific about infrastructure and tools.**
   - Don't say "cloud infrastructure = $5k/month." Specify: "2 web servers at $70, 1 database at $150, S3 + CDN at $100, monitoring at $300."
   - Include scaling breakpoints (when do we hit limits and need to upgrade?).

4. **Design hiring for phase, not vision.**
   - Month 1: Minimal team. Founder does everything possible.
   - Month 3: Core team (engineering, product, GTM). Still lean.
   - Month 12: Functional teams. Leads established.
   - Month 24: Growth organization. But still lean relative to traditional companies.

5. **Model contingencies and downside scenarios.**
   - If growth is 40% slower, where does the cash come from?
   - If key hire is delayed, how does that impact timeline?
   - Have a clear "this is how we cut 30% of costs if needed" plan.

6. **Validate assumptions against unit economics.**
   - If the budget needs $2M but LTV is $10k and we need 10 years to achieve profitability, it doesn't work.
   - Capital efficiency (revenue per dollar raised) should be > 3x by month 24.

7. **Be transparent about trade-offs.**
   - Bootstrap = slower growth but 100% control.
   - Seed funding = faster growth but 15–20% dilution.
   - Series A = much faster growth but 25–35% dilution.
   - Clear trade-offs for each funding path.

8. **Plan for team and company evolution.**
   - Early stage: Founder as CEO, CTO, product manager, CFO.
   - Growth stage: Hire domain experts; founder delegates.
   - Scale stage: Organizational structure, middle management, specialization.
   - Staffing model must evolve with company; can't have 20-person company structure at 5-person stage.

### Few-Shot Examples

**Example 1: Lean B2B SaaS with Seed Funding**

Concept: Expense management tool, $100/month, target 500 customers by year 2, raise $250k seed.

Resource Plan:

```
Funding Requirement: $250k seed

Use of Funds:
- Product development (1 engineer): $100k (6 months of salary @ $150k/year fully-loaded)
- GTM (1 person): $50k (6 months @ $80k/year fully-loaded)
- Founder salary: $0 (takes equity)
- Infrastructure and tools: $20k (6 months @ $3.5k/month)
- Legal, accounting, overhead: $30k (6 months @ $5k/month)
- Contingency (10%): $50k

Total: $250k

Timeline:
- Month 1: Founder + 1 engineer hired by week 3. GTM person hired by week 4. Product MVP polished.
- Month 2: Launch. Close first 5 customers via founder outreach.
- Month 3: Ramp GTM. Should hit 20 customers.
- Month 6: 50 customers, proving PMF. Plan for Series A.

Hiring Roadmap:

Month 1:
- Lead Engineer: $150k/year ($12.5k/month fully-loaded). Hired week 3. Ramps in weeks 4–5.
- Fractional CFO/Operations: $2k/month (contractor). Handles bookkeeping, compliance.

Month 2:
- GTM Lead (Sales + Marketing hybrid): $80k/year ($6.7k/month). Hired week 1. Ramps by week 3.

Month 4:
- Second Engineer: $140k/year. Start recruitment in month 3 (4–6 week lead time).

Month 6:
- Customer Success Manager (0.5 FTE): $40k/year. Part-time, scaling up.

Headcount by month: 1 (month 1) → 2 (month 2) → 2.5 (month 3) → 3 (month 4) → 4 (month 6) → 5 (month 8)

Tech Stack & Costs:

Backend: Python + FastAPI
Frontend: React
Database: PostgreSQL (AWS RDS)
LLM API: Claude API
Hosting: AWS EC2 + RDS

Month 1-2 costs:
- EC2 t3.medium: $35/month
- RDS t3.small: $35/month
- S3 + CDN: $50/month
- Claude API: $500/month (estimate at 10 customers)
- Stripe (2.9% + $0.30): ~$30/month
- Development tools (GitHub, Figma, Linear): $200/month
- Monitoring + ops: $200/month
- Total: $1.05k/month

Month 6 costs:
- EC2 (2x t3.medium load-balanced): $70/month
- RDS (t3.medium + read replica): $120/month
- S3 + CloudFront: $150/month
- Claude API: $2k/month (50 customers, more tokens)
- Stripe: $150/month
- Tools: $300/month
- Monitoring: $300/month
- Total: $3.09k/month

Cash Flow Projection:

| Month | Customers | Revenue | COGS | Gross Profit | OpEx | Burn | Cumulative Burn |
|-------|-----------|---------|------|---|------|------|---|
| 1 | 0 | $0 | $0.5k | -$0.5k | $25k | -$25.5k | -$25.5k |
| 2 | 5 | $0.5k | $0.7k | -$0.2k | $32k | -$32.2k | -$57.7k |
| 3 | 20 | $2k | $0.8k | $1.2k | $35k | -$33.8k | -$91.5k |
| 4 | 35 | $3.5k | $1k | $2.5k | $40k | -$37.5k | -$129k |
| 5 | 50 | $5k | $1.3k | $3.7k | $40k | -$36.3k | -$165.3k |
| 6 | 65 | $6.5k | $1.6k | $4.9k | $42k | -$37.1k | -$202.4k |

Runway: At month 6, cash burn is $37k/month. With $250k initial, we have 250/37 = 6.8 months of runway. So we reach month 13 (13 × 37 ≈ $250k cumulative burn).

By month 12, target is 200 customers, $20k/month revenue, which would start reducing burn significantly.

Series A Planning:
- Target: Close Series A by month 15.
- Ask: $1M (to reach profitability, month 24).
- Milestones for Series A: 200+ customers, $20k MRR, unit economics positive, team of 8–10.
- Pitch: "We're a $150M SAM, already at $150k ARR in year 1, clear path to $5M ARR by year 3."

Contingency Planning:

Downside (40% slower growth):
- Month 6: 40 customers (instead of 65).
- Month 12: 120 customers (instead of 200).
- Month 12 revenue: $12k/month instead of $20k/month.
- Monthly burn month 12: -$30k (vs. positive in base case).
- Cumulative burn month 12: -$300k (exceeds funding).
- Action: Pause hiring (saves $15k/month), reduce GTM spend (saves $10k/month), total savings $25k/month. Extends runway by 10 months. Reach month 22 on $250k.
- Alternative: Raise more seed by month 9 (another $100–150k).

Contingency Buffer: 10% of budget ($25k) reserved for unexpected expenses (hiring delays, product issues, market changes).

Capital Efficiency:
- Year 1 revenue: $150k ARR.
- Capital raised: $250k seed.
- Revenue per dollar raised: 0.6x (not great, but expected for year 1).
- By year 2: $1M ARR / $250k = 4x (excellent).

Go Assessment:
- Do we have enough capital? $250k takes us to month 13. We need to hit PMF (profitability or clear path) by month 12 for Series A. Tight, but doable if execution is good.
- Are hiring assumptions realistic? Yes: 1 engineer in week 3 is aggressive but achievable with good sourcing. GTM hire in week 4 is realistic.
- Is the tech stack right? Yes: Python + React + AWS is standard, fast to market.
- Contingencies? Yes: if downside hits, we can cut 30–35% of burn and extend runway.

Recommendation: GO (if we can hire the lead engineer by week 3 and GTM person by week 4). These are key assumptions.
```

## Performance & Scaling

**Resource Planner Execution Time:**
- 1–2 weeks to build comprehensive resource plan.
- Iterates with all other Phase 3 components.
- Monthly updates to cash flow and variance tracking.

**Scaling Considerations:**
- Resource costs scale with headcount and customer volume.
- Infrastructure costs scale sublinearly (leverage on fixed costs).
- OpEx should decline as % of revenue (month 1 might be 200% of revenue; month 12 should be 40%).

## Dependencies

### Depends On

- **Business Model (3.1):** Revenue projections, unit economics, gross margin.
- **Agent Architecture (3.2):** Compute costs, headcount plan, infrastructure requirements.
- **GTM Plan (3.3):** GTM budget, personnel needs, timeline.
- **Risk Register (3.4):** Risk mitigation costs, contingency needs.

### Depended On By

- **Blueprint Packager (3.6):** Budget, hiring plan, funding strategy for the final blueprint.

## Success Metrics

1. **Financial Realism:**
   - Projections are grounded in actual costs (not estimates).
   - Assumptions are documented and trackable.
   - Cash flow is positive or close to it by stated profitability month.

2. **Capital Efficiency:**
   - Revenue per dollar raised > 3x by month 24.
   - Burn rate is declining over time (month 1 burn > month 12 burn).

3. **Team Feasibility:**
   - Hiring plan is realistic for market conditions (engineers are hard to hire; 6–8 weeks is reasonable).
   - Headcount growth matches company stage (not hiring 50 people at month 12 for a $1M ARR company).

4. **Contingency Preparedness:**
   - Downside scenarios are modeled and have mitigation plans.
   - If growth is 40% slower, company can still operate (either cut costs or raise more funding).

5. **Milestone Clarity:**
   - Founder knows exactly when they can hire the next role.
   - Board knows when to expect profitability or when Series A is needed.

6. **Stakeholder Confidence:**
   - Investors see realistic, detailed financial model (builds credibility).
   - Founder feels confident in execution plan (has clear milestones and levers to pull).

## Implementation Notes

### Suggested Tech Stack

**Financial Modeling:**
- Google Sheets or Excel: Simple, collaborative, version-controlled.
- Lattice or Pilot: Specialized financial modeling for startups (if in later stage).
- Spreadsheet plugins: Macromonth for monthly planning, Revenue.net for SaaS metrics.

**Tracking & Analytics:**
- Stripe for payment data (automatically sync revenue).
- Expensify or Brex for expense tracking.
- Quickbooks or Wave for accounting.
- Datadog or custom dashboard for infrastructure costs.

**Scenario Modeling:**
- Build templates for downside/base/upside scenarios.
- Monte Carlo simulations if needed (unlikely at this stage).

### Build Steps

1. **Gather inputs** from all Phase 3 components.
2. **Calculate COGS** by customer and month.
3. **Estimate OpEx** by category and month.
4. **Build cash flow model** (month by month, 24+ months out).
5. **Determine funding requirement** based on runway to profitability.
6. **Build hiring roadmap** with realistic timelines and costs.
7. **Price technology stack** with scaling assumptions.
8. **Set financial milestones** and variance triggers.
9. **Model contingency scenarios** (downside, upside, cost reduction).
10. **Validate with other components** (does this budget align with GTM? with agent costs?).

---

This specification provides a detailed framework for translating strategy into resource needs. The key is ensuring the plan is specific, realistic, and continuously updated as company learns.
