-- Migration 001: Sources and Content Items
-- Phase 0 ingestion layer tables

CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  source_type VARCHAR(50) NOT NULL,
  url TEXT,
  api_key TEXT,
  config JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_scanned_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT source_type_valid CHECK (source_type IN ('rss', 'api', 'webpage', 'research_db'))
);

CREATE INDEX IF NOT EXISTS idx_sources_active ON sources(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_sources_type ON sources(source_type);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  external_id VARCHAR(512),
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  published_at TIMESTAMPTZ,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content_hash VARCHAR(64),
  metadata JSONB,
  is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,

  UNIQUE(source_id, external_id),
  CONSTRAINT url_or_body CHECK (url IS NOT NULL OR body IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_content_items_source ON content_items(source_id);
CREATE INDEX IF NOT EXISTS idx_content_items_published ON content_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_items_ingested ON content_items(ingested_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_items_hash ON content_items(content_hash);
CREATE INDEX IF NOT EXISTS idx_content_items_archived ON content_items(is_archived) WHERE is_archived = FALSE;
