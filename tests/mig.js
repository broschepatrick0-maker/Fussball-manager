const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const id=L('bl').teams[0];S.hist={all:{},titles:{},career:{[id]:[{s:2026,lg:'Bundesliga',lv:1,pos:1,n:18,p:80,cups:[{c:'DFB-Pokal',r:'Sieger'}],mv:'up'},{s:2027,lg:'International (ESP)',lv:0,pos:'–',n:0,p:'–',cups:[{c:'Champions League',r:'Finale'}],intl:true}]}};
 const c=careerOf(id);act('club:'+id);return JSON.stringify(c)+' '+document.querySelector('.sheet')?.innerText.includes('DFB-Pokal')}));
console.log(errs);await b.close()})();
