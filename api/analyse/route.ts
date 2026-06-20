import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
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
You are assisting a skin lesion screening app called SkinChecker.

You must not diagnose cancer or any medical condition.

Analyse the supplied image for visible features only and return a cautious traffic-light recommendation.

Use this scale:
green = no significant visual concerns detected
yellow = monitor closely
red = medical assessment recommended
blue = urgent medical assessment recommended

Return JSON only in this exact format:
{
  "trafficLight": "green | yellow | red | blue",
  "headline": "Short headline",
  "summary": "Plain English summary",
  "observations": ["Observation 1", "Observation 2", "Observation 3"],
  "recommendation": "Clear next step",
  "disclaimer": "This is not a diagnosis and does not replace professional medical advice."
}

Use Australian English.
Be calm, careful and non-alarming.
If the image is unclear, too blurry, too dark, or not a skin lesion, return yellow and recommend retaking the photo or seeking professional advice.
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

    const outputText = response.output_text;

    let parsed;

    try {
      parsed = JSON.parse(outputText);
    } catch {
      return NextResponse.json(
        {
          error: "AI returned an invalid response.",
          raw: outputText,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Analysis failed." },
      { status: 500 }
    );
  }
}