// ============ TOON ROYALE — personnages, armes, combat ============
'use strict';

const Models = {
  mat: null, gliderMat: null, cache: {},
  init() {
    this.mat = Look.mat({ vertexColors: true });
    this.gliderMat = Look.mat({ vertexColors: true, side: THREE.DoubleSide });
    this.shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false });
    this.shadowGeo = new THREE.CircleGeometry(0.55, 12).rotateX(-Math.PI / 2);
  },
  hat(gb, skin) {
    const c = skin.hatc, y = 1.72;
    switch (skin.hat) {
      case 'cap': gb.addGeo(new THREE.SphereGeometry(0.36, 10, 6, 0, TAU, 0, Math.PI / 2), M4(0, y + 0.04, 0), c); gb.box(0, y + 0.06, -0.38, 0.5, 0.05, 0.32, c); break;
      case 'cone': gb.addGeo(new THREE.ConeGeometry(0.22, 0.6, 8), M4(0, y + 0.55, 0), c); gb.addGeo(new THREE.SphereGeometry(0.08, 6, 4), M4(0, y + 0.88, 0), '#ffffff'); break;
      case 'ears': gb.box(-0.14, y + 0.5, 0, 0.12, 0.5, 0.06, c); gb.box(0.14, y + 0.5, 0, 0.12, 0.5, 0.06, c); gb.box(-0.14, y + 0.5, -0.035, 0.06, 0.38, 0.02, '#ff9fc6'); gb.box(0.14, y + 0.5, -0.035, 0.06, 0.38, 0.02, '#ff9fc6'); break;
      case 'helmet': gb.addGeo(new THREE.SphereGeometry(0.44, 12, 8), M4(0, y, 0, 0, 0, 0, 1, 1, 1), c); gb.box(0, y + 0.02, -0.33, 0.5, 0.3, 0.12, '#2b3a67'); break;
      case 'crown': gb.addGeo(new THREE.CylinderGeometry(0.28, 0.26, 0.22, 8, 1, true), M4(0, y + 0.36, 0), c); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; gb.addGeo(new THREE.ConeGeometry(0.07, 0.18, 4), M4(Math.sin(a) * 0.27, y + 0.55, Math.cos(a) * 0.27), c); } break;
      case 'mohawk': gb.box(0, y + 0.36, 0.04, 0.1, 0.28, 0.6, c); break;
      case 'beanie': gb.addGeo(new THREE.SphereGeometry(0.36, 10, 6, 0, TAU, 0, Math.PI / 2), M4(0, y + 0.05, 0), c); gb.addGeo(new THREE.SphereGeometry(0.09, 6, 4), M4(0, y + 0.42, 0), '#ffffff'); break;
      case 'horns': gb.addGeo(new THREE.ConeGeometry(0.07, 0.3, 6), M4(-0.2, y + 0.33, 0, 0, 0, 0.4), c); gb.addGeo(new THREE.ConeGeometry(0.07, 0.3, 6), M4(0.2, y + 0.33, 0, 0, 0, -0.4), c); break;
      case 'halo': gb.addGeo(new THREE.TorusGeometry(0.24, 0.04, 6, 14), M4(0, y + 0.55, 0, Math.PI / 2, 0, 0), c); break;
    }
  },
  char(skin) {
    if (this.cache['c_' + skin.id]) return this.cache['c_' + skin.id];
    const b = new GeoBuilder();
    b.box(0, 1.1, 0, 0.62, 0.68, 0.4, skin.shirt);
    b.box(0, 0.8, 0, 0.64, 0.12, 0.42, '#2a2433');
    b.box(0, 1.35, -0.205, 0.3, 0.12, 0.02, '#ffffff');
    b.addGeo(new THREE.SphereGeometry(0.34, 16, 12), M4(0, 1.72, 0, 0, 0, 0, 1, 0.95, 1), skin.skin);
    b.addGeo(new THREE.SphereGeometry(0.085, 8, 6), M4(-0.12, 1.77, -0.29), '#ffffff');
    b.addGeo(new THREE.SphereGeometry(0.085, 8, 6), M4(0.12, 1.77, -0.29), '#ffffff');
    b.addGeo(new THREE.SphereGeometry(0.045, 6, 4), M4(-0.12, 1.77, -0.365), '#1a1a2e');
    b.addGeo(new THREE.SphereGeometry(0.045, 6, 4), M4(0.12, 1.77, -0.365), '#1a1a2e');
    b.box(0, 1.6, -0.31, 0.14, 0.04, 0.03, '#7a2a3a');
    b.box(0, 1.15, 0.3, 0.46, 0.52, 0.24, skin.pack);
    b.box(0, 1.15, 0.43, 0.3, 0.2, 0.04, '#ffffff');
    this.hat(b, skin);
    const leg = new GeoBuilder();
    leg.box(0, -0.33, 0, 0.24, 0.66, 0.28, skin.pants);
    leg.box(0, -0.7, -0.05, 0.27, 0.14, 0.36, '#2a2433');
    const arms = new GeoBuilder();
    arms.box(0.34, -0.12, -0.18, 0.17, 0.17, 0.5, skin.shirt);
    arms.addGeo(new THREE.SphereGeometry(0.1, 6, 4), M4(0.2, -0.14, -0.48), skin.skin);
    arms.addGeo(new THREE.BoxGeometry(0.16, 0.16, 0.55), M4(-0.2, -0.13, -0.32, 0, -0.6, 0), skin.shirt);
    arms.addGeo(new THREE.SphereGeometry(0.1, 6, 4), M4(0.02, -0.12, -0.66), skin.skin);
    const res = { body: b.build(), leg: leg.build(), arms: arms.build() };
    this.cache['c_' + skin.id] = res; return res;
  },
  weapon(type, rar) {
    const k = 'w_' + type + rar; if (this.cache[k]) return this.cache[k];
    const W = WEAPONS[type]; const b = new GeoBuilder(); const rc = RARITY[rar].c; const L = W.len;
    const dark = '#3a3645', mid = '#5a556a';
    if (type === 'crossbow') {
      b.box(0, 0, -0.3, 0.09, 0.1, 0.8, '#8a5a3c'); b.box(0, 0.02, -0.62, 0.9, 0.06, 0.08, dark); b.box(0, 0.06, -0.3, 0.02, 0.02, 0.7, rc);
      b.box(0, -0.1, -0.05, 0.07, 0.18, 0.1, dark); b.box(0, 0.06, -0.7, 0.04, 0.04, 0.3, '#d9d2c0');
      const g = b.build(); this.cache[k] = g; return g;
    }
    if (type === 'grapple') {
      b.box(0, 0, -0.2, 0.14, 0.16, 0.45, '#ffcf3f'); b.box(0, -0.12, -0.05, 0.08, 0.18, 0.1, dark);
      b.addGeo(new THREE.ConeGeometry(0.08, 0.2, 4).rotateX(-Math.PI / 2), M4(0, 0, -0.55), '#5a556a'); b.box(0, 0.1, -0.2, 0.15, 0.03, 0.3, rc);
      const g = b.build(); this.cache[k] = g; return g;
    }
    if (type === 'rocket') {
      b.addGeo(new THREE.CylinderGeometry(0.11, 0.11, 1.0, 10).rotateX(Math.PI / 2), M4(0, 0.04, -0.35), '#4f9a3f');
      b.addGeo(new THREE.CylinderGeometry(0.13, 0.13, 0.12, 10).rotateX(Math.PI / 2), M4(0, 0.04, -0.85), rc);
      b.addGeo(new THREE.CylinderGeometry(0.13, 0.11, 0.12, 10).rotateX(Math.PI / 2), M4(0, 0.04, 0.12), '#3a3645');
      b.box(0, -0.12, -0.25, 0.07, 0.2, 0.1, '#3a3645'); b.box(0, 0.17, -0.4, 0.05, 0.1, 0.2, rc);
      const g = b.build(); this.cache[k] = g; return g;
    }
    if (type === 'pistol') {
      b.box(0, 0.03, -0.12, 0.09, 0.11, 0.3, dark); b.box(0, -0.08, -0.03, 0.08, 0.17, 0.09, mid); b.box(0, 0.09, -0.12, 0.095, 0.02, 0.3, rc);
    } else {
      b.box(0, 0, -L * 0.35, 0.1, 0.14, L * 0.7, dark);
      b.box(0, 0.07, -L * 0.35, 0.105, 0.025, L * 0.6, rc);
      b.addGeo(new THREE.CylinderGeometry(0.03, 0.03, L * 0.4, 6).rotateX(Math.PI / 2), M4(0, 0.01, -L * 0.85), mid);
      b.box(0, -0.02, L * 0.12, 0.08, 0.13, L * 0.28, type === 'shotgun' ? '#8a5a3c' : mid);
      if (type !== 'shotgun') b.box(0, -0.13, -L * 0.3, 0.07, 0.18, 0.1, mid);
      else b.box(0, -0.06, -L * 0.6, 0.11, 0.07, 0.22, '#8a5a3c');
      if (type === 'sniper') { b.addGeo(new THREE.CylinderGeometry(0.045, 0.05, 0.36, 8).rotateX(Math.PI / 2), M4(0, 0.14, -L * 0.35), '#1a1a2e'); }
      if (type === 'minigun') { for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; b.addGeo(new THREE.CylinderGeometry(0.022, 0.022, L * 0.5, 5).rotateX(Math.PI / 2), M4(Math.cos(a) * 0.05, Math.sin(a) * 0.05, -L * 0.85), mid); } }
    }
    const g = b.build(); this.cache[k] = g; return g;
  },
  glider(gl) {
    const k = 'g_' + gl.id; if (this.cache[k]) return this.cache[k];
    const b = new GeoBuilder();
    b.tri([0, 2.6, -1.2], [-2.4, 2.1, 0.8], [0, 2.4, 0.5], gl.a);
    b.tri([0, 2.6, -1.2], [0, 2.4, 0.5], [2.4, 2.1, 0.8], gl.b);
    b.box(0, 2.15, -0.2, 0.06, 0.6, 0.06, '#3a3645');
    b.box(0, 1.85, -0.2, 1.0, 0.06, 0.06, '#3a3645');
    const g = b.build(); this.cache[k] = g; return g;
  },
  bus() {
    const b = new GeoBuilder();
    b.box(0, 0, 0, 4, 3.4, 11, '#3ea8ff');
    b.box(0, -1.4, 0, 4.1, 0.6, 11.1, '#ffcf3f');
    for (let i = -4; i <= 4; i += 2) { b.box(2.02, 0.5, i, 0.05, 1.2, 1.4, '#c8f0ff'); b.box(-2.02, 0.5, i, 0.05, 1.2, 1.4, '#c8f0ff'); }
    b.box(0, 0.6, -5.52, 3.4, 1.4, 0.05, '#c8f0ff');
    b.addGeo(new THREE.SphereGeometry(5.5, 14, 10), M4(0, 9, 0, 0, 0, 0, 1, 1.15, 1), '#ff4f8b');
    b.addGeo(new THREE.SphereGeometry(5.6, 14, 2, 0, TAU, Math.PI * 0.45, Math.PI * 0.1), M4(0, 9, 0, 0, 0, 0, 1, 1.15, 1), '#ffffff');
    for (const [x, z] of [[-1.8, -4.5], [1.8, -4.5], [-1.8, 4.5], [1.8, 4.5]]) b.box(x, 4.5, z, 0.08, 5.4, 0.08, '#3a3645');
    b.addGeo(new THREE.CylinderGeometry(0.6, 0.6, 0.5, 10).rotateZ(Math.PI / 2), M4(-2, -1.7, -3.5), '#2a2433');
    b.addGeo(new THREE.CylinderGeometry(0.6, 0.6, 0.5, 10).rotateZ(Math.PI / 2), M4(2, -1.7, -3.5), '#2a2433');
    b.addGeo(new THREE.CylinderGeometry(0.6, 0.6, 0.5, 10).rotateZ(Math.PI / 2), M4(-2, -1.7, 3.5), '#2a2433');
    b.addGeo(new THREE.CylinderGeometry(0.6, 0.6, 0.5, 10).rotateZ(Math.PI / 2), M4(2, -1.7, 3.5), '#2a2433');
    return new THREE.Mesh(b.build(), this.mat);
  },
  kart(color) {
    const b = new GeoBuilder();
    b.box(0, 0.55, 0, 1.9, 0.5, 3.2, color);
    b.box(0, 0.95, 0.5, 1.2, 0.5, 1.0, '#2a2433');
    b.box(0, 1.35, 0.95, 1.2, 0.5, 0.15, '#2a2433');
    b.box(0, 0.9, -1.3, 1.6, 0.3, 0.5, '#ffffff');
    b.box(0, 1.25, -0.6, 0.06, 0.5, 0.06, '#3a3645');
    b.addGeo(new THREE.TorusGeometry(0.25, 0.04, 5, 10), M4(0, 1.45, -0.5, -0.5, 0, 0), '#3a3645');
    for (const [x, z] of [[-1.05, -1.1], [1.05, -1.1], [-1.05, 1.1], [1.05, 1.1]]) b.addGeo(new THREE.CylinderGeometry(0.42, 0.42, 0.35, 10).rotateZ(Math.PI / 2), M4(x, 0.42, z), '#1a1a2e');
    b.box(0.6, 0.7, 1.62, 0.3, 0.15, 0.05, '#ff3b3b'); b.box(-0.6, 0.7, 1.62, 0.3, 0.15, 0.05, '#ff3b3b');
    b.box(0.6, 0.7, -1.62, 0.3, 0.15, 0.05, '#fff6c2'); b.box(-0.6, 0.7, -1.62, 0.3, 0.15, 0.05, '#fff6c2');
    return new THREE.Mesh(b.build(), this.mat);
  },
  chest(open) {
    const k = 'chest' + (open ? 1 : 0); if (this.cache[k]) return this.cache[k];
    const b = new GeoBuilder();
    b.box(0, 0.35, 0, 1.2, 0.7, 0.75, '#c8862e'); b.box(0, 0.35, 0, 1.24, 0.12, 0.79, '#ffcf3f');
    b.box(-0.55, 0.35, 0, 0.12, 0.72, 0.8, '#ffcf3f'); b.box(0.55, 0.35, 0, 0.12, 0.72, 0.8, '#ffcf3f');
    if (!open) { b.box(0, 0.82, 0, 1.22, 0.25, 0.77, '#d9952f'); b.box(0, 0.72, -0.4, 0.2, 0.22, 0.06, '#ffe98a'); }
    else { b.addGeo(new THREE.BoxGeometry(1.22, 0.25, 0.77), M4(0, 1.0, 0.45, -1.2, 0, 0), '#d9952f'); }
    const g = b.build(); this.cache[k] = g; return g;
  },
  supply() {
    const b = new GeoBuilder();
    b.box(0, 0.7, 0, 1.6, 1.4, 1.6, '#3e6bd6'); b.box(0, 0.7, 0, 1.64, 0.25, 1.64, '#ffcf3f'); b.box(0, 0.7, 0, 0.25, 1.44, 1.64, '#ffcf3f');
    b.addGeo(new THREE.SphereGeometry(2.4, 12, 8, 0, TAU, 0, Math.PI / 2), M4(0, 5.2, 0), '#ff4f8b');
    for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) b.addGeo(new THREE.CylinderGeometry(0.03, 0.03, 4, 4), M4(x * 1.6, 3.3, z * 1.6, z * 0.35, 0, -x * 0.35), '#ffffff');
    return b.build();
  },
  consumable(type) {
    const k = 'cons_' + type; if (this.cache[k]) return this.cache[k];
    const c = CONS[type]; const b = new GeoBuilder();
    if (type === 'bouncy' || type === 'smoke' || type === 'bubble') { b.addGeo(new THREE.SphereGeometry(type === 'smoke' ? 0.16 : 0.2, 8, 6), M4(0, 0, 0, 0, 0, 0, 1, type === 'smoke' ? 1.6 : 1, 1), c.c); b.box(0, type === 'smoke' ? 0.28 : 0.2, 0, 0.08, 0.1, 0.08, '#3a3645'); }
    else if (type === 'grenade') { b.addGeo(new THREE.SphereGeometry(0.2, 8, 6), null, '#4f9a3f'); b.box(0, 0.2, 0, 0.1, 0.12, 0.1, '#3a3645'); }
    else if (type === 'shieldS' || type === 'shieldB' || type === 'fizz') { const s = type === 'shieldB' ? 1.4 : 1; b.addGeo(new THREE.CylinderGeometry(0.15 * s, 0.17 * s, 0.4 * s, 8), null, c.c); b.addGeo(new THREE.CylinderGeometry(0.06 * s, 0.06 * s, 0.15 * s, 6), M4(0, 0.25 * s, 0), '#ffffff'); }
    else { const s = type === 'medkit' ? 1.5 : 1; b.box(0, 0, 0, 0.45 * s, 0.3 * s, 0.3 * s, '#ffffff'); b.box(0, 0, -0.151 * s, 0.25 * s, 0.08 * s, 0.01, c.c); b.box(0, 0, -0.151 * s, 0.08 * s, 0.25 * s, 0.01, c.c); }
    const g = b.build(); this.cache[k] = g; return g;
  },
  ammo(type) {
    const k = 'ammo_' + type; if (this.cache[k]) return this.cache[k];
    const b = new GeoBuilder(); b.box(0, 0, 0, 0.42, 0.26, 0.3, '#4b4f5c'); b.box(0, 0.14, 0, 0.44, 0.06, 0.32, AMMO[type].c);
    const g = b.build(); this.cache[k] = g; return g;
  },
};

