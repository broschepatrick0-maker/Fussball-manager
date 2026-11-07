const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const ctx=await b.newContext({acceptDownloads:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(1200);
await p.evaluate(()=>{for(let i=0;i<30;i++)simDay();act('savev')});await p.waitForTimeout(200);
const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>act('exdl'))]);const path='/tmp/claude-0/-home-claude/fefefd0a-d0a2-5c84-8f2a-a9cae70994d7/scratchpad/'+dl.suggestedFilename();await dl.saveAs(path);
const fs=require('fs');console.log(dl.suggestedFilename(),Math.round(fs.statSync(path).size/1024),'KB');
const day=await p.evaluate(()=>S.day);await p.evaluate(()=>{for(let i=0;i<10;i++)simDay()});
await p.setInputFiles('#imFile',path);await p.waitForTimeout(1500);console.log('day before',day,'after import',await p.evaluate(()=>S.day));
console.log(errs);await b.close()})();
