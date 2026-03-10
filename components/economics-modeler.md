# Economics Modeler Component Specification

## 1. Purpose & Responsibility

The **Economics Modeler** builds a detailed unit economics model for the concept, demonstrating that it can be profitable and that the margin structure makes sense. This is the final "can we make money" validation before synthesis.

Unlike the Market Sizer (which estimates how big the market is) and the Feasibility Assessor (which estimates how much it costs to build), the Economics Modeler creates a **forward-looking financial model** that shows:
- How much it costs to acquire each customer (CAC)
- How much each customer is worth over their lifetime (LTV)
- What gross margin we can sustain
- How quickly we break even
- What runway (months of cash) we need
- How the agent-first cost structure compares to traditional human-heavy alternatives

The Economics Modeler owns:
- Unit economics calculation (CAC, LTV, CAC:LTV ratio)
- Gross margin estimation (cost of goods sold vs. revenue)
- Customer acquisition cost breakdown by channel
- Churn modeling and retention assumptions
- Sensitivity analysis on key variables
- Competitor comparison (agent-first vs. traditional)
- Breakeven and profitability timeline
- Runway and funding requirement estimation

## 2. Inputs

### Primary Input
From upstream components:
- **Market size estimates** (TAM, SAM, SOM from Phase 2.1)
- **Willingness-to-pay analysis** (from Phase 2.3)
- **Competitive pricing data** (from Phase 2.2)
- **Build and operational costs** (from Phase 2.4)
- **Early adopter profiles** (from Phase 2.3)

### Concept Definition Input
```
{
  concept: {
    id: string,
    name: string,
    target_customer_segments: [string],
    pricing_model: "subscription" | "usage-based" | "freemium" | "marketplace_fee",
    projected_annual_price: number (usd per customer per year),
    human_cost_baseline: number (usd per customer per year, if applicable),
    agent_cost_baseline: number (usd per customer per year, agent-driven alternative)
  }
}
```

## 3. Outputs

### Primary Output
A **Unit Economics Model** document containing:

```json
{
  report_id: string (UUID),
  concept_id: string,
  generated_at: ISO8601 timestamp,
  executive_summary: {
    unit_economics_verdict: "strong" | "viable" | "marginal" | "unviable",
    key_metrics: {
      ltv_usd: number,
      cac_usd: number,
      ltv_cac_ratio: number,
      payback_period_months: number,
      gross_margin_pct: number,
      estimated_breakeven_months: number,
      annual_runway_required_usd: number
    },
    comparison_vs_traditional_model: {
      traditional_cogs_per_customer_monthly: number,
      agent_first_cogs_per_customer_monthly: number,
      cost_advantage_pct: number,
      defensibility: "sustainable" | "temporary"
    }
  },
  customer_acquisition_cost: {
    cac_methodology: string,
    acquisition_channels: [
      {
        channel: "direct_sales" | "self_serve_web" | "partnership" | "viral" | "other",
        estimated_cac_usd: number,
        payback_period_months: number,
        scalability: "limited" | "moderate" | "unlimited",
        rationale: string
      }
    ],
    blended_cac_usd: number,
    cac_vs_initial_price_ratio: number,
    payback_assumption: string (e.g., "paid back in first 6 months of revenue")
  },
  customer_lifetime_value: {
    ltv_calculation_methodology: string,
    monthly_arpu_usd: number (average revenue per user),
    gross_margin_pct: number,
    churn_rate_monthly_pct: number,
    churn_assumption_rationale: string,
    expansion_revenue_monthly_usd: number (upsell, cross-sell),
    ltv_usd: number,
    ltv_sensitivity: {
      variable: string (e.g., "churn_rate"),
      base_case: number,
      pessimistic_case: number,
      optimistic_case: number,
      ltv_at_pessimistic: number,
      ltv_at_optimistic: number
    }
  },
  cost_of_goods_sold: {
    cogs_per_customer_monthly: number,
    cogs_breakdown: [
      {
        cost_category: "api_calls" | "infrastructure" | "payment_processing" | "support" | "compliance" | "other",
        monthly_cost_per_customer_usd: number,
        variable_vs_fixed: "variable" | "fixed",
        scaling_assumption: string (e.g., "decreases 20% at 10x scale due to volume discounts")
      }
    ],
    gross_margin_pct: number,
    cogs_assumptions: string
  },
  customer_retention_and_lifetime: {
    assumptions: {
      monthly_churn_rate_pct: number,
      basis_for_churn: string (e.g., "competitor data", "industry benchmark", "survey"),
      expansion_assumption: string (e.g., "5% of customers expand to higher tier")
    },
    cohort_lifetime_months: number,
    customer_lifetime_months: number,
    nps_to_churn_correlation: {
      nps_assumption: number,
      expected_churn_from_nps: number,
      confidence: "high" | "medium" | "low"
    }
  },
  profitability_and_breakeven: {
    monthly_fixed_costs_usd: number (payroll, office, etc.),
    monthly_variable_costs_usd: number (scales with customers),
    breakeven_monthly_mrr_usd: number,
    breakeven_customer_count: number,
    months_to_breakeven_estimate: number,
    assumptions: string (e.g., "assumes 20 customer adds/month with $2K CAC")
  },
  financial_projections: {
    projection_months: number (12, 24, or 36),
    assumptions: {
      starting_month_customers: number,
      monthly_new_customer_adds: [
        {
          month_range: string (e.g., "months 1-3"),
          new_adds_per_month: number,
          rationale: string
        }
      ],
      price_increase_timeline: string (e.g., "hold at $500/mo for 12 months, then $600/mo")
    },
    monthly_projections: [
      {
        month: number,
        total_customers: number,
        new_customers_added: number,
        churned_customers: number,
        monthly_revenue_usd: number,
        monthly_cogs_usd: number,
        monthly_gross_profit_usd: number,
        monthly_opex_usd: number,
        monthly_net_profit_usd: number,
        cumulative_cash_position_usd: number
      }
    ]
  },
  sensitivity_analysis: {
    variable: string (e.g., "monthly_churn_rate"),
    base_case_result: number (e.g., LTV),
    sensitivity_table: [
      {
        variable_value: number (e.g., "1.5% churn"),
        result: number (e.g., LTV = $15K)
      }
    ],
    most_sensitive_variables: [
      {
        variable: string,
        impact_on_ltv_pct: number (e.g., 25% change in churn = 40% change in LTV),
        impact_on_profitability_months: number
      }
    ]
  },
  comparison_agent_first_vs_traditional: {
    traditional_model: {
      description: string (e.g., "Company hires 5 FTE per 100 customers for service delivery"),
      cogs_per_customer_monthly: number,
      labor_headcount_at_100_customers: number,
      labor_cost_monthly_usd: number,
      total_cogs_monthly_usd: number,
      gross_margin_pct: number
    },
    agent_first_model: {
      description: string (e.g., "AI agents handle 70% of service delivery; 1 FTE per 200 customers"),
      cogs_per_customer_monthly: number,
      labor_headcount_at_100_customers: number,
      labor_cost_monthly_usd: number,
      total_cogs_monthly_usd: number,
      gross_margin_pct: number
    },
    comparative_advantage: {
      cost_difference_pct: number (e.g., agent-first is 50% cheaper),
      margin_advantage_pct: number,
      defensibility_duration: string (e.g., "3+ years if we get 2-year head start on agent training"),
      competitive_response_risk: "high" | "medium" | "low"
    }
  },
  funding_and_runway_estimate: {
    founding_team_size: number,
    monthly_burn_rate_usd: number,
    months_to_breakeven: number,
    initial_seed_round_size_usd: number (recommended),
    series_a_size_usd: number (recommended, to get to X% market penetration),
    runway_at_each_stage: {
      seed_round: number,
      series_a: number
    }
  },
  risk_factors: [
    {
      risk: string (e.g., "higher churn than assumed"),
      likelihood: "high" | "medium" | "low",
      impact_on_unit_economics: string,
      mitigation: string
    }
  ],
  data_sources: [
    {
      source_name: string,
      source_type: string,
      assumption_it_informs: string,
      reliability: "primary" | "secondary" | "tertiary"
    }
  ],
  analyst_notes: string
}
```

