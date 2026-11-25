import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section center">
      <div className="container narrow">
        <div style={{ fontSize: "4rem" }}>🧭</div>
        <h1>Page introuvable</h1>
        <p className="muted">Cette page n&apos;existe pas ou a été déplacée.</p>
        <Link href="/" className="btn btn-primary">Retour à l&apos;accueil</Link>
      </div>
    </section>
  );
}
