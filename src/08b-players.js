// ---------- Spieler: Verträge, Gehälter, Form, Moral, Verletzungen, Scouting ----------
// Kurzfelder am Spieler: c = Vertrag bis (Saisonjahr), w = Jahresgehalt, inj = Ausfall in Wochen, it = Verletzungsart, fo = persönliche Form
// Am Verein: fm = Teamform (-3…+3), mo = Moral (0…100)
const lvOfTeam=id=>{const l=lgOf(id);return l?(l.foreign?1:l.level):6};
function marketWage(pid,club){const z=T(club)&&T(club).fz;const lv=lvOfTeam(club);return Math.round(value(pid)*(WRATIO[lv]||.03)*((z&&z.wf)||1)/100)*100}
function ensureContract(pid,club){const p=P()[pid];if(!p)return;if(p.c==null){const R=srng(hstr('c'+pid));p.c=S.season+1+Math.floor(R()*4);p.w=marketWage(pid,club)}}
function setContract(pid,club,years){const p=P()[pid];if(!p)return;const y=years||(p.a>=31?1+Math.floor(Math.random()*2):2+Math.floor(Math.random()*4));
  p.c=S.season+y;p.w=Math.round(marketWage(pid,club)*(0.93+Math.random()*0.15)/100)*100}
function wageOf(pid,club){const p=P()[pid];if(!p)return 0;ensureContract(pid,club);return p.w}
// Effektive Stärke im Spiel: Grundstärke + Form + Moral
function effR(id){const t=T(id);return t.r+(t.fm||0)*0.5+(((t.mo??60)-60)/15)+famPenalty(id)}
// Nach jedem Pflichtspiel: Form, Moral, Verletzungen
const INJ=[['Prellung',1,2,30],['Grippaler Infekt',1,2,18],['Zerrung',2,4,22],['Muskelfaserriss',3,6,14],['Bänderdehnung',2,5,8],['Sprunggelenksverletzung',4,8,4],['Muskelbündelriss',6,10,2],['Meniskusschaden',8,16,1],['Bänderriss',10,18,.6],['Mittelfußbruch',12,20,.4],['Kreuzbandriss',30,45,.5]];
function afterMatch(m,lv){
  const res=m.hg>m.ag?[1,-1]:m.hg<m.ag?[-1,1]:[0,0];
  [[m.h,res[0],m.hg-m.ag],[m.a,res[1],m.ag-m.hg]].forEach(([id,r,gd])=>{const t=T(id);if(!t)return;
    t.fm=+((t.fm||0)*0.72+r*0.85+Math.max(-1,Math.min(1,gd/4))*0.3).toFixed(2);
    t.mo=Math.round(Math.max(5,Math.min(100,(t.mo??60)+(60-(t.mo??60))*0.1+r*4+(Math.abs(gd)>=3?r*2:0))));
    if(Math.random()<(lv<=2?.16:.11)*injuryMod(id)*fatInjMod(id)) injure(id);
    if(id===S.fav) trainTick();
    if(id===S.fav)(t.sq||[]).forEach(pid=>{const p=P()[pid];if(p)p.fo=+Math.max(-3,Math.min(3,(p.fo||0)*0.7+gauss()*0.6+r*0.25)).toFixed(1)});
  });
}
function injure(id){const t=T(id);if(!t||!t.sq)return;const fit=t.sq.filter(pid=>P()[pid]&&!P()[pid].inj);if(fit.length<14)return;
  let pid=fit[Math.floor(Math.random()*fit.length)];
  if(id===S.fav&&S.mgr){const xi=new Set(mgrXI(id).xi);pid=wpickR(fit,fit.map(x=>(xi.has(x)?3:0.6)*(1+Math.max(0,90-curFi(P()[x]))/12)),Math.random)}
  const p=P()[pid];
  const [n,lo,hi]=wpickR(INJ,INJ.map(x=>x[3]),Math.random);const d=lo+Math.floor(Math.random()*(hi-lo+1));
  p.inj=d;p.it=n;if(!S.inj)S.inj=[];S.inj.push([pid,id]);if(p.s>=t.r-4)recalc(id);
  if(id===S.fav||(lvOfTeam(id)<=1&&p.s>=86&&d>=6)) try{addNews({cat:id===S.fav?'fav':'liga',clubs:[id],h:`${t.name} muss auf ${p.n} verzichten`,b:`${p.n} (${POSN[p.p]}) fällt mit ${n} voraussichtlich ${d} ${d===1?'Spiel':'Spiele'} aus.`,imp:d>=10?2:1})}catch(e){}
}
function tickInjuries(){if(!S.inj||!S.inj.length)return;const keep=[],touched=new Set();
  for(const e of S.inj){const p=P()[e[0]];if(!p||!p.inj){continue}p.inj--;if(p.inj<=0){delete p.inj;delete p.it;touched.add(e[1])}else keep.push(e)}
  S.inj=keep;touched.forEach(id=>{if(T(id))recalc(id)})}
