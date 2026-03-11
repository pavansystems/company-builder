-- Migration 013: Account-Level Isolation
-- Adds account_id to all data tables and rewrites RLS policies
-- so that each user only sees their own account's data.

-- ---------------------------------------------------------------------------
-- Helper function: returns current authenticated user's ID
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_account_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Add account_id column to all data tables
-- For existing rows, default to '00000000-0000-0000-0000-000000000000' as a
-- placeholder. A follow-up data migration should assign the correct account.
-- ---------------------------------------------------------------------------

-- sources
ALTER TABLE sources
  ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- content_items
ALTER TABLE content_items
  ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- signals
ALTER TABLE signals
  ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- market_opportunities
ALTER TABLE market_opportunities
  ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- opportunity_scores
ALTER TABLE opportunity_scores
  ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- watchlist_versions
ALTER TABLE watchlist_versions
  ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- concepts
ALTER TABLE concepts
  ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- concept_scores
ALTER TABLE concept_scores
  ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- validations
ALTER TABLE validations
  ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- blueprints
ALTER TABLE blueprints
  ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- pipeline_items
ALTER TABLE pipeline_items
  ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- gate_decisions
ALTER TABLE gate_decisions
  ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- agent_runs
ALTER TABLE agent_runs
  ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- user_annotations
ALTER TABLE user_annotations
  ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- feedback_events
ALTER TABLE feedback_events
  ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- ---------------------------------------------------------------------------
