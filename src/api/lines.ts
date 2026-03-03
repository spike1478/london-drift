import { apiFetch } from './client';
import type { TflStopPoint } from './types';

interface TflRawStopPoint {
  naptanId: string;
  commonName: string;
  lat: number;
  lon: number;
  modes: string[];
  lineModeGroups?: { modeName: string; lineIdentifier: string[] }[];
  additionalProperties?: { category: string; key: string; value: string }[];
  stopType?: string;
}

function mapTflResponse(raw: TflRawStopPoint[]): TflStopPoint[] {
  return raw
    .filter((s) => s.stopType !== 'NaptanBusCoachStation' && s.stopType !== 'NaptanBusWayPoint')
    .map((s) => {
      const zoneProp = s.additionalProperties?.find((p) => p.key === 'Zone');
      const lines: { id: string; name: string }[] = [];
      if (s.lineModeGroups) {
        for (const group of s.lineModeGroups) {
          for (const lineId of group.lineIdentifier) {
            lines.push({ id: lineId, name: lineId });
          }
        }
      }
      return {
        naptanId: s.naptanId,
        commonName: s.commonName,
        lat: s.lat,
        lon: s.lon,
        modes: s.modes ?? [],
        lines,
        zone: zoneProp?.value,
        additionalProperties: s.additionalProperties ?? [],
      };
    });
}

export async function fetchStopPoints(lineId: string): Promise<TflStopPoint[]> {
  const raw = await apiFetch<TflRawStopPoint[]>(`/tfl/Line/${lineId}/StopPoints`);
  return mapTflResponse(raw);
}
