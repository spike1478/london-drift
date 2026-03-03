import { useState, useEffect, useRef, useCallback } from 'react';
import type { DriftPlan } from '../api/types';
import { MODE_CONFIGS } from '../data/mode-config';
import { TFL_COLOURS } from '../data/tfl-colours';
import { SolariBoard } from './SolariBoard';
import { ModeRoulette } from './ModeRoulette';

interface DriftRevealProps {
  plan: DriftPlan;
  onComplete: () => void;
  playClick: () => void;
  playChime: () => void;
}

type Phase = 'modes' | 'stations' | 'done';

export function DriftReveal({ plan, onComplete, playClick, playChime }: DriftRevealProps) {
  const [phase, setPhase] = useState<Phase>('modes');
  const [, setModesSettled] = useState<Set<number>>(new Set());
  const [visibleModes, setVisibleModes] = useState<Set<number>>(new Set());
  const [stationIndex, setStationIndex] = useState(-1);
  const [, setStationsComplete] = useState<Set<number>>(new Set());
  const completeCalled = useRef(false);

  const uniqueModes = plan.modes;

  // Build station list from legs
  const stations: { name: string; mode: string; lineId?: string }[] = [];
  if (plan.legs.length > 0) {
    stations.push({
      name: plan.legs[0].from.name,
      mode: plan.legs[0].mode,
      lineId: plan.legs[0].lineId,
    });
    for (const leg of plan.legs) {
      stations.push({
        name: leg.to.name,
        mode: leg.mode,
        lineId: leg.lineId,
      });
    }
  }

  // Stagger mode appearances
  useEffect(() => {
    uniqueModes.forEach((_, i) => {
      setTimeout(() => {
        setVisibleModes((prev) => new Set(prev).add(i));
      }, i * 500);
    });
  }, [uniqueModes]);

  const handleModeSettled = useCallback(
    (index: number) => {
      setModesSettled((prev) => {
        const next = new Set(prev).add(index);
        if (next.size === uniqueModes.length) {
          setPhase('stations');
          setStationIndex(0);
        }
        return next;
      });
    },
    [uniqueModes.length],
  );

  const handleStationComplete = useCallback(
    (index: number) => {
      setStationsComplete((prev) => {
        const next = new Set(prev).add(index);
        if (next.size === stations.length) {
          playChime();
          setPhase('done');
          setTimeout(() => {
            if (!completeCalled.current) {
              completeCalled.current = true;
              onComplete();
            }
          }, 500);
        }
        return next;
      });
      // Show next station
      setStationIndex((prev) => prev + 1);
    },
    [stations.length, playChime, onComplete],
  );

  const getLineColour = (lineId?: string, mode?: string): string => {
    if (lineId && TFL_COLOURS[lineId]) return TFL_COLOURS[lineId];
    if (mode && TFL_COLOURS[mode]) return TFL_COLOURS[mode];
    return '#0098D4';
  };

  return (
    <div className="flex flex-col gap-6 p-4 bg-drift-surface rounded-xl max-w-md mx-auto">
      {/* Modes row */}
      <div className="flex flex-wrap gap-2">
        {uniqueModes.map((mode, i) => (
          <div
            key={mode}
            className={`transition-opacity duration-300 ${
              visibleModes.has(i) ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {visibleModes.has(i) && (
              <ModeRoulette
                selectedMode={mode}
                allModes={MODE_CONFIGS}
                onSettled={() => handleModeSettled(i)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Divider */}
      {phase !== 'modes' && <div className="h-px bg-white/10" />}

      {/* Stations list */}
      <div className="flex flex-col gap-1">
        {stations.map((station, i) => {
          if (i > stationIndex) return null;
          const colour = getLineColour(station.lineId, station.mode);

          return (
            <div key={`${station.name}-${i}`} className="flex items-center gap-3">
              {/* Colour dot and connecting line */}
              <div className="flex flex-col items-center w-4">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: colour }}
                />
                {i < stations.length - 1 && (
                  <span
                    className="w-0.5 h-4 mt-1"
                    style={{ backgroundColor: colour + '66' }}
                  />
                )}
              </div>

              {/* Station name */}
              <SolariBoard
                text={station.name}
                speed={40}
                playClick={playClick}
                onComplete={() => handleStationComplete(i)}
              />
            </div>
          );
        })}
      </div>

      {/* Completion state */}
      {phase === 'done' && (
        <div className="text-center text-drift-accent font-mono text-sm tracking-widest opacity-0 animate-[card-slide-in_0.3s_ease-out_forwards]">
          ROUTE LOCKED IN
        </div>
      )}
    </div>
  );
}
