// ---------- Kader, Marktwerte, Transfers ----------
const NAMES={
 DE:{f:'Lukas,Leon,Finn,Jonas,Noah,Elias,Paul,Ben,Luis,Felix,Maximilian,Tim,Jan,Niklas,Moritz,David,Julian,Tom,Nico,Fabian,Kevin,Marcel,Dennis,Florian,Tobias,Philipp,Simon,Marvin,Dominik,Kai,Lennard,Malte,Yannick,Can,Emre,Mehmet,Ali,Luca,Robin,Sebastian',l:'Müller,Schmidt,Schneider,Fischer,Weber,Meyer,Wagner,Becker,Schulz,Hoffmann,Koch,Bauer,Richter,Klein,Wolf,Schröder,Neumann,Schwarz,Zimmermann,Braun,Krüger,Hofmann,Hartmann,Lange,Schmitt,Werner,Krause,Meier,Lehmann,Huber,Kaiser,Fuchs,Peters,Lang,Scholz,Möller,Weiß,Jung,Hahn,Vogel,Keller,Frank,Berger,Winkler,Roth,Beck,Lorenz,Baumann,Franke,Albrecht,Yilmaz,Kaya,Demir,Öztürk'},
 ENG:{f:'Harry,Jack,Oliver,George,James,Charlie,Thomas,Jacob,Alfie,Joe,Callum,Mason,Reece,Declan,Jordan,Marcus,Kyle,Aaron,Ben,Luke',l:'Smith,Jones,Taylor,Brown,Williams,Wilson,Johnson,Davies,Robinson,Wright,Thompson,Evans,Walker,White,Roberts,Green,Hall,Wood,Jackson,Clarke,Hughes,Edwards,Turner,Cole,Mitchell'},
 ESP:{f:'Alejandro,Pablo,Daniel,Adrián,Álvaro,David,Hugo,Javier,Sergio,Marcos,Iker,Pedro,Carlos,Raúl,Mikel,Unai,Rodrigo,Diego,Jorge,Iván',l:'García,Fernández,González,Rodríguez,López,Martínez,Sánchez,Pérez,Gómez,Martín,Jiménez,Ruiz,Hernández,Díaz,Moreno,Álvarez,Romero,Navarro,Torres,Domínguez,Gil,Vázquez,Serrano,Ramos'},
 ITA:{f:'Lorenzo,Alessandro,Matteo,Leonardo,Francesco,Andrea,Riccardo,Gabriele,Tommaso,Federico,Marco,Davide,Simone,Nicolò,Giacomo,Luca,Stefano,Mattia,Pietro,Gianluca',l:'Rossi,Russo,Ferrari,Esposito,Bianchi,Romano,Colombo,Ricci,Marino,Greco,Bruno,Gallo,Conti,De Luca,Mancini,Costa,Giordano,Rizzo,Lombardi,Moretti,Barbieri,Fontana,Santoro,Caruso'},
 FRA:{f:'Lucas,Hugo,Théo,Nathan,Louis,Enzo,Mathis,Jules,Raphaël,Antoine,Maxime,Kylian,Ousmane,Moussa,Adrien,Benjamin,Bastien,Romain,Yanis,Mehdi',l:'Martin,Bernard,Dubois,Thomas,Robert,Richard,Petit,Durand,Leroy,Moreau,Simon,Laurent,Lefebvre,Michel,Garcia,David,Bertrand,Roux,Vincent,Fournier,Morel,Girard,Diallo,Traoré,Camara'},
 INT:{f:'João,Rúben,Daan,Milan,Luka,Ivan,Mateo,Emil,Mikkel,Oscar,Lukas,Kerem,Arda,Yusuf,Nikola,Filip,Jakub,Dominik,Andrei,Giorgos,Kevin,Sander,Bruno,Tiago',l:'Silva,Santos,Ferreira,de Jong,Jansen,Peeters,Horvat,Kovačić,Novak,Petrović,Jovanović,Hansen,Nielsen,Larsen,Johansson,Andersson,Yıldız,Çelik,Kowalski,Nowak,Popescu,Papadopoulos,Svoboda,Dvořák,Berisha,Hoxha'}
};
const POS=['TW','AB','MF','ST'],POSN={TW:'Torwart',AB:'Abwehr',MF:'Mittelfeld',ST:'Sturm'};
function gauss(){return (Math.random()+Math.random()+Math.random()-1.5)*2}
function pname(t){return nameFor(rollNat(t))}
function P(){if(!S.pl)S.pl={};return S.pl}
const clampS=x=>Math.max(10,Math.min(99,x));
function newPlayer(t,pos,st,age){st=clampS(st);const id='p'+(S.next++);const nat=rollNat(t);P()[id]={n:nameFor(nat),nat,p:pos,a:age??(18+Math.floor(Math.random()*16)),s:+st.toFixed(1),ao:genAttrOffsets(pos)};return id}
function xi(sq){
  const fit=sq.filter(id=>P()[id]&&!P()[id].inj);
  const by=p=>fit.filter(id=>P()[id].p===p).map(id=>P()[id].s).sort((a,b)=>b-a);
  const spare=fit.map(id=>P()[id].s).sort((a,b)=>b-a);
  const take=(p,n)=>{const a=by(p);let i=0;while(a.length<n)a.push(Math.max(15,(spare[11+i++]||20)-6));return a.slice(0,n)};
  const all=[...take('TW',1),...take('AB',4),...take('MF',4),...take('ST',2)];
  return all.reduce((a,b)=>a+b,0)/11;
}
function ensureSquad(id){
  const t=T(id); if(t.sq) return t.sq;
  if(typeof realSquadOf==='function'&&realSquadOf(t)){const r=buildRealSquad(id,t.r);if(r)return r}
  const plan=[['TW',3],['AB',8],['MF',8],['ST',5]],sq=[];
  plan.forEach(([p,n])=>{for(let i=0;i<n;i++)sq.push(newPlayer(t,p,t.r-2+gauss()*4-i*0.8))});
  const d=t.r-xi(sq);sq.forEach(pid=>P()[pid].s=+clampS(P()[pid].s+d).toFixed(1));
  t.sq=sq; return sq;
}
function recalc(id){const t=T(id);if(!t.sq||!t.sq.length)return;if(id===S.fav&&S.mgr){t.r=+mgrXI(id).rating.toFixed(1);return}t.r=+xi(t.sq).toFixed(1);t.dp=+depthGap(t.sq).toFixed(1)}
function value(pid){
  const p=P()[pid]; if(!p) return 0;
  if(p.mvR&&p.mvS===S.season)return p.mvR; // echter Marktwert aus der Kaderliste (gilt für die laufende Saison)
  const am=p.a<=21?1.25:p.a<=24?1.1:p.a<=28?1:p.a<=30?.8:p.a<=32?.55:.3;
  // oberhalb von Stärke 70 steigt der Wert steiler: Weltstars (90+) liegen bei 150–200 Mio. €, Stammspieler der Bundesliga bei 10–40 Mio. €
  const s=Math.min(p.s,99),top=s>70?(s-70)*(s-70)*.001:0;
  const v=Math.min(2.2e8,Math.pow(10,4.3+(s-30)*0.055+top)*am);
  const r=v>1e6?1e5:v>1e5?1e4:1e3; return Math.max(1000,Math.round(v/r)*r);
}
// Grundlage für Gehälter: die bisherige, flachere Kurve – damit die Lohnkosten der Vereine durch die neuen Marktwerte nicht explodieren
function wageBase(pid){const p=P()[pid];if(!p)return 0;if(p.mvR&&p.mvS===S.season)return Math.min(p.mvR,valueFlat(p));return valueFlat(p)}
function valueFlat(p){const am=p.a<=21?1.25:p.a<=24?1.1:p.a<=28?1:p.a<=30?.8:p.a<=32?.55:.3;return Math.min(1.8e8,Math.pow(10,4.3+(Math.min(p.s,99)-30)*0.055)*am)}
function clubValue(id){return (T(id).sq||ensureSquad(id)).reduce((a,pid)=>a+value(pid),0)}
function money(v){return v>=1e6?(v/1e6).toFixed(v>=1e7?0:1).replace('.',',')+' Mio. €':v>=1e3?Math.round(v/1e3)+' Tsd. €':Math.round(v)+' €'}
function windowOpen(){return S.done||transferOpenOn(Math.max(0,S.day+1))}
function FV(){if(!S.fin)S.fin={budget:null,log:[],income:[]};return S.fin}
function initBudget(){if(S.fav&&T(S.fav))FZ(S.fav)}
function seasonIncome(id,st){ // Prämien & TV-Geld am Saisonende
  const lg=S.leagues.find(l=>l.teams.includes(id)); if(!lg) return 0;
  const base={1:lg.foreign?60e6:45e6,2:12e6,3:3e6,4:7e5,5:2e5,6:8e4,7:3e4,8:12e3,9:6e3,10:3e3,11:2e3,12:1.5e3}[lg.level]||3e3;
  const pos=st[lg.id].indexOf(id)+1,n=st[lg.id].length,f=1.3-0.6*(pos-1)/Math.max(1,n-1);
  let euro=0;(S.euro||[]).forEach(e=>{if(e.teams.includes(id)){const r=euroReach(e,id);euro+=({ucl:18e6,uel:6e6,uecl:3e6}[e.id])*(r==='Sieger'?3:r==='Finale'?2.2:r==='Halbfinale'?1.8:r==='Viertelfinale'?1.5:r==='Achtelfinale'?1.25:1)}});
  let cup=0;S.cups.forEach(c=>{if(c.teams.includes(id)){const r=cupReach(c,id);if(c.type==='dfb')cup+=r==='Sieger'?6e6:r==='Finale'?3e6:r==='Halbfinale'?1.5e6:4e5;else cup+=r==='Sieger'?base*.1:0}});
  return Math.round((base*f+euro+cup)/1e4)*1e4;
}
// Langzeit-Balance: Jedes Niveau hat eine Norm-Stärke. Nachwuchs entsteht um diese Norm
// (gute Vereine liefern etwas besseren Nachwuchs), Spieler wachsen bis ~27 Richtung Potenzial
// und bauen danach ab. So bleibt die Stärke der Ligen über Jahrzehnte stabil.
const NORM={1:78.6,2:68.8,3:60,4:51.5,5:46,6:41,7:36,8:31,9:26,10:21,11:17,12:14,F:78.4};
const YOUTH_C=+(globalThis.YOUTH_C??-3);
function clubNorm(t){const l=lgOf(t.id);if(!l)return t.r;return l.foreign?NORM.F:(NORM[l.level]||t.r)}
function lvKey(t){const l=lgOf(t.id);return l?(l.foreign?'F':l.level):null}
function youthPot(t){const n=clubNorm(t),k=lvKey(t),drift=S.lvAvg&&k!=null&&S.lvAvg[k]!=null?S.lvAvg[k]-n:0;let pot=n+(t.r-n)*0.5+YOUTH_C-1.5*drift+gauss()*5;if(Math.random()<.03)pot+=8+Math.random()*6;return Math.min(99,pot)}
function potOf(p){if(p.pot==null)p.pot=+Math.min(99,p.s+Math.max(0,25-p.a)*1.1).toFixed(1);return p.pot}
function developSquads(){
  {const o={};S.leagues.forEach(l=>{const k=l.foreign?'F':l.level;l.teams.forEach(id=>{(o[k]=o[k]||[]).push(T(id).r)})});S.lvAvg={};for(const k in o)S.lvAvg[k]=o[k].reduce((a,b)=>a+b,0)/o[k].length}
  for(const t of Object.values(S.teams)){
    if(!t.sq) continue;
    const k_=lvKey(t),d_=k_!=null&&S.lvAvg&&S.lvAvg[k_]!=null?S.lvAvg[k_]-(NORM[k_]||S.lvAvg[k_]):0,corr=Math.abs(d_)>0.5?-0.3*d_:0;
    t.sq=t.sq.filter(pid=>{const p=P()[pid];if(!p)return false;p.a++;if(corr){p.s=+clampS(p.s+corr).toFixed(1);if(p.pot!=null)p.pot=+Math.min(99,p.pot+corr).toFixed(1)}const pot=potOf(p);
      let g;
      if(p.a<=27){g=(pot-p.s)*(p.a<=20?.35:p.a<=23?.28:.18)+gauss()*0.7;if(p.a<=23)p.pot=+Math.min(99,pot+gauss()*0.8).toFixed(1)}
      else if(p.a<=30)g=gauss()*0.7-0.2;
      else if(p.a<=33)g=-(0.6+Math.random()*1.8);
      else g=-(2+Math.random()*2.5);
      p.s=+clampS(p.s+g).toFixed(1);
      if(p.a>=36||(p.a>=33&&Math.random()<.35)){delete P()[pid];return false}return true});
    // Kader auf höchstens 26 begrenzen: überzählige, schwächste Spieler beenden ihre Laufbahn bzw. verlassen das Ligensystem
    if(t.sq.length>26){const keep=new Set();POS.forEach(pos=>t.sq.filter(pid=>P()[pid].p===pos).sort((a,b)=>P()[b].s-P()[a].s).slice(0,{TW:2,AB:5,MF:5,ST:3}[pos]).forEach(x=>keep.add(x)));
      const rest=t.sq.filter(x=>!keep.has(x)).sort((a,b)=>P()[a].s-P()[b].s);while(t.sq.length>26&&rest.length){const w=rest.shift();t.sq=t.sq.filter(x=>x!==w);delete P()[w]}}
    POS.forEach(pos=>{const need={TW:3,AB:7,MF:7,ST:4}[pos];while(t.sq.filter(pid=>P()[pid].p===pos).length<need){const pot=youthPot(t),age=17+Math.floor(Math.random()*3);const id=newPlayer(t,pos,pot-(7+Math.random()*6)+(age-17)*1.5,age);P()[id].pot=+pot.toFixed(1);t.sq.push(id)}});
    recalc(t.id);
  }
}
function parseSquad(txt){
  const out=[];let pos='MF';
  const posOf=w=>/^(tw|torwart|torhüter|tor|gk|goalkeeper)/i.test(w)?'TW':/^(ab|abwehr|verteidig|iv|lv|rv|innenv|außenv|def|cb|lb|rb)/i.test(w)?'AB':/^(mf|mittelfeld|zm|zdm|dm|om|lm|rm|cm|cdm|cam|mid)/i.test(w)?'MF':/^(st|sturm|stürmer|angriff|ms|la|ra|fw|cf|lw|rw|mittelstürmer|flügel)/i.test(w)?'ST':null;
  for(let line of txt.replace(/​/g,'').split(/\r?\n/)){
    line=line.trim(); if(!line) continue;
    const head=posOf(line); if(head&&line.split(/\s+/).length<=2){pos=head;continue}
    let p=pos; const parts=line.split(/\t|\s{2,}| [-–|] /).map(x=>x.trim()).filter(Boolean);
    let name=null,age=null;
    for(const x of parts){const q=posOf(x);if(q&&x.length<=14){p=q;continue}
      const m=x.match(/^\(?(\d{2})\)?$/);if(m&&+m[1]>=15&&+m[1]<=45){age=+m[1];continue}
      if(!name&&/[A-Za-zÀ-ž]{2}/.test(x))name=x.replace(/^\d+\.?\s*/,'').replace(/\s*\(\d{2}\)$/,'')}
    const am=line.match(/\((\d{2})\)/);if(am)age=+am[1];
    if(name&&name.length>2) out.push({n:name,p,a:age});
  }
  return out;
}
function transferLog(e){FV().log.unshift({s:S.season,r:S.round,...e});FV().log.length=Math.min(FV().log.length,200);if(e.pid)addTr(e.pid,e.from,e.to,e.fee)}
function lgName(id){const l=S.leagues.find(x=>x.teams.includes(id));return l?l.name:'International'}
function addTr(pid,from,to,fee,free){
  const p=P()[pid];if(!S.tr)S.tr=[];
  S.tr.unshift({s:S.season,r:S.round,n:p.n,p:p.p,a:p.a,st:p.s,from,to,fl:lgName(from),tl:lgName(to),fee,mv:value(pid),free:!!free});
  if(!free||from===S.fav||to===S.fav)try{newsTransfer(pid,from,to,fee)}catch(e){}
  if(S.tr.length>5000)S.tr.length=5000;
  try{setContract(pid,to)}catch(e){}
}
function bud(id){const t=T(id);const z=lgOf(id)?FZ(id):null;if(z)return spendable(id);if(t.bud==null)t.bud=Math.round(clubValue(id)*0.1/1e3)*1e3;return t.bud}
function addBud(id,v){const t=T(id);if(t.fz){t.fz.c+=v;return}const z=lgOf(id)?FZ(id):null;if(z){z.c+=v;return}bud(id);t.bud+=v}
const LVW={1:6,2:3,3:2.2,4:1.6,5:.8,6:.5,7:.35,8:.25};
function buyers(){
  if(buyers.c&&buyers.c.k===S.season+'-'+S.leagues.length) return buyers.c.l;
  const l=[],by={};S.leagues.forEach(lg=>lg.teams.forEach(id=>{l.push([id,LVW[lg.level]||.2]);const lv=T(id)&&T(id).lv||9;(by[lv]=by[lv]||[]).push(id)}));(S.pool||[]).forEach(id=>{l.push([id,3]);const lv=T(id)&&T(id).lv||9;(by[lv]=by[lv]||[]).push(id)});
  buyers.c={k:S.season+'-'+S.leagues.length,l,by};return l;
}
function wpick(l){const tot=l.reduce((a,x)=>a+x[1],0);let r=Math.random()*tot;for(const x of l){r-=x[1];if(r<=0)return x[0]}return l[l.length-1][0]}
// Zu kleine Kader zur neuen Saison mit Nachwuchs auffüllen (nur KI-Vereine, nur bereits erzeugte Kader)
function fillSquads(){for(const id in S.teams){const t=S.teams[id];if(!t.sq||t.gone||id===S.fav||t.sq.length>=20)continue;
  let n=0;while(t.sq.length<22&&n++<8){const pos=posNeed(t),pid=newPlayer(t,pos,Math.max(20,(t.r||50)-9+gauss()*3),18+Math.floor(Math.random()*3));try{P()[pid].pot=+Math.max(P()[pid].s,youthPot(t)).toFixed(1)}catch(e){}t.sq.push(pid);try{if(typeof ensureContract==='function'&&!isAmClub(id))ensureContract(pid,id)}catch(e){}}
  recalc(id)}}
