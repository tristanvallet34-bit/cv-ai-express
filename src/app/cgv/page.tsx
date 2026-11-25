import type { Metadata } from "next";
import { SITE } from "@/lib/config";
import { PLANS, formatPrice } from "@/lib/plans";

export const metadata: Metadata = { title: "Conditions générales de vente et d'utilisation" };

export default function Page() {
  return (
    <section className="section">
      <div className="prose">
        <h1>Conditions générales de vente et d&apos;utilisation</h1>
        <p className="muted">Dernière mise à jour : novembre 2026</p>
        <h2>1. Objet</h2>
        <p>Les présentes conditions régissent l&apos;utilisation du service {SITE.name}, édité par {SITE.legal.company}, permettant de créer des CV, des lettres de motivation et d&apos;utiliser des outils d&apos;aide à la candidature, en version gratuite ou payante (« Premium »).</p>
        <h2>2. Compte</h2>
        <p>La création d&apos;un compte est gratuite. L&apos;utilisateur s&apos;engage à fournir une adresse email valide et à garder son mot de passe confidentiel. Il peut supprimer son compte à tout moment depuis son espace.</p>
        <h2>3. Offres et prix</h2>
        <p>Les offres disponibles sont les suivantes (prix TTC) :</p>
        <ul>
          {PLANS.map((p) => (
            <li key={p.id}><strong>{p.name}</strong> : {formatPrice(p.price)} {p.label}{p.mode === "subscription" ? ", abonnement à renouvellement automatique" : ", paiement unique sans renouvellement"}.</li>
          ))}
        </ul>
        <p>Le détail des fonctionnalités incluses figure sur la page Tarifs. Les prix peuvent évoluer ; tout changement de prix d&apos;un abonnement en cours est notifié au moins 30 jours à l&apos;avance et l&apos;utilisateur peut résilier avant son entrée en vigueur.</p>
        <h2>4. Paiement</h2>
        <p>Le paiement est effectué par carte bancaire ou portefeuille électronique via notre prestataire Stripe. {SITE.name} n&apos;a jamais accès à vos données bancaires complètes. Les abonnements sont prélevés au début de chaque période.</p>
        <h2>5. Durée, renouvellement et résiliation</h2>
        <p>Les abonnements sont conclus pour la période choisie (1 mois, 3 mois ou 1 an) et renouvelés tacitement pour une durée identique. L&apos;utilisateur peut résilier à tout moment, en quelques clics, depuis « Mon espace » → « Gérer mon abonnement ». La résiliation prend effet à la fin de la période en cours ; aucun remboursement au prorata n&apos;est effectué pour la période entamée. Le Pass 7 jours n&apos;est pas un abonnement et prend fin automatiquement.</p>
        <h2>6. Droit de rétractation</h2>
        <p>Conformément à l&apos;article L221-28 13° du Code de la consommation, l&apos;utilisateur qui demande l&apos;accès immédiat au contenu numérique Premium et renonce expressément à son droit de rétractation lors du paiement ne peut plus exercer ce droit. En cas de difficulté, contactez-nous à {SITE.supportEmail} : nous étudions chaque demande avec bienveillance.</p>
        <h2>7. Utilisation de l&apos;intelligence artificielle</h2>
        <p>Les contenus proposés par l&apos;assistant IA sont des suggestions. L&apos;utilisateur reste responsable du contenu final de ses documents et doit vérifier l&apos;exactitude des informations. Un usage raisonnable s&apos;applique (limite quotidienne indiquée sur la page Tarifs).</p>
        <h2>8. Responsabilité</h2>
        <p>{SITE.name} met tout en œuvre pour assurer la disponibilité du service mais ne garantit pas l&apos;obtention d&apos;un emploi ou d&apos;un entretien. Il est conseillé de conserver une copie (PDF, export JSON) de ses documents.</p>
        <h2>9. Médiation et droit applicable</h2>
        <p>Les présentes conditions sont soumises au droit français. En cas de litige, l&apos;utilisateur consommateur peut recourir gratuitement au médiateur de la consommation : [Nom et coordonnées du médiateur à compléter]. Plateforme européenne de règlement des litiges : https://ec.europa.eu/consumers/odr.</p>
        <h2>10. Contact</h2>
        <p>{SITE.supportEmail}</p>
      </div>
    </section>
  );
}
