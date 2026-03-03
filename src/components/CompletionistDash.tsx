import type { CompletionistState, BadgeDefinition } from '../api/types';
import { BadgeCard } from './BadgeCard';

interface CompletionistDashProps {
  state: CompletionistState;
  badges: BadgeDefinition[];
}

export function CompletionistDash({ state, badges }: CompletionistDashProps) {
  const modeEntries = Object.entries(state.modeUsage).sort((a, b) => b[1] - a[1]);
  const maxUsage = modeEntries.length > 0 ? modeEntries[0][1] : 1;

  return (
    <div className="bg-drift-surface rounded-2xl p-5 space-y-6">
      {/* Stats row */}
      <div className="flex gap-4">
        <div className="flex-1 bg-drift-card rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-drift-accent">{state.visitedStations.length}</p>
          <p className="text-xs text-white/50 mt-1">Stations visited</p>
        </div>
        <div className="flex-1 bg-drift-card rounded-xl p-4 text-center">
          <p className="text-2xl font-mono font-bold text-drift-accent">{state.completedDrifts}</p>
          <p className="text-xs text-white/50 mt-1">Drifts completed</p>
        </div>
      </div>

      {/* Mode usage bars */}
      {modeEntries.length > 0 && (
        <div>
          <h4 className="text-xs font-mono text-white/40 uppercase tracking-wider mb-3">Mode Usage</h4>
          <div className="space-y-2">
            {modeEntries.map(([mode, count]) => (
              <div key={mode} className="flex items-center gap-3">
                <span className="text-xs font-mono text-white/60 w-28 truncate">{mode}</span>
                <div className="flex-1 h-2 bg-drift-card rounded-full overflow-hidden">
                  <div
                    className="h-full bg-drift-accent rounded-full transition-all"
                    style={{ width: `${(count / maxUsage) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-white/40 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badge grid */}
      <div>
        <h4 className="text-xs font-mono text-white/40 uppercase tracking-wider mb-3">Badges</h4>
        <div className="grid grid-cols-3 gap-2">
          {badges.map(badge => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              earned={state.badges.includes(badge.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