function posNeed(t){ // Position mit der größten Lücke zur Teamstärke
  const sc=POS.map(p=>{const n={TW:1,AB:4,MF:4,ST:2}[p];const a=t.sq.filter(id=>P()[id].p===p).map(id=>P()[id].s).sort((x,y)=>y-x).slice(0,n);while(a.length<n)a.push(15);return [p,a.reduce((x,y)=>x+y,0)/n-t.r+Math.random()*3]});
  return sc.sort((x,y)=>x[1]-y[1])[0][0];
}
function sameWorld(a,b){return !!a.cc===!!b.cc||((a.lv||9)<=2&&(b.lv||9)<=2)}
// ---------- Regionalität: je tiefer die Liga, desto näher bleibt ein Wechsel ----------
const VB_NB={BA:'WU,SB,SW,HE,BY',SB:'BA,WU',WU:'BA,SB,BY',BY:'WU,BA,HE,TH,SN',HE:'BA,BY,TH,NI,WF,RL,SW',TH:'BY,HE,NI,ST,SN',SN:'BY,TH,ST,BB',ST:'NI,BB,SN,TH',BB:'BE,MV,ST,SN,NI',BE:'BB',MV:'BB,SH,NI',SH:'HH,NI,MV',HH:'SH,NI',HB:'NI',NI:'HB,HH,SH,MV,BB,ST,TH,HE,WF,NR',WF:'NI,HE,NR,MR,RL',NR:'WF,MR,NI',MR:'NR,WF,RL',RL:'MR,WF,HE,SW,SL',SW:'RL,SL,HE,BA',SL:'SW,RL'};
function regDist(a,b){const ta=T(a),tb=T(b);if(!ta||!tb)return 4;if(ta.cc||tb.cc)return ta.cc===tb.cc?2:4;
  const la=lgOf(a),lb=lgOf(b);if(la&&la===lb)return 0;if(ta.vb===tb.vb)return la&&lb&&la.kreis&&la.kreis===lb.kreis?1:2;
  return (VB_NB[ta.vb]||'').split(',').includes(tb.vb)?3:4}
