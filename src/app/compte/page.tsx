import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, toPublicUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { aiRemaining } from "@/lib/quota";
import { normalizeCV } from "@/lib/cv/utils";
import { normalizeLetter } from "@/lib/letter/types";
import Dashboard from "./Dashboard";

export const metadata: Metadata = { title: "Mon espace", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ComptePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion?next=/compte");
  const sp = await searchParams;
  const [resumes, letters, ai] = await Promise.all([
    prisma.resume.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    prisma.letter.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    aiRemaining(user),
  ]);
  return (
    <Dashboard
      user={toPublicUser(user)}
      ai={ai}
      flash={sp.success ? "success" : sp.canceled ? "canceled" : null}
      demo={!!sp.demo}
      resumes={resumes.map((r) => ({ id: r.id, title: r.title, updatedAt: r.updatedAt.toISOString(), isPublic: r.isPublic, publicSlug: r.publicSlug, views: r.views, data: normalizeCV(JSON.parse(r.data)) }))}
      letters={letters.map((l) => ({ id: l.id, title: l.title, updatedAt: l.updatedAt.toISOString(), data: normalizeLetter(JSON.parse(l.data)) }))}
    />
  );
}
