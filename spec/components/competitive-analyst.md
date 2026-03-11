# Competitive Analyst Component Specification

## 1. Purpose & Responsibility

The **Competitive Analyst** conducts a deep, structured intelligence gathering operation on direct and indirect competitors in the target market. Unlike the Phase 1.1 landscape analyst (which provides a broad map of the market), this agent digs into each significant competitor to understand exactly how they operate, where they're vulnerable, and where the new concept has structural advantages.

This component is critical because a concept with brilliant unit economics and a $500M TAM can still fail if dominant competitors have structural defensibility (network effects, switching costs, or superior unit economics). Conversely, a seemingly modest market can be attacked if competitors are poorly run, overpriced, or mired in legacy technology.

The Competitive Analyst owns:
- Detailed competitor data collection (public sources only)
- Pricing model reverse engineering
- Business model analysis
- Technology stack assessment
- Vulnerability and weakness identification
- Competitive advantage mapping
- Market share estimation
- Go-to-market and customer acquisition strategy analysis

## 2. Inputs

### Primary Input
A **Concept Definition Object** from Phase 1:
```
{
  id: string (UUID),
  name: string,
  target_market: string,
  target_customer_segments: [{segment_name, description}],
  value_proposition: string,
  competitive_advantage: [string],
  pricing_model: string (e.g., "subscription", "freemium", "usage-based"),
  projected_pricing: {
    entry_price: number,
    enterprise_price: number,
    currency: string
  }
}
```

### Secondary Input
The **Landscape Report** (from Phase 1.1) containing:
- List of known incumbents and challengers
- Market structure overview
- Existing pricing data
- Regulatory environment

## 3. Outputs

### Primary Output
A **Competitive Intelligence Report** containing:

```json
{
  report_id: string (UUID),
  concept_id: string,
  generated_at: ISO8601 timestamp,
  competitive_landscape: {
    total_competitors_identified: number,
    market_leaders: [
      {
        rank: number,
        company_name: string,
        estimated_market_share_pct: number,
        estimated_revenue_usd: number (optional),
        data_confidence: "high" | "medium" | "low"
      }
    ],
    competitor_categories: [
      {
        category: "incumbent" | "challenger" | "startup" | "adjacent",
        company_count: number,
        examples: [string]
      }
    ]
  },
  detailed_competitor_profiles: [
    {
      competitor_id: string (UUID),
      name: string,
      category: string,
      founded_year: number,
      hq_location: string,
      estimated_employees: number,
      funding_total_usd: number (optional),
      funding_latest_round: {
        amount_usd: number,
        year: number,
        investors: [string]
      },
      business_model: {
        revenue_model: string,
        primary_customers: [string],
        estimated_revenue_usd: number,
        revenue_data_year: number,
        revenue_data_confidence: "high" | "medium" | "low"
      },
      pricing: {
        pricing_model: string,
        entry_tier_price: number,
        enterprise_tier_price: number,
        currency: string,
        billing_frequency: string,
        free_tier: boolean,
        pricing_source_url: string
      },
      product_offering: {
        primary_features: [string],
        secondary_features: [string],
        technology_stack: [string],
        supported_integrations: [string]
      },
      customer_acquisition: {
        primary_channels: [string],
        estimated_payback_period_months: number (optional),
        estimated_cac_usd: number (optional),
        marketing_positioning: string
      },
      strengths: [
        {
          strength: string,
          source_evidence: string,
          defensibility: "high" | "medium" | "low"
        }
      ],
      weaknesses: [
        {
          weakness: string,
          source_evidence: string,
          exploit_opportunity: string
        }
      ],
      strategic_trajectory: {
        observed_direction: string,
        recent_product_launches: [string],
        stated_roadmap: string,
        personnel_changes: [string]
      }
    }
  ],
  competitive_positioning: {
    feature_matrix: {
      dimensions: [string],
      competitors: [
        {
          name: string,
          scores: {
            [dimension]: number (0-10)
          }
        }
      ]
    },
    pricing_comparison: {
      price_points: [
        {
          segment: string,
          competitors: [
            {
              name: string,
              price_usd: number,
              price_per_unit: number
            }
          ]
        }
      ]
    },
    competitive_advantages_of_concept: [
      {
        advantage: string,
        magnitude: "high" | "medium" | "low",
        defensibility: "sustainable" | "temporary",
        time_to_copy: string (e.g., "6 months", "2 years")
      }
    ]
  },
  vulnerability_assessment: {
    most_vulnerable_competitor: string,
    vulnerability_summary: string,
    exploitable_weaknesses: [
      {
        weakness: string,
        affected_competitors: [string],
        how_concept_exploits: string,
        difficulty_to_fix: "easy" | "medium" | "hard"
      }
    ]
  },
  market_dynamics: {
    consolidation_trend: string,
    technological_disruption: string,
    regulatory_tailwinds_headwinds: [string],
    new_entrant_barriers: [string],
    switching_cost_level: "high" | "medium" | "low"
  },
  data_sources: [
    {
      source_name: string,
      source_type: string (e.g., "website", "sec_filing", "crunchbase", "article", "patent"),
      url: string,
      access_date: ISO8601 date,
      reliability: "primary" | "secondary" | "tertiary"
    }
  ],
  research_gaps: [
    {
      gap: string,
      affected_competitor: string,
      impact: "high" | "medium" | "low",
      suggested_research: string
    }
  ],
  analyst_conclusion: {
    overall_competitive_intensity: "high" | "medium" | "low",
    concept_viability_vs_competition: string,
    key_success_factors: [string],
    highest_risk_from: [string]
  }
}
```

