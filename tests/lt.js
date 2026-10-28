const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h,tag] of [[1366,860,'d'],[390,844,'m']]){const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(800);
await p.evaluate(()=>act('lg:bl'));await p.waitForTimeout(100);
await p.click('.m .golive');await p.waitForTimeout(300);
await p.evaluate(()=>act('msp:3'));await p.waitForTimeout(6000);
await p.screenshot({path:`/tmp/claude-0/s/${tag}-live.png`});
const r=await p.evaluate(()=>{const o=view.ov;return {i:o.i,n:o.rep.ticks.length,res:o.m.hg+':'+o.m.ag,live:o.rep.ev.filter(e=>e.t==='goal').length}});console.log(JSON.stringify(r));
await p.evaluate(()=>act('mend'));await p.waitForTimeout(200);await p.screenshot({path:`/tmp/claude-0/s/${tag}-live-end.png`});
await p.close()}
const p=await b.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(800);
// Konsistenz: viele Berichte prüfen (Tore = Ergebnis), Pokal mit Elfmeter, Spieltag überspringt Live-Ergebnis
console.log(await p.evaluate(()=>{let bad=0,pens=0,n=0;
  for(const c of S.cups.slice(0,40)){c.rounds[0].forEach(m=>{if(m.bye)return;const ctx=ctxC(c,0);decideMatch(m,ctx);const r=matchReport(m,ctx);n++;
    const [h,a]=liveScore(r,9999);if(h!==m.hg||a!==m.ag)bad++;if(m.pen){pens++;let x=0,y=0;r.ev.forEach(e=>{if(e.t==='pgoal'){e.s==='h'?x++:y++}});if(x!==m.pen[0]||y!==m.pen[1])bad++}})}
  const lg=L('bl'),m=lg.rounds[0][0];decideMatch(m,ctxL(lg,0));const keep=m.hg+':'+m.ag;sim(1);
  return {n,bad,pens,keep,after:m.hg+':'+m.ag}}));
console.log(errs);await b.close()})();
