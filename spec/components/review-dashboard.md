# Review Dashboard — Component Specification

## 1. Purpose & Responsibility

The Review Dashboard is the human-facing interface for Company Builder. It enables operators, founders, and stakeholders to:

- **Monitor pipeline status:** View real-time progress of opportunities and concepts through phases.
- **Review and override:** Inspect the outputs of each agent step and manually approve, reject, or hold items at phase gates.
- **Provide context:** Add comments, tags, and domain expertise to items.
- **Deep-dive analysis:** Examine why an opportunity or concept received its score; understand the evidence.
- **Make decisions:** Override automatic gate decisions with manual approval/rejection and provide reasoning.
- **Trend analysis:** See patterns (e.g., "80% of healthtech concepts validate well"; "signal-detector is noisy").

The dashboard is **read-heavy** (displays outputs) and **write-light** (human annotations, overrides). It is not responsible for generating content; agents and orchestrators do that.

---

## 2. Inputs

The Review Dashboard receives inputs via queries to the Data Store and real-time updates from the Pipeline Orchestrator.

### 2.1 Data Store Queries

The dashboard reads:

- **Pipeline summary:** Counts of items per phase per status.
  ```sql
  SELECT phase, status, COUNT(*) FROM pipeline_items GROUP BY phase, status
  ```

- **Item list:** Recent items, filtered by phase/status/tags.
  ```sql
  SELECT id, type, phase, status, phase_data->>'name', updated_at FROM pipeline_items
  WHERE phase = ? AND status = ?
  ORDER BY updated_at DESC
  LIMIT 50
  ```

- **Item detail:** Full item record with all outputs, tasks, comments, tags, decisions.
  ```sql
  SELECT pi.*, gd.decision, ic.text as comments, it.tag
  FROM pipeline_items pi
  LEFT JOIN gate_decisions gd ON pi.id = gd.item_id
  LEFT JOIN item_comments ic ON pi.id = ic.item_id
  LEFT JOIN item_tags it ON pi.id = it.item_id
  WHERE pi.id = ?
  ```

- **Blocked items:** Items stuck, with reasons.
  ```sql
  SELECT id, phase, status, updated_at FROM pipeline_items
  WHERE status IN ('blocked', 'failed')
  ORDER BY updated_at DESC
  ```

- **Task history:** Execution records for each agent step.
  ```sql
  SELECT task_id, agent_name, phase, step, status, execution_time_ms, error_message
  FROM task_history
  WHERE item_id = ?
  ORDER BY started_at DESC
  ```

### 2.2 Real-Time Updates

The dashboard subscribes to event streams from the Pipeline Orchestrator:

```json
{
  "eventType": "item_created" | "step_completed" | "step_failed" | "gate_decision",
  "itemId": "uuid",
  "phase": 0 | 1 | 2 | 3,
  "timestamp": "ISO-8601",
  "details": {...}
}
```

These are delivered via:
- **WebSocket:** For real-time alerts and status updates.
- **Server-Sent Events (SSE):** Alternative for simpler deployments.
- **Polling fallback:** If WebSocket unavailable, poll every 5 seconds.

### 2.3 User Input

Users provide input via forms:

- **Manual override:** Approve/reject/hold an item at a gate.
  ```json
  {
    "itemId": "uuid",
    "phase": 0 | 1 | 2,
    "decision": "approved" | "rejected" | "hold",
    "reasoning": "string (optional)",
    "userId": "uuid"
  }
  ```

- **Comments:** Add notes to an item.
  ```json
  {
    "itemId": "uuid",
    "text": "string",
    "userId": "uuid"
  }
  ```

- **Tags:** Add labels.
  ```json
  {
    "itemId": "uuid",
    "tags": ["tag1", "tag2"]
  }
  ```

- **Filters & Search:** Find specific items.
  ```json
  {
    "phase": 0 | 1 | null (all),
    "status": "in_progress" | null,
    "type": "opportunity" | "concept" | null,
    "searchText": "string (searches name, description, comments)",
    "tags": ["tag1", "tag2"],
    "sortBy": "updated_at" | "phase" | "status"
  }
  ```

---

## 3. Outputs

The Review Dashboard produces:

### 3.1 UI Renders (HTML/JSON)

The dashboard renders views to users:

