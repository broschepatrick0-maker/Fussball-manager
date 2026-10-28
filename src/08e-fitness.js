// ---------- Frische, Belastung und Rotation ----------
// Mein Verein: Frische je Spieler (p.fi = Wert am Tag p.fd, erholt sich täglich). Andere Vereine: Mannschaftswert t.tf/t.td, rotieren selbst.
const FI_COST=23;
const fitMul=f=>f>=88?1:Math.max(.7,1-(88-f)*0.0055);
function recRate(p){const g=S.mgr;let r=p.a<=23?7.5:p.a>=34?4.2:p.a>=31?5.2:6.5;if(g){if(g.train==='kondition')r+=1;r*=[1.12,1,.86][g.ti??1]}return r}
function curFi(p){if(!p||p.fi==null)return 100;const d=Math.max(0,(S.day??0)-(p.fd??0));return Math.min(100,p.fi+d*recRate(p))}
function setFi(p,v){v=Math.max(20,Math.min(100,v));if(v>=99.5){delete p.fi;delete p.fd;return}p.fi=+v.toFixed(1);p.fd=S.day??0}
function teamFi(t){if(!t||t.tf==null)return 100;return Math.min(100,t.tf+Math.max(0,(S.day??0)-(t.td??0))*6.5)}
// Kader-Tiefe: wie viel schwächer die zweite Garnitur ist (für die Rotation der KI)
function depthGap(sq){const fit=sq.filter(id=>P()[id]&&!P()[id].inj);let a=0,b=0,n=0;
  for(const [pos,k] of [['TW',1],['AB',4],['MF',4],['ST',2]]){const v=fit.filter(id=>P()[id].p===pos).map(id=>P()[id].s).sort((x,y)=>y-x);
    for(let i=0;i<k;i++){const x=v[i]??(v[0]??30)-8,y=v[i+k]??Math.max(15,x-10);a+=x;b+=y;n++}}
  return Math.max(0,(a-b)/n)}
// Abzug in Stärkepunkten vor dem Spiel und die Entscheidung der KI
function aiPlan(id){const t=T(id);const f=teamFi(t),r=t.r||50;const p1=r*(1-fitMul(f));
  if(f>=88)return {pen:0,rot:false,f};const dg=t.dp??4,p2=r*(1-fitMul(Math.min(100,f+14)))+dg*0.45;
  return p2<p1?{pen:p2,rot:true,f}:{pen:p1,rot:false,f}}
function fatPen(id){if(id===S.fav&&S.mgr)return 0;const t=T(id);if(!t||t.tf==null)return 0;return aiPlan(id).pen}
function costOf(p){const g=S.mgr;let c=FI_COST+(p.a>=31?3:0);if(g){if(g.style==='pressing')c+=6;else if(g.style==='offensiv')c+=2;else if(g.style==='defensiv')c-=2;if(g.train==='kondition')c-=3}return c+(Math.random()*6-3)}
// Nach dem Spiel Kraft abziehen (pro Verein und Tag höchstens einmal)
function tire(id,mins){const t=T(id);if(!t||t.tdd===S.day)return;t.tdd=S.day;
  if(id===S.fav&&S.mgr&&t.sq){let fsum=0,n=0;
    if(mins)Object.keys(mins).forEach(pid=>{const p=P()[pid];if(!p)return;const f=curFi(p);if(mins[pid]>=45){fsum+=f;n++}setFi(p,f-costOf(p)*mins[pid]/90)});
    else{const r=mgrXI(id);r.xi.forEach(pid=>{const p=P()[pid];if(!p)return;const f=curFi(p);fsum+=f;n++;setFi(p,f-costOf(p))});r.bench.slice(0,3).forEach(pid=>{const p=P()[pid];if(p)setFi(p,curFi(p)-7)})}
    t.pf=n?fsum/n:100;recalc(id);return}
  const pl=aiPlan(id);t.pf=pl.f;t.tf=+Math.max(20,pl.f-(pl.rot?12:FI_COST)).toFixed(1);t.td=S.day;if(t.tf>=99.5){delete t.tf;delete t.td}}
