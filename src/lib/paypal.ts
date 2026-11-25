import "server-only";
import { prisma } from "./db";
import { getSetting, setSettings } from "./settings";
import { PLANS, getPlan, type Plan } from "./plans";
import { SITE } from "./config";
import type { User } from "@prisma/client";

// Intégration PayPal directe (API REST v1/v2), indépendante de Stripe.
// Identifiants : variables d'environnement (prioritaires) ou connexion depuis /admin/paypal.

type Creds = { clientId: string; secret: string; mode: "sandbox" | "live" };

export async function paypalCreds(): Promise<Creds | null> {
  if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
    return { clientId: process.env.PAYPAL_CLIENT_ID, secret: process.env.PAYPAL_CLIENT_SECRET, mode: process.env.PAYPAL_MODE === "live" ? "live" : "sandbox" };
  }
  const [clientId, secret, mode] = await Promise.all([getSetting("paypal.clientId"), getSetting("paypal.secret"), getSetting("paypal.mode")]);
  if (!clientId || !secret) return null;
  return { clientId, secret, mode: mode === "live" ? "live" : "sandbox" };
}

function apiBase(mode: "sandbox" | "live") {
  if (process.env.PAYPAL_API_BASE) return process.env.PAYPAL_API_BASE; // tests uniquement
  return mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

const tokenCache = new Map<string, { token: string; exp: number }>();

async function token(c: Creds) {
  const k = `${c.mode}:${c.clientId}:${c.secret}`;
  const hit = tokenCache.get(k);
  if (hit && hit.exp > Date.now() + 60_000) return hit.token;
  const res = await fetch(`${apiBase(c.mode)}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${c.clientId}:${c.secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new PaypalError("PayPal refuse ces identifiants (Client ID / Secret). Vérifiez aussi le mode Sandbox / Live.", res.status);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache.set(k, { token: data.access_token, exp: Date.now() + data.expires_in * 1000 });
  return data.access_token;
}

export class PaypalError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

async function call<T>(c: Creds, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${apiBase(c.mode)}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await token(c)}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(method === "POST" ? { "PayPal-Request-Id": crypto.randomUUID() } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return {} as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[paypal]", method, path, res.status, JSON.stringify(data).slice(0, 600));
    const msg = (data as { message?: string; details?: { description?: string }[] }).details?.[0]?.description || (data as { message?: string }).message;
    throw new PaypalError(msg || `Erreur PayPal (${res.status})`, res.status);
  }
  return data as T;
}

export async function paypalEnabled() {
  return !!(await paypalCreds());
}

const euros = (cents: number) => (cents / 100).toFixed(2);

// ---------- Produit et offres d'abonnement (créés automatiquement, recréés si le prix change) ----------
async function ensureProduct(c: Creds) {
  const key = `paypal.${c.mode}.productId`;
  const existing = await getSetting(key);
  if (existing) return existing;
  const p = await call<{ id: string }>(c, "POST", "/v1/catalogs/products", { name: `${SITE.name} Premium`, description: "Abonnement au générateur de CV CV Express", type: "SERVICE", category: "SOFTWARE" });
  await setSettings({ [key]: p.id }, false);
  return p.id;
}

async function ensurePlan(c: Creds, plan: Plan) {
  const key = `paypal.${c.mode}.plan.${plan.id}`;
  const saved = await getSetting(key);
  if (saved) {
    const [id, price] = saved.split("|");
    if (Number(price) === plan.price) return id;
  }
  const productId = await ensureProduct(c);
  const created = await call<{ id: string }>(c, "POST", "/v1/billing/plans", {
    product_id: productId,
    name: `${SITE.name} — ${plan.name}`,
    description: plan.description.slice(0, 127),
    status: "ACTIVE",
    billing_cycles: [
      {
        frequency: { interval_unit: plan.interval === "year" ? "YEAR" : "MONTH", interval_count: plan.intervalCount || 1 },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { value: euros(plan.price), currency_code: "EUR" } },
      },
    ],
    payment_preferences: { auto_bill_outstanding: true, payment_failure_threshold: 2 },
  });
  await setSettings({ [key]: `${created.id}|${plan.price}` }, false);
  return created.id;
}

type Link = { rel: string; href: string };

// ---------- Démarrage du paiement ----------
export async function paypalCheckout(user: User, plan: Plan, origin: string) {
  const c = await paypalCreds();
  if (!c) throw new PaypalError("PayPal n'est pas configuré.", 503);
  const ctx = { brand_name: SITE.name.slice(0, 127), locale: "fr-FR", shipping_preference: "NO_SHIPPING" };

  if (plan.mode === "payment") {
    const order = await call<{ id: string; links: Link[] }>(c, "POST", "/v2/checkout/orders", {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: plan.id,
          custom_id: `${user.id}|${plan.id}`,
          description: `${SITE.name} — ${plan.name}`,
          amount: { currency_code: "EUR", value: euros(plan.price) },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: { ...ctx, user_action: "PAY_NOW", return_url: `${origin}/api/paypal/return?kind=order`, cancel_url: `${origin}/tarifs?canceled=1` },
        },
      },
    });
    const url = order.links.find((l) => l.rel === "payer-action" || l.rel === "approve")?.href;
    if (!url) throw new PaypalError("Lien de paiement PayPal introuvable.");
    return url;
  }

  const planId = await ensurePlan(c, plan);
  const sub = await call<{ id: string; links: Link[] }>(c, "POST", "/v1/billing/subscriptions", {
    plan_id: planId,
    custom_id: `${user.id}|${plan.id}`,
    subscriber: { email_address: user.email },
    application_context: { ...ctx, user_action: "SUBSCRIBE_NOW", return_url: `${origin}/api/paypal/return?kind=sub`, cancel_url: `${origin}/tarifs?canceled=1` },
  });
  const url = sub.links.find((l) => l.rel === "approve")?.href;
  if (!url) throw new PaypalError("Lien d'abonnement PayPal introuvable.");
  return url;
}

// ---------- Paiement unique : capture au retour ----------
type Capture = { id: string; status: string; amount: { value: string; currency_code: string }; custom_id?: string };
type Order = { id: string; status: string; purchase_units: { custom_id?: string; payments?: { captures?: Capture[] } }[] };

export async function captureOrder(orderId: string) {
  const c = await paypalCreds();
  if (!c) throw new PaypalError("PayPal n'est pas configuré.", 503);
  let order = await call<Order>(c, "GET", `/v2/checkout/orders/${encodeURIComponent(orderId)}`);
  if (order.status === "APPROVED") order = await call<Order>(c, "POST", `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {});
  const unit = order.purchase_units?.[0];
  const cap = unit?.payments?.captures?.find((x) => x.status === "COMPLETED");
  if (!cap) return null;
  const [userId, planId] = String(cap.custom_id || unit.custom_id || "").split("|");
  await grantPass(userId, planId, cap.id, Math.round(Number(cap.amount.value) * 100), cap.amount.currency_code);
  return { userId };
}

async function grantPass(userId: string, planId: string, captureId: string, amount: number, currency: string) {
  const plan = getPlan(planId);
  if (!plan?.days || !userId) return;
  // Idempotent : une capture n'est créditée qu'une seule fois
  const already = await prisma.payment.findUnique({ where: { stripeId: `paypal:${captureId}` } });
  if (already) return;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const start = user.premiumUntil && user.premiumUntil > new Date() ? user.premiumUntil : new Date();
  await prisma.$transaction([
    prisma.payment.create({ data: { stripeId: `paypal:${captureId}`, provider: "paypal", userId, amount, currency: currency.toLowerCase(), plan: plan.id } }),
    prisma.user.update({ where: { id: userId }, data: { plan: plan.id, premiumUntil: new Date(start.getTime() + plan.days * 86400000) } }),
  ]);
}

// ---------- Abonnements ----------
type Sub = {
  id: string;
  status: "APPROVAL_PENDING" | "APPROVED" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";
  custom_id?: string;
  plan_id: string;
  billing_info?: { next_billing_time?: string; last_payment?: { time?: string } };
};

const STATUS: Record<Sub["status"], string> = { APPROVAL_PENDING: "incomplete", APPROVED: "active", ACTIVE: "active", SUSPENDED: "past_due", CANCELLED: "canceled", EXPIRED: "canceled" };

export async function syncSubscription(subId: string) {
  const c = await paypalCreds();
  if (!c) return null;
  const sub = await call<Sub>(c, "GET", `/v1/billing/subscriptions/${encodeURIComponent(subId)}`);
  const [userId, planId] = String(sub.custom_id || "").split("|");
  const user = (userId && (await prisma.user.findUnique({ where: { id: userId } }))) || (await prisma.user.findUnique({ where: { subscriptionId: sub.id } }));
  if (!user) return null;
  const status = STATUS[sub.status] || "incomplete";
  const ended = status === "canceled";
  // Après une résiliation, l'accès reste ouvert jusqu'à la fin de la période déjà payée
  const paidUntil = sub.billing_info?.next_billing_time ? new Date(sub.billing_info.next_billing_time) : null;
  // Un autre abonnement (ex. Stripe) actif ne doit pas être écrasé par un ancien abonnement PayPal
  if (user.subscriptionId && user.subscriptionId !== sub.id && user.subscriptionStatus === "active" && status !== "active") return user;
  return prisma.user.update({
    where: { id: user.id },
    data: {
      billingProvider: "paypal",
      subscriptionId: sub.id,
      subscriptionStatus: status,
      cancelAtPeriodEnd: false,
      plan: ended ? (paidUntil && paidUntil > new Date() ? user.plan : "free") : getPlan(planId)?.id || user.plan,
      premiumUntil: ended && paidUntil && paidUntil > new Date() ? paidUntil : user.premiumUntil,
      paypalCheckedAt: new Date(),
    },
  });
}

export async function cancelSubscription(user: User) {
  const c = await paypalCreds();
  if (!c || !user.subscriptionId) throw new PaypalError("Aucun abonnement PayPal trouvé.", 404);
  await call(c, "POST", `/v1/billing/subscriptions/${encodeURIComponent(user.subscriptionId)}/cancel`, { reason: "Résiliation demandée depuis l'espace client" });
  return syncSubscription(user.subscriptionId);
}

// Filet de sécurité si un webhook est manqué : revérifie l'abonnement au plus toutes les 6 h
export async function refreshIfStale(user: User) {
  if (user.billingProvider !== "paypal" || !user.subscriptionId || user.subscriptionStatus === "canceled") return user;
  if (user.paypalCheckedAt && Date.now() - user.paypalCheckedAt.getTime() < 6 * 3600_000) return user;
  try {
    return (await syncSubscription(user.subscriptionId)) || user;
  } catch {
    return user;
  }
}

// ---------- Webhooks ----------
export const PAYPAL_EVENTS = [
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.UPDATED",
  "BILLING.SUBSCRIPTION.CANCELLED",
  "BILLING.SUBSCRIPTION.SUSPENDED",
  "BILLING.SUBSCRIPTION.EXPIRED",
  "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
  "PAYMENT.SALE.COMPLETED",
  "PAYMENT.CAPTURE.COMPLETED",
];

export async function verifyWebhook(headers: Headers, event: unknown) {
  const c = await paypalCreds();
  const webhookId = process.env.PAYPAL_WEBHOOK_ID || (c && (await getSetting(`paypal.${c.mode}.webhookId`)));
  if (!c || !webhookId) return false;
  const r = await call<{ verification_status: string }>(c, "POST", "/v1/notifications/verify-webhook-signature", {
    auth_algo: headers.get("paypal-auth-algo"),
    cert_url: headers.get("paypal-cert-url"),
    transmission_id: headers.get("paypal-transmission-id"),
    transmission_sig: headers.get("paypal-transmission-sig"),
    transmission_time: headers.get("paypal-transmission-time"),
    webhook_id: webhookId,
    webhook_event: event,
  });
  return r.verification_status === "SUCCESS";
}

type WebhookEvent = { event_type: string; resource: Record<string, unknown> };

export async function handleWebhook(e: WebhookEvent) {
  const r = e.resource;
  if (e.event_type.startsWith("BILLING.SUBSCRIPTION.")) {
    await syncSubscription(String(r.id)).catch((err) => { if (!(err instanceof PaypalError && err.status === 404)) throw err; });
  } else if (e.event_type === "PAYMENT.SALE.COMPLETED") {
    // Paiement récurrent d'un abonnement
    const subId = String(r.billing_agreement_id || "");
    const amount = Math.round(Number((r.amount as { total?: string })?.total || 0) * 100);
    const user = subId ? await prisma.user.findUnique({ where: { subscriptionId: subId } }) : null;
    await prisma.payment.upsert({
      where: { stripeId: `paypal:${r.id}` },
      create: { stripeId: `paypal:${r.id}`, provider: "paypal", userId: user?.id, amount, currency: String((r.amount as { currency?: string })?.currency || "EUR").toLowerCase(), plan: user?.plan },
      update: {},
    });
    if (subId) await syncSubscription(subId).catch((err) => { if (!(err instanceof PaypalError && err.status === 404)) throw err; });
  } else if (e.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    // Pass 7 jours (au cas où le client ne serait pas revenu sur le site après paiement)
    const [userId, planId] = String(r.custom_id || "").split("|");
    const amt = r.amount as { value: string; currency_code: string };
    if (userId && amt) await grantPass(userId, planId, String(r.id), Math.round(Number(amt.value) * 100), amt.currency_code);
  }
}

// ---------- Connexion depuis l'admin ----------
export type PaypalStatus = { connected: boolean; source: "env" | "admin" | null; mode: "sandbox" | "live" | null; webhook: boolean; webhookUrl: string | null; error?: string };

export async function paypalStatus(): Promise<PaypalStatus> {
  const c = await paypalCreds();
  if (!c) return { connected: false, source: null, mode: null, webhook: false, webhookUrl: null };
  const base: PaypalStatus = {
    connected: false,
    source: process.env.PAYPAL_CLIENT_ID ? "env" : "admin",
    mode: c.mode,
    webhook: !!(process.env.PAYPAL_WEBHOOK_ID || (await getSetting(`paypal.${c.mode}.webhookId`))),
    webhookUrl: await getSetting(`paypal.${c.mode}.webhookUrl`),
  };
  try {
    await token(c);
    return { ...base, connected: true };
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : "Identifiants invalides" };
  }
}

