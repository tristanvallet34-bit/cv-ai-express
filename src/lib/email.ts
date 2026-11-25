import "server-only";
import { SITE } from "./config";

// Envoi d'emails via Resend (resend.com, gratuit jusqu'à 3 000 emails/mois).
// Sans RESEND_API_KEY, les emails sont affichés dans les logs du serveur.

function layout(title: string, body: string, cta?: { label: string; url: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f4f5fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 12px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;padding:32px">
<tr><td style="font-weight:800;font-size:20px;color:#4f46e5;padding-bottom:18px">CV Express</td></tr>
<tr><td style="font-size:22px;font-weight:700;color:#0f172a;padding-bottom:12px">${title}</td></tr>
<tr><td style="font-size:15px;line-height:1.6">${body}</td></tr>
${cta ? `<tr><td style="padding:24px 0"><a href="${cta.url}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:700;display:inline-block">${cta.label}</a></td></tr>` : ""}
<tr><td style="font-size:12px;color:#94a3b8;padding-top:20px;border-top:1px solid #e2e8f0">${SITE.name} · ${SITE.url}</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || `${SITE.name} <onboarding@resend.dev>`;
  if (!key) {
    console.log(`[email non envoyé — RESEND_API_KEY manquante] à=${to} sujet="${subject}"`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!res.ok) console.error("[email] échec", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("[email] erreur", e);
    return false;
  }
}

export const emails = {
  welcome: (name: string) =>
    layout(`Bienvenue ${name} 👋`, "Votre compte CV Express est prêt. Choisissez un modèle, laissez l'assistant IA vous aider, et téléchargez votre CV en PDF.<br><br>Astuce : vous avez déjà un CV ? Importez-le en PDF, l'IA remplit tout pour vous.", { label: "Créer mon CV", url: `${SITE.url}/editeur` }),
  reset: (url: string) =>
    layout("Réinitialisez votre mot de passe", "Vous avez demandé à changer votre mot de passe. Ce lien est valable 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.", { label: "Choisir un nouveau mot de passe", url }),
  premium: (planName: string) =>
    layout("Premium est activé ★", `Merci pour votre confiance ! Votre offre <b>${planName}</b> est active : tous les modèles, l'IA illimitée et les PDF sans mention sont débloqués.<br><br>Vous pouvez gérer ou résilier votre abonnement à tout moment depuis votre espace.`, { label: "Accéder à mon espace", url: `${SITE.url}/compte` }),
  contact: (from: string, name: string, message: string) =>
    layout(`Message de ${name || from}`, `<b>Email :</b> ${from}<br><br>${message.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!).replace(/\n/g, "<br>")}`),
};
