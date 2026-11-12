// ---------- Einzeltraining, Positionsumschulung und Entwicklungsverlauf (Mein Verein) ----------
// S.mgr.it = {pid:{k:'abs'|…|'pos:MF', x:Fortschritt 0…1}} – höchstens IT_MAX Spieler gleichzeitig
const IT_MAX=5;
const IT_POS={TW:[],AB:['MF'],MF:['AB','ST'],ST:['MF']};
function ITS(){const g=MG();if(!g.it)g.it={};return g.it}
function itLabel(k){return k.startsWith('pos:')?'Umschulung → '+POSN[k.slice(4)]:ATTRN[k]||k}
function itOptions(p){const W=POSW[p.p]||{};const at=ATTR.filter(([k])=>k!=='tw'||p.p==='TW').sort((a,b)=>(W[b[0]]||0)-(W[a[0]]||0)).map(([k,l])=>[k,l+(W[k]?' ★':'')]);
  return at.concat((IT_POS[p.p]||[]).map(x=>['pos:'+x,`Umschulung → ${POSN[x]} (dort ≈ ${posStr(p,x).toFixed(0)})`]))}
// nach jedem Pflichtspiel (aus trainTick)
function indivTick(int){const it=ITS(),t=T(S.fav);if(!t||!t.sq)return;
  for(const pid of Object.keys(it)){const p=P()[pid],e=it[pid];if(!p||!t.sq.includes(pid)){delete it[pid];continue}if(p.inj)continue;
    if(e.k.startsWith('pos:')){const to=e.k.slice(4);if(!(IT_POS[p.p]||[]).includes(to)){delete it[pid];continue}
      e.x=+(e.x+.05*int*(p.a<=24?1.25:p.a>=30?.75:1)).toFixed(3);
      if(e.x>=1){retrain(p,to,pid);delete it[pid];
        try{addNews({cat:'fav',clubs:[S.fav],h:`${t.name}: ${p.n} ist jetzt ${POSN[to]}spieler`,b:`Die Umschulung ist abgeschlossen. ${p.n} spielt ab sofort ohne Abzug auf der neuen Position (Stärke ${p.s.toFixed(1)}).`,imp:2})}catch(_){}
        try{toast(`🎯 ${p.n}: Umschulung zum ${POSN[to]}spieler abgeschlossen`)}catch(_){}}
      continue}
    const k=e.k,ao=ensureAttr(p);if(attr(p,k)>=99){continue}
    e.x=+(e.x+.1*int*(p.a<=23?1.2:p.a>=31?.7:1)).toFixed(3);if(e.x<1)continue;e.x=0;
    const W=POSW[p.p]||{},w=W[k]||0,room=potOf(p)-p.s;
    if(w&&room>w){// echte Verbesserung: Attribut +1, Gesamtstärke steigt um das Gewicht (bis zum Potenzial)
      ao[k]=(ao[k]||0)+1;for(const a in ao)ao[a]=+(ao[a]-w).toFixed(2);p.s=+Math.min(99,p.s+w).toFixed(2)}
    else{// am Potenzial oder Nebenattribut: Profil verschiebt sich, die Gesamtstärke bleibt
      ao[k]=(ao[k]||0)+1;const m=Object.entries(W).reduce((s,[a,x])=>s+x*(ao[a]||0),0);if(Math.abs(m)>.01){const lk=Object.keys(W).filter(a=>a!==k);const tot=lk.reduce((s,a)=>s+W[a],0);lk.forEach(a=>ao[a]=+((ao[a]||0)-m/tot).toFixed(2))}}
  }}
// Position wechseln: Attribute bleiben gleich, Stärke = Stärke auf der neuen Position
function retrain(p,to,pid){const s0=p.s,s1=+Math.max(1,Math.min(99,posStr(p,to))).toFixed(1),ao=ensureAttr(p);
  for(const a in ao)ao[a]=+((ao[a]||0)+s0-s1).toFixed(2);p.p=to;p.s=s1;if(p.pot!=null)p.pot=+Math.max(s1,Math.min(99,p.pot+s1-s0)).toFixed(1);
  if(S.dev&&S.dev.b)S.dev.b[pid]=s1;const g=MG();if(g.xi)g.xi=null;recalc(S.fav);try{achUnlock('umschul')}catch(e){}}
