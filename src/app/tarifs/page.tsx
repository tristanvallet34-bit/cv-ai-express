import type { Metadata } from "next";
import Pricing from "./Pricing";

export const metadata: Metadata = {
  title: "Tarifs — Premium dès 4,99 €/mois",
  description: "CV Express gratuit ou Premium : tous les modèles, IA illimitée, PDF sans filigrane, lettres de motivation et analyse ATS. Résiliable en 1 clic.",
};

const ROWS: [string, string, string][] = [
  ["Création et édition de CV", "✓", "✓"],
  ["Modèles de CV", "4 modèles", "22 modèles"],
  ["Modèles de lettres", "2 modèles", "6 modèles"],
  ["Téléchargement PDF", "Avec mention", "Sans mention, illimité"],
  ["CV sauvegardés", "1", "Illimité"],
  ["Lettres sauvegardées", "1", "Illimité"],
  ["Assistant IA", "5 / jour", "Illimité*"],
  ["Analyse ATS de base", "✓", "✓"],
  ["Analyse ATS approfondie face à une offre", "—", "✓"],
  ["Préparation d'entretien IA", "—", "✓"],
  ["CV en ligne (lien public)", "—", "✓"],
  ["Export texte & JSON", "✓", "✓"],
];

export default function TarifsPage() {
  return (
    <>
      <div className="page-head">
        <div className="container">
          <span className="eyebrow">Tarifs</span>
          <h1>Investissez dans votre prochain emploi</h1>
          <p>Commencez gratuitement. Passez Premium quand vous êtes prêt : sans engagement, résiliable en 1 clic.</p>
        </div>
      </div>
      <section className="section" style={{ paddingTop: 50 }}>
        <div className="container">
          <Pricing />
          <p className="center muted" style={{ fontSize: ".85rem", marginTop: 20 }}>
            Prix TTC. Paiement sécurisé par Stripe (CB, Apple Pay, Google Pay). Les abonnements se renouvellent automatiquement jusqu&apos;à résiliation, possible à tout moment depuis votre espace.
          </p>
        </div>
      </section>
      <section className="section section-soft">
        <div className="container narrow">
          <h2 className="center">Gratuit vs Premium</h2>
          <div style={{ overflowX: "auto", marginTop: 30 }}>
            <table className="compare">
              <thead>
                <tr><th>Fonctionnalité</th><th>Gratuit</th><th>Premium</th></tr>
              </thead>
              <tbody>
                {ROWS.map(([f, a, b]) => (
                  <tr key={f}><td>{f}</td><td>{a}</td><td style={{ fontWeight: 600, color: "var(--ink)" }}>{b}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ fontSize: ".8rem", marginTop: 10 }}>* Usage raisonnable : 200 générations par jour.</p>
        </div>
      </section>
      <section className="section">
        <div className="container narrow faq">
          <h2 className="center" style={{ marginBottom: 30 }}>Questions sur la facturation</h2>
          {[
            ["Puis-je résilier à tout moment ?", "Oui. Depuis « Mon espace », cliquez sur « Gérer mon abonnement » puis « Annuler ». Vous gardez l'accès Premium jusqu'à la fin de la période déjà payée, sans aucun frais."],
            ["Le Pass 7 jours se renouvelle-t-il ?", "Non. C'est un paiement unique : l'accès Premium s'arrête automatiquement au bout de 7 jours. Aucun prélèvement ne suit."],
            ["Que deviennent mes CV si j'arrête Premium ?", "Ils restent dans votre espace et modifiables. Vous pourrez les télécharger avec les modèles gratuits."],
            ["Puis-je obtenir une facture ?", "Oui, toutes vos factures sont disponibles dans le portail de gestion de l'abonnement et envoyées par email."],
            ["Quels moyens de paiement acceptez-vous ?", "Cartes bancaires (CB, Visa, Mastercard, American Express), Apple Pay et Google Pay, via Stripe. Nous ne stockons jamais vos données bancaires."],
          ].map(([q, a]) => (
            <details key={q}><summary>{q}</summary><p>{a}</p></details>
          ))}
        </div>
      </section>
    </>
  );
}
