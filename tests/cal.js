// Kalender: Termine plausibel, Saisonablauf, Weiter-Knopf, Transferfenster, Performance
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(900);
const r=await p.evaluate(()=>{const out={};const bl=L('bl'),l3=L('l3'),kl=S.leagues.find(l=>l.level>=8);
  const f=a=>a.map(d=>fmtDay(d)).slice(0,3).concat('…',fmtDay(a[a.length-1]));
  out.bl=f(bl.dates);out.l3=f(l3.dates);out.kl=[kl.name,kl.rounds.length,...f(kl.dates)];
  out.dup=S.leagues.filter(l=>new Set(l.dates).size!==l.dates.length).length;
  out.unsorted=S.leagues.filter(l=>l.dates.some((d,i)=>i&&d<=l.dates[i-1])).length;
  out.dfb=f(S.cups.find(c=>c.type==='dfb').dates);out.lp=f(S.cups.find(c=>c.type!=='dfb').dates);
  out.cl=S.euro.map(e=>e.short+': '+f(e.dates).join(' '));
  out.lens=[...new Set(S.leagues.map(l=>l.dates.length===l.rounds.length))];
  // ganze Saison mit Weiter (ohne Verein)
  act('fav:'+bl.teams[3]);const t0=performance.now();let clicks=0;while(!S.done&&clicks<200){advance('next');clicks++}
  out.clicks=clicks;out.ms=Math.round(performance.now()-t0);out.day=S.day;out.lastDate=fmtDay(S.day,{y:true});
  out.played=S.leagues.every(l=>l.played===l.rounds.length);out.cups=S.cups.every(c=>c.winner);out.weeks=S.round;out.tr=(S.tr||[]).filter(x=>x.s===S.season).length;
  act('newseason');out.after={season:S.season,day:S.day,done:S.done,date:dateLine()};
  return out});
console.log(JSON.stringify(r,null,1));
await p.evaluate(()=>{for(let i=0;i<60;i++)simDay();act('cal')});await p.waitForTimeout(200);await p.screenshot({path:'../../tests/cal-desk.png'});
await p.setViewportSize({width:390,height:844});await p.evaluate(()=>render());await p.waitForTimeout(200);await p.screenshot({path:'../../tests/cal-mob.png',fullPage:true});
console.log(errs.slice(0,5));await b.close()})();
