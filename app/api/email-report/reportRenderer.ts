import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import fs from "fs";
import path from "path";

export type AssessmentColour = "green" | "yellow" | "red" | "blue" | "unknown";

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
    summary?: string;
    recommendation?: string;
  };
  clinicalInterpretation?: string;
  abcde?: {
    asymmetry?: string;
    border?: string;
    colour?: string;
    diameter?: string;
    evolution?: string;
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

function clean(value: unknown, fallback = "Not provided"): string {
  if (value === null || value === undefined) return fallback;
  const s = String(value).trim();
  return s.length ? s : fallback;
}

function titleCaseName(givenNames?: string, surname?: string): string {
  const given = clean(givenNames, "");
  const sur = clean(surname, "");
  const joined = `${given} ${sur}`.trim();
  return joined || "SkinChecker user";
}

function formatDate(value?: string | Date): string {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return clean(value, "");
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Sydney",
  }).format(d);
}

function formatReportDate(value?: string | Date): string {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return formatDate(value);
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Sydney",
  }).format(d);
}

function normaliseAssessmentColour(input?: string): AssessmentColour {
  const s = clean(input, "unknown").toLowerCase();

  if (s.includes("green") || s.includes("low")) return "green";
  if (s.includes("yellow") || s.includes("amber") || s.includes("moderate") || s.includes("monitor")) return "yellow";
  if (s.includes("red") || s.includes("high")) return "red";
  if (s.includes("blue") || s.includes("urgent")) return "blue";

  return "unknown";
}
function normaliseRiskLabel(colour?: string) {
  const c = (colour || "").toLowerCase();

  if (c.includes("green")) return "LOW RISK";
  if (c.includes("yellow") || c.includes("amber")) return "MODERATE RISK";
  if (c.includes("red")) return "HIGH RISK";

  return "ASSESSMENT";
}
function assessmentTitle(colour: AssessmentColour): string {
  switch (colour) {
    case "green": return "LOW RISK";
    case "yellow": return "MODERATE RISK";
    case "red": return "HIGH RISK";
    case "blue": return "REVIEW ADVISED";
    default: return "ASSESSMENT";
  }
}

function assessmentColours(colour: AssessmentColour) {
  switch (colour) {
    case "green":
      return { bg: rgb(0.90, 0.98, 0.93), border: rgb(0.34, 0.74, 0.47), text: rgb(0.07, 0.42, 0.18) };
    case "yellow":
      return { bg: rgb(1.0, 0.97, 0.86), border: rgb(0.92, 0.66, 0.12), text: rgb(0.55, 0.34, 0.02) };
    case "red":
      return { bg: rgb(1.0, 0.92, 0.92), border: rgb(0.86, 0.22, 0.22), text: rgb(0.62, 0.07, 0.07) };
    case "blue":
      return { bg: rgb(0.91, 0.96, 1.0), border: rgb(0.21, 0.55, 0.85), text: rgb(0.05, 0.25, 0.52) };
    default:
      return { bg: SOFT, border: LINE, text: NAVY };
  }
}

function sanitiseForPdf(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2022]/g, "-")
    .replace(/[\u2713\u2714]/g, "OK")
    .replace(/[\u2717\u2718]/g, "X")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function textWidth(font: PDFFont, text: string, size: number): number {
  return font.widthOfTextAtSize(sanitiseForPdf(text), size);
}

function drawText(page: PDFPage, text: string, x: number, y: number, opts: {
  font: PDFFont;
  size: number;
  color?: ReturnType<typeof rgb>;
}) {
  page.drawText(sanitiseForPdf(text), {
    x,
    y,
    size: opts.size,
    font: opts.font,
    color: opts.color ?? TEXT,
  });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const cleanText = sanitiseForPdf(clean(text, ""));
  const paragraphs = cleanText.split(/\n+/).map(p => p.trim()).filter(Boolean);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (textWidth(font, candidate, size) <= maxWidth) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }

    if (line) lines.push(line);
  }

  return lines;
}

function drawWrappedText(page: PDFPage, text: string, x: number, y: number, maxWidth: number, opts: {
  font: PDFFont;
  size: number;
  lineHeight?: number;
  color?: ReturnType<typeof rgb>;
  maxLines?: number;
}): number {
  const lineHeight = opts.lineHeight ?? opts.size + 4;
  const lines = wrapText(text, opts.font, opts.size, maxWidth);
  const limited = opts.maxLines ? lines.slice(0, opts.maxLines) : lines;

  limited.forEach((line, i) => {
    drawText(page, line, x, y - i * lineHeight, {
      font: opts.font,
      size: opts.size,
      color: opts.color ?? TEXT,
    });
  });

  return y - limited.length * lineHeight;
}

