// ============ TOON ROYALE — progression : saison, quêtes, étoiles, boutique, cosmétiques, succès, classé ============
'use strict';

const COSMETICS = {
  emotes: [
    { id: 'dance', n: 'Danse joyeuse', price: 0 }, { id: 'robot', n: 'Le Robot', price: 300 }, { id: 'disco', n: 'Disco Fever', price: 400 },
    { id: 'flip', n: 'Salto', price: 500 }, { id: 'wave', n: 'Coucou !', price: 150 }, { id: 'chicken', n: 'La Poule', price: 350 },
  ],
  packs: [
    { id: 'classic', n: 'Sac classique', price: 0 }, { id: 'jet', n: 'Jetpack rétro', price: 450 }, { id: 'teddy', n: 'Nounours', price: 300 },
    { id: 'guitar', n: 'Guitare rock', price: 400 }, { id: 'wings', n: 'Ailes d\'ange', price: 600 }, { id: 'shell', n: 'Carapace', price: 350 },
  ],
  wraps: [
    { id: 'none', n: 'Sans motif', price: 0, a: '#3a3645', b: '#5a556a' }, { id: 'gold', n: 'Or massif', price: 600, a: '#c99a1a', b: '#ffcf3f' },
    { id: 'candy', n: 'Bonbon', price: 300, a: '#ff6fa8', b: '#ffffff' }, { id: 'camo', n: 'Camouflage', price: 250, a: '#4a6b3a', b: '#7a8a4a' },
    { id: 'galaxy', n: 'Galaxie', price: 450, a: '#2b1e5c', b: '#bd63ff' }, { id: 'lava', n: 'Lave', price: 450, a: '#5a1a0a', b: '#ff6a1a' },
  ],
  trails: [
    { id: 'none', n: 'Aucune', price: 0 }, { id: 'rainbow', n: 'Arc-en-ciel', price: 400, c: ['#ff4f8b', '#ffcf3f', '#2ee6c8', '#3ea8ff', '#bd63ff'] },
    { id: 'stars', n: 'Étoiles', price: 300, c: ['#ffffff', '#ffe14a'] }, { id: 'fire', n: 'Flammes', price: 350, c: ['#ff7b2e', '#ffcf3f', '#ff3b00'] },
    { id: 'hearts', n: 'Cœurs', price: 250, c: ['#ff4f8b', '#ff9fc6'] },
  ],
};
const COS_TABS = { emotes: 'Emotes', packs: 'Sacs à dos', wraps: 'Motifs d\'armes', trails: 'Traînées' };

