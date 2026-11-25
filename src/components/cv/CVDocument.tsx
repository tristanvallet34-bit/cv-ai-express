import type { CSSProperties, ReactNode } from "react";
import type { CVData, SectionKey } from "@/lib/cv/types";
import { getTemplate, fontCss, type Template } from "@/lib/cv/templates";
import { LABELS } from "@/lib/cv/labels";
import { fmtRange, fmtDate, fullName, toLines, stripBullet, isBulletText } from "@/lib/cv/utils";

const SIDE_KEYS: SectionKey[] = ["skills", "languages", "certifications", "interests"];
const SIDEBAR_LAYOUTS = ["sidebar-left", "sidebar-right", "card", "split", "banner"];

type Ctx = { d: CVData; t: Template; lang: "fr" | "en"; side: boolean };

function Rich({ text }: { text: string }) {
  if (!text) return null;
  if (isBulletText(text)) {
    return (
      <ul className="cv-bullets">
        {toLines(text).map((l, i) => (
          <li key={i}>{stripBullet(l)}</li>
        ))}
      </ul>
    );
  }
  return <p className="cv-text">{text}</p>;
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <h3 className="cv-heading">
      <span>{children}</span>
    </h3>
  );
}

function hasContent(key: SectionKey, d: CVData) {
  switch (key) {
    case "summary": return !!d.summary.trim();
    case "interests": return !!d.interests.trim();
    case "custom": return d.custom.items.length > 0;
    default: return (d[key] as unknown[]).length > 0;
  }
}

