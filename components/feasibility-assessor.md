# Feasibility Assessor Component Specification

## 1. Purpose & Responsibility

The **Feasibility Assessor** determines whether the concept can actually be built and operated with current technology. This is a critical gate: a concept with massive market demand and strong unit economics is still worthless if it requires technology that doesn't exist yet.

The agent evaluates:
- **AI capability requirements:** Does the concept depend on LLM quality that hasn't been achieved yet?
- **Integration feasibility:** Can the necessary data sources and third-party services be accessed?
- **Technical architecture:** Are there known solutions for the hardest technical problems, or are we pioneering?
- **Regulatory compliance:** Can the concept legally operate in its target market(s)?
- **Data infrastructure:** Do the required datasets exist and are they accessible?
- **Operational reliability:** What's the expected failure rate of agent-driven operations?
- **Cost feasibility:** Can we build and operate this within reasonable margins?

The Feasibility Assessor owns:
- AI capability assessment and gap analysis
- Technical requirements specification
- Risk identification and severity rating
- Regulatory and compliance checklist
- Data availability and access assessment
- Operational reliability estimation
- Go/no-go feasibility recommendation

## 2. Inputs

### Primary Input
A **Concept Definition Object** from Phase 1 and an optional **Architecture Sketch:**
```
{
  concept: {
    id: string (UUID),
    name: string,
    value_proposition: string,
    core_operation: string (e.g., "AI agent reviews contracts using NLP"),
    critical_tasks: [
      {
        task: string,
        description: string,
        frequency: "real-time" | "hourly" | "daily" | "weekly",
        reliability_required: number (0-1, e.g., 0.99 = 99%)
      }
    ]
  },
  assumed_technology_stack: [string] (optional, e.g., ["GPT-4", "Claude API", "LangChain"])
}
```

### Secondary Input
The **Landscape Report** (from Phase 1.1) for market context and incumbent technology choices.

## 3. Outputs

### Primary Output
A **Feasibility Assessment Report** containing:

```json
{
  report_id: string (UUID),
  concept_id: string,
  generated_at: ISO8601 timestamp,
  executive_summary: {
    feasibility_verdict: "go" | "conditional_go" | "no_go",
    confidence_level: "high" | "medium" | "low",
    confidence_pct: number (0-100),
    critical_go_no_go_factors: [string],
    timeline_estimate_months: number
  },
  ai_capability_assessment: {
    core_ai_capability_required: string,
    capability_examples: [string],
    current_sota_quality: {
      model_or_system: string,
      benchmark_scores: {
        accuracy_pct: number (optional),
        f1_score: number (optional),
        other_relevant_metric: string (optional)
      },
      adequacy_for_concept: "exceeds_requirements" | "meets_requirements" | "marginal" | "insufficient",
      gap_assessment: string,
      roadmap_timeline: string (e.g., "2024 Q2", "12-18 months", "already available")
    },
    confidence: "high" | "medium" | "low"
  },
  technical_requirements: [
    {
      requirement_id: string,
      requirement: string,
      category: "ai_model" | "api_integration" | "data_ingestion" | "data_processing" | "infrastructure" | "authentication",
      difficulty: "low" | "medium" | "high",
      estimated_build_effort_person_weeks: number,
      known_solutions_exist: boolean,
      known_solutions: [string] (optional),
      potential_blockers: [string],
      mitigation_strategy: string
    }
  ],
  data_requirements_and_access: {
    data_sources_required: [
      {
        data_source: string,
        type: "internal_customer_data" | "third_party_api" | "public_data" | "proprietary_dataset",
        access_difficulty: "free_public" | "api_available" | "custom_agreement_required" | "not_readily_available",
        estimated_access_cost_usd: number (optional),
        compliance_requirements: [string],
        alternative_if_unavailable: string (optional)
      }
    ],
    data_infrastructure_required: {
      ingestion_frequency: string (e.g., "real-time", "daily batch"),
      storage_volume_monthly_gb: number,
      processing_latency: string (e.g., "<100ms", "1-5 seconds", "daily batch"),
      estimated_infrastructure_cost_monthly_usd: number
    }
  },
  regulatory_and_compliance: {
    applicable_regulations: [
      {
        regulation: string (e.g., "GDPR", "HIPAA", "SOC 2"),
        jurisdiction: string,
        applicability: "mandatory" | "recommended" | "informational",
        compliance_cost_estimate_usd: number,
        implementation_timeline_months: number,
        risk_if_noncompliant: "high" | "medium" | "low"
      }
    ],
    data_privacy_requirements: [string],
    licensing_requirements: [string],
    legal_liability_assessment: string
  },
  operational_reliability_assessment: {
    critical_reliability_requirements: [
      {
        operation: string,
        uptime_required_pct: number,
        estimated_capability: number,
        confidence: "high" | "medium" | "low"
      }
    ],
    failure_modes: [
      {
        failure_mode: string,
        likelihood: "high" | "medium" | "low",
        impact: "high" | "medium" | "low",
        mitigation: string
      }
    ],
    human_escalation_strategy: string,
    recovery_time_objective_minutes: number
  },
  cost_feasibility: {
    build_costs: {
      ai_model_development_person_months: number,
      platform_development_person_months: number,
      integration_person_months: number,
      testing_and_qa_person_months: number,
      total_build_cost_usd: number (estimated at $150K per person-month)
    },
    operational_costs: {
      ai_api_calls_monthly_usd: number (e.g., Claude API usage),
      third_party_api_costs_monthly_usd: number,
      infrastructure_hosting_monthly_usd: number,
      compliance_and_security_monthly_usd: number,
      total_monthly_operational_cost_usd: number,
      cost_per_customer_monthly_usd: number (optional, depends on SOM)
    },
    cost_vs_market_feasibility: string
  },
  technical_risks: [
    {
      risk_id: string,
      risk: string,
      severity: "critical" | "high" | "medium" | "low",
      likelihood: "high" | "medium" | "low",
      impact_if_occurs: string,
      mitigation_strategy: string,
      monitoring_approach: string
    }
  ],
  architecture_recommendations: {
    recommended_tech_stack: [string],
    architectural_pattern: string,
    critical_design_decisions: [
      {
        decision: string,
        rationale: string,
        alternatives_considered: [string]
      }
    ],
    build_vs_buy_recommendations: [string]
  },
  data_sources_and_research: [
    {
      source_name: string,
      source_type: string,
      access_date: ISO8601 date,
      reliability: "primary" | "secondary"
    }
  ],
  research_gaps: [
    {
      gap: string,
      impact: "high" | "medium" | "low",
      suggested_validation_approach: string
    }
  ],
  analyst_notes: string
}
```