- **Pipeline overview:** Summary view of all phases.
- **Phase view:** Detailed list of items in a specific phase.
- **Item detail view:** Full view of a single item with all outputs and history.
- **Blocked items view:** Items needing attention.

These are rendered as:
- **Web pages (HTML):** Traditional full-page renders (server-side or client-side SPA).
- **JSON API responses:** For consumption by other tools (Slack bot, mobile app, etc.).

### 3.2 Write Operations

The dashboard submits writes to the Data Store:

- **Manual override:** POST to `POST /api/items/{itemId}/override`
  ```json
  {
    "phase": 0,
    "decision": "approved",
    "reasoning": "Domain expertise suggests this market is underestimated"
  }
  ```

- **Comment:** POST to `POST /api/items/{itemId}/comments`
  ```json
  {
    "text": "Validated with 3 industry experts. High confidence."
  }
  ```

- **Tags:** POST to `POST /api/items/{itemId}/tags`
  ```json
  {
    "tags": ["healthtech", "early-stage"]
  }
  ```

---

## 4. Core Logic / Algorithm

### 4.1 View Architecture

The dashboard is built as a **single-page application (SPA)** with modular views:

```
Dashboard (Root)
├── PipelineSummary
│   └── PhaseCard (Phase 0, 1, 2, 3)
│       └── StatusBadge (queued, in_progress, etc.)
├── ItemList
│   ├── FilterBar
│   └── ItemRow (for each item)
│       └── Click → ItemDetail
├── ItemDetail
│   ├── Header (name, phase, status)
│   ├── PhaseData (markdown rendering of phase_data)
│   ├── TaskHistory (task execution records)
│   ├── GateDecision (current decision, auto vs manual)
│   ├── Comments (human annotations)
│   ├── Tags (labels)
│   └── ActionBar
│       ├── ApproveButton
│       ├── RejectButton
│       ├── HoldButton
│       └── CommentForm
├── BlockedItems
│   └── Alert + List of blocked items
└── TrendAnalysis (optional)
    ├── SuccessRateByPhase
    ├── ScoreDistribution
    └── AgentPerformance
```

### 4.2 Data Flow

**Initial Load:**

```
User navigates to /dashboard
  ↓
Fetch pipeline summary (GET /api/summary)
  ↓
Render PipelineSummary with phase counts
  ↓
Display ItemList (default: all phases, status=in_progress)
  ↓
Subscribe to real-time updates (WebSocket /ws/updates)
```

**Real-Time Updates:**

```
Orchestrator emits event: {eventType: "step_completed", itemId: "123", ...}
  ↓
WebSocket receives event
  ↓
Dashboard updates local state: Increment phase X's in_progress count
  ↓
Re-render affected views
  ↓
Optional: Show toast notification "Concept X moved to Phase 2"
```

**Item Detail View:**

```
User clicks on item in list
  ↓
Fetch item detail (GET /api/items/{itemId})
  ↓
Render ItemDetail with:
  - Item metadata (name, phase, status)
  - Phase-specific outputs (phase_data rendered as formatted text/JSON)
  - Task history (agent execution logs, timing, errors)
  - Gate decision (auto score or manual override)
  - Comments and tags
  - Action buttons (Approve, Reject, Hold if gate pending)
```

**Manual Override:**

```
User clicks "Approve" button
  ↓
Open confirmation dialog: "Override auto decision. Reasoning?"
  ↓
User enters reasoning text
  ↓
Click "Confirm"
  ↓
POST /api/items/{itemId}/override {decision: "approved", reasoning: "..."}
  ↓
Backend writes to Data Store
  ↓
Orchestrator is notified (reads override at next gate)
  ↓
Update UI: Show "Manual override: approved (reason: ...)"
  ↓
If gate can now execute: Update status in real-time
```

### 4.3 State Management

For a React-based dashboard, use Redux or Zustand:

```typescript
// State shape
{
  pipeline: {
    summary: {
      phase0: {queued: 5, in_progress: 2, completed: 50, rejected: 10},
      phase1: {...},
      ...
    },
    items: [
      {id: "opt-001", type: "opportunity", phase: 1, status: "in_progress", ...},
      ...
    ],
    selectedItemId: "opt-001"
  },
  ui: {
    filters: {
      phase: null,
      status: null,
      tags: [],
      searchText: ""
    },
    loading: false,
    error: null
  },
  itemDetail: {
    opt001: {
      item: {...},
      tasks: [...],
      gateDecision: {...},
      comments: [...],
      tags: [...]
    }
  }
}
```

