# Pain Extractor Component (Phase 1.2)

## Purpose & Responsibility

The Pain Extractor is responsible for identifying, validating, and cataloging the specific customer pain points and unmet needs within a target market. It translates the landscape's competitive and operational overview into a data-driven understanding of what problems actual customers are experiencing.

**Core responsibilities:**
- Mine public customer signals (reviews, forums, social media, support channels) for evidence of dissatisfaction
- Cluster disparate pain signals into coherent pain themes
- Estimate severity (how much does this problem hurt?) and frequency (how many customers experience it?)
- Link pain points to incumbent weaknesses identified in the landscape
- Identify early-adopter personas most likely to value a solution
- Validate that customers would actually pay to solve these problems

The output is a prioritized pain point catalog that becomes the foundation for concept ideation. Each pain point includes supporting evidence that a concept generator can use to design targeted solutions.

---

## Inputs

**Primary Input:**
- **Landscape Report** (from Landscape Analyst, 1.1)
  - Incumbent map and positioning
  - Value chain breakdown
  - List of identified competitors
  - Identified labor-intensive functions
  - Research sources and access points

**Secondary Inputs:**
- List of key customer personas/segments (if pre-defined; otherwise derived from landscape)
- Market opportunity description (to refine research scope)
- Geographic or vertical constraints (if applicable)

**Data Sources Accessed:**
- **Review Sites:** G2, Capterra, Trustpilot, AppAnnie (for SaaS)
- **Community Platforms:** Reddit, Stack Exchange, specialized forums (e.g., r/legaltech, industry-specific Discord servers)
- **Social Media:** Twitter/X (industry conversations, complaint threads), LinkedIn (complaints in company discussions)
- **Support & Transparency:** Public support tickets (if available), Help Scout/Zendesk public archives, company status pages
- **Job Postings:** What hiring demand reveals about skills companies struggle to source
- **Customer Interviews:** Structured outreach to users of incumbent solutions (optional, but valuable)

---

## Outputs

**Primary Output: Pain Point Catalog (structured document)**

