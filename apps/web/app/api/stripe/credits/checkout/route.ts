import { NextResponse } from "next/server";
import { z } from "zod";
import { findCreditPack, type CreditPackDefinition } from "@ohnivo/shared";
import { requireApiUser } from "@/lib/auth/session";
import { env, isStripeConfigured } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, errorResponse, parseJson } from "@/lib/http";
import { getOrCreateCreditPackPrice, getStripe } from "@/lib/stripe";
import { isMissingStripeCustomerError } from "@/lib/stripe-checkout";
import { getServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ pack: z.string().min(1) });

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireApiUser();
    if (!isStripeConfigured()) {
      throw new AppError("stripe_missing", "Stripe is not configured");
    }

    const body = await parseJson(request, (value) => bodySchema.parse(value));
    const foundPack = findCreditPack(body.pack);
    if (!foundPack) throw new AppError("invalid_input", "Unknown credit pack");
    const pack: CreditPackDefinition = foundPack;

    const stripe = getStripe();
    const priceId = await getOrCreateCreditPackPrice(pack);
    const service = getServiceClient();
    let customerId = session.user.stripe_customer_id;

    async function createCustomer(): Promise<string> {
      const customer = await stripe.customers.create({
        metadata: { userId: session.user.id, discordId: session.user.discord_id },
      });
      const { error } = await service
        .from("users")
        .update({ stripe_customer_id: customer.id })
        .eq("id", session.user.id);
      if (error) {
        throw new AppError("unknown", "Unable to save Stripe customer", error.message);
      }
      return customer.id;
    }

    if (!customerId) customerId = await createCustomer();

    async function createCheckoutSession(customer: string) {
      return stripe.checkout.sessions.create({
        mode: "payment",
        customer,
        client_reference_id: session.user.id,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?checkout=credits_success`,
        cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing?checkout=cancelled`,
        metadata: {
          userId: session.user.id,
          pack: pack.id,
          credits: String(pack.credits),
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
