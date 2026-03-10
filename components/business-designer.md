# Component Specification: Business Designer (3.1)

## Purpose & Responsibility

The Business Designer is responsible for translating a validated product concept into a coherent, financially-sound business model. Given a validated startup concept and its unit economics, this component defines exactly how the company generates revenue, at what price points, through which customer segments, and with what expansion opportunities.

The Business Designer owns:
- Revenue model selection and detailed design
- Pricing strategy and tier structure
- Customer journey mapping (awareness → activation → payment → expansion)
- Financial projections for 12–24 months
- Expansion revenue opportunities (upsell, cross-sell, marketplace effects)
- Go/no-go assessment of business model viability relative to unit economics

## Inputs

**Source:** Phase 2 outputs, specifically:
- Validated concept definition (from Phase 1)
- Unit economics model (from Step 2.5)
- Customer validation report (from Step 2.3), including:
  - Early-adopter personas
  - Willingness-to-pay estimates
  - Use case frequency and intensity
- Market sizing data (TAM/SAM/SOM from Step 2.1)
- Competitive pricing analysis (from Step 2.2)

**Input Schema:**

```json
{
  "concept_id": "string (UUID)",
  "concept_name": "string",
  "target_problem": "string",
  "agent_first_operations": {
    "customer_facing_processes": ["list of strings"],
    "internal_processes": ["list of strings"],
    "estimated_human_overhead_percentage": "number 0-100"
  },
  "unit_economics": {
    "cac": "float (cost per customer acquired)",
    "ltv": "float (lifetime value)",
    "ltv_cac_ratio": "float",
    "gross_margin_percentage": "number 0-100",
    "payback_period_months": "number",
    "agent_compute_cost_per_customer": "float"
  },
  "market_data": {
    "tam": "float (total addressable market in USD)",
    "sam": "float (serviceable addressable market)",
    "som": "float (serviceable obtainable market)",
    "addressable_customers_y1": "number"
  },
  "customer_validation": {
    "early_adopters": [
      {
        "persona_name": "string",
        "segment_size_estimate": "number",
        "monthly_willingness_to_pay": "float",
        "pain_severity": "string (high/medium/low)",
        "use_frequency": "string (daily/weekly/monthly)"
      }
    ],
    "proven_willingness_to_pay": "boolean",
    "search_volume_monthly": "number",
    "existing_solutions_average_cost": "float"
  },
  "competitive_pricing": {
    "competitors": [
      {
        "name": "string",
        "pricing_model": "string",
        "entry_price": "float",
        "price_ceiling": "float",
        "market_share_percent": "number"
      }
    ],
    "pricing_gaps": ["list of identified opportunities"]
  }
}
```

## Outputs

**Destination:** Phase 3 Blueprint inputs (Steps 3.5, 3.6), and optionally back to the user for review/iteration.

**Output Schema:**

