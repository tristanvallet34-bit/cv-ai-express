// ============ TOON ROYALE — l'île ============
'use strict';

const CELL = 16;
const World = {
  ISL: 430, SIZE: 1100,
  pois: [
    { n: 'Port Bonbon', x: -250, z: 225, r: 58, type: 'town', count: 8 },
    { n: 'Village Cactus', x: 190, z: 205, r: 52, type: 'town', count: 7 },
    { n: 'Usine Rouillée', x: -60, z: -235, r: 58, type: 'factory', count: 3 },
    { n: 'Ferme Pâquerette', x: -265, z: -85, r: 48, type: 'farm', count: 3 },
    { n: 'Pic Glacé', x: 232, z: -238, r: 32, type: 'cabin', count: 3 },
    { n: 'Centre-Ville', x: 5, z: 25, r: 72, type: 'town', count: 12 },
    { n: 'Château Fou', x: 290, z: 25, r: 44, type: 'castle', count: 1 },
    { n: 'Camp des Pins', x: -125, z: 110, r: 36, type: 'cabin', count: 4 },
    { n: 'Plage Coco', x: 60, z: 330, r: 36, type: 'town', count: 4 },
    { n: 'Dunes Sucrées', x: 100, z: 160, r: 40, type: 'town', count: 5, candy: true },
    { n: 'Marais Grenouille', x: -185, z: -165, r: 34, type: 'cabin', count: 4, swamp: true },
    { n: 'Fête Foraine', x: -40, z: -118, r: 40, type: 'fair', count: 3 },
  ],
  river: [[205, -175], [250, -110], [300, -70], [360, -55], [460, -40]],
  CANDY: { x: 190, z: 150, r: 150 }, SWAMP: { x: -185, z: -165, r: 95 },
  biome(x, z) {
    const c = 1 - smoothstep(this.CANDY.r * 0.6, this.CANDY.r, Math.hypot(x - this.CANDY.x, z - this.CANDY.z));
    const s = 1 - smoothstep(this.SWAMP.r * 0.55, this.SWAMP.r, Math.hypot(x - this.SWAMP.x, z - this.SWAMP.z));
    return { candy: c, swamp: s };
  },
  riverDist(x, z) { let d = 1e9; const R = this.river; for (let i = 0; i < R.length - 1; i++) d = Math.min(d, segDist(x, z, R[i][0], R[i][1], R[i + 1][0], R[i + 1][1])); return d; },
  walls: [], circles: [], buildings: [], grid: new Map(), crates: [],
  lootSpots: [], chestSpots: [], kartSpots: [],
  built: false,

  rawH(x, z) {
    const r = Math.hypot(x, z);
    let h = (fbm(x * 0.0062 + 3, z * 0.0062 + 7) - 0.5) * 24 + 9;
    h += 44 * Math.exp(-((x - 232) ** 2 + (z + 238) ** 2) / (2 * 62 * 62));
    h += 20 * Math.exp(-((x + 270) ** 2 + (z - 40) ** 2) / (2 * 55 * 55));
    h += 12 * Math.exp(-((x - 110) ** 2 + (z + 60) ** 2) / (2 * 45 * 45));
    const B = this.biome(x, z);
    if (B.candy > 0) h = lerp(h, 6.5 + Math.sin(x * 0.045 + z * 0.02) * 2.2 + Math.sin(z * 0.06) * 1.2, B.candy * 0.85);
    if (B.swamp > 0) h = lerp(h, 0.9 + (vnoise(x * 0.045 + 9, z * 0.045 + 2) - 0.5) * 3.4, B.swamp);
    const e = smoothstep(this.ISL - 95, this.ISL + 15, r + (vnoise(x * 0.012, z * 0.012) - 0.5) * 70);
    return h * (1 - e) - 9 * e;
  },
  h(x, z) {
    let h = this.rawH(x, z);
    for (let i = 0; i < this.pois.length; i++) {
      const p = this.pois[i]; const dx = x - p.x, dz = z - p.z; const d2 = dx * dx + dz * dz;
      const R = p.r + 30; if (d2 > R * R) continue;
      const w = 1 - smoothstep(p.r, R, Math.sqrt(d2));
      h = lerp(h, p.h, w);
    }
    if (x > 150 && z < 20 && z > -240) { const rd = this.riverDist(x, z); if (rd < 15) h = lerp(h, Math.min(h, -1.25), 1 - smoothstep(5, 15, rd)); }
    return h;
  },
  // hauteur du sol (terrain, planchers, caisses)
  ground(x, z, y) {
    let g = this.h(x, z);
    const c = this.cell(x, z);
    if (c) {
      for (const w of c.walls) {
        if (w.dead) continue;
        if (x > w.x0 && x < w.x1 && z > w.z0 && z < w.z1 && w.y1 > g && w.y1 <= (y == null ? g : y) + 0.55) g = w.y1;
      }
      for (const b of c.blds) if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1 && b.floor > g) g = b.floor;
    }
    return g;
  },
  key(ix, iz) { return ix * 4096 + iz; },
  cell(x, z) { return this.grid.get(this.key(Math.floor(x / CELL), Math.floor(z / CELL))); },
  _cellAt(ix, iz) { const k = this.key(ix, iz); let c = this.grid.get(k); if (!c) { c = { walls: [], circles: [], blds: [] }; this.grid.set(k, c); } return c; },
  _insert(obj, x0, x1, z0, z1, list) {
    for (let ix = Math.floor(x0 / CELL); ix <= Math.floor(x1 / CELL); ix++)
      for (let iz = Math.floor(z0 / CELL); iz <= Math.floor(z1 / CELL); iz++) this._cellAt(ix, iz)[list].push(obj);
  },
  addWall(x0, x1, z0, z1, y0, y1, opts) {
    const w = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), y0, y1, cover: opts && opts.cover };
    this.walls.push(w); this._insert(w, w.x0, w.x1, w.z0, w.z1, 'walls'); return w;
  },
  addCircle(x, z, r, y1) { const c = { x, z, r, y1 }; this.circles.push(c); this._insert(c, x - r, x + r, z - r, z + r, 'circles'); },
  // collisions horizontales d'un cercle (rayon rad) avec murs et troncs
  collide(p, rad, height) {
    const c = this.cell(p.x, p.z);
    for (let pass = 0; pass < 2; pass++) {
      const ix = Math.floor(p.x / CELL), iz = Math.floor(p.z / CELL);
      for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++) {
        const cc = this.grid.get(this.key(ix + ox, iz + oz)); if (!cc) continue;
        for (const w of cc.walls) {
          if (w.dead) continue;
          if (p.y + height < w.y0 || p.y > w.y1 - 0.5) continue;
          const nx = clamp(p.x, w.x0, w.x1), nz = clamp(p.z, w.z0, w.z1);
          let dx = p.x - nx, dz = p.z - nz; const d2 = dx * dx + dz * dz;
          if (d2 < rad * rad) {
            if (d2 > 1e-6) { const d = Math.sqrt(d2); p.x = nx + dx / d * rad; p.z = nz + dz / d * rad; }
            else { // au centre du mur : sortir par le côté le plus proche
              const l = p.x - w.x0, r = w.x1 - p.x, b = p.z - w.z0, t = w.z1 - p.z; const m = Math.min(l, r, b, t);
              if (m === l) p.x = w.x0 - rad; else if (m === r) p.x = w.x1 + rad; else if (m === b) p.z = w.z0 - rad; else p.z = w.z1 + rad;
            }
          }
        }
        if (pass === 0) for (const ci of cc.circles) {
          if (p.y > ci.y1) continue;
          const dx = p.x - ci.x, dz = p.z - ci.z; const d2 = dx * dx + dz * dz; const R = rad + ci.r;
          if (d2 < R * R && d2 > 1e-6) { const d = Math.sqrt(d2); p.x = ci.x + dx / d * R; p.z = ci.z + dz / d * R; }
        }
      }
    }
    void c;
  },
  inBuilding(x, z) {
    const c = this.cell(x, z); if (!c) return null;
    for (const b of c.blds) if (x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1) return b;
    return null;
  },
  // Rayon contre murs/troncs/terrain. Retourne la distance de l'impact ou maxT
  ray(ox, oy, oz, dx, dy, dz, maxT, skipTerrain, skipDyn) {
    let best = maxT; this.lastWall = null;
    const ix = 1 / (dx || 1e-9), iy = 1 / (dy || 1e-9), iz = 1 / (dz || 1e-9);
    const ex = ox + dx * maxT, ez = oz + dz * maxT;
    const bx0 = Math.min(ox, ex), bx1 = Math.max(ox, ex), bz0 = Math.min(oz, ez), bz1 = Math.max(oz, ez);
    for (const w of this.walls) {
      if (w.dead) continue;
      if (w.x1 < bx0 || w.x0 > bx1 || w.z1 < bz0 || w.z0 > bz1) continue;
      let t1 = (w.x0 - ox) * ix, t2 = (w.x1 - ox) * ix;
      let tmin = Math.min(t1, t2), tmax = Math.max(t1, t2);
      t1 = (w.y0 - oy) * iy; t2 = (w.y1 - oy) * iy;
      tmin = Math.max(tmin, Math.min(t1, t2)); tmax = Math.min(tmax, Math.max(t1, t2));
      t1 = (w.z0 - oz) * iz; t2 = (w.z1 - oz) * iz;
      tmin = Math.max(tmin, Math.min(t1, t2)); tmax = Math.min(tmax, Math.max(t1, t2));
      if (tmax >= Math.max(tmin, 0) && tmin < best && tmin > 0) { best = tmin; this.lastWall = w; }
    }
    // troncs (cellules le long du rayon)
    const seen = new Set();
    const step = CELL * 0.5;
    for (let t = 0; t <= best + step; t += step) {
      const x = ox + dx * t, z = oz + dz * t;
      const k = this.key(Math.floor(x / CELL), Math.floor(z / CELL));
      if (seen.has(k)) continue; seen.add(k);
      const c = this.grid.get(k); if (!c) continue;
      for (const ci of c.circles) {
        // intersection 2D rayon/cercle
        const fx = ox - ci.x, fz = oz - ci.z;
        const a = dx * dx + dz * dz; if (a < 1e-9) continue;
        const b = 2 * (fx * dx + fz * dz), cc = fx * fx + fz * fz - ci.r * ci.r;
        const disc = b * b - 4 * a * cc; if (disc < 0) continue;
        const tt = (-b - Math.sqrt(disc)) / (2 * a);
        if (tt > 0 && tt < best && oy + dy * tt < ci.y1) best = tt;
      }
    }
    if (!skipTerrain) {
      const st = 2.5;
      for (let t = st; t < best; t += st) {
        if (oy + dy * t < this.h(ox + dx * t, oz + dz * t)) { best = Math.max(0, t - st * 0.5); this.lastWall = null; break; }
      }
    }
    if (!skipDyn && Gags.bubbles.length) { const bt = Gags.ray(ox, oy, oz, dx, dy, dz, best); if (bt < best) { best = bt; this.lastWall = null; } }
    return best;
  },
  los(a, b) { // a,b: {x,y,z}
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z; const L = Math.hypot(dx, dy, dz);
    if (L < 0.01) return true;
    if (Gags.smokes.length && Gags.smokeBlocks(a, b)) return false;
    return this.ray(a.x, a.y, a.z, dx / L, dy / L, dz / L, L) >= L - 0.3;
  },

  // ---------------- construction de l'île ----------------
  build(scene) {
    if (this.built) return;
    this.built = true;
    const rng = mulberry32(1337);
    const R = () => rng();
    for (const p of this.pois) p.h = Math.max(2.4, this.rawH(p.x, p.z));

    // ---- terrain ----
    const SEG = 150;
    const tg = new THREE.PlaneGeometry(this.SIZE, this.SIZE, SEG, SEG);
    tg.rotateX(-Math.PI / 2);
    const tp = tg.attributes.position; const cols = new Float32Array(tp.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < tp.count; i++) {
      const x = tp.getX(i), z = tp.getZ(i); const h = this.h(x, z);
      tp.setY(i, h);
      this.groundColor(x, z, h, c);
      cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
    }
    tg.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    tg.computeVertexNormals();
    const terrain = new THREE.Mesh(tg, Look.mat({ vertexColors: true }));
    terrain.receiveShadow = true; terrain.name = 'terrain';
    scene.add(terrain);
    this.terrain = terrain;


    // ---- bâtiments ----
    const gb = new GeoBuilder(), rb = new GeoBuilder();
    this.gb = gb; this.rb = rb;
    for (const p of this.pois) this.buildPoi(p, R);
    // structures isolées (cabanes, tours de guet, murets) sur la carte
    for (let i = 0; i < 26; i++) {
      const a = R() * TAU, d = 60 + R() * 300; const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const h = this.h(x, z); if (h < 3 || h > 28 || this.nearPoi(x, z, 25)) continue;
      if (R() < 0.5) this.addHouse(x, z, 8 + R() * 3, 7 + R() * 3, 4.2, Math.floor(R() * 4), R, { small: true });
      else this.addCoverCluster(x, z, R);
    }
    this.buildPads(R);
    this.buildBridges();
    this.merchantSpots = [];
    for (const name of ['Port Bonbon', 'Village Cactus', 'Ferme Pâquerette', 'Dunes Sucrées']) {
      const p = this.pois.find(q => q.n === name);
      for (let t = 0; t < 40; t++) { const a = R() * TAU, d = p.r * (0.3 + R() * 0.5); const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d; if (this.inBuilding(x, z) || this.nearWall(x, z, 3)) continue; this.merchantSpots.push({ x, z, poi: p.n }); break; }
    }
    this.buildCrates(scene);
    const bm = new THREE.Mesh(gb.build(), Look.mat({ vertexColors: true }));
    bm.castShadow = true; bm.receiveShadow = true; scene.add(bm); this.bldMesh = bm; Look.cutaway(bm.material);
    const rm = new THREE.Mesh(rb.build(), Look.mat({ vertexColors: true }));
    rm.castShadow = true; scene.add(rm); this.roofMesh = rm; Look.cutaway(rm.material);
    this.outl = { bld: [], tree: [] };
    if (Look.toon) { this.outl.bld.push(Look.addOutline(bm, 0.055), Look.addOutline(rm, 0.07)); }

    // ---- arbres, rochers, buissons (instanciés) ----
    this.buildNature(scene, R);
    // ---- ciel, nuages, océan ----
    this.buildSky(scene, R);
    Look.buildHeightTex();
    this.water = Look.water(scene);
    // ---- points de loot éparpillés ----
    for (let i = 0; i < 90; i++) {
      const a = R() * TAU, d = 30 + R() * 340; const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const h = this.h(x, z); if (h < 1.5) continue;
      this.lootSpots.push({ x, z, out: true });
    }
    for (let i = 0; i < 14; i++) {
      const a = R() * TAU, d = 50 + R() * 320; const x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (this.h(x, z) < 2) continue; this.chestSpots.push({ x, z, out: true });
    }
    this.buildMinimap();
  },
  // ponts au-dessus de la rivière
  buildBridges() {
    for (const [ia, t] of [[1, 0.5], [3, 0.4]]) {
      const A = this.river[ia], Bp = this.river[ia + 1]; const x = lerp(A[0], Bp[0], t), z = lerp(A[1], Bp[1], t);
      const alongX = Math.abs(Bp[0] - A[0]) > Math.abs(Bp[1] - A[1]); // la rivière coule selon X → pont selon Z
      const L = 34, W = 4.5; let top = 0;
      for (const s of [-1, 1]) top = Math.max(top, this.rawH(alongX ? x : x + s * L / 2, alongX ? z + s * L / 2 : z));
      top = Math.max(top, 1.6) + 0.3;
      const sx = alongX ? W : L, sz = alongX ? L : W;
      this.gb.box(x, top - 0.25, z, sx, 0.5, sz, '#a8743f');
      for (let k = -L / 2; k <= L / 2; k += 2) this.gb.box(alongX ? x : x + k, top + 0.01, alongX ? z + k : z, alongX ? W : 0.12, 0.03, alongX ? 0.12 : W, '#8a5a30');
      for (const s of [-1, 1]) { this.gb.box(alongX ? x + s * W / 2 : x, top + 0.5, alongX ? z : z + s * W / 2, alongX ? 0.15 : L, 0.15, alongX ? L : 0.15, '#8a5a30'); this.addWall(alongX ? x + s * W / 2 - 0.1 : x - L / 2, alongX ? x + s * W / 2 + 0.1 : x + L / 2, alongX ? z - L / 2 : z + s * W / 2 - 0.1, alongX ? z + L / 2 : z + s * W / 2 + 0.1, top, top + 1); }
      for (let k = -L / 2 + 6; k < L / 2 - 4; k += 9) this.gb.box(alongX ? x : x + k, top - 3, alongX ? z + k : z, 0.6, 5.5, 0.6, '#6b4a2a');
      this.addWall(x - sx / 2, x + sx / 2, z - sz / 2, z + sz / 2, top - 0.5, top);
    }
  },
  // caisses destructibles (instanciées)
  buildCrates(scene) {
    const b = new GeoBuilder(); b.box(0, 0.5, 0, 1, 1, 1, '#c58a4f'); b.box(0, 0.5, 0, 1.04, 0.18, 1.04, '#8a5a30'); b.box(0, 0.5, 0, 1.04, 1.04, 0.18, '#8a5a30');
    const m = new THREE.InstancedMesh(b.build(), Look.mat({ vertexColors: true }), this.crates.length);
    m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; this.crateMesh = m;
    this.crates.forEach((c, i) => { c.i = i; c.wall.crate = c; }); this.resetCrates();
    scene.add(m); if (Look.toon) Look.addOutline(m, 0.05);
  },
  resetCrates() {
    const d = new THREE.Object3D();
    for (const c of this.crates) { c.hp = 110; c.wall.dead = false; d.position.set(c.x, c.y, c.z); d.rotation.set(0, c.rot, 0); d.scale.setScalar(c.s); d.updateMatrix(); this.crateMesh.setMatrixAt(c.i, d.matrix); }
    this.crateMesh.instanceMatrix.needsUpdate = true;
  },
  breakCrate(c) {
    if (c.wall.dead) return; c.wall.dead = true;
    const d = new THREE.Object3D(); d.scale.setScalar(0.0001); d.updateMatrix(); this.crateMesh.setMatrixAt(c.i, d.matrix); this.crateMesh.instanceMatrix.needsUpdate = true;
    // la caisse du dessus tombe aussi
    for (const o of this.crates) if (o !== c && !o.wall.dead && Math.abs(o.x - c.x) < 0.1 && Math.abs(o.z - c.z) < 0.1 && o.y > c.y) this.breakCrate(o);
  },
  // champignons rebondissants
  buildPads(R) {
    this.pads = [];
    const spots = [];
    for (const p of this.pois) { const a = R() * TAU; spots.push([p.x + Math.cos(a) * (p.r + 6), p.z + Math.sin(a) * (p.r + 6)]); }
    for (let i = 0; i < 8; i++) { const a = R() * TAU, d = 80 + R() * 260; spots.push([Math.cos(a) * d, Math.sin(a) * d]); }
    for (const [x, z] of spots) {
      const h = this.h(x, z); if (h < 2 || h > 34 || this.nearWall(x, z, 3) || this.inBuilding(x, z)) continue;
      const gb = this.gb;
      gb.addGeo(new THREE.CylinderGeometry(0.5, 0.7, 0.9, 10), M4(x, h + 0.35, z), '#fff3e0');
      gb.addGeo(new THREE.SphereGeometry(1.7, 14, 6, 0, TAU, 0, Math.PI / 2), M4(x, h + 0.6, z, 0, 0, 0, 1, 0.45, 1), '#ff3d6e');
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3; gb.addGeo(new THREE.SphereGeometry(0.22, 6, 4), M4(x + Math.cos(a) * 1.05, h + 1.05, z + Math.sin(a) * 1.05), '#ffffff'); }
      gb.addGeo(new THREE.SphereGeometry(0.26, 6, 4), M4(x, h + 1.37, z), '#ffffff');
      this.pads.push({ x, z, y: h });
    }
  },
  nearPoi(x, z, pad) { for (const p of this.pois) if (dist2(x, z, p.x, p.z) < (p.r + pad) ** 2) return p; return null; },
  roads: null,
  groundColor(x, z, h, c) {
    if (!this.roads) {
      this.roads = [];
      const cc = this.pois[5];
      for (const p of this.pois) if (p !== cc && p.type !== 'cabin') this.roads.push([cc.x, cc.z, p.x, p.z]);
      this.roads.push([this.pois[0].x, this.pois[0].z, this.pois[3].x, this.pois[3].z]);
      this.roads.push([this.pois[1].x, this.pois[1].z, this.pois[8].x, this.pois[8].z]);
      this.roads.push([this.pois[2].x, this.pois[2].z, this.pois[3].x, this.pois[3].z]);
    }
    const n = vnoise(x * 0.05, z * 0.05); const B = this.biome(x, z);
    if (B.candy > 0.05 && h > 1.2) { c.set(n > 0.5 ? '#e9a3bf' : '#e6c08a'); if (B.candy < 1) c.lerp(new THREE.Color('#7fd35a'), 1 - B.candy); return c; }
    if (B.swamp > 0.05 && h > 0.5) { c.set(n > 0.55 ? '#5d7f3a' : '#6e6a3c'); if (B.swamp < 1) c.lerp(new THREE.Color('#69c44e'), 1 - B.swamp); return c; }
    if (h < 1.0) c.set('#f2d98a');
    else if (h < 2.4) c.set('#f2d98a').lerp(new THREE.Color('#86d65a'), (h - 1) / 1.4);
    else if (h > 36) c.set('#f6f9ff');
    else if (h > 27) c.set('#a49a91').lerp(new THREE.Color('#f6f9ff'), smoothstep(30, 36, h));
    else { c.set(n > 0.5 ? '#7fd35a' : '#69c44e'); if (h > 20) c.lerp(new THREE.Color('#a49a91'), smoothstep(20, 27, h)); }
    if (h > 1.0) {
      for (const p of this.pois) {
        const d = Math.sqrt(dist2(x, z, p.x, p.z));
        if (d < p.r * 0.95) { c.lerp(new THREE.Color(p.type === 'cabin' && p.h > 30 ? '#e8eef8' : p.type === 'farm' ? '#cdb672' : '#c9bea0'), 0.75 * (1 - smoothstep(p.r * 0.7, p.r * 0.95, d))); break; }
      }
      for (const r of this.roads) {
        const d = segDist(x, z, r[0], r[1], r[2], r[3]);
        if (d < 5) { c.lerp(new THREE.Color('#d6b77c'), 0.8 * (1 - d / 5)); break; }
      }
    }
    return c;
  },

  buildPoi(p, R) {
    const placed = [];
    const tryPlace = (w, d, tries) => {
      for (let t = 0; t < (tries || 40); t++) {
        const a = R() * TAU, rr = (0.25 + R() * 0.7) * (p.r - Math.max(w, d) * 0.5);
        const x = p.x + Math.cos(a) * rr, z = p.z + Math.sin(a) * rr;
        let ok = true;
        for (const q of placed) if (Math.abs(q.x - x) < (q.w + w) / 2 + 5 && Math.abs(q.z - z) < (q.d + d) / 2 + 5) { ok = false; break; }
        if (ok) { placed.push({ x, z, w, d }); return { x, z }; }
      }
      return null;
    };
    const faceCenter = (x, z) => { const dx = p.x - x, dz = p.z - z; return Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 2 : 3) : (dz > 0 ? 0 : 1); };
    if (p.type === 'town' || p.type === 'cabin') {
      if (p.n === 'Centre-Ville') { const pos = tryPlace(15, 13, 80); if (pos) this.addHouse(pos.x, pos.z, 15, 13, 7.4, faceCenter(pos.x, pos.z), R, { two: true, vault: true }); }
      if (p.type === 'town' && p.count >= 7) { // place centrale : fontaine
        placed.push({ x: p.x, z: p.z, w: 8, d: 8 });
        this.gb.addGeo(new THREE.CylinderGeometry(3.2, 3.6, 1, 10), M4(p.x, p.h + 0.4, p.z), '#cfd8e3');
        this.gb.addGeo(new THREE.CylinderGeometry(2.7, 2.7, 0.2, 10), M4(p.x, p.h + 0.92, p.z), '#4fc8f0');
        this.gb.addGeo(new THREE.CylinderGeometry(0.5, 0.7, 3, 8), M4(p.x, p.h + 2, p.z), '#cfd8e3');
        this.addCircle(p.x, p.z, 3.4, p.h + 3.2);
        this.chestSpots.push({ x: p.x + 4.5, z: p.z });
      }
      for (let i = 0; i < p.count; i++) {
        const big = p.type === 'town' && R() < 0.3;
        const w = big ? 14 + R() * 4 : 9 + R() * 4, d = big ? 11 + R() * 3 : 8 + R() * 3;
        const pos = tryPlace(w, d); if (!pos) continue;
        this.addHouse(pos.x, pos.z, w, d, big ? 7.4 : 4.4, faceCenter(pos.x, pos.z), R, { two: big, snow: p.h > 30, candy: p.candy, swamp: p.swamp });
      }
    } else if (p.type === 'factory') {
      for (let i = 0; i < p.count; i++) {
        const w = 22 + R() * 6, d = 16 + R() * 4; const pos = tryPlace(w, d, 60); if (!pos) continue;
        this.addHouse(pos.x, pos.z, w, d, 8, faceCenter(pos.x, pos.z), R, { factory: true });
      }
      for (let i = 0; i < 10; i++) { const pos = tryPlace(6.5, 2.6); if (pos) this.addContainer(pos.x, pos.z, R); }
      // cheminées
      for (let i = 0; i < 2; i++) { const pos = tryPlace(4, 4); if (!pos) continue; const h = this.h(pos.x, pos.z); this.gb.addGeo(new THREE.CylinderGeometry(1.4, 1.8, 26, 10), M4(pos.x, h + 13, pos.z), i ? '#b85a3c' : '#c96b4a'); this.gb.addGeo(new THREE.CylinderGeometry(1.5, 1.5, 1.2, 10), M4(pos.x, h + 23, pos.z), '#f2f2f2'); this.addCircle(pos.x, pos.z, 1.8, h + 26); }
    } else if (p.type === 'farm') {
      const pos = tryPlace(20, 14, 60); if (pos) this.addHouse(pos.x, pos.z, 20, 14, 8, faceCenter(pos.x, pos.z), R, { barn: true });
      for (let i = 0; i < 2; i++) { const q = tryPlace(10, 9); if (q) this.addHouse(q.x, q.z, 10, 9, 4.4, faceCenter(q.x, q.z), R, {}); }
      for (let i = 0; i < 14; i++) { const q = tryPlace(2.2, 2.2); if (q) { const h = this.h(q.x, q.z); this.gb.addGeo(new THREE.CylinderGeometry(1.1, 1.1, 1.6, 10).rotateZ(Math.PI / 2), M4(q.x, h + 1.1, q.z, 0, R() * 3, 0), '#f3d266'); this.addWall(q.x - 0.9, q.x + 0.9, q.z - 0.9, q.z + 0.9, h - 1, h + 1.9, { cover: true }); } }
      // silo
      const s = tryPlace(5, 5); if (s) { const h = this.h(s.x, s.z); this.gb.addGeo(new THREE.CylinderGeometry(2.4, 2.4, 14, 12), M4(s.x, h + 7, s.z), '#d9e2ea'); this.gb.addGeo(new THREE.SphereGeometry(2.4, 12, 6, 0, TAU, 0, Math.PI / 2), M4(s.x, h + 14, s.z), '#e8344d'); this.addCircle(s.x, s.z, 2.5, h + 16); }
    } else if (p.type === 'castle') {
      this.addCastle(p, R);
    } else if (p.type === 'fair') {
      this.addFair(p, R, tryPlace, faceCenter);
    }
    // caisses de couverture
    for (let i = 0; i < Math.round(p.r / 9); i++) { const q = tryPlace(3, 3); if (q) this.addCoverCluster(q.x, q.z, R, true); }
    // spots de loot extérieurs dans le POI
    for (let i = 0; i < Math.round(p.r / 10); i++) { const q = tryPlace(1, 1, 10); if (q) this.lootSpots.push({ x: q.x, z: q.z, out: true }); }
  },

  addHouse(cx, cz, w, d, h, door, R, o) {
    o = o || {};
    const gb = this.gb, rb = this.rb;
    const hw = w / 2, hd = d / 2;
    let base = -99;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]]) base = Math.max(base, this.h(cx + sx * hw, cz + sz * hd));
    base += 0.15;
    let WALLC = o.factory ? pick(['#c9cfd6', '#b7c4cf', '#d6c7b0']) : o.barn ? '#d8343f' : pick(['#ffe8b0', '#ffd1dc', '#c9f2ff', '#d8ffc9', '#fff3e0', '#e8d9ff', '#ffd9b3']);
    let ROOFC = o.factory ? '#7d8791' : o.barn ? '#f2f2f2' : o.snow ? '#ffffff' : pick(['#e8344d', '#3e6bd6', '#2ea36b', '#ff8a3d', '#7b4fd6', '#d94f8a']);
    if (o.candy) { WALLC = pick(['#ffd6e8', '#fff0c2', '#d6f5ff', '#e9d6ff']); ROOFC = pick(['#ff6fa8', '#7ad1ff', '#ffb347', '#b58cff']); }
    if (o.swamp) { WALLC = pick(['#8a6b4a', '#7a5e40', '#9b7a52']); ROOFC = pick(['#4f6b3a', '#3e5a30']); }
    if (o.vault) { WALLC = '#a4adc0'; ROOFC = '#5a6378'; }
    const T = 0.45, DG = o.factory || o.barn ? 2.4 : 1.35, DH = o.factory || o.barn ? 4.2 : 3.1;
    const y0 = base - 4, y1 = base + h;
    // fondation
    gb.box(cx, base - 2, cz, w + 0.6, 4, d + 0.6, '#b3a796');
    // plancher
    gb.box(cx, base + 0.03, cz, w - T, 0.06, d - T, o.factory ? '#8d949b' : '#c79a6b');
    const wallSeg = (x0, x1, z0, z1) => {
      this.addWall(x0, x1, z0, z1, y0, y1);
      gb.box((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), y1 - y0, Math.abs(z1 - z0), WALLC);
    };
    const lintel = (x0, x1, z0, z1) => {
      this.addWall(x0, x1, z0, z1, base + DH, y1);
      gb.box((x0 + x1) / 2, (base + DH + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), y1 - base - DH, Math.abs(z1 - z0), WALLC);
    };
    const sides = [ // [axis, fixed, from, to]
      ['x', cz + hd - T / 2, cx - hw, cx + hw], // 0 +z
      ['x', cz - hd + T / 2, cx - hw, cx + hw], // 1 -z
      ['z', cx + hw - T / 2, cz - hd + T, cz + hd - T], // 2 +x
      ['z', cx - hw + T / 2, cz - hd + T, cz + hd - T], // 3 -x
    ];
    const doors = [door]; if (o.factory || o.two) doors.push(door ^ 1);
    let doorOut = null, doorIn = null;
    sides.forEach((s, i) => {
      const [ax, f, a, b] = s; const m = (a + b) / 2;
      const seg = (u0, u1) => ax === 'x' ? wallSeg(u0, u1, f - T / 2, f + T / 2) : wallSeg(f - T / 2, f + T / 2, u0, u1);
      if (doors.includes(i)) {
        seg(a, m - DG); seg(m + DG, b);
        if (ax === 'x') lintel(m - DG, m + DG, f - T / 2, f + T / 2); else lintel(f - T / 2, f + T / 2, m - DG, m + DG);
        const sign = (i === 0 || i === 2) ? 1 : -1;
        const outP = ax === 'x' ? { x: m, z: f + sign * 2.2 } : { x: f + sign * 2.2, z: m };
        const inP = ax === 'x' ? { x: m, z: f - sign * 2.2 } : { x: f - sign * 2.2, z: m };
        if (!doorOut) { doorOut = outP; doorIn = inP; }
        if (o.vault && !this.vault) { // porte blindée (mur amovible)
          const dw = ax === 'x' ? this.addWall(m - DG, m + DG, f - T, f + T, base - 1, base + DH) : this.addWall(f - T, f + T, m - DG, m + DG, base - 1, base + DH);
          this.vault = { wall: dw, out: outP, inP, cx, cz, base, ax, f, m, w: DG * 2, h: DH, bld: null, open: false };
        }
        // porte ouverte (décor) + paillasson
        if (ax === 'x') gb.box(m, base + 0.05, f + sign * 1.0, DG * 1.6, 0.05, 1.2, '#8a5a3c'); else gb.box(f + sign * 1.0, base + 0.05, m, 1.2, 0.05, DG * 1.6, '#8a5a3c');
      } else {
        seg(a, b);
      }
      // fenêtres (décor)
      if (!o.barn) {
        const nW = Math.max(1, Math.floor((b - a) / 5));
        for (let k = 0; k < nW; k++) {
          const u = a + (b - a) * (k + 0.5) / nW; if (doors.includes(i) && Math.abs(u - m) < DG + 1) continue;
          const sign = (i === 0 || i === 2) ? 1 : -1; const off = f + sign * (T / 2 + 0.02);
          for (let fl = 0; fl < (h > 6 ? 2 : 1); fl++) {
            const wy = base + 2 + fl * 3.2;
            if (ax === 'x') { gb.box(u, wy, off, 1.5, 1.2, 0.06, '#4b6fa8'); gb.box(u, wy - 0.7, off, 1.8, 0.15, 0.12, '#ffffff'); }
            else { gb.box(off, wy, u, 0.06, 1.2, 1.5, '#4b6fa8'); gb.box(off, wy - 0.7, u, 0.12, 0.15, 1.8, '#ffffff'); }
          }
        }
      }
    });
    // étage pour les grandes maisons : simple mezzanine visuelle non praticable -> plafond
    // toit
    if (o.factory) {
      rb.box(cx, y1 + 0.25, cz, w + 0.8, 0.5, d + 0.8, ROOFC);
      for (let k = -1; k <= 1; k += 2) rb.box(cx + k * w * 0.2, y1 + 1, cz, 3, 1.2, d * 0.7, '#a8b4bf');
    } else {
      const along = w >= d; const ov = 0.6; const rh = Math.min(w, d) * 0.42;
      const X0 = cx - hw - ov, X1 = cx + hw + ov, Z0 = cz - hd - ov, Z1 = cz + hd + ov, Y = y1;
      if (along) {
        const ridge = Y + rh;
        rb.quad([X0, Y, Z1], [X1, Y, Z1], [X1, ridge, cz], [X0, ridge, cz], ROOFC);
        rb.quad([X1, Y, Z0], [X0, Y, Z0], [X0, ridge, cz], [X1, ridge, cz], ROOFC);
        rb.tri([cx - hw, Y, cz - hd], [cx - hw, Y, cz + hd], [cx - hw, ridge - 0.3, cz], WALLC);
        rb.tri([cx + hw, Y, cz + hd], [cx + hw, Y, cz - hd], [cx + hw, ridge - 0.3, cz], WALLC);
      } else {
        const ridge = Y + rh;
        rb.quad([X1, Y, Z1], [X1, Y, Z0], [cx, ridge, Z0], [cx, ridge, Z1], ROOFC);
        rb.quad([X0, Y, Z0], [X0, Y, Z1], [cx, ridge, Z1], [cx, ridge, Z0], ROOFC);
        rb.tri([cx + hw, Y, cz - hd], [cx - hw, Y, cz - hd], [cx, ridge - 0.3, cz - hd], WALLC);
        rb.tri([cx - hw, Y, cz + hd], [cx + hw, Y, cz + hd], [cx, ridge - 0.3, cz + hd], WALLC);
      }
      if (!o.barn && R() < 0.7) rb.box(cx + hw * 0.4, Y + rh * 0.7, cz + hd * 0.2, 0.9, rh * 0.9, 0.9, '#9c6b52');
      // plafond plat sous le toit (cache l'intérieur du toit)
      rb.box(cx, Y + 0.05, cz, w, 0.1, d, '#f5efe6');
    }
    const bld = { x0: cx - hw, x1: cx + hw, z0: cz - hd, z1: cz + hd, floor: base, top: y1, doorOut, doorIn, cx, cz, vault: !!o.vault };
    if (o.vault && this.vault) this.vault.bld = bld;
    this.buildings.push(bld); this._insert(bld, bld.x0, bld.x1, bld.z0, bld.z1, 'blds');
    // mobilier / couverture intérieure
    const area = (w - 2) * (d - 2);
    const nLoot = o.vault ? 0 : Math.max(1, Math.round(area / 40));
    for (let k = 0; k < nLoot; k++) this.lootSpots.push({ x: cx + (R() - 0.5) * (w - 2.5), z: cz + (R() - 0.5) * (d - 2.5), bld });
    if (!o.vault && R() < (o.small ? 0.35 : 0.55)) this.chestSpots.push({ x: cx + (R() - 0.5) * (w - 3), z: cz + (R() - 0.5) * (d - 3), bld });
    if (w > 9 && R() < 0.8) { // table / canapé
      const tx = cx + (R() - 0.5) * (w - 5), tz = cz + (R() - 0.5) * (d - 5);
      gb.box(tx, base + 0.5, tz, 2.2, 0.15, 1.2, '#a0663e'); gb.box(tx, base + 0.22, tz, 1.8, 0.45, 0.9, '#7a4a2a');
      this.addWall(tx - 1.1, tx + 1.1, tz - 0.6, tz + 0.6, base, base + 0.6, { cover: true });
    }
    return bld;
  },
  addContainer(x, z, R) {
    const h = this.h(x, z); const rot = R() < 0.5; const L = 6.5, W = 2.6, H = 2.8;
    const col = pick(['#e8344d', '#3e6bd6', '#2ea36b', '#ff8a3d', '#ffcf3f']);
    const sx = rot ? W : L, sz = rot ? L : W;
    this.gb.box(x, h + H / 2 - 0.2, z, sx, H, sz, col);
    this.gb.box(x, h + H - 0.15, z, sx + 0.1, 0.12, sz + 0.1, '#ffffff');
    this.addWall(x - sx / 2, x + sx / 2, z - sz / 2, z + sz / 2, h - 1, h + H - 0.2);
  },
  addCoverCluster(x, z, R, small) {
    const n = small ? 1 + Math.floor(R() * 2) : 2 + Math.floor(R() * 3);
    for (let i = 0; i < n; i++) {
      const px = x + (R() - 0.5) * 5, pz = z + (R() - 0.5) * 5, h = this.h(px, pz);
      const s = 1.3 + R() * 0.4;
      const w1 = this.addWall(px - s / 2, px + s / 2, pz - s / 2, pz + s / 2, h - 1, h + s, { cover: true });
      this.crates.push({ x: px, y: h, z: pz, s, rot: R() * 0.4, wall: w1 });
      if (i === 0 && R() < 0.35) { const w2 = this.addWall(px - s * 0.4, px + s * 0.4, pz - s * 0.4, pz + s * 0.4, h + s, h + s * 1.9, { cover: true }); this.crates.push({ x: px, y: h + s, z: pz, s: s * 0.8, rot: R(), wall: w2 }); }
    }
  },
  // Fête Foraine : grande roue, carrousel, stands
  addFair(p, R, tryPlace, faceCenter) {
    const gb = this.gb, h = p.h + 0.05;
    // grande roue (dans le plan X-Y, face au sud)
    const wx = p.x - 8, wz = p.z - 6, wy = h + 12, rad = 9.5;
    gb.addGeo(new THREE.TorusGeometry(rad, 0.28, 6, 40), M4(wx, wy, wz), '#ff4f8b');
    gb.addGeo(new THREE.TorusGeometry(rad * 0.55, 0.18, 6, 32), M4(wx, wy, wz), '#ffcf3f');
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; gb.addGeo(new THREE.BoxGeometry(0.14, rad * 2, 0.14), M4(wx, wy, wz, 0, 0, a), '#f2f2f2'); }
    gb.addGeo(new THREE.CylinderGeometry(0.7, 0.7, 1.2, 12).rotateX(Math.PI / 2), M4(wx, wy, wz), '#3a3645');
    const cabC = ['#3ea8ff', '#2ee6c8', '#ffcf3f', '#bd63ff', '#ff8a3d', '#8ee04a', '#ff4f8b', '#ffffff'];
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, cx = wx + Math.cos(a) * rad, cy = wy + Math.sin(a) * rad; gb.box(cx, cy - 1.1, wz, 1.6, 1.4, 1.6, cabC[i]); gb.box(cx, cy - 0.3, wz, 1.8, 0.15, 1.8, '#3a3645'); }
    for (const s of [-1, 1]) { gb.addGeo(new THREE.BoxGeometry(0.4, wy - h + 1, 0.4), M4(wx + s * 3.2, h + (wy - h) / 2, wz - 1.2, 0, 0, s * 0.26), '#c9d2dc'); gb.addGeo(new THREE.BoxGeometry(0.4, wy - h + 1, 0.4), M4(wx + s * 3.2, h + (wy - h) / 2, wz + 1.2, 0, 0, s * 0.26), '#c9d2dc'); }
    this.addWall(wx - 1.2, wx + 1.2, wz - 1.6, wz + 1.6, h - 1, h + 3); this.addWall(wx - 6.5, wx - 4.5, wz - 1.6, wz + 1.6, h - 1, h + 1.5); this.addWall(wx + 4.5, wx + 6.5, wz - 1.6, wz + 1.6, h - 1, h + 1.5);
    // carrousel
    const cx = p.x + 12, cz = p.z + 6;
    gb.addGeo(new THREE.CylinderGeometry(4.6, 4.8, 0.5, 20), M4(cx, h + 0.25, cz), '#ffe8b0');
    gb.addGeo(new THREE.CylinderGeometry(0.35, 0.35, 5, 10), M4(cx, h + 2.5, cz), '#ffcf3f');
    gb.addGeo(new THREE.ConeGeometry(5.2, 2.4, 20), M4(cx, h + 6.2, cz), '#e8344d');
    gb.addGeo(new THREE.CylinderGeometry(5.2, 5.2, 0.4, 20), M4(cx, h + 4.9, cz), '#ffffff');
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, x = cx + Math.cos(a) * 3.4, z = cz + Math.sin(a) * 3.4; gb.addGeo(new THREE.CylinderGeometry(0.06, 0.06, 4.4, 5), M4(x, h + 2.7, z), '#f2f2f2'); gb.box(x, h + 1.6, z, 0.4, 0.7, 1.1, cabC[i], -a); gb.box(x, h + 2.1, z - 0.0, 0.3, 0.4, 0.3, cabC[(i + 3) % 8], -a); }
    this.addCircle(cx, cz, 0.6, h + 5); this.addWall(cx - 4.4, cx + 4.4, cz - 4.4, cz + 4.4, h - 1, h + 0.5, { cover: true });
    this.chestSpots.push({ x: cx + 2, z: cz + 2 }, { x: wx, z: wz + 4 });
    for (let i = 0; i < 6; i++) this.lootSpots.push({ x: p.x + (R() - 0.5) * p.r * 1.2, z: p.z + (R() - 0.5) * p.r * 1.2, out: true });
    // stands
    for (let i = 0; i < p.count; i++) { const q = tryPlace(8, 7); if (q) this.addHouse(q.x, q.z, 8, 7, 4, faceCenter(q.x, q.z), R, { small: true, candy: true }); }
  },
  addCastle(p, R) {
    const H = 7, T = 1.4, S = 30, base = p.h + 0.1; const gb = this.gb;
    const stone = '#b9b2c9', dark = '#8f86a6';
    const seg = (x0, x1, z0, z1, y0, y1) => { this.addWall(x0, x1, z0, z1, y0, y1); gb.box((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, x1 - x0, y1 - y0, z1 - z0, stone); };
    const x0 = p.x - S / 2, x1 = p.x + S / 2, z0 = p.z - S / 2, z1 = p.z + S / 2;
    seg(x0, x1, z1 - T, z1, base - 4, base + H); seg(x0, x1, z0, z0 + T, base - 4, base + H);
    seg(x1 - T, x1, z0 + T, z1 - T, base - 4, base + H);
    seg(x0, x0 + T, z0 + T, p.z - 3, base - 4, base + H); seg(x0, x0 + T, p.z + 3, z1 - T, base - 4, base + H);
    this.addWall(x0, x0 + T, p.z - 3, p.z + 3, base + 4.5, base + H); gb.box(x0 + T / 2, base + 5.75, p.z, T, 2.5, 6, stone);
    // créneaux
    for (let u = x0; u < x1; u += 2.4) { gb.box(u + 0.6, base + H + 0.5, z0 + T / 2, 1.2, 1, T, dark); gb.box(u + 0.6, base + H + 0.5, z1 - T / 2, 1.2, 1, T, dark); }
    for (let u = z0; u < z1; u += 2.4) { gb.box(x0 + T / 2, base + H + 0.5, u + 0.6, T, 1, 1.2, dark); gb.box(x1 - T / 2, base + H + 0.5, u + 0.6, T, 1, 1.2, dark); }
    // tours
    for (const [tx, tz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
      gb.addGeo(new THREE.CylinderGeometry(3, 3.3, 13, 10), M4(tx, base + 4.5, tz), stone);
      this.rb.addGeo(new THREE.ConeGeometry(3.8, 5, 10), M4(tx, base + 13.5, tz), '#7b4fd6');
      this.addCircle(tx, tz, 3.2, base + 11);
    }
    // donjon central
    const k = this.addHouse(p.x + 4, p.z, 12, 12, 7.4, 3, R, { two: true });
    void k;
    gb.box(p.x - 6, base + 0.03, p.z, 10, 0.06, 6, '#c9365a'); // tapis rouge
    this.chestSpots.push({ x: p.x - 8, z: p.z + 8 }, { x: p.x - 8, z: p.z - 8 });
    for (let i = 0; i < 6; i++) this.lootSpots.push({ x: p.x - 10 + R() * 8, z: p.z - 10 + R() * 20, out: true });
  },

  buildNature(scene, R) {
    const trees = [], pines = [], rocks = [], bushes = [], cacti = [], lollis = [];
    let tries = 0;
    while ((trees.length + pines.length) < 900 && tries++ < 12000) {
      const a = R() * TAU, d = Math.sqrt(R()) * (this.ISL - 40); const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const h = this.h(x, z); if (h < 2.6 || h > 40) continue;
      if (this.nearPoi(x, z, 4) && this.nearPoi(x, z, 4).type !== 'cabin') continue;
      if (this.inBuilding(x, z) || this.nearWall(x, z, 3)) continue;
      const dens = vnoise(x * 0.013 + 5, z * 0.013 + 11);
      if (dens < 0.5 && R() > 0.12) continue;
      const s = 0.8 + R() * 0.7;
      const B = this.biome(x, z);
      if (B.candy > 0.5) { if (R() < 0.55) cacti.push({ x, y: h, z, s, r: R() * TAU }); else lollis.push({ x, y: h, z, s: s * 1.1, r: R() * TAU }); this.addCircle(x, z, 0.4 * s, h + 3 * s); continue; }
      if (B.swamp > 0.5) { trees.push({ x, y: h, z, s: s * 1.2, swamp: true }); this.addCircle(x, z, 0.45 * s, h + 3.5 * s); continue; }
      if (h > 18 || dens > 0.72 || R() < 0.3) pines.push({ x, y: h, z, s, snow: h > 28 }); else trees.push({ x, y: h, z, s });
      this.addCircle(x, z, 0.45 * s, h + 3.5 * s);
    }
    for (let i = 0; i < 220; i++) {
      const a = R() * TAU, d = Math.sqrt(R()) * (this.ISL - 20); const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const h = this.h(x, z); if (h < 0.5 || this.inBuilding(x, z) || this.nearWall(x, z, 3)) continue;
      const s = 0.8 + R() * 2.2; rocks.push({ x, y: h, z, s, r: R() * 3 });
      this.addCircle(x, z, s * 0.85, h + s * 1.1);
    }
    for (let i = 0; i < 380; i++) {
      const a = R() * TAU, d = Math.sqrt(R()) * (this.ISL - 40); const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const h = this.h(x, z); if (h < 2.6 || h > 30 || this.inBuilding(x, z) || this.nearWall(x, z, 2)) continue;
      bushes.push({ x, y: h, z, s: 0.7 + R() * 0.7 });
    }
    const mk = (geo, list, colorFn, setup, sway, ol) => {
      const mat = Look.mat({}); if (sway) Look.sway(mat, sway); Look.cutaway(mat);
      const m = new THREE.InstancedMesh(geo, mat, list.length);
      const dummy = new THREE.Object3D(); const col = new THREE.Color();
      list.forEach((t, i) => { setup(dummy, t); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); m.setColorAt(i, colorFn(t, col)); });
      m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.frustumCulled = false; m.castShadow = true; scene.add(m);
      if (Look.toon && ol) this.outl.tree.push(Look.addOutline(m, ol));
      return m;
    };
    // feuillus : tronc + boule
    const trunk = new THREE.CylinderGeometry(0.22, 0.32, 2.4, 6); trunk.translate(0, 1.2, 0);
    mk(trunk, trees.concat(pines), (t, c) => c.set('#8a5a3c'), (d, t) => { d.position.set(t.x, t.y, t.z); d.scale.setScalar(t.s); d.rotation.set(0, 0, 0); }, 0, 0.06);
    const ball = new THREE.IcosahedronGeometry(1.7, 0); ball.translate(0, 3.6, 0);
    mk(ball, trees, (t, c) => c.set(t.swamp ? pick(['#3f6b35', '#4a7a3a', '#557a30']) : pick(['#4fbf3f', '#5fd35a', '#3fae4a', '#7ad34a'])), (d, t) => { d.position.set(t.x, t.y, t.z); d.scale.setScalar(t.s); d.rotation.set(0, t.x, 0); }, 0.05, 0.08);
    const cone = new THREE.ConeGeometry(1.6, 4.4, 7); cone.translate(0, 4.2, 0);
    mk(cone, pines, (t, c) => c.set(t.snow ? '#e9f3ff' : pick(['#2f9a5a', '#2a8a52', '#37a862'])), (d, t) => { d.position.set(t.x, t.y, t.z); d.scale.setScalar(t.s); d.rotation.set(0, t.x, 0); }, 0.04, 0.08);
    const rock = new THREE.DodecahedronGeometry(1, 0);
    mk(rock, rocks, (t, c) => c.set(pick(['#a6a2b5', '#9a96a8', '#b5b1c2'])), (d, t) => { d.position.set(t.x, t.y + t.s * 0.3, t.z); d.scale.set(t.s, t.s * 0.8, t.s); d.rotation.set(t.r, t.r * 2, 0); }, 0, 0.06);
    const bush = new THREE.IcosahedronGeometry(1, 0);
    mk(bush, bushes, (t, c) => c.set(pick(['#46b84a', '#3aa845', '#58c95a'])), (d, t) => { d.position.set(t.x, t.y + 0.5 * t.s, t.z); d.scale.set(t.s * 1.3, t.s, t.s * 1.3); d.rotation.set(0, t.x, 0); }, 0, 0.07);
    this.bushes = bushes;
    // désert de bonbons : cactus et sucettes géantes
    const strip = g => { g.deleteAttribute('color'); return g; };
    const cb = new GeoBuilder(); cb.addGeo(new THREE.CylinderGeometry(0.35, 0.4, 3.2, 8), M4(0, 1.6, 0), '#fff'); cb.addGeo(new THREE.CylinderGeometry(0.22, 0.22, 1.2, 7), M4(0.6, 1.6, 0, 0, 0, Math.PI / 2), '#fff'); cb.addGeo(new THREE.CylinderGeometry(0.22, 0.22, 1.1, 7), M4(0.95, 2.1, 0), '#fff'); cb.addGeo(new THREE.CylinderGeometry(0.2, 0.2, 0.9, 7), M4(-0.55, 2.2, 0, 0, 0, Math.PI / 2), '#fff'); cb.addGeo(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 7), M4(-0.85, 2.55, 0), '#fff');
    if (cacti.length) mk(strip(cb.build()), cacti, (t, c) => c.set(pick(['#4fbf6a', '#3fae5a', '#62c97a'])), (d, t) => { d.position.set(t.x, t.y, t.z); d.scale.setScalar(t.s); d.rotation.set(0, t.r, 0); }, 0, 0.06);
    const stick = new THREE.CylinderGeometry(0.08, 0.08, 3, 6); stick.translate(0, 1.5, 0);
    if (lollis.length) {
      mk(stick, lollis, (t, c) => c.set('#ffffff'), (d, t) => { d.position.set(t.x, t.y, t.z); d.scale.setScalar(t.s); d.rotation.set(0, t.r, 0); }, 0, 0.04);
      const candy = new THREE.CylinderGeometry(1.1, 1.1, 0.3, 16); candy.rotateX(Math.PI / 2); candy.translate(0, 3.6, 0);
      mk(candy, lollis, (t, c) => c.set(pick(['#ff5c9a', '#7ad1ff', '#ffcf3f', '#b58cff', '#5fe0a0'])), (d, t) => { d.position.set(t.x, t.y, t.z); d.scale.setScalar(t.s); d.rotation.set(0, t.r, 0); }, 0, 0.07);
    }
  },
  nearWall(x, z, pad) {
    const c = this.cell(x, z); if (!c) return false;
    for (const w of c.walls) if (!w.dead && x > w.x0 - pad && x < w.x1 + pad && z > w.z0 - pad && z < w.z1 + pad) return true;
    return false;
  },
  buildSky(scene, R) {
    this.sky = Look.sky(scene);
    // nuages
    const cg = new THREE.IcosahedronGeometry(1, 0); const n = 140;
    const clouds = new THREE.InstancedMesh(cg, new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, transparent: true, opacity: 0.92 }), n);
    const d = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      const g = Math.floor(i / 5); const gr = mulberry32(g * 77 + 3);
      const a = gr() * TAU, r = 200 + gr() * 650; const cx = Math.cos(a) * r, cz = Math.sin(a) * r, cy = 190 + gr() * 80;
      d.position.set(cx + (R() - 0.5) * 40, cy + (R() - 0.5) * 6, cz + (R() - 0.5) * 20);
      d.scale.set(12 + R() * 14, 7 + R() * 6, 10 + R() * 10); d.rotation.set(R(), R(), R()); d.updateMatrix(); clouds.setMatrixAt(i, d.matrix);
    }
    clouds.frustumCulled = false; scene.add(clouds); this.clouds = clouds;
  },
  buildMinimap() {
    const S = 512; const cv = document.createElement('canvas'); cv.width = cv.height = S;
    const ctx = cv.getContext('2d'); const img = ctx.createImageData(S, S); const c = new THREE.Color();
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const x = (i / S - 0.5) * this.SIZE, z = (j / S - 0.5) * this.SIZE; const h = this.h(x, z);
      if (h < 0.2) c.set(h < -3 ? '#2a9fd0' : '#4fd0ef'); else { this.groundColor(x, z, h, c); const sh = (this.h(x + 3, z + 3) - h) * 0.04; c.offsetHSL(0, 0, -sh); }
      const k = (j * S + i) * 4; img.data[k] = c.r * 255; img.data[k + 1] = c.g * 255; img.data[k + 2] = c.b * 255; img.data[k + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const sc = S / this.SIZE;
    ctx.fillStyle = '#5a4f6e';
    for (const b of this.buildings) ctx.fillRect((b.x0 + this.SIZE / 2) * sc, (b.z0 + this.SIZE / 2) * sc, (b.x1 - b.x0) * sc, (b.z1 - b.z0) * sc);
    this.mapCanvas = cv;
  },
};

function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az; const L2 = dx * dx + dz * dz;
  let t = L2 ? ((px - ax) * dx + (pz - az) * dz) / L2 : 0; t = clamp(t, 0, 1);
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}
