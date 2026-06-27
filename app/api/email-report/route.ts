import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { generateSkinCheckerReportPdf } from "./reportRenderer";

export const runtime = "nodejs";

type RiskLevel = "low" | "moderate" | "high" | "unknown";

type ReportPayload = {
  email?: string;
  givenNames?: string;
  surname?: string;
  dob?: string;
  mobile?: string;
  postcode?: string;
  image?: string;
  result?: any;
  skinScore?: any;
};

const resend = new Resend(process.env.RESEND_API_KEY);

function clean(value: unknown, fallback = "Not provided") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length ? text : fallback;
}

function stripDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) return { mime: "image/jpeg", base64: dataUrl };
  return { mime: match[1], base64: match[2] };
}

function inferRisk(result: any): RiskLevel {
  const raw = JSON.stringify(result ?? {}).toLowerCase();

  if (/high|red|urgent|suspicious|concerning|prompt|melanoma/.test(raw)) return "high";
  if (/moderate|medium|amber|yellow|review|clinic|appointment/.test(raw)) return "moderate";
  if (/low|green|routine|monitor|benign/.test(raw)) return "low";

  return "unknown";
}

function riskCopy(risk: RiskLevel) {
  if (risk === "high") {
    return {
      label: "HIGH RISK",
      sub: "Prompt medical review recommended",
      colour: rgb(0.78, 0.12, 0.16),
      pale: rgb(1, 0.93, 0.94),
    };
  }

  if (risk === "moderate") {
    return {
      label: "MODERATE RISK",
      sub: "Skin clinic assessment recommended",
      colour: rgb(0.88, 0.52, 0.05),
      pale: rgb(1, 0.96, 0.87),
    };
  }

  if (risk === "low") {
    return {
      label: "LOW RISK",
      sub: "Continue routine monitoring",
      colour: rgb(0.08, 0.55, 0.30),
      pale: rgb(0.91, 0.98, 0.94),
    };
  }

  return {
    label: "ASSESSMENT COMPLETE",
    sub: "Medical review may still be appropriate",
    colour: rgb(0.25, 0.32, 0.42),
    pale: rgb(0.94, 0.96, 0.98),
  };
}

function extractText(result: any) {
  if (!result) return "The submitted image has been analysed by SkinChecker.app. Please seek professional medical advice if you have any concerns or if the lesion is changing.";

  if (typeof result === "string") return result;

  return (
    result.summary ||
    result.assessment ||
    result.analysis ||
    result.message ||
    result.recommendation ||
    "The submitted image has been analysed by SkinChecker.app. Please seek professional medical advice if you have any concerns or if the lesion is changing."
  );
}

