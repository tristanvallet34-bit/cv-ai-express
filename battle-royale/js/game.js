// ============ TOON ROYALE — moteur de partie ============
'use strict';

const QUALITY = {
  low: { n: 'Économie', pr: 0.7, fog: 180, shadows: false, aa: false, blob: true, grass: 0, post: false, treeOl: false, smap: 0 },
  medium: { n: 'Équilibré', pr: 1.0, fog: 280, shadows: false, aa: false, blob: true, grass: 2200, post: false, treeOl: false, smap: 0 },
  high: { n: 'Beau', pr: 1.35, fog: 400, shadows: true, aa: false, blob: false, grass: 5000, post: true, treeOl: true, smap: 1024 },
  ultra: { n: 'Ultra', pr: 2, fog: 540, shadows: true, aa: false, blob: false, grass: 9000, post: true, treeOl: true, smap: 2048 },
};

const _v1c = new THREE.Color();
const Game = {
  phase: 'lobby', paused: false, time: 0, matchStart: 0, fighters: [], bots: [], player: null,
  loot: [], chests: [], karts: [], grenades: [], supplies: [], shotMarks: [],
  camPos: new THREE.Vector3(), camDir: new THREE.Vector3(0, 0, -1), camYaw: 0, camPitch: 0, shake: 0,
  aimTarget: null, interactable: null, chestHold: 0, spectating: null, matchStats: {}, dynScale: 1,
  rockets: [], timeScale: 1, slowT: 0, victoryT: 0, reviveHold: 0, stormFlash: 0, heartT: 0, windT: 0,
  storm: { cx: 0, cz: 0, r: 480, nx: 0, nz: 0, nr: 480, phase: 0, timer: 60, shrinking: false },

  init() {
    const cv = $('game');
    this.quality = this.resolveQuality();
    const Q = QUALITY[this.quality];
    this.renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: Q.aa, powerPreference: 'high-performance', stencil: false, alpha: true });
    this.renderer.setClearColor(0xbfe6ff);
    Look.init();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(Settings.fov, 1, 0.1, 1500);
    this.hemi = new THREE.HemisphereLight(0xdff3ff, 0x6b8f4a, 0.75); this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff2d6, 0.85); this.sun.position.set(80, 140, -60); this.scene.add(this.sun); this.scene.add(this.sun.target);
    this.amb = new THREE.AmbientLight(0xffffff, 0.18); this.scene.add(this.amb);
    this.scene.fog = new THREE.Fog(0xbfe6ff, 60, Q.fog);
    Models.init(); Effects.init(this.scene); Gags.init(this.scene);
    // tempête (mur animé)
    this.stormMesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 300, 96, 1, true), Look.stormMat());
    this.stormMesh.position.y = 120; this.stormMesh.visible = false; this.scene.add(this.stormMesh);
    // anneaux de rareté (loot)
    this.ringGeo = new THREE.RingGeometry(0.35, 0.55, 16).rotateX(-Math.PI / 2);
    this.ringMats = RARITY.map(r => new THREE.MeshBasicMaterial({ color: r.c, transparent: true, opacity: 0.75, depthWrite: false }));
    this.beamGeo = new THREE.CylinderGeometry(0.06, 0.12, 3, 6, 1, true); this.beamGeo.translate(0, 1.5, 0);
    this.beamMats = RARITY.map(r => new THREE.MeshBasicMaterial({ color: r.c, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }));
    this.chestMat = Look.mat({ vertexColors: true, emissive: 0x553300 });
    this.rocketGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.7, 8).rotateX(Math.PI / 2);
    this.boltGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.8, 5).rotateX(Math.PI / 2);
    const alg = new THREE.PlaneGeometry(0.22, 1).rotateX(-Math.PI / 2); alg.translate(0, 0, -0.5);
    this.aimLine = new THREE.Mesh(alg, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false, fog: false }));
    this.aimLine.visible = false; this.aimLine.renderOrder = 3;
    this.lootGroup = new THREE.Group(); this.scene.add(this.lootGroup);
    this.dynGroup = new THREE.Group(); this.scene.add(this.dynGroup); this.scene.add(this.aimLine);
    Post.init(this.renderer);
    World.build(this.scene);
    Events.init(this.scene);
    Look.applyTime('sunset');
    this.applyQuality();
    window.addEventListener('resize', () => this.resize()); this.resize();
    this.last = performance.now(); this.fpsAcc = 0; this.fpsN = 0; this.lowFpsT = 0;
    requestAnimationFrame(t => this.loop(t));
  },
  // détection de la puissance du GPU pour le mode « Auto »
  gpuTier() {
    if (this._tier) return this._tier;
    let name = '';
    try { const gl = this.renderer.getContext(); const ext = gl.getExtension('WEBGL_debug_renderer_info'); name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); } catch (e) { }
    this.gpuName = name || '?';
    const mobile = matchMedia('(pointer: coarse)').matches, mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
    let tier = mobile ? 'medium' : 'high';
    if (/Mali-[234T]|Mali-G(31|51|52|57)|Adreno \(TM\) [345]\d\d|PowerVR|SGX|Intel\(R\) HD Graphics [2-5]|SwiftShader|llvmpipe/i.test(name) || mem <= 2 || cores <= 2) tier = 'low';
    else if (mobile && (/Apple GPU|Adreno \(TM\) (7[3-9]\d|8\d\d)|Mali-G7[1-9]|Immortalis|Xclipse/i.test(name)) && mem >= 6) tier = 'high';
    else if (!mobile && /RTX|Radeon RX|Apple M[1-9]|GTX 1[06-9]|GTX [2-9]/i.test(name)) tier = 'ultra';
    this._tier = tier; return tier;
  },
  resolveQuality() {
    if (Settings.quality !== 'auto') return Settings.quality;
    return this.renderer ? this.gpuTier() : (matchMedia('(pointer: coarse)').matches ? 'medium' : 'high');
  },
  applyQuality() {
    this.quality = this.resolveQuality(); const Q = QUALITY[this.quality];
    this.pr = Math.min(window.devicePixelRatio || 1, Q.pr) * this.dynScale;
    this.renderer.setPixelRatio(this.pr);
    this.scene.fog.far = Q.fog; this.scene.fog.near = Q.fog * 0.3; this.camera.far = Q.fog + 1100;
    this.camera.updateProjectionMatrix();
    if (this.shadowsOn !== Q.shadows || this.smap !== Q.smap) {
      this.renderer.shadowMap.enabled = Q.shadows; this.sun.castShadow = Q.shadows;
      if (Q.shadows) {
        if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
        this.sun.shadow.mapSize.set(Q.smap, Q.smap); const c = this.sun.shadow.camera; c.left = -50; c.right = 50; c.top = 50; c.bottom = -50; c.near = 1; c.far = 500; c.updateProjectionMatrix(); this.sun.shadow.bias = -0.0012;
      }
      if (this.shadowsOn !== undefined) this.scene.traverse(o => { if (o.material && o.material.needsUpdate !== undefined && !o.material.isShaderMaterial) o.material.needsUpdate = true; });
      this.shadowsOn = Q.shadows; this.smap = Q.smap;
    }
    if (this.grassN !== Q.grass) { this.grassN = Q.grass; Look.grass(this.scene, Q.grass); }
    if (World.outl) { for (const o of World.outl.tree) o.visible = Q.treeOl; }
    this.postOn = Q.post && Post.ok;
    this.resize();
  },
  resize() {
    View.update(); const w = View.w, h = View.h;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    Post.setSize(w, h, this.pr || 1);
    document.documentElement.style.setProperty('--hud', Settings.hudScale * Math.min(1.15, Math.max(0.7, Math.min(w, h) / 420)));
  },

  // ---------------- démarrage d'une partie ----------------
  startMatch(modeId) {
    this.mode = MODES[modeId]; this.modeId = modeId; this.botLevel = BOT_LEVELS[Settings.botLevel] || BOT_LEVELS.normal;
    this.cleanup();
    let tod = Settings.timeOfDay;
    if (tod === 'random') { const r = Math.random(); tod = r < 0.3 ? 'day' : r < 0.55 ? 'morning' : r < 0.85 ? 'sunset' : 'night'; }
    Gags.reset(); World.resetCrates();
    Look.applyTime(tod); this.applyQuality(); this.stormMix = 0; this._stormFog = true; this.timeScale = 1; this.slowT = 0; this.victoryT = 0; this.reviveHold = 0;
    this.phase = 'bus'; this.time = 0; this.matchStart = 0; this.paused = false; this.spectating = null; this.ended = false;
    this.matchStats = { kills: 0, chests: 0, damage: 0, heal: 0, head: 0, sniperk: 0, shotgunk: 0, drive: 0 };
    this.landedAt = null;
    // joueurs
    const n = this.mode.players, ts = this.mode.team;
    const names = BOT_NAMES.slice().sort(() => Math.random() - 0.5);
    const E = Profile.equip; this.player = new Fighter({ name: Settings.name || 'Joueur', team: 0, isPlayer: true, skin: Profile.skin, glider: Profile.glider, pack: E.packs, wrap: E.wraps, trail: E.trails, emote: E.emotes });
    this.ranked = !!Profile.ranked && ['solo', 'duo', 'squad'].includes(modeId); if (this.ranked) this.botLevel = Meta.botLevelForRank();
    this.playerTeam = 0;
    this.fighters = [this.player]; this.bots = [];
    for (let i = 1; i < n; i++) {
      const rc = cat => Math.random() < 0.35 ? pick(COSMETICS[cat]).id : undefined;
      const f = new Fighter({ name: names[i % names.length] + (i >= names.length ? i : ''), team: Math.floor(i / ts), skin: pick(SKINS).id, glider: pick(GLIDERS).id, pack: rc('packs'), wrap: rc('wraps'), trail: rc('trails'), emote: pick(COSMETICS.emotes).id });
      f.ai = new BotAI(f); this.fighters.push(f); this.bots.push(f);
    }
    for (const f of this.fighters) { f.input = { dx: 0, dz: 0, speed: 6, jump: false }; this.dynGroup.add(f.mesh); f.mesh.visible = false; }
    for (const f of this.fighters) if (f === this.player || f.team === 0 && this.mode.team > 1) { const P = f.parts, c = f === this.player ? '#ffcf3f' : '#2ee6c8'; for (const m of [P.body, P.legL, P.legR, P.arms.children[0]]) Look.addXray(m, c); }
    // loot
    for (const s of World.lootSpots) if (Math.random() < 0.85) this.spawnFloorLoot(s.x, s.z);
    for (const s of World.chestSpots) if (Math.random() < 0.8) this.spawnChest(s.x, s.z);
    this.spawnKarts();
    this.player.coins = 0; Events.reset();
    // tempête
    const st = this.storm; Object.assign(st, { cx: 0, cz: 0, r: this.mode.small ? 330 : 500, phase: 0, shrinking: false, timer: STORM_PHASES[0].wait * this.mode.storm });
    this.chooseNextCircle(); this.stormMesh.visible = true; this.supplyPhases = { 1: false, 3: false };
    const skipBus = Modes.setup(this);
    // bus
    const a = Math.random() * TAU, off = rand(-120, 120);
    const sx = Math.cos(a) * 560, sz = Math.sin(a) * 560;
    const ex = -sx + Math.cos(a + Math.PI / 2) * off, ez = -sz + Math.sin(a + Math.PI / 2) * off;
    if (!this.busMesh) { this.busMesh = Models.bus(); this.scene.add(this.busMesh); }
    this.busMesh.visible = !skipBus;
    const len = Math.hypot(ex - sx, ez - sz);
    this.bus = { sx, sz, ex, ez, t: 0, dur: len / 34, y: 150, active: !skipBus };
    if (skipBus) { this.phase = 'play'; this.matchStart = 0.001; this.stormMesh.visible = this.mode.rumble; }
    this.busMesh.rotation.y = Math.atan2(-(ex - sx), -(ez - sz));
    for (const b of this.bots) {
      const L = b.ai.pickLanding(); b.ai.landing = L;
      const dx = ex - sx, dz = ez - sz; let t = ((L.x - sx) * dx + (L.z - sz) * dz) / (len * len);
      b.ai.jumpT = clamp(t + rand(-0.1, 0.05), 0.06 + Math.random() * 0.05, 0.94);
    }
    // coéquipier en duo : saute avec le joueur
    if (!skipBus) { this.camYaw = this.busMesh.rotation.y; this.camPitch = -0.25; }
    HUD.reset(); Pings.reset(); Announcer.reset(); this.lastCombat = -99; Music.stop(); Music.start('game'); Music.intensity = Music.target = 0.3;
    Input.resetAll(); document.body.classList.remove('victory', 'lowhp', 'knocked');
    if (!skipBus) HUD.message('Le Bus Volant décolle ! Appuie sur <b>SAUTER</b> au-dessus de ta zone', 4);
    if (this.mod) setTimeout(() => HUD.message('Mode du jour : <b>' + dailyMod().n + '</b>', 3.5, 'poi'), 4200);
    document.body.classList.add('ingame');
  },
  cleanup() {
    for (const f of this.fighters) { this.dynGroup.remove(f.mesh); }
    for (const it of this.loot) this.lootGroup.remove(it.mesh);
    for (const c of this.chests) this.lootGroup.remove(c.mesh);
    for (const k of this.karts) this.dynGroup.remove(k.mesh);
    for (const g of this.grenades) this.dynGroup.remove(g.mesh);
    for (const r of this.rockets) this.dynGroup.remove(r.mesh);
    this.rockets = [];
    for (const s of this.supplies) { this.dynGroup.remove(s.mesh); if (s.smoke) this.dynGroup.remove(s.smoke); }
    this.fighters = []; this.bots = []; this.loot = []; this.chests = []; this.karts = []; this.grenades = []; this.supplies = []; this.shotMarks = [];
  },
  chooseNextCircle() {
    const st = this.storm; const P = STORM_PHASES[Math.min(st.phase, STORM_PHASES.length - 1)];
    st.nr = st.r * P.f;
    if (st.phase === 0) st.nr = this.mode.small ? 150 : 230;
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * TAU, d = Math.random() * (st.r - st.nr) * 0.85;
      const x = st.cx + Math.cos(a) * d, z = st.cz + Math.sin(a) * d;
      if (World.h(x, z) > 2 || i === 29) { st.nx = x; st.nz = z; break; }
    }
  },

  // ---------------- loot ----------------
  makeLoot(data, x, z, y) {
    const it = Object.assign({ pos: new THREE.Vector3(x, y != null ? y : World.ground(x, z) + 0.05, z), taken: false, t: Math.random() * 10 }, data);
    const g = new THREE.Group();
    let geo; let rar = 0;
    if (it.kind === 'weapon') { geo = Models.weapon(it.w, it.rar); rar = it.rar; }
    else if (it.kind === 'gag') { geo = Gags.geo.gagItem; rar = GAGS[it.g].rar; }
    else if (it.kind === 'cons') geo = Models.consumable(it.c);
    else if (it.kind === 'coins') geo = Models.coins();
    else if (it.kind === 'key') { geo = Models.key(); rar = 4; }
    else geo = Models.ammo(it.a);
    const m = new THREE.Mesh(geo, Models.mat); m.position.y = 0.55; if (it.kind === 'weapon') m.scale.setScalar(1.5); g.add(m);
    const ring = new THREE.Mesh(this.ringGeo, this.ringMats[it.kind === 'weapon' ? rar : it.kind === 'cons' ? 2 : 0]); ring.position.y = 0.06; g.add(ring);
    if (it.kind === 'weapon' && rar >= 2) { const beam = new THREE.Mesh(this.beamGeo, this.beamMats[rar]); g.add(beam); }
    g.position.copy(it.pos); it.mesh = g; it.inner = m;
    this.lootGroup.add(g); this.loot.push(it); return it;
  },
  rollWeapon(minR, bonus) {
    let w = pick(FLOOR_WEAPONS); if (this.mod === 'sniper') w = pick(['sniper', 'crossbow']); else if (this.mod === 'rockets') w = 'rocket'; if (w === 'rocket' && Math.random() < 0.55 && !minR) w = 'ar'; const W = WEAPONS[w];
    const rar = clamp(rollRarity(Math.max(W.min, minR || 0), W.max, bonus || 0), W.min, W.max);
    return { kind: 'weapon', w, rar, mag: W.mag };
  },
  spawnFloorLoot(x, z) {
    const r = Math.random();
    if (r < (this.mod === 'gags' ? 0.3 : 0.07)) { this.makeLoot({ kind: 'gag', g: pick(GAG_LIST) }, x, z); return; }
    if (r < 0.45) { const wd = this.rollWeapon(0); this.makeLoot(wd, x, z); const a = WEAPONS[wd.w].ammo; if (a) this.makeLoot({ kind: 'ammo', a, n: AMMO[a].pick * 2 }, x + 0.9, z + 0.4); }
    else if (r < 0.75) { const c = pick(FLOOR_CONS); this.makeLoot({ kind: 'cons', c, n: CONS[c].pick }, x, z); }
    else { const a = pick(Object.keys(AMMO)); this.makeLoot({ kind: 'ammo', a, n: AMMO[a].pick }, x, z); }
  },
  spawnChest(x, z) {
    const y = World.ground(x, z);
    const m = new THREE.Mesh(Models.chest(false), this.chestMat); m.position.set(x, y, z); m.rotation.y = Math.random() * TAU; this.lootGroup.add(m);
    this.chests.push({ pos: new THREE.Vector3(x, y, z), mesh: m, open: false, isChest: true });
  },
  openChest(c, f) {
    if (c.open) return; c.open = true; c.taken = true;
    if (c.isSupply) { c.mesh.visible = false; if (c.smoke) c.smoke.visible = false; }
    else c.mesh.geometry = Models.chest(true);
    const x = c.pos.x, z = c.pos.z;
    const wd = this.rollWeapon(c.isSupply || c.gold ? 4 : 1, c.isSupply ? 0 : 0.6);
    if (c.isSupply && Math.random() < 0.5) Object.assign(wd, { w: 'minigun', rar: 4, mag: WEAPONS.minigun.mag });
    if (c.isSupply && Math.random() < 0.3) Object.assign(wd, { w: 'sniper', rar: 4, mag: WEAPONS.sniper.mag });
    const a = WEAPONS[wd.w].ammo;
    const items = [wd, a ? { kind: 'ammo', a, n: AMMO[a].pick * 2 } : { kind: 'ammo', a: 'medium', n: 30 }, (() => { const cc = c.isSupply ? 'shieldB' : pick(FLOOR_CONS); return { kind: 'cons', c: cc, n: CONS[cc].pick * (c.isSupply ? 2 : 1) }; })()];
    if (c.isSupply) items.push({ kind: 'cons', c: 'medkit', n: 2 });
    if (c.isSupply || Math.random() < 0.5) items.push({ kind: 'gag', g: pick(GAG_LIST) });
    items.forEach((d, i) => { const ang = i / items.length * TAU + 0.5; this.makeLoot(d, x + Math.cos(ang) * 1.5, z + Math.sin(ang) * 1.5); });
    if (f.isPlayer) { Sfx.chest(); this.stat('chests', 1); }
    else if (dist2(f.pos.x, f.pos.z, this.player.pos.x, this.player.pos.z) < 40 * 40) Sfx.chest();
  },
  dropLoot(t) {
    let i = 0; const drop = d => { const a = i++ * 1.3; this.makeLoot(d, t.pos.x + Math.cos(a) * (1 + i * 0.25), t.pos.z + Math.sin(a) * (1 + i * 0.25)); };
    for (const s of t.slots) if (s) drop(Object.assign({}, s, { kind: s.kind }));
    if (t.gag) { drop({ kind: 'gag', g: t.gag.g }); t.gag = null; }
    if (t.coins > 0) { drop({ kind: 'coins', n: t.coins }); t.coins = 0; }
    if (t.hasKey) { drop({ kind: 'key' }); t.hasKey = false; }
    if (t.isBoss) Events.bossDrop(t);
    for (const a in t.ammo) if (AMMO[a] && t.ammo[a] > 0) drop({ kind: 'ammo', a, n: t.ammo[a] });
    t.slots = [null, null, null, null, null];
  },
  pickup(f, it, auto) {
    if (it.taken) return false;
    if (it.kind === 'ammo') { f.ammo[it.a] = Math.min(AMMO[it.a].max, f.ammo[it.a] + it.n); }
    else if (it.kind === 'coins') { f.coins = (f.coins || 0) + it.n; if (f.isPlayer) { Sfx.tone(1320, 0.08, 0.15, 'square'); this.stat('coins', it.n); } }
    else if (it.kind === 'key') { f.hasKey = true; if (f.isPlayer) { HUD.message('🔑 Tu as la <b>clé du coffre-fort</b> ! Il est au Centre-Ville', 3.5); Announcer.say('Clé trouvée !', 'gold'); } }
    else if (it.kind === 'cons') {
      const left = f.addCons(it.c, it.n);
      if (left === it.n) {
        if (!f.isPlayer || auto) return false;
        // échange avec l'emplacement actuel
        const old = f.slots[f.cur]; if (old) this.makeLoot(Object.assign({}, old, { dropped: true }), f.pos.x, f.pos.z);
        f.slots[f.cur] = { kind: 'cons', c: it.c, n: it.n }; f.using = null;
      } else if (left > 0) { it.n = left; if (f.isPlayer) Sfx.pickup(); return true; }
    } else if (it.kind === 'gag') {
      if (f.gag && auto) return false;
      if (f.gag && f.gag.g !== it.g) this.makeLoot({ kind: 'gag', g: f.gag.g, dropped: true }, f.pos.x + 0.5, f.pos.z + 0.5);
      Gags.give(f, it.g);
    } else if (it.kind === 'weapon') {
      let idx = f.freeSlot();
      if (idx < 0 || (f.isBot && f.slots.filter(s => s && s.kind === 'weapon').length >= 3)) {
        if (f.isPlayer) { if (auto) return false; idx = f.cur; }
        else { // bot : remplace la pire arme
          let worst = -1, ws = Infinity; f.slots.forEach((s, i) => { if (s && s.kind === 'weapon') { const sc = f.weaponScore(s); if (sc < ws) { ws = sc; worst = i; } } });
          if (worst < 0 || f.weaponScore(it) <= ws) return false; idx = worst;
        }
        const old = f.slots[idx]; if (old) this.makeLoot(Object.assign({}, old, { dropped: f.isPlayer }), f.pos.x + 0.5, f.pos.z + 0.5);
      }
      f.slots[idx] = { kind: 'weapon', w: it.w, rar: it.rar, mag: it.mag };
      if (f.isPlayer && (!f.weapon || idx === f.cur || !f.item)) { f.cur = idx; f.switchT = 0.25; f.reloadT = 0; }
      if (f.isBot && !f.weapon) f.cur = idx;
    }
    it.taken = true; this.lootGroup.remove(it.mesh);
    if (f.isPlayer) Sfx.pickup();
    return true;
  },
  spawnKarts() {
    const cols = ['#ff4f8b', '#ffcf3f', '#2ee6c8', '#3ea8ff', '#8ee04a', '#ff8a3d', '#bd63ff', '#ffffff'];
    let i = 0;
    for (const p of World.pois) {
      if (p.type === 'cabin' && p.h > 30) continue;
      for (let t = 0; t < 20; t++) {
        const a = Math.random() * TAU, d = p.r + 8 + Math.random() * 10; const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
        if (World.h(x, z) < 2 || World.nearWall(x, z, 3)) continue;
        const m = Models.kart(cols[i % cols.length]); this.dynGroup.add(m);
        const k = { pos: new THREE.Vector3(x, World.h(x, z), z), yaw: Math.random() * TAU, speed: 0, mesh: m, driver: null, hp: 300 };
        this.karts.push(k); i++; break;
      }
    }
    // aéroglisseurs au bord de la rivière
    for (const [ia, t] of [[0, 0.6], [2, 0.5]]) {
      const A = World.river[ia], B = World.river[ia + 1]; const x = lerp(A[0], B[0], t) + 12, z = lerp(A[1], B[1], t) + 12;
      const m = Models.hover(); this.dynGroup.add(m);
      this.karts.push({ pos: new THREE.Vector3(x, Math.max(World.h(x, z), 0.25), z), yaw: Math.random() * TAU, speed: 0, mesh: m, driver: null, hp: 300, hover: true });
    }
  },
  spawnSupply() {
    const st = this.storm; const a = Math.random() * TAU, d = Math.random() * st.nr * 0.6;
    const x = st.nx + Math.cos(a) * d, z = st.nz + Math.sin(a) * d; if (World.h(x, z) < 1) return;
    const m = new THREE.Mesh(Models.supply(), Models.mat); m.position.set(x, 160, z); this.dynGroup.add(m);
    const smoke = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 2.2, 60, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0x6fd0ff, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }));
    smoke.position.set(x, World.ground(x, z) + 30, z); smoke.visible = false; this.dynGroup.add(smoke);
    this.supplies.push({ pos: new THREE.Vector3(x, 160, z), mesh: m, smoke, landed: false, open: false, isChest: true, isSupply: true });
    HUD.message('📦 Un <b>ravitaillement</b> tombe dans la zone !', 3.5);
  },
  throwGrenade(f) {
    const it = f.item; if (!it || !CONS[it.c] || !CONS[it.c].throw) return;
    const dir = f.isPlayer && !View.arcade() ? this.camDir.clone() : new THREE.Vector3(-Math.sin(f.yaw), 0.35, -Math.cos(f.yaw));
    dir.y += 0.25; dir.normalize();
    const p = new THREE.Vector3(f.pos.x, f.eyeY, f.pos.z).addScaledVector(dir, 0.8);
    const m = new THREE.Mesh(Models.consumable(it.c), Models.mat); m.position.copy(p); this.dynGroup.add(m);
    this.grenades.push({ pos: p, vel: dir.multiplyScalar(it.c === 'bubble' ? 16 : 24), t: it.c === 'bouncy' ? 3.2 : it.c === 'bubble' ? 1.1 : it.c === 'smoke' ? 1.6 : 2.3, owner: f, mesh: m, kind: it.c });
    it.n--; if (it.n <= 0) f.slots[f.cur] = null;
    f.fireT = 0.6;
  },
  fireRocket(f, from, dir, rar, kind) {
    kind = kind || 'rocket';
    const m = new THREE.Mesh(kind === 'bolt' ? this.boltGeo : this.rocketGeo, Models.mat); m.position.copy(from); this.dynGroup.add(m);
    this.rockets.push({ pos: from.clone(), vel: dir.clone().multiplyScalar(kind === 'bolt' ? 95 : 62), owner: f, mesh: m, life: 5, rar, kind });
  },
  damageCrate(c, dmg, at) {
    if (!c || c.wall.dead) return; c.hp -= dmg;
    Effects.burst(at || _v1.set(c.x, c.y + c.s / 2, c.z), '#c58a4f', 3, 4, 0.4, 0.8);
    if (c.hp <= 0) {
      World.breakCrate(c); const p = _v1.set(c.x, c.y + c.s / 2, c.z);
      Effects.burst(p, '#c58a4f', 14, 7, 0.8, 1.2); Effects.burst(p, '#8a5a30', 8, 6, 0.8, 1.2);
      if (p.distanceTo(this.camPos) < 80) { Sfx.noise(0.35, 700, 0.35); Sfx.tone(110, 0.2, 0.2, 'square', 0.6); }
      if (Math.random() < 0.4) { const r = Math.random(); if (r < 0.5) { const a = pick(Object.keys(AMMO)); this.makeLoot({ kind: 'ammo', a, n: AMMO[a].pick }, c.x, c.z); } else { const cc = pick(FLOOR_CONS); this.makeLoot({ kind: 'cons', c: cc, n: CONS[cc].pick }, c.x, c.z); } }
    }
  },
  damageCrates(pos, R, dmg) { for (const c of World.crates) if (!c.wall.dead && Math.hypot(c.x - pos.x, c.y + c.s / 2 - pos.y, c.z - pos.z) < R + c.s * 0.5) this.damageCrate(c, dmg); },
  updateRockets(dt) {
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i]; r.life -= dt;
      if (r.kind === 'bolt') { if (this.updateBolt(r, dt)) { this.rockets.splice(i, 1); } continue; }
      const L = r.vel.length() * dt; const d = _v2.copy(r.vel).normalize();
      let hit = World.ray(r.pos.x, r.pos.y, r.pos.z, d.x, d.y, d.z, L + 0.3);
      let boom = hit < L + 0.3 || r.life <= 0;
      if (!boom) for (const f of this.fighters) { if (!f.alive || f === r.owner || f.team === r.owner.team || f.state === 'bus') continue; if (Math.hypot(f.pos.x - r.pos.x, f.pos.y + 1 - r.pos.y, f.pos.z - r.pos.z) < 1.3) { boom = true; hit = 0; break; } }
      if (boom) { r.pos.addScaledVector(d, Math.min(hit, L)); this.explode({ pos: r.pos, owner: r.owner }, 6.5, 100 * RARITY[r.rar].m, 'rocket'); this.dynGroup.remove(r.mesh); this.rockets.splice(i, 1); continue; }
      r.pos.addScaledVector(r.vel, dt); r.mesh.position.copy(r.pos); r.mesh.lookAt(_v3.copy(r.pos).add(r.vel));
      if (dist2(r.pos.x, r.pos.z, this.camPos.x, this.camPos.z) < 120 * 120) Effects.trail(r.pos);
    }
  },
  updateBolt(r, dt) {
    if (r.stuck) { r.stuck -= dt; if (r.stuck <= 0) { this.dynGroup.remove(r.mesh); return true; } return false; }
    r.vel.y -= 9 * dt;
    const L = r.vel.length() * dt; const d = _v2.copy(r.vel).normalize();
    const res = traceShot(r.owner, r.pos, d, L + 0.2, 0);
    if (res.target) {
      const W = WEAPONS.crossbow; applyDamage(res.target, weaponDamage(W, r.rar, 20, res.head), r.owner, res.head, 'crossbow', r.pos.clone());
      this.dynGroup.remove(r.mesh); return true;
    }
    if (res.t < L + 0.2 || r.life <= 0) { r.pos.addScaledVector(d, Math.min(res.t, L)); r.mesh.position.copy(r.pos); r.stuck = 3; Effects.impact(r.pos); if (World.lastWall && World.lastWall.crate) this.damageCrate(World.lastWall.crate, 60, r.pos); return false; }
    r.pos.addScaledVector(r.vel, dt); r.mesh.position.copy(r.pos); r.mesh.lookAt(_v3.copy(r.pos).add(r.vel));
    return false;
  },
  explode(g, R, base, wtype) {
    R = R || 7.5; base = base || 95; wtype = wtype || 'grenade';
    this.damageCrates(g.pos, R * 0.8, 250);
    Effects.boom(g.pos); Sfx.boom(g.pos.distanceTo(this.camPos));
    if (Settings.camShake && g.pos.distanceTo(this.player.pos) < 30) this.shake = 0.6;
    for (const f of this.fighters) {
      if (!f.alive || f.state === 'bus') continue; if (f.team === g.owner.team && f !== g.owner) continue;
      const d = Math.hypot(f.pos.x - g.pos.x, f.pos.y + 1 - g.pos.y, f.pos.z - g.pos.z); if (d > R) continue;
      if (!World.los(g.pos, _v1.set(f.pos.x, f.pos.y + 1, f.pos.z)) && d > 1.5) continue;
      const dmg = Math.round(base * Math.pow(1 - d / R, 0.6) * (f === g.owner ? 0.5 : 1));
      applyDamage(f, dmg, g.owner, false, wtype, _v1.clone());
      if (f.state === 'ground' && !f.kart && !f.knocked) { const k = (1 - d / R) * 9; f.vel.x += (f.pos.x - g.pos.x) / (d + 0.1) * k; f.vel.z += (f.pos.z - g.pos.z) / (d + 0.1) * k; f.vy = Math.max(f.vy, k * 0.7); f.onGround = false; }
    }
    for (const k of this.karts) if (k.pos.distanceTo(g.pos) < 6) k.speed *= 0.2;
  },
  useItem(f) {
    const it = f.item; if (!it || it.kind !== 'cons' || f.using || f.knocked) return;
    const C = CONS[it.c];
    if (C.throw) { if (f.fireT <= 0) this.throwGrenade(f); return; }
    const hpOk = C.hp && f.hp < C.cap, shOk = C.sh && f.sh < C.shcap;
    if (!hpOk && !shOk) { if (f.isPlayer) HUD.message(C.hp && !C.sh ? 'Santé déjà au maximum pour cet objet' : 'Bouclier déjà au maximum', 1.5); return; }
    f.using = it.c; f.useT = C.time; f.reloadT = 0;
    if (f.isPlayer) Sfx.click();
  },
  finishUse(f) {
    const c = f.using; f.using = null; const C = CONS[c];
    const i = f.slots.findIndex(s => s && s.kind === 'cons' && s.c === c); if (i < 0) return;
    if (C.hp && f.hp < C.cap) f.hp = Math.min(C.cap, f.hp + C.hp);
    if (C.sh && f.sh < C.shcap) f.sh = Math.min(C.shcap, f.sh + C.sh);
    f.slots[i].n--; if (f.slots[i].n <= 0) f.slots[i] = null;
    if (f.isPlayer) { Sfx.heal(); this.stat('heal', 1); }
  },
  bestHealSlot(f) {
    const order = f.hp < 75 ? ['medkit', 'bandage', 'fizz', 'shieldB', 'shieldS'] : ['shieldB', 'shieldS', 'fizz', 'medkit', 'bandage'];
    for (const c of order) {
      const i = f.slots.findIndex(s => s && s.kind === 'cons' && s.c === c); if (i < 0) continue; const C = CONS[c];
      if ((C.hp && f.hp < C.cap) || (C.sh && f.sh < C.shcap)) return i;
    }
    return -1;
  },
  noise(f, radius) {
    if (dist2(f.pos.x, f.pos.z, this.player.pos.x, this.player.pos.z) < 140 * 140 && f !== this.player) { this.shotMarks.push({ x: f.pos.x, z: f.pos.z, t: this.time }); if (dist2(f.pos.x, f.pos.z, this.player.pos.x, this.player.pos.z) < 60 * 60) this.lastCombat = this.time; if (Settings.soundViz && f.team !== this.playerTeam && dist2(f.pos.x, f.pos.z, this.player.pos.x, this.player.pos.z) < 90 * 90) HUD.soundAt(f.pos, 'shot'); }
    if (this.shotMarks.length > 30) this.shotMarks.shift();
    for (const b of this.bots) {
      if (!b.alive || b === f || b.team === f.team || b.ai.target) continue;
      if (dist2(b.pos.x, b.pos.z, f.pos.x, f.pos.z) < radius * radius) b.ai.investigate = { x: f.pos.x, z: f.pos.z, t: this.time };
    }
  },
  inBush(f) { for (const b of World.bushes) if (dist2(f.pos.x, f.pos.z, b.x, b.z) < (b.s * 1.2) ** 2) return true; return false; },
  mates(f) { if (!f || !this.mode || this.mode.team < 2) return []; return this.fighters.filter(o => o !== f && o.team === f.team && !o.isBoss); },
  duoMateOf(f) {
    const m = this.mates(f); if (!m.length) return null;
    const pl = m.find(o => o.isPlayer && o.alive); if (pl && this.mode.team <= 4) return pl;
    let best = null, bd = Infinity; for (const o of m) { if (!o.alive) continue; const d = dist2(o.pos.x, o.pos.z, f.pos.x, f.pos.z) + (o.knocked ? 1e7 : 0); if (d < bd) { bd = d; best = o; } }
    return best || m[0];
  },
  aliveCount() { let n = 0; for (const f of this.fighters) if (f.alive && !f.isBoss) n++; return n; },
  aliveTeams() { const s = new Set(); for (const f of this.fighters) if (f.alive && !f.isBoss) s.add(f.team); return s.size; },
  stat(k, n) { this.matchStats[k] = (this.matchStats[k] || 0) + n; },
  deployGlider(f) { if (f.state === 'fall') { f.state = 'glide'; f.parts.glider.visible = true; } },
  jumpFromBus(f) {
    if (f.state !== 'bus') return;
    f.state = 'fall'; f.vy = -5; f.mesh.visible = true;
    f.pos.set(this.busPos.x + rand(-2, 2), this.busPos.y - 3, this.busPos.z + rand(-2, 2));
    f.vel.set(0, 0, 0);
    if (f.isPlayer) {
      Sfx.tone(300, 0.4, 0.2, 'sine', 2);
      this.mates(f).forEach((m, i) => { if (m.state === 'bus') setTimeout(() => this.jumpFromBus(m), 500 + i * 350); });
    }
  },

  onElimination(t, att) {
    if (this.ended) return;
    if (Modes.onElim(this, t, att)) return;
    const teams = this.aliveTeams();
    const pTeamAlive = this.fighters.some(f => f.alive && f.team === this.playerTeam);
    if (t.isPlayer) {
      this.deathTime = this.time;
      this.placement = pTeamAlive ? null : teams + 1;
      const mate = this.duoMateOf(t);
      this.spectating = mate && mate.alive ? mate : (att && att.alive && att !== t ? att : null);
      if (!pTeamAlive) setTimeout(() => this.endMatch(false), 2200);
      else HUD.message('Tu es éliminé·e… ton coéquipier continue !', 3);
    } else if (!pTeamAlive && this.player.alive === false && !this.placement) {
      this.placement = teams + 1; setTimeout(() => this.endMatch(false), 1500);
    }
    if (this.spectating && !this.spectating.alive) this.spectating = att && att.alive ? att : this.fighters.find(f => f.alive) || null;
    if (teams <= 1 && pTeamAlive) { this.placement = 1; this.startVictory(); }
    else if (teams <= 1 && !this.ended && !this.placement) { this.placement = 2; setTimeout(() => this.endMatch(false), 1200); }
    if (!t.isPlayer && t.team === this.playerTeam && this.player.alive) HUD.message('Ton coéquipier a été éliminé !', 2.5, 'bad');
    const left = this.aliveCount();
    if (this.player.alive && [25, 10, 5, 3, 2].includes(left)) { HUD.message(`<b>${left}</b> joueurs restants`, 2); Announcer.onAlive(left); }
  },
  hitStop() { if (this.slowT <= 0) { this.slowT = 0.07; this.timeScale = 0.06; } },
  onPing(type, pos, ref) {
    for (const b of this.bots) if (b.alive && b.team === this.playerTeam && b.ai) b.ai.ping = { type, pos: pos.clone(), ref, t: this.time };
  },
  updateMusic() {
    const p = this.player, st = this.storm, alive = this.aliveCount();
    let I = this.phase === 'bus' ? 0.15 : 0.3;
    if (st.shrinking) I += 0.15; if (st.phase >= 4) I += 0.2; if (alive <= 10) I += 0.15;
    if (this.time - (this.lastCombat || -99) < 6) I += 0.45;
    if (!p.alive) I = 0.2;
    Music.target = clamp(I, 0, 1);
  },
  startVictory() {
    this.slowT = 1.6; this.timeScale = 0.25; this.victoryT = 0.001; document.body.classList.add('victory');
    const p = this.player; p.emoteT = 99; p.knocked = false; p.ads = false;
    HUD.message('<b>VICTOIRE !</b>', 3, 'poi');
    Sfx.win(); Confetti.start();
    setTimeout(() => { Effects.confettiBurst(_v1.set(p.pos.x, p.pos.y + 3, p.pos.z)); }, 600);
    setTimeout(() => this.endMatch(true), 4200);
  },
  endMatch(win) {
    if (this.ended) return; this.ended = true; this.phase = 'end';
    if (document.pointerLockElement) document.exitPointerLock();
    const p = this.player; const place = win ? 1 : (this.placement || this.aliveTeams() + 1);
    const survived = ((p.alive ? this.time : this.deathTime) - this.matchStart) / 60;
    // XP
    const xp = { 'éliminations': p.kills * 60, survie: Math.round(Math.max(0, survived) * 25), place: place === 1 ? 400 : place <= 5 ? 180 : place <= 10 ? 110 : place <= 25 ? 50 : 0, coffres: this.matchStats.chests * 10, dégâts: Math.round(this.matchStats.damage / 20) };
    // stats
    const S = Profile.stats; S.games++; S.kills += p.kills; S.damage += Math.round(this.matchStats.damage); S.headshots += this.matchStats.head || 0;
    S.timeAlive += Math.max(0, survived); if (win) S.wins++; else S.deaths++; if (place <= 10) S.top10++; S.bestKills = Math.max(S.bestKills, p.kills);
    // défis
    ensureDaily(); let chXp = 0; const done = [];
    const prog = { kills: p.kills, chests: this.matchStats.chests, damage: this.matchStats.damage, heal: this.matchStats.heal, top10: place <= 10 ? 1 : 0, head: this.matchStats.head, survive: survived, sniperk: this.matchStats.sniperk, shotgunk: this.matchStats.shotgunk, drive: this.matchStats.drive };
    for (const c of Profile.daily.list) { if (c.done) continue; c.prog = Math.min(c.n, c.prog + (prog[c.id] || 0)); if (c.prog >= c.n) { c.done = true; chXp += c.xp; done.push(c.text); } }
    if (chXp) xp['défis'] = chXp;
    const meta = Meta.onMatchEnd({ win, place, kills: p.kills, ranked: this.ranked }, this.matchStats);
    if (meta.qxp) xp['quêtes'] = meta.qxp;
    const total = Object.values(xp).reduce((a, b) => a + b, 0);
    const before = Profile.lvl; Profile.xp += total;
    while (Profile.xp >= XP_FOR(Profile.lvl)) { Profile.xp -= XP_FOR(Profile.lvl); Profile.lvl++; Profile.stars += 50; meta.stars += 50; }
    Profile.history.unshift({ d: Date.now(), mode: this.modeId, place, kills: p.kills, dmg: Math.round(this.matchStats.damage) }); Profile.history = Profile.history.slice(0, 20);
    saveProfile();
    UI.showEnd({ win, place, kills: p.kills, dmg: Math.round(this.matchStats.damage), survived, xp, total, lvlUp: Profile.lvl > before, lvl: Profile.lvl, done: done.concat(meta.lines), stars: meta.stars, rankLine: meta.rankLine, players: this.mode.players, teams: this.mode.team });
  },
  quitToLobby() {
    this.phase = 'lobby'; this.ended = true; this.cleanup(); this.stormMesh.visible = false; if (this.busMesh) this.busMesh.visible = false;
    document.body.classList.remove('ingame', 'air', 'driving', 'dead', 'victory', 'lowhp', 'knocked'); Input.resetAll();
    if (document.pointerLockElement) document.exitPointerLock();
    UI.showLobby();
  },

  // ---------------- boucle ----------------
  loop(now) {
    requestAnimationFrame(t => this.loop(t));
    const minDt = Settings.fpsCap === 30 ? 1 / 31 : 0;
    let dt = (now - this.last) / 1000; if (dt < minDt) return;
    this.last = now; dt = Math.min(dt, 0.05);
    // FPS + résolution dynamique
    this.fpsAcc += dt; this.fpsN++;
    if (this.fpsAcc > 1) {
      const fps = this.fpsN / this.fpsAcc; $('fps').textContent = Math.round(fps) + ' FPS';
      if (Settings.quality === 'auto' && this.phase !== 'lobby') {
        const target = Settings.fpsCap === 30 ? 27 : 45;
        if (fps < target) { this.lowFpsT++; if (this.lowFpsT >= 3 && this.dynScale > 0.55) { this.dynScale -= 0.1; this.applyQuality(); this.lowFpsT = 0; } }
        else { this.lowFpsT = 0; if (fps > (Settings.fpsCap === 30 ? 29.5 : 58) && this.dynScale < 1) { this.highFpsT = (this.highFpsT || 0) + 1; if (this.highFpsT > 6) { this.dynScale = Math.min(1, this.dynScale + 0.1); this.applyQuality(); this.highFpsT = 0; } } }
      }
      this.fpsAcc = 0; this.fpsN = 0;
    }
    if (this.phase === 'lobby') { UI.renderLobby(dt); return; }
    if (!this.paused) this.update(dt);
    this.render(dt);
  },
  update(dt) {
    if (this.slowT > 0) { this.slowT -= dt; if (this.slowT <= 0) this.timeScale = 1; }
    dt *= this.timeScale;
    this.time += dt;
    Input.readKeys();
    this.updateStorm(dt);
    if (this.phase === 'bus') this.updateBus(dt);
    this.updatePlayerInput(dt);
    for (const b of this.bots) if (b.alive) b.ai.update(dt);
    for (const f of this.fighters) if (f.alive) this.stepFighter(f, dt);
    this.updateKarts(dt);
    this.updateGrenades(dt);
    Gags.update(dt);
    Events.update(dt);
    Modes.update(this, dt);
    this.updateRockets(dt);
    this.updatePads(dt);
    this.updateKnocked(dt);
    this.updateMusic();
    this.updateSupplies(dt);
    this.updateLootVis(dt);
    Effects.update(dt);
  },
  updatePads(dt) {
    for (const f of this.fighters) {
      if (!f.alive || f.state !== 'ground' || f.kart || f.knocked) continue;
      if (f.padT > 0) { f.padT -= dt; continue; }
      for (const p of World.pads) {
        if (dist2(f.pos.x, f.pos.z, p.x, p.z) < 1.9 * 1.9 && f.pos.y < p.y + 2) {
          f.state = 'fall'; f.vy = 30; f.padT = 1.5; f.onGround = false; f.parts.glider.visible = false; f.crouch = false; f.slideT = 0;
          f.vel.x *= 0.5; f.vel.z *= 0.5;
          if (f.ai) f.ai.landing = f.ai.goal ? { x: f.ai.goal.x, z: f.ai.goal.z } : f.ai.pickLanding();
          if (dist2(p.x, p.z, this.camPos.x, this.camPos.z) < 60 * 60) Sfx.bounce();
          Effects.burst(_v1.set(p.x, p.y + 1.2, p.z), '#ff3d6e', 10, 6, 0.5, 1.2);
          break;
        }
      }
    }
  },
  updateKnocked(dt) {
    for (const f of this.fighters) {
      if (!f.alive || !f.knocked) continue;
      f.bleed -= dt * 5.5; f.crouch = false;
      if (f.bleed <= 0) { eliminate(f, f.lastHitBy, 'bleed', false); continue; }
      // réanimation par un coéquipier
      const rev = this.mates(f).find(m => m.alive && !m.knocked && m.reviving === f && dist2(m.pos.x, m.pos.z, f.pos.x, f.pos.z) < 2.6 * 2.6);
      const mate = rev; const revRate = rev ? 1 : 0;
      f.reviveT = revRate ? f.reviveT + dt : Math.max(0, f.reviveT - dt);
      if (f.reviveT >= 4) { revive(f); if (mate) { mate.reviving = null; if (mate.isPlayer) this.stat('revive', 1); } }
    }
  },
  updateBus(dt) {
    const B = this.bus; B.t += dt / B.dur;
    const x = lerp(B.sx, B.ex, B.t), z = lerp(B.sz, B.ez, B.t);
    this.busPos = this.busPos || new THREE.Vector3(); this.busPos.set(x, B.y, z);
    this.busMesh.position.set(x, B.y + Math.sin(this.time * 2) * 0.4, z);
    for (const f of this.fighters) {
      if (f.state !== 'bus') continue; f.pos.copy(this.busPos);
      if (f.ai && B.t >= f.ai.jumpT) { if (!this.mates(f).some(m => m.isPlayer && m.state === 'bus')) this.jumpFromBus(f); }
      if (B.t >= 1) this.jumpFromBus(f);
    }
    if (B.t >= 1.15) { this.phase = 'play'; B.active = false; this.busMesh.visible = false; }
  },
  updateStorm(dt) {
    const st = this.storm;
    if (st.phase < STORM_PHASES.length) {
      const P = STORM_PHASES[st.phase]; st.timer -= dt;
      if (!st.shrinking && st.timer <= 0) {
        st.shrinking = true; st.timer = P.shrink * this.mode.storm; st.sx = st.cx; st.sz = st.cz; st.sr = st.r;
        if (this.player.alive) HUD.message('⚠ La tempête se resserre !', 3, 'storm');
        if (st.phase === 1 || st.phase === 3) this.spawnSupply();
      } else if (st.shrinking) {
        const t = 1 - Math.max(0, st.timer) / (P.shrink * this.mode.storm);
        st.cx = lerp(st.sx, st.nx, t); st.cz = lerp(st.sz, st.nz, t); st.r = lerp(st.sr, st.nr, t);
        if (st.timer <= 0) {
          st.phase++; st.shrinking = false;
          if (st.phase < STORM_PHASES.length) { st.timer = STORM_PHASES[st.phase].wait * this.mode.storm; this.chooseNextCircle(); if (st.phase === Events.goldPhase) Events.goldStorm(); else if (this.player.alive) HUD.message('Nouvelle zone sûre repérée sur la carte', 2.5); }
        }
      }
    }
    st.dps = STORM_PHASES[Math.min(st.phase, STORM_PHASES.length - 1)].dps;
    this.stormMesh.visible = st.r < World.ISL + 20;
    if (st.shrinking && Math.random() < dt * 0.25) { this.stormFlash = 1; if (this.player.inStorm || Math.random() < 0.3) setTimeout(() => Sfx.thunder(), 200 + Math.random() * 600); }
    this.stormFlash = Math.max(0, this.stormFlash - dt * 3); Look.stormM.uniforms.flash.value = this.stormFlash * 0.6; this.stormMesh.position.set(st.cx, 120, st.cz); this.stormMesh.scale.set(Math.max(0.1, st.r), 1, Math.max(0.1, st.r));
    // dégâts
    this.stormTick = (this.stormTick || 0) + dt;
    const tick = this.stormTick >= 1; if (tick) this.stormTick = 0;
    for (const f of this.fighters) {
      if (!f.alive || f.state === 'bus' || f.isBoss) { f.inStorm = false; continue; }
      f.inStorm = dist2(f.pos.x, f.pos.z, st.cx, st.cz) > st.r * st.r;
      if (f.inStorm && tick && f.state === 'ground') { applyDamage(f, st.dps * (st.goldMul || 1), null, false, 'storm', null); if (f.isPlayer) Sfx.storm(); }
    }
  },
  // ---------- joueur ----------
  updatePlayerInput(dt) {
    const p = this.player; const I = Input; const arc = View.arcade();
    if (arc) { I.lookDX = I.lookDY = 0; this.camYaw = 0; this.camPitch = -0.9; }
    // regard
    const S = (p.ads ? Settings.adsSens : 1) * Settings.sens * (Input.isTouch ? 0.0055 : 0.0032) * (p.ads && p.weapon && WEAPONS[p.weapon.w].scope ? 0.35 : 1);
    let dx = I.lookDX * S, dy = I.lookDY * S * (Settings.invertY ? -1 : 1); I.lookDX = 0; I.lookDY = 0;
    // assistance de visée : ralentissement près d'une cible
    this.aimTarget = null;
    if (!arc && p.alive && p.state === 'ground' && !p.kart && p.weapon) this.computeAimAssist(p);
    if (this.aimTarget && Settings.aimAssist) { dx *= 0.6; dy *= 0.6; }
    this.camYaw -= dx; this.camPitch = clamp(this.camPitch - dy, -1.35, 1.2);
    if (this.aimTarget && Settings.aimAssist && (I.fire || Math.abs(I.jx) + Math.abs(I.jy) > 0.1) && !(p.weapon && WEAPONS[p.weapon.w].scope)) {
      const t = this.aimTarget; const ax = t.pos.x - this.camPos.x, az = t.pos.z - this.camPos.z;
      const want = Math.atan2(-ax, -az); this.camYaw += clamp(angDiff(this.camYaw, want), -0.5 * dt, 0.5 * dt);
      const ay = t.pos.y + 1.2 - this.camPos.y; const wp = Math.atan2(ay, Math.hypot(ax, az)); this.camPitch += clamp(wp - this.camPitch, -0.3 * dt, 0.3 * dt);
    }
    // recul
    if (arc) p.recoil = 0;
    if (p.recoil > 0) { const r = Math.min(p.recoil, p.recoil * 12 * dt + 0.001); this.camPitch = Math.min(1.2, this.camPitch + r); p.recoil -= r; }
    p.spread = Math.max(0, p.spread - dt * 0.12);
    // boutons globaux
    if (I.consume('pause')) { UI.togglePause(); }
    if (I.consume('map')) HUD.toggleBig(!HUD.bigOpen);
    if (!p.alive) { this.consumeAll(); return; }
    if (!arc) { p.yaw = this.camYaw; p.pitch = this.camPitch; }
    if (p.state === 'bus') {
      if ((I.consume('jumpBus') || I.consume('jump') || I.consume('interact')) && this.busPos && Math.hypot(this.busPos.x, this.busPos.z) < World.ISL - 30) this.jumpFromBus(p);
      this.consumeAll(); return;
    }
    // déplacement (repère caméra)
    const fx = -Math.sin(this.camYaw), fz = -Math.cos(this.camYaw), rx = Math.cos(this.camYaw), rz = -Math.sin(this.camYaw);
    let mx = fx * I.jy + rx * I.jx, mz = fz * I.jy + rz * I.jx; const mag = Math.min(1, Math.hypot(I.jx, I.jy));
    const ml = Math.hypot(mx, mz); if (ml > 0) { mx /= ml; mz /= ml; }
    const inp = p.input; inp.dx = mx * mag; inp.dz = mz * mag;
    if (p.state === 'fall' || p.state === 'glide') {
      if (I.consume('glide') || I.consume('jump')) this.deployGlider(p);
      this.consumeAll(); return;
    }
    if (p.kart) { this.aimLine.visible = false; this.driveInput(p, dt); return; }
    const W = p.weapon ? WEAPONS[p.weapon.w] : null;
    if (arc) this.arcadeAim(p, mx * mag, mz * mag, W); else this.aimLine.visible = false;
    // visée (ADS)
    p.ads = arc ? !!(W && W.scope && this.arcFiring) : (I.ads || I.adsTouch) && !!W && p.reloadT <= 0;
    const firing = arc ? this.arcFiring : I.fire || (Settings.autoFire && this.aimTarget && this.aimAuto);
    const sprint = arc ? (Settings.sprintAuto && mag > 0.95 && !firing && !p.crouch && !p.using) || (I.sprinting && !firing)
      : (Settings.sprintAuto && mag > 0.95 && I.jy > 0.75 && !firing && !p.ads && !p.crouch && !p.using) || (I.sprinting && !firing);
    p.sprinting = sprint && p.onGround;
    inp.speed = p.knocked ? 1.8 : p.reviving ? 0 : p.using ? 3.4 : p.ads ? 3.8 : p.crouch ? 3.2 : sprint ? 8.4 : 6.3;
    if (p.knocked) { p.ads = false; this.updateInteract(p, dt); this.consumeAll(); return; }
    if (I.consume('jump')) { if (p.crouch) p.crouch = false; else inp.jump = true; p.slideT = 0; }
    if (I.consume('crouch')) {
      if (p.sprinting && p.slideT <= 0 && Math.hypot(p.vel.x, p.vel.z) > 6.5) { p.slideT = 0.85; p.crouch = true; const l = Math.hypot(p.vel.x, p.vel.z); p.slideDir = { x: p.vel.x / l, z: p.vel.z / l }; Sfx.noise(0.5, 900, 0.18, 'bandpass', 0.8); }
      else { p.crouch = !p.crouch; p.slideT = 0; }
    }
    if (I.consume('reload')) startReload(p);
    if (I.consume('emote')) { p.emoteT = 3; }
    if (I.consume('ping')) Pings.playerPing();
    if (I.consume('heal')) { const i = this.bestHealSlot(p); if (i >= 0) { p.cur = i; p.switchT = 0.1; p.reloadT = 0; this.useItem(p); } else HUD.message('Aucun soin utile', 1.2); }
    for (let i = 0; i < 5; i++) if (I.consume('slot' + i)) this.selectSlot(i);
    // tir / utilisation
    const it = p.item;
    if (firing && it) {
      if (it.kind === 'weapon') {
        if (arc || W.auto || I.consume('fire') || I.consume('fireL') || (Settings.autoFire && this.aimTarget && !W.grapple)) {
          const [o, d] = this.shootRay();
          if (canFire(p)) { playerShoot(p, o, d, 0); p.emoteT = 0; this.tapShot = false; }
        }
      } else if (it.kind === 'cons') { if (arc ? (CONS[it.c].throw ? this.arcRelease : true) : (I.consume('fire') || I.consume('fireL') || CONS[it.c].throw === undefined)) this.useItem(p); }
    }
    // rafale : les tirs suivants partent tout seuls
    if (p.burstLeft > 0 && p.fireT <= 0 && p.weapon && WEAPONS[p.weapon.w].burst) { const [o, d] = this.shootRay(); if (canFire(p)) playerShoot(p, o, d, 0); else p.burstLeft = 0; }
    this.arcRelease = false;
    if (I.consume('gag') && p.gag) {
      const t = World.ray(this.camPos.x, this.camPos.y, this.camPos.z, this.camDir.x, this.camDir.y, this.camDir.z, 70);
      const tgt = this.aimTarget ? this.aimTarget.pos.clone() : arc ? this.arcAimPoint.clone() : this.camPos.clone().addScaledVector(this.camDir, Math.min(t, 70));
      if (!arc && t >= 70 && !this.aimTarget && (p.gag.g === 'piano' || p.gag.g === 'anvil')) HUD.message('Vise le sol à moins de 70 m', 1.2); else Gags.use(p, tgt);
    }
    I.pressed.fire = false; I.pressed.fireL = false;
    // interactions
    this.updateInteract(p, dt);
    I.pressed.glide = false; I.pressed.jumpBus = false;
  },
  shootRay() {
    if (View.arcade()) return [this.shootO, this.shootDir];
    this._o = this._o || new THREE.Vector3(); this._o.copy(this.camPos).addScaledVector(this.camDir, this.camMinT || 0); return [this._o, this.camDir];
  },
  // vue arcade : visée au joystick droit (ou à la souris), verrouillage automatique de la cible dans le cône
  arcadeAim(p, mvx, mvz, W) {
    const I = Input; let ax = 0, az = 0, active = false;
    if (I.isTouch) { if (I.aimMag > 0.12) { ax = I.ax; az = -I.ay; active = true; } }
    else if (I.mouseIn) {
      const c = this.camera; const v = _v1.set(I.mx / View.w * 2 - 1, -(I.my / View.h) * 2 + 1, 0.5).unproject(c).sub(c.position).normalize();
      const t = (p.pos.y + 1.2 - c.position.y) / (v.y || -1e-3); if (t > 0) { ax = c.position.x + v.x * t - p.pos.x; az = c.position.z + v.z * t - p.pos.z; active = true; }
    }
    if (this.wasAiming && !I.aiming && I.isTouch) this.arcRelease = true; // relâcher le joystick lance l'objet
    this.wasAiming = I.aiming;
    const tap = I.tapFire; I.tapFire = false; if (tap) { this.tapShot = true; this.tapT = 0.35; }
    if (this.tapT > 0) this.tapT -= 1 / 60; else this.tapShot = false;
    let yaw = p.yaw;
    if (active && Math.hypot(ax, az) > 0.01) yaw = Math.atan2(-ax, -az);
    else if (Math.hypot(mvx, mvz) > 0.1) yaw = Math.atan2(-mvx, -mvz);
    // cible automatique
    const range = W ? Math.min(W.range, W.scope ? 90 : 55) : 40; let tgt = null, bs = Infinity;
    const cone = this.tapShot ? Math.PI : active ? 0.38 : 0;
    if (cone > 0) for (const f of this.fighters) {
      if (!f.alive || f === p || f.team === p.team || f.state === 'bus' || (f.boxT > 0 && f.moveAmt < 0.2)) continue;
      const dx = f.pos.x - p.pos.x, dz = f.pos.z - p.pos.z, d = Math.hypot(dx, dz); if (d > range) continue;
      const da = Math.abs(angDiff(yaw, Math.atan2(-dx, -dz))); if (da > cone) continue;
      const sc = d * (1 + da * 3); if (sc >= bs) continue;
      if (!World.los(_v2.set(p.pos.x, p.pos.y + 1.4, p.pos.z), _v3.set(f.pos.x, f.pos.y + 1.2, f.pos.z))) continue;
      bs = sc; tgt = f;
    }
    if (tgt && (this.tapShot || active)) yaw = Math.atan2(-(tgt.pos.x - p.pos.x), -(tgt.pos.z - p.pos.z));
    p.yaw = yaw; this.aimTarget = tgt;
    const o = this.shootO = this.shootO || new THREE.Vector3(); o.set(p.pos.x, p.pos.y + (p.crouch ? 1.0 : 1.35), p.pos.z);
    const d = this.shootDir = this.shootDir || new THREE.Vector3();
    if (tgt) d.set(tgt.pos.x - o.x, tgt.pos.y + (tgt.knocked ? 0.4 : 1.15) - o.y, tgt.pos.z - o.z).normalize();
    else d.set(-Math.sin(yaw), -0.02, -Math.cos(yaw)).normalize();
    p.pitch = Math.asin(clamp(d.y, -1, 1));
    const len = tgt ? Math.hypot(tgt.pos.x - p.pos.x, tgt.pos.z - p.pos.z) : W && !W.grapple ? Math.min(range, 30) : 12;
    this.arcAimPoint = (this.arcAimPoint || new THREE.Vector3()).set(p.pos.x - Math.sin(yaw) * len, p.pos.y, p.pos.z - Math.cos(yaw) * len);
    this.arcFiring = (I.isTouch ? I.aiming : I.fire) || (this.tapShot && !!tgt);
    const L = this.aimLine; L.visible = active || this.tapShot; L.position.set(p.pos.x, World.ground(p.pos.x, p.pos.z, p.pos.y) + 0.12, p.pos.z); L.rotation.y = yaw; L.scale.set(1, 1, len);
    L.material.color.set(tgt ? '#ff4b5c' : '#ffffff'); L.material.opacity = this.arcFiring ? 0.75 : 0.45;
  },
  consumeAll() { for (const k in Input.pressed) if (k !== 'pause' && k !== 'map') Input.pressed[k] = false; },
  selectSlot(i) {
    const p = this.player; if (p.cur === i) { const it = p.item; if (it && it.kind === 'cons' && !CONS[it.c].throw) this.useItem(p); return; }
    p.cur = i; p.switchT = 0.25; p.reloadT = 0; p.using = null; p.ads = false; Input.adsTouch = false;
  },
  cycleSlot(d) { const p = this.player; this.selectSlot((p.cur + d + 5) % 5); },
  computeAimAssist(p) {
    const W = WEAPONS[p.weapon.w]; let best = null, ba = 0.11; this.aimAuto = false;
    for (const f of this.fighters) {
      if (!f.alive || f.team === p.team || f.state === 'bus') continue;
      const dx = f.pos.x - this.camPos.x, dy = f.pos.y + 1.2 - this.camPos.y, dz = f.pos.z - this.camPos.z; const d = Math.hypot(dx, dy, dz);
      if (d > W.range * 0.9 || d < 1) continue;
      const dot = (dx * this.camDir.x + dy * this.camDir.y + dz * this.camDir.z) / d;
      const ang = Math.acos(clamp(dot, -1, 1)); const lim = Math.max(0.035, 0.11 * 15 / Math.max(15, d));
      if (ang < lim && ang < ba) {
        if (!World.los(this.camPos, _v2.set(f.pos.x, f.pos.y + 1.2, f.pos.z))) continue;
        ba = ang; best = f; this.aimAuto = ang < lim * 0.45;
      }
    }
    this.aimTarget = best;
  },
  updateInteract(p, dt) {
    let best = null, bd = 2.6 * 2.6, label = '';
    const I = Input;
    // ramassage auto (munitions, consommables empilables, armes si emplacement libre)
    for (const it of this.loot) {
      if (it.taken) continue; const d = dist2(p.pos.x, p.pos.z, it.pos.x, it.pos.z); if (d > 9 || Math.abs(it.pos.y - p.pos.y) > 2.5) continue;
      if (d < 1.8 * 1.8) {
        if (it.kind === 'ammo' || it.kind === 'coins' || it.kind === 'key') { this.pickup(p, it, true); continue; }
        if (Settings.autoPickup && it.kind === 'cons' && !it.dropped && this.pickup(p, it, true)) continue;
        if (Settings.autoPickup && it.kind === 'weapon' && p.freeSlot() >= 0 && !it.dropped) { if (this.pickup(p, it, true)) continue; }
      }
      if (d < bd) { bd = d; best = it; label = it.kind === 'gag' ? `<small style="color:${RARITY[GAGS[it.g].rar].c}">Gag · ${GAGS[it.g].d}</small>${GAGS[it.g].n}` : it.kind === 'weapon' ? `<small style="color:${RARITY[it.rar].c}">${RARITY[it.rar].n}</small>${WEAPONS[it.w].n}` : it.kind === 'cons' ? `<small>×${it.n}</small>${CONS[it.c].n}` : `<small>×${it.n}</small>${AMMO[it.a].n}`; }
    }
    const containers = this.chests.concat(this.supplies.filter(s => s.landed));
    for (const c of containers) { if (c.open) continue; const d = dist2(p.pos.x, p.pos.z, c.pos.x, c.pos.z); if (d < bd + 1) { bd = d; best = c; label = c.isSupply ? '<small>maintenir</small>Ouvrir le ravitaillement' : '<small>maintenir</small>Ouvrir le coffre'; } }
    for (const m of Events.merchants) { const d = dist2(p.pos.x, p.pos.z, m.pos.x, m.pos.z); if (d < 4.5 * 4.5 && d < bd + 6) { bd = d; best = { isShop: true, m }; label = `<small>${p.coins || 0} pièces</small>Marchand : boutique`; } }
    const V = World.vault; if (V && !V.open) { const d = dist2(p.pos.x, p.pos.z, V.out.x, V.out.z); if (d < 3.5 * 3.5) { bd = d; best = { isVault: true }; label = p.hasKey ? '<small>clé</small>Ouvrir le coffre-fort' : '<small>verrouillé</small>Il faut la clé du coffre-fort'; } }
    for (const k of this.karts) { if (k.driver) continue; const d = dist2(p.pos.x, p.pos.z, k.pos.x, k.pos.z); if (d < bd + 4) { bd = d; best = k; label = '<small>véhicule</small>Conduire le kart'; } }
    const mate = this.mates(p).find(m => m.alive && m.knocked && dist2(p.pos.x, p.pos.z, m.pos.x, m.pos.z) < 2.6 * 2.6);
    if (p.knocked) best = null;
    if (mate && !p.knocked) { best = { isRevive: true, f: mate }; label = '<small>maintenir</small>Réanimer ' + mate.name; }
    this.interactable = best ? { ref: best, label } : null;
    if (best && best.isRevive) {
      p.reviving = I.held.interact ? best.f : null; this.reviveHold = best.f.reviveT;
      I.pressed.interact = false; this.chestHold = 0; return;
    }
    p.reviving = null; this.reviveHold = 0;
    if (best && best.isChest) {
      if (I.held.interact) { this.chestHold += dt; if (this.chestHold >= 0.7) { this.openChest(best, p); this.chestHold = 0; I.held.interact = false; } }
      else this.chestHold = 0;
      I.pressed.interact = false;
    } else {
      this.chestHold = 0;
      if (I.consume('interact') && best) {
        if (best.isShop) { if (Events.shopOpen) Events.closeShop(); else Events.openShop(best.m); }
        else if (best.isVault) { if (p.hasKey) Events.openVault(p); else Sfx.tone(200, 0.2, 0.2, 'square'); }
        else if (best.mesh && best.driver !== undefined) this.enterKart(p, best);
        else { best.dropped = false; this.pickup(p, best, false); }
      }
    }
  },
  // ---------- karts ----------
  enterKart(p, k) { k.driver = p; p.kart = k; p.crouch = false; p.ads = false; Sfx.tone(120, 0.4, 0.2, 'sawtooth', 1.8); },
  exitKart(p) {
    const k = p.kart; if (!k) return; k.driver = null; p.kart = null;
    const rx = Math.cos(k.yaw), rz = -Math.sin(k.yaw);
    p.pos.set(k.pos.x + rx * 2, k.pos.y + 0.5, k.pos.z + rz * 2); World.collide(p.pos, 0.45, 1.8); p.vel.set(0, 0, 0);
  },
  driveInput(p, dt) {
    const I = Input, k = p.kart;
    if (I.consume('exitKart') || I.consume('interact') || I.consume('jump')) { this.exitKart(p); return; }
    // le joystick pilote relativement à la caméra : avant = accélérer, côtés = tourner
    k.throttle = I.jy; k.steer = -I.jx;
    this.consumeAll();
  },
  updateKarts(dt) {
    for (const k of this.karts) {
      const drv = k.driver;
      if (drv && !drv.alive) { k.driver = null; }
      const th = k.driver ? k.throttle || 0 : 0, sr = k.driver ? k.steer || 0 : 0;
      const maxS = 24;
      if (th > 0.1) k.speed += th * 16 * dt; else if (th < -0.1) k.speed += th * (k.speed > 0 ? 30 : 10) * dt;
      else k.speed *= Math.pow(0.4, dt);
      k.speed = clamp(k.speed, -8, maxS);
      k.yaw += sr * dt * 2.1 * clamp(k.speed / 6, -1, 1);
      const ox = k.pos.x, oz = k.pos.z;
      k.pos.x += -Math.sin(k.yaw) * k.speed * dt; k.pos.z += -Math.cos(k.yaw) * k.speed * dt;
      const bx = k.pos.x, bz = k.pos.z; const tmp = _v3.set(k.pos.x, k.pos.y + 0.3, k.pos.z);
      World.collide(tmp, 1.3, 1.4);
      if (Math.abs(tmp.x - bx) + Math.abs(tmp.z - bz) > 0.01) { k.speed *= 0.5; if (Math.abs(k.speed) > 10 && k.driver && k.driver.isPlayer) { Sfx.noise(0.2, 400, 0.3); if (Settings.camShake) this.shake = 0.3; } }
      k.pos.x = tmp.x; k.pos.z = tmp.z;
      if (!k.hover && World.h(k.pos.x, k.pos.z) < -0.6) { k.pos.x = ox; k.pos.z = oz; k.speed = 0; }
      if (k.hover && World.h(k.pos.x, k.pos.z) < -6) { k.pos.x = ox; k.pos.z = oz; k.speed = 0; }
      const gy = k.hover ? Math.max(World.h(k.pos.x, k.pos.z), 0.25) + 0.35 + Math.sin(this.time * 3 + k.pos.x) * 0.06 : World.h(k.pos.x, k.pos.z); k.pos.y = gy;
      if (k.driver && k.driver.isPlayer) this.stat('drive', Math.hypot(k.pos.x - ox, k.pos.z - oz));
      // écraser les adversaires
      if (k.driver && Math.abs(k.speed) > 11) for (const f of this.fighters) {
        if (!f.alive || f === k.driver || f.kart || f.team === k.driver.team || f.state !== 'ground') continue;
        if (dist2(f.pos.x, f.pos.z, k.pos.x, k.pos.z) < 2.2 * 2.2) { applyDamage(f, 35, k.driver, false, 'kart', f.pos.clone().setY(f.pos.y + 1)); f.vel.set(-Math.sin(k.yaw) * 14, 0, -Math.cos(k.yaw) * 14); f.vy = 6; f.onGround = false; k.speed *= 0.6; }
      }
      let fy = World.h(k.pos.x - Math.sin(k.yaw) * 1.4, k.pos.z - Math.cos(k.yaw) * 1.4), by = World.h(k.pos.x + Math.sin(k.yaw) * 1.4, k.pos.z + Math.cos(k.yaw) * 1.4);
      if (k.hover) { fy = Math.max(fy, 0.25); by = Math.max(by, 0.25); }
      k.mesh.position.copy(k.pos); k.mesh.rotation.set(Math.atan2(fy - by, 2.8), k.yaw, 0, 'YXZ');
      if (k.driver) { k.driver.pos.set(k.pos.x, k.pos.y + 0.25, k.pos.z); k.driver.vel.set(0, 0, 0); }
      k.mesh.visible = dist2(k.pos.x, k.pos.z, this.camPos.x, this.camPos.z) < this.scene.fog.far ** 2;
    }
  },
  updateGrenades(dt) {
    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i]; g.t -= dt; g.vel.y -= 22 * dt;
      const L = g.vel.length() * dt; const dir = _v2.copy(g.vel).normalize();
      const hit = World.ray(g.pos.x, g.pos.y, g.pos.z, dir.x, dir.y, dir.z, L + 0.2, true);
      const bnc = g.kind === 'bouncy' ? 0.85 : 0.4;
      if (hit < L + 0.2) { g.vel.x *= -bnc; g.vel.z *= -bnc; if (g.kind === 'bouncy') Sfx.tone(500, 0.08, 0.12, 'sine', 2); }
      else g.pos.addScaledVector(g.vel, dt);
      const gy = World.ground(g.pos.x, g.pos.z, g.pos.y);
      if (g.pos.y < gy + 0.2) { g.pos.y = gy + 0.2; g.vel.y = Math.abs(g.vel.y) * (g.kind === 'bouncy' ? 0.75 : 0.35); g.vel.x *= g.kind === 'bouncy' ? 0.9 : 0.6; g.vel.z *= g.kind === 'bouncy' ? 0.9 : 0.6; }
      g.mesh.position.copy(g.pos); g.mesh.rotation.x += dt * 8;
      if (g.t <= 0) {
        if (g.kind === 'smoke') Gags.addSmoke(g.pos); else if (g.kind === 'bubble') Gags.addBubble(_v1.set(g.pos.x, World.ground(g.pos.x, g.pos.z, g.pos.y), g.pos.z));
        else if (g.kind === 'bouncy') this.explode(g, 6, 80, 'grenade'); else this.explode(g);
        this.dynGroup.remove(g.mesh); this.grenades.splice(i, 1);
      }
    }
  },
  updateSupplies(dt) {
    for (const s of this.supplies) {
      if (s.open) continue;
      if (!s.landed) {
        s.pos.y -= 7 * dt; const gy = World.ground(s.pos.x, s.pos.z);
        if (s.pos.y <= gy) { s.pos.y = gy; s.landed = true; s.smoke.visible = true; }
        s.mesh.position.copy(s.pos); s.mesh.rotation.y += dt * 0.5;
      }
    }
  },
  updateLootVis(dt) {
    this.lootVisT = (this.lootVisT || 0) - dt;
    const cp = this.camPos;
    if (this.lootVisT <= 0) {
      this.lootVisT = 0.35;
      const R2 = 75 * 75;
      for (const it of this.loot) if (!it.taken) it.mesh.visible = dist2(it.pos.x, it.pos.z, cp.x, cp.z) < R2;
      for (const c of this.chests) c.mesh.visible = dist2(c.pos.x, c.pos.z, cp.x, cp.z) < 110 * 110;
      // nettoyage
      if (this.loot.length > 600) this.loot = this.loot.filter(i => !i.taken);
    }
    const s = Math.sin(this.time * 3) * 0.12;
    for (const it of this.loot) if (!it.taken && it.mesh.visible) { it.inner.rotation.y += dt * 1.5; it.inner.position.y = 0.55 + s; }
    this.chestMat.emissive.setRGB(0.25 + Math.sin(this.time * 4) * 0.15, 0.15 + Math.sin(this.time * 4) * 0.08, 0);
  },
  // ---------- physique d'un combattant ----------
  stepFighter(f, dt) {
    if (f.fireT > 0) f.fireT -= dt;
    if (f.switchT > 0) f.switchT -= dt;
    if (f.reloadT > 0) { f.reloadT -= dt; if (f.reloadT <= 0) { f.reloadT = 0; finishReload(f); } }
    if (f.using) { f.useT -= dt; if (f.useT <= 0) this.finishUse(f); }
    if (f.emoteT > 0) f.emoteT -= dt;
    const inp = f.input;
    if (f.state === 'bus') return;
    if (f.state === 'fall' || f.state === 'glide') {
      const gl = f.state === 'glide';
      const hs = gl ? 15 : 17;
      if (f.trailDef && Math.random() < 0.5 && dist2(f.pos.x, f.pos.z, this.camPos.x, this.camPos.z) < 90 * 90) Effects.burst(_v1.set(f.pos.x, f.pos.y + 1.2, f.pos.z), pick(f.trailDef.c), 1, 1, 0.9, 0.2);
      if (f.isPlayer) { this.windT -= dt; if (this.windT <= 0) { this.windT = 0.22; Sfx.wind(gl ? 0.3 : 1); } }
      const dive = f.isPlayer && !gl && this.camPitch < -0.7;
      f.vel.x = lerp(f.vel.x, inp.dx * hs * (dive ? 0.7 : 1), 1 - Math.exp(-3 * dt)); f.vel.z = lerp(f.vel.z, inp.dz * hs * (dive ? 0.7 : 1), 1 - Math.exp(-3 * dt));
      const tv = gl ? -7 : dive ? -42 : -24; f.vy = f.vy > 0 ? f.vy - 26 * dt : lerp(f.vy, tv, 1 - Math.exp(-2 * dt));
      f.pos.x += f.vel.x * dt; f.pos.z += f.vel.z * dt; f.pos.y += f.vy * dt;
      const r = Math.hypot(f.pos.x, f.pos.z); const RM = World.ISL - 50; if (r > RM) { f.pos.x = lerp(f.pos.x, f.pos.x * RM / r, 1 - Math.exp(-2 * dt)); f.pos.z = lerp(f.pos.z, f.pos.z * RM / r, 1 - Math.exp(-2 * dt)); }
      const gy = World.ground(f.pos.x, f.pos.z, f.pos.y);
      if (!gl && f.vy < 0 && f.pos.y - gy < (f.padT > 0 ? 9 : 38)) this.deployGlider(f);
      if (f.pos.y <= gy && f.vy <= 0) {
        f.pos.y = gy; f.state = 'ground'; f.parts.glider.visible = false; f.vy = 0; f.onGround = true;
        if (f.isPlayer) { Haptic.play('land'); this.landedAt = World.nearPoi(f.pos.x, f.pos.z, 0); this.matchStart = this.matchStart || this.time; if (this.landedAt) HUD.message(this.landedAt.n.toUpperCase(), 2.5, 'poi'); }
        if (f.ai) { f.ai.thinkT = 0; }
      }
      this.animate(f, dt); return;
    }
    if (f.kart) { this.animate(f, dt); return; }
    // au sol
    let sp = (this.speedMul || 1) * (f.knocked ? 1.8 : f.stunT > 0 ? 0 : f.flatT > 0 ? 2.4 : f.boxT > 0 ? Math.min(inp.speed, 3) : f.floatT > 0 ? 4.5 : inp.speed);
    const k = f.onGround ? 1 - Math.exp(-14 * dt) : 1 - Math.exp(-2.5 * dt);
    if (f.grapple) {
      const g = f.grapple; g.t -= dt; const dx = g.p.x - f.pos.x, dy = g.p.y - f.pos.y, dz = g.p.z - f.pos.z; const d = Math.hypot(dx, dy, dz);
      if (d < 1.6 || g.t <= 0) { f.grapple = null; f.vy = 7; f.vel.multiplyScalar(0.5); }
      else { const v = 34; f.vel.set(dx / d * v, 0, dz / d * v); f.vy = dy / d * v; }
    } else if (f.slipT > 0) {
      f.vel.x *= Math.pow(0.6, dt); f.vel.z *= Math.pow(0.6, dt); f.yaw += dt * 9;
    } else if (f.slideT > 0 && f.slideDir) {
      f.slideT -= dt; const v = 6 + 9 * (f.slideT / 0.85);
      f.vel.x = lerp(f.vel.x, f.slideDir.x * v + inp.dx * 1.5, k); f.vel.z = lerp(f.vel.z, f.slideDir.z * v + inp.dz * 1.5, k);
      if (f.isPlayer && Math.random() < 0.5) Effects.burst(_v1.set(f.pos.x, f.pos.y + 0.1, f.pos.z), '#e8dcc0', 1, 2, 0.4, 0.4);
    } else {
      f.vel.x = lerp(f.vel.x, inp.dx * sp, k); f.vel.z = lerp(f.vel.z, inp.dz * sp, k);
    }
    const ox = f.pos.x, oz = f.pos.z;
    f.pos.x += f.vel.x * dt; f.pos.z += f.vel.z * dt;
    World.collide(f.pos, 0.42, f.crouch ? 1.3 : 1.85);
    // ne pas entrer dans l'eau profonde
    const nh = World.h(f.pos.x, f.pos.z);
    if (nh < -1.4 && nh < World.h(ox, oz) - 0.01) { f.pos.x = ox; f.pos.z = oz; }
    const gy = World.ground(f.pos.x, f.pos.z, f.pos.y);
    if (inp.jump && f.onGround) { f.vy = this.grav < 20 ? 9.5 : 8.4; f.onGround = false; if (f.crouch) f.crouch = false; }
    if (f.grapple) f.pos.y += f.vy * dt;
    else if (f.floatT > 0) { const ty = World.h(f.pos.x, f.pos.z) + 9; f.vy = lerp(f.vy, (ty - f.pos.y) * 1.5, 1 - Math.exp(-3 * dt)); f.pos.y += f.vy * dt; }
    else { f.vy -= (this.grav || 24) * dt; f.pos.y += f.vy * dt; }
    if (f.pos.y <= gy) { f.pos.y = gy; f.vy = 0; f.onGround = true; }
    else if (f.onGround && f.pos.y - gy < 0.7 && f.vy <= 0) { f.pos.y = gy; f.vy = 0; }
    else f.onGround = false;
    if (f.pos.y < -0.6) { f.vel.x *= 0.85; f.vel.z *= 0.85; } // eau peu profonde = ralentit
    const hsp = Math.hypot(f.vel.x, f.vel.z); f.moveAmt = hsp / 6.3;
    if (f.onGround && hsp > 2 && !f.crouch) { f.stepT = (f.stepT || 0) + dt * hsp; if (f.stepT > 3.4) { f.stepT = 0; if (f.isPlayer) Sfx.step(); else if (f.team !== this.playerTeam) { const d = Math.sqrt(dist2(f.pos.x, f.pos.z, this.player.pos.x, this.player.pos.z)); if (d < 22) { if (Settings.soundViz) HUD.soundAt(f.pos, 'step'); Sfx.noise(0.05, 260, 0.08 * (1 - d / 22)); } } } }
    this.animate(f, dt);
  },
  animate(f, dt) {
    const m = f.mesh, P = f.parts;
    const d2 = dist2(f.pos.x, f.pos.z, this.camPos.x, this.camPos.z);
    const far = this.scene.fog.far;
    const scoped = f.isPlayer && f.ads && f.weapon && WEAPONS[f.weapon.w].scope;
    m.visible = f.alive && f.state !== 'bus' && d2 < far * far && !scoped;
    if (!m.visible) return;
    m.position.copy(f.pos); m.rotation.y = f.yaw;
    // niveau de détail : au loin, on n'anime plus et on simplifie la silhouette
    const lod = d2 > 85 * 85 && !f.isPlayer;
    if (lod !== f._lod) { f._lod = lod; P.legL.visible = P.legR.visible = P.arms.visible = !lod; if (f.outl.length) for (const o of f.outl) o.visible = false; }
    if (lod) { if (f.state === 'glide' || f.state === 'fall') P.glider.visible = f.state === 'glide'; return; }
    const near = d2 < 55 * 55;
    if (f.outl.length && f.outl[0].visible !== near) for (const o of f.outl) o.visible = near;
    if (f.flashT > 0) { f.flashT -= dt; const k = Math.max(0, f.flashT / 0.12); f.mat.emissive.setRGB(k, k * 0.9, k * 0.9); } else if (f.mat.emissive.r) f.mat.emissive.setRGB(0, 0, 0);
    if (f.kick > 0) f.kick = Math.max(0, f.kick - dt * 4);
    P.body.rotation.z = 0; m.rotation.x = 0;
    const hsp = f.moveAmt; f.walk += dt * hsp * 10;
    const sw = Math.sin(f.walk) * 0.7 * Math.min(1, hsp);
    if (f.state === 'glide' || f.state === 'fall') {
      P.legL.rotation.x = 0.3; P.legR.rotation.x = -0.2; P.arms.rotation.x = f.state === 'glide' ? 2.6 : 1.2; P.body.position.y = 0; P.body.rotation.x = f.state === 'fall' ? -0.5 : 0;
    } else if (f.knocked) {
      m.rotation.x = 0; P.body.rotation.x = -1.25; P.body.position.y = -0.75; P.legL.position.y = P.legR.position.y = 0.2;
      P.legL.rotation.x = -1.4 + sw * 0.4; P.legR.rotation.x = -1.4 - sw * 0.4; P.arms.position.y = 0.45; P.arms.rotation.x = 0.4 + sw * 0.4;
    } else if (f.kart) {
      P.legL.rotation.x = -1.3; P.legR.rotation.x = -1.3; P.body.position.y = -0.4; P.arms.rotation.x = -0.2; P.body.rotation.x = 0; P.legL.position.y = P.legR.position.y = 0.38;
      m.rotation.y = f.kart.yaw; m.position.y += 0.15;
    } else {
      P.legL.position.y = P.legR.position.y = f.crouch ? 0.48 : 0.78;
      P.legL.rotation.x = f.crouch ? -0.9 + sw * 0.3 : sw; P.legR.rotation.x = f.crouch ? -0.2 - sw * 0.3 : -sw;
      P.body.position.y = f.crouch ? -0.35 : Math.abs(Math.sin(f.walk)) * 0.05 * Math.min(1, hsp);
      P.body.rotation.x = f.crouch ? -0.15 : 0;
      P.arms.position.y = 1.38 + P.body.position.y;
      P.arms.rotation.x = (f.using || f.reviving ? -0.6 : f.reloadT > 0 ? -0.5 + Math.sin(this.time * 12) * 0.1 : f.pitch * 0.8) + f.kick;
      if (f.slideT > 0) { P.body.rotation.x = 0.45; P.body.position.y = -0.55; P.legL.rotation.x = -1.3; P.legR.rotation.x = -1.0; P.legL.position.y = P.legR.position.y = 0.4; P.arms.position.y = 0.85; }
      if (f.emoteT > 0) animateEmote(f, P, this.time, m);
    }
    P.sh.visible = QUALITY[this.quality].blob && d2 < 50 * 50;
    if (P.sh.visible) { P.sh.position.y = World.ground(f.pos.x, f.pos.z, f.pos.y) - f.pos.y + 0.05; }
    f.refreshGun();
    // recul et rechargement visibles sur l'arme
    const g = P.gun; if (g.visible) { const base = f.weapon ? -0.5 : -0.6; g.position.z = base + f.kick * 0.14; g.rotation.x = f.reloadT > 0 ? -0.5 : f.kick * 0.25; g.rotation.z = f.reloadT > 0 ? Math.sin(this.time * 9) * 0.35 : 0; }
  },
  // ---------- caméra & rendu ----------
  updateCamera(dt) {
    const p = this.player;
    if (this.spectating && !this.spectating.alive) this.spectating = this.fighters.find(f => f.alive && f.state !== 'bus') || null;
    const v = (this.spectating && !p.alive) ? this.spectating : p;
    const cam = this.camera;
    const yaw = this.camYaw, pitch = this.camPitch;
    const fwd = this.camDir.set(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    const right = _v3.set(Math.cos(yaw), 0, -Math.sin(yaw));
    let target, back, side, up;
    if (this.victoryT > 0) {
      this.victoryT += dt; const a = this.victoryT * 0.6 + p.yaw;
      const tgt = _v1.set(p.pos.x, p.pos.y + 1.2, p.pos.z);
      cam.position.set(p.pos.x + Math.sin(a) * 5.5, p.pos.y + 2.4, p.pos.z + Math.cos(a) * 5.5);
      cam.lookAt(tgt); this.camPos.copy(cam.position); cam.fov = lerp(cam.fov, 50, 0.05); cam.updateProjectionMatrix();
      World.roofMesh.visible = true; World.sky.position.set(cam.position.x, 0, cam.position.z);
      this.sun.position.set(p.pos.x + Look.sunOff.x, p.pos.y + Look.sunOff.y, p.pos.z + Look.sunOff.z); this.sun.target.position.copy(p.pos);
      return;
    }
    if (View.arcade()) return this.arcadeCamera(v, dt);
    Look.uniforms.cutOn.value = 0;
    if (v.state === 'bus' && this.busPos) { target = this.busPos.clone(); back = 22; side = 0; up = 4; }
    else {
      const crouch = v.knocked ? -1.0 : v.slideT > 0 ? -0.7 : v.crouch ? -0.45 : 0;
      target = new THREE.Vector3(v.pos.x, v.pos.y + 1.6 + crouch + (v.kart ? 0.6 : 0), v.pos.z);
      const air = v.state === 'fall' || v.state === 'glide';
      const ads = v === p && p.ads; const W = p.weapon ? WEAPONS[p.weapon.w] : null;
      back = air ? 7 : v.kart ? 7.5 : ads ? (W && W.scope ? 0.3 : 1.8) : 3.6;
      side = air || v.kart ? 0 : ads ? 0.6 : 1.05; up = air ? 1 : v.kart ? 1.2 : 0.4;
      const tf = ads && W ? Settings.fov / W.zoom : Settings.fov + (v.slideT > 0 ? 12 : v.moveAmt > 1.15 ? 7 : 0) + (v.kick || 0) * 4;
      cam.fov = lerp(cam.fov, tf, 1 - Math.exp(-14 * dt)); cam.updateProjectionMatrix();
    }
    this.curBack = lerp(this.curBack || back, back, 1 - Math.exp(-12 * dt));
    const want = new THREE.Vector3().copy(target).addScaledVector(right, side).add(new THREE.Vector3(0, up, 0)).addScaledVector(fwd, -this.curBack);
    // collision caméra
    const pivot = new THREE.Vector3().copy(target).addScaledVector(right, side * 0.5);
    const dx = want.x - pivot.x, dy = want.y - pivot.y, dz = want.z - pivot.z; const L = Math.hypot(dx, dy, dz);
    if (L > 0.01 && v.state !== 'bus') { const t = World.ray(pivot.x, pivot.y, pivot.z, dx / L, dy / L, dz / L, L + 0.3, false, true); if (t < L + 0.3) want.set(pivot.x + dx / L * (t - 0.3), pivot.y + dy / L * (t - 0.3), pivot.z + dz / L * (t - 0.3)); }
    const gy = World.h(want.x, want.z) + 0.4; if (want.y < gy) want.y = gy;
    this.camPos.copy(want);
    // distance minimale du rayon de tir (devant le joueur)
    this.camMinT = Math.max(0, (target.x - want.x) * fwd.x + (target.y - want.y) * fwd.y + (target.z - want.z) * fwd.z);
    cam.position.copy(want);
    if (this.shake > 0) { cam.position.x += (Math.random() - 0.5) * this.shake * 0.3; cam.position.y += (Math.random() - 0.5) * this.shake * 0.3; this.shake = Math.max(0, this.shake - dt * 2); }
    cam.lookAt(want.x + fwd.x * 10, want.y + fwd.y * 10, want.z + fwd.z * 10);
    // toits : masqués quand on est à l'intérieur
    const inside = v.state === 'ground' && World.inBuilding(v.pos.x, v.pos.z);
    World.roofMesh.visible = !inside;
    // soleil / ombres suivent le joueur
    const so = Look.sunOff; this.sun.position.set(v.pos.x + so.x, v.pos.y + so.y, v.pos.z + so.z); this.sun.target.position.set(v.pos.x, v.pos.y, v.pos.z);
    World.sky.position.set(want.x, 0, want.z);
    // brouillard violet dans la tempête
    this.stormMix = lerp(this.stormMix || 0, v.inStorm && v.alive ? 1 : 0, 1 - Math.exp(-3 * dt));
    if (this.stormMix > 0.001 || this._stormFog) { this.scene.fog.color.copy(Look.fogBase).lerp(_v1c.set('#7b2ff7'), this.stormMix * 0.75); this.scene.fog.near = lerp(QUALITY[this.quality].fog * 0.3, 8, this.stormMix); this.scene.fog.far = lerp(QUALITY[this.quality].fog, 90, this.stormMix); this._stormFog = this.stormMix > 0.001; }
  },
  arcadeCamera(v, dt) {
    const cam = this.camera, p = this.player;
    const air = v.state === 'fall' || v.state === 'glide', bus = v.state === 'bus' && this.busPos;
    const T = bus ? this.busPos : v.pos;
    let H = bus ? 48 : air ? 30 : v.kart ? 22 : 16, D = bus ? 30 : air ? 18 : v.kart ? 14 : 10.5;
    if (v === p && p.ads) { H *= 1.55; D *= 1.55; }
    H *= Settings.camZoom || 1; D *= Settings.camZoom || 1;
    const want = _v1.set(T.x, T.y + H, T.z + D);
    if (!this.arcCam || this.arcCam.distanceToSquared(want) > 400 * 400) this.arcCam = want.clone();
    this.arcCam.lerp(want, 1 - Math.exp(-(bus ? 3 : 9) * dt));
    cam.position.copy(this.arcCam);
    if (this.shake > 0) { cam.position.x += (Math.random() - 0.5) * this.shake * 0.4; cam.position.z += (Math.random() - 0.5) * this.shake * 0.4; this.shake = Math.max(0, this.shake - dt * 2); }
    const look = _v2.set(this.arcCam.x, this.arcCam.y - H + 0.8, this.arcCam.z - D);
    cam.lookAt(look); if (Math.abs(cam.fov - 50) > 0.1) { cam.fov = lerp(cam.fov, 50, 0.2); cam.updateProjectionMatrix(); }
    this.camPos.copy(cam.position); this.camDir.copy(look).sub(cam.position).normalize(); this.camMinT = 0;
    World.roofMesh.visible = true; Look.uniforms.cutPos.value.copy(v.pos); Look.uniforms.cutOn.value = v.state === 'ground' && v.alive ? 1 : 0;
    const so = Look.sunOff; this.sun.position.set(v.pos.x + so.x, v.pos.y + so.y, v.pos.z + so.z); this.sun.target.position.set(v.pos.x, v.pos.y, v.pos.z);
    World.sky.position.set(cam.position.x, 0, cam.position.z);
    this.stormMix = lerp(this.stormMix || 0, v.inStorm && v.alive ? 1 : 0, 1 - Math.exp(-3 * dt));
    if (this.stormMix > 0.001 || this._stormFog) { this.scene.fog.color.copy(Look.fogBase).lerp(_v1c.set('#7b2ff7'), this.stormMix * 0.6); this.scene.fog.near = lerp(QUALITY[this.quality].fog * 0.3, 30, this.stormMix); this.scene.fog.far = lerp(QUALITY[this.quality].fog, 110, this.stormMix); this._stormFog = this.stormMix > 0.001; }
  },
  render(dt) {
    this.updateCamera(dt);
    Look.update(this.paused ? 0 : dt, this.camPos);
    HUD.update(dt);
    // battement de cœur quand la santé est basse
    const p = this.player;
    if (p && p.alive && (p.hp < 30 || p.knocked) && !this.paused) { this.heartT -= dt; if (this.heartT <= 0) { this.heartT = 0.95; Sfx.heart(); } }
    this.renderScene();
  },
  renderScene() {
    if (this.postOn) Post.render(this.scene, this.camera, Look.time, this.stormMix || 0);
    else this.renderer.render(this.scene, this.camera);
  },
  _proj: new THREE.Vector3(),
  project(p) {
    const v = this._proj.copy(p).project(this.camera);
    if (v.z > 1) return null;
    return { x: (v.x * 0.5 + 0.5) * View.w, y: (-v.y * 0.5 + 0.5) * View.h };
  },
};
