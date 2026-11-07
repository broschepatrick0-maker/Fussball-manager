const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(1000);
await p.evaluate(()=>{S.tut=0;view.ov={t:'tut',i:0};render()});await p.waitForTimeout(100);
for(let i=0;i<4;i++){await p.click('[data-act^="tut:"].pri');await p.waitForTimeout(60)}
await p.screenshot({path:'/tmp/claude-0/-home-claude/fefefd0a-d0a2-5c84-8f2a-a9cae70994d7/scratchpad/tut.png'});
await p.click('[data-act="tut:x"].pri');await p.waitForTimeout(60);console.log('closed',await p.evaluate(()=>!view.ov&&S.tut===1));
// Haßfurt check: relegate test via townScore
console.log(await p.evaluate(()=>{const ks=S.leagues.filter(l=>/Kreisliga (Rhön|Schweinfurt)/.test(l.name));return ks.map(d=>d.name+':'+townScore('TV 1861 Haßfurt',d)).join(' | ')}));
console.log(errs);await b.close()})();
