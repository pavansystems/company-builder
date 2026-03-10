import type { SupabaseClient } from '@supabase/supabase-js';
import type { InsertDTO, UpdateDTO } from '@company-builder/database';
import type { AgentRun } from '@company-builder/types';
import { logger } from '../utils/logger';

export class AgentRunStore {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Creates a new agent_run record and returns the persisted row.
   */
  async createRun(run: InsertDTO<'agent_runs'>): Promise<AgentRun> {
    const { data, error } = await this.supabase
      .from('agent_runs')
      .insert(run)
      .select('*')
      .single();

    if (error !== null) {
      logger.error('Failed to create agent run', { error: error.message });
      throw new Error(`AgentRunStore.createRun failed: ${error.message}`);
    }

    if (data === null) {
      throw new Error('AgentRunStore.createRun: no data returned after insert');
    }

    return data as AgentRun;
  }

  /**
   * Applies partial updates to an existing agent_run record by ID.
   */
  async updateRun(id: string, updates: UpdateDTO<'agent_runs'>): Promise<void> {
    const { error } = await this.supabase
      .from('agent_runs')
      .update(updates)
      .eq('id', id);

    if (error !== null) {
      logger.error('Failed to update agent run', { id, error: error.message });
      throw new Error(`AgentRunStore.updateRun failed: ${error.message}`);
    }
  }

  /**
   * Returns recent agent runs for a given agent name, newest first.
   */
  async getRunsByAgent(agentName: string, limit: number = 50): Promise<AgentRun[]> {
    const { data, error } = await this.supabase
      .from('agent_runs')
      .select('*')
      .eq('agent_name', agentName)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error !== null) {
      logger.error('Failed to get agent runs by agent', {
        agentName,
        error: error.message,
      });
      throw new Error(`AgentRunStore.getRunsByAgent failed: ${error.message}`);
    }

    return (data ?? []) as AgentRun[];
  }

  /**
   * Computes the total cost in USD for all runs of a given agent.
   * Returns 0 if there are no runs or no cost data.
   */
  async getTotalCostByAgent(agentName: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('agent_runs')
      .select('cost_usd')
      .eq('agent_name', agentName);

    if (error !== null) {
      logger.error('Failed to get total cost by agent', {
        agentName,
        error: error.message,
      });
      throw new Error(`AgentRunStore.getTotalCostByAgent failed: ${error.message}`);
    }

    const rows = (data ?? []) as Array<{ cost_usd: number | null }>;
    const total = rows.reduce((sum, row) => sum + (row.cost_usd ?? 0), 0);
    return total;
  }
}