```json
{
  "market_id": "string",
  "market_name": "string",
  "report_date": "ISO 8601 date",
  "research_confidence": "high|medium|low",

  "executive_summary": {
    "total_pain_themes_identified": "integer",
    "top_3_pain_points": ["string"],
    "overall_market_sentiment": "highly_frustrated|frustrated|neutral|satisfied",
    "key_insight": "string (single biggest insight)"
  },

  "pain_point_catalog": [
    {
      "pain_id": "string (e.g., 'pain_001')",
      "title": "string (concise problem statement)",
      "description": "string (2-3 sentences explaining what the problem is)",
      "affected_persona": "string (primary customer type affected)",
      "severity": "critical|high|medium|low",
      "severity_evidence": "string (e.g., 'Complaint appears in 40% of G2 reviews')",
      "frequency": "universal|common|occasional|rare",
      "frequency_evidence": "string (e.g., 'Mentioned in 157 of 400 public reviews')",

      "customer_impact": {
        "time_cost": "string (e.g., '15–20 hours per week')",
        "financial_cost": "string (e.g., '$50K annually in wasted labor')",
        "emotional_cost": "string (e.g., 'High frustration with manual handoff delays')",
        "business_impact": "string (e.g., 'Delays contract closing by 2–3 weeks')"
      },

      "supporting_evidence": [
        {
          "source_type": "g2_review|reddit|twitter|support_ticket|job_posting|interview",
          "source": "string (URL or platform identifier)",
          "date": "ISO 8601 date",
          "evidence_quote": "string (relevant quote, max 150 chars)",
          "reliability": "high|medium|low"
        }
      ],

      "incumbent_solutions_attempted": [
        {
          "company": "string",
          "solution_type": "string (e.g., 'template library', 'automation rules')",
          "why_insufficient": "string (e.g., 'Templates are generic, don't handle edge cases')"
        }
      ],

      "underlying_root_causes": [
        "string (e.g., 'Incumbent solution requires manual categorization step')",
        "string (e.g., 'Integration with customer systems is manual')"
      ],

      "willingness_to_pay_signals": {
        "evidence": ["string"],
        "estimated_budget": "string (e.g., '$100–$500 per month for mid-market')",
        "budget_source": "string (e.g., 'Competitors charge $X for workaround')"
      },

      "related_pain_points": ["pain_001", "pain_003"],
      "next_steps": "string (how Concept Generator should use this insight)"
    }
  ],

  "pain_themes": [
    {
      "theme": "string (e.g., 'Data Integration & Handoff')",
      "related_pain_ids": ["pain_001", "pain_002"],
      "theme_severity": "high|medium|low",
      "customer_segments_affected": ["string"],
      "market_implication": "string (why solving this matters)"
    }
  ],

  "customer_personas": [
    {
      "persona_name": "string (e.g., 'Overworked Compliance Manager')",
      "segment": "string (e.g., 'mid-market financial services')",
      "pain_points_affecting": ["pain_id"],
      "estimated_headcount": "string (e.g., '~5,000 in US market')",
      "job_titles": ["string"],
      "typical_frustrations": ["string"],
      "job_performance_metrics": ["string (what they're measured on)"],
      "early_adopter_signal": "high|medium|low (how likely to try new solution)"
    }
  ],

  "market_sentiment_analysis": {
    "overall_sentiment": "highly_frustrated|frustrated|neutral|satisfied",
    "sentiment_by_company": [
      {
        "company": "string",
        "avg_rating": "number (1-5)",
        "sentiment": "string",
        "key_complaint_themes": ["string"]
      }
    ],
    "trend": "worsening|stable|improving",
    "trend_evidence": "string (e.g., 'Complaints about X increasing 20% YoY')"
  },

  "willingness_to_pay_summary": {
    "market_wide_signals": [
      {
        "signal": "string (e.g., 'Competitor Y charges $300/month for partial solution')",
        "implies_budget": "string (e.g., 'Customers willing to pay $300+ for better solution')"
      }
    ],
    "recommended_pricing_tier": "string (e.g., '$150–$300/month for SMB segment')"
  },

  "research_sources": [
    {
      "type": "g2|capterra|reddit|twitter|job_board|interview",
      "url": "string",
      "date_accessed": "ISO 8601 date",
      "data_quality": "high|medium|low",
      "sample_size": "integer or 'not quantified'"
    }
  ],

  "research_gaps": [
    {
      "gap": "string (what we don't know)",
      "impact": "high|medium|low",
      "suggested_approach": "string (how to fill gap, e.g., 'conduct 5 customer interviews')"
    }
  ],

  "next_steps_for_concept_generator": [
    "string (specific insights or gaps for Concept Generator to address)"
  ]
}
```

**Secondary Outputs:**
- **Pain Heatmap:** Visual representation of pain severity × frequency (2x2 matrix)
- **Customer Quote Compilation:** Curated list of 10–20 most impactful customer quotes (for Concept Generator and later marketing)
- **Persona Profiles:** One-pager for each identified customer persona

---

## Core Logic / Algorithm

### High-Level Process

1. **Define Research Scope**
   - Use landscape report to identify target customer segments (personas)
   - Define search keywords and platforms to monitor
   - Set target sample size (aim for 100+ data points minimum)

2. **Mine Review Sites**
   - Query G2, Capterra, Trustpilot for all reviews of identified competitors
   - Extract structured data: rating, date, reviewer role, company size
   - For low ratings (1–3 stars), extract pain descriptions and categorize
   - Aggregate complaint themes and calculate frequency

3. **Search Community Platforms**
   - Identify relevant Reddit communities (r/[industry], r/[specific_problem])
   - Search for complaint/frustration threads
   - Extract pain themes and related upvotes/engagement as signal of popularity
   - Capture quotes that illustrate pain

4. **Analyze Social Media Sentiment**
   - Search Twitter/X for negative mentions of incumbents
   - Identify complaint patterns and sentiment trends
   - Track which pain points are trending (increasing discussion)

5. **Job Posting Analysis**
   - Search for job postings at target companies for roles related to pain points
   - Look for repeated, hard-to-fill positions (signal of operational friction)
   - Extract job descriptions to understand what skills/capabilities are missing

6. **Synthesize into Themes**
   - Group individual pain signals into coherent pain themes
   - For each theme:
     - Count frequency across sources
     - Assess severity from impact descriptions
     - Link to underlying root cause
     - Identify incumbent solution gaps

7. **Develop Personas**
   - For each major customer segment, create a persona profile
   - Describe pain points affecting that persona
   - Assess likelihood to adopt new solution (early adopter signal)

