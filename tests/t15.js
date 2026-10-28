// Baden: Anlage, Duplikate, Auf-/Abstieg Oberliga BW <-> Verbandsliga <-> Landesliga <-> Kreisliga, Reserven
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(900);
const r=await p.evaluate(()=>{const out={};const ba=S.leagues.filter(l=>l.vb==='BA');out.ls=ba.map(l=>l.level+' '+l.name+':'+l.teams.length);
  const names={};Object.values(S.teams).forEach(t=>names[t.name]=(names[t.name]||0)+1);out.dup=Object.entries(names).filter(([n,c])=>c>1).map(x=>x[0]);
  out.ol=L(S.leagues.find(l=>l.name==='Oberliga Baden-Württemberg').id).vbs;
  const lines=[];for(let s=0;s<10;s++){sim(99);newSeason();lines.push(...S.log[0].lines.filter(x=>/Baden|Mittelbaden|Odenwald|Rhein-Neckar|Bruchsal|Karlsruhe|Pforzheim|Buchen|Mosbach|Heidelberg|Mannheim|Sinsheim|Südwest/.test(x)))}
  out.moves=lines.slice(0,14);out.after=S.leagues.filter(l=>l.vb==='BA').map(l=>l.name.replace(/^(Kreisliga|Landesliga) /,'')+':'+l.teams.length).join(', ');
  const ol=S.leagues.find(l=>l.name==='Oberliga Baden-Württemberg');out.olVb=[...new Set(ol.teams.map(id=>T(id).vb))].map(v=>v+':'+ol.teams.filter(id=>T(id).vb===v).length).join(' ');
  return out});
console.log(JSON.stringify(r,null,1));console.log(errs.slice(0,5));await b.close()})();
