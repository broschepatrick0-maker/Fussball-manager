// ---------- Hauptmenü: Weiterspielen, neue Karriere, freies Spiel, Speicherplätze, Einstellungen ----------
const MENU={metas:{},scr:'main',nw:{name:'',start:'zero',club:null,slot:null,q:''}};
function applyTheme(){let t='auto';try{t=localStorage.getItem('fp-theme')||'auto'}catch(e){}if(t==='auto')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=t}
async function readMetas(){for(const n of [1,2,3]){try{const k=n===1?'meta':`s${n}:meta`;let m=await DB.get(k);if(!m&&n===1){const st=await DB.get('state');if(st)m={season:st.season,round:st.round,mode:st.mode||'free',club:st.fav&&st.teams[st.fav]?st.teams[st.fav].name:null}}MENU.metas[n]=m||null}catch(e){MENU.metas[n]=null}}}
async function openMenu(scr){MENU.scr=scr||'main';await readMetas();view.ov={t:'menu'};render()}
function metaLine(m){if(!m)return '<span class="meta">Leer</span>';const mode=m.mode==='career'?'Karriere':'Freies Spiel';
  return `<b>${m.mgr?esc(m.mgr)+' · ':''}${m.club?esc(m.club):m.jobless?'ohne Verein':'kein Verein'}</b><span class="meta">${mode} · Saison ${sl2(m.season)}${m.round?' · '+m.round+'. Spieltag':''}${m.saved?' · gespeichert '+new Date(m.saved).toLocaleDateString('de-DE'):''}</span>`}
function menuHTML(){const scr=MENU.scr,cur=MENU.metas[SLOT];
  const back=`<button class="btn" data-act="mscr:main">‹ Zurück</button>`;
  if(scr==='main')return `<div class="menu"><div class="mhero">${svg(ICO.de,'mlogo')}<h1>Fußball-Pyramide</h1><p>Von der Kreisliga bis zur Champions League</p></div>
   <div class="mlist">
    ${cur?`<button class="mbtn pri" data-act="mcont"><span>Weiterspielen</span>${metaLine(cur)}</button>`:''}
    <button class="mbtn" data-act="mscr:new"><span>Neue Karriere</span><span class="meta">Als Trainer starten – mit Lizenzen, Vorstand und Jobangeboten</span></button>
    <button class="mbtn" data-act="mscr:free"><span>Freies Spiel</span><span class="meta">Ohne Karriere: jeden Verein beobachten und steuern</span></button>
    <button class="mbtn" data-act="mscr:slots"><span>Spielstände</span><span class="meta">Drei Speicherplätze laden, wechseln oder löschen</span></button>
    <button class="mbtn" data-act="mscr:set"><span>Einstellungen</span><span class="meta">Darstellung und Live-Tempo</span></button>
    <button class="mbtn" data-act="savev"><span>Sichern & Übertragen</span><span class="meta">Spielstand als Datei oder Text exportieren und importieren</span></button>
   </div></div>`;
  if(scr==='slots')return `<div class="menu"><div class="mhead">${back}<h2>Spielstände</h2></div><div class="mlist">${[1,2,3].map(n=>`<div class="mslot${n===SLOT?' on':''}"><div><span class="meta">Platz ${n}${n===SLOT?' · aktiv':''}</span>${metaLine(MENU.metas[n])}</div><div class="ctrls">${MENU.metas[n]?`<button class="btn sm pri" data-act="mload:${n}">${n===SLOT?'Fortsetzen':'Laden'}</button><button class="btn sm" data-act="mdel:${n}">Löschen</button>`:''}</div></div>`).join('')}</div></div>`;
  if(scr==='set'){let t='auto';try{t=localStorage.getItem('fp-theme')||'auto'}catch(e){}
    return `<div class="menu"><div class="mhead">${back}<h2>Einstellungen</h2></div><div class="mlist"><div class="mslot"><div><b>Darstellung</b><span class="meta">Hell, dunkel oder wie das Gerät</span></div><div class="seg" style="margin:0">${[['auto','Automatisch'],['light','Hell'],['dark','Dunkel']].map(([k,n])=>`<button class="${t===k?'on':''}" data-act="mtheme:${k}">${n}</button>`).join('')}</div></div>
     <div class="mslot"><div><b>Live-Tempo</b><span class="meta">Standard für Live-Spiele</span></div><div class="seg" style="margin:0">${SPEEDS.map(([k,,n])=>`<button class="${(S.liveSpeed||1)===k?'on':''}" data-act="mspeed:${k}">${n}</button>`).join('')}</div></div></div></div>`}
  // Neues Spiel (Karriere oder frei)
  const nw=MENU.nw,free=scr==='free',slots=[1,2,3];if(nw.slot==null)nw.slot=slots.find(n=>!MENU.metas[n])||SLOT;
  const modes=[['zero','Arbeitslos, ohne Lizenz','Du fängst bei null an: keine Lizenz, kein Ruf, 3.000 € auf dem Konto. Bewirb dich bei Kreisligisten und mach deinen Trainerschein.'],['pro','Ex-Profi','Nach der Spielerkarriere: B-Lizenz, etwas Ruf und 250.000 € Erspartes. Angebote bis zur Oberliga.'],['club','Wunschverein','Du übernimmst direkt einen Verein deiner Wahl, die passende Lizenz bekommst du dazu.']];
  const needClub=free||nw.start==='club';
  const q=(nw.q||'').toLowerCase();const hits=q.length>=2?Object.values(S.teams).filter(t=>t.name.toLowerCase().includes(q)&&lgOf(t.id)).slice(0,10):[];
  const sugg=hits.length?hits:['bl','bl2','l3'].map(L).filter(Boolean).map(l=>T(l.teams[Math.floor(Math.random()*l.teams.length)])).concat(S.leagues.filter(l=>l.level>=7&&!l.foreign).sort(()=>Math.random()-.5).slice(0,4).map(l=>T(l.teams[0])));
  return `<div class="menu"><div class="mhead">${back}<h2>${free?'Freies Spiel':'Neue Karriere'}</h2></div><div class="mlist">
   ${free?'':`<label class="mfield">Dein Name als Trainer<input id="mName" class="search" value="${esc(nw.name)}" placeholder="z. B. Max Mustermann" autocomplete="off"></label>
   <div class="mmodes">${modes.map(([k,n,d])=>`<button class="mbtn${nw.start===k?' pri':''}" data-act="mstart:${k}"><span>${n}</span><span class="meta">${d}</span></button>`).join('')}</div>`}
   ${needClub?`<label class="mfield">${free?'Verein (optional, jederzeit änderbar)':'Dein Verein'}<input id="mQ" class="search" value="${esc(nw.q)}" placeholder="Verein suchen …" autocomplete="off"></label>
   <div class="chips">${sugg.filter(Boolean).map(t=>`<button class="chip${nw.club===t.id?' on':''}" data-act="mclub:${t.id}">${esc(t.name)} <span class="meta">${esc((lgOf(t.id)||{}).name||'')}</span></button>`).join('')}</div>`:''}
   <div class="mslot"><div><b>Speicherplatz</b><span class="meta">${MENU.metas[nw.slot]?'Achtung: Der vorhandene Spielstand wird überschrieben':'Freier Platz'}</span></div><div class="seg" style="margin:0">${slots.map(n=>`<button class="${nw.slot===n?'on':''}" data-act="mslot:${n}">Platz ${n}${MENU.metas[n]?' ●':''}</button>`).join('')}</div></div>
   <button class="mbtn pri" data-act="mgo:${free?'free':'career'}"><span>${free?'Spiel starten':'Karriere starten'}</span><span class="meta">Eine neue Welt mit allen Ligen wird erstellt</span></button>
  </div></div>`}
