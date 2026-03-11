import { z } from 'zod';

// =============================================================================
// Shared / reusable schema fragments
// =============================================================================

// Note: All shared entity schemas use .passthrough() so that additional fields
// from the database (e.g. timestamps, metadata) are not stripped during parsing.

const SourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  source_type: z.enum(['rss', 'api', 'webpage', 'research_db']),
  url: z.string().nullable().optional(),
  is_active: z.boolean(),
}).passthrough();

const ContentItemSchema = z.object({
  id: z.string(),
  source_id: z.string(),
  title: z.string(),
  body: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
}).passthrough();

const SignalSchema = z.object({
  id: z.string(),
  content_item_id: z.string(),
  signal_type: z.enum(['tech_breakthrough', 'regulatory_shift', 'market_event', 'customer_pain']),
  summary: z.string(),
  confidence: z.number().nullable().optional(),
  impact_rating: z.enum(['low', 'medium', 'high', 'critical']).nullable().optional(),
  entities: z
    .object({
      companies: z.array(z.string()),
      technologies: z.array(z.string()),
      trends: z.array(z.string()),
    })
    .nullable()
    .optional(),
}).passthrough();

const MarketOpportunitySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  target_market: z.string().nullable().optional(),
  target_industry: z.string().nullable().optional(),
  problem_statement: z.string().nullable().optional(),
  enabling_signals: z.array(z.string()).nullable().optional(),
  agent_readiness_tag: z.enum(['high', 'medium', 'low']).nullable().optional(),
  market_size_estimate: z.number().nullable().optional(),
  market_size_confidence: z.number().nullable().optional(),
  competitive_density: z.enum(['crowded', 'moderate', 'sparse']).nullable().optional(),
  created_at: z.string(),
}).passthrough();

const OpportunityScoreSchema = z.object({
  id: z.string(),
  market_opportunity_id: z.string(),
  composite_score: z.number().nullable().optional(),
  market_size_score: z.number().nullable().optional(),
  signal_convergence_score: z.number().nullable().optional(),
  agent_readiness_score: z.number().nullable().optional(),
  competitive_density_score: z.number().nullable().optional(),
  timing_confidence_score: z.number().nullable().optional(),
  reasoning: z.string().nullable().optional(),
}).passthrough();

const ConceptSchema = z.object({
  id: z.string(),
  market_opportunity_id: z.string(),
  title: z.string(),
  summary: z.string().nullable().optional(),
  value_proposition: z.string().nullable().optional(),
  target_customer_segment: z.string().nullable().optional(),
  pain_points_addressed: z.array(z.string()).nullable().optional(),
  agent_architecture_sketch: z.string().nullable().optional(),
  defensibility_notes: z.string().nullable().optional(),
}).passthrough();

const ConceptScoreSchema = z.object({
  id: z.string(),
  concept_id: z.string(),
  disruption_potential: z.number().nullable().optional(),
  agent_readiness: z.number().nullable().optional(),
  feasibility: z.number().nullable().optional(),
  differentiation: z.number().nullable().optional(),
  revenue_clarity: z.number().nullable().optional(),
  composite_score: z.number().nullable().optional(),
  reasoning: z.string().nullable().optional(),
}).passthrough();

// =============================================================================
// Phase 0: Discovery
// =============================================================================

// --- SourceScannerAgent ---
export const SourceScannerInputSchema = z.object({
  sources: z.array(SourceSchema).min(1),
});

export const SourceScannerOutputSchema = z.array(
  z.object({
    source_id: z.string(),
    title: z.string(),
    body: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
    published_at: z.string().nullable().optional(),
    content_hash: z.string().nullable().optional(),
    metadata: z.record(z.unknown()).nullable().optional(),
    is_duplicate: z.boolean().optional(),
  }),
);

// --- SignalDetectorAgent ---
export const SignalDetectorInputSchema = z.object({
  contentItems: z.array(ContentItemSchema).min(1),
});

export const SignalDetectorOutputSchema = z.array(
  z.object({
    content_item_id: z.string(),
    signal_type: z.enum(['tech_breakthrough', 'regulatory_shift', 'market_event', 'customer_pain']),
    summary: z.string(),
    confidence: z.number().min(0).max(1),
    impact_rating: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  }),
);

// --- MarketClassifierAgent ---
export const MarketClassifierInputSchema = z.object({
  signals: z.array(SignalSchema).min(1),
});

export const MarketClassifierOutputSchema = z.array(
  z.object({
    title: z.string(),
    target_market: z.string().nullable().optional(),
    target_industry: z.string().nullable().optional(),
  }),
);

