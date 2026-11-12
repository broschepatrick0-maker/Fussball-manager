// ---------- Pressekonferenz vor dem nächsten Pflichtspiel von Mein Verein ----------
// S.press = {key, day, opp, a:{q1,q2}, b:Stärkebonus, done:false} – wird nach dem Spiel ausgewertet
function pressNext(){if(!S.fav||!T(S.fav)||S.done)return null;const id=S.fav;const x=clubFixtures(id).find(f=>!f.done&&f.m&&f.m.hg==null&&f.day>=S.day);if(!x)return null;
  const opp=x.m.h===id?x.m.a:x.m.h;if(!T(opp))return null;return {x,opp,key:(x.ctx&&x.ctx.key||x.comp+':'+x.rd)+':'+opp}}
// Wie wichtig ist das Spiel? (für Hinweis und Wirkung)
function pressImp(n){const id=S.fav,x=n.x,lg=lgOf(id);let imp=0,why=[];
  if(derbyOf(x.m.h,x.m.a)){imp+=2;why.push('Derby')}
  if(x.k==='E'){imp+=2;why.push('Europapokal')}else if(x.cup){imp+=1;why.push('Pokal')}
  if(lg&&x.k==='L'&&lg.played>=5){const tb=table(lg),a=tb.findIndex(r=>r.id===id),b=tb.findIndex(r=>r.id===n.opp);if(a>=0&&b>=0){if(a<3&&b<3){imp+=2;why.push('Spitzenspiel')}else if(Math.abs(a-b)<=2&&(a>=tb.length-4)){imp+=2;why.push('Abstiegskampf')}}
    if(lg.rounds.length-lg.played<=4){imp+=1;why.push('Saisonendspurt')}}
  return {imp,why}}
const PQ1=[
  ['sieg','„Wir wollen gewinnen – und wir werden gewinnen.“','Selbstbewusst: Die Mannschaft legt los (+Stärke), aber eine Niederlage wiegt schwerer.'],
  ['respekt','„Großer Respekt vor dem Gegner, aber wir wollen etwas mitnehmen.“','Sicher: kleiner Schub, kaum Risiko.'],
  ['druck','„Der Druck liegt beim Gegner.“','Gut als Außenseiter. Als Favorit wirkt es überheblich.'],
  ['nix','„Dazu sage ich heute nichts.“','Keine Wirkung, die Fans hätten gern mehr gehört.']];
function pressQ2(n){const id=S.fav,sq=ensureSquad(id).map(pid=>[pid,P()[pid]]).filter(x=>x[1]&&!x[1].inj),star=sq.slice().sort((a,b)=>(b[1].fo||0)-(a[1].fo||0)||b[1].s-a[1].s)[0];
  const last=teamMatches(id).filter(x=>x.done&&x.m&&x.m.hg!=null).sort((a,b)=>(a.day??0)-(b.day??0)).pop(),lost=last&&res(last.m,id)==='N';
  const o=[];if(star)o.push(['lob',`„${star[1].n} ist in herausragender Verfassung.“`,`${star[1].n} wird gestärkt (Form ↑).`,star[0]]);
  o.push(['kritik','„Das war zuletzt zu wenig. Ich erwarte eine Reaktion.“',lost?'Nach der Niederlage weckt das die Mannschaft auf (+Stärke), drückt aber die Stimmung.':'Ohne Anlass verunsichert Kritik die Mannschaft.']);
  if(derbyOf(n.x.m.h,n.x.m.a))o.push(['derby','„Die Stadt gehört uns!“','Heizt das Derby an (+Stärke) – eine Niederlage schmerzt doppelt.']);
  else o.push(['jung','„Unsere Jungen sind bereit für mehr.“','Spieler bis 21 Jahre gewinnen an Form.']);
  o.push(['uns','„Wir schauen nur auf uns.“','Ruhig und sachlich: leichter Schub, kein Risiko.']);return o}
