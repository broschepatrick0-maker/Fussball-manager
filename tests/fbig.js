const {chromium}=require('playwright');const fs=require('fs');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(800);
await p.evaluate(t=>{importJSON(t);render()},fs.readFileSync('/tmp/claude-0/s/big.json','utf8'));
const r=await p.evaluate(()=>{const a=performance.now();act('fav:'+L('bl').teams[2]);sim(99);act('newseason');const t1=performance.now()-a;act('area:fav');act('ftab:fin');
 const w=document.documentElement.scrollWidth;act('finv');return {ms:Math.round(t1),w,ins:(S.flog||[]).filter(x=>x.t==='ins').length,inv:Object.keys(S.inv||{}).length}});
console.log(JSON.stringify(r));await p.evaluate(()=>{act('area:fav');act('ftab:fin')});await p.screenshot({path:'/tmp/claude-0/s/f-mob2.png'});console.log(errs);await b.close()})();