**Actions (Redux):**

```typescript
dispatch(fetchPipelineSummary());
dispatch(fetchItemList({phase: 1, status: "in_progress"}));
dispatch(fetchItemDetail(itemId));
dispatch(submitOverride({itemId, phase, decision, reasoning}));
dispatch(addComment({itemId, text}));
dispatch(updateTags({itemId, tags}));
dispatch(applyFilters({phase, status, tags, searchText}));
```

### 4.4 Real-Time Updates

Using WebSocket subscription:

```typescript
// Connection
const ws = new WebSocket("wss://dashboard.company-builder.local/ws/updates");

// Event listener
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);

  switch (update.eventType) {
    case "step_completed":
      // Update item in local state
      dispatch(updateItem(update.itemId, {status: "in_progress"}));
      // Update phase summary
      dispatch(updatePhaseSummary(update.phase, "in_progress", +1));
      // Show toast
      showToast(`Step ${update.step} completed for ${update.itemId}`);
      break;

    case "gate_decision":
      // Item moved to next phase
      dispatch(updateItem(update.itemId, {phase: update.newPhase, status: "queued"}));
      dispatch(updatePhaseSummary(update.oldPhase, "completed", +1));
      dispatch(updatePhaseSummary(update.newPhase, "queued", +1));
      break;

    case "step_failed":
      dispatch(updateItem(update.itemId, {status: "blocked"}));
      showAlert(`Step ${update.step} failed: ${update.error}`);
      break;
  }
};
```

---

## 5. Data Sources & Integrations

### 5.1 Data Store (Primary)

The dashboard queries the Data Store via REST API:

```
GET /api/pipeline/summary          → Pipeline counts
GET /api/items                     → List items with filtering
GET /api/items/{itemId}            → Item detail with all related data
GET /api/items/{itemId}/tasks      → Task history
GET /api/items/{itemId}/comments   → Comments
POST /api/items/{itemId}/override  → Submit manual override
POST /api/items/{itemId}/comments  → Add comment
POST /api/items/{itemId}/tags      → Update tags
```

### 5.2 Pipeline Orchestrator (Real-Time Events)

The dashboard subscribes to orchestrator event stream via WebSocket:

```
WebSocket /ws/updates (subscribes to all events)
```

### 5.3 Authentication & Authorization

Integrate with identity provider:

- **SSO:** OAuth 2.0 / OIDC (e.g., Auth0, Okta).
- **Permissions:** Role-based access control (RBAC).
  - **Viewer:** Can see all data.
  - **Reviewer:** Can see all data + add comments.
  - **Approver:** Can see all data + add comments + override decisions.
  - **Admin:** Full access + manage users.

---

## 6. Architecture & Design Patterns

### 6.1 Frontend Architecture

**SPA Framework:** React 18+ with TypeScript

- Component-based UI.
- Hooks for state management.
- Context for cross-component data (auth, theme).

**State Management:** Redux Toolkit or Zustand

- Centralized state for pipeline data.
- Actions for fetches and user interactions.
- Selectors for derived views.

**API Client:** Axios or TanStack Query

- Type-safe API calls.
- Automatic caching and retries.
- Loading and error states.

**Real-Time:** Socket.io or native WebSocket

- Subscribe to orchestrator events.
- Auto-reconnect on disconnect.

### 6.2 Backend (Dashboard API)

The dashboard has a lightweight backend API that:

- **Proxies** Data Store queries (authentication, validation, caching).
- **Handles write operations** (comments, overrides, tags).
- **Manages WebSocket connections** for real-time updates.
- **Implements rate limiting** to protect Data Store.

**Tech Stack:** Node.js + Express, or Python + FastAPI.

**Endpoints:**

