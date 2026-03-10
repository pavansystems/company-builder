# Company Builder — Technical Design: UI Layer

## Overview

This document defines the technical architecture for all UI surfaces of Company Builder, built with **Next.js App Router**, hosted on **Vercel**, with **Supabase** as the data layer and **Cloudflare** providing security and caching. The platform includes four primary UI surfaces:

1. **Pipeline Dashboard** — Overview of all ideas in progress, phase tracking, status visibility
2. **Concept Review & Selection** — Side-by-side concept comparison, scoring details, approve/reject gates
3. **Watchlist Publisher Dashboard** — Ranked market opportunities with filtering, sorting, drill-down detail
4. **Blueprint Viewer** — Final deliverable rendered as a rich, navigable document

All surfaces share a common component library, authentication model, and state management pattern.

---

## 1. Next.js Application Architecture

### 1.1 App Router Structure

The application uses Next.js App Router with the following directory structure:

```
app/
├── layout.tsx                    # Root layout, authentication wrapper
├── page.tsx                      # Homepage/entry point
│
├── (discovery)/                  # Route group: Phase 0 (watchlist)
│   ├── layout.tsx
│   ├── watchlist/
│   │   ├── page.tsx             # Watchlist publisher dashboard
│   │   ├── [opportunityId]/
│   │   │   └── page.tsx         # Opportunity detail view
│   │   └── components/
│   │       ├── OpportunityCard.tsx
│   │       ├── RankingBreakdown.tsx
│   │       └── FilterPanel.tsx
│   └── loading.tsx
│
├── (ideation)/                   # Route group: Phase 1 (concept generation)
│   ├── layout.tsx
│   ├── concepts/
│   │   ├── page.tsx             # Concept dashboard (all in flight)
│   │   ├── [conceptId]/
│   │   │   ├── page.tsx         # Concept detail view
│   │   │   └── review/
│   │   │       └── page.tsx     # Concept review & selection gate UI
│   │   └── components/
│   │       ├── ConceptCard.tsx
│   │       ├── ScoreBreakdown.tsx
│   │       └── ConceptComparison.tsx
│   └── loading.tsx
│
├── (validation)/                 # Route group: Phase 2 (validation detail)
│   ├── layout.tsx
│   ├── validation/
│   │   ├── page.tsx             # Validation dashboard
│   │   ├── [conceptId]/
│   │   │   ├── page.tsx         # Validation detail: all scoring, market size, etc.
│   │   │   ├── market-sizing/
│   │   │   │   └── page.tsx
│   │   │   ├── competitive/
│   │   │   │   └── page.tsx
│   │   │   ├── feasibility/
│   │   │   │   └── page.tsx
│   │   │   └── economics/
│   │   │       └── page.tsx
│   │   └── components/
│   │       ├── MarketSizeChart.tsx
│   │       ├── CompetitorComparison.tsx
│   │       └── EconomicsTable.tsx
│   └── loading.tsx
│
├── (blueprint)/                  # Route group: Phase 3 (blueprint rendering)
│   ├── layout.tsx
│   ├── blueprint/
│   │   ├── page.tsx             # Blueprint list/dashboard
│   │   ├── [blueprintId]/
│   │   │   ├── page.tsx         # Full blueprint viewer
│   │   │   ├── layout.tsx       # Blueprint navigation sidebar
│   │   │   └── sections/
│   │   │       ├── executive-summary/
│   │   │       ├── business-model/
│   │   │       ├── agent-architecture/
│   │   │       ├── gtm-plan/
│   │   │       ├── risk-register/
│   │   │       └── resource-plan/
│   │   └── components/
│   │       ├── BlueprintNav.tsx
│   │       └── SectionRenderer.tsx
│   └── loading.tsx
│
├── (settings)/                   # Route group: Platform configuration
│   ├── layout.tsx
│   ├── scoring-thresholds/page.tsx
│   ├── sources/page.tsx
│   ├── notifications/page.tsx
│   └── components/
│       └── SettingsForm.tsx
│
├── auth/                         # Authentication routes
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── callback/route.ts         # OAuth callback
│   └── logout/route.ts           # Logout endpoint
│
└── api/                          # Server-side API routes (if needed)
    ├── route.ts
    └── [resource]/
        └── route.ts

lib/
├── supabase/
│   ├── server.ts                # Server-side Supabase client
│   ├── browser.ts               # Browser-side Supabase client
│   ├── types.ts                 # TypeScript types for database schema
│   └── queries.ts               # Common server-side queries
├── hooks/
│   ├── useAuth.ts               # Authentication hook
│   ├── usePipeline.ts           # Pipeline data subscription hook
│   ├── useWatchlist.ts          # Watchlist real-time subscription
│   └── useLocalFilters.ts       # Client-side filter state
├── utils/
│   ├── scoreUtils.ts            # Score calculation and formatting
│   ├── formatters.ts            # Formatting utilities
│   └── validators.ts            # Input validation
└── constants/
    ├── scoring.ts               # Scoring thresholds and rubrics
    └── phases.ts                # Phase definitions and gate rules

components/
├── shared/                       # UI component library
│   ├── ScoreCard.tsx
│   ├── StatusBadge.tsx
│   ├── PipelineIndicator.tsx
│   ├── DataTable.tsx
│   ├── ChartCard.tsx
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── Tabs.tsx
│   ├── Select.tsx
│   ├── Input.tsx
│   └── ...
├── layout/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── Footer.tsx
│   └── MainLayout.tsx
└── auth/
    ├── ProtectedRoute.tsx
    ├── LoginForm.tsx
    └── SignupForm.tsx

styles/
├── globals.css                  # Tailwind directives, global styles
└── tailwind.config.ts
```

### 1.2 Route Groups Strategy

Route groups (folders wrapped in parentheses like `(discovery)`) organize the app semantically without affecting the URL structure. This allows:

- Clear separation of concerns: each phase has its own route group
- Shared layout hierarchies within groups
- Different loading/error strategies per group
- Easier mental model of the feature architecture

Example: `/app/(discovery)/watchlist/page.tsx` renders at URL `/watchlist`, not `/discovery/watchlist`.

### 1.3 Server Components vs. Client Components

**Server Components (default):**
- Initial page load: data fetching from Supabase
- Reading static settings/configuration
- Rendering read-only views (dashboards with no interactivity)
- Example: `/app/(discovery)/watchlist/page.tsx` fetches watchlist items at request time

**Client Components (`use client` directive):**
- Interactive elements: filters, sorting, modal toggles
- Real-time subscriptions to Supabase Realtime
- Client-side state for UI concerns (selected row, open tabs, modal state)
- Form inputs and submissions
- Example: Filter panel in watchlist that updates on user input

