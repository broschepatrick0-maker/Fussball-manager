// ---------- Spielerattribute ----------
// Jeder Spieler hat neben der Gesamtstärke p.s acht Attribute. Gespeichert werden nur Abweichungen (p.ao) von p.s,
// damit Training, Alterung und alle bisherigen Systeme weiter über p.s laufen und die Attribute automatisch mitwachsen.
// Die Gesamtstärke auf der eigenen Position ergibt sich genau aus den gewichteten Attributen.
const ATTR=[['tem','Tempo','TEM'],['tec','Technik','TEC'],['pas','Passspiel','PAS'],['abs','Abschluss','ABS'],['zwk','Zweikampf','ZWK'],['kop','Kopfball','KOP'],['aus','Ausdauer','AUS'],['men','Mentalität','MEN'],['tw','Torwartspiel','TOR']];
const ATTRN=Object.fromEntries(ATTR.map(a=>[a[0],a[1]]));
const POSW={TW:{tw:.85,men:.1,pas:.05},
  AB:{zwk:.3,kop:.2,tem:.15,pas:.15,men:.1,aus:.1},
  MF:{pas:.3,tec:.25,aus:.15,men:.1,zwk:.1,tem:.1},
  ST:{abs:.35,tem:.2,tec:.2,kop:.15,men:.1}};
function genAttrOffsets(pos){const W=POSW[pos],ao={};
  for(const [k] of ATTR){const w=W[k]||0;let base=w>=.2?3:w>=.1?0:w>0?-3:-9;
    if(k==='tw'&&pos!=='TW')base=-38;if(pos==='TW'&&['abs','tec','tem'].includes(k))base=-16;
    ao[k]=base+gauss()*6}
  // normieren: gewichtetes Mittel auf der eigenen Position = 0
  const m=Object.entries(W).reduce((a,[k,w])=>a+w*ao[k],0);for(const k in ao)ao[k]=Math.round(ao[k]-m);return ao}
// erwartetes Profil je Position (Mittel der Erzeugung) – Teamprofil = Abweichung davon
function attrExp(pos){const c=attrExp.c||(attrExp.c={});if(c[pos])return c[pos];const W=POSW[pos],b={};for(const [k] of ATTR){const w=W[k]||0;let x=w>=.2?3:w>=.1?0:w>0?-3:-9;if(k==='tw'&&pos!=='TW')x=-38;if(pos==='TW'&&['abs','tec','tem'].includes(k))x=-16;b[k]=x}
  const m=Object.entries(W).reduce((a,[k,w])=>a+w*b[k],0);for(const k in b)b[k]-=m;return c[pos]=b}
function ensureAttr(p){if(!p)return null;if(!p.ao)p.ao=genAttrOffsets(p.p||'MF');return p.ao}
function attr(p,k){const ao=ensureAttr(p);return Math.max(1,Math.min(99,Math.round(p.s+(ao[k]||0))))}
// Stärke eines Spielers auf einer Position (für die eigene Position = p.s)
function posStr(p,pos){if(!p)return 0;const ao=ensureAttr(p),W=POSW[pos]||POSW.MF;let v=p.s;for(const [k,w] of Object.entries(W))v+=w*Math.max(-p.s+1,Math.min(99-p.s,ao[k]||0));return v}
function attrTop(p,n){const ao=ensureAttr(p);return ATTR.filter(([k])=>k!=='tw'||p.p==='TW').map(([k,l,s])=>[k,l,s,attr(p,k)]).sort((a,b)=>b[3]-a[3]).slice(0,n||2)}
// Mannschaftsprofil: mittlere Abweichung der Startelf je Attribut (für Taktik-Boni)
function teamAttr(id){const t=T(id);if(!t||!t.sq)return null;const k=S.day+':'+(t.sq.length)+':'+(t.r||0);if(t._ta&&t._ta.k===k)return t._ta.v;
  const xi=(typeof starters==='function'?starters(id):t.sq).map(x=>P()[x]).filter(p=>p&&p.p!=='TW');if(!xi.length)return null;
  const v={};for(const [a] of ATTR){if(a==='tw')continue;v[a]=xi.reduce((s,p)=>s+(ensureAttr(p)[a]||0)-attrExp(p.p)[a],0)/xi.length}
  Object.defineProperty(t,'_ta',{value:{k,v},enumerable:false,configurable:true,writable:true});return v}
// Welche Attribute welcher Spielstil braucht
const STYLE_ATTR={offensiv:['abs','tec'],defensiv:['zwk','kop'],konter:['tem','abs'],pressing:['aus','zwk','tem'],ballbesitz:['pas','tec'],ausgewogen:[]};
function styleFit(id,style){const v=teamAttr(id),ks=STYLE_ATTR[style]||[];if(!v||!ks.length)return 0;const d=ks.reduce((a,k)=>a+(v[k]||0),0)/ks.length;return Math.max(-8,Math.min(8,d*1.5))}
function attrBars(p){ensureAttr(p);const W=POSW[p.p]||{};
  return `<div class="attrs">${ATTR.filter(([k])=>k!=='tw'||p.p==='TW').map(([k,l])=>{const v=attr(p,k);return `<div class="attr${W[k]?' key':''}"><span>${l}</span><i><b style="width:${v}%;background:${v>=75?'#2e9e5b':v>=55?'#7bbf3a':v>=40?'#e0b23a':'#d9634c'}"></b></i><em>${v}</em></div>`}).join('')}</div>
   <p class="note" style="margin-top:6px">Fett = wichtig für die Position ${POSN[p.p]}. Auf anderen Positionen: ${POS.filter(x=>x!==p.p).map(x=>`${POSN[x]} ${posStr(p,x).toFixed(0)}`).join(' · ')}</p>`}
function playerInfoHTML(pid){const p=P()[pid];if(!p)return '';const club=Object.keys(S.teams).find(id=>T(id).sq&&T(id).sq.includes(pid));
  return `<div class="ovc"><div class="facts"><div><small>Position</small><b>${POSN[p.p]}</b></div><div><small>Alter</small><b>${p.a}</b></div><div><small>Stärke</small><b>${p.s.toFixed(1)}</b></div><div><small>Marktwert</small><b>${money(value(pid))}</b></div></div>
   ${club?`<p class="meta" style="margin:8px 0">${flagOf(p)} ${esc(p.nat||'')} · ${tl(club)}</p>`:''}<h4>Attribute</h4>${attrBars(p)}</div>`}
// Trainingsschwerpunkt verschiebt das Profil langsam (die Gesamtstärke bleibt dabei gleich)
const TRAIN_ATTR={angriff:['abs','tec'],abwehr:['zwk','kop'],kondition:['aus','tem'],taktik:['pas','men'],jugend:['tec','tem']};
function trainAttr(p,tr,int){const ks=TRAIN_ATTR[tr];if(!ks)return;const ao=ensureAttr(p),W=POSW[p.p];p.tx=(p.tx||0)+.05*int;if(p.tx<1)return;p.tx=0;
  ks.forEach(k=>{if((ao[k]||0)<20)ao[k]=(ao[k]||0)+1});const m=Object.entries(W).reduce((a,[k,w])=>a+w*(ao[k]||0),0);if(Math.abs(m)>=.5){const lk=ATTR.map(a=>a[0]).filter(k=>!ks.includes(k)&&W[k]);lk.forEach(k=>ao[k]=Math.round((ao[k]||0)-m/W[k]/lk.length))}}
