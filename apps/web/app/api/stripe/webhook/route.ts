import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { findCreditPack, PLANS, type BillingInterval } from "@ohnivo/shared";
import { shouldStripeOverridePlan } from "@/lib/admin-plan";
import { logAudit } from "@/lib/audit";
import { env } from "@/lib/env";
import { grantCredits } from "@/lib/credits";
import { notify } from "@/lib/notifications";
import { getStripe } from "@/lib/stripe";
import { getServiceClient } from "@/lib/supabase/service";
import type { SubscriptionRow } from "@/lib/types";

export const dynamic = "force-dynamic";

type PaidPlan = "starter" | "premium" | "pro";

function customerId(value: string | Stripe.Customer | Stripe.DeletedCustomer): string {
  return typeof value === "string" ? value : value.id;
}

function subscriptionId(value: string | Stripe.Subscription): string {
  return typeof value === "string" ? value : value.id;
}

function resolvePlan(subscription: Stripe.Subscription): {
  plan: PaidPlan;
  interval: BillingInterval;
} | null {
  const item = subscription.items.data[0];
  const candidates = [
    { plan: subscription.metadata.plan, interval: subscription.metadata.interval },
    {
      plan: item?.price?.metadata.ohnivo_plan,
      interval: item?.price?.metadata.ohnivo_interval,
    },
  ];

  for (const candidate of candidates) {
    if (
      (candidate.plan === "starter" || candidate.plan === "premium" || candidate.plan === "pro") &&
      (candidate.interval === "month" || candidate.interval === "year")
    ) {
      return { plan: candidate.plan, interval: candidate.interval };
    }
  }
  return null;
}

function periodEnd(subscription: Stripe.Subscription): string | null {
  return subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;
}

async function planSource(userId: string): Promise<string | null> {
  const { data } = await getServiceClient()
    .from("users")
    .select("plan_source")
    .eq("id", userId)
    .maybeSingle();
  return (data as { plan_source?: string | null } | null)?.plan_source ?? null;
}

async function applySubscription(
  subscription: Stripe.Subscription,
  fallbackUserId?: string | null,
): Promise<void> {
  const resolved = resolvePlan(subscription);
  if (!resolved) {
    console.warn("[stripe] subscription without a known price", subscription.id);
    return;
  }
  const service = getServiceClient();
  const userId = subscription.metadata.userId ?? fallbackUserId ?? null;
  // past_due = failed renewal payment: no paid plan until Stripe collects it (then status returns to active).
  const active = ["active", "trialing"].includes(subscription.status);
  const plan: PaidPlan | "free" = active ? resolved.plan : "free";

  await service.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId(subscription.customer),
      stripe_subscription_id: subscription.id,
      plan: resolved.plan,
      interval: resolved.interval,
      status: subscription.status,
      price_id: subscription.items.data[0]?.price?.id ?? null,
      current_period_end: periodEnd(subscription),
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
    { onConflict: "stripe_subscription_id" },
  );

  if (!userId) return;
  const stripeWins = shouldStripeOverridePlan(await planSource(userId), active);
  if (!stripeWins) {
    // Keep the admin-granted plan, but still link the Stripe customer.
    await service
      .from("users")
      .update({ stripe_customer_id: customerId(subscription.customer) })
      .eq("id", userId);
    return;
  }

  await service
    .from("users")
    .update({
      plan,
      plan_interval: active ? resolved.interval : null,
      plan_renews_at: active ? periodEnd(subscription) : null,
      stripe_customer_id: customerId(subscription.customer),
      plan_source: "stripe",
      manual_plan: null,
      manual_plan_interval: null,
      manual_plan_granted_by: null,
      manual_plan_granted_at: null,
    })
    .eq("id", userId);
}

