// ---------- Vereinswappen & Vereinsfarben (selbst gestaltet) ----------
// t.crest = {sh:Form, pt:Muster, c1:Grundfarbe, c2:Zweitfarbe, ini:Initialen, yr:Gründungsjahr|'' , st:Stern 0/1}
const CR_SH=[['schild','Schild'],['rund','Rund'],['klassik','Klassisch'],['raute','Raute'],['eck','Eckig']];
const CR_PT=[['uni','Einfarbig'],['streifen','Streifen'],['halb','Geteilt'],['band','Querband'],['schraeg','Schrägband'],['kreuz','Kreuz'],['ringe','Ringel']];
const CR_COL=['#c8102e','#e2231a','#8b1e3f','#f28c00','#ffd200','#f2c94c','#2e7d32','#00a650','#0b6e4f','#00a3e0','#1e5aa8','#0b2a6b','#5b2a86','#6d4c41','#111111','#ffffff','#9e9e9e','#c0a062'];
const CR_PATH={schild:'M10 6h80v34c0 30-20 48-40 56C30 88 10 70 10 40z',rund:'M50 4a46 46 0 1 0 .01 0z',klassik:'M8 8h84v40c0 22-18 40-42 48C26 88 8 70 8 48z',raute:'M50 4L94 50 50 96 6 50z',eck:'M10 8h80v84H10z'};
function crestDefault(id){const t=T(id),ini=(t.name.match(/[A-ZÄÖÜ][a-zäöüß]*|\d+/g)||['FC']).filter(w=>!/^\d+$/.test(w)).map(w=>w[0]).join('').slice(0,3)||'FC';
  return {sh:'schild',pt:'streifen',c1:'#1e5aa8',c2:'#ffffff',ini,yr:t.fnd?String(t.fnd):'',st:0}}
