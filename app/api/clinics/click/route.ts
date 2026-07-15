import { NextRequest, NextResponse } from "next/server";
import { clinicConfig } from "@/lib/clinics/config";
import { recordClinicClick } from "@/lib/clinics/store";
import type { ClinicClickAction } from "@/lib/clinics/types";

const actions = new Set<ClinicClickAction>([
  "website",
  "booking",
  "phone",
  "profile",
]);

export async function POST(request: NextRequest) {
  if (!clinicConfig.clickTrackingEnabled) {
    return NextResponse.json({ ok: true, skipped: "disabled" });
  }

  const body = await request.json().catch(() => ({}));
  const impressionId =
    typeof body.impressionId === "string" ? body.impressionId : "";
  const action = body.action as ClinicClickAction;

  if (!impressionId || !actions.has(action)) {
    return NextResponse.json(
      { error: "A valid impression ID and click action are required." },
      { status: 400 }
    );
  }

  const updated = await recordClinicClick(impressionId, action);
  return NextResponse.json({ ok: true, updated });
}
