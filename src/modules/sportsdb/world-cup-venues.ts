// Coordenadas públicas de las 16 sedes oficiales del FIFA World Cup 2026 (USA/México/Canadá).
// TheSportsDB no expone idVenue/lat-long para estos eventos futuros, por lo que se mantiene
// esta tabla estática en vez de inventar datos por partido.
export const WORLD_CUP_VENUE_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  'MetLife Stadium': { latitude: 40.8135, longitude: -74.0745 },
  'AT&T Stadium': { latitude: 32.7473, longitude: -97.0945 },
  'Mercedes-Benz Stadium': { latitude: 33.7553, longitude: -84.4006 },
  'Hard Rock Stadium': { latitude: 25.958, longitude: -80.2389 },
  'NRG Stadium': { latitude: 29.6847, longitude: -95.4107 },
  'Lumen Field': { latitude: 47.5952, longitude: -122.3316 },
  "Levi's Stadium": { latitude: 37.4033, longitude: -121.9694 },
  'SoFi Stadium': { latitude: 33.9535, longitude: -118.3392 },
  'Arrowhead Stadium': { latitude: 39.0489, longitude: -94.4839 },
  'GEHA Field at Arrowhead Stadium': { latitude: 39.0489, longitude: -94.4839 },
  'Lincoln Financial Field': { latitude: 39.9008, longitude: -75.1675 },
  'Gillette Stadium': { latitude: 42.0909, longitude: -71.2643 },
  'BC Place': { latitude: 49.2768, longitude: -123.1119 },
  'BMO Field': { latitude: 43.6332, longitude: -79.4185 },
  'Estadio Azteca': { latitude: 19.3029, longitude: -99.1505 },
  'Estadio Akron': { latitude: 20.6828, longitude: -103.4622 },
  'Estadio BBVA': { latitude: 25.6694, longitude: -100.2436 },
  'Estadio Banorte': { latitude: 25.6694, longitude: -100.2436 }
};

export function resolveVenueCoordinates(venueName: string | null | undefined): { latitude: number; longitude: number } | null {
  if (!venueName) return null;
  const trimmed = venueName.trim();
  if (WORLD_CUP_VENUE_COORDINATES[trimmed]) return WORLD_CUP_VENUE_COORDINATES[trimmed];

  const normalized = Object.keys(WORLD_CUP_VENUE_COORDINATES).find((key) => key.toLowerCase() === trimmed.toLowerCase());
  return normalized ? WORLD_CUP_VENUE_COORDINATES[normalized] : null;
}