// --- OpportunityRankerAgent ---
export const OpportunityRankerInputSchema = z.object({
  opportunities: z.array(MarketOpportunitySchema).min(1),
});

export const OpportunityRankerOutputSchema = z.array(
  z.object({
    market_opportunity_id: z.string(),
    market_size_score: z.number().optional(),
    signal_convergence_score: z.number().optional(),
    agent_readiness_score: z.number().optional(),
    competitive_density_score: z.number().optional(),
    timing_confidence_score: z.number().optional(),
    composite_score: z.number().optional(),
  }),
);

// --- WatchlistPublisherAgent ---
export const WatchlistPublisherInputSchema = z.object({
  opportunities: z.array(MarketOpportunitySchema),
  scores: z.array(OpportunityScoreSchema),
});

export const WatchlistPublisherOutputSchema = z.object({
  version: z.object({
    version_number: z.number(),
    published_at: z.string(),
  }),
  items: z.array(z.unknown()),
});

// =============================================================================
// Phase 1: Ideation
// =============================================================================

// --- LandscapeAnalystAgent ---
export const LandscapeAnalystInputSchema = z.object({
  opportunityId: z.string(),
  opportunity: MarketOpportunitySchema,
});

export const LandscapeAnalystOutputSchema = z.object({
  incumbents: z.array(
    z.object({
      name: z.string(),
      marketShare: z.string(),
      weakness: z.string(),
    }),
  ),
  emergingPlayers: z.array(
    z.object({
      name: z.string(),
      stage: z.string(),
      angle: z.string(),
    }),
  ),
  technologyTrends: z.array(z.string()),
  maturityLevel: z.enum(['nascent', 'emerging', 'growing', 'mature']),
  agentDisruptionAngle: z.string(),
});

// --- PainExtractorAgent ---
export const PainExtractorInputSchema = z.object({
  opportunityId: z.string(),
  opportunity: MarketOpportunitySchema,
  landscapeAnalysis: z.record(z.unknown()),
});

export const PainExtractorOutputSchema = z.object({
  painPoints: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      affectedSegment: z.string(),
      severity: z.number(),
      evidence: z.array(z.string()),
      currentWorkaround: z.string(),
    }),
  ),
  primaryPainPoint: z.string(),
  estimatedWTPMonthly: z.number(),
});

// --- ConceptGeneratorAgent ---
export const ConceptGeneratorInputSchema = z.object({
  opportunityId: z.string(),
  opportunity: MarketOpportunitySchema,
  painPoints: z.record(z.unknown()),
  landscape: z.record(z.unknown()),
});

export const ConceptGeneratorOutputSchema = z.array(
  z.object({
    name: z.string(),
    tagline: z.string(),
    description: z.string(),
    target_customer: z.string(),
    core_value_prop: z.string(),
    agent_roles: z.array(z.string()),
    differentiators: z.array(z.string()),
  }),
);

// --- ConceptScorerAgent ---
export const ConceptScorerInputSchema = z.object({
  concepts: z.array(ConceptSchema).min(1),
  opportunity: MarketOpportunitySchema,
});

export const ConceptScorerOutputSchema = z.array(
  z.object({
    conceptId: z.string(),
    innovation_score: z.number(),
    market_fit_score: z.number(),
    agent_leverage_score: z.number(),
    feasibility_score: z.number(),
    differentiation_score: z.number(),
    composite_score: z.number(),
  }),
);

// --- ConceptSelectorAgent ---
export const ConceptSelectorInputSchema = z.object({
  concepts: z.array(ConceptSchema).min(1),
  scores: z.array(ConceptScoreSchema),
});

export const ConceptSelectorOutputSchema = z.object({
  selectedConceptIds: z.array(z.string()),
  rejectedConceptIds: z.array(z.string()),
  selectionRationale: z.string(),
  confidence: z.number().min(0).max(1),
});

// =============================================================================
// Phase 2: Validation
// =============================================================================

const Phase2ConceptInput = z.object({
  conceptId: z.string(),
  concept: ConceptSchema,
  opportunity: MarketOpportunitySchema,
});

// --- MarketSizerAgent ---
export const MarketSizerInputSchema = Phase2ConceptInput;

export const MarketSizerOutputSchema = z.object({
  tam: z.number(),
  sam: z.number(),
  som: z.number(),
  tamMethodology: z.string(),
  growthRate: z.number(),
  keyAssumptions: z.array(z.string()),
  confidence: z.enum(['low', 'medium', 'high']),
});

// --- CompetitiveAnalystAgent ---
export const CompetitiveAnalystInputSchema = Phase2ConceptInput;

