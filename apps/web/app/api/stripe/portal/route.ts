import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { assertSameOrigin, errorResponse } from "@/lib/http";
import { getStripe } from "@/lib/stripe";
import { isStripeConfigured } from "@/lib/env";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireApiUser();
    if (!isStripeConfigured()) throw new AppError("stripe_missing", "Stripe is not configured");
    if (!session.user.stripe_customer_id) {
      throw new AppError("stripe_missing", "No Stripe customer for this account");
    }

    const portal = await getStripe().billingPortal.sessions.create({
      customer: session.user.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/billing`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (error) {
    return errorResponse(error);
  }
}
