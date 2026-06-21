import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import fs from "fs";
import path from "path";

export type AssessmentColour = "green" | "yellow" | "red" | "unknown";

export type SkinCheckerReportData = {
  patient?: {
    givenNames?: string;
    surname?: string;
    dob?: string;
    mobile?: string;
    email?: string;
    postcode?: string;
  };
  reportDate?: string | Date;
  assessment?: {
    colour?: string;
    label?: string;
    confidence?: number | string;
    headline?: string;
    recommendation?: string;
  };
  clinicalInterpretation?: string;
  abcde?: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
    E?: string;
  };
  observations?: string[];
  recommendedAction?: string;
  image?: string;
  imageQuality?: string;
};

type Fonts = {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
};

const PAGE = { width: 595.28, height: 841.89 }; // A4 portrait
const M = 42;
const NAVY = rgb(0.035, 0.095, 0.16);
const BLUE = rgb(0.04, 0.42, 0.65);
const TEAL = rgb(0.02, 0.62, 0.62);
const TEXT = rgb(0.09, 0.12, 0.18);
const MUTED = rgb(0.42, 0.48, 0.56);
const LINE = rgb(0.82, 0.86, 0.9);
const SOFT = rgb(0.965, 0.98, 0.99);
const WHITE = rgb(1, 1, 1);

function assetPath(fileName: string): string {
  return path.join(process.cwd(), "public", fileName);
}

function readAsset(fileNames: string[]): Uint8Array | null {
  for (const fileName of fileNames) {
    const p = assetPath(fileName);
    if (fs.existsSync(p)) return fs.readFileSync(p);
  }
  return null;
}

function normaliseAssessment(input?: string): AssessmentColour {
  const value = String(input || "").toLowerCase().trim();
  if (["green", "low", "low risk", "reassuring", "routine"].some((v) => value.includes(v))) return "green";
  if (["yellow", "amber", "moderate", "monitor", "medium"].some((v) => value.includes(v))) return "yellow";
  if (["red", "high", "urgent", "suspicious"].some((v) => value.includes(v))) return "red";
  return "unknown";
}

function assessmentPresentation(colour: AssessmentColour, suppliedLabel?: string) {
  if (colour === "green") {
    return {
      label: suppliedLabel || "LOW RISK",
      action: "Routine monitoring advised",
      border: rgb(0.13, 0.55, 0.32),
      fill: rgb(0.91, 0.97, 0.93),
      text: rgb(0.05, 0.37, 0.2),
      dot: rgb(0.14, 0.68, 0.38),
    };
  }
  if (colour === "yellow") {
    return {
      label: suppliedLabel || "MODERATE RISK",
      action: "Routine skin check recommended",
      border: rgb(0.92, 0.58, 0.04),
      fill: rgb(1, 0.965, 0.86),
      text: rgb(0.58, 0.34, 0),
      dot: rgb(0.95, 0.62, 0.02),
    };
  }
  if (colour === "red") {
    return {
      label: suppliedLabel || "HIGH RISK",
      action: "Prompt medical review recommended",
      border: rgb(0.77, 0.16, 0.25),
      fill: rgb(1, 0.92, 0.93),
      text: rgb(0.62, 0.08, 0.15),
      dot: rgb(0.82, 0.13, 0.22),
    };
  }
  return {
    label: suppliedLabel || "ASSESSMENT PROVIDED",
    action: "Review recommended if concerned",
    border: rgb(0.45, 0.5, 0.56),
    fill: rgb(0.95, 0.96, 0.97),
    text: rgb(0.23, 0.27, 0.32),
    dot: rgb(0.45, 0.5, 0.56),
  };
}

function formatDate(value?: string | Date): string {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return String(value || "");
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

function formatDob(value?: string): string {
  if (!value) return "Not provided";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

function formatConfidence(value?: number | string): string | null {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "string" ? Number(value.replace("%", "")) : value;
  if (Number.isNaN(n)) return String(value);
  const pct = n <= 1 ? n * 100 : n;
  return `${Math.round(pct)}%`;
}

function patientName(data: SkinCheckerReportData): string {
  const given = data.patient?.givenNames?.trim() || "";
  const surname = data.patient?.surname?.trim() || "";
  const name = `${given} ${surname}`.trim();
  return name || "SkinChecker user";
}

function drawRoundedRect(page: PDFPage, x: number, y: number, width: number, height: number, options: {
  fill?: ReturnType<typeof rgb>;
  border?: ReturnType<typeof rgb>;
  borderWidth?: number;
}) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: options.fill,
    borderColor: options.border,
    borderWidth: options.borderWidth ?? 0,
  });
}

function drawText(page: PDFPage, text: string, x: number, y: number, size: number, font: PDFFont, color = TEXT) {
  page.drawText(text, { x, y, size, font, color });
}

