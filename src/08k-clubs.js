// ---------- Vereinsleben: Neugründungen & Auflösungen ----------
// In den untersten Ligen entstehen jedes Jahr neue Vereine, andere melden ab (Spielermangel, Schulden, Zweitvertretungen ohne Kader)
function bottomLeaguesNow(){const ups=new Set(S.leagues.map(l=>l.up||(PRESETS.find(p=>p.name===l.name)||{}).up).filter(Boolean));
  return S.leagues.filter(l=>!l.foreign&&l.level>=8&&!ups.has(l.name))}
const NEW_PRE=['FC','SV','SC','TSV','SG','FSV','1. FC','SpVgg','Sportfreunde','Inter','Kickers','Union','Dynamo','Eintracht','Fortuna'];
const NEW_STOP=new Set(['Land','Kreis','Stadt','Nord','Süd','West','Ost','Mitte','Klasse','Liga','Staffel','Gruppe','Kreisliga','Kreisklasse','Bezirk','Berlin']);
function newClubName(l){const pool=[];l.teams.forEach(id=>{const t=T(id);if(t)townTokens(resBase(t.name)).forEach(w=>{if(/^[A-ZÄÖÜ][a-zäöüß]/.test(w)&&!NEW_STOP.has(w))pool.push(w)})});
  if(!pool.length)return null;
  const used=new Set(Object.values(S.teams).filter(t=>!t.gone).map(t=>t.name));
  for(let k=0;k<12;k++){const town=rnd(pool),pre=rnd(NEW_PRE),f=Math.random();
    const n=f<.55?`${pre} ${town}`:f<.75?`${pre} ${town} ${S.season+1}`:f<.88?`${town} United`:`FC ${town}er Kickers`;
    if(!used.has(n)&&!isRes(n)){newClubName.town=town;return n}}
  return null}
function dissolveTeam(id,l,why,log){const t=T(id);l.teams=l.teams.filter(x=>x!==id);t.gone=S.season;t.goneWhy=why;
  (t.sq||[]).forEach(pid=>{delete P()[pid]});t.sq=[];const z=t.fz;if(z&&z.own&&S.inv&&S.inv[z.own])S.inv[z.own].club=null;
  if(S.parked)S.parked=S.parked.filter(x=>x.id!==id);log.push(`Abmeldung: ${t.name} (${l.name}) – ${why}`);clubEv('weg',id,l,why)}
function clubEv(k,id,l,why){(S.clubEv=S.clubEv||[]).unshift({s:S.season,k,id,n:T(id).name,lg:l.name,lv:l.level,vb:T(id).vb||l.vb,why});if(S.clubEv.length>3000)S.clubEv.length=3000}
function foundWhy(l,name){const town=newClubName.town||'dem Ort',others=l.teams.filter(id=>T(id)&&!isRes(T(id).name)&&T(id).name!==name),o=others.length?T(rnd(others)).name:null;
  const r=[`Junge Fußballer aus ${town} wollten endlich ihren eigenen Verein`,`Eine Freizeitmannschaft aus ${town} meldet sich zum Spielbetrieb an`,`Ein Unternehmer aus der Region gründet den Verein und stellt den Sportplatz`,`Nach Jahren ohne Fußball in ${town} wird wieder ein Verein gegründet`];
  if(o)r.push(`Abspaltung: Unzufriedene Spieler von ${o} gründen einen eigenen Verein`,`Ehemalige Spieler von ${o} wollen in ${town} etwas Eigenes aufbauen`);return rnd(r)}
