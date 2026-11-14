// Service Worker: hält die App offline verfügbar. Die Liste wird beim Build erzeugt.
// Netz zuerst: mit Verbindung kommt immer die neueste Fassung, ohne Verbindung die gespeicherte.
const VERSION='fp-0db8571dcd';
const FILES=["./","manifest.webmanifest","styles/app.css","src/pwa.js","src/01-data.js","src/01c-crests.js","src/01d-squads.js","src/02-state.js","src/03-schedule.js","src/03b-calendar.js","src/04-sim.js","src/05-euro.js","src/06-cups.js","src/07a-names.js","src/07b-attr.js","src/07c-realsquads.js","src/07d-faces.js","src/07-squad.js","src/08-finance.js","src/08j-owners.js","src/08k-clubs.js","src/08b-players.js","src/08c-manager.js","src/08l-devel.js","src/08d-career.js","src/08e-fitness.js","src/08f-mood.js","src/08g-sanctions.js","src/08h-stats.js","src/08i-amateur.js","src/09-history.js","src/09b-derby.js","src/10-live.js","src/10b-livedyn.js","src/10c-pitch.js","src/10d-crest.js","src/10e-kits.js","src/11-season.js","src/11b-rel.js","src/12-import.js","src/12b-ocr.js","src/13-storage.js","src/14-ui-core.js","src/15-news.js","src/15b-menu.js","src/15c-calui.js","src/15d-jump.js","src/15e-press.js","src/16-ui-pages.js","src/16b-stars.js","src/16c-erfolge.js","icons/icon-180.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting()});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;const same=new URL(e.request.url).origin===location.origin;
  if(!same){e.respondWith(caches.match(e.request).then(h=>h||fetch(e.request)));return}
  e.respondWith(new Promise(res=>{let done=false;const hitP=caches.match(e.request,{ignoreSearch:true});
    // bei langsamer Verbindung nach 4 s die gespeicherte Fassung nehmen
    const to=setTimeout(()=>hitP.then(h=>{if(h&&!done){done=true;res(h)}}),4000);
    fetch(e.request,{cache:'no-cache'}).then(r=>{if(r.ok){const cp=r.clone();caches.open(VERSION).then(c=>c.put(e.request,cp))}clearTimeout(to);if(!done){done=true;res(r)}})
      .catch(()=>hitP.then(h=>{clearTimeout(to);if(!done){done=true;res(h||Response.error())}}))}));
});
