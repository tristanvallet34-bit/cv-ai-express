import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getCurrentUser, destroySession, toPublicUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { json, error } from "@/lib/http";

// Mise à jour du profil (nom, mot de passe)
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return error("Non connecté", 401);
  const body = await req.json().catch(() => ({}));
  const data: { name?: string; passwordHash?: string } = {};
  if (typeof body.name === "string") data.name = body.name.trim().slice(0, 100);
  if (body.newPassword) {
    if (String(body.newPassword).length < 8) return error("Le nouveau mot de passe doit contenir au moins 8 caractères.");
    if (!(await bcrypt.compare(String(body.currentPassword || ""), user.passwordHash))) return error("Mot de passe actuel incorrect.");
    data.passwordHash = await bcrypt.hash(String(body.newPassword), 10);
  }
  const updated = await prisma.user.update({ where: { id: user.id }, data });
  return json({ user: toPublicUser(updated) });
}

// Suppression définitive du compte (RGPD)
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return error("Non connecté", 401);
  const stripe = await getStripe();
  if (stripe && user.subscriptionId && user.subscriptionStatus !== "canceled") {
    try {
      await stripe.subscriptions.cancel(user.subscriptionId);
    } catch (e) {
      console.error("[account] annulation abonnement", e);
    }
  }
  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  return json({ ok: true });
}