let FIGHTER_ID = 0;
class Fighter {
  constructor(o) {
    this.id = FIGHTER_ID++;
    this.name = o.name; this.team = o.team; this.isPlayer = !!o.isPlayer; this.isBot = !o.isPlayer;
    this.skin = SKINS.find(s => s.id === o.skin) || SKINS[0];
    this.gliderDef = GLIDERS.find(g => g.id === o.glider) || GLIDERS[0];
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.vy = 0;
    this.yaw = 0; this.pitch = 0; this.hp = 100; this.sh = 0; this.alive = true;
    this.slots = [null, null, null, null, null]; this.cur = 0;
    this.ammo = { light: 0, medium: 0, shells: 0, heavy: 0 };
    this.state = 'bus'; this.onGround = false; this.crouch = false; this.ads = false;
    this.fireT = 0; this.reloadT = 0; this.useT = 0; this.using = null; this.switchT = 0;
    this.kills = 0; this.dmgDone = 0; this.lastHitBy = null; this.headshots = 0;
    this.walk = 0; this.moveAmt = 0; this.recoil = 0; this.inStorm = false; this.emoteT = 0;
    this.kart = null; this.spread = 0; this.lastShotT = -10;
    this.knocked = false; this.bleed = 0; this.reviveT = 0; this.slideT = 0; this.kick = 0; this.flashT = 0; this.padT = 0;
    this.createMesh();
  }
  createMesh() {
    const g = Models.char(this.skin);
    const root = new THREE.Group();
    const mat = this.mat = Models.mat.clone(); mat.emissive = new THREE.Color(0, 0, 0);
    const body = new THREE.Mesh(g.body, mat); body.castShadow = true; root.add(body);
    const legL = new THREE.Mesh(g.leg, mat); legL.position.set(-0.15, 0.78, 0); legL.castShadow = true; root.add(legL);
    const legR = new THREE.Mesh(g.leg, mat); legR.position.set(0.15, 0.78, 0); legR.castShadow = true; root.add(legR);
    const arms = new THREE.Group(); arms.position.set(0, 1.38, 0); root.add(arms);
    const armM = new THREE.Mesh(g.arms, mat); arms.add(armM);
    const gun = new THREE.Mesh(Models.weapon('pistol', 0), mat); gun.position.set(0.16, -0.12, -0.5); gun.visible = false; arms.add(gun);
    this.outl = [];
    if (Look.toon) { this.outl.push(Look.addOutline(body, 0.035), Look.addOutline(legL, 0.03), Look.addOutline(legR, 0.03), Look.addOutline(armM, 0.03), Look.addOutline(gun, 0.022)); }
    const sh = new THREE.Mesh(Models.shadowGeo, Models.shadowMat); sh.renderOrder = 1; root.add(sh);
    const glider = new THREE.Mesh(Models.glider(this.gliderDef), Models.gliderMat); glider.visible = false; root.add(glider);
    this.mesh = root; this.parts = { body, legL, legR, arms, gun, sh, glider };
    this.gunKey = '';
  }
  get item() { return this.slots[this.cur]; }
  get weapon() { const it = this.slots[this.cur]; return it && it.kind === 'weapon' ? it : null; }
  get eyeY() { return this.pos.y + (this.crouch ? 1.25 : 1.65); }
  refreshGun() {
    const w = this.weapon; const it = this.item;
    const key = w ? w.w + w.rar : it ? 'c' + it.c : '';
    if (key === this.gunKey) return; this.gunKey = key;
    const gun = this.parts.gun;
    if (w) { gun.geometry = Models.weapon(w.w, w.rar); gun.visible = true; gun.position.set(0.16, -0.12, -0.5); }
    else if (it && it.kind === 'cons') { gun.geometry = Models.consumable(it.c); gun.visible = true; gun.position.set(0.1, -0.12, -0.6); }
    else gun.visible = false;
    if (gun.userData.outline) { Look.onormal(gun.geometry); gun.userData.outline.geometry = gun.geometry; }
  }
  // ---------- inventaire ----------
  freeSlot() { return this.slots.findIndex(s => !s); }
  addCons(type, n) {
    const def = CONS[type];
    for (const s of this.slots) if (s && s.kind === 'cons' && s.c === type && s.n < def.stack) { const add = Math.min(n, def.stack - s.n); s.n += add; n -= add; if (n <= 0) return 0; }
    while (n > 0) { const i = this.freeSlot(); if (i < 0) break; const add = Math.min(n, def.stack); this.slots[i] = { kind: 'cons', c: type, n: add }; n -= add; }
    return n;
  }
  weaponScore(it) { if (!it || it.kind !== 'weapon') return 0; const W = WEAPONS[it.w]; if (W.grapple) return 1; return (W.dmg * W.pellets / W.rate) * RARITY[it.rar].m * (it.w === 'sniper' ? 0.8 : 1) + (it.w === 'shotgun' ? 60 : 0); }
  hasHeal() { return this.slots.some(s => s && s.kind === 'cons' && !CONS[s.c].throw); }
  totalAmmoFor(w) { return this.ammo[WEAPONS[w.w].ammo]; }
}

