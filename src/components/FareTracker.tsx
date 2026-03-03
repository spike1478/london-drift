import { formatFarePence } from '../engine/fare';

interface FareTrackerProps {
  total: number;
  cap: number;
  percentage: number;
}

export function FareTracker({ total, cap, percentage }: FareTrackerProps) {
  return (
    <div className="bg-drift-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Daily cap</span>
        <span className="text-sm font-mono text-white/70">
          {formatFarePence(total)} / {formatFarePence(cap)}
        </span>
      </div>
      <div className="h-3 bg-drift-surface rounded-full overflow-hidden">
        <div
          className="h-full bg-drift-fare rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