function drawSectionTitle(page: PDFPage, title: string, x: number, y: number, fonts: Fonts) {
  drawText(page, title.toUpperCase(), x, y, {
    font: fonts.bold,
    size: 9,
    color: BLUE,
  });
}

function drawRoundedBox(page: PDFPage, x: number, y: number, width: number, height: number, opts?: {
  fill?: ReturnType<typeof rgb>;
  border?: ReturnType<typeof rgb>;
  borderWidth?: number;
}) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    borderColor: opts?.border ?? LINE,
    borderWidth: opts?.borderWidth ?? 1,
    color: opts?.fill ?? WHITE,
  });
}

async function embedImage(pdfDoc: PDFDocument, dataUrlOrBase64?: string): Promise<PDFImage | null> {
  if (!dataUrlOrBase64) return null;

  const value = dataUrlOrBase64.trim();
  const match = value.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/i);
  const mime = match?.[1]?.toLowerCase();
  const base64 = match ? match[3] : value;
  const bytes = Uint8Array.from(Buffer.from(base64, "base64"));

  try {
    if (mime?.includes("png")) return await pdfDoc.embedPng(bytes);
    if (mime?.includes("jpg") || mime?.includes("jpeg")) return await pdfDoc.embedJpg(bytes);

    try {
      return await pdfDoc.embedJpg(bytes);
    } catch {
      return await pdfDoc.embedPng(bytes);
    }
  } catch {
    return null;
  }
}

async function embedPublicImage(pdfDoc: PDFDocument, fileNames: string[]): Promise<PDFImage | null> {
  const bytes = readAsset(fileNames);
  if (!bytes) return null;

  for (const fileName of fileNames) {
    const lower = fileName.toLowerCase();
    try {
      if (lower.endsWith(".png")) return await pdfDoc.embedPng(bytes);
      if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return await pdfDoc.embedJpg(bytes);
    } catch {
      // keep trying fallback below
    }
  }

  try {
    return await pdfDoc.embedPng(bytes);
  } catch {
    try {
      return await pdfDoc.embedJpg(bytes);
    } catch {
      return null;
    }
  }
}

function drawContainImage(page: PDFPage, image: PDFImage, x: number, y: number, boxW: number, boxH: number) {
  const imgW = image.width;
  const imgH = image.height;
  const scale = Math.min(boxW / imgW, boxH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const drawX = x + (boxW - drawW) / 2;
  const drawY = y + (boxH - drawH) / 2;

  page.drawImage(image, { x: drawX, y: drawY, width: drawW, height: drawH });
}

function getFieldValue(obj: unknown, keys: string[]): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const record = obj as Record<string, unknown>;

  for (const key of keys) {
    const direct = record[key];
    if (direct !== undefined && direct !== null && String(direct).trim()) return String(direct);

    const foundKey = Object.keys(record).find(k => k.toLowerCase() === key.toLowerCase());
    if (foundKey) {
      const val = record[foundKey];
      if (val !== undefined && val !== null && String(val).trim()) return String(val);
    }
  }

  return undefined;
}

function buildAbcde(data: SkinCheckerReportData): Array<[string, string]> {
  const a = data.abcde ?? {};
  const observations = data.observations ?? [];
  const combinedObs = observations.join(" | ").toLowerCase();

  const asymmetry = getFieldValue(a, ["A", "asymmetry"])
    ?? (combinedObs.includes("asym") ? "Asymmetry noted" : "Not assessed");
  const border = getFieldValue(a, ["B", "border"])
    ?? (combinedObs.includes("border") ? "Border irregularity noted" : "Not assessed");
  const colour = getFieldValue(a, ["C", "colour", "color"])
    ?? (combinedObs.includes("colour") || combinedObs.includes("color") ? "Colour variation noted" : "Not assessed");
  const diameter = getFieldValue(a, ["D", "diameter"])
    ?? (combinedObs.includes("diameter") || combinedObs.includes("mm") ? "Estimated under 5 mm" : "Not assessed");
  const evolving = getFieldValue(a, ["E", "evolving", "evolution"])
    ?? "Cannot assess from one image";

  return [
    ["Asymmetry", asymmetry],
    ["Border", border],
    ["Colour", colour],
    ["Diameter", diameter],
    ["Evolving", evolving],
  ];
}