// ---------- combat ----------
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
function raySphere(o, d, cx, cy, cz, r) {
  const ox = o.x - cx, oy = o.y - cy, oz = o.z - cz;
  const b = ox * d.x + oy * d.y + oz * d.z; const c = ox * ox + oy * oy + oz * oz - r * r;
  const disc = b * b - c; if (disc < 0) return -1;
  const t = -b - Math.sqrt(disc); return t;
}
// trace une balle : renvoie {t, target, head}
function traceShot(shooter, o, d, range, minT) {
  let t = World.ray(o.x, o.y, o.z, d.x, d.y, d.z, range);
  let target = null, head = false;
  for (const f of Game.fighters) {
    if (!f.alive || f === shooter || (f.team === shooter.team) || f.state === 'bus') continue;
    const dx = f.pos.x - o.x, dz = f.pos.z - o.z; if (dx * dx + dz * dz > (t + 2) * (t + 2)) continue;
    if (f.knocked) { const tk = raySphere(o, d, f.pos.x, f.pos.y + 0.35, f.pos.z, 0.55); if (tk > minT && tk < t) { t = tk; target = f; head = false; } continue; }
    const cr = f.crouch ? -0.4 : 0;
    const k = f.kart ? 0.4 : 0;
    let th = raySphere(o, d, f.pos.x, f.pos.y + 1.72 + cr + k, f.pos.z, 0.33);
    if (th > minT && th < t) { t = th; target = f; head = true; }
    for (const [yy, rr] of [[1.1, 0.46], [0.5, 0.4]]) {
      const tb = raySphere(o, d, f.pos.x, f.pos.y + yy + cr * (yy > 1 ? 1 : 0.5) + k, f.pos.z, rr);
      if (tb > minT && tb < t) { t = tb; target = f; head = false; }
    }
  }
  return { t, target, head };
}