// maximale Entfernung, aus der ein Verein dieser Spielklasse Spieler holt (0 Liga,1 Kreis,2 Land,3 Nachbarland,4 überall)
function regMax(lv){return lv<=3?4:lv===4?3:lv<=6?(Math.random()<.25?3:2):lv===7?2:Math.random()<(lv===8?.12:.04)?2:1}
// Vereine aus den Zubringer-Ligen (bis 2 Stufen tiefer) – das „Einzugsgebiet“ einer Liga
const _feed={k:null,m:{}};function feederTeams(lg){const k=S.season+'-'+S.leagues.length+'-'+S.day;if(_feed.k!==k){_feed.k=k;_feed.m={}}
  if(_feed.m[lg.id])return _feed.m[lg.id];const upOf_=l=>l.up||(PRESETS.find(p=>p.name===l.name)||{}).up;
  const d1=S.leagues.filter(l=>!l.foreign&&upOf_(l)===lg.name),n1=new Set(d1.map(l=>l.name)),d2=S.leagues.filter(l=>!l.foreign&&n1.has(upOf_(l)));
  return _feed.m[lg.id]=[...d1,...d2].flatMap(l=>l.teams)}
const isAmClub=id=>{const l=lgOf(id);return !!l&&!l.foreign&&l.level>=8};
function aiTransfer(force){
  const bid=force||wpick(buyers()); if(!bid||(bid===S.fav&&!favAuto())) return;
  const b=T(bid); ensureSquad(bid); const money_=bud(bid); if(money_<5e3) return;
  const need=posNeed(b),blv=b.lv||9;
  const md=regMax(blv);
  buyers();const by=buyers.c.by,pool=[...(by[blv-1]||[]),...(by[blv]||[]),...(by[blv+1]||[])];
  // Stichprobe statt alle Vereine zu prüfen
  const sellers=[];for(let k=0,tries=0;sellers.length<8&&tries<400;tries++){const id=pool[Math.floor(Math.random()*pool.length)];if(!id||id===bid||sellers.includes(id)||(id===S.fav&&!favAuto()))continue;const t=T(id);if(!t||Math.abs((t.lv||9)-blv)>1)continue;if(!(Math.random()<.5||sameWorld(t,b)))continue;if(regDist(id,bid)>md)continue;sellers.push(id)}
  if(md<=1&&sellers.length<3){const near=(lgOf(bid)?S.leagues.filter(l=>!l.foreign&&l.vb===b.vb&&l.kreis===(lgOf(bid).kreis)&&Math.abs(l.level-blv)<=1):[]).flatMap(l=>l.teams).filter(id=>id!==bid&&!sellers.includes(id)&&(id!==S.fav||favAuto()));shuffle(near).slice(0,8-sellers.length).forEach(id=>sellers.push(id))}
  const c=[];
  // Scouting: manchmal sucht ein Verein gezielt Talente (unsichtbares Potenzial, Schätzung mit Unschärfe)
  const talent=Math.random()<.25,est=p=>potOf(p)+gauss()*3;
  // Verstärkung = besser als der schwächste Stammspieler auf der Position (so ersetzen auch Spitzenclubs alternde Stars)
  const xiIds=typeof starters==='function'?starters(bid):b.sq,weak=Math.min(...xiIds.map(x=>P()[x]).filter(p=>p&&p.p===need).map(p=>p.s),b.r);
  const lo=Math.max(weak+1,b.r-6);
  sellers.forEach(sid=>{ensureSquad(sid).forEach(pid=>{const p=P()[pid];
    const ok=talent?(p.a<=21&&p.s>=b.r-12&&est(p)>=b.r+2):(p.p===need&&p.s>Math.min(lo,b.r-1)&&p.s<b.r+9&&p.a<=31);
    if(ok){const am=isAmClub(sid);if(am&&(T(sid).lv||9)<blv&&Math.random()>.3)return; // Amateure wechseln selten freiwillig nach unten
      const fee=am?0:Math.round(value(pid)*(talent?1.3+Math.random()*.5:1+Math.random()*.4)/1e3)*1e3;if(fee<=money_)c.push({pid,sid,fee,e:talent?est(p):p.s})}})});
  if(!c.length) return;
  c.sort((x,y)=>y.e-x.e);
  const pick=c[Math.floor(Math.random()*Math.min(3,c.length))],st=T(pick.sid),pp=P()[pick.pid].p;
  if(st.sq.filter(id=>P()[id].p===pp).length<=2) return;
  // stärkere Vereine geben Stammspieler nicht an schwächere ab (wie im echten Fußball – höchstens ganz selten)
  if(pick.sid!==S.fav&&(st.r||0)>(b.r||0)+1&&Math.random()>.08&&(typeof starters==='function'?starters(pick.sid):[]).includes(pick.pid)) return;
  if(pick.sid===S.fav&&st.sq.length<=18) return;
  if(pick.sid!==S.fav&&st.sq.length<=21) return; // KI-Vereine verkaufen ihren Kader nicht leer
  st.sq=st.sq.filter(x=>x!==pick.pid);b.sq.push(pick.pid);addBud(bid,-pick.fee);addBud(pick.sid,pick.fee);
  addTr(pick.pid,pick.sid,bid,pick.fee);
  if(b.sq.length>27){ // schwächsten Spieler abgeben
    const w=b.sq.slice().sort((x,y)=>P()[x].s-P()[y].s)[0];b.sq=b.sq.filter(x=>x!==w);
    const bl=lgOf(bid);let lower=bl&&!bl.foreign&&bl.level>=4?feederTeams(bl).filter(id=>id!==S.fav&&T(id)):[];
    if(!lower.length)lower=buyers().map(x=>x[0]).filter(id=>{const t=T(id);return id!==S.fav&&(t.lv||9)>=blv+1&&(t.lv||9)<=blv+2&&(t.vb===b.vb||!!t.cc===!!b.cc)&&regDist(id,bid)<=Math.max(1,regMax(t.lv||9))});
    if(lower.length){const to=rnd(lower);ensureSquad(to).push(w);addTr(w,bid,to,0,true);recalc(to)}else delete P()[w];
  }
  recalc(bid);recalc(pick.sid);
}
function aiOffer(){ // Angebot an Mein Verein
  if(!S.fav||!T(S.fav)||Math.random()>.35||isAmClub(S.fav)) return; // Amateure: keine Ablöse-Angebote
  const f=T(S.fav),sq=ensureSquad(S.fav).slice().sort((a,b)=>P()[b].s-P()[a].s),lst=sq.filter(x=>P()[x].tl),pid=lst.length&&Math.random()<.65?lst[Math.floor(Math.random()*lst.length)]:sq[Math.floor(Math.random()*Math.min(8,sq.length))];
  const flv=f.lv||9,cands=buyers().map(x=>x[0]).filter(id=>id!==S.fav&&(T(id).lv||9)<=flv&&(T(id).lv||9)>=flv-1&&regDist(id,S.fav)<=regMax(T(id).lv||9));
  if(!cands.length) return;
  const club=rnd(cands),amt=Math.round(value(pid)*(.9+Math.random()*.5)/1e3)*1e3;
  if(amt>bud(club)) return;
  if(!S.offers)S.offers=[];
  if(S.offers.some(o=>o.pid===pid)) return;
  S.offers.unshift({pid,club,amt,s:S.season,r:S.round});S.offers.length=Math.min(S.offers.length,6);
}
function favAuto(){return !!S.fav&&FV().auto!==false}
function transferDay(n,offer=true){for(let i=0;i<n;i++)aiTransfer();if(offer)aiOffer();
  const rich=Object.values(S.inv||{}).filter(x=>x.club&&T(x.club)&&x.club!==S.fav);for(let i=0;i<Math.min(6,rich.length);i++)aiTransfer(rpick(rich,Math.random).club);
  // Spitzenclubs mit viel Geld werden zusätzlich aktiv – sonst horten sie Millionen und überaltern
  const cr=cashRich();for(let i=0;i<Math.min(3,cr.length);i++)aiTransfer(cr[Math.floor(Math.random()*cr.length)])}
