# Watchlist Publisher — Component Specification

## 1. Purpose & Responsibility

The Watchlist Publisher is the distribution and presentation engine of Phase 0. Its core responsibility is to take the ranked opportunities and make them available to downstream phases, human reviewers, and external systems in multiple formats.

**Role in pipeline:** Acts as the final stage of Phase 0 Discovery. It transforms the scored and ranked watchlist into multiple consumable formats, enables human review and override, manages versions, and gates opportunities into Phase 1.

**What it owns:**
- Watchlist versioning and history
- Multi-format publishing (API, JSON, dashboard, RSS, email)
- Human review interface and override logic
- Gate decision enforcement (automatic vs. manual)
- Opportunity metadata enrichment and linking
- Publishing audit log (who reviewed, who changed what, when)
- Notifications and alerts to stakeholders

---

## 2. Inputs

**Source:** Ranked opportunities from Opportunity Ranker (0.4).

**Input data structure:**

```json
{
  "id": "opp_uuid",
  "rank": 1,
  "composite_score": 0.87,
  "dimensions": { /* score breakdown */ },
  "summary": {
    "one_liner": "string",
    "thesis": "string",
    "key_strengths": ["string"],
    "key_risks": ["string"]
  },
  "threshold_status": "above_gate_threshold|at_gate_threshold|below_gate_threshold",
  "recommended_action": "promote_to_phase_1|human_review|continue_monitoring",
  "metadata": { /* scoring metadata */ }
}
```

**Consumption pattern:** Batch (daily) or continuous (as rankings update).

---

## 3. Outputs

**Destinations:**
1. Central pipeline data store (JSON/database)
2. HTTP API (for downstream Phase 1 agents)
3. Dashboard UI (for human reviewers)
4. Notification feeds (email, Slack, webhook)
5. Archive (version history)

**Output formats:**

### 3.1 Published Watchlist (API/Database)

```json
{
  "version": "2024-12-04-v1",
  "created_at": "ISO 8601",
  "updated_at": "ISO 8601",
  "total_opportunities": 156,
  "opportunities_above_gate": 34,
  "gate_threshold": 0.70,
  "opportunities": [
    {
      "id": "opp_uuid",
      "rank": 1,
      "name": "string",
      "description": "string",
      "composite_score": 0.87,
      "target_market": "string",
      "specific_problem": "string",
      "affected_industries": ["string"],
      "agent_readiness_score": 0.82,
      "one_liner": "string",
      "thesis": "string",
      "enabling_signal_count": 3,
      "competitive_density": 12,
      "time_sensitivity": "urgent|normal|low",
      "threshold_status": "above_gate_threshold",
      "gate_decision": {
        "status": "auto_promoted|human_approved|human_demoted|pending",
        "made_by": "system|human_name",
        "made_at": "ISO 8601",
        "rationale": "optional override reason"
      },
      "source_signals": [
        {
          "signal_id": "signal_uuid",
          "signal_type": "tech_breakthrough",
          "title": "string",
          "url": "link to source"
        }
      ],
      "metadata": {
        "first_published": "ISO 8601",
        "rank_history": [
          {"date": "2024-11-27", "rank": 5},
          {"date": "2024-12-04", "rank": 1}
        ]
      }
    }
  ]
}
```

### 3.2 Dashboard View (HTML/React)

```
[Watchlist Dashboard]

Filter: [Score >= 0.70] [Gate Status] [Market] [Search]

Top Opportunities (Above Gate):
┌─────────────────────────────────────────────────────────┐
│ 1. AI-driven AP automation              Score: 0.87 ✓   │
│    Accounts Payable Automation                           │
│    "Use vision models to automate invoice processing"  │
│    Signals: 3  |  Competitors: 12  |  Agent-Ready: 82% │
│    Status: AUTO PROMOTED [override]                      │
└─────────────────────────────────────────────────────────┘

│ 2. AI for medical underwriting          Score: 0.85 ✓   │
│    Insurance / Underwriting                              │
│    "Risk assessment automation for healthcare"           │
│    Signals: 2  |  Competitors: 5   |  Agent-Ready: 75%  │
│    Status: HUMAN APPROVED (reviewed by Sarah)            │
└─────────────────────────────────────────────────────────┘

[Next 20 opportunities...]

Below Gate (Monitoring):
│ 47. Real-time language translation      Score: 0.68     │
│    Language / Communication                              │
│    ...
└─────────────────────────────────────────────────────────┘
```

