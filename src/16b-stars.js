// ---------- Beste Spieler der Welt (Ranglisten wie im FM) ----------
// Grundlage: alle Kader der Top-Ligen (Bundesliga, 2. Liga, Auslandsligen, Europapokal-Pool) plus jeder bereits erzeugte Kader.
let STARS=null;
function starsPool(){const key=S.season+':'+S.day+':'+Object.keys(P()).length;if(STARS&&STARS.key===key)return STARS.list;
  const tops=S.leagues.filter(l=>l.foreign||l.level<=2).flatMap(l=>l.teams).concat(S.pool||[]);tops.forEach(id=>{try{if(T(id)&&!T(id).gone)ensureSquad(id)}catch(e){}});
  const list=[];for(const id in S.teams){const t=S.teams[id];if(!t.sq||t.gone)continue;const lg=lgOf(id);for(const pid of t.sq){const p=P()[pid];if(p)list.push({pid,p,id,lg})}}
  STARS={key:S.season+':'+S.day+':'+Object.keys(P()).length,list};return list}
function worldRank(pid){const l=starsPool().slice().sort((a,b)=>b.p.s-a.p.s);const i=l.findIndex(x=>x.pid===pid);return i>=0?i+1:null}
function potTxt(x){const kn=attrKnow(x.pid),pot=potOf(x.p);if(kn>=1)return pot.toFixed(0);const w=Math.round((1-kn)*10)+3,R=srng(hstr('pt'+x.pid)),c=Math.round(pot+(R()*2-1)*w*.5);return `${Math.max(Math.round(x.p.s),c-w)}–${Math.min(99,c+w)}`}
function renderStars(){const f=view.st||(view.st={k:'best',pos:'',nat:'',sc:''});const all=starsPool();
  let l=all.filter(x=>(!f.pos||x.p.p===f.pos)&&(!f.nat||x.p.nat===f.nat)&&(!f.sc||(f.sc==='bl'?x.lg&&x.lg.id==='bl':f.sc==='de'?x.lg&&!x.lg.foreign:x.lg&&x.lg.foreign)));
  if(f.k==='talent')l=l.filter(x=>x.p.a<=21).sort((a,b)=>potOf(b.p)-potOf(a.p)||b.p.s-a.p.s);
  else if(f.k==='value')l=l.sort((a,b)=>value(b.pid)-value(a.pid));
  else l=l.sort((a,b)=>b.p.s-a.p.s||a.p.a-b.p.a);
  l=l.slice(0,100);
  const nats=[...new Set(all.filter(x=>x.p.s>=70).map(x=>x.p.nat))].map(c=>[c,(natInfo(c)||{n:c}).n]).sort((a,b)=>a[1].localeCompare(b[1],'de'));
  const sel=(id,cur,opts)=>`<select id="${id}" class="search">${opts.map(([v,n])=>`<option value="${esc(v)}"${String(cur)===String(v)?' selected':''}>${esc(n)}</option>`).join('')}</select>`;
  const head={best:'Die besten Spieler der Welt',talent:'Die größten Talente (bis 21 Jahre)',value:'Die wertvollsten Spieler'}[f.k];
  return `<div class="card"><div class="hd"><div><div class="meta">Welt · Saison ${S.season}/${String(S.season+1).slice(2)}</div><h2>${head}</h2></div><span class="tag">Top 100</span></div>
   <div class="seg" style="margin-top:10px">${[['best','Beste Spieler'],['talent','Größte Talente'],['value','Wertvollste']].map(([k,n])=>`<button class="${f.k===k?'on':''}" data-act="stf:k:${k}">${n}</button>`).join('')}</div>
   <div class="crrow" style="margin-top:4px"><label class="mfield">Position${sel('stPos',f.pos,[['','Alle'],...POS.map(p=>[p,POSN[p]])])}</label><label class="mfield">Nation${sel('stNat',f.nat,[['','Alle'],...nats])}</label><label class="mfield">Ligen${sel('stSc',f.sc,[['','Weltweit'],['bl','Bundesliga'],['de','Deutschland'],['ex','Ausland']])}</label></div>
   <p class="note" style="margin-top:8px">${f.k==='talent'?'Potenzial fremder Spieler ist geschätzt – beobachte sie, um es genauer zu kennen.':'Grundlage sind alle Kader der Bundesliga, der 2. Liga, der Top-Ligen im Ausland und des Europapokals.'}</p></div>
   <div class="card"><div class="scroll"><table class="wrank"><thead><tr><th>#</th><th class="l">Spieler</th><th>Pos.</th><th>Alter</th><th class="l">Verein</th><th>${f.k==='talent'?'Potenzial':'Stärke'}</th><th>${f.k==='talent'?'Stärke':'Marktwert'}</th></tr></thead><tbody>
   ${l.map((x,i)=>`<tr${x.id===S.fav?' class="hl"':''}><td>${i+1}</td><td class="l team">${flagOf(x.p)} <button class="tlink" data-act="pi:${x.pid}">${esc(x.p.n)}</button>${x.p.real?'':''}</td><td><span class="pos-${x.p.p}">${x.p.p}</span></td><td>${x.p.a}</td><td class="l team">${tl(x.id)}</td><td><b>${f.k==='talent'?potTxt(x):x.p.s.toFixed(0)}</b></td><td>${f.k==='talent'?x.p.s.toFixed(0):money(value(x.pid))}</td></tr>`).join('')}
   </tbody></table></div>${l.length?'':'<p class="note">Keine Spieler für diese Auswahl.</p>'}</div>`}
