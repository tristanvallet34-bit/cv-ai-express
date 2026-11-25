"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { api, ApiError, startCheckout, usePayMethods, type PayProvider } from "@/lib/client";
import { PLANS, PREMIUM_FEATURES, formatPrice } from "@/lib/plans";

export function Modal({ onClose, children, wide }: { onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="modal-back no-print" onClick={onClose}>
      <div className="modal" style={wide ? { maxWidth: 760 } : undefined} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
        {children}
      </div>
    </div>
  );
}

export function AuthForm({ initial = "register", onDone }: { initial?: "login" | "register"; onDone: () => void }) {
  const [mode, setMode] = useState(initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accept, setAccept] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (mode === "register" && !accept) return setErr("Veuillez accepter les CGU et la politique de confidentialité.");
    setLoading(true);
    try {
      await api(`/api/auth/${mode}`, "POST", { email, password, name });
      onDone();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h2 style={{ fontSize: "1.6rem" }}>{mode === "register" ? "Créez votre compte gratuit" : "Bon retour !"}</h2>
      <p className="muted">{mode === "register" ? "Sauvegardez vos CV, téléchargez-les en PDF et utilisez l'assistant IA." : "Connectez-vous pour retrouver vos documents."}</p>
      {err && <div className="alert alert-error">{err}</div>}
      {mode === "register" && (
        <div className="field">
          <label htmlFor="af-name">Prénom</label>
          <input id="af-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
        </div>
      )}
      <div className="field">
        <label htmlFor="af-email">Email</label>
        <input id="af-email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="af-pass">Mot de passe</label>
        <input id="af-pass" className="input" type="password" required minLength={mode === "register" ? 8 : 1} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder={mode === "register" ? "8 caractères minimum" : ""} />
      </div>
      {mode === "login" && (
        <p style={{ marginTop: -6, marginBottom: 14, fontSize: ".85rem" }}><Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link></p>
      )}
      {mode === "register" && (
        <label className="check" style={{ marginBottom: 16, fontSize: ".85rem" }}>
          <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
          <span>J&apos;accepte les <Link href="/cgv" target="_blank">CGU/CGV</Link> et la <Link href="/confidentialite" target="_blank">politique de confidentialité</Link>.</span>
        </label>
      )}
      <button className="btn btn-primary btn-block btn-lg" disabled={loading}>
        {loading ? <span className="spinner" /> : mode === "register" ? "Créer mon compte" : "Se connecter"}
      </button>
      <p className="center" style={{ marginTop: 16, fontSize: ".92rem" }}>
        {mode === "register" ? "Déjà inscrit ? " : "Pas encore de compte ? "}
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode(mode === "register" ? "login" : "register")} style={{ color: "var(--brand)" }}>
          {mode === "register" ? "Se connecter" : "Créer un compte"}
        </button>
      </p>
    </form>
  );
}

export function AuthModal({ onClose, onDone, initial }: { onClose: () => void; onDone: () => void; initial?: "login" | "register" }) {
  return (
    <Modal onClose={onClose}>
      <AuthForm initial={initial} onDone={onDone} />
    </Modal>
  );
}

export function PayMethodPicker({ value, onChange }: { value: PayProvider; onChange: (p: PayProvider) => void }) {
  const m = usePayMethods();
  if (!m) return null;
  if (!m.stripe) {
    return (
      <div className="pay-single">
        <span className="pp-logo">PayPal</span>
        <span>Paiement sécurisé par PayPal : avec votre compte PayPal ou directement par carte bancaire.</span>
      </div>
    );
  }
  if (!m.paypal) return null;
  const opts: { id: PayProvider; label: string; sub: string; show: boolean }[] = [
    { id: "stripe", label: "💳 Carte bancaire", sub: "CB, Visa, Mastercard, Apple Pay", show: m.stripe },
    { id: "paypal", label: "🅿️ PayPal", sub: "Payez avec votre compte PayPal", show: true },
  ];
  return (
    <div className="pay-methods" role="radiogroup" aria-label="Moyen de paiement">
      {opts.filter((o) => o.show).map((o) => (
        <button type="button" key={o.id} role="radio" aria-checked={value === o.id} className={`pay-method ${value === o.id ? "active" : ""}`} onClick={() => onChange(o.id)}>
          <strong>{o.label}</strong>
          <span>{o.sub}</span>
        </button>
      ))}
    </div>
  );
}

