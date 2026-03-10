-- Migration 003: Watchlist
-- Phase 0.5 watchlist versioning tables

CREATE TABLE IF NOT EXISTS watchlist_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number INT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  snapshot_data JSONB,
  total_opportunities INT,
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(version_number)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_versions_published ON watchlist_versions(published_at DESC);
