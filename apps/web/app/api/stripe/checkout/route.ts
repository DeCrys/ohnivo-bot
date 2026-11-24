import { NextResponse } from "next/server";
import { z } from "zod";
import { PLANS, isPaidPlan } from "@ohnivo/shared";
import { requireApiUser } from "@/lib/auth/session";
import { env, isStripeConfigured } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, errorResponse, parseJson } from "@/lib/http";
import { getStripe, priceIdFor } from "@/lib/stripe";
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

    const priceId = priceIdFor(body.plan, body.interval);
    if (!priceId) throw new AppError("stripe_missing", "Missing Stripe price id for this plan");

    const stripe = getStripe();
    const service = getServiceClient();
    let customerId = session.user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { userId: session.user.id, discordId: session.user.discord_id },
      });
      customerId = customer.id;
      await service
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", session.user.id);
    }

    const plan = PLANS[body.plan];
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: session.user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?checkout=success`,
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

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    return errorResponse(error);
  }
}
