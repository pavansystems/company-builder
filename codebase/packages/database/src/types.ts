// Supabase Database type definition — single source of truth for all table types.
// This mirrors the SQL schema exactly and is used by the typed Supabase client.

export interface Database {
  public: {
    Tables: {
      sources: {
        Row: {
          id: string;
          name: string;
          source_type: 'rss' | 'api' | 'webpage' | 'research_db';
          url: string | null;
          api_key: string | null;
          config: Record<string, unknown> | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_scanned_at: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          source_type: 'rss' | 'api' | 'webpage' | 'research_db';
          url?: string | null;
          api_key?: string | null;
          config?: Record<string, unknown> | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_scanned_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          source_type?: 'rss' | 'api' | 'webpage' | 'research_db';
          url?: string | null;
          api_key?: string | null;
          config?: Record<string, unknown> | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          last_scanned_at?: string | null;
          created_by?: string | null;
        };
        Relationships: never[];
      };

      content_items: {
        Row: {
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
        };
        Insert: {
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
        };
        Update: {
          id?: string;
          source_id?: string;
          external_id?: string | null;
          title?: string;
          body?: string | null;
          url?: string | null;
          published_at?: string | null;
          ingested_at?: string;
          content_hash?: string | null;
          metadata?: Record<string, unknown> | null;
          is_duplicate?: boolean;
          is_archived?: boolean;
        };
        Relationships: never[];
      };

      signals: {
        Row: {
          id: string;
          content_item_id: string;
          signal_type: 'tech_breakthrough' | 'regulatory_shift' | 'market_event' | 'customer_pain';
          summary: string;
          confidence: number | null;
          detected_at: string;
          detected_by: string | null;
          entities: Record<string, unknown> | null;
          impact_rating: 'low' | 'medium' | 'high' | 'critical' | null;
          is_archived: boolean;
        };
        Insert: {
          id?: string;
          content_item_id: string;
          signal_type: 'tech_breakthrough' | 'regulatory_shift' | 'market_event' | 'customer_pain';
          summary: string;
          confidence?: number | null;
          detected_at?: string;
          detected_by?: string | null;
          entities?: Record<string, unknown> | null;
          impact_rating?: 'low' | 'medium' | 'high' | 'critical' | null;
          is_archived?: boolean;
        };
        Update: {
          id?: string;
          content_item_id?: string;
          signal_type?: 'tech_breakthrough' | 'regulatory_shift' | 'market_event' | 'customer_pain';
          summary?: string;
          confidence?: number | null;
          detected_at?: string;
          detected_by?: string | null;
          entities?: Record<string, unknown> | null;
          impact_rating?: 'low' | 'medium' | 'high' | 'critical' | null;
          is_archived?: boolean;
        };
        Relationships: never[];
      };

      market_opportunities: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          target_market: string | null;
          target_industry: string | null;
          problem_statement: string | null;
          enabling_signals: unknown[] | null;
          agent_readiness_tag: 'high' | 'medium' | 'low' | null;
          market_size_estimate: number | null;
          market_size_confidence: number | null;
          competitive_density: 'crowded' | 'moderate' | 'sparse' | null;
          created_at: string;
          ranked_at: string | null;
          is_active: boolean;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          target_market?: string | null;
          target_industry?: string | null;
          problem_statement?: string | null;
          enabling_signals?: unknown[] | null;
          agent_readiness_tag?: 'high' | 'medium' | 'low' | null;
          market_size_estimate?: number | null;
          market_size_confidence?: number | null;
          competitive_density?: 'crowded' | 'moderate' | 'sparse' | null;
          created_at?: string;
          ranked_at?: string | null;
          is_active?: boolean;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          target_market?: string | null;
          target_industry?: string | null;
          problem_statement?: string | null;
          enabling_signals?: unknown[] | null;
          agent_readiness_tag?: 'high' | 'medium' | 'low' | null;
          market_size_estimate?: number | null;
          market_size_confidence?: number | null;
          competitive_density?: 'crowded' | 'moderate' | 'sparse' | null;
          created_at?: string;
          ranked_at?: string | null;
          is_active?: boolean;
          archived_at?: string | null;
        };
        Relationships: never[];
      };