```
GET  /api/auth/me                  → Current user
POST /api/auth/logout              → Sign out

GET  /api/pipeline/summary         → Summary of all phases
GET  /api/items                    → List items (with filtering)
GET  /api/items/{itemId}           → Item detail
GET  /api/items/{itemId}/tasks     → Task history

POST /api/items/{itemId}/override  → Manual override (Approver+)
POST /api/items/{itemId}/comments  → Add comment (Reviewer+)
POST /api/items/{itemId}/tags      → Update tags (Reviewer+)

GET  /api/analytics/phase-outcomes → Success rates by phase
GET  /api/analytics/agent-stats    → Agent performance metrics
```

### 6.3 Caching & Performance

**Client-side caching:**
- Use TanStack Query with stale-while-revalidate strategy.
- Cache item details for 5 minutes.
- Invalidate on manual actions (override, comment).

**Server-side caching:**
- Cache pipeline summary (invalidate every 30 seconds).
- Cache task history (immutable, cache indefinitely).
- Use Redis for distributed caching.

### 6.4 Responsive Design

The dashboard works on:
- **Desktop:** Full-featured UI with side-by-side views.
- **Tablet:** Responsive layout, stacked views.
- **Mobile:** Mobile-optimized views (list view primary, detail modal).

Use CSS Grid + Flexbox; test with responsive design breakpoints.

---

## 7. Error Handling & Edge Cases

### 7.1 Network Disconnection

**Scenario:** User's internet connection drops while viewing dashboard.

**Handling:**
- Show "Disconnected" banner.
- Queue user actions (comments, overrides) in localStorage.
- Resume connection; sync queued actions.
- WebSocket auto-reconnect with exponential backoff.

### 7.2 Stale Data

**Scenario:** Real-time update arrives, but user is viewing old item detail.

**Handling:**
- Subscribe to item-specific events (e.g., `/ws/items/{itemId}`).
- Update item detail in real-time if user is viewing it.
- Show "This item was updated" notification with option to refresh.

### 7.3 Concurrent Overrides

**Scenario:** Two operators simultaneously override the same item.

**Handling:**
- Optimistic update on client (show override immediately).
- If server rejects (conflict), show error and reload from server.
- Server uses database-level locking to prevent concurrent overrides.

### 7.4 Large Item Outputs

**Scenario:** An agent produces a very large report (100 KB JSON).

**Handling:**
- Truncate large outputs in list view; show "..." with expand button.
- In detail view, lazy-load large outputs (pagination if needed).
- Syntax highlighting for JSON/code (use Monaco Editor for large code blocks).

### 7.5 Slow Queries

**Scenario:** Loading item detail takes > 3 seconds.

**Handling:**
- Show skeleton loading placeholders.
- Fetch data in priority order (metadata first, then tasks, then comments).
- Cache aggressively on client.
- Alert operators if query is slow; escalate to investigate.

### 7.6 WebSocket Lag

**Scenario:** Real-time updates are delayed; UI shows stale status.

**Handling:**
- Log WebSocket latency (measure round-trip time).
- If latency > 5 seconds, alert operators and fall back to polling.
- Periodic full refresh (e.g., every 30 seconds) to catch any missed updates.

---

## 8. Performance & Scaling

### 8.1 Target Metrics

- **Page load time:** < 2 seconds (first contentful paint).
- **Interaction latency:** < 100 ms (button click → action visible).
- **Real-time update latency:** < 1 second (event emitted → UI updated).

### 8.2 Scalability

**Concurrent users:**
- Expected: 10–20 simultaneous operators.
- Target: Support 100 concurrent users without degradation.

**Techniques:**
- Use WebSocket connection pooling (e.g., server can handle 100 concurrent WS connections).
- Rate-limit API calls per user (e.g., 100 req/minute).
- Cache aggressively to reduce database load.
- CDN for static assets (CSS, JS, images).

### 8.3 Optimization Strategies

- **Code splitting:** Load feature modules on demand.
- **Image optimization:** Use WebP; serve resized images.
- **Minification & compression:** GZIP all responses.
- **Service worker:** Offline support, cache static assets.

---

## 9. Dependencies

### 9.1 Depends On

- **Data Store:** For item queries and write endpoints.
- **Pipeline Orchestrator:** For real-time events (WebSocket).
- **Authentication service:** For SSO/OIDC.

### 9.2 Depended On By

- **Users:** Operators, reviewers, stakeholders access the dashboard.
- **Workflow:** Human decisions flow back to orchestrator, affecting pipeline.

