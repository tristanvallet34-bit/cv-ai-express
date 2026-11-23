// Copie le jeu dans www/ pour Capacitor, avec Three.js embarqué (fonctionne hors ligne)
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
const SRC = '..', OUT = 'www';
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT + '/vendor', { recursive: true });
for (const f of ['style.css', 'icon.svg', 'manifest.webmanifest']) cpSync(`${SRC}/${f}`, `${OUT}/${f}`);
for (const d of ['js', 'icons']) cpSync(`${SRC}/${d}`, `${OUT}/${d}`, { recursive: true });
const three = 'node_modules/three/build/three.min.js';
if (!existsSync(three)) { console.error('Lance d\'abord « npm install »'); process.exit(1); }
cpSync(three, `${OUT}/vendor/three.min.js`);
let html = readFileSync(`${SRC}/index.html`, 'utf8')
  .replace(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r128\/three\.min\.js/, 'vendor/three.min.js')
  .replace('<link rel="manifest" href="manifest.webmanifest">', '');
writeFileSync(`${OUT}/index.html`, html);
console.log('www/ prêt :', html.length, 'octets de HTML');
