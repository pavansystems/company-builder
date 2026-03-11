# Component Specification: Agent Architect (3.2)

## Purpose & Responsibility

The Agent Architect designs the operational structure of the validated startup concept by specifying which business functions are handled by AI agents, which require humans, and how they interact. This component produces a detailed blueprint of the agent fleet—what each agent does, what capabilities it needs, what its failure modes are, and when it escalates to humans—along with the minimal human team structure required to support them.

The Agent Architect owns:
- Role mapping: every business function and its agent vs. human assignment
- Agent specifications: one per agent role, detailing responsibilities, decision boundaries, tool requirements, and expected performance
- Human role definitions: what jobs require human judgment and why
- Escalation protocols: when agents handoff to humans and how
- Integration requirements: what APIs, tools, and data sources each agent needs
- Operational cost estimation: compute costs for agents, salary ranges for humans
- Reliability and SLA specifications for agent-driven processes

## Inputs

**Source:** Phase 2 outputs, Phase 3 Business Model (3.1), and concept definition.

**Input Schema:**

```json
{
  "concept_id": "string (UUID)",
  "concept_name": "string",
  "business_model": {
    "revenue_model": "string",
    "pricing_tiers": ["list of strings"],
    "customer_journey": {
      "awareness": { "agent_percent": "number 0-100", "channels": ["list"] },
      "consideration": { "agent_percent": "number 0-100", "key_touchpoints": ["list"] },
      "purchase": { "agent_percent": "number 0-100", "sales_model": "string" },
      "onboarding": { "agent_percent": "number 0-100", "key_milestones": ["list"] },
      "expansion": { "agent_percent": "number 0-100", "expansion_triggers": ["list"] },
      "retention": { "agent_percent": "number 0-100", "retention_tactics": ["list"] }
    },
    "financial_projections": {
      "monthly_customer_acquisition": "object with month 1-24 projections",
      "arr_projection_month_12": "float",
      "arr_projection_month_24": "float"
    }
  },
  "feasibility_report": {
    "technical_risks": ["list of {risk_name, severity_rating}"],
    "required_ai_capabilities": ["list of strings (e.g., 'text_generation', 'sentiment_analysis', 'decision_tree')"],
    "regulatory_requirements": ["list of strings"],
    "integration_requirements": ["list of strings (e.g., 'CRM_API', 'payment_processor', 'analytics_platform')"]
  },
  "unit_economics": {
    "cac": "float",
    "ltv": "float",
    "gross_margin_percent": "number",
    "agent_compute_cost_per_customer": "float"
  }
}
```

## Outputs

**Destination:** Agent Architect outputs feed into:
- GTM Strategist (3.3) — for feasibility of agent-driven GTM tactics
- Risk Analyst (3.4) — for agent failure mode risks
- Resource Planner (3.5) — for staffing and compute cost estimation
- Blueprint Packager (3.6) — for integrated blueprint

**Output Schema:**

