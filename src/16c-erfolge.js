// ---------- Erfolge: Meilensteine für Mein Verein, Manager-Punkte und Manager-Rang ----------
// Gespeichert in S.ach = {u:{key:{s,club}}, c:{Zähler}, club, lv, since, cap0, debt}
function ACH(){if(!S.ach)S.ach={u:{},c:{}};return S.ach}
const ACH_T={b:['Bronze',10],s:['Silber',25],g:['Gold',50],p:['Platin',100]};
const ACH_G=[['spiel','Auf dem Platz'],['saison','Saison & Titel'],['verein','Verein & Kader'],['karriere','Trainerlaufbahn']];
// [key, Gruppe, Stufe, Symbol, Titel, Beschreibung, Fortschritt (opt.: ()=>[ist, soll])]
const ACH_L=[
 ['sieg1','spiel','b','⚽','Der erste Dreier','Gewinne ein Pflichtspiel mit Mein Verein'],
 ['kanter','spiel','b','💥','Kantersieg','Gewinne ein Spiel mit fünf Toren Unterschied'],
 ['torfest','spiel','s','🎆','Torfestival','Schieße sieben Tore in einem Spiel'],
 ['serie6','spiel','s','🔥','Siegesserie','Gewinne sechs Pflichtspiele in Folge',()=>[ACH().c.bestW||0,6]],
 ['serie12','spiel','g','☄️','Nicht zu stoppen','Gewinne zwölf Pflichtspiele in Folge',()=>[ACH().c.bestW||0,12]],
 ['unbes15','spiel','s','🧱','Bollwerk','Bleibe 15 Pflichtspiele ungeschlagen',()=>[ACH().c.bestU||0,15]],
 ['zunull5','spiel','s','🧤','Die Mauer','Spiele fünfmal in Folge zu null',()=>[ACH().c.bestZ||0,5]],
 ['riese','spiel','s','🪨','Riesentöter','Schlage im Pokal einen Gegner, der mindestens 10 Stärkepunkte besser ist'],
 ['derby','spiel','b','🏟️','Derbysieger','Gewinne ein Derby'],
 ['derby5','spiel','g','👑','Herr der Stadt','Gewinne fünf Derbys',()=>[ACH().c.derby||0,5]],
 ['herbst','saison','b','🍂','Herbstmeister','Stehe zur Saisonhälfte auf Platz 1'],
 ['meister','saison','s','🏆','Meisterschale','Werde Meister deiner Liga'],
 ['meister3','saison','g','🏆','Seriensieger','Gewinne drei Meisterschaften',()=>[ACH().c.titles||0,3]],
 ['dm','saison','p','🥇','Deutscher Meister','Gewinne die Bundesliga'],
 ['pokal','saison','s','🏅','Pokalheld','Gewinne einen Pokalwettbewerb'],
 ['dfb','saison','g','🏆','Berlin, Berlin','Gewinne den DFB-Pokal'],
 ['double','saison','g','✌️','Das Double','Werde Meister und Pokalsieger in derselben Saison'],
 ['europa','saison','s','🌍','Europas Bühne','Spiele mit Mein Verein im Europapokal'],
 ['ucl','saison','p','⭐','Der Henkelpott','Gewinne die Champions League'],
 ['unbesiegt','saison','g','🛡️','Die Unbesiegbaren','Bleibe eine ganze Ligasaison ohne Niederlage'],
 ['punkte','saison','g','📈','Rekordjagd','Hole mindestens 2,5 Punkte pro Ligaspiel in einer Saison'],
 ['auf1','saison','b','⬆️','Aufsteiger','Steige mit Mein Verein auf'],
 ['durch','saison','g','🚀','Durchmarsch','Steige zweimal direkt hintereinander auf'],
 ['auf5','saison','g','🪜','Die Himmelsleiter','Steige insgesamt fünfmal auf',()=>[ACH().c.ups||0,5]],
 ['dorf','saison','p','🏡','Vom Dorf in die Bundesliga','Führe einen Verein, der einmal in Liga 7 oder tiefer spielte, in die Bundesliga'],
 ['treue5','verein','b','🤝','Vereinstreue','Bleibe fünf Saisons bei demselben Verein',()=>[achSeasonsHere(),5]],
 ['treue10','verein','g','💚','Vereinsikone','Bleibe zehn Saisons bei demselben Verein',()=>[achSeasonsHere(),10]],
 ['kauf1','verein','b','✍️','Erste Unterschrift','Verpflichte einen Spieler gegen Ablöse'],
 ['koenig','verein','g','💎','Königstransfer','Verpflichte einen Spieler für mindestens 50 Mio. €'],
 ['verkauf','verein','s','💰','Kassenschlager','Verkaufe einen Spieler für mindestens 20 Mio. €'],
 ['talent','verein','b','🌱','Eigengewächs','Hole ein Talent aus der Jugendakademie in den Profikader'],
 ['schmiede','verein','g','🎓','Aus eigener Schmiede','Ein Eigengewächs erreicht Stärke 75'],
 ['umschul','verein','b','🔄','Neue Rolle','Schule einen Spieler im Einzeltraining auf eine neue Position um'],
 ['star','verein','s','🌟','Weltstar im Kader','Habe einen Spieler mit Stärke 90 oder mehr im Kader'],
 ['polster','verein','s','🏦','Solide gewirtschaftet','Habe einen ganzen Jahresumsatz auf dem Konto und keine Schulden'],
 ['schulden','verein','s','🧾','Schuldenfrei','Zahle alle Kredite vollständig zurück'],
 ['tribuene','verein','b','🏗️','Neue Tribüne','Baue das Stadion aus'],
 ['tempel','verein','g','🏛️','Fußballtempel','Spiele in einem Stadion mit 50.000 Plätzen'],
 ['wander','karriere','s','🧳','Wandervogel','Trainiere in deiner Karriere drei verschiedene Vereine',()=>[achClubs(),3]],
 ['saison10','karriere','s','⏳','Alter Hase','Absolviere zehn Saisons als Trainer',()=>[ACH().c.seasons||0,10]],
 ['saison25','karriere','g','🧓','Trainerlegende','Absolviere 25 Saisons als Trainer',()=>[ACH().c.seasons||0,25]]
];
const ACH_M=new Map(ACH_L.map(a=>[a[0],a]));
const ACH_RANK=[[0,'Kreisliga-Coach'],[60,'Vereinstrainer'],[150,'Aufstiegstrainer'],[300,'Fachmann'],[500,'Taktikfuchs'],[800,'Meistermacher'],[1150,'Trainerlegende'],[1500,'Fußballgott']];
function achSeasonsHere(){const a=ACH();return a.club&&a.club===S.fav&&a.since!=null?S.season-a.since:0}
function achClubs(){const c=S.career;if(!c)return 0;return new Set([...(c.hist||[]).map(h=>h.club),c.club].filter(Boolean)).size}
function achPoints(){const a=ACH();let n=0;for(const k in a.u){const d=ACH_M.get(k);if(d)n+=ACH_T[d[2]][1]}return n}
function achRank(pts){pts=pts??achPoints();let i=0;ACH_RANK.forEach((r,j)=>{if(pts>=r[0])i=j});return {i,n:ACH_RANK[i][1],next:ACH_RANK[i+1]||null,lo:ACH_RANK[i][0]}}
function achUnlock(k,quiet){const a=ACH();if(a.u[k]||!ACH_M.has(k)||!S.fav||!T(S.fav))return false;const d=ACH_M.get(k),before=achRank().i;
  a.u[k]={s:S.season,club:T(S.fav).name};(a.fresh=a.fresh||[]).push(k);if(a.fresh.length>12)a.fresh.shift();
  if(!quiet){try{addNews({cat:'fav',clubs:[S.fav],h:`🏅 Erfolg freigeschaltet: ${d[4]}`,b:`${d[5]}. +${ACH_T[d[2]][1]} Manager-Punkte (${ACH_T[d[2]][0]}).`,imp:2})}catch(e){}
    const r=achRank();if(r.i>before)try{addNews({cat:'fav',clubs:[S.fav],h:`Neuer Manager-Rang: ${r.n}`,b:`Mit ${achPoints()} Manager-Punkten steigst du zum ${r.n} auf.`,imp:3})}catch(e){}
    achToast(`🏅 ${d[4]} (+${ACH_T[d[2]][1]})`)}
  return true}
