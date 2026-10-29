// ---------- 2D-Spielfeld für Live-Spiele ----------
// Koordinaten: x 0..100 (Heim spielt nach rechts), y 0..64
const PITCH={cv:null,raf:0,key:null,pl:{},ball:{x:50,y:32},hold:null,next:0,poss:'h',possT:0,cap:'',capT:0,lastEv:null,t0:0};
const PCOL={h:'#d64545',a:'#2f6fdf',hk:'#f2b01e',ak:'#21b36b'};
function pitchSlots(xi,s){const by={TW:[],AB:[],MF:[],ST:[]};xi.forEach(pid=>{const p=P()[pid];(by[p?p.p:'MF']||by.MF).push(pid)});
  const X={TW:4,AB:20,MF:38,ST:56},out=[];
  for(const k of ['TW','AB','MF','ST']){const g=by[k],n=g.length;g.forEach((pid,i)=>{const y=n===1?32:8+i*(48/(n-1));const x=X[k]+(k!=='TW'&&n>=4&&(i===0||i===n-1)?3:0);out.push({pid,x:s==='h'?x:100-x,y,k})})}
  return out}
function pitchReset(ov){const rep=ov.rep;PITCH.pl={};
  for(const s of ['h','a'])pitchSlots(rep.side[s].xi,s).forEach((q,i)=>PITCH.pl[q.pid]={s,bx:q.x,by:q.y,x:q.x,y:q.y,k:q.k,no:i+1});
  PITCH.ball={x:50,y:32};PITCH.hold=null;PITCH.lastEv=null;PITCH.cap='';PITCH.capT=0}
function pitchSync(ov){const rep=ov.rep;const live=new Set([...rep.side.h.xi,...rep.side.a.xi]);
  for(const pid of Object.keys(PITCH.pl))if(!live.has(pid))delete PITCH.pl[pid];
  for(const s of ['h','a']){const sl=pitchSlots(rep.side[s].xi,s);sl.forEach((q,i)=>{const e=PITCH.pl[q.pid];if(e){e.bx=q.x;e.by=q.y;e.k=q.k}else PITCH.pl[q.pid]={s,bx:q.x,by:q.y,x:s==='h'?45:55,y:q.y,k:q.k,no:Object.values(PITCH.pl).filter(z=>z.s===s).length+1}})}}
function mountPitch(){const slot=document.getElementById('pitchSlot');if(!slot)return;
  if(!PITCH.cv){PITCH.cv=document.createElement('canvas');PITCH.cv.className='pitch';PITCH.cv.setAttribute('aria-label','2D-Spielfeld')}
  slot.appendChild(PITCH.cv);if(!PITCH.raf)PITCH.raf=requestAnimationFrame(pitchLoop)}
