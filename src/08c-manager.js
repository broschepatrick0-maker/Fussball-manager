// ---------- Manager-Modus (Mein Verein): Formation, Aufstellung, Taktik, Training ----------
const FORMS={'4-4-2':{AB:4,MF:4,ST:2},'4-3-3':{AB:4,MF:3,ST:3},'4-2-3-1':{AB:4,MF:5,ST:1},'4-1-4-1':{AB:4,MF:5,ST:1},'3-5-2':{AB:3,MF:5,ST:2},'5-3-2':{AB:5,MF:3,ST:2}};
const STYLES={ausgewogen:{n:'Ausgewogen',d:'Keine besonderen Stärken oder Schwächen.',m:[1,1]},
  offensiv:{n:'Offensiv',d:'Mehr eigene Tore, aber auch mehr Gegentore.',m:[1.16,1.13]},
  defensiv:{n:'Defensiv',d:'Weniger Gegentore, vorne passiert aber auch weniger.',m:[.84,.83]},
  konter:{n:'Konter',d:'Stark gegen bessere Gegner, gegen schwächere eher harmlos.',m:[1,1]},
  pressing:{n:'Pressing',d:'Mehr Torgefahr und weniger Gegentore – kostet Kraft, mehr Verletzungen.',m:[1.09,.95]},
  ballbesitz:{n:'Ballbesitz',d:'Kontrolliert das Spiel gegen schwächere Gegner, gegen stärkere riskant.',m:[1.03,.93]}};
const TRAIN={ausgewogen:'Ausgewogen',angriff:'Angriff',abwehr:'Abwehr',kondition:'Kondition',taktik:'Taktik',jugend:'Jugend'};
function MG(){if(!S.mgr)S.mgr={form:'4-4-2',xi:null,style:'ausgewogen',fam:80,train:'ausgewogen',ti:1,cosub:true};return S.mgr}
function slotsOf(form){const f=FORMS[form]||FORMS['4-4-2'];return ['TW',...Array(f.AB).fill('AB'),...Array(f.MF).fill('MF'),...Array(f.ST).fill('ST')]}
const FIT={TW:{TW:0,AB:25,MF:25,ST:25},AB:{TW:25,AB:0,MF:6,ST:12},MF:{TW:25,AB:6,MF:0,ST:5},ST:{TW:25,AB:12,MF:5,ST:0}};
const slotStr=(pid,slot)=>{const p=P()[pid];return p?p.s-FIT[slot][p.p]:0};
// Aufstellung für Mein Verein: gewählte Elf, Ausfälle werden automatisch ersetzt
function mgrXI(id){id=id||S.fav;const g=MG(),slots=slotsOf(g.form),sq=ensureSquad(id).filter(pid=>P()[pid]);
  const fit=sq.filter(pid=>!P()[pid].inj),used=new Set(),xi=new Array(slots.length).fill(null);
  if(g.xi)g.xi.forEach((pid,i)=>{if(i<slots.length&&pid&&fit.includes(pid)&&!used.has(pid)){xi[i]=pid;used.add(pid)}});
  // erst gelernte Positionen besetzen, dann Lücken mit dem besten Ersatz füllen
  slots.forEach((sl,i)=>{if(xi[i])return;const best=fit.filter(pid=>!used.has(pid)&&P()[pid].p===sl).sort((a,b)=>P()[b].s-P()[a].s)[0];if(best){xi[i]=best;used.add(best)}});
  slots.forEach((sl,i)=>{if(xi[i])return;const best=fit.filter(pid=>!used.has(pid)).sort((a,b)=>slotStr(b,sl)-slotStr(a,sl))[0];if(best){xi[i]=best;used.add(best)}});
  const vals=slots.map((sl,i)=>xi[i]?slotStr(xi[i],sl):15);
  return {slots,xi,bench:fit.filter(pid=>!used.has(pid)).sort((a,b)=>P()[b].s-P()[a].s).slice(0,9),rating:vals.reduce((a,b)=>a+b,0)/vals.length}}
