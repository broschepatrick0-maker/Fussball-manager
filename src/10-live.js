// ---------- Live-Spiel: 90 Minuten (bzw. Verlängerung/Elfmeterschießen) ----------
function srng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hstr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rpois(l,R){const L=Math.exp(-l);let k=0,p=1;do{k++;p*=R()}while(p>L);return k-1}
const rpick=(a,R)=>a[Math.floor(R()*a.length)];
function wpickR(items,w,R){const s=w.reduce((a,b)=>a+b,0);let x=R()*s;for(let i=0;i<items.length;i++){x-=w[i];if(x<=0)return items[i]}return items[items.length-1]}
function lineup(id){
  const sq=ensureSquad(id).filter(pid=>P()[pid]&&!P()[pid].inj).slice().sort((a,b)=>P()[b].s-P()[a].s);
  const xi=[],used=new Set();
  for(const [p,n] of [['TW',1],['AB',4],['MF',4],['ST',2]]){sq.filter(x=>P()[x].p===p&&!used.has(x)).slice(0,n).forEach(x=>{xi.push(x);used.add(x)})}
  for(const x of sq){if(xi.length>=11)break;if(!used.has(x)){xi.push(x);used.add(x)}}
  return {xi,bench:sq.filter(x=>!used.has(x)).slice(0,9)};
}
// Fall 1: Spiel ist noch offen -> Ergebnis festlegen (gleiche Logik wie die Spieltags-Simulation)
function decideMatch(m,ctx){
  if(ctx.cup){
    const neutral=!!ctx.neutral;let [x,y]=play(m.h,m.a,neutral);m.hg=x;m.ag=y;
    if(x===y){const rh=T(m.h).r,ra=T(m.a).r;m.hg+=pois(lam(rh,ra,!neutral)/3);m.ag+=pois(lam(ra,rh,false)/3);m.et=true;
      if(m.hg===m.ag){let a=0,b=0;const pa=.74+(rh-ra)/400,pb=.74+(ra-rh)/400;for(let i=0;i<5;i++){if(Math.random()<pa)a++;if(Math.random()<pb)b++}while(a===b){if(Math.random()<pa)a++;if(Math.random()<pb)b++}m.pen=[a,b]}}
    m.w=m.pen?(m.pen[0]>m.pen[1]?m.h:m.a):(m.hg>m.ag?m.h:m.a);
  } else {const [x,y]=play(m.h,m.a);m.hg=x;m.ag=y}
  m.lv=1;
}
// Fall 2: Ergebnis steht -> passenden, reproduzierbaren Spielverlauf erzeugen
function matchReport(m,ctx){
  const R=srng(hstr([S.season,ctx.key||ctx.comp,m.h,m.a,m.hg,m.ag,m.pen?m.pen.join('-'):''].join('|')));
  const side={h:{id:m.h,...lineup(m.h)},a:{id:m.a,...lineup(m.a)}};
  const nm=pid=>P()[pid]?P()[pid].n:'?';
  const rh=T(m.h).r,ra=T(m.a).r,share=1/(1+Math.exp(-(rh-ra+(ctx.neutral?0:3))/14));
  const st1=1+Math.floor(R()*3),st2=2+Math.floor(R()*4),et=!!m.et,pens=!!m.pen;
  // 90-Minuten-Stand und Verlängerungstore
  let g90=[m.hg,m.ag],gEt=[0,0];
  if(et){const b=Math.min(m.hg,m.ag);let base=pens&&b>0&&R()<.35?b-1:b;g90=[base,base];gEt=[m.hg-base,m.ag-base]}
  // Zeitleiste: ord = Halbzeit*100 + Minute (+ Nachspielzeit/10)
  const ev=[];const add=(o,e)=>ev.push({o,...e});
  const minOrd=(half,mi)=>half*100+mi;
  const label=o=>{const half=Math.floor(o/100),mi=Math.round((o%100)*10)/10;const base={0:45,1:90,2:105,3:120}[half];
    if(mi>base){return base+'+'+Math.round((mi-base)*10)+"'"}return Math.floor(mi)+"'"};
  const randOrd=(half,R)=>{const lo={0:1,1:46,2:91,3:106}[half],hi={0:45,1:90,2:105,3:120}[half],stp={0:st1,1:st2,2:1,3:2}[half];
    const span=hi-lo+1+stp*0.6,x=lo+R()*span;if(x>hi+0.999){return minOrd(half,hi+Math.ceil((x-hi-0.999)/0.6)/10)}return minOrd(half,Math.floor(x))};
  // Wechsel (3–5 je Team, 2. Halbzeit)
  const subs={h:[],a:[]};
  for(const s of ['h','a']){const n=3+Math.floor(R()*3),T_=side[s];const out=T_.xi.filter(x=>P()[x].p!=='TW').slice();const bench=T_.bench.filter(x=>P()[x].p!=='TW');
    for(let i=0;i<n&&bench.length&&out.length;i++){const mi=55+Math.floor(R()*34)+(i===0?-8:0);const o=out.splice(Math.floor(R()*out.length),1)[0];
      const same=bench.findIndex(x=>P()[x].p===P()[o].p);const inn=bench.splice(same>=0?same:0,1)[0];subs[s].push({o:minOrd(1,Math.min(90,mi)),off:o,on:inn})}}
  const onPitch=(s,o)=>{let p=side[s].xi.slice();for(const x of subs[s])if(x.o<=o){p=p.filter(y=>y!==x.off);p.push(x.on)}return p};
  const keeper=s=>side[s].xi.find(x=>P()[x].p==='TW')||side[s].xi[0];
  const shooter=(s,o)=>{const p=onPitch(s,o).filter(x=>P()[x].p!=='TW');return wpickR(p,p.map(x=>({ST:6,MF:3,AB:1}[P()[x].p]||1)*(0.6+P()[x].s/100)),R)};
  for(const s of ['h','a'])for(const x of subs[s])add(x.o+0.05,{t:'sub',s,txt:`Wechsel: ${nm(x.on)} kommt für ${nm(x.off)}`});
  // Tore
  const goalTxt=[(p,a)=>`${p} schiebt ${a?`nach Vorlage von ${a} `:''}flach ins lange Eck ein`,(p,a)=>`Kopfball ${p}${a?` nach Flanke von ${a}`:''} – drin!`,(p,a)=>`${p} hämmert den Ball aus 18 Metern in den Winkel`,(p,a)=>`${p} staubt nach einem Abpraller ab`,(p,a)=>`${a?a+' steckt durch, ':''}${p} bleibt eiskalt vor dem Tor`,(p,a)=>`${p} vollendet einen schönen Konter${a?` über ${a}`:''}`];
  const mkGoals=(s,n,half)=>{for(let i=0;i<n;i++){const o=randOrd(half,R),r=R();
    if(r<.03){const opp=s==='h'?'a':'h';const p=rpick(onPitch(opp,o).filter(x=>P()[x].p==='AB').concat(onPitch(opp,o)).slice(0,6),R);add(o,{t:'goal',s,og:true,sc:p,txt:`Eigentor! ${nm(p)} lenkt den Ball unglücklich ins eigene Netz`});continue}
    const p=shooter(s,o);
    if(r<.11){add(o,{t:'goal',s,sc:p,pen:true,txt:`Elfmeter! ${nm(p)} verwandelt sicher`});continue}
    const cand=onPitch(s,o).filter(x=>x!==p&&P()[x].p!=='TW');const a=R()<.72&&cand.length?rpick(cand,R):null;
    add(o,{t:'goal',s,sc:p,as:a,txt:rpick(goalTxt,R)(nm(p),a?nm(a):null)})}};
  for(const s of ['h','a']){const i=s==='h'?0:1;let n1=0;for(let k=0;k<g90[i];k++)if(R()<.45)n1++;mkGoals(s,n1,0);mkGoals(s,g90[i]-n1,1);
    if(et){let e1=0;for(let k=0;k<gEt[i];k++)if(R()<.5)e1++;mkGoals(s,e1,2);mkGoals(s,gEt[i]-e1,3)}}
  // Chancen, Karten, Ecken
  const mins=et?120:90;
  const stats={h:{sh:0,on:0,co:0,fo:0,ye:0,re:0,of:0},a:{sh:0,on:0,co:0,fo:0,ye:0,re:0,of:0}};
  for(const s of ['h','a']){const sh_=s==='h'?share:1-share,opp=s==='h'?'a':'h';
    const nCh=rpois((2+7*sh_)*mins/90,R);
    for(let i=0;i<nCh;i++){const half=et&&R()<.25?2+Math.floor(R()*2):(R()<.47?0:1);const o=randOrd(half,R),p=shooter(s,o),r=R();
      if(r<.42) add(o,{t:'save',s,txt:rpick([`${nm(p)} zieht ab – ${nm(keeper(opp))} pariert stark`,`Gute Chance für ${nm(p)}, aber ${nm(keeper(opp))} ist zur Stelle`,`${nm(keeper(opp))} taucht ab und hält den Schuss von ${nm(p)}`],R)});
      else if(r<.5) add(o,{t:'post',s,txt:`Aluminium! ${nm(p)} trifft nur den Pfosten`});
      else if(r<.82) add(o,{t:'miss',s,txt:rpick([`${nm(p)} verzieht knapp`,`Schuss von ${nm(p)} – deutlich drüber`,`${nm(p)} kommt zum Abschluss, der Ball geht am Tor vorbei`],R)});
      else add(o,{t:'block',s,txt:`${nm(p)} versucht es, der Schuss wird geblockt`})}
    const nCo=rpois((2+5*sh_)*mins/90,R);for(let i=0;i<nCo;i++)add(randOrd(R()<.5?0:1,R),{t:'corner',s,txt:`Ecke für ${T(side[s].id).name}`,quiet:true});
    const nY=rpois(1.7,R);for(let i=0;i<nY;i++){const o=randOrd(R()<.4?0:1,R);const p=rpick(onPitch(s,o).filter(x=>P()[x].p!=='TW'),R);add(o,{t:'yellow',s,pl:p,txt:`Gelbe Karte für ${nm(p)} ${rpick(['nach einem taktischen Foul','wegen Meckerns','nach einem harten Zweikampf','für ein Halten im Mittelfeld'],R)}`})}
    if(R()<.045){const o=randOrd(1,R);const p=rpick(onPitch(s,o).filter(x=>P()[x].p!=='TW'),R);add(o,{t:'red',s,pl:p,txt:`Rote Karte! ${nm(p)} muss nach einer Notbremse vom Platz`})}
    const nO=rpois(2,R);for(let i=0;i<nO;i++)add(randOrd(R()<.5?0:1,R),{t:'off',s,txt:'Abseits',quiet:true});
    const nF=rpois(11*mins/90,R);for(let i=0;i<nF;i++)add(randOrd(R()<.5?0:1,R),{t:'foul',s,quiet:true});
  }
  // Rahmen
  add(0,{t:'kick',txt:`Anpfiff! ${T(m.h).name} gegen ${T(m.a).name}`});
  add(minOrd(0,45+st1/10)+0.09,{t:'ht',txt:'Halbzeit'});
  add(100+45.5,{t:'kick2',txt:'Die zweite Halbzeit läuft'});
  if(et){add(minOrd(1,90+st2/10)+0.09,{t:'ft90',txt:'Nach 90 Minuten steht es unentschieden – Verlängerung!'});add(minOrd(2,105.1)+0.09,{t:'ht',txt:'Seitenwechsel in der Verlängerung'});add(minOrd(3,120.2)+0.09,{t:'ft',txt:pens?'Auch nach 120 Minuten keine Entscheidung – Elfmeterschießen!':'Abpfiff nach Verlängerung'})}
  else add(minOrd(1,90+st2/10)+0.09,{t:'ft',txt:'Abpfiff'});
  // Elfmeterschießen passend zum Ergebnis
  const shoot=[];
  if(pens){const [ta,tb]=m.pen;let seq=null;
    const sim1=()=>{let a=0,b=0,ka=0,kb=0;const k=[];
      for(let r=0;r<30;r++){
        for(const s of ['h','a']){const hit=R()<.76;k.push({s,hit});if(s==='h'){ka++;if(hit)a++}else{kb++;if(hit)b++}
          if(r<5&&(a+(5-ka)<b||b+(5-kb)<a))return {a,b,k}}
        if(r>=4&&a!==b)return {a,b,k}}
      return {a,b,k}};
    for(let tr=0;tr<6000&&!seq;tr++){const x=sim1();if(x.a===ta&&x.b===tb)seq=x.k}
    if(!seq){seq=[];for(let i=0;i<Math.max(ta,tb)+1;i++){seq.push({s:'h',hit:i<ta});seq.push({s:'a',hit:i<tb})}}
    const pool={h:onPitch('h',999).filter(x=>P()[x].p!=='TW'),a:onPitch('a',999).filter(x=>P()[x].p!=='TW')};let ia=0,ib=0,ca=0,cb=0;
    seq.forEach((k,i)=>{const p=k.s==='h'?pool.h[ia++%pool.h.length]:pool.a[ib++%pool.a.length];if(k.hit){k.s==='h'?ca++:cb++}
      shoot.push({o:400+i,t:k.hit?'pgoal':'pmiss',s:k.s,txt:`${nm(p)} ${k.hit?'verwandelt':'scheitert'} – ${ca}:${cb}`});});
    shoot.forEach(x=>ev.push(x));ev.push({o:400+shoot.length,t:'end',txt:`${T(m.w).name} gewinnt das Elfmeterschießen ${m.pen[0]}:${m.pen[1]}`})}
  ev.sort((x,y)=>x.o-y.o);
  // Ticks (eine Spielminute je Schritt)
  const ticks=[0];for(let i=1;i<=45;i++)ticks.push(i);for(let i=1;i<=st1;i++)ticks.push(45+i/10);ticks.push(45+st1/10+0.09);
  for(let i=46;i<=90;i++)ticks.push(100+i);for(let i=1;i<=st2;i++)ticks.push(100+90+i/10);ticks.push(100+90+st2/10+0.09);
  if(et){for(let i=91;i<=105;i++)ticks.push(200+i);ticks.push(200+105.1+0.09);for(let i=106;i<=120;i++)ticks.push(300+i);ticks.push(300+120.2+0.09)}
  shoot.forEach((x,i)=>ticks.push(400+i));if(pens)ticks.push(400+shoot.length);
  // Ballbesitz
  const pos=Math.max(28,Math.min(72,Math.round(50+(share-.5)*48+(R()-.5)*8)));
  return {ev,ticks,side,pos,label,et,pens,share};
}
// Live-Overlay
const LIVE={timer:null};
const SPEEDS=[[1,650,'1×'],[2,260,'2×'],[3,90,'5×']];
function mctxLabel(ctx){return `${ctx.comp} · ${ctx.rd}`}
function matchStats(rep,o){
  const c={h:{tore:0,sh:0,on:0,co:0,fo:0,ye:0,re:0,of:0},a:{tore:0,sh:0,on:0,co:0,fo:0,ye:0,re:0,of:0}};
  for(const e of rep.ev){if(e.o>o||e.o>=400||!e.s)continue;const x=c[e.s];
    if(e.t==='goal'){x.tore++;if(!e.og){x.sh++;x.on++}}else if(e.t==='save'){x.sh++;x.on++}else if(e.t==='miss'||e.t==='post'||e.t==='block')x.sh++;
    else if(e.t==='corner')x.co++;else if(e.t==='foul')x.fo++;else if(e.t==='yellow')x.ye++;else if(e.t==='red')x.re++;else if(e.t==='off')x.of++}
  return c;
}
function liveScore(rep,o){let h=0,a=0;for(const e of rep.ev){if(e.o>o)break;if(e.t==='goal'){e.s==='h'?h++:a++}}return [h,a]}
function matchHTML(){
  const L_=view.ov,m=L_.m,ctx=L_.ctx,rep=L_.rep,i=Math.min(L_.i,rep.ticks.length-1),o=rep.ticks[i],end=i>=rep.ticks.length-1;
  const [sh,sa]=liveScore(rep,o),st=matchStats(rep,o);
  const half=Math.floor(o/100);
  const clock=i===0?'vor dem Anpfiff':o>=400?'Elfmeterschießen':end?(rep.et?'n.V.':'Ende'):rep.ev.some(e=>e.t==='ht'&&Math.abs(e.o-o)<0.001)?'Halbzeit':rep.label(o);
  const pct=Math.round(i/(rep.ticks.length-1)*100);
  const scorers=s=>rep.ev.filter(e=>e.o<=o&&e.t==='goal'&&e.s===s).map(e=>`${esc(P()[e.sc]?P()[e.sc].n.split(' ').slice(-1)[0]:'?')} ${rep.label(e.o)}${e.pen?' (E)':e.og?' (ET)':''}`).join(', ');
  const reds=s=>rep.ev.filter(e=>e.o<=o&&e.t==='red'&&e.s===s).length;
  const shown=rep.ev.filter(e=>e.o<=o&&!e.quiet).slice().reverse();
  const ico={goal:'⚽',pgoal:'⚽',pmiss:'✕',save:'🧤',post:'▮',miss:'↗',block:'■',yellow:'🟨',red:'🟥',sub:'⇄',kick:'▶',kick2:'▶',ht:'⏸',ft:'⏹',ft90:'⏱',end:'🏆'};
  const pen=o>=400?(()=>{let a=0,b=0;rep.ev.forEach(e=>{if(e.o<=o&&e.t==='pgoal'){e.s==='h'?a++:b++}});return `<small>i.E. ${a}:${b}</small>`})():'';
  const row=(lbl,a,b,fmt=x=>x)=>{const t=a+b||1;return `<div class="srow"><b>${fmt(a)}</b><span>${lbl}</span><b>${fmt(b)}</b><div class="sbar"><i style="width:${a/t*100}%"></i><i style="width:${b/t*100}%"></i></div></div>`};
  const posNow=i===0?50:Math.round(rep.pos+Math.sin(i/7)*3);
  const lu=s=>`<div><h4>${esc(T(rep.side[s].id).name)}</h4><ol class="lu">${rep.side[s].xi.map(pid=>`<li><span class="pos-${P()[pid].p}">${P()[pid].p}</span>${esc(P()[pid].n)}</li>`).join('')}</ol></div>`;
  const speed=L_.speed||1;
  return `<div class="mlive">
  <div class="sb${L_.flash?' flash':''}"><div class="meta sbm">${esc(mctxLabel(ctx))}${m.lv&&!L_.replay?'':''}</div>
   <div class="sbr"><div class="tm"><button class="tlink" data-act="club:${m.h}">${esc(T(m.h).name)}</button>${reds('h')?' <span class="rc">'+'▮'.repeat(reds('h'))+'</span>':''}<small>${scorers('h')}</small></div>
   <div class="sc"><b>${sh}:${sa}</b>${pen}<span class="clk${end?'':' run'}">${clock}</span></div>
   <div class="tm a"><button class="tlink" data-act="club:${m.a}">${esc(T(m.a).name)}</button>${reds('a')?' <span class="rc">'+'▮'.repeat(reds('a'))+'</span>':''}<small>${scorers('a')}</small></div></div>
   <div class="prog"><i style="width:${pct}%"></i></div></div>
  <div class="mctl">${end?`<button class="btn" data-act="mrep">↺ Nochmal ansehen</button>`:`<button class="btn pri" data-act="mpl">${L_.playing?'⏸ Pause':'▶ '+(i===0?'Anpfiff':'Weiter')}</button>`}
   <div class="seg" style="margin:0">${SPEEDS.map(([k,,t])=>`<button class="${speed===k?'on':''}" data-act="msp:${k}">${t}</button>`).join('')}</div>
   ${end?'':`<button class="btn" data-act="mend">Zum Ende ⏭</button>`}</div>
  <div class="mgrid"><div class="card"><h3 class="ct">Liveticker</h3><div class="tick">${shown.map(e=>`<div class="te t-${e.t}${e.s?' s-'+e.s:''}"><span class="tm_">${e.o>=400?'':e.o===0?'':rep.label(e.o)}</span><span class="ti">${ico[e.t]||'•'}</span><span>${e.t==='goal'?`<b>TOR für ${esc(T(rep.side[e.s].id).name)}!</b> `:''}${esc(e.txt||'')}${e.t==='goal'?` <b>${liveScore(rep,e.o).join(':')}</b>`:''}</span></div>`).join('')||'<div class="empty">Gleich geht es los …</div>'}</div></div>
  <div class="card"><h3 class="ct">Statistik</h3>${row('Ballbesitz',posNow,100-posNow,x=>x+'%')}${row('Torschüsse',st.h.sh,st.a.sh)}${row('Aufs Tor',st.h.on,st.a.on)}${row('Ecken',st.h.co,st.a.co)}${row('Fouls',st.h.fo,st.a.fo)}${row('Abseits',st.h.of,st.a.of)}${row('Gelbe Karten',st.h.ye,st.a.ye)}${st.h.re+st.a.re?row('Rote Karten',st.h.re,st.a.re):''}
   <h3 class="ct" style="margin-top:14px">Aufstellungen</h3><div class="lus">${lu('h')}${lu('a')}</div></div></div></div>`;
}
function liveTick(){
  const o=view.ov;if(!o||o.t!=='match'){clearInterval(LIVE.timer);LIVE.timer=null;return}
  if(!o.playing)return;
  const before=liveScore(o.rep,o.rep.ticks[o.i]).join();o.i++;
  if(o.i>=o.rep.ticks.length-1){o.i=o.rep.ticks.length-1;o.playing=false}
  o.flash=liveScore(o.rep,o.rep.ticks[o.i]).join()!==before;
  paintMatch();
  if(!o.playing){clearInterval(LIVE.timer);LIVE.timer=null;if(o.fresh){o.fresh=false;toast(`Abpfiff: ${T(o.m.h).name} ${o.m.hg}:${o.m.ag}${o.m.pen?' i.E.':o.m.et?' n.V.':''} ${T(o.m.a).name}`)}}
}
function paintMatch(){const c=document.querySelector('#ov .ovc');if(c){c.innerHTML=matchHTML();c.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>act(b.dataset.act))}}
function liveRun(){clearInterval(LIVE.timer);const o=view.ov;if(!o||!o.playing)return;const ms=(SPEEDS.find(x=>x[0]===(o.speed||1))||SPEEDS[0])[1];LIVE.timer=setInterval(liveTick,ms)}
function openMatch(ref){
  const r=MREF[ref];if(!r)return;const {m,ctx}=r;let fresh=false;
  if(m.hg==null){if(!ctx.canLive){toast('Dieses Spiel ist noch nicht dran – live geht immer das nächste anstehende Spiel');return}decideMatch(m,ctx);fresh=true;save()}
  const rep=matchReport(m,ctx);
  view.ov={t:'match',m,ctx,rep,i:fresh?0:rep.ticks.length-1,playing:fresh,speed:(view.ov&&view.ov.speed)||(S.liveSpeed||1),fresh,top:true};
}
// Spiel-Registry je Render-Durchlauf (für Klicks auf Ergebnisse)
let MREF=[];
function mref(m,ctx){MREF.push({m,ctx});return MREF.length-1}
function liveBtn(m,ctx,label){if(m.bye||!m.a)return '';const ok=m.hg!=null||ctx.canLive;return ok?`<button class="btn sm live" data-act="mt:${mref(m,ctx)}">${m.hg!=null?'Spielbericht':'▶ '+(label||'Live')}</button>`:''}
