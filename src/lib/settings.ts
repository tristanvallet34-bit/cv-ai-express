import "server-only";
import crypto from "crypto";
import { prisma } from "./db";

// Petit coffre-fort de réglages : les valeurs sensibles sont chiffrées en AES-256-GCM
// avec une clé dérivée de AUTH_SECRET (ne changez pas AUTH_SECRET après avoir connecté Stripe).

function key() {
  return crypto.createHash("sha256").update(`cvx-settings:${process.env.AUTH_SECRET || "dev-only-insecure-secret-please-change"}`).digest();
}

function encrypt(plain: string) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `enc:${iv.toString("base64")}:${c.getAuthTag().toString("base64")}:${enc.toString("base64")}`;
}

function decrypt(v: string) {
  if (!v.startsWith("enc:")) return v;
  try {
    const [, iv, tag, data] = v.split(":");
    const d = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(data, "base64")), d.final()]).toString("utf8");
  } catch {
    console.error("[settings] impossible de déchiffrer un réglage (AUTH_SECRET modifié ?)");
    return null;
  }
}

let cache: { at: number; values: Map<string, string> } | null = null;

async function all() {
  if (cache && Date.now() - cache.at < 15_000) return cache.values;
  const rows = await prisma.setting.findMany().catch(() => []);
  const values = new Map<string, string>();
  for (const r of rows) {
    const v = decrypt(r.value);
    if (v !== null) values.set(r.key, v);
  }
  cache = { at: Date.now(), values };
  return values;
}

export async function getSetting(k: string) {
  return (await all()).get(k) ?? null;
}

export async function setSettings(values: Record<string, string | null>, secret = true) {
  if (process.env.NODE_ENV === "production" && (process.env.AUTH_SECRET || "").length < 16) throw new Error("AUTH_SECRET manquant : ajoutez-le dans les variables d'environnement avant de connecter un moyen de paiement.");
  for (const [k, v] of Object.entries(values)) {
    if (v === null) await prisma.setting.deleteMany({ where: { key: k } });
    else {
      const value = secret ? encrypt(v) : v;
      await prisma.setting.upsert({ where: { key: k }, create: { key: k, value }, update: { value } });
    }
  }
  cache = null;
}