function muzzlePos(f, out) {
  const a = f.yaw, cp = Math.cos(f.pitch), sp = Math.sin(f.pitch);
  const fx = -Math.sin(a) * cp, fz = -Math.cos(a) * cp;
  const rx = Math.cos(a), rz = -Math.sin(a);
  const len = f.weapon ? WEAPONS[f.weapon.w].len : 0.5;
  const y = f.pos.y + (f.crouch ? 1.0 : 1.3) + (f.kart ? 0.4 : 0);
  return out.set(f.pos.x + rx * 0.16 + fx * (0.5 + len), y + sp * (0.5 + len), f.pos.z + rz * 0.16 + fz * (0.5 + len));
}

function canFire(f) {
  const w = f.weapon; if (!w || !f.alive || f.knocked) return false;
  if (f.fireT > 0 || f.reloadT > 0 || f.switchT > 0 || f.state !== 'ground' || f.slipT > 0 || f.flatT > 0 || f.stunT > 0 || f.grapple) return false;
  if (w.mag <= 0) { if (WEAPONS[w.w].ammo === null) { f.slots[f.cur] = null; return false; } startReload(f); return false; }
  return true;
}
function startReload(f) {
  const w = f.weapon; if (!w || f.reloadT > 0) return;
  const W = WEAPONS[w.w]; if (!W.ammo || w.mag >= W.mag || f.ammo[W.ammo] <= 0) return;
  f.reloadT = W.reload * (1 - RARITY[w.rar].r); f.using = null;
  if (f.isPlayer) Sfx.reload();
}
function finishReload(f) {
  const w = f.weapon; if (!w) return; const W = WEAPONS[w.w];
  const need = W.mag - w.mag; const take = Math.min(need, f.ammo[W.ammo]);
  w.mag += take; f.ammo[W.ammo] -= take;
}

