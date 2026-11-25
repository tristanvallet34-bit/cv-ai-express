import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES } from "@/lib/articles";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  return a ? { title: a.title, description: a.excerpt } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) notFound();
  const others = ARTICLES.filter((x) => x.slug !== slug).slice(0, 3);
  return (
    <article className="section">
      <div className="prose">
        <Link href="/conseils" className="muted">← Tous les conseils</Link>
        <p style={{ marginTop: 16 }}><span className="badge">{a.category}</span> <span className="muted" style={{ fontSize: ".85rem" }}>{a.minutes} min de lecture</span></p>
        <h1 style={{ fontSize: "2.4rem" }}>{a.title}</h1>
        <p style={{ fontSize: "1.15rem" }} className="muted">{a.excerpt}</p>
        {a.body.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p.map((p, i) => <p key={i}>{p}</p>)}
            {s.list && <ul>{s.list.map((l) => <li key={l}>{l}</li>)}</ul>}
          </section>
        ))}
        <div className="cta-band" style={{ marginTop: 50, padding: "36px 28px" }}>
          <h2 style={{ fontSize: "1.6rem", marginTop: 0 }}>Mettez ces conseils en pratique</h2>
          <p>Créez votre CV avec nos modèles et l&apos;assistant IA, gratuitement.</p>
          <Link href="/editeur" className="btn" style={{ background: "#fff", color: "var(--brand)" }}>Créer mon CV →</Link>
        </div>
        <h3 style={{ marginTop: 40 }}>À lire aussi</h3>
        <ul>{others.map((o) => <li key={o.slug}><Link href={`/conseils/${o.slug}`}>{o.title}</Link></li>)}</ul>
      </div>
    </article>
  );
}
