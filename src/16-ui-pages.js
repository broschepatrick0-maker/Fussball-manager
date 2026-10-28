// ---------- Finanzen: Ansicht ----------
const sgn=v=>(v<0?'−':'')+money(Math.abs(Math.round(v)));
function invOf(z){return z&&z.own&&S.inv?S.inv[z.own]:null}
function ownerLabel(z){const i=invOf(z);return i?esc(i.n):'Mitgliederverein'}
function finPanel(id,own){
  const z=FZ(id);if(!z)return '';const b=finBalance(id),lg=lgOf(id),inv=invOf(z),h=z.h;
  const wfL=z.wf>=1.25?'hoch':z.wf<=.85?'gesenkt':'normal';
  const lim=creditLimit(id);
  let out=`<div class="card"><div class="hd"><h3 class="ct" style="margin:0">Finanzen</h3><span class="tag">${inv?'Investor':'Mitgliederverein'}</span></div>
  <div class="facts"><div><small>Kontostand</small><b class="${z.c<0?'no':''}">${sgn(z.c)}</b></div><div><small>Schulden</small><b class="${z.d>0?'no':''}">${z.d?money(z.d):'keine'}</b>${z.d?`<span class="meta">${(z.ir*100).toFixed(1).replace('.',',')} % Zinsen</span>`:''}</div>
  <div><small>Transferbudget</small><b>${money(spendable(id))}</b></div><div><small>Kreditrahmen</small><b>${money(lim)}</b></div>
  <div><small>Eigentümer</small><b style="font-size:15px">${ownerLabel(z)}</b>${inv?`<span class="meta">${esc(inv.k)} ${esc(inv.o)}</span>`:''}</div>
  <div><small>Stadion</small><b>${z.cap.toLocaleString('de-DE')}</b><span class="meta">Ø ${(h[0]?h[0][7]:b.att).toLocaleString('de-DE')} Zuschauer</span></div>
  <div><small>Gehaltsniveau</small><b>${wfL}</b><span class="meta">Faktor ${z.wf.toFixed(2).replace('.',',')}</span></div>
  ${z.ins.length?`<div><small>Insolvenzen</small><b class="no">${z.ins.length}×</b><span class="meta">zuletzt ${z.ins[0]}/${String(z.ins[0]+1).slice(2)}</span></div>`:''}</div></div>`;
  // Prognose
  const row=(n,v,neg)=>`<tr><td class="l">${n}</td><td class="${neg?'no':''}">${neg?'−':''}${money(Math.round(v))}</td></tr>`;
  out+=`<div class="grid2"><div class="card"><h3 class="ct">Prognose ${S.season}/${String(S.season+1).slice(2)}</h3><p class="note" style="margin:-4px 0 8px">Hochgerechnet auf die ganze Saison mit dem aktuellen Tabellenplatz${lg?' in der '+esc(lg.name):''}. Abgerechnet wird am Saisonende.</p>
   <table class="fint"><tbody><tr><th class="l" colspan="2">Einnahmen</th></tr>${Object.entries(b.inc).filter(([k,v])=>v>0).map(([k,v])=>row(INC_N[k],v)).join('')}${inv?row('Kapitalspritze Investor (geplant)',(lg&&lg.level>inv.amb?inv.w:inv.w*.5)):''}
   <tr><th class="l" colspan="2">Ausgaben</th></tr>${Object.entries(b.exp).filter(([k,v])=>v>0).map(([k,v])=>row(EXP_N[k],v,true)).join('')}
   <tr class="hl"><td class="l"><b>Ergebnis</b></td><td><b class="${b.res<0?'no':'ok'}">${b.res>=0?'+':''}${sgn(b.res)}</b></td></tr></tbody></table></div>`;
  out+=`<div class="card"><h3 class="ct">Verlauf</h3>${h.length?`<div class="scroll"><table><thead><tr><th class="l">Saison</th><th>Stufe</th><th>Umsatz</th><th>Ergebnis</th><th>Konto</th><th>Schulden</th></tr></thead><tbody>${h.map(x=>`<tr><td class="l">${x[0]}/${String(x[0]+1).slice(2)}</td><td>${x[6]}</td><td>${money(x[1])}</td><td class="${x[3]<0?'no':'ok'}">${x[3]>=0?'+':''}${sgn(x[3])}</td><td>${sgn(x[4])}</td><td>${x[5]?money(x[5]):'–'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Die erste Saisonbilanz gibt es nach dem Saisonende.</div>'}</div></div>`;
  if(own){
    const rev=(h[0]?h[0][1]:b.rev)||1,offer=S.invOffer&&S.inv&&S.inv[S.invOffer.inv];
    const amts=[.1,.25,.5].map(f=>Math.round(rev*f/1e4)*1e4).filter(a=>a>0);
    out+=`<div class="card"><h3 class="ct">Kredite & Investoren</h3>
     <p class="note">Die Vereinsführung regelt alles selbst: Sie nimmt Kredite auf, wenn das Geld knapp wird, tilgt jedes Jahr mindestens 12 % der Schulden und passt das Gehaltsniveau an. Reicht der Kreditrahmen nicht, folgen Notverkäufe und im schlimmsten Fall die Insolvenz (9 Punkte Abzug, ab der 5. Liga Zwangsabstieg). Du kannst jederzeit eingreifen.</p>
     <div class="orow"><span><b>Kredit aufnehmen</b> <span class="meta">Rahmen ${money(lim)} · Zins steigt mit der Verschuldung</span></span><span class="ctrls">${amts.map(a=>`<button class="btn sm" data-act="loan:${a}"${a>lim?' disabled':''}>${money(a)}</button>`).join('')}</span></div>
     ${z.d?`<div class="orow"><span><b>Schulden tilgen</b> <span class="meta">Offen ${money(z.d)}</span></span><span class="ctrls">${[Math.round(z.d/4/1e3)*1e3,z.d].map((a,i)=>`<button class="btn sm" data-act="repay:${a}"${a>z.c?' disabled':''}>${i?'Alles':money(a)}</button>`).join('')}</span></div>`:''}
     ${offer?`<div class="orow offer"><span><b>${esc(offer.n)}</b> (${esc(offer.k)} ${esc(offer.o)}) möchte einsteigen: Schuldenablöse bis ${money(offer.w*1.5)}, danach bis zu ${money(offer.w)} pro Saison. Ziel: ${LEVELS[offer.amb]||offer.amb+'. Liga'}. Verfehlt der Verein das Ziel lange, steigt der Investor wieder aus und fordert einen Teil zurück.</span><span class="ctrls"><button class="btn sm pri" data-act="invacc">Annehmen</button><button class="btn sm" data-act="invdec">Ablehnen</button></span></div>`:''}
     ${inv?`<div class="orow"><span><b>${esc(inv.n)}</b> ist seit ${inv.since}/${String(inv.since+1).slice(2)} an Bord · bisher ${money(inv.put)} investiert · Ziel ${LEVELS[inv.amb]||inv.amb+'. Liga'}</span><span class="ctrls"><button class="btn sm" data-act="invkick">Trennung</button></span></div>`:''}</div>`;
  }
  const ev=(S.flog||[]).filter(x=>x.id===id).slice(0,12);
  if(ev.length) out+=`<div class="card"><h3 class="ct">Finanz-Chronik</h3><div class="log">${ev.map(x=>`<div><b>${x.s}/${String(x.s+1).slice(2)}</b> · ${esc(x.txt)}</div>`).join('')}</div></div>`;
  return out;
}
function renderFinance(){
  const lv=view.finLv||'';
  const rows=[];S.leagues.forEach(l=>{const k=l.foreign?'F':String(l.level);if(lv&&k!==lv)return;l.teams.forEach(id=>{const z=T(id).fz;if(z)rows.push({id,z,l,h:z.h[0]})})});
  const list=(title,arr,fmt)=>`<div class="card"><h3 class="ct">${title}</h3>${arr.length?`<ol class="rank">${arr.slice(0,10).map((x,i)=>`<li><span class="rk">${i+1}</span>${tl(x.id)}<b>${fmt(x)}</b></li>`).join('')}</ol>`:'<div class="empty">Noch keine Daten – schließe die erste Saison ab.</div>'}</div>`;
  const withH=rows.filter(r=>r.h);
  const opts=[['','Alle Ligen'],['1','1. Liga'],['2','2. Liga'],['3','3. Liga'],['4','Regionalliga'],['5','Oberliga'],['6','6. Liga'],['7','7. Liga'],['8','8. Liga'],['F','Top-Ligen Europa']];
  const ev=(S.flog||[]).filter(x=>x.t==='ins'||x.t==='inv'||x.t==='out').slice(0,30);
  const totD=rows.reduce((a,r)=>a+r.z.d,0),totI=rows.filter(r=>r.z.own).length;
  return `<div class="card"><div class="hd"><div><div class="meta">Alle Vereine mit eigener Liga</div><h2>Finanzen</h2></div><label class="meta">Liga <select id="finLv" class="search" style="width:auto;margin-left:6px">${opts.map(([k,t])=>`<option value="${k}"${k===lv?' selected':''}>${t}</option>`).join('')}</select></label></div>
   <div class="facts"><div><small>Vereine</small><b>${rows.length}</b></div><div><small>Mit Schulden</small><b>${rows.filter(r=>r.z.d>0).length}</b></div><div><small>Schulden gesamt</small><b>${money(totD)}</b></div><div><small>Mit Investor</small><b>${totI}</b></div><div><small>Insolvenzen gesamt</small><b>${(S.flog||[]).filter(x=>x.t==='ins').length}</b></div></div></div>
  <div class="halls">
   ${list('Höchster Umsatz',withH.slice().sort((a,b)=>b.h[1]-a.h[1]),x=>money(x.h[1]))}
   ${list('Meistes Geld auf dem Konto',rows.slice().sort((a,b)=>b.z.c-a.z.c),x=>sgn(x.z.c))}
   ${list('Höchste Schulden',rows.filter(r=>r.z.d>0).sort((a,b)=>b.z.d-a.z.d),x=>money(x.z.d))}
   ${list('Größter Gewinn letzte Saison',withH.slice().sort((a,b)=>b.h[3]-a.h[3]),x=>'+'+money(Math.max(0,x.h[3])))}
   ${list('Größter Verlust letzte Saison',withH.filter(r=>r.h[3]<0).sort((a,b)=>a.h[3]-b.h[3]),x=>sgn(x.h[3]))}
   ${list('Investoren-Vereine',rows.filter(r=>r.z.own&&invOf(r.z)).sort((a,b)=>invOf(b.z).put-invOf(a.z).put),x=>`${money(invOf(x.z).put)} <small>${esc(invOf(x.z).n)}</small>`)}
   ${list('Größte Stadien',rows.slice().sort((a,b)=>b.z.cap-a.z.cap),x=>x.z.cap.toLocaleString('de-DE'))}
  </div>
  <div class="card"><h3 class="ct">Übernahmen, Ausstiege & Insolvenzen</h3>${ev.length?`<div class="log">${ev.map(x=>`<div><b>${x.s}/${String(x.s+1).slice(2)}</b> · ${esc(x.txt)}</div>`).join('')}</div>`:'<div class="empty">Bisher ruhig – Ereignisse gibt es am Saisonende.</div>'}</div>`;
}

function clubTransfers(id){
  const l=(S.tr||[]).filter(x=>x.from===id||x.to===id).slice(0,40);
  const inn=l.filter(x=>x.to===id).reduce((a,x)=>a+x.fee,0),out=l.filter(x=>x.from===id).reduce((a,x)=>a+x.fee,0);
  return `<div class="card"><div class="hd"><h3 class="ct" style="margin:0">Transfers</h3><span class="tag">Bilanz ${out-inn>=0?'+':'−'}${money(Math.abs(out-inn))}</span></div>${l.length?`<div class="scroll"><table><tbody>${l.map(x=>`<tr><td class="l meta">${x.s}/${String(x.s+1).slice(2)}</td><td class="l"><span class="pos-${x.p}">${x.p}</span></td><td class="l team">${esc(x.n)}</td><td class="l team">${x.to===id?'← '+tl(x.from):'→ '+tl(x.to)}</td><td class="${x.to===id?'no':'ok'}">${x.free?'ablösefrei':(x.to===id?'−':'+')+money(x.fee)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Noch keine Transfers.</div>'}</div>`;
}
function renderTransfers(){
  const all=S.tr||[],f=view.trf||{};
  const seasons=[...new Set(all.map(x=>x.s))];
  const lgs=[...new Set(all.flatMap(x=>[x.fl,x.tl]))].sort((a,b)=>{const la=S.leagues.find(l=>l.name===a),lb=S.leagues.find(l=>l.name===b);return ((la?la.level+(la.foreign?.5:0):9)-(lb?lb.level+(lb.foreign?.5:0):9))||a.localeCompare(b)});
  const q=(f.q||'').toLowerCase();
  let l=all.filter(x=>(!f.s||x.s===+f.s)&&(!f.lg||x.fl===f.lg||x.tl===f.lg)&&(!f.p||x.p===f.p)&&(f.t!=='paid'||!x.free)&&(f.t!=='free'||x.free)&&(!f.min||x.fee>=+f.min)&&(!q||x.n.toLowerCase().includes(q)||(T(x.from)&&T(x.from).name.toLowerCase().includes(q))||(T(x.to)&&T(x.to).name.toLowerCase().includes(q))));
  if(f.sort==='fee') l=l.slice().sort((a,b)=>b.fee-a.fee);
  const vol=l.reduce((a,x)=>a+x.fee,0),paid=l.filter(x=>!x.free),rec=paid.slice().sort((a,b)=>b.fee-a.fee)[0];
  const agg=(key)=>{const m={};l.forEach(x=>{m[x[key]]=(m[x[key]]||0)+x.fee});return Object.entries(m).filter(([id,v])=>v>0&&T(id)).sort((a,b)=>b[1]-a[1]).slice(0,8)};
  const spend=agg('to'),earn=agg('from');
  const pg=view.trpage||0,per=60,page=l.slice(pg*per,pg*per+per);
  const sel=(id,label,opts,cur)=>`<label for="${id}">${label}<select id="${id}">${opts.map(([v,t])=>`<option value="${esc(v)}"${String(cur??'')===String(v)?' selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
  return `<div class="card"><div class="hd"><div><div class="meta">Alle Wechsel seit Simulationsstart · Vereine kaufen und verkaufen selbstständig</div><h2>Transfers</h2></div><span class="tag">${windowOpen()?'Transferfenster offen':'Transferfenster geschlossen'}</span></div>
  <div class="form">
    <label for="trQ">Spieler oder Verein<input id="trQ" value="${esc(f.q||'')}" placeholder="z. B. Bayern"></label>
    ${sel('trS','Saison',[['','Alle'],...seasons.map(x=>[x,x+'/'+String(x+1).slice(2)])],f.s)}
    ${sel('trL','Liga (abgebend oder aufnehmend)',[['','Alle'],...lgs.map(x=>[x,x])],f.lg)}
    ${sel('trP','Position',[['','Alle'],...POS.map(x=>[x,POSN[x]])],f.p)}
    ${sel('trT','Art',[['','Alle'],['paid','Mit Ablöse'],['free','Ablösefrei']],f.t)}
    ${sel('trM','Ablöse ab',[['','Egal'],['100000','100 Tsd. €'],['1000000','1 Mio. €'],['10000000','10 Mio. €'],['50000000','50 Mio. €']],f.min)}
    ${sel('trO','Sortierung',[['','Neueste zuerst'],['fee','Höchste Ablöse']],f.sort)}
  </div></div>
  <div class="stages">
    <div class="stage"><small>Transfers</small><b>${l.length}</b></div>
    <div class="stage"><small>Gesamtvolumen</small><b>${money(vol)}</b></div>
    <div class="stage"><small>Ø Ablöse</small><b>${paid.length?money(Math.round(vol/paid.length)):'–'}</b></div>
    <div class="stage"><small>Rekordtransfer</small><b>${rec?`${esc(rec.n)} · ${money(rec.fee)}`:'–'}</b></div>
  </div>
  <div class="grid2"><div class="card"><h3 class="ct">Höchste Ausgaben</h3><ol class="rank">${spend.map(([id,v],i)=>`<li><span class="rk">${i+1}</span>${tl(id)}<b>${money(v)}</b></li>`).join('')||'<div class="empty">–</div>'}</ol></div>
  <div class="card"><h3 class="ct">Höchste Einnahmen</h3><ol class="rank">${earn.map(([id,v],i)=>`<li><span class="rk">${i+1}</span>${tl(id)}<b>${money(v)}</b></li>`).join('')||'<div class="empty">–</div>'}</ol></div></div>
  <div class="card">${l.length?`<div class="scroll"><table><thead><tr><th class="l">Saison</th><th class="l">Pos.</th><th class="l">Spieler</th><th>Alter</th><th>Stärke</th><th class="l">Von</th><th class="l">Nach</th><th>Marktwert</th><th>Ablöse</th></tr></thead><tbody>
  ${page.map(x=>`<tr${x.to===S.fav||x.from===S.fav?' class="hl"':''}><td class="l meta">${x.s}/${String(x.s+1).slice(2)}${x.r?' · '+x.r+'.':''}</td><td class="l"><span class="pos-${x.p}">${x.p}</span></td><td class="l team">${esc(x.n)}</td><td>${x.a}</td><td>${x.st.toFixed(1)}</td><td class="l team">${T(x.from)?tl(x.from):'–'}<div class="meta">${esc(x.fl)}</div></td><td class="l team">${T(x.to)?tl(x.to):'–'}<div class="meta">${esc(x.tl)}</div></td><td class="meta">${money(x.mv)}</td><td><b>${x.free?'ablösefrei':money(x.fee)}</b></td></tr>`).join('')}
  </tbody></table></div><div class="md-nav" style="margin-top:10px;justify-content:center"><button class="btn" data-act="trpage:-1"${pg?'':' disabled'}>‹</button><b>Seite ${pg+1} von ${Math.max(1,Math.ceil(l.length/per))}</b><button class="btn" data-act="trpage:1"${(pg+1)*per<l.length?'':' disabled'}>›</button></div>`:'<div class="empty">Noch keine Transfers. Die Vereine handeln, sobald das Transferfenster offen ist: an den ersten vier Spieltagen, rund um die Winterpause und im Sommer beim Saisonwechsel.</div>'}</div>`;
}
function est(){try{navigator.storage.estimate().then(e=>{view.est=e;if(view.tab==='save')render()}).catch(()=>{})}catch(e){}}
function renderSave(){
  const sz=Math.round(JSON.stringify(S).length/1024),e=view.est;
  return `<div class="card"><div class="hd"><div><div class="meta">Speicher & Sicherung</div><h2>Spielstand sichern</h2></div><span class="tag">${storeMode==='idb'?'IndexedDB':'localStorage'}</span></div>
  <div class="facts"><div><small>Größe des Spielstands</small><b>${sz>1024?(sz/1024).toFixed(1).replace('.',',')+' MB':sz+' KB'}</b></div>
  <div><small>Verfügbarer Speicher</small><b>${e&&e.quota?(e.quota/1073741824>=1?(e.quota/1073741824).toFixed(1).replace('.',',')+' GB':Math.round(e.quota/1048576)+' MB'):'unbekannt'}</b></div>
  <div><small>Belegt</small><b>${e&&e.usage!=null?Math.round(e.usage/1048576)+' MB':'–'}</b></div>
  <div><small>Saison</small><b>${S.season}/${String(S.season+1).slice(2)} · ${dateLine()}</b></div></div>
  <p class="note" style="margin-top:12px">Der Spielstand wird automatisch nach jeder Aktion in diesem Browser gespeichert. Um ihn auf ein anderes Gerät mitzunehmen oder abzusichern, exportiere ihn als Datei oder Text und lade ihn dort wieder.</p></div>
  <div class="grid2"><div class="card"><h3 class="ct">Exportieren</h3><div class="ctrls"><button class="btn pri" data-act="exdl">Als Datei herunterladen</button><button class="btn" data-act="excp">In Zwischenablage kopieren</button></div>
  <p class="note" style="margin-top:8px">Das Herunterladen funktioniert in der eigenständigen App-Datei. Im Chat-Fenster nutze „Kopieren“.</p></div>
  <div class="card"><h3 class="ct">Importieren</h3><label class="btn" for="imFile" style="display:inline-block">Datei auswählen<input type="file" id="imFile" accept=".json,application/json" hidden></label>
  <p class="note" style="margin-top:8px">Oder den kopierten Text unten einfügen und „Laden“ tippen. Der aktuelle Spielstand wird dabei ersetzt.</p></div></div>
  <div class="card"><textarea id="exTxt" placeholder="Spielstand-Text hier einfügen …"></textarea><button class="btn pri" style="margin-top:8px" data-act="impt">Laden</button></div>`;
}
function renderCup(c){
  const sub=c.type==='dfb'?'Bundesweit · 64 Teilnehmer, Amateure mit Heimrecht':c.type==='lp'?`Landespokal · ${VB[c.vb]} · Sieger qualifiziert sich für den DFB-Pokal`:`Kreispokal · ${VB[c.vb]}`;
  let h=`<div class="card"><div class="hd"><div><div class="meta">${sub}</div><h2>${esc(c.name)}</h2></div><div><span class="tag">${c.teams.length} Teams</span> <span class="tag">${c.played}/${c.R} Runden</span> ${c.winner?'':`<button class="btn" data-act="cupnext:${c.id}">Nächste Runde spielen</button>`}</div></div>`;
  if(c.winner) h+=`<div class="champ"><span class="meta">Pokalsieger</span><b>${esc(T(c.winner).name)}</b></div>`;
  h+=`<div class="rounds">${c.rounds.map((rd,k)=>`<div class="rnd"><h4>${ROUNDN(c.R,k)}</h4><div class="matches">${rd.filter(m=>!m.bye).map(m=>matchRow(m,true,ctxC(c,k))).join('')}${rd.some(m=>m.bye)?`<div class="meta" style="padding-top:6px">Freilos: ${rd.filter(m=>m.bye).map(m=>esc(T(m.h).name)).join(', ')}</div>`:''}</div></div>`).reverse().join('')}</div>`;
  if(c.type==='lp') h+=`<p class="note" style="margin-top:14px">Teilnehmer: Drittligisten, Regionalligisten und alle Vereine aus Amateurligen, die du für ${VB[c.vb]} importiert hast. Zweitvertretungen sind ausgeschlossen.</p>`;
  return h+`</div>`;
}
function renderImport(){
  const pre=view.preview||[];
  return `<div class="card"><div class="hd"><div><div class="meta">Datenquelle fussball.de</div><h2>Liga importieren</h2></div></div>
  <ol class="steps">
    <li>Öffne auf <a href="https://www.fussball.de" target="_blank" rel="noopener">fussball.de</a> deine Staffel (Ligen → Verband → Spielklasse → Gebiet).</li>
    <li>Markiere die Tabelle von Platz 1 bis zum Letzten und kopiere sie.</li>
    <li>Füge sie unten ein. Platzierungen und Zahlen werden automatisch entfernt, doppelte Vereinsnamen zusammengeführt. Eine Liste mit einem Verein pro Zeile funktioniert auch.</li>
  </ol>
  <div class="form">
    <label for="iVb">Landesverband<select id="iVb">${Object.entries(VB).map(([k,v])=>`<option value="${k}"${view.ivb===k?' selected':''}>${v}</option>`).join('')}</select></label>
    <label for="iLv">Spielklasse<select id="iLv">${[5,6,7,8,9,10].map(l=>`<option value="${l}"${(view.ilv||8)==l?' selected':''}>${l}. Liga · ${LEVELS[l]}</option>`).join('')}</select></label>
    <label for="iName">Name der Staffel<input id="iName" placeholder="z. B. Kreisliga A Euskirchen" value="${esc(view.iname||'')}"></label>
    <label for="iKreis">Kreis (für den Kreispokal)<input id="iKreis" placeholder="z. B. Euskirchen" value="${esc(view.ikreis||'')}"></label>
  </div>
  <textarea id="iTxt" placeholder="1.  SV 07 Moringen  12  10  1  1  44 : 12  32  31&#10;2.  SG Rehbachtal  12  10  0  2  35 : 13  22  30&#10;…">${esc(view.itxt||'')}</textarea>
  <div class="ctrls" style="margin-top:10px"><button class="btn" data-act="ipreview">Vorschau</button><button class="btn pri" data-act="icreate">Liga anlegen</button></div>
  ${pre.length?`<div class="meta" style="margin-top:12px">${pre.length} Vereine erkannt</div><div class="chips">${pre.map(n=>`<span class="chip">${esc(n)}</span>`).join('')}</div>`:''}
  <p class="note" style="margin-top:16px">Neue Ligen spielen ab sofort mit. In Landes- und Kreispokal kommen sie, sobald die erste Runde noch nicht gespielt ist, sonst zur nächsten Saison. Am Saisonende steigt der Meister in die nächsthöhere importierte Liga seines Verbandes auf, ein Oberliga-Meister in die Regionalliga.</p></div>`;
}
function renderSeason(){
  const done=S.done;
  let h=`<div class="card"><div class="hd"><div><div class="meta">Saison ${S.season}/${String(S.season+1).slice(2)}</div><h2>Saisonbilanz</h2></div>${done?'<button class="btn pri" data-act="newseason">Neue Saison starten</button>':''}</div>`;
  const champs=S.leagues.filter(l=>l.played>0).sort((a,b)=>a.level-b.level).map(l=>{const t=table(l)[0];return `<div class="m" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)"><span>${esc(l.name)}</span><span class="w">${esc(T(t.id).name)} <span class="meta">${t.p} Pkt.</span></span></div>`});
  h+=`<h4 class="meta" style="margin:4px 0">${done?'Meister':'Tabellenführer'}</h4><div class="matches">${champs.join('')||'<div class="empty">Noch kein Spieltag gespielt.</div>'}</div>`;
  const cw=S.cups.filter(c=>c.winner);
  if(cw.length) h+=`<h4 class="meta" style="margin:16px 0 4px">Pokalsieger</h4><div class="matches">${cw.map(c=>`<div class="m" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)"><span>${esc(c.name)}</span><span class="w">${esc(T(c.winner).name)}</span></div>`).join('')}</div>`;
  h+=`</div>`;
  if(S.log.length){const i=Math.min(view.chron||0,S.log.length-1),e=S.log[i];
    h+=`<div class="card"><div class="hd"><h2 style="font-size:22px">Chronik ${e.season}/${String(e.season+1).slice(2)}</h2><div class="md-nav"><button class="btn" data-act="chron:1" aria-label="Ältere Saison"${i>=S.log.length-1?' disabled':''}>‹</button><select id="chronSel" class="search" style="width:auto">${S.log.map((x,k)=>`<option value="${k}"${k===i?' selected':''}>${x.season}/${String(x.season+1).slice(2)}</option>`).join('')}</select><button class="btn" data-act="chron:-1" aria-label="Neuere Saison"${i<=0?' disabled':''}>›</button></div></div><div class="log">${e.lines.map(l=>`<div>${esc(l)}</div>`).join('')}</div></div>`}
  return h;
}
function render(){
  MREF=[];
  if(S.day==null)ensureCalendar();
  {const d=Math.max(0,S.day+1);$('cSeason').innerHTML=S.done?`Saison ${S.season}/${String(S.season+1).slice(2)}`:`${fmtDay(d)}<span class="yr"> ${dayDate(d).getUTCFullYear()}</span>`}
  {const nf=S.done?null:nextFavDay(),w=nextOpen();$('cRound').textContent=S.done?'Saisonpause – alle Spiele gespielt':nf!=null?(nf===S.day+1?'Heute Spieltag':'Nächstes Spiel: '+fmtDay(nf)):w&&w.open?'Transferfenster offen':`Saison ${S.season}/${String(S.season+1).slice(2)}`}
  ['bNext','bTen','bAll'].forEach(b=>$(b).disabled=S.done);
  $('bNew').hidden=!S.done;
  renderTabs();
  let h='';
  if(view.tab==='league'&&L(view.id)) h=renderLeague(L(view.id));
  else if(view.tab==='cup'&&S.cups.find(c=>c.id===view.id)) h=renderCup(S.cups.find(c=>c.id===view.id));
  else if(view.tab==='import') h=renderImport();
  else if(view.tab==='hall') h=renderHall();
  else if(view.tab==='club') h=renderClub(view.id);
  else if(view.tab==='euro'&&(S.euro||[]).find(e=>e.id===view.id)) h=renderEuro(S.euro.find(e=>e.id===view.id));
  else if(view.tab==='season') h=renderSeason();
  else if(view.tab==='cal') h=renderCalendar();
  else if(view.tab==='fav') h=renderFav();
  else if(view.tab==='tr') h=renderTransfers();
  else if(view.tab==='fin') h=renderFinance();
  else if(view.tab==='news') h=renderNews();
  else if(view.tab==='save') h=renderSave();
  else h=renderHome();
  $('main').innerHTML=ctxBar()+(view.tab==='fav'?'':favStrip())+h;
  renderOverlay();
  document.querySelectorAll('[data-act]').forEach(b=>{if(!b.onclick)b.onclick=()=>act(b.dataset.act)});
  {const f=document.getElementById('imFile');if(f)f.onchange=()=>{const file=f.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{importJSON(r.result);view={tab:'home'};render();toast('Spielstand geladen')}catch(e){toast('Das ist kein gültiger Spielstand')}};r.readAsText(file)}}
  [['trS','s'],['trL','lg'],['trP','p'],['trT','t'],['trM','min'],['trO','sort']].forEach(([i,k])=>{const e=document.getElementById(i);if(e)e.onchange=()=>{view.trf={...(view.trf||{}),[k]:e.value};view.trpage=0;render()}});
  {const e=document.getElementById('trQ');if(e)e.onchange=()=>{view.trf={...(view.trf||{}),q:e.value};view.trpage=0;render()}}
  [['mLg','mlg'],['mPos','mpos'],['mMax','mmax']].forEach(([i,k])=>{const e=document.getElementById(i);if(e)e.onchange=()=>{view[k]=e.value;render()}});
  document.querySelectorAll('select[data-slot]').forEach(sel=>sel.onchange=()=>{const g=MG(),r=mgrXI();const xi=r.xi.slice(),i=+sel.dataset.slot,j=xi.indexOf(sel.value);if(j>=0&&j!==i)xi[j]=xi[i];xi[i]=sel.value;g.xi=xi;recalc(S.fav);save();render()});
  {const pl=document.getElementById('progLg');if(pl)pl.onchange=()=>{view.progLg=pl.value;render()}}
  {const fl=document.getElementById('finLv');if(fl)fl.onchange=()=>{view.finLv=fl.value;render()}}
  {const cs=document.getElementById('chronSel');if(cs)cs.onchange=()=>{view.chron=+cs.value;render()}}
  const hs=document.getElementById('hallLg'); if(hs) hs.onchange=()=>{view.hallLg=hs.value;render()};
  if(view.tab==='import'){['iVb','iLv','iName','iKreis','iTxt'].forEach(id=>$(id).oninput=readImport)}
}
function readImport(){view.ivb=$('iVb').value;view.ilv=+$('iLv').value;view.iname=$('iName').value;view.ikreis=$('iKreis').value;view.itxt=$('iTxt').value}
function act(a){
  const [k,v,w]=a.split(':');
  if(k==='ov'){view.ov={t:v};render();return}
  if(k==='menu'){openMenu();return}
  if(k==='cal'){view=S.fav&&T(S.fav)?{tab:'fav',ftab:'kal'}:{tab:'cal'};view.cm=null;render();return}
  if(k==='calm'){view.cm=+v===0?null:Math.max(0,Math.min(11,(view.cm??0)+ +v));render();return}
  if(view.ov&&view.ov.t==='menu'&&['mscr','mcont','mstart','mclub','mslot','mtheme','mspeed','mload','mdel','mgo'].includes(k)){menuAct(k,v);return}
  if(view.ov&&view.ov.t==='match'&&view.ov.rep&&view.ov.rep.dyn&&!view.ov.rep.done&&!['mpl','msp','mend','mrep','mtac','msub','mtalk','mcosub','club','fav'].includes(k)){dynFinish(view.ov);toast(`Abpfiff: ${T(view.ov.m.h).name} ${view.ov.m.hg}:${view.ov.m.ag}${view.ov.m.pen?' i.E.':view.ov.m.et?' n.V.':''} ${T(view.ov.m.a).name}`);view.ov.fresh=false;view.ov.playing=false}
  if(k==='ovx'){if(view.ov&&view.ov.t==='match'&&view.ov.fresh&&view.ov.playing)toast(`Endstand: ${T(view.ov.m.h).name} ${view.ov.m.hg}:${view.ov.m.ag} ${T(view.ov.m.a).name}`);view.ov=null;render();return}
  if(k==='mt'){openMatch(+v);render();return}
  if(view.ov&&view.ov.t==='match'){const o=view.ov;
    if(k==='mtac'){dynSetTac(o,v);paintMatch();return}
    if(k==='mtalk'){if(v==='skip')o.htTalk=false;else dynTalk(o,v);o.playing=true;paintMatch();liveRun();return}
    if(k==='mcosub'){o.rep.dyn.cosub=!o.rep.dyn.cosub;MG().cosub=o.rep.dyn.cosub;paintMatch();return}
    if(k==='msub'){const a=document.getElementById('subOut'),b=document.getElementById('subIn');if(a&&b&&dynSub(o.rep,o.rep.dyn.fav,a.value,b.value,o.rep.ticks[o.i]))toast('Wechsel vollzogen');paintMatch();return}
    if(k==='mpl'){o.htTalk=false;o.playing=!o.playing;if(o.playing&&o.i>=o.rep.ticks.length-1)o.i=0;paintMatch();liveRun();return}
    if(k==='msp'){o.speed=+v;S.liveSpeed=+v;paintMatch();liveRun();return}
    if(k==='mend'){if(o.rep.dyn&&!o.rep.done)dynFinish(o);o.i=o.rep.ticks.length-1;o.playing=false;clearInterval(LIVE.timer);LIVE.timer=null;paintMatch();if(o.fresh){o.fresh=false;toast(`Abpfiff: ${T(o.m.h).name} ${o.m.hg}:${o.m.ag} ${T(o.m.a).name}`)}return}
    if(k==='mrep'){o.i=0;o.playing=true;paintMatch();liveRun();return}}
  if(view.ov&&!['club','fav','sell','accept','decline','simport','md','emd','lmode','mt'].includes(k)) view.ov=null;
  if(k==='lg'){view={...view,tab:'league',id:v,md:null,team:w||null}}
  else if(k==='lmode'){view.lmode=v}
  else if(k==='area'){const first={news:{tab:'news'},home:{tab:'home'},fav:{tab:'fav',ftab:'ov'},tr:{tab:'tr'},de:{tab:'league',id:'bl',lmode:'cur'},eu:{tab:'euro',id:'ucl'},cups:{tab:'cup',id:'dfb'},hist:{tab:'hall'}}[v];view={...view,...first,area:v,md:null};window.scrollTo(0,0)}
  else if(k==='home'){view={...view,tab:'home'}}
  else if(k==='euro'){view={...view,tab:'euro',id:v,emd:null}}
  else if(k==='emd'){const e=S.euro.find(x=>x.id===view.id);const cur=view.emd??Math.max(0,Math.min(e.step,e.nmd)-1);view.emd=Math.max(0,Math.min(e.nmd-1,cur+ +v))}
  else if(k==='fav'&&isCareer()){toast('In der Karriere wechselst du den Verein über Jobangebote');return}
  else if(k==='fav'){const was=S.fav;S.fav=S.fav===v?null:v;if(S.fav!==was){S.fin={log:[],income:[]};S.invOffer=null;S.mgr=null;S.scout=null;if(S.fav){ensureSquad(S.fav);initBudget()}}save();toast(S.fav?T(v).name+' ist jetzt Mein Verein':'Beobachtung beendet')}
  else if(k==='ftab'){view={...view,tab:'fav',ftab:v,offer:null};window.scrollTo(0,0)}
  else if(k==='sell'){const p=P()[v];if(!p)return;if(!windowOpen()){toast('Das Transferfenster ist geschlossen');return}
    const lv=T(S.fav).lv||8,cands=Object.values(S.teams).filter(t=>t.id!==S.fav&&Math.abs((t.lv||9)-lv)<=1&&!t.cc===!T(S.fav).cc);
    const buyer=rnd(cands.length?cands:Object.values(S.teams).filter(t=>t.id!==S.fav));
    view.offer={pid:v,club:buyer.id,amt:Math.round(value(v)*(0.8+Math.random()*0.4)/1e3)*1e3}}
  else if(k==='accept'){const o=view.offer;if(!o)return;const f=T(S.fav);
    if(f.sq.length<=16){toast('Mindestens 16 Spieler müssen im Kader bleiben');return}
    f.sq=f.sq.filter(x=>x!==o.pid);ensureSquad(o.club).push(o.pid);addBud(S.fav,o.amt);addBud(o.club,-o.amt);
    transferLog({pid:o.pid,n:P()[o.pid].n,from:S.fav,to:o.club,fee:o.amt,out:true});recalc(S.fav);recalc(o.club);view.offer=null;save();toast('Verkauft für '+money(o.amt))}
  else if(k==='decline'){view.offer=null}
  else if(k==='savev'){view={...view,tab:'save'};est()}
  else if(k==='exdl'){try{const b=new Blob([exportJSON()],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`fussball-pyramide-${S.season}-${S.day}.json`;document.body.appendChild(a);a.click();a.remove();toast('Datei wird gespeichert')}catch(e){toast('Download nicht möglich – nutze „Kopieren“')}return}
  else if(k==='excp'){const t=exportJSON();navigator.clipboard.writeText(t).then(()=>toast('Spielstand kopiert ('+Math.round(t.length/1024)+' KB)')).catch(()=>{const ta=$('exTxt');ta.value=t;ta.select();toast('Text markiert – jetzt kopieren')});return}
  else if(k==='impt'){try{importJSON($('exTxt').value);view={tab:'home'};toast('Spielstand geladen')}catch(e){toast('Das ist kein gültiger Spielstand')}}
  else if(k==='auto'){FV().auto=!favAuto();save();toast(favAuto()?'Die Vereinsführung handelt jetzt selbst':'Nur noch du tätigst Transfers')}
  else if(k==='oacc'||k==='odec'){const o=(S.offers||[])[+v];if(!o)return;S.offers.splice(+v,1);
    if(k==='oacc'){const f=T(S.fav);if(!f.sq.includes(o.pid)){toast('Der Spieler ist nicht mehr im Kader');render();return}
      if(f.sq.length<=16){toast('Mindestens 16 Spieler müssen im Kader bleiben');return}
      f.sq=f.sq.filter(x=>x!==o.pid);ensureSquad(o.club).push(o.pid);addBud(S.fav,o.amt);addBud(o.club,-o.amt);
      transferLog({pid:o.pid,n:P()[o.pid].n,from:S.fav,to:o.club,fee:o.amt,out:true});recalc(S.fav);recalc(o.club);toast('Verkauft für '+money(o.amt))}
    save()}
  else if(k==='finv'){view={...view,tab:'fin'}}
  else if(k==='jobacc'){const o=S.career&&S.career.offers[+v];if(o){takeJob(o.club);view={...view,tab:'fav',ftab:'karriere',ov:null};save();toast(`Willkommen bei ${T(o.club).name}!`)}}
  else if(k==='course'){const r=startCourse();toast(r==='ok'?'Lehrgang begonnen':r);save()}
  else if(k==='apply'){const r=applyJob(v);if(r==='ok'){view={...view,tab:'fav',ftab:'karriere',ov:null};toast(`Zusage! Du bist neuer Trainer von ${T(v).name}`)}else toast(r==='nein'?`${T(v).name} hat sich für einen anderen Kandidaten entschieden`:r==='lizenz'?'Dafür fehlt dir die Lizenz':'Du hast dich dort schon beworben');save()}
  else if(k==='jobdec'){if(S.career)S.career.offers.splice(+v,1);save()}
  else if(k==='acadlv'){AC().lv=+v;save();toast(ACAD[+v].n+' – Kosten werden am Saisonende verbucht')}
  else if(k==='ypro'){const a=AC(),t=T(S.fav);if(t.sq.length>=30){toast('Der Kader ist voll (30 Spieler)');return}a.intake=a.intake.filter(x=>x!==v);t.sq.push(v);setContract(v,S.fav,3);P()[v].w=Math.round(P()[v].w*.6/100)*100;recalc(S.fav);save();toast(P()[v].n+' gehört jetzt zum Profikader')}
  else if(k==='yrel'){const a=AC();a.intake=a.intake.filter(x=>x!==v);delete P()[v];save()}
  else if(k==='mform'){setTactic('form',v);save()}
  else if(k==='mstyle'){setTactic('style',v);save()}
  else if(k==='mtrain'){MG().train=v;save()}
  else if(k==='mti'){MG().ti=+v;save()}
  else if(k==='talk'){if(!S.mgr)MG();view.ov={t:'talk',pid:v}}
  else if(k==='talk2'){const msg=talkTo(v,w);recalc(S.fav);save();if(msg)toast(msg)}
  else if(k==='talkans'){const msg=answerTalk(+v,w);recalc(S.fav);save();if(msg)toast(msg)}
  else if(k==='mrot'){MG().rot=!rotOn();recalc(S.fav);save();toast(rotOn()?'Der Co-Trainer rotiert jetzt automatisch':'Automatische Rotation aus')}
  else if(k==='mrott'){MG().rotT=+v;recalc(S.fav);save()}
  else if(k==='mbest'){bestXI();recalc(S.fav);save();toast('Beste Elf aufgestellt')}
  else if(k==='watch'){const r=scoutAdd(v);toast(r==='ok'?'Spieler wird jetzt beobachtet':r==='voll'?'Die Beobachtungsliste ist voll – Scouting-Abteilung ausbauen oder Spieler entfernen':'Wird schon beobachtet');save()}
  else if(k==='unwatch'){if(S.scout)delete S.scout.list[v];save()}
  else if(k==='scoutlv'){SC().lv=+v;const mx=SCOUT_LV[+v].max,ks=Object.keys(S.scout.list);ks.slice(mx).forEach(x=>delete S.scout.list[x]);save();toast(SCOUT_LV[+v].n+' – Kosten werden am Saisonende verbucht')}
  else if(k==='renew'){const p=P()[v];const o=renewalOffer(v);if(!p||!o)return;const y=Math.min(+w,o.maxY);p.c=S.season+y;p.w=o.w;T(S.fav).mo=Math.min(100,(T(S.fav).mo??60)+1);save();toast(`${p.n} verlängert bis ${p.c}/${String(p.c+1).slice(2)} · ${money(o.w)} pro Jahr`)}
  else if(k==='nf'){view={...view,tab:'news',nf:v||'',npage:1}}
  else if(k==='nmore'){view.npage=(view.npage||1)+1}
  else if(k==='loan'){const got=takeLoan(S.fav,+v);if(got){finLog('pos',S.fav,`${T(S.fav).name}: Kredit über ${money(got)} aufgenommen`);save();toast('Kredit aufgenommen: '+money(got))}else toast('Der Kreditrahmen ist ausgeschöpft')}
  else if(k==='repay'){const z=FZ(S.fav),a=Math.min(+v,z.d,Math.max(0,z.c));if(a<=0){toast('Nicht genug Geld auf dem Konto');return}z.c-=a;z.d-=a;if(z.d<1e3){z.d=0;z.ir=0}save();toast(money(a)+' getilgt')}
  else if(k==='invacc'){const o=S.invOffer&&S.inv[S.invOffer.inv];if(o){const L_=[];takeover(S.fav,o,L_);S.invOffer=null;save();toast(o.n+' steigt ein')}}
  else if(k==='invdec'){S.invOffer=null;save();toast('Angebot abgelehnt')}
  else if(k==='invkick'){const z=FZ(S.fav),i=invOf(z);if(i){investorLeaves(S.fav,i,'Trennung durch den Verein');save();toast('Investor ausgestiegen')}}
  else if(k==='trf'){view.trf={...(view.trf||{}),...JSON.parse(decodeURIComponent(v))};view.tab='tr';view.trpage=0}
  else if(k==='trpage'){view.trpage=Math.max(0,(view.trpage||0)+ +v)}
  else if(k==='buy'){const [pid,from]=[v,w];const p=P()[pid];if(!p)return;const f=T(S.fav);
    if(!windowOpen()){toast('Das Transferfenster ist geschlossen');return}
    const fee=Math.round(value(pid)*1.25/1e3)*1e3;
    if(fee>bud(S.fav)){toast('Das Budget reicht nicht: '+money(fee)+' nötig');return}
    if(f.sq.length>=30){toast('Der Kader ist voll (30 Spieler)');return}
    if((f.lv||9)>(T(from).lv||9)+2&&p.s>f.r+8){toast(p.n+' will nicht in eine so tiefe Liga wechseln');return}
    const src=T(from);src.sq=src.sq.filter(x=>x!==pid);f.sq.push(pid);addBud(S.fav,-fee);addBud(from,fee);
    if(src.sq.filter(x=>P()[x].p===p.p).length<2)src.sq.push(newPlayer(src,p.p,src.r-6,18));
    transferLog({pid,n:p.n,from,to:S.fav,fee});recalc(S.fav);recalc(from);save();toast(p.n+' verpflichtet für '+money(fee))}
  else if(k==='simport'){const ta=$('sqTxt');const list=parseSquad(ta?ta.value:'');if(list.length<11){toast('Mindestens 11 Spieler nötig – Kaderliste einfügen');return}
    const t=T(view.sqTeam||S.fav),old=t.r;(t.sq||[]).forEach(pid=>delete P()[pid]);
    t.sq=list.map((x,i)=>{const id='p'+(S.next++);P()[id]={n:x.n,p:x.p,a:x.a||24,s:+(old-2+gauss()*3-(i%8)*0.3).toFixed(1),real:true};return id});
    const d=old-xi(t.sq);t.sq.forEach(pid=>P()[pid].s=+(P()[pid].s+d).toFixed(1));recalc(t.id);save();toast(list.length+' echte Spieler übernommen')}
  else if(k==='ewig'){view={...view,tab:'league',id:v,md:null,lmode:'ewig'}}
  else if(k==='hall'){view={...view,tab:'hall'}}
  else if(k==='club'){view.ov={t:'club',id:v,top:true}}
  else if(k==='clubpage'){view={...view,tab:'club',id:v,ov:null};window.scrollTo(0,0)}
  else if(k==='cup'){view={...view,tab:'cup',id:v}}
  else if(k==='import'){view={...view,tab:'import'}}
  else if(k==='season'){view={...view,tab:'season',chron:0}}
  else if(k==='chron'){view.chron=Math.max(0,Math.min(S.log.length-1,(view.chron||0)+ +v))}
  else if(k==='md'){const lg=L(view.id);view.md=Math.max(0,Math.min(lg.rounds.length-1,view.md+ +v))}
  else if(k==='cupnext'){const c=S.cups.find(c=>c.id===v);if(c&&!c.winner)playCupRound(c);save()}
  else if(k==='newseason'){newSeason();save();toast('Neue Saison gestartet')}
  else if(k==='ipreview'){readImport();view.preview=parseTable(view.itxt||'')}
  else if(k==='icreate'){
    readImport();const names=parseTable(view.itxt||'');
    if(names.length<4){toast('Mindestens 4 Vereine nötig – Tabelle einfügen und Vorschau prüfen');return}
    const lv=view.ilv||8,name=(view.iname||'').trim()||`${LEVELS[lv]} ${VB[view.ivb||'BA']}`;
    const lg=addAmateurLeague(name,view.ivb||'BA',lv,(view.ikreis||'').trim(),names,true);
    lg.rounds=schedule(lg.teams);lg.played=0;lg.teams.forEach(id=>T(id).lv=lg.level);
    if(S.cups.every(c=>c.played===0)) buildCups();
    else{ // nur noch ungespielte Amateurpokale neu auslosen
      const keep=S.cups.filter(c=>c.played>0||c.type==='dfb');const old=S.cups;buildCups();
      S.cups=S.cups.map(c=>keep.find(k=>k.id===c.id)||c);
    }
    view={tab:'league',id:lg.id,md:null};save();toast(`${names.length} Vereine importiert`);
  }
  else if(k==='del'){S.leagues=S.leagues.filter(l=>l.id!==v);if(S.cups.every(c=>c.played===0))buildCups();view={tab:'league',id:'bl',md:null};save()}
  else if(k==='reset'){if(view.confirmReset){fresh();view={tab:'league',id:'bl',md:null};save();toast('Neuer Spielstand')}else{view.confirmReset=true;toast('Zum Zurücksetzen nochmal klicken');setTimeout(()=>view.confirmReset=false,3000);return}}
  else return;
  render();
}
// Weiter: bis einschließlich zum nächsten Spieltag von Mein Verein (ohne Verein: bis zum nächsten Spielwochenende)
function advance(mode,quiet){const before=(S.tr||[]).length;let g=0;
  if(mode==='week'){for(let i=0;i<7&&!S.done;i++)simDay()}
  else if(mode==='all'){while(!S.done&&g++<400)simDay()}
  else{// Spieltag spielen (falls heute einer ist), dann bis zum Vortag des nächsten Spiels vorspulen
    const has=()=>S.fav&&lgOf(S.fav)?favPlaysOn(S.day+1):anyMatchOn(S.day+1,true);
    if(has()){do{simDay()}while(!S.done&&!(S.fav&&lgOf(S.fav))&&has()&&g++<10)}
    else simDay();
    while(!S.done&&!has()&&g++<400){simDay();if(isCareer()&&S.career.jobless&&S.career.offers.length>(advance.no||0))break}
    advance.no=isCareer()?S.career.offers.length:0}
  if(!quiet)finishSim(before)}
// n-mal „Weiter“ (entspricht etwa n Spieltagen)
function sim(n){const before=(S.tr||[]).length;for(let i=0;i<n&&!S.done;i++)advance('next',true);finishSim(before)}
function finishSim(before){
  if(S.fav){const nw=(S.tr||[]).slice(0,(S.tr||[]).length-before).filter(x=>x.from===S.fav||x.to===S.fav);if(nw.length)setTimeout(()=>toast(`${T(S.fav).name}: ${nw.length} neue${nw.length===1?'r':''} Transfer${nw.length===1?'':'s'}`),60)}view.md=null;view.emd=null;save();render()}
$('bNext').onclick=()=>advance('next');
$('bTen').onclick=()=>advance('week');
$('bAll').onclick=()=>{advance('all');view={...view,tab:'season'};render();toast('Saison beendet')};
$('bNew').onclick=()=>act('newseason');
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&view.ov){view.ov=null;render()}else if((e.key==='/'||(e.key==='k'&&(e.metaKey||e.ctrlKey)))&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();act('ov:search')}});
function migrateLoaded(){
  try{if(ensureCalendar())setTimeout(()=>toast('Neu: Kalender mit echten Terminen'),600)}catch(e){console.warn(e)}
  { const o=S.leagues.find(l=>l.name==='Kreisliga München'); if(o) o.name='Kreisliga München 1'; }
  let added=false;
  for(const p of PRESETS) if(!S.leagues.some(l=>l.name===p.name)){
    const lg=addAmateurLeague(p.name,p.vb,p.level,p.kreis,p.teams,true);
    lg.rounds=schedule(lg.teams);lg.played=0;lg.teams.forEach(id=>T(id).lv=lg.level);added=true;
  }
  for(const p of PRESETS){
    const lg=S.leagues.find(l=>l.name===p.name); if(!lg) continue;
    const have=new Set(Object.values(S.teams).map(t=>t.name));
    const miss=p.teams.map(n=>n.split('|')).filter(([n])=>!have.has(n));
    if(!miss.length) continue;
    miss.forEach(([n,v])=>{const id=addTeam(n,v||p.vb,(BASE[p.level]||30)-2);T(id).lv=lg.level;lg.teams.push(id)});
    lg.rounds=schedule(lg.teams);lg.played=0;added=true;
  }
  if(S.pl){Object.values(S.pl).forEach(p=>p.s=+clampS(p.s).toFixed(1));Object.values(S.teams).forEach(t=>{if(t.sq)recalc(t.id);if(t.bud!=null)t.bud=Math.min(t.bud,1.5e9)});
    (S.tr||[]).forEach(x=>{x.fee=Math.min(x.fee,2.2e8);x.mv=Math.min(x.mv,1.8e8);x.st=Math.min(x.st,99)});added=true}
  { // Reparatur: aufgeblähte Ligen (doppelt angelegte Vereine) bereinigen und Saison neu ansetzen
    const removed=dedupeLeagues();
    if(removed){startSeason();added=true;setTimeout(()=>toast(`${removed} doppelte Vereine entfernt – die laufende Saison startet neu`),400)}
  }
  if(!S.pool){addForeign();if(S.cups.every(c=>c.played===0)) buildCups();buildEuro();added=true}
  if(added){
    if(S.cups.every(c=>c.played===0)) buildCups();
    else{const keep=S.cups.filter(c=>c.played>0||c.type==='dfb');buildCups();S.cups=S.cups.map(c=>keep.find(k=>k.id===c.id)||c)}
    save();
  }
}
async function boot(){
$('main').innerHTML='<div class="card empty">Spielstand wird geladen …</div>';
applyTheme();
if(!(await loadAsync())) {fresh();S.mode='free';save()}
else migrateLoaded();
render();
if(!navigator.webdriver)openMenu();
}
boot();
