import { NextRequest, NextResponse } from "next/server";
import { DeferredStripePaymentProvider } from "@/lib/clinics/payments";
import type { ClinicApplicationPayload } from "@/lib/clinics/types";
import { createClinicApplication } from "@/lib/clinics/supabase";

function isValidApplication(payload: ClinicApplicationPayload) {
  return (
    ["claim-existing", "register-new"].includes(payload.path) &&
    ["standard", "foundation"].includes(payload.plan) &&
    payload.clinicName?.trim().length > 1 &&
    payload.contactFirstName?.trim().length > 1 &&
    payload.contactLastName?.trim().length > 1 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.contactEmail) &&
    payload.clinicAddress?.trim().length > 5 &&
    payload.authorised &&
    payload.acceptedTerms &&
    payload.acceptedPrivacy
  );
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as ClinicApplicationPayload;

  if (!isValidApplication(payload)) {
    return NextResponse.json(
      { error: "Please complete the required clinic application fields." },
      { status: 400 }
    );
  }

  const paymentProvider = new DeferredStripePaymentProvider();
  const payment = await paymentProvider.createSubscriptionCheckout(payload);

  const application = await createClinicApplication(payload);

  return NextResponse.json({
    ok: true,
    application,
    payment: payment.subscription,
    checkoutUrl: payment.checkoutUrl,
    message:
      "Application submitted. Preferred Partner listings are activated only after payment confirmation and administrative approval.",
  });
}