### 3.3 Email Digest

```
Subject: Company Builder Weekly Watchlist — 5 New Opportunities Above Gate

Hello Team,

Phase 0 Discovery has identified 5 new high-potential opportunities this week
(above gate threshold of 0.70). The top 3 are:

1. **AI-driven AP automation** (Score: 0.87)
   Accounts payable automation using vision-language models.
   Enabled by: Vision model release, customer pain signals, regulatory tailwind
   Action: Auto-promoted to Phase 1 ideation
   [View Details]

2. **Medical risk assessment automation** (Score: 0.85)
   AI agents for insurance underwriting decisions.
   Enabled by: Healthcare AI breakthroughs, regulatory clarity
   Action: Pending human review
   [Review & Approve]

3. **Supply chain demand forecasting** (Score: 0.81)
   AI agents for demand planning in manufacturing.
   Enabled by: Time-series model advances, industry hiring surge
   Action: Pending human review
   [Review & Approve]

[View Full Watchlist]
[Manage Alerts]

---
Phase 0 Discovery Pipeline
Updated: 2024-12-04 14:30 UTC
```

### 3.4 RSS Feed

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Company Builder Phase 0 Watchlist</title>
    <description>Ranked opportunities for agent-first disruption</description>
    <link>https://company-builder.example.com/watchlist</link>
    <lastBuildDate>2024-12-04T14:30:00Z</lastBuildDate>

    <item>
      <title>AI-driven AP automation (Score: 0.87)</title>
      <description>
        Market: Accounts Payable
        Problem: Manual invoice processing
        Thesis: Vision-language models make invoice processing 95% automatable.
        Signals: 3 (tech breakthrough, customer pain, regulatory shift)
      </description>
      <link>https://company-builder.example.com/opp/opp_uuid</link>
      <pubDate>2024-12-04T10:00:00Z</pubDate>
      <guid>opp_uuid_watchlist_v1</guid>
      <category>above_gate</category>
    </item>

    <!-- More items... -->
  </channel>
</rss>
```

---

## 4. Core Logic / Algorithm

### 4.1 Watchlist Versioning

Each time opportunities are re-ranked or new opportunities are added, a new watchlist version is published:

```python
def publish_watchlist_version():
    """
    Create a new versioned snapshot of the current ranked watchlist.
    """

    ranked_opportunities = db.query_opportunities(
        order_by="composite_score DESC"
    )

    version_id = generate_version_id()  # e.g., "2024-12-04-v1"

    watchlist_doc = {
        "version": version_id,
        "created_at": now(),
        "updated_at": now(),
        "gate_threshold": config.get("phase_0_gate_threshold"),
        "total_opportunities": len(ranked_opportunities),
        "opportunities_above_gate": sum([
            1 for o in ranked_opportunities
            if o.threshold_status == "above_gate_threshold"
        ]),
        "opportunities": [
            enrich_opportunity_for_publication(o)
            for o in ranked_opportunities
        ]
    }

    # Store version
    db.save_watchlist_version(watchlist_doc)

    # Also store as current
    db.save_watchlist_current(watchlist_doc)

    # Publish to external systems
    publish_to_api(watchlist_doc)
    publish_to_dashboard(watchlist_doc)

    return watchlist_doc
