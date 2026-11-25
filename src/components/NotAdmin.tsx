import Link from "next/link";

export default function NotAdmin({ email }: { email: string }) {
  return (
    <section className="section">
      <div className="container narrow center">
        <div style={{ fontSize: "3rem" }}>🔒</div>
        <h1 style={{ fontSize: "1.8rem" }}>Espace réservé à l&apos;administrateur</h1>
        <p className="muted">Vous êtes connecté avec <strong>{email}</strong>, qui n&apos;est pas l&apos;adresse administrateur du site.</p>
        <p className="muted">Déconnectez-vous depuis « Mon espace », puis reconnectez-vous avec l&apos;adresse administrateur.</p>
        <Link href="/compte" className="btn btn-primary">Mon espace</Link>
      </div>
    </section>
  );
}
