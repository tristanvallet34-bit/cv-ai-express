// ============ TOON ROYALE — démarrage ============
'use strict';
window.addEventListener('load', () => {
  if (!window.THREE) { document.body.innerHTML = '<p style="padding:24px;font-family:sans-serif">Impossible de charger le moteur 3D. Vérifie ta connexion puis recharge la page.</p>'; return; }
  Sfx.setVol(Settings.vol);
  Input.init();
  HUD.init();
  Game.init();
  UI.init();
  // premier geste : active l'audio (règle des navigateurs)
  const unlock = () => { Sfx.init(); Sfx.musicOn = Settings.music; if (Game.phase === 'lobby') Sfx.startMusic(); window.removeEventListener('pointerdown', unlock); };
  window.addEventListener('pointerdown', unlock);
  // pause auto quand l'app passe en arrière-plan
  document.addEventListener('visibilitychange', () => { if (document.hidden && Game.phase !== 'lobby' && !Game.paused && !Game.ended) UI.togglePause(true); });
  window.__TR = { Game, World, UI, Settings, Profile };
});
