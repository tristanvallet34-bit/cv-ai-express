import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import NotAdmin from "@/components/NotAdmin";
import { stripeStatus } from "@/lib/stripe";
import StripeConnect from "./StripeConnect";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Connexion Stripe", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page() {
  const { user, admin } = await requireAdmin("/admin/stripe");
  if (!admin) return <NotAdmin email={user.email} />;
  if (!SITE.stripeEnabled) notFound();
  return (
    <div className="section-soft" style={{ minHeight: "80vh" }}>
      <div className="container narrow" style={{ padding: "40px 20px 70px" }}>
        <a href="/admin" className="muted">← Tableau de bord</a>
        <h1 style={{ fontSize: "2rem", marginTop: 10 }}>Encaisser les paiements avec Stripe</h1>
        <p className="muted">Collez votre clé secrète Stripe : le site vérifie la clé, crée automatiquement le webhook (synchronisation des abonnements) et le portail client (résiliation, factures). Les paiements arrivent directement sur votre compte Stripe, puis sur votre compte bancaire.</p>
        <StripeConnect initial={await stripeStatus()} envManaged={!!process.env.STRIPE_SECRET_KEY} />
      </div>
    </div>
  );
}
