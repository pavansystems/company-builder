export type SourceType = 'rss' | 'api' | 'webpage' | 'research_db';

export interface Source {
  id: string;
  name: string;
  source_type: SourceType;
  url: string | null;
  api_key: string | null;
  config: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_scanned_at: string | null;
  created_by: string | null;
}

export interface ContentItem {
  id: string;
  source_id: string;
  external_id: string | null;
  title: string;
  body: string | null;
  url: string | null;
  published_at: string | null;
  ingested_at: string;
  content_hash: string | null;
  metadata: Record<string, unknown> | null;
  is_duplicate: boolean;
  is_archived: boolean;
}

export interface ContentItemInsert {
  id?: string;
  source_id: string;
  external_id?: string | null;
  title: string;
  body?: string | null;
  url?: string | null;
  published_at?: string | null;
  ingested_at?: string;
  content_hash?: string | null;
  metadata?: Record<string, unknown> | null;
  is_duplicate?: boolean;
  is_archived?: boolean;
}

export interface SourceInsert {
  id?: string;
  name: string;
  source_type: SourceType;
  url?: string | null;
  api_key?: string | null;
  config?: Record<string, unknown> | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  last_scanned_at?: string | null;
  created_by?: string | null;
}
