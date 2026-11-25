"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";

export default function Page() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h2>Mot de passe oublié</h2>
        {sent ? (
          <div className="alert alert-ok">Si un compte existe pour {email}, vous allez recevoir un email avec un lien de réinitialisation (pensez à vérifier vos spams).</div>
        ) : (
          <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); await api("/api/auth/forgot", "POST", { email }).catch(() => {}); setSent(true); setBusy(false); }}>
            <p className="muted">Entrez votre email : nous vous envoyons un lien pour choisir un nouveau mot de passe.</p>
            <div className="field"><label htmlFor="fp-email">Email</label><input id="fp-email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <button className="btn btn-primary btn-block" disabled={busy}>{busy ? <span className="spinner" /> : "Envoyer le lien"}</button>
          </form>
        )}
        <p className="center" style={{ marginTop: 16 }}><Link href="/connexion">← Retour à la connexion</Link></p>
      </div>
    </div>
  );
}
