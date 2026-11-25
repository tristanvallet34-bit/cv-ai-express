import type { Metadata } from "next";
import Link from "next/link";
import LetterDocument from "@/components/LetterDocument";
import { LETTER_TEMPLATES, emptyLetter } from "@/lib/letter/types";

export const metadata: Metadata = {
  title: "Lettre de motivation générée par IA",
  description: "Générez une lettre de motivation personnalisée en 30 secondes à partir de votre CV et de l'offre d'emploi. 6 modèles assortis à votre CV.",
};

const sample = {
  ...emptyLetter(),
  sender: { name: "Inès Moreau", title: "Chef de projet marketing digital", email: "ines.moreau@email.fr", phone: "06 44 55 66 77", address: "Nantes" },
  recipient: { company: "Maison Lumen", contact: "Service Recrutement", address: "12 rue des Arts\n44000 Nantes" },
  city: "Nantes",
  subject: "Candidature au poste de Responsable marketing",
  body: "Votre engagement pour une décoration durable et la croissance remarquable de Maison Lumen m'ont donné l'envie de rejoindre votre équipe en tant que Responsable marketing.\n\nDepuis six ans, je pilote des campagnes multicanales orientées résultats. Chez MaisonVerte, j'ai notamment géré un budget média de 800 k€ et accompagné le lancement de trois gammes, avec une hausse de 22 % du chiffre d'affaires en ligne.\n\nVotre volonté d'accélérer sur le digital rejoint exactement mon expertise : acquisition, automatisation et pilotage par la donnée. Je serais heureuse de mettre cette énergie au service de vos prochains lancements.\n\nJe me tiens à votre disposition pour en échanger lors d'un entretien.",
};

export default function LettrePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Lettre de motivation IA</span>
            <h1>Une lettre <span className="grad">sur-mesure</span> en 30 secondes</h1>
            <p className="lead">Collez l&apos;offre d&apos;emploi, choisissez votre CV : l&apos;IA rédige une lettre personnalisée, structurée et convaincante. Modifiez-la librement puis téléchargez-la en PDF.</p>
            <div className="hero-cta">
              <Link href="/lettre/editeur" className="btn btn-primary btn-lg">Rédiger ma lettre →</Link>
            </div>
            <ul className="hero-points">
              <li>Basée sur votre vrai parcours</li>
              <li>Adaptée à l&apos;offre</li>
              <li>5 tons au choix</li>
            </ul>
          </div>
          <div className="hero-visual" aria-hidden>
            <div className="thumb-a">
              <div className="cv-thumb" style={{ width: 340, height: 481 }}>
                <div className="cv-thumb-inner" style={{ transform: `scale(${340 / 793.7})`, width: 793.7 }}>
                  <LetterDocument data={sample} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section section-soft">
        <div className="container">
          <div className="section-head"><h2>6 modèles assortis à vos CV</h2></div>
          <div className="tpl-grid">
            {LETTER_TEMPLATES.map((t) => (
              <Link key={t.id} href={`/lettre/editeur?modele=${t.id}`} className="tpl-card">
                <div className="cv-thumb" style={{ width: 240, height: 340 }}>
                  <div className="cv-thumb-inner" style={{ transform: `scale(${240 / 793.7})`, width: 793.7 }}>
                    <LetterDocument data={{ ...sample, settings: { template: t.id, color: "", font: "" } }} />
                  </div>
                </div>
                <div className="tpl-meta"><strong>{t.name}</strong>{t.free ? <span className="badge badge-green">Gratuit</span> : <span className="badge badge-gold">★ Premium</span>}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
