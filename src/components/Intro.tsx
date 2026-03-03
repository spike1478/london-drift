import { useState, useEffect, useCallback } from 'react';
import { SolariBoard } from './SolariBoard';

interface IntroProps {
  onComplete: () => void;
}

const DEMO_STATIONS = ['BANK', 'CANARY WHARF', 'GREENWICH'];

export function Intro({ onComplete }: IntroProps) {
  const [currentStation, setCurrentStation] = useState(0);
  const [fading, setFading] = useState(false);

  // Skip if already seen
  useEffect(() => {
    if (localStorage.getItem('seen_intro') === 'true') {
      onComplete();
    }
  }, [onComplete]);

  const finish = useCallback(() => {
    setFading(true);
    localStorage.setItem('seen_intro', 'true');
    setTimeout(() => onComplete(), 400);
  }, [onComplete]);

  const handleStationComplete = useCallback(() => {
    if (currentStation < DEMO_STATIONS.length - 1) {
      setTimeout(() => setCurrentStation((prev) => prev + 1), 300);
    } else {
      setTimeout(finish, 800);
    }
  }, [currentStation, finish]);

  // Already seen
  if (localStorage.getItem('seen_intro') === 'true') {
    return null;
  }

  return (
    <div
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center
        bg-drift-bg transition-opacity duration-400
        ${fading ? 'opacity-0' : 'opacity-100'}
      `}
    >
      {/* Skip button */}
      <button
        onClick={finish}
        className="absolute top-4 right-4 text-white/40 hover:text-white/70 font-mono text-sm tracking-wider transition-colors cursor-pointer"
      >
        SKIP
      </button>

      {/* Title */}
      <h1 className="font-mono text-drift-accent text-2xl tracking-[0.3em] mb-12 opacity-80">
        LONDON DRIFT
      </h1>

      {/* Demo stations */}
      <div className="flex flex-col items-center gap-4">
        {DEMO_STATIONS.slice(0, currentStation + 1).map((station, i) => (
          <div
            key={station}
            className="card-enter"
          >
            <SolariBoard
              text={station}
              speed={45}
              onComplete={i === currentStation ? handleStationComplete : undefined}
            />
          </div>
        ))}
      </div>

      {/* Tagline */}
      <p className="mt-12 text-white/30 font-mono text-xs tracking-widest">
        YOUR RANDOM LONDON ADVENTURE
      </p>
    </div>
  );
}