// Stärke-Bonus von Mein Verein bis zum Spiel
function pressBonus(id){const p=S.press;if(!p||p.done||id!==S.fav||S.day>p.day)return 0;return p.b||0}
function pressGive(q1,q2){const n=pressNext();if(!n)return;const id=S.fav,dr=effR(n.opp)-(effR(id)-pressBonus(id)),dog=dr>2,imp=pressImp(n).imp,o2=pressQ2(n).find(x=>x[0]===q2);
  const lost=(()=>{const l=teamMatches(id).filter(x=>x.done&&x.m&&x.m.hg!=null).sort((a,b)=>(a.day??0)-(b.day??0)).pop();return l&&res(l.m,id)==='N'})();
  let b={sieg:1.0,respekt:.4,druck:dog?.9:-.6,nix:0}[q1]??0;b+={kritik:lost?.7:-.5,derby:.9,uns:.2,lob:.2,jung:.1}[q2]??0;b*=1+Math.min(2,imp)*.15;
  // dieselbe Ansage nutzt sich ab
  const hist=S.pressH||(S.pressH=[]),rep=hist.filter(x=>x===q1).length;if(b>0&&q1!=='nix')b/=1+rep*.4;hist.push(q1);if(hist.length>4)hist.shift();
  const t=T(id);if(q1==='nix')t.mo=Math.max(5,(t.mo??60)-1);if(q2==='kritik')t.mo=Math.max(5,(t.mo??60)-(lost?2:5));
  if(q2==='lob'&&o2&&P()[o2[3]]){const p=P()[o2[3]];p.fo=+Math.min(3,(p.fo||0)+.8).toFixed(1)}
  if(q2==='jung')ensureSquad(id).forEach(pid=>{const p=P()[pid];if(p&&p.a<=21)p.fo=+Math.min(3,(p.fo||0)+.5).toFixed(1)});
  S.press={key:n.key,day:n.x.day,opp:n.opp,a:{q1,q2},b:+b.toFixed(2),done:false,imp};
  const qa=PQ1.find(x=>x[0]===q1),qb=o2;
  try{addNews({cat:'fav',clubs:[id,n.opp],h:`Pressekonferenz: ${t.name} vor dem Spiel gegen ${T(n.opp).name}`,b:`${qa?qa[1]:''} ${qb?qb[1]:''}`.trim(),pr:q(id,'tr',qa&&q1!=='nix'?qa[1].replace(/[„“]/g,''):'Kein Kommentar.'),imp:imp>=2?3:2})}catch(e){}
  const a=ACH();a.c.press=(a.c.press||0)+1;if(a.c.press>=10)try{achUnlock('presse')}catch(e){}
  recalc(id)}
// Auswertung, sobald das Spiel gespielt ist (täglich aus simDay)
function pressCheck(){const p=S.press;if(!p||p.done||S.day<p.day)return;const id=S.fav;if(!id||!T(id)){S.press=null;return}
  const x=teamMatches(id).find(f=>{const opp=f.m&&(f.m.h===id?f.m.a:f.m.h);return opp===p.opp&&f.day===p.day&&f.m.hg!=null});
  if(!x){if(S.day>p.day+2)S.press=null;return}
  const r=res(x.m,id),t=T(id),big=(p.imp||0)>=2,c=isCareer()&&S.career&&S.career.club===id?S.career:null;let d=0,cf=0,txt='';
  if(p.a.q1==='sieg'){if(r==='S'){d=6;cf=2;txt='Ankündigung gehalten – die Fans feiern den Trainer.';const a=ACH();a.c.prom=(a.c.prom||0)+1;if(a.c.prom>=5)try{achUnlock('grossmaul')}catch(e){}}else if(r==='U'){d=-2;txt='Großer Auftritt vor dem Spiel, nur ein Remis danach.'}else{d=-8;cf=-3;txt='Die vollmundige Ankündigung fällt dem Trainer auf die Füße.'}}
  else if(p.a.q1==='druck'){if(r==='N'){d=-3;txt='Am Ende lag der Druck doch bei uns.'}else if(r==='S'){d=3;txt='Die Rechnung ging auf.'}}
  else if(p.a.q1==='respekt'){if(r==='S'){d=2}else if(r==='N'){d=-1}}
  if(p.a.q2==='derby'){if(r==='S'){d+=4;txt=txt||'Das Derby gehört uns!'}else if(r==='N'){d-=6;cf-=2;txt=txt||'Die große Klappe vor dem Derby rächt sich.'}}
  if(big){d=Math.round(d*1.3)}
  t.mo=Math.max(5,Math.min(100,(t.mo??60)+d));if(c&&cf)c.conf=Math.max(0,Math.min(100,c.conf+cf));
  if(txt)try{addNews({cat:'fav',clubs:[id],h:`${t.name}: ${r==='S'?'Worten folgen Taten':r==='N'?'Gegenwind nach der Pressekonferenz':'Gemischte Reaktionen'}`,b:`${txt} Stimmung ${d>=0?'+':''}${d}${cf?`, Vertrauen des Vorstands ${cf>0?'+':''}${cf}`:''}.`,imp:2})}catch(e){}
  p.done=true;p.res=r;p.d=d}
