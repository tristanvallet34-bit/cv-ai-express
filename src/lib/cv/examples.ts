import type { CVData } from "./types";
import { emptyCV } from "./utils";

type Ex = {
  slug: string;
  job: string;
  sector: string;
  template: string;
  intro: string;
  tips: string[];
  data: Partial<CVData>;
};

let n = 0;
const id = () => `ex${++n}`;

export const EXAMPLES: Ex[] = [
  {
    slug: "developpeur-web",
    job: "Développeur web full-stack",
    sector: "Informatique",
    template: "horizon",
    intro: "Un CV de développeur doit montrer des réalisations concrètes, une stack claire et des liens vers vos projets.",
    tips: ["Listez votre stack par catégorie (front, back, outils).", "Ajoutez un lien GitHub ou portfolio.", "Chiffrez l'impact : performance, utilisateurs, délais."],
    data: {
      personal: { firstName: "Lucas", lastName: "Martin", title: "Développeur web full-stack", email: "lucas.martin@email.fr", phone: "06 12 34 56 78", city: "Lyon", website: "lucasmartin.dev", linkedin: "linkedin.com/in/lucasmartin", photo: "", extra: "Télétravail possible" },
      summary: "Développeur full-stack avec 5 ans d'expérience sur React, Node.js et PostgreSQL. J'aime concevoir des produits rapides, accessibles et bien testés, en lien direct avec les équipes produit.",
      experiences: [
        { id: id(), role: "Développeur full-stack senior", company: "Fintech Nova", city: "Lyon", start: "2022-03", end: "", current: true, description: "- Refonte du tableau de bord client en React/TypeScript : temps de chargement divisé par 3\n- Conception d'une API Node.js traitant 2 M de requêtes/jour\n- Mise en place des tests end-to-end et de la CI (couverture 85 %)\n- Encadrement de 2 développeurs juniors" },
        { id: id(), role: "Développeur web", company: "Agence Pixel", city: "Lyon", start: "2019-09", end: "2022-02", current: false, description: "- Développement de 20+ sites et applications pour des PME\n- Intégration de paiements Stripe et d'API tierces\n- Amélioration du SEO technique (+40 % de trafic organique)" },
      ],
      education: [{ id: id(), degree: "Master Informatique — Génie logiciel", school: "Université Lyon 1", city: "Lyon", start: "2017-09", end: "2019-06", description: "" }],
      skills: [
        { id: id(), name: "React / Next.js", level: 5 }, { id: id(), name: "TypeScript", level: 5 }, { id: id(), name: "Node.js", level: 4 },
        { id: id(), name: "PostgreSQL", level: 4 }, { id: id(), name: "Docker / CI", level: 3 }, { id: id(), name: "Tests (Jest, Playwright)", level: 4 },
      ],
      languages: [{ id: id(), name: "Français", level: "Langue maternelle" }, { id: id(), name: "Anglais", level: "Courant (C1)" }],
      projects: [{ id: id(), name: "OpenBudget", description: "Application open source de gestion de budget, 1 200 étoiles GitHub.", link: "github.com/lucas/openbudget" }],
      interests: "Escalade, contributions open source, photographie",
    },
  },
  {
    slug: "commercial",
    job: "Commercial B2B",
    sector: "Vente",
    template: "corail",
    intro: "Pour un poste commercial, les recruteurs veulent des chiffres : CA, objectifs atteints, taille du portefeuille.",
    tips: ["Indiquez vos résultats en % d'objectif.", "Précisez la taille et le type de clients.", "Mettez en avant la négociation et la prospection."],
    data: {
      personal: { firstName: "Sarah", lastName: "Benali", title: "Business Developer B2B", email: "sarah.benali@email.fr", phone: "06 98 76 54 32", city: "Paris", website: "", linkedin: "linkedin.com/in/sarahbenali", photo: "", extra: "Permis B" },
      summary: "Commerciale terrain et grands comptes, 7 ans d'expérience dans la vente de solutions SaaS. Résultats constants au-delà des objectifs et forte capacité à fidéliser.",
      experiences: [
        { id: id(), role: "Key Account Manager", company: "CloudSoft", city: "Paris", start: "2021-01", end: "", current: true, description: "- Portefeuille de 45 grands comptes, 2,4 M€ de CA annuel\n- 128 % de l'objectif en 2024, meilleure performance de l'équipe\n- Négociation de contrats pluriannuels jusqu'à 400 k€" },
        { id: id(), role: "Commerciale sédentaire", company: "Bureau Plus", city: "Nanterre", start: "2017-09", end: "2020-12", current: false, description: "- Prospection téléphonique : 60 appels/jour, 25 nouveaux clients/an\n- Mise en place d'un CRM partagé (HubSpot)" },
      ],
      education: [{ id: id(), degree: "Bachelor Commerce & Négociation", school: "NEOMA Business School", city: "Reims", start: "2014-09", end: "2017-06", description: "" }],
      skills: [{ id: id(), name: "Prospection", level: 5 }, { id: id(), name: "Négociation", level: 5 }, { id: id(), name: "Salesforce / HubSpot", level: 4 }, { id: id(), name: "Closing", level: 5 }, { id: id(), name: "Social selling", level: 4 }],
      languages: [{ id: id(), name: "Français", level: "Natif" }, { id: id(), name: "Anglais", level: "Professionnel" }, { id: id(), name: "Arabe", level: "Courant" }],
      interests: "Course à pied (semi-marathon), théâtre d'improvisation",
    },
  },
  {
    slug: "infirmier",
    job: "Infirmier / Infirmière",
    sector: "Santé",
    template: "sante",
    intro: "Le CV infirmier doit mettre en avant vos services, vos spécialités et vos qualités humaines.",
    tips: ["Précisez les services (urgences, réanimation…).", "Indiquez votre numéro RPPS si demandé.", "Valorisez les gestes techniques et le travail en équipe."],
    data: {
      personal: { firstName: "Camille", lastName: "Dubois", title: "Infirmière diplômée d'État", email: "camille.dubois@email.fr", phone: "07 11 22 33 44", city: "Bordeaux", website: "", linkedin: "", photo: "", extra: "Disponible de jour comme de nuit" },
      summary: "Infirmière DE depuis 6 ans, expérimentée en services de médecine et d'urgences. Rigoureuse, calme sous pression et attentive au confort des patients.",
      experiences: [
        { id: id(), role: "Infirmière aux urgences", company: "CHU de Bordeaux", city: "Bordeaux", start: "2021-04", end: "", current: true, description: "- Accueil et tri de 40 à 60 patients par garde\n- Soins techniques : perfusions, prélèvements, surveillance post-traumatique\n- Tutorat d'étudiants en soins infirmiers" },
        { id: id(), role: "Infirmière en médecine interne", company: "Clinique Saint-Augustin", city: "Bordeaux", start: "2018-07", end: "2021-03", current: false, description: "- Prise en charge de 12 patients par poste\n- Éducation thérapeutique des patients diabétiques" },
      ],
      education: [{ id: id(), degree: "Diplôme d'État d'Infirmier", school: "IFSI de Bordeaux", city: "Bordeaux", start: "2015-09", end: "2018-07", description: "" }],
      skills: [{ id: id(), name: "Soins d'urgence", level: 5 }, { id: id(), name: "Gestion de la douleur", level: 4 }, { id: id(), name: "Dossier patient informatisé", level: 4 }, { id: id(), name: "Relation patient / famille", level: 5 }],
      languages: [{ id: id(), name: "Français", level: "Natif" }, { id: id(), name: "Espagnol", level: "Intermédiaire" }],
      certifications: [{ id: id(), name: "AFGSU niveau 2", issuer: "CESU 33", date: "2024" }],
      interests: "Bénévolat Croix-Rouge, yoga",
    },
  },
  {
    slug: "comptable",
    job: "Comptable",
    sector: "Finance",
    template: "finance",
    intro: "Rigueur et précision : le CV d'un comptable doit être aussi ordonné que ses bilans.",
    tips: ["Citez vos logiciels (Sage, Cegid, SAP).", "Indiquez le nombre de dossiers gérés.", "Mentionnez les clôtures et déclarations prises en charge."],
    data: {
      personal: { firstName: "Thomas", lastName: "Leroy", title: "Comptable général", email: "thomas.leroy@email.fr", phone: "06 55 44 33 22", city: "Lille", website: "", linkedin: "linkedin.com/in/thomasleroy", photo: "", extra: "" },
      summary: "Comptable avec 8 ans d'expérience en cabinet et en entreprise. Maîtrise de la tenue, des clôtures et des déclarations fiscales pour des PME de 2 à 50 M€ de CA.",
      experiences: [
        { id: id(), role: "Comptable général", company: "Groupe Nordis", city: "Lille", start: "2020-02", end: "", current: true, description: "- Clôtures mensuelles et annuelles de 3 filiales\n- Préparation des liasses fiscales et déclarations de TVA\n- Réduction du délai de clôture de 12 à 6 jours" },
        { id: id(), role: "Collaborateur comptable", company: "Cabinet Expertis", city: "Roubaix", start: "2016-09", end: "2020-01", current: false, description: "- Gestion d'un portefeuille de 70 dossiers TPE/PME\n- Révision des comptes et relation client" },
      ],
      education: [{ id: id(), degree: "DCG — Diplôme de Comptabilité et de Gestion", school: "Lycée Gaston Berger", city: "Lille", start: "2013-09", end: "2016-06", description: "" }],
      skills: [{ id: id(), name: "Sage / Cegid", level: 5 }, { id: id(), name: "Excel avancé", level: 5 }, { id: id(), name: "Fiscalité des entreprises", level: 4 }, { id: id(), name: "Consolidation", level: 3 }],
      languages: [{ id: id(), name: "Français", level: "Natif" }, { id: id(), name: "Anglais", level: "B2" }],
      interests: "Échecs, trésorier d'une association sportive",
    },
  },
  {
    slug: "chef-de-projet-marketing",
    job: "Chef de projet marketing",
    sector: "Marketing",
    template: "aurora",
    intro: "Montrez des campagnes, des budgets et des résultats mesurables (leads, conversion, ROI).",
    tips: ["Associez chaque campagne à un KPI.", "Citez vos outils (GA4, Meta Ads, HubSpot).", "Montrez votre capacité à piloter des prestataires."],
    data: {
      personal: { firstName: "Inès", lastName: "Moreau", title: "Chef de projet marketing digital", email: "ines.moreau@email.fr", phone: "06 44 55 66 77", city: "Nantes", website: "inesmoreau.fr", linkedin: "linkedin.com/in/inesmoreau", photo: "", extra: "" },
      summary: "Chef de projet marketing orientée data, 6 ans d'expérience en B2C. Je pilote des campagnes multicanales de la stratégie à l'analyse des résultats.",
      experiences: [
        { id: id(), role: "Chef de projet marketing", company: "MaisonVerte", city: "Nantes", start: "2021-06", end: "", current: true, description: "- Pilotage d'un budget média de 800 k€/an\n- Lancement de 3 gammes produits : +22 % de CA en ligne\n- Automatisation des emails : taux de conversion ×2" },
        { id: id(), role: "Chargée de marketing digital", company: "Voyages Azur", city: "Nantes", start: "2018-09", end: "2021-05", current: false, description: "- Gestion des campagnes Google Ads et Meta (ROAS 6)\n- Refonte de la stratégie de contenu : +65 % de trafic SEO" },
      ],
      education: [{ id: id(), degree: "Master Marketing digital", school: "Audencia", city: "Nantes", start: "2016-09", end: "2018-06", description: "" }],
      skills: [{ id: id(), name: "Stratégie d'acquisition", level: 5 }, { id: id(), name: "Google Ads / Meta Ads", level: 5 }, { id: id(), name: "GA4 / Looker Studio", level: 4 }, { id: id(), name: "CRM & emailing", level: 4 }, { id: id(), name: "Gestion de projet", level: 5 }],
      languages: [{ id: id(), name: "Français", level: "Natif" }, { id: id(), name: "Anglais", level: "C1" }],
      interests: "Voyages, podcasts business, céramique",
    },
  },
  {
    slug: "etudiant-stage",
    job: "Étudiant — recherche de stage",
    sector: "Étudiant",
    template: "campus",
    intro: "Peu d'expérience ? Valorisez vos projets, jobs étudiants, engagements associatifs et compétences.",
    tips: ["Placez la formation en premier.", "Transformez vos jobs d'été en compétences.", "Ajoutez vos projets académiques."],
    data: {
      personal: { firstName: "Hugo", lastName: "Petit", title: "Étudiant en école de commerce — Stage de 6 mois", email: "hugo.petit@email.fr", phone: "06 01 02 03 04", city: "Toulouse", website: "", linkedin: "linkedin.com/in/hugopetit", photo: "", extra: "Disponible à partir de janvier" },
      summary: "Étudiant en 2e année de master, motivé et curieux, je recherche un stage de 6 mois en contrôle de gestion pour mettre en pratique mes compétences analytiques.",
      education: [
        { id: id(), degree: "Master Grande École — Finance", school: "TBS Education", city: "Toulouse", start: "2023-09", end: "2026-06", description: "Cours : contrôle de gestion, analyse financière, data analytics" },
        { id: id(), degree: "Baccalauréat général, mention Très bien", school: "Lycée Pierre de Fermat", city: "Toulouse", start: "2020-09", end: "2023-06", description: "" },
      ],
      experiences: [
        { id: id(), role: "Stagiaire assistant contrôleur de gestion", company: "Airlog", city: "Blagnac", start: "2025-06", end: "2025-08", current: false, description: "- Mise à jour des tableaux de bord mensuels\n- Analyse des écarts budgétaires sur 4 centres de coûts" },
        { id: id(), role: "Équipier polyvalent (job étudiant)", company: "Décathlon", city: "Toulouse", start: "2023-10", end: "2025-05", current: false, description: "- Conseil client et mise en rayon, 15 h/semaine" },
      ],
      skills: [{ id: id(), name: "Excel / VBA", level: 4 }, { id: id(), name: "Power BI", level: 3 }, { id: id(), name: "Analyse financière", level: 3 }, { id: id(), name: "Travail en équipe", level: 5 }],
      languages: [{ id: id(), name: "Français", level: "Natif" }, { id: id(), name: "Anglais", level: "TOEIC 920" }, { id: id(), name: "Allemand", level: "B1" }],
      interests: "Trésorier du BDE, football en club, voyages en Europe",
    },
  },
  {
    slug: "serveur-restauration",
    job: "Serveur / Serveuse",
    sector: "Restauration",
    template: "atelier",
    intro: "En restauration, on recrute un savoir-être : sens du service, rapidité, esprit d'équipe.",
    tips: ["Indiquez le type d'établissement et le nombre de couverts.", "Citez les langues parlées.", "Montrez votre disponibilité."],
    data: {
      personal: { firstName: "Léa", lastName: "Garcia", title: "Serveuse — Chef de rang", email: "lea.garcia@email.fr", phone: "06 77 88 99 00", city: "Nice", website: "", linkedin: "", photo: "", extra: "Disponible week-ends et saison" },
      summary: "4 ans d'expérience en restauration traditionnelle et brasserie. Souriante, organisée et efficace en plein rush, j'ai à cœur que chaque client passe un excellent moment.",
      experiences: [
        { id: id(), role: "Chef de rang", company: "La Table du Port", city: "Nice", start: "2023-04", end: "", current: true, description: "- Service de 120 couverts midi et soir\n- Conseil des vins et accords mets-vins\n- Formation de 3 commis de salle" },
        { id: id(), role: "Serveuse", company: "Brasserie Le Central", city: "Antibes", start: "2021-05", end: "2023-03", current: false, description: "- Prise de commande, encaissement, dressage\n- Gestion des terrasses en haute saison" },
      ],
      education: [{ id: id(), degree: "CAP Commercialisation et services en HCR", school: "Lycée Paul Augier", city: "Nice", start: "2019-09", end: "2021-06", description: "" }],
      skills: [{ id: id(), name: "Service à l'assiette", level: 5 }, { id: id(), name: "Caisse / encaissement", level: 5 }, { id: id(), name: "Conseil en vins", level: 4 }, { id: id(), name: "Gestion du stress", level: 5 }],
      languages: [{ id: id(), name: "Français", level: "Natif" }, { id: id(), name: "Anglais", level: "Courant" }, { id: id(), name: "Italien", level: "Notions" }],
      interests: "Cuisine, natation",
    },
  },
  {
    slug: "assistant-administratif",
    job: "Assistant(e) administratif(ve)",
    sector: "Administration",
    template: "classique",
    intro: "Organisation, polyvalence et maîtrise des outils bureautiques sont les attentes principales.",
    tips: ["Listez les logiciels maîtrisés.", "Montrez votre polyvalence (accueil, planning, facturation).", "Mettez en avant la fiabilité."],
    data: {
      personal: { firstName: "Nadia", lastName: "Fontaine", title: "Assistante administrative et commerciale", email: "nadia.fontaine@email.fr", phone: "06 23 45 67 89", city: "Strasbourg", website: "", linkedin: "", photo: "", extra: "Permis B, véhiculée" },
      summary: "Assistante polyvalente avec 10 ans d'expérience en PME. Je fluidifie le quotidien des équipes : gestion administrative, facturation, accueil et organisation.",
      experiences: [
        { id: id(), role: "Assistante administrative", company: "Alsace Bâtiment", city: "Strasbourg", start: "2018-01", end: "", current: true, description: "- Gestion des devis, factures et relances (300 factures/mois)\n- Organisation des plannings de 25 techniciens\n- Accueil physique et téléphonique" },
        { id: id(), role: "Secrétaire", company: "Cabinet médical des Vosges", city: "Strasbourg", start: "2014-03", end: "2017-12", current: false, description: "- Prise de rendez-vous et gestion des dossiers patients" },
      ],
      education: [{ id: id(), degree: "BTS Support à l'action managériale", school: "Lycée René Cassin", city: "Strasbourg", start: "2012-09", end: "2014-06", description: "" }],
      skills: [{ id: id(), name: "Pack Office", level: 5 }, { id: id(), name: "Facturation", level: 5 }, { id: id(), name: "Gestion d'agenda", level: 5 }, { id: id(), name: "EBP / Sage", level: 4 }],
      languages: [{ id: id(), name: "Français", level: "Natif" }, { id: id(), name: "Allemand", level: "Courant" }],
      interests: "Randonnée, lecture",
    },
  },
  {
    slug: "ingenieur",
    job: "Ingénieur méthodes / industrialisation",
    sector: "Industrie",
    template: "chrono",
    intro: "Un CV d'ingénieur doit prouver votre capacité à résoudre des problèmes et à améliorer des processus.",
    tips: ["Chiffrez les gains (coûts, délais, qualité).", "Citez les méthodes (Lean, Six Sigma).", "Précisez les outils de CAO/FAO."],
    data: {
      personal: { firstName: "Antoine", lastName: "Rousseau", title: "Ingénieur méthodes industrialisation", email: "antoine.rousseau@email.fr", phone: "06 66 77 88 99", city: "Grenoble", website: "", linkedin: "linkedin.com/in/antoinerousseau", photo: "", extra: "" },
      summary: "Ingénieur méthodes avec 6 ans d'expérience dans l'aéronautique. Spécialisé en industrialisation de nouveaux produits et en amélioration continue Lean.",
      experiences: [
        { id: id(), role: "Ingénieur méthodes", company: "AeroParts", city: "Grenoble", start: "2021-09", end: "", current: true, description: "- Industrialisation de 4 nouvelles pièces de structure\n- Chantiers Lean : -18 % de temps de cycle\n- Rédaction des gammes et formation des opérateurs" },
        { id: id(), role: "Ingénieur qualité", company: "MecaAlpes", city: "Annecy", start: "2019-01", end: "2021-08", current: false, description: "- Réduction du taux de rebut de 4,2 % à 1,1 %\n- Animation des 8D avec les fournisseurs" },
      ],
      education: [{ id: id(), degree: "Diplôme d'ingénieur — Génie industriel", school: "Grenoble INP", city: "Grenoble", start: "2015-09", end: "2018-09", description: "" }],
      skills: [{ id: id(), name: "Lean / Six Sigma", level: 5 }, { id: id(), name: "CATIA", level: 4 }, { id: id(), name: "AMDEC", level: 4 }, { id: id(), name: "Gestion de projet", level: 4 }],
      languages: [{ id: id(), name: "Français", level: "Natif" }, { id: id(), name: "Anglais", level: "C1" }],
      certifications: [{ id: id(), name: "Green Belt Lean Six Sigma", issuer: "AFNOR", date: "2022" }],
      interests: "Ski de randonnée, impression 3D",
    },
  },
  {
    slug: "graphiste",
    job: "Graphiste / Designer",
    sector: "Création",
    template: "studio",
    intro: "Le CV d'un graphiste est déjà une pièce de portfolio : soigné, original, mais lisible.",
    tips: ["Mettez le lien du portfolio en évidence.", "Citez des clients ou marques connues.", "Ne sacrifiez pas la lisibilité au style."],
    data: {
      personal: { firstName: "Jade", lastName: "Lambert", title: "Graphiste & Directrice artistique junior", email: "jade.lambert@email.fr", phone: "06 31 41 59 26", city: "Marseille", website: "behance.net/jadelambert", linkedin: "", photo: "", extra: "" },
      summary: "Graphiste créative spécialisée en identité visuelle et motion design. Je transforme des idées en univers de marque cohérents et mémorables.",
      experiences: [
        { id: id(), role: "Graphiste", company: "Studio Mistral", city: "Marseille", start: "2022-02", end: "", current: true, description: "- Création de 15 identités visuelles complètes\n- Campagnes print et social media pour des marques régionales\n- Animations motion design pour Instagram et TikTok" },
        { id: id(), role: "Graphiste freelance", company: "Indépendante", city: "Marseille", start: "2020-06", end: "2022-01", current: false, description: "- Logos, chartes et supports pour 30 clients" },
      ],
      education: [{ id: id(), degree: "DN MADE Graphisme", school: "École de design Marseille", city: "Marseille", start: "2017-09", end: "2020-06", description: "" }],
      skills: [{ id: id(), name: "Illustrator", level: 5 }, { id: id(), name: "Photoshop", level: 5 }, { id: id(), name: "After Effects", level: 4 }, { id: id(), name: "Figma", level: 4 }, { id: id(), name: "Typographie", level: 5 }],
      languages: [{ id: id(), name: "Français", level: "Natif" }, { id: id(), name: "Anglais", level: "B2" }],
      interests: "Sérigraphie, street art, vinyles",
    },
  },
];

export function exampleCV(slug: string): CVData | null {
  const ex = EXAMPLES.find((e) => e.slug === slug);
  if (!ex) return null;
  const base = emptyCV(ex.template);
  return {
    ...base,
    ...ex.data,
    personal: { ...base.personal, ...(ex.data.personal || {}) },
    settings: { ...base.settings, template: ex.template },
  } as CVData;
}

export function demoCV(template = "horizon") {
  const cv = exampleCV("developpeur-web")!;
  cv.settings.template = template;
  return cv;
}