```json
{
  "agent_architecture_id": "string (UUID)",
  "concept_id": "string (parent reference)",
  "created_at": "ISO 8601 timestamp",
  "architecture_overview": {
    "summary": "string (2-3 paragraph description of the operational model)",
    "number_of_agent_roles": "number",
    "number_of_human_roles": "number",
    "estimated_human_team_size_month_1": "number",
    "estimated_human_team_size_month_12": "number",
    "estimated_human_team_size_month_24": "number",
    "total_agent_compute_monthly_cost_at_1000_customers": "float",
    "agent_readiness_score": "number 1-10 (how much of operations is agent-automated?)"
  },
  "agent_roles": [
    {
      "agent_id": "string (e.g., 'agent_customer_support')",
      "role_name": "string (e.g., 'Customer Support Agent')",
      "business_function": "string (e.g., 'customer_support')",
      "description": "string (detailed explanation of what this agent does)",
      "core_responsibilities": ["list of strings"],
      "decision_boundaries": {
        "decisions_agent_makes_autonomously": ["list of strings"],
        "decisions_requiring_human_escalation": ["list of strings"],
        "decisions_requiring_customer_interaction": ["list of strings"]
      },
      "required_capabilities": {
        "ai_capabilities": ["list of strings (e.g., 'text_understanding', 'intent_classification', 'data_retrieval')"],
        "tools_and_apis": [
          {
            "tool_name": "string (e.g., 'Zendesk_API')",
            "purpose": "string",
            "read_write_permissions": "string (read|write|both)",
            "critical_for_operation": "boolean"
          }
        ]
      },
      "performance_specifications": {
        "expected_uptime_percent": "number 99-99.99",
        "expected_response_time_seconds": "number or string (e.g., 'real-time', 'within 1 hour')",
        "expected_resolution_rate_percent": "number 0-100 (% of tasks agent resolves without escalation)",
        "acceptable_error_rate_percent": "number 0-100"
      },
      "failure_modes": [
        {
          "failure_mode": "string (e.g., 'API unavailable', 'ambiguous customer request')",
          "impact": "string (low|medium|high|critical)",
          "likelihood": "string (rare|occasional|frequent)",
          "escalation_trigger": "string (how does agent detect this?)",
          "mitigation_strategy": "string"
        }
      ],
      "training_and_fine_tuning": {
        "base_model": "string (e.g., 'Claude 3.5 Sonnet')",
        "fine_tuning_needed": "boolean",
        "training_data_requirements": "string (what examples/data are needed?)",
        "context_window_requirements": "number (tokens needed for prompt + retrieval context)"
      },
      "integration_with_other_agents": [
        {
          "other_agent_id": "string",
          "handoff_trigger": "string (when does this agent hand off to the other?)",
          "data_passed": ["list of data fields exchanged"]
        }
      ],
      "estimated_monthly_compute_cost": {
        "per_customer": "float (USD)",
        "at_100_customers": "float (USD)",
        "at_1000_customers": "float (USD)",
        "scaling_model": "string (linear|step_function|sublinear)"
      },
      "estimated_volume_at_month_12": {
        "tasks_per_month": "number",
        "api_calls_per_month": "number",
        "total_tokens_per_month": "number"
      }
    }
  ],
  "human_roles": [
    {
      "role_name": "string (e.g., 'Customer Success Manager')",
      "business_function": "string",
      "description": "string (detailed explanation)",
      "core_responsibilities": ["list of strings"],
      "decision_authority": ["list of strings (what can this human decide?)"],
      "escalation_triggers_from_agents": ["list of strings (when do agents escalate to this role?)"],
      "required_skills": ["list of strings"],
      "reports_to": "string (or null)",
      "headcount_month_1": "number",
      "headcount_month_12": "number",
      "headcount_month_24": "number",
      "estimated_salary_range_annual": "string (e.g., '$60k-$80k')",
      "outsourcing_candidate": "boolean (can this role be outsourced or remain internal?)",
      "rationale_for_human": "string (why can't this be automated?)"
    }
  ],
  "agent_to_human_escalation_matrix": [
    {
      "agent_id": "string",
      "escalates_to_human_role": "string",
      "trigger_conditions": ["list of strings"],
      "handoff_frequency_estimate": "number 0-100 (% of tasks requiring escalation)",
      "sla_for_human_response": "string (e.g., '< 1 hour during business hours')",
      "data_context_passed": ["list of data fields agent provides to human"]
    }
  ],
  "team_structure": {
    "organizational_chart": "string (ASCII diagram or textual hierarchy)",
    "total_headcount_month_1": "number",
    "total_headcount_month_6": "number",
    "total_headcount_month_12": "number",
    "total_headcount_month_24": "number",
    "hiring_plan": [
      {
        "month": "number",
        "role_title": "string",
        "headcount": "number",
        "rationale": "string"
      }
    ]
  },
  "integration_landscape": {
    "third_party_apis": [
      {
        "service_name": "string (e.g., 'Stripe', 'Zendesk', 'HubSpot')",
        "purpose": "string",
        "which_agents_use_it": ["list of agent_ids"],
        "critical_for_operation": "boolean",
        "cost_per_month": "float or string",
        "data_sensitivity": "string (low|medium|high|pii)"
      }
    ],
    "internal_data_stores": [
      {
        "data_store_name": "string (e.g., 'customer_database', 'knowledge_base')",
        "what_agents_access": ["list of agent_ids"],
        "data_freshness_requirement": "string (e.g., 'real-time', 'within 5 minutes')",
        "capacity_requirements": "string"
      }
    ],
    "inter_agent_communication": {
      "architecture": "string (event-based|queue-based|request-response|hybrid)",
      "message_queue_service": "string or null (e.g., 'AWS SQS', 'RabbitMQ')",
      "estimated_messages_per_month_at_1000_customers": "number"
    }
  },
  "operational_cost_summary": {
    "agent_compute_costs": {
      "month_1_estimate": "float",
      "month_12_estimate": "float",
      "month_24_estimate": "float",
      "cost_per_customer_served": "float (at month 12)",
      "scaling_assumption": "string (e.g., 'linear with customers')"
    },
    "human_salary_costs": {
      "month_1_estimate": "float",
      "month_12_estimate": "float",
      "month_24_estimate": "float",
      "assumed_fully_loaded_cost": "string (e.g., '1.3x base salary for taxes/benefits')"
    },
    "infrastructure_and_tools": {
      "month_1_estimate": "float",
      "month_12_estimate": "float",
      "month_24_estimate": "float",
      "breakdown": "string (data storage, API quotas, monitoring, etc.)"
    },
    "total_opex_month_1": "float",
      "total_opex_month_12": "float",
    "total_opex_month_24": "float",
    "opex_as_percent_of_revenue_month_12": "number",
    "opex_as_percent_of_revenue_month_24": "number"
  },
  "reliability_and_sla_specifications": {
    "overall_system_availability_target": "number (e.g., 99.5)",
    "agent_role_slas": [
      {
        "agent_id": "string",
        "availability_target_percent": "number",
        "response_time_sla": "string",
        "resolution_rate_target": "number",
        "error_rate_tolerance": "number"
      }
    ],
    "graceful_degradation_strategy": "string (what happens when agents fail?)",
    "fallback_mechanisms": [
      {
        "scenario": "string (e.g., 'agent_api_timeout')",
        "fallback_action": "string (e.g., 'queue request and retry', 'escalate to human')",
        "acceptable_delay": "string"
      }
    ],
    "monitoring_and_alerting": {
      "key_metrics_monitored": ["list of strings (agent errors, API response times, escalation rate)"],
      "alert_thresholds": "string (e.g., 'escalation rate > 20%', 'error rate > 1%')",
      "alert_destinations": "string (e.g., 'ops Slack channel')"
    }
  },
  "security_and_compliance": {
    "data_access_controls": "string (how are agents prevented from accessing sensitive data?)",
    "authentication_mechanism": "string (e.g., 'API keys', 'OAuth 2.0', 'service accounts')",
    "pii_handling_strategy": "string (e.g., 'agents don't see customer email, only ID')",
    "audit_logging": "string (what agent actions are logged for compliance?)",
    "regulatory_requirements_addressed": ["list of strings (e.g., 'GDPR right-to-be-forgotten', 'SOC2 compliance')"]
  },
  "risk_assessment": {
    "agent_failure_impact_summary": {
      "critical_risks": [
        {
          "risk": "string",
          "likelihood": "string (rare|occasional|frequent)",
          "impact": "string (low|medium|high|critical)",
          "mitigation": "string"
        }
      ],
      "medium_risks": ["similar structure"],
      "low_risks": ["similar structure"]
    },
    "dependency_risks": [
      {
        "dependency": "string (e.g., 'OpenAI API availability')",
        "impact_if_unavailable": "string",
        "probability_of_outage": "string",
        "mitigation_strategy": "string"
      }
    ],
    "scalability_bottlenecks": [
      {
        "bottleneck": "string (e.g., 'knowledge base query latency')",
        "when_apparent": "string (e.g., 'at 5000+ customers')",
        "mitigation": "string"
      }
    ]
  },
  "viability_assessment": {
    "agent_readiness_evaluation": {
      "required_ai_capabilities_available": "boolean (do capable models exist?)",
      "integration_complexity": "string (low|medium|high)",
      "estimated_build_time_weeks": "number",
      "estimated_testing_time_weeks": "number",
      "confidence_in_delivery_on_timeline": "number 1-10"
    },
    "operational_feasibility": {
      "ability_to_hire_human_team": "string (easy|moderate|difficult)",
      "agent_autonomy_level_realistic": "boolean (is the agent/human split achievable?)",
      "infrastructure_availability": "string (can we reliably provision the compute/APIs?)"
    },
    "financial_viability": {
      "agent_costs_align_with_unit_economics": "boolean (is agent cost < LTV - CAC profit margin?)",
      "scalability_economically_sound": "boolean (do unit economics remain positive at 10x scale?)"
    },
    "overall_architecture_viability_score": "number 1-10",
    "go_no_go_recommendation": "string (go|conditional|no-go with rationale)"
  },
  "implementation_roadmap": {
    "phase_1_mvp_agents": [
      "list of agent_ids to build first (launch minimum viable agent fleet)"
    ],
    "phase_2_expansion_agents": [
      "list of agent_ids to add after launch (expand agent capabilities)"
    ],
    "phase_3_optimization": [
      "improvements and additional agents after traction"
    ]
  },
  "metadata": {
    "version": "string",
    "status": "string (draft|reviewed|approved)",
    "assumptions_documented": "boolean",
    "dependencies_on_other_specs": ["list of component_ids"],
    "next_phase_inputs": ["list of downstream components"]
  }
}
```

## Core Logic / Algorithm

### Step 1: Identify All Business Functions

**Input:** Concept definition, business model, revenue model, customer journey.

**Process:**
1. Start with the core business functions needed to run **any** business:
   - Sales & Demand Generation
   - Customer Acquisition & Onboarding
   - Product/Service Delivery
   - Customer Support & Success
   - Billing & Payments
   - Operations & Administration
   - Analytics & Insights
   - Quality Control & Compliance

