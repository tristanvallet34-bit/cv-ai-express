// ============ TOON ROYALE — démarrage ============
'use strict';
window.addEventListener('load', () => {
  if (!window.THREE) { document.getElementById('splashTxt').textContent = 'Impossible de charger le moteur 3D. Vérifie ta connexion puis recharge la page.'; return; }
  Sfx.setVol(Settings.vol);
  Input.init();
  HUD.init();
  setTimeout(() => {
    try { Game.init(); UI.init(); }
    catch (e) { console.error(e); document.getElementById('splashTxt').textContent = 'Erreur au chargement : ' + e.message; return; }
    const sp = document.getElementById('splash');
    document.getElementById('splashTxt').textContent = 'TOUCHE POUR JOUER'; sp.classList.add('ready');
    const go = () => {
      sp.removeEventListener('pointerdown', go);
      Sfx.init(); Sfx.musicOn = Settings.music; Sfx.startMusic(); Sfx.chest();
      if (Input.isTouch) {
        const d = document.documentElement;
        try { const r = (d.requestFullscreen || d.webkitRequestFullscreen || (() => null)).call(d, { navigationUI: 'hide' }); if (r && r.then) r.then(() => { try { screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } }).catch(() => { }); } catch (e) { }
      }
      sp.classList.add('out'); document.body.classList.remove('splashing'); setTimeout(() => { sp.hidden = true; }, 500);
    };
    sp.addEventListener('pointerdown', go);
  }, 60);
  document.addEventListener('visibilitychange', () => { if (document.hidden && Game.phase !== 'lobby' && !Game.paused && !Game.ended) UI.togglePause(true); });
  window.__TR = { Game, World, UI, Settings, Profile };
});
