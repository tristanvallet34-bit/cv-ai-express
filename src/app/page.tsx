import Link from "next/link";
import CVThumb from "@/components/cv/CVThumb";
import { TEMPLATES } from "@/lib/cv/templates";
import { exampleCV, demoCV } from "@/lib/cv/examples";
import { PLANS, formatPrice } from "@/lib/plans";

const FEATURES = [
  { ico: "🎨", t: "22 modèles professionnels", d: "Moderne, classique, créatif ou optimisé ATS : des designs conçus avec des recruteurs, personnalisables en couleurs et polices." },
  { ico: "✨", t: "Assistant IA intégré", d: "Générez votre profil, reformulez vos missions avec des verbes d'action et obtenez des compétences adaptées à votre métier." },
  { ico: "✉️", t: "Lettre de motivation", d: "L'IA rédige une lettre personnalisée à partir de votre CV et de l'offre, dans un design assorti." },
  { ico: "🎯", t: "Score ATS", d: "Comparez votre CV à une offre d'emploi : score, mots-clés manquants et conseils concrets pour passer les filtres." },
  { ico: "⚡", t: "Aperçu en temps réel", d: "Chaque modification s'affiche instantanément. Indicateur de saut de page pour tenir sur une page." },
  { ico: "📄", t: "PDF haute qualité", d: "Texte vectoriel net, sélectionnable et lisible par les logiciels de recrutement. Export texte et JSON inclus." },
  { ico: "☁️", t: "Sauvegarde automatique", d: "Vos CV et lettres sont enregistrés dans votre espace et accessibles partout." },
  { ico: "🔗", t: "CV en ligne", d: "Partagez votre CV via un lien public élégant, idéal pour LinkedIn ou une signature d'email." },
  { ico: "🎤", t: "Préparation d'entretien", d: "Questions probables pour le poste visé et conseils de réponse personnalisés." },
];

const FAQ = [
  ["Puis-je créer mon CV gratuitement ?", "Oui. Vous pouvez créer un CV complet avec les modèles gratuits et le télécharger en PDF (avec une petite mention en bas de page). L'offre Premium débloque tous les modèles, l'IA illimitée et supprime la mention."],
  ["Mon CV passera-t-il les logiciels ATS ?", "Nos PDF contiennent du vrai texte (pas une image), dans un ordre de lecture logique. Le modèle ATS Pro est spécialement conçu pour une compatibilité maximale, et l'outil d'analyse vous indique les mots-clés manquants."],
  ["Comment résilier mon abonnement ?", "En un clic depuis « Mon espace » → « Gérer mon abonnement ». La résiliation prend effet à la fin de la période payée, sans frais ni justification. Le Pass 7 jours n'est pas un abonnement : il ne se renouvelle pas."],
  ["Mes données sont-elles protégées ?", "Vos données ne sont jamais revendues. Elles servent uniquement à générer vos documents. Vous pouvez supprimer votre compte et toutes vos données à tout moment."],
  ["Puis-je modifier mon CV après l'avoir téléchargé ?", "Bien sûr. Vos documents restent modifiables à volonté dans votre espace, et vous pouvez créer plusieurs versions adaptées à chaque candidature."],
];