function fitText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawParagraph(page: PDFPage, text: string, x: number, y: number, maxWidth: number, size: number, font: PDFFont, lineHeight = size + 4, maxLines?: number): number {
  let lines = fitText(text, font, size, maxWidth);
  if (maxLines && lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = last.length > 4 ? `${last.replace(/[,. ]+$/, "")}...` : last;
  }
  let cursor = y;
  for (const line of lines) {
    drawText(page, line, x, cursor, size, font);
    cursor -= lineHeight;
  }
  return cursor;
}

async function embedOptionalPng(pdfDoc: PDFDocument, bytes: Uint8Array | null): Promise<PDFImage | null> {
  if (!bytes) return null;
  try { return await pdfDoc.embedPng(bytes); } catch { return null; }
}

async function embedSubmittedImage(pdfDoc: PDFDocument, image?: string): Promise<PDFImage | null> {
  if (!image) return null;
  const match = image.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i);
  const base64 = match ? match[3] : image;
  const mime = match ? match[1].toLowerCase() : "";
  const bytes = Uint8Array.from(Buffer.from(base64, "base64"));

  if (mime.includes("png")) return pdfDoc.embedPng(bytes);
  if (mime.includes("jpg") || mime.includes("jpeg")) return pdfDoc.embedJpg(bytes);

  try { return await pdfDoc.embedJpg(bytes); } catch {}
  try { return await pdfDoc.embedPng(bytes); } catch {}
  return null;
}

function drawImageContained(page: PDFPage, image: PDFImage, boxX: number, boxY: number, boxW: number, boxH: number) {
  const iw = image.width;
  const ih = image.height;
  const scale = Math.min(boxW / iw, boxH / ih);
  const w = iw * scale;
  const h = ih * scale;
  page.drawImage(image, {
    x: boxX + (boxW - w) / 2,
    y: boxY + (boxH - h) / 2,
    width: w,
    height: h,
  });
}

function drawKeyValue(page: PDFPage, label: string, value: string, x: number, y: number, fonts: Fonts, valueWidth = 125) {
  drawText(page, label.toUpperCase(), x, y, 6.5, fonts.bold, MUTED);
  drawParagraph(page, value || "Not provided", x, y - 12, valueWidth, 9.5, fonts.bold, 12, 2);
}