// Verletzungsrisiko steigt mit der Müdigkeit vor dem Spiel
function fatInjMod(id){const t=T(id);const f=t&&t.pf!=null?t.pf:100;return 1+Math.max(0,88-f)/18}
// Rotation von Mein Verein: müde Spieler der gewählten Elf durch frischere Ersatzleute derselben Position tauschen
function rotOn(){const g=S.mgr;return !!(g&&g.rot!==false)}
function rotT(){return (S.mgr&&S.mgr.rotT)||75}
function slotEff(pid,sl){const p=P()[pid];return p?p.s*fitMul(curFi(p))-FIT[sl][p.p]:0}
function rested(){Object.values(S.teams).forEach(t=>{delete t.tf;delete t.td;delete t.tdd;delete t.pf});if(S.pl)for(const p of Object.values(S.pl)){if(p.fi!=null){delete p.fi;delete p.fd}}}
// Ansicht: Frische-Anzeige
function fiLbl(p){const f=Math.round(curFi(p));const c=f>=88?'ok':f>=75?'mid':'low';return `<span class="fi ${c}" title="Frische ${f} %"><i><u style="width:${f}%"></u></i><b>${f}</b></span>`}
function restDays(id){const nx=clubFixtures(id).filter(x=>!x.done&&x.day>S.day);if(!nx.length)return null;const d=nx[0].day;const prev=clubFixtures(id).filter(x=>x.done&&x.day!=null&&x.day<d).pop();return {next:nx[0],day:d,rest:prev?d-prev.day-1:null,after:nx[1]?nx[1].day-d-1:null}}
function fitnessCard(id){const g=MG(),r=mgrXI(id),t=T(id);const xi=r.xi.filter(Boolean);
  const avg=xi.length?xi.reduce((a,pid)=>a+curFi(P()[pid]),0)/xi.length:100;const rd=restDays(id);
  const tired=ensureSquad(id).filter(pid=>P()[pid]&&!P()[pid].inj).map(pid=>[pid,curFi(P()[pid])]).filter(x=>x[1]<88).sort((a,b)=>a[1]-b[1]).slice(0,6);
  const rot=(r.rot||[]).map(([o,n])=>`<div class="orow"><span>🔄 <b>${esc(P()[n].n)}</b> <span class="meta">für ${esc(P()[o].n)} (Frische ${Math.round(curFi(P()[o]))} %)</span></span></div>`).join('');
  return `<div class="card"><div class="hd"><h3 class="ct" style="margin:0">Belastung & Rotation</h3><span class="tag">Startelf Ø ${Math.round(avg)} %</span></div>
   ${rd?`<p class="meta" style="margin:0 0 8px">Nächstes Spiel ${fmtDay(rd.day)} (${esc(rd.next.comp)})${rd.rest!=null?` · ${rd.rest} ${rd.rest===1?'Ruhetag':'Ruhetage'} davor`:''}${rd.after!=null&&rd.after<=3?` · danach nur ${rd.after} ${rd.after===1?'Tag':'Tage'} Pause – englische Woche`:''}</p>`:''}
   <label class="tog"><input type="checkbox" data-act="mrot" ${rotOn()?'checked':''}> Co-Trainer rotiert automatisch, wenn ein Spieler der Elf unter die Grenze fällt</label>
   <div class="seg" style="margin:8px 0">${[70,75,80,85].map(v=>`<button class="${rotT()===v?'on':''}" data-act="mrott:${v}">unter ${v} %</button>`).join('')}</div>
   ${rot?`<div class="meta" style="margin:6px 0 2px">Fürs nächste Spiel rotiert:</div>${rot}`:''}
   ${tired.length?`<div class="meta" style="margin:10px 0 2px">Am stärksten belastet</div>${tired.map(([pid,f])=>`<div class="orow"><span><span class="pos-${P()[pid].p}">${P()[pid].p}</span> ${esc(P()[pid].n)} ${r.xi.includes(pid)?'<span class="tag">Startelf</span>':''}</span>${fiLbl(P()[pid])}</div>`).join('')}`:'<p class="note">Alle Spieler sind ausgeruht.</p>'}
   <p class="note">Ein Spiel über 90 Minuten kostet rund ${FI_COST} % Frische, Pressing deutlich mehr. Pro Tag kommen etwa 6–7 % zurück, bei jungen Spielern mehr, ab 31 weniger. Unter 88 % sinkt die Stärke, und das Verletzungsrisiko steigt. Konditionstraining spart Kraft, hartes Training bremst die Erholung.</p></div>`}
