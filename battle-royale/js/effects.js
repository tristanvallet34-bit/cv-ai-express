// ============ TOON ROYALE — effets visuels (pools, zéro allocation en jeu) ============
'use strict';

const Effects = {
  scene: null, tracers: [], flashes: [], parts: [], ti: 0, fi: 0, pi: 0,
  init(scene) {
    this.scene = scene;
    const tg = new THREE.BoxGeometry(0.05, 0.05, 1); tg.translate(0, 0, 0.5);
    const tm = new THREE.MeshBasicMaterial({ color: 0xfff1a0, transparent: true, opacity: 0.9, depthWrite: false });
    for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(tg, tm.clone()); m.visible = false; m.life = 0; scene.add(m); this.tracers.push(m); }
    const fg = new THREE.IcosahedronGeometry(0.22, 0);
    const fm = new THREE.MeshBasicMaterial({ color: 0xffd54a, transparent: true, opacity: 1, depthWrite: false });
    for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(fg, fm); m.visible = false; m.life = 0; scene.add(m); this.flashes.push(m); }
    const pg = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    for (let i = 0; i < 220; i++) { const m = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })); m.visible = false; m.life = 0; m.v = new THREE.Vector3(); scene.add(m); this.parts.push(m); }
    // explosion
    this.boomMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffa531, transparent: true, opacity: 0.9, depthWrite: false }));
    this.boomMesh.visible = false; scene.add(this.boomMesh); this.boomLife = 0;
  },
  tracer(a, b, thin) {
    const m = this.tracers[this.ti++ % this.tracers.length];
    m.position.copy(a); const L = a.distanceTo(b); if (L < 0.1) return;
    m.lookAt(b); m.scale.set(thin ? 0.6 : 1, thin ? 0.6 : 1, L);
    m.visible = true; m.life = 0.07; m.material.opacity = 0.9;
  },
  flash(p) { const m = this.flashes[this.fi++ % this.flashes.length]; m.position.copy(p); m.visible = true; m.life = 0.05; m.scale.setScalar(0.8 + Math.random() * 0.6); m.rotation.set(Math.random() * 3, Math.random() * 3, 0); },
  burst(p, color, n, spd, life, up) {
    for (let i = 0; i < n; i++) {
      const m = this.parts[this.pi++ % this.parts.length];
      m.position.copy(p); m.v.set((Math.random() - 0.5) * spd, Math.random() * spd * (up || 0.8), (Math.random() - 0.5) * spd);
      m.material.color.set(color); m.material.opacity = 1; m.visible = true; m.life = life * (0.6 + Math.random() * 0.6); m.maxLife = m.life;
      m.scale.setScalar(0.6 + Math.random());
    }
  },
  casing(p, yaw) {
    const m = this.parts[this.pi++ % this.parts.length];
    m.position.copy(p); m.v.set(Math.cos(yaw) * 3 + (Math.random() - 0.5), 2.5 + Math.random(), -Math.sin(yaw) * 3);
    m.material.color.set('#ffcf3f'); m.material.opacity = 1; m.visible = true; m.life = m.maxLife = 0.5; m.scale.set(0.35, 0.35, 0.8);
  },
  trail(p) { this.burst(p, '#cfc8d8', 1, 1, 0.6, 0.3); this.burst(p, '#ffb347', 1, 1.5, 0.15, 0.3); },
  confettiBurst(p) { const cs = ['#ff4f8b', '#ffcf3f', '#2ee6c8', '#3ea8ff', '#bd63ff']; for (let i = 0; i < 5; i++) this.burst(p, cs[i], 10, 9, 1.6, 1.4); },
  impact(p) { this.burst(p, '#e8e2d0', 3, 3, 0.3); },
  poof(p) { const q = p.clone(); q.y += 1; this.burst(q, '#ffffff', 14, 6, 0.7, 1); this.burst(q, '#ff4f8b', 8, 5, 0.6, 1); this.burst(q, '#ffcf3f', 8, 5, 0.6, 1); },
  boom(p) { this.boomMesh.position.copy(p); this.boomMesh.visible = true; this.boomLife = 0.45; this.burst(p, '#ff7b2e', 20, 14, 0.8, 1); this.burst(p, '#5a5560', 14, 8, 1.2, 1.2); },
  update(dt) {
    for (const m of this.tracers) if (m.visible) { m.life -= dt; m.material.opacity = Math.max(0, m.life / 0.07); if (m.life <= 0) m.visible = false; }
    for (const m of this.flashes) if (m.visible) { m.life -= dt; if (m.life <= 0) m.visible = false; }
    for (const m of this.parts) if (m.visible) {
      m.life -= dt; if (m.life <= 0) { m.visible = false; continue; }
      m.v.y -= 15 * dt; m.position.addScaledVector(m.v, dt); m.material.opacity = m.life / m.maxLife;
    }
    if (this.boomMesh.visible) { this.boomLife -= dt; const t = 1 - this.boomLife / 0.45; this.boomMesh.scale.setScalar(1 + t * 7); this.boomMesh.material.opacity = 0.9 * (1 - t); if (this.boomLife <= 0) this.boomMesh.visible = false; }
  },
};
