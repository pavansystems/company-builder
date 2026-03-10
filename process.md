# Company Builder — Process Pipeline

This document describes the end-to-end pipeline that takes a blank slate and produces a launch-ready company blueprint. Each step is designed to be implementable as a discrete component or agent, so the platform can be built incrementally and each piece can operate autonomously.

## Pipeline Overview

```
Phase 0          Phase 1          Phase 2          Phase 3
Discovery    →   Ideation     →   Validation   →   Blueprint
─────────────────────────────────────────────────────────────
0.1 Scan         1.1 Landscape    2.1 Market       3.1 Business
0.2 Detect       1.2 Pain         2.2 Competition  3.2 Agent
0.3 Classify     1.3 Generate     2.3 Customer     3.3 Go-to-
0.4 Rank         1.4 Score        2.4 Feasibility       Market
0.5 Publish      1.5 Select       2.5 Economics    3.4 Risk
                                  2.6 Verdict      3.5 Runway
                                                   3.6 Package
```

An idea enters the pipeline at the left and moves rightward. At each gate between phases, there is an explicit go/no-go decision — either automated or human-reviewed — so that weak ideas are filtered out early and resources are focused on the strongest candidates.

---

## Phase 0 — Discovery

**Goal:** Continuously monitor the outside world and produce a ranked watchlist of markets, industries, and problem spaces that are newly ripe for agent-first disruption.

### Step 0.1 — Source Scanning

Ingest and normalize content from a configurable set of external sources.

- **Inputs:** RSS feeds, news APIs, tech blogs, research paper repositories (arXiv, SSRN), product launch sites (Product Hunt, Hacker News), government regulatory filings, patent databases, AI model release announcements.
- **Process:** An ingestion agent continuously pulls new content, deduplicates it, extracts structured metadata (date, source, topic, entities mentioned), and stores it in a searchable knowledge base.
- **Output:** A stream of normalized content items, each tagged with source, date, and preliminary topic classification.
- **Component:** `source-scanner` agent + content store.

### Step 0.2 — Signal Detection

Identify meaningful signals within the ingested content.

- **Inputs:** Normalized content stream from 0.1.
- **Process:** An analysis agent applies pattern recognition to detect: new AI capabilities or model releases, regulatory changes (new laws, deregulation, compliance shifts), market disruptions (acquisitions, bankruptcies, pricing shifts), technology breakthroughs that lower the barrier to automating previously human-only tasks, and emerging customer frustrations in specific sectors.
- **Output:** A list of detected signals, each classified by type (tech breakthrough, regulatory shift, market event, customer pain) with a summary and links to source material.
- **Component:** `signal-detector` agent.

### Step 0.3 — Market Classification

Map detected signals to specific markets, industries, and problem spaces.

- **Inputs:** Detected signals from 0.2.
- **Process:** A classification agent clusters related signals and maps them to a taxonomy of markets and industries. It identifies which sectors are being affected and which specific problems within those sectors are becoming newly solvable. Signals that don't map to any clear market opportunity are archived for future reference.
- **Output:** A set of market opportunity candidates, each defined by: target market/industry, the specific problem or inefficiency identified, the enabling signals (what changed to make this attackable now), and an initial "agent-readiness" tag indicating how much of the work in this space could plausibly be handled by AI agents.
- **Component:** `market-classifier` agent + market taxonomy store.

### Step 0.4 — Opportunity Ranking

Score and prioritize market opportunity candidates.

- **Inputs:** Market opportunity candidates from 0.3.
- **Process:** A ranking agent evaluates each candidate across multiple dimensions: estimated market size, number and strength of converging signals, agent-readiness (how much of the value chain can be automated), competitive density (how crowded the space already is), timing confidence (how certain are we that the window is open now). Each dimension is scored and weighted to produce a composite opportunity score.
- **Output:** A ranked watchlist of market opportunities, sorted by composite score, with per-dimension breakdowns.
- **Component:** `opportunity-ranker` agent + scoring model.

### Step 0.5 — Watchlist Publication

Make the ranked watchlist available to downstream phases and to human reviewers.

- **Inputs:** Ranked watchlist from 0.4.
- **Process:** The watchlist is published to the platform's central pipeline store. Human reviewers can optionally browse, annotate, override scores, or manually add opportunities. The watchlist is versioned so that changes over time are trackable.
- **Output:** A published, versioned watchlist accessible to Phase 1 and to the platform dashboard.
- **Component:** `watchlist-publisher` service + dashboard UI.

### Phase 0 Gate

**Decision:** Which opportunities move to Phase 1?

- **Automatic:** Opportunities scoring above a configurable threshold are automatically promoted.
- **Manual:** Human reviewers can promote or demote opportunities regardless of score.
- **Batch or continuous:** The gate can operate on a schedule (e.g., weekly review) or continuously as new opportunities are ranked.

