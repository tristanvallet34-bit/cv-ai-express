// ============ TOON ROYALE — rendu cartoon : cel-shading, contours, ciel, océan, herbe, tempête ============
'use strict';

const GLSL_NOISE = `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
`;

// ambiances : couleurs du ciel, lumières, brouillard, océan, étalonnage
const TIMES = {
  morning: { n: 'Matin rose', top: '#5aa8ff', hor: '#ffd1dc', bot: '#9fc6e8', sun: '#ffe0c0', sunI: 0.75, sunPos: [160, 70, -170], hemiS: '#ffe4ec', hemiG: '#6b8f4a', hemiI: 0.52, amb: 0.14, fog: '#ffd9e2', cloud: '#fff0f4', deep: '#2f8fd6', shallow: '#5fe0e8', foam: '#ffffff', sat: 1.08, con: 1.04, tint: [1.02, 0.98, 1.0], bloom: 0.22, stars: 0 },
  day: { n: 'Plein soleil', top: '#2f8fff', hor: '#c8ecff', bot: '#a7d8f0', sun: '#fff4d6', sunI: 0.8, sunPos: [80, 160, -60], hemiS: '#dff3ff', hemiG: '#6b8f4a', hemiI: 0.5, amb: 0.14, fog: '#c4e8ff', cloud: '#ffffff', deep: '#1f86d8', shallow: '#4fe6e0', foam: '#ffffff', sat: 1.1, con: 1.05, tint: [1, 1, 1], bloom: 0.18, stars: 0 },
  sunset: { n: 'Coucher de soleil', top: '#3a2a85', hor: '#ff9a5a', bot: '#c46a6a', sun: '#ffbe85', sunI: 0.82, sunPos: [260, 45, -200], hemiS: '#ffd2b8', hemiG: '#5a5f7a', hemiI: 0.48, amb: 0.14, fog: '#f2a07e', cloud: '#ffd6c4', deep: '#3a5fb0', shallow: '#ff9fb0', foam: '#ffe6d6', sat: 1.08, con: 1.05, tint: [1.03, 0.98, 0.97], bloom: 0.3, stars: 0.15 },
  night: { n: 'Nuit étoilée', top: '#070d2e', hor: '#2a3f8a', bot: '#141c44', sun: '#b8ccff', sunI: 0.55, sunPos: [-140, 120, 90], hemiS: '#7f95e0', hemiG: '#22284a', hemiI: 0.65, amb: 0.28, fog: '#24316e', cloud: '#5a6aa8', deep: '#122a66', shallow: '#2f7fb0', foam: '#bfe6ff', sat: 1.05, con: 1.06, tint: [0.92, 0.98, 1.1], bloom: 0.45, stars: 1 },
};