### Secondary Output
Supporting research artifacts:
- Competitor comparison spreadsheet (features, pricing, headcount, funding)
- Feature parity matrix (concept vs. each major competitor)
- Pricing analysis chart (price vs. feature set)
- Market share estimation (with methodology notes)
- Timeline of competitor product launches and pivots

## 4. Core Logic / Algorithm

### Step 1: Competitor Identification & Categorization

1. **Start with known competitors** from the landscape report.
2. **Expand the list** through:
   - Google search for "alternatives to [competitor]"
   - Product Hunt, G2, Capterra competitor lists
   - Patent citations and assignees (who is inventing in this space?)
   - Venture database searches (Crunchbase, PitchBook) by category
   - LinkedIn company pages and job postings (who is hiring for similar roles?)

3. **Categorize by threat level:**
   - **Direct incumbent:** Large, established player with 10%+ market share.
   - **Challenger:** Fast-growing startup with <10% market share but gaining traction.
   - **Niche specialist:** Smaller player dominating a subsegment.
   - **Emerging disruptor:** Very new (< 3 years) but with novel approach.
   - **Adjacent player:** Operates in related market; could expand into this one.

### Step 2: Core Metrics Collection

For each significant competitor (focus on top 5-10), research and document:

**Company Basics:**
- Founding date, location, team size.
- Public data sources: Crunchbase, LinkedIn, company website, SEC filings (if public).

**Financial Data:**
- Total funding raised (from Crunchbase, press releases).
- Estimated annual revenue (infer from Crunchbase burn rate, job postings, pricing × customer count).
- If public: Revenue from 10-K filings.
- If private: Look for clues in press releases, Glassdoor salary reports, LinkedIn headcount.

Example inference: "If a company has 200 employees at an average salary of $150K, annual burn is ~$30M. If the company is 3 years old and has raised $50M, it's likely still pre-revenue or ramping. If it raised $50M 5 years ago, it's probably generating $20-50M ARR."

**Pricing Model:**
- Go to competitor website and document all pricing tiers.
- Note: entry price, mid-tier price, enterprise price.
- Billing frequency (monthly, annual).
- Free tier or trial availability.
- Contact sales vs. self-service signup.

**Customer Acquisition:**
- Primary channels: direct sales, self-serve, partner channels, marketplace?
- Payback period: Can infer from CAC and pricing. (E.g., $3K CAC ÷ $500/month pricing = 6-month payback.)
- Sales team size: Estimate from LinkedIn profiles and job postings.
- Marketing strategy: Website messaging, content marketing (blog, webinars), PPC, partnerships.

**Product Features & Tech:**
- Use the product free trial if available; read feature lists from website.
- Technology stack: Check StackShare, LinkedIn job postings (what skills are they hiring for?), patent filings (what do they claim to have invented?).
- Integrations: What third-party services does it connect to? (Indicates ecosystem strategy.)
- Roadmap: Stated in blog posts, webinars, investor pitch decks (if leaked), or inferred from job postings.