function cashRich(){const k=S.season+':'+S.day;if(cashRich.c&&cashRich.c.k===k)return cashRich.c.l;buyers();const by=buyers.c.by;
  const l=[...(by[1]||[]),...(by[2]||[])].filter(id=>id!==S.fav&&T(id)&&!T(id).gone&&bud(id)>=4e7);cashRich.c={k,l};return l}

// ---------- Speicher schlank halten: Kader weit entfernter Amateur-/Oberliga-Vereine werden verworfen ----------
// (die Teamstärke bleibt erhalten; schaut man den Verein später an, wird ein neuer Kader auf gleichem Niveau erzeugt)
function pruneSquads(){if(!S.pl)return 0;const keep=new Set(),keepLg=new Set();
  const add=id=>{if(id)keep.add(id)};add(S.fav);(S.career&&S.career.club)&&add(S.career.club);
  Object.values(S.inv||{}).forEach(x=>add(x.club));(S.offers||[]).forEach(o=>add(o.club));
  const fl=S.fav&&lgOf(S.fav);
  if(fl){keepLg.add(fl.id);const upOf_=l=>l.up||(PRESETS.find(p=>p.name===l.name)||{}).up;
    S.leagues.forEach(l=>{if(l.foreign)return;if(l.name===upOf_(fl)||upOf_(l)===fl.name||(fl.kreis&&l.kreis===fl.kreis&&l.vb===fl.vb))keepLg.add(l.id)})}
  for(const l of S.leagues)if(l.foreign||l.level<=5||l.trk||keepLg.has(l.id))l.teams.forEach(add);
  const inLg=new Set();S.leagues.forEach(l=>l.teams.forEach(id=>inLg.add(id)));(S.pool||[]).forEach(add);
  let n=0;
  for(const t of Object.values(S.teams)){if(!t.sq||keep.has(t.id)||(t.seen!=null&&t.seen>=S.season-1))continue;
    if(t.sq.some(pid=>S.pl[pid]&&S.pl[pid].real))continue;
    for(const pid of t.sq){delete S.pl[pid];n++}delete t.sq}
  if(S.scout)for(const pid in S.scout.list)if(!S.pl[pid])delete S.scout.list[pid];
  if(S.inj)S.inj=S.inj.filter(e=>S.pl[e[0]]);
  return n}