const ACT_EV={goal:1,save:1,miss:1,post:1,block:1,corner:1,foul:1,yellow:1,red:1,off:1,pgoal:1,pmiss:1};
function pitchLoop(ts){const ov=view.ov;
  if(!ov||ov.t!=='match'||!PITCH.cv||!document.body.contains(PITCH.cv)){PITCH.raf=0;PITCH.key=null;return}
  PITCH.raf=requestAnimationFrame(pitchLoop);
  const rep=ov.rep;if(!rep||!rep.side)return;const key=(ov.m.h+'-'+ov.m.a+'-'+(ov.replay?'r':''));
  if(PITCH.key!==key||(ov.i===0&&PITCH.lastI!==0)){PITCH.key=key;pitchReset(ov)}PITCH.lastI=ov.i;
  pitchSync(ov);
  const i=Math.min(ov.i,rep.ticks.length-1),o=rep.ticks[i],end=rep.dyn?rep.done&&i>=rep.ticks.length-1:i>=rep.ticks.length-1;
  // aktuelles Ereignis
  let ev=null;for(let k=rep.ev.length-1;k>=0;k--){const e=rep.ev[k];if(e.o>o)continue;if(o-e.o>1.01)break;if(ACT_EV[e.t]&&e.s){ev=e;break}}
  if(ev&&ev!==PITCH.lastEv){PITCH.lastEv=ev;PITCH.evT=ts;const nm=x=>P()[x]?P()[x].n.split(' ').slice(-1)[0]:'';
    PITCH.cap=ev.t==='goal'?`⚽ TOR! ${nm(ev.sc)}`:ev.t==='save'?'🧤 Parade!':ev.t==='post'?'▮ Aluminium!':ev.t==='miss'?'↗ Daneben':ev.t==='block'?'■ Geblockt':ev.t==='corner'?'⚑ Ecke':ev.t==='yellow'?'🟨 Gelb':ev.t==='red'?'🟥 Rot!':ev.t==='off'?'Abseits':ev.t==='foul'?'Foul':ev.t==='pgoal'?'⚽ verwandelt':ev.t==='pmiss'?'✕ verschossen':'';PITCH.capT=ts}
  const pl=PITCH.pl,b=PITCH.ball,dt=ov.playing?1:.35;const side=s=>Object.entries(pl).filter(([,v])=>v.s===s);
  const ballTarget={x:b.x,y:b.y};let mode='play';
  if(i===0||end||(rep.ev.some(e=>(e.t==='ht'||e.t==='kick2')&&Math.abs(e.o-o)<.01))){mode='kick';ballTarget.x=50;ballTarget.y=32;PITCH.hold=null}
  else if(ev&&ts-PITCH.evT<2600){const s=ev.s,dir=s==='h'?1:-1,gx=s==='h'?100:0;mode=ev.t;
    if(ev.t==='goal'||ev.t==='pgoal'){ballTarget.x=gx+dir*1.2;ballTarget.y=32+Math.sin(ts/300)*1.2}
    else if(ev.t==='save'||ev.t==='pmiss'){ballTarget.x=gx-dir*3;ballTarget.y=29}
    else if(ev.t==='post'){ballTarget.x=gx-dir*.5;ballTarget.y=28.3}
    else if(ev.t==='miss'){ballTarget.x=gx+dir*1;ballTarget.y=20}
    else if(ev.t==='block'){ballTarget.x=gx-dir*15;ballTarget.y=34}
    else if(ev.t==='corner'){ballTarget.x=gx-dir*.8;ballTarget.y=(ev.o*7|0)%2?1:63}
    else {ballTarget.x=50+dir*18;ballTarget.y=26+((ev.o*13|0)%12)}
    PITCH.hold=null;PITCH.poss=s}
  else{ // offenes Spiel: Ballbesitz wechselt, Ball wird zwischen Mitspielern gepasst
    const ph=(rep.pos||50)/100;if(ts>PITCH.possT){PITCH.poss=Math.random()<ph?'h':'a';PITCH.possT=ts+1800+Math.random()*2600;PITCH.hold=null}
    const mine=side(PITCH.poss);if(!PITCH.hold||!pl[PITCH.hold]||ts>PITCH.next){const dir=PITCH.poss==='h'?1:-1;
      const cand=mine.filter(([pid,v])=>pid!==PITCH.hold&&v.k!=='TW');const w=cand.map(([,v])=>Math.max(.2,1+dir*(v.x-b.x)/25)*(1/(1+Math.hypot(v.x-b.x,v.y-b.y)/30)));
      let r=Math.random()*w.reduce((a,c)=>a+c,0),pick=cand[0];for(let k=0;k<cand.length;k++){r-=w[k];if(r<=0){pick=cand[k];break}}
      if(pick){PITCH.hold=pick[0];PITCH.next=ts+(700+Math.random()*900)/(ov.speed===3?2:1)}}
    const hp=pl[PITCH.hold];if(hp){ballTarget.x=hp.x+(PITCH.poss==='h'?1.2:-1.2);ballTarget.y=hp.y}}
  // Ball bewegen
  const kb=mode==='goal'?.12:.09*dt;b.x+=(ballTarget.x-b.x)*kb;b.y+=(ballTarget.y-b.y)*kb;
  // Spieler: Grundposition + Verschiebung zum Ball
  const sh=(b.x-50)*.42,t=ts/1000;
  for(const [pid,v] of Object.entries(pl)){let tx=v.bx+sh,ty=v.by+(b.y-v.by)*.16;
    if(v.k==='TW'){tx=v.bx+(b.x-50)*.05;ty=32+(b.y-32)*.18}
    if(mode==='corner'||mode==='goal'||mode==='save'||mode==='miss'||mode==='post'){const s=ev.s,gx=s==='h'?92:8;if(v.k!=='TW'&&((v.s===s&&v.k!=='AB')||(v.s!==s&&v.k==='AB'))){tx=gx+(v.s===s?-1:1)*(s==='h'?-1:1)*((v.no*7)%9);ty=20+((v.no*11)%24)}}
    if(mode==='kick'){tx=v.s==='h'?Math.min(v.bx,48):Math.max(v.bx,52);ty=v.by}
    tx+=Math.sin(t*1.3+v.no)*1.2;ty+=Math.cos(t*1.1+v.no*2)*1.1;
    if(pid===PITCH.hold){tx=b.x-(v.s==='h'?1.2:-1.2);ty=b.y}
    const k=.045*dt;v.x+=(Math.max(1,Math.min(99,tx))-v.x)*k;v.y+=(Math.max(1,Math.min(63,ty))-v.y)*k}
  drawPitch(ts)}
