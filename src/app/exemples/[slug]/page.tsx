import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CVThumb from "@/components/cv/CVThumb";
import { EXAMPLES, exampleCV } from "@/lib/cv/examples";

export function generateStaticParams() {
  return EXAMPLES.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const e = EXAMPLES.find((x) => x.slug === slug);
  if (!e) return {};
  return { title: `Exemple de CV ${e.job}`, description: `${e.intro} Modèle de CV ${e.job} à personnaliser gratuitement.` };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = EXAMPLES.find((x) => x.slug === slug);
  const cv = exampleCV(slug);
  if (!e || !cv) notFound();
  return (
    <section className="section">
      <div className="container hero-grid" style={{ alignItems: "start" }}>
        <div>
          <Link href="/exemples" className="muted">← Tous les exemples</Link>
          <h1 style={{ fontSize: "2.4rem", marginTop: 12 }}>Exemple de CV {e.job}</h1>
          <p className="lead" style={{ fontSize: "1.1rem" }}>{e.intro}</p>
          <h3>Nos conseils pour ce métier</h3>
          <ul>{e.tips.map((t) => <li key={t} style={{ marginBottom: 6 }}>{t}</li>)}</ul>
          <h3>Compétences clés</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
            {cv.skills.map((s) => <span className="badge" key={s.id}>{s.name}</span>)}
          </div>
          <Link href={`/editeur?exemple=${e.slug}`} className="btn btn-primary btn-lg">Utiliser cet exemple →</Link>
          <p className="muted" style={{ fontSize: ".85rem", marginTop: 10 }}>Le CV s&apos;ouvre pré-rempli dans l&apos;éditeur : changez le modèle, les couleurs et le contenu.</p>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <CVThumb data={cv} width={480} />
        </div>
      </div>
    </section>
  );
}
