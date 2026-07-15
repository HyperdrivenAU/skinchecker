function numberFromEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanFromEnv(name: string, fallback: boolean) {
  const raw = process.env[name];
  if (!raw) return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

export const clinicConfig = {
  metroRadiusKm: numberFromEnv("CLINIC_SEARCH_METRO_RADIUS_KM", 25),
  regionalRadiusKm: numberFromEnv("CLINIC_SEARCH_REGIONAL_RADIUS_KM", 50),
  maxResults: numberFromEnv("CLINIC_SEARCH_MAX_RESULTS", 3),
  preferredPartnerPriceMonthly: numberFromEnv(
    "CLINIC_PARTNER_PRICE_MONTHLY",
    99
  ),
  foundationPartnerPriceMonthly: numberFromEnv(
    "CLINIC_FOUNDATION_PRICE_MONTHLY",
    49
  ),
  foundationPartnerAvailable: booleanFromEnv(
    "CLINIC_FOUNDATION_AVAILABLE",
    false
  ),
  foundationPartnerLimit: numberFromEnv("CLINIC_FOUNDATION_MAX_PARTNERS", 25),
  notificationThrottleDays: numberFromEnv(
    "CLINIC_NOTIFICATION_THROTTLE_DAYS",
    7
  ),
  partnershipPageUrl:
    process.env.CLINIC_PARTNERSHIP_PAGE_URL || "/clinics/partner",
  termsPageUrl: process.env.CLINIC_TERMS_PAGE_URL || "/clinics/terms",
  notificationSender:
    process.env.CLINIC_NOTIFICATION_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    "SkinChecker.app <reports@skinchecker.app>",
  salesEmailAddress:
    process.env.CLINIC_SALES_EMAIL || "partners@skinchecker.app",
  clinicEmailsEnabled: booleanFromEnv("CLINIC_EMAILS_ENABLED", false),
  clickTrackingEnabled: booleanFromEnv("CLINIC_CLICK_TRACKING_ENABLED", true),
  stripeStandardPriceId: process.env.STRIPE_STANDARD_PRICE_ID,
  stripeFoundationPriceId: process.env.STRIPE_FOUNDATION_PRICE_ID,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};

export function isLikelyMetroPostcode(postcode?: string) {
  if (!postcode) return true;
  const code = Number(postcode);
  if (!Number.isFinite(code)) return true;

  return (
    (code >= 1000 && code <= 2234) ||
    (code >= 3000 && code <= 3207) ||
    (code >= 4000 && code <= 4207) ||
    (code >= 5000 && code <= 5199) ||
    (code >= 6000 && code <= 6199) ||
    (code >= 7000 && code <= 7099) ||
    (code >= 800 && code <= 899)
  );
}
