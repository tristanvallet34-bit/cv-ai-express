// Offres commerciales. Les prix sont créés à la volée dans Stripe Checkout :
// aucune configuration de produit n'est nécessaire dans le tableau de bord Stripe.
export type PlanId = "pass7" | "monthly" | "quarterly" | "yearly";

export type Plan = {
  id: PlanId;
  name: string;
  price: number; // en centimes TTC
  mode: "payment" | "subscription";
  interval?: "month" | "year";
  intervalCount?: number;
  days?: number; // durée d'accès pour les paiements uniques
  label: string; // ex: "/mois"
  perMonth?: string;
  highlight?: boolean;
  badge?: string;
  description: string;
};

export const PLANS: Plan[] = [
  {
    id: "pass7",
    name: "Pass 7 jours",
    price: 290,
    mode: "payment",
    days: 7,
    label: "/7 jours",
    perMonth: "paiement unique",
    description: "Idéal pour postuler vite. Sans abonnement, sans renouvellement.",
  },
  {
    id: "monthly",
    name: "Premium mensuel",
    price: 590,
    mode: "subscription",
    interval: "month",
    intervalCount: 1,
    label: "/mois",
    highlight: true,
    badge: "Le plus choisi",
    description: "Tout CV Express en illimité. Résiliable en 1 clic.",
  },
  {
    id: "quarterly",
    name: "Premium 3 mois",
    price: 1290,
    mode: "subscription",
    interval: "month",
    intervalCount: 3,
    label: "/3 mois",
    perMonth: "soit 4,30 €/mois",
    description: "Le temps de mener votre recherche sereinement.",
  },
  {
    id: "yearly",
    name: "Premium annuel",
    price: 2990,
    mode: "subscription",
    interval: "year",
    intervalCount: 1,
    label: "/an",
    perMonth: "soit 2,49 €/mois",
    badge: "-58 %",
    description: "Pour faire évoluer votre carrière toute l'année.",
  },
];

export const PREMIUM_FEATURES = [
  "Tous les modèles de CV et de lettres (premium inclus)",
  "Téléchargements PDF illimités, sans filigrane",
  "CV et lettres illimités, sauvegardés dans le cloud",
  "Assistant IA illimité (rédaction, reformulation, lettres)",
  "CV adapté automatiquement à chaque offre d'emploi",
  "Traduction du CV en anglais en un clic",
  "Analyse ATS avancée face à une offre d'emploi",
  "Lien public pour partager votre CV en ligne",
  "Export texte & JSON, duplication, multi-langues",
];

export const FREE_LIMITS = {
  resumes: 1,
  letters: 1,
  aiPerDay: 5,
};

export const PREMIUM_AI_PER_DAY = 200; // usage raisonnable

export function getPlan(id: string | null | undefined) {
  return PLANS.find((p) => p.id === id);
}

export function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}
