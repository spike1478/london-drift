import type { DriftLeg } from '../api/types';
import { TFL_COLOURS } from '../data/tfl-colours';
import { formatDuration, formatDistance } from '../utils/format';

interface JourneyCardProps {
  leg: DriftLeg;
  index: number;
  isCompleted?: boolean;
}

export function JourneyCard({ leg, index, isCompleted }: JourneyCardProps) {
  const colour = TFL_COLOURS[leg.lineId ?? ''] || TFL_COLOURS[leg.mode] || '#0098D4';

  return (
    <div
      className={`card-enter flex items-start gap-3 p-3 rounded-lg bg-drift-card/80 border border-white/5 ${
        isCompleted ? 'opacity-60' : ''
      }`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Mode indicator */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
          style={{ backgroundColor: colour + '30', border: `2px solid ${colour}` }}
        >
          {leg.isWalking ? '\u{1F6B6}' : leg.mode === 'cycle-hire' ? '\u{1F6B2}' : '\u{1F686}'}
        </div>
        {leg.line && (
          <span className="text-[10px] font-mono text-zinc-400 text-center leading-tight max-w-[60px] truncate">
            {leg.line}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-zinc-300 truncate">{leg.from.name}</div>
        <div className="text-xs text-zinc-500 my-0.5">
          {formatDuration(leg.durationMin)} · {formatDistance(leg.distanceKm)}
        </div>
        <div className="text-sm text-white font-medium truncate">{leg.to.name}</div>
      </div>

      {/* Completed check */}
      {isCompleted && (
        <span className="text-drift-success text-lg shrink-0">&#10003;</span>
      )}
    </div>
  );
}