async function grantCreditPack(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId ?? session.client_reference_id;
  const pack = findCreditPack(session.metadata?.pack ?? "");
  const credits = Number(session.metadata?.credits);
  if (!userId || !pack || credits !== pack.credits) {
    console.warn("[stripe] payment checkout without a valid credit pack", session.id);
    return;
  }

  await grantCredits(userId, credits, "credit_pack", {
    checkoutSessionId: session.id,
    pack: pack.id,
  });
  await logAudit({
    actorUserId: userId,
    action: "credits.credit_pack",
    meta: { checkoutSessionId: session.id, pack: pack.id, credits },
  });

  const locale = (await getServiceClient().from("users").select("locale").eq("id", userId).maybeSingle()).data
    ?.locale;
  const czech = locale !== "en";
  await notify(userId, {
    type: "credits_granted",
    title: czech ? "Kredity připsány" : "Credits added",
    body: czech
      ? `Na účet ti přibylo ${credits} kreditů z dokupu.`
      : `${credits} purchased credits were added to your account.`,
    href: "/dashboard/billing",
  });
}

async function grantInvoiceCredits(invoice: Stripe.Invoice): Promise<void> {
  if (!invoice.subscription) return;
  if (invoice.billing_reason !== "subscription_create" && invoice.billing_reason !== "subscription_cycle") {
    return;
  }

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId(invoice.subscription));
  const resolved = resolvePlan(subscription);
  if (!resolved) return;

  const service = getServiceClient();
  const { data } = await service
    .from("subscriptions")
    .select("*")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  let userId = (data as SubscriptionRow | null)?.user_id ?? null;
  if (!userId) {
    await applySubscription(subscription);
    const retry = await service
      .from("subscriptions")
      .select("*")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle();
    userId = (retry.data as SubscriptionRow | null)?.user_id ?? null;
  }
  if (!userId) {
    console.warn("[stripe] invoice without a linked user", invoice.id);
    return;
  }
  // A manual plan already grants its own credits; do not stack subscription credits.
  if ((await planSource(userId)) === "manual") return;

  const months = resolved.interval === "year" ? 12 : 1;
  const amount = PLANS[resolved.plan].monthlyCredits * months;
  if (amount <= 0) return;

  await grantCredits(userId, amount, "subscription", {
    invoiceId: invoice.id,
    plan: resolved.plan,
    interval: resolved.interval,
    months,
  });

  const locale = (await service.from("users").select("locale").eq("id", userId).maybeSingle()).data
    ?.locale;
  const czech = locale !== "en";
  await notify(userId, {
    type: "credits_granted",
    title: czech ? "Kredity připsány" : "Credits added",
    body: czech
      ? `Na účet ti přibylo ${amount} kreditů za předplatné.`
      : `${amount} subscription credits were added to your account.`,
    href: "/dashboard/billing",
  });
}

export async function POST(request: Request) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "stripe_webhook_not_configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.warn("[stripe] signature verification failed", error);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const service = getServiceClient();
  const { error: insertError } = await service
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });
  if (insertError) {
    if (insertError.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    console.error("[stripe] event log failed", insertError.message);
    return NextResponse.json({ error: "storage_failed" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subscription = await getStripe().subscriptions.retrieve(
            subscriptionId(session.subscription as string | Stripe.Subscription),
          );
          await applySubscription(
            subscription,
            session.client_reference_id ?? session.metadata?.userId ?? null,
          );
        } else if (session.mode === "payment") {
          await grantCreditPack(session);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        if (event.type === "customer.subscription.deleted") {
          const serviceLocal = getServiceClient();
          await serviceLocal
            .from("subscriptions")
            .update({ status: "canceled", cancel_at_period_end: false })
            .eq("stripe_subscription_id", subscription.id);
          if (
            subscription.metadata.userId &&
            shouldStripeOverridePlan(await planSource(subscription.metadata.userId), false)
          ) {
            await serviceLocal
              .from("users")
              .update({
                plan: "free",
                plan_interval: null,
                plan_renews_at: null,
                plan_source: "stripe",
              })
              .eq("id", subscription.metadata.userId);
          }
        } else {
          await applySubscription(subscription);
        }
        break;
      }
      case "invoice.paid": {
        await grantInvoiceCredits(event.data.object as Stripe.Invoice);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("[stripe] event handling failed", event.type, error);
    await service.from("stripe_events").delete().eq("id", event.id);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}