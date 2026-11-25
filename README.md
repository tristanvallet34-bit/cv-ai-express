# CV Express — générateur de CV avec IA et abonnements

Site complet de création de CV et de lettres de motivation, monétisé par abonnements Stripe.

## Fonctionnalités

- **Éditeur de CV** en temps réel : 22 modèles (4 gratuits, 18 Premium), couleurs, 13 polices, taille du texte, espacement, sections réordonnables/masquables, photo, titres FR/EN, indicateur de saut de page, sauvegarde automatique.
- **Export PDF** vectoriel (texte sélectionnable, compatible ATS), export texte et JSON, import JSON.
- **Assistant IA** (Claude) : génération du profil, suggestion et reformulation des missions, suggestions de compétences. Sans clé API, un générateur local prend le relais.
- **Lettres de motivation** : 6 modèles assortis aux CV, rédaction IA à partir du CV et de l'offre, 5 tons.
- **Analyse ATS** : score, points forts, conseils, mots-clés manquants face à une offre.
- **Préparation d'entretien** IA (Premium).
- **CV en ligne** partageable par lien public (Premium) avec compteur de vues.
- **Espace client** : documents, duplication, gestion/résiliation de l'abonnement, suppression du compte (RGPD).
- **Admin** (`/admin`) : utilisateurs, abonnés, MRR, revenus, derniers paiements.
- **SEO** : 10 exemples de CV par métier, 6 guides, sitemap, robots, métadonnées.
- **Pages légales** : mentions légales, CGV/CGU, confidentialité (modèles à compléter).

## Monétisation

| Offre | Prix | Type |
|---|---|---|
| Gratuit | 0 € | 1 CV, 4 modèles, 5 IA/jour, PDF avec mention |
| Pass 7 jours | 3,90 € | paiement unique, sans renouvellement |
| Premium mensuel | 9,90 €/mois | abonnement |
| Premium 3 mois | 23,90 € | abonnement |
| Premium annuel | 59,90 €/an | abonnement |

Les prix se modifient dans `src/lib/plans.ts`. Les produits sont créés à la volée par Stripe Checkout : **aucun produit à créer dans Stripe**.

## Démarrage local

```bash
npm install
cp .env.example .env      # puis remplissez AUTH_SECRET (openssl rand -base64 32)
npx prisma db push        # crée la base SQLite
npm run dev               # http://localhost:3000
```

Avec `DEMO_MODE="true"` et sans clé Stripe, les boutons d'achat activent Premium sans paiement (pour tester). **Ne jamais activer en production.**

## Mise en production (checklist)

1. **Base de données** : créez une base PostgreSQL (Neon, Supabase, Vercel Postgres…). Dans `prisma/schema.prisma`, remplacez `provider = "sqlite"` par `provider = "postgresql"`, puis `DATABASE_URL="postgres://..." npx prisma db push`.
2. **Hébergement** : importez le dépôt sur Vercel (ou Railway, Render…) et renseignez les variables d'environnement de `.env.example` :
   - `NEXT_PUBLIC_SITE_URL` (ex. `https://cv-express.fr`), `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAILS` (votre email)
   - `ANTHROPIC_API_KEY` (console.anthropic.com) pour l'IA
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DEMO_MODE="false"`
3. **Stripe** :
   - Dashboard → Développeurs → Webhooks → ajoutez `https://VOTRE-DOMAINE/api/stripe/webhook` avec les événements `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`. Copiez le secret de signature dans `STRIPE_WEBHOOK_SECRET`.
   - Paramètres → Portail client : activez-le (résiliation, changement de carte, factures).
   - Paramètres → Checkout : renseignez l'URL de vos CGV (requis pour la case d'acceptation).
   - Testez d'abord avec les clés `sk_test_…` et la carte `4242 4242 4242 4242`.
4. **Légal** : complétez `src/lib/config.ts` (raison sociale, SIRET, adresse, TVA, hébergeur) et le médiateur de la consommation dans `src/app/cgv/page.tsx`. Faites relire CGV et confidentialité par un professionnel.
5. Créez votre compte avec l'email indiqué dans `ADMIN_EMAILS` pour accéder à `/admin`.

## Structure

```
src/app/            pages et routes API (Next.js 16, App Router)
src/components/cv/  rendu des CV (CVDocument) et miniatures
src/components/editor/  éditeurs de CV et de lettres
src/lib/cv/         types, modèles, exemples, utilitaires
src/lib/ai.ts       intégration Claude (+ ai-local.ts en secours)
src/lib/plans.ts    offres et limites
prisma/schema.prisma
```

Note : `battle-royale/` et `CV-IA-Express.zip` sont d'anciens fichiers du dépôt, non utilisés par le site.