### Secondary Output
Supporting research artifacts:
- Month-by-month financial projection spreadsheet (12-36 months)
- Sensitivity analysis tables (churn rate, price, CAC, etc.)
- Unit economics comparison chart (agent-first vs. traditional)
- Customer cohort analysis (retention curves by acquisition month)
- Payback period visualization

## 4. Core Logic / Algorithm

### Step 1: Customer Acquisition Cost (CAC) Estimation

**Identify acquisition channels:**
1. **Direct sales:** Sales team reaches out to customers
2. **Self-serve/web:** Inbound marketing, free trial, self-signup
3. **Partnership/integration:** Referral through partner ecosystem
4. **Viral/word-of-mouth:** Organic growth from existing customers
5. **Paid advertising:** Google Ads, LinkedIn, industry publications

**For each channel, estimate:**
- Cost per acquisition
- Scalability (can this channel scale indefinitely?)
- Payback period (how long until customer revenue pays back the acquisition cost?)

Example CAC calculation:
```
Channel 1: Direct Sales
- Sales team salary: $80K/year per rep
- Rep can close ~10 customers per month (based on 2-month sales cycle, $2K pricing)
- CAC per customer: $80K/12 months / 10 customers per month = $667

Channel 2: Self-Serve Web
- Inbound marketing (content, SEO): $10K/month
- Website traffic: 10K/month
- Free trial signup rate: 5% = 500 signups
- Conversion to paid: 20% = 100 customers
- CAC: $10K / 100 = $100

Channel 3: Partnership
- Partner referrals from case management systems
- Each partner referral: ~$300 support cost + commission (10% of first-year revenue)
- First-year revenue per customer: $2,400
- Commission: $240
- CAC: $300 + $240 = $540

Blended CAC:
- Sales: 30% of customers, CAC = $667
- Self-serve: 50% of customers, CAC = $100
- Partnership: 20% of customers, CAC = $540
- Blended: (0.3 × $667) + (0.5 × $100) + (0.2 × $540) = $200 + $50 + $108 = $358

Payback period:
- Monthly price: $2,000
- Monthly gross profit per customer: $2,000 × 70% margin = $1,400
- Months to pay back CAC $358: 358 / 1,400 = 0.26 months (~1 week)
```

