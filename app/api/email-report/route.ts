import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

function wrapText(text: string, maxChars: number) {
  const words = String(text || "").split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if ((line + word).length > maxChars) {
      lines.push(line.trim());
      line = `${word} `;
    } else {
      line += `${word} `;
    }
  }

  if (line.trim()) lines.push(line.trim());
  return lines;
}

export async function POST(request: NextRequest) {
  try {
    const { email, givenNames, surname, dob, mobile, image, result } = await request.json();

const patientName = `${givenNames || ""} ${surname || ""}`.trim();
const safeDob = dob || "DOB not supplied";
const pdfFilename = `${surname || "UNKNOWN"}, ${givenNames || "Patient"} - ${safeDob} - SkinChecker Report.pdf`;

    if (!email || !image || !result) {
      return NextResponse.json(
        { error: "Missing report data." },
        { status: 400 }
      );
    }

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const navy = rgb(0.02, 0.17, 0.32);
    const slate = rgb(0.35, 0.42, 0.5);
    const lightBlue = rgb(0.92, 0.97, 1);
    const border = rgb(0.86, 0.9, 0.95);

    const reportColour =
      result.trafficLight === "green"
        ? rgb(0.09, 0.64, 0.29)
        : result.trafficLight === "yellow"
        ? rgb(0.96, 0.62, 0.04)
        : result.trafficLight === "red"
        ? rgb(0.86, 0.15, 0.15)
        : rgb(0.03, 0.52, 0.8);

    page.drawRectangle({
      x: 0,
      y: 760,
      width: 595,
      height: 82,
      color: lightBlue,
    });

    const logoPath = path.join(process.cwd(), "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logo = await pdf.embedPng(logoBytes);
      page.drawImage(logo, { x: 42, y: 782, width: 210, height: 50 });
    }

    page.drawText("SkinChecker.app Report", {
      x: 42,
      y: 735,
      size: 24,
      font: bold,
      color: navy,
    });

    page.drawText(`Prepared for: ${patientName || "SkinChecker user"}`, {
      x: 42,
      y: 712,
      size: 10.5,
      font,
      color: slate,
    });

    page.drawText(`Date: ${new Date().toLocaleString("en-AU")}`, {
      x: 42,
      y: 696,
      size: 10.5,
      font,
      color: slate,
    });

    page.drawCircle({
      x: 515,
      y: 710,
      size: 34,
      color: reportColour,
    });

const statusLabel =
  result.trafficLight === "green"
    ? "Routine observation"
    : result.trafficLight === "yellow"
    ? "Monitor closely"
    : result.trafficLight === "red"
    ? "Medical review recommended"
    : "Urgent medical review";

page.drawText(statusLabel, {
  x: 395,
  y: 654,
  size: 13,
  font: bold,
  color: reportColour,
});

    page.drawRectangle({
      x: 42,
      y: 545,
      width: 511,
      height: 90,
      borderColor: border,
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });

    page.drawText(result.headline || "SkinChecker Assessment", {
      x: 62,
      y: 605,
      size: 18,
      font: bold,
      color: navy,
    });

    let summaryY = 582;
    for (const line of wrapText(result.summary || "", 82).slice(0, 4)) {
      page.drawText(line, {
        x: 62,
        y: summaryY,
        size: 10.5,
        font,
        color: rgb(0.18, 0.22, 0.27),
      });
      summaryY -= 15;
    }

    const imageBytes = Buffer.from(image.split(",")[1], "base64");
    const lesionImage = await pdf.embedJpg(imageBytes);

    page.drawRectangle({
      x: 42,
      y: 335,
      width: 235,
      height: 175,
      borderColor: border,
      borderWidth: 1,
      color: rgb(0.98, 0.99, 1),
      // borderRadius: 16,
    });

page.drawImage(lesionImage, {
  x: 42,
  y: 360,
  width: 255,
  height: 190,
});

    page.drawText("Assessment details", {
      x: 325,
      y: 520,
      size: 15,
      font: bold,
      color: navy,
    });

    const details = [
      ["Image quality", result.imageQuality || "Not supplied"],
      ["Result", statusLabel],
    ];

    let detailY = 474;
    for (const [label, value] of details) {
      page.drawText(label, {
        x: 305,
        y: detailY,
        size: 10,
        font,
        color: slate,
      });
      page.drawText(String(value), {
        x: 410,
        y: detailY,
        size: 10.5,
        font: bold,
        color: navy,
      });
      detailY -= 22;
    }

    page.drawText("ABCDE", {
      x: 305,
      y: 390,
      size: 15,
      font: bold,
      color: navy,
    });

    const abcde = [
      ["A", result.abcde?.asymmetry],
      ["B", result.abcde?.border],
      ["C", result.abcde?.colour],
      ["D", result.abcde?.diameter],
      ["E", result.abcde?.evolution],
    ];

    let abcdeY = 368;
    for (const [letter, value] of abcde) {
      page.drawText(letter, {
        x: 305,
        y: abcdeY,
        size: 10,
        font: bold,
        color: reportColour,
      });

      const lines = wrapText(value || "Not assessed", 36).slice(0, 2);
      for (const line of lines) {
        page.drawText(line, {
          x: 328,
          y: abcdeY,
          size: 9.5,
          font,
          color: rgb(0.18, 0.22, 0.27),
        });
        abcdeY -= 12;
      }

      abcdeY -= 5;
    }

    page.drawText("Observations", {
      x: 42,
      y: 292,
      size: 16,
      font: bold,
      color: navy,
    });

    let obsY = 268;
    for (const obs of (result.observations || []).slice(0, 5)) {
      page.drawCircle({ x: 50, y: obsY + 3, size: 3, color: reportColour });

      for (const line of wrapText(obs, 92).slice(0, 2)) {
        page.drawText(line, {
          x: 62,
          y: obsY,
          size: 10.2,
          font,
          color: rgb(0.18, 0.22, 0.27),
        });
        obsY -= 14;
      }

      obsY -= 4;
    }

    page.drawRectangle({
      x: 42,
      y: 95,
      width: 511,
      height: 80,
      borderColor: border,
      borderWidth: 1,
      color: lightBlue,
    });

    page.drawText("Recommendation", {
      x: 62,
      y: 150,
      size: 15,
      font: bold,
      color: navy,
    });

    let recY = 128;
    for (const line of wrapText(result.recommendation || "", 86).slice(0, 4)) {
      page.drawText(line, {
        x: 62,
        y: recY,
        size: 10.5,
        font,
        color: rgb(0.18, 0.22, 0.27),
      });
      recY -= 14;
    }

    page.drawText("Important: This report is AI-assisted only and is not a diagnosis.", {
      x: 42,
      y: 58,
      size: 9.5,
      font: bold,
      color: rgb(0.3, 0.35, 0.42),
    });

    page.drawText("Always seek professional medical advice if you are concerned about any skin lesion.", {
      x: 42,
      y: 43,
      size: 9.5,
      font,
      color: rgb(0.3, 0.35, 0.42),
    });
const qrPath = path.join(process.cwd(), "public", "qr-skinchecker.png");

if (fs.existsSync(qrPath)) {
  const qrBytes = fs.readFileSync(qrPath);
  const qr = await pdf.embedPng(qrBytes);

  page.drawImage(qr, {
    x: 470,
    y: 32,
    width: 70,
    height: 70,
  });
}
    const pdfBytes = await pdf.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

    await resend.emails.send({
      from:
        process.env.REPORT_FROM_EMAIL ||
        "SkinChecker <info@skinchecker.app>",
      to: email,
      subject: "Your SkinChecker.app Report",
      html: `
<div style="font-family:Calibri,sans-serif;max-width:640px;margin:auto;padding:24px;color:#0f172a">

  <p>Hi ${givenNames || "there"},</p>

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

</div>
`,

      attachments: [
        {
          filename: pdfFilename,
          content: pdfBase64,
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email report failed:", error);
    return NextResponse.json(
      { error: "Email report failed." },
      { status: 500 }
    );
  }
  
}