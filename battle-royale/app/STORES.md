# Publier Toon Royale sur le Play Store et l'App Store

Ce dossier emballe le jeu web dans une vraie application avec [Capacitor](https://capacitorjs.com).
Three.js est embarqué dans l'appli : le jeu fonctionne **sans connexion**. Seules les polices Google
sont chargées en ligne ; hors ligne, des polices de secours prennent le relais.

Dans l'appli, le jeu est **verrouillé en paysage**, la barre d'état est masquée et les vibrations
passent par le moteur haptique natif (plugin `@capacitor/haptics`).

## Ce qu'il te faut
| | Android (Play Store) | iOS (App Store) |
|---|---|---|
| Ordinateur | Windows, Mac ou Linux | **Mac obligatoire** (ou un service cloud comme Codemagic) |
| Logiciel | [Android Studio](https://developer.android.com/studio) | Xcode (Mac App Store) |
| Compte | Google Play Console : **25 $ une fois** | Apple Developer Program : **99 $ par an** |
| Node.js | version 18 ou plus | version 18 ou plus |

## 1. Préparer le projet (une seule fois)
```bash
cd battle-royale/app
npm install
npm run add:android     # crée le dossier android/ et force le paysage
npm run add:ios         # (sur Mac) crée le dossier ios/ et force le paysage
```
Avant tout, change l'identifiant `appId` dans `capacitor.config.json` (par exemple `com.tonnom.toonroyale`).
Il doit être unique sur les stores et ne pourra plus changer après la première publication.

## 2. Après chaque modification du jeu
```bash
npm run android   # recopie le jeu, synchronise et ouvre Android Studio
npm run ios       # pareil pour Xcode (sur Mac)
```

## 3. Android → Play Store
1. Dans Android Studio : **Build › Generate Signed App Bundle / APK › Android App Bundle**.
2. Crée une clé de signature (fichier `.jks`). **Garde-la précieusement** : sans elle, tu ne pourras plus mettre l'appli à jour.
3. Sur la [Play Console](https://play.google.com/console) : *Créer une application* → envoie le fichier `.aab` en **test interne** d'abord.
4. Remplis la fiche (textes ci-dessous), la classification du contenu, le questionnaire « Sécurité des données » et la politique de confidentialité.
5. Passe en test fermé avec quelques amis, puis en production.

Pour tester sur ton téléphone sans passer par le store : branche-le en USB (mode développeur activé) puis clique sur ▶ dans Android Studio.

## 4. iOS → App Store (sur Mac)
1. Dans Xcode : choisis ton équipe dans *Signing & Capabilities*.
2. Ajoute l'icône 1024 × 1024 (`../icons/icon-1024.png`) dans *Assets › AppIcon*.
3. **Product › Archive**, puis **Distribute App › App Store Connect**.
4. Sur [App Store Connect](https://appstoreconnect.apple.com) : teste avec **TestFlight**, puis soumets à la validation.

Apple refuse parfois les applis qui ne sont « qu'un site web ». Toon Royale a plusieurs atouts pour passer :
il fonctionne hors ligne, utilise les vibrations natives et a sa propre interface de jeu complète.

## Textes prêts à l'emploi pour la fiche du store
**Nom** : Toon Royale

**Sous-titre (30 caractères)** : Battle royale cartoon en folie

**Description courte** : Saute du Bus Volant, ramasse des armes et des Gags délirants, et sois le dernier debout !

**Description longue** :
> Toon Royale, c'est le battle royale le plus drôle de ta poche ! Saute du Bus Volant au-dessus d'une île
> cartoon, plane jusqu'au sol et fouille maisons, coffres et ravitaillements. Pas de construction : que du
> tir, de la glisse et des **Gags** — fais tomber un piano sur tes adversaires, pose une peau de banane,
> cache-toi dans un carton ou envole-toi avec un ballon !
>
> • 50 joueurs en Solo, Duo ou Escouade (avec des coéquipiers IA), Mêlée générale 20 contre 20, mode Express et Mode du jour
> • Une île vivante : désert de bonbons, marais, rivière, château du Roi Pingouin, coffre-fort à ouvrir avec une clé, marchands
> • Pluie de météores, tempête dorée, champignons rebondissants, karts et aéroglisseurs
> • Armes de commune à mythique, lance-pétards, arbalète, grappin
> • Passe de saison, quêtes, succès, mode classé et des dizaines d'objets à collectionner
> • Graphismes cartoon optimisés pour tous les téléphones, jouable hors ligne

**Mots-clés** : battle royale, cartoon, tir, survie, bots, hors ligne, action

**Catégorie** : Jeux › Action — **Âge conseillé** : 12+ (violence cartoon, sans sang)

## Politique de confidentialité (modèle)
> Toon Royale ne collecte aucune donnée personnelle. Ta progression (niveau, objets, statistiques) est
> enregistrée uniquement sur ton appareil. Le jeu n'affiche aucune publicité et ne propose aucun achat
> intégré. Contact : [ton adresse e-mail].

Héberge ce texte sur une page web (par exemple GitHub Pages) et donne son lien aux deux stores.

## Captures d'écran
Les stores demandent des captures en paysage. Lance le jeu sur ton téléphone et fais des captures
pendant une partie : le saut du bus, un combat, la tempête, la victoire avec les confettis.
