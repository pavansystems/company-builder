import { cn } from '@/lib/utils';
import { getScoreColor, getScoreBand, normalizeScore } from '@/lib/utils/scoreUtils';
import { SCORE_BANDS } from '@/lib/constants/scoring';

interface ScoreCardProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showBand?: boolean;
}

const sizeConfig = {
  sm: { diameter: 56, stroke: 4, fontSize: 'text-sm', labelSize: 'text-xs' },
  md: { diameter: 80, stroke: 6, fontSize: 'text-xl', labelSize: 'text-xs' },
  lg: { diameter: 112, stroke: 8, fontSize: 'text-3xl', labelSize: 'text-sm' },
};

export function ScoreCard({ score: rawScore, label, size = 'md', showBand = false }: ScoreCardProps) {
  const score = normalizeScore(rawScore);
  const config = sizeConfig[size];
  const band = getScoreBand(score);
  const bandConfig = SCORE_BANDS[band];
  const colorClass = getScoreColor(score);

  const radius = (config.diameter - config.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  const strokeColor =
    band === 'high' ? '#16a34a' : band === 'medium' ? '#d97706' : '#dc2626';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={config.diameter}
          height={config.diameter}
          viewBox={`0 0 ${config.diameter} ${config.diameter}`}
          className="-rotate-90"
        >
          {/* Track */}
          <circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={config.stroke}
          />
          {/* Progress */}
          <circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={config.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <span
          className={cn(
            'absolute font-bold tabular-nums',
            config.fontSize,
            colorClass
          )}
        >
          {Math.round(score)}
        </span>
      </div>

      <div className="text-center">
        <p className={cn('font-medium text-slate-600', config.labelSize)}>
          {label}
        </p>
        {showBand && (
          <span
            className={cn(
              'inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium',
              bandConfig.bg,
              bandConfig.color,
              bandConfig.border,
              'border'
            )}
          >
            {bandConfig.label}
          </span>
        )}
      </div>
    </div>
  );
}
