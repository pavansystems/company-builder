'use client';

import { useState } from 'react';
import { Download, ChevronDown, FileJson, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Blueprint } from '@company-builder/types';
import { formatCurrency } from '@/lib/utils/formatters';

interface BlueprintExportButtonProps {
  blueprint: Blueprint;
  conceptTitle: string;
}

function blueprintToMarkdown(blueprint: Blueprint, conceptTitle: string): string {
  const lines: string[] = [];

  lines.push(`# Blueprint: ${conceptTitle}`);
  lines.push(`*Generated: ${new Date(blueprint.created_at).toLocaleDateString()}*`);
  lines.push('');

  if (blueprint.executive_summary) {
    lines.push('## Executive Summary');
    lines.push(blueprint.executive_summary);
    lines.push('');
  }

  if (blueprint.revenue_model) {
    lines.push('## Business Model');
    lines.push(`**Revenue Model:** ${blueprint.revenue_model}`);
    lines.push('');
    if (blueprint.pricing_tiers && blueprint.pricing_tiers.length > 0) {
      lines.push('### Pricing Tiers');
      blueprint.pricing_tiers.forEach((tier) => {
        lines.push(`#### ${tier.name} — ${formatCurrency(tier.price)}/mo`);
        lines.push(`**Target:** ${tier.target_segment}`);
        tier.features.forEach((f) => lines.push(`- ${f}`));
        lines.push('');
      });
    }
  }

  if (blueprint.agent_roles && blueprint.agent_roles.length > 0) {
    lines.push('## Agent Architecture');
    lines.push('### AI Agent Roles');
    blueprint.agent_roles.forEach((r) => {
      lines.push(`#### ${r.role}`);
      r.responsibilities.forEach((resp) => lines.push(`- ${resp}`));
      lines.push('');
    });
  }

  if (blueprint.gtm_target_segment) {
    lines.push('## Go-to-Market Plan');
    lines.push(`**Target Segment:** ${blueprint.gtm_target_segment}`);
    if (blueprint.gtm_messaging_framework) {
      lines.push(`**Messaging:** ${blueprint.gtm_messaging_framework}`);
    }
    lines.push('');
  }

  if (blueprint.risks && blueprint.risks.length > 0) {
    lines.push('## Risk Register');
    blueprint.risks.forEach((r) => {
      lines.push(`- **${r.category}** (${r.severity}/${r.likelihood}): ${r.description}`);
      lines.push(`  - Mitigation: ${r.mitigation}`);
    });
    lines.push('');
  }

  if (blueprint.runway_months) {
    lines.push('## Resource Plan');
    lines.push(`**Runway:** ${blueprint.runway_months} months`);
    if (blueprint.upfront_build_cost) {
      lines.push(`**Upfront Build Cost:** ${formatCurrency(blueprint.upfront_build_cost)}`);
    }
    if (blueprint.monthly_operating_cost) {
      lines.push(`**Monthly Burn:** ${formatCurrency(blueprint.monthly_operating_cost)}`);
    }
  }

  return lines.join('\n');
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function BlueprintExportButton({ blueprint, conceptTitle }: BlueprintExportButtonProps) {
  const safeName = conceptTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase();

  function handleExportJSON() {
    downloadBlob(JSON.stringify(blueprint, null, 2), `${safeName}-blueprint.json`, 'application/json');
  }

  function handleExportMarkdown() {
    const md = blueprintToMarkdown(blueprint, conceptTitle);
    downloadBlob(md, `${safeName}-blueprint.md`, 'text/markdown');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        >
          <Download className="h-3.5 w-3.5" />
          Export
          <ChevronDown className="h-3 w-3 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={handleExportJSON} className="gap-2 text-sm cursor-pointer">
          <FileJson className="h-4 w-4 text-slate-500" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportMarkdown} className="gap-2 text-sm cursor-pointer">
          <FileText className="h-4 w-4 text-slate-500" />
          Export as Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
