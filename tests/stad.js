const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(900);
const big=()=>p.evaluate(()=>{const r=[];S.leagues.forEach(l=>{if(l.foreign||l.level<5)return;l.teams.forEach(id=>{const z=T(id).fz;if(z&&z.cap>(LCAP[l.level]||300)*4)r.push(id)})});return r.length});
console.log('big caps start',await big());
for(let i=0;i<6;i++)console.log(await p.evaluate(()=>{for(let k=0;k<2;k++){let g=0;while(!S.done&&g++<420)simDay();newSeason()}
  const ins=(S.flog||[]).filter(x=>x.t==='ins'&&x.s>=S.season-2).length;const rb=(S.flog||[]).filter(x=>x.txt&&x.txt.includes('zurückgebaut')&&x.s>=S.season-2).length;
  const rwe=Object.values(S.teams).find(t=>t.name==='FC Rot-Weiß Erfurt');const z=rwe&&rwe.fz;return S.season+' ins(2J) '+ins+' rückbau(2J,lv<=4) '+rb+(z?' RWE '+lgOf(rwe.id).name+' cap '+z.cap+' c '+Math.round(z.c)+' d '+Math.round(z.d)+' ins '+z.ins.length:'')}));
console.log('big caps end',await big());
// UI: fav in Regionalliga, stadium card + takeover
await p.evaluate(()=>{const id=L('rlno').teams[3];act('fav:'+id);act('area:fav');act('ftab:fin')});await p.waitForTimeout(300);
const btns=await p.$$eval('[data-act^="stad:"]',b=>b.map(x=>x.textContent+(x.disabled?'(x)':'')));console.log('stad btns',btns.join(' '));
const el=await p.$('[data-act^="stad:-"]');if(el){const before=await p.evaluate(()=>FZ(S.fav).cap);await el.click();await p.waitForTimeout(200);console.log('cap',before,'->',await p.evaluate(()=>FZ(S.fav).cap))}
await p.screenshot({path:'/tmp/claude-0/-home-claude/fefefd0a-d0a2-5c84-8f2a-a9cae70994d7/scratchpad/st.png',fullPage:true});
await p.evaluate(()=>{const id=Object.values(S.teams).find(t=>t.name==='FC Rot-Weiß Erfurt').id;act('club:'+id)});await p.waitForTimeout(200);
await p.click('[data-act^="takeover:"]');await p.waitForTimeout(150);await p.fill('#toName','Patrick Test');await p.click('[data-act^="takeovergo:"]');await p.waitForTimeout(400);
console.log(await p.evaluate(()=>JSON.stringify({mode:S.mode,club:T(S.fav).name,lic:S.career.lic,goal:S.career.goal&&S.career.goal.label,tab:view.tab+'/'+view.ftab})));
console.log(errs.slice(0,3));await b.close()})();
