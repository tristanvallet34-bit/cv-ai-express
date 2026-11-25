import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe, webhookSecret } from "@/lib/stripe";
import { getPlan } from "@/lib/plans";
import { sendEmail, emails } from "@/lib/email";

async function userFrom(meta: Stripe.Metadata | null | undefined, customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  if (meta?.userId) {
    const u = await prisma.user.findUnique({ where: { id: meta.userId } });
    if (u) return u;
  }
  const cid = typeof customer === "string" ? customer : customer?.id;
  return cid ? prisma.user.findUnique({ where: { stripeCustomerId: cid } }) : null;
}

async function syncSubscription(sub: Stripe.Subscription) {
  const user = await userFrom(sub.metadata, sub.customer);
  if (!user) return;
  const active = sub.status === "active" || sub.status === "trialing";
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionId: sub.id,
      subscriptionStatus: sub.status,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      plan: active ? sub.metadata?.plan || user.plan : "free",
      stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    },
  });
}

export async function POST(req: Request) {
  const stripe = await getStripe();
  const secret = await webhookSecret();
  if (!stripe || !secret) return new Response("Stripe non configuré", { status: 503 });

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig || "", secret);
  } catch (e) {
    console.error("[webhook] signature invalide", e);
    return new Response("Signature invalide", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        const user = await userFrom(s.metadata, s.customer);
        if (!user) break;
        const plan = getPlan(s.metadata?.plan);
        if (s.mode === "payment" && s.payment_status === "paid" && plan?.days) {
          const start = user.premiumUntil && user.premiumUntil > new Date() ? user.premiumUntil : new Date();
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: plan.id, premiumUntil: new Date(start.getTime() + plan.days * 86400000) },
          });
          await prisma.payment.upsert({
            where: { stripeId: s.id },
            create: { stripeId: s.id, userId: user.id, amount: s.amount_total || 0, currency: s.currency || "eur", plan: plan.id },
            update: {},
          });
        }
        if (plan) void sendEmail(user.email, "Votre accès Premium est activé", emails.premium(plan.name));
        if (s.mode === "subscription" && s.subscription) {
          const sub = await stripe.subscriptions.retrieve(typeof s.subscription === "string" ? s.subscription : s.subscription.id);
          await syncSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object);
        break;
      case "invoice.paid": {
        const inv = event.data.object;
        if (!inv.amount_paid) break;
        const user = await userFrom(inv.parent?.subscription_details?.metadata, inv.customer);
        await prisma.payment.upsert({
          where: { stripeId: inv.id! },
          create: { stripeId: inv.id!, userId: user?.id, amount: inv.amount_paid, currency: inv.currency, plan: inv.parent?.subscription_details?.metadata?.plan },
          update: {},
        });
        break;
      }
    }
  } catch (e) {
    console.error("[webhook] traitement", event.type, e);
    return new Response("Erreur de traitement", { status: 500 });
  }
  return new Response("ok");
}
