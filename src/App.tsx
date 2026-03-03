import { useState, useCallback } from 'react';
import type { ModeName, PlotTwist as PlotTwistType, Riddle } from './api/types';
import { Layout } from './components/Layout';
import { Intro } from './components/Intro';
import { Landing } from './components/Landing';
import { DriftReveal } from './components/DriftReveal';
import { RouteMap } from './components/RouteMap';
import { JourneyRoute } from './components/JourneyRoute';
import { FareTracker } from './components/FareTracker';
import { ConditionsPanel } from './components/ConditionsPanel';
import { RiddleModal } from './components/RiddleModal';
import { PlotTwist } from './components/PlotTwist';
import { CompletionistDash } from './components/CompletionistDash';
import { AuthPanel } from './components/AuthPanel';
import { useDrift } from './hooks/useDrift';
import { useSound } from './hooks/useSound';
import { useGeolocation } from './hooks/useGeolocation';
import { useCompletionist } from './hooks/useCompletionist';
import { generateRiddle } from './engine/riddles';

export default function App() {
  const { playClick, playChime, isMuted, toggleMute } = useSound();
  const { position } = useGeolocation();
  const { state: completionistState, visitStation, finishDrift, badges } = useCompletionist();
  const { state, plan, generate, completeStation, completeDrift, reset, completedStations } = useDrift([]);

  const [showIntro, setShowIntro] = useState(() => !localStorage.getItem('seen_intro'));
  const [showCompletionist, setShowCompletionist] = useState(false);
  const [showAuth] = useState(false);
  const [activeRiddle, setActiveRiddle] = useState<Riddle | null>(null);
  const [activeTwist, setActiveTwist] = useState<PlotTwistType | null>(null);
  const [fareTotal] = useState(0);
  const [fareCap] = useState(810);

  const handleDrift = useCallback((budget: number, excludedModes: ModeName[]) => {
    generate(budget, excludedModes, position ?? undefined);
  }, [generate, position]);

  const handleRevealComplete = useCallback(() => {
    // Transition from revealing to active (map view)
  }, []);

  const handleStationClick = useCallback((stationId: string) => {
    if (!plan) return;
    // Find the station in the plan
    const allStations = plan.legs.flatMap(l => [l.from, l.to]);
    const station = allStations.find(s => s.naptanId === stationId);
    if (!station || completedStations.has(stationId)) return;

    // Generate riddle from station data (using TflStopPoint-like structure)
    const tflStation = {
      naptanId: station.naptanId,
      commonName: station.name,
      lat: station.lat,
      lon: station.lon,
      modes: station.modes,
      lines: station.lines,
      zone: station.zone,
      additionalProperties: [],
    };
    const riddle = generateRiddle(tflStation);
    if (riddle) {
      setActiveRiddle(riddle);
    } else {
      // No riddle available, just mark as visited
      completeStation(stationId);
      visitStation(stationId);
    }
  }, [plan, completedStations, completeStation, visitStation]);

  const handleRiddleAnswer = useCallback((correct: boolean) => {
    if (correct && activeRiddle) {
      completeStation(activeRiddle.stationId);
      visitStation(activeRiddle.stationId);
    }
    setActiveRiddle(null);
  }, [activeRiddle, completeStation, visitStation]);

  const handleTwistAccept = useCallback(() => {
    setActiveTwist(null);
  }, []);

  const handleCompleteDrift = useCallback(() => {
    if (plan) {
      const newBadges = finishDrift(plan);
      if (newBadges.length > 0) {
        // Could show badge notification here
      }
    }
    completeDrift();
  }, [plan, finishDrift, completeDrift]);

  // Intro screen
  if (showIntro) {
    return <Intro onComplete={() => setShowIntro(false)} />;
  }

  return (
    <Layout
      onMuteToggle={toggleMute}
      isMuted={isMuted}
      onCompletionistOpen={() => setShowCompletionist(!showCompletionist)}
    >
      {/* Landing / Idle state */}
      {state === 'idle' && (
        <Landing onDrift={handleDrift} />
      )}

      {/* Generating state */}
      {state === 'generating' && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-drift-accent font-mono text-lg animate-pulse">
            Generating your drift...
          </div>
        </div>
      )}

      {/* Reveal state */}
      {state === 'revealing' && plan && (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <DriftReveal
            plan={plan}
            onComplete={handleRevealComplete}
            playClick={playClick}
            playChime={playChime}
          />
        </div>
      )}

      {/* Active state - map + journey */}
      {(state === 'active' || state === 'revealing') && plan && plan.legs.length > 0 && (
        <div className="fixed inset-0 pt-14">
          {/* Map */}
          <RouteMap
            legs={plan.legs}
            onStationClick={handleStationClick}
            className="w-full h-full"
          />

          {/* Bottom drawer (mobile) / Sidebar (desktop) */}
          <div className="absolute bottom-0 left-0 right-0 md:right-auto md:top-14 md:w-96 md:bottom-0 bg-drift-bg/95 backdrop-blur-sm border-t md:border-t-0 md:border-r border-white/10 p-4 overflow-y-auto max-h-[40vh] md:max-h-full">
            <JourneyRoute
              legs={plan.legs}
              completedStations={completedStations}
              totalDuration={plan.totalDurationMin}
            />

            <div className="mt-3">
              <FareTracker
                total={fareTotal}
                cap={fareCap}
                percentage={fareCap > 0 ? (fareTotal / fareCap) * 100 : 0}
              />
            </div>

            <div className="mt-3">
              <ConditionsPanel />
            </div>

            <button
              onClick={handleCompleteDrift}
              className="mt-4 w-full py-2.5 rounded-lg bg-drift-success text-white font-medium hover:bg-drift-success/80 transition-colors"
            >
              Complete Drift
            </button>
          </div>
        </div>
      )}

      {/* Completed state */}
      {state === 'completed' && plan && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
          <div className="text-drift-accent font-mono text-2xl font-bold tracking-widest">
            DRIFT COMPLETE
          </div>
          <div className="text-zinc-400 text-center">
            {completedStations.size} stations checked in · {plan.modes.length} modes used
          </div>

          {!localStorage.getItem('auth-token') && (
            <div className="w-full max-w-sm">
              <AuthPanel />
            </div>
          )}

          <button
            onClick={reset}
            className="px-8 py-3 rounded-lg bg-drift-accent text-white font-medium hover:bg-drift-accent/80 transition-colors"
          >
            New Drift
          </button>
        </div>
      )}

      {/* Modals / Overlays */}
      {activeRiddle && (
        <RiddleModal
          riddle={activeRiddle}
          onAnswer={handleRiddleAnswer}
          onClose={() => setActiveRiddle(null)}
        />
      )}

      {activeTwist && (
        <PlotTwist twist={activeTwist} onAccept={handleTwistAccept} />
      )}

      {showCompletionist && (
        <div className="fixed inset-0 z-40 pt-14">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowCompletionist(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 md:right-auto md:w-96 md:top-14 bg-drift-bg border-t md:border-r border-white/10 p-4 overflow-y-auto max-h-[70vh] md:max-h-full z-10">
            <CompletionistDash state={completionistState} badges={badges} />
            {showAuth || !localStorage.getItem('auth-token') ? (
              <div className="mt-4">
                <AuthPanel />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </Layout>
  );
}