// Entwicklungsverlauf: Stärke am Saisonende (nur Kader von Mein Verein, max. 12 Saisons)
function devSeasonEnd(){if(!S.fav||!T(S.fav))return;for(const pid of ensureSquad(S.fav)){const p=P()[pid];if(!p)continue;const h=p.hs||(p.hs=[]);if(h.length&&h[h.length-1][0]===S.season)continue;h.push([S.season,+p.s.toFixed(1)]);if(h.length>12)h.shift()}}
// Stand zu Saisonbeginn, um die Entwicklung in der laufenden Saison zu zeigen
function devBase(){if(!S.fav)return {};if(!S.dev||S.dev.s!==S.season||S.dev.id!==S.fav)S.dev={s:S.season,id:S.fav,b:{}};const b=S.dev.b;for(const pid of ensureSquad(S.fav)){const p=P()[pid];if(p&&b[pid]==null)b[pid]=+p.s.toFixed(1)}return b}
function spark(pts,w=90,h=22){if(!pts||pts.length<2)return '';const lo0=Math.min(...pts),hi0=Math.max(...pts),r=Math.max(6,hi0-lo0),lo=(lo0+hi0)/2-r/2;
  const d=pts.map((v,i)=>`${(i/(pts.length-1)*(w-4)+2).toFixed(1)},${(h-2-(v-lo)/r*(h-4)).toFixed(1)}`).join(' ');const up=pts[pts.length-1]>=pts[0];
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline points="${d}" fill="none" stroke="${up?'var(--up)':'var(--down)'}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>`}
function devPts(p){return (p.hs||[]).map(x=>x[1]).concat([+p.s.toFixed(1)])}
// ---------- Ansicht ----------
function indivCard(id){const it=ITS(),sq=ensureSquad(id).filter(pid=>P()[pid]),n=Object.keys(it).filter(pid=>sq.includes(pid)).length;
  const free=sq.filter(pid=>!it[pid]).sort((a,b)=>P()[a].a-P()[b].a||P()[b].s-P()[a].s);
  const sel=view.itp&&free.includes(view.itp)?view.itp:free[0],sp=sel&&P()[sel];
  const rows=Object.entries(it).filter(([pid])=>P()[pid]&&sq.includes(pid)).map(([pid,e])=>{const p=P()[pid],pos=e.k.startsWith('pos:');
    return `<div class="orow itrow"><span><button class="tlink" data-act="pi:${pid}"><b>${esc(p.n)}</b></button> <span class="meta">${p.p} · ${p.a} J. · ${pos?'Stärke '+p.s.toFixed(1):itLabel(e.k)+' '+attr(p,e.k)}${p.inj?' · verletzt, pausiert':''}</span>
      <span class="itbar"><span class="meta">${esc(itLabel(e.k))}</span><span class="prog"><i style="width:${Math.round(e.x*100)}%"></i></span></span></span>
      <span class="ctrls"><button class="btn sm" data-act="itdel:${pid}" aria-label="Einzeltraining von ${esc(p.n)} beenden">Beenden</button></span></div>`}).join('');
  return `<div class="card"><div class="hd"><h3 class="ct" style="margin:0">Einzeltraining</h3><span class="tag">${n} / ${IT_MAX} Plätze</span></div>
   ${rows||'<p class="meta">Noch kein Spieler im Einzeltraining.</p>'}
   ${n<IT_MAX&&sp?`<div class="form itadd" style="margin-top:10px"><label for="itP">Spieler<select id="itP">${free.map(pid=>{const p=P()[pid];return `<option value="${pid}"${pid===sel?' selected':''}>${p.p} · ${esc(p.n)} · ${p.a} J. · ${p.s.toFixed(0)}</option>`}).join('')}</select></label>
     <label for="itK">Schwerpunkt<select id="itK">${itOptions(sp).map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join('')}</select></label>
     <button class="btn pri" data-act="itadd">Einzeltraining starten</button></div>`:''}
   <p class="note" style="margin-top:8px">Nach jedem Pflichtspiel trainiert der Spieler zusätzlich an seinem Schwerpunkt. ★ = wichtig für seine Position: Solange er sein Potenzial nicht erreicht hat, steigt dadurch auch die Gesamtstärke. Eine Umschulung dauert etwa 20 Pflichtspiele (bei jungen Spielern schneller); danach spielt er auf der neuen Position ohne Abzug. Hartes Training beschleunigt alles.</p></div>`}
function devCard(id){const b=devBase(),sq=ensureSquad(id).filter(pid=>P()[pid]).map(pid=>{const p=P()[pid];return {pid,p,d:+(p.s-(b[pid]??p.s)).toFixed(1)}});
  if(!sq.length)return '';const all=sq.slice().sort((x,y)=>y.d-x.d||x.p.a-y.p.a),ls=view.devall?all:all.slice(0,10).concat(all.slice(10).filter(x=>x.d<=-0.5).slice(-5));
  const row=({pid,p,d})=>`<tr><td class="l"><span class="pos-${p.p}">${p.p}</span></td><td class="l team"><button class="tlink" data-act="pi:${pid}">${esc(p.n)}</button></td><td>${p.a}</td><td>${p.s.toFixed(1)}</td><td class="${d>0.05?'ok':d<-0.05?'no':''}">${d>0?'+':''}${d.toFixed(1)}</td><td class="sparkc">${spark(devPts(p))||'<span class="meta">–</span>'}</td></tr>`;
  return `<div class="card"><div class="hd"><h3 class="ct" style="margin:0">Entwicklung</h3><span class="tag">seit Saisonbeginn</span></div>
   <div class="scroll"><table><thead><tr><th class="l">Pos.</th><th class="l">Spieler</th><th>Alter</th><th>Stärke</th><th>±</th><th>Verlauf</th></tr></thead><tbody>${ls.map(row).join('')}</tbody></table></div>
   ${ls.length<all.length||view.devall?`<button class="btn sm" style="margin-top:8px" data-act="devall">${view.devall?'Weniger zeigen':`Alle ${all.length} Spieler zeigen`}</button>`:''}<p class="note" style="margin-top:6px">Der Verlauf zeigt die Stärke am Ende jeder Saison bei deinem Verein. Junge Spieler wachsen bis zu ihrem Potenzial, ab etwa 30 Jahren geht es bergab.</p></div>`}
// Entwicklungskurve im Spielerprofil
function devInfo(p){const pts=devPts(p);if(pts.length<2)return '';return `<h4>Entwicklung</h4><div class="devline">${spark(pts,220,40)}<span class="meta">${(p.hs||[]).map(x=>`${String(x[0]).slice(2)}/${String(x[0]+1).slice(2)}: ${x[1].toFixed(0)}`).join(' · ')} · jetzt ${p.s.toFixed(0)}</span></div>`}
