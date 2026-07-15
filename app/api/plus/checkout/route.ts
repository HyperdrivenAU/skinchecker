import { NextRequest, NextResponse } from "next/server";
import { createPlusCheckoutSession, plusPriceId } from "@/lib/plus/stripe";
import { recordCheckoutSessionCreated } from "@/lib/plus/supabase";
import type { PlusPlan } from "@/lib/plus/stripe";

export const runtime = "nodejs";

function planFromBody(value: unknown): PlusPlan {
  return value === "yearly" ? "yearly" : "monthly";
}

function originFromRequest(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");

  if (host) return `${forwardedProto}://${host}`;
  return new URL(request.url).origin;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const plan = planFromBody(body.plan);
    const email =
      typeof body.email === "string" && body.email.includes("@")
        ? body.email.trim()
        : undefined;

    const session = await createPlusCheckoutSession({
      plan,
      email,
      origin: originFromRequest(request),
    });

    await recordCheckoutSessionCreated({
      sessionId: session.id,
      email,
      stripePriceId: plusPriceId(plan),
      plan,
    }).catch((error) => {
      console.error("Could not record checkout session", error);
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    console.error("plus checkout error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start SkinChecker Plus checkout.",
      },
      { status: 500 }
    );
  }
}
