// ---------- Finanzen: Umsatz, Kosten, Kredite, Insolvenz, Investoren ----------
const REVL={1:44e6,2:15.2e6,3:4.4e6,4:1.19e6,5:4.75e5,6:1.84e5,7:7.6e4,8:2.9e4,9:1.5e4,10:8e3,11:5e3,12:4e3};const REVF=48e6;
const MEDV={1:128e6,2:48e6,3:15.4e6,4:5.2e6,5:2.77e6,6:1.43e6,7:7.6e5,8:4.07e5,9:2.5e5,10:1.5e5,11:1e5,12:8e4};const MEDF=140e6;
const WRATIO={1:.24,2:.22,3:.2,4:.16,5:.12,6:.09,7:.07,8:.05,9:.04,10:.03,11:.02,12:.02};
const WCAP={1:2.2e7,2:2.5e6,3:6e5,4:1.5e5,5:6e4,6:3e4,7:1.5e4,8:8e3,9:5e3,10:3e3,11:2e3,12:1.5e3};
const LCAP={1:42000,2:22000,3:12000,4:5000,5:2500,6:1200,7:800,8:500,9:300,10:200,11:150,12:120};
const TPRICE={1:35,2:24,3:16,4:10,5:7,6:6,7:5,8:4,9:3,10:3,11:2,12:2};
const _lgc=new Map();let _lgArr=null,_lgLen=0;function lgOf(id){if(_lgArr!==S.leagues||_lgLen>S.leagues.length){_lgc.clear();_lgArr=S.leagues}_lgLen=S.leagues.length;const l=_lgc.get(id);if(l&&l.teams.includes(id))return l;const f=S.leagues.find(x=>x.teams.includes(id));if(f)_lgc.set(id,f);else _lgc.delete(id);return f}
function finLv(id){const l=lgOf(id);return l?{lv:l.level,f:!!l.foreign,lg:l}:null}
function FZ(id){const t=T(id);if(!t)return null;if(t.fz)return t.fz;
  const L_=finLv(id);if(!L_)return null;
  const R=srng(hstr('fz'+id+t.name));const est=estRevenue(id,L_);
  let c=t.bud!=null?Math.max(0,t.bud):est*(0.1+R()*0.35);
  if(id===S.fav&&S.fin&&S.fin.budget!=null)c=S.fin.budget;
  const d=R()<(L_.lv<=4?.45:.25)?Math.round(est*(0.15+R()*0.7)/1e3)*1e3:0;
  const att=Math.pow(Math.max(.2,Math.min(8,clubValue(id)/fmed(L_))),.55);
  t.fz={c:Math.round(c/1e3)*1e3,d,ir:d?0.045:0,wf:1,cap:Math.round(Math.min(81000,Math.max(150,(L_.f?40000:LCAP[L_.lv]||300)*att*(0.75+R()*0.5)))/50)*50,own:null,h:[],ins:[]};
  delete t.bud;return t.fz;
}
function fmed(L_){const k=L_.f?'F':L_.lv,m=S.fmed&&S.fmed[k];return m||(L_.f?MEDF:(MEDV[L_.lv]||1e5))}
function updMedians(){const o={};S.leagues.forEach(l=>{const k=l.foreign?'F':l.level;l.teams.forEach(id=>(o[k]=o[k]||[]).push(clubValue(id)))});S.fmed={};for(const k in o){const a=o[k].sort((x,y)=>x-y),cut=Math.floor(a.length*.05),b=a.slice(cut,a.length-cut||a.length);S.fmed[k]=b.reduce((x,y)=>x+y,0)/b.length}}
function estRevenue(id,L_){L_=L_||finLv(id);if(!L_)return 0;const med=fmed(L_),base=med*(L_.f?.24:(WRATIO[L_.lv]||.03))/(L_.lv>=5&&!L_.f?0.69:0.71);
  const attr=Math.max(.2,Math.min(8,clubValue(id)/med));return base*(0.3+0.7*attr)}