function wrapText(text: string, maxChars: number) {
  const words = clean(text, "").replace(/\s+/g, " ").split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function drawTextBlock(page: any, text: string, x: number, y: number, maxChars: number, font: any, size: number, colour = rgb(0.14, 0.18, 0.24), leading = 14, maxLines = 12) {
  const lines = wrapText(text, maxChars).slice(0, maxLines);
  let cursorY = y;

  for (const line of lines) {
    page.drawText(line, { x, y: cursorY, size, font, color: colour });
    cursorY -= leading;
  }

  return cursorY;
}

function drawLabelValue(page: any, label: string, value: string, x: number, y: number, fonts: any) {
  page.drawText(label.toUpperCase(), {
    x,
    y,
    size: 7.5,
    font: fonts.bold,
    color: rgb(0.46, 0.52, 0.60),
  });

  page.drawText(value, {
    x,
    y: y - 13,
    size: 10.5,
    font: fonts.regular,
    color: rgb(0.08, 0.11, 0.16),
  });
}

async function makePdf(payload: ReportPayload) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fonts = { regular, bold };

  const risk = inferRisk(payload.result);
  const rc = riskCopy(risk);
  const reportDate = new Date().toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  page.drawRectangle({ x: 0, y: height - 96, width, height: 96, color: rgb(0.035, 0.09, 0.16) });
  page.drawText("Skin Lesion Assessment Report", {
    x: 44,
    y: height - 46,
    size: 22,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Generated using SkinChecker.app Artificial Intelligence", {
    x: 44,
    y: height - 67,
    size: 10.5,
    font: regular,
    color: rgb(0.78, 0.86, 0.94),
  });
  page.drawText(reportDate, {
    x: width - 132,
    y: height - 46,
    size: 10,
    font: regular,
    color: rgb(0.78, 0.86, 0.94),
  });

  page.drawRectangle({ x: 44, y: height - 204, width: 240, height: 76, color: rgb(0.97, 0.98, 0.99), borderColor: rgb(0.86, 0.89, 0.93), borderWidth: 1 });
  page.drawText("PATIENT DETAILS", { x: 60, y: height - 150, size: 8.5, font: bold, color: rgb(0.42, 0.48, 0.56) });

  const patientName = `${clean(payload.givenNames, "")} ${clean(payload.surname, "")}`.trim() || "Not provided";
  drawLabelValue(page, "Name", patientName, 60, height - 171, fonts);
  drawLabelValue(page, "DOB", clean(payload.dob), 60, height - 196, fonts);
  drawLabelValue(page, "Postcode", clean(payload.postcode), 180, height - 196, fonts);

  page.drawRectangle({ x: 308, y: height - 204, width: 243, height: 76, color: rc.pale, borderColor: rc.colour, borderWidth: 1.25 });
  page.drawText("ASSESSMENT", { x: 326, y: height - 150, size: 8.5, font: bold, color: rgb(0.42, 0.48, 0.56) });
  page.drawText(rc.label, { x: 326, y: height - 174, size: 18, font: bold, color: rc.colour });
  page.drawText(rc.sub, { x: 326, y: height - 193, size: 10, font: regular, color: rgb(0.13, 0.16, 0.21) });

  let y = height - 246;
  page.drawText("AI SUMMARY", { x: 44, y, size: 11, font: bold, color: rgb(0.06, 0.10, 0.16) });
  y -= 22;
  y = drawTextBlock(page, extractText(payload.result), 44, y, 94, regular, 10.5, rgb(0.14, 0.18, 0.24), 14, 9) - 10;

  page.drawLine({ start: { x: 44, y }, end: { x: width - 44, y }, thickness: 1, color: rgb(0.88, 0.91, 0.94) });
  y -= 30;

  page.drawText("RECOMMENDED ACTION", { x: 44, y, size: 11, font: bold, color: rgb(0.06, 0.10, 0.16) });
  y -= 21;

  const action =
    risk === "high"
      ? "Please arrange a prompt in-person review with a GP, dermatologist or skin cancer clinic. This AI assessment is not a diagnosis."
      : risk === "moderate"
      ? "Please arrange a routine skin check with a GP, dermatologist or skin cancer clinic, especially if the lesion is new or changing."
      : "Continue to monitor the lesion and seek medical advice if it changes, bleeds, becomes painful or causes concern.";

  y = drawTextBlock(page, action, 44, y, 94, regular, 10.5, rgb(0.14, 0.18, 0.24), 14, 5) - 18;

  if (payload.image) {
    try {
      const { mime, base64 } = stripDataUrl(payload.image);
      const bytes = Buffer.from(base64, "base64");
      const img = mime.includes("png") ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);

      const boxX = 44;
      const boxY = 178;
      const boxW = 300;
      const boxH = 250;
      const scale = Math.min(boxW / img.width, boxH / img.height);
      const imgW = img.width * scale;
      const imgH = img.height * scale;
      const imgX = boxX + (boxW - imgW) / 2;
      const imgY = boxY + (boxH - imgH) / 2;

      page.drawText("SUBMITTED IMAGE", { x: boxX, y: boxY + boxH + 15, size: 11, font: bold, color: rgb(0.06, 0.10, 0.16) });
      page.drawRectangle({ x: boxX, y: boxY, width: boxW, height: boxH, color: rgb(0.985, 0.988, 0.992), borderColor: rgb(0.84, 0.87, 0.91), borderWidth: 1 });
      page.drawImage(img, { x: imgX, y: imgY, width: imgW, height: imgH });
    } catch {
      page.drawText("Submitted image could not be embedded in this PDF.", { x: 44, y: 400, size: 10, font: regular, color: rgb(0.60, 0.10, 0.10) });
    }
  }

  page.drawRectangle({ x: 370, y: 178, width: 181, height: 250, color: rgb(0.97, 0.98, 0.99), borderColor: rgb(0.86, 0.89, 0.93), borderWidth: 1 });
  page.drawText("IMPORTANT", { x: 388, y: 403, size: 11, font: bold, color: rgb(0.06, 0.10, 0.16) });
  drawTextBlock(
    page,
    "This report is generated by artificial intelligence from the submitted image and user-provided information. It is not a medical diagnosis and does not replace an in-person skin examination.",
    388,
    378,
    28,
    regular,
    9.5,
    rgb(0.18, 0.22, 0.28),
    13,
    12
  );

  const qrPath = path.join(process.cwd(), "public", "qr-skinchecker.png");
  if (fs.existsSync(qrPath)) {
    const qrBytes = fs.readFileSync(qrPath);
    const qr = await pdfDoc.embedPng(qrBytes);
    page.drawText("FREE AI SKIN CHECK", { x: 392, y: 278, size: 10, font: bold, color: rgb(0.06, 0.10, 0.16) });
    page.drawText("Scan to visit SkinChecker.app", { x: 392, y: 262, size: 8.5, font: regular, color: rgb(0.35, 0.40, 0.48) });
    page.drawImage(qr, { x: 420, y: 195, width: 72, height: 72 });
    page.drawText("www.skinchecker.app", { x: 397, y: 184, size: 8.5, font: bold, color: rgb(0.08, 0.30, 0.55) });
  }

  page.drawLine({ start: { x: 44, y: 128 }, end: { x: width - 44, y: 128 }, thickness: 1, color: rgb(0.88, 0.91, 0.94) });
  page.drawText("Disclaimer: This assessment is informational only and is not a diagnosis. Seek medical advice for any lesion that is new, changing, bleeding, painful or concerning.", {
    x: 44,
    y: 106,
    size: 7.5,
    font: regular,
    color: rgb(0.42, 0.47, 0.54),
  });
  page.drawText("Generated by SkinChecker.app", {
    x: 44,
    y: 84,
    size: 8,
    font: bold,
    color: rgb(0.42, 0.47, 0.54),
  });

  return pdfDoc.save();
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ReportPayload;

    if (!payload.email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    if (!payload.image) {
      return NextResponse.json({ error: "Image is required." }, { status: 400 });
    }

const result = payload.result;

const pdfBytes = await generateSkinCheckerReportPdf({
  skinScore: payload.skinScore ?? null,
  patient: {
    givenNames: payload.givenNames,
    surname: payload.surname,
    dob: payload.dob,
    mobile: payload.mobile,
    email: payload.email,
    postcode: payload.postcode,
  },
  reportDate: new Date(),
  assessment: {
    colour: result?.trafficLight ?? "unknown",
    label: result?.headline,
    headline: result?.headline,
    summary: result?.summary,
    recommendation: result?.recommendation,
  },
  clinicalInterpretation: result?.summary ?? "",
  abcde: {
    asymmetry: result?.abcde?.asymmetry,
    border: result?.abcde?.border,
    colour: result?.abcde?.colour,
    diameter: result?.abcde?.diameter,
    evolution: result?.abcde?.evolution,
  },
  observations: result?.observations ?? [],
  recommendedAction: result?.recommendation ?? "",
  image: payload.image,
  imageQuality: result?.imageQuality ?? "Not specified",
});

    const filename = `${clean(payload.surname, "PATIENT")}, ${clean(payload.givenNames, "Unknown")} - ${clean(payload.dob, "Unknown DOB")} - SkinChecker Report.pdf`;

    const from = process.env.RESEND_FROM_EMAIL || "SkinChecker.app <reports@skinchecker.app>";

    const sendResult = await resend.emails.send({
      from,
      to: payload.email,
      bcc: "info@skinchecker.app",
      subject: "Your SkinChecker.app assessment report",
      html: `
      <div style="font-family:Calibri,sans-serif;max-width:640px;margin:auto;padding:24px;color:#0f172a">

  <p>Hi ${payload.givenNames || "there"},</p>

  <p>Thank you for using <strong>SkinChecker.app</strong>.</p>

  <p>Your <strong>SkinChecker.app Report</strong> is attached as a PDF for your records.</p>

  <div style="padding:18px;border-radius:14px;background:#f0f9ff;border:1px solid #bae6fd;margin:24px 0">
    <strong style="font-size:18px;">${result.headline}</strong>
    <p style="margin-bottom:0;">${result.recommendation}</p>
  </div>

  <p>
    Please remember that this report has been generated using artificial
    intelligence from a single photograph. It is not a diagnosis and should
    not replace assessment by a qualified healthcare professional.
  </p>

  <p>
    If your report recommends medical review, or if you have any concerns
    about a skin lesion, please arrange an appointment with your doctor or
    skin cancer clinic.
  </p>

  <p>
    Best regards,<br>
    <strong>The SkinChecker.app Team</strong>
  </p>

  <p>
    info@skinchecker.app<br>
    https://skinchecker.app
  </p>

  <div style="margin-top:30px;text-align:center;">
    <img src="https://skinchecker.app/logo-email.png"
         alt="SkinChecker.app"
         width="220">
  </div>
      `,
      attachments: [
        {
          filename,
          content: Buffer.from(pdfBytes).toString("base64"),
        },
      ],
    });

    return NextResponse.json({ ok: true, id: sendResult.data?.id ?? null });
  } catch (error: any) {
    console.error("email-report error", error);
    return NextResponse.json({ error: error?.message || "Unable to generate report." }, { status: 500 });
  }
}
