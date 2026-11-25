"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import type { PaypalStatus } from "@/lib/paypal";

function Row({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
      <span>{ok ? "✅" : "⬜"}</span>
      <div><strong style={{ color: "var(--ink)" }}>{label}</strong>{detail && <div className="muted" style={{ fontSize: ".85rem" }}>{detail}</div>}</div>
    </div>
  );
}

export default function PaypalConnect({ initial, envManaged }: { initial: PaypalStatus; envManaged: boolean }) {
  const [st, setSt] = useState(initial);
  const [clientId, setClientId] = useState("");
  const [secret, setSecret] = useState("");
  const [mode, setMode] = useState<"sandbox" | "live">(initial.mode || "sandbox");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [notes, setNotes] = useState<string[]>([]);

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setNotes([]);
    setBusy(true);
    try {
      const r = await api<{ status: PaypalStatus; notes: string[] }>("/api/admin/paypal", "POST", { clientId, secret, mode });
      setSt(r.status);
      setNotes(r.notes);
      setClientId("");
      setSecret("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!confirm("Déconnecter PayPal ? Le bouton PayPal disparaîtra du site (les abonnements existants continuent côté PayPal).")) return;
    setBusy(true);
    await api("/api/admin/paypal", "DELETE").catch(() => {});
    setSt(await api<PaypalStatus>("/api/admin/paypal"));
    setBusy(false);
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>État</h3>
        <Row ok={st.connected} label={st.connected ? `PayPal connecté (${st.mode === "live" ? "🟢 mode réel" : "🧪 mode Sandbox (test)"})` : "PayPal non connecté"} detail={st.error} />
        <Row ok={st.webhook} label="Webhook (renouvellements et résiliations)" detail={st.webhookUrl || (st.webhook ? "Configuré" : "Sera créé automatiquement en connectant PayPal depuis le site en ligne (https).")} />
      </div>
      {notes.length > 0 && <div className="alert alert-ok">{notes.map((n) => <div key={n}>{n}</div>)}</div>}
      {err && <div className="alert alert-error">{err}</div>}
      {envManaged ? (
        <div className="alert alert-info">PayPal est configuré par les variables d&apos;environnement (PAYPAL_CLIENT_ID…). Supprimez-les de l&apos;hébergeur pour le gérer ici.</div>
      ) : (
        <form className="card" onSubmit={connect}>
          <h3>{st.connected ? "Changer d'identifiants (ex. passer en mode réel)" : "Connecter mon compte PayPal"}</h3>
          <ol style={{ paddingLeft: 18, fontSize: ".95rem" }}>
            <li>Il faut un compte <strong>PayPal Business</strong> (gratuit) : <a href="https://www.paypal.com/fr/business" target="_blank" rel="noreferrer">paypal.com/fr/business</a>.</li>
            <li>Allez sur <a href="https://developer.paypal.com/dashboard/applications" target="_blank" rel="noreferrer">developer.paypal.com → Apps &amp; Credentials</a> et connectez-vous avec ce compte.</li>
            <li>Choisissez <strong>Sandbox</strong> (test) ou <strong>Live</strong> (réel) en haut, cliquez « Create App », donnez-lui un nom (ex. CV Express).</li>
            <li>Copiez le <strong>Client ID</strong> et le <strong>Secret</strong> de l&apos;application et collez-les ci-dessous, avec le même mode.</li>
          </ol>
          <div className="field">
            <label>Mode</label>
            <div className="pay-methods" style={{ marginTop: 0 }}>
              <button type="button" className={`pay-method ${mode === "sandbox" ? "active" : ""}`} onClick={() => setMode("sandbox")}><strong>🧪 Sandbox</strong><span>Tests, aucun argent réel</span></button>
              <button type="button" className={`pay-method ${mode === "live" ? "active" : ""}`} onClick={() => setMode("live")}><strong>🟢 Live</strong><span>Vrais paiements</span></button>
            </div>
          </div>
          <div className="field"><label>Client ID</label><input className="input" autoComplete="off" value={clientId} onChange={(e) => setClientId(e.target.value)} required /></div>
          <div className="field">
            <label>Secret</label>
            <input className="input" type="password" autoComplete="off" value={secret} onChange={(e) => setSecret(e.target.value)} required />
            <small className="muted">Chiffré avant d&apos;être enregistré, jamais renvoyé au navigateur.</small>
          </div>
          <button className="btn btn-primary btn-lg" disabled={busy || !clientId || !secret}>{busy ? <span className="spinner" /> : "Connecter PayPal"}</button>
          {st.connected && st.source === "admin" && <button type="button" className="btn btn-danger" style={{ marginLeft: 10 }} onClick={disconnect} disabled={busy}>Déconnecter</button>}
        </form>
      )}
      <div className="card" style={{ marginTop: 20 }}>
        <h3>Tester en Sandbox</h3>
        <ul style={{ fontSize: ".93rem" }}>
          <li>Sur developer.paypal.com → <strong>Sandbox accounts</strong>, PayPal fournit un compte « Personal » de test (email + mot de passe) : utilisez-le pour payer sur votre site.</li>
          <li>Vérifiez que Premium s&apos;active dans « Mon espace », puis testez la résiliation.</li>
          <li>Ensuite, créez une application en mode <strong>Live</strong> et recollez ses identifiants ici depuis votre site en ligne.</li>
        </ul>
      </div>
    </>
  );
}