// Saisonende: auslaufende Verträge (Verlängerung, ablösefreier Wechsel, Karriereende) und Abstiegsklausel
function contractsSeason(log,lvOld){
  const freeAgents=[];let renew=0,left=0;
  for(const t of Object.values(S.teams)){if(!t.sq)continue;const l=lgOf(t.id);if(!l)continue;
    const lvNew=l.foreign?1:l.level,lo=lvOld[t.id];
    if(lo&&lo!==lvNew){const f=(WRATIO[lvNew]||.03)/(WRATIO[lo]||.03);t.sq.forEach(pid=>{const p=P()[pid];if(p&&p.w)p.w=Math.round(p.w*(f<1?Math.max(f,.45):Math.min(f,1.6))/100)*100})}
    t.mo=Math.round(((t.mo??60)+60)/2);t.fm=+((t.fm||0)*0.3).toFixed(2);
    for(const pid of t.sq.slice()){const p=P()[pid];if(!p)continue;ensureContract(pid,t.id);if(p.c>S.season)continue;
      if(t.id===S.fav&&!favAuto()){t.sq=t.sq.filter(x=>x!==pid);freeAgents.push([pid,t.id]);left++;continue}
      const want=p.a<=32&&p.s>=t.r-6&&Math.random()<.78;
      if(want){setContract(pid,t.id);renew++}else{t.sq=t.sq.filter(x=>x!==pid);if(p.a>=34){delete P()[pid]}else{freeAgents.push([pid,t.id]);left++}}}
  }
  // Ablösefreie Spieler finden einen neuen Verein auf ähnlichem Niveau
  const bins={};buyers().map(x=>x[0]).forEach(id=>{const t=T(id);if(!t||!t.sq||id===S.fav)return;const k=Math.round(t.r/4);(bins[k]=bins[k]||[]).push(id)});
  const touched=new Set();
  for(const [pid,from] of freeAgents){const p=P()[pid];const k=Math.round(p.s/4);const opts=[...(bins[k]||[]),...(bins[k-1]||[]),...(bins[k+1]||[])].filter(id=>id!==from&&T(id).sq.length<26);
    if(!opts.length){delete P()[pid];continue}const to=rnd(opts);T(to).sq.push(pid);if(p.s>=60||from===S.fav||to===S.fav)addTr(pid,from,to,0,true);else setContract(pid,to);touched.add(to)}
  touched.forEach(id=>recalc(id));
  if(S.fav&&T(S.fav)){const gone=freeAgents.filter(x=>x[1]===S.fav).length;if(gone)log.push(`${T(S.fav).name}: ${gone} Spieler verlassen den Verein nach Vertragsende ablösefrei`)}
  return {renew,left};
}
// Vertragsverlängerung für Mein Verein
function renewalOffer(pid){const p=P()[pid];if(!p||!S.fav)return null;const base=marketWage(pid,S.fav),mo=T(S.fav).mo??60;
  const f=1.05+(mo<45?0.25:mo<60?0.1:0)+(p.s>=T(S.fav).r+3?0.15:0);return {w:Math.round(base*f/100)*100,maxY:p.a>=32?1:p.a>=29?3:5}}
// Scouting (nur für Mein Verein): Einschätzung des verdeckten Potenzials, wird mit der Zeit genauer
const SCOUT_LV=[{n:'Einzelner Scout',q:.6,max:8,cost:0},{n:'Kleine Scouting-Abteilung',q:1,max:15,cost:.012},{n:'Professionelles Scouting-Netzwerk',q:1.6,max:25,cost:.03}];
function SC(){if(!S.scout)S.scout={lv:0,list:{}};return S.scout}
function scoutAdd(pid){const s=SC(),l=SCOUT_LV[s.lv];if(s.list[pid])return 'schon';if(Object.keys(s.list).length>=l.max)return 'voll';const R=srng(hstr('sb'+pid));s.list[pid]={k:0.05,b:(R()*2-1)*6,since:S.season};return 'ok'}
function tickScouting(){const s=S.scout;if(!s||!S.fav)return;const q=SCOUT_LV[s.lv].q;for(const pid in s.list){if(!P()[pid]){delete s.list[pid];continue}const e=s.list[pid];e.k=Math.min(1,+(e.k+0.06*q*(1-e.k*0.5)).toFixed(3))}}
function scoutReport(pid){const s=SC(),e=s.list[pid],p=P()[pid];if(!e||!p)return null;const pot=potOf(p),k=e.k;
  const c=pot+e.b*(1-k),w=(1-k)*10+1;const lo=Math.max(p.s,c-w),hi=Math.min(99,c+w);
  const lvl=x=>{for(const lv of [1,2,3,4,5,6,7,8])if(x>=NORM[lv]-1)return lv;return 9};
  const top=lvl(hi),bot=lvl(lo);const lvN=v=>v===1?'Bundesliga':v===2?'2. Bundesliga':v===3?'3. Liga':v===4?'Regionalliga':v===5?'Oberliga':v<=8?(LEVELS[v]||v+'. Liga'):'Kreisklasse';
  const fr=S.fav&&T(S.fav)?T(S.fav).r:60;const stars=v=>Math.max(.5,Math.min(5,Math.round(((v-fr+12)/5)*2)/2));
  return {k,lo,hi,txt:top===bot?`Perspektive: ${lvN(top)}`:`Perspektive: ${lvN(bot)} bis ${lvN(top)}`,st:[stars(lo),stars(hi)],grow:p.a<=23?(hi-p.s>8?'großes Entwicklungspotenzial':hi-p.s>3?'kann sich noch steigern':'weitgehend ausgereift'):p.a<=27?'kaum noch Steigerung zu erwarten':'hat seinen Zenit erreicht'}}