function drawPitch(ts){const cv=PITCH.cv,W=Math.max(240,Math.min(900,cv.parentElement.clientWidth||320)),H=Math.round(W*.62),dpr=window.devicePixelRatio||1;
  if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cv.style.width=W+'px';cv.style.height=H+'px'}
  const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);const sx=W/100,sy=H/64,X=x=>x*sx,Y=y=>y*sy;
  for(let k=0;k<10;k++){c.fillStyle=k%2?'#2f8a3e':'#2a7f39';c.fillRect(k*W/10,0,W/10+1,H)}
  c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=1.5;c.strokeRect(X(1),Y(1),X(98),Y(62));
  c.beginPath();c.moveTo(X(50),Y(1));c.lineTo(X(50),Y(63));c.stroke();c.beginPath();c.arc(X(50),Y(32),X(8.5),0,7);c.stroke();
  for(const g of [0,1]){const x0=g?99:1,d=g?-1:1;c.strokeRect(Math.min(X(x0),X(x0+d*16)),Y(14),X(16),Y(36));c.strokeRect(Math.min(X(x0),X(x0+d*5.5)),Y(24),X(5.5),Y(16));
    c.fillStyle='rgba(255,255,255,.9)';c.fillRect(g?X(99):X(0),Y(28.5),X(1),Y(7))}
  const r=Math.max(6,W*.021);c.font=`700 ${Math.round(r*1.05)}px system-ui,sans-serif`;c.textAlign='center';c.textBaseline='middle';
  for(const [pid,v] of Object.entries(PITCH.pl)){c.beginPath();c.arc(X(v.x),Y(v.y),r,0,7);c.fillStyle=v.k==='TW'?PCOL[v.s+'k']:PCOL[v.s];c.fill();
    c.lineWidth=pid===PITCH.hold?2.5:1;c.strokeStyle=pid===PITCH.hold?'#fff':'rgba(0,0,0,.35)';c.stroke();c.fillStyle='#fff';c.fillText(String(v.no),X(v.x),Y(v.y)+.5)}
  const b=PITCH.ball;c.beginPath();c.arc(X(b.x)+1.5,Y(b.y)+2,r*.5,0,7);c.fillStyle='rgba(0,0,0,.3)';c.fill();
  c.beginPath();c.arc(X(b.x),Y(b.y),r*.52,0,7);c.fillStyle='#fff';c.fill();c.lineWidth=1;c.strokeStyle='#111';c.stroke();
  if(PITCH.cap&&ts-PITCH.capT<2600){const a=Math.min(1,(2600-(ts-PITCH.capT))/500);c.globalAlpha=a;c.font=`700 ${Math.round(W*.04)}px system-ui,sans-serif`;
    const tw=c.measureText(PITCH.cap).width+20;c.fillStyle='rgba(0,0,0,.6)';c.fillRect(W/2-tw/2,8,tw,W*.06);c.fillStyle='#fff';c.fillText(PITCH.cap,W/2,8+W*.03);c.globalAlpha=1}}
function pitchCard(ov){if(ov.nob??S.noBoard)return `<div class="pitchbar"><button class="btn sm" data-act="mboard">🟩 2D-Spielfeld zeigen</button></div>`;
  const tn=s=>esc(T(ov.rep.side[s].id).name);
  return `<div class="card pitchc"><div class="hd" style="margin-bottom:6px"><span class="meta"><span class="dot" style="background:${PCOL.h}"></span> ${tn('h')} → &nbsp; ← <span class="dot" style="background:${PCOL.a}"></span> ${tn('a')}</span><button class="btn sm" data-act="mboard">Ausblenden</button></div><div id="pitchSlot"></div></div>`}