### Step 3: Strength & Weakness Analysis

**Strengths to identify:**
- **Network effects:** Does value increase with user count? (E.g., marketplaces, communication tools.)
- **Data moats:** Do they have proprietary data no one else can easily replicate?
- **Switching costs:** Is it costly for customers to leave? (E.g., deep integrations, legacy data dependencies.)
- **Regulatory defensibility:** Do they hold licenses or certifications competitors can't easily get?
- **Brand & trust:** Are they the default choice in their category?
- **Superior unit economics:** Can they sustain lower prices and still be profitable?
- **Talent advantage:** Do they employ the best people in the space?

**Weaknesses to identify:**
- **High pricing:** Do customers frequently complain about cost in reviews (Capterra, G2)?
- **Poor UX:** Is the product known for being clunky or hard to use? (Review sites, Twitter complaints.)
- **Technical debt:** Are they slow to ship new features? Legacy technology holding them back?
- **Limited integrations:** Does the product work in isolation, requiring manual data entry?
- **Customer service:** Are there complaints about support responsiveness?
- **Market segment blind spots:** Do they focus on enterprise but ignore SMB? Vice versa?
- **Geographic constraints:** Only serve one region; expansion gaps?
- **Dependency on human labor:** Still have high headcount despite the concept being automatable?
- **Founder/leadership changes:** Is the company in transition?

### Step 4: Pricing Analysis & Positioning

1. **Map competitors on price × feature matrix:**
   - X-axis: Price per unit per month (normalized for fair comparison).
   - Y-axis: Feature richness (count of features, or Likert scale 1-10).
   - Each competitor is a dot; pattern emerges.

2. **Identify price-value gaps:**
   - If competitor A charges $500/month with 20 features.
   - And competitor B charges $200/month with 15 features.
   - Is there a gap for a $100/month, 10-feature entrant? Or a $1000/month, 30-feature premium player?

3. **Calculate implied customer willingness-to-pay:**
   - If competitor prices at $500/month and has 1000 customers, they're capturing $6M ARR.
   - If they're growing 40% YoY, the market is expanding.
   - New entrant pricing should factor in: Can we undercut on price? Should we instead be premium and claim superior value?

Example pricing analysis:
```
Contract Review Market:
- Incumbent A: $5K-10K/month (enterprise only, 50% of market)
- Incumbent B: $500-2K/month (mid-market focus, 30% of market)
- Startup C: $100-300/month (self-serve, growing 200%+ YoY, 15% of market)
- Gap: $2K-5K/month segment for premium SMB product (5% of market)

Concept pricing: $300/month (undercut Startup C, target volume; or $1500/month (capture gap; own premium SMB segment)
```

### Step 5: Competitive Advantage Assessment

For each claimed advantage of the concept, evaluate:

1. **Is it real?** Can we prove it with data?
   - Example claim: "Our agent-first approach costs 60% less than traditional players."
   - Validation: Research 3-5 competitors' cost structures. Document the math.

2. **Is it defensible?** Can competitors copy it in 6 months? 2 years?
   - **High defensibility:** Patents, network effects, data moats, deep customer relationships.
   - **Medium defensibility:** Superior execution, team expertise, first-mover advantage.
   - **Low defensibility:** Feature innovation, marketing positioning, minor UI improvements.

3. **What's the time-to-parity?**
   - Can a well-funded competitor replicate this advantage in 6 months? 1 year? 3+ years?
   - Example: "Cost advantage via agent automation is sustainable for 2-3 years because competitors need to rebuild their entire operating model."

### Step 6: Market Dynamics & Barriers

Assess:
1. **Consolidation trend:** Is the market consolidating (winners emerging) or fragmenting (room for newcomers)?
   - Evidence: Are acquisitions happening? Funding increasing or declining?

2. **Regulatory tailwinds/headwinds:**
   - New regulation that favors incumbent compliance? Or creates barriers?
   - Example: "New data privacy law makes all competitors spend $2M on compliance; opportunity for new entrant with privacy-by-design."

3. **Technological disruption:**
   - Is a major technology change on the horizon that incumbents will struggle to adopt?
   - Example: "Competitors have legacy on-premise systems; shift to cloud is forcing them to modernize."

