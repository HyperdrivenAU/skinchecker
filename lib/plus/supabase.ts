type SupabaseRow = Record<string, unknown>;

function supabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  return url.replace(/\/$/, "");
}

function serviceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return key;
}

async function supabaseRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${supabaseUrl()}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey(),
      Authorization: `Bearer ${serviceRoleKey()}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Supabase request failed with status ${response.status}: ${body}`
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function asIsoFromUnix(value: unknown) {
  if (typeof value !== "number") return null;
  return new Date(value * 1000).toISOString();
}

function planIntervalFromPrice(priceId?: string) {
  if (priceId && priceId === process.env.STRIPE_PLUS_YEARLY_PRICE_ID) {
    return "year";
  }

  if (priceId && priceId === process.env.STRIPE_PLUS_MONTHLY_PRICE_ID) {
    return "month";
  }

  return null;
}

export async function recordCheckoutSessionCreated(input: {
  sessionId: string;
  email?: string;
  stripePriceId: string;
  plan: "monthly" | "yearly";
}) {
  const rows = await supabaseRequest<SupabaseRow[]>("/rest/v1/user_subscriptions", {
    method: "POST",
    body: JSON.stringify({
      email: input.email || null,
      stripe_checkout_session_id: input.sessionId,
      stripe_price_id: input.stripePriceId,
      plan_interval: input.plan === "yearly" ? "year" : "month",
      status: "incomplete",
    }),
  });

  return rows[0];
}

export async function upsertPlusSubscriptionFromStripe(input: {
  checkoutSessionId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  email?: string;
  stripePriceId?: string;
  status: string;
  currentPeriodStart?: unknown;
  currentPeriodEnd?: unknown;
  cancelAtPeriodEnd?: boolean;
  cancelledAt?: unknown;
  rawEvent?: unknown;
}) {
  const payload = {
    email: input.email || null,
    stripe_customer_id: input.stripeCustomerId || null,
    stripe_subscription_id: input.stripeSubscriptionId || null,
    stripe_checkout_session_id: input.checkoutSessionId || null,
    stripe_price_id: input.stripePriceId || null,
    plan_interval: planIntervalFromPrice(input.stripePriceId),
    status: input.status,
    current_period_start: asIsoFromUnix(input.currentPeriodStart),
    current_period_end: asIsoFromUnix(input.currentPeriodEnd),
    cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
    cancelled_at: asIsoFromUnix(input.cancelledAt),
    raw_event: input.rawEvent || null,
  };

  if (input.stripeSubscriptionId) {
    const rows = await supabaseRequest<SupabaseRow[]>(
      "/rest/v1/user_subscriptions?on_conflict=stripe_subscription_id",
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(payload),
      }
    );
    return rows[0];
  }

  if (input.checkoutSessionId) {
    const rows = await supabaseRequest<SupabaseRow[]>(
      `/rest/v1/user_subscriptions?stripe_checkout_session_id=eq.${input.checkoutSessionId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    );
    return rows[0];
  }

  const rows = await supabaseRequest<SupabaseRow[]>("/rest/v1/user_subscriptions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return rows[0];
}
