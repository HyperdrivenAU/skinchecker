import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { Resend } from "resend";

export const runtime = "nodejs";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "UNKNOWN";

type SkinCheckerResult = {
  assessment?: string;
  risk?: string;
  riskLevel?: string;
  summary?: string;
  findings?: string[] | string;
  recommendation?: string;
  confidence?: number | string;
  diagnosis?: string;
  nextSteps?: string[] | string;
};

type ReportPayload = {
  email: string;
  givenNames?: string;
  surname?: string;
  dob?: string;
  mobile?: string;
  postcode?: string;
  image: string;
  result: SkinCheckerResult | string;
  reportUrl?: string;
};

const BRAND = {
  navy: rgb(0.055, 0.11, 0.22),
  blue: rgb(0.0, 0.36, 0.98),
  cyan: rgb(0.0, 0.72, 0.88),
  ink: rgb(0.09, 0.12, 0.18),
  muted: rgb(0.38, 0.43, 0.52),
  line: rgb(0.86, 0.89, 0.93),
  soft: rgb(0.96, 0.975, 0.99),
  white: rgb(1, 1, 1),
  green: rgb(0.06, 0.55, 0.28),
  amber: rgb(0.86, 0.50, 0.04),
  red: rgb(0.82, 0.10, 0.12),
  purple: rgb(0.42, 0.16, 0.76),
};

function safeText(value: unknown, fallback = "Not provided") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length ? text : fallback;
}

function parseResult(result: SkinCheckerResult | string): SkinCheckerResult {
  if (typeof result === "string") {
    try {
      return JSON.parse(result) as SkinCheckerResult;
    } catch {
      return { summary: result };
    }
  }
  return result || {};
}

function normaliseRisk(result: SkinCheckerResult): RiskLevel {
  const raw = `${result.riskLevel || ""} ${result.risk || ""} ${result.assessment || ""} ${result.recommendation || ""}`.toLowerCase();

  if (/urgent|emergency|melanoma|immediate|same day|red/.test(raw)) return "URGENT";
  if (/high|concerning|suspicious|prompt/.test(raw)) return "HIGH";
  if (/medium|moderate|yellow|review|monitor|check/.test(raw)) return "MEDIUM";
  if (/low|green|benign|routine/.test(raw)) return "LOW";
  return "UNKNOWN";
}

function riskStyle(level: RiskLevel) {
  switch (level) {
    case "URGENT":
      return { label: "URGENT REVIEW", colour: BRAND.purple, text: "Same-day clinical advice recommended" };
    case "HIGH":
      return { label: "HIGH RISK", colour: BRAND.red, text: "Prompt skin cancer clinic review recommended" };
    case "MEDIUM":
      return { label: "MODERATE RISK", colour: BRAND.amber, text: "Medical review recommended if changing or concerning" };
    case "LOW":
      return { label: "LOW RISK", colour: BRAND.green, text: "Continue routine monitoring and skin surveillance" };
    default:
      return { label: "UNCLASSIFIED", colour: BRAND.muted, text: "Unable to classify risk from the supplied assessment" };
  }
}

function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => safeText(v, "")).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/\n|•|- /)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function stripDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) return { mime: "image/jpeg", base64: dataUrl };
  return { mime: match[1], base64: match[2] };
}

