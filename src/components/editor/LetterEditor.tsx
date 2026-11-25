"use client";
import "./editor.css";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import LetterDocument from "@/components/LetterDocument";
import { AuthModal, UpsellModal } from "@/components/Modals";
import { Field } from "./fields";
import { api, ApiError, useMe, download } from "@/lib/client";
import { LETTER_TEMPLATES, getLetterTemplate, type LetterData } from "@/lib/letter/types";
import { COLORS, FONTS } from "@/lib/cv/templates";

type CvOpt = { id: string; title: string; name: string; jobTitle: string; email: string; phone: string; city: string; color: string; layout: string; text: string };
const A4_W = 793.7;

export default function LetterEditor({ initial, letterId: initialId, title: initialTitle, cvs, preselect }: { initial: LetterData; letterId?: string; title?: string; cvs: CvOpt[]; preselect?: string }) {
  const { me, refresh } = useMe();
  const [data, setData] = useState(initial);
  const [letterId, setLetterId] = useState(initialId);
  const [title, setTitle] = useState(initialTitle || "Lettre de motivation");
  const [cvId, setCvId] = useState(preselect || cvs[0]?.id || "");
  const [tab, setTab] = useState<"content" | "design">("content");
  const [status, setStatus] = useState(initialId ? "✓ Enregistré" : "");
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<null | "auth" | { reason: string }>(null);
  const [toast, setToast] = useState("");
  const [scale, setScale] = useState(0.8);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const dirty = useRef(false);
  const creating = useRef(false);
  const user = me?.user;
  const premium = !!user?.premium;
  const tpl = getLetterTemplate(data.settings.template);
  const locked = !tpl.free && !premium;

  const notify = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 3500);
  }, []);
  const update = (fn: (d: LetterData) => void) => {
    dirty.current = true;
    setData((d) => {
      const c = structuredClone(d);
      fn(c);
      return c;
    });
  };

  // Pré-remplissage depuis le CV choisi
  useEffect(() => {
    if (initialId) return;
    const cv = cvs.find((c) => c.id === cvId);
    if (!cv) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData((d) => ({
      ...d,
      sender: { ...d.sender, name: cv.name, title: cv.jobTitle, email: cv.email, phone: cv.phone, address: d.sender.address || cv.city },
      city: d.city || cv.city,
      settings: { ...d.settings, color: cv.color, template: d.settings.template === "moderne" ? (cv.layout.startsWith("sidebar") ? "lateral" : cv.layout === "banner" ? "bandeau" : "moderne") : d.settings.template },
    }));
  }, [cvId, cvs, initialId]);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1.05, (el.clientWidth - 40) / A4_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!dirty.current || !user) return;
    const t = setTimeout(async () => {
      setStatus("Enregistrement…");
      try {
        if (letterId) await api(`/api/letters/${letterId}`, "PUT", { data, title });
        else if (!creating.current) {
          creating.current = true;
          const r = await api<{ letter: { id: string } }>("/api/letters", "POST", { data, title });
          setLetterId(r.letter.id);
          window.history.replaceState(null, "", `/lettre/editeur?id=${r.letter.id}`);
          creating.current = false;
        }
        dirty.current = false;
        setStatus("✓ Enregistré");
      } catch (e) {
        creating.current = false;
        setStatus(e instanceof ApiError && e.upgrade ? "Non enregistrée (limite gratuite)" : "⚠ Erreur");
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [data, title, user, letterId]);

  async function generate() {
    if (!user) return setModal("auth");
    if (!data.job.role) return notify("Indiquez au moins le poste visé.");
    setBusy(true);
    try {
      const cv = cvs.find((c) => c.id === cvId);
      const r = await api<{ result: string }>("/api/ai", "POST", {
        action: "letter",
        name: data.sender.name,
        profile: cv?.text || `${data.sender.title}`,
        role: data.job.role,
        company: data.job.company,
        offer: data.job.offer,
        tone: data.job.tone,
      });
      update((d) => {
        d.body = r.result;
        if (!d.subject) d.subject = `Candidature au poste de ${d.job.role}`;
        if (!d.recipient.company) d.recipient.company = d.job.company;
      });
      refresh();
    } catch (e) {
      if (e instanceof ApiError && e.upgrade) setModal({ reason: e.message });
      else if (e instanceof ApiError && e.login) setModal("auth");
      else notify(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function print() {
    if (!user) return setModal("auth");
    if (locked) return setModal({ reason: `Le modèle « ${tpl.name} » est réservé aux membres Premium.` });
    const prev = document.title;
    document.title = `Lettre-${data.sender.name.replace(/\s+/g, "-") || "motivation"}`;
    window.print();
    setTimeout(() => (document.title = prev), 500);
  }

  const letterText = () =>
    [data.sender.name, data.sender.email, data.sender.phone, "", data.recipient.company, data.recipient.contact, "", `Objet : ${data.subject}`, "", data.greeting, "", data.body, "", data.closing, "", data.sender.name].join("\n");

  return (
    <div className="ed-root">
      <div className="ed-top no-print">
        <Link href={user ? "/compte" : "/lettre"} className="logo"><span className="logo-mark">CV</span></Link>
        <input className="ed-title" value={title} onChange={(e) => { dirty.current = true; setTitle(e.target.value); }} />
        <span className="ed-status ed-hide-sm">{user ? status : "Créez un compte pour sauvegarder"}</span>
        <div className="ed-spacer" />
        <button className="btn btn-outline btn-sm ed-mobile-toggle" onClick={() => setShowPreview(!showPreview)}>{showPreview ? "✎ Éditer" : "👁 Aperçu"}</button>
        <button className="btn btn-outline btn-sm ed-hide-sm" onClick={async () => { await navigator.clipboard?.writeText(letterText()); notify("Lettre copiée dans le presse-papiers"); }}>Copier le texte</button>
        <button className="btn btn-outline btn-sm ed-hide-sm" onClick={() => download(`${title}.txt`, letterText())}>.txt</button>
        <button className="btn btn-primary btn-sm" onClick={print}>⬇ <span className="ed-dl-label">Télécharger </span>PDF</button>
      </div>
      <div className={`ed-body no-print ${showPreview ? "show-preview" : ""}`}>
        <div className="ed-panel">
          <div className="ed-tabs">
            <button className={tab === "content" ? "active" : ""} onClick={() => setTab("content")}>✎ Contenu</button>
            <button className={tab === "design" ? "active" : ""} onClick={() => setTab("design")}>🎨 Design</button>
          </div>
          <div className="ed-scroll">
            {tab === "content" ? (
              <>
                <div className="ed-section" style={{ borderColor: "#ddd6fe", background: "linear-gradient(180deg,#faf5ff,#fff)" }}>
                  <div className="ed-section-head"><h4>✨ Rédaction par l&apos;IA</h4></div>
                  <div className="ed-section-body">
                    {cvs.length > 0 && (
                      <div className="field">
                        <label>Basée sur mon CV</label>
                        <select className="select" value={cvId} onChange={(e) => setCvId(e.target.value)}>
                          {cvs.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                          <option value="">Aucun CV</option>
                        </select>
                      </div>
                    )}
                    <div className="row">
                      <Field label="Poste visé *" value={data.job.role} onChange={(v) => update((d) => { d.job.role = v; })} placeholder="Chargé de communication" />
                      <Field label="Entreprise" value={data.job.company} onChange={(v) => update((d) => { d.job.company = v; })} />
                    </div>
                    <Field label="Offre d'emploi (copier-coller, facultatif)" textarea rows={4} value={data.job.offer} onChange={(v) => update((d) => { d.job.offer = v; })} placeholder="Collez l'annonce pour une lettre parfaitement ciblée" />
                    <div className="field">
                      <label>Ton</label>
                      <select className="select" value={data.job.tone} onChange={(e) => update((d) => { d.job.tone = e.target.value; })}>
                        <option value="professionnel">Professionnel</option>
                        <option value="enthousiaste et dynamique">Enthousiaste</option>
                        <option value="formel et soutenu">Formel</option>
                        <option value="direct et concis">Direct et concis</option>
                        <option value="chaleureux et humain">Chaleureux</option>
                      </select>
                    </div>
                    <button className="btn btn-primary btn-block" onClick={generate} disabled={busy}>{busy ? <><span className="spinner" /> Rédaction en cours…</> : "✨ Générer ma lettre"}</button>
                    {me?.ai && <p className="muted center" style={{ fontSize: ".78rem", margin: "8px 0 0" }}>{me.ai.remaining} génération(s) IA restante(s) aujourd&apos;hui</p>}
                  </div>
                </div>
                <div className="ed-section"><div className="ed-section-head"><h4>Expéditeur</h4></div><div className="ed-section-body">
                  <div className="row">
                    <Field label="Nom complet" value={data.sender.name} onChange={(v) => update((d) => { d.sender.name = v; })} />
                    <Field label="Titre" value={data.sender.title} onChange={(v) => update((d) => { d.sender.title = v; })} />
                  </div>
                  <div className="row">
                    <Field label="Email" value={data.sender.email} onChange={(v) => update((d) => { d.sender.email = v; })} />
                    <Field label="Téléphone" value={data.sender.phone} onChange={(v) => update((d) => { d.sender.phone = v; })} />
                  </div>
                  <Field label="Adresse" value={data.sender.address} onChange={(v) => update((d) => { d.sender.address = v; })} />
                </div></div>
                <div className="ed-section"><div className="ed-section-head"><h4>Destinataire</h4></div><div className="ed-section-body">
                  <div className="row">
                    <Field label="Entreprise" value={data.recipient.company} onChange={(v) => update((d) => { d.recipient.company = v; })} />
                    <Field label="À l'attention de" value={data.recipient.contact} onChange={(v) => update((d) => { d.recipient.contact = v; })} placeholder="Mme Dupont, DRH" />
                  </div>
                  <Field label="Adresse" textarea rows={2} value={data.recipient.address} onChange={(v) => update((d) => { d.recipient.address = v; })} />
                </div></div>
                <div className="ed-section"><div className="ed-section-head"><h4>Lettre</h4></div><div className="ed-section-body">
                  <div className="row">
                    <Field label="Ville" value={data.city} onChange={(v) => update((d) => { d.city = v; })} />
                    <Field label="Date" type="date" value={data.date} onChange={(v) => update((d) => { d.date = v; })} />
                  </div>
                  <Field label="Objet" value={data.subject} onChange={(v) => update((d) => { d.subject = v; })} placeholder="Candidature au poste de…" />
                  <Field label="Formule d'appel" value={data.greeting} onChange={(v) => update((d) => { d.greeting = v; })} />
                  <Field label="Corps de la lettre" textarea rows={14} value={data.body} onChange={(v) => update((d) => { d.body = v; })} hint="Séparez les paragraphes par une ligne vide." />
                  <Field label="Formule de politesse" textarea rows={2} value={data.closing} onChange={(v) => update((d) => { d.closing = v; })} />
                </div></div>
              </>
            ) : (
              <>
                <h4>Modèle</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {LETTER_TEMPLATES.map((t) => (
                    <button key={t.id} className={`ed-tpl ${data.settings.template === t.id ? "active" : ""}`} onClick={() => update((d) => { d.settings.template = t.id; d.settings.font = ""; })} style={{ border: "2px solid", borderColor: data.settings.template === t.id ? "var(--brand)" : "var(--line)", padding: 12, textAlign: "left" }}>
                      {!t.free && !premium && <span className="lock">★ PRO</span>}
                      <strong style={{ display: "block" }}>{t.name}</strong>
                      <span className="muted" style={{ fontWeight: 400, fontSize: ".78rem" }}>{t.description}</span>
                    </button>
                  ))}
                </div>
                <h4 style={{ marginTop: 22 }}>Couleur</h4>
                <div className="ed-colors">
                  {COLORS.map((c) => <button key={c} className={`ed-color ${(data.settings.color || tpl.color) === c ? "active" : ""}`} style={{ background: c }} onClick={() => update((d) => { d.settings.color = c; })} aria-label={c} />)}
                  <input type="color" value={data.settings.color || tpl.color} onChange={(e) => update((d) => { d.settings.color = e.target.value; })} style={{ width: 34, height: 34, border: 0, background: "none" }} />
                </div>
                <div className="field" style={{ marginTop: 18 }}>
                  <label>Police</label>
                  <select className="select" value={data.settings.font || tpl.font} onChange={(e) => update((d) => { d.settings.font = e.target.value; })}>
                    {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="ed-preview" ref={previewRef}>
          <div style={{ width: A4_W * scale, height: 1122.5 * scale, flex: "none" }}>
            <div className="ed-paper" style={{ width: A4_W, transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <LetterDocument data={data} watermark={!premium} premiumLock={locked} />
            </div>
          </div>
        </div>
      </div>
      <div className="print-only print-area"><LetterDocument data={data} watermark={!premium} /></div>
      {modal === "auth" && <AuthModal onClose={() => setModal(null)} onDone={() => { setModal(null); refresh(); dirty.current = true; setData((d) => ({ ...d })); }} />}
      {modal && typeof modal === "object" && <UpsellModal reason={modal.reason} onClose={() => setModal(null)} />}
      {toast && <div className="toast no-print">{toast}</div>}
    </div>
  );
}
