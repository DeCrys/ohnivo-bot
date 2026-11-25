import { NextResponse } from "next/server";
import { z } from "zod";
import { PLANS, isPaidPlan } from "@ohnivo/shared";
import { requireApiUser } from "@/lib/auth/session";
import { env, isStripeConfigured } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, errorResponse, parseJson } from "@/lib/http";
import { getOrCreateStripePrice, getStripe } from "@/lib/stripe";
import { isMissingStripeCustomerError } from "@/lib/stripe-checkout";
import { getServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  plan: z.enum(["starter", "premium", "pro"]),
  interval: z.enum(["month", "year"]),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireApiUser();
    if (!isStripeConfigured()) {
      throw new AppError("stripe_missing", "Stripe is not configured");
    }

    const body = await parseJson(request, (value) => bodySchema.parse(value));
    if (!isPaidPlan(body.plan)) throw new AppError("invalid_input", "Unknown plan");

    const stripe = getStripe();
    const priceId = await getOrCreateStripePrice(body.plan, body.interval);
    const service = getServiceClient();
    let customerId = session.user.stripe_customer_id;

    async function createCustomer(): Promise<string> {
      const customer = await stripe.customers.create({
        metadata: { userId: session.user.id, discordId: session.user.discord_id },
      });
      const { error: saveCustomerError } = await service
        .from("users")
        .update({ stripe_customer_id: customer.id })
        .eq("id", session.user.id);
      if (saveCustomerError) {
        throw new AppError("unknown", "Unable to save Stripe customer", saveCustomerError.message);
      }
      return customer.id;
    }

    if (!customerId) customerId = await createCustomer();

    const plan = PLANS[body.plan];
    const checkoutStartedAt = Date.now();
    async function createCheckoutSession(customer: string) {
      return stripe.checkout.sessions.create({
        mode: "subscription",
        customer,
        client_reference_id: session.user.id,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?checkout=success&checkout_started_at=${checkoutStartedAt}`,
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?checkout=cancelled`,
        allow_promotion_codes: true,
        metadata: {
          userId: session.user.id,
          plan: body.plan,
          interval: body.interval,
        },
        subscription_data: {
          metadata: {
            userId: session.user.id,
            plan: body.plan,
            interval: body.interval,
            credits: String(plan.monthlyCredits),
          },
        },
      });
    }

    let checkout;
    try {
      checkout = await createCheckoutSession(customerId);
    } catch (error) {
      if (!isMissingStripeCustomerError(error)) throw error;
      customerId = await createCustomer();
      checkout = await createCheckoutSession(customerId);
    }

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    return errorResponse(error);
  }
}