export const CompetitiveAnalystOutputSchema = z.object({
  competitors: z.array(
    z.object({
      name: z.string(),
      pricing: z.string(),
      weaknesses: z.array(z.string()),
      market_share: z.string().nullable().optional(),
    }),
  ),
  vulnerabilityMap: z.object({
    cost_advantages: z.array(z.string()),
    speed_advantages: z.array(z.string()),
    quality_advantages: z.array(z.string()),
  }),
  competitiveIntensity: z.enum(['low', 'moderate', 'high']),
  entryBarriers: z.array(z.string()),
  disruptionWindow: z.string(),
});

// --- CustomerValidatorAgent ---
export const CustomerValidatorInputSchema = Phase2ConceptInput;

export const CustomerValidatorOutputSchema = z.object({
  painPointEvidence: z.array(
    z.object({
      pain_point: z.string(),
      search_volume: z.number().nullable().optional(),
      sentiment: z.string().nullable().optional(),
      willingness_to_pay: z.number().nullable().optional(),
    }),
  ),
  earlyAdopterProfile: z.string(),
  willingnessToPay: z.object({
    low: z.number(),
    high: z.number(),
  }),
  confidence: z.number().min(0).max(1),
  adoptionBarriers: z.array(z.string()),
  signalSources: z.array(z.string()),
});

// --- FeasibilityAssessorAgent ---
export const FeasibilityAssessorInputSchema = Phase2ConceptInput;

export const FeasibilityAssessorOutputSchema = z.object({
  requiredAICapabilities: z.array(z.string()),
  technicalRisks: z.array(
    z.object({
      risk: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
      known_solution: z.string().nullable().optional(),
    }),
  ),
  regulatoryBarriers: z.string(),
  showstoppers: z.array(z.string()),
  feasibilityRating: z.enum(['viable', 'challenging', 'not_viable']),
  buildTimelineMonths: z.number(),
  mvpScope: z.string(),
});

// --- EconomicsModelerAgent ---
export const EconomicsModelerInputSchema = Phase2ConceptInput;

export const EconomicsModelerOutputSchema = z.object({
  cac: z.number(),
  ltv: z.number(),
  ltvCacRatio: z.number(),
  grossMarginPercent: z.number(),
  breakevenMonths: z.number(),
  unitEconomicsJson: z.object({
    revenueModel: z.string(),
    arpu: z.number(),
    cogs: z.number(),
    grossMarginPercent: z.number(),
    cac: z.number(),
    paybackPeriodMonths: z.number(),
    ltv: z.number(),
    ltvCacRatio: z.number(),
    breakevenMonths: z.number(),
    operatingCostStructure: z.record(z.number()),
    scenarioAnalysis: z.object({
      bear: z.object({ grossMarginPercent: z.number(), ltvCacRatio: z.number(), breakevenMonths: z.number() }),
      base: z.object({ grossMarginPercent: z.number(), ltvCacRatio: z.number(), breakevenMonths: z.number() }),
      bull: z.object({ grossMarginPercent: z.number(), ltvCacRatio: z.number(), breakevenMonths: z.number() }),
    }),
  }),
});

// --- ValidationSynthesizerAgent ---
export const ValidationSynthesizerInputSchema = z.object({
  conceptId: z.string(),
  concept: ConceptSchema,
  opportunity: MarketOpportunitySchema,
});

export const ValidationSynthesizerOutputSchema = z.object({
  verdict: z.enum(['go', 'go_with_caution', 'no_go']),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  keyAssumptions: z.array(z.string()),
  risks: z.array(
    z.object({
      risk: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
      mitigation: z.string(),
    }),
  ),
  goConditions: z.array(z.string()),
  noGoConditions: z.array(z.string()),
});

// =============================================================================
// Phase 3: Blueprint
// =============================================================================

// --- BusinessDesignerAgent ---
export const BusinessDesignerInputSchema = z.object({
  conceptId: z.string(),
  concept: ConceptSchema,
  validationSynthesis: z.record(z.unknown()),
  marketSizing: z.record(z.unknown()),
  unitEconomics: z.record(z.unknown()),
});

export const BusinessDesignerOutputSchema = z.object({
  revenueStreams: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(['subscription', 'usage', 'transaction', 'license']),
        description: z.string(),
        estimatedShare: z.number(),
      }),
    )
    .min(1),
  pricingTiers: z
    .array(
      z.object({
        name: z.string(),
        priceMonthly: z.number(),
        features: z.array(z.string()),
        targetSegment: z.string(),
      }),
    )
    .min(1),
  financialProjection: z
    .array(
      z.object({
        month: z.number(),
        revenue: z.number(),
        costs: z.number(),
        customers: z.number(),
      }),
    )
    .min(1),
});

