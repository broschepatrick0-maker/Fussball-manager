// ---------- Live-Spiel von Mein Verein: Minute für Minute, mit Taktik, Wechseln und Kabinenansprache ----------
// Das Ergebnis steht NICHT vorher fest – jede Entscheidung wirkt auf die folgenden Minuten.
const nmP=pid=>P()[pid]?P()[pid].n:'?';
function dynStart(m,ctx){
  const R=Math.random,side={h:{id:m.h,...lineup(m.h)},a:{id:m.a,...lineup(m.a)}};
  side.h.xi=side.h.xi.slice();side.a.xi=side.a.xi.slice();side.h.bench=side.h.bench.slice();side.a.bench=side.a.bench.slice();
  const st1=1+Math.floor(R()*3),st2=2+Math.floor(R()*4);
  const ticks=[0];for(let i=1;i<=45;i++)ticks.push(i);for(let i=1;i<=st1;i++)ticks.push(45+i/10);ticks.push(45+st1/10+0.09);
  for(let i=46;i<=90;i++)ticks.push(100+i);for(let i=1;i<=st2;i++)ticks.push(100+90+i/10);ticks.push(100+90+st2/10+0.09);
  const label=o=>{const half=Math.floor(o/100),mi=Math.round((o%100)*10)/10;const base={0:45,1:90,2:105,3:120}[half];if(mi>base)return base+'+'+Math.round((mi-base)*10)+"'";return Math.floor(mi)+"'"};
  const favSide=m.h===S.fav?'h':m.a===S.fav?'a':null;
  const rep={ev:[{o:0,t:'kick',txt:`Anpfiff! ${T(m.h).name} gegen ${T(m.a).name}`}],ticks,side,label,et:false,pens:false,pos:50,share:.5,dyn:{
    fav:favSide,st1,st2,cup:!!ctx.cup,neutral:!!ctx.neutral,subs:{h:0,a:0},entered:{},left:{},pen0:{h:fatPen(m.h),a:fatPen(m.a)},reds:{h:0,a:0},tac:{h:tacStyleOf(m.h,m.a),a:tacStyleOf(m.a,m.h)},talk:0,talked:false,cosub:MG().cosub,possSum:0,possN:0,yel:{},markers:[45+st1/10+0.09,100+90+st2/10+0.09]}};
  side.h.xi.concat(side.a.xi).forEach(pid=>rep.dyn.entered[pid]=0);
  return rep;
}
function dynMinute(o){const t=o%100;const h=Math.floor(o/100);return h===0?t:h===1?t:h===2?t:t} // Spielminute für Ermüdung
function dynStr(rep,s,o){const d=rep.dyn,sd=rep.side[s],mi=(Math.floor(o/100)>=1?Math.floor(o%100):Math.floor(o%100));
  const tired=pid=>{const since=d.entered[pid]||0,played=mi-since;return Math.max(0,played-55)*0.045*(d.tac[s]==='pressing'?1.5:1)};
  const fav=sd.id===S.fav&&S.mgr;
  const sum=sd.xi.reduce((a,pid)=>{const p=P()[pid];return a+(p?p.s*(fav?fitMul(curFi(p)):1):20)-tired(pid)*(fav&&p?(1+Math.max(0,88-curFi(p))/40):1)},0);
  const t=T(sd.id);return sum/11-(d.pen0?d.pen0[s]||0:0)+(t.fm||0)*0.5+(((t.mo??60)-60)/15)+famPenalty(sd.id)+(s===d.fav?d.talk:0)}