      opportunity_scores: {
        Row: {
          id: string;
          market_opportunity_id: string;
          scored_at: string;
          scored_by: string | null;
          market_size_score: number | null;
          signal_convergence_score: number | null;
          agent_readiness_score: number | null;
          competitive_density_score: number | null;
          timing_confidence_score: number | null;
          composite_score: number | null;
          weight_market_size: number;
          weight_signal_convergence: number;
          weight_agent_readiness: number;
          weight_competitive_density: number;
          weight_timing_confidence: number;
          reasoning: string | null;
        };
        Insert: {
          id?: string;
          market_opportunity_id: string;
          scored_at?: string;
          scored_by?: string | null;
          market_size_score?: number | null;
          signal_convergence_score?: number | null;
          agent_readiness_score?: number | null;
          competitive_density_score?: number | null;
          timing_confidence_score?: number | null;
          composite_score?: number | null;
          weight_market_size?: number;
          weight_signal_convergence?: number;
          weight_agent_readiness?: number;
          weight_competitive_density?: number;
          weight_timing_confidence?: number;
          reasoning?: string | null;
        };
        Update: {
          id?: string;
          market_opportunity_id?: string;
          scored_at?: string;
          scored_by?: string | null;
          market_size_score?: number | null;
          signal_convergence_score?: number | null;
          agent_readiness_score?: number | null;
          competitive_density_score?: number | null;
          timing_confidence_score?: number | null;
          composite_score?: number | null;
          weight_market_size?: number;
          weight_signal_convergence?: number;
          weight_agent_readiness?: number;
          weight_competitive_density?: number;
          weight_timing_confidence?: number;
          reasoning?: string | null;
        };
        Relationships: never[];
      };

      watchlist_versions: {
        Row: {
          id: string;
          version_number: number;
          published_at: string;
          snapshot_data: unknown[] | null;
          total_opportunities: number | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          version_number: number;
          published_at?: string;
          snapshot_data?: unknown[] | null;
          total_opportunities?: number | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          version_number?: number;
          published_at?: string;
          snapshot_data?: unknown[] | null;
          total_opportunities?: number | null;
          created_by?: string | null;
        };
        Relationships: never[];
      };

      concepts: {
        Row: {
          id: string;
          market_opportunity_id: string;
          title: string;
          summary: string | null;
          value_proposition: string | null;
          target_customer_segment: string | null;
          pain_points_addressed: unknown[] | null;
          agent_architecture_sketch: string | null;
          defensibility_notes: string | null;
          generated_at: string;
          generated_by: string | null;
          source_phase: 'generated' | 'user_provided' | null;
          is_active: boolean;
          selected_for_validation: boolean;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          market_opportunity_id: string;
          title: string;
          summary?: string | null;
          value_proposition?: string | null;
          target_customer_segment?: string | null;
          pain_points_addressed?: unknown[] | null;
          agent_architecture_sketch?: string | null;
          defensibility_notes?: string | null;
          generated_at?: string;
          generated_by?: string | null;
          source_phase?: 'generated' | 'user_provided' | null;
          is_active?: boolean;
          selected_for_validation?: boolean;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          market_opportunity_id?: string;
          title?: string;
          summary?: string | null;
          value_proposition?: string | null;
          target_customer_segment?: string | null;
          pain_points_addressed?: unknown[] | null;
          agent_architecture_sketch?: string | null;
          defensibility_notes?: string | null;
          generated_at?: string;
          generated_by?: string | null;
          source_phase?: 'generated' | 'user_provided' | null;
          is_active?: boolean;
          selected_for_validation?: boolean;
          archived_at?: string | null;
        };
        Relationships: never[];
      };

      concept_scores: {
        Row: {
          id: string;
          concept_id: string;
          scored_at: string;
          scored_by: string | null;
          disruption_potential: number | null;
          agent_readiness: number | null;
          feasibility: number | null;
          differentiation: number | null;
          revenue_clarity: number | null;
          composite_score: number | null;
          weight_disruption: number;
          weight_agent_readiness: number;
          weight_feasibility: number;
          weight_differentiation: number;
          weight_revenue_clarity: number;
          reasoning: string | null;
        };
        Insert: {
          id?: string;
          concept_id: string;
          scored_at?: string;
          scored_by?: string | null;
          disruption_potential?: number | null;
          agent_readiness?: number | null;
          feasibility?: number | null;
          differentiation?: number | null;
          revenue_clarity?: number | null;
          composite_score?: number | null;
          weight_disruption?: number;
          weight_agent_readiness?: number;
          weight_feasibility?: number;
          weight_differentiation?: number;
          weight_revenue_clarity?: number;
          reasoning?: string | null;
        };
        Update: {
          id?: string;
          concept_id?: string;
          scored_at?: string;
          scored_by?: string | null;
          disruption_potential?: number | null;
          agent_readiness?: number | null;
          feasibility?: number | null;
          differentiation?: number | null;
          revenue_clarity?: number | null;
          composite_score?: number | null;
          weight_disruption?: number;
          weight_agent_readiness?: number;
          weight_feasibility?: number;
          weight_differentiation?: number;
          weight_revenue_clarity?: number;
          reasoning?: string | null;
        };
        Relationships: never[];
      };

