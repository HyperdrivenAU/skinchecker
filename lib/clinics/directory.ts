import { clinicConfig, isLikelyMetroPostcode } from "./config";
import { searchGooglePlacesSkinClinics } from "./googlePlaces";
import { searchClinics } from "./search";
import {
  fetchClinicsNearSearch,
  upsertGooglePlacesClinics,
} from "./supabase";
import type { ClinicSearchInput, ClinicSearchResponse } from "./types";
import { enrichClinicsWithWebsiteEmails } from "./websiteEmailLookup";

type NearbyClinicSearchInput = ClinicSearchInput & {
  radiusKm?: number;
};

function searchRadiusKm(input: NearbyClinicSearchInput) {
  if (typeof input.radiusKm === "number") return input.radiusKm;
  return isLikelyMetroPostcode(input.postcode)
    ? clinicConfig.metroRadiusKm
    : clinicConfig.regionalRadiusKm;
}

export async function findNearbyClinicsWithFallback(
  input: NearbyClinicSearchInput
): Promise<ClinicSearchResponse> {
  const radiusKm = searchRadiusKm(input);
  const databaseClinics = await fetchClinicsNearSearch({
    postcode: input.postcode,
    latitude: input.latitude ?? undefined,
    longitude: input.longitude ?? undefined,
    radiusKm,
  });
  const databaseResponse = searchClinics(databaseClinics, input);

  if (databaseResponse.results.length > 0) {
    return databaseResponse;
  }

  const googleClinics = await searchGooglePlacesSkinClinics({
    postcode: input.postcode,
    latitude: input.latitude ?? undefined,
    longitude: input.longitude ?? undefined,
    radiusKm,
  });

  if (!googleClinics.length) {
    return databaseResponse;
  }

  const enrichedGoogleClinics = await enrichClinicsWithWebsiteEmails(googleClinics);
  let savedClinics = enrichedGoogleClinics;
  try {
    savedClinics = await upsertGooglePlacesClinics(enrichedGoogleClinics);
  } catch (error) {
    console.error("Google Places clinics could not be saved", error);
  }

  const fallbackResponse = searchClinics(savedClinics, input);

  return {
    ...fallbackResponse,
    usedFallback: true,
    message:
      "No SkinChecker clinic listings were found nearby, so these clinic details were sourced from Google Places. Please confirm details directly with the clinic.",
  };
}
