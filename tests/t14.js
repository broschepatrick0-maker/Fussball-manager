// Thüringer Kreisligen (Ebene 9): Anlage, Namenskollisionen, Auf-/Abstieg mit den Kreisoberligen
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(900);
const r=await p.evaluate(()=>{const out={};const kl=S.leagues.filter(l=>l.vb==='TH'&&l.level>=9);out.kl=kl.map(l=>l.name.replace('Kreisliga ','')+':'+l.teams.length);
  const names={};Object.values(S.teams).forEach(t=>names[t.name]=(names[t.name]||0)+1);out.dupNames=Object.entries(names).filter(([n,c])=>c>1).map(x=>x[0]).slice(0,10);
  out.dates=fmtDay(kl[0].dates[0])+' … '+fmtDay(kl[0].dates[kl[0].dates.length-1]);
  const lines=[];for(let s=0;s<3;s++){sim(99);act('newseason');lines.push(...S.log[0].lines.filter(x=>/Kreisliga (Eichsfeld|Erfurt|Jena|Mittel|Nord|Ost|Rhön|Süd|West)/.test(x)))}
  out.moves=lines.slice(0,8);out.nMoves=lines.length;
  out.after=S.leagues.filter(l=>l.vb==='TH'&&l.level>=8).map(l=>l.name.replace(/Kreis(ober)?liga /,m=>m.startsWith('Kreisober')?'KOL ':'KL ')+':'+l.teams.length).join(', ');
  return out});
console.log(JSON.stringify(r,null,1));console.log(errs.slice(0,5));await b.close()})();
