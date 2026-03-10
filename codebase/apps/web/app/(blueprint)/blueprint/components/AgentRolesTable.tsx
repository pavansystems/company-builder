import type { AgentRole, HumanRole } from '@company-builder/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { Bot, User } from 'lucide-react';

interface AgentRolesTableProps {
  agentRoles: AgentRole[];
  humanRoles: HumanRole[];
}

export function AgentRolesTable({ agentRoles, humanRoles }: AgentRolesTableProps) {
  const totalAgentCost = agentRoles.reduce((sum, r) => sum + (r.cost_usd_per_month ?? 0), 0);
  const totalHumanCost = humanRoles.reduce((sum, r) => sum + r.cost_usd_per_year * r.headcount, 0);
  const agentCount = agentRoles.length;
  const humanCount = humanRoles.reduce((sum, r) => sum + r.headcount, 0);

  return (
    <div className="space-y-6">
      {/* AI Agent Roles */}
      {agentRoles.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-700">AI Agent Roles</h3>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-50/60 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Responsibilities
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tools
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Monthly Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agentRoles.map((role, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{role.role}</div>
                      <div className="text-[10px] text-slate-400 capitalize mt-0.5">
                        {role.agent_or_human}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ul className="space-y-1">
                        {role.responsibilities.slice(0, 3).map((r, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 mt-1 shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {role.tools.slice(0, 4).map((t, j) => (
                          <span
                            key={j}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700 tabular-nums">
                      {role.cost_usd_per_month != null
                        ? formatCurrency(role.cost_usd_per_month)
                        : '—'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-emerald-50/40 border-t-2 border-emerald-200">
                  <td colSpan={3} className="px-4 py-3 text-xs font-bold text-emerald-700">
                    Total Agent Cost
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-emerald-700 tabular-nums">
                    {formatCurrency(totalAgentCost)}/mo
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Human Roles */}
      {humanRoles.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <User className="h-4 w-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-700">Human Roles</h3>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Responsibilities
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    FTE
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Annual Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {humanRoles.map((role, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{role.role}</td>
                    <td className="px-4 py-3">
                      <ul className="space-y-1">
                        {role.responsibilities.slice(0, 3).map((r, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1 shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700 tabular-nums">
                      {role.headcount}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700 tabular-nums">
                      {formatCurrency(role.cost_usd_per_year * role.headcount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100/40 border-t-2 border-slate-200">
                  <td colSpan={3} className="px-4 py-3 text-xs font-bold text-slate-700">
                    Total Human Cost
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-700 tabular-nums">
                    {formatCurrency(totalHumanCost)}/yr
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Agent:Human ratio */}
      {(agentCount > 0 || humanCount > 0) && (
        <div className="flex items-center justify-center p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="text-center">
            <p className="text-3xl font-black text-emerald-700">
              {humanCount > 0 ? `${agentCount}:${humanCount}` : `${agentCount}:0`}
            </p>
            <p className="text-sm text-emerald-600 mt-1">Agents to Human ratio</p>
          </div>
        </div>
      )}
    </div>
  );
}
