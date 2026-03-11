# Company Builder — Component Specifications Index

This directory contains detailed specification documents for all 26 components of the Company Builder pipeline. Each spec is designed to be picked up by a developer or team and built independently.

For high-level context, see [vision.md](../vision.md) and [process.md](../process.md).

---

## Full Pipeline Overview

```
Phase 0: Discovery       Phase 1: Ideation        Phase 2: Validation      Phase 3: Blueprint
──────────────────────   ──────────────────────   ──────────────────────   ──────────────────────
0.1 Source Scanner       1.1 Landscape Analyst    2.1 Market Sizer         3.1 Business Designer
0.2 Signal Detector      1.2 Pain Extractor       2.2 Competitive Analyst  3.2 Agent Architect
0.3 Market Classifier    1.3 Concept Generator    2.3 Customer Validator   3.3 GTM Strategist
0.4 Opportunity Ranker   1.4 Concept Scorer       2.4 Feasibility Assessor 3.4 Risk Analyst
0.5 Watchlist Publisher  1.5 Concept Selector     2.5 Economics Modeler    3.5 Resource Planner
                                                  2.6 Validation Synth.    3.6 Blueprint Packager
        ↓ Gate                  ↓ Gate                   ↓ Gate
   Watchlist              Shortlisted              Go/No-Go              Company Blueprint
                          Concepts                 Verdict               (final deliverable)

Cross-Cutting: Pipeline Orchestrator · Data Store · Review Dashboard · Feedback Loop
```

---

## Phase 0 — Discovery

Continuously monitors external sources and produces a ranked watchlist of markets ripe for agent-first disruption.

| Step | Component | Type | Spec |
|------|-----------|------|------|
| 0.1 | Source Scanner | Agent | [source-scanner.md](./source-scanner.md) |
| 0.2 | Signal Detector | Agent | [signal-detector.md](./signal-detector.md) |
| 0.3 | Market Classifier | Agent | [market-classifier.md](./market-classifier.md) |
| 0.4 | Opportunity Ranker | Agent | [opportunity-ranker.md](./opportunity-ranker.md) |
| 0.5 | Watchlist Publisher | Service + UI | [watchlist-publisher.md](./watchlist-publisher.md) |

**Data flow:** Raw web content → normalized items → detected signals → market opportunity candidates → scored and ranked opportunities → published watchlist.

**Gate:** Opportunities above a configurable score threshold advance to Phase 1. Human override available.

---

## Phase 1 — Ideation

Takes a market opportunity from the watchlist (or user-provided) and generates scored startup concepts.

| Step | Component | Type | Spec |
|------|-----------|------|------|
| 1.1 | Landscape Analyst | Agent | [landscape-analyst.md](./landscape-analyst.md) |
| 1.2 | Pain Extractor | Agent | [pain-extractor.md](./pain-extractor.md) |
| 1.3 | Concept Generator | Agent | [concept-generator.md](./concept-generator.md) |
| 1.4 | Concept Scorer | Agent | [concept-scorer.md](./concept-scorer.md) |
| 1.5 | Concept Selector | Gate + UI | [concept-selector.md](./concept-selector.md) |

**Data flow:** Market opportunity → landscape report + pain point catalog → 5–15 concept sketches → scored and ranked concepts → shortlisted concepts.

**Gate:** Top-scoring concepts (configurable top 1–3) advance to Phase 2. Human override available.

---

## Phase 2 — Validation

Rigorously tests each shortlisted concept against real-world data to produce a go/no-go verdict.

| Step | Component | Type | Spec |
|------|-----------|------|------|
| 2.1 | Market Sizer | Agent | [market-sizer.md](./market-sizer.md) |
| 2.2 | Competitive Analyst | Agent | [competitive-analyst.md](./competitive-analyst.md) |
| 2.3 | Customer Validator | Agent | [customer-validator.md](./customer-validator.md) |
| 2.4 | Feasibility Assessor | Agent | [feasibility-assessor.md](./feasibility-assessor.md) |
| 2.5 | Economics Modeler | Agent | [economics-modeler.md](./economics-modeler.md) |
| 2.6 | Validation Synthesizer | Agent | [validation-synthesizer.md](./validation-synthesizer.md) |

