import type { Metadata } from "next";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function Page() {
  return (
    <section className="section">
      <div className="prose">
        <h1>Politique de confidentialité</h1>
        <p className="muted">Dernière mise à jour : novembre 2026</p>
        <h2>Responsable du traitement</h2>
        <p>{SITE.legal.company}, {SITE.legal.address}. Contact : {SITE.supportEmail}.</p>
        <h2>Données collectées</h2>
        <ul>
          <li>Données de compte : email, prénom, mot de passe (stocké chiffré).</li>
          <li>Contenu de vos documents : informations saisies dans vos CV et lettres.</li>
          <li>Données de facturation : gérées par Stripe (nous ne conservons que l&apos;identifiant client et l&apos;historique des paiements).</li>
          <li>Données techniques : cookie de session strictement nécessaire au fonctionnement du compte.</li>
        </ul>
        <h2>Finalités et bases légales</h2>
        <ul>
          <li>Fournir le service (exécution du contrat).</li>
          <li>Gérer les paiements et la facturation (exécution du contrat, obligations légales).</li>
          <li>Sécuriser le service et prévenir les abus (intérêt légitime).</li>
        </ul>
        <p>Vos données ne sont jamais vendues ni utilisées à des fins publicitaires.</p>
        <h2>Sous-traitants</h2>
        <ul>
          <li>Hébergement : {SITE.legal.host}.</li>
          <li>Paiement : Stripe Payments Europe Ltd.</li>
          <li>Assistant IA : Anthropic (API Claude) — seuls les textes nécessaires à la fonctionnalité demandée sont transmis, au moment où vous l&apos;utilisez.</li>
        </ul>
        <p>Certains sous-traitants peuvent traiter des données hors de l&apos;Union européenne ; ces transferts sont encadrés par les clauses contractuelles types de la Commission européenne.</p>
        <h2>Durée de conservation</h2>
        <p>Vos données sont conservées tant que votre compte est actif. Elles sont supprimées immédiatement lorsque vous supprimez votre compte, à l&apos;exception des pièces comptables conservées 10 ans conformément à la loi. Les comptes inactifs depuis 3 ans sont supprimés après information préalable.</p>
        <h2>Vos droits</h2>
        <p>Vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, de portabilité (export JSON depuis l&apos;éditeur), de limitation et d&apos;opposition. Écrivez-nous à {SITE.supportEmail}. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).</p>
        <h2>Cookies</h2>
        <p>Le site utilise uniquement un cookie technique de session, nécessaire à la connexion, qui ne requiert pas de consentement. Aucun cookie publicitaire ou de mesure d&apos;audience tiers n&apos;est déposé.</p>
      </div>
    </section>
  );
}
