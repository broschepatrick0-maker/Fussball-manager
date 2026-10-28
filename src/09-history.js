// ---------- Historie ----------
function H(){if(!S.hist)S.hist={all:{},titles:{},career:{},names:[],v:2};const h=S.hist;if(h.v!==2)compactHist(h);return h}
// Kompakte Vereinshistorie: [Saison, Liga#, Stufe, Platz, Teams, Punkte, Bewegung(0/1 auf/2 ab/3 raus), [[Pokal#,Runde#],…]]
function hn(str){const h=S.hist;if(!h.nIdx){h.nIdx=new Map(h.names.map((x,i)=>[x,i]));Object.defineProperty(h,'nIdx',{enumerable:false,writable:true,value:h.nIdx})}
  let i=h.nIdx.get(str);if(i==null){i=h.names.length;h.names.push(str);h.nIdx.set(str,i)}return i}
const MV=['','up','down','out'];
function encCar(e){return [e.s,hn(e.lg),e.lv,e.intl?0:e.pos,e.n,e.intl?0:e.p,Math.max(0,MV.indexOf(e.mv||'')),(e.cups||[]).map(c=>[hn(c.c),hn(c.r)])]}
function decCar(a){const nm=S.hist.names,intl=a[2]===0;return {s:a[0],lg:nm[a[1]],lv:a[2],pos:intl?'–':a[3],n:a[4],p:intl?'–':a[5],mv:MV[a[6]]||'',cups:(a[7]||[]).map(([c,r])=>({c:nm[c],r:nm[r]})),intl}}
function compactHist(h){h.names=h.names||[];h.v=2;Object.defineProperty(h,'nIdx',{enumerable:false,writable:true,value:null});
  for(const id in h.career){h.career[id]=h.career[id].map(e=>Array.isArray(e)?e:encCar(e))}S.histV=(S.histV||0)+1}
function careerOf(id){H();return (S.hist.career[id]||[]).map(decCar)}
const LIGA_TITEL={1:'Deutscher Meister',2:'Meister 2. Bundesliga',3:'Meister 3. Liga'};
function titleName(lg){return lg.title||LIGA_TITEL[lg.level]||'Meister '+lg.name}
function cupReach(c,id){
  if(c.winner===id) return 'Sieger';
  let last=-1;c.rounds.forEach((rd,k)=>{if(rd.some(m=>m.h===id||m.a===id))last=k});
  if(last<0) return null;
  return ROUNDN(c.R,last);
}
function addAll(store,lgName,rows){
  const a=store[lgName]||(store[lgName]={});
  rows.forEach(r=>{const e=a[r.id]||(a[r.id]={sp:0,s:0,u:0,n:0,tf:0,tg:0,p:0,z:0,t:0});
    e.sp+=r.sp;e.s+=r.s;e.u+=r.u;e.n+=r.n;e.tf+=r.tf;e.tg+=r.tg;e.p+=r.p;e.z++;if(r.pos===1)e.t++});
}
function recordSeason(){
  const h=H(),season=S.season;
  for(const lg of S.leagues){
    const t=table(lg).map((r,i)=>({...r,pos:i+1}));
    addAll(h.all,lg.name,t);
    const li=hn(lg.name);t.forEach(r=>{(h.career[r.id]||(h.career[r.id]=[])).push([season,li,lg.level,r.pos,t.length,r.p,0,[]])});
    if(t[0]&&t[0].sp>0)(h.titles[t[0].id]||(h.titles[t[0].id]=[])).push({s:season,c:titleName(lg),k:'liga',lv:lg.level});
  }
  for(const c of S.cups){
    const ci=hn(c.name);c.teams.forEach(id=>{const r=cupReach(c,id);const car=h.career[id];if(r&&car&&car.length&&car[car.length-1][0]===season)car[car.length-1][7].push([ci,hn(r)])});
    if(c.winner)(h.titles[c.winner]||(h.titles[c.winner]=[])).push({s:season,c:c.name,k:'pokal',t:c.type});
  }
  for(const e of S.euro||[]){
    const ei=hn(e.name);e.teams.forEach(id=>{const r=euroReach(e,id);let car=h.career[id];
      if(!car||!car.length||car[car.length-1][0]!==season){car=h.career[id]=car||[];car.push([season,hn('International ('+(T(id).cc||'')+')'),0,0,0,0,0,[]])}
      car[car.length-1][7].push([ei,hn(r)])});
    if(e.winner)(h.titles[e.winner]||(h.titles[e.winner]=[])).push({s:season,c:e.name,k:'pokal',t:e.id});
  }
}
function markMoves(season){
  const h=H();
  const lvNow={};S.leagues.forEach(l=>l.teams.forEach(id=>lvNow[id]=l.level));
  for(const [id,car] of Object.entries(h.career)){
    const e=car[car.length-1]; if(!e||e[0]!==season||e[2]===0) continue;
    const nl=lvNow[id]; e[6]=nl==null?3:nl<e[2]?1:nl>e[2]?2:0;
  }
  S.histV=(S.histV||0)+1;
}
function liveAll(lgName){ // ewige Tabelle inkl. laufender Saison
  const base=JSON.parse(JSON.stringify(H().all[lgName]||{}));
  const lg=S.leagues.find(l=>l.name===lgName);
  if(lg&&lg.played>0) addAll(base,lgName,table(lg).map((r,i)=>({...r,pos:0})));
  return Object.entries(base).map(([id,e])=>({id,...e})).filter(e=>T(e.id)).sort((a,b)=>b.p-a.p||(b.tf-b.tg)-(a.tf-a.tg)||b.tf-a.tf);
}
const tl=id=>`<button class="tlink" data-act="club:${id}">${esc(T(id).name)}</button>`;
