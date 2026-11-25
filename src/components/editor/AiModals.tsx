"use client";
import { useState } from "react";
import { Modal } from "@/components/Modals";
import { api, ApiError } from "@/lib/client";
import type { CVData } from "@/lib/cv/types";
import { fromImported, uid } from "@/lib/cv/utils";

type Common = { onClose: () => void; onUpsell: (reason: string) => void; onAuth: () => void; loggedIn: boolean };

function handle(e: unknown, p: Common, setErr: (s: string) => void) {
  if (e instanceof ApiError && e.upgrade) p.onUpsell(e.message);
  else if (e instanceof ApiError && e.login) p.onAuth();
  else setErr(e instanceof Error ? e.message : "Erreur");
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(new Error("Lecture du fichier impossible"));
    r.readAsDataURL(file);
  });
}

export function ImportModal(p: Common & { current: CVData; onImported: (d: CVData) => void }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function run() {
    setErr("");
    if (!p.loggedIn) return p.onAuth();
    if (!file && text.trim().length < 50) return setErr("Choisissez un PDF ou collez le texte de votre CV.");
    if (file && file.size > 4 * 1024 * 1024) return setErr("PDF trop volumineux (4 Mo maximum).");
    setBusy(true);
    try {
      const body = file ? { action: "import", pdf: await toBase64(file) } : { action: "import", text };
      const r = await api<{ result: Record<string, unknown> }>("/api/ai", "POST", body);
      p.onImported(fromImported(r.result, p.current));
    } catch (e) {
      handle(e, p, setErr);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={p.onClose} wide>
      <span className="badge">✨ Import intelligent</span>
      <h2 style={{ fontSize: "1.6rem", marginTop: 10 }}>Importez votre CV existant</h2>
      <p className="muted">L&apos;IA lit votre ancien CV et remplit toutes les rubriques. Vous n&apos;avez plus qu&apos;à choisir un modèle.</p>
      <label className="ed-add" style={{ display: "block", textAlign: "center", padding: 22, marginBottom: 12 }}>
        <input type="file" accept="application/pdf" hidden onChange={(e) => { setFile(e.target.files?.[0] || null); setErr(""); }} />
        {file ? `📄 ${file.name}` : "📄 Choisir un PDF (CV ou profil LinkedIn)"}
      </label>
      <p className="muted" style={{ fontSize: ".82rem" }}>
        Astuce LinkedIn : sur votre profil, cliquez sur « Plus » → « Enregistrer au format PDF », puis importez le fichier ici.
      </p>
      {!file && (
        <div className="field">
          <label>… ou collez le texte de votre CV</label>
          <textarea className="textarea" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Copiez-collez le contenu de votre CV Word, Google Docs…" />
        </div>
      )}
      {err && <div className="alert alert-error">{err}</div>}
      <div className="alert alert-info" style={{ fontSize: ".82rem" }}>Le contenu actuel de l&apos;éditeur sera remplacé (le design est conservé). Vous pourrez annuler avec ↶.</div>
      <button className="btn btn-primary btn-lg btn-block" onClick={run} disabled={busy}>{busy ? <><span className="spinner" /> Lecture du CV… (15 à 40 s)</> : "Importer et remplir mon CV"}</button>
    </Modal>
  );
}

type Tailored = { title: string; summary: string; skills: string[]; experiences: { id: string; description: string }[]; advice: string[] };

export function TailorModal(p: Common & { current: CVData; onApply: (d: CVData) => void }) {
  const [offer, setOffer] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [res, setRes] = useState<Tailored | null>(null);
  const d = p.current;

  async function run() {
    setErr("");
    if (!p.loggedIn) return p.onAuth();
    if (offer.trim().length < 80) return setErr("Collez le texte complet de l'offre d'emploi.");
    setBusy(true);
    try {
      const r = await api<{ result: Tailored }>("/api/ai", "POST", {
        action: "tailor",
        offer,
        cv: { title: d.personal.title, summary: d.summary, skills: d.skills.map((s) => s.name), experiences: d.experiences.map((e) => ({ id: e.id, role: e.role, company: e.company, description: e.description })) },
      });
      setRes(r.result);
    } catch (e) {
      handle(e, p, setErr);
    } finally {
      setBusy(false);
    }
  }

  function apply() {
    if (!res) return;
    const next: CVData = structuredClone(d);
    if (res.title) next.personal.title = res.title;
    if (res.summary) next.summary = res.summary;
    if (res.skills?.length) {
      next.skills = res.skills.map((name) => {
        const old = d.skills.find((s) => s.name.toLowerCase() === name.toLowerCase());
        return old || { id: uid(), name, level: d.skills.some((s) => s.level > 0) ? 3 : 0 };
      });
    }
    for (const e of res.experiences || []) {
      const x = next.experiences.find((y) => y.id === e.id);
      if (x && e.description) x.description = e.description;
    }
    p.onApply(next);
  }

  return (
    <Modal onClose={p.onClose} wide>
      <span className="badge badge-gold">★ Premium</span>
      <h2 style={{ fontSize: "1.6rem", marginTop: 10 }}>Adapter mon CV à une offre</h2>
      {!res ? (
        <>
          <p className="muted">Collez l&apos;annonce : l&apos;IA réécrit votre profil, vos compétences et vos missions pour coller à l&apos;offre et passer les filtres ATS, sans rien inventer.</p>
          <div className="field">
            <label>Offre d&apos;emploi</label>
            <textarea className="textarea" rows={9} value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="Collez ici l'annonce complète…" />
          </div>
          {err && <div className="alert alert-error">{err}</div>}
          <div className="alert alert-info" style={{ fontSize: ".82rem" }}>Conseil : dupliquez votre CV depuis votre espace pour garder une version par candidature.</div>
          <button className="btn btn-primary btn-lg btn-block" onClick={run} disabled={busy}>{busy ? <><span className="spinner" /> Adaptation en cours…</> : "🎯 Adapter mon CV"}</button>
        </>
      ) : (
        <>
          <h4>Nouvel intitulé</h4>
          <p>{res.title}</p>
          <h4>Nouveau profil</h4>
          <p style={{ background: "var(--bg-soft)", padding: 12, borderRadius: 10 }}>{res.summary}</p>
          <h4>Compétences mises en avant</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>{res.skills.map((s) => <span className="badge" key={s}>{s}</span>)}</div>
          <p className="muted" style={{ fontSize: ".88rem" }}>{res.experiences.length} expérience(s) reformulée(s) pour l&apos;offre.</p>
          {res.advice?.length > 0 && (
            <>
              <h4>Ce qui manque encore</h4>
              <ul>{res.advice.map((a) => <li key={a}>{a}</li>)}</ul>
            </>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={apply}>Appliquer au CV</button>
            <button className="btn btn-outline" onClick={() => setRes(null)}>Recommencer</button>
          </div>
        </>
      )}
    </Modal>
  );
}
