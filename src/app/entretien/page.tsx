import type { Metadata } from "next";
import Interview from "./Interview";

export const metadata: Metadata = {
  title: "Préparer son entretien d'embauche avec l'IA",
  description: "Les questions les plus probables pour votre entretien, ce que le recruteur évalue et comment y répondre, personnalisées selon votre CV et l'offre.",
};

export default function Page() {
  return (
    <>
      <div className="page-head">
        <div className="container">
          <span className="eyebrow">🎤 Coach entretien</span>
          <h1>Préparez votre entretien</h1>
          <p>10 questions probables pour votre poste, ce que le recruteur cherche vraiment, et comment construire une réponse convaincante.</p>
        </div>
      </div>
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container narrow"><Interview /></div>
      </section>
    </>
  );
}