**Hybrid Pattern** (recommended for most pages):
```typescript
// app/(discovery)/watchlist/page.tsx — Server Component
export default async function WatchlistPage() {
  const supabase = createServerClient();
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .order("score", { ascending: false });

  return (
    <div>
      <WatchlistHeader /> {/* Client component for filtering */}
      <OpportunityList initialData={opportunities} /> {/* Client component for realtime */}
    </div>
  );
}

// components/watchlist/OpportunityList.tsx — Client Component
"use client";
export function OpportunityList({ initialData }: Props) {
  const [opportunities, setOpportunities] = useState(initialData);
  const supabase = createBrowserClient();

  useEffect(() => {
    // Subscribe to realtime updates
    const subscription = supabase
      .from("opportunities")
      .on("*", (payload) => {
        setOpportunities((prev) => updateList(prev, payload));
      })
      .subscribe();
    return () => subscription.unsubscribe();
  }, []);

  return <div>{/* render opportunities with subscription updates */}</div>;
}
```

### 1.4 Layouts and Loading States

**Root Layout** (`app/layout.tsx`):
- Global metadata, fonts, CSS
- Authentication wrapper (checks user session, redirects to login if needed)
- Top-level navigation
- Error boundary for global errors

**Route Group Layouts** (e.g., `app/(ideation)/layout.tsx`):
- Phase-specific navigation
- Shared sidebar or header for the group
- Phase-specific error handling

**Page-Level Loading States** (`loading.tsx`):
```typescript
// app/(discovery)/watchlist/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  );
}
```

**Error Boundaries** (`error.tsx`):
```typescript
// app/(discovery)/watchlist/error.tsx
"use client";
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="font-semibold text-red-900">Failed to load watchlist</h2>
      <p className="mt-2 text-red-700">{error.message}</p>
      <button
        onClick={() => reset()}
        className="mt-4 rounded bg-red-600 px-4 py-2 text-white"
      >
        Try again
      </button>
    </div>
  );
}
```

---

## 2. Supabase Integration

### 2.1 Client Setup

**Server-Side Client** (`lib/supabase/server.ts`):
```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Handle errors during cookie setting
          }
        },
      },
    }
  );
}
```

**Browser-Side Client** (`lib/supabase/browser.ts`):
```typescript
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null =
  null;

export function createBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return browserClient;
}
```

### 2.2 Authentication

**Login Flow** (`app/auth/login/page.tsx`):
```typescript
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div className="text-red-600">{error}</div>}
      <button type="submit">Sign in</button>
    </form>
  );
}
```

