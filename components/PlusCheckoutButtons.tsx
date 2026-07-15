"use client";

import { useState } from "react";
import {
  PLUS_MONTHLY_PRICE_AUD,
  PLUS_YEARLY_PRICE_AUD,
} from "@/lib/constants";

type Plan = "monthly" | "yearly";

type Props = {
  compact?: boolean;
};

export function PlusCheckoutButtons({ compact = false }: Props) {
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");

  async function startCheckout(plan: Plan) {
    try {
      setLoadingPlan(plan);
      setError("");

      const email = sessionStorage.getItem("skinchecker_email") || undefined;

      const response = await fetch("/api/plus/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email }),
      });

      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout.");
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to start SkinChecker Plus checkout."
      );
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className={compact ? "mt-5 space-y-3" : "mt-8 space-y-3"}>
      <button
        type="button"
        onClick={() => startCheckout("yearly")}
        disabled={loadingPlan !== null}
        className="w-full rounded-2xl bg-sky-600 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-sky-700 disabled:bg-slate-300"
      >
        {loadingPlan === "yearly"
          ? "Starting checkout..."
          : `Start yearly - ${PLUS_YEARLY_PRICE_AUD}/year`}
      </button>

      <button
        type="button"
        onClick={() => startCheckout("monthly")}
        disabled={loadingPlan !== null}
        className="w-full rounded-2xl border border-slate-300 bg-white py-4 text-lg font-semibold text-slate-700 transition hover:bg-slate-50 disabled:bg-slate-100"
      >
        {loadingPlan === "monthly"
          ? "Starting checkout..."
          : `Monthly option - ${PLUS_MONTHLY_PRICE_AUD}/month`}
      </button>

      {error && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm leading-6 text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
