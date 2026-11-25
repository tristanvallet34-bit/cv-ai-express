import type { CVData } from "./types";

// Score de qualité calculé en direct dans l'éditeur, avec le prochain conseil à suivre
export function cvQuality(d: CVData) {
  const checks: { ok: boolean; pts: number; tip: string }[] = [];
  const p = d.personal;
  const exps = d.experiences;
  const allDesc = exps.map((e) => e.description).join("\n");
  const add = (ok: boolean, pts: number, tip: string) => checks.push({ ok, pts, tip });

  add(!!(p.firstName && p.lastName), 8, "Indiquez votre prénom et votre nom.");
  add(!!p.title, 8, "Ajoutez l'intitulé du poste visé sous votre nom.");
  add(!!(p.email && p.phone), 8, "Ajoutez un email et un téléphone.");
  add(!!p.city, 3, "Indiquez votre ville (les recruteurs filtrent souvent par lieu).");
  add(d.summary.trim().length >= 120, 10, "Rédigez un profil de 3 phrases (l'IA peut le générer).");
  add(d.summary.trim().length <= 600, 3, "Raccourcissez votre profil : 3 à 4 phrases suffisent.");
  add(exps.length >= 1 || d.education.length >= 2, 12, "Ajoutez au moins une expérience (stage, job, bénévolat…).");
  add(exps.every((e) => e.description.trim().length > 40), 10, "Décrivez chaque expérience avec 3 à 5 puces.");
  add((allDesc.match(/^\s*[-•]/gm) || []).length >= Math.min(3, exps.length * 2), 6, "Présentez vos missions en puces commençant par un verbe d'action.");
  add(/\d/.test(allDesc), 8, "Chiffrez au moins un résultat (%, €, nombre de clients…).");
  add(exps.every((e) => e.start), 4, "Indiquez les dates de vos expériences.");
  add(d.education.length >= 1, 6, "Ajoutez votre formation.");
  add(d.skills.length >= 5, 8, "Listez au moins 5 compétences clés (l'IA peut en suggérer).");
  add(d.languages.length >= 1, 4, "Précisez vos langues et votre niveau.");
  add(!!p.linkedin || !!p.website, 2, "Ajoutez votre LinkedIn ou un portfolio.");

  const total = checks.reduce((s, c) => s + c.pts, 0);
  const got = checks.reduce((s, c) => s + (c.ok ? c.pts : 0), 0);
  const score = Math.round((got / total) * 100);
  return { score, tips: checks.filter((c) => !c.ok).sort((a, b) => b.pts - a.pts).map((c) => c.tip) };
}
