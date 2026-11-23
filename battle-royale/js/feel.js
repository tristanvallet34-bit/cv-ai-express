// ============ TOON ROYALE — sensations : musique dynamique, annonceur, pings, vibrations ============
'use strict';

// ---------- Musique procédurale à intensité variable ----------
const Music = {
  on: false, theme: 'lobby', intensity: 0.2, target: 0.2, step: 0, nextT: 0, timer: null, gain: null, bar: 0,
  BPM: { lobby: 100, game: 116 },
  CHORDS: { lobby: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], game: [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]] },
  hz: n => 440 * Math.pow(2, (n - 69) / 12),
  start(theme) {
    Sfx.init(); if (!Sfx.ctx) return;
    this.theme = theme || 'lobby';
    if (!this.gain) { this.gain = Sfx.ctx.createGain(); this.gain.connect(Sfx.master); }
    this.gain.gain.value = Settings.music ? 0.32 : 0;
    if (this.on) return;
    this.on = true; this.step = 0; this.nextT = Sfx.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.tick(), 25);
  },
  stop() { this.on = false; clearInterval(this.timer); this.timer = null; },
  setEnabled(v) { if (this.gain) this.gain.gain.value = v ? 0.32 : 0; },
  tick() {
    const ctx = Sfx.ctx; if (!ctx || !this.on) return;
    this.intensity = lerp(this.intensity, this.target, 0.02);
    const spb = 60 / this.BPM[this.theme] / 4; // double-croches
    while (this.nextT < ctx.currentTime + 0.12) { this.play(this.step, this.nextT, spb); this.nextT += spb; this.step = (this.step + 1) % 64; }
  },
  osc(freq, t, dur, type, vol, slide) {
    const ctx = Sfx.ctx; const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.gain); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(t, dur, freq, vol, type) {
    const ctx = Sfx.ctx; const s = ctx.createBufferSource(); s.buffer = Sfx.noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type || 'highpass'; f.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.gain); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  play(step, t, spb) {
    const I = this.intensity, s16 = step % 16, chord = this.CHORDS[this.theme][Math.floor(step / 16) % 4];
    const lobby = this.theme === 'lobby';
    // nappe
    if (s16 === 0) for (const n of chord) this.osc(this.hz(n), t, spb * 15, 'triangle', lobby ? 0.035 : 0.025);
    // basse
    if (s16 % 4 === 0 || (I > 0.55 && s16 % 4 === 3)) this.osc(this.hz(chord[0] - 24), t, spb * 2.5, 'square', 0.05 + I * 0.03);
    // batterie
    if (!lobby || I > 0.1) {
      if (s16 % 4 === 0 && I > 0.25) this.osc(140, t, 0.25, 'sine', 0.35 * Math.min(1, I + 0.3), 40);
      if ((s16 === 4 || s16 === 12) && I > 0.5) this.noise(t, 0.16, 1800, 0.22, 'bandpass');
      if (s16 % 2 === 1 && I > 0.35) this.noise(t, 0.04, 7000, 0.06 + I * 0.05);
      if (I > 0.8 && s16 % 2 === 0) this.noise(t, 0.03, 9000, 0.05);
    } else if (s16 % 8 === 0) this.noise(t, 0.05, 6000, 0.03);
    // arpège
    if (lobby ? s16 % 2 === 0 : (I > 0.45 && s16 % 2 === 0)) { const n = chord[(s16 / 2) % 3] + 12 + ((step >> 4) % 2 ? 12 : 0); this.osc(this.hz(n), t, spb * 1.6, 'triangle', lobby ? 0.03 : 0.025 + I * 0.02); }
    // lead tendu en fin de partie
    if (I > 0.78 && (s16 === 0 || s16 === 6 || s16 === 10)) this.osc(this.hz(chord[2] + 24), t, spb * 3, 'sawtooth', 0.018);
  },
};

// ---------- Annonceur (texte + voix) ----------
const Announcer = {
  streak: 0, lastKill: -99, firstBlood: false,
  reset() { this.streak = 0; this.lastKill = -99; this.firstBlood = false; },
  say(text, cls) {
    const el = $('streak'); el.innerHTML = text; el.className = ''; void el.offsetWidth; el.className = 'show ' + (cls || '');
    clearTimeout(this._t); this._t = setTimeout(() => el.className = '', 2300);
    if (Settings.announcer && 'speechSynthesis' in window) {
      try { const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, '')); u.lang = 'fr-FR'; u.rate = 1.12; u.pitch = 1.25; u.volume = Settings.vol; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { }
    }
  },
  onPlayerKill(total) {
    const now = Game.time;
    this.streak = now - this.lastKill < 9 ? this.streak + 1 : 1; this.lastKill = now;
    if (!this.firstBlood && Game.fighters.filter(f => !f.alive).length <= 2) { this.firstBlood = true; this.say('Premier sang !', 'red'); return; }
    const names = { 2: 'Doublé !', 3: 'Triplé !', 4: 'Quadruplé !', 5: 'Inarrêtable !', 6: 'Carnage toon !' };
    if (this.streak >= 2) { this.say(names[Math.min(6, this.streak)], 'gold'); Haptic.play('streak'); return; }
    if (total === 5) this.say('En feu !', 'red'); else if (total === 10) this.say('Légende de l\'île !', 'gold'); else if (total === 15) this.say('Dieu du cartoon !', 'gold');
  },
  onAlive(n) {
    if (n === 10) this.say('Top 10 !'); else if (n === 2 && Game.mode.team === 1) this.say('Duel final !', 'red');
  },
};