export async function generateSkinCheckerReportPdf(data: SkinCheckerReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE.width, PAGE.height]);
  const fonts: Fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
  };

  const logo = await embedOptionalPng(pdfDoc, readAsset(["SkinCheckerApp Logo TB2.png", "SkinCheckerApp Logo.png", "skinchecker-logo.png"]));
  const qr = await embedOptionalPng(pdfDoc, readAsset(["qr-skinchecker.png"]));
  const submittedImage = await embedSubmittedImage(pdfDoc, data.image);

  // Header
  page.drawRectangle({ x: 0, y: 748, width: PAGE.width, height: 94, color: NAVY });
  if (logo) {
    drawImageContained(page, logo, M, 772, 172, 46);
  } else {
    drawText(page, "SkinChecker.app", M, 793, 22, fonts.bold, WHITE);
  }
  drawText(page, formatDate(data.reportDate), PAGE.width - M - 92, 793, 9, fonts.regular, rgb(0.78, 0.86, 0.93));
  drawText(page, "Skin Lesion Assessment Report", M, 727, 21, fonts.bold, NAVY);
  drawText(page, "Generated using SkinChecker.app Artificial Intelligence", M, 709, 9.5, fonts.regular, MUTED);

  // Top cards
  const colour = normaliseAssessment(data.assessment?.colour || data.assessment?.label || data.assessment?.headline);
  const assess = assessmentPresentation(colour, data.assessment?.label);
  const confidence = formatConfidence(data.assessment?.confidence);

  drawRoundedRect(page, M, 635, 244, 57, { fill: SOFT, border: LINE, borderWidth: 0.8 });
  drawText(page, "PATIENT DETAILS", M + 14, 674, 8, fonts.bold, MUTED);
  drawKeyValue(page, "Name", patientName(data), M + 14, 657, fonts, 110);
  drawKeyValue(page, "DOB", formatDob(data.patient?.dob), M + 14, 629, fonts, 95);
  drawKeyValue(page, "Postcode", data.patient?.postcode || "Not provided", M + 134, 629, fonts, 80);

  drawRoundedRect(page, 314, 635, 239, 57, { fill: assess.fill, border: assess.border, borderWidth: 1.2 });
  page.drawCircle({ x: 333, y: 665, size: 7, color: assess.dot });
  drawText(page, "ASSESSMENT", 349, 674, 8, fonts.bold, MUTED);
  drawText(page, assess.label, 349, 654, 17, fonts.bold, assess.text);
  drawText(page, data.assessment?.headline || assess.action, 349, 640, 8.5, fonts.regular, TEXT);
  if (confidence) drawText(page, `AI confidence: ${confidence}`, 465, 640, 8, fonts.bold, assess.text);

  // Clinical Interpretation
  drawText(page, "CLINICAL INTERPRETATION", M, 603, 10.5, fonts.bold, NAVY);
  let y = drawParagraph(
    page,
    data.clinicalInterpretation || "No clinical interpretation was provided.",
    M,
    585,
    PAGE.width - M * 2,
    9.5,
    fonts.regular,
    13,
    5,
  );
  page.drawLine({ start: { x: M, y: y - 6 }, end: { x: PAGE.width - M, y: y - 6 }, thickness: 0.7, color: LINE });

  // Main body: photograph left, ABCDE/observations right
  const bodyTop = y - 28;
  const photoX = M;
  const photoY = 304;
  const photoW = 250;
  const photoH = 235;
  drawText(page, "SUBMITTED PHOTOGRAPH", photoX, bodyTop, 10.5, fonts.bold, NAVY);
  drawRoundedRect(page, photoX, photoY, photoW, photoH, { fill: WHITE, border: LINE, borderWidth: 0.8 });
  if (submittedImage) {
    drawImageContained(page, submittedImage, photoX + 7, photoY + 7, photoW - 14, photoH - 14);
  } else {
    drawText(page, "No image supplied", photoX + 77, photoY + 116, 10, fonts.italic, MUTED);
  }

  const panelX = 315;
  const panelY = 304;
  const panelW = 238;
  const panelH = 235;
  drawRoundedRect(page, panelX, panelY, panelW, panelH, { fill: rgb(0.985, 0.99, 0.995), border: LINE, borderWidth: 0.8 });
  drawText(page, "ABCDE", panelX + 14, panelY + panelH - 25, 12, fonts.bold, NAVY);
  const abcde = data.abcde || {};
  const abcdeRows: Array<[string, string]> = [
    ["A", abcde.A || "Not assessed"],
    ["B", abcde.B || "Not assessed"],
    ["C", abcde.C || "Not assessed"],
    ["D", abcde.D || "Not assessed"],
    ["E", abcde.E || "Not assessed"],
  ];
  let rowY = panelY + panelH - 47;
  for (const [letter, value] of abcdeRows) {
    drawText(page, letter, panelX + 16, rowY, 9.5, fonts.bold, TEAL);
    drawParagraph(page, value, panelX + 36, rowY, panelW - 54, 8.6, fonts.regular, 10.5, 2);
    rowY -= 23;
  }

  drawText(page, "OBSERVATIONS", panelX + 14, rowY - 1, 10.5, fonts.bold, NAVY);
  rowY -= 19;
  const observations = (data.observations || []).slice(0, 5);
  if (observations.length === 0) observations.push("No structured observations were provided.");
  for (const obs of observations) {
    page.drawCircle({ x: panelX + 19, y: rowY + 3, size: 2.2, color: TEAL });
    const after = drawParagraph(page, obs, panelX + 29, rowY, panelW - 45, 8.2, fonts.regular, 9.5, 2);
    rowY = after - 4;
    if (rowY < panelY + 12) break;
  }

  // Recommended action
  drawRoundedRect(page, M, 237, PAGE.width - M * 2, 44, { fill: rgb(0.91, 0.965, 0.985), border: rgb(0.75, 0.86, 0.91), borderWidth: 0.8 });
  drawText(page, "RECOMMENDED CLINICAL ACTION", M + 14, 263, 10.5, fonts.bold, NAVY);
  drawParagraph(
    page,
    data.recommendedAction || data.assessment?.recommendation || assess.action,
    M + 14,
    248,
    PAGE.width - M * 2 - 28,
    9,
    fonts.regular,
    11,
    2,
  );

  // Marketing QR card
  drawRoundedRect(page, M, 88, PAGE.width - M * 2, 118, { fill: WHITE, border: LINE, borderWidth: 0.8 });
  drawText(page, "FREE AI SKIN CHECK", M + 18, 176, 12, fonts.bold, NAVY);
  drawText(page, "Scan to perform your own free SkinChecker.app assessment.", M + 18, 157, 9.2, fonts.regular, TEXT);
  drawText(page, "www.skinchecker.app", M + 18, 138, 10, fonts.bold, BLUE);
  if (qr) {
    drawImageContained(page, qr, PAGE.width - M - 96, 103, 78, 78);
  }

  // Footer disclaimer
  page.drawLine({ start: { x: M, y: 64 }, end: { x: PAGE.width - M, y: 64 }, thickness: 0.7, color: LINE });
  drawParagraph(
    page,
    "This AI-assisted report is informational only and is not a diagnosis. Seek medical advice for any lesion that is new, changing, bleeding, painful or concerning.",
    M,
    48,
    PAGE.width - M * 2,
    7.2,
    fonts.regular,
    9,
    2,
  );
  drawText(page, "Generated by SkinChecker.app", M, 22, 7.5, fonts.bold, MUTED);

  return pdfDoc.save();
}
