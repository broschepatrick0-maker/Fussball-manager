// ---------- Spielerzufriedenheit, Gespräche, Kapitän (nur Mein Verein) ----------
// p.hp = Zufriedenheit 0–100, p.ms = Einsatzanteil (gleitend), p.pr = Versprechen {until}, p.tl = auf der Verkaufsliste, p.tc = letztes Gespräch (Tag)
const ROLE={star:['Führungsspieler',.85],stamm:['Stammspieler',.7],rot:['Rotation',.4],erg:['Ergänzung',.15],persp:['Perspektive',.1]};
function hpOf(p){return p&&p.hp!=null?p.hp:65}
function roles(id){id=id||S.fav;const t=T(id),g=MG(),sl=slotsOf(g.form),need={};sl.forEach(s=>need[s]=(need[s]||0)+1);
  const out={},sq=ensureSquad(id).filter(pid=>P()[pid]);
  for(const pos of ['TW','AB','MF','ST']){const v=sq.filter(pid=>P()[pid].p===pos).sort((a,b)=>P()[b].s-P()[a].s),n=need[pos]||1;
    v.forEach((pid,i)=>{const p=P()[pid];let r=i<n?(i===0&&p.s>=t.r+3&&p.a>=22?'star':'stamm'):pos!=='TW'&&i<Math.ceil(n*1.6)?'rot':'erg';if(p.a<=20&&(r==='erg'||r==='rot'))r='persp';out[pid]=r})}
  return out}
function hpMul(p){const h=hpOf(p);return h<30?.96:h<45?.985:h>80?1.01:1}
function happyLbl(p){const h=Math.round(hpOf(p));const [e,t]=h>=80?['😀','Sehr zufrieden']:h>=60?['🙂','Zufrieden']:h>=45?['😐','Neutral']:h>=30?['🙁','Unzufrieden']:['😠','Sehr unzufrieden'];return `<span class="mood" title="${t} (${h}/100)">${e}</span>`}
// nach jedem Pflichtspiel: wer hat gespielt?
function moodAfterMatch(id,mins){if(id!==S.fav||!S.mgr)return;const t=T(id);const g=MG();g.gp=(g.gp||0)+1;const rl=roles(id);
  const played=mins||Object.fromEntries(mgrXI(id).xi.filter(Boolean).map(pid=>[pid,90]));
  t.sq.forEach(pid=>{const p=P()[pid];if(!p||p.inj)return;const m=played[pid]||0,v=m>=45?1:m>0?.4:0;const e=ROLE[rl[pid]||'erg'][1];p.ms=+((p.ms??e)*.85+v*.15).toFixed(3)})}
// wöchentlich: Laune anpassen, Anliegen entstehen
function moodTick(){if(!S.fav||!S.mgr)return;const id=S.fav,t=T(id);if(!t||!t.sq)return;const g=MG(),rl=roles(id),d=S.day;g.talk=g.talk||[];
  if(!g.cap||!t.sq.includes(g.cap))g.cap=autoCaptain(id);
  let hsum=0,n=0;
  for(const pid of t.sq){const p=P()[pid];if(!p)continue;const r=rl[pid]||'erg',e=ROLE[r][1],ms=p.ms??e;let h=hpOf(p);
    let dt=(ms-e)*10*(r==='erg'||r==='persp'?.5:1);if(p.p==='TW'&&r==='erg')dt*=.5;if(p.pr&&dt<0)dt*=.4;if(p.inj)dt=Math.max(dt,0);
    dt+=((t.mo??60)-60)/30;
    if(p.w&&p.s>=t.r-1&&p.w<marketWage(pid,id)*.7)dt-=.8;
    if(p.c<=S.season&&p.s>=t.r-2&&r!=='erg')dt-=.6;
    if(pid===g.cap)dt+=.5;
    dt+=(65-h)*.06+(Math.random()*2-1);
    h=Math.max(0,Math.min(100,h+dt));
    // Versprechen auswerten
    if(p.pr&&d>=p.pr.until){if((p.ms??0)>=.5){h=Math.min(100,h+8);moodNews(pid,'hält Wort','Der Trainer hat sein Versprechen gehalten – '+p.n+' bekommt regelmäßig Einsatzzeit.')}else{h=Math.max(0,h-25);t.mo=Math.max(5,(t.mo??60)-4);moodNews(pid,'fühlt sich belogen',`${p.n} hatte mehr Einsatzzeit versprochen bekommen. In der Kabine rumort es.`,2)}delete p.pr}
    p.hp=+h.toFixed(1);if(mgrXI(id).xi.includes(pid)){hsum+=h;n++}
    // Anliegen
    const open=g.talk.some(x=>x.pid===pid);if(open||g.talk.length>=3||(p.tc&&d-p.tc<28))continue;
    if(h<22&&r!=='persp'&&Math.random()<.5)addTalk(pid,'leave');
    else if(h<40&&(r==='star'||r==='stamm'||r==='rot')&&ms<e-.18&&!p.pr&&Math.random()<.5)addTalk(pid,'time');
    else if(p.w&&p.s>=t.r-1&&p.w<marketWage(pid,id)*.7&&p.c>S.season&&Math.random()<.06)addTalk(pid,'pay')}
  // Kabinenklima wirkt auf die Stimmung; ein unzufriedener Kapitän zieht runter
  if(n)t.mo=Math.round(Math.max(5,Math.min(100,(t.mo??60)+(hsum/n-60)/40)));
  const cp=P()[g.cap];if(cp&&hpOf(cp)<35)t.mo=Math.max(5,(t.mo??60)-1);
  // unbeantwortete Anliegen verfallen nach drei Wochen
  g.talk=g.talk.filter(x=>{if(d-x.d<=21)return true;const p=P()[x.pid];if(p){p.hp=Math.max(0,hpOf(p)-10);p.tc=d}return false})}
