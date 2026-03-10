import { PHASES } from '@/lib/constants/phases';
import { PhaseCard, type PhaseStats } from './PhaseCard';

interface PipelineOverviewProps {
  phases: {
    discovery: PhaseStats;
    ideation: PhaseStats;
    validation: PhaseStats;
    blueprint: PhaseStats;
  };
}

export function PipelineOverview({ phases }: PipelineOverviewProps) {
  const phaseData = PHASES.map((phase) => ({
    phase,
    stats: phases[phase.key],
  }));

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          Pipeline by Phase
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {phaseData.map(({ phase, stats }) => (
          <PhaseCard key={phase.id} phase={phase} stats={stats} />
        ))}
      </div>
    </section>
  );
}
