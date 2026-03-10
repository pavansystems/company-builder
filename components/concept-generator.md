# Concept Generator Component (Phase 1.3)

## Purpose & Responsibility

The Concept Generator is responsible for ideating and specifying multiple startup concepts that address the identified pain points using AI agents as core operational infrastructure. It is the creative engine of the Ideation phase, taking validated market signals (landscape, pain points, enabling signals) and generating a diverse range of potential company concepts.

**Core responsibilities:**
- Generate 5–15 distinct startup concept sketches that address identified pain themes
- Design agent-first operational models for each concept
- Ensure concepts are grounded in identified pain points and market signals
- Create diverse ideation (from incremental to radical reimaginings)
- Validate concept feasibility at a high level (is this technically plausible?)
- Define customer value propositions and defensibility mechanisms
- Document customer experience and go-to-market hooks

The output is a set of concept sketches that will be scored and ranked by the Concept Scorer in the next step. Each concept should be detailed enough for a developer or investor to understand what would be built, but concise enough to fit on one coherent page.

---

## Inputs

**Primary Inputs:**
- **Landscape Report** (from Landscape Analyst, 1.1)
  - Incumbent positioning and weaknesses
  - Value chain breakdown and labor dependency map
  - Regulatory and technical barriers

- **Pain Point Catalog** (from Pain Extractor, 1.2)
  - Prioritized list of customer pain themes
  - Severity and frequency estimates
  - Customer personas and willingness to pay
  - Evidence of market signal

**Secondary Inputs:**
- **Phase 0 Enabling Signals** (technology breakthroughs that make this market newly attackable)
- **Market constraints or directions** (if user provided)

**Data Sources / References:**
- Research on AI agent capabilities and frameworks (LLM APIs, tool use, multi-step reasoning)
- Industry examples of agent-first businesses
- Case studies of companies disrupting incumbents through operational innovation

---

## Outputs

**Primary Output: Concept Sketch Set (5–15 concepts, each as structured document)**