function starsHTML(a,b){const s=x=>{let h='';for(let i=1;i<=5;i++)h+=x>=i?'★':x>=i-.5?'⯪':'☆';return h};return a===b?`<span class="stars">${s(a)}</span>`:`<span class="stars">${s(a)}</span><span class="meta"> bis </span><span class="stars">${s(b)}</span>`}
// ---------- Spieler: Ansicht ----------
const formLbl=v=>v>=1.2?'<span class="ok" title="Formstark">▲</span>':v<=-1.2?'<span class="no" title="Formtief">▼</span>':'<span class="meta" title="Normal">■</span>';
const moodLbl=m=>m>=75?'Euphorie':m>=60?'Gut':m>=45?'Durchwachsen':m>=30?'Gedrückt':'Am Boden';
function teamFormHTML(id){const t=T(id);const fm=t.fm||0,mo=t.mo??60;return `<div><small>Form</small><b>${fm>=1.2?'stark':fm<=-1.2?'schwach':'normal'} ${formLbl(fm)}</b></div><div><small>Stimmung</small><b>${moodLbl(mo)}</b><span class="meta">${mo}/100</span></div>`}
function playerClubMap(){const m=new Map();for(const t of Object.values(S.teams))if(t.sq)for(const pid of t.sq)m.set(pid,t.id);return m}
function playerBadges(p){let h='';if(p.inj)h+=` <span class="tag no" title="${esc(p.it||'Verletzt')}">🚑 ${p.inj} Wo.</span>`;if(p.c!=null&&p.c<=S.season)h+=` <span class="tag" style="border-color:var(--rel);color:var(--rel)" title="Vertrag läuft zum Saisonende aus">Vertrag endet</span>`;return h}
function renderScout(id){
  const s=SC(),lv=SCOUT_LV[s.lv],cm=playerClubMap(),wo=windowOpen();
  const rows=Object.keys(s.list).filter(pid=>P()[pid]).map(pid=>({pid,p:P()[pid],club:cm.get(pid),r:scoutReport(pid)})).sort((a,b)=>b.r.hi-a.r.hi);
  const rev=(FZ(id).h[0]?FZ(id).h[0][1]:estRevenue(id));
  return `<div class="card"><div class="hd"><div><div class="meta">Scouting</div><h3 class="ct" style="margin:0">${lv.n}</h3></div><span class="tag">${rows.length}/${lv.max} Spieler beobachtet</span></div>
   <p class="note">Das Potenzial eines Spielers ist verdeckt. Deine Scouts schätzen es ein, je länger sie einen Spieler beobachten, desto genauer: Die Sterne sind relativ zu deinem Verein, die Perspektive sagt, auf welchem Niveau er einmal spielen könnte. Auch Scouts können sich irren.</p>
   <div class="orow"><span><b>Abteilung</b> ${SCOUT_LV.map((x,i)=>`<button class="btn sm${i===s.lv?' pri':''}" data-act="scoutlv:${i}">${x.n}${x.cost?` · ${money(rev*x.cost)}/Saison`:' · kostenlos'}</button>`).join(' ')}</span></div></div>
  <div class="card">${rows.length?`<div class="scroll"><table><thead><tr><th class="l">Spieler</th><th class="l">Verein</th><th>Alter</th><th>Stärke</th><th class="l">Einschätzung</th><th>Sicherheit</th><th></th></tr></thead><tbody>${rows.map(x=>{const fee=Math.round(value(x.pid)*1.25/1e3)*1e3,own=x.club===id;
    return `<tr><td class="l team"><span class="pos-${x.p.p}">${x.p.p}</span> ${esc(x.p.n)}${playerBadges(x.p)}</td><td class="l team">${x.club?tl(x.club):'–'}</td><td>${x.p.a}</td><td>${x.p.s.toFixed(1)}</td><td class="l team">${starsHTML(x.r.st[0],x.r.st[1])}<div class="meta">${esc(x.r.txt)} · ${x.r.grow}</div></td><td>${Math.round(x.r.k*100)} %</td><td class="l">${!own&&x.club?`<button class="btn sm${wo&&fee<=bud(id)?' pri':''}" data-act="buy:${x.pid}:${x.club}">Kaufen ${money(fee)}</button> `:''}<button class="btn sm" data-act="unwatch:${x.pid}">Entfernen</button></td></tr>`}).join('')}</tbody></table></div>`
   :'<div class="empty">Noch niemand auf der Beobachtungsliste. Tippe im Transfermarkt oder in einem fremden Kader auf „👁“, um einen Spieler zu beobachten.</div>'}</div>`;
}
