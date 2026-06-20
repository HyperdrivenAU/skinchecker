import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, image, result } = await request.json();

    if (!email || !image || !result) {
      return NextResponse.json({ error: "Missing report data." }, { status: 400 });
    }

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logo = await pdf.embedPng(logoBytes);
      page.drawImage(logo, { x: 55, y: 735, width: 210, height: 52 });
    }

    page.drawText("AI Skin Assessment Report", {
      x: 55,
      y: 690,
      size: 24,
      font: bold,
      color: rgb(0.02, 0.17, 0.32),
    });

    page.drawText(`Prepared for: ${firstName || "SkinChecker user"}`, {
      x: 55,
      y: 660,
      size: 11,
      font,
      color: rgb(0.35, 0.4, 0.45),
    });

    page.drawText(`Date: ${new Date().toLocaleString("en-AU")}`, {
      x: 55,
      y: 642,
      size: 11,
      font,
      color: rgb(0.35, 0.4, 0.45),
    });

    const colour =
      result.trafficLight === "green" ? rgb(0.09, 0.64, 0.29) :
      result.trafficLight === "yellow" ? rgb(0.96, 0.62, 0.04) :
      result.trafficLight === "red" ? rgb(0.86, 0.15, 0.15) :
      rgb(0.03, 0.52, 0.8);

    page.drawCircle({ x: 78, y: 590, size: 18, color: colour });

    page.drawText(result.headline || "SkinChecker Assessment", {
      x: 110,
      y: 583,
      size: 18,
      font: bold,
      color: rgb(0.02, 0.17, 0.32),
    });

    const imageBytes = Buffer.from(image.split(",")[1], "base64");
    const embeddedImage = await pdf.embedJpg(imageBytes);
    page.drawImage(embeddedImage, {
      x: 55,
      y: 355,
      width: 220,
      height: 165,
    });

    let y = 520;

    function drawWrapped(text: string, x: number, startY: number, maxChars = 82) {
      const words = text.split(" ");
      let line = "";
      let yy = startY;

      for (const word of words) {
        if ((line + word).length > maxChars) {
          page.drawText(line, { x, y: yy, size: 11, font, color: rgb(0.15, 0.18, 0.22) });
          line = word + " ";
          yy -= 16;
        } else {
          line += word + " ";
        }
      }

      if (line.trim()) {
        page.drawText(line.trim(), { x, y: yy, size: 11, font, color: rgb(0.15, 0.18, 0.22) });
      }

      return yy - 22;
    }

    y = drawWrapped(result.summary || "", 305, y, 45);

    page.drawText("Observations", { x: 55, y: 315, size: 15, font: bold });
    y = 292;

    for (const obs of result.observations || []) {
      y = drawWrapped(`• ${obs}`, 55, y, 90);
    }

    page.drawText("Recommendation", { x: 55, y: y - 5, size: 15, font: bold });
    y = drawWrapped(result.recommendation || "", 55, y - 30, 90);

    page.drawText("Important disclaimer", { x: 55, y: y - 8, size: 13, font: bold });
    drawWrapped(
      result.disclaimer ||
        "This assessment is generated using artificial intelligence from a single photograph. It is not a diagnosis and must not replace assessment by a qualified healthcare professional.",
      55,
      y - 32,
      90
    );

    const pdfBytes = await pdf.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

    await resend.emails.send({
      from: process.env.REPORT_FROM_EMAIL || "SkinChecker <info@skinchecker.app>",
      to: email,
      subject: "Your SkinChecker Assessment Report",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto">
          <h2>Your SkinChecker Assessment Report</h2>
          <p>Hi ${firstName || "there"},</p>
          <p>Your AI-assisted SkinChecker report is attached as a PDF.</p>
          <p><strong>${result.headline}</strong></p>
          <p>${result.recommendation}</p>
          <p style="font-size:13px;color:#666">${result.disclaimer}</p>
        </div>
      `,
      attachments: [
        {
          filename: "SkinChecker-Assessment.pdf",
          content: pdfBase64,
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email report failed:", error);
    return NextResponse.json({ error: "Email report failed." }, { status: 500 });
  }
}