**Payback assumption verification:**
- Payback should ideally be <12 months (preferably <6 months)
- If payback is >12 months, unit economics are weak

### Step 2: Customer Lifetime Value (LTV) Calculation

**LTV Formula (simplified):**
```
LTV = (ARPU × Gross Margin) / Monthly Churn Rate
```

Where:
- **ARPU:** Average Revenue Per User (monthly)
- **Gross Margin:** Revenue remaining after COGS
- **Monthly Churn Rate:** % of customers lost each month (as decimal, e.g., 2% = 0.02)

**Detailed breakdown:**

1. **Calculate Monthly ARPU:**
   - Identify pricing tiers (e.g., Starter $500/mo, Pro $1500/mo, Enterprise $5K+/mo)
   - Estimate customer mix (e.g., 60% Starter, 30% Pro, 10% Enterprise)
   - ARPU = (0.6 × $500) + (0.3 × $1500) + (0.1 × $5000) = $300 + $450 + $500 = $1250/mo

2. **Calculate Gross Margin:**
   - Identify all variable costs (COGS):
     - API costs (Claude calls): $0.10 per contract review × 500 reviews/customer/month = $50
     - Infrastructure (hosting, storage): $20
     - Payment processing (2.9% + $0.30): 0.029 × $1250 + $0.30 = $36.50
     - Support (varies): $30
     - Total COGS: $136.50
   - Gross Margin % = ($1250 - $136.50) / $1250 = 89.1%

3. **Estimate Monthly Churn Rate:**
   - Research incumbent churn rates (from reviews, analyst reports)
   - Benchmark: SaaS average is 3-5% per month (2-6% for legal tech)
   - Assumption for new entrant: 3-5% per month (higher than incumbents initially)
   - Use 4% per month as baseline

4. **Calculate LTV:**
   ```
   LTV = ($1250 × 0.891) / 0.04 = $1113.75 / 0.04 = $27,844
   ```

   This means: Each customer is worth ~$27.8K in net profit over their lifetime.

5. **Validate with cohort analysis:**
   - If we acquire 100 customers in Month 1:
     - Month 1: 100 customers × $1250 = $125K revenue
     - Month 2: 96 customers (4% churn) × $1250 = $120K revenue
     - Month 3: 92.16 customers × $1250 = $115.2K revenue
     - ...continuing...
   - Total revenue from original cohort: ~$125K + $120K + $115.2K + ... (diminishing series)
   - Sum = $125K / 0.04 = $3.125M gross revenue per cohort
   - Net profit: $3.125M × 0.891 = $2.78M ≈ LTV × 100 customers = $27,844 × 100 ✓

**Expansion revenue (upsell/cross-sell):**
- If 20% of customers expand to higher tier or add modules:
- Additional revenue per expanding customer: $500/mo
- Expansion rate: 20% of customers, 50% of those expanding in year 2
- Additional LTV: 0.20 × 0.50 × ($500 × 36 months × 0.891) = $1,590
- Adjusted LTV: $27,844 + $1,590 = $29,434

### Step 3: Cost of Goods Sold (COGS) Breakdown

Itemize all variable costs per customer per month:

```
Category 1: AI/API Costs
- Claude API calls: Assume 500 contract reviews/customer/month
- Cost per inference: ~$0.0001 (depends on input/output tokens)
- Total: 500 × $0.0001 × 3 tokens per review (estimate) = ~$0.15
  Wait, Claude pricing is per token. Let's recalculate:
- Input tokens per review: 5,000 (contract text, prompt)
- Output tokens: 500 (response)
- Total tokens: 5,500 per review
- Claude Opus price: $0.003 per 1K input tokens, $0.015 per 1K output tokens
- Cost per review: (5,000 × $0.003 / 1000) + (500 × $0.015 / 1000) = $0.015 + $0.0075 = $0.0225
- Monthly cost: 500 reviews × $0.0225 = $11.25 per customer

Category 2: Infrastructure Costs
- Cloud hosting (AWS/GCP): $10/customer/month (for storage, compute)
- Database (PostgreSQL, vector DB): $5/customer/month
- Monitoring, logging: $2/customer/month
- Total: $17/customer/month

Category 3: Payment Processing
- Stripe fee: 2.9% + $0.30
- Monthly revenue per customer: $1,250
- Fee: $1,250 × 0.029 + $0.30 = $36.55

Category 4: Support & Operations
- Support staff: 1 person supports 50 customers
- Support salary: $60K/year = $5K/month
- Cost per customer: $5,000 / 50 = $100/month
- (This may be categorized as OpEx, not COGS; depends on model)

Category 5: Compliance & Security
- SOC 2, data encryption, security audits: $2,000/month fixed
- Per-customer cost (variable portion): $500/month variable
- Average per customer: $500 (at scale of 100+ customers)

Total COGS per customer per month (at scale):
$11.25 + $17 + $36.55 + $100 + $500 = $664.80 per customer

Wait, that's too high (>50% of revenue). Let me recalibrate:

Assuming:
- Support is OpEx (not COGS): Remove $100
- Compliance fixed cost spreads over 200+ customers: Add ~$5 instead of $500
- Revised COGS: $11.25 + $17 + $36.55 + $5 = $69.80

Gross Margin: ($1,250 - $69.80) / $1,250 = 94.4%

Much more reasonable.
```