export default function Home() {
  const dev = demoCV("horizon");
  const mk = exampleCV("chef-de-projet-marketing")!;
  const featured = ["horizon", "aurora", "capital", "chrono", "eclat", "tokyo", "sauge", "ats-pro"];
  const monthly = PLANS.find((p) => p.id === "monthly")!;
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Nouveau · Assistant IA intégré</span>
            <h1>
              Le CV qui décroche <span className="grad">des entretiens</span>, prêt en 5 minutes
            </h1>
            <p className="lead">Choisissez un modèle, laissez l&apos;IA vous aider à rédiger, et téléchargez un CV professionnel en PDF. Lettre de motivation et analyse ATS incluses.</p>
            <div className="hero-cta">
              <Link href="/editeur" className="btn btn-primary btn-lg">Créer mon CV gratuitement →</Link>
              <Link href="/modeles" className="btn btn-outline btn-lg">Voir les 22 modèles</Link>
            </div>
            <ul className="hero-points">
              <li>Sans carte bancaire</li>
              <li>Compatible ATS</li>
              <li>Export PDF</li>
              <li>100 % en français</li>
            </ul>
          </div>
          <div className="hero-visual" aria-hidden>
            <div className="thumb-b"><CVThumb data={mk} width={300} /></div>
            <div className="thumb-a"><CVThumb data={dev} width={330} /></div>
            <div className="float-chip" style={{ left: 10, bottom: 40 }}>🎯 Score ATS : 92/100</div>
            <div className="float-chip" style={{ right: 0, top: 30 }}>✨ Missions reformulées par l&apos;IA</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Simple et rapide</span>
            <h2>Votre CV en 3 étapes</h2>
          </div>
          <div className="grid grid-3">
            {[
              ["Choisissez un modèle", "Parmi 22 designs professionnels, adaptés à tous les métiers et niveaux d'expérience."],
              ["Remplissez avec l'IA", "Saisissez vos infos : l'assistant rédige votre profil et reformule vos missions."],
              ["Téléchargez et postulez", "Exportez en PDF, générez la lettre assortie et vérifiez votre score ATS."],
            ].map(([t, d], i) => (
              <div className="feature" key={t}>
                <div className="step-num">{i + 1}</div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Modèles</span>
            <h2>Des modèles qui font la différence</h2>
            <p className="muted">Conçus pour être lus en 7 secondes par un recruteur, et parfaitement par les robots.</p>
          </div>
          <div className="tpl-grid">
            {featured.map((id) => {
              const t = TEMPLATES.find((x) => x.id === id)!;
              return (
                <Link key={id} href={`/editeur?modele=${id}`} className="tpl-card">
                  <CVThumb data={{ ...dev, settings: { ...dev.settings, template: id } }} width={260} />
                  <div className="tpl-meta">
                    <strong>{t.name}</strong>
                    {t.free ? <span className="badge badge-green">Gratuit</span> : <span className="badge badge-gold">Premium</span>}
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="center" style={{ marginTop: 36 }}>
            <Link href="/modeles" className="btn btn-outline btn-lg">Voir tous les modèles</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Fonctionnalités</span>
            <h2>Tout ce qu&apos;il faut pour décrocher le poste</h2>
          </div>
          <div className="grid grid-3">
            {FEATURES.map((f) => (
              <div className="feature" key={f.t}>
                <div className="ico">{f.ico}</div>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container narrow center">
          <span className="eyebrow">Tarifs</span>
          <h2>Gratuit pour commencer, Premium pour aller plus loin</h2>
          <p className="muted" style={{ fontSize: "1.1rem" }}>
            Premium dès <strong style={{ color: "var(--ink)" }}>{formatPrice(PLANS.find((p) => p.id === "yearly")!.price / 12).replace(/\s/g, " ")}/mois</strong> avec l&apos;offre annuelle, ou {formatPrice(monthly.price)}/mois sans engagement. Pass 7 jours sans abonnement à {formatPrice(PLANS[0].price)}.
          </p>
          <Link href="/tarifs" className="btn btn-primary btn-lg" style={{ marginTop: 10 }}>Voir les offres</Link>
        </div>
      </section>

      <section className="section">
        <div className="container narrow">
          <div className="section-head"><h2>Questions fréquentes</h2></div>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta-band">
            <h2>Prêt à créer le CV qui vous ressemble ?</h2>
            <p>Gratuit, sans carte bancaire. Votre CV est prêt avant la fin de votre café.</p>
            <Link href="/editeur" className="btn btn-lg" style={{ background: "#fff", color: "var(--brand)", marginTop: 8 }}>Commencer maintenant →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