const ACHIEVEMENTS = [
  { id: 'firstkill', n: 'Premier sang', d: 'Élimine un adversaire', k: 'kills', v: 1 },
  { id: 'kills100', n: 'Chasseur', d: '100 éliminations au total', k: 'kills', v: 100 },
  { id: 'kills500', n: 'Terreur de l\'île', d: '500 éliminations au total', k: 'kills', v: 500 },
  { id: 'firstwin', n: 'Couronné', d: 'Gagne une partie', k: 'wins', v: 1 },
  { id: 'wins10', n: 'Habitué du podium', d: 'Gagne 10 parties', k: 'wins', v: 10 },
  { id: 'top10x25', n: 'Survivant', d: 'Finis 25 fois dans le top 10', k: 'top10', v: 25 },
  { id: 'games50', n: 'Fidèle', d: 'Joue 50 parties', k: 'games', v: 50 },
  { id: 'head100', n: 'Œil de lynx', d: '100 tirs à la tête', k: 'headshots', v: 100 },
  { id: 'chest100', n: 'Chercheur d\'or', d: 'Ouvre 100 coffres', k: 'chests', v: 100 },
  { id: 'gag50', n: 'Farceur', d: 'Utilise 50 Gags', k: 'gags', v: 50 },
  { id: 'piano', n: 'Do-ré-mi-mort', d: 'Élimine quelqu\'un avec un piano', k: 'piano', v: 1 },
  { id: 'revive10', n: 'Ange gardien', d: 'Réanime 10 coéquipiers', k: 'revives', v: 10 },
  { id: 'boss', n: 'Régicide', d: 'Élimine le Roi Pingouin', k: 'boss', v: 1 },
  { id: 'vault', n: 'Casse du siècle', d: 'Ouvre le coffre-fort', k: 'vaults', v: 1 },
  { id: 'shop', n: 'Bon client', d: 'Achète 10 objets aux marchands', k: 'buys', v: 10 },
  { id: 'drive', n: 'Pilote', d: 'Parcours 5 km en véhicule', k: 'drive', v: 5000 },
  { id: 'dmg', n: 'Démolisseur', d: '50 000 dégâts au total', k: 'damage', v: 50000 },
  { id: 'best10', n: 'Inarrêtable', d: '10 éliminations en une partie', k: 'bestKills', v: 10 },
  { id: 'gold', n: 'Joueur d\'Or', d: 'Atteins le rang Or en classé', k: 'rankTier', v: 2 },
  { id: 'legend', n: 'Légende', d: 'Atteins le rang Légende', k: 'rankTier', v: 5 },
];
const RANKS = [
  { n: 'Bronze', pts: 0, c: '#c98a5a' }, { n: 'Argent', pts: 300, c: '#c9d2dc' }, { n: 'Or', pts: 700, c: '#ffcf3f' },
  { n: 'Platine', pts: 1200, c: '#7fe0e0' }, { n: 'Diamant', pts: 1800, c: '#7fb8ff' }, { n: 'Légende', pts: 2600, c: '#ff5cf0' },
];
const WEEKLY_POOL = [
  { id: 'kills', n: 'Éliminer {n} adversaires', min: 20, max: 40, step: 5 },
  { id: 'chests', n: 'Ouvrir {n} coffres', min: 15, max: 30, step: 5 },
  { id: 'damage', n: 'Infliger {n} dégâts', min: 3000, max: 6000, step: 500 },
  { id: 'top10', n: 'Finir {n} fois dans le top 10', min: 3, max: 6 },
  { id: 'gags', n: 'Utiliser {n} Gags', min: 8, max: 15 },
  { id: 'coins', n: 'Ramasser {n} pièces', min: 300, max: 600, step: 50 },
  { id: 'revives', n: 'Réanimer {n} coéquipiers', min: 3, max: 6 },
  { id: 'wins', n: 'Gagner {n} partie(s)', min: 1, max: 2 },
  { id: 'head', n: 'Réussir {n} tirs à la tête', min: 25, max: 50, step: 5 },
];
const SEASON_THEMES = ['Saison des Bonbons', 'Saison Givrée', 'Saison Tropicale', 'Saison des Monstres', 'Saison Cosmique', 'Saison des Pirates'];

