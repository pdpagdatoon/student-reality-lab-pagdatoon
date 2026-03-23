export interface DestinationLocationMeta {
  latitude: number;
  longitude: number;
  zoom?: number;
}

export const DESTINATION_LOCATION_META: Record<string, DestinationLocationMeta> = {
  'Atlantic City': { latitude: 39.3643, longitude: -74.4229, zoom: 13 },
  'Cape May': { latitude: 38.9351, longitude: -74.9060, zoom: 13 },
  Wildwood: { latitude: 38.9918, longitude: -74.8149, zoom: 13 },
  'Seaside Heights': { latitude: 39.9443, longitude: -74.0729, zoom: 13 },
  'Asbury Park': { latitude: 40.2204, longitude: -74.0121, zoom: 13 },
  'Long Beach Island': { latitude: 39.6515, longitude: -74.1707, zoom: 12 },
  'Ocean City NJ': { latitude: 39.2776, longitude: -74.5746, zoom: 13 },
  'Sandy Hook': { latitude: 40.4604, longitude: -73.9966, zoom: 12 },
  Princeton: { latitude: 40.3573, longitude: -74.6672, zoom: 13 },
  'Delaware Water Gap': { latitude: 40.9793, longitude: -75.1429, zoom: 12 },
};

export const buildGoogleMapsEmbedUrl = (meta: DestinationLocationMeta) => {
  const zoom = meta.zoom ?? 12;
  return `https://www.google.com/maps?q=${meta.latitude},${meta.longitude}&z=${zoom}&output=embed`;
};

export const buildGoogleMapsOpenUrl = (meta: DestinationLocationMeta) => {
  return `https://www.google.com/maps/search/?api=1&query=${meta.latitude},${meta.longitude}`;
};
