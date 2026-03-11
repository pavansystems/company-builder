# Landscape Analyst Component (Phase 1.1)

## Purpose & Responsibility

The Landscape Analyst is responsible for building a comprehensive, structured understanding of a target market or industry. It serves as the foundational research step in the Ideation phase, creating a detailed map of the competitive, operational, and value-chain landscape that subsequent components (Pain Extractor, Concept Generator) will use to identify disruption opportunities.

**Core responsibilities:**
- Conduct web-based research to identify incumbent players and their market positions
- Map the complete value chain from suppliers through distribution to end customers
- Analyze incumbent business models, pricing strategies, and technology stacks
- Identify where human labor is concentrated and which tasks are currently manual
- Assess regulatory environment and barriers to entry
- Surface publicly visible competitive weaknesses and operational vulnerabilities

The output is a structured landscape report that becomes the authoritative reference for all downstream analysis in Phase 1.

---

## Inputs

**Primary Input:**
- **Market Opportunity Object** (from Phase 0 watchlist or user-provided)
  - `market_id`: Unique identifier for this market
  - `market_name`: Name of the market/industry (e.g., "Legal Document Automation", "Venture Capital Due Diligence")
  - `problem_statement`: High-level description of the problem or inefficiency
  - `enabling_signals`: List of technology/regulatory signals that make this newly attackable
  - `estimated_market_size`: Optional TAM estimate from Phase 0
  - `urgency_notes`: Context about why this market is timely

**Secondary Inputs:**
- Company names/industries mentioned in the opportunity
- Any pre-existing domain knowledge or constraints
- List of known incumbents (if pre-populated)

**Data Sources Accessed:**
- Public web (Google search, company websites, SEC filings)
- Industry databases (Crunchbase, LinkedIn, AngelList)
- Pricing pages and product documentation
- News archives and analyst reports
- Patent databases (if relevant to tech stack)

---

## Outputs

**Primary Output: Landscape Report (structured document)**

