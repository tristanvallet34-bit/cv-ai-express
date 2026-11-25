export type Layout =
  | "sidebar-left"
  | "sidebar-right"
  | "classic"
  | "banner"
  | "timeline"
  | "minimal"
  | "executive"
  | "split"
  | "card"
  | "ats";

export type Template = {
  id: string;
  name: string;
  layout: Layout;
  color: string;
  font: string;
  free: boolean;
  category: "Moderne" | "Classique" | "Créatif" | "Minimaliste" | "ATS" | "Cadre";
  dark?: boolean; // barre latérale sombre
  headings?: "line" | "bar" | "caps" | "pill" | "underline";
  description: string;
};

export const FONTS: { id: string; label: string; css: string }[] = [
  { id: "inter", label: "Inter", css: "'Inter', system-ui, sans-serif" },
  { id: "poppins", label: "Poppins", css: "'Poppins', system-ui, sans-serif" },
  { id: "montserrat", label: "Montserrat", css: "'Montserrat', system-ui, sans-serif" },
  { id: "raleway", label: "Raleway", css: "'Raleway', system-ui, sans-serif" },
  { id: "source", label: "Source Sans", css: "'Source Sans 3', system-ui, sans-serif" },
  { id: "roboto", label: "Roboto", css: "'Roboto', Arial, sans-serif" },
  { id: "arial", label: "Arial", css: "Arial, Helvetica, sans-serif" },
  { id: "lora", label: "Lora", css: "'Lora', Georgia, serif" },
  { id: "playfair", label: "Playfair Display", css: "'Playfair Display', Georgia, serif" },
  { id: "merriweather", label: "Merriweather", css: "'Merriweather', Georgia, serif" },
  { id: "georgia", label: "Georgia", css: "Georgia, 'Times New Roman', serif" },
  { id: "slab", label: "Roboto Slab", css: "'Roboto Slab', Georgia, serif" },
  { id: "mono", label: "JetBrains Mono", css: "'JetBrains Mono', ui-monospace, monospace" },
];

export const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Raleway:wght@400;500;600;700&family=Source+Sans+3:wght@400;600;700&family=Roboto:wght@400;500;700&family=Lora:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Merriweather:wght@400;700&family=Roboto+Slab:wght@400;500;700&family=JetBrains+Mono:wght@400;600&display=swap";

export const COLORS = [
  "#1e3a8a", "#2563eb", "#0369a1", "#0e7490", "#0d9488", "#15803d", "#4d7c0f",
  "#b45309", "#c2410c", "#dc2626", "#e11d48", "#db2777", "#7c3aed", "#4f46e5",
  "#374151", "#111827",
];