```

### 4.2 Opportunity Enrichment for Publication

When an opportunity is published, enrich it with full context:

```python
def enrich_opportunity_for_publication(opportunity: Opportunity) -> Dict:
    """
    Add full context to opportunity for publication:
    - Source signal details with links
    - Enabling signal analysis
    - Gate decision history
    - Market context
    """

    signals = [
        db.query_signal(s.signal_id)
        for s in opportunity.enabling_signals
    ]

    source_documents = [
        {
            "signal_id": s.id,
            "signal_type": s.signal_type,
            "title": s.title,
            "url": s.source_items[0]["url"] if s.source_items else None,
            "published_date": s.detected_at,
            "relevance": find_signal_relevance_to_opp(s, opportunity)
        }
        for s in signals[:5]  # Top 5 source signals
    ]

    gate_decision_history = [
        {
            "date": d.made_at,
            "decision": d.status,
            "made_by": d.made_by,
            "rationale": d.rationale
        }
        for d in db.query_gate_decisions(opportunity_id=opportunity.id)
    ]

    rank_history = [
        {"date": s.date, "rank": s.rank}
        for s in opportunity.score_history
    ]

    return {
        "id": opportunity.id,
        "rank": opportunity.rank,
        "name": opportunity.name,
        "description": opportunity.description,
        "target_market": opportunity.target_market,
        "specific_problem": opportunity.specific_problem,
        "problem_statement": opportunity.problem_statement,
        "composite_score": opportunity.composite_score,
        "dimensions": opportunity.dimensions,
        "one_liner": opportunity.summary.one_liner,
        "thesis": opportunity.summary.thesis,
        "key_strengths": opportunity.summary.key_strengths,
        "key_risks": opportunity.summary.key_risks,
        "affected_industries": opportunity.affected_industries,
        "agent_readiness_score": opportunity.agent_readiness.score,
        "key_technologies": opportunity.key_technologies,
        "time_sensitivity": opportunity.time_sensitivity,
        "market_maturity": opportunity.market_maturity,
        "incumbent_response_risk": opportunity.incumbent_response_risk,
        "enabling_signals": {
            "count": len(signals),
            "sources": source_documents,
            "types": list(set([s.signal_type for s in signals]))
        },
        "competitive_landscape": {
            "competitor_count": opportunity.competitive_density.current_players,
            "top_competitors": query_top_competitors(opportunity.target_market)[:3]
        },
        "gate_decision": {
            "status": opportunity.gate_decision.status,
            "threshold_status": opportunity.threshold_status,
            "made_by": opportunity.gate_decision.made_by,
            "made_at": opportunity.gate_decision.made_at,
            "rationale": opportunity.gate_decision.rationale
        },
        "gate_decision_history": gate_decision_history,
        "rank_history": rank_history,
        "metadata": {
            "first_published": opportunity.created_at,
            "last_updated": opportunity.updated_at,
            "view_count": opportunity.metadata.view_count,
            "reviewer_notes": opportunity.metadata.reviewer_notes
        }
    }
```

### 4.3 Gate Decision Logic

When an opportunity is published, apply gate logic (automatic or manual):

```python
def apply_gate_decision(opportunity: Opportunity) -> GateDecision:
    """
    Determine if opportunity moves to Phase 1, requires review, or continues monitoring.
    """

    gate_threshold = config.get("phase_0_gate_threshold", 0.70)
    auto_promote_threshold = gate_threshold + 0.10  # 0.80

    # Check if there's already a manual override
    existing_decision = db.query_latest_gate_decision(opportunity_id=opportunity.id)
    if existing_decision and existing_decision.made_by != "system":
        # Human has already reviewed; respect their decision
        return existing_decision

    # Automatic gate decision
    if opportunity.composite_score >= auto_promote_threshold:
        decision = GateDecision(
            opportunity_id=opportunity.id,
            status="auto_promoted",
            made_by="system",
            made_at=now(),
            rationale=f"Score {opportunity.composite_score:.2f} >= auto-promote threshold {auto_promote_threshold}"
        )
        opportunity.gate_decision = decision
        db.save(opportunity)

        # Log event for analytics
        log_event("opportunity_auto_promoted", opportunity_id=opportunity.id, score=opportunity.composite_score)

        return decision

    elif opportunity.composite_score >= gate_threshold:
        decision = GateDecision(
            opportunity_id=opportunity.id,
            status="pending_human_review",
            made_by="system",
            made_at=now(),
            rationale=f"Score {opportunity.composite_score:.2f} at gate threshold; requires human review"
        )
        opportunity.gate_decision = decision
        db.save(opportunity)

        # Queue for human review dashboard
        queue_for_human_review(opportunity)

        return decision

    else:
        decision = GateDecision(
            opportunity_id=opportunity.id,
            status="continue_monitoring",
            made_by="system",
            made_at=now(),
            rationale=f"Score {opportunity.composite_score:.2f} below gate threshold {gate_threshold}; continue monitoring"
        )
        opportunity.gate_decision = decision
        db.save(opportunity)

        return decision
