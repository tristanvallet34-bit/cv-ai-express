// ============ TOON ROYALE — menus, casier, passe, défis, paramètres ============
'use strict';

const SETTINGS_UI = [
  { sec: 'Graphismes & performances' },
  { k: 'quality', n: 'Qualité graphique', t: 'select', opts: { auto: 'Auto (s\'adapte au téléphone)', low: 'Économie (vieux téléphones)', medium: 'Équilibré', high: 'Beau (ombres)', ultra: 'Ultra' } },
  { k: 'fpsCap', n: 'Images par seconde', t: 'select', opts: { 30: '30 FPS (économise la batterie)', 60: '60 FPS (fluide)' } },
  { k: 'fov', n: 'Champ de vision', t: 'range', min: 55, max: 95, step: 1, fmt: v => v + '°' },
  { k: 'showFps', n: 'Afficher les FPS', t: 'toggle' },
  { k: 'camShake', n: 'Tremblement de caméra', t: 'toggle' },
  { k: 'timeOfDay', n: 'Ambiance des parties', t: 'select', opts: { random: 'Aléatoire', morning: 'Matin rose', day: 'Plein soleil', sunset: 'Coucher de soleil', night: 'Nuit étoilée' } },
  { sec: 'Contrôles' },
  { k: 'sens', n: 'Sensibilité caméra', t: 'range', min: 0.3, max: 2.5, step: 0.05, fmt: v => v.toFixed(2) },
  { k: 'adsSens', n: 'Sensibilité en visée', t: 'range', min: 0.2, max: 1.5, step: 0.05, fmt: v => v.toFixed(2) },
  { k: 'invertY', n: 'Inverser l\'axe vertical', t: 'toggle' },
  { k: 'aimAssist', n: 'Assistance de visée', t: 'toggle', d: 'Ralentit la caméra et suit légèrement la cible' },
  { k: 'autoFire', n: 'Tir automatique', t: 'toggle', d: 'Tire tout seul quand le réticule passe sur un ennemi' },
  { k: 'leftFire', n: 'Bouton de tir à gauche', t: 'toggle', d: 'Un 2e bouton de tir au-dessus du joystick' },
  { k: 'leftHanded', n: 'Mode gaucher', t: 'toggle', d: 'Inverse le joystick et les boutons' },
  { k: 'sprintAuto', n: 'Sprint automatique', t: 'toggle', d: 'Pousse le joystick à fond vers l\'avant pour sprinter' },
  { k: 'autoPickup', n: 'Ramassage automatique', t: 'toggle' },
  { k: 'hudScale', n: 'Taille de l\'interface', t: 'range', min: 0.7, max: 1.4, step: 0.05, fmt: v => Math.round(v * 100) + '%' },
  { k: 'minimapZoom', n: 'Zoom de la mini-carte', t: 'range', min: 0.6, max: 2, step: 0.1, fmt: v => '×' + v.toFixed(1) },
  { sec: 'Audio & vibrations' },
  { k: 'vol', n: 'Volume général', t: 'range', min: 0, max: 1, step: 0.05, fmt: v => Math.round(v * 100) + '%' },
  { k: 'music', n: 'Musique', t: 'toggle', d: 'Musique dynamique qui s\'intensifie avec l\'action' },
  { k: 'announcer', n: 'Annonceur vocal', t: 'toggle', d: 'Doublé, Triplé, Top 10… annoncés à voix haute' },
  { k: 'vibration', n: 'Vibrations', t: 'toggle' },
  { sec: 'Partie' },
  { k: 'name', n: 'Pseudo', t: 'text' },
  { k: 'botLevel', n: 'Difficulté des bots', t: 'select', opts: { easy: 'Facile', normal: 'Normal', hard: 'Difficile' } },
  { k: 'dmgNumbers', n: 'Nombres de dégâts', t: 'toggle' },
  { k: 'soundViz', n: 'Visualiser les sons', t: 'toggle', d: 'Affiche la direction des tirs et des pas ennemis autour du réticule' },
];