**Protected Routes with Middleware** (`middleware.ts`):
```typescript
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          const response = NextResponse.next();
          cookiesToSet.forEach(({ name, value }) =>
            response.cookies.set(name, value)
          );
          return response;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect unauthenticated users to login
  if (!user && !request.nextUrl.pathname.startsWith("/auth")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/login";
    redirectUrl.search = `?redirect=${request.nextUrl.pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth).*)",
  ],
};
```

### 2.3 Row Level Security (RLS) Patterns

All Supabase tables implement RLS to ensure users can only access their own data (or shared team data, if applicable).

**Example RLS Policies:**

```sql
-- opportunities table
CREATE POLICY "Users can view opportunities in their account"
ON opportunities FOR SELECT
USING (
  account_id = (
    SELECT account_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update opportunities they own"
ON opportunities FOR UPDATE
USING (
  account_id = (
    SELECT account_id FROM users WHERE id = auth.uid()
  )
);

-- concepts table (depends on opportunities)
CREATE POLICY "Users can view concepts for opportunities they own"
ON concepts FOR SELECT
USING (
  opportunity_id IN (
    SELECT id FROM opportunities
    WHERE account_id = (
      SELECT account_id FROM users WHERE id = auth.uid()
    )
  )
);
```

**Database Schema Types** (`lib/supabase/types.ts`):
```typescript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          account_id: string;
          email: string;
          role: "admin" | "reviewer" | "viewer";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
      opportunities: {
        Row: {
          id: string;
          account_id: string;
          market: string;
          problem: string;
          signals: string[];
          score: number;
          status: "candidate" | "watchlist" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["opportunities"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["opportunities"]["Row"]>;
      };
      concepts: {
        Row: {
          id: string;
          opportunity_id: string;
          title: string;
          description: string;
          status: "generated" | "selected" | "validation" | "archived";
          disruption_score: number;
          agent_readiness: number;
          feasibility: number;
          composite_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["concepts"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["concepts"]["Row"]>;
      };
      validation_reports: {
        Row: {
          id: string;
          concept_id: string;
          market_size: number;
          market_sizing_confidence: number;
          competitive_verdict: string;
          feasibility_risks: string[];
          unit_economics: Record<string, unknown>;
          overall_verdict: "go" | "no-go";
          confidence: "high" | "moderate" | "low";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["validation_reports"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["validation_reports"]["Row"]>;
      };
      blueprints: {
        Row: {
          id: string;
          concept_id: string;
          business_model: Record<string, unknown>;
          agent_architecture: Record<string, unknown>;
          gtm_plan: Record<string, unknown>;
          risk_register: Record<string, unknown>;
          resource_plan: Record<string, unknown>;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["blueprints"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["blueprints"]["Row"]>;
      };
    };
  };
};
```

### 2.4 Realtime Subscriptions for Live Pipeline Updates

Supabase Realtime provides live updates as agents complete work or human reviewers make decisions.

**Pipeline Update Hook** (`lib/hooks/usePipeline.ts`):
```typescript
"use client";
import { useEffect, useState, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Database } from "@/lib/supabase/types";

export function usePipelineUpdates(accountId: string) {
  const [opportunities, setOpportunities] = useState<
    Database["public"]["Tables"]["opportunities"]["Row"][]
  >([]);
  const [concepts, setConcepts] = useState<
    Database["public"]["Tables"]["concepts"]["Row"][]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    async function loadInitialData() {
      // Load initial opportunities
      const { data: oppData } = await supabase
        .from("opportunities")
        .select("*")
        .eq("account_id", accountId);

      setOpportunities(oppData || []);

      // Load initial concepts
      const { data: conceptData } = await supabase
        .from("concepts")
        .select("*")
        .in(
          "opportunity_id",
          oppData?.map((o) => o.id) || []
        );

      setConcepts(conceptData || []);
      setIsLoading(false);
    }

    loadInitialData();

    // Subscribe to opportunities changes
    const oppSubscription = supabase
      .channel("opportunities-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "opportunities",
          filter: `account_id=eq.${accountId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setOpportunities((prev) => [...prev, payload.new]);
          } else if (payload.eventType === "UPDATE") {
            setOpportunities((prev) =>
              prev.map((o) => (o.id === payload.new.id ? payload.new : o))
            );
          } else if (payload.eventType === "DELETE") {
            setOpportunities((prev) =>
              prev.filter((o) => o.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Subscribe to concepts changes
    const conceptSubscription = supabase
      .channel("concepts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "concepts",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setConcepts((prev) => [...prev, payload.new]);
          } else if (payload.eventType === "UPDATE") {
            setConcepts((prev) =>
              prev.map((c) => (c.id === payload.new.id ? payload.new : c))
            );
          }
        }
      )
      .subscribe();

    return () => {
      oppSubscription.unsubscribe();
      conceptSubscription.unsubscribe();
    };
  }, [accountId, supabase]);

  return { opportunities, concepts, isLoading };
}
```

### 2.5 Data Fetching Patterns

**Server Component Data Fetching** (initial page load):
```typescript
// app/(ideation)/concepts/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ConceptList } from "./components/ConceptList";

export default async function ConceptsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  // Fetch initial concepts data
  const { data: concepts, error } = await supabase
    .from("concepts")
    .select(
      `
      *,
      opportunities (
        market,
        problem
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Concepts in Flight</h1>
      <ConceptList initialConcepts={concepts} userId={user.id} />
    </div>
  );
}
```

**Client-Side Subscriptions and Updates**:
```typescript
// components/ideation/ConceptList.tsx
"use client";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Database } from "@/lib/supabase/types";

type Concept = Database["public"]["Tables"]["concepts"]["Row"];

export function ConceptList({
  initialConcepts,
  userId,
}: {
  initialConcepts: Concept[];
  userId: string;
}) {
  const [concepts, setConcepts] = useState(initialConcepts);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    // Subscribe to real-time updates
    const subscription = supabase
      .channel("concepts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "concepts" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setConcepts((prev) =>
              prev.map((c) =>
                c.id === payload.new.id
                  ? (payload.new as Concept)
                  : c
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <div className="space-y-4">
      {concepts.map((concept) => (
        <ConceptCard key={concept.id} concept={concept} />
      ))}
    </div>
  );
}
```

---

## 3. Key UI Surfaces

### 3.1 Pipeline Dashboard

**Purpose:** Unified view of all ideas in progress across all phases, showing current phase, status, and recent activity.

**Route:** `/` (homepage after authentication)

**Features:**
- Overview cards for each phase (count of ideas, count in current phase)
- Timeline showing idea progression through gates
- Recent activity log (new concepts, completed validation, approved blueprints)
- Links to drill into specific phases
- Quick filters: by status, by phase, by date range

**Page Implementation** (`app/page.tsx`):
```typescript
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PipelineOverview } from "@/components/dashboard/PipelineOverview";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch phase summaries
  const { data: opps } = await supabase
    .from("opportunities")
    .select("status, count")
    .eq("account_id", user.id);

  const { data: concepts } = await supabase
    .from("concepts")
    .select("status, count")
    .in(
      "opportunity_id",
      opps?.map((o) => o.id) || []
    );

  return (
    <div className="space-y-8">
      <PipelineOverview
        opportunitiesCount={opps?.length || 0}
        conceptsCount={concepts?.length || 0}
      />
      <RecentActivity userId={user.id} />
    </div>
  );
}
```

**Component: PipelineOverview**:
```typescript
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/Card";
import { ProgressBar } from "@/components/shared/ProgressBar";

interface Phase {
  name: string;
  count: number;
  target: number;
  color: string;
}

export function PipelineOverview({ phases }: { phases: Phase[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      {phases.map((phase) => (
        <Card key={phase.name}>
          <CardHeader>
            <CardTitle className="text-lg">{phase.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{phase.count}</div>
            <ProgressBar
              value={phase.count}
              max={phase.target}
              className={`mt-2 bg-${phase.color}-100`}
            />
            <p className="mt-2 text-sm text-gray-600">
              {phase.count} of {phase.target} active
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### 3.2 Watchlist Publisher Dashboard

**Purpose:** Ranked list of market opportunities detected in Phase 0, with filtering and drill-down.

**Route:** `/watchlist`

**Features:**
- Ranked list of opportunities by composite score
- Sorting: by score, by date detected, by agent-readiness
- Filtering: by market sector, by signal type, by status
- Per-opportunity cards showing: market name, problem, enabling signals, key metrics (score breakdown)
- Drill-down detail view for each opportunity
- Manual override controls (promote/demote, add to pipeline)

**Page Implementation** (`app/(discovery)/watchlist/page.tsx`):
```typescript
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WatchlistClient } from "./components/WatchlistClient";

export default async function WatchlistPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch initial opportunities
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .eq("account_id", user.id)
    .order("score", { ascending: false });

  return (
    <div>
      <h1 className="text-3xl font-bold">Market Watchlist</h1>
      <p className="mt-2 text-gray-600">
        Ranked opportunities for agent-first disruption
      </p>
      <WatchlistClient
        initialOpportunities={opportunities || []}
        userId={user.id}
      />
    </div>
  );
}
```

**Client Component with Real-time Updates**:
```typescript
"use client";
import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { OpportunityCard } from "./OpportunityCard";
import { FilterPanel } from "./FilterPanel";
import type { Database } from "@/lib/supabase/types";

type Opportunity = Database["public"]["Tables"]["opportunities"]["Row"];

export function WatchlistClient({
  initialOpportunities,
  userId,
}: {
  initialOpportunities: Opportunity[];
  userId: string;
}) {
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [sortBy, setSortBy] = useState<"score" | "date" | "readiness">("score");
  const [filterSector, setFilterSector] = useState<string | null>(null);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    // Real-time subscription
    const subscription = supabase
      .channel("watchlist")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "opportunities",
          filter: `account_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setOpportunities((prev) =>
              prev.map((o) =>
                o.id === payload.new.id ? (payload.new as Opportunity) : o
              )
            );
          } else if (payload.eventType === "INSERT") {
            setOpportunities((prev) => [...prev, payload.new as Opportunity]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, userId]);

  const filtered = filterSector
    ? opportunities.filter((o) => o.market === filterSector)
    : opportunities;

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "score") return (b.score || 0) - (a.score || 0);
    if (sortBy === "date")
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return 0;
  });

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
      <FilterPanel onSectorChange={setFilterSector} onSortChange={setSortBy} />
      <div className="lg:col-span-3 space-y-4">
        {sorted.map((opp) => (
          <OpportunityCard key={opp.id} opportunity={opp} />
        ))}
      </div>
    </div>
  );
}
```

**OpportunityCard Component**:
```typescript
"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/shared/Card";
import { ScoreCard } from "@/components/shared/ScoreCard";
import { Badge } from "@/components/shared/Badge";
import type { Database } from "@/lib/supabase/types";

type Opportunity = Database["public"]["Tables"]["opportunities"]["Row"];

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{opportunity.market}</h3>
            <p className="mt-1 text-sm text-gray-600">{opportunity.problem}</p>
          </div>
          <ScoreCard score={opportunity.score} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {opportunity.signals && (
          <div>
            <p className="text-sm font-medium text-gray-700">Enabling Signals</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {opportunity.signals.map((signal, i) => (
                <Badge key={i} variant="outline">
                  {signal}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <Link
          href={`/watchlist/${opportunity.id}`}
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          View Details →
        </Link>
      </CardContent>
    </Card>
  );
}
```

### 3.3 Concept Review & Selection (Phase 1 Gate UI)

**Purpose:** Concept selector gate — human review and approval/rejection of top concepts before validation phase.

**Route:** `/concepts/review`

**Features:**
- List of generated concepts with scores
- Side-by-side comparison of 2–3 concepts
- Score breakdown (disruption, agent-readiness, feasibility, differentiation)
- Detailed concept descriptions
- Approve/reject buttons with optional notes
- Bulk actions (approve top N, reject all below threshold)
- View landscape and pain point research that informed generation

**Page Implementation** (`app/(ideation)/concepts/review/page.tsx`):
```typescript
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ConceptReviewClient } from "./components/ConceptReviewClient";

export default async function ConceptReviewPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch concepts awaiting review (status = 'generated')
  const { data: concepts } = await supabase
    .from("concepts")
    .select(
      `
      *,
      opportunities (
        market,
        problem,
        signals
      )
    `
    )
    .eq("status", "generated")
    .order("composite_score", { ascending: false });

  return (
    <div>
      <h1 className="text-3xl font-bold">Review Generated Concepts</h1>
      <ConceptReviewClient initialConcepts={concepts || []} userId={user.id} />
    </div>
  );
}
```

**Client Component with Comparison and Actions**:
```typescript
"use client";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { ConceptCard } from "./ConceptCard";
import { ConceptComparison } from "./ConceptComparison";
import { Button } from "@/components/shared/Button";
import type { Database } from "@/lib/supabase/types";

type Concept = Database["public"]["Tables"]["concepts"]["Row"];

export function ConceptReviewClient({
  initialConcepts,
  userId,
}: {
  initialConcepts: Concept[];
  userId: string;
}) {
  const [concepts, setConcepts] = useState(initialConcepts);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const supabase = createBrowserSupabaseClient();

  async function approveSelected() {
    await supabase
      .from("concepts")
      .update({ status: "selected" })
      .in("id", selectedIds);

    setConcepts((prev) =>
      prev.map((c) =>
        selectedIds.includes(c.id) ? { ...c, status: "selected" } : c
      )
    );
  }

  async function rejectSelected() {
    await supabase
      .from("concepts")
      .update({ status: "archived" })
      .in("id", selectedIds);

    setConcepts((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
    setSelectedIds([]);
  }

  const pendingConcepts = concepts.filter((c) => c.status === "generated");

  return (
    <div className="mt-6 space-y-6">
      <div className="flex gap-2">
        <Button
          onClick={approveSelected}
          disabled={selectedIds.length === 0}
          variant="success"
        >
          Approve ({selectedIds.length})
        </Button>
        <Button
          onClick={rejectSelected}
          disabled={selectedIds.length === 0}
          variant="danger"
        >
          Reject ({selectedIds.length})
        </Button>
      </div>

      {selectedIds.length > 0 && selectedIds.length <= 3 && (
        <ConceptComparison
          concepts={concepts.filter((c) => selectedIds.includes(c.id))}
        />
      )}

      <div className="space-y-3">
        {pendingConcepts.map((concept) => (
          <ConceptCard
            key={concept.id}
            concept={concept}
            isSelected={selectedIds.includes(concept.id)}
            onSelect={(id, selected) => {
              setSelectedIds((prev) =>
                selected ? [...prev, id] : prev.filter((cid) => cid !== id)
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

**ConceptComparison Component**:
```typescript
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/Card";
import { ScoreBreakdown } from "@/components/shared/ScoreBreakdown";
import type { Database } from "@/lib/supabase/types";

type Concept = Database["public"]["Tables"]["concepts"]["Row"];

export function ConceptComparison({ concepts }: { concepts: Concept[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Concept Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {concepts.map((concept) => (
            <div key={concept.id} className="border rounded-lg p-4">
              <h4 className="font-semibold">{concept.title}</h4>
              <p className="mt-2 text-sm text-gray-600">{concept.description}</p>
              <ScoreBreakdown
                disruption={concept.disruption_score}
                agentReadiness={concept.agent_readiness}
                feasibility={concept.feasibility}
                composite={concept.composite_score}
                className="mt-4"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 3.4 Validation Detail View

**Purpose:** Deep dive into validation research for a specific concept — market sizing, competition, feasibility, economics.

**Route:** `/validation/:conceptId`

**Features:**
- Tabbed interface: Market Sizing, Competitive Analysis, Customer Signals, Feasibility, Unit Economics, Verdict
- Charts and visualizations for market size (TAM/SAM/SOM), competitive landscape
- Evidence citations (links to source data)
- Per-dimension confidence ratings
- Overall go/no-go verdict with reasoning
- If verdict is "go with moderate confidence", flag for human decision

**Page Structure** (`app/(validation)/validation/[conceptId]/page.tsx`):
```typescript
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ValidationDetailClient } from "./components/ValidationDetailClient";

export default async function ValidationDetailPage({
  params: { conceptId },
}: {
  params: { conceptId: string };
}) {
  const supabase = await createServerSupabaseClient();

  // Fetch concept and validation report
  const { data: concept } = await supabase
    .from("concepts")
    .select("*")
    .eq("id", conceptId)
    .single();

  const { data: validation } = await supabase
    .from("validation_reports")
    .select("*")
    .eq("concept_id", conceptId)
    .single();

  return (
    <ValidationDetailClient
      concept={concept}
      validation={validation}
      conceptId={conceptId}
    />
  );
}
```

**Client Component with Tabs and Verdict Display**:
```typescript
"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shared/Tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";
import { MarketSizeChart } from "./MarketSizeChart";
import { CompetitorComparison } from "./CompetitorComparison";
import { EconomicsTable } from "./EconomicsTable";
import { VerdictCard } from "./VerdictCard";

export function ValidationDetailClient({
  concept,
  validation,
  conceptId,
}) {
  const [activeTab, setActiveTab] = useState("verdict");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{concept.title}</h1>
        <Badge
          variant={validation.overall_verdict === "go" ? "success" : "danger"}
        >
          {validation.overall_verdict.toUpperCase()}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="verdict">Verdict</TabsTrigger>
          <TabsTrigger value="market">Market Sizing</TabsTrigger>
          <TabsTrigger value="competitive">Competitive</TabsTrigger>
          <TabsTrigger value="customer">Customer Signals</TabsTrigger>
          <TabsTrigger value="feasibility">Feasibility</TabsTrigger>
          <TabsTrigger value="economics">Unit Economics</TabsTrigger>
        </TabsList>

        <TabsContent value="verdict">
          <VerdictCard
            verdict={validation.overall_verdict}
            confidence={validation.confidence}
            reasoning={validation.reasoning}
          />
        </TabsContent>

        <TabsContent value="market">
          <MarketSizeChart marketSizing={validation.market_sizing} />
        </TabsContent>

        <TabsContent value="competitive">
          <CompetitorComparison competitive={validation.competitive_verdict} />
        </TabsContent>

        <TabsContent value="economics">
          <EconomicsTable economics={validation.unit_economics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 3.5 Blueprint View

**Purpose:** Final deliverable rendering — complete, rich company blueprint with navigation and export.

**Route:** `/blueprint/:blueprintId`

**Features:**
- Navigation sidebar with section links
- Rich document rendering (sections: executive summary, business model, agent architecture, GTM, risk register, resource plan)
- Smooth scroll-to-section navigation
- Print-friendly layout
- Download as PDF button
- Metadata: created date, concept ID, based on validation data

**Layout with Navigation** (`app/(blueprint)/blueprint/[blueprintId]/layout.tsx`):
```typescript
import { BlueprintNav } from "./components/BlueprintNav";

export default function BlueprintLayout({
  children,
  params: { blueprintId },
}: {
  children: React.ReactNode;
  params: { blueprintId: string };
}) {
  const sections = [
    { id: "executive-summary", label: "Executive Summary" },
    { id: "business-model", label: "Business Model" },
    { id: "agent-architecture", label: "Agent Architecture" },
    { id: "gtm-plan", label: "Go-to-Market" },
    { id: "risk-register", label: "Risk Register" },
    { id: "resource-plan", label: "Resource Plan" },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <BlueprintNav sections={sections} blueprintId={blueprintId} />
      <div className="lg:col-span-3">{children}</div>
    </div>
  );
}
```

**Main Blueprint Page** (`app/(blueprint)/blueprint/[blueprintId]/page.tsx`):
```typescript
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BlueprintRenderer } from "./components/BlueprintRenderer";

export default async function BlueprintPage({
  params: { blueprintId },
}: {
  params: { blueprintId: string };
}) {
  const supabase = await createServerSupabaseClient();

  const { data: blueprint } = await supabase
    .from("blueprints")
    .select("*")
    .eq("id", blueprintId)
    .single();

  if (!blueprint) {
    return <div>Blueprint not found</div>;
  }

  return <BlueprintRenderer blueprint={blueprint} />;
}
```

**BlueprintRenderer Component**:
```typescript
"use client";
import { useRef } from "react";
import { Button } from "@/components/shared/Button";
import { ExecutiveSummary } from "./sections/ExecutiveSummary";
import { BusinessModel } from "./sections/BusinessModel";
import { AgentArchitecture } from "./sections/AgentArchitecture";
import { GTMPlan } from "./sections/GTMPlan";
import { RiskRegister } from "./sections/RiskRegister";
import { ResourcePlan } from "./sections/ResourcePlan";

export function BlueprintRenderer({ blueprint }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    if (printRef.current) {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button onClick={handlePrint} variant="outline">
          Print / PDF
        </Button>
      </div>

      <div ref={printRef} className="space-y-8 print:space-y-12">
        <ExecutiveSummary data={blueprint.business_model} />
        <BusinessModel data={blueprint.business_model} />
        <AgentArchitecture data={blueprint.agent_architecture} />
        <GTMPlan data={blueprint.gtm_plan} />
        <RiskRegister data={blueprint.risk_register} />
        <ResourcePlan data={blueprint.resource_plan} />
      </div>
    </div>
  );
}
```

---

## 4. Component Library

### 4.1 Recommended UI Component Approach

Use **shadcn/ui** + **Tailwind CSS** as the foundation. This provides:

- Pre-built, highly customizable components (button, input, select, modal, tabs, etc.)
- Consistent design system out of the box
- Easy integration with Tailwind for styling
- Copy-and-customize approach (no external dependency for component code)

**Setup**:
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input select tabs modal badge
```

### 4.2 Key Shared Components

**ScoreCard** — Display a numeric score with visual indicator:
```typescript
// components/shared/ScoreCard.tsx
interface ScoreCardProps {
  score: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function ScoreCard({ score, max = 100, size = "md", label }: ScoreCardProps) {
  const percentage = (score / max) * 100;
  const bgColor =
    score >= 80 ? "bg-green-100" :
    score >= 60 ? "bg-yellow-100" :
    "bg-red-100";
  const textColor =
    score >= 80 ? "text-green-700" :
    score >= 60 ? "text-yellow-700" :
    "text-red-700";

  const sizeClasses = {
    sm: "text-2xl w-20 h-20",
    md: "text-3xl w-24 h-24",
    lg: "text-4xl w-32 h-32",
  };

  return (
    <div className={`rounded-full flex items-center justify-center ${bgColor} ${sizeClasses[size]}`}>
      <div className="text-center">
        <div className={`font-bold ${textColor}`}>{score}</div>
        {label && <div className="text-xs text-gray-600">{label}</div>}
      </div>
    </div>
  );
}
```

**StatusBadge** — Show status with appropriate color:
```typescript
// components/shared/StatusBadge.tsx
type Status = "candidate" | "watchlist" | "generated" | "selected" | "validation" | "go" | "no-go" | "archived";

const statusConfig: Record<Status, { bg: string; text: string; label: string }> = {
  candidate: { bg: "bg-blue-50", text: "text-blue-700", label: "Candidate" },
  watchlist: { bg: "bg-purple-50", text: "text-purple-700", label: "Watchlist" },
  generated: { bg: "bg-amber-50", text: "text-amber-700", label: "Generated" },
  selected: { bg: "bg-green-50", text: "text-green-700", label: "Selected" },
  validation: { bg: "bg-blue-50", text: "text-blue-700", label: "In Validation" },
  go: { bg: "bg-green-50", text: "text-green-700", label: "Go" },
  "no-go": { bg: "bg-red-50", text: "text-red-700", label: "No-Go" },
  archived: { bg: "bg-gray-50", text: "text-gray-700", label: "Archived" },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
```

**PipelineProgressIndicator** — Show position in pipeline:
```typescript
// components/shared/PipelineProgressIndicator.tsx
type Phase = "discovery" | "ideation" | "validation" | "blueprint";

export function PipelineProgressIndicator({ currentPhase }: { currentPhase: Phase }) {
  const phases: Phase[] = ["discovery", "ideation", "validation", "blueprint"];
  const currentIndex = phases.indexOf(currentPhase);

  return (
    <div className="flex items-center gap-4">
      {phases.map((phase, i) => (
        <div key={phase} className="flex items-center">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
              i <= currentIndex
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {i + 1}
          </div>
          <span className="ml-2 text-sm font-medium">{phase}</span>
          {i < phases.length - 1 && (
            <div
              className={`mx-4 h-1 w-8 ${
                i < currentIndex ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

**DataTable** — Generic table for lists with sorting/filtering:
```typescript
// components/shared/DataTable.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={String(col.key)}>{col.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow
            key={row.id}
            onClick={() => onRowClick?.(row)}
            className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
          >
            {columns.map((col) => (
              <TableCell key={String(col.key)}>
                {col.render ? col.render(row[col.key], row) : String(row[col.key])}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**ChartCard** — Wrapper for chart components (recharts):
```typescript
// components/shared/ChartCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/Card";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  subtitle?: string;
}

export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
```

### 4.3 Design System Basics

**Color Palette** (`tailwind.config.ts`):
```typescript
export default {
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          50: "#f0f9ff",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          900: "#082f49",
        },
        // Success (go/approved)
        success: {
          50: "#f0fdf4",
          500: "#22c55e",
          600: "#16a34a",
        },
        // Danger (no-go/rejected)
        danger: {
          50: "#fef2f2",
          500: "#ef4444",
          600: "#dc2626",
        },
        // Warning (pending/in progress)
        warning: {
          50: "#fffbeb",
          500: "#f59e0b",
          600: "#d97706",
        },
      },
    },
  },
};
```

**Typography**:
- **Headings:** Inter, 600–700 weight
- **Body:** Inter, 400–500 weight
- **Mono:** JetBrains Mono for code/data

**Spacing:** 4px base unit (4, 8, 12, 16, 24, 32, 48, 64, etc.)

**Border Radius:** 8px standard, 12px for cards, 4px for small elements

---

## 5. State Management

### 5.1 Server State via Supabase

Most data (opportunities, concepts, validation reports) lives in Supabase. Server Components fetch on initial load; Client Components subscribe to Realtime for updates.

**Pattern:**
1. Server Component fetches initial data at route level
2. Pass initial data to Client Component as prop
3. Client Component sets up Realtime subscription
4. On update events, merge into local state
5. No separate caching layer needed

### 5.2 Client State for UI Concerns

Local state handles UI-only concerns: selected rows, open modals, active tabs, filter panels.

**Example: Filter and Sort State**:
```typescript
"use client";
import { useState, useMemo } from "react";

export function ConceptList({ initialConcepts }) {
  // UI state
  const [filters, setFilters] = useState({ status: null, minScore: 0 });
  const [sortBy, setSortBy] = useState<"score" | "date">("score");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);

  // Compute filtered/sorted view from data
  const filtered = useMemo(() => {
    return initialConcepts
      .filter((c) => !filters.status || c.status === filters.status)
      .filter((c) => c.composite_score >= filters.minScore)
      .sort((a, b) =>
        sortBy === "score"
          ? b.composite_score - a.composite_score
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [initialConcepts, filters, sortBy]);

  return (
    <div>
      <FilterPanel filters={filters} onFilterChange={setFilters} />
      <ConceptTable
        concepts={filtered}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </div>
  );
}
```

### 5.3 Optimistic Updates

For human review actions (approve/reject), use optimistic updates to provide instant UI feedback:

```typescript
"use client";
async function approveConcept(conceptId: string) {
  // Optimistic update
  setOpportunities((prev) =>
    prev.map((c) =>
      c.id === conceptId ? { ...c, status: "selected" } : c
    )
  );

  // Actual mutation
  const { error } = await supabase
    .from("concepts")
    .update({ status: "selected" })
    .eq("id", conceptId);

  if (error) {
    // Rollback on error
    setOpportunities((prev) =>
      prev.map((c) =>
        c.id === conceptId ? { ...c, status: "generated" } : c
      )
    );
    toast.error("Failed to approve concept");
  } else {
    toast.success("Concept approved");
  }
}
```

### 5.4 Supabase Realtime for Live Pipeline

The entire pipeline is driven by Realtime updates. When an agent completes work (e.g., finishes concept scoring), a row is inserted or updated in the database, triggering all subscribed clients to refresh:

```typescript
// E.g., agent publishes: INSERT into concepts (...)
// All browsers with WatchlistClient subscribed to concepts table see new concept appear in real time

useEffect(() => {
  const subscription = supabase
    .channel("concepts")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "concepts" },
      (payload) => {
        // New concept generated by agent
        setConcepts((prev) => [...prev, payload.new]);
      }
    )
    .subscribe();
  return () => subscription.unsubscribe();
}, [supabase]);
```

---

## 6. Performance

### 6.1 Static Generation

Use Next.js static generation for content that doesn't change frequently:

```typescript
// app/(settings)/scoring-thresholds/page.tsx
// No user-specific data, can be static

export const revalidate = 3600; // Revalidate every hour

export default async function ScoringThresholdsPage() {
  const thresholds = await fetchScoringThresholds();
  return <SettingsForm defaultValues={thresholds} />;
}
```

### 6.2 Dynamic Rendering

Render dynamically for user-specific, frequently-updated data:

```typescript
// app/(ideation)/concepts/page.tsx
// User-specific pipeline data, must be dynamic

export const revalidate = false; // Always dynamic

export default async function ConceptsPage() {
  // Fetches fresh data on every request
  const concepts = await supabase
    .from("concepts")
    .select("*")
    .eq("account_id", userId);

  return <ConceptList initialConcepts={concepts} />;
}
```

### 6.3 Streaming and Suspense

Use React Suspense + Next.js streaming for slow loads:

```typescript
import { Suspense } from "react";
import { ConceptsSkeleton } from "./components/ConceptsSkeleton";
import { ConceptList } from "./components/ConceptList";

export default function ConceptsPage() {
  return (
    <Suspense fallback={<ConceptsSkeleton />}>
      <ConceptList />
    </Suspense>
  );
}

// components/ConceptList.tsx
async function ConceptList() {
  // This fetch can be slow; will stream to browser while loading
  const concepts = await supabase
    .from("concepts")
    .select("*")
    .eq("status", "generated");

  return <ConceptTable concepts={concepts} />;
}
```

### 6.4 Image and Asset Optimization

Use Next.js Image component for automatic optimization:

```typescript
import Image from "next/image";

<Image
  src="/logo.png"
  alt="Company Builder"
  width={200}
  height={50}
  priority // Load first (for above-the-fold images)
/>
```

Serve static assets through Vercel's CDN. Cloudflare in front provides caching and edge optimization.

---

## 7. Authentication and Authorization

### 7.1 Login Flow

Supabase Auth handles authentication. Users sign in with email/password or OAuth.

**Login Page** (`app/auth/login/page.tsx`):
```typescript
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
  }

  return (
    <form onSubmit={handleLogin} className="max-w-md mx-auto space-y-4 mt-8">
      <h1 className="text-2xl font-bold">Sign In</h1>
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
```

### 7.2 Role-Based Access

Supabase Auth stores user metadata including role. Use this for authorization:

```typescript
// lib/hooks/useAuth.ts
"use client";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setRole(session?.user.user_metadata?.role || "viewer");
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setRole(session?.user.user_metadata?.role || "viewer");
    });

    return () => subscription?.unsubscribe();
  }, [supabase]);

  return { session, role, loading };
}
```

**Protected Component**:
```typescript
"use client";
import { useAuth } from "@/lib/hooks/useAuth";

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (role !== "admin") {
    return <div className="text-red-600">Access denied</div>;
  }

  return <>{children}</>;
}
```

### 7.3 Protected Routes

Use middleware to redirect unauthenticated users:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|auth|favicon).*)"],
};
```

---

## 8. Code Structure

### 8.1 Recommended Folder Layout

```
app/
├── (route-group)/
│   ├── page.tsx           # Server component, fetches initial data
│   ├── layout.tsx         # Group-specific layout
│   ├── loading.tsx        # Suspense fallback
│   ├── error.tsx          # Error boundary
│   ├── [id]/
│   │   ├── page.tsx       # Detail page
│   │   └── components/
│   │       └── DetailView.tsx
│   └── components/
│       ├── Card.tsx
│       ├── Filter.tsx
│       └── List.tsx

lib/
├── supabase/
│   ├── server.ts          # Server-side client
│   ├── browser.ts         # Browser-side client
│   ├── types.ts           # Database types
│   └── queries.ts         # Common queries
├── hooks/
│   ├── useAuth.ts
│   ├── usePipeline.ts
│   └── useLocalFilters.ts
└── utils/
    ├── scoreUtils.ts
    └── formatters.ts

components/
├── shared/                # Reusable UI components
│   ├── ScoreCard.tsx
│   ├── StatusBadge.tsx
│   └── DataTable.tsx
├── layout/                # Layout components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
└── auth/                  # Auth components
    ├── LoginForm.tsx
    └── ProtectedRoute.tsx
```

### 8.2 Naming Conventions

- **Pages:** `page.tsx` (always lowercase, no custom names)
- **Components:** PascalCase, e.g., `ConceptCard.tsx`, `WatchlistFilter.tsx`
- **Hooks:** camelCase with `use` prefix, e.g., `useAuth.ts`, `usePipeline.ts`
- **Utilities:** camelCase, e.g., `scoreUtils.ts`, `formatters.ts`
- **Types:** PascalCase with `Types` or in `types.ts` files, e.g., `Concept`, `ValidationReport`

### 8.3 API Routes Structure

Most data fetching goes through Supabase directly. API routes are only needed for:
- Webhook receivers from agent services
- Complex server logic that shouldn't expose Supabase queries

```typescript
// app/api/webhooks/agents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const payload = await request.json();

  const supabase = await createServerSupabaseClient();

  // Example: Agent completed concept scoring
  if (payload.event === "concept_scored") {
    const { concept_id, scores } = payload;

    const { error } = await supabase
      .from("concepts")
      .update({
        disruption_score: scores.disruption,
        agent_readiness: scores.agent_readiness,
        feasibility: scores.feasibility,
        composite_score: scores.composite,
      })
      .eq("id", concept_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}
```

---

## 9. Reference Implementation: Pipeline Dashboard

This section shows a complete, detailed example of the Pipeline Dashboard page integrating all patterns.

### 9.1 Server Component: Fetch and Render

```typescript
// app/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PipelineClient } from "@/components/dashboard/PipelineClient";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch phase summaries
  const [
    { data: opportunities },
    { data: concepts },
    { data: validationReports },
  ] = await Promise.all([
    supabase
      .from("opportunities")
      .select("status")
      .eq("account_id", user.id),
    supabase
      .from("concepts")
      .select("status, opportunity_id")
      .in(
        "opportunity_id",
        (await supabase
          .from("opportunities")
          .select("id")
          .eq("account_id", user.id)
          .then((r) => r.data?.map((o) => o.id) || []))
      ),
    supabase
      .from("validation_reports")
      .select("overall_verdict")
      .in(
        "concept_id",
        (await supabase
          .from("concepts")
          .select("id")
          .then((r) => r.data?.map((c) => c.id) || []))
      ),
  ]);

  // Compute phase counts
  const phaseCounts = {
    discovery:
      opportunities?.filter((o) => o.status === "watchlist").length || 0,
    ideation: concepts?.filter((c) => c.status === "selected").length || 0,
    validation: validationReports?.length || 0,
    blueprint: validationReports?.filter(
      (v) => v.overall_verdict === "go"
    ).length || 0,
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Pipeline Dashboard</h1>
      <PipelineClient initialPhaseCounts={phaseCounts} userId={user.id} />
    </div>
  );
}
```

### 9.2 Client Component: Real-time Updates and Interactivity

```typescript
// components/dashboard/PipelineClient.tsx
"use client";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { PipelineProgressIndicator } from "@/components/shared/PipelineProgressIndicator";
import { RecentActivity } from "./RecentActivity";

interface PhaseCounts {
  discovery: number;
  ideation: number;
  validation: number;
  blueprint: number;
}

export function PipelineClient({
  initialPhaseCounts,
  userId,
}: {
  initialPhaseCounts: PhaseCounts;
  userId: string;
}) {
  const [phaseCounts, setPhaseCounts] = useState(initialPhaseCounts);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    // Subscribe to opportunities changes
    const oppSubscription = supabase
      .channel("opportunities-dashboard")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "opportunities",
          filter: `account_id=eq.${userId}`,
        },
        (payload) => {
          // Recount based on status
          setPhaseCounts((prev) => {
            const updated = { ...prev };
            if (payload.eventType === "UPDATE") {
              const old = payload.old as any;
              const newRow = payload.new as any;
              if (old.status !== newRow.status) {
                if (old.status === "watchlist") updated.discovery--;
                if (newRow.status === "watchlist") updated.discovery++;
              }
            }
            return updated;
          });
        }
      )
      .subscribe();

    // Subscribe to concepts changes
    const conceptSubscription = supabase
      .channel("concepts-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "concepts" },
        (payload) => {
          setPhaseCounts((prev) => {
            const updated = { ...prev };
            if (payload.eventType === "UPDATE") {
              const old = payload.old as any;
              const newRow = payload.new as any;
              if (old.status !== newRow.status) {
                if (old.status === "selected") updated.ideation--;
                if (newRow.status === "selected") updated.ideation++;
              }
            }
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      oppSubscription.unsubscribe();
      conceptSubscription.unsubscribe();
    };
  }, [userId, supabase]);

  const phases = [
    {
      name: "Discovery",
      count: phaseCounts.discovery,
      href: "/watchlist",
      color: "blue",
    },
    {
      name: "Ideation",
      count: phaseCounts.ideation,
      href: "/concepts",
      color: "purple",
    },
    {
      name: "Validation",
      count: phaseCounts.validation,
      href: "/validation",
      color: "amber",
    },
    {
      name: "Blueprint",
      count: phaseCounts.blueprint,
      href: "/blueprint",
      color: "green",
    },
  ];

  const totalActive =
    phaseCounts.discovery +
    phaseCounts.ideation +
    phaseCounts.validation +
    phaseCounts.blueprint;

  return (
    <div className="space-y-8">
      {/* Phase overview cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {phases.map((phase) => (
          <Card key={phase.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{phase.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-bold text-blue-600">
                {phase.count}
              </div>
              <p className="text-sm text-gray-600">
                {phase.count === 1 ? "idea" : "ideas"} in phase
              </p>
              <Button variant="outline" size="sm" href={phase.href}>
                View →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall status */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-700">
              Total ideas in pipeline
            </p>
            <p className="text-3xl font-bold mt-1">{totalActive}</p>
          </div>
          <PipelineProgressIndicator currentPhase="ideation" />
        </CardContent>
      </Card>

      {/* Recent activity */}
      <RecentActivity userId={userId} />
    </div>
  );
}
```

### 9.3 Recent Activity Component

```typescript
// components/dashboard/RecentActivity.tsx
"use client";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/Card";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: "concept_created" | "concept_approved" | "validation_completed";
  message: string;
  timestamp: string;
}

export function RecentActivity({ userId }: { userId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    async function loadInitial() {
      const { data: recentConcepts } = await supabase
        .from("concepts")
        .select("id, title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      const activities = (recentConcepts || []).map((c: any) => ({
        id: c.id,
        type: c.status === "selected" ? "concept_approved" : "concept_created",
        message: `${c.status === "selected" ? "Approved" : "Generated"} concept: ${c.title}`,
        timestamp: c.created_at,
      }));

      setActivities(activities);
    }

    loadInitial();

    // Subscribe to new concepts
    const subscription = supabase
      .channel("recent-activity")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "concepts" },
        (payload) => {
          const concept = payload.new as any;
          setActivities((prev) => [
            {
              id: concept.id,
              type: "concept_created",
              message: `Generated concept: ${concept.title}`,
              timestamp: concept.created_at,
            },
            ...prev.slice(0, 4),
          ]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-gray-500 text-sm">No activity yet</p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 text-sm border-b pb-3 last:border-0"
              >
                <div className="text-gray-400">
                  {activity.type === "concept_created" && "✨"}
                  {activity.type === "concept_approved" && "✓"}
                  {activity.type === "validation_completed" && "📊"}
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 10. Deployment and Hosting

### 10.1 Vercel Deployment

The application is built and deployed on Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

Environment variables (set in Vercel dashboard):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 10.2 Cloudflare Security

Cloudflare sits in front of the Vercel deployment, providing:
- DDoS protection
- WAF (Web Application Firewall)
- Caching and edge optimization
- SSL/TLS termination

Configure DNS to point to Cloudflare nameservers, and set origin to Vercel domain.

---

## 11. Testing Strategy

### 11.1 Unit Tests (Jest)

```typescript
// components/shared/ScoreCard.test.tsx
import { render, screen } from "@testing-library/react";
import { ScoreCard } from "./ScoreCard";

describe("ScoreCard", () => {
  it("displays the score", () => {
    render(<ScoreCard score={85} />);
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("applies correct color based on score", () => {
    const { rerender } = render(<ScoreCard score={85} />);
    expect(screen.getByText("85")).toHaveClass("text-green-700");

    rerender(<ScoreCard score={50} />);
    expect(screen.getByText("50")).toHaveClass("text-yellow-700");

    rerender(<ScoreCard score={25} />);
    expect(screen.getByText("25")).toHaveClass("text-red-700");
  });
});
```

### 11.2 Integration Tests (Cypress/Playwright)

```typescript
// e2e/watchlist.spec.ts
import { test, expect } from "@playwright/test";

test("user can filter watchlist by sector", async ({ page }) => {
  await page.goto("/watchlist");
  await page.waitForSelector("[data-testid=opportunity-card]");

  await page.selectOption("[data-testid=sector-filter]", "SaaS");

  const cards = page.locator("[data-testid=opportunity-card]");
  await expect(cards.first()).toContainText("SaaS");
});
```

---

## Summary

This technical design provides a complete blueprint for building Company Builder's UI layer:

- **Next.js App Router** organizes the app into logical route groups
- **Supabase** provides real-time data and authentication
- **Server Components** fetch initial data; **Client Components** handle interactivity and subscriptions
- **shadcn/ui + Tailwind CSS** form the component library
- **State management** leverages Supabase Realtime for live updates
- **Four primary surfaces** (pipeline dashboard, watchlist, concept review, blueprint viewer) demonstrate the full pattern
- **Code structure** and naming conventions ensure consistency
- **Performance** is optimized through static generation, dynamic rendering, and Vercel CDN
- **Authentication and authorization** use Supabase Auth with role-based access control

All code examples are production-ready TypeScript/React, following Next.js App Router best practices.
