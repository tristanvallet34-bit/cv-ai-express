export type Article = { slug: string; title: string; excerpt: string; minutes: number; category: string; body: { h: string; p: string[]; list?: string[] }[] };

export const ARTICLES: Article[] = [
  {
    slug: "comment-faire-un-cv",
    title: "Comment faire un CV en 2026 : le guide complet",
    excerpt: "Structure, longueur, rubriques, mise en page : toutes les règles pour un CV qui décroche des entretiens.",
    minutes: 8,
    category: "CV",
    body: [
      { h: "Les rubriques indispensables", p: ["Un bon CV suit une structure que le recruteur connaît par cœur : il doit trouver chaque information en quelques secondes."], list: ["En-tête : nom, intitulé du poste visé, téléphone, email, ville, LinkedIn.", "Profil : 3 à 4 phrases qui résument qui vous êtes et ce que vous apportez.", "Expériences professionnelles : de la plus récente à la plus ancienne.", "Formation : diplômes, écoles, années.", "Compétences : techniques et comportementales, en lien avec le poste.", "Langues, certifications, centres d'intérêt : seulement s'ils apportent quelque chose."] },
      { h: "Une page, ou deux ?", p: ["Une page suffit dans la grande majorité des cas, surtout avec moins de 10 ans d'expérience. Au-delà, deux pages sont acceptées si chaque ligne est utile. Dans l'éditeur CV Express, l'indicateur de saut de page vous aide à tenir sur une page en jouant sur la taille du texte et l'espacement."] },
      { h: "Décrire ses expériences avec impact", p: ["Remplacez les listes de tâches par des réalisations. Commencez chaque puce par un verbe d'action et, dès que possible, ajoutez un résultat mesurable."], list: ["Moins bien : « Gestion des réseaux sociaux ».", "Mieux : « Développé la communauté Instagram de 2 000 à 15 000 abonnés en 12 mois »."] },
      { h: "Adapter son CV à chaque offre", p: ["Le même CV envoyé partout donne des résultats moyens. Reprenez l'intitulé exact du poste, mettez en avant les expériences les plus pertinentes et intégrez les mots-clés de l'annonce. Créez plusieurs versions de votre CV dans votre espace pour gagner du temps."] },
      { h: "Les erreurs à éviter", p: [], list: ["Les fautes d'orthographe : faites-vous relire.", "Une adresse email peu professionnelle.", "Des photos de vacances : préférez une photo neutre et souriante, ou pas de photo.", "Les mises en page trop chargées qui gênent la lecture.", "Les informations inutiles : numéro de sécurité sociale, situation familiale détaillée…"] },
    ],
  },
  {
    slug: "cv-ats-logiciel-recrutement",
    title: "CV et ATS : comment passer les logiciels de recrutement",
    excerpt: "Les ATS trient les candidatures avant qu'un humain ne les lise. Voici comment optimiser votre CV pour eux.",
    minutes: 6,
    category: "CV",
    body: [
      { h: "Qu'est-ce qu'un ATS ?", p: ["Un ATS (Applicant Tracking System) est un logiciel utilisé par les entreprises et cabinets pour gérer les candidatures. Il extrait le texte de votre CV, le range dans des champs (expériences, diplômes, compétences) et permet au recruteur de filtrer par mots-clés."] },
      { h: "Les règles d'or", p: [], list: ["Utilisez un PDF contenant du vrai texte (pas une image ni un scan).", "Gardez des intitulés de sections classiques : « Expérience professionnelle », « Formation », « Compétences ».", "Reprenez les mots-clés exacts de l'offre (logiciels, certifications, intitulés de poste).", "Évitez de placer des informations essentielles dans des images ou des en-têtes de page.", "Indiquez des dates lisibles (mois et année)."] },
      { h: "Design ou ATS : faut-il choisir ?", p: ["Non. Un design moderne reste compatible s'il produit un texte bien ordonné. Si vous postulez dans de grands groupes ou via des plateformes en ligne, le modèle « ATS Pro » maximise la compatibilité. Pour une candidature envoyée directement à un recruteur, un modèle plus visuel peut faire la différence."] },
      { h: "Vérifier son CV", p: ["Notre outil d'analyse compare votre CV à l'offre d'emploi, calcule un score et liste les mots-clés manquants. C'est le meilleur moyen de savoir quoi ajuster avant d'envoyer votre candidature."] },
    ],
  },
  {
    slug: "lettre-de-motivation",
    title: "Lettre de motivation : la méthode en 4 paragraphes",
    excerpt: "Vous, moi, nous, conclusion : la structure simple qui fonctionne, avec des exemples de formulations.",
    minutes: 7,
    category: "Lettre",
    body: [
      { h: "Pourquoi la lettre compte encore", p: ["Beaucoup de recruteurs la lisent en second, après le CV, pour départager des profils proches. Une lettre courte, précise et personnalisée montre votre motivation et votre capacité à vous exprimer clairement."] },
      { h: "La structure gagnante", p: [], list: ["Paragraphe 1 — Vous : ce qui vous attire dans l'entreprise (un projet, une valeur, une actualité).", "Paragraphe 2 — Moi : vos compétences et une ou deux réalisations en lien avec le poste.", "Paragraphe 3 — Nous : ce que vous apporterez concrètement et pourquoi cette collaboration a du sens.", "Conclusion : proposition d'entretien et formule de politesse."] },
      { h: "Les formules à éviter", p: ["« Je me permets de vous adresser ma candidature… », « Dynamique et motivé(e)… » : ces formules sont vues des centaines de fois par jour. Préférez une accroche spécifique à l'entreprise."] },
      { h: "Gagner du temps avec l'IA", p: ["Le générateur de lettres de CV Express s'appuie sur votre CV et sur l'offre pour rédiger une première version personnalisée en quelques secondes. Relisez-la, ajoutez une touche personnelle, et c'est prêt."] },
    ],
  },
  {
    slug: "competences-cv",
    title: "Quelles compétences mettre sur un CV ?",
    excerpt: "Hard skills, soft skills, niveaux : comment choisir et présenter vos compétences pour convaincre.",
    minutes: 5,
    category: "CV",
    body: [
      { h: "Compétences techniques (hard skills)", p: ["Ce sont les savoir-faire mesurables : logiciels, langages, méthodes, certifications. Ce sont aussi les mots-clés que recherchent les ATS. Listez-les précisément : « Excel (tableaux croisés dynamiques) » plutôt que « bureautique »."] },
      { h: "Compétences comportementales (soft skills)", p: ["Organisation, communication, leadership… Elles sont importantes mais peu crédibles si elles sont simplement listées. Prouvez-les plutôt dans vos expériences : « Coordonné une équipe de 6 personnes » démontre le leadership."] },
      { h: "Faut-il indiquer un niveau ?", p: ["Pour les langues, utilisez le cadre européen (A1 à C2) ou un score (TOEIC). Pour les compétences techniques, un niveau visuel aide le recruteur, à condition de rester honnête : vous devrez le prouver en entretien."] },
      { h: "Combien en mettre ?", p: ["Entre 6 et 10 compétences pertinentes valent mieux que 25 compétences génériques. Adaptez la liste à chaque offre."] },
    ],
  },
  {
    slug: "cv-sans-experience",
    title: "Faire un CV sans expérience : étudiants et reconversions",
    excerpt: "Pas d'expérience ? Valorisez projets, jobs, engagements et compétences transférables.",
    minutes: 6,
    category: "CV",
    body: [
      { h: "Mettre la formation en avant", p: ["Placez la section Formation en premier et détaillez-la : spécialité, cours clés, projets, mention. Dans CV Express, réordonnez les sections avec les flèches ↑ ↓."] },
      { h: "Tout compte comme expérience", p: [], list: ["Jobs étudiants et saisonniers : ils prouvent votre fiabilité et votre sens du service.", "Stages, alternances, missions de bénévolat.", "Projets académiques ou personnels (site web, association, compétition).", "Responsabilités associatives (trésorier, organisateur d'événement)."] },
      { h: "Reconversion : miser sur les compétences transférables", p: ["Gestion de projet, relation client, organisation, management… Identifiez les compétences de votre ancien métier utiles dans le nouveau, et appuyez-vous sur vos formations récentes. Un profil en haut du CV qui explique votre projet est indispensable."] },
    ],
  },
  {
    slug: "preparer-entretien-embauche",
    title: "Préparer un entretien d'embauche : la check-list",
    excerpt: "Recherches, questions pièges, méthode STAR, questions à poser : tout pour arriver serein.",
    minutes: 7,
    category: "Entretien",
    body: [
      { h: "Avant l'entretien", p: [], list: ["Renseignez-vous sur l'entreprise : activité, actualité, concurrents, culture.", "Relisez l'offre et votre CV : chaque ligne peut être questionnée.", "Préparez 3 à 4 réussites racontées avec la méthode STAR.", "Préparez vos questions pour le recruteur.", "Vérifiez l'itinéraire ou votre connexion pour une visio."] },
      { h: "La méthode STAR", p: ["Situation, Tâche, Action, Résultat : cette structure permet de répondre aux questions comportementales (« Parlez-moi d'une fois où… ») de façon claire et convaincante, en terminant par un résultat concret."] },
      { h: "Les questions classiques", p: ["Présentez-vous, pourquoi nous, vos qualités et défauts, vos prétentions salariales, où vous voyez-vous dans 5 ans… Notre coach d'entretien IA génère les questions probables pour votre poste avec des conseils de réponse personnalisés."] },
      { h: "Après l'entretien", p: ["Envoyez un court email de remerciement dans les 24 heures en rappelant votre intérêt pour le poste. Si vous n'avez pas de nouvelles au-delà du délai annoncé, une relance polie est tout à fait acceptable."] },
    ],
  },
];
