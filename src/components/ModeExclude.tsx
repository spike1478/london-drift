import type { ModeName } from '../api/types';
import { MODE_CONFIGS } from '../data/mode-config';

interface ModeExcludeProps {
  excluded: ModeName[];
  onChange: (excluded: ModeName[]) => void;
}

export function ModeExclude({ excluded, onChange }: ModeExcludeProps) {
  const toggle = (mode: ModeName) => {
    if (excluded.includes(mode)) {
      onChange(excluded.filter((m) => m !== mode));
    } else {
      onChange([...excluded, mode]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {MODE_CONFIGS.map((mode) => {
        const isExcluded = excluded.includes(mode.id);
        return (
          <button
            key={mode.id}
            onClick={() => toggle(mode.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all
              ${isExcluded
                ? 'border border-white/20 text-white/40 bg-transparent'
                : 'text-white border border-transparent'
              }
            `}
            style={isExcluded ? {} : { backgroundColor: mode.colour + '33', borderColor: mode.colour }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: isExcluded ? '#666' : mode.colour }}
            />
            {mode.name}
          </button>
        );
      })}
    </div>
  );
}