const TALK={time:{h:'will mehr Spielzeit',b:'fühlt sich übergangen und möchte regelmäßig spielen.',opt:[['promise','Einsatzzeit versprechen'],['compete','Auf den Konkurrenzkampf verweisen'],['list','Wechsel erlauben (Verkaufsliste)']]},
  pay:{h:'möchte mehr Gehalt',b:'verdient deutlich unter dem Marktwert und bittet um eine Gehaltserhöhung.',opt:[['raise','Gehalt um 20 % erhöhen'],['later','Auf später vertrösten'],['no','Ablehnen']]},
  leave:{h:'will den Verein verlassen',b:'sieht keine Zukunft mehr im Verein und bittet um einen Wechsel.',opt:[['list','Auf die Verkaufsliste setzen'],['stay','Hart bleiben – kein Wechsel']]}};
function addTalk(pid,k){const g=MG(),p=P()[pid];g.talk.unshift({pid,k,d:S.day});p.tc=S.day;
  try{addNews({cat:'fav',clubs:[S.fav],h:`${p.n} ${TALK[k].h}`,b:`${p.n} (${POSN[p.p]}) ${TALK[k].b} Antworte unter „Kader“.`,imp:2})}catch(e){}
  try{toast(`Gesprächsbedarf: ${p.n} ${TALK[k].h}`)}catch(e){}}
function moodNews(pid,h,b,imp){const p=P()[pid];try{addNews({cat:'fav',clubs:[S.fav],h:`${p.n} ${h}`,b,imp:imp||1})}catch(e){}}
function answerTalk(i,o){const g=MG(),x=g.talk[i];if(!x)return;const p=P()[x.pid],t=T(S.fav),rl=roles()[x.pid];g.talk.splice(i,1);if(!p)return '';let h=hpOf(p),msg='';
  if(x.k==='time'){if(o==='promise'){p.pr={until:S.day+42};h+=14;msg=`Du versprichst ${p.n} mehr Einsätze – in den nächsten sechs Wochen sollte er regelmäßig spielen.`}
    else if(o==='compete'){if(rl==='star'||Math.random()<.5){h-=8;msg=`${p.n} ist enttäuscht von deiner Antwort.`}else{h+=4;msg=`${p.n} nimmt die Herausforderung an.`}}
    else{p.tl=true;h+=6;msg=`${p.n} steht jetzt auf der Verkaufsliste.`}}
  if(x.k==='pay'){if(o==='raise'){p.w=Math.round(p.w*1.2/100)*100;h+=15;msg=`${p.n} verdient jetzt ${money(p.w)} pro Jahr.`}else if(o==='later'){h-=6;msg=`${p.n} wartet ab – aber nicht ewig.`}else{h-=14;msg=`${p.n} ist verärgert.`}}
  if(x.k==='leave'){if(o==='list'){p.tl=true;h+=8;msg=`${p.n} steht auf der Verkaufsliste. Interessenten werden sich melden.`}else{h-=10;t.mo=Math.max(5,(t.mo??60)-3);p.fo=Math.max(-3,(p.fo||0)-1);msg=`${p.n} muss bleiben – die Stimmung leidet.`}}
  p.hp=+Math.max(0,Math.min(100,h)).toFixed(1);p.tc=S.day;return msg}