function drawHeader(page: PDFPage, logo: PDFImage | null, reportDate: string, fonts: Fonts) {
  const top = PAGE.height - M;

  if (logo) {
    const maxW = 165;
    const maxH = 38;
    const scale = Math.min(maxW / logo.width, maxH / logo.height);
    page.drawImage(logo, {
      x: M,
      y: top - logo.height * scale + 2,
      width: logo.width * scale,
      height: logo.height * scale,
    });
  } else {
    drawText(page, "SkinChecker.app", M, top - 20, { font: fonts.bold, size: 18, color: TEAL });
  }

  const dateW = textWidth(fonts.regular, reportDate, 9);
  drawText(page, reportDate, PAGE.width - M - dateW, top - 14, { font: fonts.regular, size: 9, color: MUTED });

  drawText(page, "Skin Lesion Assessment Report", M, top - 54, { font: fonts.bold, size: 17, color: NAVY });
  drawText(page, "Generated using SkinChecker.app Artificial Intelligence", M, top - 70, { font: fonts.regular, size: 8.5, color: MUTED });

  page.drawLine({ start: { x: M, y: top - 86 }, end: { x: PAGE.width - M, y: top - 86 }, thickness: 1, color: LINE });
}

function drawPatientBox(page: PDFPage, data: SkinCheckerReportData, x: number, y: number, w: number, h: number, fonts: Fonts) {
  drawRoundedBox(page, x, y, w, h, { fill: SOFT, border: LINE });
  drawSectionTitle(page, "Patient Details", x + 14, y + h - 18, fonts);

  const patient = data.patient ?? {};
  const rows: Array<[string, string]> = [
    ["Name", titleCaseName(patient.givenNames, patient.surname)],
    ["DOB", formatDate(patient.dob)],
    ["Postcode", clean(patient.postcode)],
    ["Mobile", clean(patient.mobile)],
  ];

  let yy = y + h - 40;
  for (const [label, value] of rows) {
    drawText(page, label.toUpperCase(), x + 14, yy, { font: fonts.bold, size: 6.8, color: MUTED });
    drawWrappedText(page, value, x + 70, yy, w - 84, { font: fonts.regular, size: 8.8, lineHeight: 10.5, maxLines: 1 });
    yy -= 15;
  }
}

function drawAssessmentBox(page: PDFPage, data: SkinCheckerReportData, x: number, y: number, w: number, h: number, fonts: Fonts) {
  const colour = normaliseAssessmentColour(data.assessment?.colour ?? data.assessment?.label);
  const c = assessmentColours(colour);

  drawRoundedBox(page, x, y, w, h, { fill: c.bg, border: c.border, borderWidth: 1.2 });
  drawSectionTitle(page, "Assessment", x + 14, y + h - 18, fonts);

  drawText(page, assessmentTitle(colour), x + 14, y + h - 43, {
    font: fonts.bold,
    size: 17,
    color: c.text,
  });

}

function drawAbcde(page: PDFPage, data: SkinCheckerReportData, x: number, y: number, w: number, fonts: Fonts): number {
  drawSectionTitle(page, "ABCDE", x, y, fonts);
  let yy = y - 16;
  const rows = buildAbcde(data);

  for (const [label, value] of rows) {
    drawText(page, label, x, yy, { font: fonts.bold, size: 8.4, color: TEXT });
    drawWrappedText(page, value, x + 62, yy, w - 62, {
      font: fonts.regular,
      size: 8.4,
      lineHeight: 9.8,
      color: TEXT,
      maxLines: 1,
    });
    yy -= 12.5;
  }

  return yy;
}

function drawObservations(page: PDFPage, observations: string[], x: number, y: number, w: number, fonts: Fonts): number {
  drawSectionTitle(page, "Observations", x, y, fonts);
  let yy = y - 16;
  const items = observations.length ? observations.slice(0, 5) : ["No specific observations were provided."];

  for (const item of items) {
    drawText(page, "-", x, yy, { font: fonts.regular, size: 8.8, color: MUTED });
    yy = drawWrappedText(page, item, x + 10, yy, w - 10, {
      font: fonts.regular,
      size: 8.8,
      lineHeight: 10.8,
      maxLines: 2,
    });
    yy -= 2;
  }

  return yy;
}

function drawRecommendation(page: PDFPage, text: string, x: number, y: number, w: number, fonts: Fonts): number {
  drawSectionTitle(page, "Recommended Clinical Action", x, y, fonts);
  return drawWrappedText(page, text, x, y - 16, w, {
    font: fonts.regular,
    size: 9.2,
    lineHeight: 12,
    maxLines: 3,
  });
}

