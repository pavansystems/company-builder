# Market Sizer Component Specification

## 1. Purpose & Responsibility

The **Market Sizer** is a research agent responsible for estimating the total addressable market (TAM), serviceable addressable market (SAM), and serviceable obtainable market (SOM) for a given startup concept. It rigorously combines top-down (macro market data) and bottom-up (customer counting) methodologies to produce defensible market size estimates with explicit confidence ranges.

This component is critical to the validation pipeline because market size directly influences feasibility assessments, economics models, and ultimately the go/no-go decision. A concept with a brilliant unit economics but a $5M TAM is fundamentally different from one with the same unit economics and a $500M TAM.

The Market Sizer owns:
- Primary market research and data collection
- Multiple estimation methodologies (top-down, bottom-up, value-based)
- Confidence interval calculation
- Growth trajectory projection
- Methodology documentation and auditability
- Identification of data gaps and assumptions

## 2. Inputs

### Primary Input
A **Concept Definition Object** from Phase 1, containing:
```
{
  id: string (UUID),
  name: string,
  problem_statement: string,
  target_market: string,
  target_customer_segments: [
    {
      segment_name: string,
      description: string,
      geographic_focus: string (optional)
    }
  ],
  value_proposition: string,
  key_assumptions: [string],
  landscape_report_id: string (reference to Phase 1.1 output)
}
```

### Secondary Input
The **Landscape Report** (from Phase 1.1) containing:
- Incumbent competitor list with estimated market share
- Pricing analysis of existing solutions
- Revenue data for relevant market segments (where available)
- Customer acquisition patterns
- Regulatory constraints
- Technology stack overview

### Data Sources Referenced
- Industry analyst reports (Gartner, IDC, Forrester, McKinsey)
- Government statistics and economic data
- Patent and trademark databases
- Public company filings (10-Ks, earnings calls)
- Job posting trends and salary surveys
- Search volume data (Google Trends, SEMrush)

## 3. Outputs

### Primary Output
A **Market Size Report** document containing:

```json
{
  report_id: string (UUID),
  concept_id: string,
  generated_at: ISO8601 timestamp,
  tam: {
    estimate_usd: number,
    low_range_usd: number,
    high_range_usd: number,
    confidence_level: "high" | "medium" | "low",
    confidence_pct: number (0-100),
    methodology: "top_down" | "bottom_up" | "hybrid",
    description: string
  },
  sam: {
    estimate_usd: number,
    low_range_usd: number,
    high_range_usd: number,
    confidence_level: "high" | "medium" | "low",
    confidence_pct: number,
    serviceable_segments: [
      {
        segment_name: string,
        serviceable_percentage: number (0-100),
        rationale: string
      }
    ],
    description: string
  },
  som: {
    year_1_usd: number,
    year_3_usd: number,
    year_5_usd: number,
    confidence_level: "high" | "medium" | "low",
    market_share_assumption_pct: number,
    description: string
  },
  growth_trajectory: {
    cagr_pct: number,
    projection_years: number,
    key_growth_drivers: [string],
    market_maturity: "nascent" | "early_growth" | "mature" | "declining"
  },
  methodology_notes: string,
  data_sources: [
    {
      source_name: string,
      source_type: string,
      year: number,
      relevant_metric: string
    }
  ],
  key_assumptions: [
    {
      assumption: string,
      impact: "high" | "medium" | "low",
      sensitivity: number (0-100)
    }
  ],
  data_gaps: [
    {
      gap: string,
      impact: "high" | "medium" | "low",
      suggested_research: string
    }
  ]
}
```

### Secondary Output
Supporting research artifacts:
- Spreadsheet with calculation details and source links
- List of analyst reports and data sources consulted
- Sensitivity analysis tables (TAM vs. key variables)
- Geographic/segment breakdown tables

## 4. Core Logic / Algorithm

### Step 1: Problem Decomposition
Parse the concept and identify key market dimensions:
- **Who** is the customer? (job titles, company size, geography, industry)
- **What** are they buying? (what is the unit of sale — per user, per transaction, per month, per instance)
- **How much** do they currently spend on alternative solutions? (TAM proxy)
- **Where** are they? (geographic markets, vertical markets)