const UI = {
  mode: Store.get('mode', 'solo'), lobbyScene: null, tab: 'play', lockerTab: 'skins',
  init() {
    ensureDaily();
    this.buildLobbyScene();
    this.bind();
    this.applyBodyClasses();
    this.showLobby();
  },
  applyBodyClasses() {
    document.body.classList.toggle('leftfire', Settings.leftFire);
    document.body.classList.toggle('lefthanded', Settings.leftHanded);
    document.body.classList.toggle('touch', Input.isTouch);
  },
  bind() {
    document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { Sfx.init(); Sfx.click(); this.openTab(b.dataset.tab); }));
    $('playBtn').addEventListener('click', () => this.play());
    $('panelClose').addEventListener('click', () => { Sfx.click(); this.openTab('play'); });
    $('playSide').querySelector('.modes').innerHTML = MODE_ORDER.map(k => `<button class="mode" data-mode="${k}"><b>${MODES[k].n}</b><small>${MODES[k].desc}</small></button>`).join('');
    document.querySelectorAll('.mode').forEach(m => m.addEventListener('click', () => { Sfx.init(); Sfx.click(); this.mode = m.dataset.mode; Store.set('mode', this.mode); this.renderModes(); }));
    $('resumeBtn').addEventListener('click', () => this.togglePause(false));
    $('pauseSettings').addEventListener('click', () => { this.openTab('settings'); $('panel').classList.add('over'); });
    $('quitBtn').addEventListener('click', () => { this.togglePause(false); if (Game.mode && Game.mode.training) { Game.quitToLobby(); return; } if (Game.player && Game.player.alive && !Game.ended) { Game.player.hp = 0; Game.endMatch(false); } else Game.quitToLobby(); });
    $('endLobby').addEventListener('click', () => { $('endScreen').hidden = true; Game.quitToLobby(); });
    $('endAgain').addEventListener('click', () => { $('endScreen').hidden = true; Game.quitToLobby(); this.play(); });
    $('endWatch').addEventListener('click', () => { $('endScreen').hidden = true; $('specBar').hidden = false; });
    $('specQuit').addEventListener('click', () => { $('specBar').hidden = true; Game.quitToLobby(); });
    $('specNext').addEventListener('click', () => { const alive = Game.fighters.filter(f => f.alive); if (!alive.length) return; const i = alive.indexOf(Game.spectating); Game.spectating = alive[(i + 1) % alive.length]; });
    $('fsBtn').addEventListener('click', () => { const d = document.documentElement; try { const r = (d.requestFullscreen || d.webkitRequestFullscreen).call(d); if (r && r.catch) r.catch(() => { }); } catch (e) { } try { screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } });
    $('pauseBtn').addEventListener('pointerdown', e => { e.stopPropagation(); this.togglePause(); });
    $('exitKart').addEventListener('pointerdown', e => { e.stopPropagation(); Input.pressed.exitKart = true; });
    $('lobbyCv').addEventListener('pointerdown', e => { this.drag = { x: e.clientX }; });
    window.addEventListener('pointermove', e => { if (this.drag && Game.phase === 'lobby') { this.charRot += (e.clientX - this.drag.x) * 0.01; this.drag.x = e.clientX; } });
    window.addEventListener('pointerup', () => this.drag = null);
    $('danceBtn').addEventListener('click', () => { this.danceT = 3; Sfx.init(); [523, 659, 784, 659, 523].forEach((f, i) => setTimeout(() => Sfx.tone(f, 0.15, 0.15, 'square'), i * 120)); });
  },
  // ---------- scène 3D du lobby ----------
  buildLobbyScene() {
    const s = new THREE.Scene(); this.lobbyScene = s;
    s.add(new THREE.HemisphereLight(0xffffff, 0x7b4fd6, 0.9));
    const d = new THREE.DirectionalLight(0xffffff, 0.7); d.position.set(3, 5, 4); s.add(d);
    const pod = new GeoBuilder();
    pod.addGeo(new THREE.CylinderGeometry(1.5, 1.7, 0.4, 24), M4(0, -0.2, 0), '#ffcf3f');
    pod.addGeo(new THREE.CylinderGeometry(1.55, 1.55, 0.06, 24), M4(0, 0.02, 0), '#ff4f8b');
    const podM = new THREE.Mesh(pod.build(), Look.mat({ vertexColors: true })); s.add(podM); if (Look.toon) Look.addOutline(podM, 0.03);
    const rim = new THREE.DirectionalLight(0xff9adf, 0.6); rim.position.set(-4, 3, -4); s.add(rim);
    this.lobbyCam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    this.charRot = 0.4; this.danceT = 0;
    this.setLobbyChar();
  },
  setLobbyChar() {
    if (this.lobbyChar) this.lobbyScene.remove(this.lobbyChar.mesh);
    const f = new Fighter({ name: 'preview', team: 0, isPlayer: true, skin: Profile.skin, glider: Profile.glider });
    f.slots[0] = { kind: 'weapon', w: 'ar', rar: 4, mag: 30 }; f.refreshGun();
    this.lobbyChar = f; this.lobbyScene.add(f.mesh);
    f.parts.glider.visible = this.lockerTab === 'gliders' && this.tab === 'locker';
    f.parts.glider.position.y = 0.4;
  },
  renderLobby(dt) {
    const R = Game.renderer, cv = $('lobbyCv');
    this.t = (this.t || 0) + dt;
    // fond : survol cinématique de l'île
    const C = Game.camera, a = this.t * 0.035 + 0.6, P = World.pois[5];
    C.position.set(P.x + Math.cos(a) * 150, 62 + Math.sin(this.t * 0.2) * 6, P.z + Math.sin(a) * 150);
    C.lookAt(P.x, 6, P.z); C.fov = 55; C.updateProjectionMatrix();
    Game.camPos.copy(C.position); World.sky.position.set(C.position.x, 0, C.position.z);
    const so = Look.sunOff; Game.sun.position.set(P.x + so.x, so.y, P.z + so.z); Game.sun.target.position.set(P.x, 0, P.z);
    Look.update(dt, C.position);
    R.setScissorTest(false); Game.renderScene();
    // personnage sur son podium
    const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h || $('lobby').hidden || document.body.classList.contains('splashing')) return;
    const f = this.lobbyChar, Pp = f.parts;
    if (!this.drag) this.charRot += dt * 0.35;
    f.mesh.rotation.y = this.charRot;
    if (this.danceT > 0) {
      this.danceT -= dt; Pp.body.position.y = Math.abs(Math.sin(this.t * 9)) * 0.3; Pp.arms.rotation.x = Math.sin(this.t * 9) * 1.2 + 1.4;
      Pp.legL.rotation.x = Math.sin(this.t * 9) * 0.6; Pp.legR.rotation.x = -Math.sin(this.t * 9) * 0.6; f.mesh.rotation.y += Math.sin(this.t * 4) * 0.5;
    } else { Pp.body.position.y = Math.sin(this.t * 2) * 0.02; Pp.arms.rotation.x = -0.15 + Math.sin(this.t * 2) * 0.03; Pp.legL.rotation.x = Pp.legR.rotation.x = 0; }
    Pp.arms.position.y = 1.38 + Pp.body.position.y;
    const gl = Pp.glider.visible;
    const far = w / h < 0.9 ? 1.6 : 1; this.lobbyCam.aspect = w / h; this.lobbyCam.position.set(0, gl ? 2.4 : 1.4, (gl ? 9 : 6.2) * far); this.lobbyCam.lookAt(0, gl ? 1.4 : 1.0, 0); this.lobbyCam.updateProjectionMatrix();
    const rect = cv.getBoundingClientRect(); const H = window.innerHeight;
    R.autoClear = false; R.clearDepth();
    R.setScissorTest(true);
    R.setViewport(rect.left, H - rect.bottom, rect.width, rect.height); R.setScissor(rect.left, H - rect.bottom, rect.width, rect.height);
    R.render(this.lobbyScene, this.lobbyCam);
    R.setScissorTest(false); R.setViewport(0, 0, window.innerWidth, window.innerHeight); R.autoClear = true;
  },
  showLobby() {
    Game.phase = 'lobby';
    $('lobby').hidden = false; $('hud').hidden = true; $('endScreen').hidden = true; $('pause').hidden = true; $('specBar').hidden = true;
    Look.applyTime('sunset'); Game.scene.fog.near = 120; Game.scene.fog.far = 700;
    document.body.classList.add('inlobby');
    this.renderTop(); this.renderModes(); this.openTab('play'); this.setLobbyChar();
    Sfx.musicOn = Settings.music; if (Sfx.ctx) Sfx.startMusic();
  },
  renderTop() {
    const need = XP_FOR(Profile.lvl);
    $('lvlNum').textContent = Profile.lvl; $('xpFill').style.width = (Profile.xp / need * 100) + '%';
    $('xpTxt').textContent = Profile.xp + ' / ' + need + ' XP'; $('pName').textContent = Settings.name;
    $('dailyMini').innerHTML = Profile.daily.list.map(c => `<div class="dm ${c.done ? 'done' : ''}"><span>${c.text}</span><i style="--p:${Math.min(1, c.prog / c.n)}"></i></div>`).join('');
    const sk = SKINS.find(s => s.id === Profile.skin); $('skinName').textContent = sk ? sk.n : '';
  },
  renderModes() {
    document.querySelectorAll('.mode').forEach(m => m.classList.toggle('sel', m.dataset.mode === this.mode));
    $('botTag').textContent = 'Bots : ' + BOT_LEVELS[Settings.botLevel].n;
  },
  openTab(tab) {
    this.tab = tab;
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('sel', b.dataset.tab === tab));
    const panel = $('panel');
    if (tab === 'play') { panel.hidden = true; panel.classList.remove('over'); $('playSide').hidden = false; this.setLobbyChar(); return; }
    panel.hidden = false; $('playSide').hidden = true;
    const body = $('panelBody'); const title = $('panelTitle');
    if (tab === 'locker') { title.textContent = 'Casier'; this.renderLocker(body); }
    if (tab === 'pass') { title.textContent = 'Passe Toon — Saison 1'; this.renderPass(body); }
    if (tab === 'daily') { title.textContent = 'Défis du jour'; this.renderDaily(body); }
    if (tab === 'stats') { title.textContent = 'Carrière'; this.renderStats(body); }
    if (tab === 'settings') { title.textContent = 'Paramètres'; this.renderSettings(body); }
    if (tab === 'help') { title.textContent = 'Comment jouer'; this.renderHelp(body); }
    this.setLobbyChar();
  },
  renderLocker(body) {
    const tabs = `<div class="subtabs"><button class="${this.lockerTab === 'skins' ? 'sel' : ''}" data-lt="skins">Tenues</button><button class="${this.lockerTab === 'gliders' ? 'sel' : ''}" data-lt="gliders">Planeurs</button></div>`;
    const list = this.lockerTab === 'skins' ? SKINS : GLIDERS; const cur = this.lockerTab === 'skins' ? Profile.skin : Profile.glider;
    body.innerHTML = tabs + '<div class="grid">' + list.map(s => {
      const locked = Profile.lvl < s.lvl; const sw = this.lockerTab === 'skins' ? [s.shirt, s.pants, s.hatc] : [s.a, s.b, '#ffffff'];
      return `<button class="card ${s.id === cur ? 'sel' : ''} ${locked ? 'locked' : ''}" data-id="${s.id}"><div class="sw">${sw.map(c => `<i style="background:${c}"></i>`).join('')}</div><b>${s.n}</b><small>${locked ? '🔒 Niveau ' + s.lvl : s.id === cur ? 'Équipé' : 'Équiper'}</small></button>`;
    }).join('') + '</div>';
    body.querySelectorAll('[data-lt]').forEach(b => b.addEventListener('click', () => { this.lockerTab = b.dataset.lt; Sfx.click(); this.renderLocker(body); this.setLobbyChar(); }));
    body.querySelectorAll('.card').forEach(b => b.addEventListener('click', () => {
      const s = list.find(x => x.id === b.dataset.id); if (Profile.lvl < s.lvl) { Sfx.tone(200, 0.15, 0.2, 'square'); return; }
      if (this.lockerTab === 'skins') Profile.skin = s.id; else Profile.glider = s.id; saveProfile(); Sfx.pickup();
      this.renderLocker(body); this.setLobbyChar(); this.renderTop();
    }));
  },
  renderPass(body) {
    const rewards = {};
    SKINS.forEach(s => { if (s.lvl > 1) rewards[s.lvl] = (rewards[s.lvl] || []).concat({ t: 'Tenue', n: s.n, c: s.shirt }); });
    GLIDERS.forEach(g => { if (g.lvl > 1) rewards[g.lvl] = (rewards[g.lvl] || []).concat({ t: 'Planeur', n: g.n, c: g.a }); });
    let html = `<p class="lead">Gagne de l'XP en jouant (éliminations, survie, coffres, défis) pour débloquer des récompenses. Tu es au <b>niveau ${Profile.lvl}</b>.</p><div class="pass">`;
    for (let l = 2; l <= 30; l++) {
      const r = rewards[l]; const got = Profile.lvl >= l;
      html += `<div class="tier ${got ? 'got' : ''} ${l === Profile.lvl + 1 ? 'next' : ''}"><em>${l}</em>${r ? r.map(x => `<div class="rw"><i style="background:${x.c}"></i><span><small>${x.t}</small>${x.n}</span></div>`).join('') : `<div class="rw"><i class="xpi"></i><span><small>Badge</small>Étoile de palier ${l}</span></div>`}</div>`;
    }
    body.innerHTML = html + '</div>';
    const nx = body.querySelector('.tier.next'); if (nx) setTimeout(() => nx.scrollIntoView({ block: 'nearest', inline: 'center' }), 50);
  },
  renderDaily(body) {
    ensureDaily();
    const h = new Date(); const left = 24 - h.getHours();
    body.innerHTML = `<p class="lead">Trois nouveaux défis chaque jour. Nouveaux défis dans environ ${left} h.</p>` + Profile.daily.list.map(c => `<div class="chal ${c.done ? 'done' : ''}"><div><b>${c.text}</b><small>${c.done ? 'Terminé ✔' : Math.floor(c.prog) + ' / ' + c.n}</small></div><div class="bar"><i style="width:${Math.min(100, c.prog / c.n * 100)}%"></i></div><span class="xp">+${c.xp} XP</span></div>`).join('');
  },
  renderStats(body) {
    const S = Profile.stats; const kd = S.deaths ? (S.kills / S.deaths).toFixed(2) : S.kills.toFixed(2);
    const winr = S.games ? Math.round(S.wins / S.games * 100) : 0;
    const items = [['Parties', S.games], ['Victoires', S.wins], ['% victoire', winr + '%'], ['Top 10', S.top10], ['Éliminations', S.kills], ['Ratio É/M', kd], ['Record élim.', S.bestKills], ['Tirs à la tête', S.headshots], ['Dégâts', S.damage], ['Temps survécu', Math.round(S.timeAlive) + ' min']];
    const hist = Profile.history.map(h => `<tr><td>${new Date(h.d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</td><td>${MODES[h.mode] ? MODES[h.mode].n : h.mode}</td><td class="${h.place === 1 ? 'gold' : ''}">#${h.place}</td><td>${h.kills}</td><td>${h.dmg}</td></tr>`).join('');
    body.innerHTML = `<div class="stats">${items.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('')}</div><h4>Dernières parties</h4>${hist ? `<div class="tw"><table><tr><th>Date</th><th>Mode</th><th>Place</th><th>Élim.</th><th>Dégâts</th></tr>${hist}</table></div>` : '<p class="lead">Aucune partie jouée pour l\'instant. Lance-toi !</p>'}`;
  },
  renderSettings(body) {
    let html = '';
    for (const s of SETTINGS_UI) {
      if (s.sec) { html += `<h4>${s.sec}</h4>`; continue; }
      const v = Settings[s.k]; const id = 'set_' + s.k;
      let ctl = '';
      if (s.t === 'toggle') ctl = `<label class="tg"><input type="checkbox" id="${id}" ${v ? 'checked' : ''}><i></i></label>`;
      else if (s.t === 'range') ctl = `<div class="rg"><input type="range" id="${id}" min="${s.min}" max="${s.max}" step="${s.step}" value="${v}"><output>${s.fmt(+v)}</output></div>`;
      else if (s.t === 'select') ctl = `<select id="${id}">${Object.entries(s.opts).map(([k, n]) => `<option value="${k}" ${String(v) === k ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
      else if (s.t === 'text') ctl = `<input type="text" id="${id}" maxlength="14" value="${String(v).replace(/"/g, '')}">`;
      html += `<div class="set"><label for="${id}"><b>${s.n}</b>${s.d ? `<small>${s.d}</small>` : ''}</label>${ctl}</div>`;
    }
    html += `<div class="setBtns"><button id="resetSet" class="ghost">Réinitialiser les paramètres</button><button id="resetProf" class="ghost danger">Effacer ma progression</button></div><p id="confirmBox" class="lead" hidden></p>`;
    body.innerHTML = html;
    for (const s of SETTINGS_UI) {
      if (s.sec) continue; const el = $('set_' + s.k);
      el.addEventListener(s.t === 'range' || s.t === 'text' ? 'input' : 'change', () => {
        let v = s.t === 'toggle' ? el.checked : s.t === 'range' ? +el.value : s.k === 'fpsCap' ? +el.value : el.value;
        if (s.k === 'name') v = v.trim().slice(0, 14) || 'Joueur';
        Settings[s.k] = v; saveSettings();
        if (s.t === 'range') el.nextElementSibling.textContent = s.fmt(v);
        this.applySetting(s.k);
      });
    }
    $('resetSet').addEventListener('click', () => { Object.assign(Settings, SETTINGS_DEF); saveSettings(); ['quality', 'vol', 'hudScale', 'leftFire', 'music'].forEach(k => this.applySetting(k)); this.renderSettings(body); });
    $('resetProf').addEventListener('click', e => {
      const b = e.currentTarget;
      if (b.dataset.armed) { Store.set('profile', null); location.reload(); return; }
      b.dataset.armed = '1'; b.textContent = 'Appuie encore pour confirmer'; setTimeout(() => { delete b.dataset.armed; b.textContent = 'Effacer ma progression'; }, 3000);
    });
  },
  applySetting(k) {
    if (k === 'quality') { Game.dynScale = 1; Game.applyQuality(); }
    if (k === 'vol') Sfx.setVol(Settings.vol);
    if (k === 'hudScale') Game.resize();
    if (k === 'fov' && Game.camera) { Game.camera.fov = Settings.fov; Game.camera.updateProjectionMatrix(); }
    if (k === 'leftFire' || k === 'leftHanded') this.applyBodyClasses();
    if (k === 'music') { Sfx.musicOn = Settings.music; Music.setEnabled(Settings.music); if (Game.phase === 'lobby') Sfx.startMusic(); }
    if (k === 'name' || k === 'botLevel') { this.renderTop(); this.renderModes(); }
  },
  renderHelp(body) {
    body.innerHTML = `<div class="help">
      <div><h4>📱 Sur téléphone</h4><p><b>Côté gauche</b> : glisse pour te déplacer (pousse à fond vers l'avant pour sprinter).<br><b>Côté droit</b> : glisse pour tourner la caméra.<br><b>Bouton rouge</b> : tirer — tu peux le faire glisser pour viser en même temps.<br>Les autres boutons : viser, sauter, s'accroupir, recharger, soigner, ramasser.</p></div>
      <div><h4>⌨️ Sur ordinateur</h4><p><b>ZQSD / WASD</b> se déplacer · <b>Souris</b> viser · <b>Clic</b> tirer · <b>Clic droit</b> viser · <b>Espace</b> sauter · <b>C</b> accroupi · <b>R</b> recharger · <b>E</b> ramasser/ouvrir · <b>H</b> soin rapide · <b>1-5</b> objets · <b>M</b> carte · <b>Maj</b> sprint · <b>Échap</b> pause</p></div>
      <div><h4>🚌 Le déroulement</h4><p>Saute du Bus Volant au-dessus de la zone qui te plaît, plane jusqu'au sol, fouille les maisons et les <b>coffres dorés</b>. La <b>tempête violette</b> se resserre : reste dans le cercle blanc de la carte. Le dernier joueur (ou duo) en vie gagne.</p></div>
      <div><h4>🎒 Le loot</h4><p>Rareté : <span style="color:${RARITY[0].c}">Commun</span> · <span style="color:${RARITY[1].c}">Peu commun</span> · <span style="color:${RARITY[2].c}">Rare</span> · <span style="color:${RARITY[3].c}">Épique</span> · <span style="color:${RARITY[4].c}">Légendaire</span>. Plus c'est rare, plus ça fait mal. Les <b>ravitaillements</b> qui tombent du ciel contiennent du légendaire.</p></div>
      <div><h4>❤️ Santé & bouclier</h4><p>Bandages (jusqu'à 75 PV), Trousse de soins (100 PV), Mini-bouclier (jusqu'à 50), Méga-bouclier (jusqu'à 100), Soda (un peu des deux). Le bouclier absorbe les dégâts en premier, sauf ceux de la tempête.</p></div>
      <div><h4>💡 Astuces</h4><p>Les tirs à la tête font beaucoup plus mal. Accroupi dans un buisson, tu es presque invisible de loin. Les karts traversent la carte vite et peuvent renverser les adversaires. Vise plus haut que la cible au sniper sur longue distance… ou pas, les balles sont instantanées !</p></div>
    </div>`;
  },
  play() {
    Sfx.init(); Sfx.click();
    $('loading').hidden = false; $('lobby').hidden = true;
    document.body.classList.remove('inlobby');
    setTimeout(() => {
      try { Game.startMatch(this.mode); } catch (e) { console.error(e); $('loading').querySelector('p').textContent = 'Erreur : ' + e.message; return; }
      $('loading').hidden = true; $('hud').hidden = false;
      if (!Input.isTouch) HUD.message('Clique pour contrôler la caméra avec la souris', 3);
    }, 60);
  },
  togglePause(force) {
    if (Game.phase === 'lobby' || Game.phase === 'end' && !$('specBar').hidden) return;
    const on = force === undefined ? !Game.paused : force;
    Game.paused = on; $('pause').hidden = !on;
    if (!on) { $('panel').hidden = true; $('panel').classList.remove('over'); }
    if (on && document.pointerLockElement) document.exitPointerLock();
    Input.resetAll();
  },
  showEnd(r) {
    const el = $('endScreen'); el.hidden = false; el.classList.toggle('win', r.win);
    $('endPlace').innerHTML = r.win ? '<span>#1</span>VICTOIRE !' : `<span>#${r.place}</span>${r.place <= 5 ? 'Presque !' : r.place <= 10 ? 'Top 10 !' : 'Éliminé·e'}`;
    $('endSub').textContent = Game.mode.rumble ? `Mêlée générale · ${Game.teamKills[0]} à ${Game.teamKills[1]}` : `sur ${r.teams > 1 ? r.players / r.teams + ' équipes' : r.players + ' joueurs'}`;
    $('endStats').innerHTML = [['Éliminations', r.kills], ['Dégâts', r.dmg], ['Survie', Math.floor(r.survived) + ' min ' + Math.round((r.survived % 1) * 60) + ' s']].map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('');
    $('endXp').innerHTML = Object.entries(r.xp).filter(([, v]) => v > 0).map(([k, v]) => `<div><span>${k[0].toUpperCase() + k.slice(1)}</span><b>+${v}</b></div>`).join('') + `<div class="tot"><span>Total</span><b>+${r.total} XP</b></div>` + (r.lvlUp ? `<div class="lvlup">NIVEAU ${r.lvl} ATTEINT !</div>` : '') + r.done.map(d => `<div class="chd">✔ Défi : ${d}</div>`).join('');
    $('endWatch').hidden = r.win || !Game.fighters.some(f => f.alive && !f.isPlayer);
    if (!Game.spectating) Game.spectating = Game.fighters.find(f => f.alive) || null;
  },
};
