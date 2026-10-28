// Langzeit-Balance: Ø Teamstärke je Liga über viele Saisons
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.addInitScript(c=>{globalThis.YOUTH_C=c},process.argv[3]||'2.5');
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(800);
const N=+process.argv[2]||40;
for(let i=0;i<N;i++){const r=await p.evaluate(()=>{sim(99);newSeason();const o={};S.leagues.forEach(l=>{const k=l.foreign?'F':l.level;l.teams.forEach(id=>(o[k]=o[k]||[]).push(T(id).r))});
  const r={s:S.season};for(const k of ['1','2','3','4','5','6','7','8','F'])if(o[k])r[k]=+(o[k].reduce((a,b)=>a+b,0)/o[k].length).toFixed(1);
  const ps=Object.values(P()).map(x=>x.s);r.p=+(ps.reduce((a,b)=>a+b,0)/ps.length).toFixed(1);r.max=Math.max(...ps).toFixed(0);return r});
 if(i%5==4||i==0)console.log(JSON.stringify(r))}
await b.close()})();
