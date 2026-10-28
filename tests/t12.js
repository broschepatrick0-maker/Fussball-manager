const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(800);
const viol=()=>p.evaluate(()=>{const D=deLevels();const v=[];for(const id in D.lv){const n=T(id).name;const m=resMinLevel(n,D.byName,x=>D.lv[x]);if(D.lv[id]<m)v.push(n+' L'+D.lv[id]+'<'+m)}return v});
console.log('start viol',(await viol()).length,(await viol()).slice(0,8));
for(let i=0;i<5;i++){await p.click('#bAll');await p.click('#bNew');await p.waitForTimeout(200);
 const r=await p.evaluate(()=>({n:S.leagues.reduce((a,l)=>a+l.teams.length,0),lines:S.log[0].lines.filter(l=>/Zwangsabstieg|darf als/.test(l)),bl2res:L('bl2').teams.filter(id=>isRes(T(id).name)).map(id=>T(id).name)}));
 console.log('S',i,'teams',r.n,'viol',(await viol()).length,'bl2res',r.bl2res);r.lines.slice(0,6).forEach(l=>console.log('  ',l));}
console.log((await viol()).filter(x=>!/L[89]</.test(x)));console.log(errs);await b.close()})();