```json
{
  "business_model_id": "string (UUID)",
  "concept_id": "string (parent reference)",
  "executive_summary": "string (2-3 paragraph overview)",
  "revenue_model": {
    "primary_model": "string (subscription|usage-based|marketplace|freemium|hybrid)",
    "model_description": "string (detailed explanation)",
    "why_this_model": "string (justification based on market, unit economics, and competitive positioning)",
    "revenue_streams": [
      {
        "stream_name": "string",
        "description": "string",
        "expected_contribution_percent": "number 0-100",
        "ramp_timeline": "string (e.g., 'Month 1', 'Month 6', 'Year 2')"
      }
    ]
  },
  "pricing_strategy": {
    "pricing_model_type": "string (flat|tiered|value-based|usage-based|hybrid)",
    "rationale": "string",
    "target_competitor_comparison": "string (how this compares to incumbents)",
    "tiers": [
      {
        "tier_name": "string (e.g., 'Starter', 'Professional', 'Enterprise')",
        "monthly_price": "float",
        "annual_price_discount_percent": "number",
        "target_segment": "string",
        "key_features": ["list of strings"],
        "monthly_willingness_to_pay_evidence": "string"
      }
    ],
    "usage_based_metrics": [
      {
        "metric_name": "string (e.g., 'reports_per_month', 'api_calls')",
        "unit_price": "float",
        "monthly_ceiling": "float or null"
      }
    ],
    "expansion_pricing": [
      {
        "upsell_type": "string (e.g., 'premium_support', 'data_export', 'api_access')",
        "price": "float",
        "expected_attachment_rate": "number 0-1",
        "rationale": "string"
      }
    ]
  },
  "customer_journey": {
    "awareness_phase": {
      "key_channels": ["string (e.g., 'content_marketing', 'search', 'community')"],
      "messaging_themes": ["string"],
      "estimated_monthly_reach": "number",
      "agent_vs_human_split": "object {agent_percent: number, human_percent: number}"
    },
    "consideration_phase": {
      "key_touchpoints": ["string (e.g., 'product_demo', 'trial', 'case_study')"],
      "trial_length_days": "number or null",
      "conversion_rate_estimate": "number 0-1",
      "agent_vs_human_split": "object {agent_percent: number, human_percent: number}"
    },
    "purchase_phase": {
      "sales_model": "string (self-serve|assisted|hybrid)",
      "sales_cycle_days": "number",
      "assisted_support_handoff_triggers": ["string"],
      "agent_vs_human_split": "object {agent_percent: number, human_percent: number}"
    },
    "onboarding_phase": {
      "onboarding_length_days": "number",
      "key_milestones": ["string"],
      "activation_success_metric": "string",
      "agent_vs_human_split": "object {agent_percent: number, human_percent: number}"
    },
    "expansion_phase": {
      "natural_expansion_triggers": ["string (e.g., 'usage_milestone', 'team_growth')"],
      "expansion_upsell_targets": ["string"],
      "agent_vs_human_split": "object {agent_percent: number, human_percent: number}"
    },
    "retention_phase": {
      "key_retention_tactics": ["string (e.g., 'proactive_engagement', 'feature_updates')"],
      "churn_risk_indicators": ["string"],
      "agent_vs_human_split": "object {agent_percent: number, human_percent: number}"
    }
  },
  "financial_model": {
    "assumptions": {
      "customer_acquisition_ramp": {
        "month_1_customers": "number",
        "month_12_customers": "number",
        "growth_trajectory_description": "string"
      },
      "pricing_ramp": {
        "year_1_average_price": "float",
        "year_2_average_price": "float",
        "price_elasticity_notes": "string"
      },
      "churn_rate": {
        "monthly_churn_percent": "number 0-100",
        "justification": "string"
      },
      "net_revenue_retention": {
        "monthly_nrr_percent": "number 0-200",
        "expansion_revenue_contribution": "string"
      },
      "cac": "float (from validated unit economics)",
      "cac_payback_months": "number",
      "ltv": "float (from validated unit economics)"
    },
    "monthly_projections": [
      {
        "month": "number 1-24",
        "new_customers": "number",
        "total_customers": "number",
        "mrr": "float (monthly recurring revenue)",
        "arr": "float (annualized)",
        "expansion_revenue": "float",
        "total_revenue": "float",
        "cogs": "float (cost of goods sold - mainly agent compute)",
        "gross_profit": "float",
        "gross_margin_percent": "number",
        "operating_expenses": "float (will be refined in 3.5)",
        "net_operating_income": "float"
      }
    ],
    "key_metrics": {
      "breakeven_month": "number or string (N/A if beyond 24 months)",
      "revenue_at_month_12": "float",
      "revenue_at_month_24": "float",
      "year_2_run_rate_arr": "float",
      "cumulative_gross_profit_24_months": "float",
      "average_revenue_per_account_year_1": "float"
    }
  },
  "business_model_viability_assessment": {
    "unit_economics_alignment": {
      "achievable_ltv_cac_ratio": "float (should be > 3)",
      "payback_period_months": "number (should be < 12)",
      "margin_sustainability": "string (assessment of whether margins are defensible)"
    },
    "market_fit_assessment": {
      "gap_to_market_expectations": "string",
      "pricing_credibility": "string (does pricing align with perceived value?)",
      "early_adopter_alignment": "string (how well does this model serve the target early adopters?)"
    },
    "competitive_viability": {
      "cost_advantage_vs_incumbents": "string (quantified where possible)",
      "defensibility_analysis": "string (why competitors can't easily undercut this model)",
      "disruption_potential": "string (how fundamentally does this change the market?)"
    },
    "operational_feasibility": {
      "agent_capacity_constraints": "string (can agents handle the promised service levels?)",
      "scaling_bottlenecks": "string (what breaks if we 10x?)",
      "human_overhead_assessment": "string (is the agent/human split realistic?)"
    },
    "overall_viability_score": "number 1-10 (with 10 being certain success)",
    "viability_concerns": ["list of strings (any flagged risks)"],
    "viability_recommendation": "string (go/conditional/no-go with brief rationale)"
  },
  "expansion_opportunities": [
    {
      "opportunity_name": "string",
      "description": "string",
      "earliest_timeline": "string (e.g., 'Month 6', 'Year 2')",
      "revenue_potential": "string (e.g., '$X per year', '20% additional ARR')",
      "implementation_complexity": "string (low/medium/high)",
      "agent_readiness": "string (can agents handle the additional work?)",
      "rationale": "string"
    }
  ],
  "sensitivity_analysis": {
    "key_assumptions_tested": [
      {
        "assumption": "string (e.g., 'monthly churn rate')",
        "base_case_value": "string",
        "pessimistic_scenario": {
          "value": "string",
          "impact_on_breakeven": "string",
          "impact_on_year_2_arr": "string"
        },
        "optimistic_scenario": {
          "value": "string",
          "impact_on_breakeven": "string",
          "impact_on_year_2_arr": "string"
        }
      }
    ]
  },
  "metadata": {
    "created_at": "ISO 8601 timestamp",
    "created_by": "string (agent_id)",
    "version": "string (e.g., '1.0')",
    "status": "string (draft|reviewed|approved)",
    "next_phase_inputs": ["string (components that will consume this output)"]
  }
}
```

## Core Logic / Algorithm

### Step 1: Revenue Model Selection

**Input:** Concept definition, customer validation data, competitive pricing, unit economics.

**Process:**
1. Analyze the concept's core value delivery mechanism:
   - Is the value consumption-driven (usage naturally varies) or consistent (same value regardless of usage)?
   - Is the product a tool (customer can self-serve) or a service (high touch)?
   - Is the customer segment cost-sensitive or value-sensitive?

