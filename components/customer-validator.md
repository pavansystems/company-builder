# Customer Validator Component Specification

## 1. Purpose & Responsibility

The **Customer Validator** gathers evidence that the pain points identified in Phase 1.2 are real, widespread, and worth paying to solve. It validates that customers actually exist, that they're frustrated enough to adopt a new solution, and that they have willingness-to-pay.

This component bridges ideation (problem identification) and validation (proof of demand). A concept might identify a real pain point that nobody cares enough about to pay for. The Customer Validator tests this assumption by:
- Quantifying demand (search volume, community activity)
- Validating pain (customer reviews, forum sentiment)
- Measuring willingness-to-pay (pricing comparison, spending behavior)
- Identifying early adopters (who moves first, what segment is ready now)
- Assessing adoption friction (switching costs, habit strength)

The Customer Validator owns:
- Customer signal research and synthesis
- Demand quantification methodology
- Sentiment analysis on customer feedback
- Early adopter persona development
- Willingness-to-pay estimation
- Adoption friction assessment
- Evidence aggregation and confidence scoring

## 2. Inputs

### Primary Input
A **Pain Point Catalog** from Phase 1.2 and **Concept Definition** from Phase 1.3:
```
{
  pain_points: [
    {
      id: string,
      problem: string,
      severity: "high" | "medium" | "low",
      frequency: "daily" | "weekly" | "monthly" | "occasional",
      affected_segment: string,
      current_workaround: string,
      estimated_impact_cost: number (usd/year)
    }
  ],
  concept: {
    id: string,
    name: string,
    target_customer_segments: [string],
    value_proposition: string,
    pricing_model: string
  }
}
```

### Secondary Input
The **Landscape Report** (from Phase 1.1) containing:
- Incumbent pricing and customer acquisition costs
- Customer satisfaction metrics (if available)
- Industry context and market structure

## 3. Outputs

### Primary Output
A **Customer Validation Report** containing:

