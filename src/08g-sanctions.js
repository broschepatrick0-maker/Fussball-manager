// ---------- Sportgericht: Strafen (Punkte, Geld, Titel) ----------
// S.sanc = [{s,d,id,lg,k,pts,fine,txt,title}]  – pts negativ = Punktabzug in der laufenden Saison
const SANC={
  schiri:{n:'Schiedsrichter-Soll nicht erfüllt',lv:[7,12],p:.035},
  antritt:{n:'Nichtantritt',lv:[8,12],p:.012},
  spieler:{n:'Einsatz eines nicht spielberechtigten Spielers',lv:[4,12],p:.012},
  fans:{n:'Fehlverhalten der Zuschauer (Pyrotechnik)',lv:[1,5],p:.09},
  wette:{n:'Wettmanipulation',lv:[3,10],p:.0007},
  lizenz:{n:'Verstoß gegen Lizenz- und Zahlungsauflagen',lv:[1,6],p:0}};
const SFINE={1:1.2e5,2:5e4,3:2e4,4:6e3,5:2500,6:900,7:500,8:300,9:200,10:150,11:120,12:100};
function SC(){if(!S.sanc)S.sanc=[];return S.sanc}
function sancWeek(){if(S.done)return;const wk=1/44,R=Math.random;
  for(const l of S.leagues){if(l.played>=l.rounds.length||l.played<2)continue;const lv=l.foreign?1:l.level;
    for(const id of l.teams){const t=T(id);if(!t)continue;
      for(const [k,d] of Object.entries(SANC)){if(lv<d.lv[0]||lv>d.lv[1])continue;let p=d.p;
        if(l.foreign&&k!=='fans')continue;
        if(k==='lizenz'){const z=t.fz;if(!z)continue;const h=z.h&&z.h[0];const rev=h?h[1]:1e6;if(!((z.c<0&&z.d>rev*.3)||z.d>rev*1.1))continue;p=.35}
        if(k==='fans'&&lv<=3)p*=1.6;
        if(R()<p*wk)sanction(id,l,k)}}}}
function sanction(id,l,k){const t=T(id),lv=l.foreign?1:l.level,R=Math.random,base=SFINE[lv]||100;let pts=0,fine=0,title=null,txt='';
  const prev=SC().filter(x=>x.id===id&&x.s===S.season&&x.k===k).length;
  if(k==='schiri'){fine=Math.round(base*(1+R())/10)*10;if(prev>=1)pts=-3;txt=prev?`Wiederholt zu wenige Schiedsrichter gemeldet – Geldstrafe und 3 Punkte Abzug`:`Zu wenige Schiedsrichter gemeldet – Geldstrafe`}
  else if(k==='antritt'){fine=Math.round(base*(1.5+R())/10)*10;pts=-3;txt=`Nicht zum Spiel angetreten – Spiel verloren gewertet, 3 Punkte Abzug und Geldstrafe`}
  else if(k==='spieler'){fine=Math.round(base*(.5+R())/10)*10;pts=-3;txt=`Nicht spielberechtigter Spieler eingesetzt – Punkte aberkannt`}
  else if(k==='fans'){fine=Math.round(base*(.3+R()*1.7)/100)*100;txt=lv<=2&&R()<.15?`Pyrotechnik und Ausschreitungen – Geldstrafe und Teilausschluss der Zuschauer`:`Pyrotechnik im Fanblock – Geldstrafe`}
  else if(k==='wette'){fine=Math.round(base*(5+R()*5)/100)*100;pts=-(6+Math.floor(R()*4));
    const tl_=(H().titles[id]||[]).find(x=>x.s===S.season-1&&x.k==='liga');if(tl_&&R()<.5){H().titles[id]=H().titles[id].filter(x=>x!==tl_);title=tl_.c}
    txt=`Spieler an Wettmanipulation beteiligt – ${-pts} Punkte Abzug${title?`, Titel „${title}“ ${sl2(S.season-1)} aberkannt`:''}`}
  else if(k==='lizenz'){if(SC().some(x=>x.id===id&&x.s===S.season&&x.k==='lizenz'))return;fine=Math.round(base*(1+R())/100)*100;pts=-(3+Math.floor(R()*4));txt=`Offene Verbindlichkeiten, Lizenzauflagen nicht erfüllt – ${-pts} Punkte Abzug`}
  if(pts){l.pen=l.pen||{};l.pen[id]=(l.pen[id]||0)+pts}
  if(fine&&t.fz)t.fz.c=Math.round(t.fz.c-fine);
  const e={s:S.season,d:S.day,id,lg:l.id,k,pts,fine,txt,title};SC().unshift(e);if(SC().length>800)SC().length=800;
  const big=k==='wette'||id===S.fav||(lv<=2&&(pts||fine>=5e4))||(lv<=3&&pts);
  if(big)try{addNews({cat:id===S.fav?'fav':'sg',lg:l.id,clubs:[id],h:`Sportgericht: ${k==='wette'?'Wettskandal bei ':''}${t.name}${pts?` – ${-pts} Punkte Abzug`:fine?` – ${money(fine)} Strafe`:''}`,b:`${SANC[k].n}: ${txt}.${fine?` Geldstrafe ${money(fine)}.`:''}`,imp:k==='wette'||id===S.fav?3:2})}catch(err){}
  if(id===S.fav)try{toast(`Sportgericht: ${SANC[k].n}${pts?` (${pts} Pkt.)`:''}`)}catch(err){}
  if(id===S.fav&&S.mgr&&pts){const tt=T(id);tt.mo=Math.max(5,(tt.mo??60)-4)}}
