import { sendEmail, emails } from "@/lib/email";
import { SITE } from "@/lib/config";
import { json, error, rateLimit, clientIp } from "@/lib/http";

export async function POST(req: Request) {
  if (!rateLimit(`contact:${clientIp(req)}`, 5, 60 * 60 * 1000)) return error("Trop de messages, réessayez plus tard.", 429);
  const { email, name, message, website } = await req.json().catch(() => ({}));
  if (website) return json({ ok: true }); // pot de miel anti-spam
  if (!/^\S+@\S+\.\S+$/.test(String(email || "")) || String(message || "").trim().length < 10) return error("Indiquez un email valide et un message.");
  const ok = await sendEmail(process.env.CONTACT_EMAIL || SITE.supportEmail, `[Contact] ${String(name || email).slice(0, 80)}`, emails.contact(String(email), String(name || "").slice(0, 100), String(message).slice(0, 5000)), String(email));
  if (!ok) console.log(`[contact] ${email} : ${String(message).slice(0, 500)}`);
  return json({ ok: true });
}
