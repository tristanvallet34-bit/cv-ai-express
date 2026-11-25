import { getCurrentUser, isPremium } from "@/lib/auth";
import { consumeAi } from "@/lib/quota";
import * as ai from "@/lib/ai";
import { json, error } from "@/lib/http";

const s = (v: unknown, max = 20000) => String(v ?? "").slice(0, max);

export const maxDuration = 90;
const PREMIUM_ONLY = ["analyze-deep", "interview", "tailor", "translate"];

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return error("Créez un compte gratuit pour utiliser l'assistant IA.", 401, { login: true });
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  // Fonctions réservées Premium
  if (PREMIUM_ONLY.includes(action) && !isPremium(user)) {
    return error("Cette fonctionnalité est réservée aux membres Premium.", 402, { upgrade: true });
  }

  const quota = await consumeAi(user);
  if (!quota.ok) {
    return error(
      isPremium(user) ? "Limite quotidienne atteinte, revenez demain." : `Vous avez utilisé vos ${quota.limit} générations IA gratuites du jour. Passez Premium pour un usage illimité.`,
      429,
      { upgrade: !isPremium(user) },
    );
  }

  let result: unknown;
  switch (action) {
    case "improve":
      result = await ai.improveText(s(body.text, 5000), s(body.kind, 20), s(body.context, 500));
      break;
    case "bullets":
      result = await ai.generateBullets(s(body.role, 200), s(body.company, 200));
      break;
    case "summary":
      result = await ai.generateSummary({ title: s(body.title, 200), experiences: s(body.experiences, 4000), skills: s(body.skills, 1000), education: s(body.education, 1000) });
      break;
    case "skills":
      result = await ai.suggestSkills(s(body.title, 200));
      break;
    case "letter":
      result = await ai.generateLetter({ name: s(body.name, 200), profile: s(body.profile, 8000), role: s(body.role, 200), company: s(body.company, 200), offer: s(body.offer, 8000), tone: s(body.tone, 40) || "professionnel" });
      break;
    case "analyze":
    case "analyze-deep":
      result = await ai.analyzeCV(s(body.cv, 20000), s(body.offer, 10000));
      break;
    case "interview":
      result = await ai.interviewPrep(s(body.role, 200), s(body.profile, 8000), s(body.offer, 6000));
      break;
    case "import": {
      const pdf = typeof body.pdf === "string" ? body.pdf : "";
      if (pdf && pdf.length > 6_000_000) return error("PDF trop volumineux (4 Mo maximum).", 413);
      if (pdf && !ai.aiEnabled()) return error("L'import de PDF nécessite l'IA (clé ANTHROPIC_API_KEY non configurée). Collez plutôt le texte de votre CV.", 503);
      result = await ai.importCV(pdf ? { pdfBase64: pdf } : { text: s(body.text, 30000) });
      if (!result) return error("Impossible de lire ce CV. Essayez de coller son texte.", 422);
      break;
    }
    case "tailor":
      if (!ai.aiEnabled()) return error("Fonction indisponible : l'IA n'est pas configurée.", 503);
      result = await ai.tailorCV(body.cv, s(body.offer, 10000));
      if (!result) return error("L'adaptation a échoué, réessayez.", 502);
      break;
    case "translate":
      if (!ai.aiEnabled()) return error("Fonction indisponible : l'IA n'est pas configurée.", 503);
      result = await ai.translateCV(body.cv, body.lang === "fr" ? "fr" : "en");
      if (!result) return error("La traduction a échoué, réessayez.", 502);
      break;
    default:
      return error("Action inconnue");
  }
  return json({ result, remaining: quota.remaining, ai: ai.aiEnabled() });
}