4. **Switching cost level:**
   - High switching costs = safer for incumbents, harder for new entrants.
   - Low switching costs = customers ready to switch if value is clear.

### Step 7: Synthesis & Vulnerability Mapping

1. **Identify the most exploitable weaknesses:**
   - If 3+ competitors are "slow at shipping features," speed-to-market is a key advantage.
   - If all competitors are enterprise-focused, SMB is underserved.
   - If all competitors charge $1K+/month, there's room for a $100/month entrant.

2. **Map how the concept exploits these weaknesses:**
   - "Competitors use expensive human analysts; we use agents. 60% cost advantage."
   - "Competitors sell only to enterprises; we target SMB with self-serve model."

3. **Assess how hard these weaknesses are to fix:**
   - **Easy to fix (< 6 months):** Pricing, marketing messaging, minor features.
   - **Medium difficulty (6-18 months):** Product overhaul, tech stack upgrade, team hiring.
   - **Hard to fix (18+ months):** Cultural shift (e.g., from human-centric to agent-centric operations), legacy system replacement.

## 5. Data Sources & Integrations

### Primary Sources (Public Data)

**Company & Funding Data:**
- **Crunchbase** (subscription; company profiles, funding, revenue estimates)
- **PitchBook** (subscription; similar to Crunchbase)
- **LinkedIn** (free; company size, employees, team profiles)
- **SEC Edgar** (free; 10-Ks, 10-Qs for public companies)
- **Company websites** (free; pricing, product features, team info)

**Customer Feedback & Reviews:**
- **G2** (free; product reviews, ratings, pricing feedback)
- **Capterra** (free; product reviews and pricing)
- **Trustpilot** (free; customer reviews and ratings)
- **Reddit** (free; community discussions, complaints, praise)
- **Product Hunt** (free; product launches, user discussions)

**Product & Technology Intelligence:**
- **StackShare** (free; technology stack of companies and products)
- **GitHub** (free; open source projects, activity, contributors)
- **Patents & Trademarks** (USPTO.gov, free; what companies are inventing)
- **Press releases** (company websites, press release aggregators)
- **Job postings** (LinkedIn, Indeed, Glassdoor; what companies are hiring for, team structure clues)

**Market & Industry Data:**
- **Patent analysis** (Google Patents, Espacenet; who is active in the space?)
- **News aggregators** (Google News, industry-specific news sites)
- **Analyst reports** (Gartner, IDC; market analysis, competitor positioning)
- **Wayback Machine** (archive.org; historical pricing, feature changes)

### APIs & Tools to Integrate

- **Crunchbase API** (company data, funding, revenue estimates)
- **LinkedIn Company API** (if available; employee count, headcount trends)
- **Job posting APIs** (Indeed, LinkedIn; hiring activity as signal of scale)
- **News aggregators** (NewsAPI, Perplexity; recent company mentions)
- **Google Search API** (for competitor searches, integration discovery)

### Manual Research Processes

- Website analysis (pricing pages, feature lists, job postings, blog post dates)
- SEC Edgar manual filing search
- LinkedIn profile browsing (leadership team, employee count trends over time)
- Customer interviews or surveys (1-2 per key competitor segment, if conducting primary research)

## 6. Agent Prompt Strategy

### System Prompt Persona

The agent adopts the role of a **venture capital competitive intelligence analyst** with experience in deal due diligence and market analysis. Key characteristics:
- Investigative; digs for hidden signals and implications.
- Evidence-based; every claim is sourced and cited.
- Strategic thinker; connects dots between competitor moves, market dynamics, and the concept's positioning.
- Skeptical of rosy narratives; challenges assumptions.
- Focused on what matters: customer acquisition cost, retention, defensibility, not vanity metrics.

### Core Instructions

```
You are a competitive intelligence analyst. Your job is to understand what makes
competitors succeed or fail, and where the new concept has structural advantages.

For a given startup concept and target market:
1. Identify all significant competitors (incumbents, challengers, adjacent players).
2. For each major competitor (top 5-10):
   - Document pricing, features, team size, funding, revenue (infer if necessary).
   - Assess strengths: What do they do well? What would be hard to replicate?
   - Identify weaknesses: What are they bad at? Where are they vulnerable?
   - Analyze their business model, CAC, and go-to-market strategy.
3. Build a competitive positioning matrix (feature vs. price).
4. For each claimed advantage of the new concept:
   - Is it real? Can we validate it with data?
   - Is it defensible? How long until competitors copy it?
   - How would you exploit competitor weaknesses to gain market share?
5. Assess market dynamics: Is consolidation happening? Are new technologies disrupting?
6. Conclude: Are incumbents entrenched or vulnerable? What's the new concept's best path to market?

Output a JSON report matching the provided schema. Every claim should have a source.
```

