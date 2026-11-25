import { getCurrentUser, isAdmin } from "@/lib/auth";
import { connectPaypal, disconnectPaypal, paypalStatus } from "@/lib/paypal";
import { SITE } from "@/lib/config";
import { json, error } from "@/lib/http";

async function guard() {
  const u = await getCurrentUser();
  return u && isAdmin(u) ? u : null;
}

export async function GET() {
  if (!(await guard())) return error("Accès refusé", 403);
  return json(await paypalStatus());
}

export async function POST(req: Request) {
  if (!(await guard())) return error("Accès refusé", 403);
  if (process.env.PAYPAL_CLIENT_ID) return error("PayPal est déjà configuré par variables d'environnement.", 409);
  const body = await req.json().catch(() => ({}));
  try {
    const r = await connectPaypal({ clientId: String(body.clientId || ""), secret: String(body.secret || ""), mode: String(body.mode || "sandbox") }, req.headers.get("origin") || SITE.url);
    return json({ ok: true, ...r, status: await paypalStatus() });
  } catch (e) {
    return error(e instanceof Error ? e.message : "Connexion impossible");
  }
}

export async function DELETE() {
  if (!(await guard())) return error("Accès refusé", 403);
  await disconnectPaypal();
  return json({ ok: true });
}
