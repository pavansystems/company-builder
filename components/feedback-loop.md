# Feedback Loop — Component Specification

## 1. Purpose & Responsibility

The Feedback Loop is the learning mechanism of Company Builder. It continuously analyzes pipeline outcomes and uses those insights to improve future predictions and decisions.

Its core responsibilities are:

- **Outcome Tracking:** Monitor what happens to items after they pass each gate (Do validated concepts actually become good blueprints? Do rejected opportunities later prove viable?).
- **Correlation Analysis:** Identify patterns (e.g., "80% of opportunities tagged 'biotech' validate in Phase 2, but only 20% of 'fintech' opportunities do").
- **Model Recalibration:** Use outcome data to adjust scoring models, thresholds, and weights in agent-driven decisions.
- **Anomaly Detection:** Flag unusual patterns (e.g., "signal-detector is suddenly producing 10x more signals—is it broken or did something change in the world?").
- **Continuous Improvement:** Feed insights back to the Pipeline Orchestrator and agents, creating a virtuous cycle where early-stage scoring improves over time.
- **Reporting & Visibility:** Surface learning insights to operators via the Review Dashboard so they can understand why the system is making certain decisions.

The Feedback Loop is **not real-time**. It runs asynchronously, batch-processing historical data. It produces actionable insights and model updates that the orchestrator and agents use going forward.

---

## 2. Inputs

The Feedback Loop consumes data from the Data Store:

### 2.1 Pipeline Outcomes

Completed items with their full lifecycle:

```sql
-- Get all items that have progressed through at least one gate
SELECT
  pi.id,
  pi.type,
  pi.phase,
  pi.status,
  pi.created_at,
  pi.updated_at,
  pi.phase_data,
  pi.metadata,
  -- Gate decisions along the path
  (SELECT decision FROM gate_decisions WHERE item_id = pi.id AND phase = 0 LIMIT 1) as gate_0_decision,
  (SELECT decision FROM gate_decisions WHERE item_id = pi.id AND phase = 1 LIMIT 1) as gate_1_decision,
  (SELECT decision FROM gate_decisions WHERE item_id = pi.id AND phase = 2 LIMIT 1) as gate_2_decision
FROM pipeline_items pi
WHERE pi.updated_at > NOW() - INTERVAL '7 days'
  AND pi.phase >= 1  -- Has passed at least one gate
ORDER BY pi.updated_at DESC
```

**Sample output:**

```json
{
  "id": "opt-001",
  "type": "opportunity",
  "phase": 2,
  "status": "in_progress",
  "phase_data": {
    "market": "Supply Chain Optimization",
    "problem": "Manual inventory",
    "opportunityScore": 0.82,
    "market_size": "TAM: $50B",
    "agentReadiness": 0.85
  },
  "gate_0_decision": "approved",
  "gate_0_score": 0.82,
  "gate_1_decision": "approved",
  "gate_1_score": 0.78,
  "gate_2_decision": null
}
```

### 2.2 Score Distribution Data

Breakdown of how items scored at each phase:

```sql
SELECT
  phase,
  step,
  agent_name,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY score) as p25,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY score) as p50,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY score) as p75,
  MIN(score) as min_score,
  MAX(score) as max_score,
  AVG(score) as avg_score,
  COUNT(*) as count
FROM phase_scores
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY phase, step, agent_name
```

### 2.3 Agent Execution Metrics

Performance data for each agent:

```sql
SELECT
  agent_name,
  phase,
  step,
  status,
  COUNT(*) as count,
  AVG(execution_time_ms) as avg_duration,
  MAX(execution_time_ms) as max_duration,
  SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END) / COUNT(*) as failure_rate,
  AVG(CASE WHEN status = 'failure' THEN null ELSE execution_time_ms END) as avg_success_duration
FROM task_history
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY agent_name, phase, step, status
ORDER BY avg_duration DESC
```

### 2.4 Manual Override Data

Human decisions that diverge from auto decisions:

```sql
SELECT
  mo.item_id,
  mo.phase,
  mo.decision as manual_decision,
  gd.composite_score,
  gd.decision as auto_decision,
  mo.reasoning,
  mo.created_at,
  -- Outcome: Did the item validate?
  (SELECT phase FROM pipeline_items WHERE id = mo.item_id) as item_final_phase
FROM manual_overrides mo
LEFT JOIN gate_decisions gd ON mo.item_id = gd.item_id AND mo.phase = gd.phase
WHERE mo.created_at > NOW() - INTERVAL '90 days'
```

