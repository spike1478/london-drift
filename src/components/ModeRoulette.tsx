import { useState, useEffect, useRef } from 'react';
import type { ModeName, ModeConfig } from '../api/types';

interface ModeRouletteProps {
  selectedMode: ModeName;
  allModes: ModeConfig[];
  onSettled?: () => void;
  className?: string;
}

export function ModeRoulette({
  selectedMode,
  allModes,
  onSettled,
  className = '',
}: ModeRouletteProps) {
  const [displayIndex, setDisplayIndex] = useState(0);
  const [settled, setSettled] = useState(false);
  const settledCalled = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const targetIndex = allModes.findIndex((m) => m.id === selectedMode);
  const safeTarget = targetIndex >= 0 ? targetIndex : 0;

  useEffect(() => {
    settledCalled.current = false;
    setSettled(false);

    // Build a spin sequence: several full cycles + land on target
    const totalSpins = allModes.length * 3 + safeTarget;
    let tick = 0;
    let delay = 60;

    const spin = () => {
      tick++;
      setDisplayIndex(tick % allModes.length);

      if (tick >= totalSpins) {
        setDisplayIndex(safeTarget);
        setSettled(true);
        if (!settledCalled.current) {
          settledCalled.current = true;
          onSettled?.();
        }
        return;
      }

      // Decelerate in the last cycle
      const remaining = totalSpins - tick;
      if (remaining < allModes.length) {
        delay = 60 + (allModes.length - remaining) * 30;
      }

      intervalRef.current = setTimeout(spin, delay);
    };

    intervalRef.current = setTimeout(spin, delay);

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [selectedMode, allModes, safeTarget, onSettled]);

  const mode = allModes[displayIndex] ?? allModes[0];

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg
        transition-all duration-150
        ${settled ? 'bg-drift-card' : 'bg-drift-surface'}
        ${className}
      `}
    >
      <span
        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-lg"
        style={{ backgroundColor: mode.colour + '33' }}
      >
        {mode.icon}
      </span>
      <span
        className={`font-mono text-sm font-semibold tracking-wide ${
          settled ? 'text-white' : 'text-white/60'
        }`}
      >
        {mode.name.toUpperCase()}
      </span>
      {settled && (
        <span
          className="w-2 h-2 rounded-full ml-auto"
          style={{ backgroundColor: mode.colour }}
        />
      )}
    </div>
  );
}
