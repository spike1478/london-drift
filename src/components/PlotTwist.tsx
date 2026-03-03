import type { PlotTwist as PlotTwistType } from '../api/types';
import { TFL_COLOURS } from '../data/tfl-colours';

interface PlotTwistProps {
  twist: PlotTwistType;
  onAccept: () => void;
}

export function PlotTwist({ twist, onAccept }: PlotTwistProps) {
  const colour = TFL_COLOURS[twist.alternativeLeg.lineId ?? ''] || '#0098D4';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-drift-surface border border-drift-warning/30 rounded-xl max-w-sm w-full p-6 text-center">
        {/* Header */}
        <div className="text-drift-warning font-mono text-2xl font-bold tracking-widest mb-4">
          PLOT TWIST
        </div>

        {/* Narrative */}
        <p className="text-zinc-300 mb-3 leading-relaxed">
          {twist.narrative}
        </p>

        {/* Reason */}
        {twist.reason && (
          <p className="text-zinc-500 text-sm mb-4 italic">
            {twist.reason}
          </p>
        )}

        {/* Alternative route preview */}
        <div className="bg-drift-card rounded-lg p-3 mb-5 text-left">
          <div className="text-xs text-zinc-400 mb-1">New route:</div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: colour }}
            />
            <span className="text-sm text-zinc-200">
              {twist.alternativeLeg.from.name} → {twist.alternativeLeg.to.name}
            </span>
          </div>
        </div>

        {/* Accept button */}
        <button
          onClick={onAccept}
          className="w-full py-3 rounded-lg bg-drift-accent text-white font-medium hover:bg-drift-accent/80 transition-colors"
        >
          Accept new route
        </button>
      </div>
    </div>
  );
}
