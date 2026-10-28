// ---------- Karriere: Vorstand, Saisonziele, Vertrauen, Entlassung, Ruf, Jobangebote, Jugendakademie ----------
const isCareer=()=>S.mode==='career'&&!!S.career;
const REQ_REP={1:82,2:66,3:54,4:42,5:32,6:22,7:12,8:0,9:0,10:0};
function lvOfId(id){const l=lgOf(id);return l?(l.foreign?1:l.level):9}
function newCareer(name,club,start){S.mode='career';start=start||'club';
  const lic=start==='zero'?0:start==='pro'?2:Math.max(0,LIC.findIndex(L_=>lvOfId(club)>=L_.min));
  S.career={name:name||'Trainer',club:null,rep:start==='zero'?2:start==='pro'?24:Math.max(5,REQ_REP[lvOfId(club)]+3),conf:60,goal:null,offers:[],jobless:true,hist:[],started:S.season,lic,money:start==='zero'?3000:start==='pro'?250000:20000,course:null,start};
  if(club)takeJob(club,true);else{S.fav=null;S.career.offers=jobOffers(2,true)}}
function takeJob(club,first){const c=S.career;if(c.club&&c.club!==club)endJob('gewechselt');
  c.club=club;c.jobless=false;c.conf=60;c.since=S.season;c.offers=[];c.stats={g:0,w:0,d:0,l:0,titles:[]};
  S.fav=club;S.mgr=null;S.scout=null;S.acad=null;S.fin={log:[],income:[]};S.invOffer=null;ensureSquad(club);FZ(club);MG();bestXI();recalc(club);
  const t=T(club);t.ppl=t.ppl||{};t.ppl.tr=c.name;setGoal();
  if(!first)try{addNews({cat:'fav',clubs:[club],h:`${t.name} stellt ${c.name} als neuen Trainer vor`,b:`${c.name} übernimmt ab sofort das Traineramt. Ziel des Vorstands: ${c.goal?c.goal.label:'eine stabile Saison'}.`,pr:q(club,'pr',`Wir sind überzeugt, mit ${c.name} den richtigen Mann für unseren Weg gefunden zu haben.`),press:true,imp:3})}catch(e){}}
function endJob(why){const c=S.career;if(!c||!c.club)return;const st=c.stats||{g:0,w:0,d:0,l:0,titles:[]};
  c.hist.unshift({club:c.club,name:T(c.club)?T(c.club).name:'?',from:c.since,to:S.season,g:st.g,w:st.w,d:st.d,l:st.l,titles:st.titles.slice(),end:why})}
// Erwarteter Platz aus der Spielstärke, daraus das Saisonziel
function setGoal(){const c=S.career;if(!c||!c.club)return;const lg=lgOf(c.club);if(!lg){c.goal=null;return}
  const order=lg.teams.slice().sort((a,b)=>effR(b)-effR(a)),e=order.indexOf(c.club)+1,n=lg.teams.length;
  let target=Math.min(n,e+(e<=2?0:e<=n/2?1:2));
  while(target>1&&zone(lg,target-1,n)==='down')target--;
  const z=zone(lg,target-1,n);
  const label=target===1?(lg.level===1&&!lg.foreign?'Deutsche Meisterschaft':'Meisterschaft'):z==='up'?'Aufstieg':z==='cl'?'Champions-League-Platz':z==='el'||z==='ecl'?'Europapokal-Platz':target<=Math.ceil(n/2)?'Obere Tabellenhälfte':target>=n-4?'Klassenerhalt':'Gesichertes Mittelfeld';
  c.goal={lg:lg.id,pos:target,exp:e,label,season:S.season}}
function confLabel(v){return v>=75?'Volles Vertrauen':v>=55?'Zufrieden':v>=38?'Skeptisch':v>=22?'Unruhig – es wird eng':'Akut gefährdet'}
// nach jedem Ligaspiel von Mein Verein
function careerAfterMatch(m){if(!isCareer())return;const c=S.career;if(!c.club||(m.h!==c.club&&m.a!==c.club))return;
  const me=m.h===c.club?m.hg:m.ag,op=m.h===c.club?m.ag:m.hg,opp=m.h===c.club?m.a:m.h;const pr=matchProb(m.h,m.a);const pw=m.h===c.club?pr.h:pr.a;
  const E=3*pw+pr.d,pts=me>op?3:me===op?1:0;c.conf=Math.max(0,Math.min(100,+(c.conf+(pts-E)*2.6).toFixed(1)));
  const st=c.stats;st.g++;if(pts===3)st.w++;else if(pts===1)st.d++;else st.l++;
  const lg=lgOf(c.club);if(lg&&lg.played>=8&&c.conf<12)fireCoach('Vertrauen aufgebraucht')}
