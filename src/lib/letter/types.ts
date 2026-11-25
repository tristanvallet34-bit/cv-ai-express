export type LetterData = {
  sender: { name: string; title: string; email: string; phone: string; address: string };
  recipient: { company: string; contact: string; address: string };
  city: string;
  date: string;
  subject: string;
  greeting: string;
  body: string;
  closing: string;
  settings: { template: string; color: string; font: string };
  job: { role: string; company: string; offer: string; tone: string }; // contexte IA
};

export const LETTER_TEMPLATES = [
  { id: "classique", name: "Classique", color: "#111827", font: "georgia", free: true, description: "Format administratif français traditionnel." },
  { id: "moderne", name: "Moderne", color: "#4f46e5", font: "inter", free: true, description: "Liseré coloré et en-tête épuré." },
  { id: "elegant", name: "Élégant", color: "#1f2937", font: "playfair", free: false, description: "Serif raffinée, en-tête centré." },
  { id: "bandeau", name: "Bandeau", color: "#7c3aed", font: "poppins", free: false, description: "Assorti aux CV à bandeau (Aurora, Corail…)." },
  { id: "lateral", name: "Latéral", color: "#1e3a8a", font: "inter", free: false, description: "Colonne colorée, assortie au CV Horizon." },
  { id: "minimal", name: "Minimal", color: "#0f766e", font: "lora", free: false, description: "Sobre, aérée et très lisible." },
];

export function getLetterTemplate(id: string) {
  return LETTER_TEMPLATES.find((t) => t.id === id) || LETTER_TEMPLATES[0];
}

export function emptyLetter(): LetterData {
  return {
    sender: { name: "", title: "", email: "", phone: "", address: "" },
    recipient: { company: "", contact: "", address: "" },
    city: "",
    date: new Date().toISOString().slice(0, 10),
    subject: "",
    greeting: "Madame, Monsieur,",
    body: "",
    closing: "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
    settings: { template: "moderne", color: "", font: "" },
    job: { role: "", company: "", offer: "", tone: "professionnel" },
  };
}

export function normalizeLetter(input: unknown): LetterData {
  const b = emptyLetter();
  if (!input || typeof input !== "object") return b;
  const d = input as Partial<LetterData>;
  return {
    ...b,
    ...d,
    sender: { ...b.sender, ...(d.sender || {}) },
    recipient: { ...b.recipient, ...(d.recipient || {}) },
    settings: { ...b.settings, ...(d.settings || {}) },
    job: { ...b.job, ...(d.job || {}) },
  };
}

export function fmtLetterDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
