"use client";
import "./editor.css";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import CVDocument from "@/components/cv/CVDocument";
import CVThumb from "@/components/cv/CVThumb";
import { AuthModal, UpsellModal } from "@/components/Modals";
import { Field, ItemCard, move } from "./fields";
import { api, ApiError, useMe, resizePhoto, download } from "@/lib/client";
import type { CVData, SectionKey } from "@/lib/cv/types";
import { TEMPLATES, COLORS, FONTS, getTemplate } from "@/lib/cv/templates";
import { SECTION_NAMES } from "@/lib/cv/labels";
import { uid, normalizeCV, fullName, cvToText, fmtRange, fromImported } from "@/lib/cv/utils";
import { cvQuality } from "@/lib/cv/score";
import { ImportModal, TailorModal } from "./AiModals";

const DRAFT_KEY = "cvx_draft_v1";
const A4_W = 793.7;
const A4_H = 1122.5;

type Props = { initial: CVData; resumeId?: string; title?: string; fromExample?: boolean };

const TemplatePicker = memo(function TemplatePicker({ data, onPick, premium }: { data: CVData; onPick: (id: string) => void; premium: boolean }) {
  return (
    <div className="ed-tpl-grid">
      {TEMPLATES.map((t) => (
        <button key={t.id} className={`ed-tpl ${data.settings.template === t.id ? "active" : ""}`} onClick={() => onPick(t.id)}>
          {!t.free && !premium && <span className="lock">★ PRO</span>}
          <CVThumb data={{ ...data, settings: { ...data.settings, template: t.id, color: "", font: "" } }} width={128} />
          {t.name}
        </button>
      ))}
    </div>
  );
});