function wage(pid,lv){const p=P()[pid];if(!p)return 0;return value(pid)*(WRATIO[lv]||.03)}
function wageBill(id,lv){return ensureSquad(id).reduce((a,pid)=>a+wageOf(pid,id),0)}
function prizeMoney(id){
  const L_=finLv(id);const base=L_?(L_.f?REVF:(REVL[L_.lv]||8e3)):0;
  let euro=0;(S.euro||[]).forEach(e=>{if(e.teams.includes(id)){const r=euroReach(e,id);euro+=({ucl:18e6,uel:6e6,uecl:3e6}[e.id])*(r==='Sieger'?3:r==='Finale'?2.2:r==='Halbfinale'?1.8:r==='Viertelfinale'?1.5:r==='Achtelfinale'?1.25:1)}});
  let cup=0;S.cups.forEach(c=>{if(c.teams.includes(id)){const r=c.played?cupReach(c,id):null;if(c.type==='dfb')cup+=r==='Sieger'?6e6:r==='Finale'?3e6:r==='Halbfinale'?1.5e6:r==='Viertelfinale'?8e5:2e5;else if(r==='Sieger')cup+=base*.08;else if(r==='Finale')cup+=base*.03}});
  return {euro,cup};
}
// Saisonbilanz eines Vereins (perf: 0 = Letzter … 1 = Meister)
function finBalance(id,perf){
  const L_=finLv(id);if(!L_)return null;const z=FZ(id),lv=L_.f?1:L_.lv,lg=L_.lg;
  if(perf==null){const tb=table(lg),i=tb.findIndex(r=>r.id===id);perf=tb.length>1?1-i/(tb.length-1):.5}
  const seasonShare=lg.rounds.length?Math.max(.05,lg.played/lg.rounds.length):1;
  const total=estRevenue(id,L_)*(0.85+0.3*perf);
  const games=Math.max(1,lg.teams.length-1),price=L_.f?45:(TPRICE[lv]||3);
  const fill=Math.min(1,0.45+0.4*perf+Math.min(.25,0.05*Math.log2(1+clubValue(id)/fmed(L_))));
  const att=Math.round(z.cap*fill),zus=Math.min(att*games*price,total*.45);
  const rest=total-zus,pro=lv<=3||L_.f;
  const pm=prizeMoney(id);
  const inc={tv:pro?rest*.5:lv===4?rest*.12:0,zus,spons:rest*(pro?.32:lv===4?.55:.62),merch:pro?rest*.12:rest*.05,mitgl:pro?rest*.06:rest*(lv===4?.28:.33),praem:pm.euro+pm.cup};
  const wb=wageBill(id,lv);
  const rev=Object.values(inc).reduce((a,b)=>a+b,0);
  const exp={acad:id===S.fav&&S.acad?total*(ACAD[S.acad.lv]||{cost:0}).cost:0,scout:id===S.fav&&S.scout?total*(SCOUT_LV[S.scout.lv]||{cost:0}).cost:0,geh:wb,stad:stadUpkeep(lv,z.cap)+total*.03,verw:total*.09,jugend:total*.03,abg:total*.04,zins:z.d*(z.ir||0)};
  const ex=Object.values(exp).reduce((a,b)=>a+b,0);
  return {inc,exp,rev,ex,res:rev-ex,att,share:seasonShare,lv};
}
const INC_N={tv:'TV-Gelder',zus:'Zuschauer',spons:'Sponsoring',merch:'Merchandising',mitgl:'Mitglieder & Sonstiges',praem:'Prämien (Pokal & Europa)'};
const EXP_N={acad:'Jugendakademie',scout:'Scouting-Abteilung',geh:'Spielergehälter',stad:'Stadion & Infrastruktur',verw:'Verwaltung & Personal',jugend:'Nachwuchs',abg:'Abgaben, Steuern, Versicherungen',zins:'Zinsen'};
const stadUp=lv=>lv<=2?3000:lv<=4?1500:800,stadDown=lv=>lv<=4?60:25,stadUpkeep=(lv,cap)=>cap*(lv<=2?45:lv===3?25:lv===4?10:lv<=8?4:lv===9?3.2:lv===10?1.3:.8);
function creditLimit(id){const z=FZ(id),b=lastBal(id)||{rev:estRevenue(id)};const bad=(z.ins||[]).some(s=>S.season-s<6)?.4:1;return Math.max(0,(b.rev*0.4+clubValue(id)*0.1)*bad-z.d)}
function lastBal(id){const z=FZ(id);if(!z||!z.h.length)return null;const h=z.h[0];return {rev:h[1],ex:h[2],res:h[3]}}
function spendable(id){const z=FZ(id);if(!z)return 0;const b=lastBal(id);const res=b?b.ex*.1:estRevenue(id)*.1;return Math.max(0,Math.round(z.c-res))}
function takeLoan(id,amt,why,log){const z=FZ(id);amt=Math.round(amt/1e3)*1e3;if(amt<=0)return 0;const lim=creditLimit(id);amt=Math.min(amt,lim);if(amt<=0)return 0;
  const tot=z.d+amt,cap=(lastBal(id)||{rev:estRevenue(id)}).rev||1;z.ir=+(0.035+0.09*Math.min(1,tot/(cap*1.2))).toFixed(3);z.d=tot;z.c+=amt;return amt}
