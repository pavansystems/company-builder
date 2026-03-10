-- Migration 010: Row Level Security Policies
-- Enable RLS on all tables and configure role-based access

-- ---------------------------------------------------------------------------
-- Enable RLS on all tables
-- ---------------------------------------------------------------------------

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- sources
-- ---------------------------------------------------------------------------

CREATE POLICY admin_all_sources ON sources
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY reviewer_read_sources ON sources
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'reviewer'));

CREATE POLICY agent_manage_sources ON sources
  FOR ALL USING (auth.jwt() ->> 'role' = 'agent-service');

-- ---------------------------------------------------------------------------
-- content_items
-- ---------------------------------------------------------------------------

CREATE POLICY admin_all_content_items ON content_items
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY reviewer_read_content_items ON content_items
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'reviewer'));

CREATE POLICY agent_manage_content_items ON content_items
  FOR ALL USING (auth.jwt() ->> 'role' = 'agent-service');

-- ---------------------------------------------------------------------------
-- signals
-- ---------------------------------------------------------------------------

CREATE POLICY admin_all_signals ON signals
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY reviewer_read_signals ON signals
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'reviewer'));

CREATE POLICY agent_manage_signals ON signals
  FOR ALL USING (auth.jwt() ->> 'role' = 'agent-service');

-- ---------------------------------------------------------------------------
-- market_opportunities
-- ---------------------------------------------------------------------------

CREATE POLICY admin_all_market_opp ON market_opportunities
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY reviewer_read_market_opp ON market_opportunities
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'reviewer'));

CREATE POLICY viewer_read_active_market_opp ON market_opportunities
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'viewer'
    AND is_active = TRUE
  );

CREATE POLICY agent_manage_market_opp ON market_opportunities
  FOR ALL USING (auth.jwt() ->> 'role' = 'agent-service');

-- ---------------------------------------------------------------------------
-- opportunity_scores
-- ---------------------------------------------------------------------------

CREATE POLICY admin_all_opp_scores ON opportunity_scores
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY reviewer_read_opp_scores ON opportunity_scores
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'reviewer'));

CREATE POLICY viewer_read_opp_scores ON opportunity_scores
  FOR SELECT USING (auth.jwt() ->> 'role' = 'viewer');

CREATE POLICY agent_manage_opp_scores ON opportunity_scores
  FOR ALL USING (auth.jwt() ->> 'role' = 'agent-service');

-- ---------------------------------------------------------------------------
-- watchlist_versions
-- ---------------------------------------------------------------------------

CREATE POLICY admin_all_watchlist ON watchlist_versions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY reviewer_read_watchlist ON watchlist_versions
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'reviewer'));

CREATE POLICY viewer_read_watchlist ON watchlist_versions
  FOR SELECT USING (auth.jwt() ->> 'role' = 'viewer');

CREATE POLICY agent_manage_watchlist ON watchlist_versions
  FOR ALL USING (auth.jwt() ->> 'role' = 'agent-service');

-- ---------------------------------------------------------------------------
-- concepts
-- ---------------------------------------------------------------------------

CREATE POLICY admin_all_concepts ON concepts
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY reviewer_read_concepts ON concepts
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'reviewer'));

CREATE POLICY viewer_read_selected_concepts ON concepts
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'viewer'
    AND selected_for_validation = TRUE
  );

CREATE POLICY agent_manage_concepts ON concepts
  FOR ALL USING (auth.jwt() ->> 'role' = 'agent-service');

-- ---------------------------------------------------------------------------
-- concept_scores
-- ---------------------------------------------------------------------------

CREATE POLICY admin_all_concept_scores ON concept_scores
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY reviewer_read_concept_scores ON concept_scores
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'reviewer'));

CREATE POLICY viewer_read_concept_scores ON concept_scores
  FOR SELECT USING (auth.jwt() ->> 'role' = 'viewer');

CREATE POLICY agent_manage_concept_scores ON concept_scores
  FOR ALL USING (auth.jwt() ->> 'role' = 'agent-service');

