// ---------- Speichern ----------
// Speicher: IndexedDB (viele hundert MB), Fallback localStorage
const DB={db:null,
  open(){if(this.db)return Promise.resolve(this.db);return new Promise((res,rej)=>{try{const r=indexedDB.open('fussball-pyramide',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>{this.db=r.result;res(r.result)};r.onerror=()=>rej(r.error)}catch(e){rej(e)}})},
  async get(k){const db=await this.open();return new Promise((res,rej)=>{const q=db.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})},
  async set(k,v){const db=await this.open();return new Promise((res,rej)=>{const tx=db.transaction('kv','readwrite');tx.objectStore('kv').put(v,k);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error)})}
};
let storeMode='idb';
function warnSave(){if(!save.warned){save.warned=true;setTimeout(()=>toast('Spielstand konnte nicht gespeichert werden. Sichere ihn unter Historie → Spielstand sichern.'),50)}}
function save(){
  clearTimeout(save.t);
  save.t=setTimeout(()=>{
    if(storeMode==='idb'){const {hist,...rest}=S;const hv=S.histV||0;
      const jobs=[DB.set('state',rest)];if(save.hv!==hv||!save.split){jobs.push(DB.set('hist',hist||null));}
      Promise.all(jobs).then(()=>{save.last=Date.now();save.hv=hv;save.split=true}).catch(()=>{storeMode='ls';save()});return}
    try{localStorage.setItem(KEY,JSON.stringify(S));save.last=Date.now()}catch(e){warnSave()}
  },400);
}
async function loadAsync(){
  try{const v=await DB.get('state');if(v){if(!v.hist){const h=await DB.get('hist');if(h)v.hist=h;save.split=true;save.hv=v.histV||0}S=v;return true}}catch(e){storeMode='ls'}
  try{const j=localStorage.getItem(KEY);if(j){S=JSON.parse(j);if(storeMode==='idb'){await DB.set('state',S);try{localStorage.removeItem(KEY)}catch(e){}}return true}}catch(e){}
  return false;
}
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist().catch(()=>{})}catch(e){}
function exportJSON(){return JSON.stringify({app:'fussball-pyramide',v:1,saved:new Date().toISOString(),S})}
function importJSON(txt){const o=JSON.parse(txt);const st=o&&o.S?o.S:o;if(!st||!st.teams||!st.leagues)throw new Error('Kein Spielstand');S=st;save();}