export async function connectPaypal(input: { clientId: string; secret: string; mode: string }, origin: string) {
  const c: Creds = { clientId: input.clientId.trim(), secret: input.secret.trim(), mode: input.mode === "live" ? "live" : "sandbox" };
  if (!c.clientId || !c.secret) throw new PaypalError("Renseignez le Client ID et le Secret.", 400);
  await token(c); // vérifie les identifiants
  const notes: string[] = [];
  const save: Record<string, string | null> = { "paypal.clientId": c.clientId, "paypal.secret": c.secret, "paypal.mode": c.mode };

  const url = `${origin.replace(/\/$/, "")}/api/paypal/webhook`;
  const isPublic = url.startsWith("https://") && !/localhost|127\.0\.0\.1/.test(url);
  if (isPublic) {
    const list = await call<{ webhooks: { id: string; url: string }[] }>(c, "GET", "/v1/notifications/webhooks");
    for (const w of list.webhooks || []) if (w.url === url) await call(c, "DELETE", `/v1/notifications/webhooks/${w.id}`).catch(() => {});
    const wh = await call<{ id: string }>(c, "POST", "/v1/notifications/webhooks", { url, event_types: PAYPAL_EVENTS.map((name) => ({ name })) });
    save[`paypal.${c.mode}.webhookId`] = wh.id;
    save[`paypal.${c.mode}.webhookUrl`] = url;
    notes.push("Webhook PayPal créé automatiquement.");
  } else {
    notes.push("Site en local : le webhook PayPal sera créé quand vous reconnecterez PayPal depuis votre site en ligne (https).");
  }
  await setSettings(save);
  // Prépare les offres d'abonnement côté PayPal (prix actuels du site)
  try {
    for (const p of PLANS.filter((x) => x.mode === "subscription")) await ensurePlan(c, p);
    notes.push("Offres d'abonnement créées dans PayPal.");
  } catch (e) {
    notes.push(`Offres créées au premier achat (${e instanceof Error ? e.message : e}).`);
  }
  return { mode: c.mode, notes };
}

export async function disconnectPaypal() {
  await setSettings({ "paypal.clientId": null, "paypal.secret": null, "paypal.mode": null });
}