### 2.5 Time-Series Data

How metrics change over time:

```sql
SELECT
  DATE_TRUNC('day', created_at) as day,
  phase,
  COUNT(*) as items_created,
  SUM(CASE WHEN status IN ('completed', 'rejected') THEN 1 ELSE 0 END) as items_decided
FROM pipeline_items
GROUP BY DATE_TRUNC('day', created_at), phase
ORDER BY day DESC
```

---

## 3. Outputs

The Feedback Loop produces insights and model updates:

### 3.1 Analysis Reports

Saved to the Data Store's `analysis_results` table:

```json
{
  "analysis_id": "uuid",
  "analysis_type": "phase_correlation" | "signal_effectiveness" | "score_calibration" | "agent_performance" | "anomaly_detection",
  "phase": 0 | 1 | 2 | null (null for cross-phase analysis),
  "findings": {
    // Varies by analysis type (see below)
  },
  "generated_at": "ISO-8601",
  "data_range": {
    "from": "ISO-8601",
    "to": "ISO-8601"
  },
  "metadata": {
    "sample_size": 150,
    "confidence_level": 0.95
  }
}
```

### 3.2 Model Updates

New or updated scoring models:

```json
{
  "model_id": "uuid",
  "model_name": "opportunity_scorer_v3",
  "version": "3.0.1",
  "status": "ready" | "staging" | "archived",
  "parameters": {
    "weights": {
      "market_size": 0.3,
      "signal_strength": 0.25,
      "competitive_density": 0.2,
      "timing_confidence": 0.25
    },
    "thresholds": {
      "phase_0_gate": 0.72,  // Updated from 0.70
      "phase_1_gate": 0.76   // Updated from 0.75
    }
  },
  "metrics": {
    "precision_phase_2": 0.85,
    "recall_phase_2": 0.80,
    "f1_score": 0.82
  },
  "created_at": "ISO-8601",
  "activated_at": "ISO-8601 (nullable, not live yet)"
}
```

### 3.3 Alerts & Anomalies

Reported back to the Pipeline Orchestrator and Dashboard:

```json
{
  "alert_id": "uuid",
  "alert_type": "model_drift" | "agent_failure_spike" | "threshold_miscalibration" | "unusual_pattern",
  "severity": "info" | "warning" | "critical",
  "message": "string",
  "details": {...},
  "suggested_action": "string",
  "created_at": "ISO-8601"
}
```

### 3.4 Retraining Signals

Notifications to trigger model retraining:

```json
{
  "retraining_signal": {
    "model_name": "concept_scorer",
    "reason": "Data drift detected: Phase 2 validation rate dropped from 60% to 40% in last 7 days",
    "data_available": 500,  // samples since last retrain
    "recommended_action": "Retrain with recent data",
    "confidence": 0.92
  }
}
```

---

## 4. Core Logic / Algorithm

### 4.1 Analysis Workflow

The Feedback Loop runs on a schedule (e.g., daily) and performs these analyses:

```
Daily Feedback Loop Run
│
├─ Phase Correlation Analysis
│  └─ For each phase gate, compute:
│     - Approval rate
│     - Average score of approved vs rejected items
│     - Correlation between phase N score and phase N+1 approval
│     - Identify which dimensions (dimensions of composite score) best predict success
│
├─ Signal Effectiveness Analysis
│  └─ For Phase 0:
│     - Which signals most correlate with opportunities that validate in Phase 2?
│     - Are certain signal sources (news vs academic) more reliable?
│     - What's the false positive rate (signals that don't lead to opportunities)?
│
├─ Score Calibration Analysis
│  └─ Compute expected approval rates vs actual:
│     - If threshold=0.70 and actual approval rate=0.65, recalibrate threshold
│     - Detect if score inflation/deflation (agents gaming the metrics)
│
├─ Agent Performance Analysis
│  └─ For each agent:
│     - Success rate, latency, error patterns
│     - Quality of outputs (do outputs match expectations?)
│     - Drift in behavior (is agent becoming slower?)
│
├─ Anomaly Detection
│  └─ Statistical tests:
│     - Z-score on metrics (signal count, error rate)
│     - Sudden changes in distributions
│     - Outlier detection
│
└─ Model Retraining
   └─ If drift detected, retrain scoring models with recent data
```

### 4.2 Phase Correlation Analysis

**Algorithm:**

