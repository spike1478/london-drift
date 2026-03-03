/** Haversine distance in km */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Check if a point is within circular bounds */
export function isWithinBounds(
  point: { lat: number; lon: number },
  bounds: { center: { lat: number; lon: number }; radiusKm: number }
): boolean {
  return haversineDistance(point.lat, point.lon, bounds.center.lat, bounds.center.lon) <= bounds.radiusKm;
}

/** Find the nearest item to a point */
export function findNearest<T extends { lat: number; lon: number }>(
  point: { lat: number; lon: number },
  items: T[]
): T | null {
  if (items.length === 0) return null;
  let nearest = items[0];
  let minDist = haversineDistance(point.lat, point.lon, nearest.lat, nearest.lon);
  for (let i = 1; i < items.length; i++) {
    const dist = haversineDistance(point.lat, point.lon, items[i].lat, items[i].lon);
    if (dist < minDist) { minDist = dist; nearest = items[i]; }
  }
  return nearest;
}
