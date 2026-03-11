'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type {
  Blueprint,
  PricingTier,
  AgentRole,
  HumanRole,
  EscalationProtocol,
  GtmChannel,
  RiskItem,
  HiringPlanEntry,
  FundingMilestone,
  FinancialProjectionMonth,
} from '@company-builder/types';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const colors = {
  primary: '#059669',
  primaryLight: '#d1fae5',
  dark: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  background: '#f8fafc',
  white: '#ffffff',
  severityCritical: '#dc2626',
  severityHigh: '#ea580c',
  severityMedium: '#d97706',
  severityLow: '#16a34a',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: colors.dark,
    lineHeight: 1.5,
  },

  // Cover page
  coverPage: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontFamily: 'Helvetica',
    color: colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 3,
    marginBottom: 16,
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 12,
  },
  coverTagline: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 40,
    maxWidth: 400,
  },
  coverMeta: {
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
  },
  coverDivider: {
    width: 60,
    height: 3,
    backgroundColor: colors.primary,
    marginBottom: 32,
  },

  // Section headings
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    marginBottom: 4,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    marginTop: 16,
    marginBottom: 6,
  },

  // Text
  body: {
    fontSize: 10,
    lineHeight: 1.6,
    color: colors.dark,
    marginBottom: 8,
  },
  label: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    marginBottom: 12,
  },
  bullet: {
    fontSize: 10,
    color: colors.dark,
    marginBottom: 3,
    paddingLeft: 12,
  },

  // Tables
  tableHeader: {
    flexDirection: 'row' as const,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row' as const,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  tableCell: {
    fontSize: 9,
    color: colors.dark,
  },

  // Cards
  card: {
    backgroundColor: colors.background,
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Metric row
  metricRow: {
    flexDirection: 'row' as const,
    marginBottom: 12,
    gap: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center' as const,
  },

  // Badge
  badge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    textTransform: 'uppercase' as const,
  },

  // Footer
  footer: {
    position: 'absolute' as const,
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    fontSize: 8,
    color: colors.muted,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(iso));
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return colors.severityCritical;
    case 'high':
      return colors.severityHigh;
    case 'medium':
      return colors.severityMedium;
    default:
      return colors.severityLow;
  }
}

// ---------------------------------------------------------------------------
// Section Components
// ---------------------------------------------------------------------------

