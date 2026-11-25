import { prisma } from "@/lib/db";
import { getCurrentUser, isPremium } from "@/lib/auth";
import { FREE_LIMITS } from "@/lib/plans";
import { json, error } from "@/lib/http";

const MAX_SIZE = 1_500_000; // ~1,5 Mo (photo incluse)

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return error("Non connecté", 401);
  const letters = await prisma.letter.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  return json({ letters: letters.map((r) => ({ ...r, data: JSON.parse(r.data) })) });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return error("Connectez-vous pour sauvegarder votre lettre.", 401);
  const body = await req.json().catch(() => ({}));
  const data = JSON.stringify(body.data ?? {});
  if (data.length > MAX_SIZE) return error("Lettre trop volumineuse.", 413);
  if (!isPremium(user)) {
    const count = await prisma.letter.count({ where: { userId: user.id } });
    if (count >= FREE_LIMITS.letters) return error("La version gratuite permet 1 lettre. Passez Premium pour des lettres illimitées.", 402, { upgrade: true });
  }
  const letter = await prisma.letter.create({
    data: { userId: user.id, title: String(body.title || "Lettre de motivation").slice(0, 120), template: String(body.data?.settings?.template || "moderne"), data },
  });
  return json({ letter: { ...letter, data: body.data } });
}
