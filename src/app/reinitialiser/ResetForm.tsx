"use client";
import { useState } from "react";
import { api } from "@/lib/client";

export default function ResetForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={async (e) => {
        e.preventDefault();
        setErr("");
        setBusy(true);
        try {
          await api("/api/auth/reset", "POST", { token, password });
          window.location.assign("/compte");
        } catch (e) {
          setErr(e instanceof Error ? e.message : "Erreur");
          setBusy(false);
        }
      }}>
        <h2>Choisissez un nouveau mot de passe</h2>
        {err && <div className="alert alert-error">{err}</div>}
        <div className="field"><label htmlFor="rp">Nouveau mot de passe</label><input id="rp" className="input" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="8 caractères minimum" /></div>
        <button className="btn btn-primary btn-block" disabled={busy || !token}>{busy ? <span className="spinner" /> : "Enregistrer et me connecter"}</button>
      </form>
    </div>
  );
}
