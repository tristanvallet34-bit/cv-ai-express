import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Editor from "@/components/editor/Editor";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { emptyCV, normalizeCV } from "@/lib/cv/utils";
import { exampleCV } from "@/lib/cv/examples";
import { getTemplate } from "@/lib/cv/templates";

export const metadata: Metadata = { title: "Éditeur de CV", robots: { index: false } };

export default async function EditorPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  if (sp.id) {
    const user = await getCurrentUser();
    if (!user) redirect(`/connexion?next=${encodeURIComponent(`/editeur?id=${sp.id}`)}`);
    const r = await prisma.resume.findFirst({ where: { id: sp.id, userId: user.id } });
    if (!r) redirect("/compte");
    return <Editor key={r.id} initial={normalizeCV(JSON.parse(r.data))} resumeId={r.id} title={r.title} />;
  }
  if (sp.exemple) {
    const ex = exampleCV(sp.exemple);
    if (ex) {
      if (sp.modele) ex.settings.template = getTemplate(sp.modele).id;
      return <Editor initial={ex} title={`CV ${ex.personal.title}`} fromExample />;
    }
  }
  const cv = emptyCV(sp.modele ? getTemplate(sp.modele).id : "horizon");
  return <Editor initial={cv} fromExample={!!sp.modele || !!sp.nouveau} />;
}