function achToast(t){if(typeof document==='undefined'||typeof toast!=='function')return;if(typeof JUMP!=='undefined'&&JUMP&&JUMP.o)return;try{toast(t)}catch(e){}}
function achLv(){const l=S.fav&&lgOf(S.fav);return l?(l.foreign?1:l.level):null}
// Vereinswechsel von Mein Verein erkennen
function achClub(){const a=ACH();if(a.club!==S.fav){a.club=S.fav||null;a.since=S.season;a.lv=achLv();a.cap0=S.fav&&FZ(S.fav)?FZ(S.fav).cap:null;a.debt=0;a.wk=null;a.prevUp=null}}
// Wöchentlich: Spiele, Serien, Kader, Finanzen
function achWeek(){if(!S.fav||!T(S.fav))return;achClub();const a=ACH(),c=a.c,id=S.fav;
  const done=teamMatches(id).filter(x=>x.done&&x.m&&x.m.hg!=null).sort((x,y)=>(x.day??0)-(y.day??0)||(x.ord??0)-(y.ord??0));
  let w=0,u=0,z=0,bw=0,bu=0,bz=0;
  for(const x of done){const m=x.m,home=m.h===id,me=home?m.hg:m.ag,op=home?m.ag:m.hg,r=res(m,id),opp=home?m.a:m.h;
    if(r==='S'){w++;u++}else if(r==='U'){w=0;u++}else{w=0;u=0}
    if(op===0)z++;else z=0;bw=Math.max(bw,w);bu=Math.max(bu,u);bz=Math.max(bz,z);
    const key=S.season+':'+x.k+':'+x.comp+':'+x.rd;
    if(r==='S'){achUnlock('sieg1');if(me-op>=5)achUnlock('kanter');
      if(x.cup&&T(opp)&&T(opp).r-T(id).r>=10)achUnlock('riese');
      if(typeof derbyOf==='function'&&derbyOf(m.h,m.a)){(a.dk=a.dk||{});if(!a.dk[key]){a.dk[key]=1;c.derby=(c.derby||0)+1}achUnlock('derby');if(c.derby>=5)achUnlock('derby5')}}
    if(me>=7)achUnlock('torfest');
  }
  // Serien über den Saisonwechsel hinweg: laufende Serie der Vorsaison wird angerechnet
  const cw=(a.carry&&a.carry.s===S.season?a.carry:null);
  if(cw){bw=Math.max(bw,cw.w+leadRun(done,id,'w'));bu=Math.max(bu,cw.u+leadRun(done,id,'u'));bz=Math.max(bz,cw.z+leadRun(done,id,'z'))}
  a.run={w,u,z};
  c.bestW=Math.max(c.bestW||0,bw);c.bestU=Math.max(c.bestU||0,bu);c.bestZ=Math.max(c.bestZ||0,bz);
  if(c.bestW>=6)achUnlock('serie6');if(c.bestW>=12)achUnlock('serie12');if(c.bestU>=15)achUnlock('unbes15');if(c.bestZ>=5)achUnlock('zunull5');
  if(a.dk){const pre=S.season+':';for(const k in a.dk)if(!k.startsWith(pre))delete a.dk[k]}
  // Herbstmeister
  const lg=lgOf(id);if(lg&&!lg.foreign&&lg.rounds.length&&lg.played>=Math.ceil(lg.rounds.length/2)&&lg.played<lg.rounds.length&&a.hm!==S.season){const half=Math.ceil(lg.rounds.length/2);if(lg.played===half||lg.played===half+1){a.hm=S.season;const tb=table(lg);if(tb[0]&&tb[0].id===id)achUnlock('herbst')}}
  // Aufstieg erkennen (Liga-Stufe kleiner als zuletzt gemerkt)
  const lv=achLv();if(lv!=null&&a.lv!=null&&lv<a.lv&&a.upS!==S.season){a.upS=S.season;c.ups=(c.ups||0)+1;achUnlock('auf1');if(a.prevUp===S.season-1)achUnlock('durch');a.prevUp=S.season;if(c.ups>=5)achUnlock('auf5');
    if(lv===1&&careerOf(id).some(e=>e.lv>=7))achUnlock('dorf')}
  if(lv!=null)a.lv=lv;if(lv===1&&a.dorf!==S.season){a.dorf=S.season;if(careerOf(id).some(e=>e.lv>=7))achUnlock('dorf')}
  // Kader
  const sq=ensureSquad(id).map(pid=>P()[pid]).filter(Boolean);
  if(sq.some(p=>p.s>=90))achUnlock('star');
  if(sq.some(p=>p.yo===id&&p.s>=75))achUnlock('schmiede');
  if(sq.some(p=>p.yo===id))achUnlock('talent');
  // Transfers
  for(const t of (S.tr||[])){if(t.s<(a.since??S.season))break;if(t.to===id&&t.fee>0&&!t.free){achUnlock('kauf1');if(t.fee>=5e7)achUnlock('koenig')}if(t.from===id&&t.fee>=2e7&&!t.free)achUnlock('verkauf')}
  // Finanzen & Stadion
  const f=FZ(id);if(f){if(f.d>0)a.debt=1;else if(a.debt){achUnlock('schulden');a.debt=0}
    const b=lastBal(id);if(b&&f.d<=0&&f.c>=b.rev&&b.rev>0)achUnlock('polster');
    if(a.cap0!=null&&f.cap>a.cap0)achUnlock('tribuene');if(f.cap>=50000)achUnlock('tempel')}
  if((S.euro||[]).some(e=>e.teams.includes(id)))achUnlock('europa');
  if(achSeasonsHere()>=5)achUnlock('treue5');if(achSeasonsHere()>=10)achUnlock('treue10');
  if(achClubs()>=3)achUnlock('wander');
}
// Länge der Serie zu Saisonbeginn (für die Fortsetzung aus der Vorsaison)
function leadRun(done,id,t){let n=0;for(const x of done){const m=x.m,home=m.h===id,op=home?m.ag:m.hg,r=res(m,id);if(t==='w'?r==='S':t==='u'?r!=='N':op===0)n++;else break}return n}
// Saisonende (nach recordSeason, vor den Auf-/Abstiegen)
function achSeason(){if(!S.fav||!T(S.fav))return;const a=ACH(),c=a.c,id=S.fav;achWeek();
  c.seasons=(c.seasons||0)+1;
  const tl=(H().titles[id]||[]).filter(x=>x.s===S.season);
  const liga=tl.some(x=>x.k==='liga'),cup=tl.some(x=>x.k==='pokal'&&!['ucl','uel','uecl'].includes(x.t));
  if(liga){c.titles=(c.titles||0)+1;achUnlock('meister');if(c.titles>=3)achUnlock('meister3');if(tl.some(x=>x.k==='liga'&&x.lv===1&&x.c==='Deutscher Meister'))achUnlock('dm')}
  if(tl.some(x=>x.k==='pokal'))achUnlock('pokal');if(tl.some(x=>x.t==='dfb'))achUnlock('dfb');if(tl.some(x=>x.t==='ucl'))achUnlock('ucl');
  if(liga&&cup)achUnlock('double');
  const lg=lgOf(id);if(lg){const row=table(lg).find(r=>r.id===id);if(row&&row.sp>=10){if(row.n===0)achUnlock('unbesiegt');if(row.p/row.sp>=2.5)achUnlock('punkte')}}
  if(c.seasons>=10)achUnlock('saison10');if(c.seasons>=25)achUnlock('saison25');
  a.carry=a.run?{s:S.season+1,...a.run}:null;
}
// ---------- Ansicht ----------
function renderAch(){const a=ACH(),pts=achPoints(),r=achRank(pts),tot=ACH_L.length,got=Object.keys(a.u).filter(k=>ACH_M.has(k)).length;
  const pr=r.next?Math.round((pts-r.lo)/(r.next[0]-r.lo)*100):100;
  const fresh=new Set(a.fresh||[]);
  const tile=d=>{const u=a.u[d[0]],tier=ACH_T[d[2]],p=!u&&d[6]?d[6]():null;
    return `<div class="ach${u?' on':''} t-${d[2]}${fresh.has(d[0])?' new':''}"><div class="aico" aria-hidden="true">${u?d[3]:'🔒'}</div><div class="atx"><b>${esc(d[4])}</b><span class="meta">${esc(d[5])}</span>${u?`<span class="meta aok">✓ Saison ${u.s}/${String(u.s+1).slice(2)} · ${esc(u.club)}</span>`:p?`<div class="prog"><i style="width:${Math.min(100,Math.round(p[0]/p[1]*100))}%"></i></div><span class="meta">${Math.min(p[0],p[1])} / ${p[1]}</span>`:''}</div><span class="atier">${tier[0]} · ${tier[1]}</span></div>`};
  const groups=ACH_G.filter(([g])=>g!=='karriere'||isCareer()||ACH_L.some(d=>d[1]===g&&a.u[d[0]])).map(([g,t])=>{const ls=ACH_L.filter(d=>d[1]===g),n=ls.filter(d=>a.u[d[0]]).length;
    return `<div class="card"><div class="hd"><h3 class="ct" style="margin:0">${t}</h3><span class="tag">${n} / ${ls.length}</span></div><div class="achs">${ls.slice().sort((x,y)=>(!!a.u[y[0]])-(!!a.u[x[0]])).map(tile).join('')}</div></div>`}).join('');
  a.fresh=[];
  return `<div class="card achhead"><div class="hd"><div><div class="meta">Manager-Rang</div><h2 style="margin:0">${esc(r.n)}</h2></div><div class="achpts"><b>${pts}</b><span class="meta">Manager-Punkte</span></div></div>
    <div class="prog" style="margin-top:10px"><i style="width:${pr}%"></i></div>
    <p class="note" style="margin-top:6px">${r.next?`Noch ${r.next[0]-pts} Punkte bis zum Rang „${esc(r.next[1])}“.`:'Höchster Rang erreicht.'} ${got} von ${tot} Erfolgen freigeschaltet. Erfolge zählen für dich als Manager – sie bleiben erhalten, wenn du den Verein wechselst.</p></div>`+groups;
}
// ---------- Saisonrückblick für Mein Verein (erscheint nach „Neue Saison“) ----------
function reviewSnap(){S.review=null;if(!S.fav||!T(S.fav))return;const id=S.fav,lg=lgOf(id);if(!lg)return;
  const tb=table(lg),i=tb.findIndex(r=>r.id===id),row=tb[i]||{};
  const ss=(SS()[lg.id]||{}),sc=Object.entries(ss).filter(([pid,r])=>r[3]===id&&P()[pid]).sort((a,b)=>b[1][0]-a[1][0]||b[1][1]-a[1][1]).slice(0,3).map(([pid,r])=>[P()[pid].n,r[0],r[1]]);
  const cups=S.cups.filter(c=>c.teams.includes(id)).map(c=>[c.name,c.played?cupReach(c,id)||'1. Runde':'–']).concat((S.euro||[]).filter(e=>e.teams.includes(id)).map(e=>[e.name,euroReach(e,id)||'Ligaphase']));
  const tl=(H().titles[id]||[]).filter(x=>x.s===S.season).map(x=>x.c);
  const done=teamMatches(id).filter(x=>x.done&&x.m&&x.m.hg!=null);let best=null;done.forEach(x=>{const m=x.m,me=m.h===id?m.hg:m.ag,op=m.h===id?m.ag:m.hg;if(me>op&&(!best||me-op>best[0]))best=[me-op,`${T(m.h).name} ${m.hg}:${m.ag} ${T(m.a).name}`,x.comp]});
  S.review={s:S.season,id,name:T(id).name,lg:lg.name,lv:lg.foreign?1:lg.level,pos:i+1,n:tb.length,z:zone(lg,i,tb.length),row:[row.sp,row.s,row.u,row.n,row.tf,row.tg,row.p],sc,cups,tl,best,r0:+T(id).r.toFixed(1),
    ach:Object.entries(ACH().u).filter(([k,v])=>v.s===S.season&&ACH_M.has(k)).map(([k])=>k),conf:isCareer()&&S.career?Math.round(S.career.conf):null,goal:isCareer()&&S.career&&S.career.goal?[S.career.goal.label,S.career.goal.pos]:null}}