---

## Phase 1 — Ideation

**Goal:** For a given market opportunity, generate a set of concrete startup concepts that leverage AI agents as core operational infrastructure.

### Step 1.1 — Landscape Analysis

Build a structured picture of the current state of the target market.

- **Inputs:** A market opportunity from the Phase 0 watchlist (or a user-provided market/industry/problem).
- **Process:** A research agent conducts deep analysis of the target space: who are the incumbent players, what do they offer, how do they price, what is their tech stack, how many employees do they have, what are their publicly visible weaknesses. It also maps the value chain — every step from supplier to end customer — and identifies which steps are currently human-intensive.
- **Output:** A landscape report containing: incumbent map, value chain breakdown, technology stack overview, pricing analysis, and a human-labor dependency map showing where people are doing work that agents could potentially handle.
- **Component:** `landscape-analyst` agent.

### Step 1.2 — Pain Point Extraction

Identify the specific customer pain points and unmet needs in the market.

- **Inputs:** Landscape report from 1.1 + raw market data.
- **Process:** A customer research agent mines public sources for evidence of dissatisfaction: product reviews, support forums, social media complaints, Reddit threads, Trustpilot/G2/Capterra reviews, job postings (which reveal what companies are struggling to hire for). It clusters these into distinct pain themes and estimates their severity and frequency.
- **Output:** A pain point catalog: a prioritized list of customer problems, each with evidence links, estimated severity, and frequency.
- **Component:** `pain-extractor` agent.

### Step 1.3 — Concept Generation

Generate startup concepts that address the identified pain points using agent-first approaches.

- **Inputs:** Landscape report from 1.1 + pain point catalog from 1.2 + enabling signals from Phase 0.
- **Process:** A generative agent produces multiple startup concepts. For each concept, it defines: what the product or service does, which pain points it addresses, how it uses AI agents to deliver value at lower cost than incumbents, what the customer experience looks like, and what makes it defensible. The agent is encouraged to be divergent — producing a range from incremental improvements to radical reimaginings of the market.
- **Output:** A set of 5–15 startup concept sketches, each as a structured one-pager.
- **Component:** `concept-generator` agent.

### Step 1.4 — Concept Scoring

Evaluate and score each generated concept.

- **Inputs:** Concept sketches from 1.3.
- **Process:** A scoring agent rates each concept on: disruption potential (how fundamentally it changes the market), agent-readiness (what percentage of operations can be agent-handled from day one), feasibility (can this actually be built with current technology), differentiation (how distinct is this from existing offerings), and revenue clarity (is there an obvious way to charge money). Scores are normalized and a composite rank is produced.
- **Output:** Scored and ranked concept list with per-dimension breakdowns.
- **Component:** `concept-scorer` agent + scoring rubric.

### Step 1.5 — Concept Selection

Select the most promising concepts to advance to validation.

- **Inputs:** Scored concept list from 1.4.
- **Process:** The top-scoring concepts (configurable: top 1–3) are promoted. Human reviewers can override: adding concepts that scored lower but feel promising, or removing high-scorers they have domain objections to.
- **Output:** A shortlist of concepts approved for Phase 2 validation.
- **Component:** `concept-selector` gate + review UI.

### Phase 1 Gate

**Decision:** Which concepts move to Phase 2?

- Concepts must meet a minimum composite score threshold.
- Human override is available in both directions.
- Rejected concepts are archived with their scores for potential future reconsideration.

---

## Phase 2 — Validation

**Goal:** Rigorously test each shortlisted concept against real-world data to determine whether it's worth building.

### Step 2.1 — Market Sizing

Estimate the total addressable market, serviceable market, and realistic initial target.

- **Inputs:** Selected concept from Phase 1 + landscape report.
- **Process:** A market research agent combines top-down data (industry reports, government statistics, analyst estimates) with bottom-up estimation (number of potential customers × willingness to pay × purchase frequency). It produces TAM, SAM, and SOM estimates with confidence ranges.
- **Output:** Market size report with TAM/SAM/SOM, methodology notes, confidence levels, and growth trajectory projections.
- **Component:** `market-sizer` agent.

### Step 2.2 — Competitive Deep Dive

Go beyond the landscape analysis to understand exactly how competitors operate and where they're vulnerable.

- **Inputs:** Selected concept + landscape report from 1.1.
- **Process:** A competitive intelligence agent analyzes each significant competitor: their pricing model in detail, customer acquisition channels, retention metrics (where visible), technology choices, team composition, funding history, and publicly stated roadmap. It identifies specific weaknesses — areas where the agent-first approach creates a structural cost or speed advantage.
- **Output:** Competitive intelligence report with per-competitor profiles and an explicit vulnerability map.
- **Component:** `competitive-analyst` agent.

