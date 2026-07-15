import { Resend } from "resend";
import { clinicConfig } from "./config";
import {
  findLastFreeListingNotification,
  markImpressionNotificationSent,
} from "./store";
import type { Clinic, ClinicSearchImpression } from "./types";

const resend = new Resend(process.env.RESEND_API_KEY);
const clinicEmailTestRecipient = "inicholson@hyperdriven.com.au";

function recipientForClinic(clinic: Clinic) {
  return clinic.contactEmail || clinic.email || "";
}

function notificationRecipientForClinic(clinic: Clinic) {
  return clinicEmailTestRecipient || recipientForClinic(clinic);
}

export async function canSendFreeListingNotification(clinic: Clinic) {
  const recipient = notificationRecipientForClinic(clinic);
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

  const originalRecipient = recipientForClinic(clinic);
  const to = notificationRecipientForClinic(clinic);
  const postcode = impression.userPostcode || "your local area";
  const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://app.skinchecker.app"}/clinics/signup`;

  const result = await resend.emails.send({
    from: clinicConfig.notificationSender,
    to,
    bcc: clinicConfig.salesEmailAddress,
    subject: "[TEST] SkinChecker.app patients are looking for clinics in your area",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#0f172a">
        <p style="padding:12px;border-radius:10px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;">
          Test mode: this clinic email was routed to ${to}. The original clinic recipient would have been ${originalRecipient || "not available"}.
        </p>
        <p>Hi Team,</p>
        <p>A SkinChecker.app user in postcode ${postcode} recently looked for nearby skin clinics after completing a skin lesion check.</p>
        <p>Would you like to join our network of skin clinics and receive more visibility from patients looking for in-person skin checks?</p>
        <p>SkinChecker.app is free for patients to use and requires no download or installation.</p>
        <p>Preferred Partner clinics receive enhanced visibility, a partner badge, full clinic details, booking links and priority placement in relevant nearby searches.</p>
        <p>
          <a href="${signupUrl}" style="display:inline-block;background:#0284c7;color:white;padding:14px 18px;border-radius:12px;text-decoration:none;font-weight:bold">
            Join the SkinChecker clinic network
          </a>
        </p>
        <p>Best regards,</p>
        <p>
          Ian Nicholson<br>
          SkinChecker.app<br>
          0418 230 069
        </p>
        <p style="font-size:13px;color:#64748b">This message does not include patient photographs, reports or identifying health information.</p>
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
