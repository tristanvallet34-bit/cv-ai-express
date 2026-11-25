import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { json, error } from "@/lib/http";

async function own(id: string) {
  const user = await getCurrentUser();
  if (!user) return { user: null, letter: null };
  const letter = await prisma.letter.findFirst({ where: { id, userId: user.id } });
  return { user, letter };
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user, letter } = await own(id);
  if (!user) return error("Non connecté", 401);
  if (!letter) return error("Lettre introuvable", 404);
  return json({ letter: { ...letter, data: JSON.parse(letter.data) } });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user, letter } = await own(id);
  if (!user) return error("Non connecté", 401);
  if (!letter) return error("Lettre introuvable", 404);
  const body = await req.json().catch(() => ({}));
  const data = JSON.stringify(body.data ?? {});
  if (data.length > 200_000) return error("Lettre trop volumineuse", 413);
  const saved = await prisma.letter.update({
    where: { id },
    data: { title: String(body.title || letter.title).slice(0, 120), data, template: String(body.data?.settings?.template || letter.template) },
  });
  return json({ letter: { ...saved, data: JSON.parse(saved.data) } });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user, letter } = await own(id);
  if (!user) return error("Non connecté", 401);
  if (!letter) return error("Lettre introuvable", 404);
  await prisma.letter.delete({ where: { id } });
  return json({ ok: true });
}