```json
{
  "market_id": "string",
  "market_name": "string",
  "report_date": "ISO 8601 date",
  "research_confidence": "high|medium|low",

  "executive_summary": {
    "description": "string (2-3 paragraph overview)",
    "market_size_estimate": "string (e.g., '$5B–$10B annually')",
    "growth_rate": "string (e.g., '12% CAGR')",
    "key_insight": "string (single most important finding)"
  },

  "incumbent_map": {
    "primary_competitors": [
      {
        "name": "string",
        "market_position": "market_leader|strong_player|niche_player",
        "estimated_market_share": "percentage or 'unknown'",
        "employee_count": "integer or 'unknown'",
        "funding_status": "public|private_funded|bootstrapped",
        "key_products": ["string"],
        "pricing_model": "subscription|usage-based|one-time|hybrid",
        "customer_base": "description of target customer",
        "publicly_visible_weakness": ["string"]
      }
    ],
    "secondary_competitors": [
      {
        "name": "string",
        "focus_area": "string (e.g., 'vertical-specific variant')",
        "market_position": "string"
      }
    ],
    "consolidation_activity": "description of recent M&A or market changes"
  },

  "value_chain": {
    "steps": [
      {
        "stage": "string (e.g., 'Supplier/Input', 'Production', 'Distribution', 'Customer Service')",
        "description": "what happens at this stage",
        "key_players": ["string"],
        "human_labor_dependency": "high|medium|low",
        "labor_details": "description of what humans do here",
        "automation_readiness": "high|medium|low",
        "automation_notes": "where and why AI agents could intervene"
      }
    ],
    "critical_handoffs": [
      {
        "from_stage": "string",
        "to_stage": "string",
        "friction": "description of where information loss or delay occurs",
        "opportunity": "how this could be automated"
      }
    ]
  },

  "technology_analysis": {
    "incumbent_tech_stacks": [
      {
        "company": "string",
        "inferred_stack": {
          "platform": "string (e.g., 'SaaS cloud-native')",
          "frontend": ["string"],
          "backend": ["string"],
          "data_infrastructure": ["string"],
          "integrations": ["string"]
        },
        "confidence": "high|medium|low"
      }
    ],
    "automation_potential": {
      "integration_difficulty": "high|medium|low",
      "api_availability": "rich_apis|limited|none",
      "data_accessibility": "structured|semi-structured|unstructured",
      "notes": "assessment of how easy it would be to plug agents into this ecosystem"
    }
  },

  "pricing_landscape": [
    {
      "company": "string",
      "model": "subscription|usage|hybrid|other",
      "price_points": ["string (e.g., '$99/month', '$0.10 per transaction')"],
      "typical_customer_cost": "string (e.g., '$1,200–$3,000 annually for mid-market')",
      "pricing_drivers": ["string (e.g., 'volume', 'features', 'user count')"],
      "estimated_margins": "percentage or 'unknown'"
    }
  ],

  "regulatory_landscape": {
    "compliance_requirements": ["string (e.g., 'SOC 2', 'HIPAA for health data')"],
    "data_residency_constraints": "description",
    "licensing_requirements": ["string"],
    "recent_regulatory_changes": ["string"],
    "risk_level": "high|medium|low"
  },

  "barriers_to_entry": {
    "capital_requirements": "string (estimated upfront cost to build competitive product)",
    "regulatory_barriers": "description",
    "customer_switching_costs": "high|medium|low (plus explanation)",
    "network_effects": "strong|moderate|weak (plus explanation)",
    "other_barriers": ["string"]
  },

  "human_labor_dependency_map": {
    "total_role_estimate": "string (e.g., 'Incumbents employ ~50,000 people in direct service roles')",
    "roles_by_function": [
      {
        "function": "string (e.g., 'Document Review', 'Customer Intake', 'Report Generation')",
        "estimated_headcount_per_company": "integer or range",
        "tasks": ["string"],
        "current_tools": "string (tools used to do this work)",
        "cost_per_operation": "string (e.g., '$75 per hour labor')",
        "automation_potential": {
          "feasibility": "high|medium|low",
          "timeline": "immediate|6-12 months|2+ years",
          "dependencies": ["string (e.g., 'Access to document APIs', 'Training on customer data')"]
        }
      }
    ],
    "highest_potential_target": "string (which functions would benefit most from agent automation)"
  },

  "market_dynamics": {
    "growth_drivers": ["string"],
    "headwinds": ["string"],
    "market_sentiment": "consolidating|fragmenting|consolidating_around_platforms",
    "trend_analysis": "description of major shifts (e.g., 'Moving toward SaaS from perpetual licenses')"
  },

  "research_sources": [
    {
      "type": "company_website|news|analyst_report|industry_report|patent_filing|social_media",
      "source": "string (URL or identifier)",
      "date_accessed": "ISO 8601 date",
      "reliability": "high|medium|low"
    }
  ],

  "research_gaps": [
    {
      "gap": "string (what we don't know)",
      "impact": "high|medium|low",
      "how_to_fill": "string (suggested approach)"
    }
  ],

  "next_steps_for_pain_extractor": [
    "string (specific questions or areas for Pain Extractor to investigate)"
  ]
}
```

**Secondary Output:**
- **Source List**: Curated list of 5–10 most authoritative sources for this market (for Pain Extractor and Concept Generator to use)
- **Incumbent Profiles**: Downloadable snapshot of each major competitor (name, website, estimated employee count, key products)

---

## Core Logic / Algorithm

### High-Level Process

1. **Decompose the Market Opportunity**
   - Extract core market/industry name and problem area
   - Generate search queries to find relevant incumbents and market context
   - Query Google, industry databases, SEC filings to build an initial competitor list