**Sensitivity to scale:**
- At 10 customers: COGS higher per customer (fixed costs not amortized)
- At 100 customers: COGS as calculated
- At 1000+ customers: COGS may decrease (volume discounts on APIs, dedicated infrastructure deals)

### Step 4: Churn Rate Estimation

**Methods to estimate churn:**

1. **Research incumbent churn rates:**
   - Review analyst reports (Gartner, Forrester) for typical SaaS churn.
   - Check public disclosures (if competitors are public).
   - SaaS average: 3-5% per month for enterprise, 5-10% for SMB.

2. **Survey competitors via reviews (G2, Capterra):**
   - If many reviews mention "switched to competitor," churn is likely high.
   - If reviews are positive, churn is likely lower.
   - NPS to churn correlation: NPS > 50 typically correlates with <3% monthly churn.

3. **Model from product stickiness:**
   - How frequently does the customer use the product? (Daily = low churn, monthly = high churn)
   - How switching costs? (High integration = low churn, easy exit = high churn)
   - How critical is the product to their operations? (Core function = low churn, nice-to-have = high churn)

Example:
```
Concept: AI Contract Review for Law Firms

Churn research:
- Legal software average churn: 3-5% per month (from Gartner Legal Tech report)
- Incumbent reviews indicate "sticky" (integration into workflow, hard to switch)
- Product criticality: High (contract review is daily task)
- Switching costs: High (data migration, staff retraining)

Estimated churn rate for new entrant (vs. incumbent):
- Incumbent churn: 2-3% per month
- New entrant churn: 4-5% per month (higher because customers less confident in new vendor)
- In year 2-3, if product proves out: 3-4% per month

Conservative assumption: 5% per month in year 1
```

### Step 5: Monthly Recurring Revenue (MRR) & Financial Projections

Build a forward-looking projection:

```
Month 1: Start with 0 customers
- New customers added: 5 (early adopters, probably friends/network)
- Churn: 0 (first month, no churn yet)
- End-of-month customers: 5
- MRR: 5 × $1,250 = $6,250

Month 2:
- New customers added: 10 (ramping up sales)
- Churn: 5 × 5% = 0.25 (negligible at small scale)
- End-of-month customers: 5 + 10 = 15
- MRR: 15 × $1,250 = $18,750

Month 3:
- New customers added: 20
- Churn: 15 × 5% = 0.75
- End-of-month customers: 15 + 20 - 0.75 = 34.25
- MRR: 34.25 × $1,250 = $42,812

... continue for 12-24 months
```

**Key metrics to track:**
- Monthly Recurring Revenue (MRR)
- Net Recurring Revenue (NRR) = MRR + expansion revenue - churn
- Customer count
- MRR per customer (should improve as you upsell/cross-sell)

### Step 6: Breakeven Analysis

**Fixed costs to cover:**
- Payroll: 2 engineers, 1 founder, 1 sales, 1 ops = 5 FTE × $120K = $600K/year = $50K/month
- Office/infrastructure: $10K/month
- Tools, legal, accounting: $5K/month
- Total monthly fixed costs: $65K/month

**Breakeven point:**
```
Breakeven MRR = Fixed Costs / Gross Margin %
            = $65,000 / 0.944
            = $68,875 / month

Breakeven customers = $68,875 / $1,250
                    = 55 customers

At 20 new customers/month with 5% churn:
- Month 1: 5 customers
- Month 2: 15 customers
- Month 3: 34 customers
- Month 4: 50 customers
- Month 5: 63 customers (BREAKEVEN)

Months to breakeven: ~5 months (if new customer acquisition accelerates)
```

### Step 7: Comparison: Agent-First vs. Traditional Model

**Traditional Model (Human-Heavy):**
- Company hires service delivery staff
- 1 FTE required for every X customers (e.g., 1 lawyer per 10 customers for manual review)
- Labor cost: $100K salary + 30% overhead = $130K per FTE
- At 100 customers: 10 FTE needed = $1.3M/year = $108.3K/month labor cost
- Labor cost per customer per month: $108.3K / 100 = $1,083/month
- If price is $1,250/month: Gross margin = 13% (very thin)

**Agent-First Model (AI-Driven):**
- Company uses AI to automate service delivery
- 1 FTE required for every 50 customers (for AI oversight, quality, edge cases)
- Labor cost: 2 FTE = $260K/year = $21.7K/month
- Labor cost per customer per month: $21.7K / 100 = $217/month
- If price is $1,250/month and total COGS is $70/month: Gross margin = 90%+

**Comparative advantage:**
- Cost difference: Human model costs $1,083/month per customer; Agent model costs $217/month
- Savings: $866/month per customer (73% cost reduction)
- Margin difference: Traditional 13%, Agent-first 90%+
- **Competitive advantage:** Agent-first can undercut on price while maintaining 5-10x better margins

### Step 8: Sensitivity Analysis

Identify the 3-5 variables most sensitive to unit economics:

