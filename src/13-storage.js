// ---------- Speichern ----------
// Speicher: IndexedDB (viele hundert MB), Fallback localStorage
const DB={db:null,
  open(){if(this.db)return Promise.resolve(this.db);return new Promise((res,rej)=>{try{const r=indexedDB.open('fussball-pyramide',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>{this.db=r.result;res(r.result)};r.onerror=()=>rej(r.error)}catch(e){rej(e)}})},
  async get(k){const db=await this.open();return new Promise((res,rej)=>{const q=db.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})},
  async set(k,v){const db=await this.open();return new Promise((res,rej)=>{const tx=db.transaction('kv','readwrite');tx.objectStore('kv').put(v,k);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error)})}
};
let storeMode='idb';
// Speicherplätze: Platz 1 nutzt die alten Schlüssel (kompatibel), Platz 2/3 eigene
let SLOT=1;try{SLOT=+(localStorage.getItem('fp-slot')||1)||1}catch(e){}
const skey=k=>SLOT===1?k:`s${SLOT}:${k}`;
DB.del=async function(k){const db=await this.open();return new Promise((res,rej)=>{const tx=db.transaction('kv','readwrite');tx.objectStore('kv').delete(k);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})};
function metaOf(){const c=S.career;return {season:S.season,round:S.round,mode:S.mode||'free',club:S.fav&&T(S.fav)?T(S.fav).name:null,lg:S.fav&&lgOf(S.fav)?lgOf(S.fav).name:null,mgr:c?c.name:null,jobless:!!(c&&c.jobless),saved:Date.now()}}
function switchSlot(n){SLOT=n;try{localStorage.setItem('fp-slot',String(n))}catch(e){}save.split=false;save.hv=undefined}
function warnSave(){if(!save.warned){save.warned=true;setTimeout(()=>toast('Spielstand konnte nicht gespeichert werden. Sichere ihn unter Historie → Spielstand sichern.'),50)}}
function save(){
  clearTimeout(save.t);
  save.t=setTimeout(()=>{
    if(storeMode==='idb'){const {hist,...rest}=S;const hv=S.histV||0;
      const jobs=[DB.set(skey('state'),rest),DB.set(skey('meta'),metaOf())];if(save.hv!==hv||!save.split){jobs.push(DB.set(skey('hist'),hist||null));}
      Promise.all(jobs).then(()=>{save.last=Date.now();save.hv=hv;save.split=true}).catch(()=>{storeMode='ls';save()});return}
    try{localStorage.setItem(KEY+(SLOT>1?SLOT:''),JSON.stringify(S));save.last=Date.now()}catch(e){warnSave()}
  },400);
}
async function loadAsync(){
  try{const v=await DB.get(skey('state'));if(v){if(!v.hist){const h=await DB.get(skey('hist'));if(h)v.hist=h;save.split=true;save.hv=v.histV||0}S=v;return true}}catch(e){storeMode='ls'}
  try{const j=localStorage.getItem(KEY+(SLOT>1?SLOT:''));if(j){S=JSON.parse(j);if(storeMode==='idb'){await DB.set(skey('state'),S);try{localStorage.removeItem(KEY+(SLOT>1?SLOT:''))}catch(e){}}return true}}catch(e){}
  return false;
}
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist().catch(()=>{})}catch(e){}
function exportJSON(){return JSON.stringify({app:'fussball-pyramide',v:1,saved:new Date().toISOString(),S})}
function importJSON(txt){const o=JSON.parse(txt);const st=o&&o.S?o.S:o;if(!st||!st.teams||!st.leagues)throw new Error('Kein Spielstand');S=st;save();}
