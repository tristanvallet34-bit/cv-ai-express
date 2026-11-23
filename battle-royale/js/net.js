// ============ TOON ROYALE — multijoueur entre amis ============
// Modèle « hôte » : le créateur du salon fait tourner la partie complète (bots, tempête, loot, dégâts).
// Les autres joueurs envoient leur position et leurs actions ; l'hôte renvoie l'état du monde.
'use strict';

const ST_CODE = { bus: 0, fall: 1, glide: 2, ground: 3, dead: 4 }, ST_NAME = ['bus', 'fall', 'glide', 'ground', 'dead'];

const Net = {
  ws: null, room: null, me: null, isHost: false, isClient: false, live: false, evq: [], pq: {}, remote: {}, sendT: 0, snapT: 0, privT: 0,
  url() {
    if (Settings.server) return Settings.server;
    if (/^https?:$/.test(location.protocol) && location.host && !/claude|usercontent/.test(location.host)) return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
    return '';
  },
  connect(then) {
    const u = this.url(); if (!u) { this.status('Indique l\'adresse du serveur (voir le guide du dossier server/).'); return; }
    if (this.ws && this.ws.readyState === 1) { then(); return; }
    try { this.ws = new WebSocket(u); } catch (e) { this.status('Connexion impossible : ' + e.message); return; }
    this.status('Connexion à ' + u + '…');
    this.ws.onopen = () => { this.status(''); then(); };
    this.ws.onerror = () => this.status('Serveur injoignable. Le multijoueur fonctionne avec la version hébergée et son serveur.');
    this.ws.onclose = () => { if (this.room) { this.room = null; if (this.live) this.onClosed(); } this.ws = null; this.renderPanel(); };
    this.ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } this.onMsg(m); };
  },
  send(o) { if (o.t === 'act' && this.isClient && this.live) this.sendState(); if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(o)); },
  status(t) { this.statusTxt = t; const el = document.getElementById('netStatus'); if (el) el.textContent = t; },
  create() { this.connect(() => this.send({ t: 'create', name: Settings.name })); },
  join(code) { this.connect(() => this.send({ t: 'join', code, name: Settings.name })); },
  leave() { this.send({ t: 'leave' }); this.room = null; this.isHost = this.isClient = false; this.renderPanel(); },
  onMsg(m) {
    switch (m.t) {
      case 'room': this.room = m; this.me = m.me; this.isHost = m.members.some(x => x.id === m.me && x.host); this.renderPanel(); break;
      case 'error': this.status(m.msg); break;
      case 'closed': this.room = null; this.status('L\'hôte a fermé le salon.'); if (this.live) this.onClosed(); this.renderPanel(); break;
      case 'left': if (this.isHost) this.dropRemote(m.id); break;
      // côté hôte
      case 'in': if (this.isHost && this.remote[m.from]) this.remote[m.from].netIn = m; break;
      case 'act': if (this.isHost && this.remote[m.from]) this.hostAct(this.remote[m.from], m); break;
      // côté client
      case 'start': this.clientStart(m); break;
      case 's': if (this.isClient && this.live) this.applySnap(m); break;
      case 'p': if (this.isClient && this.live) this.applyPriv(m); break;
      case 'e': if (this.isClient && this.live) for (const ev of m.l) this.applyEvent(ev); break;
    }
  },
  onClosed() { this.live = false; this.isClient = this.isHost = false; Game.paused = true; HUD.message('La partie entre amis est terminée (l\'hôte est parti)', 3, 'bad'); setTimeout(() => { Game.paused = false; if (Game.phase !== 'lobby') Game.quitToLobby(); }, 1500); },

  // ---------- panneau du lobby ----------
  renderPanel() {
    const body = document.getElementById('netBody'); if (!body) return;
    const r = this.room;
    if (!r) {
      body.innerHTML = `<p class="lead">Joue avec tes amis : un joueur crée un salon, les autres entrent son code. Les places restantes sont remplies par des bots. Jusqu'à 10 joueurs.</p>
        <div class="set"><label for="netUrl"><b>Serveur</b><small>Laisse vide si le jeu est ouvert depuis le serveur Toon Royale</small></label><input type="text" id="netUrl" value="${(Settings.server || '').replace(/"/g, '')}" placeholder="${this.url() || 'wss://mon-serveur.com/ws'}"></div>
        <div class="netrow"><button id="netCreate" class="primary">Créer un salon</button></div>
        <div class="netrow"><input type="text" id="netCode" maxlength="4" placeholder="CODE" autocapitalize="characters"><button id="netJoin">Rejoindre</button></div>
        <p id="netStatus" class="lead">${this.statusTxt || ''}</p>`;
      document.getElementById('netUrl').addEventListener('change', e => { Settings.server = e.target.value.trim(); saveSettings(); });
      document.getElementById('netCreate').addEventListener('click', () => { Sfx.click(); this.create(); });
      document.getElementById('netJoin').addEventListener('click', () => { Sfx.click(); const c = document.getElementById('netCode').value.trim().toUpperCase(); if (c.length === 4) this.join(c); else this.status('Le code fait 4 lettres'); });
      return;
    }
    const modes = ['solo', 'duo', 'squad', 'quick'];
    body.innerHTML = `<div class="netcode"><small>Code du salon</small><b>${r.code}</b></div>
      <h4>Joueurs (${r.members.length}/10)</h4><div class="netlist">${r.members.map(x => `<div>${x.host ? '♛ ' : ''}${x.name}${x.id === r.me ? ' (toi)' : ''}</div>`).join('')}</div>
      ${this.isHost ? `<h4>Mode</h4><div class="subtabs">${modes.map(k => `<button data-nm="${k}" class="${(this.mode || 'solo') === k ? 'sel' : ''}">${MODES[k].n}</button>`).join('')}</div>
      <div class="netrow"><button id="netStart" class="primary">Lancer la partie</button></div>` : '<p class="lead">En attente de l\'hôte…</p>'}
      <div class="netrow"><button id="netLeave" class="ghost">Quitter le salon</button></div><p id="netStatus" class="lead">${this.statusTxt || ''}</p>`;
    body.querySelectorAll('[data-nm]').forEach(b => b.addEventListener('click', () => { this.mode = b.dataset.nm; this.renderPanel(); }));
    const st = document.getElementById('netStart'); if (st) st.addEventListener('click', () => this.hostStart(this.mode || 'solo'));
    document.getElementById('netLeave').addEventListener('click', () => this.leave());
  },

  // ================= HÔTE =================
  hostStart(modeId) {
    const others = this.room.members.filter(x => x.id !== this.me);
    UI.mode = modeId; Sfx.init();
    $('loading').hidden = false; $('lobby').hidden = true; $('panel').hidden = true; document.body.classList.remove('inlobby');
    setTimeout(() => {
      Game.startMatch(modeId); this.remote = {};
      const G = Game; let k = 1;
      for (const m of others) {
        const f = G.fighters[k++]; if (!f) break;
        f.remote = m.id; f.name = m.name; f.ai = null; G.bots = G.bots.filter(b => b !== f); this.remote[m.id] = f; f.netIn = null; f.shotSeq = 0; f.pend = 0;
      }
      G.fighters.forEach((f, i) => f.nid = i);
      const fl = G.fighters.map(f => ({ nid: f.nid, name: f.name, team: f.team, skin: f.skin.id, glider: f.gliderDef.id, pack: f.pack, wrap: f.wrap, boss: !!f.isBoss, remote: !!f.remote }));
      const loot = G.loot.filter(i => !i.taken).map(i => this.lootMsg(i));
      const chests = G.chests.map(c => [Math.round(c.pos.x * 10) / 10, Math.round(c.pos.z * 10) / 10]);
      const base = { t: 'start', mode: modeId, tod: Look.timeId, fighters: fl, loot, chests, bus: G.bus, storm: G.storm };
      for (const m of others) this.send(Object.assign({ to: m.id, you: this.remote[m.id] ? this.remote[m.id].nid : -1 }, base));
      this.live = true; this.evq = []; this.pq = {};
      $('loading').hidden = true; $('hud').hidden = false;
      HUD.message('Partie entre amis lancée !', 2.5);
    }, 60);
  },
  lootMsg(i) { const d = {}; for (const k of ['kind', 'w', 'rar', 'mag', 'a', 'c', 'n', 'g']) if (i[k] != null) d[k] = i[k]; return [i.nid, d, +i.pos.x.toFixed(2), +i.pos.y.toFixed(2), +i.pos.z.toFixed(2)]; },
  ev(e) { if (this.isHost && this.live) this.evq.push(e); },
  evTo(id, e) { if (this.isHost && this.live) (this.pq[id] = this.pq[id] || []).push(e); },
  dropRemote(id) { const f = this.remote[id]; if (!f) return; delete this.remote[id]; f.remote = null; if (f.alive) { f.ai = new BotAI(f); Game.bots.push(f); HUD.feed(`<b>${f.name}</b> <i>a quitté (remplacé·e par un bot)</i>`); } },
  hostTick(dt) {
    const G = Game;
    this.snapT -= dt; this.privT -= dt;
    if (this.snapT <= 0) {
      this.snapT = 1 / 12;
      const f = [];
      for (const x of G.fighters) {
        if (!x.alive && !(x.deadAt && G.time - x.deadAt < 1)) continue;
        const w = x.weapon || x.item; const wk = w ? (w.kind === 'weapon' ? w.w + ':' + w.rar : 'c:' + w.c) : '';
        const fl = (x.alive ? 1 : 0) | (x.knocked ? 2 : 0) | (x.crouch ? 4 : 0) | (x.ads ? 8 : 0) | (x.emoteT > 0 ? 16 : 0) | (x.kart ? 32 : 0) | (x.slideT > 0 ? 64 : 0) | (x.boxT > 0 ? 128 : 0) | (x.floatT > 0 ? 256 : 0) | (x.flatT > 0 ? 512 : 0);
        f.push([x.nid, +x.pos.x.toFixed(2), +x.pos.y.toFixed(2), +x.pos.z.toFixed(2), +x.yaw.toFixed(3), +x.pitch.toFixed(3), ST_CODE[x.state] ?? 3, fl, wk, +x.moveAmt.toFixed(2), Math.round(x.hp), x.kart ? +x.kart.yaw.toFixed(3) : 0]);
      }
      const st = G.storm;
      this.send({ t: 's', f, st: [st.cx, st.cz, st.r, st.nx, st.nz, st.nr, st.phase, +st.timer.toFixed(1), st.shrinking ? 1 : 0], bus: G.busPos && G.bus.active ? [G.busPos.x, G.busPos.y, G.busPos.z] : null, ph: G.phase });
      if (this.evq.length) { this.send({ t: 'e', l: this.evq }); this.evq = []; }
      for (const id in this.pq) if (this.pq[id].length) { this.send({ t: 'e', to: +id, l: this.pq[id] }); this.pq[id] = []; }
    }
    if (this.privT <= 0) {
      this.privT = 1 / 6;
      for (const id in this.remote) {
        const x = this.remote[id];
        this.send({ t: 'p', to: +id, slots: x.slots, ammo: x.ammo, cur: x.cur, hp: x.hp, sh: x.sh, coins: x.coins || 0, gag: x.gag, key: !!x.hasKey, kills: x.kills, knocked: x.knocked, bleed: x.bleed, rev: x.reviveT, alive: x.alive, using: x.using, useT: x.useT, reloadT: x.reloadT, dmg: x.dmgDone, fx: [x.floatT || 0, x.boxT || 0, x.slipT || 0, x.flatT || 0, x.stunT || 0] });
      }
    }
  },
  // pas de simulation de mouvement pour un joueur distant : on applique sa position
  remoteStep(f, dt) {
    const G = Game;
    if (f.fireT > 0) f.fireT -= dt; if (f.switchT > 0) f.switchT -= dt;
    if (f.reloadT > 0) { f.reloadT -= dt; if (f.reloadT <= 0) { f.reloadT = 0; finishReload(f); } }
    if (f.using) { f.useT -= dt; if (f.useT <= 0) G.finishUse(f); }
    if (f.emoteT > 0) f.emoteT -= dt;
    const n = f.netIn;
    if (n) {
      if (f.state === 'bus' && n.st !== 0) { f.state = ST_NAME[n.st]; f.mesh.visible = true; }
      if (f.state !== 'bus') {
        f.pos.set(n.x, n.y, n.z); f.state = n.st === 4 ? f.state : ST_NAME[n.st];
        f.parts.glider.visible = f.state === 'glide';
        if (!f.knocked) { f.crouch = !!(n.fl & 4); f.ads = !!(n.fl & 8); f.slideT = n.fl & 64 ? 0.3 : 0; if (n.fl & 16) f.emoteT = Math.max(f.emoteT, 0.3); }
        f.moveAmt = n.mv; f.onGround = !!(n.fl & 1);
      }
      f.yaw = n.yaw; f.pitch = n.pitch;
      f.reviving = n.rv >= 0 ? G.fighters[n.rv] : null;
      // tirs : l'hôte refait chaque tir avec la visée envoyée par le client
      if (n.seq > f.shotSeq) { f.pend = Math.min(2, f.pend + (n.seq - f.shotSeq)); f.shotSeq = n.seq; }
      if (f.pend > 0 && canFire(f)) { f.pend--; playerShoot(f, _v3.set(n.ox, n.oy, n.oz), new THREE.Vector3(n.dx, n.dy, n.dz).normalize(), 0); }
    }
    // ramassage automatique
    f.pickT = (f.pickT || 0) - dt;
    if (n && n.st === 3 && f.state === 'fall') f.state = 'ground';
    if (f.pickT <= 0 && f.state === 'ground') { f.pickT = 0.25; for (const it of G.loot) { if (it.taken) continue; if (dist2(f.pos.x, f.pos.z, it.pos.x, it.pos.z) < 1.8 * 1.8 && Math.abs(it.pos.y - f.pos.y) < 2.5 && (it.kind === 'ammo' || it.kind === 'coins' || it.kind === 'key' || it.kind === 'cons')) G.pickup(f, it, true); } }
    G.animate(f, dt);
  },
  hostAct(f, m) {
    const G = Game; if (!f.alive) return;
    switch (m.a) {
      case 'pick': { const it = G.loot.find(i => i.nid === m.nid && !i.taken); if (it && dist2(f.pos.x, f.pos.z, it.pos.x, it.pos.z) < 4 * 4) G.pickup(f, it, false); break; }
      case 'chest': { const c = G.chests[m.i]; if (c && !c.open && dist2(f.pos.x, f.pos.z, c.pos.x, c.pos.z) < 4 * 4) G.openChest(c, f); break; }
      case 'slot': if (m.i >= 0 && m.i < 5) { f.cur = m.i; f.switchT = 0.25; f.reloadT = 0; f.using = null; } break;
      case 'use': if (m.i >= 0 && m.i < 5) { f.cur = m.i; G.useItem(f); } break;
      case 'throw': if (m.i >= 0 && m.i < 5) { f.cur = m.i; f.fireT = 0; G.throwGrenade(f); } break;
      case 'gag': Gags.use(f, m.tgt ? new THREE.Vector3(m.tgt[0], m.tgt[1], m.tgt[2]) : null); break;
      case 'reload': startReload(f); break;
      case 'vault': Events.openVault(f); break;
      case 'jumpBus': if (f.state === 'bus') G.jumpFromBus(f); break;
      case 'grap': { const w = f.weapon; if (w && WEAPONS[w.w].grapple) { w.mag--; if (w.mag <= 0) f.slots[f.cur] = null; } break; }
    }
  },

  // ================= CLIENT =================
  clientStart(m) {
    const G = Game; this.isClient = true; this.isHost = false; this.live = false;
    $('loading').hidden = false; $('lobby').hidden = true; $('panel').hidden = true; document.body.classList.remove('inlobby');
    setTimeout(() => {
      G.mode = MODES[m.mode]; G.modeId = m.mode; G.botLevel = BOT_LEVELS.normal; G.mod = null; G.grav = 24; G.speedMul = 1;
      G.cleanup(); Gags.reset(); World.resetCrates(); Look.applyTime(m.tod || 'day'); G.applyQuality();
      Object.assign(G, { phase: 'bus', time: 0, matchStart: 0, paused: false, spectating: null, ended: false, timeScale: 1, slowT: 0, victoryT: 0, ranked: false, stormMix: 0, _stormFog: true });
      G.matchStats = { kills: 0, chests: 0, damage: 0, heal: 0, head: 0, sniperk: 0, shotgunk: 0, drive: 0 };
      G.fighters = []; G.bots = [];
      for (const d of m.fighters) {
        const E = Profile.equip; const mine = d.nid === m.you;
        const f = new Fighter({ name: d.name, team: d.team, isPlayer: mine, skin: mine ? Profile.skin : d.skin, glider: mine ? Profile.glider : d.glider, pack: mine ? E.packs : d.pack, wrap: mine ? E.wraps : d.wrap, trail: mine ? E.trails : null, emote: mine ? E.emotes : 'dance' });
        f.nid = d.nid; f.input = { dx: 0, dz: 0, speed: 6, jump: false }; f.isBoss = d.boss; if (d.boss) { f.scale = 1.9; f.mesh.scale.setScalar(1.9); }
        f.net = new THREE.Vector3(); G.fighters.push(f); G.dynGroup.add(f.mesh); f.mesh.visible = false;
      }
      G.player = G.fighters[m.you]; G.playerTeam = G.player.team; Events.boss = null; if (World.vault) { World.vault.open = false; World.vault.wall.dead = false; }
      for (const l of m.loot) { const it = this.origMakeLoot.call(G, l[1], l[2], l[4], l[3]); it.nid = l[0]; }
      for (const c of m.chests) G.spawnChest(c[0], c[1]);
      Object.assign(G.storm, m.storm); G.stormMesh.visible = true;
      if (!G.busMesh) { G.busMesh = Models.bus(); G.scene.add(G.busMesh); }
      G.bus = m.bus; G.busPos = new THREE.Vector3(m.bus.sx, m.bus.y, m.bus.sz); G.busMesh.visible = true; G.busMesh.rotation.y = Math.atan2(-(m.bus.ex - m.bus.sx), -(m.bus.ez - m.bus.sz));
      G.camYaw = G.busMesh.rotation.y; G.camPitch = -0.25; G.shotSeq = 0; this.pickSent = {};
      HUD.reset(); Pings.reset(); Announcer.reset(); Input.resetAll(); Music.stop(); Music.start('game');
      document.body.classList.remove('victory', 'lowhp', 'knocked'); document.body.classList.add('ingame');
      this.live = true; $('loading').hidden = true; $('hud').hidden = false;
      HUD.message('Partie entre amis ! Saute du bus au-dessus de ta zone', 3.5);
    }, 60);
  },
  applySnap(m) {
    const G = Game;
    for (const a of m.f) {
      const f = G.fighters[a[0]]; if (!f) continue;
      const wasAlive = f.alive; f.alive = !!(a[7] & 1); f.knocked = !!(a[7] & 2);
      if (f === G.player) { if (G.player.state === 'bus' && a[6] !== 0) { /* l'hôte a éjecté le joueur */ G.player.state = 'fall'; G.player.pos.set(a[1], a[2], a[3]); G.player.mesh.visible = true; } continue; }
      f.net.set(a[1], a[2], a[3]); if (f.state === 'bus' || !wasAlive) f.pos.copy(f.net);
      f.yaw = a[4]; f.pitch = a[5]; f.state = ST_NAME[a[6]]; f.crouch = !!(a[7] & 4); f.ads = !!(a[7] & 8); f.emoteT = a[7] & 16 ? 1 : 0; f.slideT = a[7] & 64 ? 0.3 : 0;
      f.boxT = a[7] & 128 ? 1 : 0; f.floatT = a[7] & 256 ? 1 : 0; f.flatT = a[7] & 512 ? 1 : 0; f.netKart = a[7] & 32 ? a[11] : null;
      f.moveAmt = a[9]; f.hp = a[10]; f.parts.glider.visible = f.state === 'glide';
      if (a[8] !== f.netW) { f.netW = a[8]; f.cur = 0; if (!a[8]) f.slots[0] = null; else if (a[8].startsWith('c:')) f.slots[0] = { kind: 'cons', c: a[8].slice(2), n: 1 }; else { const [w, r] = a[8].split(':'); f.slots[0] = { kind: 'weapon', w, rar: +r, mag: 1 }; } }
      if (wasAlive && !f.alive) { f.mesh.visible = false; Effects.poof(f.pos); }
    }
    const s = m.st, st = G.storm; Object.assign(st, { cx: s[0], cz: s[1], r: s[2], nx: s[3], nz: s[4], nr: s[5], phase: s[6], timer: s[7], shrinking: !!s[8] });
    if (m.ph && m.ph !== 'end') G.phase = G.phase === 'end' ? 'end' : m.ph;
    if (m.bus) { G.busPos.set(m.bus[0], m.bus[1], m.bus[2]); G.busMesh.position.set(m.bus[0], m.bus[1], m.bus[2]); G.bus.active = true; } else { G.bus.active = false; G.busMesh.visible = false; if (G.phase === 'bus') G.phase = 'play'; }
  },
  applyPriv(m) {
    const p = Game.player; if (!p) return;
    p.slots = m.slots; p.ammo = m.ammo; if (m.cur !== p.cur && !(p.switchT > 0)) p.cur = m.cur;
    p.hp = m.hp; p.sh = m.sh; p.coins = m.coins; p.gag = m.gag; p.hasKey = m.key; p.kills = m.kills; p.knocked = m.knocked; p.bleed = m.bleed; p.reviveT = m.rev;
    p.using = m.using; p.useT = m.useT; p.reloadT = m.reloadT; Game.matchStats.damage = m.dmg || 0;
    if (m.fx) { p.floatT = m.fx[0]; p.boxT = m.fx[1]; p.slipT = Math.max(p.slipT || 0, m.fx[2]); p.flatT = m.fx[3]; p.stunT = m.fx[4]; }
    if (!m.alive && p.alive) { p.alive = false; p.mesh.visible = false; Effects.poof(p.pos); }
  },
  applyEvent(e) {
    const G = Game;
    switch (e[0]) {
      case 'la': { const it = this.origMakeLoot.call(G, e[2], e[3], e[5], e[4]); it.nid = e[1]; break; }
      case 'lt': { const it = G.loot.find(i => i.nid === e[1]); if (it && !it.taken) { it.taken = true; G.lootGroup.remove(it.mesh); } break; }
      case 'co': { const c = G.chests[e[1]]; if (c && !c.open) { c.open = true; c.mesh.geometry = Models.chest(true); if (c.pos.distanceTo(G.camPos) < 40) Sfx.chest(); } break; }
      case 'cb': { const c = World.crates[e[1]]; if (c) World.breakCrate(c); break; }
      case 'fd': HUD.feed(e[1]); break;
      case 'tr': Effects.tracer(_v1.set(e[1], e[2], e[3]), _v2.set(e[4], e[5], e[6]), e[7]); break;
      case 'fl': Effects.flash(_v1.set(e[1], e[2], e[3])); break;
      case 'bm': Effects.boom(_v1.set(e[1], e[2], e[3])); Sfx.boom(_v1.distanceTo(G.camPos)); break;
      case 'sh': if (WEAPONS[e[1]]) Sfx.shot(WEAPONS[e[1]], Math.hypot(e[2] - G.camPos.x, e[3] - G.camPos.z)); break;
      case 'hit': if (Settings.dmgNumbers) HUD.dmgNumber(_v1.set(e[1], e[2], e[3]), e[4], e[5], e[6]); HUD.hitmarker(e[5], e[7]); Sfx.hit(e[5]); Haptic.play(e[5] ? 'head' : 'hit'); if (e[5]) G.stat('head', 1); if (e[7]) { Sfx.kill(); Announcer.onPlayerKill(G.player.kills + 1); } break;
      case 'hurt': HUD.damageFrom({ x: e[1], z: e[2] }); Sfx.hurt(); Haptic.play('hurt'); break;
      case 'dead': G.deathTime = G.time; G.placement = e[1]; G.player.alive = false; G.spectating = G.fighters[e[2]] || null; setTimeout(() => G.endMatch(false), 2200); break;
      case 'end': if (!G.ended) { if (e[1]) { G.placement = 1; G.startVictory(); } else if (G.player.alive) { G.placement = 2; G.endMatch(false); } } break;
      case 'msg': HUD.message(e[1], 2.5); break;
      case 'tp': { const p = G.player; p.pos.set(e[1], e[2], e[3]); p.state = 'fall'; p.vy = 2; p.padT = 1; p.vel.set(0, 0, 0); Effects.poof(p.pos); break; }
      case 'vo': { const V = World.vault; if (V && !V.open) { V.open = true; V.wall.dead = true; } break; }
      case 'abort': this.onClosed(); break;
    }
  },
  // boucle du client : seul son propre personnage est simulé ici
  clientUpdate(dt) {
    const G = Game, p = G.player;
    if (G.slowT > 0) { G.slowT -= dt; if (G.slowT <= 0) G.timeScale = 1; }
    dt *= G.timeScale; G.time += dt;
    Input.readKeys();
    if (G.phase === 'bus' && p.state === 'bus') p.pos.copy(G.busPos);
    G.updatePlayerInput(dt);
    if (p.alive) { G.stepFighter(p, dt); const fs = G.fighters; G.fighters = [p]; G.updatePads(dt); G.fighters = fs; }
    for (const f of G.fighters) {
      if (f === p || !f.alive) continue;
      if (f.state === 'bus') { f.mesh.visible = false; continue; }
      f.pos.lerp(f.net, 1 - Math.exp(-12 * dt)); G.animate(f, dt);
      if (f.netKart != null) { f.mesh.rotation.y = f.netKart; }
    }
    // tempête (visuel + brouillard)
    const st = G.storm; G.stormMesh.visible = st.r < World.ISL + 20; G.stormMesh.position.set(st.cx, 120, st.cz); G.stormMesh.scale.set(Math.max(0.1, st.r), 1, Math.max(0.1, st.r));
    p.inStorm = p.alive && p.state !== 'bus' && dist2(p.pos.x, p.pos.z, st.cx, st.cz) > st.r * st.r;
    G.updateLootVis(dt); Effects.update(dt);
    for (const f of G.fighters) if (f.mesh.visible) Gags.visuals(f, dt);
    G.updateMusic && G.updateMusic();
    // envoi de l'état local (20 fois par seconde)
    this.sendT -= dt;
    if (this.sendT <= 0 && p.alive) this.sendState();
  },
  sendState() {
    const G = Game, p = G.player; if (!p) return;
    this.sendT = 0.05;
    {
      const o = G._o || G.camPos, d = G.camDir;
      const fl = (p.onGround ? 1 : 0) | (p.crouch ? 4 : 0) | (p.ads ? 8 : 0) | (p.emoteT > 0 ? 16 : 0) | (p.slideT > 0 ? 64 : 0);
      this.send({ t: 'in', x: +p.pos.x.toFixed(2), y: +p.pos.y.toFixed(2), z: +p.pos.z.toFixed(2), yaw: +p.yaw.toFixed(3), pitch: +p.pitch.toFixed(3), st: ST_CODE[p.state], fl, mv: +p.moveAmt.toFixed(2), seq: G.shotSeq, ox: o.x, oy: o.y, oz: o.z, dx: d.x, dy: d.y, dz: d.z, rv: p.reviving ? p.reviving.nid : -1 });
    }
  },

  // ---------- branchements (sans modifier le reste du code) ----------
  install() {
    const G = Game, self = this;
    this.origMakeLoot = G.makeLoot;
    G.makeLoot = function (data, x, z, y) { const it = self.origMakeLoot.call(this, data, x, z, y); it.nid = it.nid || (G.lootSeq = (G.lootSeq || 0) + 1); if (self.isHost && self.live) self.ev(['la'].concat(self.lootMsg(it))); return it; };
    const pick0 = G.pickup;
    G.pickup = function (f, it, auto) {
      if (self.isClient && self.live) { if (!auto || it.kind === 'ammo' || it.kind === 'coins' || it.kind === 'key' || it.kind === 'cons') { const k = it.nid; if (!self.pickSent[k] || G.time - self.pickSent[k] > 0.6) { self.pickSent[k] = G.time; if (!auto) self.send({ t: 'act', a: 'pick', nid: k }); } } return false; }
      const r = pick0.call(this, f, it, auto); if (it.taken) self.ev(['lt', it.nid]); return r;
    };
    const chest0 = G.openChest;
    G.openChest = function (c, f) { if (self.isClient && self.live) { self.send({ t: 'act', a: 'chest', i: G.chests.indexOf(c) }); return; } const i = G.chests.indexOf(c); chest0.call(this, c, f); if (i >= 0) self.ev(['co', i]); };
    const brk0 = World.breakCrate.bind(World);
    World.breakCrate = function (c) { if (!c.wall.dead) self.ev(['cb', c.i]); brk0(c); };
    const feed0 = HUD.feed.bind(HUD); HUD.feed = function (h) { feed0(h); self.ev(['fd', h]); };
    const tr0 = Effects.tracer.bind(Effects); Effects.tracer = function (a, b, thin) { tr0(a, b, thin); if (self.isHost && self.live && self.evq.length < 60) self.ev(['tr', +a.x.toFixed(2), +a.y.toFixed(2), +a.z.toFixed(2), +b.x.toFixed(2), +b.y.toFixed(2), +b.z.toFixed(2), !!thin]); };
    const bm0 = Effects.boom.bind(Effects); Effects.boom = function (p) { bm0(p); self.ev(['bm', +p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)]); };
    const sh0 = Sfx.shot.bind(Sfx); Sfx.shot = function (W, d) { sh0(W, d); if (self.isHost && self.live && self._shooter) { const k = Object.keys(WEAPONS).find(n => WEAPONS[n] === W); self.ev(['sh', k, +self._shooter.pos.x.toFixed(1), +self._shooter.pos.z.toFixed(1)]); } };
    const ps0 = playerShoot;
    playerShoot = function (f, o, d, minT) {
      if (self.isClient && self.live) { // client : effets locaux, l'hôte calcule les dégâts
        if (!canFire(f)) return false; const w = f.weapon, W = WEAPONS[w.w];
        if (W.grapple) { self.send({ t: 'act', a: 'grap' }); return ps0(f, o, d, minT); }
        G.shotSeq = (G.shotSeq || 0) + 1; muzzlePos(f, _v1);
        const t = World.ray(o.x, o.y, o.z, d.x, d.y, d.z, W.range); _v2.copy(o).addScaledVector(d, t);
        Effects.tracer(_v1, _v2, W.pellets > 1); Effects.flash(_v1); Sfx.shot(W, 0);
        w.mag = Math.max(0, w.mag - 1); f.fireT = W.rate; f.lastShotT = G.time; f.kick = 0.3; f.recoil += W.pellets > 1 || W.scope ? 0.05 : 0.014;
        if (W.burst) { if (f.burstLeft > 0) { f.burstLeft--; f.fireT = f.burstLeft > 0 ? 0.07 : W.rate; } else { f.burstLeft = W.burst - 1; f.fireT = 0.07; } }
        return false;
      }
      self._shooter = f; const r = ps0(f, o, d, minT); self._shooter = null; return r;
    };
    const ad0 = applyDamage;
    applyDamage = function (t, dmg, att, head, wtype, at) {
      if (self.isClient && self.live) return;
      const hp0 = t.hp, sh0b = t.sh; ad0(t, dmg, att, head, wtype, at);
      if (!self.isHost || !self.live) return;
      if (att && att.remote && at) self.evTo(att.remote, ['hit', +at.x.toFixed(2), +at.y.toFixed(2), +at.z.toFixed(2), dmg, !!head, sh0b > 0, t.hp <= 0 || !t.alive]);
      if (t.remote && att && att !== t) self.evTo(t.remote, ['hurt', +att.pos.x.toFixed(1), +att.pos.z.toFixed(1)]);
      void hp0;
    };
    const el0 = eliminate;
    eliminate = function (t, att, wtype, head) {
      const was = t.alive; el0(t, att, wtype, head); t.deadAt = G.time;
      if (was && self.isHost && self.live && t.remote) self.evTo(t.remote, ['dead', G.aliveTeams() + (G.fighters.some(o => o.alive && o.team === t.team) ? 0 : 1), att && att.alive ? att.nid : -1]);
      if (was && self.isHost && self.live && G.aliveTeams() <= 1 && !self.endSent) {
        self.endSent = true; const win = G.fighters.find(o => o.alive && !o.isBoss);
        for (const id in self.remote) self.evTo(+id, ['end', !!(win && win.team === self.remote[id].team)]);
      }
    };
    // actions du client → envoyées à l'hôte
    const wrapAct = (obj, name, build) => { const o0 = obj[name]; obj[name] = function (...a) { if (self.isClient && self.live) { const m = build(...a); if (m) self.send(Object.assign({ t: 'act' }, m)); return m && m.local ? o0.apply(this, a) : undefined; } return o0.apply(this, a); }; };
    wrapAct(G, 'useItem', f => ({ a: 'use', i: f.cur }));
    wrapAct(G, 'throwGrenade', f => ({ a: 'throw', i: f.cur }));
    wrapAct(Gags, 'use', (f, tgt) => ({ a: 'gag', tgt: tgt ? [tgt.x, tgt.y, tgt.z] : null }));
    wrapAct(Events, 'openVault', () => ({ a: 'vault' }));
    wrapAct(G, 'enterKart', () => { HUD.message('Véhicules indisponibles en multijoueur (client)', 1.5); return null; });
    wrapAct(Events, 'openShop', () => { HUD.message('Boutique réservée à l\'hôte en multijoueur', 1.5); return null; });
    wrapAct(G, 'jumpFromBus', f => (f.isPlayer ? { a: 'jumpBus', local: true } : { local: true }));
    const sel0 = G.selectSlot; G.selectSlot = function (i) { sel0.call(this, i); if (self.isClient && self.live) self.send({ t: 'act', a: 'slot', i: G.player.cur }); };
    const rl0 = startReload; startReload = function (f) { if (self.isClient && self.live && f.isPlayer) { self.send({ t: 'act', a: 'reload' }); return; } return rl0(f); };
    // la boucle : l'hôte publie l'état, le client ne simule que lui-même
    const up0 = G.update; G.update = function (dt) { if (self.isClient && self.live) return self.clientUpdate(dt); up0.call(this, dt); if (self.isHost && self.live) self.hostTick(dt * this.timeScale || dt); };
    const sf0 = G.stepFighter; G.stepFighter = function (f, dt) { if (f.remote) return self.remoteStep(f, dt); return sf0.call(this, f, dt); };
    const ov = Events.openVault; Events.openVault = function (f) { const was = World.vault && World.vault.open; ov.call(this, f); if (!was && World.vault && World.vault.open) self.ev(['vo']); };
    const tp0 = Gags.teleport.bind(Gags); Gags.teleport = function (f) { tp0(f); if (f.remote) self.evTo(f.remote, ['tp', f.pos.x, f.pos.y, f.pos.z]); };
    const q0 = G.quitToLobby; G.quitToLobby = function () { if (self.live) { if (self.isHost) { self.send({ t: 'e', l: [['abort']] }); self.send({ t: 'lobby' }); } self.live = false; self.isClient = false; self.endSent = false; } return q0.call(this); };
  },
};
