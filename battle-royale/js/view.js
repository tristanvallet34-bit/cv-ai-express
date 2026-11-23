// ============ TOON ROYALE — affichage paysage intégral ============
// Téléphone tenu en portrait : toute l'application est tournée de 90° pour rester en paysage.
'use strict';
const View = {
  rot: false, w: window.innerWidth, h: window.innerHeight,
  update() {
    const touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.rot = Settings.forceLandscape !== false && touch && window.innerHeight > window.innerWidth;
    this.w = this.rot ? window.innerHeight : window.innerWidth; this.h = this.rot ? window.innerWidth : window.innerHeight;
    document.body.classList.toggle('rot', this.rot);
    const a = document.getElementById('app'); if (a) { a.style.width = this.w + 'px'; a.style.height = this.h + 'px'; }
    const R = document.documentElement.style; R.setProperty('--aw', this.w + 'px'); R.setProperty('--ah', this.h + 'px');
    document.body.classList.toggle('short', this.h <= 430); document.body.classList.toggle('short48', this.h <= 480);
  },
  // coordonnées écran → coordonnées de l'application (paysage)
  pt(e) { return this.rot ? { x: e.clientY, y: window.innerWidth - e.clientX } : { x: e.clientX, y: e.clientY }; },
  rect(el) {
    const r = el.getBoundingClientRect(); if (!this.rot) return r;
    return { left: r.top, top: window.innerWidth - r.right, width: r.height, height: r.width, right: r.bottom, bottom: window.innerWidth - r.left };
  },
  arcade() { return Settings.view !== 'tps'; },
};