2. **Identify and Profile Incumbents**
   - For each incumbent found:
     - Extract basic info (name, website, employee count from LinkedIn)
     - Identify key products/services from website
     - Analyze pricing page (if public) to extract pricing model and tiers
     - Search for recent news, funding announcements, job postings
     - Identify publicly stated weaknesses or customer complaints
   - Rank incumbents by market position (market share proxy: employee count × growth signal)

3. **Map the Value Chain**
   - Define the sequence of steps required to deliver value to end customers
   - For each step:
     - Identify who currently performs it (which incumbent, or is it fragmented?)
     - Describe what work happens
     - Assess percentage of work that is currently human-driven
     - Note any integration points or handoffs

4. **Assess Technology Stack** (for leading incumbents)
   - Analyze website technology (frontend, hosting, integrations visible in UI)
   - Review API availability and documentation (if public)
   - Examine job postings to infer engineering culture and tech choices
   - Check for recent technology shifts or platform migrations

5. **Analyze Pricing**
   - Collect all visible pricing tiers and per-unit costs
   - Calculate implied revenue per customer
   - Compare pricing between incumbents to identify positioning differences

6. **Assess Regulatory Environment**
   - Search for compliance certifications mentioned on company websites
   - Identify data residency or privacy requirements
   - Note any licensing or permitting requirements

7. **Identify Barriers to Entry**
   - Assess capital required to build a competitive product
   - Document customer lock-in or switching costs
   - Evaluate network effects or platform moats

8. **Map Human Labor Dependency**
   - From value chain and job postings, estimate what percentage of incumbent operations is human-driven
   - Identify which specific tasks are most labor-intensive and therefore most ripe for automation
   - Estimate incumbent labor costs

9. **Synthesize Findings**
   - Write executive summary highlighting the key insight
   - Flag research gaps and confidence levels
   - Provide recommendations for Pain Extractor (specific areas to dig into)

---

## Data Sources & Integrations

### Web Search & Crawling
- **Google Custom Search API** (for targeted market research queries)
- **Direct website scraping** (BeautifulSoup/Playwright for pricing pages, product docs)

### Business Data
- **Crunchbase API** (company profiles, funding, employee estimates)
- **LinkedIn** (company pages, employee counts, hiring signals)
- **LinkedIn RocketReach or similar** (founder/leadership lookup)

### Financial & Regulatory Data
- **SEC EDGAR** (for public companies: 10-Ks, earnings calls, regulatory filings)
- **USPTO/WIPO** (patent search for tech stack insights and defensibility)

### Industry Databases
- **Gartner/Forrester reports** (if available; may be paywalled)
- **G2/Capterra** (reviews, features, pricing comparisons)
- **AngelList** (private company funding and team info)

### News & Sentiment
- **Google News Archive** (recent market movements, acquisitions, bankruptcies)
- **Twitter/X API** (sentiment analysis, founder commentary)
- **Reddit** (r/[industry], r/[specific_problem] for authentic customer discussion)

### Market Research Tools
- **Semrush/Ahrefs** (for market search volume trends)
- **SimilarWeb** (for traffic and competitive web presence)

---

## Agent Prompt Strategy

### System Prompt / Role Definition

```
You are a market research analyst with deep expertise in business intelligence,
competitive analysis, and operational efficiency. Your task is to build a comprehensive,
structured map of a target industry or market.

You think systematically: you identify not just who the competitors are, but how
they operate, where they're vulnerable, and which human-intensive tasks they perform
that might be automatable by AI agents.

You are thorough but ruthless about confidence. You explicitly flag what you know
with high confidence vs. what you're inferring vs. what is simply unknown. You prefer
primary sources (company websites, SEC filings, founder interviews) over secondary
commentary.

When researching, you ask yourself:
- Who are the actual winners in this market, and how do their operations differ from weaker players?
- Where are the value-creation steps, and which ones are people-powered?
- What would a startup need to spend to compete, and where would it get leverage over incumbents?
- What regulations or data requirements would block a new entrant?

Your research should equip the next analyst (Pain Extractor) with a clear map of
customer pain points to investigate.
```

