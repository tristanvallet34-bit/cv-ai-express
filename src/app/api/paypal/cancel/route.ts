import { getCurrentUser, toPublicUser } from "@/lib/auth";
import { cancelSubscription, PaypalError } from "@/lib/paypal";
import { json, error } from "@/lib/http";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return error("Non connecté", 401);
  if (user.billingProvider !== "paypal") return error("Aucun abonnement PayPal.", 404);
  try {
    const u = await cancelSubscription(user);
    return json({ user: u ? toPublicUser(u) : null });
  } catch (e) {
    return error(e instanceof PaypalError ? e.message : "Résiliation impossible, réessayez.", 502);
  }
}
