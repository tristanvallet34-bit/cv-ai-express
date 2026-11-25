import type { Metadata } from "next";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Mentions légales" };

export default function Page() {
  const l = SITE.legal;
  return (
    <section className="section">
      <div className="prose">
        <h1>Mentions légales</h1>
        <h2>Éditeur du site</h2>
        <p>{l.company} — {l.status}<br />Adresse : {l.address}<br />SIRET : {l.siret}<br />TVA : {l.vat}<br />Contact : {SITE.supportEmail}<br />Directeur de la publication : {l.director}</p>
        <h2>Hébergement</h2>
        <p>{l.host}</p>
        <h2>Propriété intellectuelle</h2>
        <p>L&apos;ensemble des éléments du site {SITE.name} (textes, modèles de CV et de lettres, logos, code) est protégé par le droit de la propriété intellectuelle. Les documents que vous créez vous appartiennent : vous pouvez les utiliser librement pour vos candidatures.</p>
        <h2>Données personnelles</h2>
        <p>Voir notre <a href="/confidentialite">politique de confidentialité</a>.</p>
      </div>
    </section>
  );
}