```python
def phase_correlation_analysis(phase, lookback_days=30):
    """
    Analyze how well Phase N scores predict Phase N+1 outcomes.
    """
    # Get all items that passed gate N
    items = query(f"""
        SELECT
            pi.id,
            pi.phase_data as data_at_phase_{phase},
            gd_n.composite_score as score_at_gate_{phase},
            gd_n.decision as decision_at_gate_{phase},
            gd_n_plus_1.decision as decision_at_gate_{phase + 1},
            -- Whether item was approved at next gate
            CASE WHEN gd_n_plus_1.decision = 'approved' THEN 1 ELSE 0 END as next_gate_approved
        FROM pipeline_items pi
        LEFT JOIN gate_decisions gd_n ON pi.id = gd_n.item_id AND gd_n.phase = {phase}
        LEFT JOIN gate_decisions gd_n_plus_1 ON pi.id = gd_n_plus_1.item_id AND gd_n_plus_1.phase = {phase + 1}
        WHERE pi.updated_at > NOW() - INTERVAL '{lookback_days} days'
          AND gd_n.decision = 'approved'  -- Only count items that passed gate N
    """)

    # Compute metrics
    approval_rate = sum(items.next_gate_approved) / len(items)
    approved_avg_score = mean([item.score_at_gate_{phase} for item in items if item.next_gate_approved])
    rejected_avg_score = mean([item.score_at_gate_{phase} for item in items if not item.next_gate_approved])

    # Compute AUC (how well does score predict approval?)
    fpr, tpr, thresholds = roc_curve(items.next_gate_approved, items.score_at_gate_{phase})
    auc = auc(fpr, tpr)

    # Breakdown by score dimension (e.g., market size, signal strength)
    dimension_importance = compute_feature_importance(
        items.data_at_phase_{phase},
        items.next_gate_approved,
        method='mutual_information'
    )

    return {
        "phase": phase,
        "lookback_days": lookback_days,
        "items_analyzed": len(items),
        "next_phase_approval_rate": approval_rate,
        "score_auc": auc,
        "approved_avg_score": approved_avg_score,
        "rejected_avg_score": rejected_avg_score,
        "dimension_importance": dimension_importance,
        "findings": {
            "what_predicts_success": [
                # Top 3 dimensions by importance
            ],
            "surprising_result": "..."
        }
    }
```

### 4.3 Score Calibration

**Algorithm:**

```python
def score_calibration_analysis(phase):
    """
    Check if the approval threshold is well-calibrated.
    If threshold is 0.70 but only 65% of items above 0.70 are approved,
    the threshold may be miscalibrated.
    """
    items = query(f"""
        SELECT
            gd.composite_score,
            gd.decision,
            gd.decided_by
        FROM gate_decisions gd
        WHERE gd.phase = {phase}
          AND gd.created_at > NOW() - INTERVAL '30 days'
        ORDER BY gd.composite_score
    """)

    current_threshold = get_threshold(phase)

    # Compute actual approval rates by score bin
    bins = [[0.0, 0.2], [0.2, 0.4], [0.4, 0.6], [0.6, 0.8], [0.8, 1.0]]
    calibration = {}
    for bin_start, bin_end in bins:
        in_bin = [item for item in items if bin_start <= item.score < bin_end]
        if not in_bin:
            continue

        approval_rate = sum(1 for item in in_bin if item.decision == 'approved') / len(in_bin)
        calibration[f"{bin_start}-{bin_end}"] = {
            "count": len(in_bin),
            "approval_rate": approval_rate
        }

    # Compute optimal threshold using ROC curve
    scores = [item.score for item in items]
    decisions = [1 if item.decision == 'approved' else 0 for item in items]
    fpr, tpr, thresholds = roc_curve(decisions, scores)

    # Find threshold that maximizes F1 score
    f1_scores = 2 * (tpr * (1 - fpr)) / (tpr + (1 - fpr) + 1e-10)
    optimal_idx = argmax(f1_scores)
    optimal_threshold = thresholds[optimal_idx]

    recommendation = None
    if abs(optimal_threshold - current_threshold) > 0.05:
        recommendation = f"Consider updating threshold from {current_threshold} to {optimal_threshold}"

    return {
        "phase": phase,
        "current_threshold": current_threshold,
        "optimal_threshold": optimal_threshold,
        "calibration_curve": calibration,
        "recommendation": recommendation
    }
```

### 4.4 Signal Effectiveness Analysis (Phase 0)

**Algorithm:**

