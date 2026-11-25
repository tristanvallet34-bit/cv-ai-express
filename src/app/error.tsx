"use client";
import Link from "next/link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="section center">
      <div className="container narrow">
        <div style={{ fontSize: "3.5rem" }}>😕</div>
        <h1>Oups, une erreur est survenue</h1>
        <p className="muted">Vos documents sont en sécurité. Réessayez dans un instant.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn btn-primary" onClick={reset}>Réessayer</button>
          <Link href="/" className="btn btn-outline">Accueil</Link>
        </div>
      </div>
    </section>
  );
}