function bestXI(){const g=MG();g.xi=null;const r=mgrXI();g.xi=r.xi.slice();return r}
function famPenalty(id){return id===S.fav&&S.mgr?-(100-S.mgr.fam)/25:0}
function setTactic(k,v){const g=MG();const old=g[k];g[k]=v;if((k==='style'||k==='form')&&old!==v)g.fam=Math.max(0,g.fam-35);if(k==='form'){g.xi=null}recalc(S.fav)}
// Taktik-Faktoren: [eigene Torgefahr, Gegentor-Faktor]
function tacStyleOf(id,opp){if(id===S.fav&&S.mgr){const o=view&&view.ov;if(o&&o.t==='match'&&o.rep&&o.rep.dyn&&o.rep.dyn.tac&&(o.m.h===id||o.m.a===id))return o.rep.dyn.tac[o.m.h===id?'h':'a'];return S.mgr.style}
  const d=effR(id)-effR(opp);return d>8?'offensiv':d<-8?'defensiv':'ausgewogen'}
function tacMul(id,opp,style){style=style||tacStyleOf(id,opp);let [a,d]=(STYLES[style]||STYLES.ausgewogen).m;const diff=effR(opp)-effR(id);
  if(style==='konter'){a=diff>3?1.12:.94;d=diff>3?.9:1.02}
  if(style==='ballbesitz'&&diff>0){a=.97;d=1.04}
  return [a,d]}
// Training: nach jedem Pflichtspiel von Mein Verein
function trainTick(){const g=S.mgr;if(!g||!S.fav)return;const t=T(S.fav);if(!t||!t.sq)return;const int=[.5,1,1.6][g.ti];
  const focus=p=>g.train==='angriff'?(p.p==='ST'||p.p==='MF'):g.train==='abwehr'?(p.p==='AB'||p.p==='TW'):g.train==='jugend'?p.a<=21:g.train==='ausgewogen';
  for(const pid of t.sq){const p=P()[pid];if(!p||p.inj||p.a>27)continue;let x=0.028*int*(focus(p)?1:0.35)*(g.train==='jugend'&&p.a<=21?1.6:1);const room=potOf(p)-p.s;if(room>0)p.s=+Math.min(99,p.s+Math.min(x,room)).toFixed(2)}
  g.fam=Math.min(100,g.fam+6+(g.train==='taktik'?4:0));
  t.mo=Math.max(5,Math.min(100,(t.mo??60)+(g.ti===2?-0.6:g.ti===0?0.6:0)));
  recalc(S.fav)}
