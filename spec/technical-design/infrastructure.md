# Company Builder — Technical Infrastructure Design

This document defines the deployment infrastructure for Company Builder, covering Vercel for serverless hosting, Cloudflare for edge security and performance, and how they integrate to create a scalable, secure platform.

---

## 1. Vercel Deployment Architecture

### 1.1 Project Structure

**Monorepo Organization**

Company Builder uses a monorepo structure to manage frontend, backend, and agent components:

```
company-builder/
├── apps/
│   ├── web/                    # Next.js app (frontend + pages)
│   │   ├── app/                # App router
│   │   ├── pages/              # API routes, page handlers
│   │   └── public/             # Static assets
│   │
│   └── dashboard/              # Internal review dashboard UI
│       ├── components/         # Dashboard React components
│       └── pages/              # Dashboard pages
│
├── packages/
│   ├── agents/                 # Agent implementation library
│   │   ├── src/agents/         # Individual agent definitions
│   │   │   ├── source-scanner/
│   │   │   ├── signal-detector/
│   │   │   ├── market-classifier/
│   │   │   └── ... (22 more agents)
│   │   └── src/types/          # Shared types and schemas
│   │
│   ├── core/                   # Core platform logic
│   │   ├── src/pipeline/       # Pipeline orchestration
│   │   ├── src/storage/        # Data store interfaces
│   │   └── src/utils/          # Shared utilities
│   │
│   ├── database/               # Supabase client and migrations
│   │   ├── migrations/
│   │   └── src/clients/
│   │
│   └── types/                  # Shared TypeScript types
│       └── src/
│
├── vercel.json                 # Vercel configuration
├── turbo.json                  # Turborepo configuration
└── package.json
```

**Deployment Units**

- **Web App (apps/web)**: Next.js SSR and API routes deployed to Vercel
- **Dashboard (apps/dashboard)**: Internal review interface deployed to Vercel on a protected subdomain
- **Agents (packages/agents)**: Compiled to Node.js functions, run as Vercel serverless functions
- **Static Assets**: Hosted in `/public`, served by Vercel + Cloudflare CDN

### 1.2 Deployment Strategy

**Preview Deployments**

Every pull request triggers an automatic preview deployment:

- New preview URL generated automatically (e.g., `company-builder-pr-42.vercel.app`)
- Attached to PR for review and testing
- Uses same environment variables as production (non-secret ones; secrets redacted for previews)
- Automatically deleted when PR is closed
- Useful for testing agent behavior before merging

**Production Deployments**

Deployments from `main` branch go to production:

- Custom domain via Cloudflare (e.g., `app.company-builder.ai`)
- Immutable deployment snapshots for easy rollback
- Environment variables pulled from Vercel project settings
- Database migrations run during build (or manually pre-deploy)
- Zero-downtime deployment with automatic traffic shifting

**Staging Environment (Optional)**

For larger teams, a staging environment can be maintained on a separate Vercel project:

- Deployed from `staging` branch
- Uses a staging Supabase project (separate database)
- Validates database migrations and agent behavior before production

### 1.3 Environment Configuration

**Environment Variables**

Vercel project settings store all secrets and configuration:

```
# Frontend/Client-side (exposed in browser, public)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Backend/Server-side (kept secret)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Full database access
ANTHROPIC_API_KEY=sk-ant-...           # Claude API access
ANTHROPIC_API_VERSION=2024-06-01       # API version

# Pipeline & Agent Configuration
PIPELINE_POLLING_INTERVAL_MS=5000      # Check for new work every 5s
AGENT_TIMEOUT_MS=300000                # 5-minute timeout per agent
REDIS_CONNECTION_URL=redis://...       # Optional: for job queue

# Vercel Function Configuration
VERCEL_ENV=production|preview           # Populated by Vercel automatically
VERCEL_URL=app.company-builder.ai      # Domain, populated by Vercel

# Integration APIs
SERPAPI_API_KEY=...                    # Google search API for research agents
NEWSAPI_KEY=...                        # News API for signal detection
ARXIV_API_KEY=...                      # ArXiv access (public, no key needed)
CRUNCHBASE_API_KEY=...                 # Company data

# Observability
SENTRY_DSN=https://...@sentry.io/...   # Error tracking
DATADOG_API_KEY=...                    # Optional: performance monitoring
```

**Environment Setup by Stage**

| Variable | Development | Preview | Production |
|----------|-------------|---------|------------|
| `NODE_ENV` | `development` | `production` | `production` |
| `NEXT_PUBLIC_*` | Local override | Vercel vars | Vercel vars |
| `SUPABASE_SERVICE_ROLE_KEY` | Dev Supabase | Staging Supabase | Prod Supabase |
| `ANTHROPIC_API_KEY` | Dev key (rate-limited) | Shared staging key | Prod key |
| `VERCEL_ENV` | (N/A) | `preview` | `production` |

**Secrets Rotation**

Best practices for API keys:

