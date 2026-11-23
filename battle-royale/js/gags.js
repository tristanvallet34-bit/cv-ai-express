// ============ TOON ROYALE — Gags cartoon, pièges, bulles, fumigènes ============
'use strict';

const GAGS = {
  piano: { n: 'Piano tombant', d: 'Frappe aérienne sur la zone visée', rar: 3, uses: 1, c: '#2a2433', svg: 'M3 7h18v12H3zM5 9v6h2V9zm4 0v6h2V9zm4 0v6h2V9zm4 0v6h2V9z' },
  banana: { n: 'Peau de banane', d: 'Piège : l\'adversaire glisse', rar: 1, uses: 3, c: '#ffe14a', svg: 'M4 6c2 8 8 12 16 11-1 2-4 3-7 3C7 20 3 14 4 6z' },
  mallet: { n: 'Maillet géant', d: 'Aplatit la cible au corps à corps', rar: 2, uses: 3, c: '#ff4f8b', svg: 'M3 4h11v7H3zM8 11h2v10H8z' },
  anvil: { n: 'Enclume', d: 'Assomme et retire le bouclier', rar: 3, uses: 1, c: '#5a556a', svg: 'M3 6h16l-4 5h-2v4h4v3H7v-3h4v-4H8z' },
  hole: { n: 'Trou portable', d: 'Téléporte à 30 m qui marche dessus', rar: 2, uses: 2, c: '#1a1a2e', svg: 'M12 8c5 0 9 2 9 4.5S17 17 12 17s-9-2-9-4.5S7 8 12 8z' },
  balloon: { n: 'Ballon gonflable', d: 'Flotte 7 s en l\'air', rar: 2, uses: 1, c: '#ff7ad1', svg: 'M12 2a6 7 0 016 7c0 4-3 7-6 7s-6-3-6-7a6 7 0 016-7zm-1 14h2l-1 6z' },
  box: { n: 'Boîte en carton', d: 'Invisible de loin si immobile', rar: 1, uses: 1, c: '#c8955a', svg: 'M12 2l9 5v10l-9 5-9-5V7zm0 2.3L5.5 7.8 12 11.3l6.5-3.5z' },
};
const GAG_LIST = Object.keys(GAGS);

