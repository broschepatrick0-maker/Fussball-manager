// ---------- Saisonwechsel ----------
function twoLeg(a,b){ // a = Klassentieferer, b = Klassenhöherer (Rückspiel zu Hause)
  const [x1,y1]=play(a,b),[x2,y2]=play(b,a);
  const ga=x1+y2, gb=y1+x2;
  let w = ga>gb?a:gb>ga?b:(Math.random()<.5?a:b);
  return {w,l:w===a?b:a,txt:`${T(a).name} – ${T(b).name} ${x1}:${y1}, ${x2}:${y2} (${ga}:${gb}${ga===gb?', i.E.':''})`};
}
function newSeason(){
  recordSeason();const oldSeason=S.season;
  const log=[];const st={};S.leagues.forEach(l=>st[l.id]=table(l).map(r=>r.id));
  const bl=st.bl,b2=st.bl2,l3=st.l3;
  log.push(`Deutscher Meister: ${T(bl[0]).name}`);
  const insolvent=seasonFinances(st,log);
  for(const c of S.cups) if(c.type!=='kp'||true) {}
  const dfb=S.cups.find(c=>c.type==='dfb'); if(dfb) log.push(`DFB-Pokalsieger: ${T(dfb.winner).name}`);
  // Relegation
  const move={}; // id -> ziel-liga-id
  const DL=deLevels(); const lvF=id=>move[id]?L(move[id]).level:DL.lv[id];
  const okAt=(id,lv)=>lv>=resMinLevel(T(id).name,DL.byName,lvF);
  const r1=twoLeg(b2[2],bl[15]); log.push('Relegation BL: '+r1.txt);
  [bl[16],bl[17]].forEach(id=>move[id]='bl2'); [b2[0],b2[1]].forEach(id=>move[id]='bl');
  if(r1.w===b2[2]){move[b2[2]]='bl';move[bl[15]]='bl2'}
  const l3ok=l3.filter(id=>okAt(id,2)&&!isRes(T(id).name));
  const r2=twoLeg(l3ok[2],b2[15]); log.push('Relegation 2. BL: '+r2.txt);
  const l3up=l3ok.slice(0,2);
  [b2[16],b2[17]].forEach(id=>move[id]='l3'); l3up.forEach(id=>move[id]='bl2');
  if(r2.w!==b2[15]){move[r2.w]='bl2';move[b2[15]]='l3'}
  const l3down=l3.slice(-4).filter(id=>!move[id]);
  l3down.forEach(id=>move[id]=REGION[T(id).vb]||'rlw');
  // Regionalliga-Meister: 3 direkt, 2 in Aufstiegsspielen
  const rls=['rln','rlno','rlw','rlsw','rlby'];
  const ch=rls.map(id=>{const t=table(L(id)).filter(r=>!move[r.id]&&okAt(r.id,3));const c=t[0];if(!c)return null;
    if(c.id!==table(L(id))[0].id)log.push(`${L(id).name}: ${T(table(L(id))[0].id).name} darf als Zweitvertretung nicht aufsteigen – ${T(c.id).name} rückt nach`);
    return{id:c.id,ppg:c.p/Math.max(1,c.sp),lg:id}}).filter(Boolean).sort((a,b)=>b.ppg-a.ppg);
  ch.slice(0,3).forEach(c=>{move[c.id]='l3';log.push(`Aufstieg in die 3. Liga: ${T(c.id).name}`)});
  if(ch[4]){const r3=twoLeg(ch[4].id,ch[3].id); move[r3.w]='l3'; log.push('Aufstiegsspiele 3. Liga: '+r3.txt)} else if(ch[3]) move[ch[3].id]='l3';
  // Oberliga-Meister in die Regionalliga
  const ob=S.leagues.filter(l=>l.level===5);
  ob.forEach(l=>{const c=st[l.id].find(id=>!move[id]&&okAt(id,4));if(!c)return;if(c!==st[l.id][0])log.push(`${l.name}: ${T(st[l.id][0]).name} darf als Zweitvertretung nicht aufsteigen`);move[c]=REGION[l.vb]||'rlw';log.push(`Aufstieg in die ${L(move[c]).name}: ${T(c).name}`)});
  // Amateurligen: Meister tauscht mit Letztem der nächsthöheren Liga im Verband
  const ams=S.leagues.filter(l=>l.level>=6).sort((a,b)=>a.level-b.level);
  const downIdx={},relGrp={};
  for(const d of ams){
    const ups=S.leagues.filter(u=>u.level===d.level-1&&(u.vbs||[u.vb]).includes(d.vb)&&u.level>=5);
    if(!ups.length) continue;
    const upName=(PRESETS.find(p=>p.name===d.name)||{}).up;
    const u=ups.find(x=>upName&&x.name===upName)||ups.find(x=>x.kreis&&x.kreis===d.kreis)||ups[0];
    const champ=st[d.id].find(id=>!move[id]&&okAt(id,u.level)); if(!champ) continue;
    if(champ!==st[d.id].find(id=>!move[id]))log.push(`${d.name}: ${T(st[d.id].find(id=>!move[id])).name} darf als Zweitvertretung nicht aufsteigen`);
    downIdx[u.id]=(downIdx[u.id]||0)+1;
    const last=st[u.id].filter(id=>!move[id]).slice(-downIdx[u.id])[0];
    move[champ]=u.id; if(last){move[last]=d.id;(relGrp[u.id]=relGrp[u.id]||[]).push({d,last})}
    log.push(`${d.name}: ${T(champ).name} steigt auf in ${u.name}${last?', '+T(last).name+' steigt ab':''}`);
  }
  // Absteiger in die Heimatliga (dort, wo sie herkamen)
  const homes=homeLeagues;
  for(const g of Object.values(relGrp)){ if(g.length<2) continue;
    const free=g.map(x=>x.d), lasts=g.map(x=>x.last), out=new Map();
    for(const id of lasts){const h=homes(id);const i=free.findIndex(d=>h.includes(d.name));if(i>=0){out.set(id,free[i]);free.splice(i,1)}}
    for(const id of lasts) if(!out.has(id)) out.set(id,free.shift());
    for(const [id,d] of out){move[id]=d.id;const line=log.findIndex(l=>l.endsWith(', '+T(id).name+' steigt ab'));if(line>=0)log[line]=log[line].replace(', '+T(id).name+' steigt ab',', '+T(id).name+' steigt ab → '+d.name)}
  }
  // Bewegungen anwenden
  const lvOld={};S.leagues.forEach(l=>l.teams.forEach(id=>lvOld[id]=l.level));
  for(const [id,to] of Object.entries(move)){
    const fromLg=S.leagues.find(l=>l.teams.includes(id)||l.teams.includes(+id));
    if(fromLg&&L(to)&&L(to).level<fromLg.level&&fromLg.level>=5){const t=T(id);t.from=[fromLg.name,...homes(id).filter(n=>n!==fromLg.name)].slice(0,4)}
    S.leagues.forEach(l=>l.teams=l.teams.filter(x=>x!==id));
    L(to).teams.push(id);
  }
  // Regionalligen auf Sollgröße bringen
  for(const id of rls){
    const lg=L(id),target=18;
    // Absteiger kommen nur aus dem alten Bestand, nach Abschlusstabelle
    const order=st[id].filter(x=>lg.teams.includes(x));
    if(lg.teams.length<target) log.push(`${lg.name} spielt mit ${lg.teams.length} Teams – importiere eine Oberliga der Region, damit Aufsteiger nachrücken`);
    while(lg.teams.length>target){
      const victim=order.filter(x=>lg.teams.includes(x)).pop(); if(!victim) break;
      lg.teams=lg.teams.filter(x=>x!==victim);
      const cands=S.leagues.filter(l=>l.level===5&&(l.vbs||[l.vb]).includes(T(victim).vb)),hl=homeLeagues(victim);
      const dest=cands.find(l=>hl.includes(l.name))||cands.sort((a,b)=>a.teams.length-b.teams.length)[0];
      if(dest){dest.teams.push(victim);log.push(`Abstieg aus der ${lg.name}: ${T(victim).name} → ${dest.name}`)}
      else log.push(`Abstieg aus der ${lg.name}: ${T(victim).name} (in die Oberliga, nicht eingetragen)`);
    }
  }
  enforceReserves(st,log);
  applyInsolvency(insolvent,st,log);
  contractsSeason(log,lvOld);
  // Stärke anpassen
  S.leagues.forEach(l=>l.teams.forEach(id=>{
    const t=T(id),o=lvOld[id]||l.level;
    if(o>l.level) t.r+=2.5; else if(o<l.level) t.r-=2.5;
    t.r=+(t.r+(Math.random()*3-1.5)).toFixed(1);
  }));
  // Landespokalsieger qualifizieren sich für den DFB-Pokal
  S.pokalWinners={};S.cups.filter(c=>c.type==='lp'&&c.winner).forEach(c=>{S.pokalWinners[c.vb]=c.winner;log.push(`${c.name}: ${T(c.winner).name} (DFB-Pokal-Teilnehmer)`)});
  S.lastL3=st.l3;
  if(S.fav&&T(S.fav)&&FZ(S.fav)&&FZ(S.fav).h[0]){const h=FZ(S.fav).h[0];log.push(`${T(S.fav).name}: Umsatz ${money(h[1])}, Ergebnis ${h[3]>=0?'+':'−'}${money(Math.abs(h[3]))}, Kontostand ${h[4]<0?'−':''}${money(Math.abs(h[4]))}${h[5]?`, Schulden ${money(h[5])}`:''}`)}
  developSquads();
  (S.pool||[]).forEach(id=>{const t=T(id);if(t&&t.bud!=null)t.bud=Math.min(4e8,t.bud+2e7)});
  S.offers=[];
  S.euroQual=euroQualify(st);
  (S.euro||[]).filter(e=>e.winner).forEach(e=>log.push(`${e.name}-Sieger: ${T(e.winner).name}`));
  S.leagues.filter(l=>l.foreign).forEach(l=>log.push(`${l.title}: ${T(st[l.id][0]).name}`));
  S.pool&&S.pool.forEach(id=>{const t=T(id);t.r=+(t.r+(Math.random()*3-1.5)).toFixed(1)});
  S.log.unshift({season:S.season,lines:log});if(S.log.length>60)S.log.length=60;
  markMoves(oldSeason);
  try{newsSeason(st,oldSeason)}catch(e){}
  S.season++;
  startSeason();
  transferDay(140);
  view={tab:'season',id:null};
}
