# Toon Royale 🎯

Battle royale **cartoon, sans construction**, pensé d'abord pour le **téléphone** (tactile, paysage) et jouable aussi au clavier/souris.
100 % web (HTML5 + WebGL via Three.js) : aucune installation, aucun fichier image ou son externe — tout est généré par le code.

## Lancer le jeu
Servez le dossier avec n'importe quel serveur statique, puis ouvrez `index.html` :
```bash
cd battle-royale && python3 -m http.server 8000
# puis http://localhost:8000 (ou l'IP de ton ordi depuis le téléphone, même Wi-Fi)
```
Sur téléphone : menu du navigateur → « Ajouter à l'écran d'accueil » pour l'avoir comme une appli plein écran.
Fonctionne aussi tel quel sur GitHub Pages.

## Nouveautés v5 — d'après le document de conception
- **Code de sauvegarde** (Réglages › Sauvegarde) : copie ta progression et restaure-la sur un autre appareil.
- **Marchands ouverts aux invités** en multijoueur ; chaque joueur peut acheter chaque article une fois.
- **Qualité Économie** : le changement propose un bouton « Recharger maintenant ».
- **Fusil Givrant** : ralentit la cible de 45 % pendant 1,6 s (teinte bleue).
- **Gag Tarte à la crème** : aveugle l'adversaire 3 s (écran couvert de crème pour un joueur, les bots perdent leur cible).
- **Nouveau lieu : Fête Foraine** — grande roue, carrousel et stands.