### Task Structure & Prompting

**Phase 1: Market Decomposition**
```
I will give you a market opportunity. First, decompose it:
1. What is the core product/service category? (e.g., "legal document review")
2. What is the target customer? (e.g., "mid-size law firms")
3. What problem are we addressing? (e.g., "reducing time spent on routine contract review")

Then, generate 15–20 Google search queries that would surface the main players in this market.
Examples:
- "[Market] companies" / "[Market] platforms" / "[Market] software"
- "[Market] market share" / "[Market] leaders"
- "best [Market] tools" (G2, Capterra reviews)
- "[Problem statement]" (to find sentiment and use cases)

For each query, execute the search and identify the top 5–10 results.
```

**Phase 2: Incumbent Profiling**
```
For each competitor you identified, research:
1. Company website: Extract products, target customers, pricing if visible
2. LinkedIn company page: Extract employee count, hiring trends, recent hires
3. Recent news: Search "[Company name] news" for funding, layoffs, pivots, partnerships
4. G2/Capterra: Extract review count, average rating, and 2–3 representative review quotes
5. Job postings: What are they hiring for? This reveals what they're trying to build/improve
6. Technology: Any hints about their tech stack from pricing page, job postings, or API docs?

Output: Structured profile for each competitor.
```

**Phase 3: Value Chain Mapping**
```
Think about the end-to-end process of delivering this service/product to a customer:
- What happens before the customer ever engages? (e.g., lead gen, qualification)
- What is the core work performed for the customer?
- What happens after delivery? (e.g., customer support, onboarding, account management)

For each major stage:
- Who does the work? (Which incumbent, or is it fragmented across multiple?)
- What specific tasks are performed?
- What percentage is automated vs. manual?
- Where are the friction points or handoffs?

Identify the 2–3 stages that seem most human-intensive and therefore most ripe for automation.
```

**Phase 4: Synthesis**
```
Now synthesize your findings into:
1. A 2–3 paragraph executive summary of the market
2. A ranked list of competitors (by market position)
3. A 1-page value chain diagram (or structured list)
4. Key barriers to entry
5. The single biggest automation opportunity (where are incumbents most labor-heavy?)

Flag any major research gaps or confidence issues.
```

### Few-Shot Examples

**Example 1: Legal Tech Market**

Input: Market opportunity: "Legal Document Automation - Mid-market law firms spend 40% of billable hours on routine document review and drafting"

Interim Research Output:
- Key competitors identified: Westlaw, LexisNexis, Contract.AI, Harvey AI, LawGeex
- Value chain stages: Document intake → Legal research → Draft/review → Client delivery → Support
- Most labor-intensive stage: Legal research + Draft (typically 30–40 hours per complex contract)
- Incumbent weakness: Generic solutions, high cost, slow integration with firm workflows

Synthesis: "Legal tech incumbents are focused on research and automation of routine tasks, but they're expensive ($10k+/month for large firms) and have poor integration with firm workflows. The biggest gap is post-delivery customization and complex contract negotiation, where firms still rely on senior attorneys at $400+/hour."

**Example 2: Venture Capital Due Diligence**

Input: Market opportunity: "VC Due Diligence Automation - Partners spend 200+ hours per deal on research, verification, market analysis"

Interim Research Output:
- Key competitors: CB Insights, Crunchbase, PitchBook, manual in-house teams
- Value chain stages: Deal sourcing → Startup research → Market analysis → Team assessment → Financial verification → Recommendation
- Most labor-intensive: Market analysis, startup research (40% of deal time)
- Incumbent weakness: Generic databases lack custom analysis, manual review still required

