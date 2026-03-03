import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchStopPoints } from '../api/lines';
import type { TflStopPoint } from '../api/types';

const CACHE_KEY = 'london-drift:station-cache';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  stations: TflStopPoint[];
  storedAt: number;
}

function readCache(): TflStopPoint[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.storedAt > TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return entry.stations;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function writeCache(stations: TflStopPoint[]): void {
  const entry: CacheEntry = { stations, storedAt: Date.now() };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable; silently ignore
  }
}

export function useStationCache(lineIds: string[]) {
  const [stations, setStations] = useState<TflStopPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const load = useCallback(async () => {
    if (lineIds.length === 0) return;

    const cached = readCache();
    if (cached && cached.length > 0) {
      setStations(cached);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled(lineIds.map(fetchStopPoints));
      const flat = results
        .filter((r): r is PromiseFulfilledResult<TflStopPoint[]> => r.status === 'fulfilled')
        .flatMap((r) => r.value);

      // Deduplicate by naptanId
      const seen = new Set<string>();
      const unique = flat.filter((s) => {
        if (seen.has(s.naptanId)) return false;
        seen.add(s.naptanId);
        return true;
      });

      if (unique.length === 0) {
        setError('No stations loaded. Check your connection and try again.');
        return;
      }

      writeCache(unique);
      setStations(unique);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stations');
    } finally {
      setLoading(false);
    }
  }, [lineIds.join(',')]);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      load();
    }
  }, [load]);

  const invalidate = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    fetchedRef.current = false;
    load();
  }, [load]);

  return { stations, loading, error, invalidate };
}
