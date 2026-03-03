interface ConditionsPanelProps {
  airQuality?: string;
  bikesAvailable?: number;
  className?: string;
}

export function ConditionsPanel({ airQuality, bikesAvailable, className = '' }: ConditionsPanelProps) {
  return (
    <div className={`flex flex-wrap gap-3 text-xs ${className}`}>
      {airQuality && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-drift-card border border-white/5">
          <span className="text-zinc-400">Air:</span>
          <span className="text-zinc-200">{airQuality}</span>
        </div>
      )}
      {bikesAvailable !== undefined && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-drift-card border border-white/5">
          <span className="text-zinc-400">Bikes:</span>
          <span className="text-zinc-200">{bikesAvailable} available</span>
        </div>
      )}
    </div>
  );
}
