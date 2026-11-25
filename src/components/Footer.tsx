"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const path = usePathname();
  if (path?.startsWith("/editeur") || path?.startsWith("/lettre/editeur")) return null;
  return (
    <footer className="site-footer no-print">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="logo" style={{ color: "#fff" }}>
              <span className="logo-mark">CV</span> CV Express
            </Link>
            <p style={{ marginTop: 14, fontSize: ".92rem", maxWidth: 320 }}>
              Créez un CV professionnel et une lettre de motivation en quelques minutes, avec des modèles conçus pour passer les filtres des recruteurs.
            </p>
          </div>
          <div>
            <h4>Produit</h4>
            <ul>
              <li><Link href="/editeur">Créer un CV</Link></li>
              <li><Link href="/modeles">Modèles de CV</Link></li>
              <li><Link href="/lettre">Lettre de motivation</Link></li>
              <li><Link href="/analyse">Analyse ATS</Link></li>
              <li><Link href="/tarifs">Tarifs</Link></li>
            </ul>
          </div>
          <div>
            <h4>Ressources</h4>
            <ul>
              <li><Link href="/exemples">Exemples de CV</Link></li>
              <li><Link href="/conseils">Conseils carrière</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4>Légal</h4>
            <ul>
              <li><Link href="/mentions-legales">Mentions légales</Link></li>
              <li><Link href="/cgv">CGV / CGU</Link></li>
              <li><Link href="/confidentialite">Confidentialité</Link></li>
              <li><Link href="/compte">Résilier mon abonnement</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} CV Express. Tous droits réservés.</span>
          <span>Paiement sécurisé par Stripe · Résiliation en 1 clic</span>
        </div>
      </div>
    </footer>
  );
}