8. **Estimate Willingness to Pay**
   - From reviews and community posts, extract evidence of what customers are willing to pay
   - Cross-reference with competitor pricing (implies budget)
   - Look for mentions of workarounds/expensive solutions they're currently using

9. **Validate Market Sentiment**
   - Synthesize overall market sentiment: Are customers frustrated, neutral, or satisfied?
   - Are pain points getting worse or improving?
   - Is there evidence of active search for alternatives?

---

## Data Sources & Integrations

### Review Aggregation
- **G2 API / Web Scraping** (reviews, ratings, feature comparisons)
- **Capterra API / Scraping** (reviews, alternative lists)
- **Trustpilot API** (for consumer-facing products)

### Community Data
- **Reddit API** (subreddit posts, comments, upvotes)
- **Specialized Forums** (industry-specific communities; may require manual scraping)
- **Discord Servers** (industry communities, if public; scraping may have limitations)

### Social Media
- **Twitter/X API** (search for complaint keywords, sentiment analysis)
- **LinkedIn API** (company discussions, sentiment in posts/comments)

### Job Postings
- **LinkedIn Jobs API** or scraping
- **Indeed API** or scraping
- **Built.io** or similar for job posting aggregation

### Customer Interviews (Optional)
- **Email outreach** to identified power users or vocal reviewers
- **Calendly / Meeting scheduling** integration
- **Airtable / Notion** for tracking interview state

### Data Analysis Tools
- **Natural Language Processing (NLP):** VADER, TextBlob, or transformer models (Hugging Face) for sentiment analysis
- **Topic Modeling:** LDA or BERTopic for clustering pain themes
- **Text Extraction:** Regex, spaCy for entity extraction

---

## Agent Prompt Strategy

### System Prompt / Role Definition

```
You are a customer research analyst and market psychologist. Your task is to uncover
what customers really struggle with in a target market — not what marketers say the
problem is, but what actual users express in reviews, forums, and job postings.

You think analytically: you distinguish between surface-level complaints (e.g., "too
expensive") and root-cause problems (e.g., "requires manual data entry between systems").
You synthesize disparate signals into themes. You calibrate evidence quality — a quote
from a verified customer is more reliable than speculation.

When analyzing customer feedback, you ask yourself:
- What specific task or situation is causing frustration?
- How often does this happen, and for which customer segment?
- What have they tried so far, and why didn't it work?
- Would they pay to solve this? How much?
- What is the emotional intensity of this complaint?

Your research should enable a concept designer to target the exact problems customers
will pay to solve.
```

### Task Structure & Prompting

**Phase 1: Scope Definition**
```
Given the landscape report, define your research scope:

1. Identify 3–5 target customer personas from the landscape report
   (e.g., "Compliance Manager at mid-market financial firm")

2. For each persona, generate 15–20 search queries across different platforms:
   - Review sites: "[Competitor] reviews", "[Competitor] complaints", "[Competitor] feedback"
   - Reddit: "r/[industry] [problem]", "[competitor] reddit", "[problem] reddit"
   - Twitter: "[competitor] complaints", "[problem] frustrated", "[problem] not working"
   - Jobs: "[industry] [specific role]" (to find hard-to-fill positions)

3. Set a target for evidence collection:
   - Minimum 100 data points (review quotes, forum posts, job postings)
   - Ensure representation across 3+ platforms
   - Target mix: 40% reviews, 30% community posts, 20% job postings, 10% interviews (if conducted)
```

**Phase 2: Systematic Collection**
```
For each search query, systematically collect evidence:

1. Visit the source (G2, Reddit, etc.)
2. Identify relevant results (filter for recency: last 12 months)
3. Extract structured data:
   - Source URL
   - Date
   - If a review: rating, reviewer role, company size
   - Pain described (quote)
   - Sentiment (very negative / negative / neutral / positive)
4. Store in structured format for aggregation

Focus on understanding:
- WHAT is the customer trying to do?
- WHAT goes wrong?
- HOW does it fail?
- WHAT is the impact?
- WHAT workaround are they using?
```

**Phase 3: Aggregation & Theme Clustering**
```
Analyze all collected evidence to identify pain themes:

1. Read through all quotes/excerpts (you collected 100+)
2. Group by topic:
   - Ease of use / UX
   - Integration with other tools
   - Feature gaps
   - Cost / pricing
   - Support quality
   - Performance / speed
   - Customization
   - Data privacy / security
3. For each group:
   - Count frequency (how many separate sources mention this?)
   - Extract most representative quote
   - Assess severity (would this prevent someone from using the product?)
   - Assess frequency (is this a universal pain or occasional?)

Create 5–10 distinct pain themes from this analysis.
```

