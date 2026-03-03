import type { BadgeDefinition } from '../api/types';

interface BadgeCardProps {
  badge: BadgeDefinition;
  earned: boolean;
  earnedAt?: string;
}

export function BadgeCard({ badge, earned, earnedAt }: BadgeCardProps) {
  return (
    <div
      className={`
        rounded-xl border p-3 text-center transition-all
        ${earned
          ? 'bg-drift-card border-drift-accent/30'
          : 'bg-drift-surface/50 border-white/5 opacity-40'
        }
      `}
    >
      <div className={`text-2xl mb-1 ${earned ? '' : 'grayscale'}`}>
        {badge.icon}
      </div>
      <p className="text-xs font-mono font-bold text-white truncate">{badge.name}</p>
      {earned ? (
        <>
          <p className="text-[10px] text-white/50 mt-1 line-clamp-2">{badge.description}</p>
          {earnedAt && (
            <p className="text-[9px] text-drift-accent/60 mt-1">
              {new Date(earnedAt).toLocaleDateString()}
            </p>
          )}
        </>
      ) : (
        <p className="text-[10px] text-white/30 mt-1">Locked</p>
      )}
    </div>
  );
}