```

### 4.4 Human Review & Override

Allow reviewers to override automatic gate decisions:

```python
def override_gate_decision(
    opportunity_id: str,
    new_status: str,  # "promoted_to_phase_1", "demoted", "continue_monitoring"
    reviewer_name: str,
    rationale: str
):
    """
    Human reviewer overrides automatic gate decision.

    new_status options:
    - "human_approved" (promote despite lower score)
    - "human_demoted" (don't promote despite high score)
    - "continue_monitoring" (keep watching)
    """

    opportunity = db.query_opportunity(opportunity_id)

    decision = GateDecision(
        opportunity_id=opportunity_id,
        status=new_status,
        made_by=reviewer_name,
        made_at=now(),
        rationale=rationale
    )

    opportunity.gate_decision = decision
    db.save(opportunity)

    # Log audit trail
    audit_log.write({
        "event": "gate_decision_override",
        "opportunity_id": opportunity_id,
        "old_decision": opportunity.gate_decision.status,
        "new_decision": new_status,
        "made_by": reviewer_name,
        "rationale": rationale,
        "timestamp": now()
    })

    # If promoted, queue for Phase 1
    if new_status == "human_approved":
        queue_for_phase_1(opportunity)
        notify_stakeholders(f"Opportunity {opportunity.name} approved for Phase 1 by {reviewer_name}")
```

### 4.5 Publishing Pipeline

```python
async def publish_watchlist():
    """
    Main publishing loop (runs daily or on-demand).
    """

    # Step 1: Query all ranked opportunities
    opportunities = db.query_opportunities(order_by="composite_score DESC")

    # Step 2: Apply gate decisions
    for opp in opportunities:
        apply_gate_decision(opp)

    # Step 3: Enrich for publication
    published_opps = [
        enrich_opportunity_for_publication(opp)
        for opp in opportunities
    ]

    # Step 4: Create versioned watchlist
    watchlist = {
        "version": generate_version_id(),
        "created_at": now(),
        "opportunities": published_opps,
        # ... other metadata
    }

    # Step 5: Store and publish
    db.save_watchlist_version(watchlist)
    db.save_watchlist_current(watchlist)

    # Publish to multiple destinations
    await publish_to_api(watchlist)
    await publish_to_dashboard(watchlist)
    await publish_to_email_digest(watchlist)
    await publish_to_rss(watchlist)
    await publish_to_webhook(watchlist)

    # Step 6: Notify subscribers
    notify_phase_1_agents(watchlist)  # Signal Phase 1 to pick up new opportunities
    notify_reviewers(watchlist)  # Alert reviewers of pending decisions

    logger.info(f"Published watchlist version {watchlist['version']} with {len(published_opps)} opportunities")
```

### 4.6 Notification & Alert Strategy

```python
def determine_notification_triggers(opportunity: Opportunity) -> List[NotificationTrigger]:
    """
    Decide when/how to notify different audiences.
    """

    triggers = []

    # 1. Rank change: notify if opportunity jumps significantly
    rank_change = opportunity.metadata.previous_rank - opportunity.rank
    if abs(rank_change) > 5:
        triggers.append(NotificationTrigger(
            audience="core_team",
            channel="slack",
            message=f"{opportunity.name} moved from rank {opportunity.metadata.previous_rank} to {opportunity.rank}"
        ))

    # 2. Score increase: notify if new signals strengthen opportunity
    if opportunity.score_history[-1].score > opportunity.score_history[-2].score + 0.05:
        triggers.append(NotificationTrigger(
            audience="core_team",
            channel="slack",
            message=f"Signal strength increasing for {opportunity.name} (score {opportunity.composite_score:.2f})"
        ))

    # 3. Automatic promotion: notify Phase 1
    if opportunity.gate_decision.status == "auto_promoted":
        triggers.append(NotificationTrigger(
            audience="phase_1_agents",
            channel="api",
            message=f"New opportunity for ideation: {opportunity.name}"
        ))

    # 4. Pending review: notify human reviewers
    if opportunity.gate_decision.status == "pending_human_review":
        triggers.append(NotificationTrigger(
            audience="reviewers",
            channel="email",
            message=f"Opportunity pending your review: {opportunity.name} (score: {opportunity.composite_score:.2f})"
        ))

    # 5. Converging signals: notify if multiple new signals in same cluster
    recent_signals = [s for s in opportunity.enabling_signals if (now - s.detected_at).days < 3]
    if len(recent_signals) >= 2:
        triggers.append(NotificationTrigger(
            audience="core_team",
            channel="slack",
            message=f"Multiple new signals converging on {opportunity.name}"
        ))

    return triggers