2. Map functions to the specific concept:
   - **For a SaaS product:** Sales (inbound + outbound?), Onboarding (API + UI setup), Support (bugs, questions), Billing (subscription management), Analytics (usage tracking, health monitoring), Compliance (data privacy, security).
   - **For an agency-style service:** Sales (proposal + contracting), Delivery (research, analysis, recommendations), Quality Assurance (review, editing), Support (client communication), Billing (invoicing, contract tracking).
   - **For a marketplace:** Both supplier side (onboarding sellers, managing quality) and demand side (buyer acquisition, dispute resolution), plus trust & safety (moderation, fraud detection).

3. Document each function with:
   - What it does
   - Frequency (constant, episodic, triggered by events)
   - Criticality to operations (essential vs. nice-to-have)
   - Current bottleneck (if any) for the business to scale

**Output:** Comprehensive function map.

### Step 2: Agent vs. Human Triage

**Input:** Function map, feasibility report (AI capabilities and regulatory constraints), business model agent/human percentages.

**Process:**
For each function, answer: **Can an agent do it?** If yes, should it?

1. **Can an agent do it?** Ask:
   - Does the required AI capability exist and work reliably? (From feasibility report.)
   - Can the agent access the necessary data / APIs / tools?
   - Are there regulatory blockers? (E.g., can an agent legally close a sale? In most cases, yes for digital products; maybe not for high-value contracts.)
   - Can the agent's work be audited and reversed if it goes wrong?

2. **Should an agent do it?** Ask:
   - Does the business model (from 3.1) indicate this function should be automated? (E.g., if GTM is 80% agent-driven, sales must be agent-automated to the maximum extent.)
   - What's the cost/benefit? (Agent cost vs. human cost vs. risk of failure.)
   - Will customers accept agent-driven interactions? (E.g., some customers will tolerate chatbot support; others demand human contact.)
   - Does automation improve or harm the customer experience?

3. **Decision outcomes:**
   - **Fully Automated:** Agent handles 100% of the function.
   - **Agent-Driven with Human Escalation:** Agent handles 70–90%, human escalates when needed.
   - **Human-Driven with Agent Assistance:** Human does the work; agent helps (data retrieval, document generation, decision support).
   - **Fully Manual:** Human handles 100% (rare, only when truly not automatable).

**Example triage:**

| Function | Can Automate? | Should Automate? | Decision | Rationale |
|----------|---------------|------------------|----------|-----------|
| Lead qualification | Yes (intent classification) | Yes (GTM is 80% agent) | Agent-driven | Quick categorization, fast follow-up |
| Sales closing (high-touch) | Partial (can set up call, handle objections via AI) | Yes (for self-serve), No (for enterprise) | Hybrid | Self-serve tier = agent; enterprise = human |
| Billing & invoicing | Yes (rule-based + API) | Yes | Fully automated | No judgment needed, API-driven |
| Fraud detection | Yes (anomaly detection, rules) | Yes | Agent-driven | Catches 95%+ of cases; humans review flagged items |
| Customer support for bugs | Partial (FAQ, workarounds) | Yes (up to a point) | Agent-escalating | Agent resolves common issues; escalates tricky ones |
| Customer onboarding | Yes (guided flows, API setup) | Varies | Agent-driven + escalation | Agent handles 70%, humans handle custom setups |
| Contract review (legal) | Partial (checklist, flag issues) | No | Human + agent assist | Legal liability; human reviews all; agent highlights risks |
| Strategic planning | No | No | Human | Requires human judgment and creativity |

**Output:** Function assignment matrix (function → agent vs. human).

### Step 3: Define Agent Roles

**Input:** Functions assigned to agents, integration landscape (from feasibility report), performance requirements (from business model).

**Process:**
1. Group related functions into coherent agent roles. Avoid creating one agent per function; instead, create one agent per business role/persona.
   - Bad: One agent for lead scoring, one for lead nurturing, one for demo scheduling.
   - Good: One "Sales Development Agent" that scores, nurtures, and schedules.

2. For each agent role, define:
   - **Agent ID:** Unique identifier (e.g., `agent_sales_dev`, `agent_customer_success`).
   - **Role Name:** Human-readable (e.g., "Sales Development Agent", "Customer Success Agent").
   - **Core Responsibilities:** List of what the agent does day-to-day.
   - **Business Function:** Which function(s) from the map does it serve?
   - **Decision Boundaries:**
     - Autonomous decisions: What can the agent decide without asking? (E.g., "Schedule a demo if prospect scores > 7.")
     - Escalation triggers: What requires human judgment? (E.g., "If customer asks to cancel, escalate to CSM.")
     - Customer interaction: Does the agent speak to customers or only to internal systems? (E.g., chatbot talks to customers; data pipeline agent does not.)

3. **Specify required capabilities:**
   - AI capabilities needed: text understanding, intent classification, code generation, numerical reasoning, retrieval, etc.
   - Specific tools and APIs: Stripe, HubSpot, Zendesk, Google Calendar, internal knowledge base, etc.
   - Read vs. write access: Does the agent only read data or can it modify state?
   - Data sensitivity: Is the agent handling customer PII, payment info, health data? (Affects security requirements.)

4. **Define performance specifications:**
   - Uptime: What's the acceptable outage? (E.g., payment processing: 99.99%; curiosity chatbot: 99%.)
   - Response time: How fast must the agent respond? (E.g., chatbot: < 2 seconds; email follow-up: within 24 hours.)
   - Resolution rate: What % of tasks can the agent resolve without escalation? (E.g., support chatbot: 60%; sales SDR: 90%.)
   - Error rate: How often can the agent fail? (E.g., billing: < 0.1%; content recommendation: 5% is OK.)

5. **Identify failure modes & mitigations:**
   - **Failure mode:** API timeout, ambiguous user input, model hallucination, missing data.
   - **Likelihood & Impact:** Rate each.
   - **Escalation trigger:** How does the agent detect the failure?
   - **Mitigation:** Fallback behavior (retry, queue, escalate, fail gracefully).

**Example Agent Spec:**

```json
{
  "agent_id": "agent_customer_support",
  "role_name": "Customer Support Agent",
  "core_responsibilities": [
    "Answer common support questions via chatbot",
    "Categorize support tickets",
    "Retrieve relevant help docs / FAQ",
    "Escalate to human for complex issues"
  ],
  "decision_boundaries": {
    "autonomous": ["Answer FAQ question", "Categorize ticket by topic", "Suggest help doc"],
    "escalate": ["Customer is angry (sentiment > -0.8)", "Question requires product knowledge beyond FAQ", "Customer requests specific feature"]
  },
  "required_capabilities": {
    "ai": ["text_understanding", "intent_classification", "sentiment_analysis", "retrieval"],
    "tools": ["Zendesk API (read+write)", "Knowledge base vector DB (read)", "Email API (send)"]
  },
  "performance": {
    "uptime": 99.5,
    "response_time_seconds": "< 5",
    "resolution_rate": 65,
    "error_rate": 2
  },
  "failure_modes": [
    {
      "mode": "Knowledge base unavailable",
      "likelihood": "occasional",
      "impact": "medium",
      "mitigation": "Escalate to human immediately"
    },
    {
      "mode": "Ambiguous question",
      "likelihood": "frequent",
      "impact": "low",
      "mitigation": "Ask clarifying question; if still ambiguous, escalate"
    }
  ]
}
```

