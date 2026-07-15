import { clinicConfig } from "./config";
import { coordinatesForPostcode } from "./postcodes";
import type { Clinic, ClinicApplicationPayload } from "./types";

type SupabaseRow = Record<string, unknown>;

const clinicSelect = [
  "id",
  "legacy_clinic_id",
  "clinic_uuid",
  "clinic_name",
  "clinic_type",
  "relationship_status",
  "active",
  "display_in_app",
  "address",
  "address_line_1",
  "address_line_2",
  "suburb",
  "state",
  "postcode",
  "country",
  "latitude",
  "longitude",
  "google_place_id",
  "phone",
  "email",
  "website",
  "booking_url",
  "contact_person",
  "contact_role",
  "contact_mobile",
  "contact_email",
  "services_offered",
  "accepting_new_patients",
  "billing_type",
  "typical_skin_check_fee",
  "referral_fee",
  "referral_code",
  "priority_level",
  "display_booking_button",
  "public_notes",
  "internal_notes",
  "last_contacted_date",
  "next_follow_up_date",
  "sales_status",
  "source",
  "google_rating",
  "google_reviews",
  "last_verified",
  "logo_or_image_url",
  "booking_enabled",
  "priority",
  "claimed",
  "subscription_plan",
].join(",");

function supabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  return url.replace(/\/$/, "");
}

function serviceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return key;
}