function finLog(type,id,txt){if(!S.flog)S.flog=[];S.flog.unshift({s:S.season,t:type,id,txt});if(S.flog.length>400)S.flog.length=400;try{newsFinance(type,id,txt)}catch(e){}}
// Investoren (frei erfunden)
const INV_A=['Nordwind','Alpenblick','Rheinstahl','Brückner','Hanse','Falkenberg','Sternau','Goldfeld','Lindqvist','Montclair','Vasquez','Okafor','Al-Rami','Takeda','Petrov','Hartmann','Silberkamp','Ostrava','Bellmonte','Kirchhoff'];
const INV_B=[['Capital','Private-Equity-Fonds'],['Holding','Familienholding'],['Group','Investorengruppe'],['Ventures','Tech-Unternehmer'],['Partners','Sportinvestment-Konsortium'],['Logistik','Mittelständischer Unternehmer'],['Energie','Energiekonzern'],['Sports & Media','Medienunternehmen']];
const INV_O=['aus Deutschland','aus den USA','aus Saudi-Arabien','aus Katar','aus China','aus Großbritannien','aus der Schweiz','aus Österreich','aus Norwegen','aus Japan','aus den VAE','aus der Region'];
function newInvestor(lv){if(!S.inv)S.inv={};const id='i'+(S.next++);const b=rpick(INV_B,Math.random);
  const base=(REVL[Math.max(1,Math.min(10,lv))]||1e5);const w=Math.round(base*(0.25+Math.random()*1.2)*(lv>=5&&Math.random()<.6?1:1)/1e3)*1e3;
  const loc=lv>=5;const n=loc?`${rpick(['Autohaus','Bauunternehmen','Brauerei','Elektro','Metallbau','Immobilien','Spedition'],Math.random)} ${rpick(INV_A,Math.random)}`:`${rpick(INV_A,Math.random)} ${b[0]}`;
  S.inv[id]={id,n,k:loc?'Lokaler Mäzen':b[1],o:loc?'aus der Region':rpick(INV_O,Math.random),w,amb:Math.max(1,lv-1-Math.floor(Math.random()*3)),pat:3+Math.floor(Math.random()*5),club:null,since:null,put:0,best:99};
  return S.inv[id];
}
function takeover(id,inv,log){const z=FZ(id);T(id).mo=Math.min(100,(T(id).mo??60)+10);inv.club=id;inv.since=S.season;inv.best=finLv(id)?finLv(id).lv:9;z.own=inv.id;
  const pay=Math.min(z.d,inv.w*1.5);z.d-=pay;inv.put+=pay;if(!z.d)z.ir=0;z.c+=inv.w*.5;inv.put+=inv.w*.5;z.wf=Math.min(1.6,z.wf+0.15);
  const txt=`${T(id).name}: ${inv.n} (${inv.k} ${inv.o}) übernimmt den Verein${pay?` und löst ${money(pay)} Schulden ab`:''}`;log&&log.push(txt);finLog('inv',id,txt)}
function investorLeaves(id,inv,why,log){const z=FZ(id);const loan=Math.round(inv.put*.25/1e3)*1e3;z.own=null;inv.club=null;z.d+=loan;if(loan)z.ir=Math.max(z.ir||0,.06);z.wf=Math.max(.8,z.wf-0.2);
  const txt=`${T(id).name}: ${inv.n} steigt aus (${why})${loan?` – ${money(loan)} Gesellschafterdarlehen werden fällig`:''}`;log&&log.push(txt);finLog('out',id,txt)}
function fireSale(id,n,log){const t=T(id);ensureSquad(id);const sq=t.sq.slice().sort((a,b)=>value(b)-value(a));let got=0;if(Math.random()<.35)return 0; // kein Käufer gefunden
  for(const pid of sq.slice(0,n)){if(t.sq.length<=18)break;const rich=buyers().map(x=>x[0]).filter(b=>b!==id&&b!==S.fav&&T(b)&&bud(b)>value(pid)*.6);if(!rich.length)break;
    const to=rnd(rich),fee=Math.round(value(pid)*.6/1e3)*1e3;t.sq=t.sq.filter(x=>x!==pid);ensureSquad(to).push(pid);addBud(to,-fee);FZ(id).c+=fee;got+=fee;addTr(pid,id,to,fee);recalc(to)}
  recalc(id);return got}
