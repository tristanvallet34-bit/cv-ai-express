// Force le mode paysage et le plein écran dans les projets natifs générés par Capacitor
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const man = 'android/app/src/main/AndroidManifest.xml';
if (existsSync(man)) {
  let x = readFileSync(man, 'utf8');
  if (!x.includes('screenOrientation')) x = x.replace('<activity', '<activity\n            android:screenOrientation="sensorLandscape"');
  writeFileSync(man, x); console.log('Android : paysage forcé');
}
const plist = 'ios/App/App/Info.plist';
if (existsSync(plist)) {
  let x = readFileSync(plist, 'utf8');
  const land = '<array>\n\t\t<string>UIInterfaceOrientationLandscapeLeft</string>\n\t\t<string>UIInterfaceOrientationLandscapeRight</string>\n\t</array>';
  x = x.replace(/(<key>UISupportedInterfaceOrientations<\/key>\s*)<array>[\s\S]*?<\/array>/, `$1${land}`);
  x = x.replace(/(<key>UISupportedInterfaceOrientations~ipad<\/key>\s*)<array>[\s\S]*?<\/array>/, `$1${land}`);
  if (!x.includes('UIStatusBarHidden')) x = x.replace('<dict>', '<dict>\n\t<key>UIStatusBarHidden</key>\n\t<true/>\n\t<key>UIViewControllerBasedStatusBarAppearance</key>\n\t<false/>');
  writeFileSync(plist, x); console.log('iOS : paysage forcé, barre d\'état masquée');
}
