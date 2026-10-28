// ---------- Ansicht ----------
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function toast(t){const e=$('toast');e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,2200)}
function zone(lg,i,n){
  const L1=lg.level;
  if(lg.foreign) return i<4?'cl':i<6?'el':i<8?'ecl':'';
  if(L1===1) return i<4?'cl':i<6?'el':i<8?'ecl':i===15?'rel':i>=16?'down':'';
  if(L1===2) return i<2?'up':i===2||i===15?'rel':i>=16?'down':'';
  if(L1===3) return i<2?'up':i===2?'rel':i>=n-4?'down':'';
  if(L1===4) return i===0?'up':i>=n-(n-16)-2?'down':'';
  return i===0?'up':i===n-1?'down':'';
}
function legend(lg){
  const eu=[['cl','Champions League'],['el','Europa League'],['ecl','Conference League']];
  if(lg.foreign) return `<div class="legend">${eu.map(([k,t])=>`<span><i style="background:var(--${k})"></i>${t}</span>`).join('')}<span>Ohne Auf- und Abstieg</span></div>`;
  const z={1:[...eu,['rel','Relegation'],['down','Abstieg']],2:[['up','Aufstieg'],['rel','Relegation'],['down','Abstieg']],3:[['up','Aufstieg'],['rel','Relegation'],['down','Abstieg']],4:[['up','Meister (Aufstieg/Aufstiegsspiele)'],['down','Abstiegszone']]}[lg.level]||[['up','Aufstieg'],['down','Abstieg']];
  return `<div class="legend">${z.map(([k,t])=>`<span><i style="background:var(--${k})"></i>${t}</span>`).join('')}</div>`;
}
function navBtn(on,label,count,act,lv){return `<button class="nav-i${on?' on':''}" data-act="${act}"><span>${lv?`<span class="lv">${lv}</span>`:''}${esc(label)}</span>${count!=null?`<em>${count}</em>`:''}</button>`}
const AREAS=[['home','Übersicht','Start'],['news','News & Prognosen','News'],['fav','Mein Verein','Verein'],['de','Deutschland','Ligen'],['eu','Europa','Europa'],['cups','Pokale','Pokale'],['tr','Transfers & Finanzen','Markt'],['hist','Historie','Historie']];
const ICO={news:'<path d="M5 5h11v14H6.5A1.5 1.5 0 0 1 5 17.5z"/><path d="M16 9h3v8.5a1.5 1.5 0 0 1-3 0M8 9h5M8 12h5M8 15h3"/>',home:'<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',fav:'<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z"/>',de:'<path d="M12 3.5l8.5 16.5h-17z"/><path d="M8 12h8M5.8 16.2h12.4"/>',eu:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c3 3.2 3 13.8 0 17M12 3.5c-3 3.2-3 13.8 0 17"/>',cups:'<path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/>',tr:'<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/>',hist:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/>'};
const svg=(d,c='')=>`<svg viewBox="0 0 24 24"${c?` class="${c}"`:''} aria-hidden="true">${d}</svg>`;
const CHEV='<path d="M6 9l6 6 6-6"/>';
const AREA_T=k=>(AREAS.find(a=>a[0]===k)||[0,''])[1];
function areaOf(v){
  if(v.tab==='home') return 'home';
  if(v.tab==='news') return 'news';
  if(v.tab==='fav') return 'fav';
  if(v.tab==='tr'||v.tab==='fin') return 'tr';
  if(v.tab==='league'){const l=L(v.id);return l&&l.foreign?'eu':'de'}
  if(v.tab==='euro') return 'eu';
  if(v.tab==='cup') return 'cups';
  if(v.tab==='hall'||v.tab==='season'||v.tab==='save') return 'hist';
  if(v.tab==='import') return 'de';
  return v.area||'home';
}
function renderTabs(){
  const a=view.area=areaOf(view);
  $('areas').innerHTML=AREAS.map(([k,t,sh])=>`<button class="${a===k?'on':''}" data-act="area:${k}" title="${t}"${a===k?' aria-current="page"':''}>${svg(ICO[k])}<span>${sh}</span></button>`).join('');
}
function lvGroup(title,ls,lv){return ls.length?`<h3>${title}</h3>`+ls.map(l=>navBtn(view.tab==='league'&&view.id===l.id,l.name.replace(/^Bezirksliga /,'BZL ').replace(/^Regionalliga /,'RL '),l.teams.length,'lg:'+l.id,lv?lv(l):'')).join(''):''}
function sideHTML(a){
  let h=`<input class="search" id="q" placeholder="Verein, Liga oder Pokal suchen …" autocomplete="off"><div class="sres" id="sres"></div>`;
  if(S.fav&&T(S.fav)) h+=`<h3>Mein Verein</h3>`+navBtn(view.tab==='club'&&view.id===S.fav,'★ '+T(S.fav).name,null,'club:'+S.fav);
  if(a==='home'){
    h+=`<h3>Schnellzugriff</h3>`+['bl','bl2','l3','pl','ll','sa','l1'].map(id=>L(id)).filter(Boolean).map(l=>navBtn(false,l.name,null,'lg:'+l.id,l.foreign?l.cc:l.level)).join('')
      +(S.euro||[]).map(e=>navBtn(false,e.name,null,'euro:'+e.id,e.short)).join('')+navBtn(false,'DFB-Pokal',null,'cup:dfb','');
  }
  if(a==='de'){
    const pro=S.leagues.filter(l=>l.level<=4&&!l.foreign);
    h+=lvGroup('Bundesligen',pro.filter(l=>l.level<=3),l=>l.level)+lvGroup('Regionalligen',pro.filter(l=>l.level===4),()=>4);
    const am=S.leagues.filter(l=>l.level>=5);
    h+=`<h3>Amateure nach Landesverband</h3>`;
    [...new Set(am.map(l=>l.vb))].sort((x,y)=>VB[x].localeCompare(VB[y])).forEach(v=>{
      const ls=am.filter(l=>l.vb===v).sort((x,y)=>x.level-y.level||x.name.localeCompare(y.name));
      const open=ls.some(l=>l.id===view.id);
      const byLv=[...new Set(ls.map(l=>l.level))].map(lv=>{const g=ls.filter(l=>l.level===lv),on=g.some(l=>l.id===view.id);
        const items=g.map(l=>navBtn(view.tab==='league'&&view.id===l.id,l.name.replace(/^Bezirksliga /,'BZL ').replace(/^Kreisliga /,'KL ').replace(/^Kreisoberliga /,'KOL '),l.teams.length,'lg:'+l.id)).join('');
        return g.length>4?`<details class="vb lvd"${on?' open':''}><summary>${lv}. Liga · ${LEVELS[lv]} <em class="meta">${g.length}</em></summary><div>${items}</div></details>`:`<div class="lvh">${lv}. Liga · ${LEVELS[lv]}</div>`+items}).join('');
      h+=`<details class="vb"${open?' open':''}><summary>${VB[v]} <em class="meta">${ls.length} ${ls.length===1?'Liga':'Ligen'}</em></summary><div>${byLv}</div></details>`;
    });
    h+=navBtn(view.tab==='import','+ Liga von fussball.de importieren',null,'import');
  }
  if(a==='eu'){
    h+=lvGroup('Top-Ligen',S.leagues.filter(l=>l.foreign),l=>l.cc);
    h+=`<h3>Europapokal</h3>`+(S.euro||[]).map(e=>navBtn(view.tab==='euro'&&view.id===e.id,e.name,e.teams.length,'euro:'+e.id,e.short)).join('');
    h+=navBtn(false,'Bundesliga',null,'lg:bl','GER');
  }
  if(a==='cups'){
    h+=`<h3>National</h3>`+S.cups.filter(c=>c.type==='dfb').map(c=>navBtn(view.tab==='cup'&&view.id===c.id,c.name,c.teams.length,'cup:'+c.id)).join('');
    h+=`<h3>Landespokale</h3>`+S.cups.filter(c=>c.type==='lp').sort((x,y)=>VB[x.vb].localeCompare(VB[y.vb])).map(c=>navBtn(view.tab==='cup'&&view.id===c.id,c.name,c.teams.length,'cup:'+c.id)).join('');
    const kp=S.cups.filter(c=>c.type==='kp');
    if(kp.length) h+=`<h3>Kreispokale</h3>`+kp.map(c=>navBtn(view.tab==='cup'&&view.id===c.id,c.name.replace('Kreispokal ',''),c.teams.length,'cup:'+c.id)).join('');
    h+=`<h3>International</h3>`+(S.euro||[]).map(e=>navBtn(false,e.name,null,'euro:'+e.id,e.short)).join('');
  }
  if(a==='news'){h+=`<h3>Rubriken</h3>`+[['','Alle Nachrichten'],['fav','Mein Verein'],['liga','Ligen'],['tr','Transfers'],['fin','Finanzen'],['cup','Pokal'],['int','International'],['pr','Pressemitteilungen'],['prog','TV-Prognose & Saisonprognose']].map(([k,t])=>navBtn(view.tab==='news'&&(view.nf||'')===k,t,null,'nf:'+k)).join('')}
  if(a==='fav'){
    if(S.fav&&T(S.fav)) h+=`<h3>Bereiche</h3>`+[['ov','Überblick'],['kader','Kader'],['markt','Transfermarkt'],['scout','Scouting'],['fin','Finanzen & Transfers']].map(([k,t])=>navBtn(view.tab==='fav'&&(view.ftab||'ov')===k,t,null,'ftab:'+k)).join('')+navBtn(false,'Vereinsseite & Historie',null,'club:'+S.fav);
    h+=`<h3>Verein wählen</h3><p class="note" style="margin:0 8px">Suche oben einen Verein und öffne ihn, dann „Als Mein Verein beobachten“.</p>`;
  }
  if(a==='tr'){
    const enc=o=>'trf:'+encodeURIComponent(JSON.stringify(o));
    h+=`<h3>Finanzen</h3>`+navBtn(view.tab==='fin','Finanzen aller Vereine',null,'finv');
    h+=`<h3>Schnellfilter</h3>`+navBtn(false,'Alle Transfers',null,enc({q:'',s:'',lg:'',p:'',t:'',min:'',sort:''}))+navBtn(false,'Rekordtransfers',null,enc({sort:'fee',t:'paid'}))+navBtn(false,'Diese Saison',null,enc({s:String(S.season)}))+(S.fav&&T(S.fav)?navBtn(false,'★ '+T(S.fav).name,null,enc({q:T(S.fav).name})):'');
    h+=`<h3>Nach Liga</h3>`+['Bundesliga','2. Bundesliga','3. Liga','Premier League','LaLiga','Serie A','Ligue 1','International'].map(n=>navBtn(view.trf&&view.trf.lg===n,n,null,enc({lg:n}))).join('');
  }
  if(a==='hist'){
    h+=`<h3>Historie</h3>`+navBtn(view.tab==='season','Saisonbilanz & Chronik',null,'season')+navBtn(view.tab==='hall','Ruhmeshalle & Bestenlisten',null,'hall');
    h+=`<h3>Ewige Tabellen</h3>`+['bl','bl2','l3','pl','ll','sa','l1'].map(id=>L(id)).filter(Boolean).map(l=>navBtn(false,l.name,null,'ewig:'+l.id)).join('')+`<p class="note" style="margin:6px 8px">Jede andere Liga: Liga öffnen und über der Tabelle „Ewige Tabelle“ wählen.</p>`;
    h+=`<h3>Spielstand</h3>`+navBtn(view.tab==='save','Spielstand sichern & laden',null,'savev');
    h+=`<button class="nav-i" data-act="reset" style="color:var(--down);margin-top:8px">Spielstand zurücksetzen</button>`;
  }
  return `<div class="side">${h}</div>`;
}
// Kontextleiste oben im Inhalt: Auswahl-Knopf (öffnet das Menü) + Schnellwahl-Chips
function ctxBar(){
  const a=view.area; if(a==='home') return '';
  const chip=(on,label,act)=>`<button class="${on?'on':''}" data-act="${act}">${esc(label)}</button>`;
  let cur=AREA_T(a),chips=[];
  if(a==='de'){
    const lg=view.tab==='league'&&L(view.id); if(lg) cur=lg.name; else if(view.tab==='import') cur='Liga importieren';
    const top=S.leagues.filter(l=>!l.foreign&&l.level<=4);
    chips=top.map(l=>chip(lg&&lg.id===l.id,l.name.replace('Regionalliga ','RL ').replace('2. Bundesliga','2. BL'),'lg:'+l.id));
    if(lg&&lg.level>=5){const sib=S.leagues.filter(l=>l.vb===lg.vb&&l.level===lg.level&&(lg.level<=6||l.kreis===lg.kreis||!lg.kreis)).slice(0,14);
      chips=sib.map(l=>chip(l.id===lg.id,l.name.replace(/^(Bezirksliga|Kreisliga|Kreisoberliga|Landesliga|Landesklasse) /,''),'lg:'+l.id));
      const up=S.leagues.find(l=>l.name===((PRESETS.find(p=>p.name===lg.name)||{}).up));
      if(up) chips.unshift(chip(false,'▲ '+up.name,'lg:'+up.id));}
  }
  if(a==='news'){cur='News';chips=[['','Alle'],['fav','★ Mein Verein'],['bl','Bundesliga'],['liga','Ligen'],['tr','Transfers'],['fin','Finanzen'],['cup','Pokal'],['int','International'],['pr','Pressemitteilungen'],['prog','📺 TV-Prognose']].map(([k,t])=>chip((view.nf||'')===k,t,'nf:'+k))}
  if(a==='eu'){
    const lg=view.tab==='league'&&L(view.id),e=view.tab==='euro'&&(S.euro||[]).find(x=>x.id===view.id);cur=lg?lg.name:e?e.name:cur;
    chips=[...S.leagues.filter(l=>l.foreign).map(l=>chip(lg&&lg.id===l.id,l.name,'lg:'+l.id)),...(S.euro||[]).map(x=>chip(e&&e.id===x.id,x.name,'euro:'+x.id))];
  }
  if(a==='cups'){
    const c=view.tab==='cup'&&S.cups.find(x=>x.id===view.id);cur=c?c.name:cur;
    const dfb=S.cups.find(x=>x.type==='dfb');
    const same=c?S.cups.filter(x=>x.type===c.type&&(c.type!=='kp'||x.vb===c.vb)).slice(0,16):[];
    chips=[dfb&&chip(c&&c.id===dfb.id,'DFB-Pokal','cup:'+dfb.id),...same.filter(x=>x.type!=='dfb').map(x=>chip(c&&c.id===x.id,x.name.replace('Kreispokal ',''),'cup:'+x.id))].filter(Boolean);
  }
  if(a==='fav'){cur=S.fav&&T(S.fav)?T(S.fav).name:'Mein Verein';
    if(S.fav&&T(S.fav)) chips=[['ov','Überblick'],['kader','Kader'],['markt','Transfermarkt'],['scout','Scouting'],['fin','Finanzen']].map(([k,t])=>chip(view.tab==='fav'&&(view.ftab||'ov')===k,t,'ftab:'+k)).concat(chip(false,'Historie','club:'+S.fav));}
  if(a==='tr'){const enc=o=>'trf:'+encodeURIComponent(JSON.stringify(o)),f=view.trf||{};cur=view.tab==='fin'?'Finanzen':'Transfers';
    chips=[chip(view.tab==='fin','💶 Finanzen','finv'),chip(view.tab==='tr'&&!f.q&&!f.s&&!f.lg&&!f.sort,'Alle Transfers',enc({q:'',s:'',lg:'',p:'',t:'',min:'',sort:''})),chip(f.sort==='fee','Rekorde',enc({sort:'fee',t:'paid'})),chip(f.s===String(S.season),'Diese Saison',enc({s:String(S.season)})),S.fav&&T(S.fav)?chip(f.q===T(S.fav).name,'★ '+T(S.fav).name,enc({q:T(S.fav).name})):''].filter(Boolean);}
  if(a==='hist'){cur={season:'Chronik',hall:'Ruhmeshalle',save:'Spielstand'}[view.tab]||cur;
    chips=[chip(view.tab==='season','Chronik','season'),chip(view.tab==='hall','Ruhmeshalle','hall'),chip(false,'Ewige Tabelle BL','ewig:bl'),chip(view.tab==='save','Spielstand','savev')];}
  return `<div class="ctx"><button class="pick" data-act="ov:nav" title="Auswahl öffnen"><span>${esc(cur)}</span>${svg(CHEV)}</button><div class="chipbar">${chips.join('')}</div></div>`;
}
function renderOverlay(){
  const o=view.ov,el=$('ov'); if(!o||o.t!=='match'){clearInterval(LIVE.timer);LIVE.timer=null}
  if(!o){el.innerHTML='';document.body.style.overflow='';return}
  document.body.style.overflow='hidden';
  const x=`<button class="ib" data-act="ovx" aria-label="Schließen">${svg('<path d="M6 6l12 12M18 6L6 18"/>')}</button>`;
  let h='';
  if(o.t==='nav') h=`<div class="drawer" role="dialog" aria-label="${esc(AREA_T(view.area))}"><div class="ovh"><b>${esc(AREA_T(view.area))}</b>${x}</div><div class="ovc">${sideHTML(view.area)}</div></div>`;
  else if(o.t==='search') h=`<div class="drawer" role="dialog" aria-label="Suche"><div class="ovh"><b>Suche</b>${x}</div><div class="ovc"><div class="side"><input class="search" id="q" placeholder="Verein, Liga oder Pokal suchen …" autocomplete="off"><div class="sres" id="sres"></div></div></div></div>`;
  else if(o.t==='match') h=`<div class="sheet msheet" role="dialog" aria-label="Live-Spiel"><div class="ovh"><b>${o.m.hg!=null&&!o.fresh&&!o.playing?'Spielbericht':'Live'}</b>${x}</div><div class="ovc">${matchHTML()}</div></div>`;
  else if(o.t==='club'&&T(o.id)) h=`<div class="sheet" role="dialog" aria-label="${esc(T(o.id).name)}"><div class="ovh"><b>${esc(T(o.id).name)}</b>${x}</div><div class="ovc">${renderClub(o.id)}</div></div>`;
  el.innerHTML=`<div class="ovb" data-act="ovx"></div>`+h;
  const q=$('q');if(q){q.value=view.q||'';q.oninput=()=>{view.q=q.value;searchRes()};searchRes();if(o.t==='search'||o.focus)setTimeout(()=>q.focus(),30)}
  const sh=el.querySelector('.ovc');if(sh&&o.top){sh.scrollTop=0;o.top=false}
  if(o.t==='match'&&o.playing&&!LIVE.timer) liveRun();
}
function miniTable(lg,n=4){
  const t=table(lg).slice(0,n);
  return `<div class="mini"><div class="mh"><button class="tlink" data-act="lg:${lg.id}"><b>${esc(lg.name)}</b></button><span class="meta">${lg.played}/${lg.rounds.length}</span></div>
  ${t.map((r,i)=>`<div class="mr${r.id===S.fav?' me':''}"><span class="rk">${i+1}</span>${tl(r.id)}<span class="meta">${r.sp?r.tf-r.tg:''}</span><b>${r.p}</b></div>`).join('')}</div>`;
}
function euroStage(e){return e.winner?'Sieger: '+T(e.winner).name:e.step<e.nmd?`Ligaphase · ${e.step}/${e.nmd} Spieltage`:e.ko[e.ko.length-1].name}
function cupStage(c){return c.winner?'Sieger: '+T(c.winner).name:c.played===0?'1. Runde ausstehend':`${ROUNDN(c.R,c.played)} · ${c.rounds[c.played].filter(m=>!m.bye).length*2||1} Teams im Rennen`}
function renderHome(){
  const M=maxRounds(),pct=Math.round(S.round/M*100);
  const de=['bl','bl2','l3'].map(L).filter(Boolean),eu=['pl','ll','sa','l1'].map(L).filter(Boolean);
  const dfb=S.cups.find(c=>c.type==='dfb');
  let h=`<div class="card"><div class="hd"><div><div class="meta">Saison ${S.season}/${String(S.season+1).slice(2)}</div><h2>Übersicht</h2></div><span class="tag">${S.done?'Saison beendet':`Spieltag ${S.round} von ${M}`}</span></div>
  <div class="prog" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
  ${S.done?'<p class="note" style="margin-top:10px">Alle Spiele sind gespielt. Starte oben die neue Saison, dann gibt es Auf- und Abstieg und neue Europapokal-Plätze.</p>':''}
  ${!S.fav?'<p class="note" style="margin-top:10px">Tipp: Tippe oben auf die Lupe, suche deinen Verein und wähle „Als Mein Verein beobachten“ – dann siehst du ihn immer oben.</p>':''}</div>
  ${NEWS().length?`<section><h3 class="sec">Schlagzeilen</h3><div class="heads">${NEWS().filter(x=>x.imp>=2).slice(0,4).map(x=>`<button class="hl1" data-act="area:news"><span class="meta">${NCAT[x.cat]||'News'}</span><b>${esc(x.h)}</b></button>`).join('')}</div></section>`:''}
  <section><h3 class="sec">Deutschland</h3><div class="minis">${de.map(l=>miniTable(l)).join('')}</div></section>
  <section><h3 class="sec">Top-Ligen Europas</h3><div class="minis">${eu.map(l=>miniTable(l)).join('')}</div></section>
  <section><h3 class="sec">Wettbewerbe</h3><div class="stages">
    ${dfb?`<button class="stage" data-act="cup:dfb"><small>DFB-Pokal</small><b>${esc(cupStage(dfb))}</b></button>`:''}
    ${(S.euro||[]).map(e=>`<button class="stage" data-act="euro:${e.id}"><small>${e.name}</small><b>${esc(euroStage(e))}</b></button>`).join('')}
    <button class="stage" data-act="area:cups"><small>Landes- &amp; Kreispokale</small><b>${S.cups.filter(c=>c.type!=='dfb'&&c.winner).length} von ${S.cups.filter(c=>c.type!=='dfb').length} entschieden</b></button>
  </div></section>`;
  return h;
}
function searchRes(){
  const q=(view.q||'').toLowerCase().trim(),el=$('sres');
  if(q.length<2){el.innerHTML='';return}
  const hits=Object.values(S.teams).filter(t=>t.name.toLowerCase().includes(q)).slice(0,12);
  const lgs=S.leagues.filter(l=>l.name.toLowerCase().includes(q)).slice(0,6),cps=S.cups.filter(c=>c.name.toLowerCase().includes(q)).slice(0,4);
  el.innerHTML=(hits.map(t=>{const lg=S.leagues.find(l=>l.teams.includes(t.id));return navBtn(false,t.name,lg?lg.name.replace('Regionalliga','RL'):'–','club:'+t.id)}).join('')
    +(lgs.length?'<div class="lvh">Ligen</div>'+lgs.map(l=>navBtn(false,l.name,l.teams.length,'lg:'+l.id)).join(''):'')
    +(cps.length?'<div class="lvh">Pokale</div>'+cps.map(c=>navBtn(false,c.name,c.teams.length,'cup:'+c.id)).join(''):''))||'<span class="meta">Nichts gefunden</span>';
  el.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>act(b.dataset.act));
}
function score(m,cup){
  if(m.bye) return `<span class="s open">Freilos</span>`;
  if(m.hg==null) return `<span class="s open">–:–</span>`;
  const ex=m.pen?`i.E. ${m.pen[0]}:${m.pen[1]}`:m.et?'n.V.':'';
  return `<span class="s">${m.hg}:${m.ag}${ex?`<small>${ex}</small>`:''}</span>`;
}
function matchRow(m,cup,ctx){
  const hw=m.w&&m.w===m.h, aw=m.w&&m.w===m.a;
  const nm=id=>id?tl(id):'';
  let sc=score(m,cup);
  if(ctx&&!m.bye&&m.a&&(m.hg!=null||ctx.canLive)){sc=sc.replace('<span class="s','<button class="s mbtn'+(m.hg==null?' golive':'')+'" title="'+(m.hg!=null?'Spielbericht ansehen':'90 Minuten live simulieren')+'" data-act="mt:'+mref(m,ctx)+'"').replace(/<\/span>$/,'</button>');if(m.hg==null)sc=sc.replace('–:–','▶ Live')}
  return `<div class="m"><span class="h${hw?' w':''}">${nm(m.h)}</span>${sc}<span class="a${aw?' w':''}">${m.bye?'':nm(m.a)}</span></div>`;
}
const ctxL=(lg,i)=>({key:'L'+lg.id+':'+i,comp:lg.name,rd:(i+1)+'. Spieltag',canLive:i===lg.played&&!S.done});
const ctxC=(c,k)=>({key:'C'+c.id+':'+k,comp:c.name,rd:ROUNDN(c.R,k),cup:true,neutral:k===c.R-1&&c.type==='dfb',canLive:k===c.played&&!c.winner});
const ctxE=(e,i)=>({key:'E'+e.id+':'+i,comp:e.name,rd:(i+1)+'. Spieltag Ligaphase',canLive:i===e.step&&e.step<e.nmd});
const ctxK=(e,r,leg)=>({key:'K'+e.id+':'+r.name+':'+leg,comp:e.name,rd:r.name+(leg?' · '+leg:''),neutral:!leg,canLive:false});
function renderLeague(lg){
  const tabs=`<div class="seg" role="tablist"><button class="${view.lmode!=='ewig'?'on':''}" data-act="lmode:cur">Saison ${S.season}/${String(S.season+1).slice(2)}</button><button class="${view.lmode==='ewig'?'on':''}" data-act="lmode:ewig">Ewige Tabelle</button></div>`;
  if(view.lmode==='ewig') return renderEwig(lg,tabs);
  const t=table(lg),n=t.length;
  if(view.md==null||view.md>=lg.rounds.length) view.md=Math.min(Math.max(lg.played-1,0),lg.rounds.length-1);
  const md=view.md, rd=lg.rounds[md]||[];
  const sub=lg.foreign?`${lg.land} · 1. Liga · Saison ${S.season}/${String(S.season+1).slice(2)}`:lg.level<=4?`${LEVELS[lg.level]} · Saison ${S.season}/${String(S.season+1).slice(2)}`:`${LEVELS[lg.level]} · ${VB[lg.vb]}${lg.kreis?' · Kreis '+esc(lg.kreis):''}`;
  const bye=lg.teams.length%2?lg.teams.filter(id=>!rd.some(m=>m.h===id||m.a===id)):[];
  return `<div class="card"><div class="hd"><div><div class="meta">${sub}</div><h2>${esc(lg.name)}</h2></div>
    <div>${lg.real?'<span class="tag real">Echte Vereine 26/27</span>':''} <span class="tag">${lg.played}/${lg.rounds.length} Spieltage</span>${lg.custom?` <button class="btn" data-act="del:${lg.id}">Liga entfernen</button>`:''}</div></div>
    ${tabs}<div class="grid2"><div class="scroll"><table class="lt"><thead><tr><th class="l">Pl.</th><th class="l">Verein</th><th>Sp</th><th>S</th><th>U</th><th>N</th><th>Tore</th><th>Diff</th><th>Pkt</th></tr></thead><tbody>
    ${t.map((r,i)=>`<tr class="z-${zone(lg,i,n)}${r.id===view.team?' hl':''}"><td class="pos l">${i+1}</td><td class="team">${tl(r.id)}${lg.pen&&lg.pen[r.id]?` <span class="tag no" title="Punktabzug nach Insolvenz">${lg.pen[r.id]}</span>`:''}</td><td>${r.sp}</td><td>${r.s}</td><td>${r.u}</td><td>${r.n}</td><td>${r.tf}:${r.tg}</td><td>${r.tf-r.tg>0?'+':''}${r.tf-r.tg}</td><td class="pts">${r.p}</td></tr>`).join('')}
    </tbody></table>${legend(lg)}</div>
    <div><div class="hd" style="margin-bottom:4px"><div class="md-nav"><button class="btn" data-act="md:-1" aria-label="Vorheriger Spieltag">‹</button><b>${md+1}. Spieltag</b><button class="btn" data-act="md:1" aria-label="Nächster Spieltag">›</button></div></div>
    <div class="matches">${rd.map(m=>matchRow(m,false,ctxL(lg,md))).join('')}${bye.length?`<div class="meta" style="padding-top:6px">Spielfrei: ${esc(T(bye[0]).name)}</div>`:''}</div></div></div></div>`;
}
function renderEwig(lg,tabs){
  const rows=liveAll(lg.name),seasons=(S.season-2026)+(lg.played>0?1:0);
  return `<div class="card"><div class="hd"><div><div class="meta">${lg.foreign?lg.land:LEVELS[lg.level]} · alle Spielzeiten seit 2026/27, inkl. laufender Saison</div><h2>${esc(lg.name)}</h2></div><span class="tag">${seasons} ${seasons===1?'Saison':'Saisons'}</span></div>${tabs}
  ${rows.length?`<div class="scroll"><table class="et"><thead><tr><th class="l">Pl.</th><th class="l">Verein</th><th>Saisons</th><th>Titel</th><th>Sp</th><th>S</th><th>U</th><th>N</th><th>Tore</th><th>Diff</th><th>Pkt</th><th>Pkt/Sp</th></tr></thead><tbody>
  ${rows.map((r,i)=>`<tr class="${lg.teams.includes(r.id)?'':'gone'}"><td class="pos l">${i+1}</td><td class="team">${tl(r.id)}</td><td>${r.z}</td><td>${r.t||''}</td><td>${r.sp}</td><td>${r.s}</td><td>${r.u}</td><td>${r.n}</td><td>${r.tf}:${r.tg}</td><td>${r.tf-r.tg>0?'+':''}${r.tf-r.tg}</td><td class="pts">${r.p}</td><td>${r.sp?(r.p/r.sp).toFixed(2):'–'}</td></tr>`).join('')}
  </tbody></table></div><p class="note" style="margin-top:10px">Grau: Vereine, die aktuell nicht in dieser Liga spielen. Die laufende Saison zählt live mit.</p>`:`<div class="empty">Noch kein Spiel in dieser Liga gespielt. Simuliere Spieltage, dann füllt sich die ewige Tabelle.</div>`}</div>`;
}
function trophyCount(id){
  const t=H().titles[id]||[],g={};
  t.forEach(x=>{g[x.c]=(g[x.c]||{n:0,s:[],k:x.k,lv:x.lv??({ucl:-3,uel:-2,uecl:-1,dfb:0.5,lp:3.5}[x.t]??9)});g[x.c].n++;g[x.c].s.push(x.s)});
  return Object.entries(g).map(([c,v])=>({c,...v})).sort((a,b)=>a.lv-b.lv||b.n-a.n);
}
function weight(x){ // Ruhmes-Punkte je Titel
  if(x.k==='liga') return Math.max(1,12-2*x.lv);
  return x.t==='ucl'?20:x.t==='uel'?12:x.t==='uecl'?9:x.t==='dfb'?8:x.t==='lp'?3:1;
}
function renderHall(){
  const h=H(),ids=Object.keys(h.titles).filter(T);
  const list=(title,arr,val,fmt)=>`<div class="card"><h3 class="ct">${title}</h3>${arr.length?`<ol class="rank">${arr.slice(0,10).map((x,i)=>`<li><span class="rk">${i+1}</span>${tl(x.id)}<b>${fmt?fmt(x):x[val]}</b></li>`).join('')}</ol>`:'<div class="empty">Noch keine Einträge – schließe die erste Saison ab.</div>'}</div>`;
  const by=(pred)=>ids.map(id=>({id,n:h.titles[id].filter(pred).length})).filter(x=>x.n).sort((a,b)=>b.n-a.n);
  const ruhm=ids.map(id=>({id,n:h.titles[id].reduce((a,x)=>a+weight(x),0),t:h.titles[id].length})).sort((a,b)=>b.n-a.n);
  const names=[...new Set([...S.leagues.slice().sort((a,b)=>a.level-b.level).map(l=>l.name),...Object.keys(h.all)])];
  const sel=names.includes(view.hallLg)?view.hallLg:'Bundesliga';
  const ew=liveAll(sel).map(r=>({id:r.id,n:r.p,sp:r.sp,t:r.t}));
  const selLg=S.leagues.find(l=>l.name===sel);
  const ewCard=`<div class="card"><h3 class="ct">Ewige Tabelle</h3><label class="meta" for="hallLg" style="display:block;margin-bottom:8px">Liga<select id="hallLg" class="search" style="margin-top:4px">${names.map(n=>`<option${n===sel?' selected':''}>${esc(n)}</option>`).join('')}</select></label>${ew.length?`<ol class="rank">${ew.slice(0,10).map((x,i)=>`<li><span class="rk">${i+1}</span>${tl(x.id)}<b>${x.n} Pkt <small>${x.sp} Sp${x.t?' · '+x.t+'× Meister':''}</small></b></li>`).join('')}</ol>${selLg?`<button class="btn" style="margin-top:10px" data-act="ewig:${selLg.id}">Komplette ewige Tabelle</button>`:''}`:'<div class="empty">In dieser Liga wurde noch nicht gespielt.</div>'}</div>`;
  const ups=Object.entries(h.career).map(([id,c])=>({id,n:c.filter(e=>e[6]===1).length})).filter(x=>x.n&&T(x.id)).sort((a,b)=>b.n-a.n);
  const done=S.log.length;
  return `<div class="card"><div class="hd"><div><div class="meta">${done} abgeschlossene ${done===1?'Saison':'Saisons'} seit 2026/27</div><h2>Ruhmeshalle</h2></div></div>
  <p class="note">Bestenlisten aus allen simulierten Spielzeiten. Ruhmespunkte: Champions League 20, Europa League 12, Meister einer 1. Liga 10, Conference League 9, DFB-Pokal 8, 2. Liga 8, 3. Liga 6, Regionalliga 4, Landespokal 3, darunter 2 oder 1. Klick auf einen Verein öffnet seine Historie.</p></div>
  <div class="halls">
  ${list('Ruhmespunkte gesamt',ruhm,'n',x=>`${x.n} <small>${x.t} Titel</small>`)}
  ${list('Champions-League-Sieger',by(x=>x.t==='ucl'),'n',x=>x.n+'×')}
  ${list('Europa-League-Sieger',by(x=>x.t==='uel'),'n',x=>x.n+'×')}
  ${list('Conference-League-Sieger',by(x=>x.t==='uecl'),'n',x=>x.n+'×')}
  ${list('Deutsche Meister',by(x=>x.c==='Deutscher Meister'),'n',x=>x.n+'×')}
  ${list('Meister der Top-Ligen',by(x=>x.k==='liga'&&x.lv===1),'n',x=>x.n+'×')}
  ${list('DFB-Pokalsieger',by(x=>x.t==='dfb'),'n',x=>x.n+'×')}
  ${list('Landespokalsieger',by(x=>x.t==='lp'),'n',x=>x.n+'×')}
  ${list('Meiste Titel insgesamt',ids.map(id=>({id,n:h.titles[id].length})).sort((a,b)=>b.n-a.n),'n',x=>x.n)}
  ${ewCard}
  ${list('Meiste Aufstiege',ups,'n',x=>x.n+'×')}
  ${list('Amateur-Meister (ab 5. Liga)',by(x=>x.k==='liga'&&x.lv>=5),'n',x=>x.n+'×')}
  </div>`;
}
function renderClub(id){
  const t=T(id); if(!t) return '<div class="card empty">Verein nicht gefunden.</div>';
  const lg=S.leagues.find(l=>l.teams.includes(id));
  const car=careerOf(id);
  if(lg&&lg.played>0){const tb=table(lg),pos=tb.findIndex(r=>r.id===id)+1;car.push({s:S.season,lg:lg.name,lv:lg.level,pos,n:tb.length,p:tb[pos-1].p,cups:[...S.cups.filter(c=>c.teams.includes(id)).map(c=>({c:c.name,r:c.winner===id?'Sieger':(c.played?cupReach(c,id):null)})),...(S.euro||[]).filter(e=>e.teams.includes(id)).map(e=>({c:e.name,r:euroReach(e,id)}))].filter(x=>x.r),live:true})}
  else if(!lg){const eu=(S.euro||[]).filter(e=>e.teams.includes(id));if(eu.length)car.push({s:S.season,lg:'International ('+(t.cc||'')+')',lv:0,pos:'–',p:'–',cups:eu.map(e=>({c:e.name,r:euroReach(e,id)})),live:true,intl:true})}
  const tm=teamMatches(id);
  const tc=trophyCount(id);
  const best=car.length?car.reduce((b,e)=>(e.lv<b.lv||(e.lv===b.lv&&e.pos<b.pos))?e:b):null;
  const mv={up:'<span class="mv up">▲ Aufstieg</span>',down:'<span class="mv down">▼ Abstieg</span>',out:'<span class="mv">aus dem Ligensystem</span>'};
  const sl=s=>`${s}/${String(s+1).slice(2)}`;
  return `<div class="card"><div class="hd"><div><div class="meta">${VB[t.vb]||t.cc||''}${lg?' · '+esc(lg.name):''}${isRes(t.name)?(()=>{const D=deLevels(),m=resMinLevel(t.name,D.byName,x=>D.lv[x]);return ' · Zweitvertretung'+(m?` · höchstens ${LEVELS[m]||'Stufe '+m}`:'')})():''}</div><h2>${esc(t.name)}</h2></div>
    <div class="ctrls"><button class="btn${S.fav===id?' pri':''}" data-act="fav:${id}">${S.fav===id?'★ Mein Verein':'☆ Als Mein Verein beobachten'}</button>${lg?`<button class="btn" data-act="lg:${lg.id}:${id}">Zur Tabelle</button>`:''}</div></div>
    <div class="facts"><div><small>Spielstärke</small><b>${t.r.toFixed(1)}</b></div>${teamFormHTML(id)}<div><small>Titel</small><b>${(H().titles[id]||[]).length}</b></div><div><small>Saisons</small><b>${car.length}</b></div><div><small>Beste Platzierung</small><b>${best?'Platz '+best.pos+' · '+esc(best.lg):'–'}</b></div><div><small>Kaderwert</small><b>${money(clubValue(id))}</b></div></div></div>
  ${lgOf(id)?finPanel(id,false):''}
  ${squadCard(id,false)}
  ${clubTransfers(id)}
  <div class="card"><h3 class="ct">Spiele ${S.season}/${String(S.season+1).slice(2)}</h3>${tm.length?`<div class="scroll"><table><thead><tr><th class="l">Wettbewerb</th><th class="l">Runde</th><th class="l">Heim</th><th>Ergebnis</th><th class="l">Gast</th><th></th></tr></thead><tbody>${tm.filter(x=>x.done).concat(tm.filter(x=>!x.done).slice(0,3)).map(x=>`<tr><td class="l meta">${esc(x.comp)}</td><td class="l meta">${x.rd}</td><td class="l${x.m.h===id?' w':''}">${tl(x.m.h)}</td><td>${x.m.hg!=null?`<button class="tlink" data-act="mt:${mref(x.m,x.ctx)}" title="Spielbericht">${x.m.hg+':'+x.m.ag+(x.m.pen?' i.E.':x.m.et?' n.V.':'')}</button>`:x.ctx.canLive?`<button class="btn sm live" data-act="mt:${mref(x.m,x.ctx)}">▶ Live</button>`:'–:–'}</td><td class="l${x.m.a===id?' w':''}">${tl(x.m.a)}</td><td>${x.m.hg!=null?`<i class="fi f-${res(x.m,id)}">${res(x.m,id)}</i>`:''}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Keine Spiele in dieser Saison.</div>'}</div>
  <div class="card"><h3 class="ct">Trophäenschrank</h3>${tc.length?`<div class="cab">${tc.map(x=>`<div class="tro ${x.k}"><b>${x.n}×</b><span>${esc(x.c)}</span><small>${x.s.map(sl).join(', ')}</small></div>`).join('')}</div>`:'<div class="empty">Noch kein Titel gewonnen.</div>'}</div>
  <div class="card"><h3 class="ct">Saisonverlauf</h3>${car.length?`<div class="scroll"><table><thead><tr><th class="l">Saison</th><th class="l">Liga</th><th>Platz</th><th>Pkt</th><th class="l">Pokale</th><th class="l"></th></tr></thead><tbody>
    ${car.slice().reverse().map(e=>`<tr><td class="l">${sl(e.s)}${e.live?' <span class="tag">läuft</span>':''}</td><td class="l">${esc(e.lg)}</td><td>${e.pos===1&&!e.live?'<b>1. 🏆</b>':e.pos+'.'}</td><td>${e.p}</td><td class="l team">${e.cups.map(c=>`${esc(c.c)}: ${c.r==='Sieger'?'<b>Sieger</b>':c.r}`).join('<br>')||'–'}</td><td class="l">${mv[e.mv]||''}</td></tr>`).join('')}
    </tbody></table></div>`:'<div class="empty">Noch keine Spiele gespielt.</div>'}</div>`;
}
function renderEuro(e){
  const t=euroTable(e),lpDone=e.step>=e.nmd;
  const mdv=Math.min(view.emd??Math.max(0,Math.min(e.step,e.nmd)-1),e.nmd-1);
  const zz=i=>i<8?'cl':i<24?'el':'down';
  const tieRow=(x,r)=>x.final?matchRow(x.l1,true,ctxK(e,r,'')):`<div class="tie"><div class="m"><span class="h${x.w===x.a?' w':''}">${tl(x.a)}</span><span class="s">${x.agg[0]}:${x.agg[1]}${x.pen?`<small>i.E. ${x.pen[0]}:${x.pen[1]}</small>`:''}</span><span class="a${x.w===x.b?' w':''}">${tl(x.b)}</span></div><div class="legs meta"><button class="tlink" data-act="mt:${mref(x.l1,ctxK(e,r,'Hinspiel'))}">Hinspiel ${x.l1.hg}:${x.l1.ag}</button> · <button class="tlink" data-act="mt:${mref(x.l2,ctxK(e,r,'Rückspiel'))}">Rückspiel ${x.l2.ag}:${x.l2.hg}</button></div></div>`;
  let h=`<div class="card"><div class="hd"><div><div class="meta">UEFA · Saison ${S.season}/${String(S.season+1).slice(2)} · 36 Teams, ${e.nmd} Spieltage Ligaphase</div><h2>${e.name}</h2></div><span class="tag">${Math.min(e.step,e.nmd)}/${e.nmd} Spieltage${e.ko.length?' · '+e.ko[e.ko.length-1].name:''}</span></div>`;
  if(e.winner) h+=`<div class="champ"><span class="meta">Sieger</span><b>${esc(T(e.winner).name)}</b></div>`;
  if(e.ko.length) h+=`<div class="rounds" style="margin-bottom:16px">${e.ko.slice().reverse().map(r=>`<div class="rnd"><h4>${r.name}</h4><div class="matches">${r.ties.map(x=>tieRow(x,r)).join('')}</div></div>`).join('')}</div>`;
  h+=`<div class="grid2"><div class="scroll"><h4 class="meta" style="margin:0 0 6px">Ligaphase${lpDone?' (abgeschlossen)':''}</h4><table><thead><tr><th class="l">Pl.</th><th class="l">Verein</th><th class="l">Land</th><th>Sp</th><th>S</th><th>U</th><th>N</th><th>Tore</th><th>Pkt</th></tr></thead><tbody>
  ${t.map((r,i)=>`<tr class="z-${zz(i)}${r.id===S.fav?' hl':''}"><td class="pos l">${i+1}</td><td class="team">${tl(r.id)}</td><td class="l meta">${T(r.id).cc||'GER'}</td><td>${r.sp}</td><td>${r.s}</td><td>${r.u}</td><td>${r.n}</td><td>${r.tf}:${r.tg}</td><td class="pts">${r.p}</td></tr>`).join('')}
  </tbody></table><div class="legend"><span><i style="background:var(--cl)"></i>Achtelfinale</span><span><i style="background:var(--el)"></i>Play-offs</span><span><i style="background:var(--down)"></i>Ausgeschieden</span></div></div>
  <div><div class="md-nav" style="margin-bottom:4px"><button class="btn" data-act="emd:-1" aria-label="Vorheriger Spieltag">‹</button><b>${mdv+1}. Spieltag</b><button class="btn" data-act="emd:1" aria-label="Nächster Spieltag">›</button></div>
  <div class="matches">${(e.mds[mdv]||[]).map(m=>matchRow(m,false,ctxE(e,mdv))).join('')}</div></div></div>
  <p class="note" style="margin-top:12px">Startplätze: Platz 1–4 der fünf Top-Ligen in die Champions League, 5–6 in die Europa League, 7–8 in die Conference League. Die Sieger von Champions League und Europa League spielen nächste Saison Champions League, der Conference-League-Sieger Europa League. Die restlichen Plätze füllen echte Vereine aus anderen Ländern, die in der App ohne eigene Liga laufen.</p></div>`;
  return h;
}
function teamMatches(id){
  const out=[];
  const lg=S.leagues.find(l=>l.teams.includes(id));
  if(lg) lg.rounds.forEach((rd,i)=>rd.forEach(m=>{if(m.h===id||m.a===id) out.push({comp:lg.name,rd:(i+1)+'. Spieltag',m,done:i<lg.played,ord:i,ctx:ctxL(lg,i)})}));
  S.cups.forEach(c=>c.rounds.forEach((rd,k)=>rd.forEach(m=>{if(!m.bye&&(m.h===id||m.a===id)) out.push({comp:c.name,rd:ROUNDN(c.R,k),m,done:m.hg!=null&&k<c.played,cup:true,ctx:ctxC(c,k)})})));
  (S.euro||[]).forEach(e=>{e.mds.forEach((md,i)=>md.forEach(m=>{if(m.h===id||m.a===id) out.push({comp:e.name,rd:(i+1)+'. Spieltag',m,done:i<e.step,ctx:ctxE(e,i)})}));
    e.ko.forEach(r=>r.ties.forEach(x=>{if(x.a===id||x.b===id){out.push({comp:e.name,rd:r.name+(x.final?'':' Hin'),m:x.l1,done:true,ctx:ctxK(e,r,x.final?'':'Hinspiel')});if(x.l2)out.push({comp:e.name,rd:r.name+' Rück',m:x.l2,done:true,ctx:ctxK(e,r,'Rückspiel')})}}))});
  return out;
}
function res(m,id){if(m.hg==null)return '';const me=m.h===id?m.hg:m.ag,op=m.h===id?m.ag:m.hg;if(m.pen){const w=(m.pen[0]>m.pen[1])===(m.h===id);return w?'S':'N'}return me>op?'S':me<op?'N':'U'}
function favStrip(){
  const id=S.fav; if(!id||!T(id)) return '';
  const lg=S.leagues.find(l=>l.teams.includes(id));
  const tb=lg?table(lg):[],pos=tb.findIndex(r=>r.id===id)+1,row=tb[pos-1];
  const ms=teamMatches(id).filter(x=>!x.cup&&x.comp===(lg&&lg.name));
  const last=ms.filter(x=>x.done).slice(-5),next=ms.find(x=>!x.done);
  const lm=last[last.length-1];
  const opp=m=>m.h===id?T(m.a).name+' (H)':T(m.h).name+' (A)';
  return `<button class="fav" data-act="area:fav"><span class="star">★</span><span class="fn"><b>${esc(T(id).name)}</b><small>${lg?esc(lg.name)+(row&&row.sp?` · ${pos}. Platz · ${row.p} Pkt`:''):'ohne Liga'}</small></span>
  <span class="form">${last.map(x=>`<i class="f-${res(x.m,id)}">${res(x.m,id)}</i>`).join('')}</span>
  <span class="fn fl"><small>Zuletzt</small><b>${lm?`${lm.m.h===id?lm.m.hg+':'+lm.m.ag:lm.m.ag+':'+lm.m.hg} gegen ${esc(opp(lm.m))}`:'–'}</b></span>
  ${(S.offers||[]).filter(o=>T(id).sq&&T(id).sq.includes(o.pid)).length?`<span class="badge">${(S.offers||[]).filter(o=>T(id).sq.includes(o.pid)).length} Angebot(e)</span>`:''}
  <span class="fn"><small>Als Nächstes</small><b>${next?esc(opp(next.m)):'Saison beendet'}</b></span></button>`;
}
function squadCard(id,own){
  const sq=ensureSquad(id).slice().sort((a,b)=>POS.indexOf(P()[a].p)-POS.indexOf(P()[b].p)||P()[b].s-P()[a].s);
  const real=sq.some(pid=>P()[pid].real);
  return `<div class="card"><div class="hd"><h3 class="ct" style="margin:0">Kader <span class="meta">${sq.length} Spieler · Ø ${(sq.reduce((a,pid)=>a+P()[pid].a,0)/sq.length).toFixed(1)} Jahre</span></h3><span class="tag${real?' real':''}">${real?'Echte Namen':'Erzeugter Kader'}</span></div>
  <div class="scroll"><table class="sqt"><thead><tr><th class="l">Pos.</th><th class="l">Spieler</th><th>Alter</th><th>Stärke</th>${own?'<th>Form</th>':''}<th>Vertrag</th><th>Gehalt</th><th>Marktwert</th><th></th></tr></thead><tbody>
  ${sq.map(pid=>{const p=P()[pid];ensureContract(pid,id);const watch=S.fav&&!own&&id!==S.fav;const sc=S.scout&&S.scout.list[pid];
    const ren=own&&p.c<=S.season?(()=>{const o=renewalOffer(pid);return [1,2,3,4,5].filter(y=>y<=o.maxY&&(y===1||y===o.maxY||y===3)).map(y=>`<button class="btn sm" data-act="renew:${pid}:${y}" title="Neues Gehalt ${money(o.w)} pro Jahr">+${y} J.</button>`).join('')})():'';
    return `<tr class="${p.inj?'gone':''}"><td class="l"><span class="pos-${p.p}">${p.p}</span></td><td class="l team">${esc(p.n)}${playerBadges(p)}</td><td>${p.a}</td><td>${p.s.toFixed(1)}</td>${own?`<td>${formLbl(p.fo||0)}</td>`:''}<td>${p.c}/${String(p.c+1).slice(2)}</td><td>${money(p.w)}</td><td>${money(value(pid))}</td><td class="l">${own?`${ren}<button class="btn sm" data-act="sell:${pid}">Verkaufen</button>`:watch?`<button class="btn sm${sc?' pri':''}" data-act="${sc?'unwatch':'watch'}:${pid}" title="${sc?'Beobachtung beenden':'Von deinen Scouts beobachten lassen'}">👁</button>`:''}</td></tr>`}).join('')}
  </tbody></table></div>
  <details class="imp"><summary>Echten Kader einfügen</summary><p class="note">Kopiere den Kader z. B. von fussball.de (Reiter „Mannschaft“) oder der Vereinsseite: ein Spieler pro Zeile, Positions-Überschriften wie „Torwart“, „Abwehr“, „Mittelfeld“, „Sturm“ werden erkannt, ebenso das Alter in Klammern. Die Spielstärke des Vereins bleibt gleich.</p>
  <textarea id="sqTxt" placeholder="Torwart&#10;Max Mustermann (27)&#10;Abwehr&#10;…"></textarea><button class="btn pri" style="margin-top:8px" data-act="simport" onclick="view.sqTeam='${id}'">Kader übernehmen</button></details></div>`;
}
function renderFav(){
  const id=S.fav;
  if(!id||!T(id)){
    const bl=L('bl');
    return `<div class="card"><div class="hd"><div><div class="meta">Mein Verein</div><h2>Wähle deinen Verein</h2></div></div><p class="note">Tippe einen Verein an, oder suche links nach jedem anderen Verein von der Bundesliga bis zur Kreisliga. Auf der Vereinsseite wählst du dann „Als Mein Verein beobachten“.</p>
    <div class="chips" style="margin-top:12px">${bl.teams.map(t=>`<button class="chip" data-act="fav:${t}">${esc(T(t).name)}</button>`).join('')}</div></div>`;
  }
  initBudget();
  const t=T(id),lg=S.leagues.find(l=>l.teams.includes(id)),ft=view.ftab||'ov',f=FV();
  const tb=lg?table(lg):[],pos=tb.findIndex(r=>r.id===id)+1,row=tb[pos-1]||{};
  const wo=windowOpen();
  let h=`<div class="card favhead"><div class="hd"><div><div class="meta">Mein Verein${lg?' · '+esc(lg.name):''}</div><h2>★ ${esc(t.name)}</h2></div>
</div>
    <div class="facts">${teamFormHTML(id)}<div><small>Tabellenplatz</small><b>${pos?pos+'. · '+(row.p||0)+' Pkt':'–'}</b></div><div><small>Spielstärke</small><b>${t.r.toFixed(1)}</b></div><div><small>Kaderwert</small><b>${money(clubValue(id))}</b></div><div><small>Transferbudget</small><b>${money(bud(id))}</b></div><div><small>Kontostand</small><b class="${FZ(id).c<0?'no':''}">${FZ(id).c<0?'−':''}${money(Math.abs(FZ(id).c))}</b></div><div><small>Transferfenster</small><b class="${wo?'ok':'no'}">${wo?'Offen':'Geschlossen'}</b></div></div>
    <label class="tog" for="autoTr"><input type="checkbox" id="autoTr" ${favAuto()?'checked':''} data-act="auto"> Vereinsführung kauft und verkauft automatisch, wenn das Fenster offen ist</label></div>`;
  if(ft==='ov'){
    const ms=teamMatches(id),done=ms.filter(x=>x.done),next=ms.filter(x=>!x.done&&!x.cup).slice(0,5);
    const around=pos?tb.slice(Math.max(0,pos-4),pos+3):[];
    const off=pos?Math.max(0,pos-4):0;
    h+=`<div class="grid2"><div class="card"><h3 class="ct">Tabelle${lg?' '+esc(lg.name):''}</h3><table><tbody>${around.map((r,i)=>`<tr class="${r.id===id?'hl':''}"><td class="pos l">${off+i+1}</td><td class="team">${tl(r.id)}</td><td>${r.sp}</td><td>${r.tf-r.tg>0?'+':''}${r.tf-r.tg}</td><td class="pts">${r.p}</td></tr>`).join('')}</tbody></table>${lg?`<button class="btn" style="margin-top:10px" data-act="lg:${lg.id}:${id}">Ganze Tabelle</button>`:''}</div>
    <div class="card"><h3 class="ct">Form</h3><div class="form big">${done.slice(-10).map(x=>`<i class="f-${res(x.m,id)}" title="${esc(x.comp)}">${res(x.m,id)}</i>`).join('')||'<span class="meta">Noch keine Spiele</span>'}</div>
    <h3 class="ct" style="margin-top:16px">Nächste Spiele</h3><div class="matches">${next.map(x=>`<div class="m"><span class="h">${tl(x.m.h)}</span>${x.ctx.canLive?`<button class="s mbtn golive" data-act="mt:${mref(x.m,x.ctx)}" title="90 Minuten live simulieren">▶ Live<small>${esc(x.rd.replace('. Spieltag','. Sp.'))}</small></button>`:`<span class="s open">${x.rd.replace('. Spieltag','.')}<small>${esc(x.comp)}</small></span>`}<span class="a">${tl(x.m.a)}</span></div>`).join('')||'<div class="empty">Keine Spiele mehr angesetzt.</div>'}</div></div></div>
    ${(()=>{const l=(S.tr||[]).filter(x=>x.from===id||x.to===id).slice(0,6);return l.length?`<div class="card"><div class="hd"><h3 class="ct" style="margin:0">Neueste Transfers</h3><button class="btn sm" data-act="ftab:fin">Alle</button></div><table><tbody>${l.map(x=>`<tr><td class="l meta">${x.s}/${String(x.s+1).slice(2)}</td><td class="l"><span class="pos-${x.p}">${x.p}</span></td><td class="l team">${esc(x.n)}</td><td class="l team">${x.to===id?'← '+tl(x.from):'→ '+tl(x.to)}</td><td class="${x.to===id?'no':'ok'}">${x.free?'ablösefrei':(x.to===id?'−':'+')+money(x.fee)}</td></tr>`).join('')}</tbody></table></div>`:''})()}
    <div class="card"><h3 class="ct">Letzte Ergebnisse</h3><div class="matches">${done.slice(-8).reverse().map(x=>`<div class="m"><span class="h">${tl(x.m.h)}</span>${score(x.m)}<span class="a">${tl(x.m.a)}</span></div>`).join('')||'<div class="empty">Noch keine Spiele.</div>'}</div></div>
    <div class="stages">${S.cups.filter(c=>c.teams.includes(id)).concat((S.euro||[]).filter(e=>e.teams.includes(id))).map(c=>{const r=c.type==='euro'?euroReach(c,id):(c.played?cupReach(c,id):'1. Runde');const out=c.type==='euro'?(c.step>c.nmd&&r!=='Sieger'&&!(c.ko[c.ko.length-1].ties.some(x=>x.w===id))):(c.played&&r!=='Sieger'&&!c.rounds[c.played]?.some(m=>m.h===id||m.a===id));return `<button class="stage" data-act="${c.type==='euro'?'euro':'cup'}:${c.id}"><small>${esc(c.name)}</small><b>${esc(r)}${out&&!c.winner?' · ausgeschieden':''}</b></button>`}).join('')}</div>`;
  }
  if(ft==='kader'||ft==='ov'){
    const off=(S.offers||[]).filter(o=>T(S.fav).sq.includes(o.pid));
    if(off.length) h+=`<div class="card offer"><h3 class="ct">Angebote für deine Spieler</h3>${(S.offers||[]).map((o,i)=>T(S.fav).sq.includes(o.pid)?`<div class="orow"><span><b>${esc(T(o.club).name)}</b> bietet <b>${money(o.amt)}</b> für ${esc(P()[o.pid].n)} <span class="meta">(${P()[o.pid].p}, ${P()[o.pid].a} J., Marktwert ${money(value(o.pid))})</span></span><span class="ctrls"><button class="btn sm pri" data-act="oacc:${i}">Annehmen</button><button class="btn sm" data-act="odec:${i}">Ablehnen</button></span></div>`:'').join('')}</div>`;
  }
  if(ft==='scout') h+=renderScout(id);
  if(ft==='ov'){const sq=ensureSquad(id).map(pid=>[pid,P()[pid]]).filter(x=>x[1]);const inj=sq.filter(x=>x[1].inj),exp=sq.filter(x=>x[1].c!=null&&x[1].c<=S.season);
    if(inj.length||exp.length)h+=`<div class="card"><h3 class="ct">Ausfälle & Verträge</h3>${inj.map(([pid,p])=>`<div class="orow"><span>🚑 <b>${esc(p.n)}</b> <span class="meta">${POSN[p.p]} · ${esc(p.it||'verletzt')} · noch ${p.inj} ${p.inj===1?'Spiel':'Spiele'}</span></span></div>`).join('')}${exp.map(([pid,p])=>{const o=renewalOffer(pid);return `<div class="orow"><span>📄 <b>${esc(p.n)}</b> <span class="meta">Vertrag endet ${S.season}/${String(S.season+1).slice(2)} · fordert ${money(o.w)}/Jahr${favAuto()?' · sonst entscheidet die Vereinsführung':' · sonst ablösefrei weg'}</span></span><span class="ctrls">${[1,o.maxY>=3?3:null,o.maxY>=5?5:null].filter(Boolean).map(y=>`<button class="btn sm" data-act="renew:${pid}:${y}">+${y} J.</button>`).join('')}</span></div>`}).join('')}</div>`}
  if(ft==='kader'){
    if(view.offer){const o=view.offer;h+=`<div class="card offer"><b>${esc(T(o.club).name)}</b> bietet <b>${money(o.amt)}</b> für ${esc(P()[o.pid].n)} (Marktwert ${money(value(o.pid))}).<div class="ctrls" style="margin-top:8px"><button class="btn pri" data-act="accept">Annehmen</button><button class="btn" data-act="decline">Ablehnen</button></div></div>`}
    h+=squadCard(id,true);
  }
  if(ft==='markt'){
    const lgs=S.leagues.slice().sort((a,b)=>(a.foreign-b.foreign)||a.level-b.level);
    const sel=view.mlg&&L(view.mlg)?view.mlg:(lg?lg.id:'bl');
    const ml=L(sel),fp=view.mpos||'',maxp=+view.mmax||0;
    let rows=[];ml.teams.filter(x=>x!==id).forEach(tid=>ensureSquad(tid).forEach(pid=>rows.push({pid,tid})));
    rows=rows.filter(r=>(!fp||P()[r.pid].p===fp)).map(r=>({...r,fee:Math.round(value(r.pid)*1.25/1e3)*1e3})).filter(r=>!maxp||r.fee<=maxp).sort((a,b)=>P()[b.pid].s-P()[a.pid].s).slice(0,80);
    h+=`<div class="card"><div class="hd"><h3 class="ct" style="margin:0">Transfermarkt</h3><span class="tag">Budget ${money(bud(id))}</span></div>
    <div class="form"><label for="mLg">Liga<select id="mLg">${lgs.map(l=>`<option value="${l.id}"${l.id===sel?' selected':''}>${esc(l.name)}</option>`).join('')}</select></label>
    <label for="mPos">Position<select id="mPos"><option value="">Alle</option>${POS.map(p=>`<option value="${p}"${p===fp?' selected':''}>${POSN[p]}</option>`).join('')}</select></label>
    <label for="mMax">Höchstens<select id="mMax"><option value="0">Egal</option>${[5e4,2e5,1e6,5e6,2e7,5e7].map(v=>`<option value="${v}"${v===maxp?' selected':''}>${money(v)}</option>`).join('')}<option value="${bud(id)}"${maxp===bud(id)?' selected':''}>Mein Budget</option></select></label></div>
    ${wo?'':'<p class="note" style="margin-top:10px">Das Transferfenster ist geschlossen. Es öffnet am Saisonende, an den ersten vier Spieltagen und rund um die Winterpause.</p>'}
    <div class="scroll" style="margin-top:12px"><table><thead><tr><th class="l">Pos.</th><th class="l">Spieler</th><th class="l">Verein</th><th>Alter</th><th>Stärke</th><th>Ablöse</th><th></th></tr></thead><tbody>
    ${rows.map(r=>{const p=P()[r.pid];return `<tr><td class="l"><span class="pos-${p.p}">${p.p}</span></td><td class="l team">${esc(p.n)}</td><td class="l team">${tl(r.tid)}</td><td>${p.a}</td><td>${p.s.toFixed(1)}</td><td>${money(r.fee)}</td><td class="l"><button class="btn sm${S.scout&&S.scout.list[r.pid]?' pri':''}" data-act="${S.scout&&S.scout.list[r.pid]?'unwatch':'watch'}:${r.pid}" title="Beobachten">👁</button> <button class="btn sm${r.fee>bud(id)||!wo?'':' pri'}" data-act="buy:${r.pid}:${r.tid}">Kaufen</button></td></tr>`}).join('')}
    </tbody></table></div><p class="note" style="margin-top:8px">Ablöse = Marktwert + 25 %. Starke Spieler lehnen Wechsel in Ligen ab, die mehr als zwei Stufen tiefer liegen. Neue Spieler ändern sofort die Spielstärke deines Vereins (Ø der besten Elf im 4-4-2).</p></div>`;
  }
  if(ft==='fin'){
    h+=finPanel(id,true)+clubTransfers(id);
  }
  return h;
}
