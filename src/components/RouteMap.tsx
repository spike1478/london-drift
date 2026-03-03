import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DriftLeg } from '../api/types';
import { TFL_COLOURS } from '../data/tfl-colours';
import { MODE_CONFIGS } from '../data/mode-config';

interface RouteMapProps {
  legs: DriftLeg[];
  activeStationIndex?: number;
  onStationClick?: (stationId: string) => void;
  className?: string;
}

const LONDON_CENTER: LatLngTuple = [51.505, -0.12];
const DEFAULT_ZOOM = 12;
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>';

/** Get line colour from TFL_COLOURS, falling back to mode colour from MODE_CONFIGS */
function getLineColour(lineId?: string, mode?: string): string {
  if (lineId && TFL_COLOURS[lineId]) return TFL_COLOURS[lineId];
  if (mode) {
    const modeConfig = MODE_CONFIGS.find(m => m.id === mode);
    if (modeConfig) return modeConfig.colour;
    if (TFL_COLOURS[mode]) return TFL_COLOURS[mode];
  }
  return '#CCCCCC';
}

interface UniqueStation {
  naptanId: string;
  name: string;
  lat: number;
  lon: number;
  colour: string;
  index: number;
}

/** Extract unique stations from legs in order */
function extractStations(legs: DriftLeg[]): UniqueStation[] {
  const seen = new Map<string, UniqueStation>();
  let index = 0;

  for (const leg of legs) {
    if (!seen.has(leg.from.naptanId)) {
      seen.set(leg.from.naptanId, {
        naptanId: leg.from.naptanId,
        name: leg.from.name,
        lat: leg.from.lat,
        lon: leg.from.lon,
        colour: getLineColour(leg.lineId, leg.mode),
        index: index++,
      });
    }
    if (!seen.has(leg.to.naptanId)) {
      seen.set(leg.to.naptanId, {
        naptanId: leg.to.naptanId,
        name: leg.to.name,
        lat: leg.to.lat,
        lon: leg.to.lon,
        colour: getLineColour(leg.lineId, leg.mode),
        index: index++,
      });
    }
  }

  return Array.from(seen.values());
}

/** Child component that fits bounds when legs change */
function FitBounds({ legs }: { legs: DriftLeg[] }) {
  const map = useMap();

  useEffect(() => {
    if (legs.length === 0) return;

    const points: LatLngTuple[] = [];
    for (const leg of legs) {
      points.push([leg.from.lat, leg.from.lon]);
      points.push([leg.to.lat, leg.to.lon]);
    }

    if (points.length > 0) {
      map.fitBounds(points as LatLngBoundsExpression, { padding: [40, 40] });
    }
  }, [legs, map]);

  return null;
}

export function RouteMap({ legs, activeStationIndex, onStationClick, className }: RouteMapProps) {
  const stations = useMemo(() => extractStations(legs), [legs]);

  const polylines = useMemo(() => {
    return legs.map((leg, i) => ({
      key: `leg-${i}`,
      positions: [[leg.from.lat, leg.from.lon], [leg.to.lat, leg.to.lon]] as LatLngTuple[],
      colour: getLineColour(leg.lineId, leg.mode),
      isDashed: leg.isWalking,
    }));
  }, [legs]);

  return (
    <MapContainer
      center={LONDON_CENTER}
      zoom={DEFAULT_ZOOM}
      className={className}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <FitBounds legs={legs} />

      {/* Polylines for each leg */}
      {polylines.map(({ key, positions, colour, isDashed }) => (
        <Polyline
          key={key}
          positions={positions}
          pathOptions={{
            color: colour,
            weight: 4,
            opacity: 0.85,
            dashArray: isDashed ? '8 12' : undefined,
          }}
        />
      ))}

      {/* Station markers */}
      {stations.map((station) => {
        const isActive = activeStationIndex !== undefined && station.index === activeStationIndex;
        return (
          <CircleMarker
            key={station.naptanId}
            center={[station.lat, station.lon]}
            radius={isActive ? 12 : 8}
            pathOptions={{
              fillColor: station.colour,
              fillOpacity: isActive ? 1 : 0.85,
              color: '#ffffff',
              weight: isActive ? 3 : 1.5,
              opacity: 1,
            }}
            eventHandlers={{
              click: () => onStationClick?.(station.naptanId),
            }}
          >
            <Popup>
              <span className="text-sm font-medium">{station.name}</span>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
