"use client";
import { useState } from "react";
import Link from "next/link";
import { PLANS, formatPrice } from "@/lib/plans";
import { startCheckout, ApiError } from "@/lib/client";
import { AuthModal, ConsentBox } from "@/components/Modals";

export default function Pricing() {
  const [loading, setLoading] = useState("");
  const [err, setErr] = useState("");
  const [authFor, setAuthFor] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [consentErr, setConsentErr] = useState(false);

  async function buy(plan: string) {
    setErr("");
    if (!consent) {
      setConsentErr(true);
      document.getElementById("consent-box")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setLoading(plan);
    try {
      await startCheckout(plan, true);
    } catch (e) {
      if (e instanceof ApiError && e.login) setAuthFor(plan);
      else setErr(e instanceof Error ? e.message : "Erreur");
      setLoading("");
    }
  }

  return (
    <>
      {err && <div className="alert alert-error" style={{ maxWidth: 600, margin: "0 auto 20px" }}>{err}</div>}
      <div className="price-card" style={{ marginBottom: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <strong style={{ color: "var(--ink)", fontSize: "1.1rem" }}>Gratuit — 0 €</strong>
          <div className="muted" style={{ fontSize: ".92rem" }}>1 CV, 4 modèles, 5 générations IA par jour, PDF avec mention « CV Express ».</div>
        </div>
        <Link href="/editeur" className="btn btn-outline">Commencer gratuitement</Link>
      </div>
      <div className="pricing">
        {PLANS.map((p) => (
          <div key={p.id} className={`price-card ${p.highlight ? "hl" : ""}`}>
            {p.badge && <span className="tag">{p.badge}</span>}
            <strong style={{ color: "var(--ink)" }}>{p.name}</strong>
            <div className="price">
              {formatPrice(p.price)} <small>{p.label}</small>
            </div>
            <div className="muted" style={{ fontSize: ".85rem", minHeight: 20 }}>{p.perMonth}</div>
            <p className="muted" style={{ fontSize: ".9rem", marginTop: 10 }}>{p.description}</p>
            <ul>
              <li>30 modèles de CV + 6 de lettres</li>
              <li>PDF illimités sans mention</li>
              <li>IA illimitée</li>
              <li>CV adapté à chaque offre</li>
              <li>Traduction en anglais</li>
              <li>Analyse ATS approfondie</li>
              <li>Préparation d&apos;entretien</li>
              <li>CV en ligne partageable</li>
            </ul>
            <button className={`btn btn-block ${p.highlight ? "btn-primary" : "btn-outline"}`} onClick={() => buy(p.id)} disabled={!!loading}>
              {loading === p.id ? <span className="spinner" /> : p.mode === "payment" ? "Acheter le pass" : "Choisir cette offre"}
            </button>
          </div>
        ))}
      </div>
      <div id="consent-box" style={{ maxWidth: 720, margin: "20px auto 0" }}>
        <ConsentBox checked={consent} onChange={(v) => { setConsent(v); setConsentErr(false); }} error={consentErr} />
      </div>
      {authFor && (
        <AuthModal
          onClose={() => setAuthFor(null)}
          onDone={() => {
            const plan = authFor;
            setAuthFor(null);
            buy(plan);
          }}
        />
      )}
    </>
  );
}
