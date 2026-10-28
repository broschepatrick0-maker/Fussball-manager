// ---------- Screenshot-Import: Texterkennung (Tesseract.js) für fussball.de-Tabellen ----------
const OCR={worker:null,busy:false,log:''};
const TESS_URL='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
function loadTess(){return new Promise((res,rej)=>{if(window.Tesseract)return res(window.Tesseract);const s=document.createElement('script');s.src=TESS_URL;s.onload=()=>res(window.Tesseract);s.onerror=()=>rej(new Error('Texterkennung konnte nicht geladen werden (Internet nötig)'));document.head.appendChild(s)})}
async function ocrWorker(progress){if(OCR.worker)return OCR.worker;const T_=await loadTess();OCR.worker=await T_.createWorker('deu',1,{logger:m=>{if(progress&&m.status)progress(m.status,m.progress||0)}});return OCR.worker}
// Namensspalte ausschneiden, vergrößern, in Schwarz-Weiß umwandeln
function prepCanvas(img){const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;const x0=Math.round(w*.195),x1=Math.round(w*.645),cw=x1-x0,sc=w<900?2.2:1.6;
  const c=document.createElement('canvas');c.width=Math.round(cw*sc);c.height=Math.round(h*sc);const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(img,x0,0,cw,h,0,0,c.width,c.height);
  const d=g.getImageData(0,0,c.width,c.height),p=d.data;for(let i=0;i<p.length;i+=4){const v=.299*p[i]+.587*p[i+1]+.114*p[i+2],b=v<150?0:255;p[i]=p[i+1]=p[i+2]=b}g.putImageData(d,0,0);return c}
function fileToImg(f){return new Promise((res,rej)=>{const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{res(im)};im.onerror=()=>rej(new Error('Bild nicht lesbar'));im.src=u})}
// --- reine Auswertung (auch ohne Browser testbar) ---
const OCR_JUNK=/(mannschaft|nschaft|spieltag|tabelle|gesamt|heim|ausw|torj|fairness|fussball\.?de|manager|ergo|versicher|starkes team|zalando|entdecken|erfahren|promateur|jetzt|spielen|hinweis|tabellenrechnung|punkte abzug|wettbewerb|coca|adidas|^platz)/i;
function ocrGroup(lines){ // lines: [{text,y0,y1}] in Bildreihenfolge -> Vereinsnamen
  const L=lines.map(l=>({t:(l.text||'').replace(/\s+/g,' ').trim(),y0:l.y0,y1:l.y1})).filter(l=>l.t);
  // Kopfbereich bis zur Spaltenüberschrift überspringen, Werbung/Fußzeile abschneiden
  let start=L.findIndex(l=>/nschaft|mannschaft|platz/i.test(l.t));start=start<0?0:start+1;
  let rows=L.slice(start);const end=rows.findIndex(l=>/fussball\.?de|manager|promateur|zalando|entdecken|erfahren|hinweis|coca/i.test(l.t));if(end>=0)rows=rows.slice(0,end);
  rows=rows.filter(l=>!OCR_JUNK.test(l.t)&&/[A-Za-zÄÖÜäöüß]{2}/.test(l.t)&&!(l.t===l.t.toUpperCase()&&l.t.length>12&&!/\d/.test(l.t)));
  if(!rows.length)return [];
  const hs=rows.map(r=>r.y1-r.y0).sort((a,b)=>a-b),mh=hs[Math.floor(hs.length/2)]||20;
  const out=[];let cur=null;
  for(const r of rows){const gap=cur?r.y0-cur.y1:1e9;
    const cont=cur&&gap<mh*.75;
    if(cont){cur.t+=' '+r.t;cur.y1=r.y1}else{if(cur)out.push(cur.t);cur={...r}}}
  if(cur)out.push(cur.t);
  return out.map(ocrClean).filter(Boolean)}
