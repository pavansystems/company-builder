# Component Specification: GTM Strategist (3.3)

## Purpose & Responsibility

The GTM Strategist designs the go-to-market plan—how the startup acquires its first customers, launches to market, and establishes initial traction. It takes the validated concept, business model, customer personas, and agent architecture and produces a concrete 90-day launch plan that specifies target customer segments, acquisition channels, messaging, pricing positioning, and the split between agent-driven and human-driven GTM activities.

The GTM Strategist owns:
- Target customer segment selection and early-adopter positioning
- Channel strategy (inbound, outbound, partnerships, content)
- Messaging and positioning framework
- Product-market fit validation tactics (how to test if our thesis is correct)
- Launch timeline and milestones
- Agent vs. human resource allocation for GTM activities
- Pre-launch and post-launch tactics

## Inputs

**Source:** Phase 2 and Phase 3 outputs.

**Input Schema:**

```json
{
  "concept_id": "string (UUID)",
  "concept_name": "string",
  "target_problem": "string",
  "value_proposition": "string",
  "business_model": {
    "revenue_model": "string",
    "pricing_tiers": [
      {
        "tier_name": "string",
        "monthly_price": "float",
        "target_segment": "string"
      }
    ],
    "customer_journey": {
      "awareness_channels": ["list"],
      "awareness_agent_percent": "number"
    }
  },
  "customer_validation": {
    "early_adopters": [
      {
        "persona_name": "string",
        "company_size_range": "string",
        "pain_severity": "string",
        "willingness_to_pay": "float",
        "segment_size_estimate": "number"
      }
    ],
    "search_volume_monthly": "number",
    "community_discussion_volume": "string",
    "existing_solution_satisfaction": "string"
  },
  "competitive_landscape": {
    "incumbents": ["list of {name, price, positioning}"],
    "competitive_advantage": "string",
    "unmet_customer_need": "string"
  },
  "agent_architecture": {
    "sales_capable": "boolean (can agents handle sales?)",
    "gtm_capable_agents": ["list of agent roles that support GTM]",
    "gtm_agent_percent": "number 0-100",
    "escalation_triggers": ["list"]
  },
  "financial_constraints": {
    "available_budget_month_1": "float",
    "available_budget_month_3": "float",
    "cac_target": "float (from business model)",
    "target_month_3_customers": "number",
    "target_month_12_customers": "number"
  }
}
```

## Outputs

**Destination:** Risk Analyst (3.4), Resource Planner (3.5), Blueprint Packager (3.6).

**Output Schema:**

