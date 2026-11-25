"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import type { StripeStatus } from "@/lib/stripe";

function Row({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
      <span>{ok ? "✅" : "⬜"}</span>
      <div><strong style={{ color: "var(--ink)" }}>{label}</strong>{detail && <div className="muted" style={{ fontSize: ".85rem" }}>{detail}</div>}</div>
    </div>
  );
}

export default function StripeConnect({ initial, envManaged }: { initial: StripeStatus; envManaged: boolean }) {
  const [st, setSt] = useState(initial);
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [notes, setNotes] = useState<string[]>([]);

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setNotes([]);
    setBusy(true);
    try {
      const r = await api<{ status: StripeStatus; notes: string[] }>("/api/admin/stripe", "POST", { secretKey: key });
      setSt(r.status);
      setNotes(r.notes);
      setKey("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!confirm("Déconnecter Stripe ? Les paiements seront désactivés sur le site.")) return;
    setBusy(true);
    await api("/api/admin/stripe", "DELETE").catch(() => {});
    setSt(await api<StripeStatus>("/api/admin/stripe"));
    setBusy(false);
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>État</h3>
        <Row ok={st.connected} label={st.connected ? `Compte connecté : ${st.account?.name || st.account?.email || st.account?.id}` : "Compte Stripe non connecté"} detail={st.connected ? `${st.mode === "live" ? "🟢 Mode réel — les paiements sont encaissés" : "🧪 Mode test — aucun argent réel (carte 4242 4242 4242 4242)"} · ${st.source === "env" ? "via variable d'environnement" : "via cette page"}` : st.error} />
        {st.connected && <Row ok={!!st.account?.chargesEnabled} label="Paiements activés sur le compte" detail={st.account?.chargesEnabled ? undefined : "Terminez l'activation de votre compte sur dashboard.stripe.com (identité, IBAN)."} />}
        <Row ok={st.webhook === "ok"} label="Webhook (activation automatique de Premium)" detail={st.webhookUrl || (st.webhook === "ok" ? "Configuré" : "Sera créé automatiquement en connectant Stripe depuis le site en ligne (https).")} />
        <Row ok={st.portal || envManaged} label="Portail client (résiliation, factures, carte)" />
      </div>

      {notes.length > 0 && <div className="alert alert-ok">{notes.map((n) => <div key={n}>{n}</div>)}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      {envManaged ? (
        <div className="alert alert-info">Stripe est configuré par les variables d&apos;environnement de votre hébergeur. Pour le gérer ici, supprimez STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET de l&apos;hébergeur.</div>
      ) : (
        <form className="card" onSubmit={connect}>
          <h3>{st.connected ? "Changer de clé (ex. passer en mode réel)" : "Connecter mon compte Stripe"}</h3>
          <ol style={{ paddingLeft: 18, fontSize: ".95rem" }}>
            <li>Créez un compte gratuit sur <a href="https://dashboard.stripe.com/register" target="_blank" rel="noreferrer">stripe.com</a> (identité et IBAN pour recevoir les virements).</li>
            <li>Ouvrez <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer">Développeurs → Clés API</a>.</li>
            <li>Copiez la <strong>clé secrète</strong> (<code>sk_test_…</code> pour tester, <code>sk_live_…</code> pour encaisser) et collez-la ci-dessous.</li>
          </ol>
          <div className="field">
            <label>Clé secrète Stripe</label>
            <input className="input" type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk_live_..." required />
            <small className="muted">La clé est chiffrée avant d&apos;être enregistrée. Elle n&apos;est jamais affichée ni envoyée au navigateur.</small>
          </div>
          <button className="btn btn-primary btn-lg" disabled={busy || !key}>{busy ? <span className="spinner" /> : "Connecter Stripe"}</button>
          {st.connected && st.source === "admin" && <button type="button" className="btn btn-danger" style={{ marginLeft: 10 }} onClick={disconnect} disabled={busy}>Déconnecter</button>}
        </form>
      )}

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Conseils</h3>
        <ul style={{ fontSize: ".93rem" }}>
          <li>Commencez en <strong>mode test</strong> : faites un achat avec la carte 4242 4242 4242 4242 (date future, CVC au choix) et vérifiez que Premium s&apos;active.</li>
          <li>Passez ensuite en <strong>mode réel</strong> en collant votre clé <code>sk_live_</code> depuis votre site en ligne.</li>
          <li>Codes promo : créez-les dans Stripe (Catalogue → Coupons) ; un champ « code promo » apparaît automatiquement au paiement.</li>
          <li>Activez Apple Pay, Google Pay, PayPal… dans Stripe (Paramètres → Moyens de paiement) : ils apparaîtront automatiquement.</li>
          <li>Activez les reçus par email dans Stripe (Paramètres → Emails clients).</li>
        </ul>
      </div>
    </>
  );
}
