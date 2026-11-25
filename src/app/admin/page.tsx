import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser, isAdmin, isPremium } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLANS, formatPrice, getPlan } from "@/lib/plans";
import { aiEnabled } from "@/lib/ai";
import { stripeStatus, demoMode } from "@/lib/stripe";
import Link from "next/link";

export const metadata: Metadata = { title: "Administration", robots: { index: false } };
export const dynamic = "force-dynamic";

function monthlyValue(planId: string) {
  const p = getPlan(planId);
  if (!p || p.mode !== "subscription") return 0;
  const months = p.interval === "year" ? 12 : p.intervalCount || 1;
  return p.price / months;
}

export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!me || !isAdmin(me)) notFound();
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 86400000);
  const [users, users30, resumes, letters, payments30, paymentsAll, activeSubs, recentUsers, recentPayments, ai30] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.resume.count(),
    prisma.letter.count(),
    prisma.payment.aggregate({ _sum: { amount: true }, _count: true, where: { createdAt: { gte: d30 } } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.user.findMany({ where: { subscriptionStatus: { in: ["active", "trialing"] } }, select: { plan: true } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
    prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 15, include: { user: { select: { email: true } } } }),
    prisma.aiUsage.aggregate({ _sum: { count: true }, where: { day: { gte: d30.toISOString().slice(0, 10) } } }),
  ]);
  const st = await stripeStatus();
  const demo = await demoMode();
  const passes = await prisma.user.count({ where: { premiumUntil: { gt: now } } });
  const mrr = activeSubs.reduce((s, u) => s + monthlyValue(u.plan), 0);
  const byPlan = PLANS.map((p) => ({ p, n: activeSubs.filter((u) => u.plan === p.id).length }));

  const stats = [
    ["Utilisateurs", users, `+${users30} sur 30 j`],
    ["Abonnés actifs", activeSubs.length, `${passes} pass 7 j en cours`],
    ["MRR estimé", formatPrice(Math.round(mrr)), `ARR ≈ ${formatPrice(Math.round(mrr * 12))}`],
    ["Revenus 30 j", formatPrice(payments30._sum.amount || 0), `${payments30._count} paiements`],
    ["Revenus totaux", formatPrice(paymentsAll._sum.amount || 0), "depuis le lancement"],
    ["Conversion", users ? `${(((activeSubs.length + passes) / users) * 100).toFixed(1)} %` : "—", "utilisateurs payants"],
    ["Documents", resumes + letters, `${resumes} CV · ${letters} lettres`],
    ["Générations IA 30 j", ai30._sum.count || 0, aiEnabled() ? "Claude actif" : "Mode local (sans clé)"],
  ];

  return (
    <div className="section-soft">
      <div className="container" style={{ padding: "40px 20px 70px" }}>
        <h1 style={{ fontSize: "2rem" }}>Tableau de bord</h1>
        <div className="alert alert-info" style={{ fontSize: ".88rem" }}>
          Stripe : {st.connected ? `✅ connecté (${st.mode === "live" ? "mode réel" : "mode test"})` : demo ? "⚠ mode démo (aucun paiement réel)" : "❌ non connecté"} · Webhook : {st.webhook === "ok" ? "✅" : "❌"} · IA Claude : {aiEnabled() ? "✅" : "❌ (générateur local)"} · Emails : {process.env.RESEND_API_KEY ? "✅" : "❌"}{" "}
          <Link href="/admin/stripe" className="btn btn-primary btn-sm" style={{ marginLeft: 8 }}>{st.connected ? "Gérer Stripe" : "Connecter mon compte Stripe →"}</Link>
        </div>
        <div className="grid grid-4" style={{ marginBottom: 30 }}>
          {stats.map(([l, v, s]) => (
            <div className="stat" key={String(l)}><span className="muted" style={{ fontSize: ".85rem" }}>{l}</span><b>{v}</b><span className="muted" style={{ fontSize: ".8rem" }}>{s}</span></div>
          ))}
        </div>
        <div className="grid grid-2" style={{ alignItems: "start" }}>
          <div className="card">
            <h3>Abonnements par offre</h3>
            <table className="table"><tbody>{byPlan.map(({ p, n }) => <tr key={p.id}><td>{p.name}</td><td>{n}</td></tr>)}</tbody></table>
            <h3 style={{ marginTop: 24 }}>Derniers paiements</h3>
            <table className="table">
              <thead><tr><th>Date</th><th>Client</th><th>Offre</th><th>Montant</th></tr></thead>
              <tbody>
                {recentPayments.map((p) => <tr key={p.id}><td>{p.createdAt.toLocaleDateString("fr-FR")}</td><td>{p.user?.email || "—"}</td><td>{getPlan(p.plan)?.name || p.plan || "—"}</td><td>{formatPrice(p.amount)}</td></tr>)}
                {recentPayments.length === 0 && <tr><td colSpan={4} className="muted">Aucun paiement pour l&apos;instant.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h3>Derniers inscrits</h3>
            <table className="table">
              <thead><tr><th>Date</th><th>Email</th><th>Statut</th></tr></thead>
              <tbody>
                {recentUsers.map((u) => <tr key={u.id}><td>{u.createdAt.toLocaleDateString("fr-FR")}</td><td>{u.email}</td><td>{isPremium(u) ? <span className="badge badge-gold">Premium</span> : <span className="badge">Gratuit</span>}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
