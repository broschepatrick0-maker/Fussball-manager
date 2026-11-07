// ---------- Amateur-Alltag für Mein Verein: Anwerben, Probetraining, Vereinsleben ----------
function AM(){if(!S.am)S.am={ask:{},tr:null,sp:null,spOff:null,fest:null,help:null,vol:0};return S.am}
const favAm=()=>!!S.fav&&T(S.fav)&&isAmClub(S.fav);
const lvF=()=>lvOfTeam(S.fav);
// zufällige, aber stabile „Zufriedenheit“ eines fremden Spielers in seinem Verein
function otherMood(pid){return Math.round(srng(hstr('om'+pid+S.season))()*100)}
function recruitCands(){const f=T(S.fav),flv=lvF(),out=[];
  const near=S.leagues.filter(l=>!l.foreign&&l.level>=flv-1&&l.level<=flv+2&&l.teams.some(id=>id!==S.fav&&regDist(id,S.fav)<=1));
  for(const l of near)for(const tid of l.teams){if(tid===S.fav||regDist(tid,S.fav)>1)continue;const xi=new Set(starters(tid));
    for(const pid of ensureSquad(tid)){const p=P()[pid];if(!p||p.inj)continue;out.push({pid,tid,lv:l.level,xi:xi.has(pid)})}}
  return out}
function recruitChance(c){const p=P()[c.pid],f=T(S.fav),flv=lvF(),d=c.lv-flv;let q=.32;
  if(d<0)q*=Math.pow(.35,-d);else q+=Math.min(.3,d*.14);
  if(!c.xi)q+=.18;const om=otherMood(c.pid);q+=(55-om)/220;
  const lg=lgOf(c.tid),tb=lg&&lg.played>=5?table(lg):null,pos=tb?tb.findIndex(r=>r.id===c.tid):-1;if(tb&&pos>=tb.length-3)q+=.12;
  q+=((f.mo??60)-60)/250;if(p.a>=31)q-=.05;if(p.s>f.r+8)q-=.18;if(p.s>f.r+14)q-=.2;
  const fl=lgOf(S.fav),ft=fl&&fl.played>=5?table(fl):null,fp=ft?ft.findIndex(r=>r.id===S.fav):-1;if(ft&&fp>=0&&fp<3)q+=.06;
  return Math.max(.03,Math.min(.85,q))}
function amRecruit(pid){const a=AM(),f=T(S.fav);if(!windowOpen())return 'zu';if(a.ask[pid]===S.season)return 'schon';if(f.sq.length>=30)return 'voll';
  const c=recruitCands().find(x=>x.pid===pid);if(!c)return 'weg';a.ask[pid]=S.season;
  if(Math.random()<recruitChance(c)){const from=T(c.tid);from.sq=from.sq.filter(x=>x!==pid);f.sq.push(pid);setContract(pid,S.fav);addTr(pid,c.tid,S.fav,0,true);recalc(c.tid);recalc(S.fav);
    try{addNews({cat:'fav',clubs:[S.fav,c.tid],h:`${P()[pid].n} wechselt zum ${f.name}`,b:`Der ${P()[pid].a}-Jährige kommt vom ${from.name}. Gespräch, Handschlag, fertig.`,imp:1})}catch(e){}
    return 'ja'}
  return 'nein'}
// Probetraining: vereinslose Spieler aus der Gegend, jede Wechselperiode neu
function tryouts(){const a=AM();if(!windowOpen())return [];const key=S.season+'-'+(S.day>150?'w':'s');
  if(!a.tr||a.tr.k!==key){if(a.tr)a.tr.l.forEach(x=>{if(!x.signed)delete P()[x.pid]});
    const f=T(S.fav),l=[];const n=4+Math.floor(Math.random()*3);
    for(let i=0;i<n;i++){const pos=rnd(['TW','AB','AB','MF','MF','ST']),age=19+Math.floor(Math.random()*15),st=f.r+gauss()*5-(age>=31?2:0);
      const pid=newPlayer({lv:lvF(),vb:f.vb},pos,st,age);P()[pid].fa=1;const why=rnd(age>=29?['kommt nach einer Pause zurück','ist gerade in die Gegend gezogen','hat seinen alten Verein im Streit verlassen','will noch ein paar Jahre kicken']:['sucht nach der A-Jugend einen Verein','kommt vom Studium zurück','ist gerade in die Gegend gezogen','hat beim Nachbarn keine Einsatzzeit bekommen']);
      l.push({pid,why,e:Math.round(st+gauss()*4)})}
    a.tr={k:key,l}}
  return a.tr.l.filter(x=>P()[x.pid]&&!x.signed)}