### Secondary Output
Supporting research artifacts:
- Technology capability benchmark comparison table
- Technical requirements prioritization matrix
- Risk register with severity scores
- Architecture diagram (text-based or visual)
- Data flow diagram
- Compliance checklist by regulation

## 4. Core Logic / Algorithm

### Step 1: Core AI Capability Identification

1. **Extract the core AI task(s)** from the concept:
   - Example: "AI contract review" → Core task = "extract obligations and risks from legal documents"
   - Example: "AI financial advisor" → Core task = "analyze financial situation and recommend allocations"

2. **Define the specific success criteria** for that task:
   - What output is required? (classification, extraction, prediction, generation)
   - What quality threshold? (e.g., 95% accuracy on obligation extraction)
   - What performance characteristics? (latency, throughput, cost per inference)

3. **Research current state-of-the-art (SOTA):**
   - What LLM or specialized model is best suited?
   - What's the current quality on this task? (Benchmark scores, published papers, real-world comparisons)
   - How does SOTA compare to requirement?

Example:
```
Concept: AI Contract Review
Core task: Extract obligations and risks from PDF contracts
Success criteria: 95% accuracy on obligation extraction, <1 second per page
Current SOTA: GPT-4 achieves 92% accuracy on contract parsing, Claude 3 achieves 94%
Adequacy: Marginal (meets accuracy, barely; latency TBD but likely 2-5 seconds per page)
Gap: Need to fine-tune or prompt-engineer for 95%+ accuracy; optimize latency
Timeline: Achievable in 2-4 months with dedicated work
```

### Step 2: Technical Requirements Decomposition

Break down the concept into technical requirements:

1. **AI/ML Requirements:**
   - Which models/APIs needed? (GPT-4, Claude, Mistral, custom fine-tuning)
   - Training data requirements?
   - Fine-tuning needed?
   - Latency and cost per inference?

2. **Data Ingestion & Processing:**
   - How does data enter the system? (API, file upload, streaming, batch)
   - What preprocessing is needed? (parsing, normalization, tokenization)
   - How much data volume? (daily, monthly, storage)

3. **Integration & APIs:**
   - Third-party services needed? (payment processor, identity provider, compliance tool)
   - Are APIs available and stable?
   - Cost of integrations?

4. **Infrastructure:**
   - Hosting (serverless, containers, on-premise)?
   - Database (vector store for embeddings, traditional DB)?
   - Security & monitoring?

5. **User-Facing:**
   - Web/mobile interface?
   - Single-sign-on integration?
   - Audit trails and logging?

For each requirement:
- Assess difficulty (low/medium/high)
- Estimate build effort (person-weeks)
- Identify known solutions (open source, SaaS, managed services)
- Flag potential blockers

