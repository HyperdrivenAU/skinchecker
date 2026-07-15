export type Coordinates = {
  latitude: number;
  longitude: number;
};

const knownPostcodes: Record<string, Coordinates> = {
  "0800": { latitude: -12.4634, longitude: 130.8456 },
  "2000": { latitude: -33.8688, longitude: 151.2093 },
  "2150": { latitude: -33.8136, longitude: 151.0034 },
  "3000": { latitude: -37.8136, longitude: 144.9631 },
  "4000": { latitude: -27.4698, longitude: 153.0251 },
  "5000": { latitude: -34.9285, longitude: 138.6007 },
  "6000": { latitude: -31.9523, longitude: 115.8613 },
  "7000": { latitude: -42.8821, longitude: 147.3272 },
};

const stateCentres: Array<{
  min: number;
  max: number;
  coordinates: Coordinates;
}> = [
  { min: 1000, max: 2599, coordinates: knownPostcodes["2000"] },
  { min: 2600, max: 2914, coordinates: { latitude: -35.2809, longitude: 149.13 } },
  { min: 3000, max: 3999, coordinates: knownPostcodes["3000"] },
  { min: 4000, max: 4999, coordinates: knownPostcodes["4000"] },
  { min: 5000, max: 5799, coordinates: knownPostcodes["5000"] },
  { min: 6000, max: 6797, coordinates: knownPostcodes["6000"] },
  { min: 7000, max: 7799, coordinates: knownPostcodes["7000"] },
  { min: 800, max: 999, coordinates: knownPostcodes["0800"] },
];

export function coordinatesForPostcode(postcode?: string): Coordinates | null {
  if (!postcode) return null;
  const normalised = postcode.replace(/\D/g, "").padStart(4, "0").slice(0, 4);

  if (knownPostcodes[normalised]) {
    return knownPostcodes[normalised];
  }

  const numeric = Number(normalised);
  const state = stateCentres.find(
    (item) => numeric >= item.min && numeric <= item.max
  );

  return state?.coordinates ?? null;
}

export function haversineKm(from: Coordinates, to: Coordinates) {
  const radius = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function validCoordinates(
  latitude?: number | null,
  longitude?: number | null
): boolean {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -44 &&
    latitude <= -10 &&
    longitude >= 112 &&
    longitude <= 154
  );
}