### Step 2.3 — Customer Signal Validation

Verify that the pain points identified in Phase 1 are real, widespread, and something people would pay to solve.

- **Inputs:** Pain point catalog from 1.2 + concept definition.
- **Process:** A validation agent gathers additional evidence: search volume trends for related queries, community discussions volume and sentiment, existing willingness-to-pay signals (what do people currently spend on workarounds), and any available survey data or analyst reports. It also identifies early-adopter profiles — who would be the first customers and why.
- **Output:** Customer validation report with evidence strength ratings for each pain point, early-adopter personas, and willingness-to-pay estimates.
- **Component:** `customer-validator` agent.

### Step 2.4 — Feasibility Assessment

Determine whether the concept can actually be built and operated with current technology.

- **Inputs:** Concept definition + agent architecture sketch.
- **Process:** A technical feasibility agent evaluates: which AI capabilities are required and whether they exist at sufficient quality, what integrations and data sources are needed, what are the hardest technical problems and do they have known solutions, are there regulatory barriers (licensing, compliance, data privacy), and what is the expected reliability of agent-handled processes. It flags any showstoppers — requirements that can't currently be met.
- **Output:** Feasibility report with a go/no-go recommendation, a list of technical risks with severity ratings, and a regulatory checklist.
- **Component:** `feasibility-assessor` agent.

### Step 2.5 — Unit Economics Modeling

Model the financial viability of the concept assuming an agent-first operating structure.

- **Inputs:** Market size estimates + pricing analysis + concept definition.
- **Process:** An economics agent builds a unit economics model: cost per customer acquisition, cost to serve (agent compute costs vs. human labor costs for the same work), expected revenue per customer, churn assumptions, and breakeven timeline. It explicitly compares the agent-first cost structure to the traditional human-heavy alternative.
- **Output:** Unit economics model with key metrics (CAC, LTV, LTV/CAC ratio, gross margin, breakeven point), sensitivity analysis on key assumptions, and a comparison table against traditional cost structures.
- **Component:** `economics-modeler` agent.

### Step 2.6 — Validation Verdict

Synthesize all validation data into a go/no-go recommendation.

- **Inputs:** All outputs from 2.1–2.5.
- **Process:** A synthesis agent aggregates findings, highlights the strongest evidence for and against proceeding, identifies the highest-risk assumptions, and produces a clear recommendation. It assigns an overall confidence score.
- **Output:** Validation summary with a go/no-go recommendation, confidence score, key risks, and the top 3 things that would need to be true for the concept to succeed.
- **Component:** `validation-synthesizer` agent.

### Phase 2 Gate

**Decision:** Which validated concepts move to Phase 3?

- Concepts receiving a "go" with high confidence proceed automatically.
- Concepts receiving a "go" with moderate confidence are flagged for human review.
- Concepts receiving a "no-go" are archived with full rationale.

---

## Phase 3 — Blueprint

**Goal:** Turn a validated concept into a detailed, actionable blueprint that a small team could use to start building.

### Step 3.1 — Business Model Design

Define exactly how the company makes money.

- **Inputs:** Validated concept + unit economics model.
- **Process:** A business design agent selects and details the revenue model (subscription, usage-based, marketplace fee, etc.), defines pricing tiers, maps the customer journey from awareness to payment, and outlines expansion revenue opportunities. It ensures the model is coherent with the agent-first cost structure.
- **Output:** Business model document covering revenue streams, pricing strategy, customer journey, and a financial projection for the first 12–24 months.
- **Component:** `business-designer` agent.

### Step 3.2 — Agent Architecture Design

Define which roles are handled by agents, which require humans, and how they interact.

- **Inputs:** Concept definition + feasibility report + business model.
- **Process:** An architecture agent designs the operational structure: every function needed to run the business (sales, support, fulfillment, operations, etc.) is mapped and assigned to either an AI agent, a human, or a hybrid. For each agent role, it specifies: what the agent does, what tools and APIs it needs, what its decision boundaries are (when it escalates to a human), and what its expected reliability and cost are. It also defines the human roles — what can't be automated and why.
- **Output:** Agent architecture document with a role map, agent specifications, human role definitions, escalation protocols, and an estimated operational cost breakdown.
- **Component:** `agent-architect` agent.

### Step 3.3 — Go-to-Market Strategy

Define how the company acquires its first customers.

- **Inputs:** Customer validation report + early-adopter personas + business model.
- **Process:** A GTM agent designs the launch strategy: which customer segment to target first, through which channels, with what messaging, at what price point. It outlines the first 90 days of customer acquisition activity, specifying which GTM tasks are agent-handled (automated outreach, content generation, ad management) and which need human involvement.
- **Output:** Go-to-market plan with target segment, channel strategy, messaging framework, launch timeline, and a split of agent vs. human GTM activities.
- **Component:** `gtm-strategist` agent.