function clubLifecycle(st,log){const bl=bottomLeaguesNow(),gone=[],born=[];
  const keep=new Set([S.fav,S.career&&S.career.club].filter(Boolean));
  for(const l of bl){const ord=(st[l.id]||[]).filter(x=>l.teams.includes(x)),n=l.teams.length,tgt=l.tgt||l.size||n;
    // Auflösung: Tabellenende, verschuldet oder Zweitvertretung ohne genug Spieler
    if(n>=8){const cands=ord.slice(-2).filter(id=>!keep.has(id)&&!(T(id).fnd&&S.season-T(id).fnd<3));
      for(const id of cands){const t=T(id),z=t.fz,res=isRes(t.name),debt=z&&z.d>0;
        let q=.008+(res?.012:0)+(debt?.03:0)+(n>tgt?.015:0)-(n<tgt-1?.008:0);
        if(Math.random()<q){const why=res?'die Zweitvertretung wird mangels Spielern abgemeldet':debt?'Schulden und Spielermangel – der Verein löst sich auf':'zu wenige Spieler – der Verein zieht seine Mannschaft zurück';
          dissolveTeam(id,l,why,log);gone.push([id,l]);break}}}
    // Neugründung
    let q=.04+(l.teams.length<tgt?.04:0)-(l.teams.length>tgt?.02:0);if(l.teams.length>=20)q=0;
    if(Math.random()<q){const name=newClubName(l);if(!name)continue;const vb=l.vb||l.vbs&&l.vbs[0];const id=addTeam(name,vb,+((BASE[l.level]||17)-1.5+Math.random()*2-1).toFixed(1));
      T(id).fnd=S.season+1;l.teams.push(id);born.push([id,l]);log.push(`Neugründung: ${name} startet in der ${l.name}`);clubEv('neu',id,l,foundWhy(l,name))}}
  // Nachrichten
  const near=S.fav&&lgOf(S.fav);const mine=x=>near&&x[1]===near;
  [...gone.filter(mine),...born.filter(mine)].forEach(([id,l])=>{const t=T(id);try{addNews({cat:'fav',clubs:[S.fav],h:t.gone?`${t.name} meldet ab`:`Neuer Gegner: ${t.name}`,b:t.gone?`${t.name} ${t.goneWhy}. Die ${l.name} spielt nächste Saison ohne den Verein.`:`In der ${l.name} gibt es nächste Saison einen neuen Verein: ${t.name} wurde gegründet und steigt ganz unten ein.`,imp:2})}catch(e){}});
  if(gone.length||born.length)try{addNews({cat:'de',h:`Vereinsleben: ${born.length} Neugründungen, ${gone.length} Abmeldungen`,b:`In den untersten Spielklassen ${born.length===1?'wurde ein neuer Verein':`wurden ${born.length} neue Vereine`} gegründet${born.length?` (u. a. ${born.slice(0,3).map(x=>T(x[0]).name).join(', ')})`:''}. ${gone.length?`${gone.length} ${gone.length===1?'Mannschaft zieht':'Mannschaften ziehen'} sich zurück${` (u. a. ${gone.slice(0,3).map(x=>T(x[0]).name).join(', ')})`}.`:''}`,imp:1})}catch(e){}
  return {born:born.length,gone:gone.length}}

// ---------- Vertragsgespräche (Mein Verein, Vertragsspieler) ----------
const NROLE=['persp','erg','rot','stamm','star'];
function negWants(pid){const p=P()[pid],t=T(S.fav),o=renewalOffer(pid);if(!p||!o||o.no)return null;const early=p.c!=null&&p.c>S.season;
  const w=Math.round(o.w*(early?1.06:1)/100)*100,y=p.a<=23?(p.s>=t.r+3?2:4):p.a<=28?4:p.a<=31?2:1;
  const r=p.s>=t.r+3&&p.a>=22?'star':p.s>=t.r-1?'stamm':p.a<=21?'persp':'rot';return {w,y:Math.min(y,o.maxY||y),r,maxY:Math.max(1,o.maxY||1)}}
