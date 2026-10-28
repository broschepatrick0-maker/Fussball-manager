// ---------- News, PR & TV-Prognosen ----------
function NEWS(){if(!S.news)S.news=[];return S.news}
function addNews(o){const n=NEWS();n.unshift({s:S.season,r:S.round,d:S.day,...o});if(n.length>500)n.length=500}
const sl2=s=>`${s}/${String(s+1).slice(2)}`;
function person(id,role){const t=T(id);if(!t)return '';if(role==='tr'&&S.career&&S.career.club===id)return S.career.name;t.ppl=t.ppl||{};if(!t.ppl[role]){const c=NAMES.DE;const R=srng(hstr(role+id+t.name+(t.ppl[role+'#']||0)));t.ppl[role]=rpick(c.f.split(','),R)+' '+rpick(c.l.split(','),R)}return t.ppl[role]}
const coach=id=>person(id,'tr'),boss=id=>person(id,'pr'),sd=id=>person(id,'sd');
function q(id,role,txt){const n=role==='tr'?coach(id):role==='pr'?boss(id):sd(id);const r={tr:'Trainer',pr:'Präsident',sd:'Sportdirektor'}[role];return {who:`${n}, ${r} ${T(id).name}`,txt}}
const QWIN=['Die Mannschaft hat heute genau das umgesetzt, was wir uns vorgenommen hatten.','Wir haben von der ersten Minute an gezeigt, wer hier gewinnen will. Ein großes Kompliment an die Jungs.','Das war harte Arbeit, aber am Ende verdient. Jetzt gilt es, nachzulegen.','Die Fans haben uns heute getragen. Diese drei Punkte gehören auch ihnen.'];
const QLOSS=['Das war heute zu wenig, da brauchen wir nicht drumherum zu reden.','Wir haben die einfachen Dinge nicht gut gemacht und sind dafür bestraft worden.','Wir müssen das schnell abhaken und es in der nächsten Woche besser machen.','Ich nehme das auf meine Kappe. Wir werden das intern deutlich ansprechen.'];
const QDRAW=['Mit dem Punkt können wir leben, auch wenn mehr drin war.','Ein gerechtes Remis. Beide Mannschaften hatten ihre Phasen.','Wir hätten das Spiel heute gewinnen müssen, die Chancen waren da.'];
const QBIG=['So ein Ergebnis erlebt man nicht oft. Die Mannschaft war heute in einem Rausch.','Wir haben jede Chance genutzt. Ein besonderer Abend für den ganzen Verein.'];
const QUPSET=['Niemand hat uns heute etwas zugetraut. Genau das hat uns stark gemacht.','Das ist ein historischer Tag für unseren Verein. Die Jungs haben über sich hinausgehoben.'];
function resultQuote(id,m,R){const me=m.h===id?m.hg:m.ag,op=m.h===id?m.ag:m.hg;return me>op?(me-op>=4?rpick(QBIG,R):rpick(QWIN,R)):me<op?rpick(QLOSS,R):rpick(QDRAW,R)}
// Wahrscheinlichkeiten für ein Spiel (TV-Prognose)
function pmf(l){const a=[];let p=Math.exp(-l);for(let k=0;k<=9;k++){a.push(p);p*=l/(k+1)}return a}
function matchProb(h,a,neutral){const rh=effR(h),ra=effR(a),[ah,dh]=tacMul(h,a),[aa,da]=tacMul(a,h),lh=Math.min(9,lam(rh,ra,!neutral)*ah*da),la=Math.min(9,lam(ra,rh,false)*aa*dh);const A=pmf(lh),B=pmf(la);let pH=0,pD=0,pA=0,best=[0,0,0];
  for(let i=0;i<10;i++)for(let j=0;j<10;j++){const p=A[i]*B[j];if(i>j)pH+=p;else if(i<j)pA+=p;else pD+=p;if(p>best[2])best=[i,j,p]}
  const t=pH+pD+pA;return {h:pH/t,d:pD/t,a:pA/t,tip:best,xg:[lh,la]}}