function reviewHTML(){const R=S.review;if(!R)return '';const id=R.id,nl=S.fav===id?lgOf(id):null,f=FZ(id),h=f&&f.h[0]&&f.h[0][0]===R.s?f.h[0]:null;
  const mv=nl&&!nl.foreign?(nl.level<R.lv?['up','⬆️ Aufstieg in die '+nl.name]:nl.level>R.lv?['down','⬇️ Abstieg in die '+nl.name]:null):null;
  const sl=s=>`${s}/${String(s+1).slice(2)}`,[sp,w,d,l,tf,tg,p]=R.row;
  const big=R.tl.length?'🏆 '+R.tl.join(' · '):mv&&mv[0]==='up'?mv[1]:R.pos===1?'Platz 1':`Platz ${R.pos} von ${R.n}`;
  const g=R.goal?(R.pos<=R.goal[1]?`<b class="ok">Saisonziel erreicht</b> (${esc(R.goal[0])})`:`<b class="no">Saisonziel verfehlt</b> (${esc(R.goal[0])}, Platz ${R.goal[1]})`):'';
  return `<div class="ovc rvw"><div class="rvhero ${R.tl.length?'gold':mv?mv[0]:''}"><div class="meta">Saison ${sl(R.s)} · ${esc(R.lg)}</div><div class="crh" style="justify-content:center">${crestFor(id,48)}</div><h2>${esc(big)}</h2><p class="meta">${esc(R.name)}${R.tl.length?` · Platz ${R.pos} in der ${esc(R.lg)}`:''}</p></div>
  <div class="facts rvf"><div><small>Platz</small><b>${R.pos}. / ${R.n}</b></div><div><small>Punkte</small><b>${p??'–'}</b></div><div><small>Bilanz</small><b>${w}-${d}-${l}</b></div><div><small>Tore</small><b>${tf}:${tg}</b></div>${h?`<div><small>Finanzen</small><b class="${h[3]<0?'no':'ok'}">${h[3]<0?'−':'+'}${money(Math.abs(h[3]))}</b></div>`:''}<div><small>Spielstärke</small><b>${R.r0}</b></div></div>
  ${mv&&!(R.tl.length&&mv[0]==='up'&&big===mv[1])?`<p class="rvmv ${mv[0]}">${esc(mv[1])}</p>`:''}${g?`<p class="note" style="text-align:center">${g}${R.conf!=null?` · Vertrauen des Vorstands ${R.conf}/100`:''}</p>`:''}
  <div class="grid2" style="margin-top:12px"><div><h3 class="ct">Torjäger</h3>${R.sc.length?R.sc.map(([n,g_,a],i)=>`<div class="orow"><span>${i+1}. <b>${esc(n)}</b></span><span class="meta">${g_} Tore · ${a} Vorlagen</span></div>`).join(''):'<p class="meta">Keine Statistik</p>'}
   ${R.best?`<h3 class="ct" style="margin-top:12px">Höchster Sieg</h3><p class="meta">${esc(R.best[1])} · ${esc(R.best[2])}</p>`:''}</div>
   <div><h3 class="ct">Wettbewerbe</h3>${R.cups.length?R.cups.map(([c,r])=>`<div class="orow"><span>${esc(c)}</span><b>${esc(r)}</b></div>`).join(''):'<p class="meta">Keine Pokalspiele</p>'}</div></div>
  ${R.ach.length?`<h3 class="ct" style="margin-top:14px">Neue Erfolge</h3><div class="achs">${R.ach.map(k=>{const d=ACH_M.get(k);return `<div class="ach on t-${d[2]}"><div class="aico">${d[3]}</div><div class="atx"><b>${esc(d[4])}</b><span class="meta">+${ACH_T[d[2]][1]} Manager-Punkte</span></div></div>`}).join('')}</div>`:''}
  <div class="ctrls" style="justify-content:center;margin-top:16px"><button class="btn" data-act="ftab:erfolge">🏅 Alle Erfolge</button><button class="btn pri" data-act="ovx">Weiter zur Saison ${sl(S.season)}</button></div></div>`}
// Kompakte Karte im Überblick von Mein Verein
function achCard(){const a=ACH(),pts=achPoints(),r=achRank(pts),last=Object.entries(a.u).filter(([k])=>ACH_M.has(k)).sort((x,y)=>y[1].s-x[1].s).slice(0,3).map(([k])=>ACH_M.get(k));
  const pr=r.next?Math.round((pts-r.lo)/(r.next[0]-r.lo)*100):100;
  return `<div class="card"><div class="hd"><div><div class="meta">Manager-Rang · ${pts} Punkte</div><h3 class="ct" style="margin:0">🏅 ${esc(r.n)}</h3></div><button class="btn sm" data-act="ftab:erfolge">Erfolge</button></div>
   <div class="prog" style="margin-top:8px"><i style="width:${pr}%"></i></div>${last.length?`<p class="meta" style="margin-top:8px">Zuletzt: ${last.map(d=>d[3]+' '+esc(d[4])).join(' · ')}</p>`:'<p class="meta" style="margin-top:8px">Gewinne Spiele, Titel und Derbys, um Erfolge freizuschalten.</p>'}</div>`}
