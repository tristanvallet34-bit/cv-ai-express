// Configuration centrale du site — modifiez ici le nom, l'URL et les infos légales.
export const SITE = {
  name: "CV Express",
  tagline: "Le générateur de CV professionnel assisté par IA",
  // Sur Vercel, l'adresse de production est détectée automatiquement
  url: (process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")).replace(/\/$/, ""),
  supportEmail: "support@cv-express.fr",
  // Informations légales (à compléter avant la mise en ligne)
  legal: {
    company: "[Nom ou raison sociale]",
    status: "[Micro-entreprise / SAS / ...]",
    address: "[Adresse postale]",
    siret: "[Numéro SIRET]",
    vat: "[N° TVA intracommunautaire ou « TVA non applicable, art. 293 B du CGI »]",
    director: "[Nom du directeur de la publication]",
    host: "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA",
  },
};
