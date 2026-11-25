import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES } from "@/lib/articles";

export const metadata: Metadata = { title: "Conseils CV, lettre et entretien", description: "Guides pratiques pour réussir votre CV, votre lettre de motivation et vos entretiens d'embauche." };

export default function Page() {
  return (
    <>
      <div className="page-head">
        <div className="container">
          <span className="eyebrow">Conseils carrière</span>
          <h1>Le guide de la candidature réussie</h1>
          <p>Des conseils concrets, issus des pratiques de recrutement, pour chaque étape de votre recherche d&apos;emploi.</p>
        </div>
      </div>
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container grid grid-3">
          {ARTICLES.map((a) => (
            <Link key={a.slug} href={`/conseils/${a.slug}`} className="card" style={{ color: "inherit", textDecoration: "none" }}>
              <span className="badge">{a.category}</span>
              <h3 style={{ marginTop: 12 }}>{a.title}</h3>
              <p className="muted">{a.excerpt}</p>
              <span className="muted" style={{ fontSize: ".85rem" }}>{a.minutes} min de lecture →</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
