const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(1000);
for(let i=0;i<4;i++)await p.evaluate(()=>{let g=0;while(!S.done&&g++<420)simDay();newSeason()});
const r=await p.evaluate(()=>{const ex=[];for(const [lid,a] of Object.entries(S.arch)){const e=a[0];e.rows.forEach((r,i)=>{if(r[8]==='up'&&i>=2&&ex.length<3)ex.push({lg:e.n,pos:i+1,t:T(r[0]).name,to:r[9],why:e.notes.filter(l=>l.includes(T(r[0]).name)).slice(0,2)})})}
 return {n:Object.keys(S.arch).length,len:Math.max(...Object.values(S.arch).map(a=>a.length)),mb:(JSON.stringify(S.arch).length/1e6).toFixed(2),ex}});
console.log(JSON.stringify(r,null,1));
await p.evaluate(()=>{const lg=S.leagues.find(l=>l.name==='Kreisliga Rhön')||L('rlno');act('lg:'+lg.id);act('lmode:arch');act('arch:1')});await p.waitForTimeout(200);
await p.screenshot({path:'/tmp/claude-0/-home-claude/fefefd0a-d0a2-5c84-8f2a-a9cae70994d7/scratchpad/ar.png',fullPage:false});
console.log(errs);await b.close()})();
