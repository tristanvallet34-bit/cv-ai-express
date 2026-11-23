// ============ TOON ROYALE — données de jeu ============
'use strict';

const RARITY = [
  { n: 'Commun', c: '#b9c0c8', m: 1.00, r: 0.00 },
  { n: 'Peu commun', c: '#5fd35a', m: 1.06, r: 0.05 },
  { n: 'Rare', c: '#3ea8ff', m: 1.12, r: 0.10 },
  { n: 'Épique', c: '#bd63ff', m: 1.19, r: 0.15 },
  { n: 'Légendaire', c: '#ffb22e', m: 1.27, r: 0.20 },
];
const RARITY_W = [40, 28, 18, 10, 4];
function rollRarity(min = 0, max = 4, bonus = 0) {
  let tot = 0; for (let i = min; i <= max; i++) tot += RARITY_W[i] * (i >= 3 ? 1 + bonus : 1);
  let r = Math.random() * tot;
  for (let i = min; i <= max; i++) { r -= RARITY_W[i] * (i >= 3 ? 1 + bonus : 1); if (r <= 0) return i; }
  return min;
}

const AMMO = {
  light: { n: 'Munitions légères', c: '#9fd8ff', pick: 30, max: 999 },
  medium: { n: 'Munitions moyennes', c: '#6fe08a', pick: 30, max: 999 },
  shells: { n: 'Cartouches', c: '#ffb36b', pick: 8, max: 999 },
  heavy: { n: 'Munitions lourdes', c: '#ff7a7a', pick: 6, max: 999 },
  rockets: { n: 'Pétards', c: '#ffd23f', pick: 3, max: 999 },
};

// dmg: dégâts par balle, rate: secondes entre tirs, spread: dispersion (radians)
const WEAPONS = {
  pistol: { n: 'Pistolet Pop', short: 'PISTOLET', ammo: 'light', dmg: 24, rate: 0.22, mag: 14, reload: 1.25, spread: 0.022, ads: 0.009, range: 110, pellets: 1, auto: false, head: 1.7, min: 0, max: 2, len: 0.45, sound: { f: 1800, len: 0.09, vol: 0.45 }, botRange: 35, zoom: 1.25 },
  smg: { n: 'Mitraillette Zip', short: 'MITRAILLETTE', ammo: 'light', dmg: 16, rate: 0.075, mag: 30, reload: 1.9, spread: 0.05, ads: 0.032, range: 80, pellets: 1, auto: true, head: 1.5, min: 0, max: 3, len: 0.6, sound: { f: 2400, len: 0.06, vol: 0.38 }, botRange: 28, zoom: 1.25 },
  ar: { n: 'Fusil Comète', short: 'FUSIL D\'ASSAUT', ammo: 'medium', dmg: 30, rate: 0.15, mag: 30, reload: 2.1, spread: 0.034, ads: 0.008, range: 210, pellets: 1, auto: true, head: 1.6, min: 0, max: 4, len: 0.85, sound: { f: 1300, len: 0.11, vol: 0.5 }, botRange: 90, zoom: 1.5 },
  shotgun: { n: 'Pompe Tonnerre', short: 'POMPE', ammo: 'shells', dmg: 10, rate: 0.85, mag: 5, reload: 3.0, spread: 0.09, ads: 0.075, range: 38, pellets: 10, auto: false, head: 1.5, min: 0, max: 4, len: 0.8, sound: { f: 700, len: 0.25, vol: 0.75 }, botRange: 12, zoom: 1.15 },
  sniper: { n: 'Sniper Éclair', short: 'SNIPER', ammo: 'heavy', dmg: 102, rate: 1.35, mag: 4, reload: 2.7, spread: 0.07, ads: 0.0, range: 650, pellets: 1, auto: false, head: 2.5, min: 2, max: 4, len: 1.15, sound: { f: 900, len: 0.35, vol: 0.85 }, botRange: 220, zoom: 4, scope: true },
  rocket: { n: 'Lance-Pétard', short: 'LANCE-PÉTARD', ammo: 'rockets', dmg: 105, rate: 1.1, mag: 1, reload: 2.4, spread: 0.01, ads: 0.0, range: 300, pellets: 1, auto: false, head: 1, min: 3, max: 4, len: 0.9, sound: { f: 400, len: 0.4, vol: 0.7 }, botRange: 45, zoom: 1.3, projectile: true },
  crossbow: { n: 'Arbalète Hop', short: 'ARBALÈTE', ammo: 'heavy', dmg: 82, rate: 0.85, mag: 3, reload: 1.8, spread: 0.02, ads: 0.0, range: 260, pellets: 1, auto: false, head: 2.0, min: 1, max: 4, len: 0.8, sound: { f: 600, len: 0.12, vol: 0.4 }, botRange: 70, zoom: 2, projectile: 'bolt' },
  burst: { n: 'Rafale Triple', short: 'RAFALE', ammo: 'medium', dmg: 27, rate: 0.42, mag: 24, reload: 2.0, spread: 0.022, ads: 0.006, range: 190, pellets: 1, burst: 3, auto: false, head: 1.7, min: 1, max: 4, len: 0.8, sound: { f: 1500, len: 0.08, vol: 0.45 }, botRange: 70, zoom: 1.6 },
  grapple: { n: 'Grappin Boing', short: 'GRAPPIN', ammo: null, dmg: 0, rate: 0.6, mag: 4, reload: 0, spread: 0, ads: 0, range: 60, pellets: 1, auto: false, head: 1, min: 2, max: 2, len: 0.6, sound: { f: 700, len: 0.1, vol: 0.3 }, botRange: 0, zoom: 1.2, grapple: true },
  minigun: { n: 'Mini-Tornade', short: 'MITRAILLEUSE', ammo: 'medium', dmg: 14, rate: 0.055, mag: 80, reload: 3.6, spread: 0.06, ads: 0.045, range: 120, pellets: 1, auto: true, head: 1.3, min: 3, max: 4, len: 1.0, sound: { f: 1600, len: 0.05, vol: 0.4 }, botRange: 40, zoom: 1.2 },
};
const FLOOR_WEAPONS = ['pistol', 'pistol', 'smg', 'smg', 'ar', 'ar', 'ar', 'burst', 'shotgun', 'shotgun', 'sniper', 'crossbow', 'rocket', 'grapple'];

