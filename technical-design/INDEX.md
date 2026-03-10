# Company Builder — Technical Design Index

This folder contains the technical design references for building every component type in the platform. Each document is a self-contained blueprint that a developer uses when implementing any component of that type.

For what each component *does*, see [components/](../components/). For *how* to build them, see below.

---

## Tech Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend | Next.js (App Router) | UI, server-side rendering, API routes |
| Data | Supabase (Postgres + Realtime + Edge Functions + Auth + Storage) | Persistence, events, auth, file storage |
| Hosting | Vercel | Serverless functions, cron jobs, deployment |
| Security | Cloudflare | WAF, DDoS, rate limiting, CDN, DNS |
| LLM | Anthropic Claude API | Agent reasoning |

---

## Design Documents

### [agents.md](./agents.md) — Agent Components (18 of 26 components)

How to build any agent in the system. Covers the standard agent architecture pattern, LLM integration with Claude API, structured output handling, data contracts with Supabase, execution model (sync/async, timeout handling on Vercel), observability, testing strategy, and code structure. Includes a full reference implementation of the signal-detector agent.

**Use when building:** source-scanner, signal-detector, market-classifier, opportunity-ranker, landscape-analyst, pain-extractor, concept-generator, concept-scorer, market-sizer, competitive-analyst, customer-validator, feasibility-assessor, economics-modeler, validation-synthesizer, business-designer, agent-architect, gtm-strategist, risk-analyst, resource-planner, blueprint-packager.

---

### [services.md](./services.md) — Service Components

How to build long-running, event-driven services. Covers the pipeline orchestrator state machine, event system using Supabase Realtime, scheduling and cron jobs, notification and publishing patterns, and the feedback loop design. Includes a full reference implementation of the pipeline-orchestrator.

**Use when building:** pipeline-orchestrator, watchlist-publisher (service portion), feedback-loop.

---

### [gates.md](./gates.md) — Gate Components

How to build decision gates between pipeline phases. Covers automatic/manual/hybrid gate types, threshold configuration, human review workflows, state management, notifications, and configuration UI. Includes a full reference implementation of the Phase 1→2 gate (concept-selector).

**Use when building:** Phase 0→1 gate, concept-selector (Phase 1→2 gate), Phase 2→3 gate.

---

### [ui.md](./ui.md) — UI Components (Next.js)

How to build the platform's frontend. Covers Next.js App Router architecture, Supabase integration (auth, RLS, Realtime), all key UI surfaces (pipeline dashboard, watchlist, concept review, validation detail, blueprint viewer), component library approach (shadcn/ui + Tailwind), state management, performance, and authentication. Includes a full reference implementation of the pipeline dashboard page.

**Use when building:** review-dashboard, concept-selector UI, watchlist-publisher dashboard, platform shell, any new UI surface.

---

### [data-layer.md](./data-layer.md) — Data Layer (Supabase)

The complete database design. Includes CREATE TABLE statements for all 15+ tables, Row Level Security policies, Realtime configuration, Edge Functions, database functions and triggers, storage buckets, migration strategy, performance tuning, and reference SQL for common queries.

**Read first:** Every other component depends on the data layer. Start here when setting up the project.

---

### [infrastructure.md](./infrastructure.md) — Infrastructure (Vercel + Cloudflare)

How to deploy, secure, and operate the platform. Covers Vercel deployment architecture, serverless function design for agents, Cloudflare DNS/WAF/rate limiting/caching, end-to-end security architecture, monitoring and observability, CI/CD pipeline, scaling, and disaster recovery. Includes reference configuration files (vercel.json, Cloudflare rules, GitHub Actions workflows).

**Read first:** Alongside the data layer, this is foundational. Set up infrastructure before building components.

---

## Reading Order

For setting up the project from scratch:

1. **infrastructure.md** — Set up Vercel, Cloudflare, CI/CD
2. **data-layer.md** — Create the Supabase database and schema
3. **agents.md** — Understand the agent pattern before building any agent
4. **services.md** — Understand the orchestrator before connecting agents
5. **gates.md** — Understand gate logic before wiring phase transitions
6. **ui.md** — Build the frontend once the backend is operational

For implementing a specific component, read its type-level design doc plus the data-layer doc for the relevant table schemas.