function PageFooter({ title }: { title: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{title} — Blueprint</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function CoverPage({ title, summary, date }: { title: string; summary?: string | null; date: string }) {
  return (
    <Page size="A4" style={styles.coverPage}>
      <Text style={styles.coverLabel}>Company Blueprint</Text>
      <View style={styles.coverDivider} />
      <Text style={styles.coverTitle}>{title}</Text>
      {summary && (
        <Text style={styles.coverTagline}>
          {summary.length > 200 ? summary.slice(0, 200) + '...' : summary}
        </Text>
      )}
      <Text style={styles.coverMeta}>Generated on {fmtDate(date)}</Text>
    </Page>
  );
}

function ExecutiveSummarySection({ blueprint }: { blueprint: Blueprint }) {
  if (!blueprint.executive_summary) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Executive Summary</Text>
      <Text style={styles.body}>{blueprint.executive_summary}</Text>

      {/* Key metrics row */}
      <View style={styles.metricRow}>
        {blueprint.revenue_model && (
          <View style={styles.metricBox}>
            <Text style={styles.label}>Revenue Model</Text>
            <Text style={styles.value}>{blueprint.revenue_model.replace('_', ' ')}</Text>
          </View>
        )}
        {blueprint.runway_months && (
          <View style={styles.metricBox}>
            <Text style={styles.label}>Runway</Text>
            <Text style={styles.value}>{blueprint.runway_months} months</Text>
          </View>
        )}
        {blueprint.agent_roles && (
          <View style={styles.metricBox}>
            <Text style={styles.label}>AI Agents</Text>
            <Text style={styles.value}>
              {blueprint.agent_roles.filter((r) => r.agent_or_human !== 'human').length}
            </Text>
          </View>
        )}
        {blueprint.risks && (
          <View style={styles.metricBox}>
            <Text style={styles.label}>Risks Tracked</Text>
            <Text style={styles.value}>{blueprint.risks.length}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function BusinessModelSection({ blueprint }: { blueprint: Blueprint }) {
  if (!blueprint.revenue_model && !blueprint.pricing_tiers?.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Business Model</Text>

      {blueprint.revenue_model && (
        <View>
          <Text style={styles.label}>Revenue Model</Text>
          <Text style={styles.value}>{blueprint.revenue_model.replace('_', ' ')}</Text>
        </View>
      )}

      {blueprint.customer_journey && (
        <View>
          <Text style={styles.sectionSubtitle}>Customer Journey</Text>
          <Text style={styles.body}>{blueprint.customer_journey}</Text>
        </View>
      )}

      {/* Pricing tiers */}
      {blueprint.pricing_tiers && blueprint.pricing_tiers.length > 0 && (
        <View>
          <Text style={styles.sectionSubtitle}>Pricing Tiers</Text>
          {blueprint.pricing_tiers.map((tier: PricingTier, i: number) => (
            <View key={i} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold' }}>{tier.name}</Text>
                <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: colors.primary }}>
                  {fmtCurrency(tier.price)}/mo
                </Text>
              </View>
              <Text style={{ fontSize: 9, color: colors.muted, marginBottom: 4 }}>
                Target: {tier.target_segment}
              </Text>
              {tier.features.map((f: string, fi: number) => (
                <Text key={fi} style={styles.bullet}>
                  {'\u2022'} {f}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Financial projections */}
      {blueprint.financial_projection && blueprint.financial_projection.length > 0 && (
        <View>
          <Text style={styles.sectionSubtitle}>Financial Projections</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Month</Text>
            <Text style={[styles.tableHeaderCell, { width: '28%' }]}>Revenue</Text>
            <Text style={[styles.tableHeaderCell, { width: '28%' }]}>Costs</Text>
            <Text style={[styles.tableHeaderCell, { width: '29%' }]}>Margin</Text>
          </View>
          {blueprint.financial_projection.map((fp: FinancialProjectionMonth, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '15%' }]}>{fp.month}</Text>
              <Text style={[styles.tableCell, { width: '28%' }]}>{fmtCurrency(fp.revenue)}</Text>
              <Text style={[styles.tableCell, { width: '28%' }]}>{fmtCurrency(fp.costs)}</Text>
              <Text style={[styles.tableCell, { width: '29%' }]}>
                {(fp.margin * 100).toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function AgentArchitectureSection({ blueprint }: { blueprint: Blueprint }) {
  if (!blueprint.agent_roles?.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Agent Architecture</Text>

      {/* Agent roles table */}
      <Text style={styles.sectionSubtitle}>Agent & Human Roles</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Role</Text>
        <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Type</Text>
        <Text style={[styles.tableHeaderCell, { width: '36%' }]}>Responsibilities</Text>
        <Text style={[styles.tableHeaderCell, { width: '16%' }]}>Tools</Text>
        <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Cost/mo</Text>
      </View>
      {blueprint.agent_roles.map((r: AgentRole, i: number) => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: '20%', fontFamily: 'Helvetica-Bold' }]}>{r.role}</Text>
          <Text style={[styles.tableCell, { width: '14%' }]}>{r.agent_or_human}</Text>
          <Text style={[styles.tableCell, { width: '36%' }]}>
            {r.responsibilities.join('; ')}
          </Text>
          <Text style={[styles.tableCell, { width: '16%' }]}>{r.tools.join(', ')}</Text>
          <Text style={[styles.tableCell, { width: '14%' }]}>
            {r.cost_usd_per_month != null ? fmtCurrency(r.cost_usd_per_month) : '—'}
          </Text>
        </View>
      ))}

      {/* Human roles */}
      {blueprint.human_roles && blueprint.human_roles.length > 0 && (
        <View>
          <Text style={styles.sectionSubtitle}>Human Roles</Text>
          {blueprint.human_roles.map((hr: HumanRole, i: number) => (
            <View key={i} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>
                  {hr.role} ({hr.headcount} headcount)
                </Text>
                <Text style={{ fontSize: 10, color: colors.primary }}>
                  {fmtCurrency(hr.cost_usd_per_year)}/yr
                </Text>
              </View>
              {hr.responsibilities.map((resp: string, ri: number) => (
                <Text key={ri} style={styles.bullet}>
                  {'\u2022'} {resp}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Escalation protocols */}
      {blueprint.escalation_protocols && blueprint.escalation_protocols.length > 0 && (
        <View>
          <Text style={styles.sectionSubtitle}>Escalation Protocols</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Trigger</Text>
            <Text style={[styles.tableHeaderCell, { width: '45%' }]}>Escalation Path</Text>
            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>SLA</Text>
          </View>
          {blueprint.escalation_protocols.map((ep: EscalationProtocol, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '30%' }]}>{ep.trigger}</Text>
              <Text style={[styles.tableCell, { width: '45%' }]}>{ep.escalation_path}</Text>
              <Text style={[styles.tableCell, { width: '25%' }]}>
                {ep.sla_minutes != null ? `${ep.sla_minutes} min` : '—'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Operational cost breakdown */}
      {blueprint.operational_cost_breakdown && (
        <View>
          <Text style={styles.sectionSubtitle}>Operational Cost Breakdown</Text>
          <View style={styles.metricRow}>
            <View style={styles.metricBox}>
              <Text style={styles.label}>Agent Compute</Text>
              <Text style={styles.value}>
                {fmtCurrency(blueprint.operational_cost_breakdown.agent_compute)}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.label}>Human</Text>
              <Text style={styles.value}>
                {fmtCurrency(blueprint.operational_cost_breakdown.human)}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.label}>Tools</Text>
              <Text style={styles.value}>
                {fmtCurrency(blueprint.operational_cost_breakdown.tools)}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.label}>Total</Text>
              <Text style={[styles.value, { color: colors.primary }]}>
                {fmtCurrency(blueprint.operational_cost_breakdown.total)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function GtmPlanSection({ blueprint }: { blueprint: Blueprint }) {
  if (!blueprint.gtm_target_segment && !blueprint.gtm_channels?.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Go-to-Market Plan</Text>

      {blueprint.gtm_target_segment && (
        <View>
          <Text style={styles.label}>Target Segment</Text>
          <Text style={styles.value}>{blueprint.gtm_target_segment}</Text>
        </View>
      )}

      {blueprint.gtm_messaging_framework && (
        <View>
          <Text style={styles.sectionSubtitle}>Messaging Framework</Text>
          <Text style={styles.body}>{blueprint.gtm_messaging_framework}</Text>
        </View>
      )}

      {/* Channels */}
      {blueprint.gtm_channels && blueprint.gtm_channels.length > 0 && (
        <View>
          <Text style={styles.sectionSubtitle}>Channels</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Channel</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>AI-Handled</Text>
            <Text style={[styles.tableHeaderCell, { width: '60%' }]}>Tactics</Text>
          </View>
          {blueprint.gtm_channels.map((ch: GtmChannel, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '25%', fontFamily: 'Helvetica-Bold' }]}>
                {ch.channel}
              </Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>
                {ch.agent_handled ? 'Yes' : 'No'}
              </Text>
              <Text style={[styles.tableCell, { width: '60%' }]}>{ch.tactics.join('; ')}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Launch timeline */}
      {blueprint.gtm_launch_timeline && (
        <View>
          <Text style={styles.sectionSubtitle}>Launch Timeline</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: 'Day 1-30', items: blueprint.gtm_launch_timeline.day_1_30 },
              { label: 'Day 31-60', items: blueprint.gtm_launch_timeline.day_31_60 },
              { label: 'Day 61-90', items: blueprint.gtm_launch_timeline.day_61_90 },
            ].map((phase, pi) => (
              <View key={pi} style={[styles.card, { flex: 1 }]}>
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: 'Helvetica-Bold',
                    color: colors.primary,
                    marginBottom: 4,
                  }}
                >
                  {phase.label}
                </Text>
                {phase.items.map((item: string, ii: number) => (
                  <Text key={ii} style={{ fontSize: 8, marginBottom: 2 }}>
                    {'\u2022'} {item}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Agent vs Human GTM activities */}
      {(blueprint.agent_gtm_activities?.length || blueprint.human_gtm_activities?.length) && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {blueprint.agent_gtm_activities && blueprint.agent_gtm_activities.length > 0 && (
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>
                AI Agent Activities
              </Text>
              {blueprint.agent_gtm_activities.map((a: string, i: number) => (
                <Text key={i} style={styles.bullet}>
                  {'\u2022'} {a}
                </Text>
              ))}
            </View>
          )}
          {blueprint.human_gtm_activities && blueprint.human_gtm_activities.length > 0 && (
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>
                Human Activities
              </Text>
              {blueprint.human_gtm_activities.map((a: string, i: number) => (
                <Text key={i} style={styles.bullet}>
                  {'\u2022'} {a}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function RiskRegisterSection({ blueprint }: { blueprint: Blueprint }) {
  if (!blueprint.risks?.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Risk Register</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Category</Text>
        <Text style={[styles.tableHeaderCell, { width: '28%' }]}>Description</Text>
        <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Severity</Text>
        <Text style={[styles.tableHeaderCell, { width: '10%' }]}>Likelihood</Text>
        <Text style={[styles.tableHeaderCell, { width: '22%' }]}>Mitigation</Text>
        <Text style={[styles.tableHeaderCell, { width: '16%' }]}>Trigger</Text>
      </View>
      {blueprint.risks.map((risk: RiskItem, i: number) => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: '14%', fontFamily: 'Helvetica-Bold' }]}>
            {risk.category}
          </Text>
          <Text style={[styles.tableCell, { width: '28%' }]}>{risk.description}</Text>
          <Text
            style={[
              styles.tableCell,
              { width: '10%', fontFamily: 'Helvetica-Bold', color: severityColor(risk.severity) },
            ]}
          >
            {risk.severity}
          </Text>
          <Text style={[styles.tableCell, { width: '10%' }]}>{risk.likelihood}</Text>
          <Text style={[styles.tableCell, { width: '22%' }]}>{risk.mitigation}</Text>
          <Text style={[styles.tableCell, { width: '16%' }]}>{risk.monitoring_trigger}</Text>
        </View>
      ))}
    </View>
  );
}

function ResourcePlanSection({ blueprint }: { blueprint: Blueprint }) {
  if (!blueprint.runway_months && !blueprint.hiring_plan?.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Resource & Runway Plan</Text>

      {/* Key metrics */}
      <View style={styles.metricRow}>
        {blueprint.upfront_build_cost != null && (
          <View style={styles.metricBox}>
            <Text style={styles.label}>Upfront Build Cost</Text>
            <Text style={styles.value}>{fmtCurrency(blueprint.upfront_build_cost)}</Text>
          </View>
        )}
        {blueprint.monthly_operating_cost != null && (
          <View style={styles.metricBox}>
            <Text style={styles.label}>Monthly Burn</Text>
            <Text style={styles.value}>{fmtCurrency(blueprint.monthly_operating_cost)}</Text>
          </View>
        )}
        {blueprint.runway_months != null && (
          <View style={styles.metricBox}>
            <Text style={styles.label}>Runway</Text>
            <Text style={styles.value}>{blueprint.runway_months} months</Text>
          </View>
        )}
      </View>

      {/* Hiring plan */}
      {blueprint.hiring_plan && blueprint.hiring_plan.length > 0 && (
        <View>
          <Text style={styles.sectionSubtitle}>Hiring Plan</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Role</Text>
            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Headcount</Text>
            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Start Month</Text>
            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Cost/Person</Text>
          </View>
          {blueprint.hiring_plan.map((h: HiringPlanEntry, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }]}>
                {h.role}
              </Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>{h.headcount}</Text>
              <Text style={[styles.tableCell, { width: '25%' }]}>Month {h.start_month}</Text>
              <Text style={[styles.tableCell, { width: '25%' }]}>{fmtCurrency(h.cost_per_person)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Funding milestones */}
      {blueprint.funding_milestones && blueprint.funding_milestones.length > 0 && (
        <View>
          <Text style={styles.sectionSubtitle}>Funding Milestones</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '45%' }]}>Milestone</Text>
            <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Funding Required</Text>
            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Month</Text>
          </View>
          {blueprint.funding_milestones.map((fm: FundingMilestone, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '45%' }]}>{fm.milestone}</Text>
              <Text style={[styles.tableCell, { width: '30%', fontFamily: 'Helvetica-Bold' }]}>
                {fmtCurrency(fm.required_funding_usd)}
              </Text>
              <Text style={[styles.tableCell, { width: '25%' }]}>Month {fm.month}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Document
// ---------------------------------------------------------------------------

interface BlueprintPdfDocumentProps {
  blueprint: Blueprint;
  conceptTitle: string;
}

export function BlueprintPdfDocument({ blueprint, conceptTitle }: BlueprintPdfDocumentProps) {
  return (
    <Document
      title={`${conceptTitle} — Blueprint`}
      author="Company Builder"
      subject="Company Blueprint"
    >
      {/* Cover Page */}
      <CoverPage
        title={conceptTitle}
        summary={blueprint.executive_summary}
        date={blueprint.created_at}
      />

      {/* Executive Summary */}
      {blueprint.executive_summary && (
        <Page size="A4" style={styles.page}>
          <ExecutiveSummarySection blueprint={blueprint} />
          <PageFooter title={conceptTitle} />
        </Page>
      )}

      {/* Business Model */}
      {(blueprint.revenue_model || blueprint.pricing_tiers?.length) && (
        <Page size="A4" style={styles.page}>
          <BusinessModelSection blueprint={blueprint} />
          <PageFooter title={conceptTitle} />
        </Page>
      )}

      {/* Agent Architecture */}
      {blueprint.agent_roles?.length && (
        <Page size="A4" style={styles.page}>
          <AgentArchitectureSection blueprint={blueprint} />
          <PageFooter title={conceptTitle} />
        </Page>
      )}

      {/* GTM Plan */}
      {(blueprint.gtm_target_segment || blueprint.gtm_channels?.length) && (
        <Page size="A4" style={styles.page}>
          <GtmPlanSection blueprint={blueprint} />
          <PageFooter title={conceptTitle} />
        </Page>
      )}

      {/* Risk Register */}
      {blueprint.risks?.length && (
        <Page size="A4" style={styles.page}>
          <RiskRegisterSection blueprint={blueprint} />
          <PageFooter title={conceptTitle} />
        </Page>
      )}

      {/* Resource Plan */}
      {(blueprint.runway_months || blueprint.hiring_plan?.length) && (
        <Page size="A4" style={styles.page}>
          <ResourcePlanSection blueprint={blueprint} />
          <PageFooter title={conceptTitle} />
        </Page>
      )}
    </Document>
  );
}