Synthesis: "VC firms still rely on junior analysts and partners for custom market research and competitive analysis per deal. Existing tools (Crunchbase, PitchBook) provide data but not analysis. This is a high-cost function (1–2 FTEs per partner) that is almost entirely automatable with agentic research."

### Edge Case Handling

**Confidential or Private Data:**
If a company doesn't publish pricing or financials, note this explicitly and estimate based on:
- Employee count × average cost-per-employee in that sector
- Market position relative to public competitors
- Customer testimonials that hint at pricing

**Nascent Markets:**
If very few competitors exist, broaden the search to adjacent markets or substitute solutions:
- Example: "Legal doc automation" → look at general contract management, legal research, and even consulting firms that might be disrupted

**Highly Fragmented Markets:**
If there are 50+ small competitors, focus depth on the top 5–10 and categorize the rest by niche/positioning.

**Missing Data:**
For each research gap, explicitly state the impact level and suggest how Pain Extractor or Concept Generator could fill it through customer interviews or surveys.

---

## Error Handling & Edge Cases

### Research Quality Issues

**Problem:** Company information is outdated or contradictory
- **Solution:** Cross-reference multiple sources. If employee count on LinkedIn conflicts with company website, note both and flag as uncertain. Prioritize SEC filings and recent news over static web pages.

**Problem:** Pricing page is hidden or requires login
- **Solution:** Check G2/Capterra for customer-reported pricing. Search for "[Company] pricing" in news or blog posts. Estimate based on similar companies if needed, with low confidence flag.

**Problem:** Private company, no employee count available
- **Solution:** Estimate from funding round size ($1M seed typically = 5–10 people), funding date, and hiring signals (LinkedIn jobs page). Flag estimate as low confidence.

**Problem:** Market is international with fragmented players
- **Solution:** Focus on largest geography first (by company count or customer base). Note regional variations but prioritize the biggest market.

### Content Issues

**Problem:** Conflicting information across sources
- **Solution:** Prioritize: SEC filings > company official statements > news > social media. Document the conflict and note the highest-confidence source used.

**Problem:** Market doesn't have clear incumbents (e.g., market is still emerging)
- **Solution:** Expand search to adjacent categories (e.g., for "AI clinical trial recruiting," look at existing clinical trial recruiting software, then at recruitment automation). Note that market is fragmented/emerging.

**Problem:** Excessive marketing spin on company websites
- **Solution:** Use reviews (G2, Capterra) and employee comments (Glassdoor, LinkedIn) to triangulate actual capabilities vs. marketing claims.

### Scope Issues

**Problem:** Market opportunity is too broad (e.g., "Enterprise Software")
- **Solution:** Narrow the scope with the user before proceeding. Ask clarifying questions: "Are we targeting HR software specifically, or all enterprise software?" Define the TAM more precisely.

**Problem:** Market is too narrow (e.g., only 1–2 known players)
- **Solution:** Expand the definition to include indirect competitors or substitute solutions. Example: "Legal brief automation" could be disrupted by document generation AI, template software, or legal outsourcing firms.

---

## Performance & Scaling

### Expected Throughput & Latency

- **Per-Market Research Time:** 4–8 hours of agent runtime per market (depending on data availability and market complexity)
- **Expected Output Quality:** High-confidence research on top 5–10 incumbents; medium-confidence estimates for market fragmentation and private companies
- **Latency Requirement:** Should complete within a single business day (async is fine; real-time not required)

### Handling Volume Spikes

**If multiple markets queued:**
- Process sequentially (no parallelization of individual market research; data gathering is already async)
- Cache results: If two opportunities target the same market/competitors, reuse the landscape report (mark as cached with date)
- Tier research depth: High-priority opportunities get full 8-hour depth; lower-priority ones get 4-hour version (top 5 competitors only)

### Optimization Opportunities

