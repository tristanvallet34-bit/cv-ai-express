"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CVThumb from "@/components/cv/CVThumb";
import LetterDocument from "@/components/LetterDocument";
import { UpsellModal } from "@/components/Modals";
import { api, ApiError } from "@/lib/client";
import { getPlan } from "@/lib/plans";
import type { PublicUser } from "@/lib/auth";
import type { CVData } from "@/lib/cv/types";
import type { LetterData } from "@/lib/letter/types";

type R = { id: string; title: string; updatedAt: string; isPublic: boolean; publicSlug: string | null; views: number; data: CVData };
type L = { id: string; title: string; updatedAt: string; data: LetterData };

const fmt = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export default function Dashboard({ user, resumes, letters, ai, flash, demo }: { user: PublicUser; resumes: R[]; letters: L[]; ai: { limit: number; remaining: number }; flash: string | null; demo: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<"docs" | "account">("docs");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(
    flash === "success" ? { ok: true, text: demo ? "Mode démo : Premium activé sans paiement." : "Merci ! Votre accès Premium est activé. 🎉 (Il peut falloir quelques secondes pour être pris en compte.)" } : flash === "canceled" ? { ok: true, text: "Votre abonnement a été résilié." } : null,
  );
  const [upsell, setUpsell] = useState<string | null>(null);
  const [name, setName] = useState(user.name || "");
  const [cur, setCur] = useState("");
  const [np, setNp] = useState("");
  const plan = getPlan(user.plan);

  async function act(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      if (e instanceof ApiError && e.upgrade) setUpsell(e.message);
      else setMsg({ ok: false, text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setBusy("");
    }
  }

  const duplicateCV = (r: R) =>
    act(`dup-${r.id}`, async () => {
      await api("/api/resumes", "POST", { title: `${r.title} (copie)`, data: r.data });
      router.refresh();
    });
  const deleteCV = (r: R) => {
    if (!confirm(`Supprimer « ${r.title} » ? Cette action est définitive.`)) return;
    act(`del-${r.id}`, async () => {
      await api(`/api/resumes/${r.id}`, "DELETE");
      router.refresh();
    });
  };
  const shareCV = (r: R, on: boolean) =>
    act(`share-${r.id}`, async () => {
      const res = await api<{ resume: { publicSlug: string } }>(`/api/resumes/${r.id}`, "PUT", { isPublic: on });
      if (on) {
        const url = `${window.location.origin}/cv/${res.resume.publicSlug}`;
        await navigator.clipboard?.writeText(url).catch(() => {});
        setMsg({ ok: true, text: `Lien public copié : ${url}` });
      }
      router.refresh();
    });
  const deleteLetter = (l: L) => {
    if (!confirm(`Supprimer « ${l.title} » ?`)) return;
    act(`dell-${l.id}`, async () => {
      await api(`/api/letters/${l.id}`, "DELETE");
      router.refresh();
    });
  };

  return (
    <div className="section-soft" style={{ minHeight: "80vh" }}>
      <div className="container" style={{ padding: "40px 20px 70px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: "2rem", marginBottom: 4 }}>Bonjour {user.name || ""} 👋</h1>
            <span className="muted">{user.email}</span>{" "}
            {user.premium ? <span className="badge badge-gold">★ Premium</span> : <span className="badge">Gratuit</span>}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/editeur?nouveau=1" className="btn btn-primary">+ Nouveau CV</Link>
            <Link href="/lettre/editeur" className="btn btn-outline">+ Nouvelle lettre</Link>
          </div>
        </div>

        {msg && <div className={`alert ${msg.ok ? "alert-ok" : "alert-error"}`}>{msg.text}</div>}

        {!user.premium && (
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24, background: "linear-gradient(100deg,#fffbeb,#fdf2f8)", borderColor: "#fde68a" }}>
            <div>
              <strong style={{ color: "var(--ink)" }}>Passez Premium et multipliez vos chances</strong>
              <div className="muted" style={{ fontSize: ".92rem" }}>22 modèles, PDF sans mention, IA illimitée, analyse ATS approfondie et préparation d&apos;entretien.</div>
            </div>
            <Link href="/tarifs" className="btn btn-gold">Voir les offres</Link>
          </div>
        )}

        <div className="filters" style={{ justifyContent: "flex-start" }}>
          <button className={`chip ${tab === "docs" ? "active" : ""}`} onClick={() => setTab("docs")}>Mes documents</button>
          <button className={`chip ${tab === "account" ? "active" : ""}`} onClick={() => setTab("account")}>Compte & abonnement</button>
          <Link className="chip" href="/analyse">🎯 Analyse ATS</Link>
          <Link className="chip" href="/entretien">🎤 Préparer un entretien</Link>
          {user.admin && <Link className="chip" href="/admin">⚙ Admin</Link>}
        </div>

        {tab === "docs" ? (
          <>
            <h2 style={{ fontSize: "1.3rem" }}>Mes CV ({resumes.length})</h2>
            {resumes.length === 0 ? (
              <div className="card center" style={{ marginBottom: 30 }}>
                <p>Vous n&apos;avez pas encore de CV enregistré.</p>
                <Link href="/editeur" className="btn btn-primary">Créer mon premier CV</Link>
              </div>
            ) : (
              <div className="dash-grid" style={{ marginBottom: 40 }}>
                {resumes.map((r) => (
                  <div className="doc-card" key={r.id}>
                    <Link href={`/editeur?id=${r.id}`} className="doc-prev"><CVThumb data={r.data} width={170} /></Link>
                    <div className="doc-body">
                      <strong style={{ color: "var(--ink)" }}>{r.title}</strong>
                      <span className="muted" style={{ fontSize: ".8rem" }}>Modifié le {fmt(r.updatedAt)}{r.isPublic && ` · ${r.views} vue${r.views > 1 ? "s" : ""}`}</span>
                      <div className="doc-actions">
                        <Link href={`/editeur?id=${r.id}`} className="btn btn-primary btn-sm">Modifier</Link>
                        <button className="btn btn-outline btn-sm" onClick={() => duplicateCV(r)} disabled={!!busy}>Dupliquer</button>
                        {r.isPublic ? (
                          <>
                            <a href={`/cv/${r.publicSlug}`} target="_blank" className="btn btn-outline btn-sm">Voir en ligne</a>
                            <button className="btn btn-ghost btn-sm" onClick={() => shareCV(r, false)}>Désactiver le lien</button>
                          </>
                        ) : (
                          <button className="btn btn-outline btn-sm" onClick={() => (user.premium ? shareCV(r, true) : setUpsell("Le CV en ligne est réservé aux membres Premium."))}>Partager</button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => deleteCV(r)} disabled={!!busy}>Supprimer</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <h2 style={{ fontSize: "1.3rem" }}>Mes lettres de motivation ({letters.length})</h2>
            {letters.length === 0 ? (
              <div className="card center">
                <p>Générez une lettre personnalisée en 30 secondes avec l&apos;IA.</p>
                <Link href="/lettre/editeur" className="btn btn-primary">Créer une lettre</Link>
              </div>
            ) : (
              <div className="dash-grid">
                {letters.map((l) => (
                  <div className="doc-card" key={l.id}>
                    <Link href={`/lettre/editeur?id=${l.id}`} className="doc-prev">
                      <div className="cv-thumb" style={{ width: 170, height: 240 }}>
                        <div className="cv-thumb-inner" style={{ transform: `scale(${170 / 793.7})`, width: 793.7 }}>
                          <LetterDocument data={l.data} />
                        </div>
                      </div>
                    </Link>
                    <div className="doc-body">
                      <strong style={{ color: "var(--ink)" }}>{l.title}</strong>
                      <span className="muted" style={{ fontSize: ".8rem" }}>Modifiée le {fmt(l.updatedAt)}</span>
                      <div className="doc-actions">
                        <Link href={`/lettre/editeur?id=${l.id}`} className="btn btn-primary btn-sm">Modifier</Link>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteLetter(l)} disabled={!!busy}>Supprimer</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-2" style={{ alignItems: "start" }}>
            <div className="card">
              <h3>Abonnement</h3>
              {user.premium ? (
                <>
                  <p>
                    <span className="badge badge-gold">★ Premium actif</span> {plan && <strong style={{ color: "var(--ink)" }}>{plan.name}</strong>}
                  </p>
                  {user.premiumUntil && user.plan === "pass7" && <p className="muted">Accès jusqu&apos;au {fmt(user.premiumUntil)} (sans renouvellement).</p>}
                  {user.cancelAtPeriodEnd && <p className="muted">Résiliation programmée à la fin de la période en cours.</p>}
                </>
              ) : (
                <p className="muted">Vous utilisez la version gratuite.</p>
              )}
              <p className="muted" style={{ fontSize: ".9rem" }}>Assistant IA : {ai.remaining}/{ai.limit} générations restantes aujourd&apos;hui.</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {user.subscriptionStatus && user.subscriptionStatus !== "canceled" ? (
                  <button className="btn btn-outline" disabled={!!busy} onClick={() => act("portal", async () => {
                    const r = await api<{ url: string }>("/api/stripe/portal", "POST");
                    window.location.href = r.url;
                  })}>{busy === "portal" ? <span className="spinner" /> : "Gérer / résilier mon abonnement"}</button>
                ) : (
                  <Link href="/tarifs" className="btn btn-gold">{user.premium ? "Prolonger" : "Passer Premium"}</Link>
                )}
              </div>
            </div>
            <div className="card">
              <h3>Profil</h3>
              <div className="field"><label>Prénom</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="field"><label>Mot de passe actuel</label><input className="input" type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" /></div>
              <div className="field"><label>Nouveau mot de passe</label><input className="input" type="password" value={np} onChange={(e) => setNp(e.target.value)} autoComplete="new-password" placeholder="Laisser vide pour ne pas changer" /></div>
              <button className="btn btn-primary" disabled={!!busy} onClick={() => act("profile", async () => {
                await api("/api/account", "PATCH", { name, currentPassword: cur, newPassword: np || undefined });
                setCur(""); setNp("");
                setMsg({ ok: true, text: "Profil mis à jour." });
                router.refresh();
              })}>Enregistrer</button>
              <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "24px 0" }} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-outline" onClick={() => act("logout", async () => {
                  await api("/api/auth/logout", "POST");
                  window.location.href = "/";
                })}>Se déconnecter</button>
                <button className="btn btn-danger" onClick={() => {
                  if (!confirm("Supprimer définitivement votre compte, vos CV et vos lettres ? Votre abonnement sera résilié.")) return;
                  act("delete", async () => {
                    await api("/api/account", "DELETE");
                    window.location.href = "/";
                  });
                }}>Supprimer mon compte</button>
              </div>
            </div>
          </div>
        )}
      </div>
      {upsell && <UpsellModal reason={upsell} onClose={() => setUpsell(null)} />}
    </div>
  );
}