function lum(hex){const n=parseInt(hex.slice(1),16),r=(n>>16)/255,g=(n>>8&255)/255,b=(n&255)/255;return .2126*r+.7152*g+.0722*b}
// als <img> mit eingebettetem SVG: jedes Wappen ist ein eigenes Dokument, keine ID-Kollisionen beim Neuzeichnen
function crestSVG(cr,size,cls){if(!cr)return '';return `<img class="${cls||'crest'}" width="${size}" height="${size}" alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(crestRaw(cr))}">`}
function crestRaw(cr){const size=100,cls='',uid='c',p=CR_PATH[cr.sh]||CR_PATH.schild,c1=cr.c1,c2=cr.c2;
  const pat={uni:'',streifen:[20,40,60,80].filter((x,i)=>i%2===0).map(x=>`<rect x="${x}" y="0" width="20" height="100" fill="${c2}"/>`).join(''),halb:`<rect x="50" y="0" width="50" height="100" fill="${c2}"/>`,
    band:`<rect x="0" y="38" width="100" height="22" fill="${c2}"/>`,schraeg:`<path d="M0 22L22 0 100 78 78 100z" fill="${c2}"/>`,kreuz:`<rect x="40" y="0" width="20" height="100" fill="${c2}"/><rect x="0" y="34" width="100" height="20" fill="${c2}"/>`,
    ringe:[0,1,2,3,4].map(i=>i%2?`<rect x="0" y="${i*20}" width="100" height="20" fill="${c2}"/>`:'').join('')}[cr.pt]||'';
  const ink=lum(c1)>.55?'#111':'#fff',ini=esc((cr.ini||'').slice(0,3)),fs=ini.length>=3?26:ini.length===2?32:40;
  const plate=cr.pt==='uni'?'':`<rect x="22" y="${cr.sh==='raute'?36:30}" width="56" height="${fs+6}" rx="6" fill="${c1}" stroke="${c2}" stroke-width="2"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100"><defs><clipPath id="${uid}"><path d="${p}"/></clipPath></defs>
   <g clip-path="url(#${uid})"><rect width="100" height="100" fill="${c1}"/>${pat}</g>${plate}
   <text x="50" y="${(cr.sh==='raute'?36:30)+fs-2}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="${fs}" fill="${cr.pt==='uni'?ink:(lum(c1)>.55?'#111':'#fff')}">${ini}</text>
   ${cr.st?`<polygon points="${starPts(50,cr.sh==='rund'?13:9,7)}" fill="#f2c94c" stroke="#7a5c00" stroke-width="1"/>`:''}
   ${cr.yr?`<text x="50" y="${cr.sh==='raute'?82:80}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="12" fill="${lum(c1)>.55&&cr.pt!=='halb'?'#111':'#fff'}" stroke="${lum(c1)>.55?'#fff':'#000'}" stroke-opacity=".35" stroke-width=".6">${esc(cr.yr)}</text>`:''}
   <path d="${p}" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="3"/></svg>`}
function starPts(cx,cy,r){const a=[];for(let i=0;i<10;i++){const rr=i%2?r*.45:r,an=-Math.PI/2+i*Math.PI/5;a.push((cx+rr*Math.cos(an)).toFixed(1)+','+(cy+rr*Math.sin(an)).toFixed(1))}return a.join(' ')}
const crestOf=id=>T(id)&&T(id).crest||null;
// Importierte Wappen (Bilder) – liegen nur lokal im Browser, gelten für alle Spielstände; II/III nutzen das Wappen der 1. Mannschaft
let CRIMG={};
async function loadCrests(){try{const v=await DB.get('crestimg');CRIMG=v&&typeof v==='object'?v:{}}catch(e){CRIMG={}}}
async function saveCrests(){try{await DB.set('crestimg',CRIMG)}catch(e){toast('Wappen konnten nicht gespeichert werden')}}
function crestImg(id){const t=T(id);if(!t)return null;return CRIMG[t.name]||(isRes(t.name)?CRIMG[resBase(t.name)]:null)||null}
const hasCrest=id=>!!(crestImg(id)||crestOf(id));
function crestFor(id,size,cls){const im=crestImg(id);if(im)return `<img class="${cls||'crest'}" width="${size}" height="${size}" alt="" style="object-fit:contain" src="${im.img}">`;const cr=crestOf(id);return cr?crestSVG(cr,size,cls):''}
const crestMini=id=>crestFor(id,18,'crest crm');
const normName=s=>s.normalize('NFC').toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').replace(/[^a-z0-9]/g,'');
function matchTeamName(fn){const n=normName(fn.replace(/\.[a-z0-9]+$/i,''));if(n.length<3)return null;const names=[...new Set(Object.values(S.teams).filter(t=>!t.cc||true).map(t=>t.name).filter(x=>!isRes(x)))];
  const ex=names.find(x=>normName(x)===n);if(ex)return ex;const part=names.filter(x=>normName(x).includes(n)||n.includes(normName(x)));return part.length===1?part[0]:part.sort((a,b)=>Math.abs(normName(a).length-n.length)-Math.abs(normName(b).length-n.length))[0]||null}
// Hintergrund entfernen: helle Flächen, die vom Bildrand aus zusammenhängen, werden transparent (Innenflächen bleiben),
// Kanten werden weich ausgeblendet und das Bild auf das Wappen zugeschnitten
function stripBg(c){const w=c.width,h=c.height,x=c.getContext('2d'),D=x.getImageData(0,0,w,h),p=D.data,dw=i=>765-p[i]-p[i+1]-p[i+2];
  const cor=[0,(w-1)*4,(h-1)*w*4,((h-1)*w+w-1)*4];if(!cor.some(i=>p[i+3]<20||(p[i+3]>200&&dw(i)<90)))return c;
  const seen=new Uint8Array(w*h),rm=new Uint8Array(w*h),st=[];for(let i=0;i<w;i++){st.push(i,(h-1)*w+i)}for(let j=0;j<h;j++){st.push(j*w,j*w+w-1)}
  while(st.length){const k=st.pop();if(seen[k])continue;seen[k]=1;const i=k*4;if(p[i+3]<20||dw(i)<75){rm[k]=1;const X=k%w,Y=(k-X)/w;if(X>0)st.push(k-1);if(X<w-1)st.push(k+1);if(Y>0)st.push(k-w);if(Y<h-1)st.push(k+w)}}
  for(let k=0;k<w*h;k++)if(rm[k])p[k*4+3]=0;
  for(let k=0;k<w*h;k++){if(rm[k])continue;const X=k%w;if((X>0&&rm[k-1])||(X<w-1&&rm[k+1])||(k>=w&&rm[k-w])||(k<w*h-w&&rm[k+w])){const i=k*4,dd=dw(i);if(dd<220)p[i+3]=Math.min(p[i+3],Math.round(255*dd/220))}}
  let x0=w,y0=h,x1=-1,y1=-1;for(let k=0;k<w*h;k++)if(p[k*4+3]>10){const X=k%w,Y=(k-X)/w;if(X<x0)x0=X;if(X>x1)x1=X;if(Y<y0)y0=Y;if(Y>y1)y1=Y}
  x.putImageData(D,0,0);if(x1<0)return c;const o=document.createElement('canvas');o.width=x1-x0+1;o.height=y1-y0+1;o.getContext('2d').drawImage(c,x0,y0,o.width,o.height,0,0,o.width,o.height);return o}
function fileToCrest(file){return new Promise((res,rej)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{const k=Math.min(1,128/Math.max(im.width,im.height)),w=Math.max(1,Math.round(im.width*k)),h=Math.max(1,Math.round(im.height*k)),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(im,0,0,w,h);URL.revokeObjectURL(u);res(stripBg(c).toDataURL('image/png'))};im.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('Bild'))};im.src=u})}
async function importCrestFiles(files){let ok=0,miss=[];
  for(const f of files){try{
    if(/\.json$/i.test(f.name)||f.type==='application/json'){const o=JSON.parse(await f.text());const list=o&&Array.isArray(o.clubs)?o.clubs:[];for(const c of list){if(!c||!c.name||!/^data:image\//.test(c.img||''))continue;CRIMG[c.name]={img:c.img,c1:c.c1||null,c2:c.c2||null};ok++}continue}
    const name=matchTeamName(f.name);if(!name){miss.push(f.name);continue}const img=await fileToCrest(f);CRIMG[name]={...(CRIMG[name]||{}),img};ok++}catch(e){console.warn('crest',f.name,e);miss.push(f.name)}}
  await saveCrests();return {ok,miss}}
// Trikotfarben fürs 2D-Board: eigene Farbe, sonst Standard; bei zu ähnlichen Farben weicht der Gast aus
function kitCols(hid,aid){const kc=id=>{const im=crestImg(id);return im&&im.c1?{c1:im.c1,c2:im.c2||'#ffffff'}:crestOf(id)};const ch=kc(hid),ca=kc(aid);let h=ch?ch.c1:'#d64545',a=ca?ca.c1:'#2f6fdf';
  const near=(x,y)=>{const p=parseInt(x.slice(1),16),q=parseInt(y.slice(1),16);return Math.abs((p>>16)-(q>>16))+Math.abs((p>>8&255)-(q>>8&255))+Math.abs((p&255)-(q&255))<120};
  if(near(h,a))a=ca&&!near(h,ca.c2)?ca.c2:near(h,'#2f6fdf')?'#f5f5f5':'#2f6fdf';return {h,a}}
function crestEditorHTML(o){const d=o.d,id=S.fav,t=T(id);const sw=(k)=>`<div class="crsw">${CR_COL.map(c=>`<button class="crc${d[k]===c?' on':''}" style="background:${c}" data-act="crs:${k}:${c.slice(1)}" aria-label="Farbe ${c}"></button>`).join('')}</div>`;
  const seg=(k,arr)=>`<div class="seg crseg">${arr.map(([v,n])=>`<button class="${d[k]===v?'on':''}" data-act="crs:${k}:${v}">${n}</button>`).join('')}</div>`;
  return `<div class="ovc crested"><div class="crprev">${crestSVG(d,132)}<div><b>${esc(t.name)}</b><span class="meta">So erscheint dein Wappen in Tabellen, Spielen und auf dem 2D-Board. Die Grundfarbe ist auch eure Trikotfarbe.</span></div></div>
   <h4>Form</h4>${seg('sh',CR_SH)}<h4>Muster</h4>${seg('pt',CR_PT)}
   <h4>Grundfarbe (Trikot)</h4>${sw('c1')}<h4>Zweitfarbe</h4>${sw('c2')}
   <div class="crrow"><label class="mfield">Initialen<input id="crIni" class="search" maxlength="3" value="${esc(d.ini||'')}"></label><label class="mfield">Jahr<input id="crYr" class="search" maxlength="4" inputmode="numeric" value="${esc(d.yr||'')}" placeholder="optional"></label></div>
   <label class="tog"><input type="checkbox" id="crSt" ${d.st?'checked':''}> Meisterstern über dem Wappen</label>
   <div class="crrow"><button class="btn" data-act="crs:reset">Zurücksetzen</button>${t.crest?'<button class="btn" data-act="crs:del">Wappen entfernen</button>':''}<button class="btn pri" data-act="crs:save">Speichern</button></div></div>`}
function crestRead(o){const a=document.getElementById('crIni'),b=document.getElementById('crYr'),c=document.getElementById('crSt');if(a)o.d.ini=a.value.toUpperCase().replace(/[^A-ZÄÖÜ0-9]/g,'').slice(0,3);if(b)o.d.yr=b.value.replace(/\D/g,'').slice(0,4);if(c)o.d.st=c.checked?1:0}
function crestAct(v,w){const o=view.ov;if(!o||o.t!=='crest')return;crestRead(o);const t=T(S.fav);
  if(v==='reset')o.d=crestDefault(S.fav);
  else if(v==='del'){delete t.crest;view.ov=null;save();toast('Wappen entfernt');return}
  else if(v==='save'){t.crest={...o.d};view.ov=null;save();toast('Wappen gespeichert');return}
  else if(v==='c1'||v==='c2')o.d[v]='#'+w;else o.d[v]=w}