function dynAdd(rep,e){rep.ev.push(e)}
function dynStep(ov){
  const rep=ov.rep,d=rep.dyn,m=ov.m;if(rep.done)return;
  ov.i++;const o=rep.ticks[ov.i];
  if(o==null){dynEndCheck(ov);return}
  const isMarker=d.markers.some(x=>Math.abs(x-o)<1e-6);
  if(o>=400){dynPenStep(ov);return}
  if(isMarker){const half=Math.floor(o/100);
    if(half===0){dynAdd(rep,{o,t:'ht',txt:`Halbzeit – ${liveScore(rep,o).join(':')}`});if(d.fav){ov.playing=false;ov.htTalk=true}dynAdd(rep,{o:100+45.5,t:'kick2',txt:'Die zweite Halbzeit läuft'});return}
    if(half===2){dynAdd(rep,{o,t:'ht',txt:'Seitenwechsel in der Verlängerung'});return}
    dynEndCheck(ov,o);return}
  const R=Math.random,rh=dynStr(rep,'h',o),ra=dynStr(rep,'a',o);
  const [ah,dh]=tacMul(m.h,m.a,d.tac.h),[aa,da]=tacMul(m.a,m.h,d.tac.a);
  const lh=lam(rh,ra,!d.neutral)*ah*da*(1-0.12*d.reds.h)*(1+0.1*d.reds.a)*0.88/90,la=lam(ra,rh,false)*aa*dh*(1-0.12*d.reds.a)*(1+0.1*d.reds.h)*0.88/90;
  const share=1/(1+Math.exp(-(rh-ra+(d.neutral?0:3))/14));d.possSum+=50+(share-.5)*48+(d.tac.h==='ballbesitz'?6:0)-(d.tac.a==='ballbesitz'?6:0)+(d.tac.h==='defensiv'?-5:0)+(d.tac.a==='defensiv'?5:0);d.possN++;rep.pos=Math.round(Math.max(25,Math.min(75,d.possSum/d.possN)));
  for(const [s,l] of [['h',lh],['a',la]]){
    if(R()<l){dynGoal(rep,s,o);continue}
    const shOpp=s==='h'?share:1-share;
    if(R()<(1.5+6*shOpp)/90){const p=dynShooter(rep,s),opp=s==='h'?'a':'h',k=rep.side[opp].xi.find(x=>P()[x]&&P()[x].p==='TW'),r=R();
      dynAdd(rep,r<.42?{o,t:'save',s,txt:`${nmP(p)} zieht ab – ${nmP(k)} pariert stark`}:r<.5?{o,t:'post',s,txt:`Aluminium! ${nmP(p)} trifft nur den Pfosten`}:r<.82?{o,t:'miss',s,txt:rpick([`${nmP(p)} verzieht knapp`,`Schuss von ${nmP(p)} – deutlich drüber`,`${nmP(p)} kommt zum Abschluss, knapp vorbei`],R)}:{o,t:'block',s,txt:`${nmP(p)} versucht es, der Schuss wird geblockt`})}
    if(R()<(2+5*shOpp)/90)dynAdd(rep,{o,t:'corner',s,quiet:true});
    if(R()<(d.tac[s]==='pressing'?14:11)/90)dynAdd(rep,{o,t:'foul',s,quiet:true});
    if(R()<2/90)dynAdd(rep,{o,t:'off',s,quiet:true});
    if(R()<1.8/90){const p=rpick(rep.side[s].xi.filter(x=>P()[x]&&P()[x].p!=='TW'),R);if(p&&(!d.yel[p]||R()<.15)){d.yel[p]=(d.yel[p]||0)+1;
      if(d.yel[p]>=2){dynAdd(rep,{o,t:'red',s,txt:`Gelb-Rot für ${nmP(p)}!`});dynSendOff(rep,s,p)}else dynAdd(rep,{o,t:'yellow',s,txt:`Gelbe Karte für ${nmP(p)} ${rpick(['nach einem taktischen Foul','wegen Meckerns','nach einem harten Zweikampf'],R)}`})}}
    if(R()<0.035/90*90/90*1.0&&R()<.5){const p=rpick(rep.side[s].xi.filter(x=>P()[x]&&P()[x].p!=='TW'),R);if(p){dynAdd(rep,{o,t:'red',s,txt:`Rote Karte! ${nmP(p)} muss nach einer Notbremse vom Platz`});dynSendOff(rep,s,p)}}
  }
  // KI-Wechsel und Taktikanpassung (Gegner; bei aktivem Co-Trainer auch für Mein Verein)
  const mi=Math.floor(o%100),half=Math.floor(o/100);
  for(const s of ['h','a']){const auto=s!==d.fav||d.cosub;if(!auto||half<1)continue;
    if(d.subs[s]<5&&mi>=58&&R()<(mi>=80?.25:.07)){const out=rep.side[s].xi.filter(x=>P()[x]&&P()[x].p!=='TW').sort((a,b)=>(d.entered[a]||0)-(d.entered[b]||0)||P()[a].s-P()[b].s)[0];
      const same=rep.side[s].bench.find(x=>P()[x]&&P()[x].p===P()[out].p)||rep.side[s].bench.find(x=>P()[x]&&P()[x].p!=='TW');if(out&&same)dynSub(rep,s,out,same,o)}
    if(s!==d.fav&&mi===70){const [hs,as]=liveScore(rep,o),diff=s==='h'?hs-as:as-hs;const nt=diff<0?'offensiv':diff>0?'defensiv':d.tac[s];if(nt!==d.tac[s]){d.tac[s]=nt;dynAdd(rep,{o,t:'tac',s,txt:`${T(rep.side[s].id).name} stellt um: ${STYLES[nt].n}`})}}}
}
function dynShooter(rep,s){const p=rep.side[s].xi.filter(x=>P()[x]&&P()[x].p!=='TW');return wpickR(p,p.map(x=>({ST:6,MF:3,AB:1}[P()[x].p]||1)*(0.6+P()[x].s/100)),Math.random)}
const GOALTXT=[(p,a)=>`${p} schiebt ${a?`nach Vorlage von ${a} `:''}flach ins lange Eck ein`,(p,a)=>`Kopfball ${p}${a?` nach Flanke von ${a}`:''} – drin!`,(p,a)=>`${p} hämmert den Ball aus 18 Metern in den Winkel`,(p,a)=>`${p} staubt nach einem Abpraller ab`,(p,a)=>`${a?a+' steckt durch, ':''}${p} bleibt eiskalt vor dem Tor`,(p,a)=>`${p} vollendet einen schönen Konter${a?` über ${a}`:''}`];
function dynGoal(rep,s,o){const R=Math.random,r=R();
  if(r<.03){const opp=s==='h'?'a':'h',p=rpick(rep.side[opp].xi,R);dynAdd(rep,{o,t:'goal',s,og:true,sc:p,txt:`Eigentor! ${nmP(p)} lenkt den Ball unglücklich ins eigene Netz`});return}
  const p=dynShooter(rep,s);if(r<.11){dynAdd(rep,{o,t:'goal',s,sc:p,pen:true,txt:`Elfmeter! ${nmP(p)} verwandelt sicher`});return}
  const cand=rep.side[s].xi.filter(x=>x!==p&&P()[x]&&P()[x].p!=='TW'),a=R()<.72&&cand.length?rpick(cand,R):null;
  dynAdd(rep,{o,t:'goal',s,sc:p,as:a,txt:rpick(GOALTXT,R)(nmP(p),a?nmP(a):null)})}