function ocrClean(s){s=' '+s+' ';
  if(/\bzg\.?\s*$/i.test(s.trim()))return '';
  s=s.replace(/[|\[\]{}©®°«»“”"‚‘’•~_=<>]/g,' ').replace(/\(9\)/g,' ').replace(/\be\.\s?V\.?/gi,' ');
  s=s.replace(/(I|l)!/g,'$1I').replace(/!/g,'I');
  s=s.replace(/\s(Il|lI|ll|I1|1I|11)(?=\s|$)/g,' II').replace(/\s(Ill|IlI|lII|lll|I11)(?=\s|$)/g,' III');
  s=s.replace(/\s+/g,' ').trim();
  // angeklebte Spielzahl am Ende (z. B. "Großrudestedt III5")
  s=s.replace(/(I{2,3})\d{1,2}$/,'$1').replace(/([a-zäöüß])\d{1,2}$/,'$1').replace(/([a-zäöüß.])\s([2-4])\d$/,(m,c,n)=>c+' '+['','','II','III','IV'][+n]);
  // Mannschaftsnummern: "2." / "2" -> II, "3." -> III, "1" weg
  s=s.replace(/\s([2-4])\.?$/,(m,n)=>' '+['','','II','III','IV'][+n]).replace(/\s1\.?$/,'');
  s=s.replace(/\s+[.,:;'`-]+$/,'').replace(/^[^A-Za-zÄÖÜ0-9]+/,'').trim();
  return s.length>=5&&/[A-Za-zÄÖÜäöüß]{3}/.test(s)?s:''}
const normN=s=>s.toLowerCase().replace(/ß/g,'ss').replace(/ä/g,'a').replace(/ö/g,'o').replace(/ü/g,'u').replace(/[^a-z0-9]/g,'');
function lev(a,b){if(a===b)return 0;const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let p=Array.from({length:n+1},(_,i)=>i);for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]}
// Abgleich mit bekannten Vereinsnamen (korrigiert Umlaute, ß, Leerzeichen)
function ocrMatch(name,known){const suf=(name.match(/\s(II|III|IV)$/)||[''])[0],base=suf?name.slice(0,-suf.length):name,nb=normN(base);if(nb.length<4)return name;
  let best=null,bd=1e9;for(const k of known){const ks=(k.match(/\s(II|III|IV)$/)||[''])[0],kb=ks?k.slice(0,-ks.length):k;const d=lev(nb,normN(kb));if(d<bd){bd=d;best=kb;if(!d)break}}
  return best&&bd<=Math.max(1,Math.floor(nb.length*.18))?best+suf:name}
function knownNames(){const s=new Set();try{Object.values(S.teams).forEach(t=>s.add(t.name))}catch(e){}try{PRESETS.forEach(p=>p.teams.forEach(n=>s.add(n.split('|')[0])))}catch(e){}return [...s]}
// --- Ablauf im Browser ---
async function ocrFiles(files){if(OCR.busy)return;OCR.busy=true;const st=m=>{OCR.log=m;const el=document.getElementById('ocrSt');if(el)el.textContent=m};
  try{st('Texterkennung wird geladen …');const w=await ocrWorker((s,p)=>st(s.includes('loading')?'Sprachpaket wird geladen … '+Math.round(p*100)+' %':'Erkenne Text … '+Math.round(p*100)+' %'));
    const known=knownNames(),all=[];let i=0;
    for(const f of files){i++;st(`Bild ${i} von ${files.length} wird gelesen …`);const img=await fileToImg(f);const c=prepCanvas(img);
      const {data}=await w.recognize(c);const lines=(data.lines||[]).map(l=>({text:l.text,y0:l.bbox.y0,y1:l.bbox.y1}));
      ocrGroup(lines).forEach(n=>all.push(ocrMatch(n,known)))}
    const seen=new Set(),uniq=all.filter(n=>{const k=normN(n);if(seen.has(k))return false;seen.add(k);return true});
    const prev=(view.itxt||'').trim();view.itxt=(prev?prev+'\n':'')+uniq.join('\n');view.preview=parseTable(view.itxt);
    st(`${uniq.length} Vereine erkannt – bitte unten prüfen und korrigieren`);toast(`${uniq.length} Vereine erkannt`);render()}
  catch(e){st(e.message||String(e));toast(e.message||'Texterkennung fehlgeschlagen')}
  finally{OCR.busy=false}}
// Export der selbst importierten Ligen (zum Übernehmen ins Spiel)
function exportLeagues(){const ls=S.leagues.filter(l=>l.custom&&!PRESETS.some(p=>p.name===l.name));
  return JSON.stringify(ls.map(l=>({name:l.name,vb:l.vb,level:l.level,kreis:l.kreis||null,up:l.up||null,teams:l.src||l.teams.map(id=>T(id).name)})),null,1)}
if(typeof module!=='undefined')module.exports={ocrGroup,ocrClean,ocrMatch,normN};
