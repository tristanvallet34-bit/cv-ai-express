import { prisma } from "@/lib/db";
import { getCurrentUser, isPremium } from "@/lib/auth";
import { json, error } from "@/lib/http";

const MAX_SIZE = 1_500_000;

async function own(id: string) {
  const user = await getCurrentUser();
  if (!user) return { user: null, resume: null };
  const resume = await prisma.resume.findFirst({ where: { id, userId: user.id } });
  return { user, resume };
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user, resume } = await own(id);
  if (!user) return error("Non connecté", 401);
  if (!resume) return error("CV introuvable", 404);
  return json({ resume: { ...resume, data: JSON.parse(resume.data) } });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user, resume } = await own(id);
  if (!user) return error("Non connecté", 401);
  if (!resume) return error("CV introuvable", 404);
  const body = await req.json().catch(() => ({}));
  const update: { title?: string; data?: string; template?: string; isPublic?: boolean; publicSlug?: string } = {};
  if (body.title !== undefined) update.title = String(body.title).slice(0, 120);
  if (body.data !== undefined) {
    const data = JSON.stringify(body.data);
    if (data.length > MAX_SIZE) return error("CV trop volumineux (photo trop lourde ?).", 413);
    update.data = data;
    update.template = String(body.data?.settings?.template || resume.template);
  }
  if (body.isPublic !== undefined) {
    if (body.isPublic && !isPremium(user)) return error("Le partage en ligne est réservé aux membres Premium.", 402, { upgrade: true });
    update.isPublic = !!body.isPublic;
    if (body.isPublic && !resume.publicSlug) update.publicSlug = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  }
  const saved = await prisma.resume.update({ where: { id }, data: update });
  return json({ resume: { ...saved, data: JSON.parse(saved.data) } });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { user, resume } = await own(id);
  if (!user) return error("Non connecté", 401);
  if (!resume) return error("CV introuvable", 404);
  await prisma.resume.delete({ where: { id } });
  return json({ ok: true });
}