const Meta = {
  init() {
    const P = Profile;
    P.stars = P.stars || 0;
    P.owned = Object.assign({ emotes: ['dance'], packs: ['classic'], wraps: ['none'], trails: ['none'] }, P.owned || {});
    P.equip = Object.assign({ emotes: 'dance', packs: 'classic', wraps: 'none', trails: 'none' }, P.equip || {});
    P.ach = P.ach || {}; P.rank = P.rank || { pts: 0, best: 0 }; P.ranked = !!P.ranked;
    Object.assign(P.stats, Object.assign({ chests: 0, gags: 0, piano: 0, revives: 0, boss: 0, vaults: 0, buys: 0, drive: 0, coins: 0 }, P.stats));
    this.ensureWeekly(); saveProfile();
  },
  season() {
    const EPOCH = Date.UTC(2026, 0, 1), D = 86400000; const idx = Math.floor((Date.now() - EPOCH) / (30 * D));
    const end = EPOCH + (idx + 1) * 30 * D; return { n: idx + 1, name: SEASON_THEMES[((idx % SEASON_THEMES.length) + SEASON_THEMES.length) % SEASON_THEMES.length], days: Math.ceil((end - Date.now()) / D) };
  },
  weekKey() { const d = new Date(); const j = new Date(d.getFullYear(), 0, 1); return d.getFullYear() + '-w' + Math.ceil(((d - j) / 86400000 + j.getDay() + 1) / 7); },
  ensureWeekly() {
    const key = this.weekKey(); if (Profile.weekly && Profile.weekly.key === key) return;
    let seed = 7; for (const ch of key) seed = seed * 31 + ch.charCodeAt(0) | 0; const rng = mulberry32(seed);
    const pool = WEEKLY_POOL.slice(), list = [];
    for (let i = 0; i < 5; i++) { const c = pool.splice(Math.floor(rng() * pool.length), 1)[0]; const st = c.step || 1; const n = Math.round((c.min + rng() * (c.max - c.min)) / st) * st; list.push({ id: c.id, n, text: c.n.replace('{n}', n), prog: 0, done: false, xp: 1500, stars: 100 }); }
    Profile.weekly = { key, list };
  },
  rankTier(pts) { let t = 0; for (let i = 0; i < RANKS.length; i++) if (pts >= RANKS[i].pts) t = i; return t; },
  botLevelForRank() {
    const t = this.rankTier(Profile.rank.pts) / 5, E = BOT_LEVELS.easy, H = BOT_LEVELS.hard;
    return { n: 'Classé', acc: lerp(E.acc, H.acc * 1.1, t), react: lerp(E.react, H.react * 0.9, t), sight: lerp(E.sight, H.sight, t), turn: lerp(E.turn, H.turn, t), aggr: lerp(E.aggr, H.aggr, t) };
  },
  owns(cat, id) { return Profile.owned[cat].includes(id); },
  buy(cat, id) {
    const it = COSMETICS[cat].find(x => x.id === id); if (!it || this.owns(cat, id)) return false;
    if (Profile.stars < it.price) return false;
    Profile.stars -= it.price; Profile.owned[cat].push(id); Profile.equip[cat] = id; saveProfile(); return true;
  },
  shopToday() {
    const d = new Date(); let seed = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate(); const rng = mulberry32(seed);
    const all = []; for (const cat in COSMETICS) for (const it of COSMETICS[cat]) if (it.price > 0) all.push({ cat, it });
    const out = []; while (out.length < 6 && all.length) out.push(all.splice(Math.floor(rng() * all.length), 1)[0]);
    return out;
  },
  // fin de partie : étoiles, quêtes hebdo, classé, succès → lignes pour l'écran de fin
  onMatchEnd(r, ms) {
    const P = Profile, S = P.stats, lines = [];
    S.chests += ms.chests || 0; S.gags += ms.gag || 0; S.piano += ms.piano || 0; S.revives += ms.revive || 0; S.boss += ms.boss || 0; S.vaults += ms.vault || 0; S.buys += ms.buy || 0; S.drive += Math.round(ms.drive || 0); S.coins += ms.coins || 0;
    let stars = r.kills * 5 + (r.place === 1 ? 60 : r.place <= 5 ? 30 : r.place <= 10 ? 15 : 5);
    // quêtes hebdo
    this.ensureWeekly();
    const prog = { kills: r.kills, chests: ms.chests, damage: ms.damage, top10: r.place <= 10 ? 1 : 0, gags: ms.gag, coins: ms.coins, revives: ms.revive, wins: r.win ? 1 : 0, head: ms.head };
    let qxp = 0;
    for (const q of P.weekly.list) { if (q.done) continue; q.prog = Math.min(q.n, q.prog + (prog[q.id] || 0)); if (q.prog >= q.n) { q.done = true; qxp += q.xp; stars += q.stars; lines.push('✔ Quête de la semaine : ' + q.text); } }
    // classé
    let rankLine = null;
    if (r.ranked) {
      const before = this.rankTier(P.rank.pts);
      const delta = Math.round(r.kills * 8 + (r.place === 1 ? 60 : r.place <= 5 ? 35 : r.place <= 10 ? 20 : r.place <= 25 ? 5 : -15 - before * 4));
      P.rank.pts = Math.max(0, P.rank.pts + delta); P.rank.best = Math.max(P.rank.best, P.rank.pts);
      const after = this.rankTier(P.rank.pts);
      rankLine = `Classé : ${delta >= 0 ? '+' : ''}${delta} pts → ${RANKS[after].n} (${P.rank.pts})` + (after > before ? ' — PROMOTION !' : after < before ? ' — relégation' : '');
    }
    S.rankTier = this.rankTier(P.rank.best);
    // succès
    for (const a of ACHIEVEMENTS) { if (P.ach[a.id]) continue; if ((S[a.k] || 0) >= a.v) { P.ach[a.id] = Date.now(); stars += 100; lines.push('🏆 Succès : ' + a.n); } }
    P.stars += stars;
    return { stars, qxp, lines, rankLine };
  },
};