### Step 2: Top-Down Estimation
1. **Start with macro market data:** Identify the largest relevant industry classification (e.g., "professional services," "healthcare," "logistics").
2. **Get market size from analyst reports:** Consult Gartner, McKinsey, IDC reports for the category size. Record the data source, year, and geographic scope.
3. **Narrow to serviceable segment:** Apply qualification criteria to identify what percentage of the total market is addressable by this concept.
   - Example: If target market is "legal services" ($500B globally) and the concept only addresses "contract analysis for mid-market law firms in the US," narrow to roughly $30-50B.
4. **Document methodology:** Capture the calculation trail: "Legal services globally (Gartner 2024) = $500B. US market = 40% = $200B. Mid-market (vs. enterprise + solo) = 25% = $50B."

### Step 3: Bottom-Up Estimation
1. **Identify and count potential customers:**
   - For B2B: Number of companies in the target segment × penetration rate assumption.
   - For B2C: Target population × addressable percentage.
   - Use sources: Bureau of Labor Statistics, company registries, industry databases.

2. **Estimate willingness to pay per customer:**
   - Survey comparable solutions and their pricing (from competitive analysis).
   - If a concept targets SMBs but prices at enterprise level, adjust willingness-to-pay downward.
   - Research current spending on pain point (e.g., "How much do companies currently spend on contract review? Manual labor + software = $X").

3. **Calculate total:** Customer count × average revenue per customer (ARPU) = Market size.

Example:
```
TAM for "AI Contract Review for SMBs":
- US law firms with 10-100 employees: ~15,000 firms (from Bureau of Labor Statistics)
- Law firms + in-house legal (mid-market companies): ~50,000 entities
- Contract review is a labor-intensive task; current spend per entity: $150K-300K/year (manual review + discounted legal time)
- Not all will adopt (addressable penetration): 30-40%
- Bottom-up TAM: 50,000 × $200K (midpoint) = $10B
```

### Step 4: Value-Based Cross-Check
1. **Understand the economic value** the concept creates:
   - If the concept saves a customer $500K/year per instance, and there are 100,000 instances, TAM = $50B.
2. **Validate against comparable disruptions:** How large were markets before Slack, Stripe, or Notion disrupted them? Use similar categories as a sanity check.

### Step 5: Segment Breakdown (SAM Calculation)
1. **Apply geographic constraints:** If concept is US-only initially, apply 1/3-1/4 adjustment to TAM (US ≈ 30-40% of global markets in many categories).
2. **Apply vertical constraints:** If targeting only mid-market (not enterprise, not SMB), estimate what percentage of total addressable market that represents.
3. **Apply customer segment filters:** If only healthcare verticals addressable, apply healthcare percentage of total.

Example:
```
TAM: $10B (global contract review)
SAM (US only, mid-market law firms, in-house counsel):
- US: 40% = $4B
- Mid-market (vs. all): 35% = $1.4B
- In-house counsel focus: 60% = $840M
SAM = $840M
```

### Step 6: SOM Calculation (Year 1, 3, 5)
1. **Estimate market penetration at Year 1:** What percentage of SAM will this concept realistically capture?
   - Nascent category: 0.1-2%
   - Established category: 2-10%
   - High-momentum segment: 5-20%
2. **Multiply SAM by penetration percentage:** SOM = SAM × penetration%.
3. **Project forward** with growth assumptions:
   - Year 3: Apply CAGR (typically 30-100% for breakout SaaS).
   - Year 5: Sustain or adjust growth as market maturity increases.

Example:
```
SAM: $840M
Year 1 penetration assumption: 1.5% (nascent market)
Year 1 SOM: $12.6M

CAGR assumption: 60% (high-growth SaaS)
Year 3 SOM: $12.6M × (1.6^2) = $32.3M
Year 5 SOM: $12.6M × (1.6^4) = $82.5M
```