      validations: {
        Row: {
          id: string;
          concept_id: string;
          validation_phase: 'market_sizing' | 'competitive' | 'customer' | 'feasibility' | 'economics' | 'synthesis' | null;
          tam_estimate: number | null;
          tam_confidence: number | null;
          sam_estimate: number | null;
          som_estimate: number | null;
          growth_rate_percent: number | null;
          market_sizing_methodology: string | null;
          competitors: unknown | null;
          vulnerability_map: unknown | null;
          competitive_intensity: 'low' | 'moderate' | 'high' | null;
          pain_point_evidence: unknown | null;
          early_adopter_profile: string | null;
          willingness_to_pay_low: number | null;
          willingness_to_pay_high: number | null;
          customer_validation_confidence: number | null;
          required_ai_capabilities: unknown | null;
          technical_risks: unknown | null;
          regulatory_barriers: string | null;
          showstoppers: unknown | null;
          feasibility_rating: 'viable' | 'challenging' | 'not_viable' | null;
          cac: number | null;
          ltv: number | null;
          ltv_cac_ratio: number | null;
          gross_margin_percent: number | null;
          breakeven_months: number | null;
          unit_economics_json: Record<string, unknown> | null;
          verdict: 'go' | 'go_with_caution' | 'no_go' | null;
          confidence: number | null;
          summary: string | null;
          key_assumptions: unknown | null;
          risks: unknown | null;
          validated_at: string;
          validated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          concept_id: string;
          validation_phase?: 'market_sizing' | 'competitive' | 'customer' | 'feasibility' | 'economics' | 'synthesis' | null;
          tam_estimate?: number | null;
          tam_confidence?: number | null;
          sam_estimate?: number | null;
          som_estimate?: number | null;
          growth_rate_percent?: number | null;
          market_sizing_methodology?: string | null;
          competitors?: unknown | null;
          vulnerability_map?: unknown | null;
          competitive_intensity?: 'low' | 'moderate' | 'high' | null;
          pain_point_evidence?: unknown | null;
          early_adopter_profile?: string | null;
          willingness_to_pay_low?: number | null;
          willingness_to_pay_high?: number | null;
          customer_validation_confidence?: number | null;
          required_ai_capabilities?: unknown | null;
          technical_risks?: unknown | null;
          regulatory_barriers?: string | null;
          showstoppers?: unknown | null;
          feasibility_rating?: 'viable' | 'challenging' | 'not_viable' | null;
          cac?: number | null;
          ltv?: number | null;
          ltv_cac_ratio?: number | null;
          gross_margin_percent?: number | null;
          breakeven_months?: number | null;
          unit_economics_json?: Record<string, unknown> | null;
          verdict?: 'go' | 'go_with_caution' | 'no_go' | null;
          confidence?: number | null;
          summary?: string | null;
          key_assumptions?: unknown | null;
          risks?: unknown | null;
          validated_at?: string;
          validated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          concept_id?: string;
          validation_phase?: 'market_sizing' | 'competitive' | 'customer' | 'feasibility' | 'economics' | 'synthesis' | null;
          tam_estimate?: number | null;
          tam_confidence?: number | null;
          sam_estimate?: number | null;
          som_estimate?: number | null;
          growth_rate_percent?: number | null;
          market_sizing_methodology?: string | null;
          competitors?: unknown | null;
          vulnerability_map?: unknown | null;
          competitive_intensity?: 'low' | 'moderate' | 'high' | null;
          pain_point_evidence?: unknown | null;
          early_adopter_profile?: string | null;
          willingness_to_pay_low?: number | null;
          willingness_to_pay_high?: number | null;
          customer_validation_confidence?: number | null;
          required_ai_capabilities?: unknown | null;
          technical_risks?: unknown | null;
          regulatory_barriers?: string | null;
          showstoppers?: unknown | null;
          feasibility_rating?: 'viable' | 'challenging' | 'not_viable' | null;
          cac?: number | null;
          ltv?: number | null;
          ltv_cac_ratio?: number | null;
          gross_margin_percent?: number | null;
          breakeven_months?: number | null;
          unit_economics_json?: Record<string, unknown> | null;
          verdict?: 'go' | 'go_with_caution' | 'no_go' | null;
          confidence?: number | null;
          summary?: string | null;
          key_assumptions?: unknown | null;
          risks?: unknown | null;
          validated_at?: string;
          validated_by?: string | null;
          updated_at?: string;
        };
        Relationships: never[];
      };

