// Installierbare App: Service Worker nur über http(s), nicht beim Öffnen als Datei
if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
