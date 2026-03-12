# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Company Builder is an AI-powered pipeline for discovering, validating, and building startup ideas. It uses 22 specialized AI agents orchestrated through a 4-phase pipeline:

- **Phase 0 (Discovery):** SourceScanner, SignalDetector, MarketClassifier, OpportunityRanker, WatchlistPublisher
- **Phase 1 (Ideation):** LandscapeAnalyst, PainExtractor, ConceptGenerator, ConceptScorer, ConceptSelector
- **Phase 2 (Validation):** MarketSizer, CompetitiveAnalyst, CustomerValidator, FeasibilityAssessor, EconomicsModeler, ValidationSynthesizer
- **Phase 3 (Blueprint):** BusinessDesigner, AgentArchitect, GtmStrategist, RiskAnalyst, ResourcePlanner, BlueprintPackager

Plus 3 services: PipelineOrchestrator, FeedbackLoop, WatchlistPublisher.

## Development Commands

All commands run from the `codebase/` directory:

```bash
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Build the web app
npm run typecheck    # TypeScript check across all packages (tsc --build)
```

No test runner is configured yet.

## Monorepo Structure

```
codebase/
├── apps/web/                    # Next.js 14 App Router application
├── packages/
│   ├── types/                   # Shared TypeScript types (@company-builder/types)
│   ├── database/                # Supabase client, queries, migrations (@company-builder/database)
│   ├── core/                    # Agent base class, pipeline state machine, utilities (@company-builder/core)
│   └── agents/                  # All 22 agent implementations (@company-builder/agents)
```

npm workspaces (no Turbo/Nx). Packages are referenced as `@company-builder/{name}` and transpiled via `next.config.mjs` `transpilePackages`.

## Tech Stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript (strict)
- **Database:** Supabase (Postgres + RLS + Realtime)
- **AI:** Anthropic Claude API via `@anthropic-ai/sdk` — agents default to `claude-sonnet-4-6` with 16,384 max tokens
- **Hosting:** Vercel (serverless functions, 300s timeout for agents)
- **UI:** Tailwind CSS + shadcn/ui (Radix primitives) + Recharts
- **Validation:** Zod for agent input/output schemas

## Architecture

### Agent Pattern (core abstraction)

All agents extend the abstract `Agent` base class at `packages/core/src/agents/Agent.ts`. Subclasses implement three abstract methods:

1. `buildPrompts(input)` — construct system prompt + user message
2. `parseResponse(response)` — extract structured data from LLM response
3. `getOutputTableName()` — Supabase table for persistence

Optional: `getInputSchema()` and `getOutputSchema()` return Zod schemas for validation.

The base class handles the full lifecycle: create agent_run record → validate input → build prompts → call LLM with retries → parse/validate output → persist to Supabase → log cost metrics.

### Agent implementations

Located in `packages/agents/src/phase-{0,1,2,3}/`. Each is a single file (e.g., `SignalDetectorAgent.ts`). Zod schemas live in `packages/agents/src/schemas/`.

### API Routes

All agent endpoints follow the pattern `apps/web/app/api/agents/{agent-name}/route.ts` and share the same structure:
- Auth: either `CRON_SECRET` bearer token (for cron/orchestrator) or Supabase user session
- Instantiate agent with env vars, run, return JSON
- Error handling via `_shared/errorHandler.ts`
- All have `export const maxDuration = 300`

### Pipeline Orchestration

- **State machine** at `packages/core/src/pipeline/` manages pipeline items through phases
- **Cron jobs** (defined in `vercel.json`):
  - `/api/cron/orchestrator-tick` — every minute
  - `/api/cron/phase-0-scan` — hourly
  - `/api/cron/feedback-loop` — weekly (Sunday midnight)
- Agents communicate indirectly through Supabase (never call each other directly)

### UI Route Groups

The web app uses Next.js route groups in `apps/web/app/`:
- `(dashboard)` — pipeline overview
- `(discovery)` — watchlist, opportunities
- `(ideation)` — concepts, comparison, review
- `(validation)` — validation details, synthesis
- `(blueprint)` — business model, GTM plan, risk, resources
- `(settings)` — sources, gate rules, scoring
- `(monitoring)` — agent run monitoring
- `(review)` — pipeline review interface

### Multi-Tenancy

Every database table has `account_id`. RLS policies enforce account isolation. Migration 013 completes account isolation.

## Database

- **13 SQL migrations** in `packages/database/migrations/` (001–013)
- Key tables: `sources`, `content_items`, `signals`, `market_opportunities`, `concepts`, `validations`, `blueprints`, `pipeline_items`, `gate_decisions`, `agent_runs`, `user_annotations`, `feedback_events`
- Generated types at `packages/database/src/types.ts`
- Query modules at `packages/database/src/queries/`

## Environment Variables

See `codebase/.env.example`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_APP_URL` (default `http://localhost:3000`)
- `CRON_SECRET` (protects cron endpoints)

## Key Conventions

- TypeScript strict mode with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- Path alias `@/*` maps to `apps/web/*`
- Agent naming: kebab-case for routes/files (`signal-detector`), PascalCase for classes (`SignalDetectorAgent`)
- shadcn/ui components in `apps/web/components/ui/`; custom components in `components/shared/` and `components/layout/`
- Tailwind theme has custom phase colors: `discovery` (teal), `ideation` (purple), `validation` (amber), `blueprint` (green)

## Spec Documentation

Detailed design docs live in `/spec/`:
- `vision.md` — product vision
- `process.md` — full pipeline description
- `technical-design/` — agents, services, gates, UI, data-layer, infrastructure
- `components/` — 27 individual component specifications