```json
{
  report_id: string (UUID),
  concept_id: string,
  generated_at: ISO8601 timestamp,
  executive_summary: {
    validation_verdict: "strong" | "moderate" | "weak",
    confidence_level: "high" | "medium" | "low",
    confidence_pct: number (0-100),
    key_finding: string,
    customer_readiness: "ready_to_adopt" | "considering" | "not_ready"
  },
  pain_point_validation: [
    {
      pain_point: string,
      severity: "high" | "medium" | "low",
      validation_status: "strongly_validated" | "moderately_validated" | "weakly_validated",
      supporting_evidence: [
        {
          source: string,
          source_type: "review_site" | "forum" | "search_volume" | "survey" | "article" | "interview",
          finding: string,
          strength: "strong" | "moderate" | "weak",
          citation_url: string
        }
      ],
      quantified_impact: {
        monthly_search_volume: number (optional),
        social_mention_volume: number (optional),
        forum_thread_count: number (optional),
        estimated_affected_customers: number,
        estimated_cost_impact_usd: number
      },
      customer_sentiment: {
        overall_sentiment: "negative" | "neutral" | "positive",
        frustration_level: "high" | "medium" | "low",
        sample_quotes: [string]
      },
      validation_confidence: "high" | "medium" | "low"
    }
  ],
  early_adopter_profiles: [
    {
      persona_name: string,
      segment: string,
      characteristics: [string],
      pain_severity: "high" | "medium" | "low",
      adoption_readiness: "immediate" | "within_12mo" | "longer_term",
      decision_criteria: [string],
      size_estimate: number (number of potential customers),
      example_companies_or_profiles: [string]
    }
  ],
  willingness_to_pay_analysis: {
    methodology: string,
    current_spend_on_workaround: {
      segment: string,
      spend_range_monthly: {low: number, high: number},
      confidence: "high" | "medium" | "low"
    },
    estimated_willingness_to_pay: [
      {
        segment: string,
        price_range_monthly: {low: number, high: number},
        rationale: string,
        data_sources: [string],
        confidence: "high" | "medium" | "low"
      }
    ],
    willingness_to_pay_vs_concept_pricing: {
      concept_pricing_monthly: number,
      expected_conversion_rate: number (0-1),
      rationale: string
    }
  },
  adoption_friction_assessment: {
    primary_frictions: [
      {
        friction_type: string,
        severity: "high" | "medium" | "low",
        description: string,
        mitigation_strategy: string
      }
    ],
    switching_costs: {
      switching_cost_level: "high" | "medium" | "low",
      components: [string],
      time_to_switch: string (e.g., "1 week", "1 month")
    },
    adoption_velocity: {
      expected_months_to_significant_adoption: number,
      key_adoption_triggers: [string]
    }
  },
  competitive_comparison: {
    customer_satisfaction_vs_incumbents: string,
    net_promoter_score: {
      incumbent_nps: number (optional),
      concept_expected_nps: number (optional),
      basis_for_estimate: string
    },
    adoption_barriers_vs_incumbents: [string]
  },
  market_timing: {
    market_readiness: "ready_now" | "readying_in_6m" | "readying_in_1y+" | "not_ready",
    catalysts: [string],
    headwinds: [string],
    timing_confidence: "high" | "medium" | "low"
  },
  data_sources: [
    {
      source_name: string,
      source_type: string,
      access_date: ISO8601 date,
      sample_size: number (optional),
      reliability: "primary" | "secondary" | "tertiary"
    }
  ],
  research_gaps: [
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
- Sentiment analysis spreadsheet (pain point × source × sentiment score)
- Search volume trends chart (Google Trends data over time)
- Forum/community activity summary (subreddits, Slack communities, where customers congregate)
- Customer persona detailed descriptions with usage patterns
- Willingness-to-pay estimation worksheet
- Early adopter segment sizing estimate

## 4. Core Logic / Algorithm

### Step 1: Pain Point Inventory & Refinement

1. **Start with the pain catalog from Phase 1.2:**
   - Confirm the list of pain points identified.
   - For each, clarify: Who feels this pain? (Job title, company size, industry.) How often? How much does it cost?

2. **Bucket pain points by breadth:**
   - **Universal:** Affects nearly all potential customers (e.g., "all mid-market law firms spend on contract review").
   - **Segment-specific:** Affects only some segments (e.g., "SaaS companies struggle with churn analytics, but not all B2B companies do").
   - **Rare/niche:** Affects only a small subset (e.g., "AI research teams need custom model training").

3. **Prioritize validation effort:**
   - Focus research effort on pain points that affect the largest segment and highest severity.
   - Validate 2-3 core pain points thoroughly; validate secondary pain points at lower resolution.

### Step 2: Demand Signal Quantification

For each pain point, gather quantitative signals of demand:

**Search Volume:**
- Use Google Trends and keyword research tools (SEMrush, Ahrefs, Google Search Console).
- Query: "keyword related to pain point" (e.g., "contract review software", "legal document automation").
- Extract: Monthly search volume, trend direction (growing/shrinking/flat), geographic distribution.
- Interpretation: If "contract review software" gets 5K searches/month and it's growing 15% YoY, demand is real and expanding.

**Social Media & Community Mentions:**
- Search Reddit, Twitter, LinkedIn for mentions of the problem.
- Use tools: Reddit search, Twitter advanced search, LinkedIn posts.
- Count: Number of discussions, posts, comments mentioning the pain point.
- Sentiment: Positive, neutral, or negative? Are people frustrated or just curious?
- Example: "50 Reddit threads in r/legal discussing document review frustration in past 6 months" signals real pain.

**Forum & Community Activity:**
- Identify where target customers congregate: Reddit (industry subreddits), Slack communities, Discord servers, niche forums.
- Monitor activity: How many discussions about the problem? Tone of discussions?
- Extract: Representative quotes, common themes, frustration level.

**Job Postings:**
- Indirect signal: If companies are hiring for roles to address a pain point, they're feeling the pain.
- Example: If "legal operations coordinator" postings spike on Indeed, it signals demand for solutions (either hiring people or buying software).
- Extract: Number of postings, salary levels, required skills.

**Analyst & Industry Reports:**
- Search Gartner, IDC, industry research for mentions of the problem.
- Quantify: What percentage of target market reports this as a problem?

### Step 3: Sentiment & Frustration Analysis

For each pain point, assess whether customers are frustrated enough to adopt a solution:

**Review Site Analysis (G2, Capterra, Trustpilot, industry-specific sites):**
- For incumbent solutions addressing the same pain, extract reviews.
- Analyze complaints: What are customers unhappy about? Is it the price? Complexity? Ineffectiveness?
- Sentiment score: Calculate average rating, negative review percentage.
- Extract quotes: Pull representative complaints to illustrate frustration level.

Example:
```
Incumbent contract review solution (ContractShark):
- Average rating: 3.8/5 (indicates dissatisfaction)
- Common complaints: "Too expensive for SMBs ($5K/month)", "Slow to add new features", "Requires manual input"
- Frustration signal: Strong. Customers want a better solution.
```

**Forum & Social Analysis:**
- Collect quotes from Reddit, Twitter, forums showing frustration.
- Classify by frustration level: "Can't believe this is so expensive!" vs. "Would be nice if it were better."
- Synthesize themes: Cost, speed, ease of use, feature gaps, etc.

### Step 4: Early Adopter Identification

Identify which customer segments would adopt first (high pain, low friction, most ability to pay):

**Segment Dimensions:**
- **Company size:** Startup, SMB (10-100), mid-market (100-1000), enterprise (1000+)
- **Industry:** Specific verticals (legal, healthcare, finance, real estate, etc.)
- **Geographic:** US, UK, EU, global
- **Use case:** Power users (use multiple times/day), regular users (few times/week), occasional users

**Early Adopter Characteristics:**
- **High pain severity:** Feels the problem acutely and frequently.
- **Low friction adoption:** Either low switching costs or already in market-for-solution mode.
- **Can pay:** Has budget to adopt new solutions (vs. individuals with no discretionary spend).
- **Tech-savvy:** Willing to adopt new/unproven solutions (vs. risk-averse large orgs).

**Persona Development:**

Build 2-3 detailed early adopter personas:
```
Persona 1: Sarah, Operations Manager at a 50-person law firm
- Current situation: Spends 8 hours/week manually reviewing contracts ($15K/year in labor cost).
- Pain: Tedious, error-prone, takes time away from client work.
- Adoption readiness: High. Already looking for solutions. Willing to pay $500-1000/month if ROI is clear.
- Decision criteria: Does it integrate with our case management system? Can we trust it on sensitive docs? What's the learning curve?
- Segment size estimate: ~15,000 mid-market law firms in the US with in-house counsel.