// Saisonprognose per Simulation der Restsaison
const FC={};
function seasonForecast(lg,runs){runs=runs||400;const key=lg.id+':'+S.season+':'+lg.played;if(FC[key])return FC[key];
  const base={};table(lg).forEach(r=>base[r.id]={p:r.p,d:r.tf-r.tg,g:r.tf});const n=lg.teams.length;const cnt={};lg.teams.forEach(id=>cnt[id]=new Array(n).fill(0));
  const rest=lg.rounds.slice(lg.played).flat();
  const prob=new Map();rest.forEach(m=>{if(!prob.has(m.h+'|'+m.a))prob.set(m.h+'|'+m.a,matchProb(m.h,m.a))});
  for(let r=0;r<runs;r++){const t={};for(const id in base)t[id]={...base[id]};
    for(const m of rest){if(m.hg!=null&&false)continue;const P_=prob.get(m.h+'|'+m.a),x=Math.random();
      if(x<P_.h){t[m.h].p+=3;t[m.h].d+=1}else if(x<P_.h+P_.d){t[m.h].p++;t[m.a].p++}else{t[m.a].p+=3;t[m.a].d+=1}}
    Object.keys(t).sort((a,b)=>t[b].p-t[a].p||t[b].d-t[a].d||Math.random()-.5).forEach((id,i)=>cnt[id][i]++)}
  const out=lg.teams.map(id=>{const c=cnt[id];const z=i=>zone(lg,i,n);let up=0,dn=0,top=0;
    c.forEach((v,i)=>{const zz=z(i);if(zz==='up'||zz==='cl')up+=v;if(zz==='down')dn+=v;if(zz==='cl'||zz==='el'||zz==='ecl')top+=v});
    return {id,title:c[0]/runs,up:up/runs,top:top/runs,down:dn/runs,exp:c.reduce((a,v,i)=>a+v*(i+1),0)/runs}}).sort((a,b)=>a.exp-b.exp);
  FC[key]=out;return out}
