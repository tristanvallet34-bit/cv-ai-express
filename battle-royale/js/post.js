// ============ TOON ROYALE — post-traitement : bloom, étalonnage, vignette, FXAA ============
'use strict';

const Post = {
  ok: false,
  init(renderer) {
    this.r = renderer;
    const pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, stencilBuffer: false };
    this.rt = new THREE.WebGLRenderTarget(4, 4, pars);
    this.a = new THREE.WebGLRenderTarget(4, 4, Object.assign({ depthBuffer: false }, pars));
    this.b = new THREE.WebGLRenderTarget(4, 4, Object.assign({ depthBuffer: false }, pars));
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scn = new THREE.Scene();
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); this.quad.frustumCulled = false; this.scn.add(this.quad);
    const vs = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
    this.mBright = new THREE.ShaderMaterial({
      uniforms: { t: { value: null }, px: { value: new THREE.Vector2() }, thr: { value: 0.93 } }, vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: `uniform sampler2D t; uniform vec2 px; uniform float thr; varying vec2 vUv;
        vec3 br(vec2 o){ vec3 c = texture2D(t, vUv + o * px).rgb; float l = max(c.r, max(c.g, c.b)); return c * smoothstep(thr, thr + 0.07, l); }
        void main(){ vec3 c = br(vec2(0.0)) * 0.25 + (br(vec2(1.5, 0.0)) + br(vec2(-1.5, 0.0)) + br(vec2(0.0, 1.5)) + br(vec2(0.0, -1.5))) * 0.125
          + (br(vec2(1.5, 1.5)) + br(vec2(-1.5, 1.5)) + br(vec2(1.5, -1.5)) + br(vec2(-1.5, -1.5))) * 0.0625; gl_FragColor = vec4(c, 1.0); }`,
    });
    this.mBlur = new THREE.ShaderMaterial({
      uniforms: { t: { value: null }, dir: { value: new THREE.Vector2() } }, vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: `uniform sampler2D t; uniform vec2 dir; varying vec2 vUv;
        void main(){ vec3 c = texture2D(t, vUv).rgb * 0.227;
          c += (texture2D(t, vUv + dir * 1.385).rgb + texture2D(t, vUv - dir * 1.385).rgb) * 0.316;
          c += (texture2D(t, vUv + dir * 3.23).rgb + texture2D(t, vUv - dir * 3.23).rgb) * 0.07;
          gl_FragColor = vec4(c, 1.0); }`,
    });
    this.mComp = new THREE.ShaderMaterial({
      uniforms: { t: { value: null }, bl: { value: null }, px: { value: new THREE.Vector2() }, sat: { value: 1.15 }, con: { value: 1.05 }, vig: { value: 0.35 }, bk: { value: 0.4 }, tint: { value: new THREE.Vector3(1, 1, 1) }, fx: { value: 1 }, storm: { value: 0 } },
      vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: `uniform sampler2D t, bl; uniform vec2 px; uniform float sat, con, vig, bk, fx, storm; uniform vec3 tint; varying vec2 vUv;
        vec3 fxaa(){
          vec3 nw = texture2D(t, vUv + vec2(-1.0, -1.0) * px).rgb, ne = texture2D(t, vUv + vec2(1.0, -1.0) * px).rgb;
          vec3 sw = texture2D(t, vUv + vec2(-1.0, 1.0) * px).rgb, se = texture2D(t, vUv + vec2(1.0, 1.0) * px).rgb, m = texture2D(t, vUv).rgb;
          vec3 L = vec3(0.299, 0.587, 0.114);
          float lnw = dot(nw, L), lne = dot(ne, L), lsw = dot(sw, L), lse = dot(se, L), lm = dot(m, L);
          float mn = min(lm, min(min(lnw, lne), min(lsw, lse))), mx = max(lm, max(max(lnw, lne), max(lsw, lse)));
          vec2 d = vec2(-((lnw + lne) - (lsw + lse)), ((lnw + lsw) - (lne + lse)));
          float red = max((lnw + lne + lsw + lse) * 0.03125, 0.0078125);
          float rcp = 1.0 / (min(abs(d.x), abs(d.y)) + red);
          d = clamp(d * rcp, -8.0, 8.0) * px;
          vec3 a = 0.5 * (texture2D(t, vUv + d * (1.0 / 3.0 - 0.5)).rgb + texture2D(t, vUv + d * (2.0 / 3.0 - 0.5)).rgb);
          vec3 b = a * 0.5 + 0.25 * (texture2D(t, vUv - d * 0.5).rgb + texture2D(t, vUv + d * 0.5).rgb);
          float lb = dot(b, L); return (lb < mn || lb > mx) ? a : b; }
        void main(){
          vec3 c = fx > 0.5 ? fxaa() : texture2D(t, vUv).rgb;
          c += texture2D(bl, vUv).rgb * bk;
          float l = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(vec3(l), c, sat);
          c = (c - 0.5) * con + 0.5; c *= tint;
          c = mix(c, c * vec3(0.85, 0.6, 1.25), storm);
          float d = distance(vUv, vec2(0.5)); c *= 1.0 - vig * smoothstep(0.4, 0.9, d);
          gl_FragColor = vec4(c, 1.0); }`,
    });
    this.ok = true;
  },
  setSize(w, h, pr) {
    if (!this.ok) return;
    const W = Math.max(4, Math.floor(w * pr)), H = Math.max(4, Math.floor(h * pr));
    this.rt.setSize(W, H); this.a.setSize(Math.max(4, W >> 2), Math.max(4, H >> 2)); this.b.setSize(Math.max(4, W >> 2), Math.max(4, H >> 2));
    this.mComp.uniforms.px.value.set(1 / W, 1 / H); this.mBright.uniforms.px.value.set(1 / W, 1 / H);
    this.qw = Math.max(4, W >> 2); this.qh = Math.max(4, H >> 2);
  },
  render(scene, cam, T, storm) {
    const r = this.r;
    r.setRenderTarget(this.rt); r.render(scene, cam);
    this.quad.material = this.mBright; this.mBright.uniforms.t.value = this.rt.texture;
    r.setRenderTarget(this.a); r.render(this.scn, this.cam);
    this.quad.material = this.mBlur; this.mBlur.uniforms.t.value = this.a.texture; this.mBlur.uniforms.dir.value.set(1 / this.qw, 0);
    r.setRenderTarget(this.b); r.render(this.scn, this.cam);
    this.mBlur.uniforms.t.value = this.b.texture; this.mBlur.uniforms.dir.value.set(0, 1 / this.qh);
    r.setRenderTarget(this.a); r.render(this.scn, this.cam);
    const u = this.mComp.uniforms; u.t.value = this.rt.texture; u.bl.value = this.a.texture;
    u.sat.value = T.sat; u.con.value = T.con; u.bk.value = T.bloom; u.tint.value.set(T.tint[0], T.tint[1], T.tint[2]); u.storm.value = storm;
    this.quad.material = this.mComp;
    r.setRenderTarget(null); r.render(this.scn, this.cam);
  },
};
