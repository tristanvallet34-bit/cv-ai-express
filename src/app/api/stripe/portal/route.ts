import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStripe, demoMode, portalConfigId } from "@/lib/stripe";
import { SITE } from "@/lib/config";
import { json, error } from "@/lib/http";

// Portail client Stripe : changer de carte, télécharger les factures, résilier
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return error("Non connecté", 401);
  if (user.billingProvider === "paypal") return error("Votre abonnement est géré par PayPal : utilisez le bouton « Résilier mon abonnement PayPal ».", 409);
  const origin = req.headers.get("origin") || SITE.url;
  const stripe = await getStripe();
  if (!stripe) {
    if ((await demoMode()) && user.subscriptionId?.startsWith("demo_")) {
      await prisma.user.update({ where: { id: user.id }, data: { subscriptionStatus: "canceled", plan: "free", subscriptionId: null } });
      return json({ url: `${origin}/compte?canceled=1` });
    }
    return error("Stripe n'est pas configuré.", 503);
  }
  if (!user.stripeCustomerId) return error("Aucun abonnement trouvé.", 404);
  const configuration = (await portalConfigId()) || undefined;
  const session = await stripe.billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: `${origin}/compte`, configuration });
  return json({ url: session.url });
}
