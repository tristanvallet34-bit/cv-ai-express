import { getCurrentUser, isAdmin } from "@/lib/auth";
import { connectStripe, disconnectStripe, stripeStatus } from "@/lib/stripe";
import { SITE } from "@/lib/config";
import { json, error } from "@/lib/http";

async function guard() {
  const u = await getCurrentUser();
  return u && isAdmin(u) ? u : null;
}

export async function GET() {
  if (!(await guard())) return error("Accès refusé", 403);
  return json(await stripeStatus());
}

export async function POST(req: Request) {
  if (!(await guard())) return error("Accès refusé", 403);
  if (process.env.STRIPE_SECRET_KEY) return error("Stripe est déjà configuré par variable d'environnement (STRIPE_SECRET_KEY). Retirez-la pour gérer Stripe depuis cette page.", 409);
  const body = await req.json().catch(() => ({}));
  const origin = req.headers.get("origin") || SITE.url;
  try {
    const r = await connectStripe(String(body.secretKey || ""), origin);
    return json({ ok: true, ...r, status: await stripeStatus() });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Connexion impossible");
  }
}

export async function DELETE() {
  if (!(await guard())) return error("Accès refusé", 403);
  await disconnectStripe();
  return json({ ok: true });
}