// Choisit PayPal par défaut si la carte n'est pas disponible
export function useDefaultProvider(): [PayProvider, (p: PayProvider) => void] {
  const m = usePayMethods();
  const [p, setP] = useState<PayProvider | null>(null);
  const value: PayProvider = p ?? (!m || !m.stripe ? "paypal" : "stripe");
  return [value, setP];
}

export function ConsentBox({ checked, onChange, error }: { checked: boolean; onChange: (v: boolean) => void; error?: boolean }) {
  return (
    <label className="check" style={{ fontSize: ".82rem", alignItems: "flex-start", padding: 10, borderRadius: 10, background: error ? "#fef2f2" : "var(--bg-soft)", border: `1px solid ${error ? "#fecaca" : "var(--line)"}`, margin: "14px 0 4px" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 3 }} />
      <span>
        J&apos;accepte les <Link href="/cgv" target="_blank">CGV</Link> et demande l&apos;accès immédiat à Premium. Je reconnais perdre mon droit de rétractation pour ce contenu numérique. Les abonnements sont résiliables à tout moment.
      </span>
    </label>
  );
}

export function UpsellModal({ onClose, reason }: { onClose: () => void; reason?: string }) {
  const [loading, setLoading] = useState("");
  const [err, setErr] = useState("");
  const [consent, setConsent] = useState(false);
  const [consentErr, setConsentErr] = useState(false);
  const [provider, setProvider] = useDefaultProvider();
  async function buy(plan: string) {
    if (!consent) return setConsentErr(true);
    setLoading(plan);
    setErr("");
    try {
      await startCheckout(plan, true, provider);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
      setLoading("");
    }
  }
  return (
    <Modal onClose={onClose} wide>
      <span className="badge badge-gold">★ Premium</span>
      <h2 style={{ fontSize: "1.7rem", marginTop: 12 }}>Débloquez tout CV Express</h2>
      {reason && <div className="alert alert-info">{reason}</div>}
      <ul style={{ paddingLeft: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "6px 18px", fontSize: ".93rem" }}>
        {PREMIUM_FEATURES.map((f) => (
          <li key={f}><span style={{ color: "var(--ok)", fontWeight: 800 }}>✓</span> {f}</li>
        ))}
      </ul>
      {err && <div className="alert alert-error">{err}</div>}
      <PayMethodPicker value={provider} onChange={setProvider} />
      <ConsentBox checked={consent} onChange={(v) => { setConsent(v); setConsentErr(false); }} error={consentErr} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginTop: 18 }}>
        {PLANS.map((p) => (
          <button key={p.id} className={`btn ${p.highlight ? "btn-primary" : "btn-outline"}`} style={{ flexDirection: "column", padding: "14px 10px", gap: 2, whiteSpace: "normal" }} onClick={() => buy(p.id)} disabled={!!loading}>
            {loading === p.id ? <span className="spinner" /> : (
              <>
                <span style={{ fontSize: ".8rem", opacity: 0.85 }}>{p.name}</span>
                <span style={{ fontSize: "1.25rem", fontWeight: 800 }}>{formatPrice(p.price)}</span>
                <span style={{ fontSize: ".75rem", opacity: 0.8 }}>{p.perMonth || p.label}</span>
              </>
            )}
          </button>
        ))}
      </div>
      <p className="muted center" style={{ fontSize: ".82rem", marginTop: 14, marginBottom: 0 }}>
        Paiement sécurisé par PayPal · Abonnements résiliables en 1 clic depuis votre espace · <Link href="/tarifs">Comparer les offres</Link>
      </p>
    </Modal>
  );
}