function negOpen(pid){const p=P()[pid];if(!p||!S.fav||isAmClub(S.fav))return 'Amateurspieler haben keinen Vertrag.';if(p.c==null)ensureContract(pid,S.fav);
  if(p.nb&&S.day-p.nb<28)return `${p.n} will gerade nicht über einen neuen Vertrag sprechen.`;
  if(hpOf(p)<30)return `${p.n} ist zu unzufrieden und lehnt Gespräche über eine Verlängerung ab.`;
  if(p.c-S.season>=3)return `${p.n} hat noch einen langen Vertrag – er sieht keinen Grund für Gespräche.`;
  const wt=negWants(pid);if(!wt)return `${p.n} will nicht verlängern.`;const cur=roles()[pid]||'erg';
  view.ov={t:'neg',pid,wt,pa:hpOf(p)>=70?4:3,pa0:hpOf(p)>=70?4:3,o:{w:Math.round(wt.w*.9/500)*500||wt.w,y:wt.y,r:NROLE.indexOf(cur)>=NROLE.indexOf(wt.r)?cur:cur,hg:0},msg:`${p.n} und sein Berater sitzen dir gegenüber. Sie fordern rund ${money(wt.w)} pro Jahr über ${wt.y} ${wt.y===1?'Jahr':'Jahre'} und eine Rolle als ${ROLE[wt.r][0]}.`,cur};return ''}
function negScore(o,wt,p){const ri=NROLE.indexOf(o.r),wi=NROLE.indexOf(wt.r);
  return o.w/wt.w+o.hg/(wt.w*2)-Math.abs(o.y-wt.y)*.04+(ri<wi?(ri-wi)*.08:Math.min(2,ri-wi)*.03)+(hpOf(p)-60)/400}
function negOffer(){const n=view.ov,p=P()[n.pid],t=T(S.fav),z=FZ(S.fav);if(!n||!p)return;const o=n.o,wt=n.wt;
  if(o.hg>0&&z&&z.c<o.hg){n.msg='Für dieses Handgeld reicht der Kontostand nicht.';return}
  const sc=negScore(o,wt,p);
  if(sc>=1){const old=p.w;p.c=S.season+o.y;p.w=o.w;if(o.hg&&z){z.c-=o.hg}p.nb=null;
    const ri=NROLE.indexOf(o.r),ci=NROLE.indexOf(n.cur);if(ri>ci&&ri>=3)p.pr={until:S.day+84};
    p.hp=Math.min(100,hpOf(p)+8+(sc>=1.1?4:0));t.mo=Math.min(100,(t.mo??60)+1);recalc(S.fav);
    try{addNews({cat:'fav',clubs:[S.fav],h:`${p.n} verlängert bis ${S.season+o.y+1}`,b:`${p.n} unterschreibt einen neuen Vertrag über ${o.y} ${o.y===1?'Jahr':'Jahre'}: ${money(o.w)} pro Jahr${o.hg?`, ${money(o.hg)} Handgeld`:''}${ri>ci&&ri>=3?`, zugesicherte Rolle als ${ROLE[o.r][0]}`:''}.`,imp:2})}catch(e){}
    view.ov=null;save();toast(`${p.n} unterschreibt bis ${S.season+o.y+1}${old?` (${o.w>=old?'+':'−'}${money(Math.abs(o.w-old))}/Jahr)`:''}`);return}
  n.pa-=sc<.8?2:1;
  if(n.pa<=0){p.nb=S.day;p.hp=Math.max(0,hpOf(p)-8);view.ov=null;save();toast(`Gespräch gescheitert: ${p.n} bricht die Verhandlungen ab`);
    try{addNews({cat:'fav',clubs:[S.fav],h:`Vertragspoker: ${p.n} bricht Gespräche ab`,b:`Die Verhandlungen mit ${p.n} sind vorerst gescheitert. ${p.c<=S.season?'Läuft der Vertrag aus, ist er im Sommer ablösefrei weg.':''}`,imp:2})}catch(e){}return}
  if(sc<.8){p.hp=Math.max(0,hpOf(p)-3);n.msg=`Der Berater schüttelt den Kopf: „Das ist respektlos.“ Unter ${money(Math.round(wt.w*.9/100)*100)} brauchen wir gar nicht weiterzureden.`;return}
  // Gegenangebot: was fehlt?
  const gap=1-sc,needW=Math.round((o.w+gap*wt.w)/500)*500,ri=NROLE.indexOf(o.r),wi=NROLE.indexOf(wt.r);const tips=[];
  if(ri<wi)tips.push(`die Rolle als ${ROLE[wt.r][0]}`);if(o.y!==wt.y)tips.push(`${wt.y} ${wt.y===1?'Jahr':'Jahre'} Laufzeit`);
  n.msg=`Nah dran. ${p.n} würde für ${money(needW)} pro Jahr unterschreiben${tips.length?` – oder ihr kommt ihm entgegen bei ${tips.join(' und ')}`:''}. Ein Handgeld hilft auch.`}
