import { Resend } from "resend";
import { clinicConfig } from "./config";
import {
  findLastFreeListingNotification,
  markImpressionNotificationSent,
} from "./store";
import type { Clinic, ClinicSearchImpression } from "./types";

const resend = new Resend(process.env.RESEND_API_KEY);

function recipientForClinic(clinic: Clinic) {
  return clinic.contactEmail || clinic.email || "";
}

export async function canSendFreeListingNotification(clinic: Clinic) {
  const recipient = recipientForClinic(clinic);
  if (!recipient) return false;

  const lastSent = await findLastFreeListingNotification(
    clinic.id,
    clinic.clinicUuid
  );

  if (!lastSent?.impressionNotificationEmailSentDate) return true;

  const throttleMs =
    clinicConfig.notificationThrottleDays * 24 * 60 * 60 * 1000;
  const last = new Date(lastSent.impressionNotificationEmailSentDate).getTime();
  return Date.now() - last >= throttleMs;
}

export async function sendFreeListingNotification(
  clinic: Clinic,
  impression: ClinicSearchImpression
) {
  if (!clinicConfig.clinicEmailsEnabled) return { skipped: "disabled" };
  if (!process.env.RESEND_API_KEY) return { skipped: "missing-resend-key" };
  if (!(await canSendFreeListingNotification(clinic))) {
    return { skipped: "throttled-or-no-recipient" };
  }

  const to = recipientForClinic(clinic);
  const postcode = impression.userPostcode || "your local area";

  const result = await resend.emails.send({
    from: clinicConfig.notificationSender,
    to,
    bcc: clinicConfig.salesEmailAddress,
    subject: "Your clinic appeared in a SkinChecker.app search",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#0f172a">
        <h1 style="font-size:24px;margin:0 0 16px">Your clinic appeared in a SkinChecker.app search</h1>
        <p>Your clinic recently appeared in a nearby clinic search on SkinChecker.app for ${postcode}.</p>
        <p>As there was no Preferred Partner available in the area, your clinic was displayed as a basic free listing.</p>
        <p>Free listings display limited clinic information and are only shown where an appropriate Preferred Partner is not available.</p>
        <p>Preferred Partners receive enhanced visibility, a prominent partner badge, full clinic details, booking links and priority placement in relevant nearby searches.</p>
        <p>This notification confirms that your clinic appeared in a search. It does not mean that the user contacted or booked with your clinic.</p>
        <p>
          <a href="${clinicConfig.partnershipPageUrl}" style="display:inline-block;background:#0284c7;color:white;padding:14px 18px;border-radius:12px;text-decoration:none;font-weight:bold">
            Review Preferred Partner packages
          </a>
        </p>
        <p style="font-size:13px;color:#64748b">SkinChecker.app does not send identifiable patient health information to clinics for search appearances.</p>
      </div>
    `,
  });

  await markImpressionNotificationSent(
    impression.impressionId,
    result.data?.id ?? undefined,
    to
  );
  return { id: result.data?.id ?? null };
}

export function buildMonthlyPerformanceSummaryText(stats: {
  searchAppearances: number;
  profileViews: number;
  websiteClicks: number;
  bookingLinkClicks: number;
  phoneClicks: number;
  commonPostcodes: string[];
}) {
  return {
    subject: "Your SkinChecker.app listing performance summary",
    preview: `${stats.searchAppearances} search appearances and ${stats.websiteClicks + stats.bookingLinkClicks + stats.phoneClicks} enquiry actions.`,
  };
}
