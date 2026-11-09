// Installierbare App: Service Worker nur über http(s), nicht beim Öffnen als Datei.
// Updates: beim Start und bei jeder Rückkehr in die App wird nach einer neuen Fassung gesucht; ist eine da, lädt die App einmal neu.
var PWA={reg:null};
if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  const had=!!navigator.serviceWorker.controller;let reloaded=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!had||reloaded)return;reloaded=true;try{if(typeof save==='function')save()}catch(e){}location.reload()});
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>{PWA.reg=r;r.update().catch(()=>{})}).catch(()=>{}));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&PWA.reg)PWA.reg.update().catch(()=>{})});
}
async function appVersion(){try{if(self.caches){const k=(await caches.keys()).filter(x=>x.startsWith('fp-'));if(k.length)return k[k.length-1]}}catch(e){}return location.protocol.startsWith('http')?'Web':'Einzeldatei'}
async function checkUpdate(){if(!PWA.reg){toast('Updates gibt es nur in der installierten App');return}toast('Suche nach Update …');
  try{await PWA.reg.update();const w=PWA.reg.installing||PWA.reg.waiting;if(w){toast('Update gefunden – App lädt neu');if(PWA.reg.waiting)PWA.reg.waiting.postMessage('skip')}else toast('Du hast die neueste Version')}catch(e){toast('Keine Verbindung')}}
