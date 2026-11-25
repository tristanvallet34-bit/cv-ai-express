import type { CSSProperties } from "react";
import type { LetterData } from "@/lib/letter/types";
import { getLetterTemplate, fmtLetterDate } from "@/lib/letter/types";
import { fontCss } from "@/lib/cv/templates";

export default function LetterDocument({ data, watermark, premiumLock }: { data: LetterData; watermark?: boolean; premiumLock?: boolean }) {
  const t = getLetterTemplate(data.settings.template);
  const style = {
    "--accent": data.settings.color || t.color,
    "--font": fontCss(data.settings.font || t.font),
  } as CSSProperties;
  const s = data.sender;
  const r = data.recipient;
  const senderBlock = (
    <div className="lt-sender">
      <strong className="lt-name">{s.name || "Prénom Nom"}</strong>
      {s.title && <div className="lt-title">{s.title}</div>}
      {s.address && <div>{s.address}</div>}
      {s.phone && <div>{s.phone}</div>}
      {s.email && <div>{s.email}</div>}
    </div>
  );
  const paragraphs = (data.body || "").split(/\n\s*\n/).filter((p) => p.trim());
  const bodyBlock = (
    <>
      <div className="lt-recipient">
        {r.company && <strong>{r.company}</strong>}
        {r.contact && <div>{r.contact}</div>}
        {r.address && <div className="lt-pre">{r.address}</div>}
      </div>
      <div className="lt-date">
        {data.city ? `${data.city}, le ` : "Le "}
        {fmtLetterDate(data.date)}
      </div>
      {data.subject && (
        <div className="lt-subject">
          <strong>Objet :</strong> {data.subject}
        </div>
      )}
      <div className="lt-body">
        {data.greeting && <p>{data.greeting}</p>}
        {paragraphs.length ? paragraphs.map((p, i) => <p key={i}>{p}</p>) : <p className="lt-placeholder">Le corps de votre lettre apparaîtra ici…</p>}
        {data.closing && <p>{data.closing}</p>}
      </div>
      <div className="lt-sign">{s.name}</div>
    </>
  );

  return (
    <div className={`letter lt-${t.id}`} style={style}>
      {t.id === "lateral" ? (
        <div className="lt-grid">
          <aside className="lt-side">{senderBlock}</aside>
          <main className="lt-main">{bodyBlock}</main>
        </div>
      ) : t.id === "bandeau" ? (
        <>
          <header className="lt-band">{senderBlock}</header>
          <main className="lt-main">{bodyBlock}</main>
        </>
      ) : (
        <main className="lt-main">
          <header className="lt-head">{senderBlock}</header>
          {bodyBlock}
        </main>
      )}
      {watermark && <div className="cv-footer-mark">Lettre créée avec CV Express — cv-express.fr</div>}
      {premiumLock && (
        <div className="cv-lock" aria-hidden>
          <span>MODÈLE PREMIUM</span>
        </div>
      )}
    </div>
  );
}
