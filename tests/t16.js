const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(900);
const r=await p.evaluate(()=>{const names={};Object.values(S.teams).forEach(t=>names[t.name]=(names[t.name]||0)+1);const dup=Object.entries(names).filter(([n,c])=>c>1).map(x=>x[0]);
 const kk=S.leagues.filter(l=>l.vb==='BY'&&l.level===9);const up=kk.map(l=>l.name+'→'+(L(S.leagues.find(x=>x.name===l.up)?.id)?'ok':'FEHLT'));
 for(let s=0;s<4;s++){sim(99);newSeason()}
 return {dup,up,after:S.leagues.filter(l=>l.vb==='BY'&&l.level>=8).map(l=>l.teams.length).join(',')}});
console.log(JSON.stringify(r,null,1));console.log(errs.slice(0,3));await b.close()})();