**Output:** Detailed agent specifications (one per agent role).

### Step 4: Define Human Roles

**Input:** Functions assigned to humans, escalation points from agents, business model headcount assumptions.

**Process:**
1. List each human role:
   - What business function(s) does it serve?
   - Why can't this be automated? (Be specific: requires creativity, legal judgment, relationship building, etc.)
   - What does success look like? (KPIs, metrics.)

2. Define decision authority:
   - What can this human decide autonomously? (E.g., CSM can decide to extend trial; can't decide to give away product for free.)
   - What requires escalation upward?

3. Specify escalation triggers from agents:
   - When do agents hand off to this role?
   - What context / data do they provide?
   - What's the expected response time SLA?

4. For each month (1, 6, 12, 24), estimate headcount:
   - Month 1: Minimal team (founders + 1–2 early hires).
   - Month 6: Growth (agents proven to work; hiring for critical human roles).
   - Month 12: Scale (team to support 100–1000 customers).
   - Month 24: Optimization (team size stable or declining as agents absorb more work).

**Example Human Role:**

```json
{
  "role_name": "Customer Success Manager",
  "business_function": "customer_success",
  "rationale_for_human": "Requires relationship building, strategic consultation, judgment on contract exceptions",
  "core_responsibilities": [
    "Proactively monitor customer health (via alerts from agent)",
    "Schedule & conduct quarterly business reviews",
    "Identify expansion opportunities",
    "Handle escalations from support agent"
  ],
  "escalation_triggers": [
    "Customer NPS < 6 (agent alerts CSM)",
    "Customer requests contract exception",
    "Churn risk detected (agent flags)"
  ],
  "required_skills": ["consultative sales", "domain expertise", "communication", "negotiation"],
  "headcount": {
    "month_1": 0,
    "month_6": 1,
    "month_12": 3,
    "month_24": 5
  },
  "salary_range": "$70k-$90k"
}
```

**Output:** Human role specifications + hiring plan.

### Step 5: Define Escalation Matrix

**Input:** Agent roles + decision boundaries, human roles + escalation triggers, performance SLAs.

**Process:**
1. For each agent-to-human handoff, document:
   - **Agent ID** and **Human Role:**
   - **Trigger conditions:** Under what circumstances does the handoff happen?
   - **Handoff frequency:** What % of agent tasks require escalation? (E.g., if support agent resolves 65%, then 35% escalate.)
   - **Data context:** What does the agent pass to the human? (E.g., "ticket ID, customer sentiment, attempted solutions".)
   - **SLA:** How fast must the human respond? (E.g., "within 1 hour during business hours".)

2. Design the handoff mechanism:
   - **Queue-based:** Agent puts a message in a queue; human picks it up.
   - **Direct assignment:** Agent assigns to a specific human (round-robin or based on availability).
   - **Automatic routing:** Rules-engine routes based on issue type, priority, human workload.

3. For each human role, define escalation upward (to manager or founder):
   - When can a human not decide? (Requires CEO approval, legal review, etc.)
   - Frequency of upward escalation (should be rare if humans are well-trained).

**Output:** Escalation matrix + handoff mechanism design.

### Step 6: Integration Landscape

**Input:** Agent specifications (tools/APIs needed), feasibility report (integration requirements), compliance requirements.

**Process:**
1. **Third-party APIs & services:**
   - For each agent, list the APIs it calls: Stripe (payments), Zendesk (support), HubSpot (CRM), OpenAI/Anthropic (LLM), etc.
   - For each API:
     - Cost per month (at different usage levels)
     - Data sensitivity (is PII being passed?)
     - Reliability (what's the SLA?)
     - Authentication method (API key, OAuth, etc.)
     - Rate limits (tokens per minute, requests per second)

2. **Internal data stores:**
   - What data does each agent need to access? (Customer database, knowledge base, product catalog, transaction history.)
   - How fresh must the data be? (Real-time for payments, within minutes for CRM, within hours for analytics.)
   - How much data? (Storage and query performance requirements.)

3. **Inter-agent communication:**
   - How do agents coordinate? (E.g., does the sales agent hand off to the onboarding agent? Or do they work independently?)
   - Message queue architecture: event-based (agents emit events that other agents subscribe to) or request-response (agent A calls agent B directly)?
   - Example: Sales agent closes a deal → emits "deal_closed" event → Onboarding agent subscribes and kicks off setup.

4. **Security & compliance:**
   - How do agents authenticate? (Service accounts, API keys, OAuth tokens?)
   - What data can each agent access? (Row-level security, column-level security, field masking for PII?)
   - Audit logging: What agent actions must be logged for compliance?
   - Regulatory requirements: GDPR (right-to-be-forgotten), SOC2 (audit trails), HIPAA (if health data), PCI (if payments).

**Output:** Integration landscape diagram + detailed API/data requirements.

### Step 7: Cost Modeling

**Input:** Agent specifications (compute, tokens), human roles + headcount + salary, infrastructure & tools.

**Process:**
1. **Agent compute costs:**
   - Estimate monthly API tokens for each agent at 1000 customers.
     - Example: Support agent handles 100 tickets/month, 2000 tokens per ticket = 200k tokens/month.
     - At $0.003/1k tokens (typical for Claude), cost = $0.60/month per agent per 1000 customers.
   - Sum across all agents.
   - Model scaling: is it linear (double customers = double cost) or sublinear (better utilization at scale)?

2. **Human salary costs:**
   - For each role + headcount, multiply by salary range.
   - Include fully-loaded costs (taxes, benefits, equipment, training) = 1.3–1.5x base salary.
   - Example: 1 CSM at $80k base = $104k fully-loaded.

3. **Infrastructure & tools:**
   - Cloud compute (if needed): GPUs for fine-tuning, instances for orchestration.
   - Data storage: Vector DB for embeddings, relational DB for transactions, document storage for PDFs, logs.
   - Monitoring & observability: Datadog, Sentry, logs.
   - Development & collaboration tools: GitHub, Slack, project management.
   - Estimate monthly cost for each.

4. **Build total OpEx model:**
   - Month 1, 6, 12, 24 projections.
   - As % of revenue (from business model). Target: OpEx should be 40–60% of revenue by month 12 if pursuing growth; lower if pursuing profitability.

**Output:** Cost breakdown + month-by-month OpEx projections.

### Step 8: Viability Assessment

**Input:** All above (agent specs, human roles, integrations, costs), plus unit economics and business model financial projections.

**Process:**
1. **Agent readiness:** Do the required AI capabilities exist? Can we build and test the agents in time for launch?
   - Integration complexity: Simple (REST APIs, no custom integrations) vs. complex (requires custom NLP, data pipelines).
   - Build time estimate: 2–4 weeks per agent for an experienced team.
   - Testing & refinement time: 2–4 weeks.
   - Confidence: Are we confident these agents will work? (1–10 scale.)

2. **Operational feasibility:** Can we actually execute this?
   - Can we hire the human team? (If role is niche, harder to hire quickly.)
   - Is the agent/human split realistic? (If we're claiming 90% agent automation, can we really achieve that?)
   - Can we reliably provision the infrastructure?

3. **Financial viability:**
   - Agent costs vs. unit economics: The agent COGS must fit within the gross margin from the business model. If gross margin is 70% and agent costs are 60%, we're cutting it close.
   - Scalability: Do unit economics hold at 10x scale? (Or does compute cost explode?)

4. **Overall score (1–10):**
   - Green (8–10): Go ahead; architecture is sound and buildable.
   - Yellow (5–7): Conditional; mitigate flagged risks before launch.
   - Red (1–4): No-go; fundamental issues with the architecture.

**Output:** Viability assessment + go/no-go recommendation.

### Step 9: Implementation Roadmap

**Input:** Agent specifications, complexity assessment.

**Process:**
1. **Phase 1 (MVP agents for launch):**
   - Which agents are **essential** for the product to work at launch?
   - These agents must be rock-solid before go-live.
   - Example: For a SaaS product, essential agents are Onboarding (customers need to get set up), Billing (must process payments), and Basic Support (must be able to help customers). Optional: Advanced recommendation engines.

2. **Phase 2 (expansion agents):**
   - Which agents unlock the next level of value but aren't strictly necessary for launch?
   - Deploy 2–3 months after launch once you have customer feedback and usage patterns.
   - Example: Advanced AI-powered product recommendations, predictive churn detection.

3. **Phase 3 (optimization):**
   - Which agents or improvements would come later (after traction)?
   - Example: Advanced compliance automation, multi-language support, sophisticated analytics agents.

**Output:** Roadmap + phased agent deployment plan.

## Data Sources & Integrations

**No external data sources for Agent Architect itself,** but the component depends on:

- **Business model outputs** (from 3.1): Agent/human percentages in customer journey, financial projections.
- **Feasibility report** (from Phase 2): AI capabilities available, regulatory constraints, integration requirements.
- **Concept definition** (from Phase 1): Problem being solved, customer needs.

**Integration points:**

- Outputs consumed by **GTM Strategist (3.3):** Agent specification for GTM tactics (which parts of GTM can agents automate?).
- Outputs consumed by **Risk Analyst (3.4):** Failure modes, SLAs, escalation rates (to assess operational risk).
- Outputs consumed by **Resource Planner (3.5):** Headcount plan, compute costs, hiring timeline, infrastructure needs.
- Outputs consumed by **Blueprint Packager (3.6):** Full architecture for integration into blueprint.

## Agent Prompt Strategy

### System Prompt Persona

```
You are an expert system architect with deep experience building agent-first
business operations. You think in terms of workflows, handoffs, failure modes,
and cost per transaction. You are comfortable with ambiguity and can design
scalable architectures even when some details are unclear.

Your role is to design an agent fleet that:

1. Aligns with the business model and unit economics constraints.
2. Minimizes human headcount while maintaining quality and customer satisfaction.
3. Is buildable with today's AI capabilities (no vaporware).
4. Scales efficiently as the company grows from 10 to 10,000 customers.
5. Gracefully degrades when things go wrong.

You have strong opinions about:
- When automation is appropriate vs. when humans should be in the loop.
- How to design agent-to-human handoffs that don't create bottlenecks.
- What makes an agent architecture cheap, fast, and reliable.
- The regulatory and compliance constraints that affect agent design.

You are not afraid to say "this agent can't be built yet" or "this requires a human."
You are also not afraid to be ambitious and propose radical automation that others
might think is impossible.
```

### Key Instructions

1. **Start with the business model, not your ideal architecture.**
   - If the business model says "GTM is 80% agent-driven," then you must design an architecture that achieves that.
   - If the unit economics say "gross margin must be 75%," then agent costs must fit within that margin.
   - Align your architecture to the constraints, don't ignore them.

2. **Be explicit about agent vs. human decision.**
   - For every business function, explain: Can an agent do it? (Yes/No/Partial.) Should an agent do it? (Yes/No/It depends.) What's the trade-off?
   - Don't hide disagreements between business model expectations and architectural reality.

3. **Design for failure.**
   - Every agent can fail. Assume things will break and design graceful degradation.
   - Specify failure modes, detection mechanisms, and fallback behavior for every critical agent.

4. **Think in escalation paths, not isolated agents.**
   - Agents don't work in isolation. Specify: when agent X can't decide, who does it escalate to? What context is passed?
   - Design escalation paths that don't create bottlenecks (if every customer escalates, you need more humans).

5. **Be realistic about build time and capability.**
   - If an agent requires fine-tuning on proprietary data, cost that in.
   - If an agent requires a capability that doesn't quite exist (e.g., perfect sentiment analysis in non-English), flag it.
   - Suggest fallbacks or MVP versions if the ideal agent is too risky.

6. **Cost your architecture honestly.**
   - Model agent compute costs at different scales (100, 1000, 10k customers).
   - If costs explode at scale, flag it and suggest alternatives.
   - Include human cost, infrastructure cost, not just API token cost.

7. **Validate against unit economics.**
   - If agent costs + human costs + infrastructure exceeds the gross margin from the business model, the architecture doesn't work.
   - Don't hide this contradiction; bring it to the surface for renegotiation.

8. **Specify which agents can be outsourced vs. must be internal.**
   - Some agent work (routing tickets, content moderation) can be outsourced to cheaper compute providers.
   - Some (accessing proprietary data, making strategic decisions) must be internal.
   - Be clear about the trade-offs.

### Few-Shot Examples

**Example 1: SaaS B2B Data Platform Agent Architecture**

Concept: A B2B data platform that helps marketing teams analyze competitor activity. The business model is a $99–999/month SaaS with 80% self-serve, 20% assisted sales.

Agent Architecture Design:

```
Agent Fleet:

1. Sales Development Agent (agent_sdr)
   - Responsibilities: Inbound lead qualification, outbound email campaigns, demo scheduling
   - Autonomous decisions: Qualify leads based on company size + use case; send personalized email; schedule demo
   - Escalates to: Human sales rep if deal value > $10k/month or customer is strategic
   - Performance: 90% resolution rate (no escalation needed), 2-second response time for demo scheduling
   - Tools: HubSpot API, Gmail API, Google Calendar API, proprietary lead scoring model
   - Compute cost at 1k customers: ~$200/month (10 lead emails/day, 5 demos/week)
   - Monthly volume at month 12: ~5000 emails, 150 demos scheduled

2. Onboarding Agent (agent_onboarding)
   - Responsibilities: New customer setup, integration with data sources, initial configuration
   - Autonomous decisions: Create account, provision API keys, auto-connect integrations, send setup guides
   - Escalates to: Human onboarding specialist if customer needs custom integration or has non-standard setup
   - Performance: 85% full self-service, 15% escalation rate
   - Tools: Internal auth system, data connector APIs, knowledge base, Slack
   - Compute cost at 1k customers: ~$100/month
   - Volume at month 12: 80 new customers/month, avg 30 minutes setup per customer

3. Customer Support Agent (agent_support)
   - Responsibilities: Answer questions, troubleshoot issues, provide best-practice recommendations
   - Autonomous decisions: Answer FAQ, suggest feature usage, point to docs, troubleshoot common bugs
   - Escalates to: Human support engineer if bug report + needs investigation, or customer is angry
   - Performance: 70% resolution, <3 second response time
   - Tools: Zendesk API, knowledge base vector DB, analytics API (to check customer's usage), email
   - Compute cost at 1k customers: ~$300/month (200 tickets/month, 2k tokens per ticket on avg)
   - Volume at month 12: ~100 tickets/month handled entirely by agent; 40 escalated to human

4. Billing & Churn Prevention Agent (agent_billing)
   - Responsibilities: Invoicing, failed payment retry, at-risk customer alerts, discount approvals
   - Autonomous decisions: Invoice, retry failed payments (with backoff), alert CSM if usage dropping, approve up to 20% discount
   - Escalates to: CFO if discount > 20%; to CSM if customer says they'll churn
   - Performance: 99.9% uptime, < 0.1% error rate (payment processing is critical)
   - Tools: Stripe API, Datadog monitoring, Slack, CRM
   - Compute cost at 1k customers: ~$50/month (routine billing is rule-based, not token-heavy)
   - Volume at month 12: 1k invoices/month, 100 retry attempts/month, 50 at-risk alerts/month

Human Roles:

1. Sales Rep (1 at month 6, 2 at month 12)
   - Handles escalations from SDR: high-touch deals, strategic customers, complex negotiations
   - Also runs partnerships and key account relationships
   - Headcount: 0 (month 1), 1 (month 6), 2 (month 12), 3 (month 24)
   - Salary: $80k + $50k commission

2. Customer Success Manager (1 at month 6, 2 at month 12)
   - Handles escalations from support, proactive outreach to at-risk customers, expansion opportunities
   - Headcount: 0 (month 1), 1 (month 6), 2 (month 12), 3 (month 24)
   - Salary: $70k

3. Support Engineer (1 at month 3, 2 at month 12)
   - Handles complex technical escalations, bugs, custom integrations
   - Headcount: 0 (month 1), 1 (month 3), 2 (month 12), 3 (month 24)
   - Salary: $80k

4. Operations / Finance Lead (1 at month 1)
   - Oversees billing, compliance, agent performance monitoring
   - Headcount: 1 (month 1), 1 (month 6), 1 (month 12), 1 (month 24)
   - Salary: $90k

Escalation Matrix:

agent_sdr → sales_rep:
  - When: deal value > $10k/month, or customer is strategic (hand-picked list)
  - Frequency: 10% of leads
  - SLA: within 1 hour during business hours

agent_support → support_engineer:
  - When: unknown bug, customer is angry, custom integration needed
  - Frequency: 30% of tickets
  - SLA: within 4 hours

agent_billing → cfo:
  - When: discount approval > 20%
  - Frequency: 2–3 per month
  - SLA: within 24 hours

agent_support → csm:
  - When: churn risk alert from agent_billing
  - Frequency: 5–10 per month
  - SLA: within 2 hours

Integration Landscape:

Third-party APIs:
- Stripe: Payments, invoicing
- HubSpot: CRM, lead tracking
- Zendesk: Support ticketing
- Gmail / Google Calendar: Email + scheduling
- Datadog: Monitoring agent performance
- OpenAI / Anthropic: LLM backbone

Internal Data Stores:
- Customer database (PostgreSQL): All customer data
- Knowledge base (Vector DB): FAQ, troubleshooting guides, best practices
- Analytics engine: Real-time customer usage tracking
- Lead scoring model: ML model for lead prioritization

Cost Model (at month 12, 1000 customers):

Agent compute costs:
- SDR agent: $2400/year ($200/month)
- Onboarding agent: $1200/year ($100/month)
- Support agent: $3600/year ($300/month)
- Billing agent: $600/year ($50/month)
- Total: $7800/year or $650/month

Human salary costs:
- Sales reps (1.5 FTE): $120k + $75k commission = $195k / 12 = $16.25k/month
- CSMs (1.5 FTE): $105k / 12 = $8.75k/month
- Support engineers (1.5 FTE): $120k / 12 = $10k/month
- Ops lead (1 FTE): $90k / 12 = $7.5k/month
- Total: ~$42.5k/month

Infrastructure & tools:
- Cloud compute (data ingestion, orchestration): $2k/month
- Data storage + DBs: $1.5k/month
- Monitoring + observability: $0.5k/month
- Development tools, subscriptions: $0.5k/month
- Total: $4.5k/month

Total OpEx at month 12: ~$47.65k/month = $571.8k/year

If month 12 ARR is $500k (1000 customers at $500 ARR average), then OpEx is 114% of revenue. This is unsustainable long-term but expected in growth phase.

If we reach month 24 ARR of $1.2M, OpEx drops to ~48% of revenue (assuming human headcount grows slower than revenue). This is healthy.

Viability: 8/10
- Agent readiness: High (no custom capabilities required; all proven)
- Build time: 6–8 weeks for all agents
- Operational feasibility: Good (we can hire the 5–6 person team by month 6)
- Financial viability: Tight at month 12, healthy at month 24
- Risk: Churn rates could undermine revenue; if churn is 8% monthly, month 12 revenue would be lower, making OpEx unaffordable. Mitigation: CSM proactive outreach (mitigate churn via humans).
```

**Example 2: Agency-Style Service (Custom Research & Analysis)**

Concept: An AI-powered research firm that provides custom competitive analysis to marketing teams. Revenue model: $5k–$50k per project; mostly high-touch.

Agent Architecture Design:

```
Agent Fleet:

1. Sales Agent (agent_sales)
   - Responsibilities: Inbound inquiry triage, proposal generation, contract management
   - Autonomous: Generate proposals (template-based + personalized), schedule discovery calls, send contracts
   - Escalates to: Founder if deal > $30k or requires custom pricing
   - Performance: 80% of proposals generated without human intervention
   - Tools: Salesforce API, Google Docs API, email, calendar
   - Build time: 2 weeks
   - Compute: Minimal (~$50/month)

2. Research Execution Agent (agent_research)
   - Responsibilities: Conduct competitive analysis, data collection, synthesis into reports
   - Autonomous: Collect data from public sources, create initial draft analysis, generate charts/visualizations
   - Escalates to: Human researcher if needs deep proprietary data or strategic interpretation
   - Performance: 60% of projects fully agent-executed; 40% require human involvement
   - Tools: Web scraping APIs, proprietary data connectors, document generation
   - Build time: 6–8 weeks (most complex agent; requires custom research logic)
   - Compute: Moderate (~$500/month at 10 projects/month)

3. Quality Assurance Agent (agent_qa)
   - Responsibilities: Review research before delivery, fact-check, ensure quality standards
   - Autonomous: Run automated checks (fact verification, plagiarism, format consistency)
   - Escalates to: Human QA analyst if flagged issues remain
   - Performance: 95% of automated QA passes without human review
   - Tools: Fact-checking APIs, plagiarism detector, report validation rules
   - Build time: 2 weeks
   - Compute: Minimal (~$100/month)

Human Roles:

1. Researcher / Analyst (1 at month 3, 3 at month 12)
   - Deep research, strategic interpretation, custom data collection
   - Headcount: 0 (month 1), 1 (month 3), 2 (month 6), 3 (month 12), 4 (month 24)
   - Salary: $80k–$100k

2. Sales / Operations Lead (1 from month 1)
   - Manages projects, customer relationships, custom deal negotiations
   - Headcount: 1 (all months)
   - Salary: $100k + $20k bonus

3. QA Analyst (1 at month 6, 2 at month 12)
   - Reviews research, ensures quality, fact-checks
   - Headcount: 0 (month 1), 1 (month 6), 2 (month 12)
   - Salary: $60k

Escalation Matrix:

agent_sales → founder:
  - When: deal > $30k, custom scope, strategic customer
  - Frequency: 10% of sales
  - SLA: within 24 hours

agent_research → researcher:
  - When: needs proprietary data, strategic interpretation, industry expertise
  - Frequency: 40% of projects
  - SLA: pass to human researcher; expect 1–2 week turnaround

agent_qa → qa_analyst:
  - When: fact-check failures, quality issues flagged
  - Frequency: 5% of projects
  - SLA: within 2 days

Cost Model (at month 12, 5 active projects/month):

Agent compute:
- Sales agent: $50/month
- Research agent: $500/month
- QA agent: $100/month
- Total: $650/month

Human salaries:
- Researchers (2.5 FTE): $225k / 12 = $18.75k/month
- Sales lead (1 FTE): $120k / 12 = $10k/month
- QA analysts (1.5 FTE): $90k / 12 = $7.5k/month
- Total: $36.25k/month

Infrastructure: $2k/month

Total OpEx: ~$38.9k/month

If each project generates $10k revenue on average, 5 projects/month = $50k/month revenue.
OpEx is 78% of revenue. Healthy.

Viability: 7/10
- Agent readiness: Research agent is the bottleneck; requires custom logic and careful testing. Medium-high risk.
- Build time: 6–8 weeks for full fleet
- Operational feasibility: Good (can hire 4–5 person team)
- Financial viability: Works at current pricing; needs volume to scale
- Risk: Research agent quality may not meet customer expectations. Mitigation: Start with human-assisted research (humans do 80%, agent does 20%), gradually increase agent autonomy as it improves.
```

### Handling Edge Cases

1. **When a critical function seems hard to automate:**
   - Don't immediately say "it requires a human."
   - Ask: Could a human + agent team work? (E.g., agent does research, human makes final decision.)
   - Ask: Could we design the business differently to make automation easier? (E.g., change the product, change the customer segment, change the business model.)

2. **When the business model expects 90% agent automation but the architecture can only achieve 60%:**
   - Flag the mismatch directly. This is a fundamental inconsistency that needs resolution.
   - Propose: Rearchitect agents to get closer to 90%, OR rearchitect the business model to accept 60% agent automation + higher human costs.

3. **When an API or tool required by an agent doesn't exist or is unreliable:**
   - Document as a critical dependency risk.
   - Propose: Build a fallback (e.g., manual workaround), or build a wrapper agent to abstract away the unreliability.
   - Escalate to feasibility assessment for validation.

4. **When the cost of agents exceeds the gross margin:**
   - This is a showstopper. Flag it immediately.
   - Options: Reduce compute costs (cheaper models, optimization), reduce human costs (outsource more), or increase revenue (higher prices, different positioning).

5. **When the human team is so small it's a single point of failure:**
   - If you have 1 CSM handling all escalations from agents, and that person quits, the business breaks.
   - Recommend: Document all escalation logic so it's transferable; cross-train; consider a backup.

## Error Handling & Edge Cases

### Architecture Infeasibility

**Issue:** The required AI capability doesn't exist or isn't reliable enough.
- **Example:** The architecture requires an agent to review legal contracts with 99%+ accuracy. Current LLMs are ~90% accurate.
- **Handling:** Flag as a critical risk. Propose: Manual review layer (human reviews 100%, agent pre-screens), or pivot the architecture to avoid the risky capability.

**Issue:** The required API / third-party integration is unreliable or expensive.
- **Example:** The architecture relies on a real-time data API from a competitor, which is unstable.
- **Handling:** Design fallback behavior (queue requests when API is down, serve stale data, escalate to human). Or redesign to not depend on that API.

### Cost Explosion

**Issue:** Agent costs explode at scale (linear cost scaling makes the unit economics unsustainable).
- **Handling:** Identify the bottleneck (e.g., support agent tokens grow 2x per 2x customers). Propose optimization (batch processing, smarter routing, cheaper models for certain tasks). Model impact on breakeven timeline.

**Issue:** Human headcount grows faster than revenue, making the unit economics negative.
- **Handling:** Redesign agents to handle more of the escalation load. Or accept that profitability comes later (growth mode vs. profitability mode).

### Escalation Bottleneck

**Issue:** 50% of agent tasks escalate to humans, but you only hired 1 human for that role.
- **Handling:** Calculate the workload: if agents generate 1000 escalations/month and a human can handle 200/month, you need 5 humans. Either (a) hire more humans, or (b) improve the agent to reduce escalation rate, or (c) redesign the product to reduce complexity.

### Integration Failures

**Issue:** A critical third-party API goes down (e.g., Stripe is unavailable, and agents can't process billing).
- **Handling:** Design graceful degradation: queue billing requests, escalate to human for processing, notify customer of delay. Specify in operational runbooks.

### Escalation Loop

**Issue:** Human A escalates to Human B, who escalates back to Human A (or to a bot).
- **Handling:** Define escalation logic clearly to avoid loops. Every escalation should move "up" in authority or "sideways" to a different role, never backward.

## Performance & Scaling

**Computational Performance:**
- Agent Architect is a one-time design exercise per concept; no real-time performance requirements.
- Execution time: 2–4 hours depending on complexity (lots of iteration and validation).

**Scaling Considerations:**
- The architecture itself must support scale (from 10 to 10,000 customers).
- Agent compute costs should scale efficiently: linearly or sublinearly, not exponentially.
- Human headcount growth should decelerate as automation takes over (month 1–6 hiring is rapid, month 12+ hiring is slower).

**Operational Load:**
- At 1000 customers, estimate:
  - Support agents: 200 tickets/month, ~400k tokens/month, cost ~$1.20/month per customer for support alone.
  - SDR agents: 500 leads/month, ~200k tokens/month, cost ~$0.60/month per customer.
  - Total agent cost: ~$2–4/month per customer (scales with volume).
- If gross margin is 70% and customer price is $500/month (LTV $12,000), agent costs are <1% of revenue. Sustainable.

## Dependencies

### Depends On

- **Business Model (3.1):** Agent vs. human percentages in customer journey, financial projections, revenue model.
- **Feasibility Report (Phase 2, 2.4):** AI capabilities available, integration requirements, regulatory constraints.
- **Concept Definition (Phase 1):** Problem being solved, target customer, product vision.

### Depended On By

- **GTM Strategist (3.3):** Which parts of GTM can agents automate? What's the human effort required?
- **Risk Analyst (3.4):** What agent failure modes could derail the business? What dependencies are fragile?
- **Resource Planner (3.5):** Human headcount plan, compute budget, infrastructure requirements.
- **Blueprint Packager (3.6):** Full operational model for the blueprint document.

## Success Metrics

1. **Agent Specifications Completeness:**
   - Every agent has a clear role, responsibilities, and decision boundaries (no fuzzy specs).
   - Escalation triggers and SLAs are explicit (not vague).
   - Required capabilities and integrations are documented.

2. **Financial Coherence:**
   - Agent + human costs fit within the gross margin from the business model.
   - OpEx projections are realistic (verified by Resource Planner).

3. **Operational Feasibility:**
   - Human roles are clear and hirable (not requiring mythical "full-stack engineers").
   - Escalation paths don't create bottlenecks (no single point of failure).
   - Failure modes are identified and mitigations are documented.

4. **Alignment with Business Model:**
   - Agent/human split achieves the percentages specified in the business model customer journey.
   - Or, if not, the misalignment is flagged and resolved.

5. **Buildability:**
   - All required AI capabilities exist (or MVP versions do).
   - All required APIs and integrations are documented (and costs are estimated).
   - Build time and testing time are realistic (8–12 weeks for a complex agent fleet).

6. **Stakeholder Confidence:**
   - GTM Strategist can confidently design the launch plan around this architecture.
   - Risk Analyst can identify key failure modes and mitigation strategies.
   - Resource Planner can estimate budget and hiring needs from this spec.

## Implementation Notes

### Suggested Tech Stack

**Agent Orchestration:**
- Claude API (preferred for complex reasoning, system prompt flexibility) or local models (if data sensitivity requires it).
- Orchestration framework: Python (FastAPI + Celery for task queuing) or Node.js + Bull for simpler workflows.
- For complex multi-agent coordination, consider: LangChain, Crew AI, or autogen (depends on complexity).

**Data & Integration:**
- API management: Internal API gateway (Kong, AWS API Gateway) to mediate calls to third-party services.
- Secret management: HashiCorp Vault or AWS Secrets Manager (never commit API keys).
- Data store: PostgreSQL (relational) + Redis (cache) + vector DB (Pinecone, Milvus, or local Qdrant for embeddings).
- Job queues: Celery + Redis or AWS SQS for asynchronous task processing (agents don't need to return immediately).

**Monitoring & Observability:**
- Logging: CloudWatch, ELK Stack, or Datadog (critical to debug agent failures).
- Monitoring: Prometheus + Grafana or Datadog (track agent uptime, error rates, latency).
- Alerting: PagerDuty or Slack (escalate high-severity issues).
- Tracing: Jaeger or Datadog (debug multi-step agent workflows).

**Testing & Validation:**
- Unit tests: Pytest (test agent logic in isolation).
- Integration tests: Synthetic test cases (simulate customer interactions, verify agent behavior).
- Load testing: Locust or k6 (simulate 1000+ concurrent agent tasks to validate scaling assumptions).
- Quality assurance: Prompt testing frameworks (evaluate LLM outputs for consistency, correctness, tone).

### Build Steps

1. **Conduct a detailed function analysis** (as described in Step 1) and document which functions agents will handle.
2. **Triage each function** (Step 2) and decide: automate, escalate, or hybrid?
3. **Design individual agent roles** (Step 3) with clear responsibilities, decision boundaries, and capabilities.
4. **Design human roles** (Step 4) and hiring plan, ensuring escalations don't create bottlenecks.
5. **Define escalation matrix** (Step 5) so handoffs are explicit and tracked.
6. **Map integrations** (Step 6): third-party APIs, internal data stores, inter-agent communication.
7. **Model costs** (Step 7) and validate against unit economics from the business model.
8. **Assess viability** (Step 8): can we build and operate this?
9. **Plan the rollout** (Step 9): which agents to build first, which to add later.
10. **Write the spec** and validate with Resource Planner and Risk Analyst.

### Example Implementation (Pseudocode)

```python
class AgentArchitect:
    def __init__(self, llm_client, data_store):
        self.llm = llm_client
        self.store = data_store
        self.schema_validator = JSONSchemaValidator(AGENT_ARCHITECTURE_SCHEMA)

    def run(self, concept_id: str) -> AgentArchitecture:
        # Fetch inputs
        concept = self.store.get_concept(concept_id)
        business_model = self.store.get_business_model(concept_id)
        feasibility = self.store.get_feasibility_report(concept_id)

        # Generate function map and triage
        function_map = self.analyze_functions(concept)
        triage = self.agent_vs_human_triage(function_map, concept, business_model, feasibility)

        # Design agents
        agents = self.design_agents(triage, feasibility)

        # Design human roles
        humans = self.design_human_roles(triage, business_model)

        # Define escalations
        escalations = self.define_escalation_matrix(agents, humans)

        # Model integrations and costs
        integrations = self.map_integrations(agents)
        costs = self.model_costs(agents, humans, integrations)

        # Assess viability
        viability = self.assess_viability(agents, humans, costs, business_model, feasibility)

        # Compile full architecture
        architecture = AgentArchitecture(
            agents=agents,
            humans=humans,
            escalations=escalations,
            integrations=integrations,
            costs=costs,
            viability=viability
        )

        # Validate schema
        self.schema_validator.validate(architecture.to_dict())

        # Store and return
        self.store.save_agent_architecture(concept_id, architecture)
        return architecture

    def agent_vs_human_triage(self, functions, concept, business_model, feasibility):
        # Use LLM to triage: for each function, should it be automated?
        prompt = f"""
        Given the concept and business constraints, decide for each business function:
        - Can an agent do it? (Yes/No/Partial)
        - Should an agent do it? (Yes/No/Maybe)
        - If automation is partial or not recommended, why?

        Concept: {concept.name}
        Business model agent/human split: {business_model.customer_journey}
        Feasibility constraints: {feasibility.constraints}

        Functions: {json.dumps(functions, indent=2)}

        Produce a triage matrix as JSON...
        """
        response = self.llm.query(prompt, system=SYSTEM_PROMPT)
        return json.loads(response)

    def design_agents(self, triage, feasibility):
        # For each function marked for automation, design an agent role
        # Use LLM to flesh out responsibilities, decision boundaries, capabilities
        agents = []
        for func, triage_result in triage.items():
            if triage_result.should_automate:
                agent_spec = self._design_individual_agent(func, triage_result, feasibility)
                agents.append(agent_spec)
        return agents

    def _design_individual_agent(self, function, triage_result, feasibility):
        prompt = f"""
        Design a detailed agent role for:
        Function: {function}
        Can automate: {triage_result.can_automate}
        Should automate: {triage_result.should_automate}

        Specify:
        - Agent ID, role name, core responsibilities
        - Decision boundaries (autonomous vs. escalation)
        - Required AI capabilities and tools
        - Performance specs (uptime, response time, resolution rate, error rate)
        - Failure modes and mitigation
        - Estimated compute cost at different scales
        - Training/fine-tuning needs

        Format as JSON...
        """
        response = self.llm.query(prompt, system=SYSTEM_PROMPT)
        return json.loads(response)

    # Similar methods for design_human_roles, define_escalation_matrix, map_integrations, model_costs, assess_viability...
```

---

This specification provides a development team with a comprehensive framework for designing an agent-first operational architecture. The key is ensuring the architecture aligns with business model constraints, is buildable with today's technology, and scales economically.