// Vereinsleben
const SPN=['Bäckerei {o}','Autohaus {n}','Getränkehandel {n}','Sparkasse {r}','Baustoffe {n}','Physiotherapie {n}','Dachdeckerei {n}','Gasthof „Zur Linde“','Elektro {n}','Raiffeisenbank {r}','Fahrschule {n}','Metzgerei {n}','Malerbetrieb {n}','Sanitär {n} & Söhne','Pizzeria Da {i}'];
function spOffers(){const a=AM();if(a.spOff&&a.spOff.s===S.season)return a.spOff.l;const f=T(S.fav),lv=lvF(),R=srng(hstr('sp'+S.fav+S.season));
  const base={8:2600,9:1500,10:900,11:600,12:400}[Math.min(12,lv)]||400;const town=f.name.replace(/^(SV|SG|TSV|FC|FSV|SC|VfB|VfL|TuS|SpVgg|DJK|ESV|1\.|ASV|TV|BSV|SSV|FV|SpFr|Spfr\.?|Sportfreunde|Eintracht|Blau-Weiß|Rot-Weiß|Germania|Concordia|Empor|Traktor|BS|\d+|\s)+/g,' ').trim().split(/[\s/]/)[0]||'am Ort';
  const fill=s=>s.replace('{o}',town).replace('{r}',town).replace('{n}',rnd(natPool('DE').l)).replace('{i}',rnd(natPool('ITA').f));
  const l=[0,1,2].map(i=>{const y=1+Math.floor(R()*3),amt=Math.round(base*(.6+R()*.9)*(y===1?1.15:y===3?.9:1)/50)*50;return {n:fill(SPN[Math.floor(R()*SPN.length)]),amt,y}});
  a.spOff={s:S.season,l};return l}
function amSeasonEnd(log){const a=S.am;if(!a||!S.fav||!T(S.fav))return;const z=FZ(S.fav);if(!z)return;
  if(a.sp&&a.sp.until>S.season){z.c+=a.sp.amt;log.push(`${T(S.fav).name}: Sponsor ${a.sp.n} zahlt ${money(a.sp.amt)}`)}else if(a.sp&&a.sp.until<=S.season){log.push(`${T(S.fav).name}: Der Vertrag mit ${a.sp.n} ist ausgelaufen`);a.sp=null}
  if(a.vol>0){const sv=a.vol*180;z.c+=sv;log.push(`${T(S.fav).name}: ${a.vol===1?'Ein Ehrenamtlicher spart':a.vol+' Ehrenamtliche sparen'} dem Verein ${money(sv)}`);a.vol=Math.max(0,a.vol-(Math.random()<.4?1:0))}
  if(a.tr){a.tr.l.forEach(x=>{if(!x.signed)delete P()[x.pid]});a.tr=null}}