function Section({ k, ctx }: { k: SectionKey; ctx: Ctx }) {
  const { d, t, lang, side } = ctx;
  const L = LABELS[lang];
  const title = k === "custom" ? d.custom.title || L.custom : L[k];
  let body: ReactNode = null;

  switch (k) {
    case "summary":
      body = <p className="cv-text cv-summary">{d.summary}</p>;
      break;
    case "experiences":
      body = d.experiences.map((e) => (
        <div className="cv-item" key={e.id}>
          <div className="cv-item-head">
            <div>
              <div className="cv-item-title">{e.role}</div>
              <div className="cv-item-sub">{[e.company, e.city].filter(Boolean).join(" · ")}</div>
            </div>
            <div className="cv-item-date">{fmtRange(e.start, e.end, e.current, lang)}</div>
          </div>
          <Rich text={e.description} />
        </div>
      ));
      break;
    case "education":
      body = d.education.map((e) => (
        <div className="cv-item" key={e.id}>
          <div className="cv-item-head">
            <div>
              <div className="cv-item-title">{e.degree}</div>
              <div className="cv-item-sub">{[e.school, e.city].filter(Boolean).join(" · ")}</div>
            </div>
            <div className="cv-item-date">{fmtRange(e.start, e.end, false, lang)}</div>
          </div>
          <Rich text={e.description} />
        </div>
      ));
      break;
    case "projects":
      body = d.projects.map((p) => (
        <div className="cv-item" key={p.id}>
          <div className="cv-item-title">
            {p.name} {p.link && <span className="cv-link">— {p.link}</span>}
          </div>
          <Rich text={p.description} />
        </div>
      ));
      break;
    case "custom":
      body = d.custom.items.map((c) => (
        <div className="cv-item" key={c.id}>
          <div className="cv-item-head">
            <div>
              <div className="cv-item-title">{c.title}</div>
              {c.subtitle && <div className="cv-item-sub">{c.subtitle}</div>}
            </div>
            <div className="cv-item-date">{fmtDate(c.date, lang)}</div>
          </div>
          <Rich text={c.description} />
        </div>
      ));
      break;
    case "certifications":
      body = d.certifications.map((c) => (
        <div className="cv-mini" key={c.id}>
          <strong>{c.name}</strong>
          <span>{[c.issuer, c.date].filter(Boolean).join(" · ")}</span>
        </div>
      ));
      break;
    case "languages":
      body = (
        <div className={side ? "cv-langs side" : "cv-langs"}>
          {d.languages.map((l) => (
            <div className="cv-lang" key={l.id}>
              <strong>{l.name}</strong>
              {l.level && <span>{l.level}</span>}
            </div>
          ))}
        </div>
      );
      break;
    case "interests":
      body = <p className="cv-text">{d.interests}</p>;
      break;
    case "skills": {
      if (t.layout === "ats") {
        body = <p className="cv-text">{d.skills.map((s) => s.name).join(" · ")}</p>;
      } else if (t.headings === "pill" || !d.skills.some((s) => s.level > 0)) {
        body = (
          <div className="cv-pills">
            {d.skills.map((s) => (
              <span className="cv-pill" key={s.id}>{s.name}</span>
            ))}
          </div>
        );
      } else {
        body = (
          <div className="cv-skills">
            {d.skills.map((s) => (
              <div className="cv-skill" key={s.id}>
                <span>{s.name}</span>
                {s.level > 0 && (
                  <span className="cv-bar">
                    <span style={{ width: `${s.level * 20}%` }} />
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      }
      break;
    }
  }

  return (
    <section className={`cv-section cv-s-${k}`}>
      <Heading>{title}</Heading>
      <div className="cv-section-body">{body}</div>
    </section>
  );
}

function Contact({ d, lang, withTitle }: { d: CVData; lang: "fr" | "en"; withTitle?: boolean }) {
  const p = d.personal;
  const rows = [
    ["✉", p.email],
    ["☎", p.phone],
    ["⌂", p.city],
    ["in", p.linkedin],
    ["🔗", p.website],
    ["•", p.extra],
  ].filter(([, v]) => v);
  if (!rows.length) return null;
  return (
    <section className="cv-section cv-contact">
      {withTitle && <Heading>{LABELS[lang].contact}</Heading>}
      <ul>
        {rows.map(([icon, v]) => (
          <li key={icon}>
            <span className="cv-ico" aria-hidden>{icon}</span>
            <span>{v}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Photo({ d, initials }: { d: CVData; initials?: boolean }) {
  if (!d.settings.showPhoto) return null;
  if (d.personal.photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="cv-photo" src={d.personal.photo} alt="" />;
  }
  if (!initials) return null;
  const ini = `${d.personal.firstName[0] || ""}${d.personal.lastName[0] || ""}`.toUpperCase();
  if (!ini) return null;
  return <div className="cv-photo cv-initials">{ini}</div>;
}

function NameBlock({ d }: { d: CVData }) {
  return (
    <div className="cv-name-block">
      <h1 className="cv-name">
        <span className="cv-first">{d.personal.firstName || "Prénom"}{" "}</span>
        <span className="cv-last">{d.personal.lastName || "Nom"}</span>
      </h1>
      {d.personal.title && <div className="cv-title">{d.personal.title}</div>}
    </div>
  );
}

function InlineContact({ d }: { d: CVData }) {
  const p = d.personal;
  const items = [p.email, p.phone, p.city, p.linkedin, p.website, p.extra].filter(Boolean);
  if (!items.length) return null;
  return (
    <div className="cv-inline-contact">
      {items.map((v, i) => (
        <span key={i}>{v}</span>
      ))}
    </div>
  );
}

export default function CVDocument({ data, watermark, premiumLock }: { data: CVData; watermark?: boolean; premiumLock?: boolean }) {
  const t = getTemplate(data.settings.template);
  const lang = data.settings.lang || "fr";
  const color = data.settings.color || t.color;
  const font = fontCss(data.settings.font || t.font);
  const order = data.settings.order.filter((k) => !data.settings.hidden.includes(k) && hasContent(k, data));
  const twoCol = SIDEBAR_LAYOUTS.includes(t.layout);
  const sideKeys = twoCol ? order.filter((k) => SIDE_KEYS.includes(k)) : [];
  const mainKeys = twoCol ? order.filter((k) => !SIDE_KEYS.includes(k)) : order;

  const style = {
    "--accent": color,
    "--font": font,
    "--fs": data.settings.fontScale || 1,
    "--sp": data.settings.spacing || 1,
  } as CSSProperties;

  const cls = ["cv", `cv-l-${t.layout}`, `cv-h-${t.headings || "line"}`, `cv-t-${t.id}`, t.dark ? "cv-dark" : ""].join(" ");
  const main = (ks: SectionKey[]) => ks.map((k) => <Section key={k} k={k} ctx={{ d: data, t, lang, side: false }} />);
  const side = (ks: SectionKey[]) => ks.map((k) => <Section key={k} k={k} ctx={{ d: data, t, lang, side: true }} />);

  let content: ReactNode;
  switch (t.layout) {
    case "sidebar-left":
    case "sidebar-right":
    case "card":
      content = (
        <div className="cv-grid">
          <aside className="cv-side">
            <Photo d={data} initials />
            {t.layout !== "card" ? null : <NameBlock d={data} />}
            <Contact d={data} lang={lang} withTitle />
            {side(sideKeys)}
          </aside>
          <main className="cv-main">
            {t.layout !== "card" && <NameBlock d={data} />}
            {main(mainKeys)}
          </main>
        </div>
      );
      break;
    case "banner":
      content = (
        <>
          <header className="cv-banner">
            <Photo d={data} />
            <NameBlock d={data} />
          </header>
          <InlineContact d={data} />
          <div className="cv-grid">
            <main className="cv-main">{main(mainKeys)}</main>
            <aside className="cv-side">{side(sideKeys)}</aside>
          </div>
        </>
      );
      break;
    case "split":
      content = (
        <>
          <header className="cv-header">
            <NameBlock d={data} />
            <Photo d={data} />
          </header>
          <div className="cv-grid">
            <aside className="cv-side">
              <Contact d={data} lang={lang} withTitle />
              {side(sideKeys)}
            </aside>
            <main className="cv-main">{main(mainKeys)}</main>
          </div>
        </>
      );
      break;
    default:
      content = (
        <>
          <header className="cv-header">
            <Photo d={data} />
            <div className="cv-header-text">
              <NameBlock d={data} />
              <InlineContact d={data} />
            </div>
          </header>
          <main className="cv-main">{main(mainKeys)}</main>
        </>
      );
  }

  return (
    <div className={cls} style={style} lang={lang}>
      {content}
      {watermark && <div className="cv-footer-mark">CV créé avec CV Express — cv-express.fr</div>}
      {premiumLock && (
        <div className="cv-lock" aria-hidden>
          <span>MODÈLE PREMIUM</span>
        </div>
      )}
      <span className="sr-only">{fullName(data)}</span>
    </div>
  );
}