-- ---------------------------------------------------------------------------
-- validations
-- ---------------------------------------------------------------------------

CREATE POLICY admin_all_validations ON validations
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY reviewer_read_validations ON validations
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'reviewer'));

CREATE POLICY viewer_read_validations ON validations
  FOR SELECT USING (auth.jwt() ->> 'role' = 'viewer');

CREATE POLICY agent_manage_validations ON validations
  FOR ALL USING (auth.jwt() ->> 'role' = 'agent-service');

-- ---------------------------------------------------------------------------
-- blueprints
-- ---------------------------------------------------------------------------

CREATE POLICY admin_all_blueprints ON blueprints
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY reviewer_read_blueprints ON blueprints
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'reviewer'));

CREATE POLICY viewer_read_finalized_blueprints ON blueprints
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'viewer'
    AND is_finalized = TRUE
  );

CREATE POLICY agent_manage_blueprints ON blueprints
  FOR ALL USING (auth.jwt() ->> 'role' = 'agent-service');

-- ---------------------------------------------------------------------------
-- pipeline_items
-- ---------------------------------------------------------------------------

CREATE POLICY admin_all_pipeline ON pipeline_items
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY reviewer_read_pipeline ON pipeline_items
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'reviewer'));

CREATE POLICY viewer_read_pipeline ON pipeline_items
  FOR SELECT USING (auth.jwt() ->> 'role' = 'viewer');

CREATE POLICY agent_manage_pipeline ON pipeline_items
  FOR ALL USING (auth.jwt() ->> 'role' = 'agent-service');

-- ---------------------------------------------------------------------------
-- gate_decisions
-- ---------------------------------------------------------------------------

CREATE POLICY admin_all_gate_decisions ON gate_decisions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY reviewer_read_gate_decisions ON gate_decisions
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'reviewer'));

CREATE POLICY reviewer_insert_gate_decisions ON gate_decisions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'reviewer'));

CREATE POLICY agent_manage_gate_decisions ON gate_decisions
  FOR ALL USING (auth.jwt() ->> 'role' = 'agent-service');

-- ---------------------------------------------------------------------------
-- gate_rules
-- ---------------------------------------------------------------------------

CREATE POLICY admin_all_gate_rules ON gate_rules
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY reviewer_read_gate_rules ON gate_rules
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'reviewer', 'viewer'));

CREATE POLICY agent_read_gate_rules ON gate_rules
  FOR SELECT USING (auth.jwt() ->> 'role' = 'agent-service');

-- ---------------------------------------------------------------------------
-- user_annotations
-- ---------------------------------------------------------------------------

CREATE POLICY admin_all_annotations ON user_annotations
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY read_all_annotations ON user_annotations
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'reviewer', 'viewer'));

CREATE POLICY insert_own_annotations ON user_annotations
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );

CREATE POLICY admin_manage_annotations ON user_annotations
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- ---------------------------------------------------------------------------
-- feedback_events
-- ---------------------------------------------------------------------------

CREATE POLICY admin_all_feedback ON feedback_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY reviewer_read_feedback ON feedback_events
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'reviewer'));

CREATE POLICY agent_manage_feedback ON feedback_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'agent-service');

-- ---------------------------------------------------------------------------
-- agent_runs
-- ---------------------------------------------------------------------------

CREATE POLICY admin_all_agent_runs ON agent_runs
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY reviewer_read_agent_runs ON agent_runs
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'reviewer'));

CREATE POLICY agent_manage_runs ON agent_runs
  FOR ALL USING (auth.jwt() ->> 'role' = 'agent-service');

-- ---------------------------------------------------------------------------
-- Realtime publication for live UI updates
-- ---------------------------------------------------------------------------

CREATE PUBLICATION IF NOT EXISTS supabase_realtime FOR TABLE
  pipeline_items,
  agent_runs,
  gate_decisions,
  user_annotations,
  watchlist_versions;