- Store all secrets in Vercel's encrypted environment settings (not in code or `.env`)
- Rotate Anthropic API keys quarterly or on account compromise
- Store Supabase service role key securely; never commit to Git
- Use Vercel's "Preview Deployment Protection" to hide secrets from PRs
- Automated key rotation for database passwords (use Supabase's built-in key management)

### 1.4 Vercel Configuration (vercel.json)

```json
{
  "buildCommand": "turbo run build --filter=web --filter=dashboard",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install",
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs18.x",
      "memory": 1024,
      "maxDuration": 60
    },
    "api/agents/**/*.ts": {
      "runtime": "nodejs18.x",
      "memory": 2048,
      "maxDuration": 300
    }
  },
  "regions": ["sfo1", "iad1"],
  "routes": [
    {
      "src": "/api/health",
      "headers": {
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    },
    {
      "src": "/api/agents/(.*)",
      "headers": {
        "Cache-Control": "no-cache"
      }
    },
    {
      "src": "/dashboard/(.*)",
      "headers": {
        "x-robots-tag": "noindex, nofollow"
      }
    }
  ],
  "crons": [
    {
      "path": "/api/cron/phase-0-scan",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/feedback-loop",
      "schedule": "0 2 * * 0"
    }
  ]
}
```

**Configuration Details:**

- `buildCommand`: Uses Turborepo to build only necessary apps for faster deployments
- `outputDirectory`: Points to Next.js build output
- `functions`: Specifies memory and timeout for different API route types
  - Standard API routes: 1GB memory, 60s timeout (Vercel free/pro)
  - Agent functions: 2GB memory, 300s timeout (requires Pro plan)
- `regions`: US-based regions for lower latency; add `"cdg1"` (Paris) for EU traffic
- `routes`: Cache headers prevent caching of API routes; dashboard marked as private
- `crons`: Two scheduled jobs (see Section 1.5)

### 1.5 Serverless Function Design

**API Structure**

```
apps/web/pages/api/
├── health.ts                    # Health check endpoint
├── pipeline/
│   ├── status.ts               # GET /api/pipeline/status
│   ├── concepts.ts             # GET /api/pipeline/concepts
│   └── trigger-phase.ts        # POST /api/pipeline/trigger-phase
│
├── agents/
│   ├── [agentId].ts            # POST /api/agents/source-scanner
│   ├── [agentId]/results.ts    # GET /api/agents/source-scanner/results
│   └── [agentId]/logs.ts       # GET /api/agents/source-scanner/logs
│
├── cron/
│   ├── phase-0-scan.ts         # Runs every 6 hours
│   └── feedback-loop.ts        # Runs weekly (Sunday 2 AM UTC)
│
└── internal/
    ├── dashboard-auth.ts       # Protected: review dashboard authentication
    └── admin-override.ts       # Protected: gate overrides and manual actions
```

**Example: Trigger Agent Function**

```typescript
// apps/web/pages/api/agents/[agentId].ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAgent } from '@company-builder/agents';
import { trackEvent } from '@sentry/nextjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  maxDuration: 300, // 5 minutes for agent runs
  memory: 2048,
};

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { agentId } = req.query as { agentId: string };
  const { jobId, inputs } = await req.json();

  try {
    // Get agent definition
    const AgentClass = getAgent(agentId);
    if (!AgentClass) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Instantiate and run agent
    const agent = new AgentClass({ supabase, anthropicKey: process.env.ANTHROPIC_API_KEY! });
    const result = await agent.execute(inputs, {
      timeout: 280000, // 4m 40s (leave 20s buffer for Vercel overhead)
      jobId,
    });

    // Store result
    await supabase
      .from('agent_executions')
      .insert({
        job_id: jobId,
        agent_id: agentId,
        status: 'completed',
        result,
        started_at: new Date(),
        completed_at: new Date(),
      });

    trackEvent('agent_execution_success', {
      agentId,
      jobId,
      duration: result.duration,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    trackEvent('agent_execution_error', {
      agentId,
      jobId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    await supabase
      .from('agent_executions')
      .insert({
        job_id: jobId,
        agent_id: agentId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        started_at: new Date(),
        completed_at: new Date(),
      });

    return NextResponse.json({ error: 'Agent execution failed' }, { status: 500 });
  }
}
```

**Example: Phase 0 Cron Job**

```typescript
// apps/web/pages/api/cron/phase-0-scan.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAgent } from '@company-builder/agents';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  maxDuration: 300,
};

export default async function handler(req: NextRequest) {
  // Verify cron secret (Vercel includes a header)
  const cronSecret = req.headers.get('x-vercel-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Trigger Phase 0 agents in sequence: source-scanner → signal-detector → market-classifier → opportunity-ranker
    const scanRun = await supabase
      .from('pipeline_runs')
      .insert({
        phase: 0,
        status: 'in_progress',
        started_at: new Date(),
      })
      .select()
      .single();

    // Queue source-scanner
    const scanJob = await supabase
      .from('jobs')
      .insert({
        type: 'agent',
        agent_id: 'source-scanner',
        pipeline_run_id: scanRun.data.id,
        status: 'queued',
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      pipelineRunId: scanRun.data.id,
      initialJobId: scanJob.data.id,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Cron execution failed' }, { status: 500 });
  }
}
```

**Cron Schedule Details**

Two automated cron jobs drive the platform:

1. **Phase 0 Scan (every 6 hours)**
   - Runs at 00:00, 06:00, 12:00, 18:00 UTC
   - Triggers source-scanner to ingest latest content
   - Chains through signal-detector, classifier, ranker
   - Updates watchlist every 6 hours
   - Cost: ~10 function calls × 5 sec = 50s compute/day

2. **Feedback Loop (weekly, Sunday 2 AM UTC)**
   - Analyzes outcomes from the prior week
   - Retrains scoring models (Phase 1.4 and Phase 2.6)
   - Updates agent system prompts if needed
   - Lighter computational load, can run longer

### 1.6 Edge vs. Serverless Function Decisions

**Serverless Functions** (`/api/*`)

Use for agent execution and heavy computation:

- Source-scanner, signal-detector, market-classifier (data processing)
- All Phase 1–3 agents (LLM calls, analysis)
- Pipeline orchestration logic
- Rationale: Need full compute resources, external API access, longer timeouts

**Edge Functions** (future optimization)

For low-latency, lightweight operations:

- Static watchlist queries (read-only)
- Dashboard analytics aggregation
- Request authentication/authorization
- HTTP header manipulation (redirects, caching)
- Deploy via Vercel Edge Network using `middleware.ts`

Example middleware (optional):

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Protect dashboard from public access
  if (url.pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('dashboard_token')?.value;
    if (!token || !validateDashboardToken(token)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect old URLs (edge function is instant)
  if (url.pathname.startsWith('/old-path')) {
    return NextResponse.redirect(new URL('/new-path', request.url), { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/old-path/:path*'],
};
```

### 1.7 Build and Deploy Pipeline

**Build Process** (runs on Vercel)

```bash
# 1. Install dependencies
pnpm install

# 2. Run Turborepo build (only builds changed packages)
turbo run build --filter=web --filter=dashboard --filter=agents

# 3. Run database migrations (pre-deploy)
supabase migration up --db-url $DATABASE_URL

# 4. Run tests (optional but recommended)
turbo run test --filter=web --filter=agents

# 5. Build output ready
# → apps/web/.next deployed to Vercel
# → agents bundled into function handlers
```

**Vercel Build Settings** (in project dashboard)

- Build Command: `turbo run build --filter=web --filter=dashboard`
- Output Directory: `apps/web/.next`
- Install Command: `pnpm install`
- Node.js Version: 18.x or 20.x
- Automatically rebuild on: pushes to `main`, `staging`; every PR

**Rollback Strategy**

Vercel keeps the last 50 deployments accessible:

1. View all deployments: Vercel dashboard → Deployments tab
2. Click a prior deployment snapshot
3. Promote to production with one click
4. DNS immediately switches to the previous version
5. For database: restore Supabase backup from timeline (covers last 7 days on free tier, 30+ days on paid)

**Zero-Downtime Deployment**

- Vercel automatically gradients traffic to new builds over 60s
- Keep-alive connections stay on old build (no disruption)
- New connections route to new build
- If new build fails health checks, rollback automatic

---

## 2. Vercel Serverless Functions for Agents

### 2.1 Agent Execution Mapping

**How Agents Run on Vercel**

Each agent has a corresponding API endpoint that triggers its execution:

```
Agent Definition (packages/agents/src/agents/*)
    ↓
API Handler (apps/web/pages/api/agents/[agentId].ts)
    ↓
Vercel Serverless Function
    ↓
Agent Instance
    ↓
LLM API (Claude, OpenAI)
    ↓
Data Store (Supabase)
```

**Agent Execution Flow**

```typescript
// 1. Request arrives at API
POST /api/agents/source-scanner
{
  "jobId": "job-12345",
  "inputs": {
    "startDate": "2024-03-01",
    "endDate": "2024-03-10",
    "sources": ["hacker-news", "product-hunt", "arxiv"]
  }
}

// 2. Vercel function handler instantiates agent
const agent = new SourceScannerAgent({ supabase, anthropic });

// 3. Agent executes with timeout protection
const result = await Promise.race([
  agent.execute(inputs),
  timeout(280_000) // 4m 40s timeout
]);

// 4. Result persisted to database
await supabase.from('agent_executions').insert({
  job_id: jobId,
  agent_id: 'source-scanner',
  status: 'completed',
  result,
  duration: Date.now() - startTime,
});

// 5. Response sent back
{
  "success": true,
  "jobId": "job-12345",
  "result": { ... },
  "duration": 23450
}
```

### 2.2 Timeout Management

**Vercel Function Limits**

| Plan | Max Duration | Memory |
|------|-------------|--------|
| Free / Hobby | 60 seconds | 512 MB |
| Pro | 60 seconds (standard), 300 seconds (background) | 1024–3008 MB |
| Enterprise | 900 seconds | 3008+ MB |

**Problem:** Most agents (especially Phase 0 scanning) need longer than 60s.

**Solutions:**

**Option A: Break Work into Steps (Recommended)**

Instead of running the entire Phase 0 pipeline in one function, break it into async jobs:

```typescript
// Job 1: Source-scanner (scan and normalize)
POST /api/agents/source-scanner?jobId=j1
→ Takes 45 seconds
→ Stores results in DB with status "completed"

// Polling (via frontend or cron)
GET /api/pipeline/status?jobId=j1
→ Returns status "completed"

// Job 2: Signal-detector (analyze stored results)
POST /api/agents/signal-detector?jobId=j2&previousJobId=j1
→ Loads data from previous job
→ Analyzes for signals
→ Takes 30 seconds

// Job 3: Market-classifier
// Job 4: Opportunity-ranker
// ...
```

**Option B: Use Vercel Pro with Background Functions**

For long-running agents, use background functions (available on Pro/Enterprise):

```typescript
// apps/web/pages/api/agents/long-running/[agentId].ts
export const config = {
  maxDuration: 300, // 5 minutes allowed
  memory: 2048,
};

// Request doesn't wait for completion
POST /api/agents/long-running/source-scanner?jobId=j1
→ Returns immediately with 202 (Accepted)
→ Function continues running in background
→ Results available via polling or webhook
```

**Option C: Use an External Job Queue**

For very complex workflows, use a dedicated job queue (Redis, Bull, or AWS SQS):

```typescript
// Trigger via Vercel function
POST /api/agents/queue
{
  "agentId": "source-scanner",
  "jobId": "job-12345",
  "inputs": { ... }
}

// Vercel function enqueues the job (fast, < 1s)
// Separate worker pulls from queue and executes
// Worker can run anywhere (separate Node server, Lambda, etc.)
// Results stored in DB, polled by frontend
```

**Recommendation for Company Builder**

Use **Option A (step-based execution) + Vercel Pro**:

1. Phase 0 agents run as individual steps: source-scanner (30s) → signal-detector (20s) → classifier (25s) → ranker (20s)
2. Each step stores output, triggers the next via webhook or cron
3. Phases 1–3 are shorter (< 120s each), fit in single function calls
4. Total pipeline completes in ~10 minutes sequentially, but can run in parallel if multiple opportunities are being evaluated

### 2.3 Long-Running Agent Workarounds

**Workaround 1: Async Job Architecture**

```
┌─────────────────────────────────────┐
│ User Triggers Phase 0 Scan          │
└──────────────┬──────────────────────┘
               ↓
         API: POST /api/cron/phase-0-scan (returns immediately)
               ↓
    ┌──────────────────────────────────┐
    │ Creates DB entry for run         │
    │ Queues Job 1: source-scanner     │
    │ Returns { pipelineRunId, ... }   │
    └──────────────┬───────────────────┘
                   ↓
    Function ends (< 5s)

    Meanwhile (asynchronously):
    Job 1 runs → completes → marks "ready for Job 2"
    Job 2 runs → completes → marks "ready for Job 3"
    Job 3 runs → completes → marks "ready for Job 4"
    Job 4 runs → completes → updates watchlist

    User polls: GET /api/pipeline/status?runId=...
    → { status: "in_progress", currentJob: "signal-detector", ... }
    → eventually { status: "completed", watchlist: [...] }
```

Implementation example:

```typescript
// apps/web/pages/api/jobs/process.ts
// This function is triggered independently for each job
export const config = {
  maxDuration: 300,
  memory: 2048,
};

export default async function handler(req: NextRequest) {
  const { jobId } = req.query;

  // Load job from DB
  const job = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  // Load agent and execute
  const AgentClass = getAgent(job.data.agent_id);
  const agent = new AgentClass({ supabase, anthropic });

  const startTime = Date.now();
  try {
    const result = await withTimeout(
      agent.execute(job.data.inputs),
      280_000
    );

    // Mark job complete, prepare next job
    await supabase.from('jobs').update({
      status: 'completed',
      result,
      completed_at: new Date(),
    }).eq('id', jobId);

    // Trigger next job in sequence (if exists)
    const nextJob = await queueNextJob(job.data.pipeline_run_id);

    return NextResponse.json({ success: true, nextJobId: nextJob?.id });
  } catch (error) {
    await supabase.from('jobs').update({
      status: 'failed',
      error: error.message,
      completed_at: new Date(),
    }).eq('id', jobId);

    return NextResponse.json({ error: 'Job failed' }, { status: 500 });
  }
}
```

**Workaround 2: Webhook-Triggered Job Chain**

When Job A completes, it calls a webhook to trigger Job B:

```typescript
// Inside Agent A's execute() method
const result = await llm.generate(...);

// On completion, notify pipeline orchestrator
await fetch('https://app.company-builder.ai/api/jobs/webhook', {
  method: 'POST',
  headers: { 'x-job-token': process.env.JOB_WEBHOOK_SECRET },
  body: JSON.stringify({
    completedJobId: jobId,
    pipelineRunId: runId,
    nextAgentId: 'signal-detector',
    nextJobInputs: { /* computed from result */ }
  })
});

// Pipeline orchestrator endpoint receives this, queues next job
POST /api/jobs/webhook
→ Validates token
→ Creates new job for signal-detector
→ Enqueues it for processing
```

**Workaround 3: Polling Loop (Simple, Client-Side)**

For interactive scenarios (user triggers validation, wants to see progress):

```typescript
// Frontend component
const [status, setStatus] = useState('pending');
const [results, setResults] = useState(null);

useEffect(() => {
  const poll = async () => {
    const response = await fetch(`/api/pipeline/status?runId=${runId}`);
    const data = await response.json();
    setStatus(data.status);

    if (data.status === 'completed') {
      setResults(data.results);
      clearInterval(interval);
    }
  };

  const interval = setInterval(poll, 2000); // Poll every 2s
  return () => clearInterval(interval);
}, [runId]);

return <div>Status: {status}. Results: {results ? JSON.stringify(results) : 'Loading...'}</div>;
```

### 2.4 Concurrency and Cold Start Considerations

**Cold Start Problem**

When a Vercel function hasn't been called in a while, it takes 1–2 seconds to initialize before code runs. For agents:

- First call: ~2s cold start + 20s agent execution = 22s total
- Subsequent calls: ~0.5s warm start + 20s agent execution = 20.5s total

**Mitigation Strategies**

1. **Keep functions warm** (simple approach)
   - Call a dummy endpoint every 5 minutes
   - Use a cron job to trigger `/api/health`

2. **Minimize bundle size** (reduces cold start)
   - Tree-shake unused dependencies
   - Use dynamic imports for heavy libraries
   - Keep agent implementations lightweight

3. **Use provisioned concurrency** (Pro/Enterprise)
   - Vercel Enterprise allows pre-warming functions
   - Costs extra but eliminates cold start entirely

4. **Accept the latency** (practical approach)
   - Document that first agent run may take 20–25s
   - Show progress indicator to users
   - Most runs are warm, so typical latency is acceptable

**Concurrency Management**

If multiple agents run in parallel (e.g., scoring 10 concepts simultaneously):

- Each agent execution uses one Vercel function invocation
- Vercel auto-scales to handle up to 1000 concurrent functions per project (Pro plan)
- Each function instance uses 1–2GB memory
- Total cost scales with concurrent usage

**Cost Optimization**

- Phase 0 runs sequentially every 6 hours (low concurrency)
- Phases 1–3 can run in parallel, but typically 1–3 concepts at a time
- Estimated monthly costs:
  - Phase 0 scans: 4 runs/day × 0.5s = 2000 function-seconds/month
  - Phases 1–3: ~50 function-calls/month, 30s avg = 1500 function-seconds
  - **Total: ~3500 function-seconds/month** (well under Vercel Pro limits)

---

## 3. Cloudflare Configuration

Company Builder sits behind Cloudflare for edge caching, security, and DDoS protection. Cloudflare sits between users and Vercel.

```
User Browser
    ↓
Cloudflare Edge (security, cache, WAF)
    ↓
Vercel (app.company-builder.ai → Vercel IP)
    ↓
Supabase Database
```

### 3.1 DNS Setup

**Cloudflare DNS Records**

Register your domain (e.g., `company-builder.ai`) with Cloudflare:

```
Type    Name                TTL     Proxy   Content
────────────────────────────────────────────────────────
CNAME   @                   Auto    CF      cname.vercel.com.
TXT     _acme-challenge     Auto    Off     (Vercel SSL cert)
CNAME   api                 Auto    CF      cname.vercel.com.
CNAME   dashboard           Auto    CF      cname.vercel.com. (protected)
CNAME   static              Auto    CF      (S3 or CDN for assets)
MX      @                   3600    Off     mail.company-builder.ai. (email)
TXT     @                   3600    Off     v=spf1 include:sendgrid.net ~all
```

**Cloudflare Proxy Status**

- `CF` (orange cloud) = Cloudflare proxies traffic (recommended for most records)
- `Off` (gray cloud) = Direct DNS lookup, no Cloudflare proxy (use for email/non-web services)

**SSL/TLS Configuration**

In Cloudflare dashboard → SSL/TLS → Overview:

- Mode: `Full (strict)` — Vercel has valid SSL cert, Cloudflare validates it
- Minimum TLS Version: TLS 1.2
- Always Use HTTPS: Enabled (redirect HTTP → HTTPS)

### 3.2 WAF Rules (Web Application Firewall)

**Core Threat Rules** (Cloudflare managed)

Enable in Security → WAF → Managed Rules:

```
1. Cloudflare OWASP ModSecurity Core Ruleset
   - Blocks SQL injection, XSS, LFI, RFI
   - Sensitivity: Medium
   - Action: Challenge or Block

2. Cloudflare Free Tier Managed Rules
   - Blocks known malware signatures
   - Action: Block

3. Rate Limiting (Security → Rate limiting)
   - Rule 1: /api/* → 100 requests per minute per IP
   - Rule 2: /api/agents/* → 50 requests per minute per IP
   - Action: Challenge (CAPTCHA) for 15 minutes
```

**Custom WAF Rules**

```
Rule 1: Block known bot user agents
    Condition: User Agent matches regex (bad bots)
    Action: Block

Rule 2: Rate limit by IP + endpoint
    Condition: (cf.threat_score > 50)
    Action: Block

Rule 3: Require authentication for /dashboard
    Condition: cf.path matches /dashboard/.*
    Action: Block (let app handle auth)

Rule 4: Block suspicious API patterns
    Condition: (cf.threat_score > 30) AND (cf.bot_management.score < 30)
    Action: Challenge
```

**API Rate Limiting**

```
Rule: General API rate limit
    Path: /api/*
    Requests per minute: 100
    Threshold: Per IP address
    Action: Challenge (CAPTCHA)
    Duration: 15 minutes

Rule: Aggressive agent endpoint limiting
    Path: /api/agents/*
    Requests per minute: 20
    Threshold: Per IP address
    Action: Challenge
    Duration: 60 minutes
```

### 3.3 Rate Limiting for Agent Endpoints

Prevent abuse of expensive agent endpoints:

**Anonymous Users** (no API key)

```
POST /api/agents/source-scanner
    Max: 1 request per day per IP
    Cost: ~5-10s compute, $0.10

POST /api/agents/concept-generator
    Max: 5 requests per day per IP
    Cost: ~30s compute, $0.30
```

**Authenticated Users** (API key provided)

```
POST /api/agents/*
    Max: 100 requests per day per API key
    Max: 10 concurrent requests per API key
```

Implementation:

```typescript
// Middleware to check rate limits
// apps/web/middleware.ts
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  analytics: true,
  prefix: 'ratelimit',
});

export async function middleware(request: NextRequest) {
  // Check if agent endpoint
  if (request.nextUrl.pathname.startsWith('/api/agents/')) {
    const ip = request.ip || 'unknown';
    const { success, reset } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429, headers: { 'Retry-After': reset.toString() } }
      );
    }
  }

  return NextResponse.next();
}
```

### 3.4 Bot Protection

Cloudflare Bot Management (Enterprise):

```
Verified Bots (Allow)
- Search engines (Google, Bing)
- RSS readers
- Known tools (Slack bot, Discord bot)

Suspected Bots (Challenge)
- HTTP clients without User-Agent
- Suspicious request patterns
- Known datacenter IPs

Blocked Bots
- Credential stuffers
- Known scrapers
- Malicious bot networks
```

For free tier, use simpler approaches:

```
// Check if request looks like a bot
const isBot = /bot|crawler|spider|scraper/i.test(req.headers['user-agent'] || '');
if (isBot && req.nextUrl.pathname.startsWith('/api/agents/')) {
  return NextResponse.json({ error: 'Automated access not allowed' }, { status: 403 });
}
```

### 3.5 DDoS Protection

Cloudflare automatically includes DDoS protection on all plans:

**Network DDoS Protection**
- Automatically mitigates L3/L4 attacks (packet floods)
- No configuration needed
- Always active

**Application DDoS Protection** (Enterprise)
- Detects and mitigates application-layer attacks
- Can block based on request patterns, geographic origin, etc.

**Mitigation Rules** (all plans)

In Security → DDoS:

```
Sensitivity level: High
Challenge unrecognized traffic: Enabled
HTTP Flood Protection: Enabled
```

**Geo-Blocking** (optional, for compliance)

If Company Builder is US-only:

```
Security → Settings → Challenge CAPTCHA
    Condition: Country != US
    Action: Challenge
```

### 3.6 Caching Strategy

**Page Rules / Cache Rules** (what to cache, what not to)

**Cache Everything** (static assets)

```
Rule: Static assets
    Path: /public/*
    Cache Level: Cache Everything
    TTL: 30 days

Rule: Watchlist snapshot (read-only)
    Path: /api/watchlist/snapshot
    Cache Level: Cache Everything
    TTL: 1 hour (updated hourly by Phase 0)
```

**Bypass Cache** (dynamic API responses)

```
Rule: Agent endpoints
    Path: /api/agents/*
    Cache Level: Bypass
    (Never cache, always hit Vercel)

Rule: Pipeline status
    Path: /api/pipeline/status*
    Cache Level: Bypass
    (Real-time, don't cache)

Rule: Dashboard
    Path: /dashboard/*
    Cache Level: Bypass
```

**Cache Key** (for customized caching)

```
Rule: Cache by user + path
    Path: /api/user/*
    Cache Key: {request.url} + {request.headers['authorization']}
    TTL: 5 minutes
    (Different users get different cached content)
```

**Cache TTL Settings**

```
Browser Cache TTL: 30 minutes (how long user's browser caches)
Edge Cache TTL: 1 hour (how long Cloudflare edge caches)
```

### 3.7 Page Rules and Transform Rules

**Page Rules** (legacy, but still useful)

```
Rule 1: Never cache /dashboard
    URL: app.company-builder.ai/dashboard*
    Setting: Cache Level → Bypass

Rule 2: Aggressive caching for static
    URL: app.company-builder.ai/public/*
    Setting: Cache Level → Cache Everything
    Setting: Browser Cache TTL → 30 days

Rule 3: API request compression
    URL: app.company-builder.ai/api/*
    Setting: Automatic HTTPS Rewrites → On
```

**Transform Rules** (newer, more powerful)

```
Rule 1: Add security headers
    Condition: All requests
    Action: Add header
        Header: Strict-Transport-Security
        Value: max-age=31536000; includeSubDomains

Rule 2: Remove server version header
    Condition: All requests
    Action: Remove header
        Header: Server

Rule 3: Redirect /old to /new
    Condition: cf.path eq "/old-page"
    Action: Redirect
        Target: https://app.company-builder.ai/new-page
        Status: 301
```

---

## 4. Security Architecture

### 4.1 End-to-End Request Flow

**Typical Request Path**

```
1. User opens https://app.company-builder.ai/dashboard
   (Browser)

2. DNS lookup
   → Cloudflare DNS: app.company-builder.ai → CNAME → Vercel IP

3. TLS/SSL handshake
   → Browser ↔ Cloudflare edge (TLS 1.3)
   → Cloudflare ↔ Vercel (TLS 1.3)

4. HTTP request through Cloudflare WAF
   → Checked against WAF rules
   → Rate limit checked
   → Bot score evaluated

5. Forwarded to Vercel
   → Next.js middleware runs (authentication check)
   → Page handler executes
   → Dashboard component rendered

6. Page makes API request
   GET /api/pipeline/status?runId=12345
   (includes Authorization header with user token)

7. Vercel API handler executes
   → Validates auth token
   → Queries Supabase for status
   → Returns response

8. Cloudflare evaluates response
   → Caches if applicable
   → Sends to browser

9. Browser receives encrypted response
   → Decrypts via TLS
   → Renders in DOM
```

### 4.2 API Key Management

**Where Secrets Live**

| Secret | Storage | Access | Rotation |
|--------|---------|--------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel Env | Server-side only | Quarterly |
| `ANTHROPIC_API_KEY` | Vercel Env | Server-side only | Quarterly |
| Integration keys (SerpAPI, NewsAPI) | Vercel Env | Server-side only | Annually |
| JWT secret (for dashboard auth) | Vercel Env | Server-side only | On compromise |
| User API keys (issued to customers) | Supabase DB (hashed) | User provides in header | User controls |

**Never in Code**

```
❌ DO NOT:
  - Hardcode in source files
  - Commit to Git (even on private repos)
  - Log or output to console
  - Send to client-side JavaScript

✅ DO:
  - Store in Vercel Environment Variables
  - Use env var names: SUPABASE_SERVICE_ROLE_KEY
  - Access via process.env.SUPABASE_SERVICE_ROLE_KEY
  - Rotate quarterly or on compromise
```

### 4.3 Supabase Service Role Key Security

The service role key grants full database access. Protect it carefully:

**Isolation**

```typescript
// ✅ GOOD: Service role only used on server
// apps/web/pages/api/admin/override.ts (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ← Service role
);

// ❌ BAD: Exposed to client
// app.tsx (client-side)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY! // ← Anon key only
);
```

**Row-Level Security (RLS)**

Enable RLS on all Supabase tables to enforce authorization:

```sql
-- Enable RLS on agent_executions
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own executions
CREATE POLICY "Users can view own executions"
  ON agent_executions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can do anything (for scheduled jobs)
CREATE POLICY "Service role full access"
  ON agent_executions
  USING (auth.role() = 'service_role');
```

**Key Rotation Process**

1. Generate new key in Supabase dashboard
2. Add to Vercel environment variables
3. Update production deployment
4. Wait 24 hours for any in-flight requests to complete
5. Delete old key from Supabase
6. Log the rotation for compliance

### 4.4 CORS Configuration

Allow only your domain to make API requests from browsers:

```typescript
// apps/web/lib/cors.ts
const allowedOrigins = [
  'https://app.company-builder.ai',
  'https://dashboard.company-builder.ai',
];

export function applyCORS(response: NextResponse, origin?: string): NextResponse {
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '3600');
  return response;
}

// Apply in API handlers
export default async function handler(req: NextRequest) {
  const origin = req.headers.get('origin');
  const response = NextResponse.json({ ... });
  return applyCORS(response, origin);
}
```

### 4.5 Content Security Policy (CSP) Headers

Prevent XSS attacks by restricting which external resources can be loaded:

```typescript
// Vercel Transform Rule or middleware
response.headers.set('Content-Security-Policy', `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.vercel.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' https: data:;
  font-src 'self' https://fonts.googleapis.com;
  connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL} https://api.anthropic.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`);

response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-XSS-Protection', '1; mode=block');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
```

### 4.6 Authentication Flow with Cloudflare

**Dashboard Authentication** (admin/review dashboard)

```
1. Admin logs in at /dashboard/login
   → Form POSTs to /api/internal/login (server-side)

2. Vercel function validates email/password
   → Queries Supabase for user
   → Checks password hash

3. On success, sets httpOnly cookie
   response.cookies.set('dashboard_token', jwt, {
     httpOnly: true,
     secure: true,
     sameSite: 'strict',
     maxAge: 86400 * 7 // 7 days
   });

4. Subsequent requests include cookie automatically
   → Middleware verifies token
   → Allows access to /dashboard/*

5. Cloudflare doesn't see the token
   → Cookie marked secure + httpOnly
   → Cloudflare just proxies the request
   → Only browser and Vercel see the token
```

**Public API Authentication** (customer API keys)

```
Customer makes request with API key header:
POST /api/agents/concept-generator
Authorization: Bearer sk-cbuilder-abcdef123456

Vercel function:
1. Extracts token from header
2. Queries Supabase for matching API key (hashed)
3. Checks rate limit and permissions
4. Executes agent on behalf of customer
```

---

## 5. Monitoring and Observability

### 5.1 Vercel Analytics and Logs

**Real User Metrics** (in Vercel dashboard)

Automatically collected:

```
- Page load time (p50, p75, p95)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Request count and error rate
- Serverless function duration and memory
```

**Vercel Logs**

Access via CLI:

```bash
vercel logs                          # Stream real-time logs
vercel logs --limit 100              # Last 100 log entries
vercel logs --since 2024-03-01       # Logs since date
vercel logs --until 2024-03-10       # Logs until date
vercel logs -q /api/agents           # Filter by path
```

Logs include:

```
2024-03-10T14:32:15.123Z [source-scanner] Starting source scan
2024-03-10T14:32:45.456Z [source-scanner] Processed 234 items from HN
2024-03-10T14:33:12.789Z [source-scanner] Job completed in 57s
2024-03-10T14:33:15.012Z [signal-detector] Starting signal detection
```

### 5.2 Cloudflare Analytics and Logs

**Analytics Engine** (Vercel dashboard → Analytics)

Provides:

```
- Request count by path
- Cache hit ratio
- Bandwidth usage
- Requests by country
- Bot traffic percentage
- Page load time distribution
```

**Access Logs** (Enterprise)

Cloudflare can send full request logs to:

- Datadog
- Splunk
- Sumo Logic
- S3 bucket
- Google Cloud Storage

Example S3 destination:

```
GET /dashboard/overview → cache HIT, 156ms
POST /api/agents/source-scanner → shield request, 2.1s
GET /public/logo.svg → cache HIT, 45ms
```

**GraphQL Analytics**

Query Cloudflare data programmatically:

```graphql
query {
  viewer {
    zones(filter: {nameIn: ["company-builder.ai"]}) {
      httpRequests1mGroups(limit: 100, filter: {datetime_geq: "2024-03-10T00:00:00Z"}) {
        dimensions {
          datetime
          path
          cacheStatus
        }
        sum {
          requests
          bytes
        }
      }
    }
  }
}
```

### 5.3 Error Tracking (Sentry)

Automatically capture and track errors:

**Setup**

```bash
npm install @sentry/nextjs
vercel env add SENTRY_DSN https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Configuration** (`sentry.client.config.js`)

```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV,
  tracesSampleRate: 0.1, // Sample 10% of transactions
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true, // Don't capture screenshots of sensitive content
    }),
  ],
  replaySessionSampleRate: 0.01, // Session replay for 1% of users
  replayOnErrorSampleRate: 1.0,   // Capture all replays on error
});
```

**Manual Error Capturing**

```typescript
import * as Sentry from '@sentry/nextjs';

try {
  await agent.execute(inputs);
} catch (error) {
  Sentry.captureException(error, {
    level: 'error',
    tags: {
      agentId: 'source-scanner',
      jobId: jobId,
    },
    extra: {
      inputs,
      jobStatus: 'in-progress',
    },
  });

  // Also log to Supabase for internal audit
  await supabase.from('error_log').insert({
    error_type: error.constructor.name,
    message: error.message,
    stack_trace: error.stack,
    context: { agentId, jobId },
    timestamp: new Date(),
  });
}
```

### 5.4 Uptime Monitoring

**Uptime Robot** (free service)

Monitor health endpoint every 5 minutes:

```
GET https://app.company-builder.ai/api/health

Response: { status: "ok", timestamp, dbLatency }

Alert if:
- Response time > 2s
- Status code != 200
- Down for > 5 minutes
```

**Status Page** (using Vercel or Statuspage.io)

Display uptime to users:

```
Company Builder Status
├─ App (99.95% uptime) ✓
├─ API (99.97% uptime) ✓
├─ Database (99.99% uptime) ✓
└─ Scheduled Jobs (99.80% uptime) ✓
```

### 5.5 Cost Monitoring

**Vercel Dashboard**

View usage and costs:

- Function invocations
- Serverless compute duration
- Edge function usage
- Bandwidth

**Supabase Dashboard**

View database usage:

- Storage (rows, index size)
- Egress bandwidth
- Real-time subscriptions

**Anthropic Dashboard**

Monitor API usage:

- Tokens consumed (input + output)
- Requests count
- Estimated monthly costs

**Multi-Service Cost Tracking**

Create a simple cost monitoring script:

```typescript
// Cron job: weekly cost report
async function weeklyQostReport() {
  const vercelUsage = await getVercelUsage(); // Via Vercel API
  const supabaseUsage = await getSupabaseUsage(); // Via Supabase API
  const anthropicUsage = await getAnthropicUsage(); // Via API
  const cloudflareUsage = await getCloudflareUsage(); // Via API

  const totalCost = {
    vercel: vercelUsage.cost,
    supabase: supabaseUsage.cost,
    anthropic: anthropicUsage.cost,
    cloudflare: cloudflareUsage.cost,
  };

  // Alert if over budget
  if (Object.values(totalCost).reduce((a, b) => a + b, 0) > MONTHLY_BUDGET) {
    await notifySlack(`Weekly cost: $${totalCost.total}`);
  }

  // Log to Supabase for trending
  await supabase.from('cost_tracking').insert({
    week: new Date(),
    costs: totalCost,
  });
}
```

---

## 6. CI/CD Pipeline

### 6.1 GitHub → Vercel Automatic Deployments

**Setup**

1. Install Vercel GitHub App: https://github.com/apps/vercel
2. Grant access to your repo
3. Vercel automatically deploys on:
   - Push to `main` → Production
   - Push to any other branch → Preview
   - PR created → Preview deployment added to PR

**Configuration** (Vercel Project Settings)

```
Git
├─ Production Branch: main
├─ Preview Branches: (all except main)
└─ Ignored Build Step: (for monorepos)
    Command: git diff --quiet HEAD^ HEAD -- . packages/@co
```

**Automatic Preview Deployments**

```
PR #42 created
  ↓
Vercel detects push to feature branch
  ↓
Builds apps/web + apps/dashboard
  ↓
Deploys to https://company-builder-pr-42.vercel.app
  ↓
GitHub comment added:
  "✓ Preview deployed to company-builder-pr-42.vercel.app"
  (with link to preview)
```

### 6.2 Environment Promotion

**Stage Progression**

```
Feature Branch (pr-123)
  ↓
Preview Deployment (automatic)
  ↓ (merge to staging branch)
Staging Deployment
  ↓ (run tests, validate)
Staging Verified
  ↓ (merge to main)
Production Deployment (automatic)
  ↓
Live to all users
```

**Manual Promotion (if needed)**

Via Vercel CLI:

```bash
# Promote a staging preview to production
vercel promote https://staging.vercel.app

# Or via dashboard: Deployments tab → click prior deployment → "Promote to Production"
```

### 6.3 Database Migration Strategy

**With Supabase**

Migrations run during the build or as a separate deploy step:

**Option A: Migration during Vercel build**

```bash
# vercel.json
{
  "buildCommand": "
    pnpm install &&
    supabase migration up &&
    turbo run build
  "
}
```

Pros: Simple, ensures migrations are applied before code runs
Cons: If migration fails, build fails (redeploy required)

**Option B: Manual pre-deploy step (Recommended)**

```bash
# Run before promoting to production
supabase migration up --db-url $DATABASE_URL

# If successful, deploy code
vercel deploy --prod
```

**Example Migration Workflow**

```sql
-- supabase/migrations/20240310_add_signal_confidence.sql
-- Adds confidence score to signals table

BEGIN;

  ALTER TABLE signals
  ADD COLUMN confidence DECIMAL(3,2) DEFAULT 0.5;

  -- Backfill existing signals with moderate confidence
  UPDATE signals
  SET confidence = 0.5
  WHERE confidence IS NULL;

  ALTER TABLE signals
  ALTER COLUMN confidence SET NOT NULL;

  CREATE INDEX idx_signals_confidence ON signals(confidence DESC);

COMMIT;
```

Running migrations:

```bash
# Locally
supabase migration up --local

# On staging
supabase migration up --db-url postgresql://...staging...

# On production
supabase migration up --db-url postgresql://...production...
```

### 6.4 Automated Testing in CI

**GitHub Actions Workflow** (`.github/workflows/test.yml`)

```yaml
name: Test & Build

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run linting
        run: pnpm turbo run lint

      - name: Run type checking
        run: pnpm turbo run typecheck

      - name: Run unit tests
        run: pnpm turbo run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Build
        run: pnpm turbo run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }}
```

### 6.5 Rollback Strategy

**Automatic Rollback (if health checks fail)**

Vercel checks health endpoint after deployment:

```typescript
// apps/web/pages/api/health.ts
export default async function handler(req: NextRequest) {
  try {
    // Check database connectivity
    const { data, error } = await supabase
      .from('agent_executions')
      .select('count', { count: 'exact' })
      .limit(1);

    if (error) throw error;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date(),
      db: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    );
  }
}
```

Vercel monitors this endpoint; if health checks fail, automatically rollback.

**Manual Rollback**

Via Vercel dashboard:

```
1. Deployments tab
2. Click a prior deployment
3. Click "Promote to Production"
4. Traffic switches to prior version
5. Takes ~1 minute
```

Or via CLI:

```bash
vercel deploy --prod --token $TOKEN  # Use old code
# or
vercel rollback --token $TOKEN        # Automatic rollback to prev
```

---

## 7. Scaling Considerations

### 7.1 Vercel Auto-Scaling

**Automatic Scaling**

Vercel automatically scales serverless functions up to handle concurrent requests:

```
Peak requests: 100 concurrent function calls
→ Vercel spins up 100 function instances
→ Each gets isolated Node.js runtime
→ Parallel execution
→ No code changes needed
```

**Cold Start Scaling**

```
Time 0:00 - Function called, not yet warm
  ↓
Time 0:00-0:02 - Cold start (bundle initialization)
  ↓
Time 0:02+ - Function executes
  ↓
Time 0:30 - Function completes, returns result
  ↓
Time 0:30-5:00 - Container stays warm (idle)
  ↓
Time 5:00+ - If not called again, container terminating
```

**Cost of Scaling**

```
1,000 function invocations × 30 seconds = 30,000 function-seconds/month
Vercel Pro: $0.00000160 per function-second
Cost: $0.048/month ← Negligible
```

### 7.2 Cloudflare Edge Caching

**Cache Hit Ratio**

Static assets (logo, CSS, JS bundles):
- Cloudflare edge cache → ~95% hit ratio
- 1 request to origin, 20 requests served from edge

API responses (rare to cache):
- Cache only /api/watchlist/snapshot (published hourly)
- Most agent endpoints bypass cache
- ~5% hit ratio overall

**Edge Cache Benefits**

```
Without edge cache:
  User in Australia requests /public/logo.svg
  → Request travels to US Vercel server (~150ms)
  → Vercel returns 5KB image
  → Response travels back to Australia (~150ms)
  → Total latency: ~300ms

With Cloudflare edge cache:
  User in Australia requests /public/logo.svg
  → Request hits Sydney Cloudflare edge (~20ms)
  → Hit in edge cache, returned immediately
  → Total latency: ~20ms
  → 15x faster
```

### 7.3 Supabase Connection Limits

**Connection Pooling**

Supabase provides a connection pooler to prevent exhausting PostgreSQL connections:

```
Direct connections: 20 max (can exhaust quickly)
Connection pooler: 100 max (shared across clients)
Recommended: Use pooler for Vercel functions
```

**Configuration**

```typescript
// Using Supabase pooler (recommended for serverless)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public',
      autoRefreshToken: false,
      persistSession: false, // Don't store session (serverless)
    },
    auth: {
      shouldThrowOnError: true,
    },
  }
);

// For production, use connection pooler
const poolUrl = process.env.SUPABASE_POOL_URL || process.env.DATABASE_URL;
```

**Monitoring Connections**

Query Supabase's pg_stat_activity:

```sql
SELECT datname, count(*) as connections
FROM pg_stat_activity
GROUP BY datname;

-- Should see ~50-100 connections at peak
-- Alert if > 120 (approaching limit)
```

### 7.4 Cost Optimization

**When to Use Edge Functions vs. Serverless**

| Use Case | Recommendation | Reason |
|----------|---|---|
| Static asset serving | Edge | <10ms latency |
| Read-heavy API (no DB) | Edge | Cache-friendly |
| Agent execution | Serverless | Needs 300s timeout, 2GB memory |
| Authentication | Serverless | Needs to access DB |
| Data aggregation | Serverless | Complex queries |
| Rate limiting | Either | Can use edge for speed |

**Caching to Reduce Database Load**

Every Supabase query costs time and money:

```typescript
// ❌ Inefficient: Query watchlist every page load
GET /api/watchlist
  → SELECT * FROM opportunities WHERE phase = 0
  → Hits database 1000x/day
  → Slow, expensive

// ✅ Efficient: Cache at edge for 1 hour
GET /api/watchlist (cached)
  → Cloudflare serves cached response 99% of the time
  → Only regenerates when Phase 0 scan completes
  → Few database queries
```

**Cost Projection (100 active users)**

```
Monthly breakdown:
├─ Vercel: ~$30 (Pro plan)
├─ Cloudflare: ~$20 (Pro plan)
├─ Supabase: ~$25 (included in free tier)
├─ Anthropic API: ~$500 (agent calls)
└─ Other APIs: ~$50 (SerpAPI, NewsAPI, Crunchbase)
────────────────────────
Total: ~$625/month

Cost per user: $6.25/month (reasonable for B2B)
```

---

## 8. Domain and Networking

### 8.1 Custom Domain Setup

**Nameserver Configuration**

1. Register domain (GoDaddy, Namecheap, etc.)
2. Point nameservers to Cloudflare:
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```
3. Add domain to Cloudflare dashboard
4. Cloudflare auto-creates DNS records

**Cloudflare DNS Records**

```
Type    Name        TTL     Target
────────────────────────────────────────
CNAME   @           Auto    cname.vercel.com.
CNAME   www         Auto    cname.vercel.com.
CNAME   api         Auto    cname.vercel.com.
CNAME   dashboard   Auto    cname.vercel.com.
```

### 8.2 Subdomain Strategy

**Recommended Structure**

```
app.company-builder.ai
  → Main app (Next.js)
  → User-facing interface

api.company-builder.ai
  → (Optional) API-only subdomain
  → Vercel handles it identically
  → Useful for API documentation, rate limiting policies

dashboard.company-builder.ai
  → Internal review dashboard
  → Protected authentication
  → Same Vercel deployment, just different route

static.company-builder.ai
  → (Optional) CDN for large assets
  → Can point to S3, Cloudflare R2, or Vercel

docs.company-builder.ai
  → (Optional) Documentation site
  → Separate Next.js app or static generator
```

### 8.3 Vercel + Cloudflare Configuration

**Avoiding Double Proxy**

Do not put Cloudflare in front of Vercel twice:

```
❌ Wrong:
  User → Cloudflare → Vercel → (Cloudflare again?)

✅ Right:
  User → Cloudflare → Vercel
         (single proxy layer)
```

**DNS Setup**

```
Cloudflare dashboard
├─ DNS
│   └─ CNAME @ → cname.vercel.com.
│       (Cloudflare proxies to Vercel)
│
└─ SSL/TLS → Full (strict)
    (Vercel must have valid certificate)
```

**Vercel Knowing Your Domain**

Add custom domain in Vercel project settings:

```
Vercel Dashboard
├─ Project Settings
│   └─ Domains
│       └─ Add: app.company-builder.ai
```

Vercel verifies you own the domain (checks Cloudflare DNS) and issues SSL cert.

---

## 9. Disaster Recovery

### 9.1 Vercel Deployment Rollback

**Scenario: Buggy deploy causes issues**

```
Time 14:32 - Deploy released
Time 14:35 - Users report errors
Time 14:40 - Decision: Rollback
```

**Action: Promote Previous Deployment**

```
1. Vercel Dashboard → Deployments
2. Find the deployment before the buggy one
3. Click "Promote to Production"
4. Cloudflare DNS updates
5. New traffic goes to old version
6. Rollback completes in ~1 minute
```

**Keep Deployments Long**

Vercel retains last 50 deployments by default. Upgrade to Pro to keep more.

### 9.2 Supabase Backup Restore

**Automatic Backups**

Supabase automatically backs up:

```
Free tier: 7-day recovery window
Pro tier:  30-day recovery window
Enterprise: Custom retention
```

**Scenario: Accidental data deletion**

```
11:00 AM - Agent accidentally deletes all opportunities
11:15 AM - Issue discovered
11:30 AM - Decision: Restore from backup
```

**Action: Restore Database**

```
1. Supabase Dashboard → Backups
2. Select backup from before 11:00 AM
3. Click "Restore"
4. Database rolls back to that point in time
5. Any new data since 11:00 AM is lost (acceptable for 30min)
```

**Point-in-Time Recovery** (Enterprise)

Can restore to any second within the recovery window:

```
supabase db restore --timestamp="2024-03-10T11:00:00Z"
```

### 9.3 Incident Response Playbook

**Incident Severity Levels**

| Level | Impact | Response Time |
|-------|--------|---|
| SEV 1 | Platform down, no agents running | 15 minutes |
| SEV 2 | Degraded (slow agents) | 1 hour |
| SEV 3 | Minor bug, some features affected | 4 hours |
| SEV 4 | Non-critical, can wait for next release | 1 week |

**SEV 1 Incident Flow**

```
Detection
  ↓ (Sentry alert OR uptime monitor alert)
  Incident declared
  ↓
Triage
  ↓ (Check Vercel logs, Cloudflare WAF, Supabase status)
  Root cause identified
  ↓
Mitigation
  ├─ Option 1: Rollback (if code issue)
  │   → vercel rollback
  │   → Fixes in < 1 minute
  │
  ├─ Option 2: Scale down rate limits (if load issue)
  │   → Increase Cloudflare rate limit thresholds
  │   → Prevent cascading failures
  │
  ├─ Option 3: Database failover (if Supabase down)
  │   → Restore from backup
  │   → Restore to point-in-time
  │
  └─ Option 4: Circuit breaker (if external API down)
      → Set agents to fallback mode
      → Stop calling failed API
      → Return cached results
  ↓
Communication
  ↓ (Post status update to Slack/status page)
  "We're investigating platform downtime..."
  ↓
Resolution
  ↓ (Issue fixed, verify health checks passing)
  "Platform is back online"
  ↓
Postmortem
  ↓ (Write it down, identify preventions)
  "Incident: DB connection pool exhausted"
```

**Monitoring & Alerting Setup**

```typescript
// Sentry alert: Error rate > 5%
Sentry.Monitor.capture({
  check_in_id: checkin.id,
  status: errorRate > 0.05 ? 'error' : 'ok',
});

// Vercel health check every 5 minutes
Uptime.ping('https://app.company-builder.ai/api/health', {
  interval: 300, // 5 minutes
  timeout: 5000,
  alerts: [
    { threshold: 3, action: 'slack', channel: '#incidents' },
  ]
});

// Custom alert: Agent execution failure rate
if (failureRate > 0.1) {
  await notifySlack(`:warning: Agent failure rate: ${failureRate}%`);
}
```

---

## 10. Reference Configuration

### 10.1 Example vercel.json

```json
{
  "name": "company-builder",
  "version": 2,
  "buildCommand": "pnpm install && pnpm turbo run build --filter=web --filter=dashboard",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install",
  "env": {
    "NODE_ENV": "production",
    "NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@next_public_supabase_anon_key"
  },
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x",
      "memory": 1024,
      "maxDuration": 60
    },
    "api/agents/**/*.ts": {
      "runtime": "nodejs20.x",
      "memory": 2048,
      "maxDuration": 300
    },
    "api/cron/**/*.ts": {
      "runtime": "nodejs20.x",
      "memory": 2048,
      "maxDuration": 300
    }
  },
  "regions": ["sfo1", "iad1"],
  "routes": [
    {
      "src": "^/api/health$",
      "headers": {
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
      "methods": ["GET"]
    },
    {
      "src": "^/api/agents/.*",
      "headers": {
        "Cache-Control": "no-cache",
        "X-API-Route": "agent"
      }
    },
    {
      "src": "^/dashboard/.*",
      "headers": {
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-cache"
      }
    },
    {
      "src": "^/public/.*",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    }
  ],
  "crons": [
    {
      "path": "/api/cron/phase-0-scan",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/feedback-loop",
      "schedule": "0 2 * * 0"
    },
    {
      "path": "/api/cron/cost-report",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

### 10.2 Example Cloudflare DNS Records

```
company-builder.ai DNS Configuration
────────────────────────────────────────────────────────────────

Type    Name            TTL     Proxy   Content
────────────────────────────────────────────────────────────────
A       @               3600    —       1.2.3.4 (parked page, or vercel IP)
CNAME   @               Auto    CF      cname.vercel.com.
CNAME   www             Auto    CF      cname.vercel.com.
CNAME   app             Auto    CF      cname.vercel.com.
CNAME   api             Auto    CF      cname.vercel.com.
CNAME   dashboard       Auto    CF      cname.vercel.com.
MX      @               3600    —       10 mail.company-builder.ai.
TXT     @               3600    —       v=spf1 include:sendgrid.net ~all
TXT     _dmarc          3600    —       v=DMARC1; p=quarantine
TXT     _acme-challenge Auto    —       (auto-managed by Vercel SSL)

CNAME Records use "Auto" for TTL (Cloudflare optimizes)
Proxy = CF means Cloudflare proxies (orange cloud)
```

### 10.3 Example Cloudflare WAF Rules

```
Company Builder WAF Rule Set
──────────────────────────────────────────────────

Rule 1: Block automated scanning tools
  Condition: (cf.bot_management.score < 30) AND (cf.threat_score > 50)
  Action: Block

Rule 2: Rate limit agent endpoints
  Condition: cf.path eq "/api/agents/"
  Ratelimit: 20 requests/minute per IP
  Action: Challenge
  Duration: 1 hour

Rule 3: Require auth for dashboard
  Condition: cf.path contains "/dashboard/" AND (not logged_in)
  Action: Block
  Note: Let Vercel app handle auth

Rule 4: Block SQL injection attempts
  Condition: (cf.threat_score >= 80)
  Action: Block

Rule 5: Allow known bots
  Condition: cf.bot_management.verified_bot_category in (search_engine, monitoring)
  Action: Allow

Rule 6: Block if headers missing
  Condition: (http.request_headers["user-agent"] == "") AND (cf.path contains "/api/")
  Action: Challenge
```

### 10.4 Example GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Build, Test & Deploy

on:
  push:
    branches:
      - main
      - staging
  pull_request:
    branches:
      - main
      - staging

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run linting
        run: pnpm turbo run lint

      - name: Run type checks
        run: pnpm turbo run typecheck

      - name: Run tests
        run: pnpm turbo run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Build
        run: pnpm turbo run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  deploy-preview:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy preview to Vercel
        run: |
          npm install -g vercel
          vercel deploy --token ${{ secrets.VERCEL_TOKEN }}

  deploy-production:
    needs: lint-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - uses: actions/checkout@v4

      - name: Run database migrations
        run: |
          npm install -g supabase@latest
          supabase migration up --db-url "${{ secrets.DATABASE_URL }}"

      - name: Deploy to Vercel production
        run: |
          npm install -g vercel
          vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }}

      - name: Notify Slack
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "Deployment: ${{ job.status }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Deployment Status:* ${{ job.status }}\n*Commit:* <${{ github.server_url }}/${{ github.repository }}/commit/${{ github.sha }}|${{ github.sha }}>"
                  }
                }
              ]
            }