```
Variable 1: Monthly Churn Rate
Base case: 5% per month, LTV = $18K
Pessimistic (8% churn): LTV = $11K (-39%)
Optimistic (2% churn): LTV = $44K (+144%)
Impact: HIGH (one of the most sensitive variables)

Variable 2: Monthly CAC (blended)
Base case: $358, Payback = 0.26 months
Pessimistic ($600 CAC): Payback = 0.43 months (still good, <1 month)
Optimistic ($100 CAC): Payback = 0.07 months
Impact: MEDIUM (payback stays healthy even at higher CAC)

Variable 3: API Costs (per inference)
Base case: $0.0225 per review, COGS = $70, Margin = 94%
Pessimistic ($0.05 per review): COGS = $95, Margin = 92%
Optimistic ($0.01 per review): COGS = $50, Margin = 96%
Impact: LOW (API costs are small relative to price)

Variable 4: ARPU (pricing power)
Base case: $1,250/month, LTV = $18K
Pessimistic ($800/month): LTV = $12K (-33%)
Optimistic ($2,000/month): LTV = $29K (+61%)
Impact: HIGH

Variable 5: Gross Margin % (driven by COGS)
Already explored via API costs and labor assumptions.
```

**Sensitivity table:**
```
Churn Rate vs. LTV:
2% per month → LTV = $44K
3% per month → LTV = $30K
4% per month → LTV = $22K
5% per month → LTV = $18K
6% per month → LTV = $15K
8% per month → LTV = $11K
```

### Step 9: Funding Requirements

Estimate how much capital is needed to reach key milestones:

```
Seed Round Objective: Reach breakeven (55 customers)
- Runway needed: 6 months (to handle slower-than-expected customer growth)
- Monthly burn (until breakeven): $65K fixed + ~$30K variable = $95K/month
- Total burn for 6 months: $570K
- Seed round: $600K (includes 1-month buffer)

Series A Objective: Reach $500K MRR (400 customers)
- Current state: Breakeven at $68K MRR (55 customers)
- Need to go from 55 to 400 customers
- At 30 new customers/month (with ramp): ~11 months
- Burn during this phase: Decreasing (breakeven after month 1)
- Actually, if at breakeven, no burn needed
- But need to invest in sales to accelerate growth
- Sales investment: $100K/month for 3 additional salespeople
- Burn: $100K/month for 11 months = $1.1M
- Series A: $1.2M (includes buffer and expansion investments)

Total capital to reach profitability: $600K + $1.2M = $1.8M
```

### Step 10: Risk Factors & Mitigations

Identify key risks to unit economics:

```
Risk 1: Higher churn than assumed (8% vs. 5% model)
- Likelihood: Medium (product quality risk)
- Impact: LTV drops 50%, profitability pushed out 12+ months
- Mitigation:
  - Invest heavily in product quality, onboarding, support
  - Measure NPS monthly; if <40, halt new sales, focus on retention
  - Target 3% monthly churn by end of year 1

Risk 2: CAC inflation (CAC increases 2x as market gets saturated)
- Likelihood: Medium-High (competitive market)
- Impact: Payback extends from 0.26 to 0.5 months (still okay, but tighter)
- Mitigation:
  - Build partner channel (lower CAC than direct sales)
  - Develop viral/product-led growth to lower blended CAC
  - Lock in early customers with long-term contracts

Risk 3: Price compression (customers want $500/mo, not $1,250/mo)
- Likelihood: Low (strong differentiation, not commodity)
- Impact: Revenue per customer cut 60%, profitability cut dramatically
- Mitigation:
  - Focus on enterprise/high-pain segments (willing to pay)
  - If SMB market is price-sensitive, create SMB product at $500/mo (different COGS model)

Risk 4: COGS inflation (API costs increase 3x)
- Likelihood: Low (APIs typically get cheaper, not more expensive, with scale)
- Impact: Margin from 94% to 75%, still viable
- Mitigation:
  - Fine-tune models on private infrastructure (reduce API dependence)
  - Negotiate volume discounts with API providers
  - Invest in in-house model serving if costs become prohibitive
```

## 5. Data Sources & Integrations

### Primary Research Sources

**SaaS Benchmarks:**
- **SaaS Magic Number Calculator** (Bessemer Venture Partners)
- **SaaS Metrics 2.0** (David Skok)
- **Gartner SaaS Benchmarks** (by industry)
- **OpenView Labs** (SaaS analytics)

**Competitor CAC/LTV Data:**
- **G2, Capterra reviews** (evidence of customer satisfaction/churn)
- **Public company investor presentations** (if public)
- **Analyst reports** (Gartner, McKinsey)
- **News articles about competitor funding/revenue** (sometimes disclosed)

**Industry Churn Benchmarks:**
- **Gartner reports** by industry (legal tech, healthcare, finance, etc.)
- **Bessemer's State of Cloud** (annual report on SaaS churn by segment)

**API & Infrastructure Costs:**
- **Claude API pricing** (Anthropic.com)
- **AWS pricing calculator** (AWS)
- **Stripe pricing** (Stripe)
- **Other third-party APIs** (Plaid, Slack, etc.)

### APIs & Tools

- **Claude API** (for model cost calculations)
- **Spreadsheet tools** (Excel, Google Sheets for modeling)
- **Financial modeling tools** (optional: Tableau, Looker for dashboards)

## 6. Agent Prompt Strategy

### System Prompt Persona

