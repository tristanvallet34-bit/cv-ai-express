import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQ — Questions fréquentes" };

const FAQ: [string, [string, string][]][] = [
  ["Général", [
    ["CV Express est-il gratuit ?", "Oui, vous pouvez créer un CV, utiliser 4 modèles et l'assistant IA (5 fois par jour) gratuitement, puis télécharger votre CV en PDF avec une petite mention en bas de page. Premium débloque tout le reste."],
    ["Dois-je créer un compte ?", "Vous pouvez commencer sans compte : votre brouillon est conservé sur votre appareil. Un compte gratuit est nécessaire pour télécharger, sauvegarder dans le cloud et utiliser l'IA."],
    ["Sur quels appareils puis-je l'utiliser ?", "Sur ordinateur, tablette et mobile, depuis n'importe quel navigateur récent."],
  ]],
  ["Téléchargement", [
    ["Comment télécharger mon CV en PDF ?", "Cliquez sur « Télécharger PDF » puis choisissez « Enregistrer au format PDF » dans la fenêtre d'impression. Pensez à décocher « En-têtes et pieds de page » dans les options si votre navigateur les affiche."],
    ["Le PDF est-il lisible par les ATS ?", "Oui : le PDF contient du texte réel et sélectionnable, dans un ordre de lecture logique."],
    ["Mon CV fait deux pages, comment le réduire ?", "Dans l'onglet « Modèle & design », réduisez la taille du texte ou l'espacement. L'indicateur rouge dans l'aperçu montre où tombe le saut de page."],
  ]],
  ["Abonnement", [
    ["Comment résilier ?", "Depuis « Mon espace » → « Compte & abonnement » → « Gérer / résilier mon abonnement ». C'est immédiat, sans justification. Vous gardez Premium jusqu'à la fin de la période payée."],
    ["Puis-je changer d'offre ?", "Oui, depuis le portail de gestion de l'abonnement."],
    ["Que se passe-t-il à la fin de mon Pass 7 jours ?", "Votre compte repasse simplement en version gratuite. Aucun prélèvement automatique."],
  ]],
  ["Données", [
    ["Mes données sont-elles en sécurité ?", "Les connexions sont chiffrées (HTTPS), les mots de passe sont hachés et vos données ne sont jamais revendues."],
    ["Comment supprimer mon compte ?", "Depuis « Mon espace » → « Compte & abonnement » → « Supprimer mon compte ». Toutes vos données sont effacées."],
  ]],
];

export default function Page() {
  return (
    <>
      <div className="page-head"><div className="container"><h1>Questions fréquentes</h1><p>Vous ne trouvez pas la réponse ? Écrivez-nous depuis la page Contact.</p></div></div>
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container narrow faq">
          {FAQ.map(([cat, qs]) => (
            <div key={cat} style={{ marginBottom: 30 }}>
              <h2 style={{ fontSize: "1.3rem" }}>{cat}</h2>
              {qs.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
