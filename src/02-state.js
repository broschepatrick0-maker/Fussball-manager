// ---------- Zustand ----------
const KEY='fpyr-v1';
let S, view={tab:'home',id:null,md:null,team:null};
const isRes=n=>/\s(II+|[2-4])$/.test(n);
const resBase=n=>n.replace(/\s(II+|[2-4])$/,'');
// Zweitvertretungen: mind. 2 Ligen unter der 1. Mannschaft, III mind. 1 Liga unter der II
function deLevels(){const lv={},lg={};S.leagues.forEach(l=>l.teams.forEach(id=>{if(T(id)&&T(id).vb){lv[id]=l.level;lg[id]=l}}));const byName={};Object.values(lg).forEach(()=>{});S.leagues.forEach(l=>l.teams.forEach(id=>{if(T(id)&&T(id).vb)byName[T(id).name]=id}));return{lv,lg,byName}}
function resMinLevel(name,byName,lvOf){if(!isRes(name))return 0;const b=resBase(name);let need=0;const f=byName[b];if(f!=null&&lvOf(f)!=null)need=lvOf(f)+2;
  if(/\sIII$/.test(name)){const s2=byName[b+' II'];if(s2!=null&&lvOf(s2)!=null)need=Math.max(need,lvOf(s2)+1)}return need}
// Heimatligen: jeder Verein merkt sich je Spielklasse die erste Liga, in der er gespielt hat
function noteHomes(){S.leagues.forEach(l=>{if(l.foreign||l.level<5)return;l.teams.forEach(id=>{const t=T(id);if(!t)return;t.hm=t.hm||{};if(!t.hm[l.level])t.hm[l.level]=l.name})})}
function homeLeagues(id){const t=T(id);if(!t)return [];return [...(t.from||[]),...Object.values(t.hm||{}),...(typeof HOME_SEED!=='undefined'&&HOME_SEED[t.name]?[HOME_SEED[t.name]]:[])]}
function downLeague(cur,t){
  if(cur.level===1)return L('bl2'); if(cur.level===2)return L('l3'); if(cur.level===3)return L(REGION[t.vb]||'rlw');
  const c=S.leagues.filter(l=>l.level===cur.level+1&&(l.vbs||[l.vb]).includes(t.vb)); if(!c.length)return null;
  const hl=homeLeagues(t.id);const home=c.find(l=>hl.includes(l.name));if(home)return home;
  return c.find(l=>(PRESETS.find(p=>p.name===l.name)||{}).up===cur.name)||c.find(l=>cur.kreis&&l.kreis===cur.kreis)||c.sort((a,b)=>a.teams.length-b.teams.length)[0];
}
function enforceReserves(st,log){
  for(let pass=0;pass<4;pass++){let changed=false;const {lv,lg,byName}=deLevels();
    for(const l of S.leagues.slice()) for(const id of l.teams.slice()){
      const t=T(id); if(!t||!t.vb||!isRes(t.name)) continue;
      const need=resMinLevel(t.name,byName,x=>lv[x]); if(lv[id]>=need) continue;
      const cur=lg[id],dest=downLeague(cur,t); if(!dest) continue;
      const sub=(st[dest.id]||dest.teams).filter(x=>dest.teams.includes(x)).find(x=>{const n=T(x).name;return !isRes(n)||resMinLevel(n,byName,y=>lv[y])<=cur.level});
      cur.teams=cur.teams.filter(x=>x!==id);dest.teams.push(id);lv[id]=dest.level;lg[id]=dest;
      if(sub){dest.teams=dest.teams.filter(x=>x!==sub);cur.teams.push(sub);lv[sub]=cur.level;lg[sub]=cur}
      log.push(`Zwangsabstieg: ${t.name} muss mind. zwei Ligen unter ${resBase(t.name)} spielen → ${dest.name}${sub?` · ${T(sub).name} rückt in die ${cur.name} nach`:''}`);changed=true;
    }
    if(!changed)break;
  }
}
const T=id=>S.teams[id];
const rnd=a=>a[Math.floor(Math.random()*a.length)];
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function addTeam(name,vb,r){const id='t'+(S.next++);S.teams[id]={id,name,vb,r};return id}
function L(id){return S.leagues.find(l=>l.id===id)}

function fresh(){
  S={season:2026,round:0,next:0,teams:{},leagues:[],cups:[],log:[],pokalWinners:{},done:false};
  for(const p of PRO){
    const ids=p.teams.split(';').map(s=>{const [n,v,r]=s.split('|');return addTeam(n,v,+r)});
    S.leagues.push({id:p.id,name:p.name,level:p.level,vb:null,kreis:null,teams:ids,size:ids.length,real:true});
  }
  PRESETS.forEach(p=>addAmateurLeague(p.name,p.vb,p.level,p.kreis,p.teams,true));
  addForeign();
  startSeason();
}
function addForeign(){
  for(const f of FOREIGN){
    if(S.leagues.some(l=>l.id===f.id)) continue;
    const ids=f.teams.split(';').map(x=>{const [n,r]=x.split('|');const id=addTeam(n,null,+r);T(id).cc=f.cc;return id});
    S.leagues.push({id:f.id,name:f.name,level:1,cc:f.cc,land:f.land,title:f.title,vb:null,kreis:null,teams:ids,size:ids.length,real:true,foreign:true,rounds:schedule(ids),played:0});
    ids.forEach(id=>T(id).lv=1);
  }
  if(!S.pool){S.pool=EUROPOOL.split(';').map(x=>{const [n,c,r]=x.split('|');const id=addTeam(n,null,+r);T(id).cc=c;T(id).lv=1;return id})}
}
const isDE=l=>!l.foreign;
function addAmateurLeague(name,vb,level,kreis,names,real){
  const base=BASE[level]||30;
  const ids=names.map((n,i)=>{const [nm,tv]=n.split('|');return addTeam(nm,tv||vb,+(base+ (names.length-i)/names.length*4 - 2 + (Math.random()*2-1)).toFixed(1))});
  const vbs=[...new Set(ids.map(id=>T(id).vb))];
  const lg={id:'a'+(S.next++),name,level,vb,vbs,kreis:kreis||null,teams:ids,size:ids.length,real:!!real,custom:true};
  S.leagues.push(lg);
  return lg;
}