```json
{
  "market_id": "string",
  "market_name": "string",
  "concept_set_date": "ISO 8601 date",
  "total_concepts_generated": "integer",
  "generation_method": "string (e.g., 'agentic divergent ideation')",

  "concepts": [
    {
      "concept_id": "string (e.g., 'concept_001')",
      "concept_name": "string (3–5 word name)",
      "tagline": "string (one-sentence pitch)",

      "overview": {
        "description": "string (2–3 paragraphs explaining the core idea)",
        "core_problem_addressed": ["pain_id_from_catalog"],
        "customer_segment": "string (target customer type)",
        "positioning": "string (how it differs from incumbents)"
      },

      "product_concept": {
        "what_it_does": "string (customer-facing description of the product/service)",
        "primary_features": [
          {
            "feature": "string (e.g., 'Automated X extraction')",
            "what_it_solves": "which pain point",
            "implementation_mechanism": "string (how it works, in plain language)"
          }
        ],
        "customer_experience": {
          "first_interaction": "string (how does customer first use it?)",
          "typical_workflow": ["string (step by step)"],
          "key_moments": "string (where does the product delight or surprise?)"
        }
      },

      "agent_first_architecture": {
        "primary_agents": [
          {
            "agent_name": "string (e.g., 'Document Analyzer Agent')",
            "role": "string (what this agent does)",
            "inputs": "string (what data it takes in)",
            "outputs": "string (what it produces)",
            "required_capabilities": [
              "string (e.g., 'vision capability', 'document analysis', 'multi-turn reasoning')"
            ],
            "decision_boundaries": "string (when does it escalate to human?)",
            "estimated_success_rate": "percentage (e.g., '90% of routine tasks')"
          }
        ],
        "supporting_agents": [
          {
            "agent_name": "string",
            "role": "string"
          }
        ],
        "human_roles": [
          {
            "role": "string (e.g., 'Escalation Reviewer')",
            "when_needed": "string (when do we need a human?)",
            "percentage_of_work": "percentage (what % of total work)"
          }
        ],
        "operational_cost_thesis": "string (e.g., 'Cost per unit of work would be 80% lower than incumbent due to agent automation')"
      },

      "value_proposition": {
        "customer_benefit": "string (what does the customer actually get?)",
        "quantified_benefit": "string (e.g., '50% reduction in time', '$100K annual savings', '90% faster turnaround')",
        "defensibility": [
          "string (e.g., 'Proprietary training data on X', 'Network effects from customer feedback loop', 'Switching costs')"
        ]
      },

      "go_to_market_sketch": {
        "initial_target_segment": "string (first customer cohort)",
        "why_this_segment": "string (why they'll adopt first)",
        "customer_acquisition_mechanism": "string (how do we reach them?)",
        "pricing_model": "subscription|usage|hybrid",
        "estimated_price_point": "string (e.g., '$200–$500/month')",
        "pricing_rationale": "string (why this price point?)"
      },

      "technical_feasibility": {
        "required_ai_capabilities": [
          "string (e.g., 'Document understanding', 'Multi-step reasoning', 'Tool use/integration')"
        ],
        "capability_readiness": "high|medium|low (are these capabilities available today?)",
        "external_data_requirements": [
          "string (e.g., 'Access to customer databases via API', 'Real-time market data feed')"
        ],
        "integration_complexity": "simple|moderate|complex (how hard to integrate with customer systems?)",
        "estimated_mvp_effort": "string (e.g., '8–12 weeks of engineering')",
        "technical_risks": [
          {
            "risk": "string",
            "likelihood": "high|medium|low",
            "mitigation": "string"
          }
        ]
      },

      "differentiation_from_incumbents": {
        "incumbent_approach": "string (how do incumbents currently solve this?)",
        "this_concept_approach": "string (how this concept differs)",
        "structural_advantage": "string (why is this approach better?)"
      },

      "market_assumptions": [
        {
          "assumption": "string",
          "confidence": "high|medium|low"
        }
      ],

      "ideation_notes": {
        "inspiration_sources": "string (what sparked this idea?)",
        "divergence_from_incumbent": "string (in what way is this radical vs. incremental?)",
        "open_questions": ["string (what would need to be true for this to work?)"]
      }
    }
  ],

  "ideation_summary": {
    "ideation_approach": "string (how were these concepts generated?)",
    "diversity_breakdown": {
      "incremental_improvements": "integer (how many concepts refine incumbent approach?)",
      "new_market_models": "integer (how many enter market differently?)",
      "radical_reimaginings": "integer (how many fundamentally rethink the market?)"
    },
    "key_themes_across_concepts": [
      "string (e.g., 'Integration as differentiator', 'Vertical-specific customization')"
    ],
    "most_promising_directions": [
      "string (which concept directions seem most viable?)"
    ]
  },

  "next_steps_for_scorer": [
    "string (specific dimensions or assumptions the Scorer should evaluate)"
  ]
}
```

**Secondary Outputs:**
- **Concept Summary Cards:** One-pager visual summary for each concept (for easy comparison)
- **Concept Comparison Matrix:** Side-by-side comparison of all concepts on key dimensions (target segment, pricing, agent readiness, etc.)
- **Visual Concept Sketches:** Simple diagrams showing the agent architecture for 2–3 leading concepts

---

## Core Logic / Algorithm

### High-Level Ideation Process

1. **Absorb Market Context**
   - Review landscape report: incumbent weaknesses, value chain, barriers
   - Review pain catalog: customer pain themes, severity, personas
   - Identify enabling signals: what technology shifts make this newly solvable?
   - Understand target customer: personas, willingness to pay, job to be done

2. **Generate Initial Concept Space**
   - Use divergent ideation to generate 20–30 raw concept ideas
   - Apply multiple ideation frameworks:
     - **By Pain Theme:** Generate concept for each top 3–5 pain themes
     - **By Incumbent Weakness:** Generate concepts exploiting each major incumbent weakness
     - **By Value Chain Stage:** Generate concepts automating each human-intensive stage
     - **By Operational Model:** Generate concepts with different agent/human ratios
     - **By Pricing:** Generate concepts with different pricing models (subscription, usage, marketplace, hybrid)

3. **Cluster and Refine**
   - Group similar ideas into concept families
   - Refine promising directions into coherent concept sketches
   - Ensure each concept is distinct and addresses a specific pain or market gap

4. **Design Agent Architecture**
   - For each concept, specify:
     - What agents are needed?
     - What does each agent do?
     - When do we need humans?
     - What is the operating cost structure?
   - Ensure agent-first design (agents handle primary value creation; humans handle escalation/edge cases)

