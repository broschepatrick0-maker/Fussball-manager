const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(1000);
await p.evaluate(()=>{const id=Object.values(S.teams).find(t=>t.name==='SV BS 02 Sömmerda').id;act('fav:'+id);act('area:fav');act('ftab:markt')});await p.waitForTimeout(400);
console.log(await p.evaluate(()=>{const t=document.body.innerText;return 'window '+windowOpen()+' rows '+document.querySelectorAll('[data-act^="amwerb:"]').length+' tryouts '+document.querySelectorAll('[data-act^="amtry:"]').length+' normalMarket '+t.includes('Ablöse = Marktwert')}));
await p.screenshot({path:'/tmp/claude-0/-home-claude/fefefd0a-d0a2-5c84-8f2a-a9cae70994d7/scratchpad/am1.png',fullPage:false});
let yes=0,no=0;for(let i=0;i<6;i++){const b=await p.$('[data-act^="amwerb:"]');if(!b)break;await b.click();await p.waitForTimeout(150);}
console.log(await p.evaluate(()=>JSON.stringify({sq:T(S.fav).sq.length,asked:Object.keys(S.am.ask).length,news:NEWS().filter(n=>/wechselt zum SV BS/.test(n.h)).length})));
const t1=await p.$('[data-act^="amtry:"]');if(t1){await t1.click();await p.waitForTimeout(100);const s1=await p.$('[data-act^="amsign:"]');if(s1){await s1.click();await p.waitForTimeout(100)}}
console.log('after sign',await p.evaluate(()=>T(S.fav).sq.length));
await p.evaluate(()=>act('ftab:verein'));await p.waitForTimeout(200);
await p.screenshot({path:'/tmp/claude-0/-home-claude/fefefd0a-d0a2-5c84-8f2a-a9cae70994d7/scratchpad/am2.png',fullPage:true});
const c0=await p.evaluate(()=>FZ(S.fav).c);await p.click('[data-act="amsp:0"]');await p.waitForTimeout(100);await p.click('[data-act="amfest:k"]');await p.waitForTimeout(100);await p.click('[data-act="amhelp"]');await p.waitForTimeout(100);
console.log(await p.evaluate(c0=>JSON.stringify({c0,c:FZ(S.fav).c,sp:S.am.sp,vol:S.am.vol,fest:S.am.fest}),c0));
await p.evaluate(()=>{let g=0;while(!S.done&&g++<420)simDay();newSeason()});
console.log(await p.evaluate(()=>JSON.stringify({log:S.log[0].lines.filter(l=>/Sponsor|Ehrenamt|hört|wechseln im Sommer/.test(l)).slice(0,5),fa:Object.values(S.pl).filter(p=>p.fa).length})));
console.log(errs);await b.close()})();
