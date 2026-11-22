// ============ TOON ROYALE — interface en jeu ============
'use strict';

const $ = id => document.getElementById(id);
const HUD = {
  dmgPool: [], dmgI: 0, feedEl: null, lastInv: '', mmT: 0, indicators: [], marker: null, bigOpen: false,
  init() {
    this.feedEl = $('feed');
    for (let i = 0; i < 14; i++) { const d = document.createElement('div'); d.className = 'dmgnum'; $('dmgLayer').appendChild(d); this.dmgPool.push({ el: d, life: 0, pos: new THREE.Vector3(), vy: 0 }); }
    for (let i = 0; i < 6; i++) { const d = document.createElement('div'); d.className = 'dmgind'; $('dmgInd').appendChild(d); this.indicators.push({ el: d, life: 0, x: 0, z: 0 }); }
    this.sounds = [];
    for (let i = 0; i < 10; i++) { const d = document.createElement('div'); d.className = 'sndind'; $('dmgInd').appendChild(d); this.sounds.push({ el: d, life: 0, x: 0, z: 0, max: 1 }); }
    this.mm = $('minimap').getContext('2d'); this.cmp = $('compass').getContext('2d');
    // slots
    const hb = $('hotbar'); hb.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const s = document.createElement('div'); s.className = 'slot'; s.dataset.i = i;
      s.innerHTML = '<div class="ico"></div><div class="cnt"></div>';
      s.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Input.pressed['slot' + i] = true; Sfx.click(); });
      hb.appendChild(s);
    }
    $('minimap').addEventListener('pointerdown', e => { e.stopPropagation(); this.toggleBig(true); });
    $('bigmap').addEventListener('pointerdown', e => {
      e.stopPropagation(); const r = $('bigmapCv').getBoundingClientRect();
      if (e.target.id === 'bigmapCv') {
        const x = ((e.clientX - r.left) / r.width - 0.5) * World.SIZE, z = ((e.clientY - r.top) / r.height - 0.5) * World.SIZE;
        this.marker = this.marker && Math.hypot(this.marker.x - x, this.marker.z - z) < 20 ? null : { x, z }; Sfx.click(); this.drawBig();
      } else this.toggleBig(false);
    });
  },
  toggleBig(on) { this.bigOpen = on; $('bigmap').hidden = !on; if (on) this.drawBig(); },
  reset() {
    this.feedEl.innerHTML = ''; this.lastInv = ''; this.marker = null; this.toggleBig(false);
    for (const d of this.dmgPool) { d.life = 0; d.el.style.opacity = 0; }
    for (const d of this.sounds) { d.life = 0; d.el.style.opacity = 0; }
    for (const d of this.indicators) { d.life = 0; d.el.style.opacity = 0; }
    $('killBanner').classList.remove('show'); $('centerMsg').classList.remove('show');
  },
  feed(html) {
    const d = document.createElement('div'); d.className = 'fl'; d.innerHTML = html; this.feedEl.prepend(d);
    while (this.feedEl.children.length > 5) this.feedEl.lastChild.remove();
    setTimeout(() => d.classList.add('out'), 5000); setTimeout(() => d.remove(), 5600);
  },
  message(txt, dur, cls) {
    const el = $('centerMsg'); el.innerHTML = txt; el.className = 'show ' + (cls || '');
    clearTimeout(this._mt); this._mt = setTimeout(() => el.classList.remove('show'), (dur || 3) * 1000);
  },
  killBanner(name, n) {
    const el = $('killBanner'); el.innerHTML = `<span>ÉLIMINÉ</span> ${name}<em>${n} élim.</em>`; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(this._kb); this._kb = setTimeout(() => el.classList.remove('show'), 2200);
  },
  hitmarker(head, kill) {
    const el = $('hitmark'); el.className = ''; void el.offsetWidth; el.className = 'on' + (head ? ' head' : '') + (kill ? ' kill' : '');
  },
  dmgNumber(pos, dmg, head, shield) {
    const d = this.dmgPool[this.dmgI++ % this.dmgPool.length];
    d.pos.copy(pos); d.pos.x += (Math.random() - 0.5) * 0.6; d.life = 0.9; d.vy = 1.6;
    d.el.textContent = dmg; d.el.className = 'dmgnum' + (head ? ' head' : '') + (shield ? ' sh' : '');
  },
  soundAt(p, kind) {
    const me = Game.player; if (!me || !me.alive) return;
    let d = this.sounds.find(s => s.life > 0 && s.kind === kind && Math.hypot(s.x - p.x, s.z - p.z) < 6) || this.sounds.find(s => s.life <= 0) || this.sounds[0];
    d.x = p.x; d.z = p.z; d.kind = kind; d.max = d.life = kind === 'shot' ? 1.3 : 0.7; d.el.className = 'sndind ' + kind;
  },
  damageFrom(p) { const d = this.indicators.find(i => i.life <= 0) || this.indicators[0]; d.life = 1.2; d.x = p.x; d.z = p.z; },
  slotHTML(s) {
    if (!s) return ['', ''];
    if (s.kind === 'weapon') return [`<span style="color:${RARITY[s.rar].c}">${weaponIcon(s.w)}</span>`, s.mag];
    const C = CONS[s.c]; return [`<b style="color:${C.c}">${C.icon}</b>`, '×' + s.n];
  },
  update(dt) {
    const G = Game, p = G.player; if (!p) return;
    const v = G.spectating || p;
    // barres
    $('hpFill').style.width = Math.max(0, v.hp) + '%'; $('hpTxt').textContent = Math.ceil(Math.max(0, v.hp));
    $('shFill').style.width = v.sh + '%'; $('shTxt').textContent = Math.ceil(v.sh);
    $('alive').textContent = G.aliveCount(); $('kills').textContent = p.kills;
    // tempête
    const st = G.storm; const t = Math.max(0, Math.ceil(st.timer));
    $('stormTxt').textContent = (st.phase >= STORM_PHASES.length ? 'FIN' : (st.shrinking ? '▼ ' : '⏱ ') + Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'));
    $('stormTxt').classList.toggle('warn', st.shrinking);
    // inventaire
    const inv = p.slots.map(s => s ? s.kind + (s.w || s.c) + (s.rar || '') + (s.mag != null ? s.mag : '') + (s.n || '') : '-').join('|') + p.cur;
    if (inv !== this.lastInv) {
      this.lastInv = inv;
      document.querySelectorAll('#hotbar .slot').forEach((el, i) => {
        const s = p.slots[i]; const [ico, cnt] = this.slotHTML(s);
        el.querySelector('.ico').innerHTML = ico; el.querySelector('.cnt').textContent = cnt;
        el.classList.toggle('sel', i === p.cur); el.style.borderColor = s && s.kind === 'weapon' ? RARITY[s.rar].c : '';
      });
      const w = p.weapon, it = p.item;
      $('wName').textContent = w ? WEAPONS[w.w].n : it ? CONS[it.c].n : 'Mains nues';
      $('wName').style.color = w ? RARITY[w.rar].c : '#fff';
      $('fireBtn').classList.toggle('use', !!(it && it.kind === 'cons'));
      $('fireBtnL').classList.toggle('use', !!(it && it.kind === 'cons'));
    }
    const w = p.weapon;
    $('ammo').innerHTML = w ? `<b>${w.mag}</b> / ${p.ammo[WEAPONS[w.w].ammo]}` : (p.item ? '' : '—');
    // rechargement / soin
    const pr = $('progress');
    if (p.knocked) { pr.hidden = false; pr.style.setProperty('--p', p.reviveT > 0 ? p.reviveT / 4 : p.bleed / 100); $('progTxt').textContent = p.reviveT > 0 ? 'On te réanime…' : 'À terre — réanimation possible'; pr.classList.toggle('bad', p.reviveT <= 0); }
    else if (p.reviving) { pr.hidden = false; pr.classList.remove('bad'); pr.style.setProperty('--p', p.reviving.reviveT / 4); $('progTxt').textContent = 'Réanimation…'; }
    else if (p.reloadT > 0 && w) { pr.hidden = false; pr.style.setProperty('--p', 1 - p.reloadT / (WEAPONS[w.w].reload * (1 - RARITY[w.rar].r))); $('progTxt').textContent = 'Rechargement'; }
    else if (p.using) { pr.hidden = false; pr.style.setProperty('--p', 1 - p.useT / CONS[p.using].time); $('progTxt').textContent = CONS[p.using].n; }
    else if (G.chestHold > 0) { pr.hidden = false; pr.style.setProperty('--p', G.chestHold / 0.7); $('progTxt').textContent = 'Ouverture…'; }
    else pr.hidden = true;
    if (!p.knocked) pr.classList.remove('bad');
    document.body.classList.toggle('lowhp', p.alive && (p.hp < 30 || p.knocked));
    document.body.classList.toggle('knocked', p.alive && p.knocked);
    for (const d of this.sounds) {
      if (d.life <= 0) continue; d.life -= dt;
      const a = Math.atan2(-(d.x - p.pos.x), -(d.z - p.pos.z)); const rel = angDiff(G.camYaw, a);
      d.el.style.transform = `translate(-50%,-50%) rotate(${-rel}rad) translateY(-150px)`; d.el.style.opacity = Math.min(1, d.life / d.max * 1.6);
    }
    // réticule
    const spread = w ? (p.ads ? WEAPONS[w.w].ads : WEAPONS[w.w].spread) * (p.moveAmt > 0.3 ? 1.45 : 1) + p.spread : 0.03;
    const gap = 6 + spread * 420;
    $('xhair').style.setProperty('--g', gap.toFixed(1) + 'px');
    $('xhair').classList.toggle('target', G.aimTarget != null);
    const scoped = p.ads && w && WEAPONS[w.w].scope && p.alive && !p.kart;
    $('scope').hidden = !scoped; $('xhair').hidden = scoped || !p.alive;
    // vignette tempête
    $('stormVig').classList.toggle('on', v.inStorm && v.alive);
    // nombres de dégâts
    for (const d of this.dmgPool) {
      if (d.life <= 0) continue; d.life -= dt; d.pos.y += d.vy * dt;
      const s = G.project(d.pos);
      if (!s) { d.el.style.opacity = 0; continue; }
      d.el.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-50%) scale(${0.8 + d.life * 0.4})`; d.el.style.opacity = Math.min(1, d.life * 2);
    }
    // indicateurs de dégâts
    for (const d of this.indicators) {
      if (d.life <= 0) continue; d.life -= dt;
      const a = Math.atan2(-(d.x - p.pos.x), -(d.z - p.pos.z)); const rel = angDiff(G.camYaw, a);
      d.el.style.transform = `translate(-50%,-50%) rotate(${-rel}rad) translateY(-110px)`; d.el.style.opacity = Math.min(1, d.life * 1.5);
    }
    // prompt d'interaction
    const ia = G.interactable;
    $('interactBtn').hidden = !ia; if (ia) $('interactBtn').innerHTML = ia.label;
    // boutons contextuels
    const inBus = p.state === 'bus', falling = p.state === 'fall' || p.state === 'glide';
    $('jumpBus').hidden = !inBus || !p.alive || !G.busPos || Math.hypot(G.busPos.x, G.busPos.z) > World.ISL - 30; $('glideBtn').hidden = p.state !== 'fall';
    document.body.classList.toggle('air', inBus || falling);
    document.body.classList.toggle('driving', !!p.kart);
    document.body.classList.toggle('dead', !p.alive);
    $('exitKart').hidden = !p.kart;
    this.mmT -= dt; if (this.mmT <= 0) { this.mmT = 0.08; this.drawMini(); this.drawCompass(); if (this.bigOpen) this.drawBig(); }
    $('fps').hidden = !Settings.showFps;
  },
  w2m(x, z, cx, cz, scale, S) { return [S / 2 + (x - cx) * scale, S / 2 + (z - cz) * scale]; },
  drawMini() {
    const G = Game, p = G.spectating || G.player, ctx = this.mm, S = ctx.canvas.width;
    const scale = (S / 220) * Settings.minimapZoom; const cx = p.pos.x, cz = p.pos.z;
    ctx.save(); ctx.clearRect(0, 0, S, S);
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 2, 0, TAU); ctx.clip();
    ctx.fillStyle = '#2a9fd0'; ctx.fillRect(0, 0, S, S);
    const ms = World.mapCanvas.width / World.SIZE;
    const half = S / 2 / scale;
    ctx.drawImage(World.mapCanvas, (cx - half + World.SIZE / 2) * ms, (cz - half + World.SIZE / 2) * ms, half * 2 * ms, half * 2 * ms, 0, 0, S, S);
    this.drawStorm(ctx, cx, cz, scale, S);
    // bus
    if (G.bus && G.bus.active) { const [a, b] = this.w2m(G.bus.sx, G.bus.sz, cx, cz, scale, S), [c, d] = this.w2m(G.bus.ex, G.bus.ez, cx, cz, scale, S); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); ctx.setLineDash([]); }
    // ravitaillements
    for (const s of G.supplies) if (!s.open) { const [x, y] = this.w2m(s.pos.x, s.pos.z, cx, cz, scale, S); ctx.fillStyle = '#3e6bd6'; ctx.strokeStyle = '#ffcf3f'; ctx.lineWidth = 2; ctx.fillRect(x - 5, y - 5, 10, 10); ctx.strokeRect(x - 5, y - 5, 10, 10); }
    // sons de tirs
    for (const n of G.shotMarks) { const age = G.time - n.t; if (age > 1.5) continue; const [x, y] = this.w2m(n.x, n.z, cx, cz, scale, S); ctx.fillStyle = `rgba(255,70,70,${1 - age / 1.5})`; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); }
    // coéquipier
    const mate = G.duoMateOf(G.player);
    if (mate && mate.alive) { const [x, y] = this.w2m(mate.pos.x, mate.pos.z, cx, cz, scale, S); ctx.fillStyle = '#2ee6c8'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); ctx.stroke(); }
    if (this.marker) { const [x, y] = this.w2m(this.marker.x, this.marker.z, cx, cz, scale, S); ctx.fillStyle = '#ffcf3f'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y - 12); ctx.lineTo(x + 6, y - 12); ctx.fill(); }
    ctx.restore();
    // joueur (flèche)
    ctx.save(); ctx.translate(S / 2, S / 2); ctx.rotate(-G.camYaw);
    ctx.fillStyle = '#ffcf3f'; ctx.strokeStyle = '#2b1e5c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6, 7); ctx.lineTo(0, 3); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 2, 0, TAU); ctx.stroke();
  },
  drawStorm(ctx, cx, cz, scale, S) {
    const st = Game.storm;
    const [x, y] = this.w2m(st.cx, st.cz, cx, cz, scale, S);
    ctx.save();
    ctx.fillStyle = 'rgba(123,47,247,.38)'; ctx.beginPath(); ctx.rect(-10, -10, S + 20, S + 20); ctx.arc(x, y, Math.max(0, st.r * scale), 0, TAU, true); ctx.fill();
    ctx.strokeStyle = '#d9b8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, Math.max(0, st.r * scale), 0, TAU); ctx.stroke();
    if (st.phase < STORM_PHASES.length) { const [a, b] = this.w2m(st.nx, st.nz, cx, cz, scale, S); ctx.strokeStyle = '#ffffff'; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(a, b, Math.max(0, st.nr * scale), 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    // ligne vers la zone sûre
    const p = Game.spectating || Game.player;
    if (dist2(p.pos.x, p.pos.z, st.nx, st.nz) > st.nr * st.nr) { const [a, b] = this.w2m(st.nx, st.nz, cx, cz, scale, S); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(S / 2, S / 2); ctx.lineTo(a, b); ctx.stroke(); }
    ctx.restore();
  },
  drawBig() {
    const cv = $('bigmapCv'), ctx = cv.getContext('2d'), S = cv.width, G = Game;
    ctx.drawImage(World.mapCanvas, 0, 0, S, S);
    const sc = S / World.SIZE;
    this.drawStorm(ctx, 0, 0, sc, S);
    ctx.font = 'bold 15px Nunito, sans-serif'; ctx.textAlign = 'center';
    for (const p of World.pois) { const [x, y] = this.w2m(p.x, p.z, 0, 0, sc, S); ctx.lineWidth = 4; ctx.strokeStyle = '#2b1e5c'; ctx.strokeText(p.n.toUpperCase(), x, y); ctx.fillStyle = '#fff'; ctx.fillText(p.n.toUpperCase(), x, y); }
    if (G.bus && G.bus.active) { const [a, b] = this.w2m(G.bus.sx, G.bus.sz, 0, 0, sc, S), [c, d] = this.w2m(G.bus.ex, G.bus.ez, 0, 0, sc, S); ctx.strokeStyle = '#fff'; ctx.setLineDash([8, 8]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); ctx.setLineDash([]); }
    for (const s of G.supplies) if (!s.open) { const [x, y] = this.w2m(s.pos.x, s.pos.z, 0, 0, sc, S); ctx.fillStyle = '#3e6bd6'; ctx.fillRect(x - 6, y - 6, 12, 12); }
    const p = G.spectating || G.player; const [px, py] = this.w2m(p.pos.x, p.pos.z, 0, 0, sc, S);
    ctx.save(); ctx.translate(px, py); ctx.rotate(-G.camYaw); ctx.fillStyle = '#ffcf3f'; ctx.strokeStyle = '#2b1e5c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8, 9); ctx.lineTo(0, 4); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    if (this.marker) { const [x, y] = this.w2m(this.marker.x, this.marker.z, 0, 0, sc, S); ctx.fillStyle = '#ffcf3f'; ctx.strokeStyle = '#2b1e5c'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8, y - 16); ctx.lineTo(x + 8, y - 16); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    const mate = G.duoMateOf(G.player); if (mate && mate.alive) { const [x, y] = this.w2m(mate.pos.x, mate.pos.z, 0, 0, sc, S); ctx.fillStyle = '#2ee6c8'; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); }
  },
  drawCompass() {
    const ctx = this.cmp, W = ctx.canvas.width, H = ctx.canvas.height, G = Game;
    ctx.clearRect(0, 0, W, H);
    const deg = ((-G.camYaw * 180 / Math.PI) % 360 + 360) % 360; // 0 = nord (-z)
    const ppd = W / 120;
    ctx.font = 'bold 13px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    const labels = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SO', 270: 'O', 315: 'NO' };
    for (let d = Math.floor(deg - 60); d <= deg + 60; d++) {
      const dd = (d % 360 + 360) % 360; const x = W / 2 + (d - deg) * ppd;
      if (dd % 15 === 0) { ctx.globalAlpha = 1 - Math.abs(d - deg) / 65; if (labels[dd] != null) { ctx.fillStyle = dd === 0 ? '#ffcf3f' : '#fff'; ctx.fillText(labels[dd], x, 15); } else { ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, 6, 2, 8); } }
    }
    ctx.globalAlpha = 1;
    const p = G.spectating || G.player;
    const mark = (x, z, col) => { let a = Math.atan2(x - p.pos.x, -(z - p.pos.z)) * 180 / Math.PI; let rel = ((a - deg + 540) % 360) - 180; if (Math.abs(rel) > 60) rel = Math.sign(rel) * 60; const px = W / 2 + rel * ppd; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(px, H - 2); ctx.lineTo(px - 5, H - 10); ctx.lineTo(px + 5, H - 10); ctx.fill(); };
    if (this.marker) mark(this.marker.x, this.marker.z, '#ffcf3f');
    const st = G.storm; if (dist2(p.pos.x, p.pos.z, st.nx, st.nz) > st.nr * st.nr) mark(st.nx, st.nz, '#ffffff');
    ctx.fillStyle = '#ffcf3f'; ctx.fillRect(W / 2 - 1, 0, 2, 5);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Nunito, sans-serif'; ctx.fillText(Math.round(deg) + '°', W / 2, H - 1);
  },
};

const WEAPON_SVG = {
  pistol: 'M18 6h28v7H30l-2 9h-8l2-9h-4z',
  rocket: 'M4 8h6V6h40l8 3v6l-8 3H10v-2H4zM24 18h6v5h-6z',
  smg: 'M8 7h40v3h8v4H44l-2 3h-6l1 6h-6l-1-6h-8l-2 6h-6l2-6H8z',
  ar: 'M2 8h12l4-2h26v3h16v3H44v3h-6l-1 7h-6l1-7H20l-6 5H4l4-6H2z',
  shotgun: 'M2 9h10l6-2h40v4H40v3H22l-8 6H4l6-6H2z',
  sniper: 'M2 10h12l4-2h12V5h12v3h20v3H42v3h-4l-1 6h-5l1-6H18l-6 5H4l4-5H2z',
  minigun: 'M6 6h30v12H6zM36 7h24v2H36zm0 4h24v2H36zm0 4h24v2H36zM14 18h6v5h-6z',
};
function weaponIcon(w) {
  return `<svg viewBox="0 0 64 24" class="wsvg"><path fill="currentColor" d="${WEAPON_SVG[w] || ''}"/></svg>`;
}

// ---------- confettis de victoire ----------
const Confetti = {
  start() {
    const cv = $('confetti'); cv.hidden = false; const ctx = cv.getContext('2d');
    const W = cv.width = window.innerWidth, H = cv.height = window.innerHeight; const cs = ['#ff4f8b', '#ffcf3f', '#2ee6c8', '#3ea8ff', '#bd63ff', '#ffffff'];
    const P = []; for (let i = 0; i < 180; i++) P.push({ x: Math.random() * W, y: -Math.random() * H * 0.8, vx: (Math.random() - 0.5) * 60, vy: 120 + Math.random() * 160, r: Math.random() * 6, vr: (Math.random() - 0.5) * 8, w: 6 + Math.random() * 6, h: 4 + Math.random() * 6, c: cs[i % cs.length] });
    let last = performance.now(), t = 0;
    const step = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; ctx.clearRect(0, 0, W, H);
      for (const p of P) { p.x += p.vx * dt + Math.sin(t * 3 + p.r) * 30 * dt; p.y += p.vy * dt; p.r += p.vr * dt; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 1.7))); ctx.restore(); }
      if (t < 6) requestAnimationFrame(step); else { cv.hidden = true; }
    };
    requestAnimationFrame(step);
  },
};
