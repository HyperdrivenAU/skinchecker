import type {
  ClinicClickAction,
  ClinicSearchImpression,
} from "./types";

type SupabaseRow = Record<string, unknown>;

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

export function createImpressionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `imp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function relationshipStatusForDatabase(status?: string) {
  const normalised = String(status ?? "").toLowerCase();
  if (normalised === "preferred partner" || normalised === "preferred") {
    return "preferred";
  }
  if (normalised === "do not contact" || normalised === "do_not_contact") {
    return "do_not_contact";
  }
  if (normalised === "inactive") return "inactive";
  if (normalised === "suspended") return "suspended";
  return "free";
}

function impressionToRow(impression: ClinicSearchImpression) {
  return {
    id: impression.impressionId,
    clinic_id: impression.clinicDatabaseId || null,
    clinic_uuid: impression.clinicUuid || null,
    search_timestamp: impression.searchTimestamp,
    user_postcode: impression.userPostcode || null,
    approximate_search_latitude:
      impression.approximateSearchLatitude ?? null,
    approximate_search_longitude:
      impression.approximateSearchLongitude ?? null,
    distance_km: impression.distanceKm ?? null,
    listing_type_shown: impression.listingTypeShown,
    relationship_status_at_time: relationshipStatusForDatabase(
      impression.relationshipStatusAtTime
    ),
    preferred_partner_status_at_time:
      impression.preferredPartnerStatusAtTime,
    search_radius_km: impression.searchRadiusKm,
    search_result_position: impression.searchResultPosition,
    skinchecker_report_id: impression.skinCheckerReportId || null,
    skin_score_range_or_risk_category:
      impression.skinScoreRangeOrRiskCategory || null,
    website_clicked: impression.websiteClicked,
    booking_link_clicked: impression.bookingLinkClicked,
    phone_clicked: impression.phoneClicked,
    profile_viewed: impression.profileViewed,
    impression_notification_email_sent:
      impression.impressionNotificationEmailSent,
    impression_notification_email_sent_date:
      impression.impressionNotificationEmailSentDate || null,
    upgrade_email_sent: impression.upgradeEmailSent,
    upgrade_email_sent_date: impression.upgradeEmailSentDate || null,
  };
}

function rowToImpression(row: SupabaseRow): ClinicSearchImpression {
  return {
    impressionId: String(row.id),
    clinicDatabaseId: row.clinic_id ? String(row.clinic_id) : undefined,
    clinicId: undefined,
    clinicUuid: row.clinic_uuid ? String(row.clinic_uuid) : undefined,
    searchTimestamp: String(row.search_timestamp),
    userPostcode: row.user_postcode ? String(row.user_postcode) : undefined,
    approximateSearchLatitude:
      typeof row.approximate_search_latitude === "number"
        ? row.approximate_search_latitude
        : undefined,
    approximateSearchLongitude:
      typeof row.approximate_search_longitude === "number"
        ? row.approximate_search_longitude
        : undefined,
    distanceKm:
      row.distance_km == null ? undefined : Number(row.distance_km),
    listingTypeShown: row.listing_type_shown === "preferred" ? "preferred" : "free",
    relationshipStatusAtTime: row.relationship_status_at_time
      ? String(row.relationship_status_at_time)
      : undefined,
    preferredPartnerStatusAtTime:
      row.preferred_partner_status_at_time === true,
    searchRadiusKm: Number(row.search_radius_km),
    searchResultPosition: Number(row.search_result_position),
    skinCheckerReportId: row.skinchecker_report_id
      ? String(row.skinchecker_report_id)
      : undefined,
    skinScoreRangeOrRiskCategory: row.skin_score_range_or_risk_category
      ? String(row.skin_score_range_or_risk_category)
      : undefined,
    websiteClicked: row.website_clicked === true,
    bookingLinkClicked: row.booking_link_clicked === true,
    phoneClicked: row.phone_clicked === true,
    profileViewed: row.profile_viewed === true,
    impressionNotificationEmailSent:
      row.impression_notification_email_sent === true,
    impressionNotificationEmailSentDate:
      row.impression_notification_email_sent_date
        ? String(row.impression_notification_email_sent_date)
        : undefined,
    upgradeEmailSent: row.upgrade_email_sent === true,
    upgradeEmailSentDate: row.upgrade_email_sent_date
      ? String(row.upgrade_email_sent_date)
      : undefined,
  };
}

export async function recordClinicSearchImpressions(
  impressions: ClinicSearchImpression[]
) {
  if (!impressions.length) return [];

  const rows = await supabaseRequest<SupabaseRow[]>(
    "/rest/v1/clinic_search_impressions",
    {
      method: "POST",
      body: JSON.stringify(impressions.map(impressionToRow)),
    }
  );

  return rows.map(rowToImpression);
}

export async function listClinicSearchImpressions() {
  const rows = await supabaseRequest<SupabaseRow[]>(
    "/rest/v1/clinic_search_impressions?select=*&order=search_timestamp.desc&limit=1000"
  );

  return rows.map(rowToImpression);
}

export async function findLastFreeListingNotification(
  clinicId?: string,
  clinicUuid?: string
) {
  const query = new URLSearchParams({
    select: "*",
    impression_notification_email_sent: "eq.true",
    order: "impression_notification_email_sent_date.desc",
    limit: "1",
  });

  if (clinicId) query.set("clinic_id", `eq.${clinicId}`);
  if (!clinicId && clinicUuid) query.set("clinic_uuid", `eq.${clinicUuid}`);

  const rows = await supabaseRequest<SupabaseRow[]>(
    `/rest/v1/clinic_search_impressions?${query.toString()}`
  );

  return rows[0] ? rowToImpression(rows[0]) : undefined;
}

export async function markImpressionNotificationSent(
  impressionId: string,
  providerMessageId?: string,
  recipient?: string
) {
  const sentDate = new Date().toISOString();
  const rows = await supabaseRequest<SupabaseRow[]>(
    `/rest/v1/clinic_search_impressions?id=eq.${impressionId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        impression_notification_email_sent: true,
        impression_notification_email_sent_date: sentDate,
      }),
    }
  );

  await supabaseRequest("/rest/v1/clinic_email_events", {
    method: "POST",
    body: JSON.stringify({
      clinic_id: rows[0]?.clinic_id || null,
      impression_id: impressionId,
      email_type: "free_listing_immediate_notification",
      recipient: recipient || null,
      provider_message_id: providerMessageId || null,
      status: "sent",
      sent_at: sentDate,
    }),
  });
}

