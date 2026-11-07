const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(1000);
await p.evaluate(()=>{const id=Object.values(S.teams).find(t=>t.name==='SV BS 02 Sömmerda').id;act('fav:'+id)});
const m=()=>p.evaluate(()=>({mb:+(JSON.stringify(S).length/1e6).toFixed(1),pl:Object.keys(S.pl).length,sq:Object.values(S.teams).filter(t=>t.sq).length}));
console.log('start',JSON.stringify(await m()));
for(let i=0;i<3;i++){const t0=Date.now();const prof=await p.evaluate(()=>{const T0=performance.now();let g=0;while(!S.done&&g++<420)simDay();const T1=performance.now();newSeason();return [Math.round(T1-T0),Math.round(performance.now()-T1)]});console.log('saison',i+1,'sim/newSeason ms',prof.join('/'),JSON.stringify(await m()))}
console.log(errs.slice(0,3));await b.close()})();
