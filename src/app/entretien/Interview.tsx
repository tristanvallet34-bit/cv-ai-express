"use client";
import { useEffect, useState } from "react";
import { api, ApiError, useMe } from "@/lib/client";
import { AuthModal, UpsellModal } from "@/components/Modals";
import { cvToText, normalizeCV } from "@/lib/cv/utils";

type Q = { question: string; why: string; tips: string };

export default function Interview() {
  const { me, refresh } = useMe();
  const [role, setRole] = useState("");
  const [offer, setOffer] = useState("");
  const [profile, setProfile] = useState("");
  const [qs, setQs] = useState<Q[]>([]);
  const [open, setOpen] = useState<number | null>(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState<null | "auth" | "upsell">(null);

  useEffect(() => {
    if (!me?.user) return;
    api<{ resumes: { data: unknown }[] }>("/api/resumes")
      .then((r) => {
        if (!r.resumes[0]) return;
        const d = normalizeCV(r.resumes[0].data);
        setProfile(cvToText(d));
        setRole((x) => x || d.personal.title);
      })
      .catch(() => {});
  }, [me?.user]);

  async function run() {
    setErr("");
    if (!me?.user) return setModal("auth");
    if (!me.user.premium) return setModal("upsell");
    if (!role.trim()) return setErr("Indiquez le poste visé.");
    setBusy(true);
    try {
      const r = await api<{ result: Q[] }>("/api/ai", "POST", { action: "interview", role, offer, profile });
      setQs(r.result);
      setOpen(0);
      refresh();
    } catch (e) {
      if (e instanceof ApiError && e.upgrade) setModal("upsell");
      else setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="field"><label>Poste visé</label><input className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex : Chargé de clientèle" /></div>
        <div className="field"><label>Offre d&apos;emploi (facultatif)</label><textarea className="textarea" rows={5} value={offer} onChange={(e) => setOffer(e.target.value)} /></div>
        {profile && <p className="muted" style={{ fontSize: ".85rem" }}>✓ Votre dernier CV sera utilisé pour personnaliser les conseils.</p>}
        {err && <div className="alert alert-error">{err}</div>}
        <button className="btn btn-primary btn-lg btn-block" onClick={run} disabled={busy}>{busy ? <><span className="spinner" /> Préparation…</> : "Générer mes questions d'entretien"}</button>
        {!me?.user?.premium && <p className="muted center" style={{ fontSize: ".85rem", marginTop: 10, marginBottom: 0 }}>★ Fonctionnalité Premium</p>}
      </div>
      <div className="faq">
        {qs.map((q, i) => (
          <details key={i} open={open === i} onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && setOpen(i)}>
            <summary>{i + 1}. {q.question}</summary>
            <p><strong>Ce que le recruteur évalue :</strong> {q.why}</p>
            <p><strong>Comment répondre :</strong> {q.tips}</p>
          </details>
        ))}
      </div>
      {modal === "auth" && <AuthModal onClose={() => setModal(null)} onDone={() => { setModal(null); refresh(); }} />}
      {modal === "upsell" && <UpsellModal reason="La préparation d'entretien IA est incluse dans Premium." onClose={() => setModal(null)} />}
    </>
  );
}