function amAct(k,v,w){const a=AM(),f=T(S.fav),z=FZ(S.fav);
  if(k==='amwerb'){const r=amRecruit(v);const nm=P()[v]?P()[v].n:'';toast(r==='ja'?`${nm} sagt zu und wechselt zu euch!`:r==='nein'?`${nm} bleibt lieber bei seinem Verein`:r==='zu'?'Wechsel sind nur in der Wechselperiode möglich (Sommer und Januar)':r==='schon'?'Mit ihm hast du diese Saison schon gesprochen':r==='voll'?'Der Kader ist mit 30 Spielern voll':'Der Spieler ist nicht mehr verfügbar');return true}
  if(k==='amtry'){const x=(a.tr&&a.tr.l||[]).find(x=>x.pid===v);if(x){x.t=1;toast(`Probetraining: ${P()[v].n} zeigt Stärke ${P()[v].s.toFixed(1)}`)}return true}
  if(k==='amsign'){const x=(a.tr&&a.tr.l||[]).find(x=>x.pid===v);if(!x||!windowOpen())return true;if(f.sq.length>=30){toast('Der Kader ist mit 30 Spielern voll');return true}
    x.signed=1;delete P()[v].fa;f.sq.push(v);setContract(v,S.fav);recalc(S.fav);try{addNews({cat:'fav',clubs:[S.fav],h:`${P()[v].n} schließt sich dem ${f.name} an`,b:`Nach einem überzeugenden Probetraining ist der ${P()[v].a}-Jährige dabei.`,imp:1})}catch(e){}toast(`${P()[v].n} ist jetzt bei euch`);return true}
  if(k==='amsp'){const o=spOffers()[+v];if(!o||(a.sp&&a.sp.until>S.season))return true;a.sp={...o,until:S.season+o.y};z.c+=o.amt;finLog('pos',S.fav,`${f.name}: Neuer Sponsor ${o.n} (${money(o.amt)} pro Saison, ${o.y} ${o.y===1?'Jahr':'Jahre'})`);toast(`${o.n} ist euer neuer Sponsor`);return true}
  if(k==='amfest'){if(a.fest===S.season)return true;const big=v==='g',cost=big?1500:300;if(z.c<cost){toast('Dafür reicht das Geld nicht');return true}
    const R=Math.random(),wet=R<.22?'Regen':R<.75?'Sonne':'bewölkt',fans=Math.max(40,(z.h&&z.h[0]&&z.h[0][7])||Math.round((z.cap||150)*.6));let inc=big?fans*(wet==='Regen'?5:wet==='Sonne'?28:18):fans*(wet==='Regen'?5:wet==='Sonne'?12:9);inc=Math.round(inc*(.8+Math.random()*.4)/10)*10;
    z.c+=inc-cost;a.fest=S.season;f.mo=Math.min(100,(f.mo??60)+(big?6:3));finLog(inc>cost?'pos':'neg',S.fav,`${f.name}: ${big?'Großes Sportfest':'Sportfest'} bei ${wet} – ${inc>=cost?'Gewinn':'Verlust'} ${money(Math.abs(inc-cost))}`);
    toast(`${big?'Großes Sportfest':'Sportfest'} bei ${wet}: ${inc>=cost?'+':'−'}${money(Math.abs(inc-cost))}`);return true}
  if(k==='amhelp'){if(a.help===S.season)return true;a.help=S.season;const n=Math.max(0,Math.round(((f.mo??60)-35)/20+Math.random()*2-.5));a.vol=(a.vol||0)+n;toast(n?`${n} ${n===1?'Person meldet':'Leute melden'} sich als Helfer`:'Diesmal meldet sich leider niemand');return true}
  return false}
