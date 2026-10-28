// Frische & Rotation: Werte nach englischer Woche, Rotation der KI, Wirkung auf Ergebnisse, Performance
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(900);
const r=await p.evaluate(()=>{const out={};const id=L('bl').teams[2];act('fav:'+id);MG();bestXI();
  const t0=performance.now();sim(14);out.ms14=Math.round(performance.now()-t0);
  const xi=mgrXI(id);out.date=dateLine();out.xiFi=xi.xi.map(pid=>Math.round(curFi(P()[pid])));out.rot=xi.rot.length;
  // englische Woche simulieren: zwei Spiele mit 3 Tagen Pause, ohne Rotation
  MG().rot=false;const sq=T(id).sq;const fi=()=>Math.round(mgrXI(id).xi.reduce((a,x)=>a+curFi(P()[x]),0)/11);
  out.before=fi();tire(id);out.after1=fi();S.day+=3;delete T(id).tdd;out.after3d=fi();tire(id);S.day+=3;out.eng=fi();S.day-=6;
  MG().rot=true;out.withRot=mgrXI(id).rot.length;
  // KI: Mannschaftsfrische und Rotation
  const ai=Object.values(S.teams).filter(t=>t.tf!=null);out.aiTired=ai.length;out.aiAvg=Math.round(ai.reduce((a,t)=>a+teamFi(t),0)/Math.max(1,ai.length));
  const bl=L('bl').teams.map(x=>T(x)).filter(t=>t.id!==id);out.blPlan=bl.slice(0,4).map(t=>{const pl=aiPlan(t.id);return t.name.slice(0,12)+' f'+Math.round(pl.f)+' p'+pl.pen.toFixed(1)+(pl.rot?' R':'')});
  out.dp=+(bl.reduce((a,t)=>a+(t.dp||0),0)/bl.length).toFixed(1);
  // Wirkung: müde vs frisch gegen gleichen Gegner
  const h=L('bl').teams[5],a=L('bl').teams[6];let w=[0,0];for(const tired of [0,1])for(let i=0;i<600;i++){const th=T(h);if(tired){th.tf=62;th.td=S.day;delete th.tdd}else{delete th.tf}const [x,y]=play(h,a);delete th.tdd;delete T(a).tdd;delete T(a).tf;if(x>y)w[tired]++}
  out.winFresh=+(w[0]/600).toFixed(2);out.winTired=+(w[1]/600).toFixed(2);
  const t1=performance.now();sim(99);out.msSeason=Math.round(performance.now()-t1);out.inj=(S.inj||[]).length;
  act('newseason');out.restedNew=Object.values(S.teams).filter(t=>t.tf!=null).length;
  return out});
console.log(JSON.stringify(r,null,1));
await p.evaluate(()=>{sim(6);act('area:fav');act('ftab:taktik')});await p.waitForTimeout(200);await p.screenshot({path:'../../tests/fit-tac.png',fullPage:true});
await p.evaluate(()=>act('ftab:kader'));await p.waitForTimeout(200);await p.screenshot({path:'../../tests/fit-kader.png'});
console.log(errs.slice(0,5));await b.close()})();