The agent adopts the role of a **startup financial analyst** with experience in unit economics and venture funding. Key characteristics:
- Grounded in data; uses benchmarks and comparable companies.
- Conservative in assumptions; avoids founder optimism bias.
- Understands the mechanics of SaaS business models.
- Can identify the key variables that make-or-break profitability.

### Core Instructions

```
You are a unit economics analyst. Your job is to determine whether a startup concept
can achieve healthy unit economics and become profitable.

For a given concept with market, customer, and cost data:
1. Estimate CAC (customer acquisition cost) across channels.
   - What are typical sales/marketing costs for this market?
   - How long is the sales cycle?
   - What's a realistic blended CAC?
2. Estimate LTV (customer lifetime value).
   - What can customers pay (from willingness-to-pay research)?
   - What are typical churn rates for this market?
   - What's the resulting LTV?
3. Calculate COGS (cost of goods sold).
   - What are the variable costs per customer?
   - API calls, infrastructure, support, etc.?
   - What gross margin does this imply?
4. Model financial projections.
   - How many customers per month (realistic ramp)?
   - When do we reach breakeven?
   - How much capital is required?
5. Compare agent-first vs. traditional model.
   - What's the incumbent cost structure?
   - How much cheaper is agent-first?
   - Is this advantage defensible?
6. Perform sensitivity analysis.
   - Which variables most affect unit economics?
   - What if churn is 2x higher? Price 30% lower?
   - What scenarios threaten viability?
7. Conclude: Are unit economics strong, viable, or unviable?

Output a JSON report matching the provided schema. Use real numbers and cite benchmarks.
```

### Few-Shot Examples in Prompt

**Example 1: B2B SaaS (Contract Review)**
```
Concept: AI Contract Review at $1,250/month

CAC Estimation:
- Channel 1 (Direct Sales): $667 (sales rep can close 10/month at $80K salary)
- Channel 2 (Self-Serve Web): $100 (inbound marketing at $10K/month, 5% conversion)
- Channel 3 (Partnership): $540 (API referrals, partner commission)
- Blended CAC: 30% sales + 50% self-serve + 20% partnership = $358

LTV Estimation:
- ARPU: $1,250/month (pricing tier mix)
- COGS: $70/month (APIs, infrastructure, support)
- Gross Margin: 94%
- Churn: 5% per month (conservative vs. 2-3% incumbent)
- LTV = ($1,250 × 0.94) / 0.05 = $23,500
- (Note: Actual calculation is $1,250 × 0.94 / 0.05 = $23,500)

CAC:LTV Ratio: $358 / $23,500 = 1:65 (EXCELLENT, >1:3 is healthy)
Payback: $358 / ($1,250 × 0.94 / 12) = 0.35 months (~1 week) (EXCELLENT)

Unit Economics Verdict: STRONG
- High LTV, low CAC, quick payback
- Margin structure allows for discounting if needed for growth
- Profitability achievable at scale
```

**Example 2: B2C (Financial Planning)**
```
Concept: AI Financial Advisor at $15/month

CAC Estimation:
- Viral/organic: 30% of signups organic (near-zero CAC)
- Paid ads (TikTok, Instagram): 70% of signups at $5 CAC
- Blended CAC: 0.3 × $0 + 0.7 × $5 = $3.50

LTV Estimation:
- ARPU: $15/month (price-sensitive segment)
- COGS: $5/month (AI API, infrastructure)
- Gross Margin: 67%
- Churn: 8% per month (high; B2C is sticky but many free alternatives)
- LTV = ($15 × 0.67) / 0.08 = $125

CAC:LTV Ratio: $3.50 / $125 = 1:36 (GOOD)
Payback: $3.50 / ($15 × 0.67 / 12) = 2.1 months (OKAY but slower than B2B)

Unit Economics Verdict: VIABLE but TIGHT
- LTV is low due to low price point and high churn
- Need high volume (millions of users) to achieve profitability
- CAC must stay low (viral/organic, not paid marketing at scale)
- Margin structure is thinner than B2B; vulnerable to cost inflation
```

### Edge Case Handling

1. **Product requires significant support (high support cost per customer):**
   - Category support cost as COGS, not OpEx.
   - This may make margins appear weaker initially.
   - Plan to automate support (FAQs, chatbots, agent-driven support) to improve margins over time.

2. **Freemium or two-sided marketplace (asymmetric economics):**
   - Model separately: revenue from payers vs. cost of free users.
   - Typical freemium: 5% conversion, 5-10% free users adding value.
   - May have lower LTV but higher CAC due to free-to-paid friction.

3. **Highly seasonal business (e.g., tax software):**
   - Model revenue and cash flow by season.
   - Runway requirements increase due to cash timing mismatch.
   - Example: Earn $500K in 3 months; burn $100K/month evenly; need $200K in cash buffer.

4. **Enterprise sales with annual contracts:**
   - CAC is much higher (long sales cycles, custom development).
   - But LTV is higher and more predictable.
   - Model: CAC payback may be 12+ months, but once paid, retention is very high.

## 7. Error Handling & Edge Cases

### Data Quality Issues

**Missing churn data:**
- Use industry average (SaaS: 3-5% per month)
- Mark as "conservative assumption"
- Sensitivity-test against 2x and 0.5x variants

**Uncertain API costs:**
- Contact API provider for volume discounts
- Model with current published pricing
- Flag this as a sensitivity variable