### Few-Shot Examples in Prompt

**Example 1: B2B SaaS (AI Contract Review)**
```
Concept: AI Contract Review for SMB Law Firms

Competitors Identified:
1. Incumbent A: ContractShark (founded 2015, 200+ employees, ~$30M ARR estimated)
   - Strengths: Brand recognition, enterprise relationships, feature-rich platform.
   - Weaknesses: $5K+/month pricing, slow feature shipping (1 major feature/quarter), sales-dependent model.
   - Technology: Legacy .NET stack, difficult to add AI features.

2. Challenger B: LawTech Pro (founded 2020, 30 employees, $2-5M ARR estimated)
   - Strengths: Modern cloud-native, SMB-friendly pricing ($300-800/month), fast iterations.
   - Weaknesses: Limited integrations, small team, limited feature set vs. enterprise players.
   - Technology: Node.js, React, built-in API-first architecture.

Vulnerability Mapping:
- ContractShark: High CAC (sales team), slow to innovate. Opportunity: Undersell on price, faster feature iteration with AI.
- LawTech Pro: Limited feature set. Opportunity: Superior AI-powered features.

Concept Advantage:
- Cost: AI agent handles 70% of contract review vs. human (ContractShark charges $300/doc; our cost = $5/doc).
- Defensibility: Depends on AI quality. If we build 2-year head start in agent training, defensible for 2+ years.
  Competitors can catch up, but require 12-18 months to rebuild.
```

**Example 2: B2C (Gen Z Financial Planning)**
```
Concept: AI Financial Planning App for Gen Z

Competitors Identified:
1. Incumbent A: Wealthfront (founded 2012, $50M+ ARR estimated, public company parent)
   - Strengths: Scale, credibility, rich features, $3-50M AUM managed.
   - Weaknesses: UX feels dated, designed for Millennials, minimum $500 investment, complex onboarding.

2. Challenger B: Acorns (founded 2014, $100M+ ARR estimated, public parent)
   - Strengths: Gen Z-friendly UX, low barrier to entry ($5), gamification.
   - Weaknesses: Limited planning, mostly just savings + investing, high churn.

3. Startup C: Monarch Money (founded 2021, $2-5M ARR, 50 employees, raised $20M)
   - Strengths: Modern UX, personal finance focus (not just investing), young user base.
   - Weaknesses: No investing features, small team, pre-revenue or low revenue.

Vulnerability Mapping:
- Wealthfront, Acorns: Design for older users. Opportunity: Gen Z-native design, TikTok-friendly UX.
- All: Limited AI-powered advice. Opportunity: AI coach that learns user behavior and gives contextual advice.

Concept Advantage:
- UX: AI-generated, personalized advice vs. static portfolio algorithms.
- Defensibility: UX can be copied in 6 months. Advice quality (based on data, training) defensible for 1-2 years.
```

### Edge Case Handling

1. **Monopoly or near-monopoly market (HHI > 2500):**
   - Concept must identify a specific angle to differentiate (price, niche, UX, speed).
   - Expect strong retaliation from incumbent (price war, feature match, acquisition).
   - Analyze incumbent's ability to execute at speed (culture, technology, incentives).

2. **Fragmented market (many small competitors, no clear leader):**
   - Identify which players are "winning" and why.
   - Assess whether fragmentation is structural (niche markets) or temporary (pre-consolidation).
   - Opportunity may be in aggregation or consolidation play.

3. **New category (no direct competitors):**
   - Identify adjacent competitors that customers might use as workarounds.
   - Assess "incumbent's advantage" (can they enter and dominate this new category?).
   - Example: Before Slack, competitors were email, IRC, and nothing. Adjacent was email + Salesforce Chatter.

4. **Competitor data unavailable:**
   - For private companies, use maximum likelihood inference.
   - Cross-check multiple sources (Crunchbase, investor reports, job postings, Glassdoor).
   - If key metrics unavailable, flag as data gap and suggest how to obtain (customer interviews, sales conversations).