// --- AgentArchitectAgent ---
export const AgentArchitectInputSchema = z.object({
  conceptId: z.string(),
  concept: ConceptSchema,
  businessModel: z.record(z.unknown()),
});

export const AgentArchitectOutputSchema = z.object({
  agentRoles: z
    .array(
      z.object({
        name: z.string(),
        responsibility: z.string(),
        inputSources: z.array(z.string()),
        outputTargets: z.array(z.string()),
        toolsNeeded: z.array(z.string()),
        estimatedCostPerMonth: z.number(),
      }),
    )
    .min(1),
  humanRoles: z
    .array(
      z.object({
        title: z.string(),
        responsibilities: z.array(z.string()),
        fte: z.number(),
        annualCost: z.number(),
      }),
    )
    .min(1),
  escalationProtocols: z
    .array(
      z.object({
        trigger: z.string(),
        escalateTo: z.enum(['human', 'senior_agent']),
        sla: z.string(),
      }),
    )
    .min(1),
  agentToHumanRatio: z.number(),
});

// --- GtmStrategistAgent ---
export const GtmStrategistInputSchema = z.object({
  conceptId: z.string(),
  concept: ConceptSchema,
  customerValidation: z.record(z.unknown()),
  unitEconomics: z.record(z.unknown()),
});

export const GtmStrategistOutputSchema = z.object({
  targetSegment: z.string(),
  icp: z.object({
    title: z.string(),
    companySize: z.string(),
    industry: z.string(),
    painLevel: z.number(),
  }),
  channels: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(['inbound', 'outbound', 'partnership']),
        estimatedCac: z.number(),
        timeToFirstRevenue: z.string(),
      }),
    )
    .min(1),
  launchTimeline: z
    .array(
      z.object({
        phase: z.enum(['pre-launch', 'launch', 'growth']),
        startDay: z.number(),
        endDay: z.number(),
        milestones: z.array(z.string()),
        kpis: z.array(z.string()),
      }),
    )
    .min(1),
  messagingFramework: z.object({
    headline: z.string(),
    valueProps: z.array(z.string()),
    objectionHandlers: z.array(z.string()),
  }),
});

// --- RiskAnalystAgent ---
export const RiskAnalystInputSchema = z.object({
  conceptId: z.string(),
  concept: ConceptSchema,
  feasibilityAssessment: z.record(z.unknown()),
  competitiveAnalysis: z.record(z.unknown()),
});

export const RiskAnalystOutputSchema = z.object({
  risks: z
    .array(
      z.object({
        id: z.string(),
        category: z.enum(['technical', 'market', 'regulatory', 'financial', 'operational', 'competitive']),
        title: z.string(),
        description: z.string(),
        severity: z.number().min(1).max(10),
        likelihood: z.number().min(1).max(10),
        riskScore: z.number(),
        mitigations: z.array(z.string()),
        owner: z.enum(['agent', 'human', 'both']),
      }),
    )
    .min(4),
});

// --- ResourcePlannerAgent ---
export const ResourcePlannerInputSchema = z.object({
  conceptId: z.string(),
  concept: ConceptSchema,
  agentArchitecture: z.record(z.unknown()),
  financialProjection: z.record(z.unknown()),
});

export const ResourcePlannerOutputSchema = z.object({
  upfrontBuildCost: z.number().positive(),
  hiringPlan: z
    .array(
      z.object({
        role: z.string(),
        headcount: z.number(),
        startMonth: z.number(),
        annualCostPerHead: z.number(),
        isAgent: z.boolean(),
      }),
    )
    .min(1),
  runwayMonths: z.number().min(1),
  techStack: z
    .array(
      z.object({
        category: z.string(),
        tools: z.array(z.string()),
      }),
    )
    .min(1),
  totalFundingNeeded: z.number(),
  burnRateMonthly: z.number(),
});

// --- BlueprintPackagerAgent ---
export const BlueprintPackagerInputSchema = z.object({
  conceptId: z.string(),
  blueprintId: z.string(),
});

export const BlueprintPackagerOutputSchema = z.object({
  executiveSummary: z.string().min(100),
  keyMetrics: z.object({
    tam: z.number(),
    cac: z.number(),
    ltv: z.number(),
    ltvCacRatio: z.number(),
    runwayMonths: z.number(),
    agentToHumanRatio: z.number(),
  }),
  investmentThesis: z.string(),
  topRisks: z.array(z.string()).min(3),
  readinessScore: z.number().min(0).max(100),
});
