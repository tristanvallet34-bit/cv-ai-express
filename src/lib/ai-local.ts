// Générateur de secours sans IA externe : utilisé quand ANTHROPIC_API_KEY n'est pas configurée
// ou si l'API est indisponible. Résultats volontairement simples mais utiles.

const VERBS = ["Piloté", "Développé", "Optimisé", "Coordonné", "Conçu", "Mis en place", "Assuré", "Accompagné", "Analysé", "Géré"];

function cap(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function improveText(text: string, kind: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (kind === "summary") {
    return cap(clean.replace(/^je suis /i, "").replace(/\.$/, "")) + ". Reconnu(e) pour ma rigueur, mon sens de l'organisation et ma capacité à obtenir des résultats concrets.";
  }
  const parts = text
    .split(/\n|;|\.\s/)
    .map((s) => s.replace(/^[-•*]\s*/, "").trim())
    .filter((s) => s.length > 3);
  return parts
    .map((p, i) => {
      const starts = VERBS.some((v) => p.toLowerCase().startsWith(v.toLowerCase()));
      return `- ${starts ? cap(p) : `${VERBS[i % VERBS.length]} : ${p}`}`.replace(/\.$/, "");
    })
    .join("\n");
}

export function summary(cv: { title: string; skills: string }) {
  const skills = cv.skills.split(",").slice(0, 3).join(", ");
  return `${cap(cv.title || "Professionnel(le)")} motivé(e) et orienté(e) résultats${skills ? `, à l'aise avec ${skills}` : ""}. J'aime relever de nouveaux défis, travailler en équipe et apporter une réelle valeur ajoutée à mon employeur.`;
}

const BANK: Record<string, string[]> = {
  dev: ["Développement de nouvelles fonctionnalités front-end et back-end", "Revue de code et mise en place de tests automatisés", "Optimisation des performances de l'application", "Collaboration avec les équipes produit et design en méthode agile"],
  vente: ["Prospection et développement d'un portefeuille clients", "Négociation commerciale et suivi des contrats", "Atteinte des objectifs de chiffre d'affaires", "Fidélisation et suivi de la satisfaction client"],
  default: ["Prise en charge des missions quotidiennes du poste avec rigueur", "Collaboration avec les équipes internes et les partenaires", "Amélioration des processus et de l'organisation", "Suivi des indicateurs et reporting à la hiérarchie"],
};

export function bullets(role: string) {
  const r = role.toLowerCase();
  const key = /dév|dev|ingénieur logiciel|program/.test(r) ? "dev" : /commerc|vente|business|account/.test(r) ? "vente" : "default";
  return BANK[key].map((b) => `- ${b}`).join("\n");
}

export function skills(title: string) {
  const r = title.toLowerCase();
  if (/dév|dev|web|logiciel/.test(r)) return ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "Git", "Tests automatisés", "API REST", "Travail en équipe", "Résolution de problèmes"];
  if (/commerc|vente|business/.test(r)) return ["Prospection", "Négociation", "CRM", "Closing", "Relation client", "Persévérance", "Écoute active", "Reporting"];
  if (/infirm|soin|santé|aide/.test(r)) return ["Soins techniques", "Hygiène et asepsie", "Relation patient", "Travail en équipe", "Gestion du stress", "Transmissions"];
  if (/compta|finance|gestion/.test(r)) return ["Comptabilité générale", "Excel avancé", "Clôtures", "Fiscalité", "Rigueur", "Analyse financière"];
  if (/market|communic/.test(r)) return ["Stratégie digitale", "SEO / SEA", "Réseaux sociaux", "Google Analytics", "Gestion de projet", "Créativité"];
  return ["Organisation", "Communication", "Travail en équipe", "Autonomie", "Pack Office", "Adaptabilité", "Rigueur", "Gestion des priorités"];
}

export function letter(i: { name: string; role: string; company: string; tone: string }) {
  const company = i.company || "votre entreprise";
  const role = i.role || "le poste proposé";
  return `C'est avec un vif intérêt que je vous adresse ma candidature pour le poste de ${role} au sein de ${company}. Votre réputation et les valeurs que vous portez correspondent pleinement à ce que je recherche pour la suite de mon parcours.

Au cours de mes expériences, j'ai développé des compétences solides et une capacité à m'adapter rapidement à de nouveaux environnements. Rigoureux(se) et impliqué(e), j'ai à cœur de livrer un travail de qualité et de contribuer concrètement aux objectifs de l'équipe.

Rejoindre ${company} serait pour moi l'occasion de mettre ces atouts au service de vos projets, tout en continuant à progresser à vos côtés. Je suis convaincu(e) que mon profil saura répondre à vos attentes.

Je serais ravi(e) de vous exposer plus en détail ma motivation lors d'un entretien, à la date qui vous conviendra.`;
}

const STOP = new Set("les des une pour avec dans par sur aux est sont vous nous votre notre leur leurs plus que qui quoi dont ainsi entre être avoir fait faire mais très tout tous toute toutes cette ceux celle elles ils elle lui son ses sous chez afin comme sans être poste profil candidat missions mission vos nos the and for with you are our will your from this that have".split(" "));

function words(t: string) {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .match(/[a-z0-9+#.]{3,}/g) || [];
}

export function analyze(cvText: string, offer: string) {
  const cv = cvText.toLowerCase();
  const strengths: string[] = [];
  const improvements: string[] = [];
  let score = 40;
  const w = words(cvText);
  const hasEmail = /@/.test(cvText);
  const hasPhone = /(\+33|0)[1-9](\s?\d{2}){4}/.test(cvText);
  const numbers = (cvText.match(/\d+\s?(%|k€|m€|€|clients|personnes|ans)/gi) || []).length;
  const bulletsCount = (cvText.match(/^\s*[-•*]/gm) || []).length;

  if (hasEmail && hasPhone) { score += 8; strengths.push("Coordonnées complètes (email et téléphone)."); } else improvements.push("Ajoutez un email et un numéro de téléphone bien visibles en haut du CV.");
  if (w.length > 180 && w.length < 900) { score += 10; strengths.push("Longueur adaptée à une lecture rapide."); } else if (w.length <= 180) improvements.push("Votre CV est trop court : détaillez vos missions et réalisations."); else improvements.push("Votre CV est long : visez une page (deux maximum au-delà de 10 ans d'expérience).");
  if (numbers >= 3) { score += 12; strengths.push("Résultats chiffrés : excellent pour convaincre."); } else improvements.push("Chiffrez vos réalisations (%, CA, nombre de clients, délais…).");
  if (bulletsCount >= 4) { score += 6; strengths.push("Missions structurées en puces, faciles à scanner."); } else improvements.push("Présentez vos missions sous forme de puces commençant par un verbe d'action.");
  if (/profil|résumé|summary|à propos/i.test(cv)) { score += 5; } else improvements.push("Ajoutez un court profil (3 phrases) en haut du CV.");
  if (/compétences|skills/i.test(cv)) score += 5; else improvements.push("Ajoutez une section Compétences avec des mots-clés du métier.");
  if (/langues|anglais|english/i.test(cv)) score += 4; else improvements.push("Précisez votre niveau en langues (ex. Anglais B2).");

  let missingKeywords: string[] = [];
  if (offer.trim()) {
    const freq = new Map<string, number>();
    for (const x of words(offer)) if (!STOP.has(x) && !/^\d+$/.test(x)) freq.set(x, (freq.get(x) || 0) + 1);
    const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k]) => k);
    const cvSet = new Set(w);
    const present = top.filter((k) => cvSet.has(k));
    missingKeywords = top.filter((k) => !cvSet.has(k)).slice(0, 12);
    const ratio = top.length ? present.length / top.length : 0;
    score = Math.round(score * 0.6 + ratio * 100 * 0.4);
    if (ratio > 0.5) strengths.push(`Bonne correspondance avec l'offre (${present.length}/${top.length} mots-clés).`);
    else improvements.push("Reprenez davantage le vocabulaire exact de l'offre d'emploi (les ATS filtrent par mots-clés).");
  }
  score = Math.max(5, Math.min(97, score));
  const verdict = score >= 80 ? "Très bon CV, prêt à être envoyé." : score >= 60 ? "Bon CV, quelques ajustements le rendront plus percutant." : "Votre CV peut être nettement amélioré avant d'être envoyé.";
  return { score, verdict, strengths, improvements, missingKeywords };
}

