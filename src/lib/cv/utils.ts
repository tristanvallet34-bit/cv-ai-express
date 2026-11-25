import { DEFAULT_ORDER, type CVData } from "./types";

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Accepte "2023-05" (input month) ou du texte libre
export function fmtDate(v: string, lang: "fr" | "en" = "fr") {
  if (!v) return "";
  const m = /^(\d{4})-(\d{2})$/.exec(v);
  if (!m) return v;
  const months = lang === "fr" ? MONTHS_FR : MONTHS_EN;
  return `${months[parseInt(m[2], 10) - 1]} ${m[1]}`;
}

export function fmtRange(start: string, end: string, current: boolean, lang: "fr" | "en" = "fr") {
  const s = fmtDate(start, lang);
  const e = current ? (lang === "fr" ? "Aujourd'hui" : "Present") : fmtDate(end, lang);
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

export function emptyCV(template = "horizon"): CVData {
  return {
    personal: { firstName: "", lastName: "", title: "", email: "", phone: "", city: "", website: "", linkedin: "", photo: "", extra: "" },
    summary: "",
    experiences: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
    projects: [],
    interests: "",
    custom: { title: "", items: [] },
    settings: {
      template,
      color: "",
      font: "",
      fontScale: 1,
      spacing: 1,
      showPhoto: true,
      lang: "fr",
      order: [...DEFAULT_ORDER],
      hidden: [],
    },
  };
}

// Fusionne des données partielles (ex : anciennes versions) avec un CV vide
export function normalizeCV(input: unknown): CVData {
  const base = emptyCV();
  if (!input || typeof input !== "object") return base;
  const d = input as Partial<CVData>;
  const order = Array.isArray(d.settings?.order) ? d.settings!.order : base.settings.order;
  const fullOrder = [...order.filter((k) => DEFAULT_ORDER.includes(k)), ...DEFAULT_ORDER.filter((k) => !order.includes(k))];
  return {
    ...base,
    ...d,
    personal: { ...base.personal, ...(d.personal || {}) },
    custom: { ...base.custom, ...(d.custom || {}) },
    settings: { ...base.settings, ...(d.settings || {}), order: fullOrder },
    experiences: d.experiences || [],
    education: d.education || [],
    skills: d.skills || [],
    languages: d.languages || [],
    certifications: d.certifications || [],
    projects: d.projects || [],
  };
}

export function fullName(d: CVData) {
  return [d.personal.firstName, d.personal.lastName].filter(Boolean).join(" ");
}

// Transforme un texte en liste de puces si chaque ligne commence par -, • ou *
export function toLines(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function isBulletText(text: string) {
  const lines = toLines(text);
  return lines.length > 1 || /^[-•*]/.test(lines[0] || "");
}

export function stripBullet(l: string) {
  return l.replace(/^[-•*]\s*/, "");
}

// Export texte brut (utile pour les formulaires de candidature / ATS)
export function cvToText(d: CVData) {
  const out: string[] = [];
  out.push(fullName(d).toUpperCase());
  if (d.personal.title) out.push(d.personal.title);
  out.push([d.personal.email, d.personal.phone, d.personal.city, d.personal.linkedin, d.personal.website].filter(Boolean).join(" | "));
  if (d.summary) out.push("", "PROFIL", d.summary);
  if (d.experiences.length) {
    out.push("", "EXPÉRIENCE PROFESSIONNELLE");
    for (const e of d.experiences) {
      out.push(`${e.role} — ${e.company}${e.city ? ", " + e.city : ""} (${fmtRange(e.start, e.end, e.current)})`);
      if (e.description) out.push(e.description);
    }
  }
  if (d.education.length) {
    out.push("", "FORMATION");
    for (const e of d.education) {
      out.push(`${e.degree} — ${e.school}${e.city ? ", " + e.city : ""} (${fmtRange(e.start, e.end, false)})`);
      if (e.description) out.push(e.description);
    }
  }
  if (d.skills.length) out.push("", "COMPÉTENCES", d.skills.map((s) => s.name).join(", "));
  if (d.languages.length) out.push("", "LANGUES", d.languages.map((l) => `${l.name} (${l.level})`).join(", "));
  if (d.certifications.length) out.push("", "CERTIFICATIONS", ...d.certifications.map((c) => `${c.name} — ${c.issuer} ${c.date}`));
  if (d.projects.length) out.push("", "PROJETS", ...d.projects.map((p) => `${p.name} : ${p.description}`));
  if (d.interests) out.push("", "CENTRES D'INTÉRÊT", d.interests);
  return out.join("\n");
}

// Convertit le JSON renvoyé par l'IA (import / traduction) en CV complet, en gardant le design actuel
export function fromImported(raw: Record<string, unknown>, current: CVData): CVData {
  const r = raw as Partial<CVData> & Record<string, unknown>;
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
  const date = (v: unknown) => {
    const t = str(v).trim();
    return /^\d{4}-\d{2}$/.test(t) ? t : t;
  };
  const p = (r.personal || {}) as Partial<CVData["personal"]>;
  return normalizeCV({
    ...current,
    personal: {
      ...current.personal,
      firstName: str(p.firstName),
      lastName: str(p.lastName),
      title: str(p.title),
      email: str(p.email),
      phone: str(p.phone),
      city: str(p.city),
      website: str(p.website),
      linkedin: str(p.linkedin),
      extra: str(p.extra),
    },
    summary: str(r.summary),
    experiences: arr<Record<string, unknown>>(r.experiences).map((e) => ({ id: str(e.id) || uid(), role: str(e.role), company: str(e.company), city: str(e.city), start: date(e.start), end: date(e.end), current: !!e.current, description: str(e.description) })),
    education: arr<Record<string, unknown>>(r.education).map((e) => ({ id: str(e.id) || uid(), degree: str(e.degree), school: str(e.school), city: str(e.city), start: date(e.start), end: date(e.end), description: str(e.description) })),
    skills: arr<Record<string, unknown>>(r.skills).map((x) => ({ id: str(x.id) || uid(), name: typeof x === "string" ? x : str(x.name), level: Math.max(0, Math.min(5, Number(x.level) || 0)) })),
    languages: arr<Record<string, unknown>>(r.languages).map((x) => ({ id: str(x.id) || uid(), name: str(x.name), level: str(x.level) })),
    certifications: arr<Record<string, unknown>>(r.certifications).map((x) => ({ id: str(x.id) || uid(), name: str(x.name), issuer: str(x.issuer), date: str(x.date) })),
    projects: arr<Record<string, unknown>>(r.projects).map((x) => ({ id: str(x.id) || uid(), name: str(x.name), description: str(x.description), link: str(x.link) })),
    interests: str(r.interests),
    custom: r.custom && typeof r.custom === "object" ? (r.custom as CVData["custom"]) : current.custom,
  });
}