---

## 10. Success Metrics

### 10.1 Adoption

- **Active users per week:** Measure how many operators use the dashboard.
- **Manual override rate:** Expect 5–15% of gate decisions to be overridden (high rate indicates bad auto-scoring).

### 10.2 Engagement

- **Average session duration:** Operators should spend 15–30 min reviewing items.
- **Comments per item:** Measure domain expertise contribution.
- **Time to override:** How quickly do operators make decisions (target: < 5 min per item).

### 10.3 Performance

- **Page load time P95:** < 3 seconds.
- **Real-time update latency P95:** < 2 seconds.
- **API error rate:** < 0.1%.
- **WebSocket uptime:** > 99.9%.

### 10.4 Business Impact

- **Override accuracy:** Track if operator overrides result in better outcomes (do overridden items validate better?).
- **Comment sentiment:** Analyze if comments highlight genuine insights or noise.

---

## 11. Implementation Notes

### 11.1 Recommended Tech Stack

**Frontend:**
- **React 18+:** Component framework.
- **TypeScript:** Type safety.
- **TanStack Query (React Query):** Data fetching and caching.
- **Zustand or Redux Toolkit:** State management.
- **Socket.io Client:** Real-time communication.
- **Tailwind CSS:** Styling.
- **Recharts or D3.js:** Charting (for analytics views).

**Backend API:**
- **Node.js + Express.js:** HTTP server.
- **Socket.io:** WebSocket server.
- **TypeScript:** Type safety.
- **Zod or Joi:** Request validation.
- **Morgan:** Request logging.

**Deployment:**
- **Vercel or Netlify:** Frontend deployment (SPA).
- **Heroku or AWS Lambda:** Backend API.
- **CloudFlare:** CDN and DDoS protection.

### 11.2 Directory Structure

```
dashboard/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PipelineSummary.tsx
│   │   │   ├── ItemList.tsx
│   │   │   ├── ItemDetail.tsx
│   │   │   ├── BlockedItems.tsx
│   │   │   └── shared/
│   │   │       ├── Navbar.tsx
│   │   │       ├── Filter.tsx
│   │   │       └── Toast.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── NotFound.tsx
│   │   ├── hooks/
│   │   │   ├── usePipeline.ts
│   │   │   ├── useItemDetail.ts
│   │   │   └── useRealTime.ts
│   │   ├── store/
│   │   │   ├── pipelineSlice.ts
│   │   │   ├── uiSlice.ts
│   │   │   └── store.ts
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   └── filters.ts
│   │   ├── styles/
│   │   │   └── globals.css
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── pipeline.ts
│   │   │   └── items.ts
│   │   ├── services/
│   │   │   ├── DataStoreClient.ts
│   │   │   └── WebSocketManager.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── validate.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── server.ts
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

### 11.3 Example Components

**PipelineSummary.tsx:**

```typescript
import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import { fetchPipelineSummary } from "../store/pipelineSlice";