1. **Caching:** Store landscape reports by market name. If researching "legal tech" twice, reuse the prior report if < 30 days old.
2. **Parallelization:** Within a single market, parallelize searches for different competitors or different research phases (web searches, database queries, social media lookup can be concurrent).
3. **Incremental Updates:** If revisiting a market after 1+ months, run "differential update" queries rather than full re-research (e.g., "new players in [market] 2025").

---

## Dependencies

### Upstream Dependencies
- **Phase 0 Watchlist:** Market opportunity must come from Phase 0 or be user-provided. If user-provided, no upstream dependency.

### Downstream Dependencies
- **Pain Extractor (1.2):** Consumes the Landscape Report to identify specific customer pain points. Provides list of target companies for pain research.
- **Concept Generator (1.3):** Uses Landscape Report to understand the competitive landscape and value chain; informs concept ideation.
- **Concept Scorer (1.4):** References incumbent positioning and barriers to entry when scoring feasibility and differentiation.

### External Dependencies
- **Web access & search APIs:** Google Custom Search, Crunchbase, LinkedIn (or similar)
- **Database access:** SEC Edgar, USPTO
- **Cloud infrastructure:** For concurrent web requests and data storage

---

## Success Metrics

### Primary Metrics

1. **Research Completeness:** Landscape report includes profiles for 5+ identified competitors (or documents why fewer exist). ✓ = success
2. **Value Chain Clarity:** Every major stage in the customer journey is mapped and responsibility identified. ✓ = success
3. **Automation Potential Identified:** Report explicitly identifies which human-intensive functions would benefit most from agent automation. ✓ = success
4. **Confidence Calibration:** Research flags what it knows with high confidence vs. medium vs. low. Estimates are grounded (not hallucinated). ✓ = success

### Secondary Metrics

5. **Data Quality:** When checked against public sources (company websites, news), research is 85%+ accurate on factual claims.
6. **Actionability:** Pain Extractor team reports that the Landscape Report gave them clear direction for which pain points to investigate.
7. **Time Efficiency:** Report completed in < 8 hours of agent runtime.
8. **Discovery Value:** Report identifies 1–3 high-potential automation opportunities that Pain Extractor / Concept Generator team wouldn't have found on their own.

### How to Measure

- **After Phase 1 (Concept Selection):** Did the landscape insights inform the final concept selection? Did human reviewers reference the landscape report?
- **After Phase 2 (Validation):** Did validated concepts align with the automation opportunities the Landscape Analyst identified? Did market validation confirm the incumbent weakness analysis?
- **After Phase 3 (Blueprint):** Did the agent architecture proposed in the blueprint reflect the value chain and labor dependency mapping from the Landscape Report?

---

## Implementation Notes

### Suggested Tech Stack

**Language & Agents:**
- Python with Anthropic SDK (Claude Opus for reasoning, Haiku for web searches)
- Use agentic loop: agent makes decisions about which searches to conduct, processes results, asks follow-up questions
- Consider ReAct or similar agent architecture to enable step-by-step reasoning

**Web Research:**
- **BeautifulSoup** or **Playwright** for HTML parsing and dynamic content
- **Google Custom Search API** for queries
- **Requests** library for basic HTTP; **Selenium/Playwright** for JavaScript-heavy sites

**Data Storage:**
- **PostgreSQL** for structured data (competitors, contact info, financials)
- **MongoDB** or document store for flexible nested report objects
- **Redis** for caching (landscape reports, search results)

**Integrations:**
- **Crunchbase API** (if available; may require paid tier)
- **LinkedIn scraping** via third-party service (e.g., Apify) or limited direct API
- **Google Sheets API** for exporting structured competitor profiles
- **S3/Cloud Storage** for storing report PDFs and source artifacts

### Implementation Phases

**Phase 1: MVP (Week 1–2)**
- Implement basic web search loop (Google Custom Search)
- Parse competitor websites for pricing, product info, employee count
- Manual human research for SEC filings, regulatory info
- Output: JSON landscape report (no fancy formatting)

