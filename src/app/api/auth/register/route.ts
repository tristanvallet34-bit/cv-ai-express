import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authConfigured, AUTH_MISSING, createSession, toPublicUser } from "@/lib/auth";
import { json, error, rateLimit, clientIp } from "@/lib/http";
import { sendEmail, emails } from "@/lib/email";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(200),
  name: z.string().trim().max(100).optional(),
});

export async function POST(req: Request) {
  if (!authConfigured()) return error(AUTH_MISSING, 503);
  if (!rateLimit(`reg:${clientIp(req)}`, 10, 60 * 60 * 1000)) return error("Trop de tentatives, réessayez plus tard.", 429);
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return error(parsed.error.issues[0].message);
  const { email, password, name } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return error("Un compte existe déjà avec cet email. Connectez-vous.", 409);
  const user = await prisma.user.create({
    data: { email, name: name || email.split("@")[0], passwordHash: await bcrypt.hash(password, 10) },
  });
  await createSession(user.id);
  void sendEmail(user.email, "Bienvenue sur CV Express", emails.welcome(user.name || ""));
  return json({ user: toPublicUser(user) });
}