// tir du joueur : direction de visée précise (rayon caméra)
function playerShoot(f, camPos, camDir, camMinT) {
  if (!canFire(f)) return false;
  const w = f.weapon, W = WEAPONS[w.w];
  f.using = null; f.useT = 0;
  const moving = f.moveAmt > 0.3;
  let spr = (f.ads ? W.ads : W.spread) * (moving ? 1.45 : 1) * (f.crouch ? 0.7 : 1) * (f.onGround ? 1 : 2) + f.spread;
  if (W.scope && f.ads) spr = moving ? 0.01 : 0;
  muzzlePos(f, _v1);
  let anyHit = false;
  if (W.grapple) {
    if (Gags.fireGrapple(f, camPos, camDir)) { w.mag--; f.fireT = W.rate; if (w.mag <= 0) f.slots[f.cur] = null; }
    return false;
  }
  if (W.projectile) {
    const r = traceShot(f, camPos, camDir, W.range, camMinT);
    _v3.copy(camPos).addScaledVector(camDir, r.t);
    const bolt = W.projectile === 'bolt';
    if (bolt) _v3.y += r.t * r.t * 0.00045; // compense la gravité
    Game.fireRocket(f, _v1, _v2.copy(_v3).sub(_v1).normalize(), w.rar, bolt ? 'bolt' : 'rocket');
    Effects.flash(_v1); w.mag--; f.fireT = W.rate; f.lastShotT = Game.time; if (bolt) Sfx.shot(W, 0); else Sfx.rocket(0); f.recoil += bolt ? 0.03 : 0.06; f.kick = 0.5;
    if (Settings.camShake) Game.shake = Math.max(Game.shake, 0.3);
    Game.noise(f, 120);
    if (w.mag <= 0) setTimeout(() => { if (f.weapon === w) startReload(f); }, 300);
    return false;
  }
  for (let p = 0; p < W.pellets; p++) {
    _v2.copy(camDir);
    if (spr > 0) { _v2.x += (Math.random() - 0.5) * 2 * spr; _v2.y += (Math.random() - 0.5) * 2 * spr; _v2.z += (Math.random() - 0.5) * 2 * spr; _v2.normalize(); }
    const r = traceShot(f, camPos, _v2, W.range, camMinT);
    _v3.copy(camPos).addScaledVector(_v2, r.t);
    // vérifie l'obstacle entre la bouche du canon et le point visé
    const dx = _v3.x - _v1.x, dy = _v3.y - _v1.y, dz = _v3.z - _v1.z; const L = Math.hypot(dx, dy, dz);
    let blocked = false;
    if (L > 1) { const bt = World.ray(_v1.x, _v1.y, _v1.z, dx / L, dy / L, dz / L, L - 0.4, true); if (bt < L - 0.6) { blocked = true; _v3.set(_v1.x + dx / L * bt, _v1.y + dy / L * bt, _v1.z + dz / L * bt); } }
    if (r.target && !blocked) {
      const d = Math.sqrt(dist2(f.pos.x, f.pos.z, r.target.pos.x, r.target.pos.z));
      const dmg = weaponDamage(W, w.rar, d, r.head);
      applyDamage(r.target, dmg, f, r.head, w.w, _v3);
      anyHit = true;
    } else {
      if (p < 3) Effects.impact(_v3);
      if (!blocked && World.lastWall && World.lastWall.crate) Game.damageCrate(World.lastWall.crate, weaponDamage(W, w.rar, 10, false), _v3);
    }
    if (p < (W.pellets > 1 ? 4 : 1)) Effects.tracer(_v1, _v3, W.pellets > 1);
  }
  Effects.flash(_v1); Effects.casing(_v1, f.yaw);
  w.mag--; f.fireT = W.rate; f.lastShotT = Game.time; f.kick = W.pellets > 1 || W.scope ? 0.45 : 0.18;
  if (W.burst) { if (f.burstLeft > 0) { f.burstLeft--; f.fireT = f.burstLeft > 0 ? 0.07 : W.rate; } else { f.burstLeft = W.burst - 1; f.fireT = 0.07; } }
  f.spread = Math.min(f.spread + W.spread * 0.25, W.spread * 1.2);
  Sfx.shot(W, 0); Game.lastCombat = Game.time;
  Game.noise(f, W.range > 300 ? 160 : 90);
  // recul
  const rec = W.pellets > 1 ? 0.05 : W.scope ? 0.06 : W.rate < 0.1 ? 0.009 : 0.016;
  f.recoil += rec;
  if (Settings.camShake) Game.shake = Math.max(Game.shake, W.pellets > 1 || W.scope ? 0.25 : 0.08);
  if (w.mag <= 0) setTimeout(() => { if (f.weapon === w) startReload(f); }, 250);
  return anyHit;
}