**Phase 2: Enhancement (Week 3–4)**
- Add Crunchbase integration for company data
- Implement LinkedIn parsing (or third-party integration)
- Add value chain mapping UI (visual diagram generation)
- Implement caching to avoid re-researching same markets

**Phase 3: Optimization (Week 5+)**
- Parallel web searches per competitor
- Incremental update logic for markets researched previously
- Human review / annotation workflow (flag uncertain claims, add manual research)
- Export to multiple formats (PDF, HTML, Markdown, JSON)

### Code Patterns & Libraries

**Agent Loop Pattern:**
```python
def research_market(opportunity):
    state = {
        "market": opportunity.market_name,
        "competitors": [],
        "value_chain": [],
        "phase": "initial_search"
    }

    while state["phase"] != "complete":
        next_action = agent.decide_next_action(state)

        if next_action.type == "search":
            results = google_search(next_action.query)
            state["search_results"] = results
        elif next_action.type == "analyze_competitor":
            profile = extract_competitor_profile(next_action.competitor_url)
            state["competitors"].append(profile)
        # ... handle other action types

        state["phase"] = next_action.next_phase

    return generate_report(state)
```

**Caching Pattern:**
```python
def get_landscape_report(market_name, max_age_days=30):
    cached = cache.get(f"landscape:{market_name}")
    if cached and (now - cached["date"]).days < max_age_days:
        return cached["report"]

    report = research_market(market_name)
    cache.set(f"landscape:{market_name}", {
        "date": now,
        "report": report
    })
    return report
```

### Testing & Validation

- **Unit tests:** Parse competitor websites correctly, extract pricing tiers accurately
- **Integration tests:** End-to-end research on 2–3 known markets; compare output to manual research
- **Human review:** Have a domain expert review 1–2 landscape reports to flag accuracy/completeness issues
- **Regression tests:** When updating web parsers, re-test against prior market research to ensure consistency

### Common Pitfalls to Avoid

1. **Hallucinated Data:** Agent invents competitor info that doesn't exist. Mitigate: Require explicit source URL for every factual claim.
2. **Over-Reliance on Estimates:** Avoid guessing employee counts or market sizes. Flag estimates as such; prefer primary sources.
3. **Outdated Information:** Using 2–3 year old news. Mitigate: Prioritize recent sources; re-research markets periodically.
4. **Scope Creep:** Researching too many competitors or tangents. Mitigate: Set clear research time limits; focus on top 5–10 competitors.
5. **Missing Private Companies:** If market has strong private players (e.g., well-funded startups), web search may miss them. Mitigate: Search AngelList, LinkedIn for recent exits and well-funded companies.

---

## Example Output (Abbreviated)

**Input:**
```json
{
  "market_id": "market_001",
  "market_name": "Legal Document Automation",
  "problem_statement": "Law firms waste 40% of billable time on routine document review"
}
```

**Output (Executive Summary Section):**

```markdown
## Executive Summary

The legal technology market is dominated by two giants (LexisNexis, Westlaw) and
fragmented across specialized vendors (contract automation, legal research, e-discovery).
Mid-market law firms ($50M–$500M revenue) spend $100K–$500K annually on legal tech tools
but rely heavily on manual work for contract review, legal research, and document drafting.

We identified 12 significant competitors (3 market leaders, 5 strong regional players,
4 specialized niche vendors). The market is growing at 8–12% CAGR, driven primarily by
demand for contract automation and compliance tooling.

**Key Insight:** Incumbent solutions are document-centric and feature-heavy. They excel
at research and reference but struggle with custom analysis, cross-contract reasoning,
and context-aware recommendations. This creates an opportunity for an agent-first
solution that acts as a research and drafting partner rather than a toolset.

**Market Size:** Estimated $8B–$12B globally; $2B–$3B in addressable mid-market segment.

**Growth Rate:** 10% CAGR (faster in AI-assisted categories).
```

---

