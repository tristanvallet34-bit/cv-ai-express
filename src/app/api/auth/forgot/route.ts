import crypto from "crypto";
import { prisma } from "@/lib/db";
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
    if (!sent && process.env.NODE_ENV !== "production") console.log(`[dev] lien de réinitialisation : ${url}`);
  }
  // Réponse identique que le compte existe ou non (évite de révéler les emails inscrits)
  return json({ ok: true });
}