const CONS = {
  bandage: { n: 'Bandages', time: 2.4, hp: 15, cap: 75, stack: 15, pick: 5, c: '#ff6b6b', icon: '✚' },
  medkit: { n: 'Trousse de soins', time: 6, hp: 100, cap: 100, stack: 3, pick: 1, c: '#ff3b3b', icon: '✚' },
  shieldS: { n: 'Mini-bouclier', time: 2, sh: 25, shcap: 50, stack: 6, pick: 3, c: '#4fc3ff', icon: '◆' },
  shieldB: { n: 'Méga-bouclier', time: 4.5, sh: 50, shcap: 100, stack: 3, pick: 1, c: '#2a7bff', icon: '◆' },
  fizz: { n: 'Soda Pétillant', time: 1.5, hp: 15, cap: 100, sh: 10, shcap: 100, stack: 4, pick: 2, c: '#c66bff', icon: '●' },
  grenade: { n: 'Grenade Boum', time: 0, throw: true, stack: 6, pick: 3, c: '#7bd36b', icon: '✹' },
  bouncy: { n: 'Bombe Boing', time: 0, throw: true, stack: 4, pick: 2, c: '#ff8a3d', icon: '✸' },
  smoke: { n: 'Fumigène', time: 0, throw: true, stack: 4, pick: 2, c: '#d8d4e4', icon: '☁' },
  bubble: { n: 'Bulle bouclier', time: 0, throw: true, stack: 2, pick: 1, c: '#7fd8ff', icon: '◯' },
};
const FLOOR_CONS = ['bandage', 'bandage', 'bandage', 'shieldS', 'shieldS', 'shieldB', 'medkit', 'fizz', 'grenade', 'grenade', 'bouncy', 'smoke', 'bubble'];

