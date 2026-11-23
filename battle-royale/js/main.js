// ============ TOON ROYALE — démarrage ============
'use strict';
window.addEventListener('load', () => {
  if (!window.THREE) { document.getElementById('splashTxt').textContent = 'Impossible de charger le moteur 3D. Vérifie ta connexion puis recharge la page.'; return; }
  Sfx.setVol(Settings.vol); Meta.init();
  Net.install();
  Input.init();
  HUD.init(); Pings.init();
  setTimeout(() => {
    try { Game.init(); UI.init(); }
    catch (e) { console.error(e); document.getElementById('splashTxt').textContent = 'Erreur au chargement : ' + e.message; return; }
    const sp = document.getElementById('splash');
    document.getElementById('splashTxt').textContent = 'TOUCHE POUR JOUER'; sp.classList.add('ready');
    const go = () => {
      sp.removeEventListener('pointerdown', go);
      Sfx.init(); Sfx.musicOn = Settings.music; Sfx.startMusic(); Sfx.chest();
      try { const SO = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.ScreenOrientation; if (SO) SO.lock({ orientation: 'landscape' }); } catch (e) { }
      if (Input.isTouch && !window.Capacitor) {
        const d = document.documentElement;
        try { const r = (d.requestFullscreen || d.webkitRequestFullscreen || (() => null)).call(d, { navigationUI: 'hide' }); if (r && r.then) r.then(() => { try { screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } }).catch(() => { }); } catch (e) { }
      }
      sp.classList.add('out'); document.body.classList.remove('splashing'); setTimeout(() => { sp.hidden = true; }, 500);
    };
    sp.addEventListener('pointerdown', go);
  }, 60);
  document.addEventListener('visibilitychange', () => { if (document.hidden && Game.phase !== 'lobby' && !Game.paused && !Game.ended) UI.togglePause(true); });
  window.__TR = { Game, World, UI, Settings, Profile };
  // mode hors ligne (version hébergée uniquement ; ignoré dans les aperçus intégrés)
  try { if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && window.top === window && !window.Capacitor) navigator.serviceWorker.register('sw.js').catch(() => { }); } catch (e) { }
});
