// Zufriedenheit & Gespräche
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(900);
const r=await p.evaluate(()=>{const out={};const id=L('bl').teams[4];act('fav:'+id);MG();bestXI();MG().rot=false;
  let events=[],answered=0;const t0=performance.now();
  for(let i=0;i<20;i++){sim(1);const g=MG();(g.talk||[]).forEach(x=>{if(!events.some(e=>e.pid===x.pid&&e.k===x.k))events.push({pid:x.pid,k:x.k})})}
  out.ms=Math.round(performance.now()-t0);out.date=dateLine();
  const rl=roles(id),sq=T(id).sq;const by={};sq.forEach(pid=>{const r=rl[pid];(by[r]=by[r]||[]).push(Math.round(hpOf(P()[pid])))});out.hpByRole=by;
  out.ms_=sq.slice(0,8).map(pid=>P()[pid].n.split(' ')[1]+':'+rl[pid]+':'+Math.round((P()[pid].ms??0)*100));
  out.events=events.map(e=>P()[e.pid].n+' '+e.k+' '+rl[e.pid]);out.open=(MG().talk||[]).length;out.cap=P()[MG().cap]&&P()[MG().cap].n;
  // beantworten
  const msgs=[];while((MG().talk||[]).length){const x=MG().talk[0];msgs.push(answerTalk(0,TALK[x.k].opt[0][0]))}out.msgs=msgs;
  out.talk=[talkTo(sq[5],'praise'),talkTo(sq[5],'praise'),talkTo(sq[6],'cap'),talkTo(sq[7],'promise')];
  out.mo=T(id).mo;
  sim(99);act('newseason');out.after=T(id).sq.filter(pid=>P()[pid].hp!=null).length;out.refuse=T(id).sq.filter(pid=>{const o=renewalOffer(pid);return o&&o.no}).length;
  return out});
console.log(JSON.stringify(r,null,1));
await p.evaluate(()=>{sim(8);const g=MG();if(!(g.talk||[]).length){const pid=T(S.fav).sq[3];addTalk(pid,'time')}act('area:fav');act('ftab:kader')});await p.waitForTimeout(200);await p.screenshot({path:'../../tests/mood-k.png'});
await p.evaluate(()=>act('talk:'+T(S.fav).sq[2]));await p.waitForTimeout(200);await p.screenshot({path:'../../tests/mood-t.png'});
console.log(errs.slice(0,5));await b.close()})();
