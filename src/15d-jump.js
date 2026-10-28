// ---------- Zeitsprung: mehrere Saisons am Stück simulieren ----------
const JUMP={run:false,stop:false};
function jumpHTML(){const o=JUMP.run&&JUMP.o?JUMP.o:view.ov;
  if(!o.running){const opts=[1,5,10,25,50,100];
    return `<div class="ovc"><p class="meta" style="margin-top:0">Das Spiel simuliert komplette Saisons inklusive Auf- und Abstieg, Pokalen, Europapokal, Transfers, Finanzen und Sportgericht. Live-Spiele und Gespräche laufen automatisch.</p>
     <div class="jopts">${opts.map(n=>`<button class="mbtn${o.n===n?' pri':''}" data-act="jumpn:${n}"><span>${n} ${n===1?'Jahr':'Jahre'}</span><span class="meta">bis ${S.season+n}/${String(S.season+n+1).slice(2)}</span></button>`).join('')}</div>
     <label class="mfield" style="margin-top:10px">Eigene Anzahl Jahre<input id="jumpN" class="search" type="number" min="1" max="500" value="${o.n||10}"></label>
     ${isCareer()?'<p class="note">Karriere: Dein Trainer arbeitet in dieser Zeit weiter. Er kann Angebote verpassen, entlassen werden oder ohne Verein bleiben.</p>':''}
     <p class="note">Dauer: etwa 1–2 Sekunden pro Saison. Der Spielstand wird alle 10 Saisons gesichert, du kannst jederzeit anhalten.</p>
     <button class="btn pri" style="width:100%;margin-top:6px" data-act="jumpgo">⏩ Zeitsprung starten</button></div>`}
  const pct=Math.round(o.done/o.n*100),el=(Date.now()-o.t0)/1000,eta=o.done?Math.round(el/o.done*(o.n-o.done)):null;
  return `<div class="ovc"><div class="meta">Saison ${S.season}/${String(S.season+1).slice(2)} · ${o.done} von ${o.n} Jahren</div>
   <div class="prog" style="margin:10px 0"><i style="width:${pct}%"></i></div>
   <div class="meta">${eta!=null?`noch etwa ${eta>90?Math.round(eta/60)+' Minuten':eta+' Sekunden'}`:'startet …'}</div>
   ${o.champs.length?`<h3 class="ct" style="margin-top:14px">Deutsche Meister</h3><div class="jlist">${o.champs.slice(-8).reverse().map(([s,id])=>`<div><span class="meta">${sl2(s)}</span> ${esc(T(id)?T(id).name:'?')}</div>`).join('')}</div>`:''}
   ${S.fav&&T(S.fav)?`<p class="meta" style="margin-top:10px">★ ${esc(T(S.fav).name)}: ${esc((lgOf(S.fav)||{}).name||'–')}</p>`:''}
   <button class="btn" style="width:100%;margin-top:10px" data-act="jumpstop"${o.stopping?' disabled':''}>${o.stopping?'Hält nach dieser Saison an …':'Anhalten'}</button></div>`}
function paintJump(){if(JUMP.o&&view.ov!==JUMP.o){view.ov=JUMP.o;render();return}const c=document.querySelector('#ov .ovc');if(c){c.outerHTML=jumpHTML();document.querySelectorAll('#ov [data-act]').forEach(b=>b.onclick=()=>act(b.dataset.act))}}
const tick=()=>new Promise(r=>setTimeout(r,0));
async function runJump(n){if(JUMP.run)return;JUMP.run=true;JUMP.stop=false;const o=view.ov;JUMP.o=o;Object.assign(o,{running:true,n,done:0,t0:Date.now(),champs:[]});render();
  try{for(let y=0;y<n&&!JUMP.stop;y++){
      let g=0;while(!S.done&&g++<420){simDay();if(g%60===0){paintJump();await tick()}}
      const bl=L('bl');const ch=bl&&table(bl)[0];if(ch)o.champs.push([S.season,ch.id]);
      newSeason();o.done=y+1;
      if((y+1)%10===0)save();paintJump();await tick()}}
  catch(e){console.error(e);toast('Zeitsprung abgebrochen: '+e.message)}
  finally{JUMP.run=false;JUMP.o=null;save();const d=o.done;view.ov=null;view={tab:'season',chron:0};render();toast(`${d} ${d===1?'Saison':'Saisons'} simuliert – willkommen in ${S.season}/${String(S.season+1).slice(2)}`)}}