-- Indexes on account_id for every table
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_sources_account ON sources(account_id);
CREATE INDEX IF NOT EXISTS idx_content_items_account ON content_items(account_id);
CREATE INDEX IF NOT EXISTS idx_signals_account ON signals(account_id);
CREATE INDEX IF NOT EXISTS idx_market_opportunities_account ON market_opportunities(account_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_scores_account ON opportunity_scores(account_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_versions_account ON watchlist_versions(account_id);
CREATE INDEX IF NOT EXISTS idx_concepts_account ON concepts(account_id);
CREATE INDEX IF NOT EXISTS idx_concept_scores_account ON concept_scores(account_id);
CREATE INDEX IF NOT EXISTS idx_validations_account ON validations(account_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_account ON blueprints(account_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_items_account ON pipeline_items(account_id);
CREATE INDEX IF NOT EXISTS idx_gate_decisions_account ON gate_decisions(account_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_account ON agent_runs(account_id);
CREATE INDEX IF NOT EXISTS idx_user_annotations_account ON user_annotations(account_id);
CREATE INDEX IF NOT EXISTS idx_feedback_events_account ON feedback_events(account_id);

-- ---------------------------------------------------------------------------
-- Drop ALL existing RLS policies (from migration 010)
-- ---------------------------------------------------------------------------

-- sources
DROP POLICY IF EXISTS admin_all_sources ON sources;
DROP POLICY IF EXISTS reviewer_read_sources ON sources;
DROP POLICY IF EXISTS agent_manage_sources ON sources;

-- content_items
DROP POLICY IF EXISTS admin_all_content_items ON content_items;
DROP POLICY IF EXISTS reviewer_read_content_items ON content_items;
DROP POLICY IF EXISTS agent_manage_content_items ON content_items;

-- signals
DROP POLICY IF EXISTS admin_all_signals ON signals;
DROP POLICY IF EXISTS reviewer_read_signals ON signals;
DROP POLICY IF EXISTS agent_manage_signals ON signals;

-- market_opportunities
DROP POLICY IF EXISTS admin_all_market_opp ON market_opportunities;
DROP POLICY IF EXISTS reviewer_read_market_opp ON market_opportunities;
DROP POLICY IF EXISTS viewer_read_active_market_opp ON market_opportunities;
DROP POLICY IF EXISTS agent_manage_market_opp ON market_opportunities;

-- opportunity_scores
DROP POLICY IF EXISTS admin_all_opp_scores ON opportunity_scores;
DROP POLICY IF EXISTS reviewer_read_opp_scores ON opportunity_scores;
DROP POLICY IF EXISTS viewer_read_opp_scores ON opportunity_scores;
DROP POLICY IF EXISTS agent_manage_opp_scores ON opportunity_scores;

-- watchlist_versions
DROP POLICY IF EXISTS admin_all_watchlist ON watchlist_versions;
DROP POLICY IF EXISTS reviewer_read_watchlist ON watchlist_versions;
DROP POLICY IF EXISTS viewer_read_watchlist ON watchlist_versions;
DROP POLICY IF EXISTS agent_manage_watchlist ON watchlist_versions;

-- concepts
DROP POLICY IF EXISTS admin_all_concepts ON concepts;
DROP POLICY IF EXISTS reviewer_read_concepts ON concepts;
DROP POLICY IF EXISTS viewer_read_selected_concepts ON concepts;
DROP POLICY IF EXISTS agent_manage_concepts ON concepts;

-- concept_scores
DROP POLICY IF EXISTS admin_all_concept_scores ON concept_scores;
DROP POLICY IF EXISTS reviewer_read_concept_scores ON concept_scores;
DROP POLICY IF EXISTS viewer_read_concept_scores ON concept_scores;
DROP POLICY IF EXISTS agent_manage_concept_scores ON concept_scores;

-- validations
DROP POLICY IF EXISTS admin_all_validations ON validations;
DROP POLICY IF EXISTS reviewer_read_validations ON validations;
DROP POLICY IF EXISTS viewer_read_validations ON validations;
DROP POLICY IF EXISTS agent_manage_validations ON validations;

-- blueprints
DROP POLICY IF EXISTS admin_all_blueprints ON blueprints;
DROP POLICY IF EXISTS reviewer_read_blueprints ON blueprints;
DROP POLICY IF EXISTS viewer_read_finalized_blueprints ON blueprints;
DROP POLICY IF EXISTS agent_manage_blueprints ON blueprints;

-- pipeline_items
DROP POLICY IF EXISTS admin_all_pipeline ON pipeline_items;
DROP POLICY IF EXISTS reviewer_read_pipeline ON pipeline_items;
DROP POLICY IF EXISTS viewer_read_pipeline ON pipeline_items;
DROP POLICY IF EXISTS agent_manage_pipeline ON pipeline_items;

-- gate_decisions
DROP POLICY IF EXISTS admin_all_gate_decisions ON gate_decisions;
DROP POLICY IF EXISTS reviewer_read_gate_decisions ON gate_decisions;
DROP POLICY IF EXISTS reviewer_insert_gate_decisions ON gate_decisions;
DROP POLICY IF EXISTS agent_manage_gate_decisions ON gate_decisions;

-- gate_rules (shared config — not account-scoped)
DROP POLICY IF EXISTS admin_all_gate_rules ON gate_rules;
DROP POLICY IF EXISTS reviewer_read_gate_rules ON gate_rules;
DROP POLICY IF EXISTS agent_read_gate_rules ON gate_rules;

-- user_annotations
DROP POLICY IF EXISTS admin_all_annotations ON user_annotations;
DROP POLICY IF EXISTS read_all_annotations ON user_annotations;
DROP POLICY IF EXISTS insert_own_annotations ON user_annotations;
DROP POLICY IF EXISTS admin_manage_annotations ON user_annotations;

-- feedback_events
DROP POLICY IF EXISTS admin_all_feedback ON feedback_events;
DROP POLICY IF EXISTS reviewer_read_feedback ON feedback_events;
DROP POLICY IF EXISTS agent_manage_feedback ON feedback_events;

-- agent_runs
DROP POLICY IF EXISTS admin_all_agent_runs ON agent_runs;
DROP POLICY IF EXISTS reviewer_read_agent_runs ON agent_runs;
DROP POLICY IF EXISTS agent_manage_runs ON agent_runs;

-- ---------------------------------------------------------------------------
-- Recreate RLS policies WITH account_id = get_account_id() isolation
-- ---------------------------------------------------------------------------

-- ========================= sources =========================

CREATE POLICY admin_all_sources ON sources
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY reviewer_read_sources ON sources
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );

CREATE POLICY agent_manage_sources ON sources
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'agent-service'
  );

-- ========================= content_items =========================

CREATE POLICY admin_all_content_items ON content_items
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY reviewer_read_content_items ON content_items
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );

CREATE POLICY agent_manage_content_items ON content_items
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'agent-service'
  );

-- ========================= signals =========================

CREATE POLICY admin_all_signals ON signals
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY reviewer_read_signals ON signals
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );

CREATE POLICY agent_manage_signals ON signals
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'agent-service'
  );

-- ========================= market_opportunities =========================

CREATE POLICY admin_all_market_opp ON market_opportunities
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY reviewer_read_market_opp ON market_opportunities
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );

CREATE POLICY viewer_read_active_market_opp ON market_opportunities
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'viewer'
    AND is_active = TRUE
  );

CREATE POLICY agent_manage_market_opp ON market_opportunities
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'agent-service'
  );