**Data flow:** Shortlisted concept → market size + competitive intelligence + customer signals + feasibility report + unit economics → synthesized go/no-go verdict.

**Gate:** "Go" with high confidence advances automatically. "Go" with moderate confidence flagged for human review. "No-go" archived with rationale.

---

## Phase 3 — Blueprint

Turns a validated concept into a complete, actionable company blueprint.

| Step | Component | Type | Spec |
|------|-----------|------|------|
| 3.1 | Business Designer | Agent | [business-designer.md](./business-designer.md) |
| 3.2 | Agent Architect | Agent | [agent-architect.md](./agent-architect.md) |
| 3.3 | GTM Strategist | Agent | [gtm-strategist.md](./gtm-strategist.md) |
| 3.4 | Risk Analyst | Agent | [risk-analyst.md](./risk-analyst.md) |
| 3.5 | Resource Planner | Agent | [resource-planner.md](./resource-planner.md) |
| 3.6 | Blueprint Packager | Agent | [blueprint-packager.md](./blueprint-packager.md) |

**Data flow:** Validated concept + all Phase 2 outputs → business model + agent architecture + GTM plan + risk register + resource plan → unified company blueprint document.

**Output:** The final deliverable — a complete blueprint a small team can use to start building.

---

## Cross-Cutting Components

These components wire the pipeline together and operate across all phases.

| Component | Type | Spec |
|-----------|------|------|
| Pipeline Orchestrator | Service | [pipeline-orchestrator.md](./pipeline-orchestrator.md) |
| Data Store | Infrastructure | [data-store.md](./data-store.md) |
| Review Dashboard | UI | [review-dashboard.md](./review-dashboard.md) |
| Feedback Loop | Service | [feedback-loop.md](./feedback-loop.md) |

**Pipeline Orchestrator** manages state, triggers agents, enforces gates, and provides pipeline visibility.

**Data Store** persists all intermediate outputs, scores, reports, and decisions for auditability and reprocessing.

**Review Dashboard** gives human reviewers the ability to inspect outputs, override decisions, and annotate at every gate.

**Feedback Loop** feeds outcomes from later phases back to improve earlier phases (e.g., Phase 2 rejection patterns tuning Phase 1 scoring).

---

## Spec Structure

Every component spec follows a consistent 11-section structure:

1. **Purpose & Responsibility** — What it does and what it owns
2. **Inputs** — Data structures, schemas, sources
3. **Outputs** — Data structures, schemas, destinations
4. **Core Logic / Algorithm** — Step-by-step processing, detailed enough to implement
5. **Data Sources & Integrations** — External APIs and services needed
6. **Agent Prompt Strategy** — System prompts, persona, instructions, few-shot examples
7. **Error Handling & Edge Cases** — Failure modes and recovery
8. **Performance & Scaling** — Throughput, latency, scaling approach
9. **Dependencies** — Upstream and downstream components
10. **Success Metrics** — How to measure if it's working
11. **Implementation Notes** — Tech stack, libraries, practical build guidance

---

## Getting Started

**To understand the system:** Read specs in pipeline order (0.1 → 0.2 → ... → 3.6), focusing on Inputs and Outputs sections to trace data flow.

**To build a component:** Read its spec end-to-end, then check the specs of its immediate upstream and downstream dependencies to understand the data contracts.

**To design agent prompts:** Each agent spec includes a full Agent Prompt Strategy section with system prompts ready to use with the Claude or OpenAI APIs.

**To set up infrastructure:** Start with the Data Store and Pipeline Orchestrator specs, as all other components depend on them.
