// Service Worker: hält die App offline verfügbar. Die Liste wird beim Build erzeugt.
const VERSION='fp-6c361286ff';
const FILES=["./","manifest.webmanifest","styles/app.css","src/pwa.js","src/01-data.js","src/02-state.js","src/03-schedule.js","src/03b-calendar.js","src/04-sim.js","src/05-euro.js","src/06-cups.js","src/07-squad.js","src/08-finance.js","src/08b-players.js","src/08c-manager.js","src/08d-career.js","src/08e-fitness.js","src/08f-mood.js","src/08g-sanctions.js","src/09-history.js","src/10-live.js","src/10b-livedyn.js","src/11-season.js","src/12-import.js","src/12b-ocr.js","src/13-storage.js","src/14-ui-core.js","src/15-news.js","src/15b-menu.js","src/15c-calui.js","src/15d-jump.js","src/16-ui-pages.js","icons/icon-180.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>{
    const net=fetch(e.request).then(r=>{if(r.ok&&new URL(e.request.url).origin===location.origin){const cp=r.clone();caches.open(VERSION).then(c=>c.put(e.request,cp))}return r}).catch(()=>hit);
    return hit||net;
  }));
});
