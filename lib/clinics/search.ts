import { clinicConfig, isLikelyMetroPostcode } from "./config";
import {
  coordinatesForPostcode,
  haversineKm,
  validCoordinates,
} from "./postcodes";
import type {
  Clinic,
  ClinicSearchInput,
  ClinicSearchResponse,
  ClinicSearchResult,
} from "./types";

type ClinicSearchOptions = Pick<
  typeof clinicConfig,
  "metroRadiusKm" | "regionalRadiusKm" | "maxResults"
>;

const relevantTerms = [
  "skin",
  "skin cancer",
  "dermatology",
  "dermatologist",
  "lesion",
  "mole",
  "gp",
  "general practice",
];

function normaliseText(value: unknown) {
  return String(value ?? "").toLowerCase();
}

function isPreferredPartner(clinic: Clinic) {
  const relationshipStatus = normaliseText(clinic.relationshipStatus);
  return (
    relationshipStatus === "preferred partner" ||
    relationshipStatus === "preferred" ||
    normaliseText(clinic.subscriptionPlan).includes("preferred")
  );
}

export function isClinicSearchable(clinic: Clinic) {
  if (!clinic.active || !clinic.displayInApp) return false;
  if (
    normaliseText(clinic.relationshipStatus) === "do not contact" ||
    normaliseText(clinic.relationshipStatus) === "do_not_contact" ||
    normaliseText(clinic.relationshipStatus) === "inactive" ||
    normaliseText(clinic.relationshipStatus) === "suspended"
  ) return false;
  if (normaliseText(clinic.salesStatus) === "do not contact") return false;
  if (!clinic.name?.trim()) return false;

  const haystack = [
    clinic.name,
    clinic.clinicType,
    clinic.publicNotes,
    clinic.servicesOffered?.join(" "),
  ]
    .map(normaliseText)
    .join(" ");

  return relevantTerms.some((term) => haystack.includes(term));
}

function priorityValue(clinic: Clinic) {
  return clinic.priority ?? clinic.priorityLevel ?? 0;
}

function clinicDistanceKm(clinic: Clinic, searchPoint: { latitude: number; longitude: number } | null) {
  if (!searchPoint) return null;
  if (!validCoordinates(clinic.latitude, clinic.longitude)) return null;
  if (typeof clinic.latitude !== "number" || typeof clinic.longitude !== "number") {
    return null;
  }

  return haversineKm(searchPoint, {
    latitude: clinic.latitude,
    longitude: clinic.longitude,
  });
}

function byDistanceThenPriority(a: ClinicSearchResult, b: ClinicSearchResult) {
  const aDistance = a.distanceKm ?? Number.POSITIVE_INFINITY;
  const bDistance = b.distanceKm ?? Number.POSITIVE_INFINITY;
  const distanceGap = aDistance - bDistance;

  if (Math.abs(distanceGap) > 5) return distanceGap;
  return priorityValue(b.clinic) - priorityValue(a.clinic) || distanceGap;
}

export function searchClinics(
  clinics: Clinic[],
  input: ClinicSearchInput,
  options: ClinicSearchOptions = clinicConfig
): ClinicSearchResponse {
  const deviceLocation =
    typeof input.latitude === "number" &&
    typeof input.longitude === "number" &&
    validCoordinates(input.latitude, input.longitude)
      ? { latitude: input.latitude, longitude: input.longitude }
      : null;
  const postcodeLocation = coordinatesForPostcode(input.postcode);
  const searchPoint = deviceLocation ?? postcodeLocation;
  const source = deviceLocation
    ? "device"
    : postcodeLocation
      ? "postcode"
      : input.postcode
        ? "manual-postcode"
        : "unknown";
  const radiusKm = isLikelyMetroPostcode(input.postcode)
    ? options.metroRadiusKm
    : options.regionalRadiusKm;

  const candidates = clinics
    .filter(isClinicSearchable)
    .map((clinic) => ({
      clinic,
      distanceKm: clinicDistanceKm(clinic, searchPoint),
      listingType: isPreferredPartner(clinic) ? "preferred" as const : "free" as const,
      position: 0,
    }))
    .filter((result) => {
      if (!searchPoint) return true;
      if (result.distanceKm === null) return false;
      return result.distanceKm <= radiusKm;
    });

  const preferred = candidates
    .filter((result) => result.listingType === "preferred")
    .sort(byDistanceThenPriority);

  const pool = preferred.length
    ? preferred
    : candidates
        .filter((result) => result.listingType === "free")
        .sort(byDistanceThenPriority);

  const results = pool.slice(0, options.maxResults).map((result, index) => ({
    ...result,
    position: index + 1,
    distanceKm:
      result.distanceKm === null ? null : Math.round(result.distanceKm * 10) / 10,
  }));

  return {
    results,
    source,
    radiusKm,
    usedFallback: preferred.length === 0 && results.some((result) => result.listingType === "free"),
    searchedLatitude: searchPoint?.latitude,
    searchedLongitude: searchPoint?.longitude,
    message: results.length
      ? undefined
      : "No nearby clinics were found.",
  };
}

export function calculateUpgradeScore(impressions: Array<{
  websiteClicked?: boolean;
  bookingLinkClicked?: boolean;
  phoneClicked?: boolean;
  userPostcode?: string;
}>) {
  const postcodeCounts = new Map<string, number>();
  let score = 0;

  for (const impression of impressions) {
    score += 1;
    if (impression.websiteClicked) score += 5;
    if (impression.bookingLinkClicked) score += 10;
    if (impression.phoneClicked) score += 10;
    if (impression.userPostcode) {
      postcodeCounts.set(
        impression.userPostcode,
        (postcodeCounts.get(impression.userPostcode) ?? 0) + 1
      );
    }
  }

  for (const count of postcodeCounts.values()) {
    if (count > 1) score += count - 1;
  }

  return score;
}
