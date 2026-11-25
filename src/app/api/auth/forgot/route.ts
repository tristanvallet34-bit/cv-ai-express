import crypto from "crypto";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { sendEmail, emails } from "@/lib/email";
import { SITE } from "@/lib/config";
import { json, rateLimit, clientIp, error } from "@/lib/http";

export async function POST(req: Request) {
  if (!rateLimit(`forgot:${clientIp(req)}`, 5, 15 * 60 * 1000)) return error("Trop de demandes, réessayez plus tard.", 429);
  const { email } = await req.json().catch(() => ({}));
  const user = email ? await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } }) : null;
  if (user) {
    const token = crypto.randomBytes(32).toString("base64url");
    await prisma.passwordReset.create({
      data: { userId: user.id, tokenHash: crypto.createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600_000) },
    });
    const origin = req.headers.get("origin") || SITE.url;
    const url = `${origin}/reinitialiser?token=${token}`;
    const sent = await sendEmail(user.email, "Réinitialisation de votre mot de passe", emails.reset(url));
    // Sans service d'email : en local, ou pour l'administrateur uniquement, le lien est écrit
    // dans les journaux privés de l'hébergeur (jamais pour les comptes clients).
    if (!sent && (process.env.NODE_ENV !== "production" || isAdmin(user))) console.log(`[admin] lien de réinitialisation (valable 1 h) : ${url}`);
  }
  // Réponse identique que le compte existe ou non (évite de révéler les emails inscrits)
  return json({ ok: true });
}
