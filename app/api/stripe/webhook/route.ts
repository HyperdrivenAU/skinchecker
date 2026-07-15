import { NextRequest, NextResponse } from "next/server";
import {
  isSkinCheckerPlusPrice,
  SKINCHECKER_PLUS_PRODUCT,
  SKINCHECKER_STRIPE_APP,
  stripeStatusToPlusStatus,
  verifyStripeWebhookSignature,
} from "@/lib/plus/stripe";
import { upsertPlusSubscriptionFromStripe } from "@/lib/plus/supabase";

export const runtime = "nodejs";

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function firstSubscriptionItemPriceId(object: Record<string, unknown>) {
  const items = object.items as
    | { data?: Array<{ price?: { id?: string } }> }
    | undefined;
  return items?.data?.[0]?.price?.id;
}

function metadataFromObject(object: Record<string, unknown>) {
  return (object.metadata || {}) as Record<string, unknown>;
}

function isSkinCheckerCheckoutSession(object: Record<string, unknown>) {
  const metadata = metadataFromObject(object);

  return (
    metadata.app === SKINCHECKER_STRIPE_APP &&
    metadata.product === SKINCHECKER_PLUS_PRODUCT
  );
}

function isSkinCheckerSubscription(object: Record<string, unknown>) {
  const metadata = metadataFromObject(object);
  const priceId = firstSubscriptionItemPriceId(object);

  return (
    (metadata.app === SKINCHECKER_STRIPE_APP &&
      metadata.product === SKINCHECKER_PLUS_PRODUCT) ||
    isSkinCheckerPlusPrice(priceId)
  );
}

async function handleCheckoutCompleted(object: Record<string, unknown>, event: StripeEvent) {
  if (object.mode !== "subscription") return;
  if (!isSkinCheckerCheckoutSession(object)) return;

  await upsertPlusSubscriptionFromStripe({
    checkoutSessionId: stringValue(object.id),
    stripeCustomerId: stringValue(object.customer),
    stripeSubscriptionId: stringValue(object.subscription),
    email:
      stringValue(object.customer_email) ||
      stringValue((object.customer_details as { email?: unknown } | undefined)?.email),
    status: "incomplete",
    rawEvent: event,
  });
}

async function handleSubscriptionChange(object: Record<string, unknown>, event: StripeEvent) {
  if (!isSkinCheckerSubscription(object)) return;

  await upsertPlusSubscriptionFromStripe({
    stripeCustomerId: stringValue(object.customer),
    stripeSubscriptionId: stringValue(object.id),
    stripePriceId: firstSubscriptionItemPriceId(object),
    status: stripeStatusToPlusStatus(stringValue(object.status)),
    currentPeriodStart: object.current_period_start,
    currentPeriodEnd: object.current_period_end,
    cancelAtPeriodEnd: object.cancel_at_period_end === true,
    cancelledAt: object.canceled_at,
    rawEvent: event,
  });
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!verifyStripeWebhookSignature(payload, signature)) {
    return NextResponse.json(
      { error: "Invalid Stripe signature." },
      { status: 400 }
    );
  }

  const event = JSON.parse(payload) as StripeEvent;

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object, event);
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await handleSubscriptionChange(event.data.object, event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("stripe webhook error", error);
    return NextResponse.json(
      { error: "Unable to process Stripe webhook." },
      { status: 500 }
    );
  }
}