**Incomplete competitive pricing data:**
- Use willingness-to-pay research as proxy
- Benchmark against similar categories (e.g., if no legal tech pricing, use professional services SaaS as proxy)
- Note assumption clearly

### Assumption Validation

**CAC payback >12 months:**
- This is generally a red flag
- Question: Can we improve CAC (e.g., partner channel)?
- Or can we improve ARPU (e.g., higher pricing or upsell)?
- Or is churn too high (needs product improvement)?

**LTV:CAC ratio <3:1:**
- This is the danger zone
- Business is not healthy; unit economics don't support growth
- Need to either cut CAC, increase LTV, or reconsider market
- Unless there are other factors (network effects, viral growth potential)

**Negative margin (COGS > revenue):**
- This should never happen (would be an error in data)
- Verify API costs, pricing, and COGS assumptions
- If API costs are truly prohibitive, feasibility is in doubt

### Consistency Checks

**Between components:**
- Market Sizer estimates SOM (Year 1 revenue potential)
- Economics Model projects first-year MRR
- Do they align? If SOM = $10M but economics model projects $300K MRR, that's only $3.6M annualized. Flag the discrepancy.

**Financial Projections Internal Consistency:**
- Revenue projection should match: Starting customers + new adds - churn
- Gross profit = Revenue - COGS
- Net profit = Gross profit - OpEx
- Cumulative cash = starting cash + net profit (minus CapEx)
- Verify formulas are correct

## 8. Performance & Scaling

### Expected Performance Characteristics

**Latency:**
- Simple model (basic CAC, LTV, sensitivity): 4-6 hours
- Comprehensive model (detailed projections, scenarios, risk analysis): 8-12 hours
- Peer review: 1-2 hours

**Throughput:**
- Single concept per run; each gets dedicated financial modeling
- Expected output: One comprehensive unit economics report per concept

**Scaling Considerations:**
- **Parallelization:** Multiple economists can model different concepts simultaneously
- **Template reuse:** Use similar financial models for similar concept types (vertical SaaS, marketplaces, etc.)

## 9. Dependencies

### Upstream Dependencies
- **Phase 2.1 (Market Sizer):** TAM/SAM/SOM estimates validate total addressable market and revenue potential
- **Phase 2.3 (Customer Validator):** Willingness-to-pay and early adopter profile inform ARPU and customer acquisition assumptions
- **Phase 2.4 (Feasibility Assessor):** Build costs and operational costs feed into burn rate and payback calculations
- **Phase 2.2 (Competitive Analyst):** Competitor pricing and CAC inform pricing and acquisition assumptions

### Downstream Dependents
- **Phase 2.6 (Validation Synthesizer):** Unit economics are a core validation factor
- **Phase 3.1 (Business Designer):** Unit economics inform pricing strategy, revenue model
- **Phase 3.5 (Resource Planner):** Burn rate and breakeven timeline inform funding strategy and hiring plan
- **Phase 3.4 (Risk Analyst):** Key economic risks (churn, CAC inflation, price compression) are highlighted

### Parallel Dependencies
- All other Phase 2 components provide input; no sequencing required

## 10. Success Metrics

### Output Quality
1. **Report completeness:** All required fields populated; clear verdict on unit economics strength
2. **Data traceability:** Every assumption (CAC, churn, COGS) is sourced or justified
3. **Sensitivity coverage:** Top 3-5 sensitivity variables are analyzed with clear impact quantification
4. **Realism:** Projections and assumptions are grounded in industry benchmarks, not founder optimism

### Downstream Validation
1. **Economist acceptance:** Cost and revenue projections are used downstream without major revision
2. **Synthesis integration:** Unit economics findings integrate cleanly with other Phase 2 outputs
3. **Founder credibility:** Founder reviews report and finds assumptions reasonable (even if challenging)

### Process Metrics
1. **Benchmark coverage:** Report cites at least 3 industry benchmarks (SaaS churn, CAC, etc.)
2. **Assumption documentation:** Every major assumption is stated and justified
3. **Sensitivity rigor:** Sensitivity analysis covers the 3-5 most impactful variables
4. **Time efficiency:** Modeling completes within 8-12 hour window

## 11. Implementation Notes

### Technology Stack

**Core Agent Framework:**
- **Claude API (Opus)** for financial reasoning and synthesis

**Financial Modeling:**
- **Python** for calculations and projections
- **Libraries:**
  - `pandas` (financial data frames, calculations)
  - `numpy` (numerical calculations, sensitivity analysis)
  - `json` (schema validation)
  - `jinja2` (report templating)

**Output & Storage:**
- JSON report generation (schema validation)
- Markdown for detailed notes
- CSV/Excel export for financial projections

### Development Approach

**Phase 1: Foundation**
- Build CAC estimation framework
- Implement LTV calculation
- Create basic financial projection model (12 months)

**Phase 2: Enhancements**
- Add sensitivity analysis
- Implement agent-first vs. traditional comparison
- Build funding estimation

**Phase 3: Intelligence**
- Add LLM-based financial reasoning
- Implement scenario analysis (best/base/worst case)
- Build risk quantification

### Key Implementation Details