function wrapText(text: string, maxChars: number) {
  const words = safeText(text, "").split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (test.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function embedUploadedImage(pdfDoc: PDFDocument, imageData: string) {
  const { mime, base64 } = stripDataUrl(imageData);
  const bytes = Buffer.from(base64, "base64");

  if (mime.includes("png")) return pdfDoc.embedPng(bytes);
  return pdfDoc.embedJpg(bytes);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ReportPayload;
    const { email, image } = body;
    const result = parseResult(body.result);

    if (!email || !image || !body.result) {
      return NextResponse.json({ error: "Missing email, image or assessment result." }, { status: 400 });
    }

    const reportId = `SC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const uploadedImage = await embedUploadedImage(pdfDoc, image);
    const imageDims = uploadedImage.scale(1);

    const riskLevel = normaliseRisk(result);
    const risk = riskStyle(riskLevel);

    const margin = 42;
    let y = height - 42;

    const drawText = (text: string, x: number, yy: number, size = 10, colour = BRAND.ink, useBold = false) => {
      page.drawText(text, { x, y: yy, size, font: useBold ? bold : font, color: colour });
    };

    const drawSection = (title: string, yy: number) => {
      page.drawRectangle({ x: margin, y: yy - 8, width: width - margin * 2, height: 24, color: BRAND.soft });
      page.drawText(title.toUpperCase(), { x: margin + 12, y: yy, size: 9, font: bold, color: BRAND.blue });
      return yy - 22;
    };

    // Header
    page.drawRectangle({ x: 0, y: height - 92, width, height: 92, color: BRAND.navy });
    drawText("SkinChecker.app", margin, height - 48, 24, BRAND.white, true);
    drawText("AI Skin Check Report", margin, height - 68, 10.5, rgb(0.78, 0.86, 1));
    drawText(`Report ID: ${reportId}`, width - 215, height - 48, 9, rgb(0.78, 0.86, 1));
    drawText(`Generated: ${new Date().toLocaleDateString("en-AU")}`, width - 215, height - 64, 9, rgb(0.78, 0.86, 1));

    y = height - 122;

    // Risk banner
    page.drawRectangle({ x: margin, y: y - 74, width: width - margin * 2, height: 74, color: risk.colour });
    drawText(risk.label, margin + 20, y - 34, 22, BRAND.white, true);
    drawText(risk.text, margin + 22, y - 56, 10.5, BRAND.white);

    const confidenceText = result.confidence ? `AI confidence: ${safeText(result.confidence)}` : "AI confidence: not supplied";
    drawText(confidenceText, width - 210, y - 34, 10, BRAND.white, true);
    y -= 100;

    // Patient card
    page.drawRectangle({ x: margin, y: y - 84, width: width - margin * 2, height: 84, borderColor: BRAND.line, borderWidth: 1, color: rgb(1, 1, 1) });
    drawText("PATIENT DETAILS", margin + 14, y - 20, 9, BRAND.blue, true);

    const patientName = `${safeText(body.givenNames, "")} ${safeText(body.surname, "")}`.trim() || "Not provided";
    const details = [
      ["Name", patientName],
      ["DOB", safeText(body.dob)],
      ["Mobile", safeText(body.mobile)],
      ["Postcode", safeText(body.postcode)],
    ];

    details.forEach(([label, value], index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = margin + 14 + col * 250;
      const yy = y - 43 - row * 23;
      drawText(`${label}:`, x, yy, 9, BRAND.muted, true);
      drawText(value, x + 62, yy, 9.5, BRAND.ink);
    });

    y -= 112;

    // Main two-column area
    const leftX = margin;
    const leftW = 315;
    const rightX = margin + leftW + 18;
    const rightW = width - rightX - margin;

    let leftY = y;
    leftY = drawSection("AI Summary", leftY);
    const summary = safeText(result.summary || result.diagnosis || result.assessment, "No AI summary was supplied.");
    wrapText(summary, 58).slice(0, 8).forEach((line) => {
      drawText(line, leftX + 10, leftY, 10.5, BRAND.ink);
      leftY -= 15;
    });

    leftY -= 8;
    leftY = drawSection("Clinical Observations", leftY);
    const findings = toList(result.findings);
    const displayFindings = findings.length ? findings : ["No structured findings were supplied by the AI assessment."];
    displayFindings.slice(0, 7).forEach((item) => {
      drawText("•", leftX + 10, leftY, 11, BRAND.blue, true);
      wrapText(item, 50).slice(0, 2).forEach((line, lineIndex) => {
        drawText(line, leftX + 24, leftY - lineIndex * 13, 9.5, BRAND.ink);
      });
      leftY -= Math.max(17, wrapText(item, 50).slice(0, 2).length * 13 + 4);
    });

    leftY -= 8;
    leftY = drawSection("Recommendation", leftY);
    const recommendation = safeText(result.recommendation, risk.text);
    wrapText(recommendation, 55).slice(0, 7).forEach((line) => {
      drawText(line, leftX + 10, leftY, 10, BRAND.ink);
      leftY -= 14;
    });

    const steps = toList(result.nextSteps);
    if (steps.length) {
      leftY -= 8;
      leftY = drawSection("Next Steps", leftY);
      steps.slice(0, 5).forEach((step) => {
        drawText("✓", leftX + 10, leftY, 10, BRAND.green, true);
        drawText(step, leftX + 26, leftY, 9.5, BRAND.ink);
        leftY -= 15;
      });
    }

    // Photo panel
    page.drawRectangle({ x: rightX, y: y - 302, width: rightW, height: 302, borderColor: BRAND.line, borderWidth: 1, color: rgb(1, 1, 1) });
    drawText("PHOTO SUPPLIED", rightX + 12, y - 20, 9, BRAND.blue, true);

    const maxImgW = rightW - 24;
    const maxImgH = 230;
    const scale = Math.min(maxImgW / imageDims.width, maxImgH / imageDims.height);
    const imgW = imageDims.width * scale;
    const imgH = imageDims.height * scale;
    const imgX = rightX + (rightW - imgW) / 2;
    const imgY = y - 278 + (230 - imgH) / 2;
    page.drawImage(uploadedImage, { x: imgX, y: imgY, width: imgW, height: imgH });
    drawText("Image is included for doctor review and comparison.", rightX + 12, y - 288, 7.5, BRAND.muted);

    // QR panel
    const qrTarget = body.reportUrl || "https://skinchecker.app";
    const qrPng = await QRCode.toDataURL(qrTarget, { margin: 1, width: 220 });
    const qrImage = await pdfDoc.embedPng(Buffer.from(stripDataUrl(qrPng).base64, "base64"));

    page.drawRectangle({ x: rightX, y: y - 410, width: rightW, height: 88, borderColor: BRAND.line, borderWidth: 1, color: BRAND.soft });
    page.drawImage(qrImage, { x: rightX + 12, y: y - 398, width: 62, height: 62 });
    drawText("Scan QR", rightX + 86, y - 350, 11, BRAND.ink, true);
    drawText("Open SkinChecker.app", rightX + 86, y - 366, 8.5, BRAND.muted);
    drawText("or share this report with a clinic.", rightX + 86, y - 380, 8.5, BRAND.muted);

    // Disclaimer/footer
    const footerY = 70;
    page.drawLine({ start: { x: margin, y: footerY + 42 }, end: { x: width - margin, y: footerY + 42 }, thickness: 1, color: BRAND.line });
    drawText("Important disclaimer", margin, footerY + 24, 8.5, BRAND.ink, true);
    const disclaimer = "SkinChecker.app provides AI-assisted information only. It is not a diagnosis and does not replace assessment by a qualified medical practitioner. If a lesion is changing, bleeding, painful, irregular, or you are concerned, seek medical advice promptly.";
    wrapText(disclaimer, 118).slice(0, 3).forEach((line, i) => {
      drawText(line, margin, footerY + 10 - i * 10, 7.3, BRAND.muted);
    });

    drawText("skinchecker.app", width - 118, 28, 8, BRAND.blue, true);

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.REPORT_FROM_EMAIL || "SkinChecker.app <reports@skinchecker.app>";

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: `Your SkinChecker.app report - ${reportId}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.5;color:#172033">
            <h2>Your SkinChecker.app report</h2>
            <p>Your AI skin check PDF report is attached.</p>
            <p><strong>Assessment:</strong> ${risk.label}</p>
            <p>${risk.text}</p>
            <p style="font-size:12px;color:#687386">This is not a diagnosis. Please seek medical advice if you are concerned.</p>
          </div>
        `,
        attachments: [
          {
            filename: `${reportId}.pdf`,
            content: pdfBuffer,
          },
        ],
      });
    }

    return NextResponse.json({
      ok: true,
      reportId,
      risk: risk.label,
      emailed: Boolean(resendApiKey),
      pdfBase64: pdfBuffer.toString("base64"),
    });
  } catch (error) {
    console.error("SkinChecker PDF route failed", error);
    return NextResponse.json({ error: "Failed to generate SkinChecker report." }, { status: 500 });
  }
}