## 7. Error Handling & Edge Cases

### Data Quality Issues

**Outdated company information:**
- Crunchbase data can lag 6-12 months.
- Always cross-check with latest LinkedIn data, job postings, press releases.
- If conflict, use most recent source.

**Revenue estimation uncertainty:**
- For private companies, ARR is estimated; mark confidence as "low" or "medium."
- Use multiple triangulation methods (Crunchbase burn rate, employee count × revenue per employee, funding × runway assumptions).
- If estimates conflict by >50%, flag discrepancy.

**Incomplete pricing information:**
- If competitor doesn't publicly list prices, note "contact sales" and estimate based on comparables.
- If custom pricing only, estimate range based on customer segment and features.

### Competitor Identification Edge Cases

**Market flooding (too many small competitors):**
- Focus on top 10 by market share, funding, or growth rate.
- Group smaller competitors into "long tail" category.
- Document the grouping rationale.

**Vertically integrated competitors:**
- If a competitor serves multiple adjacent markets, focus only on the overlap with the concept's target.
- Example: Salesforce competes in CRM but also has Service Cloud (customer service). For a "CRM for nonprofits," focus only on Salesforce's nonprofit features.

**Indirect competitors:**
- If potential customers use a workaround (e.g., spreadsheets, manual process, adjacent software), document it as "indirect competition."
- Assess switching cost from workaround to the concept.

### Confidence & Source Validation

**High confidence data:**
- Public company filings (10-K, 10-Q).
- Direct pricing information from competitor websites.
- Crunchbase data corroborated by 2+ sources.

**Medium confidence data:**
- Crunchbase revenue estimates (use CrunchParity scores).
- LinkedIn headcount trends (if consistent over time).
- Article mentions and press releases.

**Low confidence data:**
- Glassdoor salary data (small sample, variable quality).
- Inferred revenue from employee count.
- Unverified customer lists.

Always state confidence level explicitly.

## 8. Performance & Scaling

### Expected Performance Characteristics

**Latency:**
- Simple competitive analysis (3-5 major competitors): 4-8 hours.
- Comprehensive analysis (10+ competitors, detailed profiling): 12-20 hours.
- Peer review and synthesis: 2-4 hours.

**Throughput:**
- Single concept per run; each gets dedicated research.
- Expected output: One comprehensive competitive intelligence report per concept.

**Data/API Load:**
- Crunchbase API calls: Minimal (rate-limited; typically <50 queries).
- LinkedIn scraping: Via API if available; otherwise manual (lower throughput).
- Public web scraping: CSS-based extraction (pricing pages, feature lists).
- No database load concerns (read-only research phase).

### Scaling Considerations

- **Parallel research:** Multiple competitive analysts can work on different concepts simultaneously.
- **Caching:** Reuse competitor data across concepts (e.g., "Salesforce market positioning" applies to all CRM concepts).
- **Competitive intelligence database:** Build a database of competitor profiles over time. New concepts can reference historical profiles, reducing re-research.
- **Customer interviews:** For high-uncertainty competitors, escalate to human for 1-2 customer interviews to validate CAC, churn, NPS.

## 9. Dependencies

### Upstream Dependencies
- **Phase 1.1 (Landscape Analyst):** Provides initial competitor list and market structure.
- **Phase 1.3 (Concept Generator):** Concept definition with value proposition and claimed advantages.
- **Market Sizer:** (Parallel) Market size data informs competitor market share estimates.

### Downstream Dependents
- **Phase 2.5 (Economics Modeler):** Uses competitor CAC, pricing, and margin data to benchmark the concept's economics.
- **Phase 2.6 (Validation Synthesizer):** Aggregates competitive findings as evidence of market viability.
- **Phase 3.1 (Business Designer):** Uses pricing and GTM insights to refine revenue model.
- **Phase 3.3 (GTM Strategist):** Uses competitive positioning to define messaging and positioning strategy.
- **Phase 3.4 (Risk Analyst):** Identifies competitive response risks and mitigation strategies.

### Parallel Dependencies
- **Phase 2.1 (Market Sizer):** (Parallel; can exchange data)
- **Phase 2.3 (Customer Validator):** (Parallel; can share customer insight sources)
- **Phase 2.4 (Feasibility Assessor):** (Parallel; can share technology stack data)

