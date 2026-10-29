// ---------- Simulation ----------
function pois(l){const L=Math.exp(-l);let k=0,p=1;do{k++;p*=Math.random()}while(p>L);return k-1}
function lam(a,b,home){const d=a-b+(home?4:0);return Math.min(9,Math.max(.1,(home?1.35:1.2)*Math.exp(d/26)))}
function play(h,a,neutral){
  if(S.fav&&S.mgr&&(h===S.fav||a===S.fav))recalc(S.fav);
  const rh=effR(h)-fatPen(h)+(Math.random()*4-2), ra=effR(a)-fatPen(a)+(Math.random()*4-2);
  const [ah,dh]=tacMul(h,a),[aa,da]=tacMul(a,h);
  const r=[pois(Math.min(9,lam(rh,ra,!neutral)*ah*da)),pois(Math.min(9,lam(ra,rh,false)*aa*dh))];
  tire(h);tire(a);return r;
}
function playRound(lg){
  if(lg.played>=lg.rounds.length) return;
  for(const m of lg.rounds[lg.played]){if(m.hg==null){const [x,y]=play(m.h,m.a);m.hg=x;m.ag=y}afterMatch(m,lg.foreign?1:lg.level);try{statMatch(m,lg)}catch(e){console.warn(e)}if(S.career&&(m.h===S.fav||m.a===S.fav))careerAfterMatch(m)}
  lg.played++;
}
function table(lg){
  const t={},pen=lg.pen||{};lg.teams.forEach(id=>t[id]={id,sp:0,s:0,u:0,n:0,tf:0,tg:0,p:pen[id]||0});
  for(let r=0;r<lg.played;r++)for(const m of lg.rounds[r]){
    const H=t[m.h],A=t[m.a]; if(!H||!A) continue;
    H.sp++;A.sp++;H.tf+=m.hg;H.tg+=m.ag;A.tf+=m.ag;A.tg+=m.hg;
    if(m.hg>m.ag){H.s++;A.n++;H.p+=3}else if(m.hg<m.ag){A.s++;H.n++;A.p+=3}else{H.u++;A.u++;H.p++;A.p++}
  }
  return Object.values(t).sort((a,b)=>b.p-a.p||(b.tf-b.tg)-(a.tf-a.tg)||b.tf-a.tf||T(a.id).name.localeCompare(T(b.id).name));
}
function maxRounds(){return Math.max(...S.leagues.map(l=>l.rounds.length))}
function simDay(){
  if(S.done) return;
  if(typeof view!=='undefined'&&view.ov&&view.ov.t==='match'&&view.ov.rep&&view.ov.rep.dyn&&!view.ov.rep.done)dynFinish(view.ov);
  const before={L:{},C:{},E:{},EW:{}};S.leagues.forEach(l=>before.L[l.id]=l.played);S.cups.forEach(c=>before.C[c.id]=c.played);(S.euro||[]).forEach(e=>{before.E[e.id]=e.step;before.EW[e.id]=e.winner});
  try{const wk=simDayCore();if(wk){tickInjuries();tickScouting();careerDay();try{moodTick()}catch(e){console.warn(e)}try{sancWeek()}catch(e){console.warn(e)}}}finally{try{newsAfterDay(before)}catch(e){console.warn(e)}}
}
// Ein Kalendertag: fällige Liga-, Pokal- und Europapokalspiele, Transfers im Fenster, montags der Wochentakt
function simDayCore(){
  if(S.day==null)ensureCalendar();
  const d=++S.day,last=seasonLen(S.season)-1;let played=false;
  for(const l of S.leagues){while(l.played<l.rounds.length&&l.dates&&l.dates[l.played]<=d){playRound(l);played=true}}
  for(const c of S.cups){while(!c.winner&&c.dates&&(c.dates[c.played]??0)<=d){playCupRound(c);played=true}}
  for(const e of S.euro||[]){while(!e.winner&&e.dates&&(e.dates[e.step]??0)<=d){euroStep(e);played=true}}
  const wk=wdOf(d)===1;if(wk)S.round++;
  if(transferOpenOn(d)){transferDay(1+(Math.random()<.35?1:0),wk)}
  S.lastPlayed=played?d:S.lastPlayed;
  if(S.fav&&S.mgr&&T(S.fav)&&T(S.fav).sq)recalc(S.fav);
  const fin=S.leagues.every(l=>l.played>=l.rounds.length)&&S.cups.every(c=>c.winner)&&(S.euro||[]).every(e=>e.winner);
  if(fin||d>=last){S.leagues.forEach(l=>{while(l.played<l.rounds.length)playRound(l)});S.cups.forEach(c=>{while(!c.winner)playCupRound(c)});(S.euro||[]).forEach(e=>{while(!e.winner)euroStep(e)});S.done=true}
  return wk
}