function negHTML(n){const p=P()[n.pid],wt=n.wt,o=n.o,z=FZ(S.fav);if(!p)return '';const sc=negScore(o,wt,p);
  const hgOpts=[0,.1,.25,.5].map(f=>Math.round(wt.w*f/500)*500);
  const mood=sc>=1?['ok','Er würde unterschreiben']:sc>=.9?['','Knapp – fast überzeugt']:sc>=.8?['','Noch ein Stück entfernt']:['no','Weit auseinander'];
  return `<div class="ovc"><div class="facts"><div><small>Aktuell</small><b>${p.w?money(p.w):'–'}</b><span class="meta">bis ${p.c}/${String(p.c+1).slice(2)}</span></div><div><small>Marktwert</small><b>${money(value(n.pid))}</b></div>
    <div><small>Forderung</small><b>${money(wt.w)}</b><span class="meta">${wt.y} J. · ${ROLE[wt.r][0]}</span></div><div><small>Geduld</small><b>${'●'.repeat(Math.max(0,n.pa))}${'○'.repeat(Math.max(0,n.pa0-n.pa))}</b><span class="meta">${happyLbl(p)} ${Math.round(hpOf(p))}/100</span></div></div>
   <p class="note neg-msg">💬 ${esc(n.msg)}</p>
   <h4>Gehalt pro Jahr: <b>${money(o.w)}</b></h4><div class="seg crseg">${[-10,-5,-1,1,5,10].map(d=>`<button data-act="ngw:${d}">${d>0?'+':''}${d} %</button>`).join('')}</div>
   <h4>Laufzeit</h4><div class="seg crseg">${[1,2,3,4,5].map(y=>`<button class="${o.y===y?'on':''}" data-act="ngy:${y}"${y>Math.max(wt.maxY,wt.y)+1?' disabled':''}>${y} J.</button>`).join('')}</div>
   <h4>Rolle zusichern</h4><div class="seg crseg">${NROLE.map(r=>`<button class="${o.r===r?'on':''}" data-act="ngr:${r}">${ROLE[r][0]}</button>`).join('')}</div>
   <h4>Handgeld</h4><div class="seg crseg">${hgOpts.map(v=>`<button class="${o.hg===v?'on':''}" data-act="ngh:${v}"${z&&v>z.c?' disabled':''}>${v?money(v):'keins'}</button>`).join('')}</div>
   <p class="note" style="margin-top:10px"><span class="${mood[0]}">●</span> Stimmung am Tisch: <b>${mood[1]}</b>. Eine zugesicherte Rolle als Stamm- oder Führungsspieler musst du halten, sonst wird er unzufrieden. Das Handgeld wird sofort vom Konto abgebucht.</p>
   <div class="crrow"><button class="btn" data-act="ngx">Gespräch beenden</button><button class="btn pri" data-act="ngo">Angebot machen</button></div></div>`}
function negAct(k,v){const n=view.ov;if(!n||n.t!=='neg')return;const o=n.o;
  if(k==='ngw')o.w=Math.max(500,Math.round(o.w*(1+(+v)/100)/100)*100);
  else if(k==='ngy')o.y=+v;else if(k==='ngr')o.r=v;else if(k==='ngh')o.hg=+v;
  else if(k==='ngo')negOffer();else if(k==='ngx'){view.ov=null}}

