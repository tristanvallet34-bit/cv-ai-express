import { getCurrentUser } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { paypalCheckout, PaypalError } from "@/lib/paypal";
import { SITE } from "@/lib/config";
import { json, error } from "@/lib/http";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return error("Connectez-vous pour souscrire.", 401, { login: true });
  const body = await req.json().catch(() => ({}));
  const plan = getPlan(body.plan);
  if (!plan) return error("Offre inconnue");
  if (body.consent !== true) return error("Veuillez accepter les CGV et l'accès immédiat au service.", 400, { consent: true });
  if (plan.mode === "subscription" && user.subscriptionStatus === "active") return error("Vous avez déjà un abonnement actif. Gérez-le depuis votre espace.", 409);
  try {
    const url = await paypalCheckout(user, plan, req.headers.get("origin") || SITE.url);
    return json({ url });
  } catch (e) {
    return error(e instanceof PaypalError ? e.message : "PayPal est momentanément indisponible.", e instanceof PaypalError && e.status === 503 ? 503 : 502);
  }
}