Persona 2: James, CIO at a healthcare startup (100 employees)
- Current situation: Uses a combination of contract templates and legal review (contracting is blocking scaling).
- Pain: Slow and expensive. Can't afford to hire more legal staff.
- Adoption readiness: High. Very pain-aware. Not yet actively searching but receptive.
- Decision criteria: Must integrate with Slack and our document repository (Notion). ROI must be >2x cost.
- Segment size estimate: ~5,000 startup/scale-ups in regulated industries.
```

### Step 5: Willingness-to-Pay Estimation

**Methodology 1: Current Spending Proxy**
- Identify what customers currently spend to solve the problem (manually or with incumbents).
- Assume willingness-to-pay is at least equal to, and possibly 20-30% below, current spending.

Example:
```
Pain: Contract review for law firms.
Current solution options:
- Option A: Hire a contract reviewer ($120K salary + 30% overhead = $156K/year per person)
- Option B: Use ContractShark software ($5K-10K/month = $60K-120K/year)
- Option C: DIY with templates and junior staff ($30-50K/year in labor)

Willingness-to-pay estimate:
- High-pain segment (enterprise): $5K-10K/month (willing to pay near incumbent price)
- Mid-pain segment (mid-market): $1K-3K/month (willing to pay less than incumbent)
- Low-pain segment (SMB): $200-500/month (willing to pay significantly less)
```

**Methodology 2: Comparable Solutions**
- Research pricing of solutions addressing similar pain points in adjacent markets.
- Use as benchmarks for willingness-to-pay.

Example:
```
Pain: AI-powered legal document review.
Comparable solutions:
- Legal research (Westlaw): $400-800/month
- Document management (Notion): $0-99/month
- Specialized contract review (LawTech): $300-500/month
- Inferred WTP: $300-1000/month depending on substitutability
```

**Methodology 3: Customer Research**
- If possible, conduct 10-20 customer interviews or surveys.
- Ask: "How much would you pay for a solution that cuts your contract review time by 70%?"
- Capture price sensitivity: At what price do they say "yes"? At what price do they say "no"?
- Build price elasticity curve.

**Verification:**
- Cross-check methodologies. If all 3 suggest $300-500/month, confidence is high.
- If methodologies diverge (e.g., comparable solutions suggest $1K but incumbents charge $5K), flag discrepancy and investigate.

### Step 6: Adoption Friction Assessment

**Identify sources of friction:**
1. **Switching costs:** How much effort to migrate from current solution (or no solution)?
2. **Integration requirements:** Does it need to connect to existing systems?
3. **Trust & risk:** Is this a sensitive application (financial, legal, medical)?
4. **User learning:** Does the new solution require retraining or habit change?
5. **Organizational inertia:** Is the buying organization risk-averse or change-ready?

Example friction assessment:
```
Concept: AI contract review for law firms

Frictions:
1. Integration with case management system (high friction)
   - Mitigation: Build native integrations with top 3 platforms (Clio, Lexis, LawLogix)
2. Legal liability concerns (high friction)
   - Mitigation: Obtain E&O insurance, provide audit trails, have human review escalation