function sancPurge(){S.sanc=SC().filter(x=>x.s>=S.season-4)}
function sancList(rows,showClub){if(!rows.length)return '';
  return rows.map(x=>`<div class="sanc"><span class="sk">${x.pts?`<b class="no">${x.pts}</b>`:x.title?'<b class="no">🏆✕</b>':'<b>€</b>'}</span><span>${showClub?`${tl(x.id)} · `:''}<b>${esc(SANC[x.k].n)}</b><span class="meta"> · ${x.d!=null&&x.d>=0?fmtDay(x.d,{wd:false})+' ':''}${sl2(x.s)}${L(x.lg)&&!showClub?' · '+esc(L(x.lg).name):''}</span><div class="meta">${esc(x.txt)}${x.fine?` · Geldstrafe ${money(x.fine)}`:''}</div></span></div>`).join('')}
function leagueSancHTML(lg){const r=SC().filter(x=>x.lg===lg.id&&x.s===S.season);if(!r.length)return '';
  return `<div class="card"><h3 class="ct">Sportgericht <span class="meta">${r.length} ${r.length===1?'Urteil':'Urteile'} in dieser Saison</span></h3>${sancList(r,true)}</div>`}
function clubSancHTML(id){const r=SC().filter(x=>x.id===id);if(!r.length)return '';
  return `<div class="card"><h3 class="ct">Strafen & Sportgericht</h3>${sancList(r.slice(0,12),false)}</div>`}
// Aufräumen: Spieler ohne Verein und ohne Bezug (Scouting, Jugend, Angebote) entfernen
function gcPlayers(){if(!S.pl)return 0;const keep=new Set();Object.values(S.teams).forEach(t=>(t.sq||[]).forEach(id=>keep.add(id)));
  if(S.scout&&S.scout.list)Object.keys(S.scout.list).forEach(id=>keep.add(id));if(S.acad&&S.acad.intake)S.acad.intake.forEach(id=>keep.add(id));
  (S.offers||[]).forEach(o=>keep.add(o.pid));if(S.mgr){(S.mgr.xi||[]).forEach(id=>id&&keep.add(id));if(S.mgr.cap)keep.add(S.mgr.cap);(S.mgr.talk||[]).forEach(x=>keep.add(x.pid))}
  let n=0;for(const id of Object.keys(S.pl)){if(!keep.has(id)){delete S.pl[id];n++}}S.inj=(S.inj||[]).filter(e=>S.pl[e[0]]);return n}