-- ========================= opportunity_scores =========================

CREATE POLICY admin_all_opp_scores ON opportunity_scores
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY reviewer_read_opp_scores ON opportunity_scores
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );

CREATE POLICY viewer_read_opp_scores ON opportunity_scores
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'viewer'
  );

CREATE POLICY agent_manage_opp_scores ON opportunity_scores
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'agent-service'
  );

-- ========================= watchlist_versions =========================

CREATE POLICY admin_all_watchlist ON watchlist_versions
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY reviewer_read_watchlist ON watchlist_versions
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );

CREATE POLICY viewer_read_watchlist ON watchlist_versions
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'viewer'
  );

CREATE POLICY agent_manage_watchlist ON watchlist_versions
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'agent-service'
  );

-- ========================= concepts =========================

CREATE POLICY admin_all_concepts ON concepts
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY reviewer_read_concepts ON concepts
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );

CREATE POLICY viewer_read_selected_concepts ON concepts
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'viewer'
    AND selected_for_validation = TRUE
  );

CREATE POLICY agent_manage_concepts ON concepts
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'agent-service'
  );

-- ========================= concept_scores =========================

CREATE POLICY admin_all_concept_scores ON concept_scores
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY reviewer_read_concept_scores ON concept_scores
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );

CREATE POLICY viewer_read_concept_scores ON concept_scores
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'viewer'
  );

CREATE POLICY agent_manage_concept_scores ON concept_scores
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'agent-service'
  );

-- ========================= validations =========================

CREATE POLICY admin_all_validations ON validations
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY reviewer_read_validations ON validations
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );

CREATE POLICY viewer_read_validations ON validations
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'viewer'
  );

CREATE POLICY agent_manage_validations ON validations
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'agent-service'
  );

-- ========================= blueprints =========================

CREATE POLICY admin_all_blueprints ON blueprints
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY reviewer_read_blueprints ON blueprints
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );

CREATE POLICY viewer_read_finalized_blueprints ON blueprints
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'viewer'
    AND is_finalized = TRUE
  );

CREATE POLICY agent_manage_blueprints ON blueprints
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'agent-service'
  );

-- ========================= pipeline_items =========================

CREATE POLICY admin_all_pipeline ON pipeline_items
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY reviewer_read_pipeline ON pipeline_items
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );

CREATE POLICY viewer_read_pipeline ON pipeline_items
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'viewer'
  );

CREATE POLICY agent_manage_pipeline ON pipeline_items
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'agent-service'
  );

-- ========================= gate_decisions =========================

CREATE POLICY admin_all_gate_decisions ON gate_decisions
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY reviewer_read_gate_decisions ON gate_decisions
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );

CREATE POLICY reviewer_insert_gate_decisions ON gate_decisions
  FOR INSERT WITH CHECK (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );

CREATE POLICY agent_manage_gate_decisions ON gate_decisions
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'agent-service'
  );

-- ========================= gate_rules (shared, not account-scoped) =========================
-- gate_rules are global configuration — recreate original policies without account_id

CREATE POLICY admin_all_gate_rules ON gate_rules
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY reviewer_read_gate_rules ON gate_rules
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'reviewer', 'viewer'));

CREATE POLICY agent_read_gate_rules ON gate_rules
  FOR SELECT USING (auth.jwt() ->> 'role' = 'agent-service');

-- ========================= user_annotations =========================

CREATE POLICY admin_all_annotations ON user_annotations
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY read_all_annotations ON user_annotations
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer', 'viewer')
  );

CREATE POLICY insert_own_annotations ON user_annotations
  FOR INSERT WITH CHECK (
    account_id = get_account_id()
    AND auth.uid() = created_by
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );

CREATE POLICY admin_manage_annotations ON user_annotations
  FOR UPDATE USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'admin'
  );

-- ========================= feedback_events =========================

CREATE POLICY admin_all_feedback ON feedback_events
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY reviewer_read_feedback ON feedback_events
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );

CREATE POLICY agent_manage_feedback ON feedback_events
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'agent-service'
  );

-- ========================= agent_runs =========================

CREATE POLICY admin_all_agent_runs ON agent_runs
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY reviewer_read_agent_runs ON agent_runs
  FOR SELECT USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' IN ('admin', 'reviewer')
  );

CREATE POLICY agent_manage_runs ON agent_runs
  FOR ALL USING (
    account_id = get_account_id()
    AND auth.jwt() ->> 'role' = 'agent-service'
  );