function weaponDamage(W, rar, d, head) {
  let dmg = W.dmg * RARITY[rar].m;
  if (W.pellets > 1) dmg *= clamp(1.25 - d / W.range, 0.25, 1);
  else if (W.range < 150) dmg *= clamp(1.15 - d / (W.range * 1.4), 0.55, 1);
  if (head) dmg *= W.head;
  return Math.round(dmg);
}

// tir d'un bot : modèle probabiliste
function botShoot(f, target, dist) {
  if (!canFire(f)) return;
  const w = f.weapon, W = WEAPONS[w.w]; const L = Game.botLevel;
  muzzlePos(f, _v1);
  const tgtMove = target.moveAmt > 0.3 ? 0.75 : 1;
  const warm = clamp(f.ai.engageT / 1.2, 0.35, 1);
  let p = L.acc * warm * tgtMove * (target.crouch ? 0.85 : 1) * clamp(1.1 - dist / (W.range * 1.05), 0.05, 1);
  if (W.scope) p *= 1.4; if (W.pellets > 1) p = clamp(p * 2.2, 0, 0.9);
  if (Game.time < 100) p *= 0.6; // atterrissage : les bots visent moins bien
  if (target.isPlayer && Game.time - Game.matchStart < 25) p *= 0.7;
  if (target.kart) p *= 0.7;
  const tp = _v2.set(target.pos.x, target.pos.y + 1.1 + (target.kart ? 0.4 : 0), target.pos.z);
  if (W.projectile) {
    const err = (1 - L.acc) * dist * 0.12;
    _v3.set(tp.x + (Math.random() - 0.5) * err, tp.y - 0.8 + (Math.random() - 0.5) * err * 0.5, tp.z + (Math.random() - 0.5) * err).sub(_v1).normalize();
    const bolt = W.projectile === 'bolt'; if (bolt) _v3.y += dist * 0.0005;
    Game.fireRocket(f, _v1, _v3, w.rar, bolt ? 'bolt' : 'rocket');
    w.mag--; f.fireT = W.rate * 1.6; f.lastShotT = Game.time;
    if (Game.player && dist2(f.pos.x, f.pos.z, Game.camPos.x, Game.camPos.z) < 160 * 160) Sfx.rocket(Math.sqrt(dist2(f.pos.x, f.pos.z, Game.camPos.x, Game.camPos.z)));
    Game.noise(f, 120); return;
  }
  let hits = 0, headHit = false;
  const visible = World.los(_v1, tp);
  for (let k = 0; k < (W.burst || W.pellets); k++) if (visible && Math.random() < p) { hits++; if (Math.random() < 0.12 + L.acc * 0.2) headHit = true; }
  const nearPlayer = Game.player && dist2(f.pos.x, f.pos.z, Game.camPos.x, Game.camPos.z) < 160 * 160;
  if (hits > 0) {
    let dmg = 0; for (let k = 0; k < hits; k++) dmg += weaponDamage(W, w.rar, dist, headHit && k === 0);
    applyDamage(target, dmg, f, headHit, w.w, tp);
    if (nearPlayer) Effects.tracer(_v1, tp, W.pellets > 1);
  } else if (nearPlayer) {
    _v3.copy(tp).add(_v3.set((Math.random() - 0.5) * 3, (Math.random() - 0.3) * 2, (Math.random() - 0.5) * 3));
    Effects.tracer(_v1, _v3, W.pellets > 1);
    if (target.isPlayer && dist < 40) Sfx.tone(3000 + Math.random() * 800, 0.05, 0.05, 'sine', 0.5); // sifflement
  }
  if (nearPlayer) { Effects.flash(_v1); Sfx.shot(W, Math.sqrt(dist2(f.pos.x, f.pos.z, Game.camPos.x, Game.camPos.z))); }
  w.mag = Math.max(0, w.mag - (W.burst || 1)); f.fireT = W.rate * (W.auto ? 1.15 : 1.35 + Math.random() * 0.5); f.lastShotT = Game.time;
  Game.noise(f, W.range > 300 ? 160 : 90);
}