function fireCoach(why){const c=S.career,club=c.club;if(!club)return;const t=T(club);endJob('entlassen');
  try{addNews({cat:'fav',clubs:[club],h:`${t.name} trennt sich von Trainer ${c.name}`,b:`Der Vorstand zieht die Reißleine (${why}). ${c.name} ist ab sofort ohne Verein.`,pr:q(club,'pr',`Wir danken ${c.name} für die geleistete Arbeit. Die sportliche Entwicklung hat uns aber zu diesem Schritt gezwungen.`),press:true,imp:3})}catch(e){}
  c.rep=Math.max(0,c.rep-6);c.club=null;c.jobless=true;c.goal=null;delete t.ppl.tr;S.fav=null;S.mgr=null;S.acad=null;c.offers=[];c.firedAt=S.season*100+S.round;
  setTimeout(()=>{try{toast('Du wurdest entlassen – unter „Verein“ findest du freie Stellen')}catch(e){}},200)}
// Saisonende
function careerSeasonEnd(st,log){if(!isCareer())return;const c=S.career;
  if(c.club){const lv=lvOfId(c.club);c.money=(c.money||0)+Math.round((SALARY[lv]||600)*(0.8+c.rep/250));}
  if(c.club&&c.goal){const lg=L(c.goal.lg);const pos=st[c.goal.lg]?st[c.goal.lg].indexOf(c.club)+1:0;const diff=c.goal.pos-pos;
    c.conf=Math.max(0,Math.min(100,c.conf+(diff>=0?14+5*Math.min(diff,4):-11*Math.min(-diff,5))));
    const z=FZ(c.club);if(z&&z.h[0]&&z.h[0][3]<0)c.conf=Math.max(0,c.conf-4);if(z&&z.ins&&z.ins[0]===S.season)c.conf=Math.max(0,c.conf-30);
    const lv=lg?(lg.foreign?1:lg.level):8,wt=Math.max(1,9-lv)/4;let dr=(diff>=0?2+diff:-2+diff*1.2)*wt;
    if(pos===1){dr+=6*wt;c.stats.titles.push(`${lg.name} ${sl2(S.season)}`)}
    S.cups.filter(cu=>cu.winner===c.club).forEach(cu=>{dr+=(cu.type==='dfb'?8:3);c.stats.titles.push(`${cu.name} ${sl2(S.season)}`)});
    (S.euro||[]).filter(e=>e.winner===c.club).forEach(e=>{dr+=15;c.stats.titles.push(`${e.name} ${sl2(S.season)}`)});
    c.rep=Math.max(0,Math.min(100,+(c.rep+dr).toFixed(1)));
    log.push(`${c.name} (${T(c.club).name}): Ziel ${c.goal.label} (Platz ${c.goal.pos}) – erreicht wurde Platz ${pos}. Vertrauen des Vorstands: ${Math.round(c.conf)}/100`);
    if(c.conf<22){fireCoach('Saisonziel klar verfehlt');return}
    // Angebote anderer Vereine für einen erfolgreichen Trainer
    c.offers=jobOffers(diff>=0?2:1,false);
    // Aufgestiegen über die eigene Lizenz hinaus? Eine Saison Ausnahmegenehmigung
    const nl=lvOfId(c.club);if(!licOk(nl)){if(c.grace&&c.grace<S.season){fireCoach('fehlende Trainerlizenz');return}c.grace=c.grace||S.season+1;log.push(`${c.name}: Für die ${LEVELS[nl]||nl+'. Liga'} fehlt die Lizenz – der Verband erteilt eine Ausnahmegenehmigung für eine Saison`)}else c.grace=null}
  else if(c.jobless)c.offers=jobOffers(3,true);
}
function jobOffers(n,jobless){const c=S.career,rep=c.rep+(jobless?6:0),cur=c.club?lvOfId(c.club):9;const out=[];
  const levels=Object.keys(REQ_REP).map(Number).filter(lv=>lv<=9&&REQ_REP[lv]<=rep&&licOk(lv)&&(jobless||lv<cur||(lv===cur&&Math.random()<.4)));
  if(!levels.length)return out;
  const best=levels.sort((a,b)=>a-b).slice(0,3);
  for(let i=0;i<n*3&&out.length<n;i++){const lv=rpick(best,Math.random);
    const ls=S.leagues.filter(l=>!l.foreign&&l.level===lv&&!l.teams.includes(c.club));if(!ls.length)continue;const lg=rpick(ls,Math.random);
    const tb=table(lg);const pool=(jobless?tb.slice(Math.floor(tb.length/2)):tb).map(r=>r.id).filter(id=>id!==c.club&&!isRes(T(id).name)&&!out.some(o=>o.club===id));
    if(pool.length)out.push({club:rpick(pool,Math.random),s:S.season,r:S.round})}
  return out}
