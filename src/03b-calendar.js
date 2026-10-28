// ---------- Kalender: echte Daten von 1. Juli bis 30. Juni ----------
// S.day = zuletzt simulierter Tag (−1 = vor dem 1. Juli), Tag 0 = 1. Juli der Saison
const WD=['So','Mo','Di','Mi','Do','Fr','Sa'],MON=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'],MONL=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const DAY0=y=>Date.UTC(y,6,1);
function seasonLen(y){return Math.round((DAY0(y+1)-DAY0(y))/864e5)}
function dayDate(d,y){return new Date(DAY0(y??S.season)+d*864e5)}
function dayOf(m,dd,y){y=y??S.season;const yr=m>=7?y:y+1;return Math.round((Date.UTC(yr,m-1,dd)-DAY0(y))/864e5)}
function wdOf(d){return dayDate(d).getUTCDay()}
function onOrAfter(d,wd){while(wdOf(d)!==wd)d++;return d}
function fmtDay(d,o={}){const x=dayDate(d);return `${o.wd===false?'':WD[x.getUTCDay()]+', '}${x.getUTCDate()}. ${MON[x.getUTCMonth()]}${o.y?' '+x.getUTCFullYear():''}`}
function weekdays(from,to,wd){const out=[];for(let d=onOrAfter(from,wd);d<=to;d+=7)out.push(d);return out}
function spread(arr,n){if(n<=0)return [];if(n>=arr.length)return arr.slice();if(n===1)return [arr[0]];const out=[];for(let i=0;i<n;i++)out.push(arr[Math.round(i*(arr.length-1)/(n-1))]);return out}
// Rahmenterminkalender je Spielklasse: Start, Winterpause, Ende
function frame(lg){const lv=lg.foreign?1:lg.level;
  if(lv<=1)return {a:[dayOf(8,22),dayOf(12,21)],b:[dayOf(1,10),dayOf(5,23)],wd:6};
  if(lv===2)return {a:[dayOf(8,1),dayOf(12,21)],b:[dayOf(1,17),dayOf(5,17)],wd:6};
  if(lv===3)return {a:[dayOf(7,25),dayOf(12,21)],b:[dayOf(1,17),dayOf(5,17)],wd:6};
  if(lv===4)return {a:[dayOf(7,25),dayOf(12,6)],b:[dayOf(2,21),dayOf(5,24)],wd:6};
  if(lv===5)return {a:[dayOf(8,1),dayOf(11,30)],b:[dayOf(3,1),dayOf(6,1)],wd:6};
  return {a:[dayOf(8,9),dayOf(11,30)],b:[dayOf(3,1),dayOf(6,7)],wd:0}}
function halfDates(rng,n,wd){const we=weekdays(rng[0],rng[1],wd);if(n<=we.length)return spread(we,n);
  const mid=weekdays(rng[0]+10,rng[1]-3,3).filter(d=>!we.includes(d));return [...we,...spread(mid,n-we.length)].sort((a,b)=>a-b)}
function leagueDates(lg){const f=frame(lg),n=lg.rounds.length,n1=Math.ceil(n/2);return [...halfDates(f.a,n1,f.wd),...halfDates(f.b,n-n1,f.wd)]}
function winterBreak(lg){const f=frame(lg);return [f.a[1]+1,f.b[0]-1]}
function cupDates(c){const R=c.R;if(R<=0)return [];
  if(c.type==='dfb'){const fin=onOrAfter(dayOf(5,24),6),first=dayOf(8,14);const mids=[dayOf(10,28),dayOf(12,2),dayOf(2,3),dayOf(3,3),dayOf(4,21)];return R===1?[fin]:[first,...spread(mids,R-2),fin].map(d=>d)}
  const fin=onOrAfter(dayOf(5,21),6);const pool=[...weekdays(dayOf(7,29),dayOf(11,25),3),...weekdays(dayOf(3,4),dayOf(5,13),3)];
  return R===1?[fin]:[...spread(pool,R-1),fin]}
function euroDates(e,i){const wd=i===0?2:4;
  const md=[[9,16],[9,30],[10,21],[11,4],[11,25],[12,9],[1,20],[1,27]].map(([m,d])=>onOrAfter(dayOf(m,d),wd));
  const lp=spread(md,e.nmd);
  const ko=[[2,17],[3,10],[4,7],[4,28]].map(([m,d])=>onOrAfter(dayOf(m,d),wd)+7);
  const fin=i===0?onOrAfter(dayOf(5,31),6):onOrAfter(dayOf(5,19),3)+(i===2?7:0);
  return [...lp,...ko.slice(0,e.steps-e.nmd-1),fin]}