// Spieltags-Nachrichten (nach jedem simulierten Spieltag)
function newsAfterDay(before){
  const R=srng(hstr('n'+S.season+':'+S.day));
  const tops=S.leagues.filter(l=>l.level<=3||l.foreign||(S.fav&&l.teams.includes(S.fav)));
  for(const lg of tops){const md=lg.played-1;if(md<0||before.L[lg.id]===lg.played)continue;
    const rd=lg.rounds[md],tb=table(lg);
    const big=rd.slice().sort((a,b)=>Math.abs(b.hg-b.ag)-Math.abs(a.hg-a.ag)||(b.hg+b.ag)-(a.hg+a.ag))[0];
    const ups=rd.filter(m=>m.hg!==m.ag).map(m=>{const w=m.hg>m.ag?m.h:m.a,l=w===m.h?m.a:m.h;return {m,w,l,d:T(l).r-T(w).r}}).filter(x=>x.d>6).sort((a,b)=>b.d-a.d)[0];
    const lead=tb[0],gap=tb[0].p-(tb[1]?tb[1].p:0);
    if(!S.nLead)S.nLead={};const newLead=S.nLead[lg.id]!==lead.id;S.nLead[lg.id]=lead.id;
    const showSum=lg.level===1&&!lg.foreign||(lg.level===2&&(md%2===0||newLead))||(lg.level===3&&(md%3===0||newLead))||(lg.foreign&&(newLead&&md>2||md%5===4))||md===lg.rounds.length-1;
    if(showSum&&(lg.level<=3||lg.foreign)){
      const h=gap>=6?`${T(lead.id).name} enteilt – ${gap} Punkte Vorsprung`:gap===0?`Spannung pur: ${T(lead.id).name} nur dank Tordifferenz vorn`:`${T(lead.id).name} bleibt an der Spitze`;
      addNews({cat:lg.foreign?'int':'liga',lg:lg.id,clubs:[lead.id],h:`${lg.name}, ${md+1}. Spieltag: ${h}`,
        b:`${big?`Das Ergebnis des Tages: ${T(big.h).name} – ${T(big.a).name} ${big.hg}:${big.ag}. `:''}${ups?`Überraschung: ${T(ups.w).name} schlägt ${T(ups.l).name}${ups.m.hg+':'+ups.m.ag?` (${ups.m.hg}:${ups.m.ag})`:''}. `:''}Tabellenführer ist ${T(lead.id).name} mit ${lead.p} Punkten${tb[1]?`, dahinter ${T(tb[1].id).name} (${tb[1].p})`:''}.`,imp:lg.level===1?3:2});
      if(ups&&lg.level<=2&&!lg.foreign)addNews({cat:'liga',lg:lg.id,clubs:[ups.w],h:`Sensation: ${T(ups.w).name} stürzt ${T(ups.l).name}`,b:`Mit einem ${Math.max(ups.m.hg,ups.m.ag)}:${Math.min(ups.m.hg,ups.m.ag)} gelingt dem Außenseiter der Coup des Spieltags.`,pr:q(ups.w,'tr',rpick(QUPSET,R)),imp:2});
    }
    // Mein Verein: Spielbericht mit Stimmen
    if(S.fav&&lg.teams.includes(S.fav)){const m=rd.find(x=>x.h===S.fav||x.a===S.fav);if(m){const me=m.h===S.fav?m.hg:m.ag,op=m.h===S.fav?m.ag:m.hg,opp=m.h===S.fav?m.a:m.h,pos=tb.findIndex(r=>r.id===S.fav)+1;
      const verb=me>op?(me-op>=3?'fegt':'schlägt'):me<op?'verliert gegen':'trennt sich';
      addNews({cat:'fav',lg:lg.id,clubs:[S.fav,opp],h:me===op?`${T(S.fav).name} und ${T(opp).name} trennen sich ${me}:${op}`:`${T(S.fav).name} ${verb} ${T(opp).name}${me>op?` ${me}:${op}`:` ${me}:${op}`}`,
        b:`${m.h===S.fav?'Vor heimischer Kulisse':'Auswärts'} ${me>op?'holt':me<op?'kassiert':'holt'} ${T(S.fav).name} ${me>op?'drei Punkte':me<op?'eine Niederlage':'einen Punkt'} und steht nun auf Platz ${pos}.`,
        pr:q(S.fav,'tr',resultQuote(S.fav,m,R)),pr2:q(opp,'tr',resultQuote(opp,m,R)),imp:3,mt:{lg:lg.id,md}})}}
    // Trainerentlassungen (Profiligen)
    if(!lg.foreign&&lg.level<=3&&md>=5){for(const r of tb.slice(Math.floor(tb.length*.6)).filter(r=>!(isCareer()&&r.id===S.career.club))){const last=lg.rounds.slice(Math.max(0,md-4),md+1).map(rr=>rr.find(m=>m.h===r.id||m.a===r.id)).filter(Boolean);
      const losses=last.filter(m=>(m.h===r.id?m.hg<m.ag:m.ag<m.hg)).length;const t=T(r.id);
      if(losses>=4&&R()<.35&&(!t.ppl||(t.ppl.trS||0)<S.season*100+md-8)){const old=coach(r.id);t.ppl['tr#']=(t.ppl['tr#']||0)+1;delete t.ppl.tr;t.ppl.trS=S.season*100+md;const neu=coach(r.id);
        addNews({cat:r.id===S.fav?'fav':'pr',lg:lg.id,clubs:[r.id],h:`${t.name} trennt sich von Trainer ${old}`,b:`Nach ${losses} Niederlagen aus den letzten fünf Spielen zieht ${t.name} die Reißleine. Nachfolger wird ${neu}.`,pr:q(r.id,'sd',`Wir danken ${old} für seinen Einsatz. Die sportliche Entwicklung hat uns aber zu diesem Schritt gezwungen. Mit ${neu.split(' ')[0]} wollen wir neue Impulse setzen.`),imp:2,press:true})}}}
  }
  // Pokale: Überraschungen und Sieger
  for(const c of S.cups){if(before.C[c.id]===c.played)continue;if(c.type!=='dfb'&&!(S.fav&&c.teams.includes(S.fav)))continue;
    for(let k=before.C[c.id];k<c.played;k++){const rd=c.rounds[k].filter(m=>!m.bye);
      const lvl=id=>(lgOf(id)||{level:9}).level;
      const ups=rd.filter(m=>m.w&&lvl(m.w)-lvl(m.w===m.h?m.a:m.h)>=2).slice(0,2);
      ups.forEach(m=>{const l=m.w===m.h?m.a:m.h;addNews({cat:'cup',clubs:[m.w],h:`${c.name}: ${T(m.w).name} wirft ${T(l).name} raus!`,b:`${ROUNDN(c.R,k)}: Der ${LEVELS[lvl(m.w)]||'Amateur'}-Verein besiegt den ${LEVELS[lvl(l)]||''}-Klub mit ${m.hg}:${m.ag}${m.pen?' im Elfmeterschießen':m.et?' nach Verlängerung':''}.`,pr:q(m.w,'tr',rpick(QUPSET,R)),imp:2})});
      if(S.fav){const m=rd.find(x=>x.h===S.fav||x.a===S.fav);if(m&&c.type!=='dfb'||m&&c.type==='dfb'){const won=m.w===S.fav,opp=m.h===S.fav?m.a:m.h;addNews({cat:'fav',clubs:[S.fav,opp],h:`${c.name}: ${T(S.fav).name} ${won?'weiter':'ausgeschieden'}`,b:`${ROUNDN(c.R,k)} gegen ${T(opp).name}: ${m.hg}:${m.ag}${m.pen?` i.E. (${m.pen[0]}:${m.pen[1]})`:m.et?' n.V.':''}.`,pr:q(S.fav,'tr',won?rpick(QWIN,R):rpick(QLOSS,R)),imp:2})}}}
    if(c.winner&&c.type==='dfb')addNews({cat:'cup',clubs:[c.winner],h:`${T(c.winner).name} gewinnt den DFB-Pokal!`,b:`Im Finale von Berlin setzt sich ${T(c.winner).name} durch und holt den Pott.`,pr:q(c.winner,'pr','Das ist ein unvergesslicher Abend für unseren Verein und alle Fans. Dieser Pokal gehört der ganzen Region.'),imp:3});}
  for(const e of S.euro||[]){if(before.E[e.id]===e.step)continue;
    const ger=e.teams.filter(id=>!T(id).cc);if(e.winner&&before.EW[e.id]!==e.winner)addNews({cat:'int',clubs:[e.winner],h:`${T(e.winner).name} gewinnt die ${e.name}!`,b:`Der Titel im Europapokal geht an ${T(e.winner).name}${T(e.winner).cc?'':' – ein Triumph für den deutschen Fußball'}.`,imp:3});
    else if(e.step>e.nmd){const r=e.ko[e.ko.length-1];const out=r.ties.filter(x=>!T(x.a).cc||!T(x.b).cc);if(out.length)addNews({cat:'int',clubs:out.map(x=>x.w),h:`${e.name}, ${r.name}: ${out.map(x=>`${T(x.w).name} weiter`).slice(0,3).join(', ')}`,b:out.map(x=>`${T(x.a).name} – ${T(x.b).name}: ${x.final?x.l1.hg+':'+x.l1.ag:x.agg[0]+':'+x.agg[1]}${x.pen?' i.E.':''}`).join(' · '),imp:2})}}
}
// Transfer-PR
function newsTransfer(pid,from,to,fee){const p=P()[pid];if(!p||!T(from)||!T(to))return;const fav=from===S.fav||to===S.fav;
  if(!fav&&fee<2.5e7)return;const R=srng(hstr('t'+pid+S.season));
  const rec=(S.tr||[]).length&&fee>=Math.max(...(S.tr||[]).slice(1).map(x=>x.fee||0));
  addNews({cat:fav?'fav':'tr',clubs:[to,from],h:rec?`Rekord! ${T(to).name} holt ${p.n} für ${money(fee)}`:fee?`${p.n} wechselt für ${money(fee)} zu ${T(to).name}`:`${p.n} wechselt ablösefrei zu ${T(to).name}`,
    b:`Der ${p.a}-jährige ${POSN[p.p]} kommt von ${T(from).name}.`,pr:q(to,'sd',rpick([`Wir freuen uns sehr, dass sich ${p.n.split(' ')[0]} für unseren Weg entschieden hat. Er bringt genau die Qualität mit, die wir gesucht haben.`,`${p.n} war unser absoluter Wunschspieler. Die Gespräche waren intensiv, umso glücklicher sind wir jetzt.`,`Mit ${p.n} gewinnen wir an Tempo und Mentalität. Er wird uns sofort weiterhelfen.`],R)),press:true,imp:fee>=5e7?3:2})}
