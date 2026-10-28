const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(900);
const r=await p.evaluate(()=>{const out=[];for(let s=0;s<3;s++){const t0=performance.now();sim(99);const ms=Math.round(performance.now()-t0);const c=SC().filter(x=>x.s===S.season);const by={};c.forEach(x=>by[x.k]=(by[x.k]||0)+1);
  out.push({s:S.season,ms,n:c.length,by,pts:c.reduce((a,x)=>a+x.pts,0),titles:c.filter(x=>x.title).map(x=>T(x.id).name+': '+x.title),news:NEWS().filter(n=>n.cat==='sg'&&n.s===S.season).length,ex:c.filter(x=>x.k==='wette'||x.k==='lizenz').slice(0,3).map(x=>T(x.id).name+' '+x.txt)});newSeason()}
 const x=SC()[0];return {out,last:x&&{n:T(x.id).name,lg:L(x.lg)&&L(x.lg).name}}});
console.log(JSON.stringify(r,null,1));
await p.evaluate(()=>{sim(20);const x=SC().find(z=>z.pts&&z.s===S.season)||SC()[0];act('lg:'+x.lg)});await p.waitForTimeout(300);
const c=await p.$$('.card');await c[c.length-1].screenshot({path:'/tmp/claude-0/-home-claude/fefefd0a-d0a2-5c84-8f2a-a9cae70994d7/scratchpad/sg.png'});console.log(errs);await b.close()})();