```python
def signal_effectiveness_analysis():
    """
    Which signals lead to opportunities that eventually validate?
    """
    # Get all opportunities with their enabling signals and outcomes
    opportunities = query("""
        SELECT
            pi.id,
            pi.phase_data->>'enablingSignals' as signals,
            -- Outcome: Did it validate in Phase 2?
            MAX(gd2.decision) as phase_2_decision
        FROM pipeline_items pi
        LEFT JOIN gate_decisions gd0 ON pi.id = gd0.item_id AND gd0.phase = 0
        LEFT JOIN gate_decisions gd2 ON pi.id = gd2.item_id AND gd2.phase = 2
        WHERE pi.type = 'opportunity'
          AND pi.created_at > NOW() - INTERVAL '90 days'
        GROUP BY pi.id
    """)

    # For each signal, compute validation rate
    signal_effectiveness = {}
    for signal in all_possible_signals:
        opps_with_signal = [o for o in opportunities if signal in o.signals]
        if len(opps_with_signal) < 5:  # Minimum sample size
            continue

        validated = sum(1 for o in opps_with_signal if o.phase_2_decision == 'approved')
        effectiveness = validated / len(opps_with_signal)

        signal_effectiveness[signal] = {
            "sample_size": len(opps_with_signal),
            "validation_rate": effectiveness,
            "confidence_interval": compute_ci(effectiveness, len(opps_with_signal))
        }

    # Rank signals by effectiveness
    ranked_signals = sorted(signal_effectiveness.items(),
                           key=lambda x: x[1]['validation_rate'],
                           reverse=True)

    return {
        "lookback_days": 90,
        "signal_effectiveness": dict(ranked_signals[:10]),
        "findings": {
            "most_predictive": ranked_signals[0][0],
            "least_predictive": ranked_signals[-1][0],
            "recommendation": "Deprioritize low-effectiveness signals to reduce noise"
        }
    }
```

### 4.5 Anomaly Detection

**Algorithm:**

```python
def detect_anomalies():
    """
    Detect sudden changes or unusual patterns in pipeline metrics.
    """
    # Get daily aggregates for last 60 days
    daily_metrics = query("""
        SELECT
            DATE_TRUNC('day', created_at) as day,
            COUNT(*) as items_created,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as items_rejected,
            AVG(phase_data->>'opportunityScore') as avg_score
        FROM pipeline_items
        WHERE created_at > NOW() - INTERVAL '60 days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY day
    """)

    alerts = []

    # Detect sudden spikes/drops
    for metric in ['items_created', 'items_rejected', 'avg_score']:
        values = [m[metric] for m in daily_metrics if m[metric] is not None]
        mean_val = mean(values)
        std_val = std(values)

        # Last value is today
        today_val = daily_metrics[-1][metric]
        z_score = (today_val - mean_val) / (std_val + 1e-10)

        if abs(z_score) > 2.5:  # 2.5 sigma threshold
            alerts.append({
                "type": "metric_spike",
                "metric": metric,
                "z_score": z_score,
                "value": today_val,
                "expected_range": f"{mean_val - 2*std_val} to {mean_val + 2*std_val}",
                "severity": "critical" if abs(z_score) > 3 else "warning"
            })

    # Detect distribution shift in agent outputs
    for agent_name in ['signal_detector', 'concept_scorer', ...]:
        recent_scores = query(f"""
            SELECT output->>'score' as score FROM task_history
            WHERE agent_name = '{agent_name}' AND created_at > NOW() - INTERVAL '7 days'
        """)

        historical_scores = query(f"""
            SELECT output->>'score' as score FROM task_history
            WHERE agent_name = '{agent_name}' AND created_at BETWEEN NOW() - INTERVAL '30 days' AND NOW() - INTERVAL '7 days'
        """)

        # KS test for distribution shift
        ks_stat, p_value = ks_2samp(recent_scores, historical_scores)
        if p_value < 0.05:  # Significant shift
            alerts.append({
                "type": "agent_distribution_shift",
                "agent": agent_name,
                "ks_stat": ks_stat,
                "p_value": p_value,
                "severity": "warning"
            })

    return alerts
```

### 4.6 Model Retraining

**Algorithm:**

