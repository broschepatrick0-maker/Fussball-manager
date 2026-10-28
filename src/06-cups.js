// ---------- Pokale ----------
function pow2(n){let p=1;while(p<n)p*=2;return p}
const ROUNDN=(R,k)=>{const left=R-k;return left===1?'Finale':left===2?'Halbfinale':left===3?'Viertelfinale':left===4?'Achtelfinale':(k+1)+'. Runde'};
function makeCup(id,name,type,ids,opts={}){
  ids=[...new Set(ids)];
  if(ids.length<2) return null;
  const size=pow2(ids.length),R=Math.log2(size);
  const byes=size-ids.length;
  const sorted=[...ids].sort((a,b)=>T(b).r-T(a).r);
  const free=sorted.slice(0,byes), rest=shuffle(sorted.slice(byes));
  const first=free.map(id=>({h:id,a:null,w:id,bye:true}));
  for(let i=0;i<rest.length;i+=2) first.push(pair(rest[i],rest[i+1]));
  return {id,name,type,teams:ids,R,played:0,rounds:[shuffle(first)],winner:null,...opts};
}
function pair(x,y){ // klassentieferer Verein hat Heimrecht
  const lx=T(x).lv||11,ly=T(y).lv||11;
  return lx>ly?{h:x,a:y}:ly>lx?{h:y,a:x}:(Math.random()<.5?{h:x,a:y}:{h:y,a:x});
}
function playCupRound(c){
  const rd=c.rounds[c.played], fin=c.played===c.R-1;
  for(const m of rd){
    if(m.bye) continue;
    if(m.hg!=null&&m.w) continue;
    const neutral=fin&&c.type==='dfb';
    let [x,y]=play(m.h,m.a,neutral);
    m.hg=x;m.ag=y;
    if(x===y){
      const rh=T(m.h).r,ra=T(m.a).r;
      const ex=pois(lam(rh,ra,!neutral)/3), ey=pois(lam(ra,rh,false)/3);
      m.hg+=ex;m.ag+=ey;m.et=true;
      if(m.hg===m.ag){
        let a=0,b=0;const pa=.74+(rh-ra)/400,pb=.74+(ra-rh)/400;
        for(let i=0;i<5;i++){if(Math.random()<pa)a++;if(Math.random()<pb)b++}
        while(a===b){if(Math.random()<pa)a++;if(Math.random()<pb)b++}
        m.pen=[a,b];
      }
    }
    m.w = m.pen ? (m.pen[0]>m.pen[1]?m.h:m.a) : (m.hg>m.ag?m.h:m.a);
    afterMatch(m,9);
  }
  c.played++;
  const winners=rd.map(m=>m.w);
  if(c.played===c.R){c.winner=winners[0];return}
  const sh=shuffle(winners),next=[];
  for(let i=0;i<sh.length;i+=2) next.push(pair(sh[i],sh[i+1]));
  c.rounds.push(next);
}
function teamsOf(pred){return S.leagues.filter(pred).flatMap(l=>l.teams)}
function buildCups(){
  S.cups=[];
  // Landespokale: 3. Liga, Regionalliga und alle eingetragenen Amateurligen des Verbandes, ohne Zweitvertretungen
  const lp={};
  for(const code of Object.keys(VB)){
    const ids=teamsOf(l=>l.level>=3).filter(id=>T(id).vb===code&&!isRes(T(id).name));
    const c=makeCup('lp-'+code,POKAL[code],'lp',ids,{vb:code});
    if(c){S.cups.push(c);lp[code]=c}
  }
  // Kreispokale
  const kreise=[...new Set(S.leagues.filter(l=>l.kreis).map(l=>l.vb+'|'+l.kreis))];
  for(const k of kreise){
    const [vb,name]=k.split('|');
    const ids=teamsOf(l=>l.kreis===name&&l.vb===vb).filter(id=>!isRes(T(id).name)||true);
    const c=makeCup('kp-'+vb+'-'+name,'Kreispokal '+name,'kp',ids,{vb,kreis:name});
    if(c) S.cups.push(c);
  }
  // DFB-Pokal: 36 Profis + 4 aus der 3. Liga + 24 Amateure
  const pros=teamsOf(l=>l.level<=2&&!l.foreign);
  const l3=table(L('l3')).map(r=>r.id);
  const l3ids=(S.lastL3||L('l3').teams).filter(id=>!isRes(T(id).name)&&L('l3').teams.includes(id)).slice(0,4);
  const used=new Set([...pros,...l3ids]);
  const am=[];
  const pool=teamsOf(l=>l.level>=3).filter(id=>!isRes(T(id).name)&&!used.has(id));
  for(const code of Object.keys(VB)){
    let pick=S.pokalWinners[code];
    if(!pick||used.has(pick)||!T(pick)||isRes(T(pick).name)) pick=pool.filter(id=>T(id).vb===code&&!used.has(id)).sort((a,b)=>T(b).r-T(a).r)[0];
    if(pick){am.push(pick);used.add(pick)}
  }
  for(const code of ['BY','NI','WF']){
    const p=pool.filter(id=>T(id).vb===code&&!used.has(id)).sort((a,b)=>T(b).r-T(a).r)[0];
    if(p){am.push(p);used.add(p)}
  }
  const rest=pool.filter(id=>!used.has(id)).sort((a,b)=>T(b).r-T(a).r);
  while(am.length<24&&rest.length){const p=rest.shift();am.push(p);used.add(p)}
  const dfb=makeCup('dfb','DFB-Pokal','dfb',[...pros,...l3ids,...am]);
  S.cups.unshift(dfb);
}