5. **Validate Technical Feasibility**
   - For each concept, assess:
     - Are the required AI capabilities available today? (LLM quality, vision, tool use, etc.)
     - What integrations are needed?
     - What are the technical risks?
   - Flag infeasible concepts or note technical risks

6. **Define Customer Value & Pricing**
   - For each concept:
     - What is the customer benefit? (time saved, cost reduced, quality improved)
     - How would we price this? (subscription, usage, hybrid)
     - Why would customers adopt vs. using incumbents?

7. **Assess Differentiation**
   - For each concept:
     - How does this differ from incumbent approach?
     - Why would this approach work better?
     - What defensibility mechanisms exist?

8. **Synthesize Recommendations**
   - Identify 2–3 most promising concepts for detailed scoring
   - Note which concept directions seem most viable given market context
   - Flag assumptions that need validation

---

## Data Sources & Integrations

### Research References (Agent Uses During Ideation)
- **AI Capability Benchmarks:** Latest LLM capabilities (GPT-4, Claude, Llama), vision models, tool use frameworks
- **Agent Framework Documentation:** LangChain, AutoGen, Claude Agents, ControlFlow (for understanding what's technically feasible)
- **Case Studies of Agent-First Companies:** Examples of companies successfully built on AI agents (for inspiration and proof of concept)
- **Industry Reports:** Gartner, Forrester reports on market trends and incumbent positioning

### External Data Accessed
- Company websites and marketing (from landscape report)
- Customer reviews and forum discussions (from pain catalog)
- Patent filings (if relevant to competitive positioning)

---

## Agent Prompt Strategy

### System Prompt / Role Definition

```
You are a startup ideation specialist and operational strategist with deep expertise
in AI agents and autonomous systems. Your task is to generate multiple startup concepts
that address validated market pain points using AI agents as core operational infrastructure.

You think creatively but grounded. You generate concepts that are:
1. Grounded in real customer pain (from the pain catalog)
2. Technically feasible with today's AI capabilities
3. Fundamentally different from incumbent approaches
4. Designed with agents as the primary operating leverage

You actively explore different ideation directions:
- Incremental improvements on incumbent models
- New market entry models (different channels, segments, pricing)
- Radical reimaginings of how the work gets done

When ideating a concept, you ask yourself:
- Which specific pain(s) does this solve?
- How would agents do this work better/cheaper than humans?
- Why would a customer choose this over incumbents?
- What would break this concept (what assumptions might be wrong)?
- How defensible is this against incumbent response?

Your concepts should be specific enough that a developer could prototype one,
but grounded enough that they're validated by market data.
```

### Task Structure & Prompting

**Phase 1: Context Absorption & Pain Mapping**
```
You are given:
1. A landscape report (incumbent positioning, value chain, weaknesses)
2. A pain catalog (customer problems, severity, personas)
3. Enabling signals (technology breakthroughs making this newly solvable)

First, synthesize:
- What are the top 5 pain themes customers care most about?
- Which stages of the value chain are most human-intensive?
- Where are incumbents most vulnerable?
- What AI capabilities enable new approaches? (recent LLM advances, tool use, etc.)

Output: A 1-page synthesis of market context and ideation focus areas.
```

**Phase 2: Divergent Ideation**
```
Now generate 25–30 raw concept ideas. Use multiple ideation frameworks:

FRAMEWORK 1: By Pain Theme (for each top 5 pain, generate 2–3 concepts)
  Pain 1: "Integration friction"
  Concept A: "Middleware layer that seamlessly integrates with customer systems"
  Concept B: "White-label agent service that customers embed in their own workflows"
  Concept C: "Marketplace of task-specific agents for different integration scenarios"

FRAMEWORK 2: By Incumbent Weakness
  Weakness: "Incumbents are feature-bloated and slow to customize"
  Concept: "Minimal, verticalized solution for [segment]"

FRAMEWORK 3: By Operational Model
  Model A: "Lightweight SaaS with embedded agents" (low touch, high automation)
  Model B: "Hybrid human + agent service" (higher touch, better edge case handling)
  Model C: "Embedded agent library customers integrate themselves"

FRAMEWORK 4: By Pricing Model
  Model A: "Subscription per user/team"
  Model B: "Usage-based (per transaction/action)"
  Model C: "Marketplace with revenue share"

FRAMEWORK 5: By Degree of Disruption
  Incremental: "Better version of incumbent approach"
  Transformational: "Different market model (e.g., moving from software to service)"
  Radical: "Fundamentally reimagine who does the work and how"

Output: 25–30 concept bullets (2–3 sentences each), organized by framework.
```

**Phase 3: Clustering & Selection**
```
Review your 25–30 raw concepts. Group into concept families:
- Family A: Integration-focused concepts (5–7 related ideas) → Pick 2 strongest
- Family B: Vertical-focused concepts (5–7 related ideas) → Pick 2 strongest
- Family C: Operational model shifts (5–7 related ideas) → Pick 2 strongest
- Family D: Pricing innovation (3–5 related ideas) → Pick 1–2 strongest

Target: Select 8–12 concepts from your 25–30 raw ideas.
Filter for: diverse positioning, technical feasibility, market grounding.

For each selected concept, write 2–3 paragraphs expanding the idea.
```

**Phase 4: Agent Architecture Design**
```
For each of your 8–12 concepts, now design the operational architecture:

1. What is the primary work that needs to be done for the customer?
2. Which agents are needed to do this work?
   For each agent:
   - Agent name and role
   - What it takes as input, what it produces
   - What AI capabilities it needs (language, vision, tool use, etc.)
   - When does it escalate to a human (decision boundaries)?
3. What is the % of work handled by agents vs. humans?
   (Ideally: 80%+ agent-handled; 20%- human escalations)
4. What is the cost structure?
   (Agent compute cost vs. traditional human labor cost for same work)

This is critical: the concept should show cost/operational advantage from
agent automation. If it doesn't, is it really "agent-first"?
```

**Phase 5: Feasibility & Differentiation Check**
```
For each concept, now do a feasibility and differentiation check:

FEASIBILITY:
- Required AI capabilities: (LLM, vision, tool use, multi-step reasoning)
- Are these available today? (Yes / Available soon / No)
- External dependencies: (APIs, integrations, data requirements)
- Integration complexity: (Simple / Moderate / Complex)
- Technical risks: (What could make this not work?)

DIFFERENTIATION:
- Incumbent approach: (How do they currently solve this?)
- This concept approach: (How is this different?)
- Structural advantage: (Why is this approach fundamentally better?)
- Defensibility: (What makes this hard to copy? Network effects? Data? Switching costs?)

Output: Feasibility assessment and differentiation statement for each concept.
```

**Phase 6: Customer Value & Pricing**
```
For each concept, define customer value and initial pricing:

CUSTOMER VALUE:
- Quantified benefit: (e.g., "40% time savings", "$200K annual cost reduction")
- How do we measure success for the customer?

PRICING:
- Model: (subscription / usage / hybrid)
- Price point range: (e.g., "$300–$500/month")
- Rationale: (Why this price? Willingness to pay from pain catalog? Incumbent pricing comparison?)

Go-to-Market Sketch:
- First target segment: (which persona / company size first?)
- Why will they adopt: (what makes them early adopters?)
- How do we reach them: (sales channel, marketing approach)
```

**Phase 7: Synthesis**
```
Review all your designed concepts (8–12). Now synthesize:

1. Diversity check: Do you have a good mix of:
   - Incremental improvements vs. radical reimaginings?
   - Different market segments?
   - Different agent architectures?
   - Different pricing models?

2. Top promising directions:
   - Which 2–3 concepts seem most likely to work? Why?
   - What gives you confidence in these?

3. Key themes across concepts:
   - What patterns emerge? (e.g., "Many concepts focus on integration as differentiator")
   - What assumptions show up repeatedly? (Which need validation?)

4. Assumptions that need validation:
   - For each concept, list 1–3 critical assumptions
   - Which assumptions should the Scorer and later validators focus on?

Output: Synthesis note with diversity assessment, top concepts, key themes, and assumptions.
```

### Few-Shot Examples

**Example 1: Legal Tech Concept Generation**

**Input:** Landscape shows incumbents are feature-bloated, don't integrate well. Pain catalog shows "integration hell" is top pain (65% of users).

**Ideation Process:**
- Divergent phase generates 25 concepts, including:
  - "Integration middleware that plugs into law firm systems"
  - "Embedded AI research agent for specific contract types"
  - "Vertical SaaS for real estate law (only handles real estate contracts)"
  - "AI-as-service: firms call an API, AI does the research"

- Clustering phase selects 8 strongest concepts:
  1. "Contract Research Agent" - Automates legal research for specific contract types
  2. "Integration Layer" - Sits between firm systems and data sources; automates data flow
  3. "Vertical Legal Assistant" - Deep expertise in one practice area (M&A, real estate, IP)
  4. "Human-in-Loop Service" - Junior attorney + AI; AI does research, attorney reviews
  5. "Legal Document AI" - Vision-based document understanding and extraction
  6. "Compliance Automation" - Automated regulatory compliance checking for contracts
  7. "Deal Room Manager" - Agent manages all deal-related information and team coordination
  8. "Training Data Generator" - Builds custom training sets for firm-specific contracts

- Agent Architecture phase: For "Contract Research Agent":
  - Primary agent: Research Agent (takes contract, produces legal precedents and analysis)
  - Supporting agent: Document Reader Agent (extracts contract terms)
  - Human role: Senior attorney reviews AI analysis, adds custom reasoning
  - Cost thesis: Research takes 20% of human attorney time; 80% can be agent-handled, saving $80K+/year per firm

- Differentiation: Incumbents provide research tools; this provides a research partner that improves over time (learns from attorney feedback)

**Output:** Concept sketch describing the agent-first architecture, target (mid-market law firms), pricing ($300/month per attorney), and feasibility (high; LLM research is proven).

**Example 2: VC Due Diligence Concept Generation**

**Input:** Landscape shows due diligence is 80% manual research. Pain catalog shows "200 hours per deal of research" is top pain.

**Ideation Process:**
- Divergent phase generates 25 concepts, including:
  - "Deal Research Agent: feeds on news, funding data, public documents; produces analysis"
  - "Market Analysis Agent: competitive landscape, TAM sizing, growth analysis"
  - "Technical Due Diligence Agent: analyzes startup tech stack, architecture, security"
  - "Team Assessment Agent: analyzes founding team backgrounds, skill gaps, conflict checks"

- Clustering: Selects 8 strongest (various combinations of agents)

- Agent Architecture for "Full DD Agent Suite":
  - Research Agent: Gathers and synthesizes public information
  - Market Agent: Competitive and TAM analysis
  - Tech Agent: Technical assessment (security, scalability, etc.)
  - Team Agent: Founder and team analysis
  - Synthesis Agent: Produces final DD memo
  - Human role: Partner reviews memo, asks clarifying questions, makes judgment calls
  - Cost thesis: Reduces deal research from 200 hours ($50K at junior analyst rates) to 40 hours ($10K), plus 20 hours of partner time ($20K) = $30K vs. $50K per deal

**Output:** Concept sketch with agent architecture, target (VC/PE firms analyzing 3+ deals/quarter), pricing (per-deal pricing $5K–$10K, or subscription $50K/month for active firms), and feasibility (high; LLM research is proven capability).

### Edge Case Handling

**Problem:** Generated concept is too similar to incumbent approach
- **Solution:** Explicitly ask: "How does this differ structurally from what incumbents do?" If unclear, this isn't a distinct concept. Discard or merge.

**Problem:** Concept relies on AI capabilities that don't exist yet
- **Solution:** Note in technical feasibility: "Requires vision + reasoning at superhuman level; available in ~12–24 months." Concepts can flag as "future-ready" if grounded in clear capability roadmap.

**Problem:** Concept is agent-forward but not actually cheaper/better than human alternative
- **Solution:** This defeats the purpose of "agent-first." Reassess: Is there a cost/efficiency advantage, or is it just "AI that does what humans do"? If not, discard.

**Problem:** Multiple concepts are nearly identical
- **Solution:** Merge them and make the differentiation clear. Example: "Concept A targets law firms; Concept B targets in-house counsel."

**Problem:** Concept seems promising but you're not confident in the market fit
- **Solution:** That's fine. Include it but flag the assumptions and note that it needs validation. Scoring phase will evaluate.

---

## Error Handling & Edge Cases

### Ideation Quality Issues

**Problem:** Concepts are too vague or lack sufficient detail
- **Solution:** Each concept should answer: What problem? For whom? How does it work? Why is it better? If any are missing, reject concept or force clarification.

**Problem:** Concepts are incremental copies of incumbents with "AI-powered" slapped on
- **Solution:** These fail the agent-first test. Question: Does this concept have a structural advantage (better unit economics, faster, more customizable)? If not, reject.

**Problem:** Generated concepts don't actually address the identified pain points
- **Solution:** Reject. Go back to pain catalog and re-ground concepts in specific pains. Concept should explicitly cite which pain(s) it solves.

### Architecture Issues

**Problem:** Agent architecture is unclear (what exactly does each agent do?)
- **Solution:** For each agent, specify: inputs, outputs, decision logic, escalation criteria. If you can't specify, it's not a concrete concept.

**Problem:** Concept assumes agent can do something that's not technically feasible
- **Solution:** Flag in feasibility section. Example: "Assumes visual document understanding at 95% accuracy; current state-of-art is 87%."

**Problem:** Concept would require extensive human oversight (defeating agent-first thesis)
- **Solution:** Redesign or reject. For agent-first to work, agent must handle 70%+ of cases autonomously.

### Market Fit Issues

**Problem:** Concept doesn't have clear defensibility
- **Solution:** Concepts can be commoditizable (fine, compete on execution/brand). But they should have *some* defensibility (data, switching costs, network effects, or proprietary techniques). If none, note as risk.

**Problem:** Concept targets a segment that "doesn't exist" or is too small
- **Solution:** This is a market validation risk, not a concept generation failure. Include the concept but flag the assumption ("assumes segment has $100M+ TAM") for later validation.

---

## Performance & Scaling

### Expected Throughput & Latency

- **Per-Market Ideation Time:** 6–10 hours of agent runtime (divergent ideation + architecture design is time-intensive)
- **Expected Output:** 8–12 well-defined concept sketches per market
- **Latency Requirement:** Should complete within 1–2 business days
- **Quality Gating:** Human review of all concepts before advancing to Scorer

### Optimization Opportunities

1. **Reuse Concept Templates:** Store templates for common concept types (vertical SaaS, platform/marketplace, service, etc.) to accelerate design.
2. **Incremental Refinement:** If revisiting a market, start with prior concepts and iterate (don't regenerate from scratch).
3. **Parallelization:** Generate multiple concept sketches in parallel; design architectures in parallel.

---

## Dependencies

### Upstream Dependencies
- **Landscape Analyst (1.1):** Consumes landscape report (incumbent weaknesses, value chain, barriers)
- **Pain Extractor (1.2):** Consumes pain catalog (which pains to solve, severity, personas)
- **Phase 0 Signals:** Uses enabling signals to validate technical feasibility

### Downstream Dependencies
- **Concept Scorer (1.4):** Consumes all concept sketches; rates and ranks them
- **Concept Selector (1.5):** Selects top-ranked concepts for validation
- **Phase 2 (Validation):** Selected concepts are validated in detail

### External Dependencies
- **AI capability research:** Latest LLM benchmarks, agent frameworks, tool-use capabilities
- **Market data:** Incumbent pricing, customer demographics (from landscape + pain reports)

---

## Success Metrics

### Primary Metrics

1. **Concept Quality:** All 8+ concepts are specific, grounded in pain points, and define clear agent architectures. Each could be summarized to an investor in 2 minutes. ✓ = success
2. **Pain Mapping:** Each concept explicitly addresses 1–3 pain points from the catalog. 100% of top pain themes have at least one concept addressing them. ✓ = success
3. **Agent-First Design:** Each concept has agents handling 70%+ of primary work. Cost/efficiency advantage vs. human alternative is documented. ✓ = success
4. **Diversity:** Concept set includes mix of incremental (30%), transformational (40%), and radical (30%) ideas. ✓ = success
5. **Feasibility:** All concepts use AI capabilities available today (or flagged as near-term). No concept relies on impossible assumptions. ✓ = success

### Secondary Metrics

6. **Actionability:** Concept Scorer reports that concepts are detailed enough to score across multiple dimensions without needing additional research.
7. **Market Grounding:** After Phase 2 validation, at least one validated concept maps back to concepts from this generation (i.e., weren't tangentially related).
8. **Inspiration Quality:** Team reports that concepts generate excitement and novel ideas (not just incremental tweaks).

### How to Measure

- **During generation:** Do concepts cite specific pain themes and landscape insights?
- **After scoring:** Did high-scoring concepts describe clear agent architectures?
- **After validation:** Did validated concepts remain true to agent-first design, or did they become more human-heavy?

---

## Implementation Notes

### Suggested Tech Stack

**Language & Agents:**
- Python with Anthropic SDK (Claude Opus for creative reasoning and synthesis)
- Agentic loop: Agent generates concepts, evaluates them against criteria, refines based on feedback
- Use ReAct or similar for step-by-step reasoning and validation

**Ideation & Brainstorming:**
- **LLM for ideation:** Claude Opus or GPT-4 for divergent thinking
- **Prompt templates:** Store ideation frameworks as structured prompts to guide agent
- **Batch processing:** Generate multiple concept variants in parallel, then select strongest

**Data Management:**
- **PostgreSQL:** Store concepts, their scores, and design decisions
- **MongoDB:** Flexible schema for concept sketches (varying level of detail)
- **Redis:** Caching of pain catalogs and landscape reports during ideation session

**Visualization & Export:**
- **Markdown export:** Concepts formatted as readable markdown documents
- **JSON export:** Structured export for downstream scoring component
- **Canvas/Excalidraw:** Simple diagram generation for agent architecture sketches

### Implementation Phases

**Phase 1: MVP (Week 1–2)**
- Implement basic ideation loop (pain-to-concept mapping)
- Generate concepts manually, structure outputs
- Store in JSON format
- Output: 8–12 concept sketches in markdown

**Phase 2: Enhancement (Week 3–4)**
- Implement automated ideation (agent generates 25–30 raw concepts)
- Automated clustering and selection (agent groups and ranks concepts)
- Agent architecture auto-design (agent specifies agents, inputs, outputs, escalations)
- Concept comparison visualization (matrix of concepts vs. dimensions)

**Phase 3: Refinement (Week 5+)**
- Incremental concept refinement (build on prior concepts rather than generate from scratch)
- Feasibility auto-check (agent cross-references concept with AI capability matrix)
- Marketing angle generation (agent suggests positioning and messaging for each concept)
- Interactive refinement (human reviewer adjusts concept, agent refines)

### Code Patterns & Libraries

**Ideation Loop Pattern:**
```python
def generate_concepts(landscape, pain_catalog, signals):
    """Main ideation loop."""
    state = {
        "raw_concepts": [],
        "clustered_concepts": [],
        "final_concepts": [],
        "phase": "divergent"
    }

    # Phase 1: Divergent ideation
    raw = agent.divergent_ideate(
        landscape,
        pain_catalog,
        signals,
        frameworks=["by_pain", "by_weakness", "by_model"]
    )
    state["raw_concepts"] = raw
    state["phase"] = "clustering"

    # Phase 2: Clustering and selection
    clustered = agent.cluster_and_select(
        state["raw_concepts"],
        target_count=10
    )
    state["clustered_concepts"] = clustered
    state["phase"] = "architecture"

    # Phase 3: Agent architecture design
    for concept in state["clustered_concepts"]:
        architecture = agent.design_architecture(concept, landscape)
        concept["architecture"] = architecture
    state["phase"] = "feasibility"

    # Phase 4: Feasibility check
    for concept in state["clustered_concepts"]:
        feasibility = agent.check_feasibility(concept, signals)
        concept["feasibility"] = feasibility
    state["final_concepts"] = state["clustered_concepts"]

    return generate_report(state)
```

**Concept Template Pattern:**
```python
CONCEPT_TEMPLATE = {
    "concept_id": None,
    "concept_name": None,
    "tagline": None,
    "overview": {
        "description": None,
        "core_problem_addressed": [],
        "customer_segment": None,
        "positioning": None
    },
    "product_concept": {
        "what_it_does": None,
        "primary_features": [],
        "customer_experience": {}
    },
    "agent_first_architecture": {
        "primary_agents": [],
        "supporting_agents": [],
        "human_roles": [],
        "operational_cost_thesis": None
    },
    # ... etc
}

def create_concept_sketch(name, pain_addresses, agents):
    """Create a structured concept sketch."""
    concept = CONCEPT_TEMPLATE.copy()
    concept["concept_name"] = name
    concept["core_problem_addressed"] = pain_addresses
    concept["agent_first_architecture"]["primary_agents"] = agents
    return concept
```

### Testing & Validation

- **Concept validity:** Does each concept address a pain from the catalog? (automated check)
- **Agent feasibility:** Are required capabilities available today? (manual validation)
- **Diversity check:** Is the concept set actually diverse (not just variants on one idea)?
- **Concept clarity:** Can an investor understand the concept in 2 minutes? (human review)

### Common Pitfalls to Avoid

1. **Vague Concepts:** "AI-powered solution for X" is not a concept. Needs specificity: what exactly does it do? What agents? What output?
2. **Incumbent Copies:** Avoid just adding "AI" to incumbent solution. Look for structural changes in business model, operations, or market positioning.
3. **Infeasible Concepts:** Concepts relying on AI capabilities that don't exist (e.g., flawless vision, perfect reasoning). Flag if near-term, reject if far-future.
4. **Missing Economics:** Concepts should show cost/efficiency advantage. "AI that does what humans do" isn't compelling unless it's cheaper.
5. **Over-Specification:** Concepts should be detailed enough to evaluate, but not so detailed that they're a business plan. Aim for 1–2 pages per concept.

---

## Example Output (Abbreviated)

**Input:**
- Landscape: Legal tech dominated by LexisNexis, Westlaw; "integration hell" is widespread
- Pain: 65% of users complain about integration friction; willing to pay $300+/month to solve
- Signals: LLMs now capable of document understanding and cross-system reasoning

**Output: 2 Sample Concepts**

```markdown
## Concept 1: "Contract Intelligence Agent"

**Tagline:** "AI research partner for your contracts."

**Overview:**
When law firms review contracts, they spend 40% of time researching precedents and
related law. This is repetitive, manual work. Contract Intelligence Agent (CIA) automates
this research using an AI agent trained on legal databases.

**Problem Addressed:** Integration friction (#pain_002), Research time burden (#pain_003)

**Core Product:**
Firms upload a contract. The CIA agent:
1. Extracts key terms using vision (handles scanned PDFs)
2. Researches relevant precedents, similar contracts, case law
3. Flags risks and inconsistencies
4. Produces a research memo for attorney review

**Agent Architecture:**
- Document Reader Agent: Extracts key terms from contracts (vision + text)
- Research Agent: Finds precedents and case law (tool use + LLM reasoning)
- Risk Analyzer Agent: Identifies potential issues (structured reasoning)
- Human: Senior attorney reviews findings, makes judgment calls

Agent-Handled: 85% of research work
Human-Handled: 15% (judgment, edge cases, client communication)

**Value Prop:**
Cuts research time from 8 hours → 2 hours (75% savings)
Estimated annual savings: $100K per firm

**Pricing:** $400/month per contract reviewer (or $2,500 per deal)

**Differentiation:**
Incumbents offer research tools (Westlaw, LexisNexis). We're a research partner
that improves over time as attorneys provide feedback on AI findings.

---

## Concept 2: "Deal Room Manager"

**Tagline:** "AI orchestrates all information and communications for a deal."

**Overview:**
Large deals (M&A, financing, real estate) involve many stakeholders, documents,
and decisions. Information gets siloed across email, shared drives, meetings.
The Deal Room Manager is an AI agent that owns the single source of truth
for a deal, orchestrates all communications, and ensures nothing falls through cracks.

**Problem Addressed:** Communication breakdowns (#pain_001), Coordination friction (#pain_004)

**Core Product:**
Stakeholders communicate with the DRM via email, Slack, or portal. The agent:
1. Tracks all deal documents and updates
2. Sends reminders about upcoming deadlines
3. Summarizes deal status across stakeholders
4. Flags risks or action items needing attention
5. Integrates with deal management systems (if available)

**Agent Architecture:**
- Information Aggregation Agent: Gathers deal info from emails, docs, meetings
- Communications Agent: Sends updates, reminders, summaries to stakeholders
- Risk Detection Agent: Flags missing info, overdue items, potential risks
- Escalation Agent: Identifies issues needing human attorney review
- Human: Attorney makes strategic decisions, handles complex negotiations

Agent-Handled: 80% of coordination work
Human-Handled: 20% (strategy, relationship management, decisions)

**Value Prop:**
Reduces deal coordinator role (currently 1 FTE per 2–3 deals) to 0.25 FTE
Estimated savings: $150K per firm per year

**Pricing:** $500/month per active deal (or $10K upfront)

**Differentiation:**
Unlike document management systems (which are passive), DRM is active —
proactively managing communications and keeping deals on track.
```

---

