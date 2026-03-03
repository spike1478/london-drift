import type { DriftLeg } from '../api/types';
import { JourneyCard } from './JourneyCard';
import { formatDuration } from '../utils/format';

interface JourneyRouteProps {
  legs: DriftLeg[];
  completedStations: Set<string>;
  totalDuration: number;
  className?: string;
}

export function JourneyRoute({ legs, completedStations, totalDuration, className = '' }: JourneyRouteProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-2 border-b border-white/10">
        <span className="text-xs font-mono text-zinc-400 tracking-wider uppercase">Route</span>
        <span className="text-xs text-zinc-500">{formatDuration(totalDuration)}</span>
      </div>

      {/* Journey cards */}
      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[60vh]">
        {legs.map((leg, i) => (
          <JourneyCard
            key={`${leg.from.naptanId}-${leg.to.naptanId}-${i}`}
            leg={leg}
            index={i}
            isCompleted={
              completedStations.has(leg.from.naptanId) &&
              completedStations.has(leg.to.naptanId)
            }
          />
        ))}
      </div>
    </div>
  );
}