```json
{
  "gtm_plan_id": "string (UUID)",
  "concept_id": "string (parent reference)",
  "executive_summary": "string (2-3 paragraph overview of the GTM strategy)",
  "target_customer": {
    "primary_segment": {
      "persona_name": "string",
      "company_characteristics": "string (size, industry, use case, pain point)",
      "decision_maker_title": "string (who buys?)",
      "segment_size_estimate": "number (how many addressable customers?)",
      "willingness_to_pay": "float (monthly, annual, per transaction)",
      "purchase_frequency": "string (one-time, annual renewal, monthly subscription)",
      "why_this_segment_first": "string (rationale for targeting this segment in launch)"
    },
    "secondary_segments": [
      {
        "persona_name": "string",
        "segment_size_estimate": "number",
        "timeline_to_pursue": "string (e.g., 'Month 6')"
      }
    ],
    "market_sizing": {
      "primary_segment_tam": "float (total addressable market)",
      "primary_segment_som": "float (serviceable obtainable market - realistic for year 1)",
      "year_1_penetration_rate_target": "number 0-100 (% of SOM we target)",
      "year_1_customer_target": "number"
    }
  },
  "positioning_and_messaging": {
    "positioning_statement": "string (e.g., 'The only [category] built for [segment] who [pain point]')",
    "value_proposition": "string",
    "key_messaging_pillars": [
      {
        "pillar_name": "string",
        "messaging": "string",
        "supporting_evidence": "string"
      }
    ],
    "differentiation_vs_competitors": {
      "primary_differentiator": "string",
      "secondary_differentiators": ["list"],
      "how_to_communicate": "string (how do we make the case concretely?)"
    },
    "pricing_positioning": "string (e.g., '40% cheaper than incumbent, same quality')",
    "target_messaging_by_persona": [
      {
        "persona": "string",
        "key_message": "string",
        "tone": "string"
      }
    ]
  },
  "channel_strategy": {
    "primary_channels": [
      {
        "channel_name": "string (e.g., 'Inbound SEO / Content', 'Direct Outreach', 'Community')",
        "why_this_channel": "string (why does our target customer hang out here?)",
        "tactics": [
          {
            "tactic_name": "string",
            "description": "string",
            "frequency": "string (e.g., '2 posts per week', '50 outreach emails per day')",
            "agent_vs_human_split": "object {agent_percent, human_percent}",
            "estimated_cost": "float (monthly)",
            "expected_outcome": "string (e.g., '10 leads per month')"
          }
        ],
        "expected_monthly_leads": "number",
        "expected_cost_per_lead": "float",
        "timeline_to_traction": "string (e.g., 'Month 1 for outreach, Month 3+ for content')"
      }
    ],
    "secondary_channels": [
      {
        "channel_name": "string",
        "tactics": ["list"],
        "timeline": "string (e.g., 'Month 3+')"
      }
    ],
    "channel_priority_matrix": "string (which channels get the most effort first?)"
  },
  "launch_plan": {
    "pre_launch_phase": {
      "duration": "string (weeks, typically 4-6)",
      "key_activities": [
        {
          "activity": "string",
          "owner": "string (agent|human|both)",
          "timeline": "string",
          "success_metric": "string"
        }
      ],
      "milestones": ["list of strings"],
      "launch_readiness_checklist": ["list of must-haves"]
    },
    "launch_day_tactics": {
      "announcement_channels": ["list (e.g., 'HackerNews', 'ProductHunt', 'Twitter')"],
      "announcement_story": "string (the narrative)",
      "timing": "string (which day of week, time of day?)",
      "expected_launch_week_customers": "number",
      "launch_day_owner": "string (human or agent?)"
    },
    "post_launch_phase": {
      "duration": "string (weeks/months until 'launch momentum' plateaus)",
      "week_by_week_tactics": [
        {
          "week": "number",
          "tactic": "string",
          "expected_cumulative_customers": "number"
        }
      ]
    }
  },
  "90_day_roadmap": [
    {
      "period": "string (e.g., 'Days 1-14')",
      "focus": "string (e.g., 'Establish presence and validate core assumptions')",
      "key_activities": ["list of strings"],
      "success_metrics": {
        "minimum": "string (e.g., '5 customers')",
        "target": "string (e.g., '10 customers')",
        "stretch": "string (e.g., '20 customers')"
      },
      "decision_point": "string (do we pivot, double down, or pause?)"
    }
  ],
  "customer_acquisition_mechanics": {
    "awareness_to_trial_funnel": {
      "top_of_funnel": "number (potential customers per month)",
      "consideration_rate": "number 0-1 (% who move to consideration)",
      "trial_signup_rate": "number 0-1 (% of considered who try)",
      "conversion_rate": "number 0-1 (% of trial who become paying customers)",
      "implied_cac": "float (cost to acquire one customer)"
    },
    "sales_motion": "string (self-serve|assisted|hybrid)",
    "trial_length": "string (duration of free trial, if applicable)",
    "time_to_first_value": "string (how quickly can a customer see value?)",
    "onboarding_dependency": "string (can onboarding agents handle launch volume?)"
  },
  "messaging_and_content_strategy": {
    "brand_story": "string (why does this company exist?)",
    "content_pillars": [
      {
        "pillar": "string (e.g., 'Industry trends', 'How-tos', 'Customer stories')",
        "formats": ["string (blog, video, podcast, Twitter, etc.)"],
        "frequency": "string (e.g., '2x per week')",
        "agent_vs_human": "object {agent_percent (for creation/curation), human_percent (for strategy)}"
      }
    ],
    "early_adopter_specific_messaging": "string (what specifically resonates with our early adopters?)",
    "objection_handling": [
      {
        "objection": "string (e.g., 'Why should we switch from incumbent?')",
        "response": "string"
      }
    ]
  },
  "partnership_and_community_strategy": {
    "potential_partnerships": [
      {
        "partner_type": "string (influencer|complementary_product|publisher|community)",
        "partner_names": ["list of specific companies/people"],
        "why_them": "string",
        "asks": ["list of strings (what do we want from them?)"],
        "timeline": "string"
      }
    ],
    "community_engagement": {
      "target_communities": ["list (e.g., 'Reddit r/marketing', 'LinkedIn groups', 'Slack communities')"],
      "engagement_tactics": ["list"],
      "agent_capability": "string (can agents engage authentically in communities?)"
    }
  },
  "success_metrics_and_pmf_signals": {
    "primary_metrics": [
      {
        "metric": "string (e.g., 'Monthly customers')",
        "month_1_target": "number",
        "month_3_target": "number",
        "month_6_target": "number"
      }
    ],
    "pmf_indicators": [
      {
        "indicator": "string (e.g., 'Net Promoter Score > 50', 'Monthly churn < 5%', 'Organic referrals > 30% of new customers')",
        "how_to_measure": "string",
        "target_threshold": "string"
      }
    ],
    "go_no_go_decision_triggers": [
      {
        "metric": "string",
        "go_threshold": "number/string",
        "no_go_threshold": "number/string",
        "decision_point": "string (e.g., 'Month 3 review')"
      }
    ]
  },
  "budget_and_resource_allocation": {
    "channel_budget_breakdown": [
      {
        "channel": "string",
        "month_1_budget": "float",
        "month_2_budget": "float",
        "month_3_budget": "float",
        "rationale": "string"
      }
    ],
    "total_gtm_budget": {
      "month_1": "float",
      "month_2": "float",
      "month_3": "float",
      "total_90_days": "float"
    },
    "gtm_team_structure": {
      "month_1_headcount": "number (humans only)",
      "month_1_roles": ["list of role titles"],
      "month_3_headcount": "number",
      "month_3_roles": ["list"]
    },
    "agent_vs_human_cost": {
      "agent_costs_90_days": "float",
      "human_costs_90_days": "float",
      "tools_and_software_costs_90_days": "float"
    }
  },
  "risk_assessment": {
    "key_assumptions": [
      {
        "assumption": "string (e.g., 'Our target segment will respond to cold outreach')",
        "confidence": "number 1-10",
        "if_wrong": "string (what's the impact?)",
        "mitigation": "string (how will we test this early?)"
      }
    ],
    "launch_risks": [
      {
        "risk": "string",
        "likelihood": "string (rare|occasional|frequent)",
        "impact": "string (low|medium|high)",
        "mitigation": "string"
      }
    ],
    "competitive_response_risk": "string (how might competitors respond to our launch?)"
  },
  "go_no_go_recommendation": {
    "recommendation": "string (go|conditional|no-go)",
    "rationale": "string",
    "flagged_concerns": ["list"],
    "success_factors": ["list (what must be true for this to work?)"]
  },
  "metadata": {
    "created_at": "ISO 8601 timestamp",
    "version": "string",
    "status": "string (draft|reviewed|approved)",
    "dependencies": ["list of upstream components"],
    "next_phase_consumers": ["list of downstream components"]
  }
}
```

## Core Logic / Algorithm

### Step 1: Select and Refine Target Customer Segment

**Input:** Early-adopter personas (from customer validation), market sizing, business model pricing tiers.