function careerDay(){if(!isCareer())return;const c=S.career;courseTick();
  if(c.jobless&&Math.random()<.18&&c.offers.length<4){const o=jobOffers(1,true);c.offers.push(...o);if(o.length)try{toast(`Jobangebot: ${T(o[0].club).name} möchte dich als Trainer`)}catch(e){}}
  if(!c.jobless&&c.offers.length&&S.round>6)c.offers=[]}
// Jugendakademie (Mein Verein)
const ACAD=[{n:'Einfache Nachwuchsarbeit',b:0,cost:.004},{n:'Nachwuchsleistungszentrum (Basis)',b:2,cost:.012},{n:'Nachwuchsleistungszentrum',b:4,cost:.025},{n:'Modernes Leistungszentrum',b:6,cost:.045},{n:'Akademie der Spitzenklasse',b:9,cost:.075}];
function AC(){if(!S.acad)S.acad={lv:0,intake:[],s:null};return S.acad}
function academyIntake(log){if(!S.fav||!T(S.fav))return;const a=AC(),t=T(S.fav);
  a.intake.forEach(pid=>delete P()[pid]);a.intake=[];const n=3+Math.floor(Math.random()*3);
  for(let i=0;i<n;i++){const pos=rpick(['TW','AB','AB','MF','MF','MF','ST','ST'],Math.random);const pot=Math.min(99,youthPot(t)+ACAD[a.lv].b+gauss()*2);const age=16+Math.floor(Math.random()*2);
    const id=newPlayer(t,pos,pot-(13+Math.random()*6),age);P()[id].pot=+pot.toFixed(1);P()[id].yb=(Math.random()*2-1)*7;a.intake.push(id)}
  a.s=S.season;log&&log.push(`${t.name}: ${n} Talente aus der eigenen Jugend stellen sich vor`);
  try{addNews({cat:'fav',clubs:[S.fav],h:`${t.name}: Neuer Jahrgang aus der Jugend`,b:`${n} Nachwuchsspieler hoffen auf den Sprung in den Profikader. Die Entscheidung liegt beim Trainer.`,imp:2})}catch(e){}}
function youthReport(pid){const a=AC(),p=P()[pid];if(!p)return null;const k=Math.min(.85,.3+a.lv*.1),pot=potOf(p),c=pot+(p.yb||0)*(1-k),w=(1-k)*10+1;
  const lo=Math.max(p.s,c-w),hi=Math.min(99,c+w);const fr=T(S.fav).r;const stars=v=>Math.max(.5,Math.min(5,Math.round(((v-fr+12)/5)*2)/2));return {lo,hi,st:[stars(lo),stars(hi)],k}}