**Phase 4: Persona Mapping**
```
For each identified pain theme, determine:
- Which customer persona(s) experience this pain?
- How critical is this pain to that persona's job performance?
- Would they seek out a solution for this pain alone?
- Are they early adopters or late majority?

Build a persona profile for each key segment:
- Job title and responsibilities
- Daily/weekly tasks and time allocation
- Pain points affecting this role
- Current tools and workarounds
- Likelihood to try new solution
- Estimated market size (how many people in this role?)
```

**Phase 5: Willingness-to-Pay Estimation**
```
From the evidence, extract signals about what customers would pay:
- "We're currently paying $X for a partial solution" → willingness for better solution >= $X
- "Competitors charge $Y for feature Z" → implies market tolerance for $Y
- "We hired a consultant for $Z" → implies this problem is worth $Z
- "We built an in-house workaround" → implies significant pain

Synthesize into: Estimated customer budget for a solution to this pain point.
```

### Few-Shot Examples

**Example 1: Legal Tech Pain Extraction**

Input: Landscape report mentions LexisNexis, Westlaw, Contract.AI as incumbents. Target personas: "In-house counsel", "Contract reviewer at law firm"

Interim Collection:
- G2 reviews of LexisNexis: 800+ reviews, avg 3.8/5
- Low-rating themes: "Integration is painful", "Research is slow", "Doesn't handle edge cases"
- Reddit r/legaltech: 40 threads about integration struggles, 25 about cost
- Job postings: Many law firms hiring "Contract Specialist (temporary)" — indicates manual work spike

Synthesis:
- Pain Theme A: "Integration Hell" (frequency: high, severity: high)
  - Root cause: Incumbents don't integrate with firm's document management systems
  - Impact: Manual copy-paste of documents between systems (5–10 hours/week per person)
  - Willingness to pay: Firms currently hiring temp staff ($35K/year) to handle this; would pay $100–300/month for automation

- Pain Theme B: "Generic Solutions Don't Handle Edge Cases" (frequency: high, severity: high)
  - Root cause: AI models in incumbents are trained on common contracts; edge cases fail silently
  - Impact: Senior attorney must still review AI output, negating time savings
  - Willingness to pay: If solution handled 80%+ of edge cases, firms would upgrade from current solution

Output: Pain Catalog identifying 8 distinct themes, with each linked to 5–15 supporting quotes.

**Example 2: VC Due Diligence Pain Extraction**

Input: Landscape identifies CB Insights, Crunchbase as partial solutions; most due diligence is manual

Interim Collection:
- Twitter conversations with VCs: 60+ tweets about "spending too much time on research"
- LinkedIn discussions: Posts from junior analysts about repetitive work
- Job postings: "Analyst" roles at VC firms explicitly mention market research (hard to hire for, high turnover)
- Reddit r/venturecapital: Threads about workflows, pain with existing tools

Synthesis:
- Pain Theme A: "Repetitive Research Work" (frequency: universal, severity: high)
  - Root cause: Each deal requires custom market research; no automation available
  - Impact: 200 hours per deal / 3-4 deals per partner per year = 600–800 hours = 1 FTE+ per partner
  - Willingness to pay: Firms routinely hire analysts at $80K/year; would pay $200–500/month for partial automation

Output: Pain Catalog identifies "Research burden", "Verification challenges", "Competitive analysis time", etc.

### Edge Case Handling

**Problem: Incumbent has high overall rating but low ratings on specific features**
- Solution: Focus on low-rating categories. A 4.2-star product with 4.0 in "Integration" and 3.1 in "Customization" has real pain points despite high average.

**Problem: Market is fragmented; customers use different tools**
- Solution: Research pain in each tool separately, then identify common themes across all tools. The common pains are market-wide.

**Problem: Private/B2B market; few public reviews**
- Solution: Shift to job posting analysis (job descriptions reveal pain), LinkedIn discussions, Reddit, industry forums, and conduct customer interviews if possible.