## 10. Success Metrics

### Output Quality
1. **Report completeness:** All required fields populated; no null values except explicitly optional fields.
2. **Source attribution:** Every claim (competitor revenue, pricing, feature, weakness) has at least one source link.
3. **Evidence strength:** Competitive advantages are validated with data, not speculation.
4. **Vulnerability clarity:** Top 3-5 exploitable weaknesses are clearly articulated with specific guidance on how the concept exploits them.

### Downstream Validation
1. **Concept founder agreement:** Founder reviews report and finds it credible and useful. (Optional; can be validated via feedback form.)
2. **Downstream agent use:** Economics modeler and GTM strategist can successfully use competitive data to inform their models.
3. **Market research consistency:** Competitive findings align with market sizing (if competitor has 40% market share, it aligns with TAM estimate).

### Process Metrics
1. **Research completeness:** At least 5 major competitors analyzed with detailed profiles.
2. **Data gap rate:** <15% of target data points are missing or uncertain.
3. **Time efficiency:** Research completes within expected latency (8-20 hours).
4. **Source diversity:** Report cites at least 10 different source types (websites, Crunchbase, LinkedIn, SEC filings, articles, reviews, etc.).

## 11. Implementation Notes

### Technology Stack

**Core Agent Framework:**
- **Claude API (Opus)** for research reasoning and synthesis.
- **Tool calling** to invoke web scraping, API queries, and data retrieval.

**Data Collection & Processing:**
- **Python** for web scraping, data aggregation, and report generation.
- **Libraries:**
  - `beautifulsoup4` (HTML parsing for pricing, features)
  - `requests` (HTTP for web scraping)
  - `selenium` (if dynamic JavaScript rendering needed for pricing pages)
  - `pandas` (data organization and comparison tables)
  - `json` (schema validation)

**Integrations:**
- **Crunchbase API** (company data, funding, revenue estimates)
- **LinkedIn API** (company data, if available)
- **Google Search** (competitor discovery, news)
- **StackShare API** (technology stack data)

**Output & Storage:**
- JSON report generation (schema validation before output)
- Markdown for supporting artifacts
- CSV/Excel for comparison tables

### Development Approach

**Phase 1: Foundation**
- Implement Crunchbase and web scraping integrations.
- Build competitive profile template and data collection.
- Create pricing extraction logic for common SaaS pricing pages.

**Phase 2: Enhancements**
- Add LinkedIn company data collection.
- Implement feature matrix comparison.
- Build temporal tracking (price changes, new product launches over time).

**Phase 3: Intelligence**
- Add LLM-based reasoning for advantage/weakness assessment.
- Implement customer sentiment analysis (Capterra/G2 reviews).
- Build competitive threat scoring algorithm.

### Key Implementation Details

**Tool Calling (for Claude agent):**
```python
tools = [
    {
        "name": "search_competitors",
        "description": "Search for competitors in a market category",
        "input_schema": {
            "market_category": "string",
            "search_type": "string (e.g., 'G2', 'Capterra', 'Crunchbase', 'ProductHunt')"
        }
    },
    {
        "name": "get_crunchbase_company",
        "description": "Retrieve company data from Crunchbase",
        "input_schema": {
            "company_name": "string",
            "include_fields": ["funding", "revenue_estimate", "employees", "founders"]
        }
    },
    {
        "name": "scrape_pricing_page",
        "description": "Extract pricing tiers from a competitor website",
        "input_schema": {
            "url": "string"
        }
    },
    {
        "name": "get_company_reviews",
        "description": "Retrieve reviews from G2, Capterra, or Trustpilot",
        "input_schema": {
            "company_name": "string",
            "platform": "string (e.g., 'G2', 'Capterra')",
            "limit": "integer (default 20)"
        }
    },
    {
        "name": "search_company_news",
        "description": "Find recent news and press releases about a company",
        "input_schema": {
            "company_name": "string",
            "timeframe": "string (e.g., '6m', '1y')"
        }
    },
    {
        "name": "get_job_postings",
        "description": "Retrieve job postings to infer company growth and team structure",
        "input_schema": {
            "company_name": "string",
            "limit": "integer (default 10)"
        }
    }
]
```

