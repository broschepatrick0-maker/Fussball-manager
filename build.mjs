// Build: dist/app (installierbare Web-App) + dist/fussball-pyramide.html (eine Datei) + dist/artifact.html
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const R=p=>fs.readFileSync(p,'utf8');const W=(p,s)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s)};
const order=R('src/ORDER').split('\n').map(s=>s.trim()).filter(Boolean);
const js=order.map(f=>`// ===== ${f} =====\n`+R('src/'+f)).join('\n');
const css=R('styles/app.css');
let html=R('index.html');
// Script-Liste in index.html immer aus src/ORDER erzeugen
{const a=html.indexOf('<script src="src/'),b=html.indexOf('<script src="src/pwa.js">');html=html.slice(0,a)+order.map(f=>`<script src="src/${f}"></script>`).join('\n')+'\n'+html.slice(b);W('index.html',html)}
const body=html.slice(html.indexOf('<body>')+6,html.indexOf('<script src="src/'));
fs.rmSync('dist',{recursive:true,force:true});
// 1) Web-App
const files=['index.html','manifest.webmanifest','styles/app.css','src/pwa.js',...order.map(f=>'src/'+f),...fs.readdirSync('icons').map(f=>'icons/'+f)];
for(const f of files){fs.mkdirSync(path.dirname('dist/app/'+f),{recursive:true});fs.copyFileSync(f,'dist/app/'+f)}
const ver='fp-'+crypto.createHash('sha1').update(files.map(f=>R(f)).join('')).digest('hex').slice(0,10);
const swSrc=R('sw.template.js').replace('__VERSION__',ver).replace('__FILES__',JSON.stringify(['./',...files.filter(f=>f!=='index.html')]));
W('sw.js',swSrc); // für GitHub Pages direkt aus dem Hauptverzeichnis
W('dist/app/sw.js',R('sw.template.js').replace('__VERSION__',ver).replace('__FILES__',JSON.stringify(['./',...files.filter(f=>f!=='index.html')])));
// 2) Eine Datei zum Öffnen ohne Server
const head=html.slice(0,html.indexOf('<link rel="manifest"'));
const fonts=html.match(/<link rel="preconnect"[^>]*>\n<link rel="stylesheet" href="https:[^>]*>/)[0];
W('dist/fussball-pyramide.html',`${head}${fonts}\n<style>\n${css}\n</style>\n</head>\n<body>${body}<script>\n${js}\n</script>\n</body>\n</html>\n`);
// 3) Artefakt-Fassung (ohne Dokumentgerüst)
W('dist/artifact.html',`<title>Fußball-Pyramide Simulator</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${fonts}\n<style>\n${css}\n</style>\n${body}<script>\n${js}\n</script>\n`);
console.log('Build',ver,'·',order.length,'Module ·',Math.round(js.length/1024),'KB JS');
