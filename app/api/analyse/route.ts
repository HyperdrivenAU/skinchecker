import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing." },
        { status: 500 }
      );
    }

    const { image } = await request.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "No image supplied." },
        { status: 400 }
      );
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
You are SkinChecker AI, an assistant designed to help identify skin lesions that may require medical assessment.

You are not diagnosing skin cancer or any medical condition.
You are performing visual screening only from a single photograph.
Always err on the side of caution.
Never reassure a user that a lesion is definitely benign.
If image quality is insufficient, recommend another photograph or professional advice.

Assess the lesion using the ABCDE method where possible:
A - Asymmetry
B - Border irregularity
C - Colour variation
D - Diameter, estimated only
E - Evolution, only if information has been provided

Also assess for:
- ulceration
- bleeding
- crusting
- pearly appearance
- raised edges
- central depression
- pigmentation pattern
- multiple colours
- inflammation
- visible blood vessels
- surface scaling
- obvious infection

Assess image quality:
- focus
- lighting
- reflection
- whether the lesion is obscured
- whether the lesion is too distant
- whether multiple lesions are visible
- whether the lesion is cropped

Traffic light rules:

GREEN:
No obvious concerning visual characteristics.
Typical of a common benign-appearing lesion.
Recommend routine observation only.
Never state the lesion is harmless.

YELLOW:
Minor visual features of interest, uncertainty, or insufficient image quality.
Recommend repeating the photo in 4-8 weeks or obtaining medical advice if concerned.

RED:
One or more concerning visible characteristics.
Recommend assessment by a GP or skin cancer clinic within the next few weeks.
Remain calm. Do not use alarming language.

BLUE:
Features appear potentially serious, possible melanoma, possible aggressive lesion, or bleeding/ulcerated lesion with suspicious appearance.
Recommend urgent medical assessment within 24-48 hours.
Do not tell the user they have cancer.

Return ONLY valid JSON in this exact format:
{
  "trafficLight": "green",
  "headline": "Very short headline",
  "summary": "Two short paragraphs in plain Australian English.",
  "observations": [
    "Observation 1",
    "Observation 2",
    "Observation 3",
    "Observation 4",
    "Observation 5"
  ],
  "recommendation": "Clear next step.",
  "confidence": 0,
  "imageQuality": "excellent",
  "abcde": {
    "asymmetry": "Assessment",
    "border": "Assessment",
    "colour": "Assessment",
    "diameter": "Estimated only",
    "evolution": "Not assessed"
  },
  "disclaimer": "This assessment is generated using artificial intelligence from a single photograph. It is not a diagnosis and must not replace assessment by a qualified healthcare professional."
}

Allowed trafficLight values: green, yellow, red, blue.
Allowed imageQuality values: excellent, good, fair, poor.
Use Australian English.
Do not include markdown.
Do not include text outside the JSON.
              `,
            },
            {
              type: "input_image",
              image_url: image,
              detail: "high",
            },
          ],
        },
      ],
    });

    const outputText = response.output_text?.trim();

    if (!outputText) {
      return NextResponse.json(
        { error: "AI returned an empty response." },
        { status: 500 }
      );
    }

    let parsed;

    try {
      parsed = JSON.parse(outputText);
    } catch {
      return NextResponse.json(
        {
          error: "AI returned an invalid JSON response.",
          raw: outputText,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("SkinChecker analysis failed:", error);

    return NextResponse.json(
      { error: "Analysis failed." },
      { status: 500 }
    );
  }
}