### Step 7: Confidence Assessment
1. **Rate confidence for each estimate** (TAM, SAM, SOM):
   - **High confidence (75-100%):** Multiple concordant data sources, direct comparable, clear methodology.
   - **Medium confidence (50-75%):** Analyst estimates with caveats, some data gaps, indirect comparables.
   - **Low confidence (<50%):** Nascent category, significant data gaps, high assumption dependence.

2. **Identify sensitivity drivers:** Which 2-3 assumptions, if changed by 25-50%, would materially shift the market size?

### Step 8: Gap and Risk Identification
1. **Document data gaps:** What data would strengthen the estimate?
2. **Assess volatility:** Is this market contracting, flat, or expanding? How stable are the incumbent players?
3. **Flag regulatory risks:** Licensing, compliance, or privacy laws that could reduce addressable market.

## 5. Data Sources & Integrations

### Primary Research Databases (via API or manual access)
- **Gartner Magic Quadrant & Market Guides** (subscription; must query manually or via licensed API)
- **IDC Market Size Reports** (subscription; often cited in investor reports)
- **Statista** (subscription; market statistics across 150+ categories)
- **Bureau of Labor Statistics (BLS)** (free, US employment data via API)
- **LinkedIn** (job posting trends, company headcount estimates)
- **Crunchbase** (company funding, team size, employee count)

