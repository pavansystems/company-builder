import type { SupabaseClient } from '@supabase/supabase-js';
import type { InsertDTO, UpdateDTO } from '@company-builder/database';
import type {
  PipelineItem,
  PipelineStatus,
  PipelinePhase,
} from '@company-builder/types';
import { logger } from '../utils/logger';

// pipeline_events is not part of the typed Database schema but exists in the DB.
// We define a local insert type that mirrors the table structure.
interface PipelineEventInsert {
  id?: string;
  pipeline_item_id: string;
  event_type: string;
  payload?: Record<string, unknown> | null;
  created_at?: string;
}

export class PipelineStore {
  constructor(private readonly supabase: SupabaseClient) {}

  // ---------------------------------------------------------------------------
  // Pipeline Items
  // ---------------------------------------------------------------------------

  async createItem(item: InsertDTO<'pipeline_items'>): Promise<PipelineItem> {
    const { data, error } = await this.supabase
      .from('pipeline_items')
      .insert(item)
      .select('*')
      .single();

    if (error !== null) {
      logger.error('Failed to create pipeline item', { error: error.message });
      throw new Error(`PipelineStore.createItem failed: ${error.message}`);
    }

    if (data === null) {
      throw new Error('PipelineStore.createItem: no data returned after insert');
    }

    return data as PipelineItem;
  }

  async getItem(id: string): Promise<PipelineItem | null> {
    const { data, error } = await this.supabase
      .from('pipeline_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error !== null) {
      // PGRST116 = row not found
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error('Failed to get pipeline item', { id, error: error.message });
      throw new Error(`PipelineStore.getItem failed: ${error.message}`);
    }

    return data as PipelineItem | null;
  }

  async updateItem(
    id: string,
    updates: UpdateDTO<'pipeline_items'>,
  ): Promise<PipelineItem> {
    const { data, error } = await this.supabase
      .from('pipeline_items')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error !== null) {
      logger.error('Failed to update pipeline item', { id, error: error.message });
      throw new Error(`PipelineStore.updateItem failed: ${error.message}`);
    }

    if (data === null) {
      throw new Error(`PipelineStore.updateItem: no data returned for item ${id}`);
    }

    return data as PipelineItem;
  }

  async getItemsByStatus(status: PipelineStatus): Promise<PipelineItem[]> {
    const { data, error } = await this.supabase
      .from('pipeline_items')
      .select('*')
      .eq('status', status)
      .order('entered_phase_at', { ascending: false });

    if (error !== null) {
      logger.error('Failed to get pipeline items by status', {
        status,
        error: error.message,
      });
      throw new Error(`PipelineStore.getItemsByStatus failed: ${error.message}`);
    }

    return (data ?? []) as PipelineItem[];
  }

  async getItemsByPhase(phase: PipelinePhase): Promise<PipelineItem[]> {
    const { data, error } = await this.supabase
      .from('pipeline_items')
      .select('*')
      .eq('current_phase', phase)
      .order('entered_phase_at', { ascending: false });

    if (error !== null) {
      logger.error('Failed to get pipeline items by phase', {
        phase,
        error: error.message,
      });
      throw new Error(`PipelineStore.getItemsByPhase failed: ${error.message}`);
    }

    return (data ?? []) as PipelineItem[];
  }

  // ---------------------------------------------------------------------------
  // Pipeline Events
  // ---------------------------------------------------------------------------

  async createEvent(event: PipelineEventInsert): Promise<void> {
    // pipeline_events is not in the typed Database schema, so we use a cast.
    const { error } = await (this.supabase as SupabaseClient)
      .from('pipeline_events')
      .insert(event as unknown as Record<string, unknown>);

    if (error !== null) {
      logger.error('Failed to create pipeline event', { error: error.message });
      throw new Error(`PipelineStore.createEvent failed: ${error.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Gate Decisions
  // ---------------------------------------------------------------------------

  async createGateDecision(decision: InsertDTO<'gate_decisions'>): Promise<void> {
    const { error } = await this.supabase.from('gate_decisions').insert(decision);

    if (error !== null) {
      logger.error('Failed to create gate decision', { error: error.message });
      throw new Error(`PipelineStore.createGateDecision failed: ${error.message}`);
    }
  }
}
