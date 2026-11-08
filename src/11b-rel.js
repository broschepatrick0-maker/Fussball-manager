// ---------- Relegation als echte Spiele ----------
// Sobald alle Ligen fertig sind, werden die Paarungen geplant: Hinspiel nach 4 Tagen, Rückspiel nach 8 Tagen.
// Mein Verein kann seine Relegationsspiele live verfolgen; die Entscheidung fällt nach Hin- und Rückspiel (ggf. Verlängerung/Elfmeterschießen).
function relKind(p){const la=lgOf(p.a),lb=lgOf(p.b);if(!la||!lb)return {lab:'Relegation',lv:9};
  if(lb.id==='bl')return {lab:'Relegation zur Bundesliga',lv:1};if(lb.id==='bl2')return {lab:'Relegation zur 2. Bundesliga',lv:2};
  if(lb.level===4&&la.level===4)return {lab:'Aufstiegsspiele zur 3. Liga',lv:3};
  return {lab:`Relegation ${lb.name}`,sub:la.name,lv:lb.level}}
function relCreate(d){const st={};S.leagues.forEach(l=>st[l.id]=table(l).map(r=>r.id));
  REL_PLAN=[];let pairs=[];try{decideMoves(st,[])}catch(e){console.warn('relPlan',e)}finally{pairs=REL_PLAN||[];REL_PLAN=null}
  const last=seasonLen(S.season)-1;let d1=d+4,d2=d+8;if(d2>last){d1=Math.min(d+1,last);d2=Math.min(d+2,last)}
  S.rel={season:S.season,d1,d2,done:!pairs.length,pairs:pairs.map(x=>{const p=relPair(x.a,x.b);Object.assign(p,relKind(p));return p})};
  const fp=S.rel.pairs.find(p=>p.a===S.fav||p.b===S.fav);
  if(fp)try{const opp=fp.a===S.fav?fp.b:fp.a;addNews({cat:'fav',clubs:[S.fav],h:`${fp.lab}: ${T(S.fav).name} gegen ${T(opp).name}`,b:`${fp.a===S.fav?`${T(S.fav).name} kämpft in zwei Spielen um den Aufstieg in die ${lgOf(fp.b).name}`:`${T(S.fav).name} muss in die Relegation, um die Klasse zu halten`}. Hinspiel am ${fmtDay(d1)} bei ${T(fp.m1.h).name}, Rückspiel am ${fmtDay(d2)} bei ${T(fp.m2.h).name}.`,imp:3})}catch(e){}
  const top=S.rel.pairs.filter(p=>p.lv<=2);if(top.length)try{addNews({cat:'de',h:'Die Relegationspaarungen stehen',b:top.map(p=>`${p.lab}: ${T(p.a).name} – ${T(p.b).name}`).join(' · '),imp:2})}catch(e){}
  return S.rel}
function relStep(d){const r=S.rel;if(!r||r.done)return false;let pl=false;
  if(d>=r.d1)r.pairs.forEach(p=>{if(p.m1.hg==null){relLeg(p,1);pl=true}});
  if(d>=r.d2){r.pairs.forEach(p=>{if(p.m2.hg==null||!p.w){relLeg(p,2);pl=true}});r.done=true;
    const fp=r.pairs.find(p=>p.a===S.fav||p.b===S.fav);
    if(fp)try{const won=fp.w===S.fav,up=fp.a===S.fav;addNews({cat:'fav',clubs:[S.fav],h:won?(up?`Aufstieg! ${T(S.fav).name} gewinnt die Relegation`:`Klassenerhalt! ${T(S.fav).name} bleibt in der ${lgOf(fp.b).name}`):(up?`Kein Aufstieg: ${T(S.fav).name} scheitert in der Relegation`:`Abstieg: ${T(S.fav).name} verliert die Relegation`),b:relTxt(fp),imp:3})}catch(e){}
    r.pairs.filter(p=>p.lv<=2).forEach(p=>{try{addNews({cat:'de',h:`${p.lab}: ${T(p.w).name} ${p.w===p.a?'steigt auf':'bleibt drin'}`,b:relTxt(p),imp:2})}catch(e){}})}
  return pl}