### Secondary Data Sources
- **Google Trends** (free; relative search volume for keywords)
- **SEMrush / Ahrefs** (subscription; keyword search volume, competitive organic traffic)
- **USPTO / Trademark databases** (free; to understand patent landscape and competitor IP)
- **Public company filings** (SEC Edgar, Yahoo Finance; publicly traded competitors' revenue and margins)
- **Glassdoor / Levels.fyi / PayScale** (salary data to estimate labor cost baselines)
- **SurveyMonkey / Qualtrics** (for custom willingness-to-pay surveys if conducting primary research)

### Third-Party APIs to Integrate
- **BLS API** (employment data)
- **Google Trends API** (search volume)
- **Company registry APIs** (OpenDuns, Company Lookup services)
- **News & research aggregators** (Perplexity, NewsAPI for market trend validation)

### Manual Research Processes
- Analyst report searching (via Google Scholar, company websites)
- Competitor website scraping for pricing, feature, and customer list inference
- Industry forum and community analysis (Reddit, Slack communities, niche forums)

## 6. Agent Prompt Strategy

### System Prompt Persona
The agent adopts the role of a **meticulous market research analyst** with experience in venture capital and startup due diligence. Key characteristics:
- Skeptical of assumptions; always seeks corroborating evidence.
- Methodical in calculation and transparent about methodology.
- Comfortable with data gaps; documents them explicitly rather than speculating.
- Biased toward conservative (lower) estimates in TAM, but transparent about upside scenarios.

### Core Instructions

```
You are a market sizing expert. Your job is to produce TAM, SAM, and SOM estimates
that a venture capitalist would find defensible.

For a given startup concept:
1. Break down the market into component parts (geography, customer segment, use case, etc.)
2. Use BOTH top-down (analyst reports) and bottom-up (customer counting) approaches.
3. ALWAYS document your data sources, calculation steps, and confidence levels.
4. Identify the 3 most critical assumptions. If these assumptions are wrong by 50%,
   how much does the market size change?
5. Flag data gaps. If critical data is missing, suggest how to obtain it.
6. Challenge the concept's market boundaries. Are there adjacent markets?
   Can the concept expand beyond the initial TAM?

Output a JSON report matching the schema provided.
```

### Few-Shot Examples in Prompt

**Example 1: B2B SaaS (Contract Review)**
```
Concept: AI Contract Analysis for Legal Departments

Top-down:
- Legal services market (Gartner 2024): $500B globally
- Corporate legal departments: ~$200B subset (40%)
- Contract lifecycle management: ~$15B subset (7.5% of legal spend)
- US market: 40% of global = $6B
- Mid-market focus (excluding solo + megacorp): 50% = $3B SAM

Bottom-up:
- In-house legal departments (US): 25,000 (Bureau of Labor Statistics + Bureau of Labor)
- Average contract review spend per dept: $200K/year (based on salary data + software)
- TAM: 25,000 × $200K = $5B (aligns with top-down)

Confidence: Medium-High (75%)
```

**Example 2: B2C (Personal Finance)**
```
Concept: AI Financial Planning for Gen Z

Top-down:
- Wealth management market: $100B (Statista)
- Retail/DTC segment: $20B
- Gen Z addressable: 15% (demographic filter) = $3B

Bottom-up:
- Gen Z population (US): 70M
- % with investable assets (>$5K): 20% = 14M
- ARPU (willingness to pay for planning): $200/year = $2.8B

Confidence: Low-Medium (60%)
(Data gap: Limited research on Gen Z financial planning adoption; relying on proxy
 assumptions about willingness-to-pay)
```

### Edge Case Handling

1. **Nascent Category (no comparable market):**
   - Use analogous category as proxy (e.g., TAM for "AI-powered logistics" ≈ logistics market size × disruption premium).
   - Document the analogy explicitly.
   - Set confidence to LOW.

2. **Highly Fragmented Market (many tiny competitors, no clear leader):**
   - Bottom-up approach often more reliable than top-down.
   - Count addressable customers directly.
   - Use current spending on workarounds as willingness-to-pay proxy.

3. **Geographic Expansion Unknowns:**
   - Default assumption: Start with US only (40% of global markets).
   - Document expansion TAM separately (what if successful in EU? Asia?).
   - Use different confidence levels for each geography.

4. **Regulatory Constraints:**
   - If concept requires licensing or compliance (financial services, healthcare), model as a market shrinkage factor.
   - Example: "If only 30% of target market can legally adopt due to compliance, SAM = TAM × 0.3."

## 7. Error Handling & Edge Cases

### Data Quality Issues

**Outdated analyst reports:**
- If latest analyst report is 2-3 years old, apply growth rate adjustment. Assume market grew at 10-15% CAGR (unless stated otherwise).
- Document the aging and adjustment clearly.

**Conflicting data sources:**
- If Gartner says market is $5B and IDC says $7B, take the midpoint and note the discrepancy.
- If major discrepancies exist (>50% difference), flag for human review.

**Missing crucial data points:**
- If you cannot find addressable customer count or willingness-to-pay data, pivot to value-based methodology.
- If even value is unclear, set confidence to LOW and suggest primary research (surveys, interviews).

### Assumption Stress Testing

Build sensitivity analysis:
- If customer count is off by 25%, how much does TAM change? (proportionally 25%).
- If ARPU is off by 50%, how much does TAM change? (proportionally 50%).
- Identify which 2-3 assumptions drive 80% of variance.

### Boundary Cases

**Market too large (>$100B TAM):**
- Is the concept truly attacking the entire TAM, or a niche?
- Recalibrate to SAM more aggressively.
- Example: "AI for all of healthcare = $2T, but this concept targets ophthalmology = $50B."

**Market too small (<$100M TAM):**
- Verify this is not a lifestyle business or niche hobby market.
- Check if there are adjacent market opportunities.
- Flag for founder review: "Is the market truly this small, or have we misconstrued the addressable segment?"

**No clear comparables:**
- Use first-principles approach: How much would a customer pay to avoid the pain point?
- Interview 5-10 target customers if possible.
- Build TAM from unit economics backwards: If concept costs $50K to build and $10K/year to run, and needs to serve 1000 customers to break even, TAM must support that.

## 8. Performance & Scaling

### Expected Performance Characteristics

**Latency:**
- Simple market sizing (top-down only, existing analyst reports): 2-4 hours.
- Complex market sizing (multi-region, bottom-up customer counting, new research): 8-16 hours.
- Peer review and refinement: 2-4 hours.

**Throughput:**
- Single concept per run (not batch). Each concept gets dedicated research effort.
- Expected output: One comprehensive report per concept per Phase 2 run.

**Data/API Load:**
- API calls to BLS, Google Trends: Minimal (rate-limited, but typically <100 queries per sizing).
- Analyst report access: Depends on subscription; assume cached/manual lookup.
- No database load concerns (read-only research phase).

### Scaling Considerations

- **Parallel research:** Multiple market-sizers can work on different concepts simultaneously.
- **Caching:** Reuse industry/category data across concepts (e.g., "legal services market size" is same across all legal concepts).
- **Human augmentation:** For concepts in under-researched categories, escalate to human researcher for 1-2 hours of primary research (surveys, interviews).

## 9. Dependencies

### Upstream Dependencies
- **Phase 1.1 (Landscape Analyst):** Relies on landscape report for competitor context, pricing, and market structure.
- **Phase 1.3 (Concept Generator):** Relies on final concept definition and value proposition clarity.
- **Watchlist/Input:** Market opportunity tag from Phase 0 provides initial market context.

### Downstream Dependents
- **Phase 2.2 (Competitive Analyst):** Uses TAM/SAM to contextualize competitor positioning and market share estimates.
- **Phase 2.5 (Economics Modeler):** Directly uses TAM/SAM/SOM to validate unit economics and pricing strategy.
- **Phase 2.6 (Validation Synthesizer):** Aggregates market size findings as core validation evidence.
- **Phase 3 (Blueprint agents):** Uses market size estimates for business model design, funding projections, and hiring plans.

### No Dependencies On
- Customer validation (can run in parallel)
- Feasibility assessment (can run in parallel)
- Competitive deep-dive (can run in parallel; uses only high-level landscape data)

## 10. Success Metrics

### Output Quality
1. **Report completeness:** All required fields populated; no null values except for explicitly optional fields.
2. **Methodology transparency:** Every calculation has a source citation and step-by-step logic documented.
3. **Confidence calibration:** Confidence levels are consistent with data quality. (High confidence only when >2 corroborating sources; low confidence with significant gaps.)

### Downstream Validation
1. **Downstream agent agreement:** Competitive analyst, economist, and validator use market size estimates without major objections (flagged in synthesis phase).
2. **Consistency with comparable markets:** Market size estimates fall within reasonable ranges relative to adjacent markets. (E.g., if TAM for "AI for legal" is $3B, it should be 1-10% of total legal services market.)

### Process Metrics
1. **Research time:** Sizing completes within 8-16 hour window for standard concepts.
2. **Human escalation rate:** <10% of concepts require human researcher escalation due to data gaps.
3. **Assumption variance:** Top 3 assumptions, when sensitivity-tested, move market size by no more than +/- 50% in any direction (otherwise assumptions are too brittle).

## 11. Implementation Notes

### Technology Stack

**Core Agent Framework:**
- **Claude API (Opus)** for research reasoning and synthesis.
- **Tool calling** to invoke external APIs (BLS, Google Trends, etc.) and retrieve analyst reports from cached storage.

**Data & Research Tools:**
- **Python** for data processing, calculation, and report generation.
- **Libraries:** pandas (data manipulation), requests (API calls), json (schema validation).
- **Template system:** Jinja2 for report generation from results.

**Integration Points:**
- **BLS API:** Direct HTTP integration for employment data.
- **Google Trends API:** Direct HTTP integration for search volume trends.
- **Analyst report store:** File-based or S3 storage of cached Gartner/IDC reports with metadata index.
- **Output store:** JSON serialization to central data store (DB or file system).

### Development Approach

**Phase 1: Foundation**
- Implement top-down methodology (analyst report lookup + calculation).
- Build basic data source integrations (BLS API, Google Trends).
- Create schema validation and report template.

**Phase 2: Enhancements**
- Add bottom-up customer counting logic.
- Implement sensitivity analysis framework.
- Build analyst report caching and search.

**Phase 3: Intelligence**
- Add LLM-based reasoning for gap identification and methodology selection.
- Implement comparable market analogies.
- Build confidence calibration heuristics.

### Key Implementation Details

**Tool Calling (for Claude agent):**
```python
tools = [
    {
        "name": "search_analyst_reports",
        "description": "Search cached analyst reports by market/category",
        "input_schema": {
            "market_category": "string (e.g., 'legal services', 'logistics')",
            "year_range": "[2022-2024]"
        }
    },
    {
        "name": "query_bls_data",
        "description": "Query BLS API for employment/wage data",
        "input_schema": {
            "series_id": "string (BLS series code)",
            "start_year": "integer",
            "end_year": "integer"
        }
    },
    {
        "name": "get_google_trends",
        "description": "Get Google Trends data for keywords",
        "input_schema": {
            "keywords": "[string]",
            "timeframe": "string (e.g., '5y')"
        }
    },
    {
        "name": "lookup_company_data",
        "description": "Query Crunchbase/LinkedIn for company counts and funding",
        "input_schema": {
            "industry": "string",
            "geographic_focus": "string",
            "company_size": "string"
        }
    }
]
```

**Calculation Engine:**
```python
def calculate_tam_bottom_up(customer_count: int, arpu: float, penetration_pct: float) -> dict:
    """
    customer_count: estimated number of potential customers
    arpu: annual revenue per user (in dollars)
    penetration_pct: addressable percentage of total (0-100)
    """
    serviceable = customer_count * (penetration_pct / 100)
    tam = serviceable * arpu
    return {
        "customer_count": customer_count,
        "arpu": arpu,
        "penetration_pct": penetration_pct,
        "tam_usd": tam
    }

def sensitivity_analysis(base_tam: float, assumptions: dict) -> dict:
    """
    Test +/- 25% and 50% variance on each assumption
    """
    results = {}
    for key, value in assumptions.items():
        sensitivity = {}
        for variance_pct in [-50, -25, 25, 50]:
            adjusted_value = value * (1 + variance_pct / 100)
            # Recalculate TAM with adjusted assumption
            # ...
            sensitivity[variance_pct] = new_tam
        results[key] = sensitivity
    return results
```

**Report Generation:**
```python
template = """
# Market Sizing Report

## Executive Summary
- TAM: ${tam_estimate:,.0f} (${tam_low:,.0f} - ${tam_high:,.0f})
- SAM: ${sam_estimate:,.0f}
- Confidence: {confidence_level}

## Methodology
{methodology_text}

## Data Sources
{sources_list}

## Key Assumptions & Sensitivity
{sensitivity_table}

## Data Gaps & Recommendations
{gaps_list}
"""
```

### Testing & Validation

**Unit tests:**
- Calculation accuracy (verify formulas match methodology).
- Schema compliance (JSON output matches expected schema).
- Confidence calibration (check that high-confidence estimates have 2+ corroborating sources).

**Integration tests:**
- API calls to BLS, Google Trends return expected data.
- Analyst report lookup retrieves correct reports.
- Downstream agents can parse and use report without errors.

**Smoke tests:**
- Run sizing on 2-3 test concepts (one B2B SaaS, one B2C, one embedded/API).
- Verify report generation and output quality.
- Confirm downstream use (economics agent can ingest report).

### Common Pitfalls & How to Avoid Them

1. **Inflated TAM (founder bias):**
   - Always apply geographic and segment filters explicitly.
   - If TAM seems >$50B, challenge the market boundaries.
   - Cross-check against comparable disruptions (Slack started in $30B+ market, Stripe in $100B+).

2. **Opaque assumptions:**
   - Document EVERY assumption with rationale.
   - If assuming "30% market penetration," explain why (not just "that's what Slack achieved").

3. **Ignoring data gaps:**
   - Explicitly list missing data and its impact on confidence.
   - Never fill gaps with speculation; flag for human research if critical.

4. **Stale data:**
   - Check publication date of every analyst report.
   - Adjust old data with growth assumptions clearly documented.
   - Re-run sizing annually as new data emerges.

### Deployment Checklist

- [ ] All external APIs (BLS, Google Trends) are authenticated and tested.
- [ ] Analyst report repository is populated and indexed.
- [ ] JSON schema validation is active.
- [ ] Report templates are finalized and tested.
- [ ] Sensitivity analysis functions are verified on sample data.
- [ ] Confidence calibration heuristics are tuned.
- [ ] Downstream agents can successfully parse output.
- [ ] Error handling and edge cases are documented and tested.
- [ ] Documentation and runbooks are complete.
