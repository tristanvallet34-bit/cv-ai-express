// ============ TOON ROYALE — intelligence des bots ============
'use strict';

class BotAI {
  constructor(f) {
    this.f = f; this.thinkT = Math.random() * 0.4; this.target = null; this.spotT = 0; this.engageT = 0;
    this.goal = null; this.path = []; this.goalKind = null; this.goalRef = null;
    this.stuckT = 0; this.stuckN = 0; this.lastX = 0; this.lastZ = 0; this.checkT = 0; this.unstickT = 0; this.unstickDir = 0;
    this.strafe = Math.random() < 0.5 ? 1 : -1; this.strafeT = 0; this.jumpT = 0.5; this.landing = null;
    this.healCD = 0; this.investigate = null; this.safe = null; this.safePhase = -1; this.wanderT = 0;
    this.personality = { greed: rand(0.3, 1), courage: rand(0.3, 1) };
  }
  onHit(att) {
    if (!att || att.team === this.f.team) return;
    if (!this.target || !this.target.alive || Math.random() < 0.5) { if (this.target !== att) this.spotT = Game.botLevel.react * 0.6; this.target = att; }
  }
  setGoal(x, z, kind, ref) {
    if (this.goal && this.goalKind === kind && this.goalRef === ref && Math.abs(this.goal.x - x) < 1 && Math.abs(this.goal.z - z) < 1) return;
    this.goal = { x, z }; this.goalKind = kind; this.goalRef = ref; this.path = [];
    const f = this.f;
    const bIn = World.inBuilding(f.pos.x, f.pos.z), bG = World.inBuilding(x, z);
    if (bIn && bIn !== bG && bIn.doorIn) this.path.push(bIn.doorIn, bIn.doorOut);
    if (bG && bG !== bIn && bG.doorOut) this.path.push(bG.doorOut, bG.doorIn);
    this.path.push(this.goal);
  }
  pickLanding() {
    const r = Math.random();
    if (r < 0.65) { const s = pick(World.lootSpots); return { x: s.x + rand(-6, 6), z: s.z + rand(-6, 6) }; }
    const p = pick(World.pois); return { x: p.x + rand(-p.r, p.r) * 0.6, z: p.z + rand(-p.r, p.r) * 0.6 };
  }
  bestWeapon(dist) {
    const f = this.f; let best = -1, bs = -1;
    f.slots.forEach((s, i) => {
      if (!s || s.kind !== 'weapon') return; const W = WEAPONS[s.w];
      if (W.grapple || (s.mag <= 0 && f.ammo[W.ammo] <= 0)) return;
      let sc = f.weaponScore(s) * 0.01 + 1;
      if (dist <= W.botRange * 1.4 && dist >= (s.w === 'sniper' ? 40 : 0)) sc += 10 - Math.abs(dist - W.botRange * 0.7) * 0.05;
      if (s.w === 'shotgun' && dist < 14) sc += 6;
      if (s.w === 'sniper' && dist < 25) sc -= 8;
      if (s.mag <= 0) sc -= 3;
      if (sc > bs) { bs = sc; best = i; }
    });
    return best;
  }
  needsLoot() {
    const f = this.f; let weapons = 0, heals = 0;
    for (const s of f.slots) { if (!s) continue; if (s.kind === 'weapon') weapons++; else if (!CONS[s.c].throw) heals += s.n; }
    return weapons < 2 || heals < 2 || f.sh < 50 || f.freeSlot() >= 0;
  }
  findLoot(radius) {
    const f = this.f; let best = null, bd = radius * radius;
    const noWeapon = !f.slots.some(s => s && s.kind === 'weapon');
    for (const it of Game.loot) {
      if (it.taken || (it.claim && it.claim !== f && it.claim.alive)) continue;
      const d = dist2(f.pos.x, f.pos.z, it.pos.x, it.pos.z);
      let dd = d;
      if (it.kind === 'gag') { if (f.gag) continue; dd *= 0.8; }
      else if (it.kind === 'weapon') { if (WEAPONS[it.w].grapple || (!noWeapon && !this.wantsWeapon(it))) continue; dd *= noWeapon ? 0.3 : 0.7; }
      else if (it.kind === 'ammo') { if (!f.slots.some(s => s && s.kind === 'weapon' && WEAPONS[s.w].ammo === it.a) || f.ammo[it.a] > 90) continue; }
      else if (it.kind === 'cons') { if (f.freeSlot() < 0 && !f.slots.some(s => s && s.kind === 'cons' && s.c === it.c && s.n < CONS[it.c].stack)) continue; }
      if (dd < bd) { bd = dd; best = it; }
    }
    for (const c of Game.chests) {
      if (c.open) continue; const d = dist2(f.pos.x, f.pos.z, c.pos.x, c.pos.z) * 0.6;
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }
  wantsWeapon(it) {
    const f = this.f; if (f.freeSlot() >= 0 && f.slots.filter(s => s && s.kind === 'weapon').length < 3) return true;
    const sc = f.weaponScore(it); let worst = Infinity;
    for (const s of f.slots) if (s && s.kind === 'weapon') worst = Math.min(worst, f.weaponScore(s));
    return sc > worst * 1.15;
  }
  think() {
    const f = this.f, G = Game, L = G.botLevel;
    // ---- détection des ennemis ----
    if (this.target && (!this.target.alive || dist2(f.pos.x, f.pos.z, this.target.pos.x, this.target.pos.z) > (L.sight * 1.6) ** 2)) { this.target = null; this.engageT = 0; }
    if (!this.target || Math.random() < 0.15) {
      let best = null, bd = Infinity; const sight = L.sight * (f.weapon && f.weapon.w === 'sniper' ? 1.6 : 1);
      const eye = _v1.set(f.pos.x, f.eyeY, f.pos.z);
      for (const o of G.fighters) {
        if (!o.alive || o.team === f.team || o.state === 'bus') continue;
        const d = dist2(f.pos.x, f.pos.z, o.pos.x, o.pos.z); if (d > sight * sight || d > bd) continue;
        // champ de vision 140°, ou proximité
        const a = Math.atan2(-(o.pos.x - f.pos.x), -(o.pos.z - f.pos.z));
        if (d > 18 * 18 && Math.abs(angDiff(f.yaw, a)) > 1.25) continue;
        // buissons : cachés si accroupis dedans et loin
        if (o.crouch && d > 12 * 12 && G.inBush(o)) continue;
        if (o.boxT > 0 && o.moveAmt < 0.2 && d > 10 * 10) continue;
        if (!World.los(eye, _v2.set(o.pos.x, o.eyeY, o.pos.z))) continue;
        bd = d; best = o;
      }
      if (best && best !== this.target) {
        const take = !this.target || bd < dist2(f.pos.x, f.pos.z, this.target.pos.x, this.target.pos.z) * 0.5;
        if (take) {
          this.target = best; this.spotT = L.react * rand(0.7, 1.3); this.engageT = 0;
          if (f.team === G.playerTeam && G.player.alive && G.time - (this.lastPing || -99) > 10) { this.lastPing = G.time; Pings.add('enemy', best.pos, best, f); HUD.message(f.name + ' : ennemi repéré !', 1.6); }
        }
      }
    }
    // ---- pings du joueur (coéquipier) ----
    if (this.ping && G.time - this.ping.t < 20 && !this.target) {
      const pg = this.ping;
      if (pg.type === 'enemy' && pg.ref && pg.ref.alive) { this.target = pg.ref; this.spotT = L.react; this.ping = null; }
      else if (pg.type === 'loot' && pg.ref && !pg.ref.taken) { this.setGoal(pg.ref.pos.x, pg.ref.pos.z, 'loot', pg.ref); this.ping = null; return; }
      else if (pg.type === 'go') { if (dist2(f.pos.x, f.pos.z, pg.pos.x, pg.pos.z) > 4 * 4) { this.setGoal(pg.pos.x + rand(-2, 2), pg.pos.z + rand(-2, 2), 'pinggo', null); return; } this.ping = null; }
    }
    if (this.goalKind === 'pinggo' && this.path.length) return;
    // ---- objectifs ----
    const st = G.storm;
    if (this.safePhase !== st.phase) { this.safePhase = st.phase; const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * st.nr * 0.6; this.safe = { x: st.nx + Math.cos(a) * r, z: st.nz + Math.sin(a) * r }; }
    const outCur = dist2(f.pos.x, f.pos.z, st.cx, st.cz) > (st.r - 8) ** 2;
    const outNext = dist2(f.pos.x, f.pos.z, st.nx, st.nz) > (st.nr - 5) ** 2;
    const stormUrgent = outCur || (outNext && (st.shrinking || st.timer < 25 || G.time - G.matchStart > 60 * 5));
    this.healCD -= 0.3;
    const lowHp = f.hp < 60 || f.sh < 25;
    const mate = G.duoMateOf(f);
    if (mate && mate.alive && mate.knocked && (!this.target || dist2(f.pos.x, f.pos.z, this.target.pos.x, this.target.pos.z) > 35 * 35 || Math.random() < 0.4)) {
      this.target = null; this.setGoal(mate.pos.x, mate.pos.z, 'revive', mate); return;
    }
    if (this.target && !stormUrgent) { this.goalKind = 'fight'; return; }
    if (this.target && stormUrgent && Math.random() < 0.5) { this.goalKind = 'fight'; return; }
    if (lowHp && f.hasHeal() && !this.target && !outCur && this.healCD <= 0) { this.goalKind = 'heal'; return; }
    if (stormUrgent) { this.setGoal(this.safe.x, this.safe.z, 'storm', null); return; }
    if (this.investigate && G.time - this.investigate.t < 6 && Math.random() < L.aggr * this.personality.courage) {
      this.setGoal(this.investigate.x, this.investigate.z, 'investigate', null); this.investigate = null; return;
    }
    if (this.goalKind === 'loot' && this.goalRef && !this.goalRef.taken && !this.goalRef.open) return;
    if (this.needsLoot() || Math.random() < this.personality.greed * 0.3) {
      const it = this.findLoot(mate && mate.isPlayer ? 22 : 50);
      if (it) { it.claim = f; this.setGoal(it.pos.x, it.pos.z, 'loot', it); return; }
    }
    if (mate && mate.alive && mate.isPlayer) {
      const d = dist2(f.pos.x, f.pos.z, mate.pos.x, mate.pos.z);
      if (d > 10 * 10) { this.setGoal(mate.pos.x + rand(-3, 3), mate.pos.z + rand(-3, 3), 'follow', null); return; }
      this.goal = null; this.goalKind = 'idle'; return;
    }
    if (!this.goal || this.goalKind === 'idle' || this.path.length === 0 || G.time > this.wanderT) {
      this.wanderT = G.time + rand(12, 25);
      if (Math.random() < 0.5) { const s = pick(World.lootSpots); if (dist2(s.x, s.z, st.nx, st.nz) < st.nr * st.nr) { this.setGoal(s.x, s.z, 'wander', null); return; } }
      this.setGoal(this.safe.x + rand(-20, 20), this.safe.z + rand(-20, 20), 'wander', null);
    }
  }
  update(dt) {
    const f = this.f, G = Game;
    const inp = f.input; inp.dx = 0; inp.dz = 0; inp.speed = 6; inp.jump = false; f.ads = false;
    if (f.state === 'bus') return;
    if (f.state === 'fall' || f.state === 'glide') {
      if (!this.landing) this.landing = this.pickLanding();
      const mate = G.duoMateOf(f);
      if (mate && mate.isPlayer && mate.state !== 'bus') this.landing = { x: mate.pos.x + 4, z: mate.pos.z + 4 };
      const dx = this.landing.x - f.pos.x, dz = this.landing.z - f.pos.z; const d = Math.hypot(dx, dz);
      if (d > 2) { inp.dx = dx / d; inp.dz = dz / d; f.yaw = Math.atan2(-inp.dx, -inp.dz); }
      if (f.state === 'fall' && d < 40 && f.pos.y - World.h(f.pos.x, f.pos.z) < 60) G.deployGlider(f);
      return;
    }
    if (f.state !== 'ground') return;
    if (f.knocked) { // ramper vers le coéquipier / loin de l'agresseur
      f.reviving = null; const mate = G.duoMateOf(f); const th = f.lastHitBy;
      let dx = 0, dz = 0;
      if (mate && mate.alive && !mate.knocked) { dx = mate.pos.x - f.pos.x; dz = mate.pos.z - f.pos.z; }
      else if (th && th.alive) { dx = f.pos.x - th.pos.x; dz = f.pos.z - th.pos.z; }
      const l = Math.hypot(dx, dz); if (l > 2) { inp.dx = dx / l; inp.dz = dz / l; f.yaw = Math.atan2(-inp.dx, -inp.dz); }
      inp.speed = 1.8; return;
    }
    this.thinkT -= dt;
    if (this.thinkT <= 0) { this.thinkT = 0.3 + Math.random() * 0.15; this.think(); }
    // consommation en cours
    if (f.using) { inp.speed = 3; }
    const T = this.target;
    if (this.goalKind === 'fight' && T && T.alive) {
      this.combat(dt, T);
    } else {
      this.engageT = 0;
      if (this.goalKind === 'heal') { this.doHeal(); }
      else if (f.weapon && f.weapon.mag < WEAPONS[f.weapon.w].mag * 0.5 && f.reloadT <= 0) startReload(f);
      this.follow(dt);
    }
    // anti-blocage
    this.checkT += dt;
    if (this.checkT > 1) {
      const moved = Math.hypot(f.pos.x - this.lastX, f.pos.z - this.lastZ);
      const wants = inp.dx !== 0 || inp.dz !== 0;
      if (wants && moved < 0.6) { this.stuckN++; this.unstickT = 0.9; this.unstickDir = (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2; if (this.stuckN > 3) { this.goal = null; this.path = []; this.goalKind = null; this.stuckN = 0; if (this.goalRef) this.goalRef.claim = null; } }
      else if (moved > 2) this.stuckN = 0;
      this.lastX = f.pos.x; this.lastZ = f.pos.z; this.checkT = 0;
    }
    if (this.unstickT > 0) {
      this.unstickT -= dt;
      const a = Math.atan2(inp.dx, inp.dz) + this.unstickDir;
      if (inp.dx !== 0 || inp.dz !== 0) { inp.dx = Math.sin(a); inp.dz = Math.cos(a); }
      if (this.unstickT > 0.7) inp.jump = true;
    }
  }
  follow(dt) {
    const f = this.f, inp = f.input;
    f.reviving = null;
    if (this.goalKind === 'revive' && this.goalRef) {
      const m = this.goalRef;
      if (!m.alive || !m.knocked) { this.goalKind = null; this.goalRef = null; this.path = []; this.thinkT = 0; return; }
      if (dist2(f.pos.x, f.pos.z, m.pos.x, m.pos.z) < 1.8 * 1.8) { f.reviving = m; f.crouch = true; return; }
      this.goal.x = m.pos.x; this.goal.z = m.pos.z; f.crouch = false;
    }
    // ramasser / ouvrir
    if (this.goalKind === 'loot' && this.goalRef) {
      const it = this.goalRef;
      if (it.taken || it.open) { this.goal = null; this.goalKind = null; this.goalRef = null; this.path = []; this.thinkT = 0; }
      else if (dist2(f.pos.x, f.pos.z, it.pos.x, it.pos.z) < 2.4 * 2.4) {
        if (it.isChest) Game.openChest(it, f); else Game.pickup(f, it, true);
        this.goal = null; this.goalKind = null; this.goalRef = null; this.path = []; this.thinkT = 0.1;
      }
    }
    while (this.path.length) {
      const wp = this.path[0];
      const d = dist2(f.pos.x, f.pos.z, wp.x, wp.z);
      if (d < (this.path.length > 1 ? 1.2 : 1.6) ** 2) { this.path.shift(); continue; }
      const dd = Math.sqrt(d); inp.dx = (wp.x - f.pos.x) / dd; inp.dz = (wp.z - f.pos.z) / dd;
      const want = Math.atan2(-inp.dx, -inp.dz);
      f.yaw += clamp(angDiff(f.yaw, want), -Game.botLevel.turn * dt, Game.botLevel.turn * dt);
      f.pitch *= 0.9;
      inp.speed = this.goalKind === 'storm' ? 7.6 : this.goalKind === 'follow' && dd > 20 ? 7.6 : 6;
      break;
    }
    if (!this.path.length && this.goalKind === 'storm') this.goalKind = null;
  }
  doHeal() {
    const f = this.f;
    if (f.using) return;
    const order = f.sh < 50 && f.hp > 50 ? ['shieldB', 'shieldS', 'fizz', 'medkit', 'bandage'] : ['medkit', 'bandage', 'fizz', 'shieldB', 'shieldS'];
    for (const c of order) {
      const i = f.slots.findIndex(s => s && s.kind === 'cons' && s.c === c);
      if (i < 0) continue; const C = CONS[c];
      if (C.hp && f.hp >= C.cap && !C.sh) continue; if (C.sh && f.sh >= C.shcap && !C.hp) continue;
      f.cur = i; Game.useItem(f); this.healCD = 1; return;
    }
    this.goalKind = null; this.healCD = 6;
  }
  combat(dt, T) {
    const f = this.f, inp = f.input, L = Game.botLevel;
    const dx = T.pos.x - f.pos.x, dz = T.pos.z - f.pos.z; const dist = Math.hypot(dx, dz);
    this.engageT += dt; this.spotT -= dt;
    // choix d'arme
    const bi = this.bestWeapon(dist);
    if (bi >= 0 && bi !== f.cur && (f.reloadT <= 0 || !f.weapon) && (f.switchT <= 0 || !f.weapon)) { f.cur = bi; f.switchT = 0.35; f.using = null; f.reloadT = 0; }
    if (bi < 0) { // pas d'arme : fuir / chercher du loot
      const it = this.findLoot(40);
      if (it) { this.setGoal(it.pos.x, it.pos.z, 'loot', it); this.follow(dt); }
      else { inp.dx = -dx / dist; inp.dz = -dz / dist; inp.speed = 7.6; f.yaw = Math.atan2(-inp.dx, -inp.dz); }
      return;
    }
    if (!f.weapon) return;
    Gags.botUse(f, T, dist);
    if (f.boxT > 0 && f.hp + f.sh < 55) { inp.dx = inp.dz = 0; return; }
    // viser
    const want = Math.atan2(-dx, -dz);
    const dy = (T.pos.y + 1.2) - (f.pos.y + 1.4);
    f.yaw += clamp(angDiff(f.yaw, want), -L.turn * dt, L.turn * dt);
    f.pitch = Math.atan2(dy, dist);
    const aimed = Math.abs(angDiff(f.yaw, want)) < 0.25;
    // déplacement : garder la bonne distance + strafe
    const W = WEAPONS[f.weapon.w];
    const ideal = W.botRange * (f.hp < 40 ? 1.4 : 0.8);
    let fwd = 0; if (dist > ideal * 1.25) fwd = 1; else if (dist < ideal * 0.5 && W.pellets === 1) fwd = -0.7;
    this.strafeT -= dt; if (this.strafeT <= 0) { this.strafeT = rand(0.5, 1.6); this.strafe = Math.random() < 0.5 ? 1 : -1; if (Math.random() < 0.15 * L.aggr) inp.jump = true; }
    const nx = dx / dist, nz = dz / dist; const sx = -nz * this.strafe, sz = nx * this.strafe;
    const sm = W.scope ? 0.3 : 0.75;
    inp.dx = nx * fwd + sx * sm; inp.dz = nz * fwd + sz * sm;
    const l = Math.hypot(inp.dx, inp.dz); if (l > 0) { inp.dx /= l; inp.dz /= l; }
    inp.speed = fwd > 0 ? 6.5 : 5;
    f.crouch = W.scope && dist > 60 && Math.random() < 0.02 ? !f.crouch : (W.scope ? f.crouch : false);
    // retraite pour se soigner
    if ((f.hp + f.sh) < 45 && f.hasHeal() && Math.random() < 0.01 + (1 - this.personality.courage) * 0.02) { this.target = null; this.goalKind = 'heal'; return; }
    if (f.weapon.mag <= 0) { startReload(f); return; }
    if (this.spotT <= 0 && aimed && dist < W.range) { f.ads = true; botShoot(f, T, dist); }
  }
}
