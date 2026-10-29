// ---------- Spielerstatistik (Torjäger, Vorlagen) & Vereinslegenden ----------
function trackLg(lg){return !!lg&&((lg.foreign?lg.level<=1:lg.level<=4)||lg.trk||(S.fav&&lg.teams.includes(S.fav)))}
function SS(){if(!S.ss)S.ss={};return S.ss} // S.ss[ligaId][pid]=[Tore,Vorlagen,Spiele,Verein]
function starters(id){if(id===S.fav&&S.mgr){try{const x=mgrXI(id).xi.filter(Boolean);if(x.length>=9)return x}catch(e){}}
  const fit=ensureSquad(id).filter(x=>P()[x]&&!P()[x].inj),by=p=>fit.filter(x=>P()[x].p===p).sort((a,b)=>P()[b].s-P()[a].s);
  const out=[...by('TW').slice(0,1),...by('AB').slice(0,4),...by('MF').slice(0,4),...by('ST').slice(0,2)];
  if(out.length<11)fit.filter(x=>!out.includes(x)).sort((a,b)=>P()[b].s-P()[a].s).slice(0,11-out.length).forEach(x=>out.push(x));return out}
const GOALW={TW:.02,AB:.7,MF:2.4,ST:5.5},ASSW={TW:.1,AB:1.3,MF:4,ST:2.2};
function wpickP(ids,W,ex){let tot=0;const w=ids.map(x=>{const p=P()[x];if(x===ex||!p)return 0;const v=W[p.p]*Math.pow(Math.max(20,p.s)/55,2);tot+=v;return v});
  let r=Math.random()*tot;for(let i=0;i<ids.length;i++){r-=w[i];if(r<=0&&w[i])return ids[i]}return ids.find(x=>x!==ex)||null}
function genGoals(xi,n){const g=[];for(let i=0;i<n;i++){const sc=wpickP(xi,GOALW);g.push([sc,Math.random()<.72?wpickP(xi,ASSW,sc):null])}return g}
function legRec(id,pid,g,a,ap){const t=T(id),p=P()[pid];if(!t||!p)return;t.lgd=t.lgd||{};
  const e=t.lgd[pid]||(t.lgd[pid]={n:p.n,nat:p.nat,p:p.p,ap:0,g:0,a:0,f:S.season,l:S.season});e.ap+=ap;e.g+=g;e.a+=a;e.l=S.season;e.n=p.n}
function statMatch(m,lg){if(!trackLg(lg)||m.hg==null||m.st)return;m.st=1;const tab=SS()[lg.id]=SS()[lg.id]||{};
  const row=(pid,id)=>{const r=tab[pid]||(tab[pid]=[0,0,0,id]);r[3]=id;return r};
  const side=(id,n,pre)=>{if(!T(id))return;const xi=starters(id);if(!xi.length)return;
    xi.forEach(pid=>{row(pid,id)[2]++;legRec(id,pid,0,0,1)});
    (pre||genGoals(xi,n)).forEach(([sc,as])=>{if(sc&&P()[sc]){row(sc,id)[0]++;legRec(id,sc,1,0,0)}if(as&&P()[as]){row(as,id)[1]++;legRec(id,as,0,1,0)}})};
  side(m.h,m.hg,m.gs&&m.gs.h);side(m.a,m.ag,m.gs&&m.gs.a)}
// Saisonende: Torschützenkönige merken, Statistik zurücksetzen, Legenden-Liste kürzen
function statsSeasonEnd(log){const ss=SS();S.tk=S.tk||{};
  for(const [lid,tab] of Object.entries(ss)){const lg=L(lid);const top=Object.entries(tab).filter(([pid])=>P()[pid]).sort((a,b)=>b[1][0]-a[1][0]||b[1][1]-a[1][1])[0];
    if(!top||!top[1][0])continue;const [pid,r]=top;(S.tk[lid]=S.tk[lid]||[]).unshift([S.season,P()[pid].n,T(r[3])?T(r[3]).name:'',r[0],r[1]]);if(S.tk[lid].length>60)S.tk[lid].length=60;
    if(lg&&!lg.foreign&&lg.level<=3)log.push(`Torschützenkönig ${lg.name}: ${P()[pid].n} (${T(r[3])?T(r[3]).name:''}) mit ${r[0]} Toren`)}
  S.ssLast={s:S.season,d:ss};S.ss={};
  for(const t of Object.values(S.teams)){if(!t.lgd)continue;const cur=new Set(t.sq||[]);const ks=Object.keys(t.lgd);if(ks.length<=40)continue;
    const sc=k=>{const e=t.lgd[k];return e.ap+e.g*3+e.a*2};ks.sort((a,b)=>sc(b)-sc(a));ks.slice(30).forEach(k=>{if(!cur.has(k))delete t.lgd[k]})}}