function injuryMod(id){if(id!==S.fav||!S.mgr)return 1;const g=S.mgr;return [0.7,1,1.35][g.ti]*(g.train==='kondition'?0.75:1)*(g.style==='pressing'?1.25:1)}
// ---------- Ansicht: Taktik & Training ----------
function renderTactics(id){
  const g=MG(),r=mgrXI(id),sq=ensureSquad(id).filter(pid=>P()[pid]).sort((a,b)=>POS.indexOf(P()[a].p)-POS.indexOf(P()[b].p)||P()[b].s-P()[a].s);
  const SL={TW:'Tor',AB:'Abwehr',MF:'Mittelfeld',ST:'Sturm'};
  const rows=r.slots.map((sl,i)=>{const cur=r.xi[i];const val=cur?slotStr(cur,sl):0,off=cur&&P()[cur].p!==sl;
    return `<tr><td class="l"><span class="pos-${sl}">${sl}</span></td><td class="l"><select class="search xs" data-slot="${i}">${sq.map(pid=>{const p=P()[pid];return `<option value="${pid}"${pid===cur?' selected':''}${p.inj?' disabled':''}>${p.p} · ${esc(p.n)} · ${p.s.toFixed(0)}${p.inj?' · verletzt':''}</option>`}).join('')}</select></td><td class="${off?'no':''}">${cur?val.toFixed(1):'–'}${off?' <span class="meta">fremde Position</span>':''}</td></tr>`}).join('');
  const nxt=teamMatches(id).find(x=>!x.done);
  const opp=nxt?(nxt.m.h===id?nxt.m.a:nxt.m.h):null;
  const prob=nxt?matchProb(nxt.m.h,nxt.m.a):null;
  return `<div class="grid2"><div class="card"><div class="hd"><h3 class="ct" style="margin:0">Aufstellung</h3><span class="tag">Stärke ${r.rating.toFixed(1)}</span></div>
   <div class="chipbar" style="flex-wrap:wrap;margin-bottom:10px">${Object.keys(FORMS).map(f=>`<button class="${g.form===f?'on':''}" data-act="mform:${f}">${f}</button>`).join('')}</div>
   <table><tbody>${rows}</tbody></table>
   <div class="ctrls" style="margin-top:10px"><button class="btn" data-act="mbest">Beste Elf aufstellen</button></div>
   <p class="note" style="margin-top:8px">Verletzte Spieler ersetzt der Co-Trainer automatisch. Spieler auf einer fremden Position verlieren an Stärke (Abwehr ↔ Mittelfeld −6, Mittelfeld ↔ Sturm −5, Abwehr ↔ Sturm −12, Torwart im Feld −25).</p></div>
  <div><div class="card"><div class="hd"><h3 class="ct" style="margin:0">Spielstil</h3><span class="tag">Eingespielt ${Math.round(g.fam)} %</span></div>
   <div class="prog" style="margin-bottom:10px"><i style="width:${g.fam}%"></i></div>
   ${Object.entries(STYLES).map(([k,v])=>`<button class="stage${g.style===k?' on':''}" style="width:100%;margin-bottom:6px" data-act="mstyle:${k}"><small>${g.style===k?'Aktiv':'Spielstil'}</small><b>${v.n}</b><span class="meta">${v.d}</span></button>`).join('')}
   <p class="note">Ein Wechsel von Formation oder Spielstil kostet Eingespieltheit (bis zu −4 Stärke). Sie wächst mit jedem Pflichtspiel wieder.</p></div>
   <div class="card"><h3 class="ct">Training</h3>
   <div class="chipbar" style="flex-wrap:wrap">${Object.entries(TRAIN).map(([k,v])=>`<button class="${g.train===k?'on':''}" data-act="mtrain:${k}">${v}</button>`).join('')}</div>
   <div class="seg" style="margin-top:10px">${['Locker','Normal','Hart'].map((t,i)=>`<button class="${g.ti===i?'on':''}" data-act="mti:${i}">${t}</button>`).join('')}</div>
   <p class="note">${{ausgewogen:'Alle Spieler entwickeln sich ein wenig.',angriff:'Stürmer und Mittelfeldspieler entwickeln sich schneller.',abwehr:'Abwehrspieler und Torhüter entwickeln sich schneller.',kondition:'25 % weniger Verletzungen.',taktik:'Neue Formationen und Spielstile sitzen schneller.',jugend:'Spieler bis 21 Jahre entwickeln sich deutlich schneller.'}[g.train]} ${['Lockeres Training: weniger Verletzungen, bessere Stimmung, kaum Fortschritt.','Normales Training.','Hartes Training: mehr Fortschritt, aber mehr Verletzungen und schlechtere Stimmung.'][g.ti]} Spieler können nur bis zu ihrem verdeckten Potenzial wachsen.</p></div>
   ${nxt?`<div class="card"><h3 class="ct">Nächstes Spiel</h3><div class="m"><span class="h">${tl(nxt.m.h)}</span><span class="s open">${esc(nxt.rd.replace('. Spieltag','.'))}<small>${esc(nxt.comp)}</small></span><span class="a">${tl(nxt.m.a)}</span></div>
    <p class="note">Prognose mit dieser Aufstellung und Taktik: Sieg ${Math.round((nxt.m.h===id?prob.h:prob.a)*100)} % · Remis ${Math.round(prob.d*100)} % · Niederlage ${Math.round((nxt.m.h===id?prob.a:prob.h)*100)} %${opp?` · ${esc(T(opp).name)} spielt voraussichtlich ${STYLES[tacStyleOf(opp,id)].n.toLowerCase()}`:''}.</p>${nxt.ctx&&nxt.ctx.canLive?`<button class="btn pri" data-act="mt:${mref(nxt.m,nxt.ctx)}">▶ Spiel live coachen</button>`:''}</div>`:''}</div></div>`;
}