export const PipelineSummary: React.FC = () => {
  const dispatch = useAppDispatch();
  const { summary, loading } = useAppSelector((state) => state.pipeline);

  useEffect(() => {
    dispatch(fetchPipelineSummary());
    const interval = setInterval(() => {
      dispatch(fetchPipelineSummary());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((phase) => (
        <div key={phase} className="card">
          <h2 className="text-xl font-bold">Phase {phase}</h2>
          <div className="mt-4 space-y-2">
            {Object.entries(summary[`phase_${phase}`] || {}).map(
              ([status, count]) => (
                <div key={status} className="flex justify-between">
                  <span className="capitalize">{status}</span>
                  <span className="font-bold">{count}</span>
                </div>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

**ItemDetail.tsx (excerpt):**

```typescript
export const ItemDetail: React.FC<{itemId: string}> = ({itemId}) => {
  const {data: item, isLoading, error} = useQuery(
    ["item", itemId],
    () => api.get(`/api/items/${itemId}`),
    {staleTime: 5 * 60 * 1000} // 5 min cache
  );

  const [overrideReason, setOverrideReason] = React.useState("");
  const overrideMutation = useMutation((decision: string) =>
    api.post(`/api/items/${itemId}/override`, {decision, overrideReason})
  );

  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error.message} />;

  return (
    <div className="detail-view">
      <h1>{item.name}</h1>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Phase</Label>
          <Badge>{item.phase}</Badge>
        </div>
        <div>
          <Label>Status</Label>
          <Badge variant={item.status}>{item.status}</Badge>
        </div>
        <div>
          <Label>Last Updated</Label>
          <p>{formatDate(item.updated_at)}</p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <PhaseDataView data={item.phase_data} />
        <TaskHistoryView tasks={item.tasks} />
        <GateDecisionView decision={item.gate_decision} />

        {item.gate_decision?.phase === item.phase && (
          <div className="border-t pt-4">
            <h3 className="font-bold">Gate Decision Pending</h3>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Reason for override (optional)"
              className="w-full mt-2"
            />
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => overrideMutation.mutate("approved")}
                disabled={overrideMutation.isLoading}
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => overrideMutation.mutate("rejected")}
              >
                Reject
              </Button>
            </div>
          </div>
        )}

        <CommentsSection itemId={itemId} />
        <TagsSection itemId={itemId} />
      </div>
    </div>
  );
};
```

**Backend API Route (items.ts):**

```typescript
import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth";
import { DataStoreClient } from "../services/DataStoreClient";

const router = Router();
const ds = new DataStoreClient();

// Get item detail
router.get("/:itemId", authMiddleware, async (req, res) => {
  try {
    const item = await ds.getItemDetail(req.params.itemId);
    res.json(item);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

// Submit override (Approver+ role)
router.post(
  "/:itemId/override",
  authMiddleware,
  requireRole("approver"),
  async (req, res) => {
    const {decision, reasoning} = req.body;

    try {
      await ds.recordManualOverride(req.params.itemId, decision, reasoning, req.user.id);
      res.json({success: true});
    } catch (error) {
      res.status(400).json({error: error.message});
    }
  }
);

export default router;
```

---

## 12. Example User Flows

### Flow 1: Operator Reviews Phase 1 Concepts

1. Operator logs in → Dashboard loads.
2. Sees Phase 1 summary: 8 in_progress, 0 completed, 0 rejected.
3. Clicks "Phase 1" → ItemList filters to Phase 1 items.
4. Sees list of 8 concepts with names, scores, updated times.
5. Clicks on concept "AI-Powered Compliance Automation" → ItemDetail view loads.
6. Reads phase_data: concept description, painPoints addressed, disruption potential score (0.92).
7. Scrolls to TaskHistory → Sees task execution for landscape-analyst, pain-extractor, concept-generator, concept-scorer.
8. Sees Gate Decision: Auto score = 0.87 (above threshold 0.75), so auto-approved.
9. Reads Comments from other reviewers: "This is solid. Market timing looks right."
10. Adds own comment: "Validated with 2 product PMs at Acme Corp. They'd pay for this."
11. Clicks "Approve" → Concept advances to Phase 2 (validation).

### Flow 2: Alert for Blocked Item

1. Operator is viewing Phase 0 summary.
2. Real-time update arrives: "opportunity-042 blocked: signal-detector timeout".
3. Toast notification: "New blocked item: opportunity-042" with link.
4. Operator clicks link → ItemDetail for opportunity-042.
5. Sees status="blocked", last task failed: signal-detector timed out after 5 min.
6. Sees error: "TimeoutError: signal detection did not complete in time".
7. Options: Retry, skip this step, or mark as invalid.
8. Operator clicks "Retry" → Orchestrator re-queues signal-detector.
9. Update arrives 2 min later: Task succeeded.
10. Item auto-advances to next step; operator is notified.

### Flow 3: Analytics Review

1. Operator navigates to Analytics tab.
2. Sees chart: "Gate Approval Rate by Phase".
   - Phase 0: 70% approved (threshold 0.70).
   - Phase 1: 60% approved (threshold 0.75).
   - Phase 2: 40% approved (threshold 0.80).
3. Operator notices Phase 1 approval rate is lower than expected.
4. Clicks "Phase 1 details" → Drill-down showing score distribution.
5. Realizes: "concept-scorer is giving lower scores since we updated it 2 days ago."
6. Operator tags all Phase 1 concepts created in last 2 days with "scorer-v2" tag.
7. Alerts Feedback Loop service to analyze if v2 is better calibrated.