2. Evaluate candidate revenue models against unit economics:
   - Subscription: Works well if LTV is strong and churn is predictable. Simple to forecast.
   - Usage-based: Aligns payment with value delivery. Good for highly variable use cases. Requires robust metering.
   - Marketplace fee: Suitable if there are two sides (supply and demand). Creates network effects.
   - Freemium: Lower CAC and faster customer discovery, but must be carefully designed to avoid free-tier cannibalization.
   - Hybrid: Can segment customers by willingness-to-pay or use case.

3. Select the model that:
   - Maximizes LTV relative to CAC
   - Aligns with customer expectations (what are they used to paying for in this space?)
   - Simplifies agent-driven fulfillment (e.g., usage-based requires precise tracking and billing, which agents can handle but adds complexity)
   - Allows for margin expansion as the company scales

**Output:** Primary revenue model + rationale.

### Step 2: Pricing Strategy Design

**Input:** Selected revenue model, unit economics, competitive pricing, customer willingness-to-pay data.

**Process:**
1. For **subscription models:**
   - Establish three price anchors: entry (price-sensitive segment), mid-market (sweet spot), enterprise (power users / high-value customers).
   - Entry-tier price should be <= customer's willingness-to-pay (from validation) and high enough that the CAC is recoverable within 2–4 months.
   - Mid-tier price should be 2–3x entry tier, targeting customers who see 3–5x the value.
   - Enterprise tier should be either per-seat, custom, or based on usage multipliers; target the top 20% of customers expected to generate 50%+ of revenue.
   - Example: $29/month (starter), $99/month (pro), custom (enterprise).

2. For **usage-based models:**
   - Identify the natural consumption metric: API calls, reports generated, data processed, etc.
   - Set unit pricing such that a median customer's monthly consumption aligns with a reasonable monthly price (e.g., if typical usage is 10,000 API calls/month, price at $0.01–$0.05 per call so the bill is $100–500).
   - Implement a monthly cap or soft ceiling to prevent bill shock.
   - Offer commitment discounts to customers who pre-pay or commit to usage levels.

3. For **freemium models:**
   - Define the free tier: what's included and what's limited (users, projects, integrations, support quality, etc.)?
   - The free tier should be useful enough that users can experience core value, but constrained enough that serious use drives conversion.
   - Conversion triggers: hitting a usage limit, needing a second user, requiring an integration. Aim for 2–10% conversion rate.
   - Paid tier pricing should be 2–3x the self-serve value the user received (to make the pricing feel like an "upgrade," not a punishment).

4. For **hybrid models:**
   - Define when each model applies (e.g., "Starter = flat fee; Pro/Enterprise = usage-based overage").
   - Ensure the transition between models is seamless and doesn't feel like a pricing cliff.

5. **Anchor to competitor data:**
   - Map your pricing relative to known competitors. If incumbents charge $500–2000/month, and your agent-based cost structure is 40% lower, price at 30–40% discount to capture share.
   - Account for switching costs: if customers have high switching friction, you can charge a slight premium. If switching is easy, you need a clearer value story or price advantage.

6. **Account for expansion pricing:**
   - Identify natural upsells: premium support, advanced features, higher quotas, API access, data export, etc.
   - Price these as add-ons. Target 20–40% of customers to purchase at least one expansion product.

**Output:** Detailed pricing tiers + rationale for each level.

### Step 3: Customer Journey Mapping

**Input:** Pricing strategy, competitive messaging, customer personas, agent architecture sketch (preliminary).