function relActive(){return S.rel&&S.rel.season===S.season?S.rel:null}
function relFavDay(){const r=relActive();if(!r||r.done)return null;const p=r.pairs.find(x=>x.a===S.fav||x.b===S.fav);if(!p)return null;return p.m1.hg==null?r.d1:p.m2.hg==null?r.d2:null}
const ctxR=(p,leg)=>{const r=relActive()||{},day=leg===1?r.d1:r.d2,m=leg===1?p.m1:p.m2;return {key:'R'+p.a+':'+p.b+':'+leg,comp:p.lab,rd:leg===1?'Hinspiel':'Rückspiel',rel:true,canLive:!!(relActive()&&!r.done&&m.hg==null&&(leg===1||p.m1.hg!=null)),day}};
function relCard(all,q){const r=all?(relActive()||S.relLast):relActive();if(!r||!r.pairs.length)return '';
  let ps=r.pairs.slice().sort((a,b)=>a.lv-b.lv);const mine=ps.filter(p=>p.a===S.fav||p.b===S.fav);
  if(q)ps=ps.filter(p=>(T(p.a).name+' '+T(p.b).name+' '+p.lab+' '+(p.sub||'')).toLowerCase().includes(q));
  if(!all){const fv=S.fav&&T(S.fav)?T(S.fav).vb:null;ps=[...mine,...ps.filter(p=>!mine.includes(p)&&(p.lv<=3||fv&&T(p.b).vb===fv))].slice(0,8)}
  const row=p=>{const [ga,gb]=p.m1.hg!=null&&p.m2.hg!=null?relAgg(p):[null,null];const live=(m,leg)=>{const c=ctxR(p,leg);return (m.hg!=null||c.canLive)&&(m.h===S.fav||m.a===S.fav||m.hg!=null)?`<button class="s mbtn${m.hg==null?' golive':''}" data-act="mt:${mref(m,c)}">${m.hg==null?'▶ Live':`${m.hg}:${m.ag}${m.pen?' i.E.':m.et?' n.V.':''}`}</button>`:`<span class="s">${m.hg==null?'–:–':`${m.hg}:${m.ag}`}</span>`};
    const w=p.w?`<span class="meta">${p.w===p.a?'⬆ '+esc(T(p.a).name)+' steigt auf':'✔ '+esc(T(p.b).name)+' bleibt drin'}${p.m2.pen?` · Elfmeterschießen ${p.m2.pen[1]}:${p.m2.pen[0]}`:p.m2.et?' · nach Verlängerung':''}</span>`:'';
    return `<div class="relp${mine.includes(p)?' mine':''}"><div class="meta">${esc(p.lab)}${p.sub?' · '+esc(p.sub):''}</div>
     <div class="m"><span class="h">${tl(p.m1.h)}</span>${live(p.m1,1)}<span class="a">${tl(p.m1.a)}</span></div>
     <div class="m"><span class="h">${tl(p.m2.h)}</span>${live(p.m2,2)}<span class="a">${tl(p.m2.a)}</span></div>
     ${ga!=null?`<div class="meta">Gesamt: ${esc(T(p.a).name)} ${ga}:${gb} ${esc(T(p.b).name)}</div>`:''}${w}</div>`};
  const more=!all&&r.pairs.length>ps.length?`<button class="btn sm" data-act="relall">Alle ${r.pairs.length} Paarungen</button>`:'';
  return `<div class="card"><div class="hd"><div><div class="meta">Saison ${r.season}/${String(r.season+1).slice(2)}</div><h2>Relegation</h2></div><span class="tag">${r.done?'entschieden':`Hinspiel ${fmtDay(r.d1)} · Rückspiel ${fmtDay(r.d2)}`}</span></div>
   <p class="note">Hin- und Rückspiel, der Klassentiefere hat zuerst Heimrecht. Steht es nach beiden Spielen unentschieden, gibt es Verlängerung und Elfmeterschießen.</p>
   <div class="matches">${ps.map(row).join('')}</div>${more}</div>`}
function renderRel(){const r=relActive()||S.relLast;if(!r)return '<div class="card"><p class="note">In dieser Saison gibt es noch keine Relegation – sie beginnt, sobald alle Ligen fertig sind.</p></div>';
  const q=(view.relq||'').toLowerCase().trim();return relCard(true,q).replace('<div class="matches">',`<input id="relQ" class="search" placeholder="Verein oder Liga suchen" value="${esc(view.relq||'')}" style="margin:10px 0"><div class="matches">`)}
