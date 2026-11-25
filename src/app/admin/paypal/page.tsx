import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { paypalStatus } from "@/lib/paypal";
import PaypalConnect from "./PaypalConnect";

export const metadata: Metadata = { title: "Connexion PayPal", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page() {
  const u = await getCurrentUser();
  if (!u || !isAdmin(u)) notFound();
  return (
    <div className="section-soft" style={{ minHeight: "80vh" }}>
      <div className="container narrow" style={{ padding: "40px 20px 70px" }}>
        <a href="/admin" className="muted">← Tableau de bord</a>
        <h1 style={{ fontSize: "2rem", marginTop: 10 }}>Encaisser avec PayPal</h1>
        <p className="muted">PayPal est le moyen de paiement du site : vos clients paient avec leur compte PayPal ou par carte bancaire via PayPal. Pass 7 jours et abonnements sont pris en charge, et l&apos;argent arrive sur votre compte PayPal.</p>
        <PaypalConnect initial={await paypalStatus()} envManaged={!!process.env.PAYPAL_CLIENT_ID} />
      </div>
    </div>
  );
}
