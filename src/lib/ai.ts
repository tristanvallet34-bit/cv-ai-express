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

type Content = Anthropic.Beta.Messages.BetaContentBlockParam[];

async function ask(prompt: string | Content, maxTokens = 4000): Promise<string | null> {
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

// ---------- Import d'un CV existant (PDF, export LinkedIn ou texte) ----------
const CV_SHAPE = `{
  "personal": {"firstName": "", "lastName": "", "title": "intitulé du poste", "email": "", "phone": "", "city": "", "website": "", "linkedin": "", "extra": "permis, disponibilité…"},
  "summary": "résumé du profil",
  "experiences": [{"role": "", "company": "", "city": "", "start": "AAAA-MM", "end": "AAAA-MM ou vide", "current": false, "description": "- puce 1\\n- puce 2"}],
  "education": [{"degree": "", "school": "", "city": "", "start": "AAAA-MM", "end": "AAAA-MM", "description": ""}],
  "skills": [{"name": "", "level": 0}],
  "languages": [{"name": "", "level": ""}],
  "certifications": [{"name": "", "issuer": "", "date": ""}],
  "projects": [{"name": "", "description": "", "link": ""}],
  "interests": "texte libre"
}`;

export async function importCV(input: { pdfBase64?: string; text?: string }) {
  const instructions = `Extrais toutes les informations de ce CV et renvoie-les uniquement en JSON avec exactement cette structure :
${CV_SHAPE}
Règles : conserve la langue d'origine, n'invente rien, laisse vide ce qui est absent. Dates au format AAAA-MM quand le mois est connu, sinon AAAA. "level" des compétences : 0 si non précisé, sinon 1 à 5. Les descriptions d'expérience en puces commençant par "- ".`;
  const content: Content = input.pdfBase64
    ? [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: input.pdfBase64 } },
        { type: "text", text: instructions },
      ]
    : [{ type: "text", text: `${instructions}\n\nCV :\n${(input.text || "").slice(0, 30000)}` }];
  const res = extractJson<Record<string, unknown>>(await ask(content, 16000));
  if (res) return res;
  if (input.text) return local.importText(input.text);
  return null;
}

// ---------- Adapter le CV à une offre ----------
export type Tailored = { title: string; summary: string; skills: string[]; experiences: { id: string; description: string }[]; advice: string[] };

export async function tailorCV(cv: { title: string; summary: string; skills: string[]; experiences: { id: string; role: string; company: string; description: string }[] }, offer: string): Promise<Tailored | null> {
  return extractJson<Tailored>(
    await ask(
      `Adapte ce CV à l'offre d'emploi ci-dessous pour maximiser la correspondance (recruteur et ATS), SANS inventer d'expérience, de diplôme ni de chiffre.
- "title" : intitulé de poste aligné sur l'offre (si cohérent avec le profil)
- "summary" : nouveau profil de 3 phrases intégrant les mots-clés de l'offre
- "skills" : 8 à 12 compétences, en priorité celles de l'offre que le candidat possède réellement d'après son CV
- "experiences" : pour chaque expérience (garde le même "id"), réécris la description en 3 à 5 puces "- " qui mettent en avant ce qui est pertinent pour l'offre
- "advice" : 2 à 4 conseils sur ce qui manque au CV pour cette offre
Réponds uniquement en JSON : {"title":"","summary":"","skills":[],"experiences":[{"id":"","description":""}],"advice":[]}

CV :
${JSON.stringify(cv).slice(0, 20000)}

Offre :
${offer.slice(0, 10000)}`,
      12000,
    ),
  );
}

// ---------- Traduire le CV ----------
export async function translateCV(cv: unknown, lang: "en" | "fr") {
  return extractJson<Record<string, unknown>>(
    await ask(
      `Traduis en ${lang === "en" ? "anglais professionnel (style CV anglo-saxon)" : "français professionnel"} toutes les valeurs textuelles de ce CV JSON. Garde exactement la même structure, les mêmes clés et les mêmes "id". Ne traduis pas les noms propres, emails, liens ni dates au format AAAA-MM. Adapte les intitulés de diplômes français avec un équivalent compréhensible (ex. "Master's degree"). Réponds uniquement avec le JSON.

${JSON.stringify(cv).slice(0, 40000)}`,
      16000,
    ),
  );
}