**Process:**
1. **Primary segment selection:**
   - Rank early-adopter personas by: segment size (SOM), pain severity, willingness-to-pay, reachability (can we actually reach them?), and urgency (how soon will they adopt?).
   - Select the segment that is:
     - Large enough to support a viable business (TAM > $100M for most SaaS, but smaller for niche products).
     - Accessible (we know where they hang out, can reach them affordably).
     - Urgent (they're actively seeking solutions now, not "would be nice in 2 years").
     - Well-aligned with our positioning and pricing.

2. **Go-to-market segment vs. expansion segments:**
   - Launch GTM focused on the primary segment. Success = 50 to 100+ customers in this segment.
   - Identify secondary segments for Month 6+ (once primary segment is stable).
   - Example: Launch with "SMB SaaS founders" (primary), then expand to "agencies" (secondary Month 6), then "enterprises" (secondary Month 12).

3. **Document the persona deeply:**
   - Company size, industry, job titles of decision-makers.
   - What is their current pain (and is it urgent enough to switch?).
   - What are they currently spending on solutions.
   - What would convince them to try us?
   - What would cause them to churn?

**Output:** Primary target segment with deep persona understanding + rationale.

### Step 2: Develop Positioning and Messaging

**Input:** Target segment, competitive landscape, value proposition, differentiation.

**Process:**
1. **Craft positioning statement:**
   - Format: "The only [category] built for [segment] who [pain point], solving [core problem] with [key differentiator]."
   - Example: "The only email marketing platform built for e-commerce brands who want to drive repeat purchases without hiring a marketer, using AI-powered segmentation and personalization."
   - This should differentiate from competitors and resonate with the segment.

2. **Define key messaging pillars:**
   - Pillar 1: What problem does this solve? (the pain point is real and urgent)
   - Pillar 2: How does our solution work? (the mechanism; why we're different)
   - Pillar 3: What's the benefit? (the tangible outcome; usually ROI-focused)
   - Pillar 4: Why us? (competitive advantage, founder credibility, etc.)
   - Example:
     - Pillar 1: "Running email campaigns manually wastes 10+ hours per week."
     - Pillar 2: "Our AI automatically segments customers and personalizes emails based on purchase history."
     - Pillar 3: "Teams see 3x higher open rates and 50% more repeat orders in the first month."
     - Pillar 4: "We're built by founders who've done 8-figure e-commerce businesses; we know your problems firsthand."

3. **Translate messaging by persona and channel:**
   - LinkedIn: Professional, credibility-focused.
   - Twitter: Snappier, trend-responsive.
   - Reddit: Authentic, problem-focused (not salesy).
   - Cold email: Personalized, pain-point specific.
   - Example: For a CEO (LinkedIn): "Cut email ops from 10 hours to 1 per week." For an email specialist (Twitter): "Finally, an email tool built for people who actually know what they're doing."

4. **Develop objection handling:**
   - Common objections: "Why switch from [incumbent]?" "How is this different from [competitor]?" "We're too small for this."
   - For each, craft a response that acknowledges the concern and clarifies the differentiation.

**Output:** Positioning statement, messaging pillars, channel-specific messaging, objection responses.

### Step 3: Design Channel Strategy

**Input:** Target segment, available budget, GTM agent capabilities.

**Process:**
1. **Identify where the target segment hangs out and how they discover solutions:**
   - Run a mini research sprint: where do your target customers get information? (Google search, LinkedIn, Twitter, Reddit, industry forums, word-of-mouth, sales calls, etc.)
   - Rank channels by: reach (how many of our target segment use this channel?), accessibility (can we reach them cost-effectively?), and conversion likelihood (if we reach them here, will they care?).

2. **Design channel tactics for the top 2–3 channels:**
   - **Inbound SEO/Content:** Blog posts targeting the pain point. Target 1–2 posts per week on relevant keywords. Example: "How to reduce email ops time by 90%." Agents can write drafts; humans review and refine. Expect 2–4 weeks to see traffic, 8–12 weeks for meaningful leads.
   - **Outbound Sales/Direct Outreach:** Identify companies (via LinkedIn, company databases, warm intros) and reach out with personalized message. Agents can handle initial outreach, follow-ups, and meeting scheduling. Expect immediate (within 1 week) meetings, 30–40% response rate possible. CAC lower if you target the right accounts.
   - **Community:** Hang out in Reddit communities, Slack groups, forums where customers discuss the problem. Share insights, answer questions, position the solution as a natural fit. Agents can monitor and respond; humans make strategic decisions. Builds trust but slower to convert.
   - **Partnerships:** Partner with complementary products (e.g., e-commerce platform partners with email marketing tool). Gain access to their customer base through intros, webinars, revenue share. Slower to set up but high-quality leads.
   - **Paid Ads:** Google Ads (PPC targeting search intent), LinkedIn ads (targeting job titles/company size), Twitter promoted posts. Agents can manage bids and targeting based on performance. Fastest to volume but expensive; use once you've validated messaging.

3. **Estimate lead generation by channel:**
   - Formula: Reach (how many people exposed per month) × Click-through rate × Conversion rate = Qualified leads.
   - Inbound content: 5000 monthly views × 5% CTR × 20% conversion = 50 leads/month (but ramp is slow).
   - Outbound: 500 outreach emails × 40% response = 200 interested, × 20% conversion = 40 leads/month (immediate).
   - Community: 50 community members engaged × 10% conversion = 5 leads/month (slow to ramp).
   - Adjust based on segment size and reachability.

4. **Allocate budget and effort:**
   - Allocate 40–60% of budget to the fastest-scaling, highest-conviction channel (usually outbound for B2B, content for B2C).
   - Allocate 20–40% to a secondary channel (content for B2B, community for B2C).
   - Reserve 10–20% for testing new channels and quick pivots.

**Output:** Primary and secondary channel strategies with tactics, lead generation estimates, and budget allocation.

### Step 4: Design the Sales and Onboarding Funnel

**Input:** Business model customer journey, agent architecture (can agents handle sales/onboarding?), trial length (if any).

**Process:**
1. **Map the funnel:**
   - Stage 1: Awareness (they know we exist and what we do).
   - Stage 2: Interest (they understand the value and see us as a potential solution).
   - Stage 3: Trial/Evaluation (they're using the product or seeing a demo).
   - Stage 4: Purchase (they become a paying customer).
   - For each stage, specify: how long it lasts, what converts them to the next stage, agent vs. human involvement.

2. **Specify the sales motion:**
   - **Self-serve:** Customer signs up, tries the product, pays via Stripe. No human involvement. Time to purchase: 1–3 days. Works if product value is obvious and pricing is low (<$500/month). Agents can handle entire flow (welcome email, onboarding flow, payment processing).
   - **Assisted:** Customer gets a personalized demo from a sales rep. Time to purchase: 1–3 weeks. Needed if product is complex or price is high. Agents can: qualify leads, schedule demos, handle FAQ, follow up post-demo. Humans: deliver the demo and negotiate terms (if needed).
   - **Hybrid:** Low-price tiers are self-serve; high-price tiers are assisted. Most SaaS does this.

3. **Design the trial experience:**
   - Trial length: 14–30 days typical. Longer (30+ days) means lower conversion rates but better SMB adoption. Shorter (7–14 days) means higher conversion rates but faster failures if product is hard to use.
   - Trial success metric: What must the customer accomplish to see value? Example: "Complete first email campaign" or "Send first 1000 API calls." Agents can track this and prompt the customer.
   - Trial-to-paid conversion rate: Benchmark is 20–40% for B2B SaaS. If you're hitting < 15%, the product isn't resonating or trial isn't long enough.

4. **Specify the onboarding experience:**
   - Onboarding is critical: if the customer can't get set up and see value quickly, they churn.
   - Agent role: Onboarding agent sends welcome email, guides setup, connects integrations (if any), sends "first value" prompt.
   - Human role: For complex setups or high-value customers, a human CSM may do a setup call.
   - Success metric: Customer completes setup and takes a first action (sends first email, creates first campaign, etc.) within 3 days.

5. **Design the expansion/upsell funnel (for later months):**
   - When a customer hits usage limits or needs more features, how do they upgrade?
   - Agents can: detect upgrade triggers, send offer email, handle upgrade execution.
   - Humans can: for high-value customers, discuss custom needs and negotiate custom deals.

**Output:** Detailed funnel map with conversion rates, time to purchase, agent vs. human involvement.

### Step 5: Build the 90-Day Launch Roadmap

**Input:** All of the above.

**Process:**
1. **Days 1–14 (Pre-launch prep):**
   - Finalize the product MVP (should be stable enough to share).
   - Set up website, demo video, documentation.
   - Seed initial feedback with 5–10 friendly early adopters (founders' networks).
   - Prepare launch announcement and social media content.
   - Ensure onboarding/support agents are ready and tested.
   - Success metrics: 0 customers, but all systems go for launch.

2. **Days 15–30 (Launch week + immediate follow-up):**
   - Launch on Product Hunt, HackerNews, Twitter, or LinkedIn (choose 1–2 channels that reach your segment best).
   - Expected outcome: 50–500 signups depending on traction. (Most launches get 50–200.)
   - Day 1: Announcement goes out at a coordinated time (10am PT is typical for US audiences).
   - Days 2–7: Active engagement on announcement (respond to comments, address concerns, answer questions). Agent and founder should both engage.
   - Days 8–14: Follow-up with engaged non-customers ("why didn't you sign up?"). Agents handle some, humans do some. Use feedback to iterate messaging.
   - Success metrics: 20–50 signups, 2–5 paying customers, 50%+ of signups trying the product.

3. **Days 31–60 (Establish initial GTM motion):**
   - Scale whichever channel is working best from launch week.
   - If outbound is working: agents send 100+ cold emails per day, schedule 50+ demos per month.
   - If content/SEO is working: agents publish 2 posts per week on target keywords.
   - If community is working: ramp up engagement, start discussions, provide value.
   - Launch secondary channel (e.g., paid ads to amplify top-of-funnel).
   - Iterate based on feedback: what is resonating? What messaging lands? What objections come up repeatedly?
   - Success metrics: 40–100 cumulative customers, 10+ monthly recurring revenue (MRR).

4. **Days 61–90 (Optimize and expand):**
   - Double down on the channels/messaging that work.
   - Identify and fix the biggest funnel leak (if 50% of people sign up but only 10% pay, the onboarding/product is the problem; if 50% sign up, 40% pay, but churn is high, the product isn't delivering value).
   - Expand to secondary segments or secondary channels.
   - Gather customer testimonials and case studies.
   - Success metrics: 100–200 cumulative customers, 20–40 MRR, early NPS data suggesting product-market fit.

**Output:** Week-by-week roadmap with specific activities, success metrics, and go/no-go decision points.

### Step 6: Calculate GTM Budget and Resource Needs

**Input:** Channel tactics, agent automation percentages, team sizes needed.

**Process:**
1. **Channel-by-channel budget:**
   - Outbound: Cost of outreach tool (e.g., Lemlist, $50/month) + human time (if a human writes 50 personalized emails/day, maybe 2 hours/day = $50 in labor). At scale with agents writing emails, cost drops to $50/month tool cost + compute cost. Estimate $500/month for outbound GTM in month 1.
   - Content: 2 posts per week = 8 posts per month. If agents write drafts (cost ~$10 per post in compute) and human edits (cost ~$40 per post in labor), total ~$400/month. Ramp to $800/month in month 3 if you have more content.
   - Paid ads: Start with $1000/month test, scale if working. Can be agent-optimized (agents adjust bids).
   - Tools and software: Stripe (payment processing), email tools, CRM, etc. Budget $500–$1000/month.

2. **Team structure:**
   - Month 1: Founder (part-time GTM) + 0–1 GTM specialist.
   - Month 3: Founder (part-time) + 1 GTM specialist + 1 content/community person + 0.5 sales rep (split with something else).
   - This is minimal. Most companies need more, but we're optimizing for lean.

3. **Agent vs. human cost:**
   - Agents: Can handle outreach, email drafting, demo scheduling, lead follow-up. Cost: compute + tooling. Estimate $300–500/month for a productive GTM agent fleet.
   - Humans: Strategic decisions, relationship building, sales closing, content strategy. Cost: salary (month 1 cost for a GTM specialist is ~$3000/month fully-loaded for early-stage company).

**Output:** Channel budgets, team headcount plan, agent vs. human cost breakdown for 90 days.

### Step 7: Define Success Metrics and PMF Signals

**Input:** Market sizing, growth targets, business model assumptions.

**Process:**
1. **Acquisition metrics:**
   - Month 1: Target 10–20 customers (easy wins from your network).
   - Month 3: Target 50–100 customers (if GTM is working).
   - Month 6: Target 200–400 customers (if scaling).
   - CAC: Should be < $1000 for most SMB SaaS. If you're spending more than CAC target to acquire a customer, pivot the channel or messaging.

2. **Activation/retention metrics:**
   - % of signups who complete onboarding: Aim for 70%+ (if lower, product is hard to use).
   - % of free trial who convert to paying: Aim for 20–40% (if lower, product isn't delivering value or pricing is wrong).
   - % of paying customers with activity in past 30 days: Aim for 80%+ (if lower, product has quality issues).
   - NPS (Net Promoter Score): Aim for 40+ at 3 months (indicates satisfaction and likely referrals).

3. **Product-market fit signals:**
   - Organic growth > 30% of new customers come from referrals or organic word-of-mouth (very early, < 3 months, this won't happen).
   - Low churn: < 5% monthly churn by month 6.
   - Expansion revenue: 20%+ of customers upgrade or expand within first 3 months.
   - Retention NPS: ask "how likely are you to recommend this to a peer?", aim for 40+.

4. **Go/no-go decision points:**
   - Month 1 decision (Day 30): Did we acquire 10+ customers? If no, GTM messaging or channel is wrong. Pivot.
   - Month 3 decision (Day 90): Did we acquire 50+ customers with CAC below target? If yes, scale. If no, rethink market or product.
   - Month 6 decision: Are we hitting growth targets? Is churn acceptable? If yes, continue scaling GTM. If no, pivot or shut down.

**Output:** Specific KPI targets by month, PMF indicators, go/no-go criteria.

### Step 8: Risk Assessment and Mitigation

**Input:** All of the above + Phase 2 validation results.

**Process:**
1. **Identify key assumptions:**
   - We can reach our target segment cheaply (is outbound possible? is content ranking possible?).
   - Our messaging resonates (do customers use our terminology? do they care about the benefit we're emphasizing?).
   - The product delivers immediate value (can customers see ROI within days?).
   - Our GTM agents are reliable (can they handle the volume?).
   - Competitive response won't be devastating (can incumbent block our growth?).

2. **For each assumption, ask:**
   - How confident are we (1–10 scale)?
   - What if we're wrong? (impact on GTM)
   - How will we test this early? (within first 14 days)
   - Mitigation: What can we do to reduce the risk?

3. **Example:**
   - Assumption: "Outbound cold email will get 30%+ response rate."
   - Confidence: 6/10 (cold email works for some segments, not others).
   - If wrong: GTM stalls, CAC explodes, need to pivot channels.
   - Early test: Send 100 personalized cold emails in week 1, measure response rate.
   - Mitigation: Have content/community channels ready as backup. If outbound doesn't work by week 2, shift budget to content and community.

**Output:** Key assumptions with confidence levels, early tests, and fallback plans.

## Data Sources & Integrations

**External data sources:**
- **Company databases:** Hunter.io, RocketReach, Apollo.io (to find email addresses for outbound).
- **Keyword research:** SEMrush, Ahrefs, Moz (to identify high-value keywords for content).
- **Community platforms:** Reddit, ProductHunt API, HackerNews (to monitor discussions).
- **Social listening:** Twitter API, LinkedIn API (to monitor conversations, sentiment, trends).
- **Competitive intelligence:** G2, Capterra (to monitor what customers say about competitors).

**Internal integrations:**
- Outputs consumed by **Risk Analyst (3.4):** GTM risks, competitive response risks, dependency risks.
- Outputs consumed by **Resource Planner (3.5):** GTM budget, headcount plan, timeline.
- Outputs consumed by **Blueprint Packager (3.6):** Full launch plan for the blueprint document.

## Agent Prompt Strategy

### System Prompt Persona

```
You are an expert go-to-market strategist with 10+ years of experience launching
startups in competitive markets. You understand the nuances of different customer
segments, the psychology of sales and marketing, and the mechanics of agent-first
GTM. You combine data-driven reasoning with creative problem-solving.

Your role is to design a GTM plan that:

1. Targets the right customer segment at the right time.
2. Delivers a clear, resonant message that cuts through noise.
3. Uses the right channels to reach that segment cost-effectively.
4. Leverages agent automation for high-volume, repeatable tasks (outreach, nurture).
5. Keeps human involvement focused on relationship-building and strategic decisions.
6. Sets the startup up for rapid scaling once product-market fit is validated.

You have strong opinions about:
- Which customer segments are worth targeting and why.
- How to craft positioning that converts.
- The trade-offs between different GTM channels.
- When to lean on agents vs. humans for customer interactions.
- How to recognize early signals of success vs. warning signs that require pivoting.

You are also realistic: not all GTM strategies work. Some assumptions will be wrong.
You design for that by building in early tests and fallback plans.
```

### Key Instructions

1. **Start with the customer, not the channel.**
   - Don't say "let's do content marketing" or "let's do outbound" without first asking: who is our target customer and where/how do they discover solutions?
   - Channel choice flows from customer understanding, not vice versa.

2. **Price and positioning matter more than volume.**
   - A GTM plan that brings 1000 low-quality leads at CAC 10x target is worse than a plan that brings 100 high-quality leads at 1/3 target CAC.
   - Always anchor GTM strategy to unit economics. If CAC target is $1000, every tactic should be designed to deliver customers at or below that cost.

3. **Lean on agents for repetition, not judgment.**
   - Agents should handle: sending outreach emails, following up, scheduling meetings, nurturing cold leads, managing paid ads, writing content drafts.
   - Humans should handle: relationship-building, closing deals, negotiating, strategic decisions, brand positioning.

4. **Design for iteration and rapid testing.**
   - The first GTM strategy will be partly wrong. Build in early validation points (week 2, week 6, week 12).
   - At each validation point, ask: is this working? If not, what's the fallback?

5. **Be specific about agent capabilities.**
   - Don't just say "agents handle outreach." Specify: agents write personalized cold emails, agents schedule demos, agents follow up after demo.
   - Reference the agent architecture (3.2) to confirm agents can actually do what you're proposing.

6. **Validate assumptions early with small tests.**
   - Before deploying a GTM tactic at scale, test it at small scale first (100 emails, 10 community posts, 100 ad impressions).
   - If it works at small scale, keep it. If not, kill it and move budget to the next hypothesis.

7. **Target early adopters, not the mass market.**
   - In the first 90 days, you're not trying to win the whole market. You're trying to find the segment that loves you most.
   - Target the 5% of your addressable market who are most eager to solve the problem and least attached to incumbents.

8. **Craft positioning that clusters around a single unique insight.**
   - Don't try to own "we're faster, cheaper, and easier." Pick one and own it. (Then as you mature, add nuance.)
   - Example: "We're the only email platform built for e-commerce brands." (Not "we're the only email platform built for e-commerce brands that's also AI-powered and has the best analytics." Pick one.)

### Few-Shot Examples

**Example 1: B2B SaaS (Expense Management for SMBs)**

Concept: Streamline expense management and reimbursement for small businesses (10–100 employees) using AI-powered receipt scanning and approval workflows.

GTM Strategy Design:

```
Target Customer:
- Primary: CFO/Accounting Manager at SMBs (10–100 employees)
- Secondary: Operations Manager at remote-first companies
- Segment size: ~50k addressable SMBs in the US
- Pain: Expense management is manual and slow; takes 10+ hours per month, delays reimbursements, error-prone

Why this segment:
- Large enough to support a business; SOM (serviceable obtainable market) ~$10-20M ARR at $100/month/customer
- Underserved: incumbent expense tools (Concur, Expensify) are expensive ($20+/employee/month for 50 employees = $1000+/month) and complex
- Our positioning: "Expense management for remote teams that takes 5 minutes per week, not 10 hours per month."

Positioning & Messaging:
- Positioning: "The only expense management tool built for remote-first teams who don't have a full-time finance person."
- Pillars:
  1. Pain: "Manual expense management wastes 10+ hours per month per accounting person."
  2. Solution: "AI-powered receipt scanning + one-click approval = 95% less manual work."
  3. Benefit: "Reimburse employees in 2 days instead of 2 weeks. Track spend in real-time."
  4. Why us: "We're built by founders who did 8-figure SaaS; we know what SMB finance teams need."

Channel Strategy:
Channel 1: Inbound Content (SEO/Blog)
  - Target keywords: "expense management for small business", "how to streamline expense reimbursement", "best expense tracking tool"
  - Tactics:
    - Agents: Write 2 blog posts per week (targeting keywords, drafting content)
    - Humans: Review, edit, optimize for SEO
  - Frequency: 2x per week
  - Agent/human split: 70% agent (drafting), 30% human (strategy, editing)
  - Cost: $500/month (tool + minimal human review time)
  - Expected lead volume: Month 1–2 = 0 (SEO ramp is slow), Month 3 = 10 leads, Month 6 = 50 leads/month

Channel 2: Outbound Sales (Direct Outreach)
  - Target companies: SMBs with 50–100 employees, in SaaS/e-commerce/services (industries with remote teams)
  - Tactics:
    - Identify target companies via LinkedIn, Hunter, RocketReach
    - Agents: Send personalized cold emails (agents write 1 email per day, customize with company name + specific trigger)
    - Agents: Follow up after 3 days if no response
    - Agents: Schedule demo calls
    - Humans: Deliver demos, close deals
  - Frequency: 50 cold emails per day
  - Agent/human split: 90% agent (outreach, follow-up, scheduling), 10% human (selling)
  - Cost: $200/month (email tool) + agent compute
  - Expected lead volume: Week 1 = 5 responses, Month 1 = 20 leads, Month 3 = 50 leads/month

Channel 3: Community / Partnerships
  - Target communities: Reddit r/accounting, LinkedIn groups for CFOs, Slack communities for remote CFOs
  - Tactics:
    - Agents: Monitor communities for questions about expense management
    - Agents: Respond with thoughtful answers (not sales pitches)
    - Humans: Strategic partnerships (reach out to accounting software reviewers, partner with accounting firms)
  - Frequency: 2–3 community engagement posts per day
  - Agent/human split: 80% agent (monitoring, responding), 20% human (partnership negotiations)
  - Cost: Minimal (~$100/month tools)
  - Expected lead volume: Month 1 = 2 leads, Month 3 = 10 leads/month

Sales Funnel:
- Awareness: 500+ people see our content or outreach per month
- Interest: 50–70 qualified leads (from outbound + content) + community inbound
- Trial: 20 companies sign up for 14-day trial
- Conversion: 4–6 companies convert to paying (20–30% conversion)
- CAC: $200–300 (low because agents handle outreach; only humans close)

90-Day Roadmap:

Days 1–14 (Launch prep):
  - Finish MVP (receipt scanning + approvals) and test with 5 friendly customers
  - Set up website, landing page, demo video
  - Prepare outbound email templates (agents will customize)
  - Recruit first 5 beta customers for testimonials
  - Activity: Low volume testing
  - Success metric: 5 beta customers, all positive

Days 15–30 (Channel testing):
  - Start outbound (50 emails per day to test messaging)
  - Publish first 2 blog posts to test keyword targeting
  - Reach out to 3 potential partners (accounting software reviewers)
  - Engage in 3 communities (Reddit, LinkedIn, Slack)
  - Activity: Multi-channel testing at small scale
  - Expected: 20 leads, 3–5 signups, 0–1 conversions
  - Go/no-go: Did outbound get 20%+ response rate? If yes, continue. If no, pivot messaging.

Days 31–60 (Scale winning channel):
  - Outbound is working (20% response): increase to 100 emails per day
  - Content is too slow: reduce to 1 post per week, focus on distributing via LinkedIn and Twitter
  - Community is showing promise: double down, aim for 5 community posts per day
  - Iterate messaging based on objections: "Why should we switch from Expensify?" → highlight ease and price
  - Activity: Ramp outbound, maintain content, scale community
  - Expected: 50 leads, 15 signups, 5–8 conversions
  - Success metric: CAC < $300, conversion rate 20%+

Days 61–90 (Optimize and prepare for scale):
  - Double down on outbound: 150+ emails per day, agent-driven
  - Collect customer testimonials, publish case studies (agents draft, humans refine)
  - Launch paid ads (Google search + LinkedIn) to supplement organic
  - Identify secondary segment: expand to 100–500 employee companies
  - Activity: Continue outbound, add paid ads, prepare for next growth phase
  - Expected: 100 cumulative customers, $5k+ MRR
  - Success metric: PMF signals (NPS > 40, churn < 3%, organic referrals > 20%)

Budget:
  - Month 1: Outbound tooling $200 + content tooling $100 + agent compute $300 + 0.5 FTE sales ($2000) = $2600/month
  - Month 2: Same ($2600)
  - Month 3: Ramp up to 1 FTE sales ($4000) + increase agent compute + paid ads ($1000) = $5600/month
  - Total 90 days: ~$10,800

Team:
  - Month 1: Founder (part-time GTM) + agents handling outreach + 0 dedicated sales
  - Month 3: Founder (part-time) + agents handling outreach + 0.5 FTE sales person + 1 part-time content person

Risks & Mitigations:
  - Risk: Outbound messaging doesn't resonate (low response rate)
    Confidence: 7/10
    Test: Week 1, send 100 emails with 3 different subject lines; measure response rate
    Fallback: Pivot to content/SEO if outbound < 10% response rate by week 2

  - Risk: Competitors (Expensify, Brex) respond to our launch with price cuts
    Confidence: 5/10 (they might, might not)
    Mitigation: Lock in customers with annual contracts; emphasize ease, not just price

  - Risk: Onboarding agents can't handle volume of trial signups
    Confidence: 9/10 (agents should be able to handle this)
    Test: Load-test agents with 10 simultaneous trial signups in week 1
    Fallback: Founder does manual onboarding for first 20 customers if needed

Recommendation: GO
- Clear target segment (SMB CFOs) with documented pain and willingness to pay
- Multiple channels to acquire customers; not dependent on any single channel
- GTM is very agent-driven (good for unit economics)
- Risks are identified and mitigated
- Conservative targets (100 customers at day 90) are achievable
```

**Example 2: B2C Marketplace (Freelance Data Annotation)**

Concept: Marketplace connecting companies needing data labeled (for ML training) with distributed freelance annotators. Revenue: 20% commission on annotations.

GTM Strategy Design:

```
Target Customer (Supply side):
- Primary: ML engineers / data scientists at startups and scale-ups (10–500 person companies) who need labeled data
- Secondary: Large enterprises with in-house AI teams
- Why this segment: Active, urgent need (can't build ML models without labeled data); willing to pay; reachable via tech channels

Target Customer (Demand side):
- Primary: Freelancers / students looking for flexible, remote work
- Secondary: Agencies in countries with lower cost of living (India, Philippines, etc.)
- Why this segment: Large pool, motivated to earn, easy to onboard

Two-Sided GTM:
- Supply (attracting companies): B2B content, outbound to ML teams, partnerships with ML communities
- Demand (attracting annotators): Social media, communities (Reddit r/freelance), paid ads

Positioning:
- Supply: "The fastest way to get 1000s of high-quality labeled data points, not weeks of manual work."
- Demand: "Earn $15–30/hour doing flexible data annotation work from anywhere."

Channel Strategy:
Supply Channel 1: Inbound (Tech Community & Content):
  - Target: HackerNews, ProductHunt, Twitter (ML community), Reddit r/MachineLearning
  - Tactics:
    - Agents: Publish content on data labeling best practices, share case studies of annotation speed
    - Agents: Monitor communities, respond to questions about data labeling
    - Humans: Strategic partnerships with ML influencers, speaking at conferences
  - Frequency: 1 post per week on blog, daily community engagement
  - Expected: 5–10 inbound requests per month by month 3

Supply Channel 2: Outbound (Direct to ML Teams):
  - Identify: ML engineers at Series A–C startups (via Crunchbase, LinkedIn)
  - Tactics:
    - Agents: Send personalized cold emails (agent mentions their product, their data challenges)
    - Agents: Follow up with case studies
    - Humans: Demo annotation platform, discuss project scope, pricing
  - Frequency: 50 emails per day
  - Expected: 20 qualified prospects per month

Demand Channel: Paid Ads + Organic Social:
  - Platforms: Facebook ads targeting "work from home", Google ads for "data annotation jobs", Reddit r/freelance sponsorship
  - Tactics:
    - Agents: Manage ad bids and audience targeting based on conversion rates
    - Humans: Creative ideation, landing page optimization
  - Frequency: Continuous
  - Expected: 100s of annotator signups per month (low barrier to entry)

Sales Funnel (Supply side):
  - Awareness: 300 ML engineers see our content or outreach per month
  - Interest: 30 qualified leads (decide to try)
  - Trial: 10 companies set up a small test annotation project
  - Conversion: 3–5 companies become paying customers (30–50% conversion)
  - LTV: 1 company does $2000/month of annotations over 12 months = $24,000 LTV
  - CAC: $500 (if 30 leads and 3 convert, CAC = $1500/3 = $500)
  - LTV/CAC: 48, excellent

90-Day Roadmap:

Days 1–14:
  - Recruit 100 annotators (from personal network, Discord communities for freelancers)
  - Create 3 test annotation projects (so you have work for supply side to buy)
  - Write 2 blog posts on data labeling
  - Set up marketplace and payment processing
  - Expected: 100 annotators, 0 paying customers (still testing)

Days 15–30:
  - Launch marketplace publicly (ProductHunt, HackerNews)
  - Start outbound to 50 ML teams (cold emails)
  - Start paid ads for annotators ($500/month budget)
  - Launch 3 test projects from early customer conversations
  - Activity: Multi-sided acquisition starting
  - Expected: 500+ annotators, 5 companies interested, 1–2 small projects

Days 31–60:
  - Scale outbound (100+ emails per day)
  - Ramp annotator acquisition (paid ads working)
  - Close 5–10 companies as paying customers
  - Have $10k–20k MRR on the supply side
  - Activity: Scaling both sides
  - Success metric: Both sides growing (supply and demand matched)

Days 61–90:
  - Double down on winning channels (if outbound working, scale to 200 emails/day)
  - Collect supply-side case studies (annotators are now part of narrative)
  - Refine matching algorithm (AI agents assign annotators to projects optimally)
  - Push toward viral loop (annotators refer other annotators, companies refer other companies)
  - Expected: $30k–50k MRR supply side, 500+ active annotators

Budget:
  - Month 1: Paid ads $500 + content + agent compute = $1500
  - Month 2: Paid ads $1000 + content = $2000
  - Month 3: Paid ads $2000 + content + 0.5 FTE customer success = $3500
  - Total 90 days: $7000

Team:
  - Month 1: Founder (full-time) + agents managing ads and community
  - Month 3: Founder + 0.5 FTE customer success (onboard companies, manage projects) + agents

Go/no-go decision (Day 90):
  - Did we acquire 10+ paying customers on supply side? If yes, continue scaling. If no, pivot positioning or target market.
  - Did we attract 500+ annotators on demand side? If yes, supply side should be easy. If no, increase ad spend or improve positioning.

Recommendation: GO
- Two-sided marketplace requires both sides, but supply-side unit economics are strong
- Demand side (annotators) is easy to acquire (many people want remote work)
- Risks: matching quality (do annotations meet customer standards?), customer churn (do companies keep coming back?)
- Early signals to watch: annotation quality scores, company repeat orders, annotator retention
```

## Handling Edge Cases

1. **When target segment is too small or hard to reach:**
   - Don't force the GTM plan. Recommend pivoting the target segment or product positioning.
   - Example: If you're trying to reach "marine biologists who study bioluminescence," the segment is tiny and hard to reach. Expand to "marine researchers" or "ocean tech companies."

2. **When competitive response could block growth:**
   - Don't assume you can outrun the competition. Design GTM that creates defensibility.
   - Example: If Stripe could easily copy your product, don't compete on features. Compete on community, brand, or customer relationships (which are harder to copy).

3. **When GTM relies on agents but agents aren't proven:**
   - Design a hybrid approach: agents do 50% of the work in month 1, 70% in month 2, 90% in month 3.
   - This allows human oversight while ramping agent automation.

4. **When the business model requires multi-sided growth (marketplace, platform):**
   - Don't assume you can grow supply and demand in parallel. Pick the more strategic side first.
   - Example: For a freelance marketplace, grow supply (freelancers) first, then demand (buyers) once you have inventory.

5. **When early tests suggest the core assumption is wrong:**
   - Don't stick to the plan hoping it works. Pivot quickly.
   - Example: If outbound emails get 5% response rate instead of expected 20%, pivot to content or community by week 2, not week 6.

## Performance & Scaling

**GTM Strategist Execution Time:**
- Typically 1–2 weeks to design a comprehensive GTM plan.
- Iterates with business model (3.1) and agent architect (3.2) for feasibility.

**Scaling the GTM Plan:**
- Month 1–3: Seed and test (low volume, high iteration).
- Month 3–6: Validate and scale (once you find what works, 2–3x the volume).
- Month 6+: Optimize and expand (mature channels, new segments).

**Agent Scaling in GTM:**
- Agent tasks (outreach, nurture, ad management) scale linearly: 2x the volume = 2x the agent work.
- Agent costs are low (compute cost per task is $0.01–$0.10).
- Throughput: 1 outreach agent can send 50–100 personalized emails per day.

## Dependencies

### Depends On

- **Business Model (3.1):** Pricing tiers, customer journey, GTM channel preferences.
- **Agent Architect (3.2):** Agent capabilities for GTM tasks (outreach, scheduling, ad management).
- **Customer Validation (Phase 2, 2.3):** Early-adopter personas, willingness-to-pay, pain severity.
- **Feasibility Report (Phase 2, 2.4):** Integration requirements, regulatory constraints (affects what GTM channels are viable).

### Depended On By

- **Risk Analyst (3.4):** GTM risks (channel effectiveness, competitive response, team scalability).
- **Resource Planner (3.5):** GTM budget, team structure, timeline.
- **Blueprint Packager (3.6):** Launch plan for the final blueprint.

## Success Metrics

1. **Actionability:**
   - GTM plan is specific enough that a founder or GTM lead can execute it immediately (not abstract advice).
   - Channel tactics are concrete (not "do content marketing"; instead "publish 2 blog posts per week targeting 'SMB expense management'").

2. **Realism:**
   - Lead generation targets are grounded in market size, channel reach, and conversion benchmarks (not magical thinking).
   - Budget estimates are realistic (not grossly underestimating execution costs).

3. **Alignment:**
   - GTM plan achieves the unit economics targets from the business model (CAC targets are met).
   - Agent automation in GTM matches the agent capabilities documented in 3.2.
   - Time to first customer is reasonable (usually < 2 weeks for outbound channels, < 6 weeks for content channels).

4. **Risk Management:**
   - Key assumptions are identified and tested early (within first 2 weeks).
   - Fallback plans exist if primary channels don't work.
   - Go/no-go decision points are clear.

5. **Stakeholder Confidence:**
   - Founder feels confident executing this plan (not overwhelmed).
   - Risk Analyst can identify key risks from the GTM plan.
   - Resource Planner can extract budget and team needs.

## Implementation Notes

### Suggested Tech Stack

**GTM Execution Tools:**
- Email outreach: Lemlist, Instantly, or Apollo (handles personalization, follow-ups, scheduling).
- SEO/Content: WordPress or Webflow (CMS), Semrush/Ahrefs (keyword research), Jasper/Copy.ai (AI writing assistance for agent drafting).
- Community management: Discord (community platform), Slack (community for B2B), Reddit API (monitoring).
- Paid ads: Google Ads, Meta Ads Manager, LinkedIn Ads (agents can manage bids and targeting).
- CRM: Salesforce (for B2B) or simpler tools like Pipedrive, HubSpot free tier.
- Analytics: Mixpanel or Amplitude (track conversion funnel), Google Analytics (website metrics).

**Agent-Specific:**
- Email writing agents: Claude API with custom system prompt for GTM context.
- Demo scheduling agents: Calendar APIs (Google Calendar, Calendly).
- Lead qualification agents: LLM with access to LinkedIn and company data APIs.
- Ad optimization agents: APIs for Google Ads, Meta Ads to read performance and adjust bids.

### Build Steps

1. **Research and validate target segment** (ensure it's real and reachable).
2. **Develop positioning and messaging** (test with 5–10 potential customers).
3. **Design channel strategy** (identify 2–3 channels to test in month 1).
4. **Specify sales and onboarding funnels** (ensure product can handle launch volume).
5. **Build financial model** (budget + expected CAC).
6. **Identify risks and tests** (what must be true for this to work?).
7. **Document the 90-day roadmap** (week by week).
8. **Validate with Business Designer and Agent Architect** (ensure alignment).

### Testing & Validation

- **Pre-launch:** Validate messaging with 10 target customers (does our positioning land?).
- **Launch week:** Small-scale tests (100 emails, 10 community posts, $100 ads) to validate channel effectiveness.
- **Weeks 2–4:** Iterate based on early results; pivot if needed.
- **Months 2–3:** Scale winning channels; test new channels.
- **Month 3 review:** Go/no-go decision; proceed or pivot.

---

This specification provides a founder or GTM lead with a concrete, actionable plan to acquire the first customers. The key is balancing ambition (we can reach 100+ customers in 90 days) with realism (most channels don't work perfectly, and we'll iterate).