```python
def should_retrain_model(model_name, min_samples=500, drift_threshold=0.95):
    """
    Determine if a model should be retrained based on recent data.
    """
    model_info = get_model_info(model_name)
    last_trained_at = model_info['trained_at']

    # Get new data since last training
    new_samples = query(f"""
        SELECT {get_features_for_model(model_name)}
        FROM {get_data_source_for_model(model_name)}
        WHERE created_at > '{last_trained_at}'
    """)

    # Not enough data yet
    if len(new_samples) < min_samples:
        return False, f"Only {len(new_samples)} samples, need {min_samples}"

    # Check for data drift using population stability index
    training_samples = query(f"""
        SELECT {get_features_for_model(model_name)}
        FROM {get_data_source_for_model(model_name)}
        WHERE created_at BETWEEN '{model_info['training_start']}' AND '{model_info['training_end']}'
    """)

    psi = compute_psi(training_samples, new_samples)

    if psi > drift_threshold:
        return True, f"Data drift detected: PSI = {psi}"

    # Check for performance degradation
    current_model = load_model(model_name)
    recent_predictions = current_model.predict(new_samples[['features']])
    recent_actuals = new_samples['actual']

    current_f1 = f1_score(recent_actuals, recent_predictions)
    baseline_f1 = model_info['baseline_f1']

    if current_f1 < baseline_f1 * 0.90:  # > 10% degradation
        return True, f"Performance degradation: F1 dropped from {baseline_f1} to {current_f1}"

    return False, "Model is still performing well"
```

---

## 5. Data Sources & Integrations

### 5.1 Data Store (Primary)

The Feedback Loop queries:

- `pipeline_items` table
- `gate_decisions` table
- `task_history` table
- `manual_overrides` table
- `analysis_results` table (for historical comparisons)

### 5.2 External ML/Analytics Services (Optional)

For advanced analysis:

- **MLflow or Weights & Biases:** Model versioning and experiment tracking.
- **DataRobot or H2O AutoML:** Automated model retraining.
- **Grafana or Datadog:** Metric dashboards and anomaly detection.

### 5.3 Configuration & Models

- Stored models in a model registry (e.g., MLflow, S3 bucket).
- Scoring rules and thresholds stored in Data Store's `model_versions` table.
- Historical analysis results for trend comparison.

---

## 6. Architecture & Design Patterns

### 6.1 Batch Processing

The Feedback Loop is a **batch job**, not real-time:

```
Scheduler (e.g., Airflow, K8s CronJob)
    ↓
Daily Feedback Loop Job (1:00 AM UTC)
    ├─ Extract data from Data Store
    ├─ Run analyses (phase correlation, signal effectiveness, etc.)
    ├─ Store results in Data Store
    ├─ Detect anomalies and alerts
    ├─ Determine if model retraining needed
    └─ Publish findings to Review Dashboard & Orchestrator
```

### 6.2 Job Composition

The feedback job is composed of independent **analysis tasks** that can run in parallel:

```python
class FeedbackLoopJob:
    def __init__(self, data_store, model_registry):
        self.data_store = data_store
        self.model_registry = model_registry

    def run(self):
        """Execute all analyses."""
        results = {}

        # Run in parallel (they don't depend on each other)
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {
                'phase_correlation': executor.submit(self.phase_correlation_analysis),
                'score_calibration': executor.submit(self.score_calibration_analysis),
                'signal_effectiveness': executor.submit(self.signal_effectiveness_analysis),
                'agent_performance': executor.submit(self.agent_performance_analysis),
                'anomaly_detection': executor.submit(self.detect_anomalies),
            }

            for name, future in futures.items():
                results[name] = future.result()

        # Sequential steps
        retraining_signals = self.evaluate_retraining_needs(results)
        if retraining_signals:
            self.trigger_model_retraining(retraining_signals)

        # Store all results
        self.data_store.save_analysis_results(results)

        # Alert on anomalies
        self.alert_on_anomalies(results)

        # Publish to dashboard
        self.publish_insights_to_dashboard(results)

        return results
```

### 6.3 Model Registry Pattern

Centralized store for scoring models with versioning:

```python
class ModelRegistry:
    """
    Manages model versions and deployment.
    Models are stored as:
    - Current: Active model (used by orchestrator)
    - Staging: Candidate model (undergoing validation)
    - Archived: Historical models
    """

    def get_active_model(self, model_name):
        """Get the model currently in use."""
        model = self.db.query(ModelVersion).filter(
            name=model_name,
            status='active'
        ).first()
        return deserialize_model(model.artifact_path)

    def create_model_version(self, model_name, parameters, metrics):
        """Create a new model version (staging)."""
        version = ModelVersion(
            name=model_name,
            parameters=parameters,
            metrics=metrics,
            status='staging',
            created_at=datetime.utcnow()
        )
        self.db.add(version)
        self.db.commit()
        return version

    def promote_model(self, model_version_id):
        """Promote staging model to active."""
        model = self.db.query(ModelVersion).get(model_version_id)
        model.status = 'active'
        model.activated_at = datetime.utcnow()
        self.db.commit()

        # Notify orchestrator to reload model
        notify_orchestrator('model_updated', model.name)
```

