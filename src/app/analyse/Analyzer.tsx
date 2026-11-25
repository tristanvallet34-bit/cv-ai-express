"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError, useMe } from "@/lib/client";
import { AuthModal, UpsellModal } from "@/components/Modals";
import { cvToText, normalizeCV } from "@/lib/cv/utils";

type Analysis = { score: number; verdict: string; strengths: string[]; improvements: string[]; missingKeywords: string[] };

function Gauge({ score }: { score: number }) {
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#f59e0b" : "#dc2626";
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={`Score ${score} sur 100`}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(c * score) / 100} ${c}`} transform="rotate(-90 70 70)" />
      <text x="70" y="78" textAnchor="middle" fontSize="32" fontWeight="800" fill="#0f172a">{score}</text>
      <text x="70" y="98" textAnchor="middle" fontSize="11" fill="#64748b">/ 100</text>
    </svg>
  );
}

export default function Analyzer() {
  const { me, refresh } = useMe();
  const [cvs, setCvs] = useState<{ id: string; title: string; text: string }[]>([]);
  const [cvText, setCvText] = useState("");
  const [offer, setOffer] = useState("");
  const [res, setRes] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState<null | "auth" | { reason: string }>(null);
  const premium = !!me?.user?.premium;

  useEffect(() => {
    if (!me?.user) return;
    api<{ resumes: { id: string; title: string; data: unknown }[] }>("/api/resumes")
      .then((r) => {
        const list = r.resumes.map((x) => ({ id: x.id, title: x.title, text: cvToText(normalizeCV(x.data)) }));
        setCvs(list);
        if (list[0]) setCvText((t) => t || list[0].text);
      })
      .catch(() => {});
  }, [me?.user]);

  async function run() {
    setErr("");
    if (!me?.user) return setModal("auth");
    if (cvText.trim().length < 80) return setErr("Collez le contenu de votre CV (au moins quelques lignes).");
    setBusy(true);
    try {
      const r = await api<{ result: Analysis }>("/api/ai", "POST", { action: offer.trim() && premium ? "analyze-deep" : "analyze", cv: cvText, offer: premium ? offer : offer.slice(0, 1500) });
      setRes(r.result);
      refresh();
    } catch (e) {
      if (e instanceof ApiError && e.upgrade) setModal({ reason: e.message });
      else setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const shownImprovements = res ? (premium ? res.improvements : res.improvements.slice(0, 2)) : [];

  return (
    <div className="grid grid-2" style={{ alignItems: "start" }}>
      <div className="card">
        {cvs.length > 0 && (
          <div className="field">
            <label>Choisir un de mes CV</label>
            <select className="select" onChange={(e) => setCvText(cvs.find((c) => c.id === e.target.value)?.text || "")}>
              {cvs.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        )}
        <div className="field">
          <label>Contenu de votre CV</label>
          <textarea className="textarea" rows={12} value={cvText} onChange={(e) => setCvText(e.target.value)} placeholder="Collez ici le texte de votre CV (ou créez-le avec notre éditeur pour l'importer automatiquement)." />
        </div>
        <div className="field">
          <label>Offre d&apos;emploi visée {!premium && <span className="badge badge-gold">Analyse complète Premium</span>}</label>
          <textarea className="textarea" rows={7} value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="Collez l'annonce pour mesurer la correspondance et trouver les mots-clés manquants." />
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        <button className="btn btn-primary btn-lg btn-block" onClick={run} disabled={busy}>{busy ? <><span className="spinner" /> Analyse en cours…</> : "Analyser mon CV"}</button>
        {!me?.user && <p className="muted center" style={{ fontSize: ".85rem", marginTop: 10 }}>Compte gratuit requis · <Link href="/editeur">Pas encore de CV ? Créez-le</Link></p>}
      </div>

      <div>
        {!res ? (
          <div className="card center" style={{ padding: 40 }}>
            <div style={{ fontSize: "3rem" }}>🎯</div>
            <h3>Votre rapport apparaîtra ici</h3>
            <p className="muted">Score global, points forts, axes d&apos;amélioration et mots-clés manquants par rapport à l&apos;offre.</p>
          </div>
        ) : (
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <Gauge score={res.score} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <h3 style={{ marginBottom: 6 }}>Score ATS</h3>
                <p style={{ margin: 0 }}>{res.verdict}</p>
              </div>
            </div>
            {res.strengths.length > 0 && (
              <>
                <h4 style={{ marginTop: 22 }}>✅ Points forts</h4>
                <ul>{res.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
              </>
            )}
            <h4 style={{ marginTop: 18 }}>🛠 À améliorer</h4>
            <ul>{shownImprovements.map((s) => <li key={s}>{s}</li>)}</ul>
            {!premium && res.improvements.length > 2 && (
              <div className="alert alert-info">
                + {res.improvements.length - 2} recommandations supplémentaires et l&apos;analyse détaillée face à l&apos;offre avec Premium.{" "}
                <button className="btn btn-gold btn-sm" onClick={() => setModal({ reason: "Débloquez le rapport ATS complet." })}>Débloquer</button>
              </div>
            )}
            {res.missingKeywords.length > 0 && (
              <>
                <h4 style={{ marginTop: 18 }}>🔑 Mots-clés manquants</h4>
                <div className="cv-pills" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(premium ? res.missingKeywords : res.missingKeywords.slice(0, 4)).map((k) => <span key={k} className="badge">{k}</span>)}
                  {!premium && res.missingKeywords.length > 4 && <span className="badge badge-gold">+{res.missingKeywords.length - 4} ★</span>}
                </div>
              </>
            )}
            <Link href="/compte" className="btn btn-outline btn-block" style={{ marginTop: 20 }}>Améliorer mon CV dans l&apos;éditeur</Link>
          </div>
        )}
      </div>
      {modal === "auth" && <AuthModal onClose={() => setModal(null)} onDone={() => { setModal(null); refresh(); }} />}
      {modal && typeof modal === "object" && <UpsellModal reason={modal.reason} onClose={() => setModal(null)} />}
    </div>
  );
}