```

### 10.5 Example Environment Variable List

```bash
# .env.example
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=your-jwt-secret-key
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_API_VERSION=2024-06-01
ANTHROPIC_API_TIMEOUT_MS=30000

# External APIs
SERPAPI_API_KEY=your-serpapi-key
NEWSAPI_KEY=your-newsapi-key
CRUNCHBASE_API_KEY=your-crunchbase-key

# Vercel
VERCEL_ENV=production|preview|development
VERCEL_URL=app.company-builder.ai

# Observability
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_ENVIRONMENT=production|staging|development
SENTRY_TRACESAMPLING=0.1

# Job & Queuing
REDIS_CONNECTION_URL=redis://localhost:6379
CRON_SECRET=your-cron-verification-secret
JOB_WEBHOOK_SECRET=webhook-signing-secret

# Security
DASHBOARD_JWT_SECRET=secret-key-for-dashboard-tokens
API_RATE_LIMIT_REQUESTS_PER_MINUTE=100
API_RATE_LIMIT_WINDOW_MS=60000

# Feature Flags
FEATURE_BACKGROUND_JOBS=true
FEATURE_EDGE_FUNCTIONS=false
FEATURE_ADVANCED_ANALYTICS=true

# Cost Monitoring
MONTHLY_COST_BUDGET_USD=1000
ALERT_THRESHOLD_PERCENT=80

# Logging
LOG_LEVEL=info|debug|error
LOG_FORMAT=json|text
```

---

## Summary

This infrastructure design provides:

1. **Scalability**: Vercel serverless auto-scales to handle agent workloads; Cloudflare caches to reduce load
2. **Security**: End-to-end encryption, WAF protection, rate limiting, secret management
3. **Reliability**: Automatic rollback, database backups, health monitoring, incident response
4. **Cost Efficiency**: ~$625/month for 100 users; scales with usage
5. **Observability**: Logs, metrics, error tracking, uptime monitoring
6. **Automation**: CI/CD pipeline, scheduled jobs, zero-downtime deployments

All components work together to create a robust platform capable of running complex AI agents on-demand while protecting users, data, and infrastructure.