function dynSendOff(rep,s,pid){rep.side[s].xi=rep.side[s].xi.filter(x=>x!==pid);rep.dyn.reds[s]++}
function dynSub(rep,s,out,inn,o){const d=rep.dyn;if(d.subs[s]>=5)return false;const sd=rep.side[s];if(!sd.xi.includes(out)||!sd.bench.includes(inn))return false;
  sd.xi=sd.xi.map(x=>x===out?inn:x);sd.bench=sd.bench.filter(x=>x!==inn);d.subs[s]++;d.entered[inn]=Math.floor(o%100);d.left[out]=Math.floor(o%100);
  dynAdd(rep,{o:o+0.05,t:'sub',s,txt:`Wechsel: ${nmP(inn)} kommt für ${nmP(out)}`});return true}
function dynEndCheck(ov,o){const rep=ov.rep,d=rep.dyn,m=ov.m;o=o??rep.ticks[rep.ticks.length-1];const [h,a]=liveScore(rep,999);const half=Math.floor(o/100);
  if(d.cup&&h===a&&half<=1){rep.et=true;dynAdd(rep,{o,t:'ft90',txt:'Nach 90 Minuten steht es unentschieden – Verlängerung!'});
    for(let i=91;i<=105;i++)rep.ticks.push(200+i);rep.ticks.push(200+105.1+0.09);for(let i=106;i<=120;i++)rep.ticks.push(300+i);rep.ticks.push(300+120.2+0.09);d.markers.push(200+105.1+0.09,300+120.2+0.09);return}
  if(d.cup&&h===a&&half>=3){rep.pens=true;d.pk={h:0,a:0,kh:0,ka:0,list:{h:rep.side.h.xi.filter(x=>P()[x]&&P()[x].p!=='TW').sort((x,y)=>P()[y].s-P()[x].s),a:rep.side.a.xi.filter(x=>P()[x]&&P()[x].p!=='TW').sort((x,y)=>P()[y].s-P()[x].s)}};
    dynAdd(rep,{o,t:'ft',txt:'Auch nach 120 Minuten keine Entscheidung – Elfmeterschießen!'});rep.ticks.push(400);return}
  dynAdd(rep,{o,t:'ft',txt:rep.et?'Abpfiff nach Verlängerung':'Abpfiff'});dynCommit(ov)}
