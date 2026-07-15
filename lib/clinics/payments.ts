import type { ClinicApplicationPayload } from "./types";

export type ClinicPaymentStatus =
  | "not-started"
  | "completed-awaiting-approval"
  | "active"
  | "cancelled"
  | "failed";

export type ClinicSubscriptionRecord = {
  status: ClinicPaymentStatus;
  customerId?: string;
  subscriptionId?: string;
  planId?: string;
  startDate?: string;
  renewalDate?: string;
  cancellationDate?: string;
  failedPaymentStatus?: string;
};

export interface ClinicPaymentProvider {
  createSubscriptionCheckout(
    application: ClinicApplicationPayload
  ): Promise<{ checkoutUrl?: string; subscription: ClinicSubscriptionRecord }>;
  verifyWebhookSignature(request: Request): Promise<boolean>;
}

export class DeferredStripePaymentProvider implements ClinicPaymentProvider {
  async createSubscriptionCheckout(
    application: ClinicApplicationPayload
  ): Promise<{ checkoutUrl?: string; subscription: ClinicSubscriptionRecord }> {
    const planId =
      application.plan === "foundation"
        ? process.env.STRIPE_FOUNDATION_PRICE_ID
        : process.env.STRIPE_STANDARD_PRICE_ID;

    return {
      subscription: {
        status: "not-started",
        planId,
      },
    };
  }

  async verifyWebhookSignature() {
    return false;
  }
}

export function paymentAllowsPartnerActivation(
  subscription: ClinicSubscriptionRecord,
  adminApproved: boolean
) {
  return adminApproved && subscription.status === "active";
}
