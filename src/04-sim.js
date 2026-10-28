// ---------- Simulation ----------
function pois(l){const L=Math.exp(-l);let k=0,p=1;do{k++;p*=Math.random()}while(p>L);return k-1}
function lam(a,b,home){const d=a-b+(home?4:0);return Math.min(9,Math.max(.1,(home?1.35:1.2)*Math.exp(d/26)))}
function play(h,a,neutral){
  const rh=T(h).r+(Math.random()*4-2), ra=T(a).r+(Math.random()*4-2);
  return [pois(lam(rh,ra,!neutral)),pois(lam(ra,rh,false))];
}
function playRound(lg){
  if(lg.played>=lg.rounds.length) return;
  for(const m of lg.rounds[lg.played]){if(m.hg!=null)continue;const [x,y]=play(m.h,m.a);m.hg=x;m.ag=y}
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
  const before={L:{},C:{},E:{},EW:{}};S.leagues.forEach(l=>before.L[l.id]=l.played);S.cups.forEach(c=>before.C[c.id]=c.played);(S.euro||[]).forEach(e=>{before.E[e.id]=e.step;before.EW[e.id]=e.winner});
  try{simDayCore()}finally{try{newsAfterDay(before)}catch(e){console.warn(e)}}
}
function simDayCore(){
  S.round++;
  S.leagues.forEach(playRound);
  const M=maxRounds();
  for(const c of S.cups){
    while(!c.winner && S.round>=Math.round((c.played+1)*M/(c.R+1))) playCupRound(c);
  }
  for(const e of S.euro||[]){
    while(!e.winner && S.round>=Math.round((e.step+1)*M/(e.steps+1))) euroStep(e);
  }
  if(windowOpen()&&!S.done) transferDay(18);
  if(S.round>=M){S.cups.forEach(c=>{while(!c.winner)playCupRound(c)});(S.euro||[]).forEach(e=>{while(!e.winner)euroStep(e)});S.done=true}
}