function dynPenStep(ov){const rep=ov.rep,d=rep.dyn,k=d.pk,o=rep.ticks[ov.i];const s=(k.kh+k.ka)%2===0?'h':'a';const n=s==='h'?k.kh:k.ka;
  const p=k.list[s][n%Math.max(1,k.list[s].length)],hit=Math.random()<.74+((P()[p]?P()[p].s:60)-60)/400;
  if(s==='h'){k.kh++;if(hit)k.h++}else{k.ka++;if(hit)k.a++}
  dynAdd(rep,{o,t:hit?'pgoal':'pmiss',s,txt:`${nmP(p)} ${hit?'verwandelt':'scheitert'} – ${k.h}:${k.a}`});
  const r=Math.max(k.kh,k.ka),decided=(k.kh<=5&&k.ka<=5&&(k.h+(5-k.kh)<k.a||k.a+(5-k.ka)<k.h))||(k.kh===k.ka&&k.kh>=5&&k.h!==k.a);
  if(decided){const w=k.h>k.a?ov.m.h:ov.m.a;dynAdd(rep,{o:o+0.5,t:'end',txt:`${T(w).name} gewinnt das Elfmeterschießen ${k.h}:${k.a}`});dynCommit(ov)}else rep.ticks.push(o+1)}
function dynCommit(ov){const rep=ov.rep,m=ov.m,d=rep.dyn;if(rep.done)return;const [h,a]=liveScore(rep,9999);m.hg=h;m.ag=a;m.lv=1;try{const gs={h:[],a:[]};rep.ev.filter(e=>e.t==='goal'&&!e.og&&e.o<=9999).forEach(e=>gs[e.s].push([e.sc,e.as||null]));m.gs=gs}catch(e){}
  if(rep.et)m.et=true;if(rep.pens)m.pen=[d.pk.h,d.pk.a];
  if(d.cup){m.w=m.pen?(m.pen[0]>m.pen[1]?m.h:m.a):(m.hg>m.ag?m.h:m.a);afterMatch(m,9)}
  try{const end=rep.et?120:90,mins={};Object.keys(d.entered).forEach(pid=>{const a=d.entered[pid]||0,b=d.left[pid]??end;mins[pid]=Math.max(0,Math.min(end,b)-a)*(90/end)*(end>90?1.25:1)});
    const fs=m.h===S.fav?'h':m.a===S.fav?'a':null;[['h',m.h],['a',m.a]].forEach(([s,id])=>tire(id,s===fs?mins:null))}catch(e){console.warn(e)}
  rep.done=true;ov.i=rep.ticks.length-1;ov.playing=false;save()}