export async function recordClinicClick(
  impressionId: string,
  action: ClinicClickAction
) {
  const rows = await supabaseRequest<SupabaseRow[]>(
    `/rest/v1/clinic_search_impressions?id=eq.${impressionId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        website_clicked: action === "website" ? true : undefined,
        booking_link_clicked: action === "booking" ? true : undefined,
        phone_clicked: action === "phone" ? true : undefined,
        profile_viewed: action === "profile" ? true : undefined,
      }),
    }
  );

  if (!rows[0]) return false;

  await supabaseRequest("/rest/v1/clinic_click_events", {
    method: "POST",
    body: JSON.stringify({
      impression_id: impressionId,
      clinic_id: rows[0].clinic_id || null,
      action,
    }),
  });

  return true;
}

export async function recordClinicApplication(
  application: Record<string, unknown>
) {
  const rows = await supabaseRequest<SupabaseRow[]>("/rest/v1/clinic_applications", {
    method: "POST",
    body: JSON.stringify({
      application_path:
        application.path === "claim-existing"
          ? "claim_existing"
          : "register_new",
      requested_plan: application.plan,
      clinic_name: application.clinicName,
      legacy_clinic_id: application.clinicId || null,
      contact_first_name: application.contactFirstName,
      contact_last_name: application.contactLastName,
      contact_role: application.contactRole,
      contact_email: application.contactEmail,
      contact_mobile: application.contactMobile,
      clinic_phone: application.clinicPhone || null,
      clinic_email: application.clinicEmail || null,
      clinic_website: application.clinicWebsite || null,
      booking_url: application.bookingUrl || null,
      clinic_address: application.clinicAddress,
      services_offered: application.servicesOffered || null,
      billing_type: application.billingType || null,
      logo_upload_name: application.logoUploadName || null,
      authorised: application.authorised,
      accepted_terms: application.acceptedTerms,
      accepted_privacy: application.acceptedPrivacy,
      payment_status: "not_started",
      status: "submitted",
    }),
  });

  return rows[0];
}
