// ============ TOON ROYALE — monde vivant : pièces, marchands, coffre-fort, météores, tempête dorée, boss ============
'use strict';

RARITY.push({ n: 'Mythique', c: '#ff5cf0', m: 1.38, r: 0.25 });
const BOSS_SKIN = { id: 'boss', n: 'Roi Pingouin', shirt: '#1a1a2e', pants: '#1a1a2e', skin: '#ffffff', hat: 'crown', hatc: '#ffcf3f', pack: '#ff8a3d' };
const MERCHANT_SKIN = { id: 'merchant', n: 'Marchand', shirt: '#ffb347', pants: '#6b3fd6', skin: '#e9b48a', hat: 'cone', hatc: '#2ee6c8', pack: '#ffffff' };

const Events = {
  merchants: [], shopOpen: null,
  init(scene) {
    this.scene = scene;
    // marchands (persistants)
    const tent = new GeoBuilder();
    for (const [x, z] of [[-1.3, -1], [1.3, -1], [-1.3, 1], [1.3, 1]]) tent.box(x, 1.3, z, 0.1, 2.6, 0.1, '#8a5a30');
    for (let i = 0; i < 6; i++) tent.box(-1.25 + i * 0.5, 2.7, 0, 0.5, 0.12, 2.4, i % 2 ? '#ffffff' : '#ff4f8b');
    tent.box(0, 0.55, -1.05, 2.6, 1.1, 0.5, '#c8955a'); tent.box(0, 1.12, -1.05, 2.7, 0.08, 0.6, '#ffcf3f');
    tent.addGeo(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 14).rotateX(Math.PI / 2), M4(0, 3.3, -1.2), '#ffcf3f');
    const tg = tent.build();
    for (const s of World.merchantSpots) {
      const g = new THREE.Group(); const t = new THREE.Mesh(tg, Models.mat); g.add(t); if (Look.toon) Look.addOutline(t, 0.04);
      const npc = new Fighter({ name: 'Marchand', team: -1 }); npc.skin = MERCHANT_SKIN; npc.createMesh(); npc.mesh.position.set(0, 0, 0.1); g.add(npc.mesh);
      const y = World.ground(s.x, s.z); g.position.set(s.x, y, s.z); g.rotation.y = Math.atan2(-(World.pois[5].x - s.x), -(World.pois[5].z - s.z)) + Math.PI;
      scene.add(g); World.addCircle(s.x, s.z, 1.6, y + 3);
      this.merchants.push({ pos: new THREE.Vector3(s.x, y, s.z), group: g, npc, poi: s.poi });
    }
    // porte du coffre-fort
    const V = World.vault;
    if (V) {
      const sx = V.ax === 'x' ? V.w : 0.7, sz = V.ax === 'x' ? 0.7 : V.w;
      const b = new GeoBuilder(); b.box(0, V.h / 2, 0, sx, V.h, sz, '#7d8799'); b.addGeo(new THREE.CylinderGeometry(0.45, 0.45, 0.12, 14).rotateX(V.ax === 'x' ? Math.PI / 2 : 0).rotateZ(V.ax === 'x' ? 0 : Math.PI / 2), M4(0, V.h / 2, 0), '#ffcf3f');
      const m = new THREE.Mesh(b.build(), Models.mat); m.position.set(V.ax === 'x' ? V.m : V.f, V.base, V.ax === 'x' ? V.f : V.m); scene.add(m); if (Look.toon) Look.addOutline(m, 0.04);
      V.door = m;
    }
    this.meteorGeo = new THREE.IcosahedronGeometry(1.4, 0);
    this.meteorMat = new THREE.MeshBasicMaterial({ color: 0xff7b2e });
    this.goldChestMat = Look.mat({ vertexColors: true, emissive: 0x806000 });
  },
  reset() {
    const G = Game; const V = World.vault;
    if (V) { V.open = false; V.wall.dead = false; V.door.position.y = V.base; V.door.visible = true; }
    this.meteorPhase = Math.random() < 0.65 ? 2 : -1; this.meteorT = 0; this.meteorDone = false;
    this.goldPhase = Math.random() < 0.45 ? 3 : -1; this.gold = false; G.storm.goldMul = 1;
    Look.stormM.uniforms.c1.value.set('#5a1fd0'); Look.stormM.uniforms.c2.value.set('#d08cff');
    this.offers = this.rollOffers(); this.closeShop();
    // clé du coffre-fort
    if (V) { let s; for (let i = 0; i < 30; i++) { s = pick(World.lootSpots); if (dist2(s.x, s.z, V.cx, V.cz) > 120 * 120) break; } G.makeLoot({ kind: 'key' }, s.x + 1, s.z + 1); }
    // pièces au sol
    for (let i = 0; i < 70; i++) { const s = pick(World.lootSpots); G.makeLoot({ kind: 'coins', n: randi(8, 25) }, s.x + rand(-1.5, 1.5), s.z + rand(-1.5, 1.5)); }
    this.spawnBoss();
  },
  rollOffers() {
    const wd = Game.rollWeapon(4); const g = pick(GAG_LIST);
    return [
      { label: `${WEAPONS[wd.w].n} <small style="color:${RARITY[4].c}">Légendaire</small>`, price: 150, item: wd },
      { label: CONS.shieldB.n + ' ×2', price: 60, item: { kind: 'cons', c: 'shieldB', n: 2 } },
      { label: CONS.medkit.n, price: 50, item: { kind: 'cons', c: 'medkit', n: 1 } },
      { label: `Gag : ${GAGS[g].n}`, price: 80, item: { kind: 'gag', g } },
      { label: 'Munitions (toutes) ×40', price: 30, item: { kind: 'allammo' } },
    ];
  },
  openShop(m) {
    this.shopOpen = m; const el = $('shop'); el.hidden = false; if (document.pointerLockElement) document.exitPointerLock();
    const p = Game.player;
    el.querySelector('.coins').textContent = p.coins || 0;
    el.querySelector('.list').innerHTML = this.offers.map((o, i) => `<button data-i="${i}" ${o.sold ? 'disabled' : ''}><span>${o.label}</span><b>${o.sold ? 'Vendu' : o.price + ' ¤'}</b></button>`).join('');
    el.querySelectorAll('.list button').forEach(b => b.addEventListener('pointerdown', e => { e.stopPropagation(); this.buy(+b.dataset.i); }));
  },
  closeShop() { this.shopOpen = null; const el = $('shop'); if (el) el.hidden = true; },
  buy(i) {
    const p = Game.player, o = this.offers[i]; if (!o || o.sold) return;
    if ((p.coins || 0) < o.price) { Sfx.tone(200, 0.2, 0.2, 'square'); HUD.message('Pas assez de pièces', 1.2); return; }
    p.coins -= o.price; if (o.item.kind !== 'allammo') o.sold = true;
    if (o.item.kind === 'allammo') { for (const a in p.ammo) p.ammo[a] += a === 'rockets' ? 4 : a === 'shells' ? 15 : 40; Sfx.pickup(); }
    else { const it = Game.makeLoot(Object.assign({}, o.item, o.item.kind === 'weapon' ? { mag: WEAPONS[o.item.w].mag } : {}), p.pos.x, p.pos.z); if (!Game.pickup(p, it, false)) HUD.message('Objet posé à tes pieds', 1.2); }
    Sfx.chest(); HUD.lastInv = ''; this.openShop(this.shopOpen);
  },
  openVault(f) {
    const V = World.vault; if (!V || V.open || !f.hasKey) return;
    V.open = true; V.wall.dead = true; f.hasKey = false;
    const b = V.bld, G = Game;
    const items = [G.rollWeapon(4), G.rollWeapon(4), { kind: 'weapon', w: 'rocket', rar: 4, mag: 1 }, { kind: 'gag', g: pick(['piano', 'anvil']) }, { kind: 'coins', n: 60 }, { kind: 'cons', c: 'shieldB', n: 3 }, { kind: 'ammo', a: 'rockets', n: 6 }, { kind: 'ammo', a: 'medium', n: 60 }];
    items.forEach((d, i) => { const a = i / items.length * TAU; G.makeLoot(d, b.cx + Math.cos(a) * 3, b.cz + Math.sin(a) * 3); });
    if (f.isPlayer) { HUD.message('💰 Coffre-fort ouvert ! Le butin est à toi', 3); Sfx.win(); Haptic.play('streak'); }
    else if (dist2(f.pos.x, f.pos.z, G.player.pos.x, G.player.pos.z) < 120 * 120) HUD.message('Quelqu\'un a ouvert le coffre-fort !', 2.5);
    Sfx.tone(120, 1.2, 0.3, 'sawtooth', 0.5);
  },
  spawnBoss() {
    const G = Game, p = World.pois.find(q => q.n === 'Château Fou');
    const f = new Fighter({ name: 'Roi Pingouin', team: 999 }); f.skin = BOSS_SKIN; f.createMesh();
    f.isBoss = true; f.scale = 1.9; f.mesh.scale.setScalar(1.9); f.hp = 1000; f.hpMax = 1000;
    f.slots[0] = { kind: 'weapon', w: 'minigun', rar: 4, mag: 80 }; f.ammo.medium = 9999; f.coins = 150;
    f.state = 'ground'; f.pos.set(p.x - 4, World.ground(p.x - 4, p.z), p.z); f.input = { dx: 0, dz: 0, speed: 4, jump: false };
    f.ai = new BotAI(f); f.ai.guard = { x: p.x - 4, z: p.z, r: 30 }; f.ai.landing = { x: f.pos.x, z: f.pos.z };
    G.fighters.push(f); G.bots.push(f); G.dynGroup.add(f.mesh); this.boss = f;
  },
  bossDrop(f) {
    const G = Game;
    G.makeLoot({ kind: 'weapon', w: 'rocket', rar: 5, mag: 1 }, f.pos.x + 1.5, f.pos.z);
    G.makeLoot({ kind: 'weapon', w: pick(['ar', 'sniper', 'burst']), rar: 5, mag: 30 }, f.pos.x - 1.5, f.pos.z);
    G.makeLoot({ kind: 'ammo', a: 'rockets', n: 8 }, f.pos.x, f.pos.z + 1.5);
    HUD.message('👑 Le <b>Roi Pingouin</b> est tombé ! Butin <span style="color:#ff5cf0">mythique</span>', 3.5);
  },
  meteor(x, z) {
    const y = World.ground(x, z);
    const warn = new THREE.Mesh(Gags.warnGeo, Gags.warnMat); warn.position.set(x, y + 0.08, z); warn.scale.setScalar(5); this.scene.add(warn);
    const mesh = new THREE.Mesh(this.meteorGeo, this.meteorMat); mesh.visible = false; this.scene.add(mesh);
    Gags.drops.push({ g: 'meteor', pos: new THREE.Vector3(x, y, z), t: 1.4, fall: 0.45, owner: null, warn, mesh });
  },
  goldStorm() {
    const G = Game, st = G.storm; this.gold = true; st.goldMul = 1.6;
    Look.stormM.uniforms.c1.value.set('#c98a00'); Look.stormM.uniforms.c2.value.set('#fff0a0');
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * TAU, d = Math.random() * st.nr * 0.7; const x = st.nx + Math.cos(a) * d, z = st.nz + Math.sin(a) * d;
      if (World.h(x, z) < 1 || World.inBuilding(x, z)) continue;
      G.spawnChest(x, z); const c = G.chests[G.chests.length - 1]; c.gold = true; c.mesh.material = this.goldChestMat; c.mesh.scale.setScalar(1.3);
    }
    HUD.message('✨ <b>Tempête dorée !</b> Coffres légendaires dans la zone — la tempête fait plus mal', 4, 'poi');
    Announcer.say('Tempête dorée !', 'gold');
  },
  update(dt) {
    const G = Game, st = G.storm;
    // pluie de météores
    if (!this.meteorDone && st.phase === this.meteorPhase && !st.shrinking && st.timer < STORM_PHASES[st.phase].wait * G.mode.storm * 0.7) {
      if (this.meteorT === 0) { HUD.message('☄ <b>Pluie de météores !</b> Évite les cercles rouges', 3.5, 'storm'); Announcer.say('Pluie de météores !', 'red'); }
      this.meteorT += dt; this.nextMeteor = (this.nextMeteor || 0) - dt;
      if (this.nextMeteor <= 0) {
        this.nextMeteor = 0.8;
        const p = G.player; let x, z;
        if (Math.random() < 0.35 && p.alive) { x = p.pos.x + rand(-35, 35); z = p.pos.z + rand(-35, 35); }
        else { const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * st.r; x = st.cx + Math.cos(a) * d; z = st.cz + Math.sin(a) * d; }
        if (World.h(x, z) > 0.5) this.meteor(x, z);
      }
      if (this.meteorT > 22) this.meteorDone = true;
    }
    if (this.gold && st.phase !== this.goldPhase) { this.gold = false; st.goldMul = 1; Look.stormM.uniforms.c1.value.set('#5a1fd0'); Look.stormM.uniforms.c2.value.set('#d08cff'); }
    // marchands : petit salut
    for (const m of this.merchants) { if (dist2(m.pos.x, m.pos.z, G.camPos.x, G.camPos.z) > 70 * 70) continue; const P = m.npc.parts; P.arms.rotation.x = 0.3 + Math.sin(G.time * 3) * 0.3; P.body.position.y = Math.abs(Math.sin(G.time * 2)) * 0.05; }
    if (this.shopOpen && dist2(G.player.pos.x, G.player.pos.z, this.shopOpen.pos.x, this.shopOpen.pos.z) > 4 * 4) this.closeShop();
    // barre de vie du boss
    const B = this.boss, bar = $('bossBar');
    const show = B && B.alive && G.player.alive && dist2(B.pos.x, B.pos.z, G.camPos.x, G.camPos.z) < 80 * 80;
    bar.hidden = !show; if (show) bar.querySelector('i').style.width = Math.max(0, B.hp / B.hpMax * 100) + '%';
  },
};