3. Data privacy (medium friction)
   - Mitigation: SOC 2 certification, on-premise option, HIPAA compliance
4. Learning curve for staff (low friction)
   - Mitigation: 2-hour onboarding, intuitive UI, customer support

Overall adoption friction: Medium (high trust barrier, but solvable with right go-to-market)
Expected time to meaningful adoption: 6-9 months after launch
```

### Step 7: Market Timing Assessment

Assess whether the market is ready now or needs to mature:

**Readiness signals (positive):**
- Incumbent solutions are becoming too expensive (pricing pressure).
- Regulatory changes make manual processes riskier (compliance pressure).
- Complementary technology (AI models) has just achieved quality threshold (enablement).
- Customer frustration is rising (sentiment trend negative for incumbents).

**Unreadiness signals (negative):**
- Incumbent solutions are improving fast (less pain for differentiation).
- Customers are just beginning to digitize (not yet ready for next-gen automation).
- Regulatory uncertainty (customers wait-and-see).
- No visible demand signals yet (search volume, mentions flat or declining).

Example:
```
Concept: AI for contract review
Market timing assessment:
- Large language models (GPT-4) just achieved 95%+ accuracy on contract review tasks (enablement signal: positive)
- Incumbent ContractShark raised $30M and is doubling down (competitive signal: negative for timing)
- Legal tech adoption is accelerating post-COVID (trend signal: positive)
- "Contract review software" search volume grew 35% YoY (demand signal: positive)

Verdict: Market is readying in 6-12 months. First-mover advantage if launched now.
Confidence: High
```

### Step 8: Synthesis & Confidence Scoring

Aggregate all validation evidence:

1. **For each pain point:** Rate validation strength (strong, moderate, weak) based on evidence.
2. **Overall validation:** Do 2+ core pain points have strong validation?
3. **Customer readiness:** Do early adopters exist? Are they ready now?
4. **Willingness-to-pay:** Is the addressable market willing to pay enough to make unit economics work?
5. **Timing:** Is the market ready now or in 6-12 months?

**Confidence Scoring:**
- **High confidence (75-100%):** Multiple strong signals across pain validation, demand quantification, WTP, and adoption readiness. Clear early adopter segments exist.
- **Medium confidence (50-75%):** Most signals present but with gaps. One or two areas lack strong evidence. Market readiness uncertain.
- **Low confidence (<50%):** Significant gaps in evidence. Multiple pain points weakly validated or no clear early adopters identified.

## 5. Data Sources & Integrations

### Primary Research Sources (Free/Subscription)

**Demand Signal Quantification:**
- **Google Trends** (free; keyword volume, trends)
- **SEMrush** (subscription; search volume, keyword difficulty)
- **Ahrefs** (subscription; search volume, content analysis)
- **Google Search Console** (free for site owners; search queries)
- **Answerthepublic.com** (free/subscription; related search queries)

**Social Media & Community:**
- **Reddit** (free; r/[industry] communities, r/[problem] specific communities)
- **Twitter/X** (free; search, sentiment)
- **LinkedIn** (free/premium; industry discussions, posts)
- **Slack** (free; join industry communities and Slack groups)
- **Hacker News** (free; discussions about problems and solutions)
- **Niche forums:** Industry-specific (LegalTech forums, healthcare tech forums, etc.)

**Review Sites & Competitor Feedback:**
- **G2** (free; product reviews, NPS, use cases)
- **Capterra** (free; product reviews and pricing feedback)
- **Trustpilot** (free; customer reviews)
- **GetApp** (free; software reviews)
- **SoftwareAdvice** (free; reviews and comparisons)

**Job Postings & Labor Market:**
- **Indeed** (free; job postings as demand signal)
- **LinkedIn Jobs** (free; job postings)
- **Glassdoor** (free; company reviews, salary data)
- **Bureau of Labor Statistics** (free; employment trends by job title)

**Research & Analysis:**
- **Google Scholar** (free; academic and industry research)
- **Gartner/IDC reports** (subscription; analyst perspectives on market problems)
- **Industry associations** (often publish market research; free or low-cost)
- **News aggregators** (Google News, industry-specific news sites)

### APIs & Tools

- **Google Trends API** (search volume trends)
- **SEMrush API** (keyword research, search volume)
- **Twitter/X API** (sentiment analysis on demand)
- **Reddit API** (search and sentiment analysis)
- **NewsAPI** (search news articles)
- **Sentiment analysis libraries** (TextBlob, Vader, or Claude's sentiment capabilities)

### Custom Research (if time permits)

- **Customer interviews:** 5-10 with target persona (50 min each, ~5-8 hours).
- **Surveys:** 50-100 responses via SurveyMonkey, Typeform (1-2 hours to create and analyze).
- **Listening tools:** Monitor mentions on Twitter, Reddit, LinkedIn in real-time.

## 6. Agent Prompt Strategy

### System Prompt Persona

The agent adopts the role of a **customer research analyst** with experience in market validation and product-market fit assessment. Key characteristics:
- Evidence-driven; does not accept speculation as fact.
- Segment-aware; understands that different customer groups have different pain levels and adoption readiness.
- Pragmatic about willingness-to-pay; knows that stated and revealed preferences often differ.
- Attentive to edge cases; asks "what would make this wrong?" and looks for disconfirming evidence.

### Core Instructions

```
You are a customer validation researcher. Your job is to determine whether
customers actually exist, feel real pain, and are willing to pay to solve it.