async function supabaseRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${supabaseUrl()}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey(),
      Authorization: `Bearer ${serviceRoleKey()}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Supabase request failed with status ${response.status}: ${body}`
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function numberFromRow(row: SupabaseRow, key: string) {
  const value = row[key];
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function textFromRow(row: SupabaseRow, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function boolFromRow(row: SupabaseRow, key: string) {
  return row[key] === true;
}

function servicesFromRow(row: SupabaseRow) {
  const value = row.services_offered;
  if (Array.isArray(value)) return value.map(String);
  return [];
}

export function mapSupabaseClinic(row: SupabaseRow): Clinic {
  return {
    id: textFromRow(row, "id"),
    clinicId: textFromRow(row, "legacy_clinic_id"),
    clinicUuid: textFromRow(row, "clinic_uuid"),
    name: textFromRow(row, "clinic_name"),
    clinicType: textFromRow(row, "clinic_type"),
    relationshipStatus: textFromRow(row, "relationship_status"),
    active: boolFromRow(row, "active"),
    displayInApp: boolFromRow(row, "display_in_app"),
    address: textFromRow(row, "address"),
    addressLine1: textFromRow(row, "address_line_1"),
    addressLine2: textFromRow(row, "address_line_2"),
    suburb: textFromRow(row, "suburb"),
    state: textFromRow(row, "state"),
    postcode: textFromRow(row, "postcode"),
    country: textFromRow(row, "country"),
    latitude: numberFromRow(row, "latitude") ?? null,
    longitude: numberFromRow(row, "longitude") ?? null,
    googlePlaceId: textFromRow(row, "google_place_id"),
    phone: textFromRow(row, "phone"),
    email: textFromRow(row, "email"),
    website: textFromRow(row, "website"),
    bookingUrl: textFromRow(row, "booking_url"),
    contactPerson: textFromRow(row, "contact_person"),
    contactRole: textFromRow(row, "contact_role"),
    contactMobile: textFromRow(row, "contact_mobile"),
    contactEmail: textFromRow(row, "contact_email"),
    servicesOffered: servicesFromRow(row),
    acceptingNewPatients: boolFromRow(row, "accepting_new_patients"),
    billingType: textFromRow(row, "billing_type"),
    typicalSkinCheckFee: textFromRow(row, "typical_skin_check_fee"),
    referralFee: textFromRow(row, "referral_fee"),
    referralCode: textFromRow(row, "referral_code"),
    priorityLevel: numberFromRow(row, "priority_level"),
    displayBookingButton: boolFromRow(row, "display_booking_button"),
    publicNotes: textFromRow(row, "public_notes"),
    internalNotes: textFromRow(row, "internal_notes"),
    salesStatus: textFromRow(row, "sales_status"),
    source: textFromRow(row, "source"),
    googleRating: numberFromRow(row, "google_rating"),
    googleReviews: numberFromRow(row, "google_reviews"),
    lastVerified: textFromRow(row, "last_verified"),
    logoOrImage: textFromRow(row, "logo_or_image_url"),
    bookingEnabled: boolFromRow(row, "booking_enabled"),
    priority: numberFromRow(row, "priority"),
    claimed: boolFromRow(row, "claimed"),
    subscriptionPlan: textFromRow(row, "subscription_plan"),
  };
}

async function fetchClinicRows(query: URLSearchParams) {
  query.set("select", clinicSelect);
  return supabaseRequest<SupabaseRow[]>(
    `/rest/v1/clinics?${query.toString()}`
  );
}

export async function fetchActiveClinics() {
  const query = new URLSearchParams({
    active: "eq.true",
    display_in_app: "eq.true",
    do_not_contact: "eq.false",
    order: "relationship_status.desc,priority.desc,clinic_name.asc",
    limit: "200",
  });
  const rows = await fetchClinicRows(query);
  return rows.map(mapSupabaseClinic);
}

export async function fetchClinicsByPostcode(postcode: string) {
  const query = new URLSearchParams({
    active: "eq.true",
    display_in_app: "eq.true",
    do_not_contact: "eq.false",
    postcode: `eq.${postcode}`,
    order: "priority.desc,clinic_name.asc",
  });
  const rows = await fetchClinicRows(query);
  return rows.map(mapSupabaseClinic);
}

export async function fetchClinicsByGeographicArea(postcodes: string[]) {
  const cleanPostcodes = postcodes
    .map((postcode) => postcode.replace(/\D/g, "").slice(0, 4))
    .filter(Boolean);

  if (!cleanPostcodes.length) return fetchActiveClinics();

  const query = new URLSearchParams({
    active: "eq.true",
    display_in_app: "eq.true",
    do_not_contact: "eq.false",
    postcode: `in.(${cleanPostcodes.join(",")})`,
    order: "priority.desc,clinic_name.asc",
  });
  const rows = await fetchClinicRows(query);
  return rows.map(mapSupabaseClinic);
}

export async function fetchClinicsNearSearch(input: {
  latitude?: number;
  longitude?: number;
  postcode?: string;
  radiusKm?: number;
}) {
  const postcodeCoordinates = coordinatesForPostcode(input.postcode);
  const latitude = input.latitude ?? postcodeCoordinates?.latitude;
  const longitude = input.longitude ?? postcodeCoordinates?.longitude;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return fetchClinicsByPostcode(input.postcode || "");
  }

  const rows = await supabaseRequest<SupabaseRow[]>("/rest/v1/rpc/nearby_active_clinics", {
    method: "POST",
    body: JSON.stringify({
      search_lat: latitude,
      search_lng: longitude,
      radius_km: input.radiusKm ?? clinicConfig.regionalRadiusKm,
      max_rows: 100,
    }),
  });

  return rows.map(mapSupabaseClinic);
}

export async function fetchClinicByIdOrUuid(identifier: string) {
  const query = new URLSearchParams({
    select: clinicSelect,
    or: `(id.eq.${identifier},legacy_clinic_id.eq.${identifier},clinic_uuid.eq.${identifier})`,
    limit: "1",
  });

  const rows = await supabaseRequest<SupabaseRow[]>(
    `/rest/v1/clinics?${query.toString()}`
  );

  return rows[0] ? mapSupabaseClinic(rows[0]) : null;
}

function applicationPath(path: ClinicApplicationPayload["path"]) {
  return path === "claim-existing" ? "claim_existing" : "register_new";
}

export async function createClinicApplication(payload: ClinicApplicationPayload) {
  const rows = await supabaseRequest<SupabaseRow[]>("/rest/v1/clinic_applications", {
    method: "POST",
    body: JSON.stringify({
      application_path: applicationPath(payload.path),
      requested_plan: payload.plan,
      clinic_name: payload.clinicName,
      legacy_clinic_id: payload.clinicId || null,
      contact_first_name: payload.contactFirstName,
      contact_last_name: payload.contactLastName,
      contact_role: payload.contactRole,
      contact_email: payload.contactEmail,
      contact_mobile: payload.contactMobile,
      clinic_phone: payload.clinicPhone || null,
      clinic_email: payload.clinicEmail || null,
      clinic_website: payload.clinicWebsite || null,
      booking_url: payload.bookingUrl || null,
      clinic_address: payload.clinicAddress,
      services_offered: payload.servicesOffered || null,
      billing_type: payload.billingType || null,
      logo_upload_name: payload.logoUploadName || null,
      authorised: payload.authorised,
      accepted_terms: payload.acceptedTerms,
      accepted_privacy: payload.acceptedPrivacy,
      payment_status: "not_started",
      status: "submitted",
    }),
  });

  return rows[0];
}

export async function updateApprovedPartnerDetails(
  identifier: string,
  data: Record<string, unknown>
) {
  const clinic = await fetchClinicByIdOrUuid(identifier);
  if (!clinic?.id) throw new Error("Clinic was not found.");

  const rows = await supabaseRequest<SupabaseRow[]>(
    `/rest/v1/clinics?id=eq.${clinic.id}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );

  return rows[0] ?? null;
}

export async function updateRelationshipStatus(identifier: string, status: string) {
  return updateApprovedPartnerDetails(identifier, {
    relationship_status: status,
  });
}

export async function updateSubscriptionInformation(
  identifier: string,
  data: Record<string, unknown>
) {
  return updateApprovedPartnerDetails(identifier, data);
}

export async function recordLastContactedDate(identifier: string, date = new Date()) {
  return updateApprovedPartnerDetails(identifier, {
    last_contacted_date: date.toISOString().slice(0, 10),
  });
}

export async function recordUpgradeOfferDate(identifier: string, date = new Date()) {
  return updateApprovedPartnerDetails(identifier, {
    next_follow_up_date: date.toISOString().slice(0, 10),
  });
}

export async function createClinicSubscriptionRecord(input: {
  clinicId?: string;
  applicationId?: string;
  status: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  planCode?: string;
  rawEvent?: unknown;
}) {
  const rows = await supabaseRequest<SupabaseRow[]>("/rest/v1/clinic_subscriptions", {
    method: "POST",
    body: JSON.stringify({
      clinic_id: input.clinicId || null,
      application_id: input.applicationId || null,
      status: input.status,
      stripe_customer_id: input.stripeCustomerId || null,
      stripe_subscription_id: input.stripeSubscriptionId || null,
      stripe_price_id: input.stripePriceId || null,
      plan_code: input.planCode || null,
      raw_event: input.rawEvent || null,
    }),
  });

  return rows[0];
}
