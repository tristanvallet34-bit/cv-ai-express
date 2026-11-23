// ============ TOON ROYALE — contrôles tactiles + clavier/souris ============
'use strict';

const Input = {
  jx: 0, jy: 0, lookDX: 0, lookDY: 0, fire: false, ads: false, keys: {}, roles: new Map(),
  joy: null, pressed: {}, held: {}, isTouch: false, locked: false, sprintKey: false,
  init() {
    this.isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    const layer = document.getElementById('touch');
    const joyEl = document.getElementById('joy'), knob = document.getElementById('joyKnob');
    this.joyEl = joyEl; this.knob = knob;
    layer.addEventListener('pointerdown', e => {
      if (Game.phase === 'lobby') return;
      e.preventDefault();
      const W = window.innerWidth;
      const leftSide = Settings.leftHanded ? e.clientX > W * 0.58 : e.clientX < W * 0.42;
      if (leftSide && !this.joy && e.pointerType !== 'mouse') {
        this.joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY };
        this.roles.set(e.pointerId, 'move');
        joyEl.style.left = e.clientX + 'px'; joyEl.style.top = e.clientY + 'px'; joyEl.classList.add('on');
        knob.style.transform = 'translate(-50%,-50%)';
      } else if (e.pointerType !== 'mouse') {
        this.roles.set(e.pointerId, { look: true, x: e.clientX, y: e.clientY });
      } else if (!this.locked && Game.phase !== 'lobby' && !Game.paused) {
        try { const p = document.body.requestPointerLock && document.body.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (err) { }
      }
      try { layer.setPointerCapture(e.pointerId); } catch (err) { }
    }, { passive: false });
    const move = e => {
      const r = this.roles.get(e.pointerId); if (!r) return;
      if (r === 'move') {
        const R = 55; let dx = e.clientX - this.joy.ox, dy = e.clientY - this.joy.oy; const d = Math.hypot(dx, dy);
        if (d > R * 1.6) { // le joystick suit le doigt
          this.joy.ox += dx / d * (d - R * 1.6); this.joy.oy += dy / d * (d - R * 1.6);
          joyEl.style.left = this.joy.ox + 'px'; joyEl.style.top = this.joy.oy + 'px';
          dx = e.clientX - this.joy.ox; dy = e.clientY - this.joy.oy;
        }
        const m = Math.min(1, Math.hypot(dx, dy) / R); const a = Math.atan2(dy, dx);
        this.jx = Math.cos(a) * m; this.jy = -Math.sin(a) * m;
        knob.style.transform = `translate(calc(-50% + ${Math.cos(a) * m * R}px), calc(-50% + ${Math.sin(a) * m * R}px))`;
      } else if (r.look) {
        this.lookDX += e.clientX - r.x; this.lookDY += e.clientY - r.y; r.x = e.clientX; r.y = e.clientY;
      }
    };
    const up = e => {
      const r = this.roles.get(e.pointerId); if (!r) return;
      if (r === 'move') { this.joy = null; this.jx = 0; this.jy = 0; joyEl.classList.remove('on'); }
      if (r.btn) this.release(r.btn);
      this.roles.delete(e.pointerId);
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    // boutons
    document.querySelectorAll('[data-btn]').forEach(el => {
      el.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        const b = el.dataset.btn;
        this.roles.set(e.pointerId, { btn: b, look: b === 'fire' || b === 'fireL' || b === 'ads', x: e.clientX, y: e.clientY });
        this.press(b);
        try { el.setPointerCapture(e.pointerId); } catch (err) { }
        el.classList.add('down');
      }, { passive: false });
      const rel = e => { el.classList.remove('down'); };
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
    // souris
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === document.body; });
    window.addEventListener('mousemove', e => { if (this.locked) { this.lookDX += e.movementX * 0.6; this.lookDY += e.movementY * 0.6; } });
    window.addEventListener('mousedown', e => { if (!this.locked) return; if (e.button === 0) this.press('fire'); if (e.button === 2) this.ads = true; });
    window.addEventListener('mouseup', e => { if (e.button === 0) this.release('fire'); if (e.button === 2) this.ads = false; });
    window.addEventListener('wheel', e => { if (this.locked && Game.player) { Game.cycleSlot(e.deltaY > 0 ? 1 : -1); } }, { passive: true });
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
    if (this.sprintKey && y > 0) { this.jy = 1; this.jx *= 0.3; this.sprinting = true; } else this.sprinting = false;
  },
  resetAll() { this.roles.clear(); this.joy = null; this.jx = this.jy = 0; this.fire = false; this.ads = false; this.adsTouch = false; this.held = {}; this.pressed = {}; if (this.joyEl) this.joyEl.classList.remove('on'); document.querySelectorAll('[data-btn].down').forEach(e => e.classList.remove('down')); },
};
