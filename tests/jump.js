const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(900);
await p.evaluate(()=>act('fav:'+L('bl').teams[5]));await p.evaluate(()=>act('jump'));await p.waitForTimeout(200);
await p.click('[data-act="jumpn:5"]');await p.waitForTimeout(100);await p.screenshot({path:'/tmp/claude-0/-home-claude/fefefd0a-d0a2-5c84-8f2a-a9cae70994d7/scratchpad/j1.png'});
const t0=Date.now();await p.click('[data-act="jumpgo"]');await p.waitForTimeout(8000);console.log(await p.evaluate(()=>JSON.stringify({run:JUMP.run,stop:JUMP.stop,ov:view.ov&&{t:view.ov.t,n:view.ov.n,done:view.ov.done},toast:(document.querySelector(".toast")||{}).textContent})));await p.screenshot({path:'/tmp/claude-0/-home-claude/fefefd0a-d0a2-5c84-8f2a-a9cae70994d7/scratchpad/j2.png'});
await p.waitForFunction(()=>!JUMP.run,null,{timeout:600000});const ms=Date.now()-t0;
const r=await p.evaluate(()=>({season:S.season,size:Math.round(JSON.stringify(S).length/1e6*10)/10,teams:Object.keys(S.teams).length,pl:Object.keys(S.pl||{}).length,news:NEWS().length,bl:L('bl').teams.slice(0,4).map(id=>T(id).name),tab:view.tab}));
console.log(JSON.stringify({ms,...r}),errs.slice(0,3));await b.close()})();
