// ============ TOON ROYALE — contrôles : double joystick (vue arcade), visée libre (3e personne), clavier/souris ============
'use strict';

const Input = {
  jx: 0, jy: 0, lookDX: 0, lookDY: 0, fire: false, ads: false, keys: {}, roles: new Map(),
  joy: null, aim: null, ax: 0, ay: 0, aimMag: 0, aiming: false, tapFire: false,
  pressed: {}, held: {}, isTouch: false, locked: false, sprintKey: false, mx: 0, my: 0, mouseIn: false,
  init() {
    this.isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    const layer = document.getElementById('touch');
    const joyEl = document.getElementById('joy'), knob = document.getElementById('joyKnob');
    const aimEl = document.getElementById('aimJoy'), aimKnob = document.getElementById('aimKnob');
    this.joyEl = joyEl; this.knob = knob; this.aimEl = aimEl; this.aimKnob = aimKnob;
    const R = 55;
    layer.addEventListener('pointerdown', e => {
      if (Game.phase === 'lobby') return;
      e.preventDefault();
      const p = View.pt(e), W = View.w;
      const leftSide = Settings.leftHanded ? p.x > W * 0.58 : p.x < W * 0.42;
      if (e.pointerType === 'mouse') {
        if (!View.arcade() && !this.locked && !Game.paused) { try { const q = document.body.requestPointerLock && document.body.requestPointerLock(); if (q && q.catch) q.catch(() => { }); } catch (err) { } }
        return;
      }
      if (leftSide && !this.joy) {
        this.joy = { id: e.pointerId, ox: p.x, oy: p.y }; this.roles.set(e.pointerId, 'move');
        joyEl.style.left = p.x + 'px'; joyEl.style.top = p.y + 'px'; joyEl.classList.add('on'); knob.style.transform = 'translate(-50%,-50%)';
      } else if (View.arcade() && !this.aim) {
        // joystick de visée : pousser pour viser et tirer, toucher brièvement pour un tir rapide
        this.aim = { id: e.pointerId, ox: p.x, oy: p.y, t: performance.now(), max: 0 }; this.roles.set(e.pointerId, 'aim');
        aimEl.style.left = p.x + 'px'; aimEl.style.top = p.y + 'px'; aimEl.classList.add('on'); aimKnob.style.transform = 'translate(-50%,-50%)';
      } else this.roles.set(e.pointerId, { look: true, x: p.x, y: p.y });
      try { layer.setPointerCapture(e.pointerId); } catch (err) { }
    }, { passive: false });
    const stick = (st, el, kn, p) => {
      let dx = p.x - st.ox, dy = p.y - st.oy; const d = Math.hypot(dx, dy);
      if (d > R * 1.6) { st.ox += dx / d * (d - R * 1.6); st.oy += dy / d * (d - R * 1.6); el.style.left = st.ox + 'px'; el.style.top = st.oy + 'px'; dx = p.x - st.ox; dy = p.y - st.oy; }
      const m = Math.min(1, Math.hypot(dx, dy) / R); const a = Math.atan2(dy, dx);
      kn.style.transform = `translate(calc(-50% + ${Math.cos(a) * m * R}px), calc(-50% + ${Math.sin(a) * m * R}px))`;
      return { x: Math.cos(a) * m, y: -Math.sin(a) * m, m };
    };
    const move = e => {
      const r = this.roles.get(e.pointerId); if (!r) return;
      const p = View.pt(e);
      if (r === 'move') { const s = stick(this.joy, joyEl, knob, p); this.jx = s.x; this.jy = s.y; }
      else if (r === 'aim') { const s = stick(this.aim, aimEl, aimKnob, p); this.ax = s.x; this.ay = s.y; this.aimMag = s.m; this.aim.max = Math.max(this.aim.max, s.m); this.aiming = s.m > 0.3; }
      else if (r.look) { this.lookDX += p.x - r.x; this.lookDY += p.y - r.y; r.x = p.x; r.y = p.y; }
    };
    const up = e => {
      const r = this.roles.get(e.pointerId); if (!r) return;
      if (r === 'move') { this.joy = null; this.jx = 0; this.jy = 0; joyEl.classList.remove('on'); }
      if (r === 'aim') { if (this.aim.max < 0.3 && performance.now() - this.aim.t < 280) this.tapFire = true; this.aim = null; this.aiming = false; this.aimMag = 0; aimEl.classList.remove('on'); }
      if (r.btn) this.release(r.btn);
      this.roles.delete(e.pointerId);
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    // boutons
    document.querySelectorAll('[data-btn]').forEach(el => {
      el.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        const b = el.dataset.btn, p = View.pt(e);
        this.roles.set(e.pointerId, { btn: b, look: !View.arcade() && (b === 'fire' || b === 'fireL' || b === 'ads'), x: p.x, y: p.y });
        this.press(b);
        try { el.setPointerCapture(e.pointerId); } catch (err) { }
        el.classList.add('down');
      }, { passive: false });
      const rel = () => el.classList.remove('down');
      el.addEventListener('pointerup', rel); el.addEventListener('pointercancel', rel); el.addEventListener('lostpointercapture', rel);
      el.addEventListener('pointermove', move, { passive: true });
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('gesturestart', e => e.preventDefault());
    // clavier
    window.addEventListener('keydown', e => {
      if (e.target && (e.target.tagName === 'INPUT')) return;
      const k = e.key.toLowerCase(); if (this.keys[k]) return; this.keys[k] = true;
      const map = { ' ': 'jump', 'c': 'crouch', 'control': 'crouch', 'r': 'reload', 'e': 'interact', 'm': 'map', 'h': 'heal', 'f': 'heal', 'g': 'emote', 'v': 'ping', 't': 'gag', 'escape': 'pause', 'tab': 'map' };
      if (map[k]) { e.preventDefault(); this.press(map[k]); }
      if (k >= '1' && k <= '5') this.press('slot' + (+k - 1));
      if (k === 'shift') this.sprintKey = true;
    });
    window.addEventListener('keyup', e => { const k = e.key.toLowerCase(); this.keys[k] = false; if (k === 'e') this.release('interact'); if (k === 'shift') this.sprintKey = false; });
    window.addEventListener('blur', () => { this.keys = {}; this.fire = false; this.ads = false; });
    // souris : visée au curseur en vue arcade, visée verrouillée en 3e personne
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === document.body; });
    window.addEventListener('mousemove', e => { const p = View.pt(e); this.mx = p.x; this.my = p.y; this.mouseIn = true; if (this.locked) { this.lookDX += e.movementX * 0.6; this.lookDY += e.movementY * 0.6; } });
    const ingame = e => Game.phase !== 'lobby' && !Game.paused && e.target && (e.target.id === 'touch' || e.target.id === 'game');
    window.addEventListener('mousedown', e => {
      if (!(this.locked || (View.arcade() && ingame(e)))) return;
      if (e.button === 0) this.press('fire'); if (e.button === 2) this.ads = true;
    });
    window.addEventListener('mouseup', e => { if (e.button === 0) this.release('fire'); if (e.button === 2) this.ads = false; });
    window.addEventListener('wheel', e => { if ((this.locked || View.arcade()) && Game.player && Game.phase !== 'lobby') { Game.cycleSlot(e.deltaY > 0 ? 1 : -1); } }, { passive: true });
  },
  press(b) {
    this.pressed[b] = true; this.held[b] = true;
    if (b === 'fire' || b === 'fireL') this.fire = true;
    if (b === 'ads') { if (Input.isTouch) this.adsTouch = !this.adsTouch; }
    Sfx.init();
  },
  release(b) {
    this.held[b] = false;
    if (b === 'fire' || b === 'fireL') this.fire = !!(this.held.fire || this.held.fireL);
  },
  consume(b) { const v = this.pressed[b]; this.pressed[b] = false; return v; },
  readKeys() {
    if (this.joy) return;
    const k = this.keys; let x = 0, y = 0;
    if (k['w'] || k['z'] || k['arrowup']) y += 1; if (k['s'] || k['arrowdown']) y -= 1;
    if (k['d'] || k['arrowright']) x += 1; if (k['a'] || k['q'] || k['arrowleft']) x -= 1;
    const l = Math.hypot(x, y); this.jx = l ? x / l : 0; this.jy = l ? y / l : 0;
    if (this.sprintKey && y > 0 && !View.arcade()) { this.jy = 1; this.jx *= 0.3; this.sprinting = true; } else this.sprinting = this.sprintKey && l > 0 && View.arcade();
  },
  resetAll() {
    this.roles.clear(); this.joy = null; this.aim = null; this.jx = this.jy = 0; this.ax = this.ay = this.aimMag = 0; this.aiming = false; this.tapFire = false;
    this.fire = false; this.ads = false; this.adsTouch = false; this.held = {}; this.pressed = {};
    if (this.joyEl) this.joyEl.classList.remove('on'); if (this.aimEl) this.aimEl.classList.remove('on');
    document.querySelectorAll('[data-btn].down').forEach(e => e.classList.remove('down'));
  },
};