For a given concept and pain point catalog:
1. Gather quantitative signals of demand:
   - Search volume for related keywords (Google Trends, SEMrush)
   - Community activity (Reddit, Twitter, LinkedIn discussions)
   - Forum threads and social mentions
   - Job posting trends (indirect demand signal)
2. Validate pain through customer sentiment:
   - Review competitor review sites (G2, Capterra) for evidence of frustration
   - Extract representative complaints and quotes
   - Assess frustration level (mild annoyance vs. critical pain)
3. Identify early adopter segments:
   - Which customers feel this pain most acutely?
   - Which could adopt first (least friction, most ability to pay)?
   - Estimate segment sizes
4. Estimate willingness-to-pay:
   - What do customers currently spend on workarounds?
   - What do comparable solutions charge?
   - What price would customers accept?
5. Assess adoption friction:
   - What would slow customer adoption?
   - Switching costs, integration complexity, trust barriers?
   - How long to meaningful market penetration?
6. Synthesize and conclude:
   - Is customer validation strong, moderate, or weak?
   - What's your confidence level?
   - What evidence is missing?

Output a JSON report matching the provided schema. Every claim must have a source or methodology note.
```

### Few-Shot Examples in Prompt

**Example 1: B2B SaaS (AI Contract Review)**
```
Pain Point: "Law firms spend excessive time on contract review"

Demand Signal Quantification:
- Google Trends: "contract review software" has 5K searches/month, growing 15% YoY
- Reddit: r/legal has 20+ threads in past 6 months mentioning contract review frustration
- Twitter: 50+ mentions in past month of contract review being a pain point
- Job postings: "Legal operations coordinator" postings up 30% on Indeed (hiring signal)

Pain Validation:
- ContractShark reviews on G2: 3.8/5, top complaint = "Too expensive for SMBs"
- Quote: "We pay $8K/month for this; would jump to anything 50% cheaper"
- Frustration level: HIGH (customers actively seeking alternatives)

Early Adopters:
- Primary: 50-person law firms with in-house counsel (high pain, medium ability to pay)
- Secondary: Legal ops teams at 500-person companies (high pain, high ability to pay)
- Segment size: 15K+ law firms + 5K+ enterprise companies

Willingness-to-Pay:
- Current spend: $5K-10K/month for dedicated human or incumbent software
- Willingness to pay: $1K-3K/month (willing to pay 30-60% less for automated solution)
- Confidence: Medium (inferred from incumbent pricing and review complaints)

Market Timing:
- GPT-4 just hit 95%+ accuracy on contract review (enablement: ready now)
- Customer frustration is rising (trend: favorable)
- Verdict: Market ready for adoption in 6-9 months post-launch
```

**Example 2: B2C (Financial Planning)**
```
Pain Point: "Gen Z struggles with financial planning and lacks affordable options"

Demand Signal Quantification:
- Google Trends: "financial planning for Gen Z" has 3K searches/month, growing 40% YoY
- Reddit: r/personalfinance has 100+ threads/year from Gen Z seeking advice
- Twitter: #FinancialPlanning posts mentioning "expensive" or "can't afford advisor" = 500+ in past month
- TikTok: Financial literacy creators getting 1M+ views on budgeting content

Pain Validation:
- Wealthfront reviews: Common complaint = "Minimum $500 investment, feels like enterprise product"
- Acorns reviews: Top complaint = "Limited planning, mostly just savings"
- Quote: "All financial planning tools are designed for boomers, not my generation"
- Frustration level: HIGH (large unmet market)

Early Adopters:
- Primary: Gen Z (ages 18-28) with $10-50K in investable assets, tech-savvy
- Secondary: Millennial parents wanting to teach kids financial literacy
- Segment size: 25M Gen Z in US with >$5K savings, willingness to pay