// Finanz-PR (Übernahmen, Ausstiege, Insolvenzen)
function newsFinance(type,id,txt){if(!T(id))return;const l=lgOf(id);const lv=l?(l.foreign?1:l.level):9;if(lv>4&&id!==S.fav)return;
  if(!['ins','inv','out'].includes(type)&&id!==S.fav)return;const R=srng(hstr('f'+id+S.season+type));
  const pr=type==='ins'?q(id,'pr','Wir haben in den vergangenen Wochen alles versucht, um diesen Schritt abzuwenden. Unser Ziel ist ein geordneter Neuanfang, damit der Verein eine Zukunft hat.')
    :type==='inv'?q(id,'pr',rpick(['Mit unserem neuen Partner schaffen wir die Grundlage, um sportlich und wirtschaftlich den nächsten Schritt zu gehen.','Die Partnerschaft sichert die Zukunft unseres Vereins. Die Identität und die Fans bleiben dabei unser wichtigstes Gut.'],R))
    :type==='out'?q(id,'pr','Wir bedauern die Entscheidung unseres Partners. Jetzt gilt es, die Finanzen mit Augenmaß neu aufzustellen.'):null;
  addNews({cat:id===S.fav?'fav':'fin',clubs:[id],h:type==='ins'?`Insolvenz: ${T(id).name} stellt Antrag`:type==='inv'?`Investor steigt bei ${T(id).name} ein`:type==='out'?`Investor verlässt ${T(id).name}`:`${T(id).name}: Finanzen`,b:txt.replace(/^[^:]+:\s*/,''),pr,press:!!pr,imp:type==='ins'?3:2})}