function dynFinish(ov){let g=0;while(!ov.rep.done&&g++<400){if(ov.htTalk)ov.htTalk=false;dynStep(ov)}}
// Kabinenansprache zur Halbzeit
function dynTalk(ov,kind){const rep=ov.rep,d=rep.dyn;if(d.talked)return;d.talked=true;const [h,a]=liveScore(rep,999),diff=d.fav==='h'?h-a:a-h,mo=T(S.fav).mo??60,R=Math.random;
  let eff=0,txt='';
  if(kind==='mot'){eff=diff<0?1.5+R():diff===0?1+R()*0.8:0.3+R()*0.5;txt='Der Trainer heizt seiner Mannschaft in der Kabine ein.'}
  if(kind==='calm'){eff=diff>0?1.2+R()*0.6:0.4+R()*0.6;txt='Der Trainer bleibt ruhig und schwört sein Team auf die zweite Halbzeit ein.'}
  if(kind==='crit'){eff=diff<0&&mo>=45?2+R()*1.2:diff>0?-1-R():(R()<.5?1.5:-1.2);txt='Der Trainer wird in der Kabine deutlich laut.'}
  d.talk=+eff.toFixed(2);ov.htTalk=false;dynAdd(rep,{o:rep.ticks[ov.i]+0.01,t:'tac',s:d.fav,txt:txt+(eff>=1.2?' Die Mannschaft kommt sichtbar motiviert aus der Kabine.':eff<0?' Die Ansprache verunsichert einige Spieler.':'')})}
function dynSetTac(ov,style){const d=ov.rep.dyn;if(!d.fav||!STYLES[style])return;if(d.tac[d.fav]!==style){d.tac[d.fav]=style;dynAdd(ov.rep,{o:ov.rep.ticks[ov.i]+0.02,t:'tac',s:d.fav,txt:`${T(S.fav).name} stellt um: ${STYLES[style].n}`})}}
// Bedienfeld unter der Anzeigetafel
function dynControls(ov){const rep=ov.rep,d=rep.dyn;if(!d||!d.fav||rep.done)return '';const s=d.fav,sd=rep.side[s];
  const talk=ov.htTalk?`<div class="card offer"><h3 class="ct">Kabinenansprache</h3><p class="note">Wie gehst du in die Pause? Die Wirkung hängt vom Spielstand und der Stimmung im Team ab.</p><div class="ctrls"><button class="btn pri" data-act="mtalk:mot">Motivieren</button><button class="btn" data-act="mtalk:calm">Beruhigen</button><button class="btn" data-act="mtalk:crit">Kritisieren</button><button class="btn" data-act="mtalk:skip">Nichts sagen</button></div></div>`:'';
  const opts=a=>a.map(pid=>`<option value="${pid}">${P()[pid].p} ${esc(P()[pid].n)} (${P()[pid].s.toFixed(0)})</option>`).join('');
  return `${talk}<div class="card"><div class="hd"><h3 class="ct" style="margin:0">Coaching</h3><span class="tag">${5-d.subs[s]} Wechsel übrig</span></div>
   <div class="chipbar" style="flex-wrap:wrap">${Object.entries(STYLES).map(([k,v])=>`<button class="${d.tac[s]===k?'on':''}" data-act="mtac:${k}" title="${esc(v.d)}">${v.n}</button>`).join('')}</div>
   ${d.subs[s]<5&&sd.bench.length?`<div class="subrow"><label>Raus<select id="subOut">${opts(sd.xi.filter(x=>P()[x]).sort((a,b)=>(P()[a].p==='TW')-(P()[b].p==='TW')))}</select></label><label>Rein<select id="subIn">${opts(sd.bench.filter(x=>P()[x]))}</select></label><label>&nbsp;<button class="btn pri" data-act="msub">Wechseln</button></label></div>`:''}
   <label class="tog"><input type="checkbox" data-act="mcosub" ${d.cosub?'checked':''}> Co-Trainer übernimmt die Wechsel</label></div>`}