Willingness-to-Pay:
- Current spend: Most Gen Z pay $0 (DIY with YouTube). Some pay $100-200/year for Acorns
- Willingness to pay: $5-20/month or $50-200/year (price-sensitive segment)
- Confidence: Medium-High (revealed preference from Acorns pricing + survey data)

Market Timing:
- Financial literacy trending upward among Gen Z (trend: favorable)
- AI tutoring/advice becoming mainstream (enablement: favorable)
- Verdict: Market ready now, rapidly growing
```

### Edge Case Handling

1. **Pain point shows search volume but no sentiment signal:**
   - May indicate curious searchers, not customers in pain.
   - Drill deeper: Are they searching for solutions or just information?
   - Search for "problem + solution" together (higher intent).
   - Risk: Pain may be real but not severe enough to pay to solve.

2. **High sentiment but low search volume:**
   - May indicate concentrated pain (niche segment) vs. broad market.
   - Check community activity: Reddit threads, forums, where do affected customers congregate?
   - Risk: Market may be too small, or customers are not actively searching yet.

3. **Strong early adopter segment but weak willingness-to-pay:**
   - May indicate price-sensitive segment (students, nonprofits, freelancers).
   - Consider freemium or low-cost model; assess if unit economics still work.
   - Risk: Revenue model may need to be reconsidered.

4. **Adoption friction is very high (e.g., deep integration required):**
   - Assess feasibility of addressing friction in MVP.
   - If friction cannot be removed in phase 1, extend timeline or repositioning.
   - Risk: Adoption will be slower than expected.

## 7. Error Handling & Edge Cases

### Data Quality Issues

**Biased or skewed data sources:**
- Reddit and Twitter attract complainers (selection bias).
- Use multiple sources to balance sentiment.
- Check: Do incumbent review sites (G2) align with social media sentiment?
- If conflict exists, assume review sites are more representative (paid customers).

**Outdated data:**
- Search trends data can be stale (updated weekly by Google).
- Job posting data lags 1-2 months.
- Always cross-check dates; recent data is stronger evidence.

**Sample size sensitivity:**
- If you have 3 reviews mentioning "expensive," that's weak evidence.
- If you have 300 reviews with that complaint, it's strong evidence.
- Always note sample size and confidence interval.

### Interpretation Edge Cases

**Low willingness-to-pay despite high pain:**
- May indicate customers are not in market-for-solution yet.
- Or: Current alternatives are "free" (workaround), so paid solution requires value jump.
- Assess: What's the conversion rate if you price at customer's stated WTP?

**Adoption friction is asymmetric:**
- May be high for one segment (enterprise) but low for another (SMB).
- Tailor go-to-market strategy by segment.
- Risk: Initial target market may differ from total addressable market.

**Early adopters are different from mainstream customers:**
- Early adopters may be more tech-savvy or price-insensitive.
- Cannot assume their preferences apply to broader market.
- Model adoption in waves; early-adopter revenue strategy may differ from scale strategy.

### Confidence Scoring Edge Cases

**Multiple strong signals point to weak validation:**
- Risk: You may be measuring something other than intent to buy.
- Example: High search volume for "AI legal" might be people learning about AI, not seeking a solution.
- Drill deeper: Search for "buy" + problem + solution together.

**Weak signals but strong logic (concept seems obviously valuable):**
- Risk: Logical deduction is not the same as customer validation.
- Avoid founder bias; default to evidence over intuition.
- Increase confidence only if you can find corroborating signals.

## 8. Performance & Scaling

### Expected Performance Characteristics

**Latency:**
- Light validation (search volume, basic sentiment): 4-6 hours.
- Full validation (multi-source, detailed analysis, customer research): 12-20 hours.
- With primary research (interviews, surveys): 20-30 hours.

**Throughput:**
- Single concept per run; each gets dedicated research.
- Expected output: One comprehensive customer validation report per concept.

**Data/API Load:**
- Search volume APIs: Minimal (rate-limited; <50 queries).
- Reddit/Twitter API: Minimal (searching public data).
- Review site scraping: CSS-based, lightweight.
- No database load concerns (read-only research phase).

### Scaling Considerations

- **Parallel research:** Multiple validators can work on different concepts simultaneously.
- **Caching:** Reuse customer research across similar concepts (e.g., all legal tech concepts can share legal industry research).
- **Automation:** Use sentiment analysis tools to scale review analysis without manual reading.
- **Customer research panels:** Build a database of willing respondents for quick surveys.

## 9. Dependencies

### Upstream Dependencies
- **Phase 1.2 (Pain Extractor):** Provides pain point catalog to validate.
- **Phase 1.1 (Landscape Analyst):** Provides market context and incumbent positioning.
- **Phase 1.3 (Concept Generator):** Concept definition and value proposition.

### Downstream Dependents
- **Phase 2.5 (Economics Modeler):** Uses willingness-to-pay and adoption velocity to model unit economics.
- **Phase 2.6 (Validation Synthesizer):** Aggregates customer validation as key evidence.
- **Phase 3.3 (GTM Strategist):** Uses early adopter personas and adoption friction analysis to plan customer acquisition.
- **Phase 3.1 (Business Designer):** Uses willingness-to-pay to refine pricing strategy.

### Parallel Dependencies
- **Phase 2.1 (Market Sizer):** (Parallel; can exchange customer segment data)
- **Phase 2.2 (Competitive Analyst):** (Parallel; can share customer insight sources)
- **Phase 2.4 (Feasibility Assessor):** (Parallel; can exchange adoption friction data)

## 10. Success Metrics

### Output Quality
1. **Report completeness:** All required fields populated; evidence trails for every claim.
2. **Source diversity:** Report cites at least 5 different data sources (search volume, reviews, social, forums, research).
3. **Evidence strength:** Validation status (strongly/moderately/weakly validated) is justified with quantity and quality of evidence.
4. **Actionability:** Report identifies 2-3 specific early adopter personas that GTM strategist can use.

### Downstream Validation
1. **GTM strategist alignment:** GTM strategist finds early adopter personas useful and credible.
2. **Economics modeler use:** Willingness-to-pay and adoption velocity estimates are used without major objections.
3. **Synthesis integration:** Validation findings integrate cleanly with other Phase 2 outputs.

### Process Metrics
1. **Source coverage:** At least 2-3 signals per pain point (demand, sentiment, adoption friction).
2. **Evidence strength:** Majority of validation labels are "strongly" or "moderately" validated (not "weakly").
3. **Confidence calibration:** Confidence levels match evidence quality (high confidence only when 3+ corroborating sources).
4. **Time efficiency:** Research completes within 12-20 hour window.

## 11. Implementation Notes

### Technology Stack

**Core Agent Framework:**
- **Claude API (Opus)** for research reasoning and synthesis.
- **Tool calling** to invoke search APIs, sentiment analysis, and data retrieval.

**Data Collection & Processing:**
- **Python** for data aggregation, sentiment analysis, and report generation.
- **Libraries:**
  - `requests` (HTTP for API calls)
  - `praw` (Reddit API client)
  - `tweepy` (Twitter/X API client)
  - `beautifulsoup4` (web scraping for review sites)
  - `textblob` or Claude API (sentiment analysis)
  - `pandas` (data aggregation)
  - `json` (schema validation)

**Integrations:**
- **Google Trends API** (search volume trends)
- **SEMrush API** (keyword research, if budget available)
- **Reddit API** (community discussions)
- **Twitter/X API** (social sentiment)
- **NewsAPI** (news and article search)
- **Claude API** (sentiment analysis and synthesis)

**Output & Storage:**
- JSON report generation (schema validation)
- Markdown for supporting artifacts
- CSV for sentiment analysis results

### Development Approach

**Phase 1: Foundation**
- Implement Google Trends integration.
- Build basic review site scraping (G2, Capterra).
- Create sentiment analysis engine using TextBlob or Claude.

**Phase 2: Enhancements**
- Add Reddit and Twitter API integrations.
- Implement job posting analysis as demand signal.
- Build persona development framework.

**Phase 3: Intelligence**
- Add LLM-based reasoning for pain validation synthesis.
- Implement willingness-to-pay inference engine.
- Build market timing assessment logic.

### Key Implementation Details

**Tool Calling (for Claude agent):**
```python
tools = [
    {
        "name": "search_google_trends",
        "description": "Get Google Trends data for keywords",
        "input_schema": {
            "keywords": "[string]",
            "timeframe": "string (e.g., '12m', '5y')",
            "region": "string (optional, e.g., 'US', 'GB')"
        }
    },
    {
        "name": "search_reddit",
        "description": "Search Reddit for discussions about a topic",
        "input_schema": {
            "query": "string",
            "subreddit": "string (optional)",
            "limit": "integer (default 50)"
        }
    },
    {
        "name": "search_twitter",
        "description": "Search Twitter for mentions and sentiment",
        "input_schema": {
            "query": "string",
            "limit": "integer (default 100)",
            "timeframe": "string (e.g., '7d', '30d')"
        }
    },
    {
        "name": "get_reviews",
        "description": "Get reviews from G2, Capterra, Trustpilot",
        "input_schema": {
            "company_name": "string",
            "platform": "string (e.g., 'G2', 'Capterra')",
            "limit": "integer (default 50)"
        }
    },
    {
        "name": "get_job_postings",
        "description": "Search job postings as demand signal",
        "input_schema": {
            "job_title": "string",
            "timeframe": "string (e.g., '30d', '90d')",
            "region": "string (optional)"
        }
    },
    {
        "name": "analyze_sentiment",
        "description": "Analyze sentiment of text snippets",
        "input_schema": {
            "texts": "[string]",
            "return_scores": "boolean (default true)"
        }
    }
]
```

**Sentiment Analysis Function:**
```python
def analyze_sentiment(texts: list[str]) -> dict:
    """
    Use TextBlob or Claude to analyze sentiment.
    Return: {
        "overall_sentiment": "negative" | "neutral" | "positive",
        "sentiment_scores": [{text: str, polarity: float}],
        "key_themes": [str],
        "frustration_level": "high" | "medium" | "low"
    }
    """
    ...

