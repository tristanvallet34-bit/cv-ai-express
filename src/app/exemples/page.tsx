import type { Metadata } from "next";
import Link from "next/link";
import CVThumb from "@/components/cv/CVThumb";
import { EXAMPLES, exampleCV } from "@/lib/cv/examples";

export const metadata: Metadata = {
  title: "Exemples de CV par métier",
  description: "Exemples de CV rédigés pour 10 métiers : développeur, commercial, infirmier, comptable, marketing, étudiant… Inspirez-vous et personnalisez-les en un clic.",
};

export default function Page() {
  return (
    <>
      <div className="page-head">
        <div className="container">
          <span className="eyebrow">Inspiration</span>
          <h1>Exemples de CV par métier</h1>
          <p>Des CV complets, rédigés pour chaque métier. Ouvrez-en un dans l&apos;éditeur et remplacez simplement le contenu par le vôtre.</p>
        </div>
      </div>
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container tpl-grid">
          {EXAMPLES.map((e) => (
            <Link key={e.slug} href={`/exemples/${e.slug}`} className="tpl-card">
              <CVThumb data={exampleCV(e.slug)!} width={260} />
              <div className="tpl-meta"><strong>{e.job}</strong><span className="badge">{e.sector}</span></div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
