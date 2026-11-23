# Serveur multijoueur de Toon Royale

Ce petit serveur Node.js fait deux choses :
1. il **sert le jeu** (les fichiers du dossier `battle-royale/`) ;
2. il **relaie les messages** entre les joueurs d'un salon privé (WebSocket sur `/ws`).

Le joueur qui crée le salon est l'**hôte** : son appareil fait tourner la partie complète (bots, tempête,
loot, dégâts). Les autres joueurs envoient leur position et leurs actions, l'hôte leur renvoie l'état du
monde environ 12 fois par seconde. Jusqu'à **10 joueurs humains** ; les places restantes sont des bots.

## Lancer en local (même Wi-Fi)
```bash
cd battle-royale/server
npm install
npm start            # → http://localhost:8080
```
Sur les téléphones connectés au même Wi-Fi, ouvre `http://IP-DE-TON-ORDI:8080`, puis **Amis › Créer un salon**
sur un appareil et **Rejoindre** avec le code sur les autres.

## Héberger en ligne (gratuit ou presque)
Le serveur tient dans un seul fichier et n'a qu'une dépendance (`ws`). Il fonctionne sur tout hébergeur Node.js
qui accepte les WebSockets, par exemple **Render**, **Railway** ou **Fly.io** :

| Réglage | Valeur |
|---|---|
| Dossier racine | `battle-royale/server` (le serveur lit les fichiers du jeu dans le dossier parent) |
| Commande d'installation | `npm install` |
| Commande de démarrage | `npm start` |
| Port | variable d'environnement `PORT` (lue automatiquement) |

Une fois en ligne, ouvre simplement l'adresse fournie par l'hébergeur : le jeu et le multijoueur sont au même endroit.

Si tu héberges le jeu ailleurs (GitHub Pages) et le serveur à part, renseigne l'adresse du serveur dans
**Amis › Serveur** sous la forme `wss://ton-serveur.onrender.com/ws`.

## Limites de cette première version
- L'hôte doit garder l'application ouverte : s'il quitte, la partie s'arrête pour tout le monde.
- Les invités ne peuvent pas conduire de véhicule ni utiliser les marchands (l'hôte, oui).
- Les positions des invités font foi (pas d'anti-triche) : c'est fait pour jouer entre amis.
- Le multijoueur ne marche pas dans l'aperçu claude.ai, qui bloque les connexions réseau.
