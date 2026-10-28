const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(800);
const N=+process.argv[2]||30;
for(let i=0;i<N;i++){const r=await p.evaluate(()=>{const a=performance.now();sim(99);newSeason();const ms=performance.now()-a;
  const by={};let nan=0;S.leagues.forEach(l=>l.teams.forEach(id=>{const z=T(id).fz;if(!z||!z.h[0])return;const h=z.h[0];if(!isFinite(h[3])||!isFinite(z.c))nan++;const k=l.foreign?'F':l.level;(by[k]=by[k]||[]).push([h[3]/Math.max(1,h[1]),z.d/Math.max(1,h[1]),z.c/Math.max(1,h[1])])}));
  const med=a=>{a=a.slice().sort((x,y)=>x-y);return +(a[a.length>>1]).toFixed(2)};
  const sum={};for(const k in by){const a=by[k];sum[k]=[med(a.map(x=>x[0])),med(a.map(x=>x[1])),med(a.map(x=>x[2])),a.filter(x=>x[1]>0.05).length+'/'+a.length]}
  const fl=(S.flog||[]).filter(x=>x.s===S.season-1);
  return {s:S.season,ms:Math.round(ms),nan,ins:fl.filter(x=>x.t==="ins").length,fs:S.fsale,inv:fl.filter(x=>x.t==='inv').length,out:fl.filter(x=>x.t==='out').length,sum:JSON.stringify(sum),ex:fl.slice(0,2).map(x=>x.txt)}});
 if(i<3||i%5==4)console.log(JSON.stringify(r))}
console.log(errs.slice(0,5));await b.close()})();
