interface TimeBudgetProps {
  value: number;
  onChange: (value: number) => void;
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}min`;
}

export function TimeBudget({ value, onChange }: TimeBudgetProps) {
  return (
    <div className="w-full max-w-sm space-y-2">
      <div className="flex justify-between text-sm text-white/60">
        <span>Time budget</span>
        <span className="font-mono text-drift-accent">{formatTime(value)}</span>
      </div>
      <input
        type="range"
        min={15}
        max={240}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-drift-card
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-5
          [&::-webkit-slider-thumb]:h-5
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-drift-accent
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-5
          [&::-moz-range-thumb]:h-5
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-drift-accent
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:cursor-pointer"
      />
      <div className="flex justify-between text-xs text-white/30">
        <span>15 min</span>
        <span>4h</span>
      </div>
    </div>
  );
}
