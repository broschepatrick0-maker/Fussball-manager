const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(1000);
await p.evaluate(()=>{const id=Object.values(S.teams).find(t=>t.name==='SV BS 02 Sömmerda').id;act('fav:'+id)});
let t0=Date.now();for(let i=0;i<3;i++)await p.evaluate(()=>{let g=0;while(!S.done&&g++<420)simDay();newSeason()});console.log('3 Saisons ms',Date.now()-t0);
console.log(await p.evaluate(()=>{const byId={};Object.values(S.teams).forEach(t=>byId[t.name]=t.id);const st={};
 for(const tr of S.tr.slice(0,4000)){const a=tr.from,b=tr.to;if(!T(a)||!T(b))continue;const lv=lgOf(b)?(lgOf(b).foreign?1:lgOf(b).level):0;const k=lv<=3?'1-3':lv<=6?'4-6':lv===7?'7':'8+';const d=regDist(a,b);st[k]=st[k]||[0,0,0,0,0];st[k][d]++}
 const f=T(S.fav);const am=f.sq.filter(x=>P()[x].am).length;
 const favTr=S.tr.filter(t=>t.from===S.fav||t.to===S.fav).slice(0,6).map(t=>t.n+': '+T(t.from).name+' → '+T(t.to).name+' '+t.fee);
 return JSON.stringify({dist:st,favSq:f.sq.length,am,favTr,log:S.log[0].lines.filter(l=>l.includes('Sömmerda')).slice(0,4)},null,1)}));
console.log(errs.slice(0,3));await b.close()})();