def synthesize_pain_validation(signals: dict) -> dict:
    """
    Given multiple signals (search volume, sentiment, forums, etc.),
    synthesize into validation_status: "strongly_validated" | "moderately_validated" | "weakly_validated"
    """
    strength_score = 0
    # Add points for each corroborating signal
    if signals["search_volume"] > 1000 and signals["trend"] == "growing":
        strength_score += 3
    if signals["forum_activity"] > 20:
        strength_score += 2
    if signals["sentiment_level"] == "high_frustration":
        strength_score += 3
    if signals["review_complaints"] > 30:
        strength_score += 2

    if strength_score >= 8:
        return "strongly_validated"
    elif strength_score >= 5:
        return "moderately_validated"
    else:
        return "weakly_validated"
```

**Persona Development:**
```python
@dataclass
class EarlyAdopterPersona:
    name: str
    segment: str
    pain_severity: str
    adoption_readiness: str
    size_estimate: int
    decision_criteria: list[str]
    current_workaround: str
    willingness_to_pay_monthly: tuple[float, float]  # (min, max)

def build_personas(early_adopters_data: dict) -> list[EarlyAdopterPersona]:
    """
    From customer research, identify 2-3 personas that would adopt first.
    Rank by adoption readiness (immediate, 6-12 months, longer-term).
    """
    ...
