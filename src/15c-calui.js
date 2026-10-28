// ---------- Kalender-Ansicht ----------
const shortN=n=>{let s=n.replace(/^(1\.|FC|SV|TSV|SC|VfB|VfL|SpVgg|TuS|FSV|SG|SpG|TSG|DJK|SSV|ASV|BSC|VfR|ESV|MTV|FV|SVG|TV|SF|SKV|TSC|RSV|BC|FK|AS|AC|US|SS|RC|CF|CD|UD|SD|Real|Atlético|AFC|OSC|OGC|Olympique|Stade|RB|1\. FC)\s+/,'').replace(/\s+(FC|AFC|CF|e\.V\.|04|05|09|1860|1896|1899|1846|1848|1919|1910)$/,'');return s.length>13?s.slice(0,12)+'…':s};
function calMonthIdx(d){const x=dayDate(Math.max(0,d));return (x.getUTCMonth()+6)%12} // 0 = Juli
function compShort(x){return x.k==='L'?'Liga':x.k==='C'?(x.dfb?'DFB':'Pokal'):((S.euro||[]).find(e=>e.name===x.comp)||{}).short||'EU'}
function renderCalendar(){
  const today=Math.max(0,S.day+1),mi=view.cm??calMonthIdx(S.done?seasonLen(S.season)-31:today);view.cm=mi;
  const y=S.season+(mi>=6?1:0),mon=(mi+6)%12;
  const first=dayOf(mon+1,1),dim=new Date(Date.UTC(y,mon+1,0)).getUTCDate(),last=first+dim-1;
  const id=S.fav&&T(S.fav)?S.fav:null,lg=id?lgOf(id):L('bl');
  const fx=id?clubFixtures(id):[];const byDay={};fx.forEach(x=>(byDay[x.day]=byDay[x.day]||[]).push(x));
  const wb=lg?winterBreak(lg):[-1,-1];
  const cl=c=>c==='S'?'w':c==='N'?'l':c==='U'?'d':'';
  const cell=d=>{if(d<first||d>last)return '<div class="cd out"></div>';
    const x=dayDate(d),cls=['cd'];if(d===today&&!S.done)cls.push('today');if(d<today||S.done)cls.push('past');if(transferOpenOn(d))cls.push('tw');if(d>=wb[0]&&d<=wb[1])cls.push('wb');
    let ev='';
    if(id)ev=(byDay[d]||[]).map(f=>{const home=f.m.h===id,opp=home?f.m.a:f.m.h;const r=res(f.m,id);const sc=f.m.hg!=null?(home?f.m.hg+':'+f.m.ag:f.m.ag+':'+f.m.hg):'';
      return `<button class="ce ${f.k} ${cl(r)}" data-act="club:${opp}" title="${esc(f.comp)} · ${esc(f.rd)} · ${home?'Heim':'Auswärts'} gegen ${esc(T(opp).name)}${sc?' · '+sc:''}"><i>${compShort(f)}</i><span>${home?'':'@ '}${esc(shortN(T(opp).name))}</span>${sc?`<b>${sc}</b>`:''}</button>`}).join('');
    else ev=dayEvents(d).filter(e=>e.k==='E'||(e.k==='C'&&e.c.type==='dfb')||(e.k==='L'&&!e.l.foreign&&e.l.level<=2)).map(e=>`<span class="ce ${e.k}"><i>${e.k==='L'?(e.l.level===1?'BL':'BL2'):e.k==='C'?'DFB':e.e.short}</i><span>${e.k==='L'?(e.i+1)+'. Spieltag':e.k==='C'?ROUNDN(e.c.R,e.i):e.i<e.e.nmd?(e.i+1)+'. Spieltag':KOR[e.i-e.e.nmd]||''}</span></span>`).join('');
    return `<div class="${cls.join(' ')}"><span class="dn">${x.getUTCDate()}</span>${ev}</div>`};
  const lead=(wdOf(first)+6)%7;let grid='';for(let i=0;i<lead;i++)grid+='<div class="cd out"></div>';for(let d=first;d<=last;d++)grid+=cell(d);
  // Termine
  const up=[];if(!S.done){
    fx.filter(f=>!f.done&&f.day>=today).slice(0,8).forEach(f=>{const home=f.m.h===id,opp=home?f.m.a:f.m.h;up.push([f.day,`<b>${home?'Heim':'Auswärts'} gegen ${tl(opp)}</b> <span class="meta">${esc(f.comp)} · ${esc(f.rd)}</span>`])});
    const [ja,jb]=winDay(),se=dayOf(9,1);
    if(today<=se)up.push([se,'<b>Transferfenster schließt</b> <span class="meta">Sommer-Wechselperiode endet</span>']);
    else if(today<ja)up.push([ja,'<b>Transferfenster öffnet</b> <span class="meta">Winter-Wechselperiode bis 1. Februar</span>']);
    else if(today<=jb)up.push([jb,'<b>Transferfenster schließt</b> <span class="meta">Winter-Wechselperiode endet</span>']);
    if(lg&&today<wb[0])up.push([wb[0],`<b>Winterpause</b> <span class="meta">${esc(lg.name)} bis ${fmtDay(wb[1])}</span>`]);
    if(isCareer()&&S.career.course){const c=S.career.course,wks=Math.ceil(c.left/(S.career.jobless?1.6:1));const dd=today+((8-wdOf(today))%7)+7*(wks-1);up.push([dd,`<b>Lehrgang ${LIC[c.i].n} endet</b> <span class="meta">voraussichtlich</span>`])}
    if(lg&&lg.dates)up.push([lg.dates[lg.dates.length-1],`<b>Letzter Spieltag</b> <span class="meta">${esc(lg.name)}</span>`]);}
  up.sort((a,b)=>a[0]-b[0]);
  const w=nextOpen();
  return `<div class="card"><div class="hd"><div><div class="meta">Kalender · Saison ${sl2(S.season)}${id?' · '+esc(T(id).name):''}</div><h2>${MONL[mon]} ${y}</h2></div>
   <div class="ctrls"><button class="btn sm" data-act="calm:-1"${mi<=0?' disabled':''} aria-label="Vormonat">‹</button><button class="btn sm" data-act="calm:0">Heute</button><button class="btn sm" data-act="calm:1"${mi>=11?' disabled':''} aria-label="Nächster Monat">›</button></div></div>
   <div class="calg"><div class="cw">Mo</div><div class="cw">Di</div><div class="cw">Mi</div><div class="cw">Do</div><div class="cw">Fr</div><div class="cw">Sa</div><div class="cw">So</div>${grid}</div>
   <div class="clegend"><span><i class="lg-tw"></i>Transferfenster</span><span><i class="lg-wb"></i>Winterpause${lg?' '+esc(lg.name):''}</span>${id?'<span><i class="lg-w"></i>Sieg</span><span><i class="lg-d"></i>Remis</span><span><i class="lg-l"></i>Niederlage</span>':''}</div></div>
   <div class="card"><h3 class="ct">Nächste Termine</h3>${up.length?up.slice(0,10).map(([d,t])=>`<div class="orow"><span class="cdate">${fmtDay(d)}</span><span>${t}</span></div>`).join(''):`<div class="empty">${S.done?'Die Saison ist vorbei. Mit „Neue Saison“ geht es am 1. Juli weiter.':'Keine Termine.'}</div>`}
   <p class="note" style="margin-top:8px">${w&&w.open?`Das Transferfenster ist offen bis ${fmtDay(w.until)}.`:'Das Transferfenster ist geschlossen.'} „Weiter“ springt bis zum nächsten Spiel${id?' deines Vereins':''}, „+7 T“ eine Woche vor.</p></div>`}
