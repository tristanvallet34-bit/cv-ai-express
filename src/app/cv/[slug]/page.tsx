import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { normalizeCV, fullName } from "@/lib/cv/utils";
import PublicCV from "./PublicCV";

async function load(slug: string) {
  const r = await prisma.resume.findUnique({ where: { publicSlug: slug } });
  return r && r.isPublic ? r : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = await load(slug);
  if (!r) return { title: "CV introuvable" };
  const d = normalizeCV(JSON.parse(r.data));
  return { title: `${fullName(d)} — ${d.personal.title}`, description: d.summary.slice(0, 160), robots: { index: false } };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await load(slug);
  if (!r) notFound();
  await prisma.resume.update({ where: { id: r.id }, data: { views: { increment: 1 } } });
  return (
    <div className="section-soft" style={{ padding: "30px 0 60px" }}>
      <PublicCV data={normalizeCV(JSON.parse(r.data))} />
      <p className="center muted no-print" style={{ fontSize: ".85rem", marginTop: 20 }}>
        CV créé avec <Link href="/">CV Express</Link> · <Link href="/editeur">Créez le vôtre gratuitement</Link>
      </p>
    </div>
  );
}
