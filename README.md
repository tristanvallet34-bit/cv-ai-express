# CV Express — générateur de CV avec IA et abonnements

Site complet de création de CV et de lettres de motivation, monétisé par abonnements Stripe.

## Fonctionnalités

- **Éditeur de CV** en temps réel : 30 modèles (4 gratuits, 26 Premium), couleurs, 13 polices, taille du texte, espacement, sections réordonnables/masquables, photo, titres FR/EN, indicateur de saut de page, **annuler/rétablir**, **score de qualité en direct**, correcteur orthographique, sauvegarde automatique.
- **Import intelligent** : importez un ancien CV en PDF ou votre profil LinkedIn (PDF), l'IA remplit toutes les rubriques.
- **CV adapté à une offre** (Premium) : l'IA réécrit profil, compétences et missions pour coller à l'annonce.
- **Traduction en anglais** en un clic (Premium).
- **Export PDF** vectoriel multi-pages (texte sélectionnable, compatible ATS), export texte et JSON.
- **Assistant IA** (Claude) : profil, missions, compétences. Sans clé API, un générateur local prend le relais.
- **Lettres de motivation** : 6 modèles, rédaction IA à partir du CV et de l'offre, 5 tons.
- **Analyse ATS**, **préparation d'entretien** (Premium), **CV en ligne** partageable (Premium).
- **Comptes** : inscription, connexion, **mot de passe oublié par email**, emails de bienvenue et de confirmation Premium, suppression du compte (RGPD).
- **Admin** (`/admin`) : utilisateurs, abonnés, MRR, revenus, et **connexion Stripe en un clic** (`/admin/stripe`).
- **SEO** : 10 exemples de CV par métier, 6 guides, sitemap, image de partage, données structurées.
- **Pages légales** et formulaire de contact.

## Monétisation

| Offre | Prix | Type |
|---|---|---|
| Gratuit | 0 € | 1 CV, 4 modèles, 5 IA/jour, PDF avec mention |
| Pass 7 jours | 2,90 € | paiement unique, sans renouvellement |
| Premium mensuel | 5,90 €/mois | abonnement |
| Premium 3 mois | 12,90 € (4,30 €/mois) | abonnement |
| Premium annuel | 29,90 €/an (2,49 €/mois) | abonnement |

Les prix se modifient dans `src/lib/plans.ts`. Les produits sont créés à la volée par Stripe Checkout : **aucun produit à créer dans Stripe**.

## Démarrage local

```bash
npm install
cp .env.example .env      # puis remplissez AUTH_SECRET (openssl rand -base64 32)
npx prisma db push        # crée la base SQLite
npm run dev               # http://localhost:3000
```

Avec `DEMO_MODE="true"` et sans clé Stripe, les boutons d'achat activent Premium sans paiement (pour tester). **Ne jamais activer en production.**

## Mise en ligne pas à pas (environ 20 minutes, gratuit pour démarrer)

1. **Hébergement** : créez un compte sur [vercel.com](https://vercel.com) avec votre GitHub, puis « Add New → Project » et importez ce dépôt.
2. **Base de données** : dans le projet Vercel, onglet **Storage → Create Database → Neon (Postgres)** → « Connect ». La variable `DATABASE_URL` est ajoutée automatiquement ; les tables sont créées automatiquement à chaque déploiement.
3. **Variables d'environnement** (Settings → Environment Variables) :
   - `AUTH_SECRET` : une longue chaîne aléatoire (par ex. générée sur un générateur de mots de passe, 40 caractères). Ne la changez plus ensuite.
   - `ADMIN_EMAILS` : votre adresse email (celle avec laquelle vous créerez votre compte sur le site).
   - `NEXT_PUBLIC_SITE_URL` : l'adresse de votre site (ex. `https://cv-express.vercel.app` ou votre domaine).
   - `ANTHROPIC_API_KEY` (recommandé) : clé de [console.anthropic.com](https://console.anthropic.com) pour l'IA (import de CV, adaptation, traduction, lettres).
   - `RESEND_API_KEY` et `EMAIL_FROM` (recommandé) : clé de [resend.com](https://resend.com) pour les emails (mot de passe oublié…).
   Puis « Redeploy ».
4. **Créez votre compte** sur votre site avec l'email indiqué dans `ADMIN_EMAILS`.
5. **Connectez Stripe** : allez sur `https://votre-site/admin/stripe`, collez votre clé secrète Stripe (Dashboard Stripe → Développeurs → Clés API). Le site crée tout seul le webhook et le portail client.
   - Testez d'abord avec `sk_test_…` et la carte `4242 4242 4242 4242`, puis recommencez avec `sk_live_…` pour encaisser pour de vrai.
6. **Légal** : complétez `src/lib/config.ts` (raison sociale, SIRET, adresse, TVA) et le médiateur de la consommation dans `src/app/cgv/page.tsx`. Faites relire CGV et confidentialité par un professionnel avant d'encaisser.
7. (Optionnel) **Nom de domaine** : Vercel → Settings → Domains.

Les paiements arrivent sur votre solde Stripe puis sont virés automatiquement sur votre compte bancaire.

## Structure

```
src/app/            pages et routes API (Next.js 16, App Router)
src/components/cv/  rendu des CV (CVDocument) et miniatures
src/components/editor/  éditeurs de CV et de lettres
src/lib/cv/         types, modèles, exemples, utilitaires
src/lib/ai.ts       intégration Claude (+ ai-local.ts en secours)
src/lib/plans.ts    offres et limites
src/lib/stripe.ts   paiements + connexion Stripe depuis l'admin
scripts/prepare-db.mjs  choix SQLite/PostgreSQL et création des tables au build
prisma/schema.prisma
```

Note : `battle-royale/` et `CV-IA-Express.zip` sont d'anciens fichiers du dépôt, non utilisés par le site.