async function menuAct(k,v){const nw=MENU.nw;
  if(k==='mscr'){MENU.scr=v;if(v==='new'||v==='free'){nw.club=null;nw.q=''}}
  else if(k==='mcont'){view.ov=null;view={tab:S.fav?'fav':'home',ftab:'ov'}}
  else if(k==='mstart'){readMenuInputs();nw.start=v}
  else if(k==='mclub'){readMenuInputs();nw.club=v}
  else if(k==='mslot'){readMenuInputs();nw.slot=+v}
  else if(k==='mtheme'){try{localStorage.setItem('fp-theme',v)}catch(e){}applyTheme()}
  else if(k==='mspeed'){S.liveSpeed=+v;save()}
  else if(k==='mload'){const n=+v;if(n!==SLOT){switchSlot(n);if(!(await loadAsync())){toast('Spielstand nicht gefunden');return}migrateLoaded()}view={tab:S.fav?'fav':'home',ftab:'ov'};view.ov=null;toast('Spielstand '+n+' geladen')}
  else if(k==='mdel'){const n=+v;if(!confirmTwice('del'+n)){toast('Zum Löschen nochmal tippen');return}const p=n===1?'':`s${n}:`;await Promise.all(['state','hist','meta'].map(x=>DB.del(p+x).catch(()=>{})));await readMetas();toast('Platz '+n+' gelöscht')}
  else if(k==='mgo'){readMenuInputs();if(v==='career'&&nw.start==='club'&&!nw.club){toast('Wähle zuerst deinen Verein');return}if(v==='career'&&!nw.name.trim()){toast('Gib deinen Namen ein');return}
    const clubName=nw.club&&T(nw.club)?T(nw.club).name:null;
    switchSlot(nw.slot);fresh();S.liveSpeed=S.liveSpeed||1;
    const club=clubName?Object.values(S.teams).find(t=>t.name===clubName&&lgOf(t.id)):null;
    if(v==='free'){S.mode='free';if(club){S.fav=club.id;ensureSquad(club.id);initBudget()}}
    else newCareer(nw.name.trim(),nw.start==='club'&&club?club.id:null,nw.start);
    save();view={tab:S.fav?'fav':(v==='career'?'fav':'home'),ftab:S.career&&!S.career.jobless?'karriere':'ov'};view.ov=null;toast(v==='free'?'Neues Spiel gestartet':`Willkommen, ${S.career.name}!`)}
  render()}
function readMenuInputs(){const a=document.getElementById('mName'),b=document.getElementById('mQ');if(a)MENU.nw.name=a.value;if(b)MENU.nw.q=b.value}
function confirmTwice(key){const now=Date.now();if(confirmTwice.k===key&&now-confirmTwice.t<3000){confirmTwice.k=null;return true}confirmTwice.k=key;confirmTwice.t=now;return false}