### 6.4 Alert System

Simple alert mechanism to notify operators:

```python
class AlertSystem:
    def send_alert(self, alert_type, severity, message, details):
        """
        Send alert to dashboard and (if critical) email operators.
        """
        alert = {
            'alert_id': uuid4(),
            'alert_type': alert_type,
            'severity': severity,
            'message': message,
            'details': details,
            'created_at': datetime.utcnow()
        }

        # Store in data store
        self.data_store.save_alert(alert)

        # Push to dashboard via WebSocket
        self.websocket_broadcaster.broadcast('alert', alert)

        # Email if critical
        if severity == 'critical':
            send_email(
                to=config.ALERT_EMAIL_LIST,
                subject=f"[CRITICAL] {message}",
                body=json.dumps(details, indent=2)
            )
```

---

## 7. Error Handling & Edge Cases

### 7.1 Insufficient Data

**Scenario:** A phase has only 5 items; can't do meaningful statistical analysis.

**Handling:**
- Require minimum sample size (e.g., 50 items per phase).
- Report analysis as "Pending more data" with confidence intervals.
- Don't publish insights or adjust models with low confidence.

### 7.2 Outliers

**Scenario:** One operator rejects all items; skews statistics.

**Handling:**
- Use robust statistical methods (e.g., median instead of mean, IQR for outliers).
- Flag outlier operators/decisions for review.
- Option to exclude from analysis if clearly erroneous.

### 7.3 Model Degradation

**Scenario:** A newly retrained model performs worse than the current model.

**Handling:**
- Validate new model on held-out test set before activating.
- Compare metrics to current model; only promote if better.
- Keep old model as fallback; can quickly revert if needed.

### 7.4 Data Inconsistency

**Scenario:** An item is marked as phase=2 but has no Phase 1 gate decision.

**Handling:**
- Data validation at query time; skip invalid items.
- Log inconsistencies to audit trail.
- Alert operators to investigate.

### 7.5 Correlation vs Causation

**Scenario:** "Opportunities tagged 'biotech' validate 80% of the time."
  Is this because biotech is inherently better, or because we've only selected the best biotech opportunities?

**Handling:**
- Clearly label findings as correlations, not causal relationships.
- Recommend A/B testing to validate causal claims.
- Avoid overinterpreting weak signals.

---

## 8. Performance & Scaling

### 8.1 Job Duration

Expected runtime for daily feedback loop job:

- **Extract data (Data Store queries):** 2 minutes
- **Phase correlation analysis:** 3 minutes
- **Score calibration:** 1 minute
- **Signal effectiveness:** 2 minutes
- **Agent performance:** 1 minute
- **Anomaly detection:** 1 minute
- **Model retraining (if triggered):** 5–15 minutes

**Total:** 15–25 minutes, running overnight (low impact).

### 8.2 Data Volume

Assuming 50–100 new items per week:

- **Annual items:** ~5000 items
- **Tasks per item:** ~20 (average across phases)
- **Total tasks:** ~100,000 task records per year

This is well within typical database capacity.

### 8.3 Query Optimization

- Pre-aggregate common metrics (daily aggregates stored in separate table).
- Use materialized views for slow queries (e.g., phase correlation takes 2 min; cache results for 24 hours).
- Partition large tables (e.g., task_history by month).

### 8.4 Scaling Beyond Single Job

If processing becomes too slow:

- **Incremental analysis:** Only process items updated since last run (not all historical data).
- **Distributed computing:** Use Spark/Dask for parallel analysis.
- **Real-time streaming:** Switch to streaming anomaly detection (e.g., Kafka Streams) for immediate alerts.

---

## 9. Dependencies

### 9.1 Depends On

- **Data Store:** Primary data source (queries pipeline_items, gate_decisions, etc.).
- **Model Registry:** Loads and stores trained models.
- **Config Store:** Gets thresholds, weights, and analysis parameters.

### 9.2 Depended On By

- **Pipeline Orchestrator:** Receives updated thresholds and scoring models.
- **Review Dashboard:** Displays analysis findings and alerts.
- **Agents:** May receive updated instructions based on findings (e.g., "deprioritize biotech signals").

---

## 10. Success Metrics

### 10.1 Data Quality

- **Analysis completeness:** All analyses run successfully (no failures).
- **Data validity:** < 0.5% of items skipped due to data inconsistency.

### 10.2 Insight Quality