      blueprints: {
        Row: {
          id: string;
          concept_id: string;
          revenue_model: 'subscription' | 'usage_based' | 'marketplace' | 'hybrid' | null;
          pricing_tiers: unknown | null;
          customer_journey: string | null;
          expansion_revenue_opportunities: unknown | null;
          financial_projection_months: number | null;
          financial_projection: unknown | null;
          agent_roles: unknown | null;
          human_roles: unknown | null;
          escalation_protocols: unknown | null;
          operational_cost_breakdown: unknown | null;
          gtm_target_segment: string | null;
          gtm_channels: unknown | null;
          gtm_messaging_framework: string | null;
          gtm_launch_timeline: unknown | null;
          agent_gtm_activities: unknown | null;
          human_gtm_activities: unknown | null;
          risks: unknown | null;
          upfront_build_cost: number | null;
          monthly_operating_cost: number | null;
          hiring_plan: unknown | null;
          technology_stack: unknown | null;
          funding_milestones: unknown | null;
          runway_months: number | null;
          executive_summary: string | null;
          internal_consistency_notes: string | null;
          created_at: string;
          created_by: string | null;
          updated_at: string;
          is_finalized: boolean;
          finalized_at: string | null;
          storage_location_pdf: string | null;
        };
        Insert: {
          id?: string;
          concept_id: string;
          revenue_model?: 'subscription' | 'usage_based' | 'marketplace' | 'hybrid' | null;
          pricing_tiers?: unknown | null;
          customer_journey?: string | null;
          expansion_revenue_opportunities?: unknown | null;
          financial_projection_months?: number | null;
          financial_projection?: unknown | null;
          agent_roles?: unknown | null;
          human_roles?: unknown | null;
          escalation_protocols?: unknown | null;
          operational_cost_breakdown?: unknown | null;
          gtm_target_segment?: string | null;
          gtm_channels?: unknown | null;
          gtm_messaging_framework?: string | null;
          gtm_launch_timeline?: unknown | null;
          agent_gtm_activities?: unknown | null;
          human_gtm_activities?: unknown | null;
          risks?: unknown | null;
          upfront_build_cost?: number | null;
          monthly_operating_cost?: number | null;
          hiring_plan?: unknown | null;
          technology_stack?: unknown | null;
          funding_milestones?: unknown | null;
          runway_months?: number | null;
          executive_summary?: string | null;
          internal_consistency_notes?: string | null;
          created_at?: string;
          created_by?: string | null;
          updated_at?: string;
          is_finalized?: boolean;
          finalized_at?: string | null;
          storage_location_pdf?: string | null;
        };
        Update: {
          id?: string;
          concept_id?: string;
          revenue_model?: 'subscription' | 'usage_based' | 'marketplace' | 'hybrid' | null;
          pricing_tiers?: unknown | null;
          customer_journey?: string | null;
          expansion_revenue_opportunities?: unknown | null;
          financial_projection_months?: number | null;
          financial_projection?: unknown | null;
          agent_roles?: unknown | null;
          human_roles?: unknown | null;
          escalation_protocols?: unknown | null;
          operational_cost_breakdown?: unknown | null;
          gtm_target_segment?: string | null;
          gtm_channels?: unknown | null;
          gtm_messaging_framework?: string | null;
          gtm_launch_timeline?: unknown | null;
          agent_gtm_activities?: unknown | null;
          human_gtm_activities?: unknown | null;
          risks?: unknown | null;
          upfront_build_cost?: number | null;
          monthly_operating_cost?: number | null;
          hiring_plan?: unknown | null;
          technology_stack?: unknown | null;
          funding_milestones?: unknown | null;
          runway_months?: number | null;
          executive_summary?: string | null;
          internal_consistency_notes?: string | null;
          created_at?: string;
          created_by?: string | null;
          updated_at?: string;
          is_finalized?: boolean;
          finalized_at?: string | null;
          storage_location_pdf?: string | null;
        };
        Relationships: never[];
      };