**Process:**
1. **Awareness phase:**
   - List the channels through which target customers discover solutions in this space: Google Search (organic + paid), social media (LinkedIn, Twitter, Reddit, forums), content marketing, partnerships, word-of-mouth, sales outreach.
   - For each channel, estimate:
     - Reach (how many prospects per month?)
     - Cost (what's the agent/human cost to maintain this channel?)
     - Message: what problem/solution positioning resonates?
   - Specify which channels agents can automate (SEO content generation, paid ad management, social monitoring and outreach) and which require human judgment (narrative positioning, partnership negotiation).
   - **Agent allocation:** Agents can auto-generate blog content, manage social ads, monitor community discussions. Humans decide overall positioning and negotiate partnerships.

2. **Consideration phase:**
   - Define key touchpoints: product demo, free trial, case study, ROI calculator, comparison chart, customer testimonial.
   - Specify the conversion funnel: % of aware prospects who enter consideration, % who request a demo, % who start a trial, % who convert from trial.
   - For each touchpoint, decide: who delivers it? (agent chatbot for initial Q&A, human for detailed demo, agent for trial setup, etc.)
   - **Agent allocation:** Agents can run chatbots to answer FAQ, auto-generate personalized ROI calculators, schedule demo calls, automate trial onboarding. Humans deliver high-touch demos and handle complex objections.

3. **Purchase phase:**
   - Decide: self-serve signup (e.g., via Stripe) or assisted sales?
   - If self-serve: agents handle the entire flow (payment processing, account creation, initial configuration).
   - If assisted: define who initiates contact (inbound from demo request, outbound sales outreach) and when human involvement kicks in.
   - Specify sales cycle duration: how many days/weeks from first contact to deal close?
   - **Agent allocation:** Agents can handle 90%+ of self-serve transactions. For assisted sales, agents can qualify leads, schedule calls, and handle follow-up; humans do the final pitch and negotiation.

4. **Onboarding phase:**
   - Define the milestone experience: what does a customer need to accomplish to get to "active"?
   - Common milestones: profile setup, first successful job/transaction, connecting integrations, team member invite, seeing their first result.
   - Specify the timeline: hours, days, or weeks?
   - For each milestone, assign owner: agent (automated onboarding flow) or human (guided walkthrough, training call)?
   - **Agent allocation:** Agents handle templated onboarding (welcome email, setup guides, integration connection). Humans handle complex custom setups or strategy calls.

5. **Expansion phase:**
   - Identify natural triggers for expansion: usage milestones ("you've hit your 1000 report limit"), team growth ("you've invited 5 team members"), feature adoption ("you've enabled 10+ integrations"), time-based ("3 months in, checking if they'd benefit from premium support").
   - For each trigger, specify: who detects it? (agent monitoring usage/team size), who initiates the upsell? (agent sends offer, human has conversation), how is it presented? (email offer, in-app notification, sales call).
   - **Agent allocation:** Agents detect triggers, send initial upsell messages, and auto-upgrade at customer request. Humans handle complex negotiations or custom deals.

6. **Retention phase:**
   - Identify retention levers: proactive engagement (monthly digest, feature tips), product excellence (reliability, new features), customer success (regular check-ins), community (customer forum, user group).
   - Specify churn risk indicators: declining usage, support complaints, competitor mentions, feature request denials.
   - **Agent allocation:** Agents monitor usage, send re-engagement emails, recommend features based on peer usage patterns. Humans intervene for at-risk accounts or complex troubleshooting.

**Output:** Detailed journey map with agent vs. human split at each stage.

### Step 4: Financial Projections

**Input:** Pricing strategy, customer acquisition assumptions, churn/retention assumptions, unit economics, competitive benchmarks.

**Process:**
1. **Establish key assumptions:**
   - Customer acquisition ramp: How many customers by month 1, 3, 6, 12, 24? This is informed by GTM strategy (Step 3.3), but Business Designer should flag if the ramp is unrealistic relative to CAC and budget.
   - Pricing ramp: Will average price per customer increase over time (as customers upgrade to higher tiers)? Build in annual price increases (typically 5–10%)?
   - Churn rate: What % of customers churn each month? Benchmark: SaaS churn is typically 3–7% monthly for SMB, 1–3% for mid-market, <1% for enterprise. Validate assumptions in customer validation data.
   - Net revenue retention (NRR): What % of revenue from last month is retained + expanded? Formula: (Starting MRR - Churn + Expansion) / Starting MRR. Target NRR >= 110% for SaaS.

2. **Build month-by-month model (24 months minimum):**
   - **Month 1–3 (Launch phase):**
     - New customers: Ramp from 0 to 10–50 depending on GTM channel.
     - MRR: New customers × average price.
     - COGS (cost of goods sold): Mainly agent compute + integrations. From unit economics, this is typically 20–40% of revenue.
     - OpEx: Mostly human team (will be detailed in 3.5), but for this model, assume a baseline.
     - Goal: Prove the model works; unit economics should be visible by month 2–3.

   - **Month 4–12 (Growth phase):**
     - New customers: Accelerate as GTM kicks in. Aim for 2–3x month 1 by month 12.
     - Churn: Initial churn is often higher (product-market fit validation); should decline as product improves.
     - Expansion: As customers use the product, they upgrade tiers or purchase add-ons. Model 1–5% of base customers upgrading monthly.
     - MRR should compound due to both new customers and expansion.

   - **Month 13–24 (Scale phase):**
     - New customer acquisition continues but growth rate may moderate (market saturation, CAC increasing).
     - Churn stabilizes.
     - Expansion becomes a larger % of total revenue (goal: 20–40% of revenue from expansion by month 24).
     - Breakeven point should be visible; unit economics should be consistently positive.

3. **Sensitivity analysis:**
   - Test scenarios: What if churn is 20% higher? What if customer acquisition is 30% slower? What if price is 15% lower?
   - For each scenario, model the impact on: breakeven month, year 2 ARR, and cumulative profitability at 24 months.
   - Identify which assumptions have the largest impact (usually: customer acquisition rate and churn).

**Output:** Month-by-month financial model with sensitivity analysis.

### Step 5: Viability Assessment

**Input:** All of the above, plus feedback from validation phase.

**Process:**
1. **Unit economics check:**
   - CAC payback period must be < 12 months, ideally < 6 months. If pricing is too low or CAC is too high, flag a risk.
   - LTV/CAC ratio must be >= 3. If ratio is lower, either pricing needs to increase, churn needs to decrease, or CAC needs to decrease.
   - Gross margin must be >= 70% to support scaling. If agent costs are consuming 50%+ of revenue, the model is too labor-intensive and needs rearchitecting.

2. **Market fit check:**
   - Does the pricing align with customer willingness-to-pay? (Should be within 20% of validated WTP.)
   - Does the model serve the target early-adopter segment? (E.g., if targeting SMBs, pricing should start at a point SMBs can afford.)
   - Is there clear revenue differentiation vs. competitors? (Either price advantage, value advantage, or segmentation advantage.)

3. **Operational feasibility check:**
   - Can agents actually deliver the service at the promised price point? (This requires a preliminary agent architecture sketch from 3.2, but Business Designer should sanity-check.)
   - Are there any scaling constraints? (E.g., if the product relies on manual API integrations, how does that scale to 1000s of customers?)
   - Is the customer journey realistic for agents to execute? (E.g., if the sales cycle requires 5 discovery calls, can agents or a small human team execute that?)

4. **Competitive viability check:**
   - Cost advantage: Can you sustainably undercut incumbents by 20–40% due to agent efficiency? Or do you win on a different dimension?
   - Defensibility: What prevents competitors from copying your model? (e.g., proprietary AI, network effects, switching costs, regulatory moats, data advantage)
   - Disruption potential: How fundamental is the shift? (Disruption = new customer segment + new value delivery, not just "10% cheaper.")

5. **Overall viability scoring:**
   - Score each dimension (unit economics, market fit, operational feasibility, competitive viability) on a 1–10 scale.
   - Aggregate into an overall viability score.
   - Flag any dimension scoring < 5 as a risk requiring mitigation.

**Output:** Viability assessment with overall score and recommendations.

### Step 6: Expansion Opportunities Identification

**Input:** Pricing strategy, customer journey, competitive landscape, unit economics.

**Process:**
1. **Upsell opportunities:**
   - Higher-tier features (premium support, advanced analytics, priority processing).
   - Increased quotas (more users, more projects, more API calls).
   - Integration add-ons (connect to additional data sources or systems).
   - Typically achieve 20–40% attachment rates; price at 20–50% of base tier.

2. **Cross-sell opportunities:**
   - Complementary products (if building a platform, sell adjacent tools).
   - Data products (sell insights derived from customer usage data, anonymized).
   - Services (custom implementation, training, consulting).

3. **Network effects:**
   - If the product has multi-sided network effects (more users = more value), build in virality loops and consider marketplace features.
   - Incentivize customer-driven growth: referral bonuses, partner program, marketplace commissions.

4. **Land-and-expand playbook:**
   - Start with a narrow use case (e.g., one team function), price low to establish foothold, then expand to other teams/functions as the customer organization grows.

**Output:** List of expansion opportunities with timeline and expected revenue contribution.

## Data Sources & Integrations

**No external APIs required for the Business Designer itself,** but the component consumes data outputs from Phase 2 and will need to reference:

- **Market data sources** (for pricing benchmarks): SimilarWeb, Crunchbase, G2, Capterra, PricingPages.com
- **Customer research data**: Stored in pipeline data store (from Step 2.3 Customer Validator)
- **Competitive pricing data**: Stored in pipeline data store (from Step 2.2 Competitive Analyst)
- **Financial modeling assumptions**: Standards from SaaS benchmarks (Bessemer Venture Partners SaaS Metrics, OpenView SaaS Benchmarks)

**Integration points:**
- Output is consumed by Resource Planner (3.5) for budget estimation and by Blueprint Packager (3.6).
- May reference preliminary sketches from Agent Architect (3.2) to validate operational feasibility.

## Agent Prompt Strategy

### System Prompt Persona

```
You are an expert SaaS business model designer with deep experience building
companies in the agent-first space. You combine financial rigor with market
intuition. Your role is to design a business model that:

1. Is grounded in validated customer data, not wishful thinking.
2. Leverages the cost advantages of agent-first operations to disrupt incumbents.
3. Creates a sustainable unit economics story (LTV/CAC > 3, gross margin > 70%).
4. Aligns pricing with customer willingness-to-pay.
5. Sets up the company for expansion and scaling.

You are not designing a charity; you are designing a business that must grow
and be profitable. But you are also not maximizing price at the expense of
adoption. Your goal is optimal balance.

You have strong opinions about pricing psychology, SaaS mechanics, and how
agent automation changes the cost structure of a business. You can quickly
spot when a model is unfeasible and recommend pivots.
```

### Key Instructions

1. **Start with unit economics, not pricing intuition.**
   - Never suggest a pricing strategy that violates the fundamental unit economics from Phase 2.
   - If the unit economics are weak (LTV/CAC < 3), flag this as a business viability risk, not a pricing problem to fix with a 10% increase.

2. **Price based on value, not cost.**
   - Your pricing should be anchored to customer willingness-to-pay and competitive positioning, not to "cost + 30% margin."
   - Use value-based pricing: what are customers willing to pay given the benefits?

3. **Think in tiers, not single-price.**
   - Nearly all SaaS businesses serve multiple customer segments with different needs and budgets.
   - Design 2–4 tiers to capture this heterogeneity.

4. **Consider the agent-first cost structure explicitly.**
   - Agent-based fulfillment should enable 60–80% gross margins (vs. 40–50% for human-heavy businesses).
   - If your projected margins are lower, your agent architecture may not be delivering the promised efficiency.

5. **Map the journey with agent vs. human specificity.**
   - Don't just say "customer support is handled by agents." Specify: chatbot for FAQ, escalation to human for complex issues, agent for follow-up.
   - The clarity here will inform Resource Planner (3.5) to accurately estimate human headcount.

6. **Be realistic about churn and expansion.**
   - SMB SaaS churn is 4–8% monthly. Enterprise is 1–2%. Price-sensitive segments churn faster.
   - Expansion (NRR > 100%) requires intentional product-led growth tactics. Don't assume it; design it.

7. **Validate model assumptions against provided data.**
   - If you're assuming 50% monthly expansion rate but the customer validation data shows customers are bought once and rarely expand, flag the misalignment.
   - Prioritize data over intuition.

### Few-Shot Examples

**Example 1: Subscription Pricing for a B2B Data Tool**

Input:
- Target: Mid-market companies (50–500 employees)
- Unit economics: CAC $2000, LTV $24000, payback 3.3 months, gross margin 72%
- Willingness-to-pay: $200–800/month (from customer validation)
- Competitors: Incumbent charges $500–2000/month

Design:
```
Revenue Model: Subscription (annual billing, monthly option)

Pricing Tiers:
- Starter: $299/month ($2,988/year) → 1 user, 100k API calls/month, basic integrations
  Target: Small teams, evaluators, moving from competitor
  WTP justification: Lowest price incumbents charge; proof that SMBs can afford us

- Professional: $899/month ($8,991/year) → 3 users, 500k API calls, advanced integrations
  Target: Mid-market teams, power users, majority of revenue
  Pricing logic: 3x starter; aligns with "power user gets 3x value" heuristic

- Enterprise: Custom pricing → unlimited users, unlimited API calls, dedicated support
  Target: Large accounts, strategic customers
  Pricing logic: 1.5x ARR benefit to customer; net NRR expansion

Customer Journey with Agent Split:
- Awareness: Content marketing (agents write blog posts on SEO keywords), paid search (agents manage PPC)
  Agent: 80%, Human: 20% (brand strategy)
- Consideration: Chatbot FAQ, auto-demo scheduling, free trial (agents), human for complex Q&A
  Agent: 60%, Human: 40%
- Purchase: Self-serve checkout (agents), no assisted sales needed
  Agent: 95%, Human: 5% (monitor for high-value customers)
- Onboarding: Automated flows (agents), human for custom integrations
  Agent: 70%, Human: 30%

Financial projection Y1:
- Month 1–3: 20 customers, $6k MRR
- Month 4–12: +15 customers/month, reach 130 customers, $90k MRR by month 12
- Expansion: 15% of customers upgrade annually → +$15k MRR contribution
- Year 1 revenue: ~$600k; Year 2 run-rate: ~$1.2M ARR

Viability score: 8/10
- Unit economics: Strong (LTV/CAC = 12)
- Market fit: Good alignment with WTP and SMB segment
- Operational: Achievable with mostly self-serve motion
- Competitive: 40% price advantage over incumbents

Risks:
- Churn: SMB churn could be 6–8% monthly if product quality wavers
  Mitigation: Product-led growth + proactive customer success
```

**Example 2: Usage-Based Pricing for an API Product**

Input:
- Target: Developers building AI applications
- Unit economics: CAC $500, LTV $8000, payback 2.5 months, gross margin 65%
- Willingness-to-pay: Variable; developers use 10k–1M API calls/month depending on app
- Competitors: OpenAI charges $0.002/token; competitors at $0.001–$0.003

Design:
```
Revenue Model: Freemium + usage-based

Free tier: 100k API calls/month, limited support
- Goal: Developer acquisition, product education, conversion

Paid tiers:
- Pay-as-you-go: $0.0008/call (undercut OpenAI; aggressive market grab)
  Commitment discount: $50/month minimum, 10% savings if you pre-commit
- Startup plan: $200/month (2.5M calls, includes priority support, SLA)
- Enterprise: Custom (unlimited calls, dedicated capacity, compliance features)

Customer Journey:
- Awareness: Organic dev community (Reddit, HN, Twitter), sponsored content
  Agent: 85%, Human: 15%
- Consideration: Free tier → learns product value → no friction
  Agent: 100% (self-serve)
- Purchase: Auto-upgrade at ceiling (agent manages billing), no sales needed
  Agent: 100%
- Expansion: Upsell to Startup plan when usage hits 1.5M calls/month
  Agent: 80% (auto-offer via email), Human: 20% (complex custom deals)

Y1 Financial Model:
- Month 1–3: 500 free users, 50 paying, $5k MRR
- Month 4–12: +100 paying customers/month, 800 paying by month 12, $80k MRR
- Expansion: 10% of paying customers upgrade to Startup plan → +$20k/month
- Year 1 revenue: ~$500k (heavily weighted toward Q4 as usage compounds)

Viability score: 7/10
- Unit economics: Good (LTV/CAC = 16)
- Market fit: Strong (aligns with developer willingness-to-pay)
- Operational: Straightforward metering and billing (agent-driven)
- Competitive: Price advantage, but market is commoditizing

Risks:
- Price wars: Competitors can undercut if they have cheaper compute
  Mitigation: Differentiate on quality, reliability, features (not just price)
- Churn: Free-to-paid conversion may be low (5–10%)
  Mitigation: Freemium cap must be low enough to drive conversion, high enough to deliver value
```

### Handling Edge Cases

1. **When unit economics are negative (LTV < 2x CAC):**
   - Don't attempt to "fix" with pricing alone.
   - Recommend: Rearchitect the go-to-market (reduce CAC), improve retention (reduce churn), or accept that this market may not be viable.

2. **When willingness-to-pay is unclear or inconsistent:**
   - Flag as a data gap requiring additional customer research.
   - In the interim, model a conservative scenario and a stretch scenario.

3. **When the product spans multiple use cases with different WTPs:**
   - Design separate tiers for each segment (not just price-based, but feature-based).
   - Example: A data tool might have "Data Analysts" tier ($300/month) and "Executives" tier ($900/month) with different features, even though it's the same product.

4. **When competitors have deeply entrenched pricing (e.g., enterprise incumbents at $10k+/month):**
   - Don't assume you must match their price.
   - Identify the customer segment that competitors overprice for (e.g., SMBs forced to pay enterprise prices).
   - Target that segment with a lower-cost alternative.

5. **When the business model is novel (e.g., marketplace, platform, agency):**
   - Fall back to first principles: who has money, why would they pay, how much pain would paying eliminate?
   - Model multiple revenue streams explicitly (e.g., marketplace takes commission from buyers + charges sellers a listing fee).

## Error Handling & Edge Cases

### Data Quality Issues

**Issue:** Customer willingness-to-pay data is sparse or conflicting.
- **Handling:** Flag the gap, design pricing based on competitive anchoring + willingness-to-pay range (e.g., "$300–$900/month based on market benchmarks"). Recommend validation before final pricing.

**Issue:** Competitor pricing data is incomplete or outdated.
- **Handling:** Supplement with public sources (G2, Capterra, pricing websites), analyst reports. Model a range.

**Issue:** Unit economics from Phase 2 are inconsistent or unrealistic.
- **Handling:** Flag back to the economics modeler or feasibility assessor. Do not build a business model on broken unit economics.

### Business Model Viability Issues

**Issue:** The model only works if churn is < 2% and expansion is > 40%, both unrealistic for the target segment.
- **Handling:** Recommend segmentation (target a different customer segment less prone to churn) or fundamental rearchitecting of the product/service delivery.

**Issue:** The pricing needed to achieve unit economics viability is 2–3x incumbent pricing, yet the value prop doesn't justify a premium.
- **Handling:** Recommend product differentiation, cost reduction, or market repositioning. Consider whether the market opportunity is truly large enough.

**Issue:** Agent automation cost savings don't materialize as expected (human overhead remains high).
- **Handling:** Coordinate with Agent Architect (3.2) to validate the architecture. May require redesign.

### Operational Feasibility Issues

**Issue:** The customer journey assumes agents can handle 90% of sales, but deal complexity requires human judgment.
- **Handling:** Revise agent/human split based on feedback from Agent Architect. May increase OpEx.

**Issue:** The pricing model (e.g., usage-based) requires real-time metering and billing automation agents, which adds operational complexity.
- **Handling:** Document the dependency in "Dependencies" section. Ensure agents are capable.

## Performance & Scaling

**Computational Performance:**
- Business Designer is a single-run component (per concept), not continuous. Execution time: 10–30 minutes depending on depth of analysis and model granularity.
- No real-time performance requirements.

**Scaling Considerations:**
- The component itself doesn't scale horizontally; it's a linear process.
- However, the outputs must be stored and versioned (the central data store must support versioned business model documents).
- If the platform processes 100+ concepts simultaneously, ensure the data store can handle concurrent writes and version management.

**Output Size:**
- A complete business model output is 5–15 KB of JSON.
- Month-by-month financial model for 24 months adds ~2–5 KB.
- Total output per concept: 10–20 KB. At scale (1000 concepts), ~10–20 MB total storage.

## Dependencies

### Depends On (Inputs From)

- **Phase 2 outputs** (mandatory):
  - Market Sizer (2.1): TAM/SAM/SOM estimates
  - Competitive Analyst (2.2): Competitor pricing, positioning, weaknesses
  - Customer Validator (2.3): Early-adopter personas, willingness-to-pay, pain severity
  - Economics Modeler (2.5): Unit economics (CAC, LTV, gross margin, payback period)
  - Validation Synthesizer (2.6): Overall concept viability and key risks

- **Phase 1 outputs** (mandatory):
  - Concept definition (value proposition, target market, key differentiators)

- **Phase 3 dependencies**:
  - Agent Architect (3.2) — for preliminary feasibility check of agent cost assumptions
  - Resource Planner (3.5) — receives business model as input for budget estimation
  - Blueprint Packager (3.6) — consumes final business model for integrated blueprint

### Depended On By

- **Agent Architect (3.2)**: Uses pricing and unit economics to validate that agent costs align with projections.
- **GTM Strategist (3.3)**: Uses pricing tiers, customer journey, and early-adopter personas to design launch strategy.
- **Risk Analyst (3.4)**: Uses financial projections to assess financial risks.
- **Resource Planner (3.5)**: Uses business model to estimate funding needs and cash flow.
- **Blueprint Packager (3.6)**: Integrates business model into the final blueprint document.

## Success Metrics

1. **Unit economics validation:**
   - LTV/CAC ratio >= 3.0 (target: 4–5)
   - Gross margin >= 70% (for agent-first businesses)
   - CAC payback <= 12 months (target: 6 months)

2. **Model coherence:**
   - Financial projections are internally consistent (revenue, churn, expansion all aligned with stated assumptions)
   - Pricing aligns with customer willingness-to-pay (within +/- 20%)
   - Customer journey is realistically executable with stated agent/human split

3. **Market alignment:**
   - Pricing is 20–40% below incumbent pricing (if disruption is the goal)
   - Pricing is defensible vs. competitive response (documented in viability assessment)
   - Early-adopter segment alignment (model targets the segment identified in customer validation)

4. **Viability assessment credibility:**
   - Viability score is >6/10 (green light to proceed)
   - Any flagged risks have documented mitigation strategies
   - Internal review agrees with recommendation (if this is reviewed by humans)

5. **Actionability:**
   - Resource Planner can extract budget numbers from the financial model
   - GTM Strategist can extract customer journey details and pricing to build launch plan
   - Agent Architect can reference cost assumptions and validate operational feasibility

6. **Usability:**
   - The business model is consumable by downstream components
   - No internal contradictions or data gaps that would halt downstream work
   - Executive summary is clear and persuasive to human reviewers

## Implementation Notes

### Suggested Tech Stack

**Agent Framework:**
- Claude API (extended thinking or multi-step reasoning) — for complex financial modeling and scenario analysis
- LLM best suited for: structured JSON output, iterative refinement (can ask agent to revise pricing, do sensitivity analysis, etc.), synthesis of multi-source data

**Data Handling:**
- JSON schema validation: Use Pydantic or JSON Schema validators to ensure output conforms to the schema above
- Financial modeling: Pandas (Python) for building month-by-month models, NumPy for calculations. Consider also Excel/Google Sheets export for human review.
- Versioning: Store all outputs in the central data store with version tracking (UUID + timestamp)

**Integration:**
- Consume inputs from central data store (SQL + document store; queries to fetch Phase 2 outputs, concept definitions)
- Write outputs to central data store (document store or structured database with schema validation)
- Expose API endpoint for downstream components (Agent Architect, Resource Planner, etc.) to fetch the business model by concept ID

### Build Steps

1. **Define the agent prompt** (persona + instructions) as described above.
2. **Build input fetchers** to retrieve Phase 2 and Phase 1 data from the data store.
3. **Implement revenue model selection logic** (rules-based or agent-guided, depending on design choice).
4. **Implement pricing tier design** (possibly templated based on model type, with agent refinement).
5. **Implement customer journey mapping** as a structured template with agent-guided details.
6. **Build financial model calculator**:
   - Month-by-month logic: new customers, churn, expansion, pricing
   - Metrics: MRR, ARR, gross profit, CAC payback, LTV/CAC ratio
   - Sensitivity analysis: run multiple scenarios and report impact on breakeven and Year 2 ARR
7. **Implement viability assessment** as a structured rubric with scoring logic.
8. **Output formatting**: Serialize to JSON schema, validate, store in data store, return to pipeline.

### Testing & Validation

- **Unit test**: Run the agent on 2–3 test cases (different business models: subscription, usage-based, freemium) and verify outputs are sensible and self-consistent.
- **Integration test**: Run the full Phase 2 → Business Designer → Phase 3 components pipeline on a real concept; verify downstream components can consume the output.
- **Manual review**: Have a human review 5–10 real outputs to assess coherence, realism, and actionability.

### Example Implementation (Pseudocode)

```python
class BusinessDesigner:
    def __init__(self, llm_client, data_store):
        self.llm = llm_client
        self.store = data_store
        self.schema_validator = JSONSchemaValidator(BUSINESS_MODEL_SCHEMA)

    def run(self, concept_id: str) -> BusinessModel:
        # Fetch inputs
        concept = self.store.get_concept(concept_id)
        phase2_outputs = self.store.get_phase2_outputs(concept_id)

        # Run agent
        prompt = self.build_prompt(concept, phase2_outputs)
        response = self.llm.query(prompt, system=SYSTEM_PROMPT)

        # Parse and validate
        business_model_dict = json.loads(response)
        self.schema_validator.validate(business_model_dict)

        # Enrich with calculations
        business_model_dict['financial_model']['key_metrics'] = \
            self.calculate_key_metrics(business_model_dict['financial_model']['monthly_projections'])

        # Store and return
        business_model = BusinessModel(**business_model_dict)
        self.store.save_business_model(concept_id, business_model)

        return business_model

    def build_prompt(self, concept, phase2_outputs) -> str:
        # Construct the agent prompt with concept and validation data
        return f"""
        Design a complete business model for:

        Concept: {concept.name}
        Problem: {concept.target_problem}

        Unit Economics:
        - CAC: ${phase2_outputs.unit_economics.cac}
        - LTV: ${phase2_outputs.unit_economics.ltv}
        - Gross Margin: {phase2_outputs.unit_economics.gross_margin}%

        Customer Willingness-to-Pay:
        {json.dumps(phase2_outputs.customer_validation.early_adopters, indent=2)}

        [Detailed instructions per System Prompt...]

        Produce output as JSON conforming to the schema: {...schema...}
        """
```

---

This specification should provide a development team with all the guidance needed to build a functional Business Designer component. The key is ensuring the component produces coherent, financially-sound business models that downstream components can act on.