// Saisonwechsel
function newsSeason(st,oldSeason){
  const bl=L('bl');if(bl&&st.bl)addNews({cat:'liga',lg:'bl',clubs:[st.bl[0]],h:`${T(st.bl[0]).name} ist Deutscher Meister ${sl2(oldSeason)}!`,b:`Die Schale geht an ${T(st.bl[0]).name}. Absteigen müssen ${st.bl.slice(-2).map(id=>T(id).name).join(' und ')}.`,pr:q(st.bl[0],'tr','Diese Meisterschaft ist das Ergebnis einer ganzen Saison harter Arbeit. Heute wird gefeiert, morgen denken wir an die neue Saison.'),imp:3});
  ['bl2','l3'].forEach(k=>{if(st[k])addNews({cat:'liga',lg:k,clubs:[st[k][0]],h:`${T(st[k][0]).name} gewinnt die ${L(k).name}`,b:`Aufsteiger: ${st[k].slice(0,2).map(id=>T(id).name).join(', ')}.`,imp:2})});
  S.leagues.filter(l=>l.foreign&&st[l.id]).forEach(l=>addNews({cat:'int',lg:l.id,clubs:[st[l.id][0]],h:`${l.title}: ${T(st[l.id][0]).name}`,b:`${T(st[l.id][0]).name} sichert sich den Titel in ${l.land}.`,imp:1}));
}
// Ansicht
const NCAT={liga:'Liga',fav:'Mein Verein',tr:'Transfer',fin:'Finanzen',cup:'Pokal',int:'International',pr:'Pressemitteilung'};
function newsItem(x){const c=(x.clubs||[]).filter(id=>T(id));
  return `<article class="ni${x.imp>=3?' big':''} c-${x.cat}"><div class="nk"><span class="tag">${x.press?'Pressemitteilung · ':''}${NCAT[x.cat]||'News'}</span><span class="meta">${x.d!=null&&x.d>=0?fmtDay(x.d,{y:false})+' '+(x.d>=184?x.s+1:x.s):sl2(x.s)+' · '+(x.r?x.r+'. Spieltag':'Saisonpause')}</span></div>
   <h3>${esc(x.h)}</h3>${x.b?`<p>${esc(x.b)}</p>`:''}
   ${x.pr?`<blockquote><p>„${esc(x.pr.txt)}“</p><cite>${esc(x.pr.who)}</cite></blockquote>`:''}${x.pr2?`<blockquote class="opp"><p>„${esc(x.pr2.txt)}“</p><cite>${esc(x.pr2.who)}</cite></blockquote>`:''}
   ${c.length?`<div class="nl">${c.map(id=>tl(id)).join(' · ')}${x.lg&&L(x.lg)?` · <button class="tlink" data-act="lg:${x.lg}">${esc(L(x.lg).name)}</button>`:''}</div>`:''}</article>`}