      pipeline_items: {
        Row: {
          id: string;
          item_type: 'opportunity' | 'concept' | 'validation' | 'blueprint' | null;
          source_id: string | null;
          market_opportunity_id: string | null;
          concept_id: string | null;
          current_phase: 'phase_0' | 'phase_1' | 'phase_2' | 'phase_3' | 'rejected' | 'archived' | null;
          current_step: string | null;
          status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked' | null;
          last_gate_decision: string | null;
          last_gate_at: string | null;
          last_gate_reason: string | null;
          last_gate_by: string | null;
          entered_phase_at: string | null;
          entered_step_at: string | null;
          completed_at: string | null;
          tags: unknown | null;
          priority: 'low' | 'normal' | 'high' | null;
        };
        Insert: {
          id?: string;
          item_type?: 'opportunity' | 'concept' | 'validation' | 'blueprint' | null;
          source_id?: string | null;
          market_opportunity_id?: string | null;
          concept_id?: string | null;
          current_phase?: 'phase_0' | 'phase_1' | 'phase_2' | 'phase_3' | 'rejected' | 'archived' | null;
          current_step?: string | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked' | null;
          last_gate_decision?: string | null;
          last_gate_at?: string | null;
          last_gate_reason?: string | null;
          last_gate_by?: string | null;
          entered_phase_at?: string | null;
          entered_step_at?: string | null;
          completed_at?: string | null;
          tags?: unknown | null;
          priority?: 'low' | 'normal' | 'high' | null;
        };
        Update: {
          id?: string;
          item_type?: 'opportunity' | 'concept' | 'validation' | 'blueprint' | null;
          source_id?: string | null;
          market_opportunity_id?: string | null;
          concept_id?: string | null;
          current_phase?: 'phase_0' | 'phase_1' | 'phase_2' | 'phase_3' | 'rejected' | 'archived' | null;
          current_step?: string | null;
          status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked' | null;
          last_gate_decision?: string | null;
          last_gate_at?: string | null;
          last_gate_reason?: string | null;
          last_gate_by?: string | null;
          entered_phase_at?: string | null;
          entered_step_at?: string | null;
          completed_at?: string | null;
          tags?: unknown | null;
          priority?: 'low' | 'normal' | 'high' | null;
        };
        Relationships: never[];
      };

      gate_decisions: {
        Row: {
          id: string;
          gate_phase: string | null;
          pipeline_item_id: string;
          decision: 'pass' | 'fail' | 'override_pass' | 'override_fail';
          decision_by: string | null;
          decision_reason: string | null;
          pre_decision_data: Record<string, unknown> | null;
          override_reason: string | null;
          decided_at: string;
        };
        Insert: {
          id?: string;
          gate_phase?: string | null;
          pipeline_item_id: string;
          decision: 'pass' | 'fail' | 'override_pass' | 'override_fail';
          decision_by?: string | null;
          decision_reason?: string | null;
          pre_decision_data?: Record<string, unknown> | null;
          override_reason?: string | null;
          decided_at?: string;
        };
        Update: {
          id?: string;
          gate_phase?: string | null;
          pipeline_item_id?: string;
          decision?: 'pass' | 'fail' | 'override_pass' | 'override_fail';
          decision_by?: string | null;
          decision_reason?: string | null;
          pre_decision_data?: Record<string, unknown> | null;
          override_reason?: string | null;
          decided_at?: string;
        };
        Relationships: never[];
      };