function applyDamage(t, dmg, att, head, wtype, at) {
  if (!t.alive || dmg <= 0) return;
  if (Game.godMode && t.isPlayer) return;
  t.flashT = 0.12;
  if (t.knocked) {
    t.bleed -= dmg * 0.8; if (att && att !== t) t.lastHitBy = att;
    if (att && att.isPlayer && at) { if (Settings.dmgNumbers) HUD.dmgNumber(at, dmg, false, false); HUD.hitmarker(false, t.bleed <= 0); Sfx.hit(false); }
    if (t.bleed <= 0) eliminate(t, att, wtype, head);
    return;
  }
  let rem = dmg; let broke = false;
  if (t.sh > 0 && wtype !== 'storm') { const a = Math.min(t.sh, rem); t.sh -= a; rem -= a; if (t.sh <= 0) broke = true; }
  t.hp -= rem;
  if (att && att !== t) t.lastHitBy = att;
  if (att && att.isBot === false && att.isPlayer) {
    att.dmgDone += dmg; Game.stat('damage', dmg); if (head) { att.headshots++; Game.stat('head', 1); }
    if (Settings.dmgNumbers && at) HUD.dmgNumber(at, dmg, head, t.sh > 0 || broke);
    HUD.hitmarker(head, t.hp <= 0); Sfx.hit(head); if (broke) { Sfx.shieldBreak(); Haptic.play('shield'); } else Haptic.play(head ? 'head' : 'hit'); Game.lastCombat = Game.time;
  } else if (att && att.ai) att.dmgDone += dmg;
  if (t.isPlayer) {
    if (att && att !== t) HUD.damageFrom(att.pos); Sfx.hurt(); Haptic.play('hurt'); Game.lastCombat = Game.time;
    if (Settings.camShake) Game.shake = Math.max(Game.shake, 0.15);
    t.using = null;
  }
  if (t.ai && att && att !== t && att.alive) t.ai.onHit(att);
  if (t.hp <= 0) {
    // Duo : mis à terre si un coéquipier est encore debout
    const mateUp = Game.mode.team > 1 && wtype !== 'storm' && Game.fighters.some(o => o !== t && o.alive && o.team === t.team && !o.knocked);
    if (mateUp) knockDown(t, att, wtype); else eliminate(t, att, wtype, head);
  }
}

