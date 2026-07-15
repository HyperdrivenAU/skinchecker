import crypto from "crypto";

export type PlusPlan = "monthly" | "yearly";

export const SKINCHECKER_STRIPE_APP = "skinchecker";

export const SKINCHECKER_PLUS_PRODUCT = "skinchecker_plus";

type CheckoutSessionInput = {
  plan: PlusPlan;
  origin: string;
  email?: string;
};

type StripeCheckoutSession = {
  id: string;
  url: string | null;
};

function stripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return key;
}

export function plusPriceId(plan: PlusPlan) {
  const priceId =
    plan === "yearly"
      ? process.env.STRIPE_PLUS_YEARLY_PRICE_ID
      : process.env.STRIPE_PLUS_MONTHLY_PRICE_ID;

  if (!priceId) {
    throw new Error(`Stripe ${plan} Plus price ID is not configured.`);
  }

  return priceId;
}

export async function createPlusCheckoutSession({
  plan,
  origin,
  email,
}: CheckoutSessionInput) {
  const body = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": plusPriceId(plan),
    "line_items[0][quantity]": "1",
    success_url: `${origin}/plus/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/plus?checkout=cancelled`,
    allow_promotion_codes: "true",
    "metadata[app]": SKINCHECKER_STRIPE_APP,
    "metadata[product]": SKINCHECKER_PLUS_PRODUCT,
    "metadata[plan]": plan,
    "subscription_data[metadata][app]": SKINCHECKER_STRIPE_APP,
    "subscription_data[metadata][product]": SKINCHECKER_PLUS_PRODUCT,
    "subscription_data[metadata][plan]": plan,
  });

  if (email) {
    body.set("customer_email", email);
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = (await response.json()) as StripeCheckoutSession & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message || "Unable to create Stripe Checkout.");
  }

  return data;
}

export function isSkinCheckerPlusPrice(priceId?: string) {
  return Boolean(
    priceId &&
      (priceId === process.env.STRIPE_PLUS_MONTHLY_PRICE_ID ||
        priceId === process.env.STRIPE_PLUS_YEARLY_PRICE_ID)
  );
}

export function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string | null
) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signature, "hex");

  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

export function stripeStatusToPlusStatus(status?: string) {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "cancelled";
    case "unpaid":
      return "unpaid";
    default:
      return "incomplete";
  }
}