### Step 3.4 — Risk Register

Enumerate and plan for the things that could go wrong.

- **Inputs:** All Phase 2 outputs + architecture and GTM plans.
- **Process:** A risk analysis agent compiles risks from all prior phases and adds operational risks specific to the blueprint: agent failure modes, regulatory risks, competitive responses, dependency risks (API providers, model capabilities), and market timing risks. For each risk, it proposes a mitigation strategy and an early warning indicator.
- **Output:** Risk register with categorized risks, severity/likelihood ratings, mitigation plans, and monitoring triggers.
- **Component:** `risk-analyst` agent.

### Step 3.5 — Resource and Runway Planning

Determine what's needed to get from blueprint to operating business.

- **Inputs:** Agent architecture + GTM plan + financial model.
- **Process:** A planning agent estimates: upfront build costs (tech development, agent setup, tooling), monthly operating costs (agent compute, human salaries, tools, infrastructure), revenue ramp assumptions, and the resulting runway required. It produces a hiring plan (the minimal human team), a technology procurement list, and a milestone-based funding plan.
- **Output:** Resource plan with budget breakdown, team plan, technology stack, funding milestones, and a month-by-month cash flow projection.
- **Component:** `resource-planner` agent.

### Step 3.6 — Blueprint Packaging

Assemble all outputs into a single, coherent, actionable document.

- **Inputs:** All Phase 3 outputs.
- **Process:** A packaging agent compiles and cross-references all blueprint components into a unified document. It checks for internal consistency (does the financial model match the agent architecture costs? does the GTM plan align with the customer personas?), resolves contradictions, and produces an executive summary.
- **Output:** A complete company blueprint document containing: executive summary, business model, agent architecture, go-to-market plan, risk register, resource plan, and financial projections. This is the final deliverable of the pipeline.
- **Component:** `blueprint-packager` agent.

---

## Cross-Cutting Concerns

### Pipeline Orchestration

A central orchestrator manages the flow of ideas through the pipeline. It tracks the state of every opportunity and concept, triggers the right agents at each step, enforces gate decisions, and provides visibility into pipeline status.

- **Component:** `pipeline-orchestrator` service.

### Data Store

All intermediate outputs, scores, reports, and decisions are persisted in a structured data store. This enables auditability (why was this concept rejected?), learning (which types of opportunities tend to validate well?), and reprocessing (re-run Phase 2 with updated market data).

- **Component:** Central data store (structured + document).

### Human Review Interface

At every gate — and optionally at any step — a human reviewer can inspect outputs, override decisions, add context, or redirect the pipeline. The interface shows the current state of all active pipeline items and provides annotation tools.

- **Component:** `review-dashboard` UI.

### Feedback Loops

Outcomes from later phases feed back to improve earlier phases. If Phase 2 consistently rejects certain types of Phase 1 concepts, the scoring model in Step 1.4 should adapt. If Phase 0 signals repeatedly fail to produce viable opportunities, the signal detection in Step 0.2 should be recalibrated.

- **Component:** `feedback-loop` service + model tuning pipeline.

---

## Component Summary

| Step | Component | Type |
|------|-----------|------|
| 0.1 | `source-scanner` | Agent |
| 0.2 | `signal-detector` | Agent |
| 0.3 | `market-classifier` | Agent |
| 0.4 | `opportunity-ranker` | Agent |
| 0.5 | `watchlist-publisher` | Service + UI |
| 1.1 | `landscape-analyst` | Agent |
| 1.2 | `pain-extractor` | Agent |
| 1.3 | `concept-generator` | Agent |
| 1.4 | `concept-scorer` | Agent |
| 1.5 | `concept-selector` | Gate + UI |
| 2.1 | `market-sizer` | Agent |
| 2.2 | `competitive-analyst` | Agent |
| 2.3 | `customer-validator` | Agent |
| 2.4 | `feasibility-assessor` | Agent |
| 2.5 | `economics-modeler` | Agent |
| 2.6 | `validation-synthesizer` | Agent |
| 3.1 | `business-designer` | Agent |
| 3.2 | `agent-architect` | Agent |
| 3.3 | `gtm-strategist` | Agent |
| 3.4 | `risk-analyst` | Agent |
| 3.5 | `resource-planner` | Agent |
| 3.6 | `blueprint-packager` | Agent |
| — | `pipeline-orchestrator` | Service |
| — | Central data store | Infrastructure |
| — | `review-dashboard` | UI |
| — | `feedback-loop` | Service |
