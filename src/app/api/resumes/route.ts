import { prisma } from "@/lib/db";
import { getCurrentUser, isPremium } from "@/lib/auth";
import { FREE_LIMITS } from "@/lib/plans";
import { json, error } from "@/lib/http";

const MAX_SIZE = 1_500_000; // ~1,5 Mo (photo incluse)

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return error("Non connecté", 401);
  const resumes = await prisma.resume.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  return json({ resumes: resumes.map((r) => ({ ...r, data: JSON.parse(r.data) })) });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return error("Connectez-vous pour sauvegarder votre CV.", 401);
  const body = await req.json().catch(() => ({}));
  const data = JSON.stringify(body.data ?? {});
  if (data.length > MAX_SIZE) return error("CV trop volumineux (photo trop lourde ?).", 413);
  if (!isPremium(user)) {
    const count = await prisma.resume.count({ where: { userId: user.id } });
    if (count >= FREE_LIMITS.resumes) return error("La version gratuite permet 1 CV. Passez Premium pour des CV illimités.", 402, { upgrade: true });
  }
  const resume = await prisma.resume.create({
    data: { userId: user.id, title: String(body.title || "Mon CV").slice(0, 120), template: String(body.data?.settings?.template || "horizon"), data },
  });
  return json({ resume: { ...resume, data: body.data } });
}