```

---

## 5. Data Sources & Integrations

**Direct dependencies:**
- Opportunity Ranker (0.4) — ranked opportunities
- Signal Detector (0.2) — signal details and links

**Publishing destinations:**
- PostgreSQL/MongoDB — version history and current watchlist
- Elasticsearch — indexing for dashboard search
- Email service (SendGrid, AWS SES) — digest emails
- Slack API — Slack notifications
- HTTP webhooks — downstream systems
- RSS feed — external subscribers
- Dashboard UI — human review interface

**External integrations:**
- Phase 1 Ideation agents (consume from API)
- Human review interface
- External APIs for opportunity enrichment (optional: company data, competitor details)

---

## 6. Agent Prompt Strategy

The Watchlist Publisher itself is primarily a service/database component, but uses agent reasoning for:
- Filtering/search on the dashboard (user requests opportunities matching criteria)
- Recommendations (suggesting which opportunities to review)

### 6.1 System Prompt for Dashboard Agent (Search & Recommend)

```
You are a helpful assistant for a company builder platform. Users ask you to
search or filter the current watchlist of opportunities, or ask for recommendations.

You have access to:
- The current watchlist (all ranked opportunities with full details)
- Filtering options: market, score range, signal count, agent-readiness, time-sensitivity
- Recommendation criteria: team size, tech stack, funding available, market preference

# User Request Examples

User: "Show me opportunities in healthcare that I could build a team around in 6 months"
→ Filter to healthcare sector, score >= 0.75, agent-readiness >= 0.70 (good for small teams)

User: "Which opportunities have the strongest signal convergence?"
→ Sort by signal count (descending), recommend top 5

User: "I'm expert in manufacturing. What's the best opportunity for me?"
→ Filter to manufacturing sector, sort by score + signal strength

# Response Guidelines

1. Execute the filter/sort
2. Show top 3–5 results with key details (name, score, one-liner, enabling signals)
3. Explain why these match the user's criteria
4. Offer next steps (e.g., "View detailed thesis", "Review source signals", "Promote to Phase 1")

