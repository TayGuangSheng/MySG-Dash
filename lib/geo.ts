export function distanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearest<T extends { lat: number; lon: number }>(
  items: readonly T[],
  lat: number,
  lon: number,
): T | undefined {
  let nearest: T | undefined;
  let nearestDistance = Number.POSITIVE_INFINITY;

  items.forEach((item) => {
    const dist = distanceInKm(lat, lon, item.lat, item.lon);
    if (dist < nearestDistance) {
      nearest = item;
      nearestDistance = dist;
    }
  });

  return nearest;
}