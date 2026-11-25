import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, toPublicUser } from "@/lib/auth";
import { json, error, rateLimit, clientIp } from "@/lib/http";

export async function POST(req: Request) {
  if (!rateLimit(`login:${clientIp(req)}`, 20, 15 * 60 * 1000)) return error("Trop de tentatives, réessayez dans quelques minutes.", 429);
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return error("Email ou mot de passe incorrect.", 401);
  await createSession(user.id);
  return json({ user: toPublicUser(user) });
}