export function interview(role: string) {
  const r = role || "ce poste";
  return [
    { question: "Présentez-vous en quelques minutes.", why: "Votre capacité de synthèse et le lien entre votre parcours et le poste.", tips: "Structurez : parcours → réalisation clé → pourquoi ce poste aujourd'hui. 2 minutes maximum." },
    { question: `Pourquoi souhaitez-vous devenir ${r} chez nous ?`, why: "Votre motivation et votre connaissance de l'entreprise.", tips: "Citez un élément précis de l'entreprise (projet, valeur, actualité) et reliez-le à vos objectifs." },
    { question: "Quelle est votre plus grande réussite professionnelle ?", why: "Votre impact concret.", tips: "Méthode STAR : Situation, Tâche, Action, Résultat (chiffré si possible)." },
    { question: "Parlez-moi d'une difficulté que vous avez surmontée.", why: "Votre gestion des problèmes et votre résilience.", tips: "Choisissez un vrai problème, insistez sur vos actions et ce que vous en avez appris." },
    { question: "Quels sont vos points faibles ?", why: "Votre lucidité et votre capacité à progresser.", tips: "Un vrai point d'amélioration, non rédhibitoire, avec ce que vous faites pour progresser." },
    { question: "Comment travaillez-vous en équipe ?", why: "Votre intégration dans l'équipe existante.", tips: "Donnez un exemple concret de collaboration réussie et votre rôle précis." },
    { question: "Où vous voyez-vous dans 3 à 5 ans ?", why: "Votre projection et la stabilité de votre projet.", tips: "Montrez une ambition cohérente avec l'évolution possible dans l'entreprise." },
    { question: "Quelles sont vos prétentions salariales ?", why: "L'alignement avec le budget du poste.", tips: "Renseignez-vous sur les grilles du marché et donnez une fourchette argumentée." },
    { question: "Pourquoi devrions-nous vous choisir ?", why: "Votre valeur ajoutée par rapport aux autres candidats.", tips: "Résumez 3 atouts directement liés aux besoins de l'offre." },
    { question: "Avez-vous des questions ?", why: "Votre intérêt réel pour le poste.", tips: "Préparez 2 ou 3 questions : objectifs à 6 mois, organisation de l'équipe, prochaines étapes." },
  ];
}