// ---------- animations d'emotes ----------
function animateEmote(f, P, t, m) {
  const e = f.emoteId || 'dance';
  if (e === 'robot') { P.body.position.y = 0; P.arms.rotation.x = Math.round(Math.sin(t * 4) * 2) * 0.5 + 0.8; P.legL.rotation.x = Math.round(Math.sin(t * 4)) * 0.3; P.legR.rotation.x = -P.legL.rotation.x; m.rotation.y = f.yaw + Math.round(Math.sin(t * 2)) * 0.5; }
  else if (e === 'disco') { P.body.position.y = Math.abs(Math.sin(t * 6)) * 0.15; P.arms.rotation.x = Math.sin(t * 3) > 0 ? 2.8 : 0.2; P.body.rotation.z = Math.sin(t * 6) * 0.15; m.rotation.y = f.yaw + Math.sin(t * 3) * 0.6; }
  else if (e === 'flip') { const k = (t % 1.2) / 1.2; P.body.position.y = Math.sin(k * Math.PI) * 1.2; m.rotation.x = k < 1 ? -k * TAU : 0; P.arms.rotation.x = 2.5; }
  else if (e === 'wave') { P.arms.rotation.x = 2.6 + Math.sin(t * 10) * 0.3; P.body.position.y = 0; m.rotation.y = f.yaw; }
  else if (e === 'chicken') { P.body.position.y = Math.abs(Math.sin(t * 8)) * 0.12; P.arms.rotation.x = -0.4 + Math.abs(Math.sin(t * 8)) * 0.6; P.body.rotation.x = 0.3 + Math.sin(t * 8) * 0.1; P.legL.rotation.x = Math.sin(t * 8) * 0.5; P.legR.rotation.x = -Math.sin(t * 8) * 0.5; m.rotation.y = f.yaw + t * 1.5; }
  else { P.body.position.y = Math.abs(Math.sin(t * 9)) * 0.35; P.arms.rotation.x = Math.sin(t * 9) * 1.2 + 1.5; m.rotation.y = f.yaw + t * 4; }
}

// sacs à dos alternatifs (ajoutés à la géométrie du personnage)
function packGeo(b, id, skin) {
  switch (id) {
    case 'jet': b.addGeo(new THREE.CylinderGeometry(0.13, 0.13, 0.6, 8), M4(-0.14, 1.15, 0.32), '#c9d2dc'); b.addGeo(new THREE.CylinderGeometry(0.13, 0.13, 0.6, 8), M4(0.14, 1.15, 0.32), '#c9d2dc'); b.addGeo(new THREE.ConeGeometry(0.12, 0.2, 8), M4(-0.14, 0.78, 0.32, Math.PI, 0, 0), '#ff7b2e'); b.addGeo(new THREE.ConeGeometry(0.12, 0.2, 8), M4(0.14, 0.78, 0.32, Math.PI, 0, 0), '#ff7b2e'); return true;
    case 'teddy': b.addGeo(new THREE.SphereGeometry(0.26, 10, 8), M4(0, 1.2, 0.36), '#b5835a'); b.addGeo(new THREE.SphereGeometry(0.09, 6, 4), M4(-0.18, 1.42, 0.36), '#b5835a'); b.addGeo(new THREE.SphereGeometry(0.09, 6, 4), M4(0.18, 1.42, 0.36), '#b5835a'); b.addGeo(new THREE.SphereGeometry(0.08, 6, 4), M4(0, 1.15, 0.6), '#e8c7a0'); return true;
    case 'guitar': b.addGeo(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 12).rotateX(Math.PI / 2), M4(0.05, 0.95, 0.32, 0, 0, 0.5), '#e8344d'); b.box(-0.18, 1.45, 0.32, 0.08, 0.7, 0.05, '#6b4a2a'); return true;
    case 'wings': b.box(-0.45, 1.3, 0.3, 0.7, 0.35, 0.05, '#ffffff'); b.box(0.45, 1.3, 0.3, 0.7, 0.35, 0.05, '#ffffff'); b.box(-0.5, 1.12, 0.3, 0.5, 0.2, 0.05, '#e9f2ff'); b.box(0.5, 1.12, 0.3, 0.5, 0.2, 0.05, '#e9f2ff'); return true;
    case 'shell': b.addGeo(new THREE.SphereGeometry(0.42, 10, 6, 0, TAU, 0, Math.PI / 2), M4(0, 1.12, 0.22, -Math.PI / 2, 0, 0, 1, 1, 0.6), '#4f9a3f'); return true;
  }
  return false;
}