```

### Testing & Validation

**Unit tests:**
- Sentiment analysis accuracy (validate on labeled test set).
- Schema compliance (JSON output matches required schema).
- Evidence attribution (every claim has a source).

**Integration tests:**
- Google Trends API returns expected data.
- Reddit API search works and returns representative threads.
- Review site scraping extracts pricing and ratings correctly.
- Downstream agents can parse and use validation data.

**Smoke tests:**
- Run validation on 3 test concepts (B2B SaaS, B2C, niche).
- Verify report generation and early adopter persona quality.
- Confirm downstream use (GTM strategist finds personas actionable).

### Common Pitfalls & How to Avoid Them

1. **Confusing interest with intent:**
   - High search volume doesn't mean intent to buy.
   - Look for "problem + solution" searches together, or "price" + "problem" (higher intent).

2. **Biased sources:**
   - Reddit and Twitter over-represent complainers.
   - Balance with review sites (G2) which have paying customers.
   - Interview 5-10 real customers if high stakes.

3. **Inflated willingness-to-pay:**
   - Stated WTP (survey) often >revealed WTP (actual spending).
   - Use current spending as anchor; assume customers will pay 0-30% premium for clearly better solution.

4. **Overlooking adoption friction:**
   - Assume switching costs are lower than they are.
   - Integrate early; understand data migration, API needs.

5. **Confirmation bias:**
   - Seek disconfirming evidence. If you assume strong validation, actively look for weaknesses.
   - If validation is weak, what would change your mind?

### Deployment Checklist

- [ ] Google Trends API is authenticated and tested.
- [ ] Reddit API is set up and rate-limiting is understood.
- [ ] Twitter/X API is authenticated.
- [ ] Review site scraping is tested on G2, Capterra, Trustpilot.
- [ ] Sentiment analysis engine (TextBlob or Claude) is calibrated on sample data.
- [ ] JSON schema validation is active.
- [ ] Report templates are finalized.
- [ ] Early adopter persona framework is tested.
- [ ] Willingness-to-pay estimation formulas are verified.
- [ ] Downstream agents can successfully parse output.
- [ ] Error handling for API rate limits is implemented.
- [ ] Documentation and runbooks are complete.
