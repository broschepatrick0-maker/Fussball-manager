const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h,tag] of [[1366,900,'d'],[390,844,'m']]){const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(800);
await p.evaluate(()=>{act('fav:'+L('bl').teams[3]);sim(3);act('area:fav');act('ftab:taktik')});await p.waitForTimeout(200);
await p.screenshot({path:`/tmp/claude-0/s/${tag}-tak.png`,fullPage:tag==='d'});
// Live-Spiel von Mein Verein starten
await p.evaluate(()=>{act('mstyle:offensiv');const lg=lgOf(S.fav);const md=lg.played;const m=lg.rounds[md].find(x=>x.h===S.fav||x.a===S.fav);MREF=[];const r=mref(m,ctxL(lg,md));act('mt:'+r);act('mpl');act('msp:3')});
await p.waitForTimeout(5500);await p.screenshot({path:`/tmp/claude-0/s/${tag}-dyn-ht.png`});
const st=await p.evaluate(()=>({ht:!!view.ov.htTalk,i:view.ov.i,done:view.ov.rep.done}));console.log(JSON.stringify(st));
await p.evaluate(()=>{act('mtalk:mot');act('mtac:defensiv')});await p.waitForTimeout(2500);
await p.evaluate(()=>{const s=view.ov.rep.dyn.fav,sd=view.ov.rep.side[s];document.getElementById('subOut').value=sd.xi[5];document.getElementById('subIn').value=sd.bench[0];act('msub')});
await p.waitForTimeout(300);await p.screenshot({path:`/tmp/claude-0/s/${tag}-dyn.png`});
await p.evaluate(()=>act('mend'));const r=await p.evaluate(()=>({res:view.ov.m.hg+':'+view.ov.m.ag,done:view.ov.rep.done,subs:view.ov.rep.dyn.subs}));console.log(JSON.stringify(r));
await p.evaluate(()=>act('ovx'));await p.evaluate(()=>sim(1));
console.log(await p.evaluate(()=>{const lg=lgOf(S.fav);const m=lg.rounds[lg.played-1].find(x=>x.h===S.fav||x.a===S.fav);return 'kept '+m.hg+':'+m.ag}));
await p.close()}
console.log(errs.slice(0,3));await b.close()})();
