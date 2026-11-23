// ============ TOON ROYALE — utilitaires ============
'use strict';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const dist2 = (ax, az, bx, bz) => { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; };
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hash2(i, j) {
  let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
function vnoise(x, y) {
  const i = Math.floor(x), j = Math.floor(y);
  const fx = x - i, fy = y - j;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(i, j), b = hash2(i + 1, j), c = hash2(i, j + 1), d = hash2(i + 1, j + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm(x, y) {
  return vnoise(x, y) * 0.55 + vnoise(x * 2.1 + 17, y * 2.1 + 9) * 0.3 + vnoise(x * 4.3 + 41, y * 4.3 + 3) * 0.15;
}

// ---------- stockage local (toujours protégé) ----------
const Store = {
  get(k, def) { try { const v = localStorage.getItem('toonroyale_' + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem('toonroyale_' + k, JSON.stringify(v)); } catch (e) { } }
};

// ---------- Constructeur de géométrie fusionnée (1 draw call) ----------
class GeoBuilder {
  constructor() { this.pos = []; this.col = []; }
  _c(hex) { const c = new THREE.Color(hex); return c; }
  tri(a, b, c, color) {
    const col = typeof color === 'object' ? color : this._c(color);
    this.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    for (let i = 0; i < 3; i++) this.col.push(col.r, col.g, col.b);
  }
  quad(a, b, c, d, color) { this.tri(a, b, c, color); this.tri(a, c, d, color); }
  // ajoute une géométrie three.js transformée par une matrice
  addGeo(geo, matrix, color) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const p = g.attributes.position;
    const col = this._c(color);
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.set(p.getX(i), p.getY(i), p.getZ(i));
      if (matrix) v.applyMatrix4(matrix);
      this.pos.push(v.x, v.y, v.z);
      this.col.push(col.r, col.g, col.b);
    }
  }
  box(cx, cy, cz, sx, sy, sz, color, rotY) {
    const m = new THREE.Matrix4();
    m.compose(new THREE.Vector3(cx, cy, cz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY || 0, 0)), new THREE.Vector3(sx, sy, sz));
    this.addGeo(GeoBuilder.unitBox, m, color);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }
}
GeoBuilder.unitBox = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();

const M4 = (x, y, z, rx, ry, rz, sx, sy, sz) => {
  const m = new THREE.Matrix4();
  m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx == null ? 1 : sx, sy == null ? (sx == null ? 1 : sx) : sy, sz == null ? (sx == null ? 1 : sx) : sz));
  return m;
};

// ---------- Audio synthétisé (aucun fichier) ----------
const Sfx = {
  ctx: null, master: null, noiseBuf: null, vol: 0.7, musicOn: true, musicNode: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = this.vol; this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 1.0;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  },
  setVol(v) { this.vol = v; if (this.master) this.master.gain.value = v; },
  noise(dur, freq, vol, type, q) {
    if (!this.ctx || vol < 0.01) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq; f.Q.value = q || 0.7;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  tone(freq, dur, vol, type, slide) {
    if (!this.ctx || vol < 0.01) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  },
  shot(w, d) { // d = distance au joueur
    const att = clamp(1 - d / 220, 0, 1); if (att <= 0) return;
    const s = w.sound; const v = s.vol * att * att;
    this.noise(s.len, s.f * (0.5 + att * 0.5), v);
    this.tone(s.f * 0.18, s.len * 0.8, v * 0.5, 'square', 0.4);
  },
  hit(head) { this.tone(head ? 1500 : 1100, 0.07, 0.25, 'triangle', 1.3); },
  hurt() { this.noise(0.15, 500, 0.35); this.tone(140, 0.15, 0.3, 'sawtooth', 0.6); },
  shieldBreak() { this.tone(1800, 0.25, 0.25, 'triangle', 0.3); this.noise(0.2, 4000, 0.2, 'highpass'); },
  pickup() { this.tone(660, 0.06, 0.2, 'square'); setTimeout(() => this.tone(990, 0.08, 0.2, 'square'), 60); },
  click() { this.tone(520, 0.05, 0.15, 'triangle'); },
  reload() { this.tone(300, 0.05, 0.2, 'square'); setTimeout(() => this.tone(420, 0.06, 0.2, 'square'), 180); },
  heal() { this.tone(523, 0.1, 0.15); setTimeout(() => this.tone(784, 0.15, 0.15), 100); },
  boom(d) { const a = clamp(1 - d / 250, 0, 1); this.noise(0.9, 300, 0.9 * a * a); this.tone(60, 0.6, 0.6 * a, 'sine', 0.5); },
  step() { this.noise(0.05, 300, 0.06); },
  chest() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, 0.15, 'triangle'), i * 70)); },
  kill() { [784, 988, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 0.14, 0.2, 'square'), i * 60)); },
  win() { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 0.2, 'triangle'), i * 140)); },
  rocket(d) { const a = clamp(1 - d / 220, 0, 1); if (a <= 0) return; this.noise(0.5, 900, 0.5 * a * a, 'bandpass', 1.2); this.tone(220, 0.4, 0.25 * a, 'sawtooth', 0.4); },
  bounce() { this.tone(180, 0.35, 0.3, 'sine', 4); this.tone(360, 0.25, 0.15, 'triangle', 3); },
  heart() { this.tone(60, 0.12, 0.35, 'sine', 0.7); setTimeout(() => this.tone(55, 0.12, 0.28, 'sine', 0.7), 160); },
  thunder() { this.noise(1.6, 180, 0.5, 'lowpass'); setTimeout(() => this.noise(1.2, 120, 0.35), 180); },
  wind(v) { this.noise(0.25, 600 + v * 400, 0.04 + v * 0.05, 'bandpass', 0.8); },
  storm() { this.noise(0.6, 200, 0.12, 'bandpass', 2); },
  startMusic() { if (typeof Music !== 'undefined') { if (Music.theme !== 'lobby') Music.stop(); Music.start('lobby'); } },
  _oldMusic() {
    if (!this.ctx || !this.musicOn || this.musicNode) return;
    const notes = [262, 330, 392, 523, 392, 330, 294, 349, 440, 587, 440, 349];
    let i = 0;
    this.musicNode = setInterval(() => {
      if (!this.musicOn) return;
      const f = notes[i % notes.length]; i++;
      this.tone(f, 0.22, 0.05, 'triangle');
      if (i % 4 === 0) this.tone(f / 2, 0.4, 0.05, 'sine');
    }, 230);
  },
  stopMusic() { if (typeof Music !== 'undefined') Music.stop(); }
};

function vibrate(ms) { try { if (Settings.vibration && navigator.vibrate) navigator.vibrate(ms); } catch (e) { } }