const Look = {
  toon: true, grad: null, uniforms: { time: { value: 0 } }, outlines: {}, swayShaders: [],
  init() {
    const q = Game.resolveQuality();
    this.toon = q !== 'low';
    const d = new Uint8Array([95, 95, 95, 255, 170, 170, 170, 255, 235, 235, 235, 255, 255, 255, 255, 255]);
    this.grad = new THREE.DataTexture(d, 4, 1, THREE.RGBAFormat);
    this.grad.minFilter = this.grad.magFilter = THREE.NearestFilter; this.grad.generateMipmaps = false; this.grad.needsUpdate = true;
  },
  mat(o) {
    return this.toon ? new THREE.MeshToonMaterial(Object.assign({ gradientMap: this.grad }, o)) : new THREE.MeshLambertMaterial(o);
  },
  // normales lissées pour des contours sans trous
  onormal(geo) {
    if (geo.attributes.onormal) return geo;
    const p = geo.attributes.position, n = geo.attributes.normal; const map = new Map();
    const key = i => Math.round(p.getX(i) * 200) + ',' + Math.round(p.getY(i) * 200) + ',' + Math.round(p.getZ(i) * 200);
    for (let i = 0; i < p.count; i++) { const k = key(i); let a = map.get(k); if (!a) { a = [0, 0, 0]; map.set(k, a); } a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i); }
    const out = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const a = map.get(key(i)); const l = Math.hypot(a[0], a[1], a[2]) || 1; out[i * 3] = a[0] / l; out[i * 3 + 1] = a[1] / l; out[i * 3 + 2] = a[2] / l; }
    geo.setAttribute('onormal', new THREE.BufferAttribute(out, 3));
    return geo;
  },
  outlineMat(thick, color) {
    const k = thick + (color || ''); if (this.outlines[k]) return this.outlines[k];
    const m = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { thick: { value: thick }, color: { value: new THREE.Color(color || '#1d1440') } }]),
      vertexShader: `attribute vec3 onormal; uniform float thick;
        #include <fog_pars_vertex>
        void main(){ vec3 p = position + onormal * thick;
          vec4 w = vec4(p, 1.0);
          #ifdef USE_INSTANCING
          w = instanceMatrix * w;
          #endif
          vec4 mvPosition = modelViewMatrix * w; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform vec3 color;
        #include <fog_pars_fragment>
        void main(){ gl_FragColor = vec4(color, 1.0);
          #include <fog_fragment>
        }`,
      side: THREE.BackSide, fog: true,
    });
    this.outlines[k] = m; return m;
  },
  addOutline(mesh, thick, color) {
    this.onormal(mesh.geometry);
    let o;
    if (mesh.isInstancedMesh) { o = new THREE.InstancedMesh(mesh.geometry, this.outlineMat(thick, color), mesh.count); o.instanceMatrix = mesh.instanceMatrix; o.frustumCulled = false; }
    else o = new THREE.Mesh(mesh.geometry, this.outlineMat(thick, color));
    o.name = 'outline'; mesh.add(o); if (mesh.isInstancedMesh) { o.position.set(0, 0, 0); }
    mesh.userData.outline = o; return o;
  },
  // feuillage qui ondule au vent
  sway(mat, amp) {
    mat.onBeforeCompile = sh => {
      sh.uniforms.time = this.uniforms.time;
      sh.vertexShader = 'uniform float time;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
        float ph = instanceMatrix[3].x * 0.13 + instanceMatrix[3].z * 0.11;
        #else
        float ph = 0.0;
        #endif
        float k = max(0.0, position.y - 1.5) * ${amp.toFixed(3)};
        transformed.x += sin(time * 1.7 + ph) * k; transformed.z += cos(time * 1.3 + ph * 1.3) * k * 0.6;`);
    };
    mat.customProgramCacheKey = () => 'sway' + amp;
  },
  // ---------- carte des hauteurs (océan + herbe) ----------
  buildHeightTex() {
    const S = 256, data = new Uint8Array(S * S * 4);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const x = ((i + 0.5) / S - 0.5) * World.SIZE, z = ((j + 0.5) / S - 0.5) * World.SIZE; const h = World.h(x, z);
      let g = h > 2.8 && h < 23 ? 1 : 0;
      if (g) {
        for (const p of World.pois) if (dist2(x, z, p.x, p.z) < (p.r * 0.85) ** 2) { g = 0.25; break; }
        for (const r of World.roads) if (segDist(x, z, r[0], r[1], r[2], r[3]) < 4.5) { g = 0; break; }
        if (World.inBuilding(x, z) || World.nearWall(x, z, 1)) g = 0;
      }
      const k = (j * S + i) * 4; data[k] = clamp((h + 12) / 64, 0, 1) * 255; data[k + 1] = g * 255; data[k + 2] = 0; data[k + 3] = 255;
    }
    const t = new THREE.DataTexture(data, S, S, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true;
    this.hmap = t; return t;
  },
  // ---------- ciel ----------
  sky(scene) {
    const m = new THREE.ShaderMaterial({
      uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sunC: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, stars: { value: 0 }, time: this.uniforms.time },
      vertexShader: `varying vec3 vd; void main(){ vd = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform vec3 top, hor, bot, sunC, sunDir; uniform float stars, time; varying vec3 vd;
        ${GLSL_NOISE}
        void main(){ vec3 d = normalize(vd); float y = d.y;
          vec3 c = y > 0.0 ? mix(hor, top, pow(y, 0.55)) : mix(hor, bot, pow(-y, 0.45));
          float s = max(dot(d, normalize(sunDir)), 0.0);
          c += sunC * (smoothstep(0.9993, 0.9996, s) * 1.6 + pow(s, 28.0) * 0.38 + pow(s, 4.0) * 0.14);
          if (stars > 0.0 && y > 0.05) { vec2 g = floor(vec2(atan(d.z, d.x) * 180.0, y * 160.0)); float st = step(0.985, hash(g)); c += vec3(st) * stars * (0.6 + 0.4 * sin(time * 3.0 + hash(g + 3.0) * 20.0)) * smoothstep(0.05, 0.3, y); }
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    const s = new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 16), m); s.renderOrder = -10; s.frustumCulled = false; scene.add(s);
    this.skyMat = m; return s;
  },
  // ---------- océan ----------
  water(scene) {
    const m = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { hmap: { value: this.hmap }, size: { value: World.SIZE }, deep: { value: new THREE.Color() }, shallow: { value: new THREE.Color() }, foamC: { value: new THREE.Color() }, sunC: { value: new THREE.Color() } }]),
      vertexShader: `varying vec3 wp;
        #include <fog_pars_vertex>
        void main(){ vec4 w = modelMatrix * vec4(position, 1.0); wp = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform sampler2D hmap; uniform float size, time; uniform vec3 deep, shallow, foamC, sunC; varying vec3 wp;
        ${GLSL_NOISE}
        #include <fog_pars_fragment>
        void main(){
          vec2 uv = wp.xz / size + 0.5;
          float h = (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) ? -12.0 : texture2D(hmap, uv).r * 64.0 - 12.0;
          float depth = 0.2 - h;
          float n = noise(wp.xz * 0.07 + time * 0.12) + noise(wp.xz * 0.19 - time * 0.09) * 0.5;
          vec3 col = mix(shallow, deep, smoothstep(0.0, 8.0, depth + n * 0.8));
          float band = smoothstep(2.2, 0.0, depth) * smoothstep(0.35, 0.75, 0.5 + 0.5 * sin(depth * 6.0 - time * 2.0 + n * 3.0));
          float edge = smoothstep(0.45, 0.05, depth);
          col = mix(col, foamC, clamp(band * 0.75 + edge, 0.0, 1.0));
          float sp = pow(noise(wp.xz * 0.55 + vec2(time * 0.6, time * 0.35)), 14.0) * 4.0;
          col += sunC * sp * 0.5;
          float a = mix(0.62, 0.94, smoothstep(0.0, 3.0, depth)); a = max(a, edge);
          gl_FragColor = vec4(col, a);
          #include <fog_fragment>
        }`,
      transparent: true, fog: true, depthWrite: false,
    });
    m.uniforms.time = this.uniforms.time;
    const g = new THREE.PlaneGeometry(3000, 3000, 1, 1); g.rotateX(-Math.PI / 2);
    const w = new THREE.Mesh(g, m); w.position.y = 0.2; w.renderOrder = 1; scene.add(w); this.waterMat = m; return w;
  },
  // ---------- tempête ----------
  stormMat() {
    const m = new THREE.ShaderMaterial({
      uniforms: { time: this.uniforms.time, c1: { value: new THREE.Color('#5a1fd0') }, c2: { value: new THREE.Color('#d08cff') }, flash: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float time, flash; uniform vec3 c1, c2; varying vec2 vUv;
        ${GLSL_NOISE}
        void main(){
          float n = noise(vec2(vUv.x * 70.0 + time * 0.5, vUv.y * 9.0 - time * 0.7)) * 0.65 + noise(vec2(vUv.x * 160.0 - time, vUv.y * 22.0 + time * 0.6)) * 0.35;
          float streak = smoothstep(0.78, 1.0, noise(vec2(vUv.x * 260.0, vUv.y * 2.5 - time * 1.6)));
          vec3 col = mix(c1, c2, n) + streak * 0.4 + flash;
          float a = (0.32 + 0.38 * n + streak * 0.2) * smoothstep(1.0, 0.55, vUv.y) + flash * 0.3;
          gl_FragColor = vec4(col, clamp(a, 0.0, 0.92)); }`,
      transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false,
    });
    this.stormM = m; return m;
  },
  // ---------- herbe dense qui suit la caméra ----------
  grass(scene, count) {
    if (this.grassMesh) { scene.remove(this.grassMesh); this.grassMesh = null; }
    if (!count) return;
    const base = new THREE.BufferGeometry(); const P = [];
    const blade = (a, w, h, lean) => { const c = Math.cos(a), s = Math.sin(a); P.push(-c * w, 0, -s * w, c * w, 0, s * w, lean * s, h, -lean * c); };
    blade(0, 0.07, 0.55, 0.12); blade(1.1, 0.06, 0.45, -0.1); blade(2.2, 0.07, 0.6, 0.15); blade(0.5, 0.05, 0.38, 0.05); blade(2.8, 0.05, 0.42, -0.12);
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    const R = 34; const ofs = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) { ofs[i * 4] = (Math.random() - 0.5) * 2 * R; ofs[i * 4 + 1] = (Math.random() - 0.5) * 2 * R; ofs[i * 4 + 2] = 0.55 + Math.random() * 0.6; ofs[i * 4 + 3] = Math.random() * TAU; }
    geo.setAttribute('ofs', new THREE.InstancedBufferAttribute(ofs, 4));
    geo.instanceCount = count;
    const m = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { hmap: { value: this.hmap }, size: { value: World.SIZE }, center: { value: new THREE.Vector2() }, R: { value: R }, light: { value: 1 }, c1: { value: new THREE.Color('#3f9a3a') }, c2: { value: new THREE.Color('#98e35e') } }]),
      vertexShader: `attribute vec4 ofs; uniform sampler2D hmap; uniform float size, time, R; uniform vec2 center; varying float vy; varying float vn;
        #include <fog_pars_vertex>
        void main(){
          vec2 rel = mod(ofs.xy - center + R, 2.0 * R) - R; vec2 wxz = center + rel;
          vec4 t = texture2D(hmap, wxz / size + 0.5); float h = t.r * 64.0 - 12.0;
          float fade = 1.0 - smoothstep(R * 0.6, R, length(rel));
          float sc = ofs.z * step(0.5, t.g) * fade;
          float c = cos(ofs.w), s = sin(ofs.w);
          vec3 p = vec3(position.x * c - position.z * s, position.y, position.x * s + position.z * c) * sc;
          float sw = sin(time * 2.2 + wxz.x * 0.35 + wxz.y * 0.25) * 0.16 * position.y * sc;
          p.x += sw; p.z += sw * 0.6;
          vy = position.y / 0.6; vn = fract(sin(dot(floor(wxz * 0.15), vec2(12.9, 78.2))) * 43758.5);
          vec4 mvPosition = viewMatrix * vec4(wxz.x + p.x, h + p.y - 0.05, wxz.y + p.z, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform vec3 c1, c2; uniform float light; varying float vy; varying float vn;
        #include <fog_pars_fragment>
        void main(){ vec3 col = mix(c1 * 0.7, mix(c2, c2 * vec3(1.1, 0.95, 0.6), vn), clamp(vy, 0.0, 1.0)) * light; gl_FragColor = vec4(col, 1.0);
          #include <fog_fragment>
        }`,
      side: THREE.DoubleSide, fog: true,
    });
    m.uniforms.time = this.uniforms.time;
    const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; scene.add(mesh);
    this.grassMesh = mesh; this.grassMat = m;
  },
  // ---------- application d'une ambiance ----------
  applyTime(id) {
    const T = TIMES[id] || TIMES.day; this.time = T; this.timeId = id;
    const G = Game;
    G.sun.color.set(T.sun); G.sun.intensity = T.sunI; this.sunOff = new THREE.Vector3(...T.sunPos);
    G.hemi.color.set(T.hemiS); G.hemi.groundColor.set(T.hemiG); G.hemi.intensity = T.hemiI; G.amb.intensity = T.amb;
    G.scene.fog.color.set(T.fog); this.fogBase = new THREE.Color(T.fog);
    G.renderer.setClearColor(T.fog, 1);
    if (this.skyMat) { const u = this.skyMat.uniforms; u.top.value.set(T.top); u.hor.value.set(T.hor); u.bot.value.set(T.bot); u.sunC.value.set(T.sun); u.sunDir.value.copy(this.sunOff).normalize(); u.stars.value = T.stars; }
    if (this.waterMat) { const u = this.waterMat.uniforms; u.deep.value.set(T.deep); u.shallow.value.set(T.shallow); u.foamC.value.set(T.foam); u.sunC.value.set(T.sun); }
    if (World.clouds) World.clouds.material.color.set(T.cloud);
    if (World.sunMesh) World.sunMesh.visible = false;
    if (this.grassMat) this.grassMat.uniforms.light.value = id === 'night' ? 0.55 : id === 'sunset' ? 0.9 : 1;
    if (G.lamp) G.lamp.intensity = id === 'night' ? 0.9 : 0;
  },
  update(dt, camPos) {
    this.uniforms.time.value += dt;
    if (this.grassMat) this.grassMat.uniforms.center.value.set(camPos.x, camPos.z);
  },
};
