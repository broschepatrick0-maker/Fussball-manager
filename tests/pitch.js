const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='warning'||m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(1000);
console.log(await p.evaluate(()=>{const t=L('bl').teams[0];act('fav:'+t);const sq=T(t).sq.map(x=>P()[x]);const nats={};sq.forEach(x=>nats[x.nat]=(nats[x.nat]||0)+1);
 const low=S.leagues.find(l=>l.level===10);const lt=low.teams[0];ensureSquad(lt);const n2={};T(lt).sq.forEach(x=>{const q=P()[x];n2[q.nat]=(n2[q.nat]||0)+1});
 return JSON.stringify({bl:nats,ex:sq.slice(0,8).map(x=>x.n+' '+x.nat),low:n2,lowEx:T(lt).sq.slice(0,6).map(x=>P()[x].n)})}));
await p.evaluate(()=>{advance('next')});await p.waitForTimeout(200);
const ok=await p.evaluate(()=>{const fx=clubFixtures(S.fav).find(x=>!x.done);return !!fx});
await p.evaluate(()=>{act('area:fav')});await p.waitForTimeout(300);
const btn=await p.$('[data-act^="mt:"]');if(btn){await btn.click();await p.waitForTimeout(400);
 const pl=await p.$('[data-act="mpl"]');if(pl)await pl.click();await p.waitForTimeout(4000);
 await p.screenshot({path:'/tmp/claude-0/-home-claude/fefefd0a-d0a2-5c84-8f2a-a9cae70994d7/scratchpad/pt.png'});
 console.log('canvas',await p.evaluate(()=>{const c=document.querySelector('canvas.pitch');return c?c.width+'x'+c.height+' pl '+Object.keys(PITCH.pl).length+' ball '+PITCH.ball.x.toFixed(1):'none'}));}
else console.log('no live btn');
console.log(errs.slice(0,5));await b.close()})();