export default function Editor({ initial, resumeId: initialId, title: initialTitle, fromExample }: Props) {
  const { me, refresh } = useMe();
  const [data, setData] = useState<CVData>(initial);
  const [resumeId, setResumeId] = useState(initialId);
  const [title, setTitle] = useState(initialTitle || "Mon CV");
  const [tab, setTab] = useState<"content" | "design">("content");
  const [openSec, setOpenSec] = useState<SectionKey | "personal" | null>("personal");
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "local" | "error">(initialId ? "saved" : "local");
  const [modal, setModal] = useState<null | { type: "auth" } | { type: "upsell"; reason?: string } | { type: "import" } | { type: "tailor" }>(null);
  const past = useRef<CVData[]>([]);
  const future = useRef<CVData[]>([]);
  const lastPush = useRef(0);
  const [hist, setHist] = useState({ u: 0, r: 0 });
  const [toast, setToast] = useState("");
  const [aiBusy, setAiBusy] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [menu, setMenu] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [scale, setScale] = useState(0.8);
  const [docHeight, setDocHeight] = useState(A4_H);
  const [pendingAction, setPendingAction] = useState<null | "download" | "save">(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const dirty = useRef(false);
  const creating = useRef(false);

  const user = me?.user;
  const premium = !!user?.premium;
  const tpl = getTemplate(data.settings.template);
  const locked = !tpl.free && !premium;

  const notify = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 3200);
  }, []);

  // Brouillon local pour les visiteurs (et reprise après inscription)
  useEffect(() => {
    if (initialId || fromExample) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setData(normalizeCV(JSON.parse(raw)));
    } catch {}
  }, [initialId, fromExample]);

  const update = useCallback((fn: (d: CVData) => CVData) => {
    dirty.current = true;
    setData((d) => {
      // Historique : regroupe les frappes rapprochées en une seule étape d'annulation
      const now = Date.now();
      if (now - lastPush.current > 700) {
        past.current = [...past.current.slice(-60), d];
        future.current = [];
        setHist({ u: past.current.length, r: 0 });
      }
      lastPush.current = now;
      return fn(structuredClone(d));
    });
  }, []);

  const replaceAll = useCallback((next: CVData) => {
    lastPush.current = 0;
    update(() => next);
  }, [update]);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    dirty.current = true;
    setData((d) => {
      future.current = [...future.current, d];
      return prev;
    });
    lastPush.current = 0;
    setHist({ u: past.current.length, r: future.current.length + 1 });
  }, []);
  const redo = useCallback(() => {
    const nxt = future.current.pop();
    if (!nxt) return;
    dirty.current = true;
    setData((d) => {
      past.current = [...past.current, d];
      return nxt;
    });
    lastPush.current = 0;
    setHist({ u: past.current.length + 1, r: future.current.length });
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) return; // annulation native dans les champs
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // Sauvegarde automatique
  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(async () => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      } catch {}
      if (!user) {
        setStatus("local");
        return;
      }
      setStatus("saving");
      try {
        if (resumeId) {
          await api(`/api/resumes/${resumeId}`, "PUT", { data, title });
        } else if (!creating.current) {
          creating.current = true;
          const r = await api<{ resume: { id: string } }>("/api/resumes", "POST", { data, title });
          setResumeId(r.resume.id);
          window.history.replaceState(null, "", `/editeur?id=${r.resume.id}`);
          creating.current = false;
        }
        dirty.current = false;
        setStatus("saved");
      } catch (e) {
        creating.current = false;
        setStatus(e instanceof ApiError && e.upgrade ? "local" : "error");
        if (e instanceof ApiError && e.upgrade && !resumeId) notify("CV gardé sur cet appareil. Passez Premium pour enregistrer plusieurs CV.");
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [data, title, user, resumeId, notify]);

  // Mise à l'échelle de l'aperçu
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1.1, (el.clientWidth - 40) / A4_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [showPreview]);
  useEffect(() => {
    const el = docRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDocHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---------- IA ----------
  async function ai<T>(key: string, payload: Record<string, unknown>): Promise<T | null> {
    if (!user) {
      setModal({ type: "auth" });
      return null;
    }
    setAiBusy(key);
    try {
      const r = await api<{ result: T; remaining: number }>("/api/ai", "POST", payload);
      refresh();
      return r.result;
    } catch (e) {
      if (e instanceof ApiError && e.upgrade) setModal({ type: "upsell", reason: e.message });
      else if (e instanceof ApiError && e.login) setModal({ type: "auth" });
      else notify(e instanceof Error ? e.message : "Erreur IA");
      return null;
    } finally {
      setAiBusy("");
    }
  }

  const context = `${data.personal.title}`;
  const expSummary = data.experiences.map((e) => `${e.role} chez ${e.company} (${fmtRange(e.start, e.end, e.current)}) : ${e.description}`).join("\n");

  // ---------- Actions ----------
  function doPrint() {
    const prev = document.title;
    document.title = `CV-${fullName(data).replace(/\s+/g, "-") || "CV-Express"}`;
    window.print();
    setTimeout(() => (document.title = prev), 500);
  }

  function handleDownload() {
    if (!user) {
      setPendingAction("download");
      setModal({ type: "auth" });
      return;
    }
    if (locked) {
      setModal({ type: "upsell", reason: `Le modèle « ${tpl.name} » est un modèle Premium. Choisissez un modèle gratuit ou passez Premium pour le télécharger.` });
      return;
    }
    doPrint();
    if (!premium) notify("Astuce : passez Premium pour retirer la mention en bas de page.");
  }

  async function afterAuth() {
    setModal(null);
    await refresh();
    dirty.current = true;
    setData((d) => ({ ...d })); // déclenche la sauvegarde serveur
    if (pendingAction === "download") setTimeout(() => notify("Compte créé ! Cliquez à nouveau sur Télécharger."), 300);
    setPendingAction(null);
  }

  async function toggleShare() {
    setMenu(false);
    if (!user) return setModal({ type: "auth" });
    if (!premium) return setModal({ type: "upsell", reason: "Le partage de CV par lien public est réservé aux membres Premium." });
    if (!resumeId) return notify("Patientez, le CV est en cours d'enregistrement…");
    try {
      const r = await api<{ resume: { publicSlug: string; isPublic: boolean } }>(`/api/resumes/${resumeId}`, "PUT", { isPublic: true });
      const url = `${window.location.origin}/cv/${r.resume.publicSlug}`;
      await navigator.clipboard?.writeText(url).catch(() => {});
      notify(`Lien copié : ${url}`);
    } catch (e) {
      notify(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function translate() {
    setMenu(false);
    if (!user) return setModal({ type: "auth" });
    if (!premium) return setModal({ type: "upsell", reason: "La traduction automatique du CV est incluse dans Premium." });
    const to = data.settings.lang === "en" ? "fr" : "en";
    notify(to === "en" ? "Traduction en anglais en cours…" : "Traduction en français en cours…");
    const { personal, settings, ...rest } = data;
    void settings;
    const r = await ai<Record<string, unknown>>("translate", { action: "translate", lang: to, cv: { ...rest, personal: { ...personal, photo: "" } } });
    if (!r) return;
    const next = fromImported(r, data);
    next.personal.photo = data.personal.photo;
    next.settings = { ...data.settings, lang: to };
    replaceAll(next);
    setTitle((t) => (to === "en" ? `${t} (EN)` : t.replace(/ \(EN\)$/, "")));
    notify("CV traduit ✓ (↶ pour annuler)");
  }

  function importJson() {
    setMenu(false);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      try {
        const d = normalizeCV(JSON.parse(await f.text()));
        update(() => d);
        notify("CV importé");
      } catch {
        notify("Fichier invalide");
      }
    };
    input.click();
  }

  function pickTemplate(id: string) {
    update((d) => {
      d.settings.template = id;
      d.settings.color = "";
      d.settings.font = "";
      return d;
    });
  }

  function newCV() {
    setMenu(false);
    if (!confirm("Créer un nouveau CV vierge ? Le CV actuel reste enregistré.")) return;
    localStorage.removeItem(DRAFT_KEY);
    window.location.href = "/editeur?nouveau=1";
  }

  // ---------- Sections ----------
  const s = data.settings;
  const toggleHidden = (k: SectionKey) =>
    update((d) => {
      d.settings.hidden = d.settings.hidden.includes(k) ? d.settings.hidden.filter((x) => x !== k) : [...d.settings.hidden, k];
      return d;
    });
  const moveSection = (k: SectionKey, dir: -1 | 1) =>
    update((d) => {
      const i = d.settings.order.indexOf(k);
      d.settings.order = move(d.settings.order, i, dir);
      return d;
    });

  const counts: Partial<Record<SectionKey, number>> = {
    experiences: data.experiences.length,
    education: data.education.length,
    skills: data.skills.length,
    languages: data.languages.length,
    certifications: data.certifications.length,
    projects: data.projects.length,
    custom: data.custom.items.length,
  };

  // Appelée comme fonction (et non comme composant) pour ne pas remonter les champs à chaque frappe
  function sectionShell(k: SectionKey, children: React.ReactNode) {
    const open = openSec === k;
    const off = s.hidden.includes(k);
    return (
      <div key={k} className={`ed-section ${off ? "off" : ""}`}>
        <div className="ed-section-head" onClick={() => setOpenSec(open ? null : k)}>
          <h4>{k === "custom" ? data.custom.title || "Section personnalisée" : SECTION_NAMES[k]}</h4>
          {counts[k] !== undefined && <span className="ed-count">{counts[k]}</span>}
          <div className="ed-item-tools" onClick={(e) => e.stopPropagation()}>
            <button className="ed-icon" title="Monter la section" onClick={() => moveSection(k, -1)}>↑</button>
            <button className="ed-icon" title="Descendre la section" onClick={() => moveSection(k, 1)}>↓</button>
            <button className="ed-icon" title={off ? "Afficher sur le CV" : "Masquer du CV"} onClick={() => toggleHidden(k)}>{off ? "◌" : "◉"}</button>
            <button className="ed-icon" onClick={() => setOpenSec(open ? null : k)}>{open ? "▴" : "▾"}</button>
          </div>
        </div>
        {open && <div className="ed-section-body">{children}</div>}
      </div>
    );
  }

  const p = data.personal;
  const setP = (key: keyof CVData["personal"]) => (v: string) =>
    update((d) => {
      d.personal[key] = v;
      return d;
    });

  const sectionEditors: Record<SectionKey, React.ReactNode> = {
    summary: (
      <>
        <Field label="Résumé de votre profil" textarea rows={5} value={data.summary} onChange={(v) => update((d) => ((d.summary = v), d))} placeholder="Ex : Développeur full-stack avec 5 ans d'expérience…" hint="3 à 4 phrases : qui vous êtes, ce que vous apportez, ce que vous cherchez." />
        <div className="ed-ai-row">
          <button className="ed-ai" disabled={!!aiBusy} onClick={async () => {
            const r = await ai<string>("summary", { action: "summary", title: p.title, experiences: expSummary, skills: data.skills.map((x) => x.name).join(", "), education: data.education.map((e) => e.degree).join(", ") });
            if (r) update((d) => ((d.summary = r), d));
          }}>{aiBusy === "summary" ? <span className="spinner" /> : "✨"} Générer avec l&apos;IA</button>
          {data.summary && (
            <button className="ed-ai" disabled={!!aiBusy} onClick={async () => {
              const r = await ai<string>("summary-imp", { action: "improve", kind: "summary", text: data.summary, context });
              if (r) update((d) => ((d.summary = r), d));
            }}>{aiBusy === "summary-imp" ? <span className="spinner" /> : "🪄"} Améliorer</button>
          )}
        </div>
      </>
    ),
    experiences: (
      <>
        {data.experiences.map((e, i) => (
          <ItemCard key={e.id} title={e.role} subtitle={[e.company, fmtRange(e.start, e.end, e.current)].filter(Boolean).join(" · ")} open={openItem === e.id} onToggle={() => setOpenItem(openItem === e.id ? null : e.id)}
            onRemove={() => update((d) => ((d.experiences = d.experiences.filter((x) => x.id !== e.id)), d))}
            onUp={i > 0 ? () => update((d) => ((d.experiences = move(d.experiences, i, -1)), d)) : undefined}
            onDown={i < data.experiences.length - 1 ? () => update((d) => ((d.experiences = move(d.experiences, i, 1)), d)) : undefined}>
            <div className="row">
              <Field label="Poste" value={e.role} onChange={(v) => update((d) => ((d.experiences[i].role = v), d))} placeholder="Chef de projet" />
              <Field label="Entreprise" value={e.company} onChange={(v) => update((d) => ((d.experiences[i].company = v), d))} />
            </div>
            <div className="row">
              <Field label="Début" type="month" value={e.start} onChange={(v) => update((d) => ((d.experiences[i].start = v), d))} />
              {!e.current && <Field label="Fin" type="month" value={e.end} onChange={(v) => update((d) => ((d.experiences[i].end = v), d))} />}
            </div>
            <div className="row">
              <Field label="Ville" value={e.city} onChange={(v) => update((d) => ((d.experiences[i].city = v), d))} />
              <label className="check" style={{ marginTop: 22 }}>
                <input type="checkbox" checked={e.current} onChange={(ev) => update((d) => ((d.experiences[i].current = ev.target.checked), d))} /> Poste actuel
              </label>
            </div>
            <Field label="Missions et réalisations" textarea rows={6} value={e.description} onChange={(v) => update((d) => ((d.experiences[i].description = v), d))} placeholder={"- Une mission par ligne, commencez par un verbe d'action\n- Chiffrez vos résultats"} />
            <div className="ed-ai-row">
              <button className="ed-ai" disabled={!!aiBusy || !e.role} onClick={async () => {
                const r = await ai<string>(`b-${e.id}`, { action: "bullets", role: e.role, company: e.company });
                if (r) update((d) => ((d.experiences[i].description = d.experiences[i].description ? d.experiences[i].description + "\n" + r : r), d));
              }}>{aiBusy === `b-${e.id}` ? <span className="spinner" /> : "✨"} Suggérer des missions</button>
              {e.description && (
                <button className="ed-ai" disabled={!!aiBusy} onClick={async () => {
                  const r = await ai<string>(`i-${e.id}`, { action: "improve", kind: "experience", text: e.description, context: `${e.role} chez ${e.company}` });
                  if (r) update((d) => ((d.experiences[i].description = r), d));
                }}>{aiBusy === `i-${e.id}` ? <span className="spinner" /> : "🪄"} Reformuler</button>
              )}
            </div>
          </ItemCard>
        ))}
        <button className="ed-add" onClick={() => {
          const id = uid();
          update((d) => ((d.experiences = [...d.experiences, { id, role: "", company: "", city: "", start: "", end: "", current: false, description: "" }]), d));
          setOpenItem(id);
        }}>+ Ajouter une expérience</button>
      </>
    ),
    education: (
      <>
        {data.education.map((e, i) => (
          <ItemCard key={e.id} title={e.degree} subtitle={e.school} open={openItem === e.id} onToggle={() => setOpenItem(openItem === e.id ? null : e.id)}
            onRemove={() => update((d) => ((d.education = d.education.filter((x) => x.id !== e.id)), d))}
            onUp={i > 0 ? () => update((d) => ((d.education = move(d.education, i, -1)), d)) : undefined}
            onDown={i < data.education.length - 1 ? () => update((d) => ((d.education = move(d.education, i, 1)), d)) : undefined}>
            <Field label="Diplôme / formation" value={e.degree} onChange={(v) => update((d) => ((d.education[i].degree = v), d))} placeholder="Master Marketing" />
            <div className="row">
              <Field label="École / université" value={e.school} onChange={(v) => update((d) => ((d.education[i].school = v), d))} />
              <Field label="Ville" value={e.city} onChange={(v) => update((d) => ((d.education[i].city = v), d))} />
            </div>
            <div className="row">
              <Field label="Début" type="month" value={e.start} onChange={(v) => update((d) => ((d.education[i].start = v), d))} />
              <Field label="Fin" type="month" value={e.end} onChange={(v) => update((d) => ((d.education[i].end = v), d))} />
            </div>
            <Field label="Description (facultatif)" textarea rows={3} value={e.description} onChange={(v) => update((d) => ((d.education[i].description = v), d))} placeholder="Mention, spécialité, projets…" />
          </ItemCard>
        ))}
        <button className="ed-add" onClick={() => {
          const id = uid();
          update((d) => ((d.education = [...d.education, { id, degree: "", school: "", city: "", start: "", end: "", description: "" }]), d));
          setOpenItem(id);
        }}>+ Ajouter une formation</button>
      </>
    ),
    skills: (
      <>
        {data.skills.map((sk, i) => (
          <div className="ed-skill-row" key={sk.id}>
            <input className="input" value={sk.name} placeholder="Compétence" onChange={(e) => update((d) => ((d.skills[i].name = e.target.value), d))} />
            <select className="select" value={sk.level} onChange={(e) => update((d) => ((d.skills[i].level = Number(e.target.value)), d))}>
              <option value={0}>Sans niveau</option>
              <option value={1}>Débutant</option>
              <option value={2}>Notions</option>
              <option value={3}>Intermédiaire</option>
              <option value={4}>Avancé</option>
              <option value={5}>Expert</option>
            </select>
            <button className="ed-icon danger" onClick={() => update((d) => ((d.skills = d.skills.filter((x) => x.id !== sk.id)), d))}>✕</button>
          </div>
        ))}
        <button className="ed-add" onClick={() => update((d) => ((d.skills = [...d.skills, { id: uid(), name: "", level: 3 }]), d))}>+ Ajouter une compétence</button>
        <div className="ed-ai-row" style={{ marginTop: 10 }}>
          <button className="ed-ai" disabled={!!aiBusy || !p.title} title={!p.title ? "Renseignez d'abord l'intitulé du poste" : ""} onClick={async () => {
            const r = await ai<string[]>("skills", { action: "skills", title: p.title });
            if (r) setSkillSuggestions(r.filter((x) => !data.skills.some((sk) => sk.name.toLowerCase() === x.toLowerCase())));
          }}>{aiBusy === "skills" ? <span className="spinner" /> : "✨"} Suggérer des compétences{p.title ? "" : " (indiquez un poste)"}</button>
        </div>
        {skillSuggestions.length > 0 && (
          <div className="ed-suggest">
            {skillSuggestions.map((x) => (
              <button key={x} onClick={() => {
                update((d) => ((d.skills = [...d.skills, { id: uid(), name: x, level: 3 }]), d));
                setSkillSuggestions((l) => l.filter((y) => y !== x));
              }}>+ {x}</button>
            ))}
          </div>
        )}
      </>
    ),
    languages: (
      <>
        {data.languages.map((l, i) => (
          <div className="ed-lang-row" key={l.id}>
            <input className="input" value={l.name} placeholder="Langue" onChange={(e) => update((d) => ((d.languages[i].name = e.target.value), d))} />
            <input className="input" list="lang-levels" value={l.level} placeholder="Niveau" onChange={(e) => update((d) => ((d.languages[i].level = e.target.value), d))} />
            <button className="ed-icon danger" onClick={() => update((d) => ((d.languages = d.languages.filter((x) => x.id !== l.id)), d))}>✕</button>
          </div>
        ))}
        <datalist id="lang-levels">
          {["Langue maternelle", "Bilingue", "Courant (C1)", "Avancé (C2)", "Intermédiaire (B2)", "Intermédiaire (B1)", "Notions (A2)", "Débutant (A1)"].map((x) => <option key={x} value={x} />)}
        </datalist>
        <button className="ed-add" onClick={() => update((d) => ((d.languages = [...d.languages, { id: uid(), name: "", level: "" }]), d))}>+ Ajouter une langue</button>
      </>
    ),
    certifications: (
      <>
        {data.certifications.map((c, i) => (
          <ItemCard key={c.id} title={c.name} subtitle={c.issuer} open={openItem === c.id} onToggle={() => setOpenItem(openItem === c.id ? null : c.id)} onRemove={() => update((d) => ((d.certifications = d.certifications.filter((x) => x.id !== c.id)), d))}>
            <Field label="Certification" value={c.name} onChange={(v) => update((d) => ((d.certifications[i].name = v), d))} />
            <div className="row">
              <Field label="Organisme" value={c.issuer} onChange={(v) => update((d) => ((d.certifications[i].issuer = v), d))} />
              <Field label="Année" value={c.date} onChange={(v) => update((d) => ((d.certifications[i].date = v), d))} />
            </div>
          </ItemCard>
        ))}
        <button className="ed-add" onClick={() => {
          const id = uid();
          update((d) => ((d.certifications = [...d.certifications, { id, name: "", issuer: "", date: "" }]), d));
          setOpenItem(id);
        }}>+ Ajouter une certification</button>
      </>
    ),
    projects: (
      <>
        {data.projects.map((pr, i) => (
          <ItemCard key={pr.id} title={pr.name} subtitle={pr.link} open={openItem === pr.id} onToggle={() => setOpenItem(openItem === pr.id ? null : pr.id)} onRemove={() => update((d) => ((d.projects = d.projects.filter((x) => x.id !== pr.id)), d))}>
            <div className="row">
              <Field label="Nom du projet" value={pr.name} onChange={(v) => update((d) => ((d.projects[i].name = v), d))} />
              <Field label="Lien" value={pr.link} onChange={(v) => update((d) => ((d.projects[i].link = v), d))} />
            </div>
            <Field label="Description" textarea rows={3} value={pr.description} onChange={(v) => update((d) => ((d.projects[i].description = v), d))} />
          </ItemCard>
        ))}
        <button className="ed-add" onClick={() => {
          const id = uid();
          update((d) => ((d.projects = [...d.projects, { id, name: "", description: "", link: "" }]), d));
          setOpenItem(id);
        }}>+ Ajouter un projet</button>
      </>
    ),
    interests: (
      <Field label="Centres d'intérêt" textarea rows={3} value={data.interests} onChange={(v) => update((d) => ((d.interests = v), d))} placeholder="Ex : Course à pied, bénévolat, photographie" hint="Soyez précis : « Marathon de Paris 2024 » est plus parlant que « sport »." />
    ),
    custom: (
      <>
        <Field label="Titre de la section" value={data.custom.title} onChange={(v) => update((d) => ((d.custom.title = v), d))} placeholder="Bénévolat, Publications, Prix…" />
        {data.custom.items.map((c, i) => (
          <ItemCard key={c.id} title={c.title} subtitle={c.subtitle} open={openItem === c.id} onToggle={() => setOpenItem(openItem === c.id ? null : c.id)} onRemove={() => update((d) => ((d.custom.items = d.custom.items.filter((x) => x.id !== c.id)), d))}>
            <div className="row">
              <Field label="Titre" value={c.title} onChange={(v) => update((d) => ((d.custom.items[i].title = v), d))} />
              <Field label="Sous-titre" value={c.subtitle} onChange={(v) => update((d) => ((d.custom.items[i].subtitle = v), d))} />
            </div>
            <Field label="Date" value={c.date} onChange={(v) => update((d) => ((d.custom.items[i].date = v), d))} placeholder="2024" />
            <Field label="Description" textarea rows={3} value={c.description} onChange={(v) => update((d) => ((d.custom.items[i].description = v), d))} />
          </ItemCard>
        ))}
        <button className="ed-add" onClick={() => {
          const id = uid();
          update((d) => ((d.custom.items = [...d.custom.items, { id, title: "", subtitle: "", date: "", description: "" }]), d));
          setOpenItem(id);
        }}>+ Ajouter un élément</button>
      </>
    ),
  };

  const breaks = useMemo(() => {
    const n = Math.floor((docHeight - 4) / A4_H);
    return Array.from({ length: n }, (_, i) => (i + 1) * A4_H);
  }, [docHeight]);

  const statusLabel = { idle: "", saving: "Enregistrement…", saved: "✓ Enregistré", local: user ? "Sur cet appareil" : "Brouillon local — créez un compte pour sauvegarder", error: "⚠ Erreur d'enregistrement" }[status];

  return (
    <div className="ed-root">
      <div className="ed-top no-print">
        <Link href={user ? "/compte" : "/"} className="logo" title="Retour"><span className="logo-mark">CV</span></Link>
        <input className="ed-title" value={title} onChange={(e) => { dirty.current = true; setTitle(e.target.value); }} aria-label="Nom du CV" />
        <span className="ed-status ed-hide-sm">{statusLabel}</span>
        <button className="ed-icon" title="Annuler (Ctrl+Z)" onClick={undo} disabled={!hist.u} style={{ opacity: hist.u ? 1 : 0.35 }}>↶</button>
        <button className="ed-icon" title="Rétablir (Ctrl+Maj+Z)" onClick={redo} disabled={!hist.r} style={{ opacity: hist.r ? 1 : 0.35 }}>↷</button>
        <div className="ed-spacer" />
        <button className="btn btn-outline btn-sm ed-mobile-toggle" onClick={() => setShowPreview(!showPreview)}>{showPreview ? "✎ Éditer" : "👁 Aperçu"}</button>
        {!premium && <Link href="/tarifs" className="btn btn-gold btn-sm ed-hide-sm">★ Premium</Link>}
        <div style={{ position: "relative" }}>
          <button className="btn btn-outline btn-sm" onClick={() => setMenu(!menu)}>⋯</button>
          {menu && (
            <div className="ed-menu" onMouseLeave={() => setMenu(false)}>
              <button onClick={() => { setMenu(false); setModal({ type: "import" }); }}>✨ Importer mon ancien CV / LinkedIn (PDF)</button>
              <button onClick={() => { setMenu(false); if (!user) return setModal({ type: "auth" }); if (!premium) return setModal({ type: "upsell", reason: "L'adaptation automatique du CV à une offre est incluse dans Premium." }); setModal({ type: "tailor" }); }}>🎯 Adapter à une offre d&apos;emploi {!premium && "★"}</button>
              <button onClick={translate}>🌍 {data.settings.lang === "en" ? "Traduire en français" : "Traduire en anglais"} {!premium && "★"}</button>
              <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "4px 0" }} />
              <button onClick={() => { setMenu(false); download(`${title}.txt`, cvToText(data)); }}>📄 Exporter en texte (.txt)</button>
              <button onClick={() => { setMenu(false); download(`${title}.json`, JSON.stringify(data, null, 2), "application/json"); }}>💾 Sauvegarde JSON</button>
              <button onClick={importJson}>📥 Importer un JSON</button>
              <button onClick={toggleShare}>🔗 Partager un lien public {!premium && "★"}</button>
              <Link href={`/lettre/editeur?fromCv=${resumeId || ""}`}>✉️ Lettre de motivation assortie</Link>
              <Link href="/analyse">🎯 Analyser mon CV (ATS)</Link>
              <button onClick={newCV}>➕ Nouveau CV vierge</button>
              {user ? <Link href="/compte">👤 Mon espace</Link> : <button onClick={() => { setMenu(false); setModal({ type: "auth" }); }}>👤 Se connecter</button>}
            </div>
          )}
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleDownload}>⬇ <span className="ed-dl-label">Télécharger </span>PDF</button>
      </div>

      <div className={`ed-body no-print ${showPreview ? "show-preview" : ""}`}>
        <div className="ed-panel">
          <div className="ed-tabs">
            <button className={tab === "content" ? "active" : ""} onClick={() => setTab("content")}>✎ Contenu</button>
            <button className={tab === "design" ? "active" : ""} onClick={() => setTab("design")}>🎨 Modèle & design</button>
          </div>
          <div className="ed-scroll">
            {tab === "content" ? (
              <>
                {(() => {
                  const q = cvQuality(data);
                  const color = q.score >= 80 ? "#16a34a" : q.score >= 55 ? "#f59e0b" : "#ef4444";
                  return (
                    <div className="ed-quality">
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".85rem", fontWeight: 700, color: "var(--ink)" }}>
                        <span>Qualité du CV</span><span style={{ color }}>{q.score} %</span>
                      </div>
                      <div className="ed-qbar"><span style={{ width: `${q.score}%`, background: color }} /></div>
                      {q.tips[0] && <div className="muted" style={{ fontSize: ".8rem", marginTop: 6 }}>💡 {q.tips[0]}</div>}
                    </div>
                  );
                })()}
                {!data.personal.firstName && !data.experiences.length && (
                  <button className="ed-import-banner" onClick={() => setModal({ type: "import" })}>
                    <strong>✨ Vous avez déjà un CV ?</strong>
                    <span>Importez-le (PDF ou profil LinkedIn) : l&apos;IA remplit tout en 30 secondes.</span>
                  </button>
                )}
                {me?.ai && (
                  <div className="alert alert-info" style={{ fontSize: ".82rem", padding: "8px 12px" }}>
                    ✨ Assistant IA : {me.ai.remaining} génération{me.ai.remaining > 1 ? "s" : ""} restante{me.ai.remaining > 1 ? "s" : ""} aujourd&apos;hui{!premium && <> · <Link href="/tarifs">illimité avec Premium</Link></>}
                  </div>
                )}
                <div className="ed-section">
                  <div className="ed-section-head" onClick={() => setOpenSec(openSec === "personal" ? null : "personal")}>
                    <h4>Informations personnelles</h4>
                    <button className="ed-icon">{openSec === "personal" ? "▴" : "▾"}</button>
                  </div>
                  {openSec === "personal" && (
                    <div className="ed-section-body">
                      <div className="ed-photo">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.photo ? <img src={p.photo} alt="" /> : <div className="ph">👤</div>}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <label className="btn btn-outline btn-sm">
                            {p.photo ? "Changer la photo" : "Ajouter une photo"}
                            <input type="file" accept="image/*" hidden onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              try {
                                const url = await resizePhoto(f);
                                update((d) => ((d.personal.photo = url), (d.settings.showPhoto = true), d));
                              } catch {
                                notify("Image invalide");
                              }
                            }} />
                          </label>
                          {p.photo && <button className="btn btn-ghost btn-sm" onClick={() => update((d) => ((d.personal.photo = ""), d))}>Retirer</button>}
                        </div>
                      </div>
                      <div className="row">
                        <Field label="Prénom" value={p.firstName} onChange={setP("firstName")} />
                        <Field label="Nom" value={p.lastName} onChange={setP("lastName")} />
                      </div>
                      <Field label="Intitulé du poste recherché" value={p.title} onChange={setP("title")} placeholder="Ex : Comptable confirmé" />
                      <div className="row">
                        <Field label="Email" type="email" value={p.email} onChange={setP("email")} />
                        <Field label="Téléphone" value={p.phone} onChange={setP("phone")} />
                      </div>
                      <div className="row">
                        <Field label="Ville" value={p.city} onChange={setP("city")} />
                        <Field label="LinkedIn" value={p.linkedin} onChange={setP("linkedin")} placeholder="linkedin.com/in/…" />
                      </div>
                      <div className="row">
                        <Field label="Site / portfolio" value={p.website} onChange={setP("website")} />
                        <Field label="Infos complémentaires" value={p.extra} onChange={setP("extra")} placeholder="Permis B, disponible…" />
                      </div>
                    </div>
                  )}
                </div>
                {s.order.map((k) => sectionShell(k, sectionEditors[k]))}
                <p className="muted" style={{ fontSize: ".8rem", textAlign: "center" }}>Astuce : utilisez ↑ ↓ pour réordonner les sections et ◉ pour les masquer.</p>
              </>
            ) : (
              <>
                <h4 style={{ marginBottom: 10 }}>Modèle</h4>
                <TemplatePicker data={data} onPick={pickTemplate} premium={premium} />
                <h4 style={{ margin: "24px 0 10px" }}>Couleur principale</h4>
                <div className="ed-colors">
                  {COLORS.map((c) => (
                    <button key={c} aria-label={c} className={`ed-color ${(s.color || tpl.color) === c ? "active" : ""}`} style={{ background: c }} onClick={() => update((d) => ((d.settings.color = c), d))} />
                  ))}
                  <input type="color" value={s.color || tpl.color} onChange={(e) => update((d) => ((d.settings.color = e.target.value), d))} title="Couleur personnalisée" style={{ width: 34, height: 34, border: 0, background: "none", cursor: "pointer" }} />
                </div>
                <div className="row" style={{ marginTop: 20 }}>
                  <div className="field">
                    <label>Police</label>
                    <select className="select" value={s.font || tpl.font} onChange={(e) => update((d) => ((d.settings.font = e.target.value), d))}>
                      {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Langue des titres</label>
                    <select className="select" value={s.lang} onChange={(e) => update((d) => ((d.settings.lang = e.target.value as "fr" | "en"), d))}>
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>Taille du texte : {Math.round(s.fontScale * 100)} %</label>
                  <input type="range" min={0.8} max={1.2} step={0.02} value={s.fontScale} onChange={(e) => update((d) => ((d.settings.fontScale = Number(e.target.value)), d))} />
                </div>
                <div className="field">
                  <label>Espacement : {Math.round(s.spacing * 100)} %</label>
                  <input type="range" min={0.6} max={1.4} step={0.05} value={s.spacing} onChange={(e) => update((d) => ((d.settings.spacing = Number(e.target.value)), d))} />
                  <small className="muted">Réduisez la taille ou l&apos;espacement pour tenir sur une page.</small>
                </div>
                <label className="check">
                  <input type="checkbox" checked={s.showPhoto} onChange={(e) => update((d) => ((d.settings.showPhoto = e.target.checked), d))} /> Afficher la photo / les initiales
                </label>
              </>
            )}
          </div>
        </div>

        <div className="ed-preview" ref={previewRef}>
          <div style={{ width: A4_W * scale, height: docHeight * scale, flex: "none" }}>
            <div className="ed-paper" style={{ width: A4_W, transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <div ref={docRef}>
                <CVDocument data={data} watermark={!premium} premiumLock={locked} />
              </div>
              {breaks.map((y, i) => (
                <div key={y} className="ed-pagebreak" style={{ top: y }}><span>Page {i + 2}</span></div>
              ))}
            </div>
          </div>
          {locked && (
            <div style={{ position: "fixed", bottom: 20, right: 24, zIndex: 5 }}>
              <button className="btn btn-gold" onClick={() => setModal({ type: "upsell", reason: `Le modèle « ${tpl.name} » fait partie des modèles Premium.` })}>★ Débloquer ce modèle</button>
            </div>
          )}
        </div>
      </div>

      <div className="print-only print-area">
        <CVDocument data={data} watermark={!premium} />
      </div>

      {modal?.type === "auth" && <AuthModal onClose={() => setModal(null)} onDone={afterAuth} />}
      {modal?.type === "upsell" && <UpsellModal onClose={() => setModal(null)} reason={modal.reason} />}
      {modal?.type === "import" && (
        <ImportModal current={data} loggedIn={me ? !!user : true} onClose={() => setModal(null)} onAuth={() => setModal({ type: "auth" })} onUpsell={(reason) => setModal({ type: "upsell", reason })}
          onImported={(d) => { replaceAll(d); setModal(null); refresh(); notify("CV importé ✓ Vérifiez les informations puis choisissez un modèle."); }} />
      )}
      {modal?.type === "tailor" && (
        <TailorModal current={data} loggedIn={me ? !!user : true} onClose={() => setModal(null)} onAuth={() => setModal({ type: "auth" })} onUpsell={(reason) => setModal({ type: "upsell", reason })}
          onApply={(d) => { replaceAll(d); setModal(null); refresh(); notify("CV adapté à l'offre ✓ (↶ pour annuler)"); }} />
      )}
      {toast && <div className="toast no-print">{toast}</div>}
    </div>
  );
}