function tvSlots(lg,rd){const order=rd.slice().sort((a,b)=>(T(b.h).r+T(b.a).r)-(T(a.h).r+T(a.a).r));const lab=new Map();
  if(lg.level===1&&!lg.foreign){const sl=['Samstag, 18:30 Uhr · Topspiel','Freitag, 20:30 Uhr','Sonntag, 17:30 Uhr','Sonntag, 15:30 Uhr','Samstag, 15:30 Uhr'];order.forEach((m,i)=>lab.set(m,sl[Math.min(i,4)]))}
  else if(lg.level===2){const sl=['Samstag, 20:30 Uhr · Topspiel','Freitag, 18:30 Uhr','Sonntag, 13:30 Uhr','Samstag, 13:00 Uhr'];order.forEach((m,i)=>lab.set(m,sl[Math.min(i,3)]))}
  else order.forEach(m=>lab.set(m,lg.level===3?'Samstag, 14:00 Uhr':lg.foreign?'Wochenende':'Sonntag, 15:00 Uhr'));return lab}
function renderPrognosis(lg){
  if(!lg)return '';const md=lg.played,rd=lg.rounds[md];
  let h=`<div class="card"><div class="hd"><div><div class="meta">TV-Prognose · ${esc(lg.name)}</div><h3 class="ct" style="margin:0">${rd?`${md+1}. Spieltag – Vorschau`:'Saison beendet'}</h3></div><select id="progLg" class="search" style="width:auto">${S.leagues.filter(l=>l.level<=3||l.foreign||l.teams.includes(S.fav)).map(l=>`<option value="${l.id}"${l.id===lg.id?' selected':''}>${esc(l.name)}</option>`).join('')}</select></div>`;
  if(rd){const slots=tvSlots(lg,rd);const ord=rd.slice().sort((a,b)=>(T(b.h).r+T(b.a).r)-(T(a.h).r+T(a.a).r));
    h+=`<div class="progs">${ord.map(m=>{const p=matchProb(m.h,m.a);const ctx=ctxL(lg,md);const pc=x=>Math.round(x*100);
      const fav=p.h>p.a?m.h:m.a,fp=Math.max(p.h,p.a);const exp=fp>.62?`Klare Sache? ${T(fav).name} geht als deutlicher Favorit ins Spiel.`:fp>.45?`Leichte Vorteile für ${T(fav).name}.`:'Ein Duell auf Augenhöhe – hier ist alles drin.';
      return `<div class="pg"><div class="meta">${esc(slots.get(m)||'')}</div><div class="pgm"><span>${tl(m.h)}</span><b class="${m.hg!=null?'':'tip'}">${m.hg!=null?m.hg+':'+m.ag:`<small>Tipp</small>${p.tip[0]}:${p.tip[1]}`}</b><span>${tl(m.a)}</span></div>
       <div class="pbar"><i style="width:${pc(p.h)}%"></i><i style="width:${pc(p.d)}%"></i><i style="width:${pc(p.a)}%"></i></div><div class="pl"><span>Sieg ${pc(p.h)} %</span><span>Remis ${pc(p.d)} %</span><span>Sieg ${pc(p.a)} %</span></div>
       <div class="pe meta">${m.hg!=null?'Bereits live gespielt.':exp+` Tipp der Experten: ${p.tip[0]}:${p.tip[1]}.`}</div>${m.hg==null&&ctx.canLive?`<button class="btn sm live" data-act="mt:${mref(m,ctx)}">▶ Live verfolgen</button>`:''}</div>`}).join('')}</div>`}
  const fc=seasonForecast(lg);const pc=x=>x>=.995?'>99 %':x<.005?(x>0?'<1 %':'–'):Math.round(x*100)+' %';
  const showTop=lg.level===1||lg.foreign;
  h+=`<h3 class="ct" style="margin-top:14px">Saisonprognose</h3><p class="note" style="margin:-4px 0 8px">400-mal die Restsaison durchgespielt, auf Basis der aktuellen Tabelle und Spielstärke.</p><div class="scroll"><table><thead><tr><th class="l">Verein</th><th>Ø Platz</th><th>Meister</th><th>${showTop?'Europa':'Aufstieg'}</th><th>Abstieg</th></tr></thead><tbody>${fc.map(r=>`<tr${r.id===S.fav?' class="hl"':''}><td class="team">${tl(r.id)}</td><td>${r.exp.toFixed(1).replace('.',',')}</td><td>${pc(r.title)}</td><td>${pc(showTop?r.top+r.up:r.up)}</td><td class="${r.down>.5?'no':''}">${pc(r.down)}</td></tr>`).join('')}</tbody></table></div></div>`;
  return h}
function renderNews(){
  const f=view.nf||'';const all=NEWS();
  const pg=view.npage||1,flt=all.filter(x=>!f||(f==='prog'?false:f==='bl'?x.lg==='bl':f==='pr'?x.press:x.cat===f)),items=flt.slice(0,pg*20);
  const lg=L(view.progLg)||(S.fav&&lgOf(S.fav)&&lgOf(S.fav).level<=3?lgOf(S.fav):L('bl'));
  const feed=`<div class="news">${items.map(newsItem).join('')||'<div class="card empty">Noch keine Nachrichten. Simuliere einen Spieltag – dann berichtet die Redaktion.</div>'}${flt.length>items.length?`<button class="btn" data-act="nmore">Ältere Meldungen laden (${flt.length-items.length})</button>`:''}</div>`;
  return f==='prog'?renderPrognosis(lg):`<div class="ngrid"><div>${feed}</div><div>${renderPrognosis(lg)}</div></div>`;
}