- **Actionability:** > 80% of findings can lead to specific model/process changes.
- **Accuracy:** Recommendations should improve downstream outcomes (validate with A/B testing).
- **Coverage:** Analyses cover all major dimensions (phases, agents, signals).

### 10.3 Model Quality

- **Prediction accuracy:** Scoring models achieve > 80% AUC on held-out test set.
- **Calibration:** Predicted approval rate within 5% of actual approval rate.
- **Stability:** Model version doesn't change more than monthly (avoid chasing noise).

### 10.4 Impact on Pipeline

- **Gate threshold accuracy:** Operator manual override rate < 15% (high rate indicates bad auto-scoring).
- **False positive rate:** < 20% of rejected items would have validated if approved.
- **False negative rate:** < 10% of approved items are ultimately rejected in later phases.

### 10.5 System Health

- **Job reliability:** Feedback job succeeds > 99% of runs.
- **Alert quality:** < 10% false positive alerts; operators trust the alerts.
- **Latency:** Insights published to dashboard within 1 hour of job completion.

---

## 11. Implementation Notes

### 11.1 Recommended Tech Stack

**Batch Processing:**
- **Python 3.10+:** Primary language.
- **Airflow or Prefect:** Job orchestration and scheduling.
- **Pandas:** Data manipulation.
- **NumPy & SciPy:** Statistical analysis.
- **Scikit-learn:** ML metrics, basic models.

**Model Management:**
- **MLflow:** Model versioning, experiment tracking.
- **joblib:** Model serialization.

**Alerting:**
- **Sentry or DataDog:** Error tracking.
- **Slack API:** Alerts to team channel.

**Orchestrator Communication:**
- **gRPC or REST:** Send model updates to orchestrator.

### 11.2 Directory Structure

```
feedback-loop/
├── main.py                    # Entry point
├── job.py                     # FeedbackLoopJob class
├── analyses/
│   ├── __init__.py
│   ├── phase_correlation.py
│   ├── score_calibration.py
│   ├── signal_effectiveness.py
│   ├── agent_performance.py
│   └── anomaly_detection.py
├── models/
│   ├── __init__.py
│   ├── registry.py            # ModelRegistry class
│   ├── training.py            # Model retraining logic
│   └── evaluation.py          # Model evaluation metrics
├── services/
│   ├── __init__.py
│   ├── data_store_client.py
│   ├── alert_system.py
│   └── orchestrator_client.py
├── config.py                  # Thresholds, parameters
├── tests/
│   ├── test_analyses.py
│   ├── test_model_registry.py
│   └── test_alert_system.py
└── README.md
```

### 11.3 Scheduled Job Definition (Airflow)

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'feedback-team',
    'retries': 1,
    'retry_delay': timedelta(minutes=10)
}

dag = DAG(
    'daily_feedback_loop',
    default_args=default_args,
    schedule_interval='0 1 * * *',  # 1:00 AM UTC daily
    catchup=False
)

def run_feedback_loop():
    from feedback_loop.job import FeedbackLoopJob
    from feedback_loop.services.data_store_client import DataStoreClient

    ds = DataStoreClient()
    job = FeedbackLoopJob(ds)
    results = job.run()
    return results

feedback_task = PythonOperator(
    task_id='run_feedback_loop',
    python_callable=run_feedback_loop,
    dag=dag
)
```

### 11.4 Example Analysis: Phase Correlation

```python
import pandas as pd
from sklearn.metrics import roc_curve, auc
from scipy.stats import pearsonr

