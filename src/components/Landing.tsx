import { useState } from 'react';
import type { ModeName } from '../api/types';
import { TimeBudget } from './TimeBudget';
import { ModeExclude } from './ModeExclude';
import { DriftButton } from './DriftButton';

interface LandingProps {
  onDrift: (budget: number, excludedModes: ModeName[]) => void;
}

export function Landing({ onDrift }: LandingProps) {
  const [timeBudget, setTimeBudget] = useState(60);
  const [excludedModes, setExcludedModes] = useState<ModeName[]>([]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-10 bg-drift-bg">
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-bold text-drift-accent tracking-tight">London Drift</h1>
        <p className="text-white/50 text-lg">Tap. Ride. Discover.</p>
      </div>

      <TimeBudget value={timeBudget} onChange={setTimeBudget} />

      <div className="w-full max-w-md space-y-2">
        <p className="text-sm text-white/40 text-center">Include / exclude modes</p>
        <ModeExclude excluded={excludedModes} onChange={setExcludedModes} />
      </div>

      <DriftButton onClick={() => onDrift(timeBudget, excludedModes)} />
    </div>
  );
}
