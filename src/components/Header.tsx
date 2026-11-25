"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

type U = { name: string | null; email: string; premium: boolean; admin?: boolean } | null;

export default function Header({ user }: { user: U }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  if (path?.startsWith("/editeur") || path?.startsWith("/lettre/editeur")) return null;
  return (
    <header className="site-header no-print">
      <div className="container">
        <Link href="/" className="logo" onClick={() => setOpen(false)}>
          <span className="logo-mark">CV</span> CV Express
        </Link>
        <nav className={`nav ${open ? "open" : ""}`} onClick={() => setOpen(false)}>
          <Link href="/modeles">Modèles de CV</Link>
          <Link href="/lettre">Lettre de motivation</Link>
          <Link href="/analyse">Analyse ATS</Link>
          <Link href="/exemples">Exemples</Link>
          <Link href="/conseils">Conseils</Link>
          <Link href="/tarifs">Tarifs</Link>
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              {user.admin && <Link href="/admin" className="btn btn-primary btn-sm">⚙ Admin</Link>}
              {!user.premium && !user.admin && (
                <Link href="/tarifs" className="btn btn-gold btn-sm hide-sm">★ Premium</Link>
              )}
              <Link href="/compte" className="btn btn-outline btn-sm">Mon espace</Link>
            </>
          ) : (
            <>
              <Link href="/connexion" className="btn btn-ghost btn-sm hide-sm">Connexion</Link>
              <Link href="/editeur" className="btn btn-primary btn-sm">Créer mon CV</Link>
            </>
          )}
          <button className="burger" aria-label="Menu" onClick={() => setOpen(!open)}>☰</button>
        </div>
      </div>
    </header>
  );
}
