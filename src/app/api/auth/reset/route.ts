import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { json, error } from "@/lib/http";

export async function POST(req: Request) {
  const { token, password } = await req.json().catch(() => ({}));
  if (!token || String(password || "").length < 8) return error("Le mot de passe doit contenir au moins 8 caractères.");
  const hash = crypto.createHash("sha256").update(String(token)).digest("hex");
  const row = await prisma.passwordReset.findUnique({ where: { tokenHash: hash } });
  if (!row || row.used || row.expiresAt < new Date()) return error("Ce lien est invalide ou a expiré. Refaites une demande.", 400);
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash: await bcrypt.hash(String(password), 10) } }),
    prisma.passwordReset.updateMany({ where: { userId: row.userId }, data: { used: true } }),
  ]);
  await createSession(row.userId);
  return json({ ok: true });
}