// ---------- Ansicht ----------
function pressCardHTML(){const n=pressNext();if(!n)return '';const p=S.press&&S.press.key===n.key&&!S.press.done?S.press:null,i=pressImp(n);
  return `<div class="card presscard${i.imp>=2&&!p?' hot':''}"><div class="hd"><div><div class="meta">Vor dem Spiel gegen ${esc(T(n.opp).name)}${i.why.length?' · '+esc(i.why.join(', ')):''}</div><h3 class="ct" style="margin:0">🎤 Pressekonferenz</h3></div>
   ${p?`<span class="tag">Gegeben</span>`:`<button class="btn sm${i.imp>=2?' pri':''}" data-act="press">Vor die Presse</button>`}</div>
   <p class="meta" style="margin-top:6px">${p?`${esc((PQ1.find(x=>x[0]===p.a.q1)||[])[1]||'')} · Wirkung aufs Spiel: ${p.b>=0?'+':''}${p.b.toFixed(1)} Stärke`:i.imp>=2?'Ein wichtiges Spiel – deine Worte haben heute mehr Gewicht.':'Mit den richtigen Worten gibst du der Mannschaft einen Schub. Große Töne bergen Risiko.'}</p></div>`}
function pressHTML(o){const n=pressNext();if(!n)return `<div class="ovc"><p class="meta">Kein anstehendes Spiel.</p></div>`;const i=pressImp(n),q2=pressQ2(n),dr=effR(n.opp)-effR(S.fav);
  const rep=k=>(S.pressH||[]).filter(x=>x===k).length;const opt=(qn,[k,txt,hint])=>`<button class="stage${o[qn]===k?' on':''}" style="width:100%;margin-bottom:6px" data-act="pq:${qn}:${k}"><b>${esc(txt)}</b><span>${esc(hint)}${qn==='q1'&&k!=='nix'&&rep(k)?` · zuletzt ${rep(k)}× gesagt – wirkt schwächer`:''}</span></button>`;
  return `<div class="ovc press"><div class="m"><span class="h">${tl(n.x.m.h)}</span><span class="s open">${esc(n.x.rd.replace('. Spieltag','.'))}<small>${esc(n.x.comp)}</small></span><span class="a">${tl(n.x.m.a)}</span></div>
   <p class="note">${i.why.length?`<b>${esc(i.why.join(', '))}</b> – die Wirkung ist größer. `:''}${dr>2?`${esc(T(n.opp).name)} ist favorisiert.`:dr<-2?`Ihr seid klarer Favorit.`:'Ein Duell auf Augenhöhe.'}</p>
   <h4>„Herr Trainer, was erwarten Sie vom Spiel?“</h4>${PQ1.map(x=>opt('q1',x)).join('')}
   <h4 style="margin-top:12px">„Und wie steht es um die Mannschaft?“</h4>${q2.map(x=>opt('q2',x)).join('')}
   <div class="ctrls" style="justify-content:flex-end;margin-top:12px"><button class="btn" data-act="ovx">Abbrechen</button><button class="btn pri" data-act="pq:go"${o.q1&&o.q2?'':' disabled'}>Pressekonferenz beenden</button></div></div>`}