// ---------- Skins & cosmétiques ----------
// hat: none, cap, cone, ears, helmet, crown, mohawk, beanie, horns, halo
const SKINS = [
  { id: 'rookie', n: 'Recrue Pop', lvl: 1, shirt: '#3ea8ff', pants: '#2b3a67', skin: '#ffd2a8', hat: 'cap', hatc: '#ff4f8b', pack: '#ffcf3f' },
  { id: 'lime', n: 'Citron Vert', lvl: 1, shirt: '#8ee04a', pants: '#3c4a2a', skin: '#e9b48a', hat: 'beanie', hatc: '#ffe14a', pack: '#3c4a2a' },
  { id: 'cherry', n: 'Cerise Punk', lvl: 2, shirt: '#ff3d5a', pants: '#26222e', skin: '#ffe0c4', hat: 'mohawk', hatc: '#ff74d4', pack: '#26222e' },
  { id: 'bunny', n: 'Lapinou', lvl: 3, shirt: '#ffc6e0', pants: '#ffffff', skin: '#ffe6d6', hat: 'ears', hatc: '#ffffff', pack: '#ff8fbf' },
  { id: 'party', n: 'Fêtard', lvl: 5, shirt: '#ffcf3f', pants: '#6b3fd6', skin: '#c88a5c', hat: 'cone', hatc: '#2ee6c8', pack: '#6b3fd6' },
  { id: 'astro', n: 'Astro Toon', lvl: 7, shirt: '#f1f4ff', pants: '#cfd6ff', skin: '#ffd2a8', hat: 'helmet', hatc: '#8fd8ff', pack: '#ff7a3d' },
  { id: 'devil', n: 'Petit Démon', lvl: 9, shirt: '#b0172f', pants: '#3a0a13', skin: '#ff8a7a', hat: 'horns', hatc: '#2a0508', pack: '#3a0a13' },
  { id: 'ninja', n: 'Ninja Minuit', lvl: 12, shirt: '#2a2e45', pants: '#1a1c2b', skin: '#f1c39a', hat: 'beanie', hatc: '#e8344d', pack: '#e8344d' },
  { id: 'angel', n: 'Ange Gardien', lvl: 15, shirt: '#ffffff', pants: '#e9f2ff', skin: '#ffe6d6', hat: 'halo', hatc: '#ffe14a', pack: '#ffe14a' },
  { id: 'toxic', n: 'Toxico', lvl: 18, shirt: '#39ff6a', pants: '#173a20', skin: '#b6f0a8', hat: 'mohawk', hatc: '#39ff6a', pack: '#173a20' },
  { id: 'king', n: 'Roi de l\'Île', lvl: 22, shirt: '#7b2ff7', pants: '#2c0f5c', skin: '#e9b48a', hat: 'crown', hatc: '#ffcf3f', pack: '#ffcf3f' },
  { id: 'gold', n: 'Agent Doré', lvl: 30, shirt: '#ffcf3f', pants: '#b8860b', skin: '#ffcf3f', hat: 'helmet', hatc: '#ffcf3f', pack: '#ffffff' },
];
const GLIDERS = [
  { id: 'classic', n: 'Classique', lvl: 1, a: '#ff4f8b', b: '#ffcf3f' },
  { id: 'ocean', n: 'Océan', lvl: 4, a: '#2ee6c8', b: '#3ea8ff' },
  { id: 'jungle', n: 'Jungle', lvl: 8, a: '#5fd35a', b: '#ffe14a' },
  { id: 'night', n: 'Nuit Étoilée', lvl: 13, a: '#2b1e5c', b: '#bd63ff' },
  { id: 'lava', n: 'Lave', lvl: 20, a: '#ff3b00', b: '#ffb22e' },
  { id: 'rainbow', n: 'Arc-en-ciel', lvl: 26, a: '#ff4f8b', b: '#2ee6c8' },
];

const BOT_NAMES = ['Biscotte', 'Zorglub', 'PixelPanda', 'Moustik', 'CapitaineFrite', 'Nougat', 'Turbo_Tom', 'LaFouine', 'Kiwi42', 'Brioche', 'MegaMax', 'Tartiflette', 'Pépito', 'Sniperella', 'Gaufrette', 'ToonKing', 'Chouquette', 'RoiLion', 'Zébulon', 'Cornichon', 'Bulle', 'Chaussette', 'Patator', 'Rocketto', 'Mimosa', 'Croquette', 'Glouglou', 'Hibou_77', 'Loulou', 'Coco', 'Cactus', 'Flan', 'Bretzel', 'Pistache', 'Ouragan', 'Rapido', 'Yéti', 'Mochi', 'Banzaï', 'Caramel', 'Grizzly', 'Pingouin', 'Fusée', 'Kraken', 'Ninjaa', 'Pruneau', 'Volcan', 'Zigzag', 'Lutin', 'Panache', 'Tornado', 'Brocoli'];

// ---------- Modes ----------
const MODES = {
  solo: { n: 'Solo', desc: '50 joueurs · chacun pour soi', players: 50, team: 1, storm: 1 },
  duo: { n: 'Duo', desc: '25 équipes de 2 · avec un coéquipier IA', players: 50, team: 2, storm: 1 },
  quick: { n: 'Express', desc: '24 joueurs · tempête rapide · partie de 5 min', players: 24, team: 1, storm: 0.55 },
};