Example:
```
Requirement 1: Contract PDF parsing
Difficulty: Medium
Build effort: 2-3 person-weeks
Known solutions: LlamaIndex, LangChain document loaders, AWS Textract, Anthropic PDF support
Mitigation: Use Claude's native PDF handling if available

Requirement 2: Integration with Slack (so users can "review in Slack")
Difficulty: Low
Build effort: 1-2 person-weeks
Known solutions: Slack SDK, many templates available
Mitigation: Integrate in V1 if time; defer to V2 if needed

Requirement 3: Fine-tuning on domain-specific contract language
Difficulty: High
Build effort: 6-8 person-weeks
Known solutions: LLaMA fine-tuning, OpenAI fine-tuning API, LoRA
Mitigation: Start with prompt engineering; only fine-tune if SOTA quality insufficient
```

### Step 3: Data Requirements & Access Assessment

For each data requirement:

1. **Identify the data source:**
   - Internal customer data? (Contracts, documents from customer systems)
   - Third-party API? (Customer database, pricing database, etc.)
   - Public data? (Training data, reference data)

2. **Assess access difficulty:**
   - Free/public? (e.g., GitHub data, public APIs)
   - Available via API? (e.g., Stripe API, Salesforce API)
   - Requires custom agreement? (e.g., exclusive data partnership)
   - Not readily available? (proprietary data, restricted access)

3. **Estimate cost and timeline:**
   - API costs per query?
   - Data licensing costs?
   - Integration effort to connect?

4. **Compliance & privacy:**
   - Is this customer data? (Requires privacy controls)
   - Is this PII? (Requires encryption, anonymization)
   - Are there regulatory restrictions? (GDPR, HIPAA, SOX)

Example:
```
Data requirement 1: Customer contracts (documents they want reviewed)
Type: Internal customer data
Access: Via customer upload or integration with their document system
Cost: Depends on storage (likely <$1/customer/month in cloud storage)
Compliance: Must comply with customer data agreements, GDPR (if EU customers), CCPA (if CA)
Mitigation: Encrypt at rest, log access, provide data deletion on request

Data requirement 2: Employment law updates (for contract risk assessment)
Type: Third-party API or public data
Access: Via API (e.g., legal research APIs, news APIs)
Cost: $100-500/month for API subscriptions
Compliance: Public data; no issues
Mitigation: Cache and update daily to minimize API costs

Data requirement 3: Industry-specific contract templates (for benchmarking)
Type: Public data
Access: Download from public sources (GitHub, legal resources)
Cost: Free to $1K/month if using commercial database
Compliance: Depends on license (open source or commercial)
Mitigation: Use open source where possible; license commercial if needed
```

### Step 4: Regulatory & Compliance Checklist

Identify all applicable regulations:

**Data Privacy:**
- GDPR (if EU customers): Requires data protection impact assessment, privacy policy, data subject rights
- CCPA/CPRA (if CA customers): Similar requirements
- LGPD (if Brazil customers)
- Other country-specific (China, India, etc.)

**Industry-Specific:**
- HIPAA (if healthcare data): Requires BAA, encryption, audit logs
- SOX (if financial data): Requires financial controls, audit trails
- FCA (if UK financial services): Requires regulatory approval, capital requirements
- State bar association (if legal services): May require attorney review, licensing

**Security & Operational:**
- SOC 2 Type II (if B2B SaaS): Requires security controls, audit
- ISO 27001 (if large enterprises): Information security management system

**Product-Specific:**
- Biometric data: Special privacy rules
- Credit data: Fair Credit Reporting Act (FCRA) compliance
- Children's data: COPPA (if <13 users)

For each regulation, assess:
- Is it mandatory or recommended?
- What's the compliance cost?
- What's the implementation timeline?
- What's the risk if non-compliant? (fines, shutdowns, lawsuits)

Example:
```
Concept: AI Contract Review for Legal Firms

Applicable regulations:
1. GDPR (if EU customers)
   - Mandatory (if any EU users)
   - Cost: $50-100K for legal review + infrastructure compliance
   - Timeline: 3-4 months
   - Risk: Up to 4% of global revenue if violated

2. Data protection (customer confidential documents)
   - Mandatory
   - Cost: Encryption, secure storage, access controls ($10-20K)
   - Timeline: 1-2 months
   - Risk: Client breach = reputation damage + liability

3. Bar association (if targeting US lawyers)
   - Recommended (varies by state)
   - Cost: Legal review, possibly errors & omissions insurance ($5-10K)
   - Timeline: 1-2 months
   - Risk: Bar complaints if not compliant with ethics rules

Total compliance investment: $65-130K + 4-6 months
```

### Step 5: Operational Reliability Assessment

Assess the reliability requirements and capabilities:

