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

const PAGE = { width: 595.28, height: 841.89 };
const M = 36;
const NAVY = rgb(0.035, 0.095, 0.16);
const TEAL = rgb(0.02, 0.48, 0.5);
const TEXT = rgb(0.08, 0.1, 0.16);
const MUTED = rgb(0.38, 0.43, 0.5);
const LINE = rgb(0.78, 0.82, 0.87);
const SOFT = rgb(0.975, 0.985, 0.99);
const WHITE = rgb(1, 1, 1);
const GREEN = rgb(0.22, 0.55, 0.22);
const GREEN_SOFT = rgb(0.93, 0.985, 0.93);
const AMBER = rgb(0.92, 0.57, 0.02);
const AMBER_SOFT = rgb(1, 0.975, 0.88);
const RED = rgb(0.76, 0.12, 0.2);
const RED_SOFT = rgb(1, 0.92, 0.93);

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

function normaliseAssessmentColour(value?: string): AssessmentColour {
  const v = String(value || "").toLowerCase();
  if (v.includes("green") || v.includes("low")) return "green";
  if (v.includes("yellow") || v.includes("amber") || v.includes("moderate") || v.includes("monitor")) return "yellow";
  if (v.includes("red") || v.includes("high")) return "red";
  return "unknown";
}

function assessmentCopy(colour: AssessmentColour, suppliedLabel?: string) {
  if (colour === "green") return { label: "LOW RISK", line: "Routine self-monitoring recommended.", c: GREEN, bg: GREEN_SOFT };
  if (colour === "yellow") return { label: "MODERATE RISK", line: "Routine skin check recommended.", c: AMBER, bg: AMBER_SOFT };
  if (colour === "red") return { label: "HIGH RISK", line: "Prompt medical review recommended.", c: RED, bg: RED_SOFT };
  return { label: suppliedLabel || "ASSESSMENT", line: "Review recommended if concerned.", c: MUTED, bg: SOFT };
}

function formatDate(value?: string | Date): string {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return String(value || "");
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
}

function textOr(value?: string, fallback = "Not provided") {
  return value && String(value).trim() ? String(value).trim() : fallback;
}

function fullName(data: SkinCheckerReportData): string {
  const p = data.patient || {};
  return [p.givenNames, p.surname].filter(Boolean).join(" ") || "SkinChecker user";
}

function dataUrlToBytes(dataUrl?: string): { bytes: Uint8Array; mime: string } | null {
  if (!dataUrl) return null;
  const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i);
  if (!match) return null;
  return { bytes: Buffer.from(match[3], "base64"), mime: match[1].toLowerCase() };
}

async function embedImage(pdfDoc: PDFDocument, dataUrl?: string): Promise<PDFImage | null> {
  const decoded = dataUrlToBytes(dataUrl);
  if (!decoded) return null;
  try {
    if (decoded.mime.includes("png")) return await pdfDoc.embedPng(decoded.bytes);
    return await pdfDoc.embedJpg(decoded.bytes);
  } catch {
    return null;
  }
}

async function embedAsset(pdfDoc: PDFDocument, names: string[]): Promise<PDFImage | null> {
  const bytes = readAsset(names);
  if (!bytes) return null;
  try {
    return await pdfDoc.embedPng(bytes);
  } catch {
    try { return await pdfDoc.embedJpg(bytes); } catch { return null; }
  }
}

function drawText(page: PDFPage, text: string, x: number, y: number, size: number, font: PDFFont, colour = TEXT) {
  page.drawText(text, { x, y, size, font, color: colour });
}

function drawWrappedText(page: PDFPage, text: string, x: number, y: number, maxWidth: number, size: number, font: PDFFont, colour = TEXT, lineGap = 5): number {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  let line = "";
  let cy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      drawText(page, line, x, cy, size, font, colour);
      cy -= size + lineGap;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    drawText(page, line, x, cy, size, font, colour);
    cy -= size + lineGap;
  }
  return cy;
}

function card(page: PDFPage, x: number, y: number, w: number, h: number, opts?: { fill?: any; border?: any; radius?: number; width?: number }) {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: opts?.fill || WHITE,
    borderColor: opts?.border || LINE,
    borderWidth: opts?.width ?? 0.8,
  });
}

function fitImage(img: PDFImage, boxW: number, boxH: number) {
  const iw = img.width;
  const ih = img.height;
  const scale = Math.min(boxW / iw, boxH / ih);
  return { w: iw * scale, h: ih * scale };
}

function drawIconCircle(page: PDFPage, x: number, y: number, r: number, colour: any, fonts: Fonts, symbol = "OK") {
  page.drawEllipse({ x, y, xScale: r, yScale: r, color: colour });
  drawText(page, symbol, x - 6.5, y - 7, 22, fonts.bold, WHITE);
}

