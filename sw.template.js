// Service Worker: hält die App offline verfügbar. Die Liste wird beim Build erzeugt.
// Netz zuerst: mit Verbindung kommt immer die neueste Fassung, ohne Verbindung die gespeicherte.
const VERSION='__VERSION__';
const FILES=__FILES__;
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