const Gags = {
  traps: [], drops: [], bubbles: [], smokes: [], ropes: [],
  init(scene) {
    this.scene = scene;
    const mk = fn => { const b = new GeoBuilder(); fn(b); return b.build(); };
    this.geo = {
      piano: mk(b => { b.box(0, 1.1, 0, 2.4, 1.2, 1.5, '#1a1a2e'); b.box(0, 1.35, -0.85, 2.3, 0.12, 0.35, '#ffffff'); for (let i = -1; i <= 1; i += 0.25) b.box(i, 1.43, -0.85, 0.1, 0.06, 0.2, '#1a1a2e'); for (const x of [-1, 1]) b.box(x, 0.25, 0.4, 0.15, 0.5, 0.15, '#1a1a2e'); b.box(0, 2.0, 0.3, 2.4, 0.6, 0.9, '#1a1a2e'); }),
      anvil: mk(b => { b.box(0, 0.3, 0, 0.8, 0.6, 0.6, '#5a556a'); b.box(0, 0.75, 0, 1.6, 0.35, 0.7, '#6a6580'); b.addGeo(new THREE.ConeGeometry(0.3, 0.7, 6).rotateZ(Math.PI / 2), M4(-1.1, 0.75, 0), '#6a6580'); }),
      banana: mk(b => { b.addGeo(new THREE.TorusGeometry(0.28, 0.07, 6, 10, Math.PI), M4(0, 0.08, 0, Math.PI / 2, 0, 0), '#ffe14a'); b.box(0.28, 0.08, 0, 0.06, 0.06, 0.1, '#6b4a2a'); }),
      hole: mk(b => { b.addGeo(new THREE.CircleGeometry(1.2, 20).rotateX(-Math.PI / 2), M4(0, 0.04, 0), '#0a0612'); b.addGeo(new THREE.RingGeometry(1.15, 1.3, 20).rotateX(-Math.PI / 2), M4(0, 0.05, 0), '#3a2a5a'); }),
      balloon: mk(b => { b.addGeo(new THREE.SphereGeometry(0.9, 14, 10), M4(0, 3.6, 0, 0, 0, 0, 1, 1.15, 1), '#ff7ad1'); b.box(0, 2.4, 0, 0.03, 1.4, 0.03, '#ffffff'); }),
      box: mk(b => { b.box(0, 0.6, 0, 1.15, 1.2, 1.15, '#c8955a'); b.box(0, 1.21, 0, 1.17, 0.02, 0.2, '#e8c07a'); b.box(0, 0.6, -0.58, 0.5, 0.25, 0.02, '#8a5a30'); }),
      mallet: mk(b => { b.box(0, 0, -0.6, 0.08, 0.08, 1.2, '#8a5a3c'); b.addGeo(new THREE.CylinderGeometry(0.32, 0.32, 0.8, 10).rotateZ(Math.PI / 2), M4(0, 0, -1.3), '#ff4f8b'); b.addGeo(new THREE.CylinderGeometry(0.33, 0.33, 0.12, 10).rotateZ(Math.PI / 2), M4(0.3, 0, -1.3), '#ffffff'); b.addGeo(new THREE.CylinderGeometry(0.33, 0.33, 0.12, 10).rotateZ(Math.PI / 2), M4(-0.3, 0, -1.3), '#ffffff'); }),
      gagItem: mk(b => { b.addGeo(new THREE.IcosahedronGeometry(0.32, 0), null, '#bd63ff'); b.addGeo(new THREE.TorusGeometry(0.4, 0.04, 5, 14), M4(0, 0, 0, Math.PI / 2, 0, 0), '#ffcf3f'); }),
    };
    this.warnGeo = new THREE.RingGeometry(0.85, 1, 32).rotateX(-Math.PI / 2);
    this.warnMat = new THREE.MeshBasicMaterial({ color: 0xff3355, transparent: true, opacity: 0.7, depthWrite: false });
    this.bubbleMat = new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide });
    this.bubbleGeo = new THREE.SphereGeometry(1, 24, 14);
    this.smokeMat = new THREE.MeshLambertMaterial({ color: 0xe8e4f0, transparent: true, opacity: 0.85, depthWrite: false });
    this.smokeGeo = new THREE.IcosahedronGeometry(1, 1);
    this.ropeMat = new THREE.LineBasicMaterial({ color: 0x2a2433 });
  },
  mesh(kind) { const m = new THREE.Mesh(this.geo[kind], Models.mat); if (Look.toon && kind !== 'hole') Look.addOutline(m, 0.04); return m; },
  reset() {
    for (const a of [this.traps, this.drops, this.bubbles, this.smokes, this.ropes]) for (const o of a) { if (o.mesh) this.scene.remove(o.mesh); if (o.warn) this.scene.remove(o.warn); if (o.group) this.scene.remove(o.group); if (o.line) this.scene.remove(o.line); }
    this.traps = []; this.drops = []; this.bubbles = []; this.smokes = []; this.ropes = [];
  },
  give(f, g) { f.gag = { g, n: GAGS[g].uses }; if (f.isPlayer) { Sfx.pickup(); HUD.lastInv = ''; } },
  canAct(f) { return f.alive && !f.knocked && f.state === 'ground' && !f.kart && !(f.stunT > 0) && !(f.slipT > 0); },
  // utilisation d'un gag ; target = point visé (Vector3) pour les frappes
  use(f, target) {
    const G = Game; if (!f.gag || !this.canAct(f) || (f.gagCD || 0) > 0) return false;
    const g = f.gag.g; f.gagCD = 0.8; f.boxT = 0;
    const fx = -Math.sin(f.yaw), fz = -Math.cos(f.yaw);
    if (g === 'piano' || g === 'anvil') {
      if (!target) return false;
      const y = World.ground(target.x, target.z);
      const warn = new THREE.Mesh(this.warnGeo, this.warnMat); warn.position.set(target.x, y + 0.08, target.z); warn.scale.setScalar(g === 'piano' ? 3.5 : 4); this.scene.add(warn);
      const mesh = this.mesh(g); mesh.position.set(target.x, y + 40, target.z); mesh.visible = false; this.scene.add(mesh);
      this.drops.push({ g, pos: new THREE.Vector3(target.x, y, target.z), t: g === 'piano' ? 1.8 : 1.0, fall: 0.45, owner: f, warn, mesh });
      Sfx.tone(1200, 0.5, 0.15, 'sine', 0.5);
    } else if (g === 'banana' || g === 'hole') {
      const d = g === 'hole' ? 2.2 : 0.2; const x = f.pos.x + fx * d, z = f.pos.z + fz * d; const y = World.ground(x, z, f.pos.y + 0.5);
      const mesh = this.mesh(g); mesh.position.set(x, y, z); mesh.rotation.y = Math.random() * TAU; this.scene.add(mesh);
      this.traps.push({ g, pos: new THREE.Vector3(x, y, z), owner: f, t: g === 'hole' ? 25 : 60, mesh, arm: g === 'banana' ? 0.6 : 0.3 });
      Sfx.tone(g === 'hole' ? 200 : 600, 0.2, 0.2, 'triangle', g === 'hole' ? 0.4 : 1.5);
    } else if (g === 'mallet') {
      f.malletT = 0.45; Sfx.noise(0.2, 300, 0.4); Sfx.tone(180, 0.2, 0.4, 'square', 0.5);
      for (const o of G.fighters) {
        if (!o.alive || o === f || o.team === f.team || o.state === 'bus') continue;
        const dx = o.pos.x - f.pos.x, dz = o.pos.z - f.pos.z, d = Math.hypot(dx, dz); if (d > 3.4 || Math.abs(o.pos.y - f.pos.y) > 2) continue;
        if ((dx * fx + dz * fz) / (d || 1) < 0.35) continue;
        applyDamage(o, 30, f, false, 'mallet', o.pos.clone().setY(o.pos.y + 1.6)); o.flatT = 2.6; o.using = null;
        Effects.burst(_v1.set(o.pos.x, o.pos.y + 0.5, o.pos.z), '#ffcf3f', 10, 5, 0.5, 1);
      }
    } else if (g === 'balloon') { f.floatT = 7; f.onGround = false; Sfx.tone(300, 0.6, 0.2, 'sine', 3); }
    else if (g === 'box') { f.boxT = 30; f.boxGrace = 0.6; f.crouch = false; Sfx.noise(0.2, 800, 0.15); }
    if (f.isPlayer) { Haptic.play('gag'); HUD.lastInv = ''; Game.stat('gag', 1); }
    f.gag.n--; if (f.gag.n <= 0) f.gag = null;
    return true;
  },
  // effets visuels attachés aux personnages (ballon, carton, maillet)
  visuals(f, dt) {
    const P = f.parts;
    const need = (k, parent, pos) => { if (!P[k]) { P[k] = this.mesh(k); if (pos) P[k].position.copy(pos); (parent || f.mesh).add(P[k]); } return P[k]; };
    const floating = f.floatT > 0;
    if (floating || P.balloon) need('balloon').visible = floating;
    const boxed = f.boxT > 0;
    if (boxed || P.box) need('box').visible = boxed;
    P.body.visible = P.legL.visible = P.legR.visible = P.arms.visible = !boxed;
    if (f.malletT > 0 || P.mallet) { const m = need('mallet', P.arms, new THREE.Vector3(0.2, 0, 0)); m.visible = f.malletT > 0; if (m.visible) m.rotation.x = 1.6 - (1 - f.malletT / 0.45) * 2.4; }
    const flat = f.flatT > 0, S = f.scale || 1; f.mesh.scale.set((flat ? 1.25 : 1) * S, (flat ? 0.35 : 1) * S, (flat ? 1.25 : 1) * S);
  },
  ray(ox, oy, oz, dx, dy, dz, maxT) { // bulles : bloquent les balles qui traversent leur surface
    let best = maxT;
    for (const b of this.bubbles) {
      const fx = ox - b.pos.x, fy = oy - b.pos.y, fz = oz - b.pos.z;
      const B = fx * dx + fy * dy + fz * dz, C = fx * fx + fy * fy + fz * fz - b.r * b.r; const disc = B * B - C; if (disc < 0) continue;
      const s = Math.sqrt(disc); const t1 = -B - s, t2 = -B + s;
      if (t1 > 0.05 && t1 < best) best = t1; else if (t2 > 0.05 && t2 < best && C < 0) best = t2;
    }
    return best;
  },
  smokeBlocks(a, b) {
    for (const s of this.smokes) {
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z; const L2 = dx * dx + dy * dy + dz * dz || 1;
      let t = ((s.pos.x - a.x) * dx + (s.pos.y - a.y) * dy + (s.pos.z - a.z) * dz) / L2; t = clamp(t, 0, 1);
      if (Math.hypot(a.x + dx * t - s.pos.x, a.y + dy * t - s.pos.y, a.z + dz * t - s.pos.z) < s.r * s.k) return true;
    }
    return false;
  },
  addBubble(pos) {
    const m = new THREE.Mesh(this.bubbleGeo, this.bubbleMat); m.position.copy(pos); m.scale.setScalar(0.1); this.scene.add(m);
    this.bubbles.push({ pos: pos.clone(), r: 4.2, t: 14, mesh: m, grow: 0 }); Sfx.tone(500, 0.5, 0.2, 'sine', 2.2);
  },
  addSmoke(pos) {
    const g = new THREE.Group(); g.position.copy(pos);
    for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(this.smokeGeo, this.smokeMat); m.position.set(rand(-3, 3), rand(0, 3), rand(-3, 3)); m.scale.setScalar(rand(2, 3.2)); g.add(m); }
    this.scene.add(g); this.smokes.push({ pos: pos.clone().setY(pos.y + 1.5), r: 6.5, k: 0, t: 13, group: g });
    Sfx.noise(1.2, 500, 0.3);
  },
  teleport(f) {
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * TAU, x = f.pos.x + Math.cos(a) * 30, z = f.pos.z + Math.sin(a) * 30;
      if (World.h(x, z) < 1 || World.inBuilding(x, z) || World.nearWall(x, z, 1)) continue;
      Effects.poof(f.pos); f.pos.set(x, World.ground(x, z) + 7, z); f.state = 'fall'; f.vy = 2; f.padT = 1; f.vel.set(0, 0, 0); Effects.poof(f.pos);
      if (dist2(x, z, Game.camPos.x, Game.camPos.z) < 80 * 80) Sfx.tone(300, 0.5, 0.25, 'sine', 3);
      return;
    }
  },
  update(dt) {
    const G = Game;
    for (const f of G.fighters) {
      if (!f.alive) continue;
      if (f.gagCD > 0) f.gagCD -= dt;
      if (f.slipT > 0) f.slipT -= dt; if (f.flatT > 0) f.flatT -= dt; if (f.stunT > 0) f.stunT -= dt; if (f.malletT > 0) f.malletT -= dt;
      if (f.floatT > 0) { f.floatT -= dt; if (f.knocked || f.state !== 'ground') f.floatT = 0; }
      if (f.boxT > 0) { f.boxT -= dt; f.boxGrace -= dt; if (f.boxGrace < 0 && (f.moveAmt > 0.75 || G.time - f.lastShotT < 0.2 || f.knocked)) f.boxT = 0; }
      if (f.mesh.visible) this.visuals(f, dt);
    }
    // pièges
    for (let i = this.traps.length - 1; i >= 0; i--) {
      const t = this.traps[i]; t.t -= dt; t.arm -= dt; let done = t.t <= 0;
      if (!done && t.arm <= 0) for (const f of G.fighters) {
        if (!f.alive || f.state !== 'ground' || f.kart || (t.g === 'banana' && f.team === t.owner.team)) continue;
        if (dist2(f.pos.x, f.pos.z, t.pos.x, t.pos.z) > (t.g === 'hole' ? 1.2 : 0.9) ** 2 || Math.abs(f.pos.y - t.pos.y) > 1.2) continue;
        if (t.g === 'banana') {
          f.slipT = 1.6; f.using = null; f.reloadT = 0; const sp = Math.max(7, Math.hypot(f.vel.x, f.vel.z) * 1.4); const a = f.yaw; f.vel.set(-Math.sin(a) * sp, 0, -Math.cos(a) * sp);
          if (dist2(f.pos.x, f.pos.z, G.camPos.x, G.camPos.z) < 60 * 60) { Sfx.tone(900, 0.35, 0.25, 'sine', 0.3); Sfx.noise(0.3, 2000, 0.1); }
          if (f.isPlayer) HUD.message('Glissade !', 1); if (t.owner.isPlayer) Game.stat('damage', 0);
          done = true; break;
        } else { if ((f.holeCD || 0) < G.time) { f.holeCD = G.time + 2; this.teleport(f); } }
      }
      if (done) { this.scene.remove(t.mesh); this.traps.splice(i, 1); }
    }
    // frappes aériennes
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i]; d.t -= dt;
      d.warn.material.opacity = 0.4 + 0.4 * Math.abs(Math.sin(G.time * 10));
      if (d.t > 0) continue;
      d.mesh.visible = true; d.fall -= dt; if (d.g === 'meteor') Effects.trail(d.mesh.position); d.mesh.position.y = d.pos.y + Math.max(0, d.fall / 0.45) * 40; d.mesh.rotation.y += dt * 3;
      if (d.fall > 0) continue;
      const R = d.g === 'piano' ? 3.5 : d.g === 'meteor' ? 5 : 4;
      Effects.boom(_v1.copy(d.pos).setY(d.pos.y + 0.5)); Sfx.boom(d.pos.distanceTo(G.camPos));
      if (d.g === 'meteor') { const m = d.mesh; this.scene.remove(d.warn); this.scene.remove(m); G.damageCrates(d.pos, R, 200); if (G.camPos.distanceTo(d.pos) < 30 && Settings.camShake) G.shake = 0.5; for (const f of G.fighters) { if (!f.alive || f.state === 'bus') continue; const dd = Math.hypot(f.pos.x - d.pos.x, f.pos.z - d.pos.z); if (dd < R && Math.abs(f.pos.y - d.pos.y) < 4) applyDamage(f, Math.round(60 * (1 - dd / R * 0.5)), null, false, 'meteor', f.pos.clone().setY(f.pos.y + 2)); } this.drops.splice(i, 1); continue; }
      if (d.g === 'piano') [262, 311, 370, 415].forEach((f, k) => setTimeout(() => Sfx.tone(f, 0.6, 0.15, 'triangle'), k * 40));
      else Sfx.tone(2200, 0.6, 0.25, 'triangle', 0.98);
      for (const f of G.fighters) {
        if (!f.alive || f.state === 'bus' || (d.owner && f.team === d.owner.team && f !== d.owner)) continue;
        const dd = Math.hypot(f.pos.x - d.pos.x, f.pos.z - d.pos.z); if (dd > R || Math.abs(f.pos.y - d.pos.y) > 4) continue;
        if (d.g === 'meteor') applyDamage(f, Math.round(60 * (1 - dd / R * 0.5)), null, false, 'meteor', f.pos.clone().setY(f.pos.y + 2));
        else if (d.g === 'piano') applyDamage(f, Math.round(95 * (1 - dd / R * 0.5)), d.owner, false, 'piano', f.pos.clone().setY(f.pos.y + 2));
        else { f.sh = 0; applyDamage(f, 40, d.owner, false, 'anvil', f.pos.clone().setY(f.pos.y + 2)); f.stunT = 1.3; }
      }
      G.damageCrates(d.pos, R, 200);
      if (G.camPos.distanceTo(d.pos) < 30 && Settings.camShake) G.shake = 0.5;
      this.scene.remove(d.warn); d.mesh.position.y = d.pos.y; const m = d.mesh; setTimeout(() => this.scene.remove(m), 2500);
      this.drops.splice(i, 1);
    }
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i]; b.t -= dt; b.grow = Math.min(1, b.grow + dt * 3); b.mesh.scale.setScalar(b.r * b.grow * (b.t < 1 ? b.t : 1));
      if (b.t <= 0) { this.scene.remove(b.mesh); this.bubbles.splice(i, 1); }
    }
    for (let i = this.smokes.length - 1; i >= 0; i--) {
      const s = this.smokes[i]; s.t -= dt; s.k = Math.min(1, s.k + dt * 1.5) * (s.t < 2 ? s.t / 2 : 1);
      s.group.scale.setScalar(Math.max(0.01, s.k)); s.group.rotation.y += dt * 0.1;
      if (s.t <= 0) { this.scene.remove(s.group); this.smokes.splice(i, 1); }
    }
    for (let i = this.ropes.length - 1; i >= 0; i--) { const r = this.ropes[i]; r.t -= dt; if (r.t <= 0 || !r.f.grapple) { this.scene.remove(r.line); this.ropes.splice(i, 1); continue; } const p = r.line.geometry.attributes.position; p.setXYZ(0, r.f.pos.x, r.f.pos.y + 1.3, r.f.pos.z); p.needsUpdate = true; }
  },
  // IA : quand utiliser son gag en combat
  botUse(f, T, dist) {
    if (!f.gag || (f.gagCD || 0) > 0 || Math.random() > 0.08) return;
    const g = f.gag.g, low = f.hp + f.sh < 55;
    if ((g === 'piano' || g === 'anvil') && dist > 8 && dist < 55) this.use(f, T.pos.clone().add(_v3.set(T.vel.x * 0.8, 0, T.vel.z * 0.8)));
    else if (g === 'mallet' && dist < 3) this.use(f);
    else if (g === 'banana' && dist < 10) this.use(f);
    else if ((g === 'balloon' || g === 'box' || g === 'hole') && low) this.use(f);
  },
  // grappin
  fireGrapple(f, origin, dir) {
    const t = World.ray(origin.x, origin.y, origin.z, dir.x, dir.y, dir.z, 60);
    if (t >= 60) { HUD.message('Trop loin pour le grappin', 1); return false; }
    const p = origin.clone().addScaledVector(dir, t - 0.6);
    f.grapple = { p, t: 2.2 }; f.slideT = 0; f.onGround = false;
    const geo = new THREE.BufferGeometry().setFromPoints([f.pos.clone(), p]); const line = new THREE.Line(geo, this.ropeMat); this.scene.add(line);
    this.ropes.push({ f, line, t: 2.2 }); Sfx.tone(700, 0.25, 0.2, 'square', 2.5);
    return true;
  },
};