## Nouveautés v4 — vue arcade et paysage intégral
- **Vue arcade** (par défaut) : caméra de dessus qui suit le joueur, **double joystick** — gauche pour bouger, droit pour viser et tirer en continu (une touche brève = tir rapide sur l'ennemi le plus proche). Visée automatique dans le cône du joystick, ligne de visée au sol, recul de caméra au sniper.
- **Découpe des bâtiments** : toits, étages et feuillages s'effacent autour du joueur pour voir à l'intérieur ; silhouette du joueur et des coéquipiers visible à travers les murs.
- **Paysage intégral** : téléphone tenu droit, toute l'appli (menus compris) est tournée pour rester en paysage.
- **Express** : 32 joueurs, zone de départ réduite, parties d'environ 4 minutes.
- La vue « Action » en 3e personne reste disponible dans Réglages › Vue de jeu.

## Nouveautés v3 — les 7 sprints
1. **Sensations** : musique dynamique qui monte avec l'action, annonceur (Doublé, Triplé, Top 10…) avec voix, pings (ennemi, objet, « on va là ») suivis par les coéquipiers IA, vibrations par événement, micro-pause à l'élimination, recul et rechargement visibles.
2. **Gags** : piano tombant, peau de banane, maillet géant, enclume, trou portable, ballon, boîte en carton. Nouvelles armes : arbalète, fusil rafale, grappin. Bombe rebondissante, fumigène, bulle bouclier. Caisses destructibles.
3. **Île vivante** : désert de bonbons, marais, rivière avec ponts et aéroglisseurs, coffre-fort à clé, marchands et pièces, pluie de météores, tempête dorée, boss Roi Pingouin (butin mythique).
4. **Modes** : Escouade (4), Mêlée générale 20 contre 20 avec réapparition, Entraînement, Mode du jour.
5. **Progression** : saisons de 30 jours, quêtes hebdo, étoiles et boutique (sans argent réel), emotes, sacs, motifs d'armes, traînées, 20 succès, mode classé Bronze → Légende.
6. **Technique** : détection du GPU, niveaux de détail, jeu hors ligne (service worker), projet Capacitor Android/iOS (`app/`, voir `app/STORES.md`).
7. **Multijoueur entre amis** : salons privés jusqu'à 10 joueurs + bots (`server/`, voir `server/README.md`).

## Nouveautés v2 — rendu « dessin animé » et gameplay
- **Cel-shading** (ombrage en aplats), **contours noirs** sur personnages, bâtiments, arbres et rochers
- **Post-traitement** (qualité Beau/Ultra) : bloom, étalonnage des couleurs, vignette, anti-crénelage FXAA
- **Océan animé** avec écume qui lèche les plages et reflets du soleil, **herbe dense** qui ondule au vent, arbres qui bougent
- **Ciel** avec soleil et halo, étoiles la nuit ; **4 ambiances** : matin rose, plein soleil, coucher de soleil, nuit étoilée
- **Tempête** animée avec éclairs, tonnerre et brouillard violet quand on est dedans
- **Glissade** (sprint + accroupi), **champignons rebondissants** qui propulsent dans les airs (planeur à nouveau)
- **Lance-Pétard** (roquettes à dégâts de zone, souffle qui projette)
- **Duo** : joueurs **à terre**, rampe, **réanimation** par le coéquipier (toi ou l'IA), élimination d'équipe
- **Visualisation des sons** (pas et tirs ennemis autour du réticule), cœur qui bat quand la santé est basse
- **Victoire** : ralenti, caméra qui tourne autour de ton perso qui danse, confettis
- **Écran titre**, lobby avec survol cinématique de l'île au coucher du soleil, jeu **uniquement en paysage**

## Ce qu'il y a dedans
**Partie**
- Bus Volant qui traverse l'île, saut, chute libre (plonge en regardant vers le bas), planeur auto ou manuel
- Île de ~900 m avec 9 lieux nommés (Centre-Ville, Port Bonbon, Usine Rouillée, Château Fou, Pic Glacé…), maisons visitables, entrepôts, ferme, château, forêts, rochers, buissons pour se cacher
- Tempête en 7 phases qui se resserre, dégâts croissants, prochain cercle affiché
- 49 bots (IA : atterrissage, loot, coffres, combat avec strafe/rechargement/choix d'arme, soin, fuite de la tempête, enquête au bruit des tirs) — 3 niveaux de difficulté
- Modes **Solo** (50), **Duo** (coéquipier IA qui te suit), **Express** (24 joueurs, tempête rapide)
- Ravitaillements largués (loot légendaire), coffres dorés, loot au sol, loot des éliminés
- Karts pilotables (qui peuvent renverser les adversaires)
- Mode spectateur après élimination

**Armes & objets**
- 6 armes : Pistolet, Mitraillette, Fusil d'assaut, Pompe, Sniper (lunette), Mini-Tornade
- 5 raretés (Commun → Légendaire), 4 types de munitions, rechargement, dispersion, recul, tirs à la tête
- Bandages, Trousse de soins, Mini/Méga-bouclier, Soda, Grenades — 5 emplacements d'inventaire

**HUD** : mini-carte + grande carte avec repère, boussole, fil d'éliminations, nombres de dégâts, indicateurs de direction des dégâts, marqueurs de tirs sur la carte, réticule dynamique, hitmarker

**Progression** : niveaux & XP, Passe Toon (30 paliers), 12 tenues + 6 planeurs à débloquer, 3 défis quotidiens, statistiques de carrière et historique (sauvegardés sur l'appareil)

**Paramètres** : qualité graphique (auto adaptative / économie / équilibré / beau / ultra), 30/60 FPS, champ de vision, sensibilités, inversion Y, assistance de visée, tir automatique, 2e bouton de tir, mode gaucher, sprint auto, ramassage auto, taille du HUD, zoom mini-carte, volume, musique, vibrations, pseudo, difficulté des bots

## Performances
- Décor statique fusionné en quelques draw calls, arbres/rochers/nuages instanciés
- Résolution dynamique : en mode « Auto » le jeu baisse la résolution si le téléphone n'atteint pas ses FPS
- Pools d'effets (aucune allocation en combat), culling par distance, IA cadencée (≈0,5 ms/frame pour 49 bots)

## Contrôles
| Téléphone | Clavier / souris |
|---|---|
| Glisser à gauche : se déplacer (à fond = sprint) | ZQSD / WASD, Maj = sprint |
| Glisser à droite : caméra | Souris (clic pour capturer) |
| Bouton rose : tirer (glisser dessus pour viser) | Clic gauche |
| Viser, sauter, accroupi, recharger, soin, danse | Clic droit, Espace, C, R, H, G |
| Touche un emplacement : changer d'objet | 1-5 / molette |
| Bouton jaune contextuel : ramasser / ouvrir / conduire | E (maintenir pour les coffres) |
| Touche la mini-carte : grande carte | M |

## Structure
```
index.html, style.css
js/view.js     paysage intégral (rotation de l'appli)
js/util.js     bruit, RNG, géométrie fusionnée, audio synthétisé
js/render.js   cel-shading, contours, ciel, océan, herbe, tempête, ambiances
js/post.js     bloom, étalonnage, vignette, FXAA
js/data.js     armes, objets, skins, modes, tempête, défis, paramètres, profil
js/world.js    génération de l'île, bâtiments, collisions, raycasts, mini-carte
js/fighter.js  modèles 3D, inventaire, tir, dégâts, éliminations
js/bot.js      IA des bots
js/effects.js  traçantes, impacts, explosions
js/input.js    joystick dynamique, boutons, clavier/souris
js/hud.js      interface en jeu
js/game.js     boucle, bus, tempête, loot, karts, caméra, rendu
js/ui.js       lobby, casier, passe, défis, carrière, réglages, écran de fin
js/feel.js     musique dynamique, annonceur, pings, vibrations
js/gags.js     Gags, pièges, bulles, fumigènes, grappin
js/events.js   pièces, marchands, coffre-fort, météores, tempête dorée, boss
js/modes.js    Escouade, Mêlée générale, Entraînement, Mode du jour
js/meta.js     saison, quêtes, étoiles, cosmétiques, succès, classé
js/net.js      multijoueur (hôte / invités)
server/        serveur relais WebSocket + hébergement du jeu
app/           emballage Capacitor pour le Play Store et l'App Store
```