Be helpful and conversational. Show only information that's useful for decision-making.
```

---

## 7. Error Handling & Edge Cases

| Scenario | Handling |
|----------|----------|
| **Publishing fails** (DB write error, API timeout) | Retry with exponential backoff; log error; alert operator; don't update "current" watchlist until success. |
| **Opportunity disappears before publication** | Skip it; log warning. Probably deleted by human; don't re-publish. |
| **Gate decision already exists from human review** | Don't override; use existing decision. Respect human judgment. |
| **Watchlist version conflicts** (two versions published simultaneously) | Use timestamp to determine canonical version; discard older one. Log conflict. |
| **Email digest fails to send** | Retry with backoff; fallback to Slack notification; log error. |
| **RSS feed stale** (not updated in >24 hours) | Trigger manual republish; check for pipeline failures. |
| **Human review UI slow** (many opportunities, 500+ items) | Implement pagination, filtering, and search to keep UI responsive. |
| **Reviewer notes are lost** | All metadata changes should be audit-logged and persisted atomically with opportunity. |
| **Score changed after publication** | Republish watchlist; treat as new version. Include change notes. |

---

## 8. Performance & Scaling

**Expected throughput:**
- Publish 100–200 opportunities per day
- Support 10–20 concurrent human reviewers on dashboard
- Serve API requests for Phase 1 agents

**Latency requirements:**
- Dashboard load: <2 seconds for full watchlist
- Search/filter: <500ms
- API endpoint for single opportunity: <100ms
- Email digest send: <30 minutes (can be async)

**Scaling strategy:**

1. **Pagination:** Show top 50 on dashboard; load more on scroll
2. **Caching:** Cache current watchlist in Redis; invalidate on new version
3. **Async publishing:** Publish to email/webhooks asynchronously (don't block ranking)
4. **Database indexing:** Index by composite_score, gate_status, affected_industries
5. **Read replicas:** Use read replicas for dashboard queries (don't block writes)

---

## 9. Dependencies

**Depends on:**
- Opportunity Ranker (0.4) — ranked opportunities
- Signal Detector (0.2) — signal details
- Configuration (gate thresholds, publishing destinations)

**Depended on by:**
- Phase 1 Ideation agents — consume published watchlist
- Human review dashboard
- External stakeholders (subscribers to email/RSS)

---

## 10. Success Metrics

1. **Publishing latency:** Opportunities available for Phase 1 <5 minutes after ranking completes
2. **API availability:** Watchlist API 99.9%+ uptime
3. **Human review time:** Opportunities at gate threshold reviewed within 2 days of publication
4. **Override frequency:** 5–15% of automatic decisions are overridden (healthy range; not too high/low)
5. **Notification engagement:** >70% of reviewers open gate decision notifications
6. **Watchlist freshness:** Current watchlist never stale (updated within 24 hours)
7. **Phase 1 consumption:** >90% of auto-promoted opportunities are picked up by Phase 1 agents
8. **Version history completeness:** All versions retained; audit trail intact

---

## 11. Implementation Notes

### Suggested Tech Stack

**Language:** Python 3.11+ (backend) + React/Vue (dashboard)

**Backend libraries:**
- `fastapi` or `flask` — HTTP API for watchlist
- `pydantic` — Request/response schemas
- `sqlalchemy` or `sqlmodel` — Database ORM
- `redis` — Caching
- `celery` or `rq` — Async task queue (for email, webhooks)
- `sendgrid` or `boto3` — Email service
- `slack-sdk` — Slack API
- `feedgen` — RSS feed generation

**Frontend libraries:**
- `react` or `vue` — Dashboard UI
- `typescript` — Type safety
- `axios` or `fetch` — API client
- `react-query` or `swr` — Data fetching
- `tanstack/table` — Sortable/filterable table
- `tailwind` or `material-ui` — Styling

**Infrastructure:**
- **API:** FastAPI on AWS Lambda or EC2
- **Database:** PostgreSQL with read replicas
- **Cache:** Redis
- **Task queue:** Celery + RabbitMQ or Redis
- **Async webhooks:** AWS SNS or custom webhook service
- **Monitoring:** Prometheus, Grafana
- **Logging:** ELK Stack or CloudWatch

### Code Structure

```
watchlist-publisher/
├── api/
│   ├── watchlist.py         # GET /watchlist, /watchlist/{version}
│   ├── opportunities.py     # GET /opportunities, /opportunities/{id}
│   ├── gates.py             # POST /opportunities/{id}/gate (override)
│   └── search.py            # GET /opportunities/search?q=...
├── publishing/
│   ├── publishers.py        # Abstract publisher class
│   ├── db_publisher.py      # Persist to database
│   ├── email_publisher.py   # Send email digests
│   ├── slack_publisher.py   # Send Slack notifications
│   ├── rss_publisher.py     # Generate RSS feed
│   └── webhook_publisher.py # Trigger webhooks
├── enrichment/
│   ├── enricher.py          # Opportunity enrichment logic
│   └── context_builders.py  # Build competitive context, etc.
├── dashboard/
│   ├── frontend/            # React/Vue components
│   │   ├── WatchlistTable.tsx
│   │   ├── OpportunityDetail.tsx
│   │   ├── GateReviewModal.tsx
│   │   └── SearchBar.tsx
│   └── api/                 # Dashboard-specific endpoints
├── storage/
│   ├── db.py                # Database interface
│   ├── versioning.py        # Version management
│   ├── audit_log.py         # Audit trail
│   └── cache.py             # Redis caching
├── notifications/
│   ├── notifier.py          # Notification orchestration
│   ├── triggers.py          # Notification trigger logic
│   ├── channels/            # Email, Slack, webhook, etc.
│   └── templates/           # Email templates, Slack message templates
├── pipeline.py              # Main publishing loop
├── config.yaml              # Publishing configuration
├── main.py                  # FastAPI app entry point
└── tests/
    ├── test_api.py
    ├── test_publishers.py
    ├── test_enrichment.py
    └── fixtures/
