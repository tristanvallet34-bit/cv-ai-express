"use client";
import { useState } from "react";
import { api } from "@/lib/client";

export default function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", message: "", website: "" });
  const [state, setState] = useState<"idle" | "busy" | "ok" | string>("idle");
  if (state === "ok") return <div className="alert alert-ok">Merci ! Votre message est bien parti, nous vous répondons rapidement.</div>;
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      setState("busy");
      try {
        await api("/api/contact", "POST", f);
        setState("ok");
      } catch (e) {
        setState(e instanceof Error ? e.message : "Erreur");
      }
    }}>
      <div className="row">
        <div className="field"><label>Nom</label><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="field"><label>Email *</label><input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      </div>
      <div className="field"><label>Message *</label><textarea className="textarea" rows={6} required minLength={10} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></div>
      <input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} style={{ position: "absolute", left: -9999 }} aria-hidden />
      {state !== "idle" && state !== "busy" && <div className="alert alert-error">{state}</div>}
      <button className="btn btn-primary" disabled={state === "busy"}>{state === "busy" ? <span className="spinner" /> : "Envoyer"}</button>
    </form>
  );
}
