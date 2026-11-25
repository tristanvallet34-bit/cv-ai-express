import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { getStripe, demoMode } from "@/lib/stripe";
import { SITE } from "@/lib/config";
import { json, error } from "@/lib/http";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return error("Connectez-vous pour souscrire.", 401, { login: true });
  const body = await req.json().catch(() => ({}));
  const plan = getPlan(body.plan);
  if (!plan) return error("Offre inconnue");
  if (body.consent !== true) return error("Veuillez accepter les CGV et l'accès immédiat au service.", 400, { consent: true });
  if (plan.mode === "subscription" && user.subscriptionStatus === "active") {
    return error("Vous avez déjà un abonnement actif. Gérez-le depuis votre espace.", 409);
  }

  const origin = req.headers.get("origin") || SITE.url;
  const stripe = await getStripe();

  if (!stripe) {
    if (!(await demoMode())) return error("Paiement indisponible : Stripe n'est pas configuré.", 503);
    // Mode démo (développement) : active Premium sans paiement
    const until = new Date(Date.now() + (plan.days || 30) * 86400000);
    await prisma.user.update({
      where: { id: user.id },
      data:
        plan.mode === "payment"
          ? { plan: plan.id, premiumUntil: until }
          : { plan: plan.id, subscriptionStatus: "active", subscriptionId: `demo_${user.id}`, cancelAtPeriodEnd: false },
    });
    return json({ url: `${origin}/compte?success=1&demo=1` });
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name || undefined, metadata: { userId: user.id } });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const session = await stripe.checkout.sessions.create({
    mode: plan.mode,
    customer: customerId,
    client_reference_id: user.id,
    locale: "fr",
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: plan.price,
          product_data: { name: `CV Express — ${plan.name}`, description: plan.description },
          ...(plan.mode === "subscription" ? { recurring: { interval: plan.interval!, interval_count: plan.intervalCount || 1 } } : {}),
        },
      },
    ],
    metadata: { userId: user.id, plan: plan.id, consent: new Date().toISOString() },
    ...(plan.mode === "subscription"
      ? { subscription_data: { metadata: { userId: user.id, plan: plan.id } } }
      : { payment_intent_data: { metadata: { userId: user.id, plan: plan.id } } }),
    success_url: `${origin}/compte?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/tarifs?canceled=1`,
    custom_text: {
      submit: { message: "Accès Premium immédiat. Abonnement résiliable à tout moment en 1 clic depuis votre espace." },
    },
  });

  return json({ url: session.url });
}