// phases de la tempête : attente, rétrécissement (s), facteur de rayon, dégâts/s
const STORM_PHASES = [
  { wait: 70, shrink: 45, f: 0.58, dps: 1 },
  { wait: 50, shrink: 40, f: 0.55, dps: 2 },
  { wait: 40, shrink: 32, f: 0.52, dps: 4 },
  { wait: 32, shrink: 28, f: 0.5, dps: 6 },
  { wait: 25, shrink: 22, f: 0.45, dps: 8 },
  { wait: 18, shrink: 18, f: 0.35, dps: 10 },
  { wait: 12, shrink: 20, f: 0.0, dps: 12 },
];

// ---------- Défis du jour ----------
const CHALLENGE_POOL = [
  { id: 'kills', n: 'Éliminer {n} adversaires', min: 3, max: 8, xp: 500 },
  { id: 'chests', n: 'Ouvrir {n} coffres', min: 3, max: 7, xp: 400 },
  { id: 'damage', n: 'Infliger {n} dégâts', min: 500, max: 1500, step: 100, xp: 450 },
  { id: 'heal', n: 'Utiliser {n} soins ou boucliers', min: 4, max: 10, xp: 300 },
  { id: 'top10', n: 'Finir dans le top 10 ({n} fois)', min: 1, max: 3, xp: 500 },
  { id: 'head', n: 'Réussir {n} tirs à la tête', min: 5, max: 15, xp: 400 },
  { id: 'survive', n: 'Survivre {n} minutes au total', min: 8, max: 20, xp: 400 },
  { id: 'sniperk', n: 'Éliminer {n} adversaires au sniper', min: 1, max: 3, xp: 600 },
  { id: 'shotgunk', n: 'Éliminer {n} adversaires au pompe', min: 1, max: 4, xp: 500 },
  { id: 'drive', n: 'Parcourir {n} m en kart', min: 300, max: 900, step: 100, xp: 350 },
];

const XP_FOR = lvl => 600 + lvl * 120;

// ---------- Paramètres ----------
const SETTINGS_DEF = {
  quality: 'auto', fpsCap: 60, showFps: false, sens: 1.0, adsSens: 0.7, invertY: false,
  aimAssist: true, autoFire: false, fov: 70, leftFire: true, leftHanded: false, hudScale: 1.0,
  vol: 0.7, music: true, vibration: true, dmgNumbers: true, autoPickup: true, botLevel: 'normal',
  camShake: true, sprintAuto: true, minimapZoom: 1, name: 'Joueur', timeOfDay: 'random', soundViz: true, announcer: true,
};
const Settings = Object.assign({}, SETTINGS_DEF, Store.get('settings', {}));
function saveSettings() { Store.set('settings', Settings); }

const BOT_LEVELS = {
  easy: { n: 'Facile', acc: 0.13, react: 1.1, sight: 55, turn: 2.6, aggr: 0.35 },
  normal: { n: 'Normal', acc: 0.2, react: 0.75, sight: 70, turn: 4, aggr: 0.55 },
  hard: { n: 'Difficile', acc: 0.32, react: 0.42, sight: 100, turn: 6.5, aggr: 0.85 },
};

// ---------- Profil joueur ----------
const Profile = Object.assign({
  lvl: 1, xp: 0, skin: 'rookie', glider: 'classic',
  stats: { games: 0, wins: 0, kills: 0, deaths: 0, top10: 0, damage: 0, bestKills: 0, timeAlive: 0, headshots: 0 },
  daily: null, history: [],
}, Store.get('profile', {}));
function saveProfile() { Store.set('profile', Profile); }

function todayKey() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function ensureDaily() {
  const key = todayKey();
  if (Profile.daily && Profile.daily.key === key) return;
  let seed = 0; for (const ch of key) seed = seed * 31 + ch.charCodeAt(0) | 0;
  const rng = mulberry32(seed);
  const pool = CHALLENGE_POOL.slice(); const list = [];
  for (let i = 0; i < 3; i++) {
    const c = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    const step = c.step || 1;
    const n = Math.round((c.min + rng() * (c.max - c.min)) / step) * step;
    list.push({ id: c.id, n, xp: c.xp, text: c.n.replace('{n}', n), prog: 0, done: false });
  }
  Profile.daily = { key, list };
  saveProfile();
}