function getAbcde(data: SkinCheckerReportData) {
  const a = data.abcde || {};
  return {
    A: textOr(a.A, "Not assessed"),
    B: textOr(a.B, "Not assessed"),
    C: textOr(a.C, "Not assessed"),
    D: textOr(a.D, "Not assessed"),
    E: textOr(a.E, "Not assessed"),
  };
}

export async function generateSkinCheckerReportPdf(data: SkinCheckerReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE.width, PAGE.height]);
  const fonts: Fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
  };

  const logo = await embedAsset(pdfDoc, ["SkinCheckerApp Logo.png", "SkinCheckerApp Logo TB2.png", "logo-email.png"]);
  const qr = await embedAsset(pdfDoc, ["qr-skinchecker.png"]);
  const photo = await embedImage(pdfDoc, data.image);
  const reportDate = formatDate(data.reportDate);
  const colour = normaliseAssessmentColour(data.assessment?.colour || data.assessment?.label || data.assessment?.headline);
  const aCopy = assessmentCopy(colour, data.assessment?.label);
  const abcde = getAbcde(data);
  const observations = (data.observations && data.observations.length ? data.observations : ["No structured observations supplied."]).slice(0, 5);

  // Header - white, logo and date only
  if (logo) {
    const dims = fitImage(logo, 210, 56);
    page.drawImage(logo, { x: M, y: 765, width: dims.w, height: dims.h });
  } else {
    drawText(page, "SkinChecker.app", M, 785, 24, fonts.bold, NAVY);
  }
  drawText(page, reportDate, PAGE.width - M - fonts.regular.widthOfTextAtSize(reportDate, 11), 786, 11, fonts.regular, TEXT);
  drawText(page, "Skin Lesion Assessment Report", M, 730, 26, fonts.bold, NAVY);
  drawText(page, "Generated using SkinChecker.app Artificial Intelligence", M, 710, 11, fonts.regular, MUTED);

  // Top combined panel
  const topY = 592;
  card(page, M, topY, PAGE.width - M * 2, 92, { fill: WHITE, border: LINE });
  const leftW = 185;
  page.drawLine({ start: { x: M + leftW, y: topY }, end: { x: M + leftW, y: topY + 92 }, thickness: 0.8, color: LINE });
  drawText(page, "PATIENT DETAILS", M + 16, topY + 68, 11, fonts.bold, NAVY);
  drawText(page, "NAME", M + 16, topY + 48, 6.5, fonts.bold, MUTED);
  drawText(page, fullName(data), M + 16, topY + 35, 10.5, fonts.regular, TEXT);
  drawText(page, "DOB", M + 16, topY + 18, 6.5, fonts.bold, MUTED);
  drawText(page, formatDate(data.patient?.dob), M + 16, topY + 5, 10.5, fonts.regular, TEXT);
  drawText(page, "POSTCODE", M + 108, topY + 18, 6.5, fonts.bold, MUTED);
  drawText(page, textOr(data.patient?.postcode), M + 108, topY + 5, 10.5, fonts.regular, TEXT);

  drawText(page, "ASSESSMENT", M + leftW + 18, topY + 68, 11, fonts.bold, NAVY);
  card(page, M + leftW + 18, topY + 18, PAGE.width - M * 2 - leftW - 36, 42, { fill: aCopy.bg, border: aCopy.c, width: 1 });
  drawIconCircle(page, M + leftW + 48, topY + 39, 16, aCopy.c, fonts, colour === "red" ? "!" : colour === "yellow" ? "!" : "OK");
  drawText(page, aCopy.label, M + leftW + 74, topY + 42, 22, fonts.bold, aCopy.c);
  drawText(page, aCopy.line, M + leftW + 75, topY + 26, 10.5, fonts.regular, TEXT);

  // Photo + interpretation card
  const midY = 378;
  const colGap = 22;
  const photoW = 245;
  const interpW = PAGE.width - M * 2 - photoW - colGap;
  card(page, M, midY, photoW, 188, { fill: WHITE, border: LINE });
  drawText(page, "SUBMITTED PHOTOGRAPH", M + 14, midY + 166, 12, fonts.bold, NAVY);
  const imgBox = { x: M + 14, y: midY + 14, w: photoW - 28, h: 138 };
  if (photo) {
    const dims = fitImage(photo, imgBox.w, imgBox.h);
    page.drawImage(photo, { x: imgBox.x + (imgBox.w - dims.w) / 2, y: imgBox.y + (imgBox.h - dims.h) / 2, width: dims.w, height: dims.h });
  } else {
    card(page, imgBox.x, imgBox.y, imgBox.w, imgBox.h, { fill: SOFT, border: LINE });
    drawText(page, "No image supplied", imgBox.x + 58, imgBox.y + 64, 11, fonts.regular, MUTED);
  }

  card(page, M + photoW + colGap, midY, interpW, 188, { fill: WHITE, border: LINE });
  drawText(page, "CLINICAL INTERPRETATION", M + photoW + colGap + 14, midY + 166, 12, fonts.bold, NAVY);
  drawWrappedText(
    page,
    data.clinicalInterpretation || data.assessment?.headline || "No clinical interpretation supplied.",
    M + photoW + colGap + 14,
    midY + 142,
    interpW - 28,
    10.3,
    fonts.regular,
    TEXT,
    5
  );

  // ABCDE full-width panel
  const abcY = 282;
  card(page, M, abcY, PAGE.width - M * 2, 74, { fill: WHITE, border: LINE });
  drawText(page, "ABCDE", M + 14, abcY + 53, 13, fonts.bold, NAVY);
  const items = [
    ["A", "ASYMMETRY", abcde.A],
    ["B", "BORDER", abcde.B],
    ["C", "COLOUR", abcde.C],
    ["D", "DIAMETER", abcde.D],
    ["E", "EVOLVING", abcde.E],
  ];
  const itemW = (PAGE.width - M * 2 - 34) / 5;
  items.forEach(([letter, title, value], i) => {
    const x = M + 16 + i * itemW;
    if (i > 0) page.drawLine({ start: { x: x - 7, y: abcY + 14 }, end: { x: x - 7, y: abcY + 45 }, thickness: 0.6, color: LINE });
    drawText(page, letter, x + itemW / 2 - 8, abcY + 34, 20, fonts.bold, TEAL);
    drawText(page, title, x + itemW / 2 - fonts.bold.widthOfTextAtSize(title, 7) / 2, abcY + 23, 7, fonts.bold, TEXT);
    const display = String(value).length > 22 ? String(value).slice(0, 21) + "…" : String(value);
    card(page, x + 5, abcY + 6, itemW - 16, 12, { fill: SOFT, border: LINE });
    drawText(page, display, x + 9, abcY + 9, 6.8, fonts.regular, TEXT);
  });

  // Observations + action
  const bottomY = 144;
  const halfW = (PAGE.width - M * 2 - colGap) / 2;
  card(page, M, bottomY, halfW, 112, { fill: WHITE, border: LINE });
  drawText(page, "OBSERVATIONS", M + 14, bottomY + 90, 12, fonts.bold, NAVY);
  let oy = bottomY + 70;
  observations.forEach((o) => {
    page.drawEllipse({ x: M + 18, y: oy + 3, xScale: 2.1, yScale: 2.1, color: TEAL });
    oy = drawWrappedText(page, o, M + 28, oy + 1, halfW - 42, 9.2, fonts.regular, TEXT, 3) - 3;
  });

  card(page, M + halfW + colGap, bottomY, halfW, 112, { fill: WHITE, border: LINE });
  drawText(page, "RECOMMENDED CLINICAL ACTION", M + halfW + colGap + 14, bottomY + 90, 12, fonts.bold, NAVY);
  drawWrappedText(page, data.recommendedAction || data.assessment?.recommendation || aCopy.line, M + halfW + colGap + 14, bottomY + 69, halfW - 28, 9.6, fonts.regular, TEXT, 4);
  card(page, M + halfW + colGap + 14, bottomY + 12, halfW - 28, 28, { fill: colour === "red" ? RED_SOFT : colour === "yellow" ? AMBER_SOFT : GREEN_SOFT, border: aCopy.c });
  drawText(page, "Seek medical advice if the lesion is new, changing,", M + halfW + colGap + 30, bottomY + 29, 8.4, fonts.regular, TEXT);
  drawText(page, "bleeding, painful or concerning.", M + halfW + colGap + 30, bottomY + 18, 8.4, fonts.regular, TEXT);

  // Marketing QR panel
  const qrY = 62;
  card(page, M, qrY, PAGE.width - M * 2, 54, { fill: WHITE, border: TEAL, width: 1.1 });
  if (qr) page.drawImage(qr, { x: M + 14, y: qrY + 7, width: 40, height: 40 });
  drawText(page, "FREE AI SKIN CHECK", M + 78, qrY + 32, 11.5, fonts.bold, NAVY);
  drawText(page, "Scan to perform your own free SkinChecker.app assessment.", M + 78, qrY + 18, 9.5, fonts.regular, TEXT);
  drawText(page, "www.skinchecker.app", M + 78, qrY + 6, 9.5, fonts.bold, TEAL);

  // Footer disclaimer
  const disc1 = "This AI-assisted report is informational only and is not a diagnosis.";
  const disc2 = "Seek medical advice for any lesion that is new, changing, bleeding, painful or concerning.";
  drawText(page, disc1, (PAGE.width - fonts.regular.widthOfTextAtSize(disc1, 7.5)) / 2, 34, 7.5, fonts.regular, MUTED);
  drawText(page, disc2, (PAGE.width - fonts.regular.widthOfTextAtSize(disc2, 7.5)) / 2, 23, 7.5, fonts.regular, MUTED);
  drawText(page, "Generated by SkinChecker.app", (PAGE.width - fonts.regular.widthOfTextAtSize("Generated by SkinChecker.app", 7.5)) / 2, 12, 7.5, fonts.regular, MUTED);

  return pdfDoc.save();
}