**CAC Calculation:**
```python
@dataclass
class AcquisitionChannel:
    name: str
    cost_per_customer: float
    customer_percentage: float  # 0-1
    scalability: str

def calculate_blended_cac(channels: list[AcquisitionChannel]) -> float:
    """Calculate blended CAC across channels."""
    return sum(c.cost_per_customer * c.customer_percentage for c in channels)

def payback_period_months(cac: float, monthly_gross_profit: float) -> float:
    """Calculate CAC payback period in months."""
    return cac / monthly_gross_profit
```

**LTV Calculation:**
```python
def calculate_ltv(arpu_monthly: float,
                  gross_margin_pct: float,
                  monthly_churn_pct: float,
                  expansion_revenue_monthly: float = 0) -> float:
    """
    Calculate customer lifetime value.
    arpu_monthly: average revenue per user per month
    gross_margin_pct: gross margin as percentage (0-100)
    monthly_churn_pct: monthly churn rate as percentage (0-100)
    expansion_revenue_monthly: additional revenue from upsells/cross-sells
    """
    gross_margin_decimal = gross_margin_pct / 100
    churn_decimal = monthly_churn_pct / 100

    # Base LTV formula
    base_ltv = (arpu_monthly * gross_margin_decimal) / churn_decimal

    # Add expansion revenue contribution
    # Assume expansion happens for percentage of customers, for certain duration
    expansion_ltv = expansion_revenue_monthly / churn_decimal if expansion_revenue_monthly else 0

    return base_ltv + expansion_ltv

def financial_projection(starting_customers: int,
                        monthly_cac: float,
                        monthly_arpu: float,
                        monthly_churn_pct: float,
                        monthly_fixed_costs: float,
                        monthly_cogs_per_customer: float,
                        months: int = 12) -> list[dict]:
    """Generate month-by-month financial projection."""
    projections = []
    customers = starting_customers

    for month in range(1, months + 1):
        # Customer count
        new_adds = ... # from acquisition strategy
        churned = customers * (monthly_churn_pct / 100)
        customers = customers + new_adds - churned

        # Revenue
        monthly_revenue = customers * monthly_arpu
        monthly_cogs = customers * monthly_cogs_per_customer
        gross_profit = monthly_revenue - monthly_cogs
        net_profit = gross_profit - monthly_fixed_costs

        projections.append({
            "month": month,
            "customers": customers,
            "new_adds": new_adds,
            "churned": churned,
            "revenue": monthly_revenue,
            "cogs": monthly_cogs,
            "gross_profit": gross_profit,
            "fixed_costs": monthly_fixed_costs,
            "net_profit": net_profit
        })

    return projections
```

**Sensitivity Analysis:**
```python
def sensitivity_analysis(base_value: dict,
                        variable: str,
                        ranges: list[float]) -> dict:
    """
    Test how output changes with variable changes.
    variable: the parameter to vary (e.g., 'monthly_churn_pct')
    ranges: list of values to test (e.g., [2, 3, 5, 7, 10])
    """
    results = {}
    for value in ranges:
        modified_input = base_value.copy()
        modified_input[variable] = value
        output = calculate_ltv(**modified_input)
        results[value] = output

    return results
```

### Testing & Validation

**Unit tests:**
- CAC blending formula is correct
- LTV calculation matches hand calculations
- Financial projection internal consistency (revenue = customers × ARPU, etc.)
- Payback period calculation is accurate

**Integration tests:**
- Upstream data (from market sizer, customer validator) is correctly ingested
- Downstream agents can parse financial projections
- Sensitivity analysis correctly identifies key variables

**Smoke tests:**
- Run modeling on 3 test concepts
- Verify report completeness and realism
- Confirm projections can reach profitability (or clearly identify why not)

### Common Pitfalls & How to Avoid Them

1. **Optimistic churn assumptions:**
   - Benchmark against comparable SaaS products
   - New entrants typically have 1.5-2x churn of market leaders
   - If benchmarks suggest 3% churn, assume 5-6% for new entrant

2. **Underestimating CAC:**
   - Sales cycles are usually longer than founder estimates
   - Factor in full cost: salary, commission, tools, content, events
   - Account for conversion rates (e.g., "only 5% of leads convert")

3. **Ignoring payment processing & support costs:**
   - Stripe takes ~3% + transaction fee
   - Support often costs $50-200 per customer per month
   - Don't exclude from COGS

4. **Forgetting to account for refunds/chargebacks:**
   - SaaS churn includes some percentage refund rates (2-5%)
   - Model as a cost reduction from revenue

5. **Overly long sales cycles for SMB:**
   - Enterprise sales: 6-12 months ✓
   - Mid-market sales: 2-3 months ✓
   - SMB self-serve: <1 month ✓
   - Don't assume enterprise sales cycles for SMB product

### Deployment Checklist

- [ ] CAC calculation logic is tested against sample data
- [ ] LTV formula is verified (compare to hand calculations)
- [ ] Financial projection calculations are internally consistent
- [ ] Sensitivity analysis covers 3-5 key variables
- [ ] Agent-first vs. traditional model comparison logic is sound
- [ ] JSON schema validation is active
- [ ] Report templates are finalized
- [ ] Industry benchmarks are updated (SaaS Magic Number, etc.)
- [ ] Downstream agents can successfully parse output
- [ ] Documentation and runbooks are complete