```

### Key Implementation Details

**1. Watchlist API endpoint:**

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

@app.get("/watchlist")
async def get_current_watchlist(limit: int = 50, offset: int = 0):
    """Get current ranked watchlist, paginated"""
    watchlist = db.get_current_watchlist()
    opportunities = watchlist["opportunities"][offset:offset+limit]
    return {
        "version": watchlist["version"],
        "total": len(watchlist["opportunities"]),
        "returned": len(opportunities),
        "opportunities": opportunities
    }

@app.get("/watchlist/versions")
async def list_watchlist_versions(limit: int = 10):
    """Get version history of watchlist"""
    versions = db.list_watchlist_versions(limit=limit)
    return {
        "versions": [
            {
                "version": v["version"],
                "created_at": v["created_at"],
                "opportunity_count": len(v["opportunities"]),
                "above_gate": sum([1 for o in v["opportunities"] if o["threshold_status"] == "above_gate_threshold"])
            }
            for v in versions
        ]
    }

@app.get("/watchlist/{version_id}")
async def get_watchlist_by_version(version_id: str):
    """Get historical watchlist by version"""
    watchlist = db.get_watchlist_version(version_id)
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist version not found")
    return watchlist

@app.post("/opportunities/{opportunity_id}/gate")
async def override_gate_decision(
    opportunity_id: str,
    decision: GateDecisionInput,
    current_user: str = Header(None)
):
    """Human reviewer overrides gate decision"""
    override_gate_decision(
        opportunity_id=opportunity_id,
        new_status=decision.status,
        reviewer_name=current_user,
        rationale=decision.rationale
    )
    return {"status": "ok", "message": f"Gate decision updated by {current_user}"}
```

**2. Publishing workflow:**

```python
async def publish_watchlist_async():
    """Main async publishing task"""
    try:
        # Query ranked opportunities
        opportunities = db.query_opportunities(order_by="composite_score DESC")

        # Apply gate decisions
        for opp in opportunities:
            apply_gate_decision(opp)

        # Enrich for publication
        published_opps = [enrich_opportunity_for_publication(o) for o in opportunities]

        # Create version
        watchlist = {
            "version": generate_version_id(),
            "created_at": datetime.utcnow(),
            "opportunities": published_opps
        }

        # Store
        db.save_watchlist_version(watchlist)
        db.save_watchlist_current(watchlist)
        cache.set("current_watchlist", json.dumps(watchlist), ttl=86400)

        # Publish async
        tasks = [
            publish_to_api(watchlist),
            publish_to_email_digest(watchlist),
            publish_to_rss(watchlist),
            publish_to_slack(watchlist),
            notify_phase_1_agents(watchlist)
        ]

        await asyncio.gather(*tasks)

        logger.info(f"Published {len(published_opps)} opportunities")

    except Exception as e:
        logger.error(f"Publishing failed: {e}")
        alert_operator(f"Watchlist publishing failed: {e}")
```

**3. Dashboard React component:**

```jsx
import React, { useState } from 'react';

export function WatchlistDashboard() {
  const [watchlist, setWatchlist] = useState(null);
  const [filter, setFilter] = useState({ score_min: 0.7 });
  const [selectedOpp, setSelectedOpp] = useState(null);

  useEffect(() => {
    fetch('/api/watchlist').then(r => r.json()).then(setWatchlist);
  }, []);

  if (!watchlist) return <div>Loading...</div>;

  const filtered = watchlist.opportunities
    .filter(o => o.composite_score >= filter.score_min)
    .sort((a, b) => b.rank - a.rank);

  return (
    <div className="watchlist-dashboard">
      <header>
        <h1>Phase 0 Watchlist</h1>
        <div className="stats">
          {watchlist.opportunities_above_gate} above gate | {watchlist.total_opportunities} total
        </div>
      </header>

      <OpportunityTable
        opportunities={filtered}
        onSelect={setSelectedOpp}
      />

      {selectedOpp && (
        <OpportunityDetail
          opportunity={selectedOpp}
          onGateOverride={(status, rationale) => {
            fetch(`/api/opportunities/${selectedOpp.id}/gate`, {
              method: 'POST',
              body: JSON.stringify({ status, rationale })
            }).then(() => location.reload());
          }}
        />
      )}
    </div>
  );
}
```

### Deployment Considerations

1. **Watchlist versioning:** Keep at least 13 weeks of version history (quarterly lookback)
2. **Human review SLA:** Ensure opportunities at gate threshold are reviewed within 2 days
3. **Notification fatigue:** Don't overwhelm reviewers with too many alerts; aggregate daily or weekly
4. **API rate limiting:** Protect API from abuse (100 req/min per IP for public endpoints)
5. **Audit trail:** Every change (score update, gate override, metadata change) is logged with timestamp and user
6. **Backup & recovery:** Daily backups of watchlist versions; can restore from any version

