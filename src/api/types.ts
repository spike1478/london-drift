// ============================================================
// London Drift - Shared Types Contract
// SINGLE SOURCE OF TRUTH: All modules import from here.
// ============================================================

// --- TfL API Response Types ---

export interface TflStopPoint {
  naptanId: string;
  commonName: string;
  lat: number;
  lon: number;
  modes: string[];
  lines: { id: string; name: string }[];
  zone?: string;
  additionalProperties: { category: string; key: string; value: string }[];
}

export interface TflLine {
  id: string;
  name: string;
  modeName: string;
  lineStatuses: TflLineStatus[];
}

export interface TflLineStatus {
  statusSeverity: number;
  statusSeverityDescription: string;
  reason?: string;
}

export interface TflJourney {
  duration: number;
  fare?: { totalCost: number; fares: { lowZone: number; highZone: number; cost: number }[] };
  legs: TflJourneyLeg[];
}

export interface TflJourneyLeg {
  duration: number;
  instruction: { summary: string; detailed: string };
  departurePoint: { commonName: string; lat: number; lon: number };
  arrivalPoint: { commonName: string; lat: number; lon: number };
  mode: { id: string; name: string };
  routeOptions: { name: string; lineIdentifier: { id: string; name: string } }[];
  path: { lineString: string }; // encoded polyline
}

export interface TflBikePoint {
  id: string;
  commonName: string;
  lat: number;
  lon: number;
  additionalProperties: { key: string; value: string }[];
  // Key properties: NbBikes, NbEmptyDocks, NbDocks
}

export interface TflAirQuality {
  currentForecast: { forecastBand: string; forecastSummary: string; forecastText: string }[];
}

// --- App Domain Types ---

export type ModeName =
  | 'tube' | 'bus' | 'dlr' | 'overground' | 'elizabeth-line'
  | 'tram' | 'cable-car' | 'river-bus' | 'cycle-hire'
  | 'walking';

export interface ModeConfig {
  id: ModeName;
  name: string;
  colour: string;       // TfL official hex
  icon: string;          // Emoji
  speedKmh: number;
  boardingTimeMin: number;
  weight: number;        // Selection weight (uncommon modes 3-5x)
  bounds?: GeoBounds;    // Only for uncommon modes
}

export interface GeoBounds {
  center: { lat: number; lon: number };
  radiusKm: number;
}

export interface DriftPlan {
  id: string;
  legs: DriftLeg[];
  totalDurationMin: number;
  estimatedFare?: number;
  modes: ModeName[];
  createdAt: string;     // ISO timestamp
  timeBudgetMin: number;
  plotTwists: PlotTwist[];
}

export interface DriftLeg {
  from: DriftStation;
  to: DriftStation;
  mode: ModeName;
  line?: string;          // Line name (e.g. "Victoria")
  lineId?: string;        // Line ID (e.g. "victoria")
  durationMin: number;
  distanceKm: number;
  isWalking: boolean;
  polyline?: string;      // Encoded polyline from TfL
  fareZones?: { low: number; high: number };
}

export interface DriftStation {
  naptanId: string;
  name: string;
  lat: number;
  lon: number;
  zone?: string;
  modes: string[];
  lines: { id: string; name: string }[];
}

export interface PlotTwist {
  affectedLeg: number;    // Index into legs array
  reason: string;         // TfL disruption reason
  narrative: string;      // Fun narrative text
  alternativeLeg: DriftLeg;
}

export interface DriftInput {
  stations: TflStopPoint[];
  modeConfigs: ModeConfig[];
  timeBudgetMinutes: number;      // 15-240
  userLocation?: { lat: number; lon: number };
  excludedModes?: ModeName[];
  completionistState?: CompletionistState;
  disruptedLines?: string[];
}

export type DriftState = 'idle' | 'generating' | 'revealing' | 'active' | 'completed';

// --- Completionist / Game Types ---

export interface CompletionistState {
  visitedStations: string[];     // naptanId[]
  completedDrifts: number;
  modeUsage: Record<string, number>;  // mode -> count
  totalDrifts: number;
  badges: string[];              // earned badge IDs
  dailyFares: { date: string; total: number }[];
  lastSyncedAt?: string;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;                  // Emoji
  check: (state: CompletionistState, currentDrift?: DriftPlan) => boolean;
}

export interface Badge {
  id: string;
  earnedAt: string;              // ISO timestamp
}

export interface RiddleTemplate {
  type: 'count' | 'zone' | 'interchange' | 'boolean';
  field?: string;                // additionalProperties key
  question: string;              // Template with {placeholders}
  answerType: 'number' | 'line' | 'yesno';
}

export interface Riddle {
  question: string;
  answer: string | number | boolean;
  tolerance?: number;            // For numeric answers
  stationId: string;
}

export interface RiddleAnswer {
  correct: boolean;
  actualAnswer: string | number | boolean;
}

// --- Auth / Sync Types ---

export interface AuthUser {
  id: string;                    // UUID
  credentials: string[];         // Credential IDs
  createdAt: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  expiresAt: string;
}

export interface WebAuthnCredential {
  credentialId: string;
  publicKey: string;             // Base64
  counter: number;
  userId: string;
  transports?: string[];
}

// --- Share Types ---

export interface SharePayload {
  plan: DriftPlan;
  sharedBy?: string;             // User ID if authed
  createdAt: string;
}

export interface ShareResponse {
  id: string;
  url: string;
}

// --- Daily Fare Cap Constants ---

export const DAILY_FARE_CAPS: Record<string, number> = {
  '1-2': 810,   // pence
  '1-3': 960,
  '1-4': 1170,
  '1-5': 1390,
  '1-6': 1490,
};
