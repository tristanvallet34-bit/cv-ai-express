import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LetterEditor from "@/components/editor/LetterEditor";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { emptyLetter, normalizeLetter } from "@/lib/letter/types";
import { normalizeCV, fullName, cvToText } from "@/lib/cv/utils";
import { getTemplate } from "@/lib/cv/templates";

export const metadata: Metadata = { title: "Lettre de motivation", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (sp.id) {
    if (!user) redirect(`/connexion?next=${encodeURIComponent(`/lettre/editeur?id=${sp.id}`)}`);
    const l = await prisma.letter.findFirst({ where: { id: sp.id, userId: user.id } });
    if (!l) redirect("/compte");
    return <LetterEditor initial={normalizeLetter(JSON.parse(l.data))} letterId={l.id} title={l.title} cvs={[]} />;
  }
  // CV de l'utilisateur pour pré-remplir et personnaliser la lettre
  const resumes = user ? await prisma.resume.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 20 }) : [];
  const cvs = resumes.map((r) => {
    const d = normalizeCV(JSON.parse(r.data));
    const t = getTemplate(d.settings.template);
    return {
      id: r.id,
      title: r.title,
      name: fullName(d),
      jobTitle: d.personal.title,
      email: d.personal.email,
      phone: d.personal.phone,
      city: d.personal.city,
      color: d.settings.color || t.color,
      layout: t.layout,
      text: cvToText(d).slice(0, 8000),
    };
  });
  const initial = emptyLetter();
  if (sp.modele) initial.settings.template = sp.modele;
  return <LetterEditor initial={initial} cvs={cvs} preselect={sp.fromCv} />;
}