def phase_correlation_analysis(ds, phase=0, lookback_days=30):
    """
    Analyze how well Phase 0 scores predict Phase 1 approval.
    """
    # Query data
    query = f"""
    SELECT
        pi.id,
        pi.phase_data->>'opportunityScore'::float as opp_score,
        pi.phase_data->>'agentReadiness'::float as agent_readiness,
        gd_0.composite_score as gate_0_score,
        gd_1.decision as gate_1_decision
    FROM pipeline_items pi
    LEFT JOIN gate_decisions gd_0 ON pi.id = gd_0.item_id AND gd_0.phase = {phase}
    LEFT JOIN gate_decisions gd_1 ON pi.id = gd_1.item_id AND gd_1.phase = {phase + 1}
    WHERE pi.updated_at > NOW() - INTERVAL '{lookback_days} days'
      AND gd_0.decision = 'approved'
      AND gd_1.decision IS NOT NULL
    """

    df = pd.read_sql(query, ds.connection)

    if df.empty:
        return {"error": "Insufficient data"}

    # Target: 1 if approved at next phase, 0 if rejected
    df['next_phase_approved'] = (df['gate_1_decision'] == 'approved').astype(int)

    # Compute metrics
    approval_rate = df['next_phase_approved'].mean()
    approved_score = df[df['next_phase_approved'] == 1]['gate_0_score'].mean()
    rejected_score = df[df['next_phase_approved'] == 0]['gate_0_score'].mean()

    # ROC AUC
    fpr, tpr, _ = roc_curve(df['next_phase_approved'], df['gate_0_score'])
    roc_auc = auc(fpr, tpr)

    # Correlation between score and approval
    corr, p_value = pearsonr(df['gate_0_score'], df['next_phase_approved'])

    return {
        "phase": phase,
        "lookback_days": lookback_days,
        "sample_size": len(df),
        "next_phase_approval_rate": float(approval_rate),
        "approved_avg_score": float(approved_score),
        "rejected_avg_score": float(rejected_score),
        "roc_auc": float(roc_auc),
        "correlation": float(corr),
        "p_value": float(p_value),
        "findings": {
            "strong_predictability": roc_auc > 0.75,
            "score_separation": abs(approved_score - rejected_score) > 0.1
        }
    }
```

### 11.5 Model Retraining Example

```python
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score, precision_score, recall_score
import joblib

def retrain_opportunity_scorer(ds):
    """
    Retrain the opportunity scorer with recent Phase 2 validation data.
    """
    # Get training data (all Phase 0 opportunities with Phase 2 outcome)
    query = """
    SELECT
        pi.phase_data,
        CASE WHEN gd2.decision = 'approved' THEN 1 ELSE 0 END as validated
    FROM pipeline_items pi
    LEFT JOIN gate_decisions gd0 ON pi.id = gd0.item_id AND gd0.phase = 0
    LEFT JOIN gate_decisions gd2 ON pi.id = gd2.item_id AND gd2.phase = 2
    WHERE pi.type = 'opportunity'
      AND gd2.decision IS NOT NULL
      AND pi.created_at > NOW() - INTERVAL '90 days'
    """

    df = pd.read_sql(query, ds.connection)

    # Extract features
    features = pd.json_normalize(df['phase_data'])
    target = df['validated']

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        features, target, test_size=0.2, random_state=42
    )

    # Train model
    model = GradientBoostingClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    metrics = {
        "f1": f1_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
        "samples": len(X_train)
    }

    # Save model
    model_path = f"models/opportunity_scorer_{datetime.utcnow().isoformat()}.pkl"
    joblib.dump(model, model_path)

    # Register in model registry
    ds.save_model_version(
        name="opportunity_scorer",
        artifact_path=model_path,
        parameters=model.get_params(),
        metrics=metrics,
        status="staging"
    )

    return {
        "model_path": model_path,
        "metrics": metrics,
        "status": "ready_for_validation"
    }
```

---

## 12. Example Feedback Loop Cycle

Here's a concrete example of how insights feed back:

**Week 1:**
1. Phase 0 gate threshold is 0.70 (arbitrary choice).
2. 50 opportunities pass through Phase 0 gate.
3. Average score: 0.78.

**Week 2:**
1. Phase 0 is complete on those 50 opportunities.
2. These same opportunities enter Phase 1 (ideation).

**Week 3:**
1. Some Phase 1 outcomes are now clear (concepts selected or rejected).
2. Feedback loop runs; analyzes correlation between Phase 0 scores and Phase 1 selection rates.
3. Finds: Opportunities with Phase 0 score > 0.80 had 75% concept selection rate; scores 0.70–0.80 had 55% rate.

**Week 4:**
1. Feedback loop recommends: "Raise Phase 0 threshold to 0.75 to filter out lower-quality opportunities earlier."
2. Orchestrator adopts the recommendation; new threshold = 0.75.
3. Fewer opportunities advance, but expected to have better quality.

**Month 2:**
1. Phase 2 validation data comes in for Phase 0 opportunities from Weeks 1–4.
2. Feedback loop computes: "Opportunities with Phase 0 score > 0.78 validated in Phase 2 at 68% rate."
3. Finds: Phase 0 threshold of 0.75 was good but could be 0.76.
4. Also discovers: "Signal type 'regulatory_change' correlates with 85% Phase 2 validation; prioritize these."

**Month 3:**
1. Feedback loop recommends: "Retrain signal-detector to prioritize regulatory signals."
2. New signal-detector model trained and deployed.
3. Phase 0 continues improving over time.

This represents the **virtuous cycle**: Data → Insights → Model Updates → Better Data.

