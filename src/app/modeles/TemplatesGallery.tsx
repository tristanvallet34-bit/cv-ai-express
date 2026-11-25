"use client";
import Link from "next/link";
import { useState } from "react";
import CVThumb from "@/components/cv/CVThumb";
import { TEMPLATES } from "@/lib/cv/templates";
import { demoCV } from "@/lib/cv/examples";

const CATS = ["Tous", "Gratuits", "Moderne", "Classique", "Créatif", "Minimaliste", "Cadre", "ATS"] as const;

export default function TemplatesGallery() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("Tous");
  const dev = demoCV();
  const list = TEMPLATES.filter((t) => cat === "Tous" || (cat === "Gratuits" ? t.free : t.category === cat));
  return (
    <>
      <div className="filters">
        {CATS.map((c) => (
          <button key={c} className={`chip ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <div className="tpl-grid">
        {list.map((t) => (
          <Link key={t.id} href={`/editeur?modele=${t.id}`} className="tpl-card">
            <CVThumb data={{ ...dev, settings: { ...dev.settings, template: t.id } }} width={260} />
            <div className="tpl-meta">
              <strong>{t.name}</strong>
              {t.free ? <span className="badge badge-green">Gratuit</span> : <span className="badge badge-gold">★ Premium</span>}
            </div>
            <span className="muted" style={{ fontSize: ".88rem", marginTop: -6 }}>{t.description}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