function deriveRecommendedAction(data: SkinCheckerReportData): string {
  return clean(
    data.recommendedAction
      ?? data.assessment?.recommendation,
    "Repeat the photograph in 4-8 weeks or arrange a routine skin check if you have any concerns or notice changes."
  );
}

function deriveClinicalInterpretation(data: SkinCheckerReportData): string {
  return clean(
    data.clinicalInterpretation
      ?? data.assessment?.summary
      ?? data.assessment?.headline,
    "The submitted image has been assessed by SkinChecker.app artificial intelligence. Review the ABCDE findings, observations and recommended clinical action below."
  );
}

async function drawFooter(page: PDFPage, pdfDoc: PDFDocument, fonts: Fonts) {
  const qr = await embedPublicImage(pdfDoc, ["qr-skinchecker.png", "qr.png"]);
  const footerY = 78;

  drawText(page, "FREE AI SKIN CHECK", M, footerY + 38, {
    font: fonts.bold,
    size: 10,
    color: TEAL,
  });

  drawText(
    page,
    "Scan to perform your own free SkinChecker.app assessment.",
    M,
    footerY + 22,
    {
      font: fonts.regular,
      size: 8.5,
      color: MUTED,
    }
  );

  drawText(page, "www.skinchecker.app", M, footerY + 8, {
    font: fonts.bold,
    size: 8.8,
    color: BLUE,
  });

  if (qr) {
    page.drawImage(qr, {
      x: PAGE.width - M - 58,
      y: footerY + 3,
      width: 58,
      height: 58,
    });
  }

  const disclaimer =
    "This AI-assisted report is informational only and is not a diagnosis. Seek medical advice for any lesion that is new, changing, bleeding, painful or concerning.";

  drawWrappedText(page, disclaimer, M, 34, PAGE.width - M * 2, {
    font: fonts.regular,
    size: 7.3,
    lineHeight: 9,
    color: MUTED,
    maxLines: 2,
  });

  drawText(page, "Generated by SkinChecker.app", M, 17, {
    font: fonts.regular,
    size: 7,
    color: MUTED,
  });
}

export async function generateSkinCheckerReportPdf(data: SkinCheckerReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE.width, PAGE.height]);

  const fonts: Fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
  };

  const logo = await embedPublicImage(pdfDoc, [
    "SkinCheckerApp Logo TB2.png",
    "SkinCheckerApp Logo.png",
    "logo.png",
    "logo-email.png",
  ]);

  drawHeader(page, logo, formatReportDate(data.reportDate), fonts);

  const topY = PAGE.height - M - 112;
  const boxH = 108;
  const gap = 18;
  const colW = (PAGE.width - M * 2 - gap) / 2;

  drawPatientBox(page, data, M, topY - boxH, colW, boxH, fonts);
  drawAssessmentBox(page, data, M + colW + gap, topY - boxH, colW, boxH, fonts);

  const contentTop = topY - boxH - 34;
  const photoW = 215;
  const photoH = 170;
  const rightX = M + photoW + 20;
  const rightW = PAGE.width - M - rightX;

  drawSectionTitle(page, "Submitted Photograph", M, contentTop, fonts);
  const image = await embedImage(pdfDoc, data.image);
  const photoY = contentTop - 182;

  if (image) {
    drawContainImage(page, image, M, photoY, photoW, photoH);
  } else {
    page.drawRectangle({ x: M, y: photoY, width: photoW, height: photoH, color: rgb(0.96, 0.96, 0.96) });
    drawText(page, "No submitted image available", M + 32, photoY + 80, { font: fonts.regular, size: 9, color: MUTED });
  }

  drawSectionTitle(page, "Clinical Interpretation", rightX, contentTop, fonts);
  drawWrappedText(page, deriveClinicalInterpretation(data), rightX, contentTop - 18, rightW, {
    font: fonts.regular,
    size: 8.8,
    lineHeight: 11,
    maxLines: 13,
  });
const abcdeTop = photoY - 30;
  const abcdeBottom = drawAbcde(page, data, M, abcdeTop, photoW, fonts);

  const lowerStartY = abcdeTop;);
  const fullW = PAGE.width - M * 2;

  const obsX = 280;
const obsW = PAGE.width - obsX - M;

const obsBottom = drawObservations(
    page,
    data.observations ?? [],
    obsX,
    lowerStartY,
    obsW,
    fonts
);
  drawRecommendation(page, deriveRecommendedAction(data), M, obsBottom - 10, fullW, fonts);

  await drawFooter(page, pdfDoc, fonts);

  return await pdfDoc.save();
}

export default generateSkinCheckerReportPdf;