      gate_rules: {
        Row: {
          id: string;
          phase_from: string;
          phase_to: string;
          gate_type: 'automatic' | 'manual' | 'hybrid';
          high_threshold: number;
          low_threshold: number;
          config: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phase_from: string;
          phase_to: string;
          gate_type: 'automatic' | 'manual' | 'hybrid';
          high_threshold: number;
          low_threshold: number;
          config?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phase_from?: string;
          phase_to?: string;
          gate_type?: 'automatic' | 'manual' | 'hybrid';
          high_threshold?: number;
          low_threshold?: number;
          config?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };

      user_annotations: {
        Row: {
          id: string;
          annotated_object_type: 'opportunity' | 'concept' | 'validation' | 'blueprint' | 'signal';
          annotated_object_id: string;
          annotation_type: 'note' | 'flag' | 'override_score' | 'suggest_rejection' | 'suggest_advancement';
          content: string | null;
          score_override_dimension: string | null;
          score_override_value: number | null;
          override_reason: string | null;
          created_by: string;
          created_at: string;
          resolved: boolean;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          annotated_object_type: 'opportunity' | 'concept' | 'validation' | 'blueprint' | 'signal';
          annotated_object_id: string;
          annotation_type: 'note' | 'flag' | 'override_score' | 'suggest_rejection' | 'suggest_advancement';
          content?: string | null;
          score_override_dimension?: string | null;
          score_override_value?: number | null;
          override_reason?: string | null;
          created_by: string;
          created_at?: string;
          resolved?: boolean;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          annotated_object_type?: 'opportunity' | 'concept' | 'validation' | 'blueprint' | 'signal';
          annotated_object_id?: string;
          annotation_type?: 'note' | 'flag' | 'override_score' | 'suggest_rejection' | 'suggest_advancement';
          content?: string | null;
          score_override_dimension?: string | null;
          score_override_value?: number | null;
          override_reason?: string | null;
          created_by?: string;
          created_at?: string;
          resolved?: boolean;
          resolved_at?: string | null;
        };
        Relationships: never[];
      };

      feedback_events: {
        Row: {
          id: string;
          event_type: 'validation_passed' | 'validation_failed' | 'blueprint_launched' | 'gate_override' | null;
          related_concept_id: string | null;
          outcome: string | null;
          outcome_confidence: number | null;
          learning_for_phase: string | null;
          learning_detail: string | null;
          occurred_at: string;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          event_type?: 'validation_passed' | 'validation_failed' | 'blueprint_launched' | 'gate_override' | null;
          related_concept_id?: string | null;
          outcome?: string | null;
          outcome_confidence?: number | null;
          learning_for_phase?: string | null;
          learning_detail?: string | null;
          occurred_at?: string;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          event_type?: 'validation_passed' | 'validation_failed' | 'blueprint_launched' | 'gate_override' | null;
          related_concept_id?: string | null;
          outcome?: string | null;
          outcome_confidence?: number | null;
          learning_for_phase?: string | null;
          learning_detail?: string | null;
          occurred_at?: string;
          recorded_at?: string;
        };
        Relationships: never[];
      };

      agent_runs: {
        Row: {
          id: string;
          agent_name: string;
          agent_version: string | null;
          triggered_by: 'orchestrator' | 'webhook' | 'manual' | 'schedule' | null;
          pipeline_item_id: string | null;
          input_data: Record<string, unknown> | null;
          output_data: Record<string, unknown> | null;
          status: 'success' | 'partial' | 'failed' | 'timeout';
          error_message: string | null;
          execution_duration_seconds: number | null;
          tokens_input: number | null;
          tokens_output: number | null;
          cost_usd: number | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          agent_name: string;
          agent_version?: string | null;
          triggered_by?: 'orchestrator' | 'webhook' | 'manual' | 'schedule' | null;
          pipeline_item_id?: string | null;
          input_data?: Record<string, unknown> | null;
          output_data?: Record<string, unknown> | null;
          status: 'success' | 'partial' | 'failed' | 'timeout';
          error_message?: string | null;
          execution_duration_seconds?: number | null;
          tokens_input?: number | null;
          tokens_output?: number | null;
          cost_usd?: number | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          agent_name?: string;
          agent_version?: string | null;
          triggered_by?: 'orchestrator' | 'webhook' | 'manual' | 'schedule' | null;
          pipeline_item_id?: string | null;
          input_data?: Record<string, unknown> | null;
          output_data?: Record<string, unknown> | null;
          status?: 'success' | 'partial' | 'failed' | 'timeout';
          error_message?: string | null;
          execution_duration_seconds?: number | null;
          tokens_input?: number | null;
          tokens_output?: number | null;
          cost_usd?: number | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Relationships: never[];
      };
    };

    Views: Record<string, { Row: Record<string, unknown>; Relationships: never[] }>;

    Functions: {
      advance_pipeline_state: {
        Args: {
          p_pipeline_item_id: string;
          p_new_phase: string;
          p_new_step: string;
          p_new_status: string;
        };
        Returns: {
          updated_at: string;
          current_phase: string;
          current_step: string;
          status: string;
        }[];
      };
    };

    Enums: Record<string, never>;
  };
}

// Convenience type helpers
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertDTO<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateDTO<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