// Saisonabschluss Finanzen – läuft für alle Vereine ohne Eingriff
function seasonFinances(st,log){
  const ins=[];let takeovers=0;updMedians();
  const clubs=[];S.leagues.forEach(l=>l.teams.forEach(id=>clubs.push([id,l])));
  for(const [id,l] of clubs){
    const z=FZ(id);if(!z)continue;const t=T(id);
    const i=st[l.id]?st[l.id].indexOf(id):-1,n=st[l.id]?st[l.id].length:1,perf=i<0||n<2?.5:1-i/(n-1);
    const b=finBalance(id,perf);if(!b)continue;
    // Investor zahlt ein
    const inv=z.own&&S.inv&&S.inv[z.own];let inj=0;const lv=l.foreign?1:l.level;
    if(inv){inj=lv>inv.amb?inv.w:inv.w*.5;z.c+=inj;inv.put+=inj;if(lv<inv.best){inv.best=lv;inv.since=S.season}}
    z.c+=b.res;
    // Sonderbelastungen und Glücksfälle
    if(Math.random()<.06){const bad=Math.random()<.72,amt=Math.round(b.rev*(bad?0.08+Math.random()*Math.random()*0.6:0.06+Math.random()*0.2)/1e3)*1e3;
      const why=bad?rpick(['Steuernachzahlung','Ausfall des Hauptsponsors','Stadionsanierung','Strafe des Verbands','Rückforderung von Fördergeldern'],Math.random):rpick(['Neuer Großsponsor','Erbschaft eines Gönners','Verkauf von Vereinsgelände','Sonderzahlung aus der Vermarktung'],Math.random);
      z.c+=bad?-amt:amt;if(lv<=4||l.foreign||id===S.fav)finLog(bad?'neg':'pos',id,`${T(id).name}: ${why} (${bad?'−':'+'}${money(amt)})`)}
    // Tilgung
    if(z.d>0){const pay=Math.min(z.d,Math.max(z.d*.12,z.c>b.rev*.6?z.c-b.rev*.4:0));if(z.c-pay>-b.ex*.05){z.c-=pay;z.d-=pay;if(z.d<1e3){z.d=0;z.ir=0}}}
    // Liquidität sichern
    let note='';
    if(z.c<0){const need=-z.c+b.ex*.08;const got=takeLoan(id,need);if(got)note='Kredit';
      if(z.c<0){S.fsale=(S.fsale||0)+1;fireSale(id,z.c<-b.rev*.15?1:2);if(z.c<0)ins.push(id);else finLog('neg',id,`${T(id).name}: Notverkäufe, um zahlungsfähig zu bleiben`)}}
    else if(z.d>b.rev*1.2&&z.c<b.ex*.1&&Math.random()<.4) ins.push(id); // überschuldet
    // Gehaltsniveau anpassen (Vereinsführung)
    // Zu großes Stadion: Vereinsführung sperrt/baut Ränge zurück, wenn der Unterhalt den Etat erdrückt
    if(id!==S.fav&&lv>=3){const att=b.att||0,minC=Math.max(300,Math.round((LCAP[lv]||300)*.8/50)*50),tgt=Math.max(minC,Math.round(att*1.4/50)*50);
      if(b.exp.stad>b.rev*.12&&z.cap>tgt*1.15){const cut=z.cap-tgt,cost=cut*stadDown(lv);z.cap=tgt;z.c-=cost;if(lv<=4)finLog('neg',id,`${T(id).name}: Stadion auf ${tgt.toLocaleString('de-DE')} Plätze zurückgebaut, um Kosten zu sparen`)}}
    // Investitionen: viel Geld auf dem Konto fließt teilweise in den Stadionausbau
    if(z.c>b.rev*1.1&&z.cap<81000){const per=stadUp(lv),inv_=Math.round((z.c-b.rev*1.1)*.35/1e3)*1e3,seats=Math.min(81000-z.cap,Math.floor(inv_/per/50)*50);
      if(seats>=50){z.c-=seats*per;z.cap+=seats;if(lv<=3||id===S.fav)finLog('pos',id,`${T(id).name}: Stadionausbau um ${seats.toLocaleString('de-DE')} Plätze (${money(seats*per)})`)}}
    // Gehaltsniveau für neue Verträge: zurückhaltend erhöhen, bei Verlust sofort bremsen
    if(b.res<0||z.c<b.ex*.05||z.d>b.rev)z.wf=Math.max(.7,+(z.wf-(b.res<-b.rev*.05?0.08:0.04)).toFixed(2));else if(z.c>b.rev*.45)z.wf=Math.min(inv?1.7:1.45,+(z.wf+0.05).toFixed(2));
    z.h.unshift([S.season,Math.round(b.rev+inj),Math.round(b.ex),Math.round(b.res+inj),Math.round(z.c),Math.round(z.d),l.foreign?1:l.level,b.att]);if(z.h.length>12)z.h.length=12;
    // Investor ungeduldig?
    if(inv&&S.season-inv.since>=inv.pat&&(l.foreign?1:l.level)>inv.amb&&Math.random()<.5) investorLeaves(id,inv,'Ziele verfehlt',log);
  }
  // Übernahmen
  const cand=clubs.filter(([id,l])=>{const z=T(id).fz;return z&&!z.own&&!isRes(T(id).name)});
  for(const [id,l] of shuffle(cand)){
    if(takeovers>=4)break;const z=T(id).fz,lv=l.foreign?1:l.level,b=lastBal(id);if(!b)continue;
    const distress=z.d>b.rev*.6||z.c<b.ex*.05;
    const p=({1:.012,2:.02,3:.025,4:.015,5:.007,6:.004,7:.002,8:.001}[lv]||.001)*(distress?3:1)*(l.foreign?.6:1);
    if(Math.random()>p)continue;
    const inv=newInvestor(lv);
    if(id===S.fav){S.invOffer={inv:inv.id,s:S.season};log.push(`${T(id).name}: ${inv.n} (${inv.k} ${inv.o}) möchte einsteigen – Entscheidung unter Mein Verein → Finanzen`);continue}
    takeover(id,inv,log);takeovers++;
  }
  // Offenes Angebot an Mein Verein: Vereinsführung entscheidet, wenn du es eine Saison liegen lässt
  if(S.invOffer&&S.invOffer.s<S.season&&S.fav&&S.inv&&S.inv[S.invOffer.inv]){const z=FZ(S.fav),b=lastBal(S.fav)||{rev:1,ex:1};
    if(z.d>b.rev*.5||z.c<0){takeover(S.fav,S.inv[S.invOffer.inv],log);log.push(`${T(S.fav).name}: Die Vereinsführung hat dem Einstieg zugestimmt`)}else log.push(`${T(S.fav).name}: Die Vereinsführung lehnt den Investor ab`);S.invOffer=null}
  return ins;
}
// Insolvenz: Punktabzug (bis 4. Liga) bzw. Zwangsabstieg, Schuldenschnitt
function applyInsolvency(ids,st,log){
  if(!S.penNext)S.penNext={};
  for(const id of ids){const z=FZ(id);if(!z)continue;const l=lgOf(id);if(!l)continue;const t=T(id);
    z.ins.unshift(S.season);if(z.ins.length>40)z.ins.length=40;t.mo=Math.max(10,(t.mo??60)-20);const cut=Math.round(z.d*.7/1e3)*1e3;z.d-=cut;z.c=Math.max(0,Math.round(lastBal(id)?lastBal(id).ex*.05:0));z.wf=.7;z.ir=z.d?.08:0;
    const inv=z.own&&S.inv&&S.inv[z.own];if(inv){inv.club=null;z.own=null}
    let what;
    const repeat=z.ins.filter(s=>S.season-s<5).length>1;
    if(!l.foreign&&(l.level>=5||repeat)){const dest=downLeague(l,t);
      if(dest){const sub=(st[dest.id]||dest.teams).filter(x=>dest.teams.includes(x)&&!isRes(T(x).name))[0];
        l.teams=l.teams.filter(x=>x!==id);dest.teams.push(id);if(sub){dest.teams=dest.teams.filter(x=>x!==sub);l.teams.push(sub)}
        what=`Zwangsabstieg in die ${dest.name}${sub?` (${T(sub).name} rückt nach)`:''}`}else{S.penNext[id]=-9;what='9 Punkte Abzug'}}
    else{S.penNext[id]=l.foreign?-10:-9;what=`${l.foreign?10:9} Punkte Abzug in der neuen Saison`}
    const txt=`Insolvenz: ${t.name} – ${what}, Schuldenschnitt ${money(cut)}`;log.push(txt);finLog('ins',id,txt);
  }
}
