import type { BadgeDefinition } from '../api/types';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first-drift',
    name: 'First Drift',
    description: 'Complete your first drift',
    icon: '🎯',
    check: (state) => state.completedDrifts >= 1,
  },
  {
    id: 'mode-mixer',
    name: 'Mode Mixer',
    description: 'Use 5+ different transport modes across all drifts',
    icon: '🔀',
    check: (state) => Object.keys(state.modeUsage).length >= 5,
  },
  {
    id: 'modebreaker',
    name: 'Modebreaker',
    description: 'Use all transport modes',
    icon: '💥',
    check: (state) => Object.keys(state.modeUsage).length >= 9,
  },
  {
    id: 'zone-hopper',
    name: 'Zone Hopper',
    description: 'Visit stations in 4+ zones in one drift',
    icon: '🦘',
    check: (_state, drift) => {
      if (!drift) return false;
      const zones = new Set(drift.legs.flatMap(l => [l.from.zone, l.to.zone]).filter(Boolean));
      return zones.size >= 4;
    },
  },
  {
    id: 'zone-6-explorer',
    name: 'Zone 6 Explorer',
    description: 'Visit 5+ Zone 6 stations',
    icon: '🗺️',
    check: (_state, drift) => {
      if (!drift) return false;
      const z6 = new Set(
        drift.legs
          .flatMap(l => [l.from, l.to])
          .filter(s => s.zone === '6')
          .map(s => s.naptanId),
      );
      return z6.size >= 5;
    },
  },
  {
    id: 'river-runner',
    name: 'River Runner',
    description: 'Take the river bus 3+ times',
    icon: '🚢',
    check: (state) => (state.modeUsage['river-bus'] || 0) >= 3,
  },
  {
    id: 'cable-rider',
    name: 'Cable Rider',
    description: 'Take the Emirates cable car',
    icon: '🚡',
    check: (state) => (state.modeUsage['cable-car'] || 0) >= 1,
  },
  {
    id: 'night-drifter',
    name: 'Night Drifter',
    description: 'Generate a drift after 9pm',
    icon: '🌙',
    check: () => new Date().getHours() >= 21,
  },
  {
    id: 'century',
    name: 'Century',
    description: 'Visit 100 unique stations',
    icon: '💯',
    check: (state) => state.visitedStations.length >= 100,
  },
  {
    id: 'plot-twist-survivor',
    name: 'Plot Twist Survivor',
    description: 'Complete a drift with a disruption reroute',
    icon: '🌪️',
    check: (_state, drift) => !!drift && drift.plotTwists.length > 0,
  },
  {
    id: 'speed-drifter',
    name: 'Speed Drifter',
    description: 'Complete a 30-minute budget drift',
    icon: '⚡',
    check: (_state, drift) => !!drift && drift.timeBudgetMin <= 30,
  },
  {
    id: 'circle-completer',
    name: 'Circle Completer',
    description: 'Visit every Circle line station',
    icon: '⭕',
    check: (state) => state.visitedStations.length >= 36,
  },
];