// ---------- Ansicht: Vereinsleben (Gründungen & Auflösungen) ----------
function clubEvAll(){if(!S.clubEv||!S.clubEv.length){const out=[];(S.log||[]).forEach(e=>(e.lines||[]).forEach(x=>{let m=x.match(/^Neugründung: (.+) startet in der (.+)$/);if(m){out.push({s:e.season,k:'neu',n:m[1],lg:m[2],why:'Neugründung'});return}
  m=x.match(/^Abmeldung: (.+) \((.+)\) – (.+)$/);if(m)out.push({s:e.season,k:'weg',n:m[1],lg:m[2],why:m[3]})}));if(out.length)S.clubEv=out}
  const ev=(S.clubEv||[]).slice();if(S.found&&S.fav&&T(S.fav)&&!ev.some(x=>x.own))ev.push({s:S.found.season-1,k:'neu',id:S.fav,n:T(S.fav).name,lg:S.found.lg,vb:T(S.fav).vb,why:`Von dir gegründet (${S.found.mgr})`,own:1});return ev}
function renderClubLife(){const ev=clubEvAll(),f=view.vl||(view.vl={k:'all',s:'all',vb:'all',q:''});
  const seasons=[...new Set(ev.map(x=>x.s))].sort((a,b)=>b-a),vbs=[...new Set(ev.map(x=>x.vb).filter(Boolean))].sort((a,b)=>(VB[a]||a).localeCompare(VB[b]||b,'de'));
  const q=(f.q||'').toLowerCase();const list=ev.filter(x=>(f.k==='all'||x.k===f.k)&&(f.s==='all'||x.s===+f.s)&&(f.vb==='all'||x.vb===f.vb)&&(!q||(x.n+' '+x.lg).toLowerCase().includes(q)));
  const nNeu=list.filter(x=>x.k==='neu').length,nWeg=list.length-nNeu;
  const row=x=>{const lk=x.id&&T(x.id)?`<button class="tlink" data-act="club:${x.id}">${hasCrest(x.id)?crestMini(x.id):''}${esc(x.n)}</button>`:`<b>${esc(x.n)}</b>`;
    return `<div class="orow vlrow"><span class="vlk ${x.k==='neu'?'ok':'no'}">${x.k==='neu'?'＋':'－'}</span><span>${lk} <span class="meta">${x.k==='neu'?`gegründet zur Saison ${x.s+1}/${String(x.s+2).slice(2)}`:`abgemeldet nach der Saison ${x.s}/${String(x.s+1).slice(2)}`} · ${esc(x.lg)}${x.vb&&VB[x.vb]?' · '+esc(VB[x.vb]):''}</span><span class="vlwhy">${esc(x.why||'')}</span></span></div>`};
  return `<div class="card"><div class="hd"><div><div class="meta">Historie</div><h2>Vereinsleben</h2></div><span class="tag">${nNeu} gegründet · ${nWeg} abgemeldet</span></div>
   <p class="note">Jeden Sommer entstehen in den untersten Ligen neue Vereine, andere melden ihre Mannschaft ab – meist aus Spielermangel, wegen Schulden oder weil eine Zweitvertretung nicht mehr genug Spieler hat.</p>
   <div class="seg" style="margin-top:10px">${[['all','Alle'],['neu','Gründungen'],['weg','Abmeldungen']].map(([k,n])=>`<button class="${f.k===k?'on':''}" data-act="vlf:k:${k}">${n}</button>`).join('')}</div>
   <div class="crrow" style="margin-top:0"><label class="mfield">Saison<select id="vlS" class="search"><option value="all">Alle Spielzeiten</option>${seasons.map(s=>`<option value="${s}"${String(f.s)===String(s)?' selected':''}>Sommer ${s+1}</option>`).join('')}</select></label>
   <label class="mfield">Landesverband<select id="vlV" class="search"><option value="all">Alle</option>${vbs.map(v=>`<option value="${v}"${f.vb===v?' selected':''}>${esc(VB[v]||v)}</option>`).join('')}</select></label>
   <label class="mfield">Suche<input id="vlQ" class="search" value="${esc(f.q||'')}" placeholder="Verein oder Liga"></label></div></div>
   <div class="card">${list.length?list.slice(0,300).map(row).join('')+(list.length>300?`<p class="note">… und ${list.length-300} weitere – filtere nach Saison oder Verband.</p>`:''):'<p class="note">Noch keine Gründungen oder Abmeldungen – die ersten gibt es nach dem Ende der ersten Saison.</p>'}</div>`}
