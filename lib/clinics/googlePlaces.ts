import { clinicConfig } from "./config";
import { validCoordinates } from "./postcodes";
import type { Clinic } from "./types";

type GooglePlace = {
  id?: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  businessStatus?: string;
  types?: string[];
};

type GooglePlacesTextSearchResponse = {
  places?: GooglePlace[];
};

type GooglePlacesSearchInput = {
  postcode?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
};

function cleanPostcode(postcode?: string) {
  return postcode?.replace(/\D/g, "").slice(0, 4);
}

function postcodeFromAddress(address?: string) {
  return address?.match(/\b(\d{4})\b/)?.[1] ?? "";
}

function stateFromAddress(address?: string) {
  return address?.match(/\b(NSW|VIC|QLD|SA|WA|TAS|ACT|NT)\b/i)?.[1]?.toUpperCase() ?? "";
}

function suburbFromAddress(address?: string) {
  if (!address) return "";
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return "";

  const locality = parts.at(-2) ?? "";
  return locality
    .replace(/\b(NSW|VIC|QLD|SA|WA|TAS|ACT|NT)\b/i, "")
    .replace(/\b\d{4}\b/, "")
    .trim();
}

function searchPoint(input: GooglePlacesSearchInput) {
  if (validCoordinates(input.latitude, input.longitude)) {
    return {
      latitude: input.latitude as number,
      longitude: input.longitude as number,
    };
  }

  return null;
}

function mapPlaceToClinic(place: GooglePlace): Clinic | null {
  const name = place.displayName?.text?.trim();
  const latitude = place.location?.latitude;
  const longitude = place.location?.longitude;

  if (!name || !place.id || !validCoordinates(latitude, longitude)) {
    return null;
  }

  const address = place.formattedAddress || "";

  return {
    name,
    clinicType: "Skin clinic",
    relationshipStatus: "free",
    active: place.businessStatus !== "CLOSED_PERMANENTLY",
    displayInApp: true,
    address,
    suburb: suburbFromAddress(address),
    state: stateFromAddress(address),
    postcode: postcodeFromAddress(address),
    country: "Australia",
    latitude,
    longitude,
    googlePlaceId: place.id,
    phone: place.nationalPhoneNumber || "",
    website: place.websiteUri || place.googleMapsUri || "",
    bookingUrl: "",
    servicesOffered: ["Skin checks", "Skin cancer checks"],
    displayBookingButton: false,
    publicNotes:
      "Clinic details were found from Google Places and should be confirmed directly with the clinic.",
    internalNotes:
      "Imported automatically from Google Places after SkinChecker found no matching local clinic listings.",
    salesStatus: "pending_google_places",
    source: "google_places",
    bookingEnabled: false,
    priority: 0,
    claimed: false,
  };
}

export async function searchGooglePlacesSkinClinics(
  input: GooglePlacesSearchInput
) {
  if (!clinicConfig.googlePlacesFallbackEnabled) return [];

  const apiKey = clinicConfig.googlePlacesApiKey;
  if (!apiKey) {
    console.warn("Google Places fallback skipped: GOOGLE_PLACES_API_KEY is not configured.");
    return [];
  }

  const point = searchPoint(input);
  const postcode = cleanPostcode(input.postcode);
  const textQuery = postcode
    ? `skin cancer clinic near ${postcode} Australia`
    : "skin doctors near me";

  const body: Record<string, unknown> = {
    textQuery,
    regionCode: "AU",
    maxResultCount: 3,
  };

  if (point) {
    body.locationBias = {
      circle: {
        center: point,
        radius: Math.max(1000, (input.radiusKm ?? clinicConfig.metroRadiusKm) * 1000),
      },
    };
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.nationalPhoneNumber",
        "places.websiteUri",
        "places.googleMapsUri",
        "places.businessStatus",
        "places.types",
      ].join(","),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Google Places clinic fallback failed", response.status, detail);
    return [];
  }

  const data = (await response.json()) as GooglePlacesTextSearchResponse;

  return (data.places ?? [])
    .map(mapPlaceToClinic)
    .filter((clinic): clinic is Clinic => Boolean(clinic))
    .slice(0, 3);
}
