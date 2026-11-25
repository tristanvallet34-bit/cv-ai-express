import type { Metadata } from "next";
import Analyzer from "./Analyzer";

export const metadata: Metadata = {
  title: "Analyse de CV et score ATS",
  description: "Testez votre CV face à une offre d'emploi : score ATS, mots-clés manquants et conseils concrets pour décrocher plus d'entretiens.",
};

export default function Page() {
  return (
    <>
      <div className="page-head">
        <div className="container">
          <span className="eyebrow">🎯 Score ATS</span>
          <h1>Votre CV passe-t-il les filtres ?</h1>
          <p>Beaucoup d&apos;entreprises trient les candidatures avec un logiciel (ATS) avant toute lecture humaine. Obtenez votre score, les mots-clés manquants et un plan d&apos;action.</p>
        </div>
      </div>
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <Analyzer />
        </div>
      </section>
    </>
  );
}