**Problem: Customer complaints are all about pricing; no feature/functionality pain clear**
- Solution: Dig deeper into why pricing is complained about. Typical root causes: "Features don't justify cost", "Can't customize without enterprise plan", "Pay-per-seat model penalizes growth". These are real pains.

**Problem: Survey or interview reveals a pain, but no corroborating public evidence**
- Solution: If high-confidence source (face-to-face interview, written survey from verified customer), include it and flag confidence level. Don't exclude; but note that it's not yet validated across broader market.

---

## Error Handling & Edge Cases

### Data Quality Issues

**Problem:** Reviews are fake or biased
- **Solution:** Prioritize verified reviews (G2/Capterra mark verified customer purchases). Discard reviews from competitors or brand advocates. Cross-reference across multiple platforms.

**Problem:** Customer complaints are outdated (product improved since then)
- **Solution:** Check product changelog and recent reviews (last 3 months). If recent reviews no longer mention an old pain, mark it as "likely resolved".

**Problem:** Sentiment analysis tools misclassify reviews (e.g., "Their solution is great... for us to avoid" gets classified as positive)
- **Solution:** Always spot-check NLP results manually. For critical pain themes, manually read 10–20 original sources to validate NLP clustering.

**Problem:** Job postings don't clearly indicate pain (e.g., "Senior Analyst" title doesn't specify what work is manual)
- **Solution:** Read job description content carefully. Look for keywords like "manual", "repetitive", "research-heavy", "spend X hours on Y". If unclear, mark as "medium confidence".

### Scope Issues

**Problem:** Too many pain themes identified (20+); hard to prioritize
- **Solution:** Group related pains into parent themes. Only keep distinct pains that would be solved differently. Aim for 5–10 final themes.

**Problem:** Pain identified in only one niche; not market-wide
- **Solution:** Note that this pain is segment-specific. If addressing this pain, target that segment. Don't oversell as a universal market opportunity.

**Problem:** Identified pain is actually a symptom of a deeper problem
- **Solution:** Investigate root cause. Example: "Customers complain slow" might indicate "underlying architecture bottleneck" or "process is inefficient." Link both levels.

### Source Limitations

**Problem:** G2/Capterra reviews are promotional (many 5-star reviews, few critical ones)
- **Solution:** Weight review data lower if 80%+ are 5-star. Rely more on Reddit, Twitter, and job postings where anonymity allows honest feedback.

**Problem:** Reddit discussions on a topic are sparse or controversial
- **Solution:** Supplement with Google Groups, Stack Exchange, industry-specific forums. If still sparse, acknowledge in report that community sentiment is under-represented.

---

## Performance & Scaling

### Expected Throughput & Latency

- **Per-Market Research Time:** 6–10 hours of agent runtime (depends on data availability and breadth of review data)
- **Data Collection:** Can be parallelized across platforms (G2, Reddit, Twitter searches can run concurrently)
- **Expected Sample Size:** 100–300 data points per market (reviews, forum posts, job postings, interviews)
- **Latency Requirement:** Should complete within 1–2 business days (async; real-time not required)

### Handling Volume Spikes

**If researching multiple markets in parallel:**
- Parallelize data collection: Each market's review/forum/job scraping runs in parallel
- Cache review data: If two markets share incumbent competitors, reuse review data (mark as shared with date)
- Tier research depth: High-priority markets get 10-hour deep dive; lower-priority ones get 6-hour focused version

### Optimization Opportunities