// ---------- Vibrations ----------
const Haptic = {
  P: { hit: [12], head: [10, 30, 18], kill: [30, 40, 70], shield: [40, 25, 40], hurt: [45], knock: [200, 80, 200], land: [25], streak: [20, 30, 20, 30, 60], ping: [10], gag: [35, 20, 35] },
  play(k) {
    if (!Settings.vibration) return;
    try {
      const H = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics;
      if (H) { const heavy = ['kill', 'knock', 'shield', 'streak', 'gag'].includes(k); H.impact({ style: heavy ? 'HEAVY' : k === 'hit' || k === 'ping' ? 'LIGHT' : 'MEDIUM' }); return; }
      if (navigator.vibrate) navigator.vibrate(this.P[k] || 20);
    } catch (e) { }
  },
};

// ---------- Pings ----------
const Pings = {
  list: [], els: [],
  init() { for (let i = 0; i < 4; i++) { const d = document.createElement('div'); d.className = 'pmark'; d.innerHTML = '<i></i><b></b><small></small>'; $('pingLayer').appendChild(d); this.els.push(d); } },
  reset() { this.list = []; for (const e of this.els) e.style.display = 'none'; },
  add(type, pos, f, from) {
    this.list = this.list.filter(p => p.type !== type || p.from !== from);
    this.list.push({ type, pos: pos.clone(), f, t: Game.time, from }); if (this.list.length > 4) this.list.shift();
    Sfx.tone(type === 'enemy' ? 1100 : 880, 0.08, 0.2, 'square'); setTimeout(() => Sfx.tone(type === 'enemy' ? 1400 : 1175, 0.1, 0.2, 'square'), 80);
    Haptic.play('ping');
  },
  // ping du joueur là où vise le réticule
  playerPing() {
    const G = Game, p = G.player; if (!p.alive) return;
    let o = G.camPos, d = G.camDir;
    if (View.arcade()) { o = _v2.set(p.pos.x, p.pos.y + 1.4, p.pos.z); d = _v3.set(-Math.sin(p.yaw), -0.05, -Math.cos(p.yaw)).normalize(); }
    if (G.aimTarget) { this.add('enemy', G.aimTarget.pos, G.aimTarget, p); HUD.message('📍 Ennemi signalé', 1.2); G.onPing('enemy', G.aimTarget.pos, G.aimTarget); return; }
    let t = World.ray(o.x, o.y, o.z, d.x, d.y, d.z, 300);
    const hit = o.clone().addScaledVector(d, Math.min(t, 300)); if (t >= 300) hit.y = World.h(hit.x, hit.z);
    let near = null, nd = 3.5 * 3.5;
    for (const it of G.loot) if (!it.taken) { const dd = dist2(it.pos.x, it.pos.z, hit.x, hit.z); if (dd < nd) { nd = dd; near = it; } }
    if (near) { this.add('loot', near.pos, null, p); G.onPing('loot', near.pos, near); HUD.message('📍 Objet signalé', 1.2); }
    else { this.add('go', hit, null, p); G.onPing('go', hit, null); HUD.message('📍 On va là !', 1.2); }
  },
  update() {
    const G = Game; const W = View.w, H = View.h;
    this.list = this.list.filter(p => G.time - p.t < (p.type === 'enemy' ? 6 : 14) && (!p.f || p.f.alive));
    this.els.forEach((el, i) => {
      const p = this.list[i]; if (!p) { el.style.display = 'none'; return; }
      if (p.f) p.pos.copy(p.f.pos);
      const w = _v1.set(p.pos.x, p.pos.y + 2.4, p.pos.z);
      const v = w.clone().project(G.camera); let x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H;
      if (v.z > 1) { x = W - x; y = H - 40; }
      x = clamp(x, 30, W - 30); y = clamp(y, 40, H - 60);
      el.style.display = 'flex'; el.style.transform = `translate(${x}px,${y}px) translate(-50%,-100%)`;
      el.className = 'pmark ' + p.type + (p.from && !p.from.isPlayer ? ' mate' : '');
      el.querySelector('b').textContent = p.type === 'enemy' ? 'Ennemi' : p.type === 'loot' ? 'Objet' : 'Ici';
      el.querySelector('small').textContent = Math.round(Math.hypot(p.pos.x - G.player.pos.x, p.pos.z - G.player.pos.z)) + ' m';
    });
  },
};