**For each critical operation, define:**
1. What is the operation? (e.g., "process contract upload", "extract obligations", "deliver report")
2. What uptime is required? (e.g., "99% uptime" = 43 minutes/month downtime acceptable)
3. What's the estimated reliability of the proposed stack?

Example reliability calculation:
```
Operation: Contract extraction via Claude API
Uptime requirement: 99.5% (user can tolerate 1 hour/month downtime)
Component reliabilities:
- Claude API: 99.9% (published by Anthropic)
- Network/internet: 99.5% (typical for customer ISP)
- Our application: 99.9% (if we code it well)

Combined reliability: 99.9% × 99.5% × 99.9% = 99.3% (MEETS requirement 99.5%)
Confidence: Medium (assumes all components perform as expected)
Risk: If Claude API has incident, entire service down
Mitigation: Fallback to Claude Instant or local model; queue requests during outage

Operation: Final report delivery (via email)
Uptime requirement: 99% (delivery can be delayed 7+ hours/week)
Component reliabilities:
- Contract extraction: 99.3% (from above)
- Report generation: 99%
- Email service: 99.9% (e.g., AWS SES)

Combined: 99.3% × 99% × 99.9% = 98.2% (DOESN'T QUITE MEET 99% requirement)
Confidence: Medium
Mitigation: Add retry logic for email; queue if email fails; notify user of delay
```