// ---------- Ansichten ----------
function renderRecruit(){const f=T(S.fav),wo=windowOpen(),fp=view.rpos||'';const a=AM();
  let c=recruitCands().filter(x=>!fp||P()[x.pid].p===fp).map(x=>({...x,q:recruitChance(x)})).filter(x=>P()[x.pid].s>=f.r-8).sort((x,y)=>P()[y.pid].s-P()[x.pid].s).slice(0,30);
  const tr=tryouts();
  return `<div class="card"><div class="hd"><h3 class="ct" style="margin:0">Spieler anwerben</h3><span class="tag">${wo?'Wechselperiode offen':'Wechselperiode zu'}</span></div>
  <p class="note" style="margin:-4px 0 10px">Im Amateurfußball zählt kein Geld, sondern das Gespräch: Sprich Spieler aus deinem Kreis an. Wer bei seinem Verein wenig spielt, unzufrieden ist oder gegen den Abstieg kämpft, kommt eher – Spieler aus höheren Ligen nur selten. Pro Saison ein Gespräch je Spieler.</p>
  <div class="seg" style="margin-bottom:8px"><button class="${!fp?'on':''}" data-act="rpos:">Alle</button>${POS.map(p=>`<button class="${fp===p?'on':''}" data-act="rpos:${p}">${p}</button>`).join('')}</div>
  <div class="scroll"><table><thead><tr><th class="l">Spieler · Verein</th><th>Alter</th><th>Stärke</th><th>Chance</th><th></th></tr></thead><tbody>
  ${c.map(x=>{const p=P()[x.pid];const asked=a.ask[x.pid]===S.season;return `<tr><td class="l"><span class="pos-${p.p}">${p.p}</span> ${flagOf(p)} <b>${esc(p.n)}</b>${x.xi?'':' <span class="tag" title="Kommt bei seinem Verein selten zum Einsatz">Bank</span>'}<br><span class="meta">${esc(T(x.tid).name)} · ${esc(LEVELS[x.lv]||'')}</span></td><td>${p.a}</td><td>${p.s.toFixed(1)}</td><td>${Math.round(x.q*100)} %</td><td>${asked?'<span class="meta">abgesagt</span>':`<button class="btn sm${wo?' pri':''}" data-act="amwerb:${x.pid}"${wo?'':' disabled'}>Ansprechen</button>`}</td></tr>`}).join('')||'<tr><td class="l" colspan="5"><span class="meta">Keine passenden Spieler in deiner Gegend.</span></td></tr>'}
  </tbody></table></div></div>
  <div class="card"><h3 class="ct">Probetraining</h3><p class="note" style="margin:-4px 0 10px">Vereinslose Spieler aus der Gegend. Die Stärke ist nur ein Eindruck – im Probetraining siehst du, was sie wirklich können. Ablösefrei.</p>
  ${!wo?'<div class="empty">Zum Probetraining kommen Spieler nur in der Wechselperiode (Sommer und Januar).</div>':tr.length?`<div class="scroll"><table><tbody>${tr.map(x=>{const p=P()[x.pid];return `<tr><td class="l"><span class="pos-${p.p}">${p.p}</span> ${flagOf(p)} <b>${esc(p.n)}</b> <span class="meta">${p.a} J.</span><br><span class="meta">${esc(x.why)}</span></td><td>${x.t?`<b>${p.s.toFixed(1)}</b>`:`<span class="meta">ca. ${x.e-4}–${x.e+4}</span>`}</td><td>${x.t?`<button class="btn sm pri" data-act="amsign:${x.pid}">Aufnehmen</button>`:`<button class="btn sm" data-act="amtry:${x.pid}">Einladen</button>`}</td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty">Gerade niemand da.</div>'}</div>`}
function renderVereinsleben(){const a=AM(),f=T(S.fav),z=FZ(S.fav);const off=spOffers(),act=a.sp&&a.sp.until>S.season;
  return `<div class="card"><div class="hd"><div><div class="meta">${esc(f.name)} · Mitgliederverein</div><h2>Vereinsleben</h2></div><span class="tag">Konto ${money(z.c)}</span></div>
  <p class="note">Im Amateurfußball hält das Drumherum den Verein am Laufen: Sponsoren aus dem Ort, Feste und Leute, die mit anpacken.</p></div>
  <div class="card"><h3 class="ct">Sponsor aus der Region</h3>${act?`<p><b>${esc(a.sp.n)}</b> zahlt ${money(a.sp.amt)} pro Saison – noch bis ${sl2(a.sp.until)}.</p>`:`<p class="note" style="margin:-4px 0 8px">Drei Betriebe aus der Gegend haben Interesse. Die erste Rate kommt sofort, danach jeweils zum Saisonende.</p>${off.map((o,i)=>`<div class="orow"><span><b>${esc(o.n)}</b><br><span class="meta">${money(o.amt)} pro Saison · ${o.y} ${o.y===1?'Jahr':'Jahre'}</span></span><button class="btn sm pri" data-act="amsp:${i}">Annehmen</button></div>`).join('')}`}</div>
  <div class="card"><h3 class="ct">Sportfest</h3>${a.fest===S.season?'<p class="meta">Das Sportfest hat diese Saison schon stattgefunden.</p>':`<p class="note" style="margin:-4px 0 8px">Einmal pro Saison. Bringt Geld und hebt die Stimmung – wenn das Wetter mitspielt.</p><div class="orow"><span><b>Kleines Sportfest</b><br><span class="meta">Kosten 300 € · wenig Risiko</span></span><button class="btn sm" data-act="amfest:k">Veranstalten</button></div><div class="orow"><span><b>Großes Sportfest</b> mit Turnier &amp; Festzelt<br><span class="meta">Kosten 1.500 € · bei Sonne viel Gewinn, bei Regen Verlust</span></span><button class="btn sm" data-act="amfest:g">Veranstalten</button></div>`}</div>
  <div class="card"><h3 class="ct">Ehrenamt</h3><p>${a.vol?`<b>${a.vol}</b> ${a.vol===1?'Helfer packt':'Helfer packen'} mit an und sparen dem Verein etwa ${money(a.vol*180)} pro Saison.`:'Noch keine festen Helfer.'}</p>${a.help===S.season?'<p class="meta">Der Aufruf lief diese Saison schon.</p>':'<p class="note" style="margin:-4px 0 8px">Einmal pro Saison. Je besser die Stimmung im Verein, desto mehr melden sich.</p><button class="btn" data-act="amhelp">Helfer-Aufruf starten</button>'}</div>`}
