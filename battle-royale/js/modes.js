// ============ TOON ROYALE — modes : Escouade, Mêlée générale, Entraînement, Mode du jour ============
'use strict';

const DAILY_MODS = [
  { id: 'sniper', n: 'Snipers seulement', d: 'Que des snipers et des arbalètes' },
  { id: 'lowgrav', n: 'Gravité lunaire', d: 'Sauts géants et chutes lentes' },
  { id: 'gags', n: 'Festival des Gags', d: 'Des Gags partout, un pour chacun au départ' },
  { id: 'rockets', n: 'Pétards à gogo', d: 'Lance-Pétards et bulles uniquement' },
  { id: 'speed', n: 'Turbo', d: 'Tout le monde court 30 % plus vite, tempête rapide' },
];
function dailyMod() { const d = new Date(); return DAILY_MODS[(d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % DAILY_MODS.length]; }

Object.assign(MODES, {
  squad: { n: 'Escouade', desc: '12 escouades de 4 · 3 coéquipiers IA', players: 48, team: 4, storm: 1 },
  rumble: { n: 'Mêlée générale', desc: '2 équipes de 20 · réapparition · 100 élim.', players: 40, team: 20, storm: 1, rumble: true, target: 100 },
  daily: { n: 'Mode du jour', desc: '', players: 50, team: 1, storm: 1, daily: true },
  training: { n: 'Entraînement', desc: 'Cibles, armurerie complète, karts', players: 1, team: 1, storm: 1, training: true },
});
MODES.daily.desc = dailyMod().n + ' · ' + dailyMod().d;
const MODE_ORDER = ['solo', 'duo', 'squad', 'rumble', 'quick', 'daily', 'training'];

const Modes = {
  // appelé après la création des combattants et du loot ; renvoie true si le bus est sauté
  setup(G) {
    const M = G.mode; G.mod = M.daily ? dailyMod().id : null; G.grav = G.mod === 'lowgrav' ? 9 : 24; G.speedMul = G.mod === 'speed' ? 1.3 : 1;
    G.teamKills = [0, 0]; this.respawns = [];
    if (G.mod === 'gags') for (const f of G.fighters) Gags.give(f, pick(GAG_LIST));
    if (M.rumble) {
      const st = G.storm; Object.assign(st, { cx: 0, cz: 20, r: 240, nx: 0, nz: 20, nr: 240, phase: STORM_PHASES.length, shrinking: false, timer: 0 });
      for (const f of G.fighters) this.dropIn(G, f, true);
      HUD.message('Mêlée générale : premiers à <b>100 éliminations</b> !', 4);
      return true;
    }
    if (M.training) {
      const st = G.storm; Object.assign(st, { cx: 0, cz: 0, r: 2000, nx: 0, nz: 0, nr: 2000, phase: STORM_PHASES.length, shrinking: false, timer: 0 });
      const P = World.pois[5]; const p = G.player;
      p.state = 'ground'; p.mesh.visible = true; p.pos.set(P.x + 6, World.ground(P.x + 6, P.z + 6), P.z + 6);
      for (const a in p.ammo) p.ammo[a] = 999; p.sh = 100;
      // armurerie
      const ws = Object.keys(WEAPONS); let i = 0;
      for (const w of ws) { const a = i / ws.length * TAU; G.makeLoot({ kind: 'weapon', w, rar: Math.max(WEAPONS[w].min, Math.min(4, WEAPONS[w].max)), mag: WEAPONS[w].mag }, P.x + 6 + Math.cos(a) * 5, P.z + 6 + Math.sin(a) * 5); i++; }
      i = 0; for (const c in CONS) { const a = i / Object.keys(CONS).length * TAU + 0.2; G.makeLoot({ kind: 'cons', c, n: CONS[c].stack }, P.x + 6 + Math.cos(a) * 8, P.z + 6 + Math.sin(a) * 8); i++; }
      i = 0; for (const g of GAG_LIST) { const a = i / GAG_LIST.length * TAU + 0.4; G.makeLoot({ kind: 'gag', g }, P.x + 6 + Math.cos(a) * 11, P.z + 6 + Math.sin(a) * 11); i++; }
      // cibles
      this.dummies = [];
      for (let k = 0; k < 10; k++) {
        const a = k / 10 * Math.PI - Math.PI / 2, d = 14 + (k % 3) * 12; const x = P.x + 6 + Math.sin(a) * d, z = P.z + 6 - Math.cos(a) * d - 8;
        const f = new Fighter({ name: 'Cible ' + (k + 1), team: 10 + k, skin: SKINS[k % SKINS.length].id });
        f.state = 'ground'; f.pos.set(x, World.ground(x, z), z); f.home = f.pos.clone(); f.mover = k % 3 === 2; f.sh = 50; f.dummy = true;
        f.input = { dx: 0, dz: 0, speed: 3, jump: false }; G.fighters.push(f); G.dynGroup.add(f.mesh); this.dummies.push(f);
      }
      G.camYaw = 0; G.camPitch = -0.1;
      HUD.message('Entraînement : tout est à ta disposition. <b>Pause</b> pour quitter', 4);
      return true;
    }
    return false;
  },
  dropIn(G, f, first) {
    const st = G.storm; let x = 0, z = 0;
    const side = f.team === 0 ? -1 : 1;
    for (let k = 0; k < 20; k++) { x = st.cx + side * rand(40, 180); z = st.cz + rand(-150, 150); if (World.h(x, z) > 2) break; }
    f.alive = true; f.hp = 100; f.sh = first ? 0 : 50; f.knocked = false; f.bleed = 0; f.state = 'fall'; f.vy = -5; f.vel.set(0, 0, 0);
    f.pos.set(x, World.ground(x, z) + (first ? 90 : 60), z); f.mesh.visible = true; f.parts.glider.visible = false;
    f.slots = [null, null, null, null, null]; f.cur = 0;
    let wd = G.rollWeapon(first ? 0 : 1); while (WEAPONS[wd.w].grapple) wd = G.rollWeapon(first ? 0 : 1); f.slots[0] = { kind: 'weapon', w: wd.w, rar: wd.rar, mag: wd.mag }; f.slots[1] = { kind: 'cons', c: 'bandage', n: 5 };
    for (const a in f.ammo) f.ammo[a] = 60;
    if (f.ai) { f.ai.landing = { x: x + rand(-20, 20), z: z + rand(-20, 20) }; f.ai.target = null; f.ai.goal = null; f.ai.path = []; }
    if (f.isPlayer) { G.spectating = null; G.camPitch = -0.3; }
  },
  // renvoie true si l'élimination est gérée par le mode
  onElim(G, t, att) {
    const M = G.mode;
    if (M.rumble) {
      if (att && att !== t && att.team !== t.team && att.team < 2) G.teamKills[att.team]++;
      else if (t.team < 2) G.teamKills[1 - t.team]++;
      this.respawns.push({ f: t, at: G.time + 5 });
      if (t.isPlayer) { G.spectating = att && att.alive ? att : null; HUD.message('Réapparition dans 5 s…', 4, 'bad'); }
      if (G.teamKills[0] >= M.target || G.teamKills[1] >= M.target) { const win = G.teamKills[0] >= M.target; G.placement = win ? 1 : 2; if (win) G.startVictory(); else setTimeout(() => G.endMatch(false), 1500); G.rumbleDone = true; }
      return true;
    }
    if (M.training) { this.respawns.push({ f: t, at: G.time + (t.isPlayer ? 2 : 3) }); return true; }
    return false;
  },
  update(G, dt) {
    const M = G.mode;
    for (let i = this.respawns.length - 1; i >= 0; i--) {
      const r = this.respawns[i]; if (G.time < r.at || G.ended || G.rumbleDone) continue; this.respawns.splice(i, 1);
      if (M.training) {
        const f = r.f; f.alive = true; f.hp = 100; f.sh = f.dummy ? 50 : 100; f.knocked = false; f.state = 'ground'; f.mesh.visible = true;
        if (f.home) f.pos.copy(f.home); else { const P = World.pois[5]; f.pos.set(P.x + 6, World.ground(P.x + 6, P.z + 6), P.z + 6); for (const a in f.ammo) f.ammo[a] = 999; G.spectating = null; }
        Effects.poof(f.pos);
      } else this.dropIn(G, r.f, false);
    }
    if (M.training) for (const f of this.dummies) {
      if (!f.alive) continue; f.input.dx = f.input.dz = 0;
      if (f.mover) { const s = Math.sin(G.time * 0.8 + f.id); f.input.dx = s > 0 ? 1 : -1; f.input.speed = 4; f.yaw = Math.PI / 2; if (Math.abs(f.pos.x - f.home.x) > 8) f.pos.x = f.home.x + Math.sign(f.pos.x - f.home.x) * 8; }
      else { const p = G.player; f.yaw = Math.atan2(-(p.pos.x - f.pos.x), -(p.pos.z - f.pos.z)); }
    }
    if (M.rumble) {
      $('teamScore').hidden = false;
      $('teamScore').innerHTML = `<b class="t0">${G.teamKills[0]}</b><span>/ ${M.target}</span><b class="t1">${G.teamKills[1]}</b>`;
      if (!G.ended && !G.rumbleDone && G.time > 60 * 8) { const win = G.teamKills[0] > G.teamKills[1]; G.placement = win ? 1 : 2; G.rumbleDone = true; if (win) G.startVictory(); else G.endMatch(false); }
    } else $('teamScore').hidden = true;
  },
};

// ---------- étiquettes des coéquipiers ----------
const Nametags = {
  els: [],
  update(G) {
    const mates = G.mode && G.mode.team > 1 ? G.mates(G.player).filter(m => m.alive) : [];
    const list = mates.filter(m => dist2(m.pos.x, m.pos.z, G.camPos.x, G.camPos.z) < 220 * 220).slice(0, 8);
    while (this.els.length < list.length) { const d = document.createElement('div'); d.className = 'ntag'; d.innerHTML = '<b></b><i><s></s></i>'; $('tagLayer').appendChild(d); this.els.push(d); }
    const W = window.innerWidth, H = window.innerHeight;
    this.els.forEach((el, i) => {
      const m = list[i]; if (!m) { el.style.display = 'none'; return; }
      const v = _v1.set(m.pos.x, m.pos.y + 2.5 * (m.scale || 1), m.pos.z).project(G.camera);
      if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) { el.style.display = 'none'; return; }
      el.style.display = 'flex'; el.style.transform = `translate(${(v.x * 0.5 + 0.5) * W}px,${(-v.y * 0.5 + 0.5) * H}px) translate(-50%,-100%)`;
      el.querySelector('b').textContent = m.name + (m.knocked ? ' ⤓' : '');
      el.querySelector('s').style.width = (m.knocked ? m.bleed : Math.max(0, m.hp)) + '%';
      el.classList.toggle('down', !!m.knocked);
    });
  },
};
