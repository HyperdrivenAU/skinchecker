import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { fetchClinicByIdOrUuid } from "@/lib/clinics/supabase";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function escapeHtml(value: unknown) {
  return clean(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) return { mime: "image/jpeg", base64: dataUrl };
  return { mime: match[1], base64: match[2] };
}

function recipientForClinic(clinic: { contactEmail?: string; email?: string }) {
  return clean(clinic.contactEmail) || clean(clinic.email);
}

function assessmentLine(result: unknown, key: string) {
  if (!result || typeof result !== "object") return "";
  const value = (result as Record<string, unknown>)[key];
  return clean(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.consentToSendPhoto !== true) {
      return NextResponse.json(
        { error: "Please tick the consent box before sending your photo." },
        { status: 400 }
      );
    }

    const clinicIdentifier = clean(body.clinicId || body.clinicUuid);
    const image = clean(body.image);

    if (!clinicIdentifier) {
      return NextResponse.json(
        { error: "Clinic selection is required." },
        { status: 400 }
      );
    }

    if (!image) {
      return NextResponse.json(
        { error: "Photo is required." },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Clinic referral email is not configured." },
        { status: 500 }
      );
    }

    const clinic = await fetchClinicByIdOrUuid(clinicIdentifier);
    if (!clinic) {
      return NextResponse.json({ error: "Clinic was not found." }, { status: 404 });
    }

    const clinicRecipient = recipientForClinic(clinic);
    if (!clinicRecipient) {
      return NextResponse.json(
        { error: "We could not find an email address for this clinic." },
        { status: 400 }
      );
    }

    const to = process.env.CLINIC_REFERRAL_TEST_RECIPIENT || clinicRecipient;
    const { mime, base64 } = stripDataUrl(image);
    const postcode = clean(body.postcode) || clean(clinic.postcode) || "not provided";
    const patientEmail = clean(body.patientEmail);
    const patientMobile = clean(body.patientMobile);
    const patientName = [body.givenNames, body.surname].map(clean).filter(Boolean).join(" ");

    const result = body.result;
    const headline = assessmentLine(result, "headline");
    const summary = assessmentLine(result, "summary");
    const recommendation = assessmentLine(result, "recommendation");

    const sendResult = await resend.emails.send({
      from:
        process.env.CLINIC_REFERRAL_FROM ||
        process.env.RESEND_FROM_EMAIL ||
        "SkinChecker.app <reports@skinchecker.app>",
      to,
      bcc: process.env.CLINIC_SALES_EMAIL || "partners@skinchecker.app",
      subject: "SkinChecker.app patient photo referral",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;color:#0f172a">
          ${
            to !== clinicRecipient
              ? `<p style="padding:12px;border-radius:10px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;">Test mode: this referral was routed to ${escapeHtml(to)}. The clinic recipient would have been ${escapeHtml(clinicRecipient)}.</p>`
              : ""
          }
          <p>Hi Team,</p>
          <p>A SkinChecker.app user has consented to send their lesion photograph to <strong>${escapeHtml(clinic.name)}</strong> for review.</p>
          <p><strong>Patient postcode:</strong> ${escapeHtml(postcode)}</p>
          ${patientName ? `<p><strong>Name:</strong> ${escapeHtml(patientName)}</p>` : ""}
          ${patientEmail ? `<p><strong>Email:</strong> ${escapeHtml(patientEmail)}</p>` : ""}
          ${patientMobile ? `<p><strong>Mobile:</strong> ${escapeHtml(patientMobile)}</p>` : ""}
          ${headline ? `<p><strong>SkinChecker result:</strong> ${escapeHtml(headline)}</p>` : ""}
          ${summary ? `<p>${escapeHtml(summary)}</p>` : ""}
          ${recommendation ? `<p><strong>Recommendation:</strong> ${escapeHtml(recommendation)}</p>` : ""}
          <p>The submitted lesion photo is attached.</p>
          <p>
            <a href="https://skinchecker.app" style="color:#0369a1;font-weight:700;text-decoration:none;">SkinChecker.app</a>
            helps patients perform a first-pass AI-assisted skin lesion check and find nearby clinics for in-person review.
          </p>
          <p>Best regards,</p>
          <p>
            Ian Nicholson<br>
            <a href="https://skinchecker.app" style="color:#0369a1;text-decoration:none;">SkinChecker.app</a><br>
            0418 230 069
          </p>
        </div>
      `,
      attachments: [
        {
          filename: "SkinChecker lesion photo.jpg",
          content: base64,
          contentType: mime,
        },
      ],
    });

    return NextResponse.json({
      ok: true,
      id: sendResult.data?.id ?? null,
      sentTo: to,
    });
  } catch (error) {
    console.error("clinic referral error", error);
    return NextResponse.json(
      { error: "We could not send your photo to the clinic. Please try again." },
      { status: 500 }
    );
  }
}
