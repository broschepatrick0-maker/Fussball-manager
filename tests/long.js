// Langzeit-Test: viele Saisons durchsimulieren und Kennzahlen je Saison ausgeben (Meister, Stärken, Ligen, Finanzen, Transfers, Fehler)
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(1500);
const N=+process.argv[2]||15;const out=[];
for(let i=0;i<N;i++){const r=await p.evaluate(()=>{let err=null;try{sim(99)}catch(e){err='sim:'+e.message}
  const bl=S.leagues.find(l=>l.id==='bl');const tab=typeof table==='function'?table(bl):null;const champ=tab?T(tab[0].id||tab[0].t||tab[0]).name:'?';
  const trBefore=(S.tr||[]).filter(x=>x.s===S.season);const fees=trBefore.map(x=>x.fee||0).sort((a,b)=>b-a);
  try{newSeason()}catch(e){err=(err?err+' | ':'')+'ns:'+e.message}
  const dom=S.leagues.filter(l=>!l.foreign);const emptyL=dom.filter(l=>l.teams.length<8).map(l=>l.name+':'+l.teams.length);
  const ps=Object.values(P()).map(x=>x.s).sort((a,b)=>b-a);
  const blIds=S.leagues.find(l=>l.id==='bl').teams;const buds=blIds.map(id=>typeof bud==='function'?bud(id):0);
  const rich=blIds.slice().sort((a,b)=>bud(b)-bud(a))[0];const richN=T(rich).name+' '+(bud(rich)/1e6).toFixed(0)+'M';const neg=Object.keys(S.teams).filter(id=>!T(id).gone&&typeof bud==='function'&&bud(id)<-5e6).length;
  const top=Object.keys(P()).sort((a,b)=>P()[b].s-P()[a].s).slice(0,3).map(pid=>P()[pid].n+' '+P()[pid].s.toFixed(0)+' '+(value(pid)/1e6).toFixed(0)+'M');
  return {s:S.season,err,champ,bay:+T(Object.keys(S.teams).find(x=>T(x).name==='FC Bayern München')).r.toFixed(1),
    blR:[Math.max(...blIds.map(id=>T(id).r)).toFixed(1),Math.min(...blIds.map(id=>T(id).r)).toFixed(1)],
    pMax:ps[0].toFixed(1),p90:ps.filter(x=>x>=90).length,pAvg:(ps.reduce((a,b)=>a+b,0)/ps.length).toFixed(1),nP:ps.length,
    tr:trBefore.length,topFee:((fees[0]||0)/1e6).toFixed(0)+'M',rich:richN,budBL:[(Math.min(...buds)/1e6).toFixed(0),(Math.max(...buds)/1e6).toFixed(0)],neg,
    emptyL,teams:Object.keys(S.teams).filter(id=>!T(id).gone).length,top}});
 out.push(r);console.log(JSON.stringify(r))}
const ch={};out.forEach(r=>ch[r.champ]=(ch[r.champ]||0)+1);console.log('MEISTER',JSON.stringify(ch));console.log('ERRS',JSON.stringify(errs.slice(0,10)));
await b.close()})();
