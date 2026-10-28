// Regionale Treue: Anteil der Amateurvereine (Stufe 7/8), die nach N Saisons noch im Ursprungs-Bezirk spielen
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(800);
await p.evaluate(()=>{const up=n=>(PRESETS.find(x=>x.name===n)||{}).up;window.bz=l=>l.level===8?up(l.name):l.level===7?l.name:null;
  window.orig={};S.leagues.forEach(l=>{const z=bz(l);if(z)l.teams.forEach(id=>orig[id]=z)})});
const N=+process.argv[2]||40;
for(let i=1;i<=N;i++){const r=await p.evaluate(()=>{sim(99);newSeason();let ok=0,n=0;S.leagues.forEach(l=>{const z=bz(l);if(z)l.teams.forEach(id=>{if(orig[id]){n++;if(orig[id]===z)ok++}})});return {s:S.season,pur:+(ok/n*100).toFixed(1),n}});
 if(i%10==0)console.log(JSON.stringify(r))}
await b.close()})();