function knockDown(t, att, wtype) {
  t.knocked = true; t.hp = 1; t.sh = 0; t.bleed = 100; t.using = null; t.reloadT = 0; t.crouch = false; t.ads = false; t.slideT = 0;
  if (t.kart) { t.kart.driver = null; t.kart = null; }
  HUD.feed(`<b class="${att && att.isPlayer ? 'me' : ''}">${att ? att.name : '?'}</b> ⤓ <b class="${t.isPlayer ? 'me' : t.team === Game.playerTeam ? 'ally' : ''}">${t.name}</b> <i>à terre</i>`);
  if (att && att.isPlayer) { HUD.killBanner(t.name + ' à terre', att.kills); Sfx.kill(); }
  if (t.isPlayer) { HUD.message('Tu es <b>à terre</b> ! Rampe à couvert, ton coéquipier peut te réanimer', 3, 'bad'); Haptic.play('knock'); }
  else if (t.team === Game.playerTeam) HUD.message('Ton coéquipier est à terre ! Va le <b>réanimer</b>', 3, 'bad');
}
function revive(t) {
  t.knocked = false; t.hp = 30; t.bleed = 0; t.reviveT = 0;
  HUD.feed(`<b class="${t.isPlayer ? 'me' : t.team === Game.playerTeam ? 'ally' : ''}">${t.name}</b> <i>est réanimé·e</i>`);
  if (t.team === Game.playerTeam) Sfx.heal();
}

function eliminate(t, att, wtype, head) {
  if (!t.alive) return;
  t.alive = false; t.hp = 0; t.state = 'dead'; t.knocked = false;
  if (t.kart) { t.kart.driver = null; t.kart = null; }
  Game.dropLoot(t);
  Effects.poof(t.pos);
  t.mesh.visible = false;
  let txt;
  const wn = wtype && WEAPONS[wtype] ? WEAPONS[wtype].short.toLowerCase() : null;
  if (att && att !== t) {
    att.kills++;
    txt = `<b class="${att.isPlayer ? 'me' : att.team === Game.playerTeam ? 'ally' : ''}">${att.name}</b> ${head ? '🎯' : '›'} <b class="${t.isPlayer ? 'me' : t.team === Game.playerTeam ? 'ally' : ''}">${t.name}</b> <i>${wn || ''}</i>`;
    if (att.isPlayer) { Game.stat('kills', 1); if (wtype === 'sniper') Game.stat('sniperk', 1); if (wtype === 'shotgun') Game.stat('shotgunk', 1); HUD.killBanner(t.name, att.kills); Sfx.kill(); Haptic.play('kill'); Announcer.onPlayerKill(att.kills); Game.hitStop(); }
  } else if (wtype === 'storm') txt = `<b class="${t.isPlayer ? 'me' : ''}">${t.name}</b> a été emporté·e par la tempête`;
  else txt = `<b class="${t.isPlayer ? 'me' : ''}">${t.name}</b> est tombé·e`;
  HUD.feed(txt);
  // plus personne debout dans l'équipe : les coéquipiers à terre sont éliminés
  if (Game.mode.team > 1 && !Game.fighters.some(o => o.alive && o.team === t.team && !o.knocked)) {
    for (const o of Game.fighters) if (o.alive && o.team === t.team && o.knocked) eliminate(o, o.lastHitBy || att, wtype, false);
  }
  Game.onElimination(t, att);
}
