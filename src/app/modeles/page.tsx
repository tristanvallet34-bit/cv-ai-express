import type { Metadata } from "next";
import TemplatesGallery from "./TemplatesGallery";

export const metadata: Metadata = {
  title: "Modèles de CV gratuits et premium",
  description: "30 modèles de CV professionnels : moderne, classique, créatif, minimaliste et ATS. Personnalisez couleurs et polices, exportez en PDF.",
};

export default function ModelesPage() {
  return (
    <>
      <div className="page-head">
        <div className="container">
          <span className="eyebrow">30 modèles</span>
          <h1>Modèles de CV</h1>
          <p>Tous les modèles sont personnalisables (couleurs, polices, sections) et changeables à tout moment sans ressaisir vos informations.</p>
        </div>
      </div>
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <TemplatesGallery />
        </div>
      </section>
    </>
  );
}