**Failure modes to assess:**
- Model performance degradation (what if Claude's accuracy drops?)
- Data quality issues (corrupted inputs, unexpected formats)
- API unavailability (Claude, third-party services)
- Infrastructure failures (database, hosting)
- Security breaches (unauthorized access)

For each failure mode:
- How likely is it? (high/medium/low)
- What's the impact? (all users affected, some users, degraded quality, data loss)
- How do we recover? (fallback, retry, escalate to human, etc.)

### Step 6: Cost Feasibility Analysis

Estimate build and operational costs:

**Build Costs:**
- AI/ML model development (fine-tuning, prompt engineering): X person-months
- Platform/backend development: Y person-months
- Frontend development: Z person-months
- Integrations: A person-months
- Testing, documentation: B person-months
- **Total: (X+Y+Z+A+B) × $150K/person-month** (typical startup burn rate)

Example:
```
Build effort estimate for AI Contract Review:
- Claude API integration and prompt engineering: 2 person-months
- PDF parsing and data pipeline: 3 person-months
- Web UI and user management: 2 person-months
- Integrations (Slack, Microsoft 365, case management): 2 person-months
- Testing, docs, deployment: 1 person-month

Total: 10 person-months × $150K = $1.5M build cost

With 3-person team: ~15-16 months to MVP
```

**Operational Costs (monthly):**
- Claude API calls: Depends on usage (e.g., $0.01 per contract × 1000/month = $10)
- Infrastructure (hosting, storage): $5K-20K/month depending on scale
- Third-party APIs: $500-5K/month
- Compliance and security tools: $1-5K/month
- Support and monitoring: (included in headcount)

**Total monthly operational cost:** Scales with usage and team size

**Viability assessment:**
- Build cost divided by potential market size = capital required
- If $1.5M build cost and $500M market opportunity, relatively viable
- If $1.5M build cost and $50M market opportunity, riskier
- If $1.5M build cost and $5M market opportunity, likely not viable (unless unit economics are exceptional)

### Step 7: Risk Identification & Severity Assessment

Identify technical risks and rate severity:

| Risk | Likelihood | Impact | Severity | Mitigation |
|------|-----------|--------|----------|-----------|
| Claude API response latency exceeds SLA (>5s per contract) | Medium | High | HIGH | Fallback to async processing; batch mode |
| Regulatory requirement (data residency in EU) blocks EU launch | Medium | High | HIGH | Negotiate with customer; build EU infrastructure |
| PDF parsing fails on scanned documents (images) | High | Medium | HIGH | Implement OCR; add human review escalation |
| Customer data security breach | Low | Critical | CRITICAL | Encryption, SOC 2, incident response plan |
| Third-party API (integration partner) shuts down or changes pricing | Low | Medium | MEDIUM | Multi-API fallbacks; in-house alternatives |

For each risk:
- What's the likelihood? (based on industry data, technical difficulty)
- What's the impact? (user disruption, revenue loss, legal liability)
- How do we mitigate? (alternative approach, fallback, insurance)
- How do we monitor? (metrics, alerts, user feedback)

### Step 8: Feasibility Verdict

Synthesize all findings into a go/no-go recommendation:

**GO:**
- AI capability: Meets or exceeds requirements
- Technical requirements: Mostly known/solvable
- Data: Accessible and compliant
- Regulatory: Manageable compliance burden
- Operational reliability: Achievable with proposed stack
- Cost: Viable given market opportunity
- Risks: Manageable with proposed mitigations

**CONDITIONAL GO:**
- One or more areas need validation or resolution (e.g., "AI capability marginal; need 2-4 months R&D to confirm")
- Risks are high but mitigable with additional investment/time
- Path forward is clear but requires careful execution

**NO GO:**
- Critical blocker identified (e.g., "required AI capability doesn't exist yet")
- Regulatory requirement makes product illegal or prohibitively expensive
- Cost vastly exceeds potential revenue
- Technical architecture has no known solution

## 5. Data Sources & Integrations

### AI Capability Benchmarks
- **Papers with Code** (paperswhitecode.com): Latest model benchmarks
- **Hugging Face Model Hub** (huggingface.co): Models, benchmarks, community reviews
- **OpenAI/Anthropic documentation:** Model capabilities, pricing, SLAs
- **ArXiv** (arxiv.org): Latest research papers on LLM capabilities
- **GitHub:** Implementation examples, community discussions

### Technical Feasibility Research
- **Stack Overflow:** Common challenges and solutions
- **GitHub Issues:** Real-world implementation problems
- **Documentation:** API docs, integration guides
- **Technical blogs:** Real-world experiences (e.g., "lessons building with Claude")

### Regulatory & Compliance
- **OWASP** (owasp.org): Security best practices
- **ICO** (ico.org.uk): GDPR guidance
- **HIPAA.com:** HIPAA compliance resources
- **SOC 2 Trust Service Criteria:** Audit requirements
- **Legal research:** State bar associations, FTC guidance

### APIs & Third-Party Services
- **API documentation:** Pricing, rate limits, SLAs
- **Status pages:** Uptime and incident history (e.g., status.anthropic.com)
- **GitHub:** Open source implementations, examples
- **Product reviews:** G2, Capterra for infrastructure/tool reviews

## 6. Agent Prompt Strategy

### System Prompt Persona

The agent adopts the role of a **technical due diligence expert** with experience in startup engineering and regulatory compliance. Key characteristics:
- Rigorous; identifies both upside (great technology available) and downside (hidden blockers).
- Practical; focuses on "can we actually build this in 18 months with a 5-person team?"
- Regulatory-aware; knows compliance landscape and costs.
- Risk-conscious; identifies failure modes and mitigation.

### Core Instructions

```
You are a technical feasibility analyst. Your job is to determine whether a startup
concept can actually be built with current technology.

For a given concept:
1. Identify the core AI/technical task(s) required.
   - What capability does this depend on?
   - Is that capability available today? At what quality?
   - If not available, when will it be? (roadmap, months, years)

2. Decompose the concept into technical requirements.
   - What do we need to build?
   - What's available off-the-shelf?
   - What's the difficulty of each requirement?
   - What's the total build effort?

3. Assess data requirements and access.
   - What data is needed?
   - Can we access it? (API, partnership, public)
   - What's the cost and compliance burden?

4. Check regulatory requirements.
   - What laws apply?
   - What compliance is mandatory?
   - What's the cost and timeline?
   - What's the legal risk if we skip compliance?

5. Assess operational reliability.
   - What uptime do we need?
   - Can our tech stack achieve it?
   - What are the failure modes?
   - How do we recover?

6. Estimate costs (build + operational).
   - How much to build to MVP?
   - What are monthly operational costs?
   - Does the market size justify the investment?

7. Identify risks and mitigations.
   - What could go wrong?
   - How likely? How bad?
   - How do we prevent/mitigate?

8. Conclude: Go, conditional go, or no-go?

Output a JSON report matching the provided schema. Be specific: cite actual models,
actual APIs, actual regulatory requirements. Give confidence levels on all assessments.
```

### Few-Shot Examples in Prompt

**Example 1: AI Contract Review**
```
Concept: AI reviews contracts in <1 second per page, 95% accuracy on obligation extraction

AI Capability Assessment:
- Required: 95% accuracy on legal obligation extraction from PDFs
- Current SOTA: Claude 3 Opus achieves 94% on contract parsing benchmark
- Assessment: MARGINAL - meets accuracy (barely), but latency unknown
- Confidence: Medium
- Mitigation: 2-4 weeks prompt engineering + evaluation

Technical Requirements:
1. PDF parsing: Medium difficulty, 2 person-weeks
   - Known solution: Claude's native PDF support or LlamaIndex
2. Contract obligation extraction: Medium difficulty, 3-4 person-weeks
   - Known solution: Prompt engineering with few-shot examples
3. Web UI + user auth: Low difficulty, 2 person-weeks
   - Known solution: Standard web stack (React, Node, PostgreSQL)
4. Integration with case management systems: High difficulty, 3-4 person-weeks
   - Known solutions: API integrations for Clio, LexisNexis, etc.

Total build: ~12 person-weeks, $450K

Regulatory:
- GDPR (if EU): Required, $30-50K, 2-3 months
- Data protection (customer confidential): Required, $20K, 1-2 months
- Bar association ethics: Recommended, $10K, 1-2 months

Verdict: CONDITIONAL GO
- AI capability marginal; need validation
- Technical requirements mostly solvable
- Regulatory clear but significant cost
- Risks: PDF parsing failures (common), data security, latency SLA
- Path: 2-month R&D to confirm AI quality; 6-month build; 4-month regulatory compliance
- Total: 12 months to market with 5-person team
```

**Example 2: AI Financial Advisor**
```
Concept: AI advisor analyzes financial situation and recommends portfolio allocation

AI Capability Assessment:
- Required: Generate personalized financial advice, 90% confidence in recommendations
- Current SOTA: Claude 3 can analyze finances and provide advice (no published benchmark)
- Assessment: ADEQUATE but unvalidated
- Confidence: Low-Medium
- Need: Customer testing, expert review of recommendations

Technical Requirements:
1. Financial data ingestion (bank accounts, investments, crypto): High difficulty, 4-5 person-weeks
   - Depends on Plaid, API4Finance, or custom integrations
   - Plaid integration is standard; crypto is harder (many APIs, unreliable)
2. Portfolio optimization logic: Medium difficulty, 2-3 person-weeks
   - Known solutions: Scipy optimization, PyPortfolioOpt library
3. Regulatory compliance (SEC, FCA, state guidance): CRITICAL
   - Cannot give explicit investment advice without being a fiduciary/RIA
   - Workaround: Provide "educational" advice, not recommendations
   - This limits value proposition significantly
   - Cost: $100-200K legal review, ongoing compliance ($50K/year)

Total build: ~12 person-weeks, $450K
Regulatory: $150K, 4-6 months

Verdict: CONDITIONAL GO with MAJOR CAVEAT
- Regulatory constraint (cannot give investment advice without fiduciary license)
  severely limits value proposition
- Need to validate with legal counsel before proceeding
- If can operate as "educational tool," viable; if must be "advisor," requires
  SEC registration (expensive, slow, risky)
- Recommendation: Pivot to financial education + AI tutor model
  (less regulated, still valuable, clearer path)
```

### Edge Case Handling

1. **AI capability doesn't exist yet (e.g., "real-time language translation in the field"):**
   - Timeline check: Will it exist in 18-24 months?
   - If yes: Conditional go; plan for roadmap changes
   - If no: No-go; concept is too far ahead of tech curve

2. **Regulatory uncertainty (e.g., "AI for hiring decisions"):**
   - Assess worst-case scenario (e.g., "algorithmic bias laws passed mid-2025")
   - If risk is high and unmitigable, no-go
   - If manageable, conditional-go with risk mitigation

3. **Data access blocked (e.g., "need banking data but banks won't share"):**
   - Look for workarounds (e.g., user-provided data, open banking APIs)
   - If no workaround, no-go
   - If workaround exists but limits scale, conditional-go

4. **Cost is borderline (e.g., "build cost $2M, market size $100M"):**
   - Conditional-go if unit economics justify the investment
   - Need to validate that you can capture meaningful share

## 7. Error Handling & Edge Cases

### Data Quality Issues

**Benchmark score uncertainty:**
- If benchmark is from proprietary model (not publicly accessible), mark confidence as "medium."
- If benchmark is from paper with small sample size, note limitations.
- Always test on representative data before making go/no-go decision.

**API documentation outdated or incomplete:**
- Verify with recent usage examples (GitHub, Stack Overflow).
- Contact API provider if critical details missing.
- Assume higher latency/cost until verified.

**Regulatory guidance conflicting across jurisdictions:**
- Default to most restrictive jurisdiction (e.g., if GDPR requires X and UK GDPR requires Y, do both).
- Consult legal counsel for edge cases.

### Assessment Confidence Adjustments

**High confidence factors:**
- Multiple corroborating sources (academic papers, real-world implementations, vendor claims).
- Proven track record (other startups have done this successfully).
- Vendor SLA published and audited (e.g., Anthropic's published Claude API uptime).

**Medium confidence factors:**
- Benchmark from academic paper or single vendor.
- Few real-world implementations; some uncertainty about generalization.
- SLA published but not independently audited.

**Low confidence factors:**
- No public benchmark or SLA.
- Emerging technology with limited real-world use.
- Significant variation across implementations (e.g., "integration difficulty depends heavily on partner API quality").

### Go/No-Go Edge Cases

**"The concept is impossible with current tech, but will be easy in 2 years":**
- Verdict: NO-GO for now, but recommend revisiting in 2 years.
- Note: Another team might attempt it and build the foundational tech.

**"Technically feasible, but regulatory costs make ROI impossible":**
- Verdict: NO-GO.
- Alternative: Explore jurisdictions with lighter regulation (e.g., "legal services AI for UK only, not US").

**"MVP is feasible, but full vision requires technology breakthroughs":**
- Verdict: CONDITIONAL GO, starting with constrained MVP.
- Plan pivot point if technology doesn't materialize.

## 8. Performance & Scaling

### Expected Performance Characteristics

**Latency:**
- Straightforward assessment (existing tech, known integrations): 4-6 hours.
- Complex assessment (new tech, multiple unknowns, regulatory): 12-16 hours.
- Peer review and write-up: 2-3 hours.

**Throughput:**
- Single concept per run; each gets dedicated technical review.
- Expected output: One comprehensive feasibility report per concept.

**Scaling Considerations:**
- **Reusable assessments:** Components used across concepts (e.g., "Claude API reliability") can be cached.
- **Expert consultation:** For novel or highly regulated concepts, escalate to human CTO/technical advisor for 1-2 hours review.

## 9. Dependencies

### Upstream Dependencies
- **Phase 1.3 (Concept Generator):** Concept definition and proposed tech stack (if provided).
- **Phase 1.1 (Landscape Analyst):** Market context; what tech do incumbents use?

### Downstream Dependents
- **Phase 2.5 (Economics Modeler):** Uses build cost and operational cost estimates from feasibility report.
- **Phase 2.6 (Validation Synthesizer):** Integrates feasibility findings as go/no-go factor.
- **Phase 3.2 (Agent Architect):** Uses detailed tech requirements and reliability assessments to design agent system.
- **Phase 3.5 (Resource Planner):** Uses build timeline, cost, and team skill requirements.

### Parallel Dependencies
- **Phase 2.1 (Market Sizer):** (Parallel; independent)
- **Phase 2.2 (Competitive Analyst):** (Parallel; can share tech stack data)
- **Phase 2.3 (Customer Validator):** (Parallel; independent)

## 10. Success Metrics

### Output Quality
1. **Report completeness:** All required fields populated; clear go/no-go verdict.
2. **Specificity:** Technical requirements reference actual tools (Claude, Langchain, Plaid, etc.), not vague categories.
3. **Risk coverage:** All major risks identified and mitigated; no obvious blindspots.
4. **Confidence calibration:** Confidence levels match evidence. (High confidence only when multiple sources agree.)

### Downstream Validation
1. **Economist acceptance:** Cost estimates are used without major revision.
2. **Architect alignment:** Feasibility report matches architectural assumptions; no major surprises during build planning.
3. **CTO review:** If human review conducted, CTO finds assessment rigorous and credible.

### Process Metrics
1. **Coverage:** At least 5 categories assessed (AI capability, technical, data, regulatory, operational, cost, risk).
2. **Evidence trail:** Every claim in executive summary has supporting detail in full report.
3. **Completeness:** <10% of critical fields marked as "unknown" without mitigation plan.

## 11. Implementation Notes

### Technology Stack

**Core Agent Framework:**
- **Claude API (Opus)** for technical reasoning.
- **Tool calling** to retrieve API docs, research papers, regulatory guidance.

**Research & Data Collection:**
- **Python** for information aggregation.
- **Libraries:**
  - `requests` (HTTP for API lookups)
  - `beautifulsoup4` (web scraping for documentation)
  - `json` (schema validation)
  - `pandas` (tabular data for comparisons)

**Integrations:**
- **GitHub API** (search repositories, code examples)
- **ArXiv API** (search research papers)
- **News/documentation aggregators** (for latest tech releases)

**Output & Storage:**
- JSON report generation (schema validation)
- Markdown for detailed technical notes

### Development Approach

**Phase 1: Foundation**
- Build AI capability assessment framework (model benchmarks, latency testing).
- Create technical requirement decomposition methodology.
- Establish cost estimation model.

**Phase 2: Enhancements**
- Add regulatory compliance checklist builder.
- Implement operational reliability calculation.
- Build risk register generator.

**Phase 3: Intelligence**
- Add LLM-based architecture recommendation logic.
- Implement build vs. buy decision framework.
- Build integration feasibility assessment.

### Key Implementation Details

**Tool Calling (for Claude agent):**
```python
tools = [
    {
        "name": "search_model_benchmarks",
        "description": "Search for LLM/AI model benchmarks on a specific task",
        "input_schema": {
            "task": "string (e.g., 'contract obligation extraction')",
            "metric": "string (e.g., 'accuracy', 'f1_score', 'latency')"
        }
    },
    {
        "name": "get_api_documentation",
        "description": "Retrieve API documentation and SLA",
        "input_schema": {
            "api_name": "string (e.g., 'Claude API', 'Plaid')",
            "include_fields": ["pricing", "rate_limits", "sla", "latency"]
        }
    },
    {
        "name": "search_regulatory_requirements",
        "description": "Search for regulatory requirements for a domain",
        "input_schema": {
            "domain": "string (e.g., 'financial services', 'healthcare')",
            "jurisdiction": "string (e.g., 'US', 'EU', 'UK')"
        }
    },
    {
        "name": "search_technical_implementations",
        "description": "Search GitHub/blogs for how others have solved a problem",
        "input_schema": {
            "problem": "string",
            "language": "string (optional, e.g., 'Python', 'JavaScript')"
        }
    }
]
```

**Technical Requirements Model:**
```python
@dataclass
class TechnicalRequirement:
    requirement: str
    category: str  # "ai_model", "integration", "data", etc.
    difficulty: str  # "low", "medium", "high"
    estimated_person_weeks: int
    known_solutions: list[str]
    blockers: list[str]
    mitigation: str

def estimate_build_cost(requirements: list[TechnicalRequirement],
                       person_cost_per_month: float = 150000) -> dict:
    """
    Estimate total build cost based on requirements.
    """
    total_weeks = sum(req.estimated_person_weeks for req in requirements)
    person_months = total_weeks / 4.3  # weeks per month
    cost_usd = person_months * person_cost_per_month
    timeline_months = person_months / num_engineers  # assume 3-person team

    return {
        "total_person_weeks": total_weeks,
        "total_person_months": person_months,
        "estimated_cost_usd": cost_usd,
        "timeline_months_with_3_engineers": timeline_months
    }

def assess_reliability(components: list[dict],
                      target_uptime_pct: float) -> dict:
    """
    Calculate composite reliability from component reliabilities.
    """
    # Assume series: all must be available
    composite = 1.0
    for component in components:
        composite *= component["uptime_pct"]

    meets_target = composite >= target_uptime_pct

    return {
        "composite_uptime_pct": composite * 100,
        "meets_target": meets_target,
        "margin_pct": (composite - target_uptime_pct / 100) * 100
    }
```

**Risk Register:**
```python
@dataclass
class FeasibilityRisk:
    risk: str
    category: str  # "technical", "regulatory", "market", "operational"
    likelihood: str  # "high", "medium", "low"
    impact: str  # "critical", "high", "medium", "low"
    mitigation: str
    monitoring: str

    @property
    def severity(self) -> str:
        """Risk severity = likelihood × impact."""
        if self.impact == "critical" or self.likelihood == "high":
            return "critical" if self.impact == "critical" else "high"
        if self.likelihood == "medium" or self.impact == "high":
            return "high"
        if self.likelihood == "medium" or self.impact == "medium":
            return "medium"
        return "low"
```

### Testing & Validation

**Unit tests:**
- Cost estimation accuracy (validate against real startup data if possible).
- Reliability calculation (verify formulas match standard reliability math).
- Risk severity scoring (ensure consistent application).

**Integration tests:**
- Model benchmark retrieval works.
- API documentation retrieval works.
- Regulatory requirement lookup works.
- Downstream agents can parse feasibility report.

**Smoke tests:**
- Run assessment on 3 test concepts.
- Verify report completeness and readability.
- Confirm downstream use (architect can build from this report).

### Common Pitfalls & How to Avoid Them

1. **Overoptimistic AI capability assessment:**
   - Benchmark scores are often on cherry-picked datasets.
   - Always validate on representative data.
   - Assume 10-20% degradation from benchmark to production.

2. **Underestimating integration complexity:**
   - API documentation often glosses over edge cases.
   - Account for 20-30% extra effort for "integration surprises."

3. **Missing regulatory requirements:**
   - Consult legal counsel early; compliance surprises are expensive.
   - Treat regulatory uncertainty as a blocker until resolved.

4. **Optimistic timeline estimates:**
   - Add 30-50% buffer to initial estimates.
   - Technical debt and unforeseen issues always arise.

5. **Ignoring operational costs:**
   - API costs can become dominant at scale.
   - Account for compute, storage, monitoring from day 1.

### Deployment Checklist

- [ ] Model benchmark retrieval mechanism is tested and working.
- [ ] API documentation lookup is automated where possible.
- [ ] Regulatory checklist is comprehensive (cover major jurisdictions and industries).
- [ ] JSON schema validation is active.
- [ ] Cost and reliability calculation formulas are verified.
- [ ] Risk assessment framework is calibrated.
- [ ] Report templates are finalized and tested on sample concepts.
- [ ] Downstream agents can successfully parse output.
- [ ] Error handling for missing data is documented.
- [ ] Confidence scoring heuristics are tuned.
- [ ] Documentation and runbooks are complete.
