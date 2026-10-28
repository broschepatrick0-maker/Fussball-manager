// Live-Engine von Mein Verein: Ergebnisverteilung vs. normale Simulation, Pokal mit Verlängerung/Elfmeter
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{const bl=L('bl');const h=bl.teams[0],a=bl.teams[9];act('fav:'+h);MG();
  const N=400;let dg=[0,0],dw=0,dd=0,sg=[0,0],sw=0,sd=0;
  for(let i=0;i<N;i++){const m={h,a};const ov={m,ctx:{comp:'T',rd:'x'},rep:dynStart(m,{}),i:0};dynFinish(ov);dg[0]+=m.hg;dg[1]+=m.ag;if(m.hg>m.ag)dw++;else if(m.hg===m.ag)dd++;
    const [x,y]=play(h,a);sg[0]+=x;sg[1]+=y;if(x>y)sw++;else if(x===y)sd++}
  // Pokal: ausgeglichenes Duell erzwingt Verlängerung/Elfmeter
  let et=0,pen=0,bad=0;for(let i=0;i<200;i++){const m={h,a:bl.teams[1]};const ov={m,ctx:{cup:true},rep:dynStart(m,{cup:true}),i:0};dynFinish(ov);if(m.et)et++;if(m.pen){pen++;if(m.pen[0]===m.pen[1])bad++}if(!m.w)bad++}
  // Taktik-Effekt
  const st=s=>{let g=[0,0];S.mgr.style=s;for(let i=0;i<300;i++){const m={h,a};const ov={m,ctx:{},rep:dynStart(m,{}),i:0};dynFinish(ov);g[0]+=m.hg;g[1]+=m.ag}return g.map(x=>(x/300).toFixed(2)).join(':')};
  return JSON.stringify({dyn:{g:dg.map(x=>(x/N).toFixed(2)),w:dw/N,d:dd/N},sim:{g:sg.map(x=>(x/N).toFixed(2)),w:sw/N,d:sd/N},cup:{et,pen,bad},tac:{aus:st('ausgewogen'),off:st('offensiv'),def:st('defensiv')}})}));
console.log(errs.slice(0,3));await b.close()})();