// Gespräch auf Initiative des Trainers
function talkTo(pid,o){const p=P()[pid],t=T(S.fav),g=MG();if(!p)return '';let h=hpOf(p),msg='';const fo=p.fo||0;
  if(o==='praise'){if(p.tc&&S.day-p.tc<21)return `${p.n}: Ihr habt erst vor Kurzem gesprochen.`;h+=fo>=0.5?7:fo>-0.5?3:-2;p.fo=Math.min(3,fo+.3);msg=fo>-0.5?`${p.n} freut sich über das Lob.`:`${p.n} wundert sich über das Lob nach den schwachen Leistungen.`;p.tc=S.day}
  else if(o==='crit'){if(p.tc&&S.day-p.tc<21)return `${p.n}: Ihr habt erst vor Kurzem gesprochen.`;if(fo<-0.3){p.fo=Math.min(3,fo+.8);h-=5;msg=`${p.n} nimmt die Kritik an und will sich steigern.`}else{h-=12;msg=`${p.n} findet die Kritik ungerecht.`}p.tc=S.day}
  else if(o==='promise'){if(p.pr)return `${p.n} hat bereits ein Versprechen.`;p.pr={until:S.day+42};h+=10;msg=`Versprochen: ${p.n} bekommt in den nächsten sechs Wochen regelmäßig Einsätze.`}
  else if(o==='list'){p.tl=!p.tl;h+=p.tl?(roles()[pid]==='erg'?4:-6):3;msg=p.tl?`${p.n} steht auf der Verkaufsliste.`:`${p.n} ist von der Verkaufsliste genommen.`}
  else if(o==='cap'){const old=P()[g.cap];if(g.cap===pid)return `${p.n} ist bereits Kapitän.`;if(old){old.hp=Math.max(0,hpOf(old)-12)}g.cap=pid;h+=10;t.mo=Math.min(100,(t.mo??60)+2);msg=`${p.n} ist neuer Kapitän${old?` – ${old.n} ist enttäuscht`:''}.`}
  p.hp=+Math.max(0,Math.min(100,h)).toFixed(1);return msg}
function autoCaptain(id){const t=T(id),xi=new Set(mgrXI(id).xi);return t.sq.filter(pid=>P()[pid]).sort((a,b)=>{const s=pid=>{const p=P()[pid];return (xi.has(pid)?20:0)+p.a*0.8+p.s/4+hpOf(p)/20};return s(b)-s(a)})[0]}
// Ansicht
function talkCard(){const g=MG();g.talk=g.talk||[];if(!g.talk.length)return '';
  return `<div class="card offer"><h3 class="ct">Spielergespräche <span class="meta">${g.talk.length} offen</span></h3>${g.talk.map((x,i)=>{const p=P()[x.pid];if(!p)return '';const c=TALK[x.k];
    return `<div class="orow talk"><span>${happyLbl(p)} <b>${esc(p.n)}</b> ${c.h} <span class="meta">${POSN[p.p]} · ${ROLE[roles()[x.pid]||'erg'][0]} · ${Math.round((p.ms??0)*100)} % Einsatz · seit ${fmtDay(x.d)}</span></span><span class="ctrls">${c.opt.map(([k,n])=>`<button class="btn sm${k===c.opt[0][0]?' pri':''}" data-act="talkans:${i}:${k}">${n}</button>`).join('')}</span></div>`}).join('')}
   <p class="note" style="margin-top:6px">Unbeantwortete Anliegen verfallen nach drei Wochen – das kostet Zufriedenheit.</p></div>`}
function talkSheet(pid){const p=P()[pid];if(!p)return '';const g=MG(),r=roles()[pid]||'erg',e=ROLE[r][1];const cd=p.tc&&S.day-p.tc<21;
  return `<div class="ovc"><div class="facts"><div><small>Rolle</small><b>${ROLE[r][0]}</b></div><div><small>Zufriedenheit</small><b>${happyLbl(p)} ${Math.round(hpOf(p))}/100</b></div><div><small>Einsatz</small><b>${Math.round((p.ms??e)*100)} % <span class="meta">erwartet ${Math.round(e*100)} %</span></b></div><div><small>Form</small><b>${formLbl(p.fo||0)}</b></div></div>
   ${p.pr?`<p class="note">Versprochen: regelmäßige Einsätze bis ${fmtDay(p.pr.until)}.</p>`:''}${p.tl?'<p class="note">Steht auf der Verkaufsliste.</p>':''}${g.cap===pid?'<p class="note">Kapitän der Mannschaft.</p>':''}
   <div class="mlist" style="margin-top:10px">
    <button class="btn" data-act="talk2:${pid}:praise"${cd?' disabled':''}>Loben</button>
    <button class="btn" data-act="talk2:${pid}:crit"${cd?' disabled':''}>Kritisieren</button>
    <button class="btn" data-act="talk2:${pid}:promise"${p.pr?' disabled':''}>Einsatzzeit versprechen</button>
    <button class="btn" data-act="talk2:${pid}:list">${p.tl?'Von der Verkaufsliste nehmen':'Auf die Verkaufsliste setzen'}</button>
    <button class="btn" data-act="talk2:${pid}:cap"${g.cap===pid?' disabled':''}>Zum Kapitän ernennen</button></div>
   <p class="note" style="margin-top:10px">${cd?'Loben und Kritisieren geht erst wieder in einigen Tagen. ':''}Lob wirkt nach guten Leistungen, Kritik nach schwachen. Ein Versprechen musst du halten: Bekommt er in sechs Wochen nicht genug Einsätze, ist er schwer enttäuscht. Sehr unzufriedene Spieler spielen schwächer und verlängern ihren Vertrag nicht.</p></div>`}