// ---------- Ansicht: Karriere & Jugend ----------
function repLabel(r){return r>=85?'Weltklasse':r>=70?'International gefragt':r>=55?'Bundesweit bekannt':r>=40?'Regional bekannt':r>=20?'Lokal bekannt':'Unbeschriebenes Blatt'}
function careerHist(){const c=S.career;const rows=c.hist;return rows.length?`<div class="scroll"><table><thead><tr><th class="l">Verein</th><th class="l">Zeitraum</th><th>Spiele</th><th>S-U-N</th><th class="l">Titel</th><th class="l">Ende</th></tr></thead><tbody>${rows.map(h=>`<tr><td class="l team">${T(h.club)?tl(h.club):esc(h.name)}</td><td class="l">${sl2(h.from)} – ${sl2(h.to)}</td><td>${h.g}</td><td>${h.w}-${h.d}-${h.l}</td><td class="l team">${h.titles.map(esc).join(', ')||'–'}</td><td class="l">${h.end}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Noch keine früheren Stationen.</div>'}
function offersHTML(){const c=S.career;return c.offers.length?c.offers.filter(o=>T(o.club)).map((o,i)=>{const l=lgOf(o.club);return `<div class="orow offer"><span><b>${esc(T(o.club).name)}</b> <span class="meta">${l?esc(l.name):''} · Spielstärke ${T(o.club).r.toFixed(0)} · Kontostand ${sgn(FZ(o.club)?FZ(o.club).c:0)}</span></span><span class="ctrls"><button class="btn sm" data-act="club:${o.club}">Ansehen</button><button class="btn sm pri" data-act="jobacc:${i}">Annehmen</button><button class="btn sm" data-act="jobdec:${i}">Ablehnen</button></span></div>`}).join(''):'<div class="empty">Zurzeit keine Angebote.</div>'}
function renderCareer(id){const c=S.career,g=c.goal,lg=g&&L(g.lg),tb=lg?table(lg):[],pos=tb.findIndex(r=>r.id===id)+1;const st=c.stats||{g:0,w:0,d:0,l:0,titles:[]};
  return `<div class="grid2"><div class="card"><div class="hd"><div><div class="meta">Vorstand</div><h3 class="ct" style="margin:0">${g?esc(g.label):'Kein Ziel'}</h3></div><span class="tag">Saison ${sl2(S.season)}</span></div>
   ${g?`<div class="facts"><div><small>Ziel</small><b>Platz ${g.pos}</b></div><div><small>Aktuell</small><b class="${pos&&pos<=g.pos?'ok':pos?'no':''}">${pos?'Platz '+pos:'–'}</b></div><div><small>Erwartet laut Kader</small><b>Platz ${g.exp}</b></div></div>`:''}
   <h3 class="ct" style="margin-top:14px">Vertrauen des Vorstands</h3><div class="prog conf"><i style="width:${c.conf}%;background:${c.conf<25?'var(--down)':c.conf<45?'var(--rel)':'var(--accent)'}"></i></div>
   <p class="meta" style="margin:6px 0 0"><b>${confLabel(c.conf)}</b> · ${Math.round(c.conf)}/100. Jedes Ligaspiel zählt gemessen an der Erwartung; am Saisonende entscheidet das Ziel. Unter 12 Punkten (ab dem 8. Spieltag) oder unter 22 am Saisonende folgt die Entlassung.</p></div>
  <div class="card"><div class="hd"><div><div class="meta">Trainer</div><h3 class="ct" style="margin:0">${esc(c.name)}</h3></div><span class="tag">${repLabel(c.rep)}</span></div>
   <div class="facts"><div><small>Ruf</small><b>${Math.round(c.rep)}/100</b></div><div><small>Bei ${esc(T(id).name)}</small><b>seit ${sl2(c.since)}</b></div><div><small>Bilanz</small><b>${st.w}-${st.d}-${st.l}</b></div><div><small>Titel</small><b>${st.titles.length+c.hist.reduce((a,h)=>a+h.titles.length,0)}</b></div></div>
   <p class="note" style="margin-top:8px">Der Ruf steigt mit erreichten Zielen, Titeln und Aufstiegen – je höher die Liga, desto mehr. Mit gutem Ruf melden sich größere Vereine.</p></div></div>
  <div class="grid2"><div class="card"><h3 class="ct">Jobangebote</h3>${offersHTML()}</div>${licenseCard()}</div>
  <div class="card"><h3 class="ct">Karriere</h3>${careerHist()}</div>`}
function licenseCard(){const c=S.career,cur=LIC[c.lic||0],nx=LIC[(c.lic||0)+1];
  return `<div class="card"><div class="hd"><div><div class="meta">Trainerlizenz</div><h3 class="ct" style="margin:0">${cur.n}</h3></div><span class="tag">Privatkonto ${money(c.money||0)}</span></div>
   <p class="note" style="margin:0 0 8px">Erlaubt: ${licRange(c.lic||0)}.</p>
   ${c.course?`<div class="meta">Lehrgang ${LIC[c.course.i].n}: noch etwa ${Math.ceil(c.course.left/(c.jobless?1.6:1))} Wochen</div><div class="prog" style="margin-top:6px"><i style="width:${Math.round((1-c.course.left/LIC[c.course.i].dur)*100)}%"></i></div>`
    :nx?`<div class="orow"><span><b>Nächster Schritt: ${nx.n}</b> <span class="meta">erlaubt ${licRange(LIC.indexOf(nx))} · ${nx.dur} Wochen · ${money(nx.cost)}${nx.rep?` · ab ${nx.rep} Ruf`:''}${nx.seasons?` · ${nx.seasons} ${nx.seasons===1?'Saison':'Saisons'} Erfahrung`:''}${nx.exam?' · Abschlussprüfung':''}</span></span><button class="btn sm pri" data-act="course">Lehrgang beginnen</button></div>`:'<div class="meta">Du hast die höchste Lizenz.</div>'}
   <p class="note" style="margin-top:8px">Ohne Verein geht der Lehrgang schneller. Als Trainer bekommst du am Saisonende dein Gehalt aufs Privatkonto – je höher die Liga, desto mehr.</p></div>`}
function vacHTML(){const v=vacancies();return v.length?v.map(id=>{const l=lgOf(id),ch=applyChance(id),ok=licOk(lvOfId(id));const done=S.career.applied&&S.career.applied[id+':'+S.season];
  return `<div class="orow"><span><b>${esc(T(id).name)}</b> <span class="meta">${l?esc(l.name):''} · Spielstärke ${T(id).r.toFixed(0)} · Chance ${Math.round(ch*100)} %</span></span><span class="ctrls"><button class="btn sm" data-act="club:${id}">Ansehen</button>${done?'<span class="tag">abgelehnt</span>':ok?`<button class="btn sm pri" data-act="apply:${id}">Bewerben</button>`:'<span class="tag">Lizenz fehlt</span>'}</span></div>`}).join(''):'<div class="empty">Gerade keine passenden Stellen frei – simuliere ein paar Spieltage.</div>'}
function renderJobless(){const c=S.career;return `<div class="card favhead"><div class="hd"><div><div class="meta">Karriere · ${esc(c.name)}</div><h2>Ohne Verein</h2></div><span class="tag">Ruf ${Math.round(c.rep)} · ${repLabel(c.rep)}</span></div>
  <p class="note">Simuliere weiter – Vereine mit freier Trainerstelle melden sich. Je besser dein Ruf, desto größer die Vereine.</p></div>
  <div class="grid2"><div><div class="card"><h3 class="ct">Jobangebote</h3>${offersHTML()}</div><div class="card"><h3 class="ct">Freie Stellen</h3><p class="note" style="margin:-4px 0 8px">Bewirb dich selbst – jeder Verein antwortet einmal pro Saison. Die Chance hängt von deinem Ruf ab.</p>${vacHTML()}</div></div>
  <div>${licenseCard()}<div class="card"><h3 class="ct">Karriere</h3>${careerHist()}</div></div></div>`}
function renderAcademy(id){const a=AC(),rev=(FZ(id).h[0]?FZ(id).h[0][1]:estRevenue(id));
  const rows=a.intake.filter(pid=>P()[pid]).map(pid=>({pid,p:P()[pid],r:youthReport(pid)}));
  return `<div class="card"><div class="hd"><div><div class="meta">Jugendakademie</div><h3 class="ct" style="margin:0">${ACAD[a.lv].n}</h3></div><span class="tag">${money(rev*ACAD[a.lv].cost)} pro Saison</span></div>
   <p class="note">Jedes Saisonende stellt sich ein neuer Jahrgang mit 3 bis 5 Talenten vor. Eine bessere Akademie bringt talentiertere Spieler und eine genauere Einschätzung durch die Jugendtrainer. Wer nicht in den Profikader übernommen wird, verlässt den Verein, wenn der nächste Jahrgang kommt.</p>
   <div class="chipbar" style="flex-wrap:wrap">${ACAD.map((x,i)=>`<button class="${i===a.lv?'on':''}" data-act="acadlv:${i}">${x.n} · ${money(rev*x.cost)}</button>`).join('')}</div></div>
  <div class="card"><h3 class="ct">Aktueller Jahrgang${a.s?' '+sl2(a.s):''}</h3>${rows.length?`<div class="scroll"><table><thead><tr><th class="l">Spieler</th><th>Alter</th><th>Stärke</th><th class="l">Einschätzung der Jugendtrainer</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td class="l team"><span class="pos-${x.p.p}">${x.p.p}</span> ${esc(x.p.n)}</td><td>${x.p.a}</td><td>${x.p.s.toFixed(1)}</td><td class="l">${starsHTML(x.r.st[0],x.r.st[1])}</td><td class="l"><button class="btn sm pri" data-act="ypro:${x.pid}">In den Kader</button> <button class="btn sm" data-act="yrel:${x.pid}">Abgeben</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Der erste Jahrgang kommt am Saisonende.</div>'}</div>`}
// ---------- Trainerlizenzen, Gehalt, Bewerbungen ----------
// Vereinfachte Anlehnung an die DFB-Ausbildung: höhere Lizenzen erlauben höhere Spielklassen
const LIC=[{k:'0',n:'Keine Lizenz',min:8},{k:'C',n:'C-Lizenz',min:7,dur:10,cost:600,rep:0,seasons:0},{k:'B',n:'B-Lizenz',min:5,dur:18,cost:2500,rep:12,seasons:0},{k:'A',n:'A-Lizenz',min:4,dur:28,cost:7500,rep:28,seasons:1},{k:'P',n:'Pro-Lizenz (Fußballlehrer)',min:1,dur:38,cost:22000,rep:42,seasons:2,exam:.8}];
const SALARY={1:1.6e6,2:4.2e5,3:1.6e5,4:6e4,5:2.4e4,6:1e4,7:4500,8:1800,9:1000,10:600};
const licOk=(lv)=>lv>=LIC[S.career.lic||0].min;
function licRange(i){const m=LIC[i].min;return m===1?'alle Ligen':m===8?'Kreisliga und tiefer':`ab der ${LEVELS[m]||m+'. Liga'} abwärts`}
function seasonsCoached(){const c=S.career;return c.hist.reduce((a,h)=>a+Math.max(0,h.to-h.from),0)+(c.club?S.season-c.since:0)}
function startCourse(){const c=S.career,i=(c.lic||0)+1,L_=LIC[i];if(!L_)return 'max';if(c.course)return 'läuft';
  if(c.rep<L_.rep)return `Dafür brauchst du mindestens ${L_.rep} Ruf`;if(seasonsCoached()<L_.seasons)return `Dafür brauchst du ${L_.seasons} ${L_.seasons===1?'Saison':'Saisons'} Erfahrung als Trainer`;
  if((c.money||0)<L_.cost)return `Der Lehrgang kostet ${money(L_.cost)} – dein Konto reicht nicht`;
  c.money-=L_.cost;c.course={i,left:L_.dur};return 'ok'}
function courseTick(){const c=S.career;if(!c||!c.course)return;c.course.left-=c.jobless?1.6:1;if(c.course.left>0)return;
  const L_=LIC[c.course.i];const pass=Math.random()<(L_.exam||1);
  if(pass){c.lic=c.course.i;c.rep=Math.min(100,c.rep+3);try{addNews({cat:'fav',clubs:c.club?[c.club]:[],h:`${c.name} besteht die ${L_.n}`,b:`Damit darf ${c.name} jetzt ${licRange(c.lic)} trainieren.`,imp:2});toast(`${L_.n} bestanden!`)}catch(e){}}
  else{try{addNews({cat:'fav',clubs:[],h:`${c.name} fällt durch die Prüfung zur ${L_.n}`,b:'Ein neuer Anlauf ist jederzeit möglich – die Kosten fallen erneut an.',imp:2});toast('Prüfung nicht bestanden')}catch(e){}}
  c.course=null}
// Freie Stellen (für Arbeitslose) und Bewerbungen
function vacancies(){const c=S.career;if(!c.vac||c.vacS!==S.season*100+Math.floor(S.round/4)){c.vacS=S.season*100+Math.floor(S.round/4);
    const lvls=[1,2,3,4,5,6,7,8,9].filter(lv=>licOk(lv)&&REQ_REP[lv]<=c.rep+22).sort((a,b)=>a-b).slice(0,5);const out=[];
    for(let i=0;i<16&&out.length<6;i++){const lv=rpick(lvls,Math.random);const ls=S.leagues.filter(l=>!l.foreign&&l.level===lv);if(!ls.length)continue;const lg=rpick(ls,Math.random);const tb=table(lg);
      const id=rpick(tb.slice(Math.floor(tb.length*.4)).map(r=>r.id),Math.random);if(id&&!isRes(T(id).name)&&!out.includes(id)&&id!==c.club)out.push(id)}
    c.vac=out}
  return c.vac.filter(T)}
function applyChance(id){const lv=lvOfId(id);return Math.max(.04,Math.min(.92,.35+(S.career.rep-REQ_REP[lv])/35))}
function applyJob(id){const c=S.career;if(!licOk(lvOfId(id)))return 'lizenz';c.applied=c.applied||{};const k=id+':'+S.season;if(c.applied[k])return 'schon';c.applied[k]=1;
  if(Math.random()<applyChance(id)){takeJob(id);return 'ok'}return 'nein'}