1. **Incremental Updates:** If market was researched 2+ months ago, run "delta" analysis on new reviews/posts rather than full re-research.
2. **Caching:** Store review data by company name; if same competitor appears in multiple markets, reuse extracted reviews.
3. **Parallel Scraping:** Use concurrent workers to scrape G2, Capterra, Reddit simultaneously.
4. **NLP Pipeline:** Pre-compute sentiment and topic models once, query multiple times (don't re-compute for each analysis).

---

## Dependencies

### Upstream Dependencies
- **Landscape Analyst (1.1):** Consumes landscape report (competitor list, value chain, personas)

### Downstream Dependencies
- **Concept Generator (1.3):** Uses pain catalog to inform concept ideation; directly addresses identified pain themes
- **Concept Scorer (1.4):** References pain severity and frequency when scoring "disruption potential" and "market need"
- **Phase 2 (Validation):** Customer validation step (2.3) revisits pain severity to confirm market signal

### External Dependencies
- **Web access & scraping:** G2, Capterra, Reddit, Twitter APIs
- **NLP/Sentiment Analysis:** Hugging Face models or OpenAI API for text analysis
- **Cloud storage:** For caching review data and sentiment analysis outputs

---

## Success Metrics

### Primary Metrics

1. **Research Breadth:** Pain catalog includes 5–10 distinct, well-substantiated pain themes. Each theme has 10+ supporting data points. ✓ = success
2. **Persona Clarity:** 3–5 customer personas identified, with pain points mapped to each. Personas are grounded in observed evidence (not speculation). ✓ = success
3. **Actionability:** Each pain theme includes: root cause analysis, impact quantification, and willingness-to-pay signal. Concept Generator can use these to design targeted concepts. ✓ = success
4. **Evidence Quality:** All pain themes cite sources; claims are verifiable. Confidence levels calibrated (high/medium/low). ✓ = success

### Secondary Metrics

5. **Data Coverage:** Minimum 100 data points collected across 3+ platforms. Sample is recent (80%+ within 12 months). ✓ = success
6. **Sentiment Accuracy:** Manual spot-check of NLP sentiment classification: 85%+ accuracy. ✓ = success
7. **Persona Validation:** After interviewing 2–3 customers from identified personas, researcher confirms personas are accurate. ✓ = success
8. **Concept Alignment:** After Phase 1 concept generation, all proposed concepts map to identified pain themes. No "surprise" pain themes emerge. ✓ = success

### How to Measure

- **During research:** Track data point collection count; ensure 3+ sources represented; spot-check sentiment classification
- **After Phase 1:** Do Concept Generator outputs explicitly reference pain themes from this catalog?
- **After Phase 2:** Does customer validation survey confirm the pain severity/frequency estimates?
- **After Phase 3:** Are the proposed operational workflows designed to address the pain themes identified here?

---

## Implementation Notes

### Suggested Tech Stack

**Language & Agents:**
- Python with Anthropic SDK (Claude Opus for reasoning and synthesis)
- Agentic loop: Agent decides which sources to search, processes results, identifies themes, validates hypotheses
- Consider ReAct for step-by-step reasoning

**Web Scraping & APIs:**
- **G2/Capterra:** Official APIs (if available) or Selenium/Playwright for scraping
- **Reddit:** PRAW (Python Reddit API Wrapper)
- **Twitter/X:** Official API v2 with Academic Research access (requires approval)
- **Job Boards:** LinkedIn Jobs scraping (via official API or third-party), Indeed scraping
- **General web:** BeautifulSoup, Playwright for dynamic content

**NLP & Sentiment Analysis:**
- **Sentiment Analysis:** VADER (quick), Transformers library (HuggingFace) for nuanced sentiment
- **Topic Modeling:** BERTopic or Gensim for clustering complaints into themes
- **Text Summarization:** Hugging Face `transformers` for extracting key insights from long reviews

**Data Storage & Caching:**
- **PostgreSQL:** Structured storage for reviews, job postings, extracted signals
- **MongoDB:** Document store for pain theme clusters and personas
- **Redis:** Caching of review data and sentiment analysis results

**Visualization:**
- **Matplotlib/Plotly:** For pain heatmaps (severity × frequency)
- **Seaborn:** For sentiment distribution charts

### Implementation Phases

**Phase 1: MVP (Week 1–2)**
- Implement G2/Capterra scraping (reviews + ratings)
- Basic sentiment analysis (VADER)
- Manual Reddit search and extraction
- Output: JSON pain catalog with 5–8 themes

**Phase 2: Enhancement (Week 3–4)**
- Add Reddit PRAW integration (automated search)
- Add Twitter API integration (complaint search)
- Implement BERTopic for theme clustering
- Add job posting scraping
- Implement persona generation

**Phase 3: Optimization (Week 5+)**
- Incremental update logic (delta analysis for re-research)
- Caching layer for review data
- Parallel scraping for multiple platforms
- Interview scheduling and tracking (if conducting interviews)
- Export to multiple formats

### Code Patterns & Libraries

**Review Scraping Pattern:**
```python
import requests
from selenium import webdriver

def scrape_g2_reviews(competitor_name):
    """Scrape all reviews for a competitor from G2."""
    reviews = []
    base_url = f"https://www.g2.com/products/{competitor_slug}/reviews"

    # Could use official API if available, or web scraping
    driver = webdriver.Chrome()
    driver.get(base_url)

    while has_next_page():
        page_reviews = extract_reviews_from_page(driver)
        reviews.extend(page_reviews)
        driver.find_element("class", "pagination-next").click()

    return reviews

def extract_reviews_from_page(driver):
    """Extract structured review data."""
    reviews = []
    for review_element in driver.find_elements("class", "review-card"):
        review = {
            "rating": extract_rating(review_element),
            "text": extract_text(review_element),
            "date": extract_date(review_element),
            "reviewer_role": extract_reviewer_role(review_element),
            "company_size": extract_company_size(review_element)
        }
        reviews.append(review)
    return reviews
```

**Theme Clustering Pattern:**
```python
from bertopic import BERTopic

def cluster_pain_themes(review_texts):
    """Use BERTopic to cluster reviews into pain themes."""
    model = BERTopic(language="english", calculate_probabilities=True)
    topics, probs = model.fit_transform(review_texts)

    themes = []
    for topic_id in model.get_topics().keys():
        if topic_id == -1:  # Outliers
            continue
        top_words = model.get_topic(topic_id)
        theme_name = generate_theme_name(top_words)
        related_reviews = [r for r, t in zip(review_texts, topics) if t == topic_id]

        themes.append({
            "theme": theme_name,
            "related_reviews": related_reviews,
            "frequency": len(related_reviews)
        })

    return sorted(themes, key=lambda x: x["frequency"], reverse=True)
```

**Sentiment Analysis Pattern:**
```python
from transformers import pipeline

def analyze_sentiment(review_text):
    """Classify review sentiment with confidence."""
    classifier = pipeline("sentiment-analysis")
    result = classifier(review_text[:512])  # Truncate to token limit

    return {
        "sentiment": result[0]["label"],
        "confidence": result[0]["score"]
    }

def extract_pain_summary(review_text):
    """Extract key pain points from review."""
    summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    summary = summarizer(review_text, max_length=50, min_length=20)
    return summary[0]["summary_text"]
```

### Testing & Validation

- **Unit tests:** Parsing reviews correctly, sentiment classification accuracy, theme clustering coherence
- **Integration tests:** End-to-end extraction on 2–3 known markets; manual comparison to real G2/Capterra data
- **Human validation:** Domain expert reviews 10% of extracted pain themes to verify accuracy and completeness
- **Persona validation:** Interview 3–5 customers from identified personas; confirm personas match reality

### Common Pitfalls to Avoid

1. **Over-reliance on Sentiment Tools:** NLP sentiment analysis can misclassify sarcasm or context. Always spot-check.
2. **Selection Bias:** If only analyzing 5-star and 1-star reviews, missing the nuanced middle ground. Include all ratings.
3. **Outdated Data:** Relying on old reviews when product has evolved. Always check product version/date.
4. **Sample Size Too Small:** 10–20 reviews is not enough to confirm a pain theme. Target 100+.
5. **False Themes from Outliers:** One person complaining about an obscure issue doesn't make a pain theme. Set minimum frequency threshold.

---

## Example Output (Abbreviated)

**Input:**
```json
{
  "market_id": "market_legal_001",
  "competitors": ["LexisNexis", "Westlaw", "ContractAI"]
}
```

**Output (Executive Summary Section):**

```markdown
## Executive Summary

We analyzed 400+ customer reviews, 80+ Reddit discussions, and 25+ job postings across
the legal technology market. Overall market sentiment is **frustrated** (avg rating 3.8/5).

**Top 3 Pain Themes:**
1. Integration Hell (severity: HIGH, frequency: COMMON)
   - Customers must manually copy documents between systems
   - Affects 65% of mid-market firm users
   - Currently hiring temp staff at $35K/year to handle this

2. Edge Cases Not Handled (severity: HIGH, frequency: COMMON)
   - AI solutions fail silently on non-standard contracts
   - Still requires senior attorney review, negating time savings
   - Affects 55% of users with complex contracts

3. Generic Solutions Don't Fit Workflow (severity: MEDIUM, frequency: COMMON)
   - Law firms have bespoke processes; tools are one-size-fits-all
   - Customization requires expensive professional services
   - Affects 45% of users

**Market Implication:** Despite sophistication of incumbent solutions, they create
friction at critical handoff points (integration, customization, edge case handling).
A purpose-built solution addressing these frictions would unlock significant value.
```

---

