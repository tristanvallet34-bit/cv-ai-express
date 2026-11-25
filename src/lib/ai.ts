import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import * as local from "./ai-local";

export const MODEL = "claude-opus-5-5";

const SYSTEM = `Tu es un expert du recrutement en France, spécialiste de la rédaction de CV et de lettres de motivation.
Tu écris en français impeccable (sauf demande contraire), de façon concise, concrète et professionnelle.
N'invente jamais de diplômes, d'employeurs ni de chiffres précis qui ne figurent pas dans les informations fournies : si un chiffre manque, formule la phrase sans chiffre.
Réponds uniquement avec le contenu demandé, sans introduction, sans commentaire et sans balises Markdown.`;

let client: Anthropic | null = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic();
  return client;
}

export function aiEnabled() {
  return !!process.env.ANTHROPIC_API_KEY;
}

async function ask(prompt: string, maxTokens = 4000): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  try {
    const res = await c.beta.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: SYSTEM,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      messages: [{ role: "user", content: prompt }],
    });
    if (res.stop_reason === "refusal") return null;
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    return text || null;
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) console.warn("[ai] limite de débit Anthropic atteinte");
    else if (e instanceof Anthropic.APIError) console.error("[ai] erreur API", e.status, e.message);
    else console.error("[ai] erreur", e);
    return null;
  }
}

function extractJson<T>(text: string | null): T | null {
  if (!text) return null;
  const m = text.match(/[[{][\s\S]*[\]}]/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}

export async function improveText(text: string, kind: string, context: string) {
  const prompt =
    kind === "summary"
      ? `Réécris ce résumé de profil pour un CV (3 à 4 phrases, 60 mots maximum, à la première personne sans « je » excessif, orienté valeur ajoutée).\nContexte : ${context}\n\nTexte :\n${text}`
      : `Réécris ces missions pour un CV : 3 à 5 puces commençant par « - » puis un verbe d'action au passé ou au présent, orientées résultats, une ligne chacune.\nContexte : ${context}\n\nTexte :\n${text}`;
  return (await ask(prompt)) ?? local.improveText(text, kind);
}

export async function generateSummary(cv: { title: string; experiences: string; skills: string; education: string }) {
  const prompt = `Rédige un résumé de profil de CV (3 phrases, 60 mots maximum) pour ce candidat.\nPoste visé : ${cv.title}\nExpériences : ${cv.experiences}\nCompétences : ${cv.skills}\nFormation : ${cv.education}`;
  return (await ask(prompt)) ?? local.summary(cv);
}

export async function generateBullets(role: string, company: string) {
  const prompt = `Propose 4 missions typiques et crédibles pour le poste « ${role} »${company ? ` chez ${company}` : ""}, sous forme de puces commençant par « - » et un verbe d'action. Pas de chiffres inventés : utilise des formulations comme « X % » à compléter si besoin.`;
  return (await ask(prompt)) ?? local.bullets(role);
}

export async function suggestSkills(title: string): Promise<string[]> {
  const res = extractJson<string[]>(
    await ask(`Donne les 10 compétences (techniques et comportementales) les plus recherchées pour le poste « ${title} » en France. Réponds uniquement par un tableau JSON de chaînes courtes.`, 1500),
  );
  return Array.isArray(res) && res.length ? res.slice(0, 12).map(String) : local.skills(title);
}

export async function generateLetter(input: { name: string; profile: string; role: string; company: string; offer: string; tone: string }) {
  const prompt = `Rédige le corps d'une lettre de motivation (sans en-tête, sans formule d'appel, sans formule de politesse finale, sans signature) : 3 à 4 paragraphes séparés par une ligne vide, 250 à 320 mots, ton ${input.tone}.
Structure : accroche personnalisée sur l'entreprise ; ce que j'apporte (compétences et réalisations issues du profil) ; adéquation avec le poste et motivation ; proposition d'entretien.
Candidat : ${input.name}
Profil (CV) : ${input.profile}
Poste : ${input.role}
Entreprise : ${input.company}
Offre d'emploi : ${input.offer || "non fournie"}`;
  return (await ask(prompt, 6000)) ?? local.letter(input);
}

export type Analysis = {
  score: number;
  verdict: string;
  strengths: string[];
  improvements: string[];
  missingKeywords: string[];
};

export async function analyzeCV(cvText: string, offer: string): Promise<Analysis> {
  const base = local.analyze(cvText, offer);
  const res = extractJson<Analysis>(
    await ask(
      `Analyse ce CV${offer ? " par rapport à l'offre d'emploi fournie" : ""} comme le ferait un recruteur et un logiciel ATS.
Réponds uniquement en JSON : {"score": entier 0-100, "verdict": "une phrase", "strengths": [3 à 5 points], "improvements": [4 à 7 conseils concrets et actionnables], "missingKeywords": [mots-clés importants absents du CV]}.

CV :
${cvText.slice(0, 15000)}

${offer ? `Offre d'emploi :\n${offer.slice(0, 8000)}` : ""}`,
      4000,
    ),
  );
  if (!res || typeof res.score !== "number") return base;
  return {
    score: Math.max(0, Math.min(100, Math.round(res.score))),
    verdict: String(res.verdict || base.verdict),
    strengths: (res.strengths || []).map(String),
    improvements: (res.improvements || []).map(String),
    missingKeywords: (res.missingKeywords || base.missingKeywords).map(String),
  };
}

export type InterviewQ = { question: string; why: string; tips: string };

export async function interviewPrep(role: string, profile: string, offer: string): Promise<InterviewQ[]> {
  const res = extractJson<InterviewQ[]>(
    await ask(
      `Prépare un candidat à un entretien pour le poste « ${role} ». Donne 10 questions probables (mélange de questions classiques, comportementales et techniques liées au poste).
Réponds uniquement en JSON : [{"question": "...", "why": "ce que le recruteur cherche à évaluer", "tips": "comment structurer une bonne réponse, avec un exemple tiré du profil si possible"}].
Profil : ${profile.slice(0, 6000)}
Offre : ${offer.slice(0, 4000) || "non fournie"}`,
      8000,
    ),
  );
  return Array.isArray(res) && res.length ? res : local.interview(role);
}