---

## Appendix: Example Published Opportunity

```json
{
  "version": "2024-12-04-v1",
  "id": "opp_invoice_processing_001",
  "rank": 3,
  "name": "AI-driven accounts payable automation",
  "description": "Use vision-language models and document understanding agents to automate invoice ingestion, extraction, and reconciliation in mid-market accounting. Replaces 30–50% of AP team work.",
  "target_market": "Accounting / Accounts Payable",
  "specific_problem": "Manual invoice data entry and processing consuming 25–40% of AP team time",
  "composite_score": 0.84,
  "one_liner": "AI agents for accounts payable automation",
  "thesis": "Vision-language models are now production-grade, making invoice processing 95% automatable. The market is ripe: AP teams still spend 25–40% of time on manual work, and regulatory tailwinds (EU AI Act) remove barriers to agent deployment. A focused team can establish dominance in the next 12–18 months before incumbent vendors (Coupa, SAP) integrate agents into their platforms.",
  "key_strengths": [
    "Multiple converging signals (vision model release + customer pain + regulatory shift) with 90%+ confidence",
    "Massive agent-readiness: 95% of operations can be automated, creating structural 70–80% cost advantage",
    "Proven, documented customer pain across forums, reviews, support channels—demand is real"
  ],
  "key_risks": [
    "Incumbent response: SAP Concur and Coupa could integrate agents within 12–18 months",
    "Regulatory uncertainty: future rules could require human audit trails, raising costs",
    "Integration complexity: ERP/procurement/vendor database integrations are non-trivial"
  ],
  "affected_industries": [
    {
      "industry": "Accounting & Bookkeeping",
      "subsector": "Accounts Payable",
      "relevance": "primary"
    }
  ],
  "agent_readiness_score": 0.82,
  "key_technologies": [
    "Vision-language models",
    "Multimodal LLMs",
    "Agentic workflows",
    "OCR"
  ],
  "time_sensitivity": "normal",
  "market_maturity": "growth",
  "enabling_signals": {
    "count": 3,
    "sources": [
      {
        "signal_id": "sig_multimodal_vision",
        "signal_type": "tech_breakthrough",
        "title": "GPT-4 Vision reaches 98% accuracy on invoice extraction",
        "url": "https://techcrunch.com/2024/11/openai-vision-accuracy",
        "published_date": "2024-11-15T10:00:00Z",
        "relevance": "direct"
      },
      {
        "signal_id": "sig_gpt4_vision_release",
        "signal_type": "model_release",
        "title": "GPT-4 Vision now available to all API customers",
        "url": "https://openai.com/gpt4-vision",
        "published_date": "2024-11-10T08:00:00Z",
        "relevance": "direct"
      },
      {
        "signal_id": "sig_ap_pain_reddit",
        "signal_type": "customer_pain",
        "title": "AP teams spending 30 hours/week on invoice data entry",
        "url": "https://reddit.com/r/accounting/comments/...",
        "published_date": "2024-11-08T14:30:00Z",
        "relevance": "direct"
      }
    ],
    "types": ["tech_breakthrough", "model_release", "customer_pain"]
  },
  "competitive_landscape": {
    "competitor_count": 12,
    "top_competitors": [
      {
        "name": "Coupa",
        "funding": "$2.3B",
        "market_position": "leader"
      },
      {
        "name": "SAP Concur",
        "funding": "enterprise vendor",
        "market_position": "major_incumbent"
      },
      {
        "name": "Rossum",
        "funding": "$30M",
        "market_position": "emerging_competitor"
      }
    ]
  },
  "gate_decision": {
    "status": "auto_promoted",
    "threshold_status": "above_gate_threshold",
    "made_by": "system",
    "made_at": "2024-12-04T14:30:00Z",
    "rationale": "Score 0.84 >= auto-promote threshold 0.80"
  },
  "rank_history": [
    {"date": "2024-11-27", "rank": 5},
    {"date": "2024-12-04", "rank": 3}
  ],
  "metadata": {
    "first_published": "2024-11-20T10:00:00Z",
    "last_updated": "2024-12-04T14:30:00Z",
    "view_count": 47,
    "reviewer_notes": "Strong opportunity. Recommend Phase 1 focus on mid-market segment (<500 employees)."
  }
}
```
