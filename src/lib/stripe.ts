import "server-only";
import Stripe from "stripe";
import { getSetting, setSettings } from "./settings";
import { SITE } from "./config";

// La clé Stripe peut venir des variables d'environnement (prioritaires)
// ou de la connexion faite depuis /admin/stripe (stockée chiffrée en base).

let cached: { key: string; client: Stripe } | null = null;

export async function stripeSecretKey() {
  if (!SITE.stripeEnabled) return null;
  return process.env.STRIPE_SECRET_KEY || (await getSetting("stripe.secretKey"));
}

export async function getStripe() {
  const key = await stripeSecretKey();
  if (!key) return null;
  if (cached?.key !== key) cached = { key, client: new Stripe(key) };
  return cached.client;
}

export async function webhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || (await getSetting("stripe.webhookSecret"));
}

export async function portalConfigId() {
  return getSetting("stripe.portalConfig");
}

export async function demoMode() {
  // Mode démo (développement uniquement) : active Premium sans paiement
  return process.env.NODE_ENV !== "production" && process.env.DEMO_MODE === "true" && !(await stripeSecretKey());
}

export const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
];

export type StripeStatus = {
  connected: boolean;
  source: "env" | "admin" | null;
  mode: "test" | "live" | null;
  account: { id: string; name: string | null; email: string | null; country: string | null; chargesEnabled: boolean } | null;
  webhook: "ok" | "missing";
  webhookUrl: string | null;
  portal: boolean;
  error?: string;
};

export async function stripeStatus(): Promise<StripeStatus> {
  const key = await stripeSecretKey();
  const base: StripeStatus = { connected: false, source: null, mode: null, account: null, webhook: (await webhookSecret()) ? "ok" : "missing", webhookUrl: await getSetting("stripe.webhookUrl"), portal: !!(await portalConfigId()) };
  if (!key) return base;
  base.source = process.env.STRIPE_SECRET_KEY ? "env" : "admin";
  base.mode = key.includes("_live_") ? "live" : "test";
  try {
    const acc = await (await getStripe())!.accounts.retrieveCurrent();
    return {
      ...base,
      connected: true,
      account: {
        id: acc.id,
        name: acc.settings?.dashboard?.display_name || acc.business_profile?.name || null,
        email: acc.email || null,
        country: acc.country || null,
        chargesEnabled: !!acc.charges_enabled,
      },
    };
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : "Clé invalide" };
  }
}

// Connexion complète : vérifie la clé, crée le webhook et le portail client.
export async function connectStripe(secretKey: string, origin: string) {
  const key = secretKey.trim();
  if (!/^sk_(test|live)_[A-Za-z0-9]+$/.test(key)) throw new Error("La clé doit commencer par sk_test_ ou sk_live_ (clé secrète, onglet Développeurs → Clés API).");
  const stripe = new Stripe(key);
  const account = await stripe.accounts.retrieveCurrent().catch(() => {
    throw new Error("Stripe refuse cette clé. Vérifiez que vous avez copié la clé secrète complète.");
  });

  const notes: string[] = [];
  const toSave: Record<string, string | null> = { "stripe.secretKey": key };

  // 1) Webhook (impossible vers localhost : Stripe exige une URL publique en https)
  const url = `${origin.replace(/\/$/, "")}/api/stripe/webhook`;
  const isPublic = url.startsWith("https://") && !/localhost|127\.0\.0\.1/.test(url);
  if (isPublic) {
    const oldId = await getSetting("stripe.webhookId");
    if (oldId) await stripe.webhookEndpoints.del(oldId).catch(() => {});
    // Supprime aussi un ancien point de terminaison identique créé auparavant
    const existing = await stripe.webhookEndpoints.list({ limit: 100 });
    for (const ep of existing.data) if (ep.url === url) await stripe.webhookEndpoints.del(ep.id).catch(() => {});
    const wh = await stripe.webhookEndpoints.create({ url, enabled_events: WEBHOOK_EVENTS, description: "CV Express — synchronisation des abonnements" });
    toSave["stripe.webhookId"] = wh.id;
    toSave["stripe.webhookSecret"] = wh.secret || null;
    toSave["stripe.webhookUrl"] = url;
    notes.push("Webhook créé automatiquement.");
  } else {
    notes.push("Site en local : le webhook sera créé automatiquement quand vous reconnecterez Stripe depuis votre site en ligne (https). En local, utilisez la Stripe CLI : stripe listen --forward-to localhost:3000/api/stripe/webhook");
  }

  // 2) Portail client (changement de carte, factures, résiliation)
  try {
    const portal = await stripe.billingPortal.configurations.create({
      business_profile: { headline: "Gérez votre abonnement CV Express", privacy_policy_url: isPublic ? `${origin}/confidentialite` : undefined, terms_of_service_url: isPublic ? `${origin}/cgv` : undefined },
      features: {
        customer_update: { enabled: true, allowed_updates: ["email", "address", "name"] },
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: { enabled: true, mode: "at_period_end", cancellation_reason: { enabled: true, options: ["too_expensive", "unused", "other"] } },
      },
    });
    toSave["stripe.portalConfig"] = portal.id;
    notes.push("Portail client configuré (résiliation, factures, carte).");
  } catch (e) {
    notes.push(`Portail client non configuré automatiquement : ${e instanceof Error ? e.message : e}`);
  }

  await setSettings(toSave);
  return { account: { id: account.id, name: account.settings?.dashboard?.display_name || account.business_profile?.name || null, email: account.email || null }, mode: key.includes("_live_") ? "live" : "test", notes };
}

export async function disconnectStripe() {
  const stripe = await getStripe();
  const whId = await getSetting("stripe.webhookId");
  if (stripe && whId) await stripe.webhookEndpoints.del(whId).catch(() => {});
  await setSettings({ "stripe.secretKey": null, "stripe.webhookId": null, "stripe.webhookSecret": null, "stripe.webhookUrl": null, "stripe.portalConfig": null });
}