// ---------- Ansichten ----------
function statsHTML(lg){if(!trackLg(lg)){lg.trk=true;return `<div class="empty">Für diese Liga wird ab jetzt Statistik geführt – simuliere ein paar Spieltage.</div>`}
  const last=view.slast&&S.ssLast&&S.ssLast.d[lg.id];const tab=last?S.ssLast.d[lg.id]:(SS()[lg.id]||{});
  const rows=Object.entries(tab).filter(([pid])=>P()[pid]);const cat=view.scat||'g';
  const key={g:r=>r[0]*100+r[1],a:r=>r[1]*100+r[0],s:r=>(r[0]+r[1])*100+r[0],sp:r=>r[2]};
  const lbl={g:'Tore',a:'Vorlagen',s:'Scorer',sp:'Einsätze'};
  const list=rows.sort((a,b)=>key[cat](b[1])-key[cat](a[1])).slice(0,25);
  const seg=`<div class="seg" role="tablist">${Object.entries(lbl).map(([k,n])=>`<button class="${cat===k?'on':''}" data-act="scat:${k}">${n}</button>`).join('')}</div>${S.ssLast&&S.ssLast.d[lg.id]?`<div class="seg" style="margin-top:6px"><button class="${!last?'on':''}" data-act="slast:0">Diese Saison</button><button class="${last?'on':''}" data-act="slast:1">Saison ${sl2(S.ssLast.s)}</button></div>`:''}`;
  const tbl=list.length?`<div class="scroll"><table><thead><tr><th class="l">#</th><th class="l">Spieler · Verein</th><th>Sp</th><th>Tore</th><th>Vorl.</th><th>Scorer</th></tr></thead><tbody>${list.map(([pid,r],i)=>`<tr${r[3]===S.fav?' class="hl"':''}><td class="l">${i+1}</td><td class="l">${flagOf(P()[pid])} <b>${esc(P()[pid].n)}</b> <span class="meta">${P()[pid].p}</span><br><span class="meta">${esc(T(r[3])?T(r[3]).name:"")}</span></td><td>${r[2]}</td><td${cat==='g'?' class="b"':''}>${r[0]}</td><td${cat==='a'?' class="b"':''}>${r[1]}</td><td${cat==='s'?' class="b"':''}>${r[0]+r[1]}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Noch keine Spiele gespielt.</div>';
  const tk=(S.tk&&S.tk[lg.id])||[];
  const kings=tk.length?`<h3 class="ct" style="margin-top:14px">Torschützenkönige</h3><div class="scroll"><table><thead><tr><th class="l">Saison</th><th class="l">Spieler · Verein</th><th>Tore</th></tr></thead><tbody>${tk.slice(0,20).map(k=>`<tr><td class="l">${sl2(k[0])}</td><td class="l">${esc(k[1])}<br><span class="meta">${esc(k[2])}</span></td><td><b>${k[3]}</b></td></tr>`).join('')}</tbody></table></div>`:'';
  return seg+tbl+kings}
function legendsHTML(id){const t=T(id);const all=Object.entries(t.lgd||{});
  if(!all.length)return `<div class="card"><h3 class="ct">🏛️ Vereinslegenden</h3><div class="empty">${trackLg(lgOf(id))?'Noch keine Pflichtspiele erfasst.':'Für diesen Verein wird ab jetzt Statistik geführt.'}</div></div>`;
  const cur=new Set(t.sq||[]);const top=(f,n)=>all.slice().sort((a,b)=>f(b[1])-f(a[1])).slice(0,n);
  const row=([pid,e],v)=>`<tr><td class="l">${flagOf(e)} <b>${esc(e.n)}</b>${cur.has(pid)?' <span class="tag">aktiv</span>':''} <span class="meta">${e.p}</span><br><span class="meta">${e.f===e.l?sl2(e.f):sl2(e.f)+' – '+sl2(e.l)}</span></td>${[e.ap,e.g,e.a].map(x=>x===v(e)?`<td><b>${x}</b></td>`:`<td>${x}</td>`).join('')}</tr>`;
  const tb=(title,f)=>`<div><h3 class="ct">${title}</h3><div class="scroll"><table><thead><tr><th class="l">Spieler</th><th>Sp</th><th>Tore</th><th>Vorl.</th></tr></thead><tbody>${top(f,10).map(x=>row(x,f)).join('')}</tbody></table></div></div>`;
  return `<div class="card"><div class="hd"><h3 class="ct" style="margin:0">🏛️ Vereinslegenden</h3><span class="meta">Ligaspiele seit Beginn der Aufzeichnung</span></div><div class="grid2">${tb('Rekordtorschützen',e=>e.g)}${tb('Rekordspieler',e=>e.ap)}</div>${tb('Beste Vorlagengeber',e=>e.a)}</div>`}