function winDay(){return [dayOf(1,1),dayOf(2,1)]}
function buildCalendar(){S.day=-1;S.round=0;
  S.leagues.forEach(l=>l.dates=leagueDates(l));
  S.cups.forEach(c=>c.dates=cupDates(c));
  (S.euro||[]).forEach((e,i)=>e.dates=euroDates(e,i))}
function ensureCalendar(){
  if(S.day!=null&&S.leagues.every(l=>l.dates&&l.dates.length===l.rounds.length)&&S.cups.every(c=>c.dates)&&(S.euro||[]).every(e=>e.dates))return false;
  const keep=S.day;S.leagues.forEach(l=>l.dates=leagueDates(l));S.cups.forEach(c=>c.dates=cupDates(c));(S.euro||[]).forEach((e,i)=>e.dates=euroDates(e,i));
  if(keep==null){ // alter Spielstand: Datum an der Bundesliga ausrichten
    const ref=L('bl')||S.leagues[0];S.day=ref&&ref.played?ref.dates[Math.min(ref.played,ref.dates.length)-1]:-1;S.round=Math.max(0,Math.floor((S.day+1)/7))}
  return true}
// Fenster und Phasen
function transferOpenOn(d){const [a,b]=winDay();return d<=dayOf(9,1)||(d>=a&&d<=b)}
function nextOpen(){return S.done?null:transferOpenOn(S.day+1)?{open:true,until:S.day+1<=dayOf(9,1)?dayOf(9,1):winDay()[1]}:{open:false,from:S.day+1<winDay()[0]?winDay()[0]:null}}
// Termine eines Vereins (Liga, Pokal, Europa) mit Datum
function clubFixtures(id){return teamMatches(id).map(x=>({...x,day:x.day??-1})).filter(x=>x.day>=0).sort((a,b)=>a.day-b.day)}
function dayEvents(d){const out=[];
  S.leagues.forEach(l=>{const i=l.dates?l.dates.indexOf(d):-1;if(i>=0)out.push({k:'L',l,i})});
  S.cups.forEach(c=>{const i=c.dates?c.dates.indexOf(d):-1;if(i>=0)out.push({k:'C',c,i})});
  (S.euro||[]).forEach(e=>{const i=e.dates?e.dates.indexOf(d):-1;if(i>=0)out.push({k:'E',e,i})});return out}
function anyMatchOn(d,top){return S.leagues.some(l=>(!top||l.level<=3||l.foreign)&&l.played<l.rounds.length&&l.dates&&l.dates[l.played]===d)||S.cups.some(c=>!c.winner&&c.dates&&c.dates[c.played]===d&&(!top||c.type==='dfb'))||(S.euro||[]).some(e=>!e.winner&&e.dates&&e.dates[e.step]===d)}
function favPlaysOn(d){const id=S.fav;if(!id)return false;const lg=lgOf(id);
  if(lg&&lg.played<lg.rounds.length&&lg.dates[lg.played]===d)return true;
  if(S.cups.some(c=>!c.winner&&c.dates&&c.dates[c.played]===d&&c.rounds[c.played]&&c.rounds[c.played].some(m=>!m.bye&&(m.h===id||m.a===id))))return true;
  return (S.euro||[]).some(e=>!e.winner&&e.dates&&e.dates[e.step]===d&&euroHas(e,id))}
function euroHas(e,id){if(e.step<e.nmd)return e.mds[e.step].some(m=>m.h===id||m.a===id);const alive=e.ko.length?e.ko[e.ko.length-1].ties.map(x=>x.w):null;return e.teams.includes(id)&&(!alive||alive.includes(id)||e.step===e.nmd)}
function nextFavDay(){const id=S.fav;if(!id)return null;let best=null;const lg=lgOf(id);
  if(lg&&lg.played<lg.rounds.length)best=lg.dates[lg.played];
  S.cups.forEach(c=>{if(!c.winner&&c.dates&&c.rounds[c.played]&&c.rounds[c.played].some(m=>!m.bye&&(m.h===id||m.a===id))){const d=c.dates[c.played];if(best==null||d<best)best=d}});
  (S.euro||[]).forEach(e=>{if(!e.winner&&e.dates&&e.step<e.nmd&&euroHas(e,id)){const d=e.dates[e.step];if(best==null||d<best)best=d}});
  return best}
function dateLine(){if(S.done)return 'Saisonpause';const d=Math.max(0,S.day);return fmtDay(S.day<0?0:d,{y:true})}
