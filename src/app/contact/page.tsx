import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/config";
import ContactForm from "./ContactForm";

export const metadata: Metadata = { title: "Contact" };

export default function Page() {
  return (
    <>
      <div className="page-head"><div className="container"><h1>Contact</h1><p>Une question, un problème de paiement, une suggestion ? Nous répondons sous 24 h ouvrées.</p></div></div>
      <section className="section">
        <div className="container narrow">
          <div className="card" style={{ marginBottom: 24 }}>
            <h3>Écrivez-nous</h3>
            <ContactForm />
          </div>
        </div>
        <div className="container narrow grid grid-2">
          <div className="card">
            <h3>✉️ Par email</h3>
            <p><a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a></p>
            <p className="muted">Indiquez l&apos;email de votre compte pour un traitement plus rapide.</p>
          </div>
          <div className="card">
            <h3>💡 Réponses rapides</h3>
            <ul>
              <li><Link href="/faq">Questions fréquentes</Link></li>
              <li><Link href="/compte">Résilier mon abonnement</Link></li>
              <li><Link href="/confidentialite">Mes données personnelles</Link></li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