export const TEMPLATES: Template[] = [
  { id: "horizon", name: "Horizon", layout: "sidebar-left", color: "#1e3a8a", font: "inter", free: true, category: "Moderne", headings: "line", description: "Barre latérale colorée, lisible et polyvalente." },
  { id: "ats-pro", name: "ATS Pro", layout: "ats", color: "#111827", font: "arial", free: true, category: "ATS", headings: "underline", description: "Optimisé pour les logiciels de recrutement (ATS)." },
  { id: "classique", name: "Classique", layout: "classic", color: "#0f766e", font: "georgia", free: true, category: "Classique", headings: "underline", description: "Sobre et intemporel, adapté à tous les secteurs." },
  { id: "epure", name: "Épure", layout: "minimal", color: "#111827", font: "inter", free: true, category: "Minimaliste", headings: "caps", description: "Beaucoup d'espace, zéro superflu." },
  { id: "aurora", name: "Aurora", layout: "banner", color: "#7c3aed", font: "poppins", free: false, category: "Créatif", headings: "bar", description: "Bandeau d'en-tête coloré et mise en page aérée." },
  { id: "capital", name: "Capital", layout: "executive", color: "#1f2937", font: "playfair", free: false, category: "Cadre", headings: "caps", description: "Élégant et statutaire, pour les postes de direction." },
  { id: "nordic", name: "Nordic", layout: "sidebar-right", color: "#0e7490", font: "raleway", free: false, category: "Moderne", headings: "line", description: "Colonne de droite discrète, style scandinave." },
  { id: "chrono", name: "Chrono", layout: "timeline", color: "#2563eb", font: "montserrat", free: false, category: "Moderne", headings: "bar", description: "Frise chronologique qui met en valeur votre parcours." },
  { id: "eclat", name: "Éclat", layout: "sidebar-left", color: "#d4a017", font: "montserrat", free: false, dark: true, category: "Créatif", headings: "line", description: "Barre latérale sombre et accents dorés." },
  { id: "corail", name: "Corail", layout: "banner", color: "#e11d48", font: "inter", free: false, category: "Créatif", headings: "pill", description: "Énergique et moderne, parfait pour le marketing." },
  { id: "sauge", name: "Sauge", layout: "card", color: "#4d7c0f", font: "source", free: false, category: "Moderne", headings: "line", description: "Encarts doux et typographie claire." },
  { id: "tokyo", name: "Tokyo", layout: "split", color: "#dc2626", font: "poppins", free: false, category: "Créatif", headings: "bar", description: "Grand nom, deux colonnes, impact immédiat." },
  { id: "graphite", name: "Graphite", layout: "sidebar-left", color: "#374151", font: "roboto", free: false, dark: true, category: "Moderne", headings: "caps", description: "Gris anthracite, professionnel et neutre." },
  { id: "lumiere", name: "Lumière", layout: "minimal", color: "#b45309", font: "lora", free: false, category: "Minimaliste", headings: "line", description: "Serif raffinée et touches d'ambre." },
  { id: "ocean", name: "Océan", layout: "timeline", color: "#0369a1", font: "source", free: false, category: "Moderne", headings: "underline", description: "Chronologie claire aux tons bleus." },
  { id: "studio", name: "Studio", layout: "banner", color: "#db2777", font: "raleway", free: false, category: "Créatif", headings: "pill", description: "Pour les profils créatifs et design." },
  { id: "campus", name: "Campus", layout: "classic", color: "#2563eb", font: "poppins", free: false, category: "Moderne", headings: "bar", description: "Pensé pour les étudiants et jeunes diplômés." },
  { id: "sante", name: "Santé", layout: "sidebar-right", color: "#0d9488", font: "source", free: false, category: "Classique", headings: "line", description: "Rassurant et structuré, idéal pour le médical." },
  { id: "finance", name: "Finance", layout: "executive", color: "#1e40af", font: "merriweather", free: false, category: "Cadre", headings: "underline", description: "Rigueur et sérieux pour la banque et l'audit." },
  { id: "terminal", name: "Terminal", layout: "split", color: "#16a34a", font: "mono", free: false, category: "Créatif", headings: "caps", description: "Clin d'œil développeur, police monospace." },
  { id: "atelier", name: "Atelier", layout: "card", color: "#c2410c", font: "slab", free: false, category: "Classique", headings: "pill", description: "Chaleureux, idéal pour l'artisanat et la vente." },
  { id: "prisme", name: "Prisme", layout: "sidebar-left", color: "#4f46e5", font: "poppins", free: false, category: "Moderne", headings: "pill", description: "Indigo vif et compétences en pastilles." },
  { id: "minuit", name: "Minuit", layout: "sidebar-left", color: "#14b8a6", font: "raleway", free: false, dark: true, category: "Moderne", headings: "caps", description: "Bleu nuit et turquoise, très haut de gamme." },
  { id: "pastel", name: "Pastel", layout: "card", color: "#db2777", font: "poppins", free: false, category: "Créatif", headings: "pill", description: "Doux et lumineux, idéal pour les métiers du lien." },
  { id: "berlin", name: "Berlin", layout: "split", color: "#111827", font: "montserrat", free: false, category: "Minimaliste", headings: "underline", description: "Noir et blanc, typographie forte." },
  { id: "riviera", name: "Riviera", layout: "banner", color: "#0d9488", font: "source", free: false, category: "Moderne", headings: "line", description: "Dégradé méditerranéen et lecture fluide." },
  { id: "academique", name: "Académique", layout: "executive", color: "#7f1d1d", font: "lora", free: false, category: "Classique", headings: "underline", description: "Pour la recherche, l'enseignement et le droit." },
  { id: "startup", name: "Startup", layout: "sidebar-right", color: "#7c3aed", font: "inter", free: false, category: "Moderne", headings: "pill", description: "Dynamique, pour la tech et les jeunes entreprises." },
  { id: "boreal", name: "Boréal", layout: "timeline", color: "#15803d", font: "raleway", free: false, category: "Moderne", headings: "line", description: "Frise verte, nette et rassurante." },
  { id: "monochrome", name: "Monochrome", layout: "classic", color: "#111111", font: "inter", free: false, category: "Minimaliste", headings: "caps", description: "Sobriété absolue, tout en noir." },
];

export function getTemplate(id: string | undefined) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

export function fontCss(id: string | undefined) {
  return (FONTS.find((f) => f.id === id) || FONTS[0]).css;
}