**Competitive Profile Data Model:**
```python
@dataclass
class CompetitorProfile:
    company_name: str
    founded_year: int
    hq_location: str
    estimated_employees: int
    total_funding_usd: float
    estimated_revenue_usd: float

    # Pricing
    pricing_model: str
    entry_price_usd: float
    enterprise_price_usd: float
    free_tier: bool

    # Product
    primary_features: list[str]
    technology_stack: list[str]
    integrations: list[str]

    # Business
    primary_channels: list[str]  # sales, self-serve, marketplace, etc.
    estimated_cac_usd: float = None

    # Assessment
    strengths: list[dict]  # {"strength": str, "evidence": str, "defensibility": str}
    weaknesses: list[dict]  # {"weakness": str, "evidence": str, "exploit": str}

    # Confidence
    data_confidence: dict  # {"funding": "high", "revenue": "medium", ...}

def build_feature_matrix(competitors: list[CompetitorProfile],
                        dimensions: list[str]) -> DataFrame:
    """
    Build a comparison matrix (competitors × features).
    dimensions: e.g., ["API integration", "AI features", "Mobile app", "Support quality"]
    Return: DataFrame with competitors as rows, dimensions as columns, scores 0-10.
    """
    ...

def calculate_competitive_advantage(concept_feature: str,
                                    competitor_scores: dict[str, float],
                                    concept_score: float) -> dict:
    """
    For a feature claimed by the concept, calculate:
    - How much better is the concept than the average competitor?
    - Is this advantage defensible (hard to copy)?
    - How long until competitors can catch up?
    """
    ...
```

**Pricing Analysis:**
```python
def analyze_pricing(competitors: list[CompetitorProfile],
                   concept_pricing: float) -> dict:
    """
    Build pricing comparison chart:
    - X: Price per unit
    - Y: Feature count / Likert scale
    - Identify gaps (empty quadrants) in the market.
    """
    return {
        "pricing_matrix": df,
        "price_gaps": [{"price_range": "$X-Y", "features": "Z", "opportunity": "..."}],
        "concept_positioning": {"price": concept_pricing, "features": concept_features, "positioning": "..."}
    }
```

### Testing & Validation

**Unit tests:**
- Scraping accuracy (verify pricing extraction matches website).
- Data schema compliance (JSON matches required schema).
- Confidence calibration (high-confidence estimates have corroborating sources).

**Integration tests:**
- Crunchbase API returns expected data.
- Web scraping handles dynamic sites.
- Downstream agents can parse and use competitive data.

**Smoke tests:**
- Run competitive analysis on 3 test concepts (SaaS, B2C, embedded/API).
- Verify report generation and output quality.
- Confirm downstream use (GTM strategist can leverage competitive insights).

### Common Pitfalls & How to Avoid Them

1. **Incomplete competitor list:**
   - Don't stop at obvious incumbents; search for challengers and adjacent players.
   - Use multiple discovery methods: G2, Crunchbase, news search, patent analysis.

2. **Outdated or inaccurate data:**
   - Cross-validate data across multiple sources (Crunchbase + LinkedIn + company website).
   - Flag conflicts with confidence levels.

3. **Missing context on pricing:**
   - Don't just list prices; understand the unit economics and value proposition.
   - If pricing is "contact sales," estimate based on comparables and segments.

4. **Overlooking weaknesses:**
   - Look beyond features (reviews, media, sentiment analysis).
   - Customer complaints often reveal real pain points competitors aren't addressing.

5. **Overstating defensibility:**
   - Be conservative. Most feature advantages can be copied in 6-12 months.
   - Focus on defensible advantages: data, network effects, switching costs, IP.

### Deployment Checklist

- [ ] Crunchbase API is authenticated and tested.
- [ ] Web scraping infrastructure is built and handles JavaScript-heavy sites.
- [ ] G2/Capterra review data retrieval is working.
- [ ] Pricing page extraction is tested on 5+ competitor sites.
- [ ] JSON schema validation is active.
- [ ] Report templates are finalized.
- [ ] Feature matrix and pricing analysis formulas are verified.
- [ ] Downstream agents can successfully parse output.
- [ ] Data caching strategy is implemented (avoid re-scraping).
- [ ] Error handling for competitor data gaps is documented.
- [ ] Documentation and runbooks are complete.
