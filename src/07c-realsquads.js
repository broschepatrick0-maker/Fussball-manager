// ---------- Echte Kader ----------
// REAL_SQUADS (src/01d-squads.js): je Verein Trainer + Spieler [Name, Position, Alter, Nation, Stärke|null, Marktwert Mio. €|null, Rückennummer|null].
// Der Kader ersetzt einmalig den erfundenen; ändert sich die Liste (neue Version), wird er erneut übernommen.
// Nationen: Namen aus der Liste werden auf die Spiel-Nationen abgebildet, sonst als eigene Nation mit Flagge geführt.
const NATX_ISO={Kanada:'CA',Australien:'AU',Belgien:'BE',Brasilien:'BR',Chile:'CL',China:'CN',Costa_Rica:'CR','Costa Rica':'CR',Ecuador:'EC',Ägypten:'EG',Finnland:'FI',Georgien:'GE',Island:'IS',Israel:'IL',Iran:'IR',Irak:'IQ',Jamaika:'JM',Kamerun:'CM',Kap_Verde:'CV','Kap Verde':'CV',Mali:'ML',Mexiko:'MX',Montenegro:'ME',Neuseeland:'NZ',Nordmazedonien:'MK',Paraguay:'PY',Peru:'PE',Slowakei:'SK',Slowenien:'SI',Südafrika:'ZA',Uruguay:'UY',Venezuela:'VE',Wales:'GB',Nordirland:'GB',Algerien:'DZ',Guinea:'GN',Gambia:'GM',Togo:'TG',Burkina_Faso:'BF','Burkina Faso':'BF','DR Kongo':'CD',Kongo:'CG',Angola:'AO',Armenien:'AM',Aserbaidschan:'AZ',Bulgarien:'BG',Estland:'EE',Lettland:'LV',Litauen:'LT',Luxemburg:'LU',Litauen2:'LT',Moldau:'MD',Belarus:'BY',Russland:'RU',Kasachstan:'KZ',Usbekistan:'UZ',Saudi_Arabien:'SA','Saudi-Arabien':'SA',Katar:'QA',Libanon:'LB',Jordanien:'JO',Indonesien:'ID',Philippinen:'PH',Thailand:'TH',Vietnam:'VN',Indien:'IN',Liechtenstein:'LI',Färöer:'FO',Malta:'MT',Haiti:'HT',Panama:'PA',Honduras:'HN',Guinea_Bissau:'GW','Guinea-Bissau':'GW',Simbabwe:'ZW',Sambia:'ZM',Kenia:'KE',Äquatorialguinea:'GQ',Gabun:'GA',Benin:'BJ',Niger:'NE',Sudan:'SD',Libyen:'LY',Tschad:'TD',Suriname:'SR','Sierra Leone':'SL',Komoren:'KM',Liberia:'LR',Mosambik:'MZ',Madagaskar:'MG',Uganda:'UG',Tansania:'TZ',Ruanda:'RW',Burundi:'BI',Mauretanien:'MR',Curaçao:'CW',Trinidad_Tobago:'TT','Trinidad und Tobago':'TT',Bolivien:'BO',Kuba:'CU','Dominikanische Republik':'DO',Nicaragua:'NI','El Salvador':'SV',Guatemala:'GT',Zypern:'CY',Irland:'IE'};
const isoFlag=c=>c&&c.length===2?String.fromCodePoint(...[...c.toUpperCase()].map(ch=>0x1F1E6+ch.charCodeAt(0)-65)):'🏳️';
function natCode(name){const n=String(name||'').trim();if(!n)return 'DE';const hit=Object.entries(NAT).find(([k,v])=>v.n.toLowerCase()===n.toLowerCase()||k.toLowerCase()===n.toLowerCase());if(hit)return hit[0];
  const al={'deutschland':'DE','ger':'DE','türkiye':'TUR','bosnien-herzegowina':'BIH','bosnien und herzegowina':'BIH','côte d\'ivoire':'CIV','südkorea':'KOR','korea':'KOR','vereinigte staaten':'USA','tschechische republik':'CZE'};if(al[n.toLowerCase()])return al[n.toLowerCase()];return 'X:'+n}
// Flaggen auch für Nationen ohne eigenen Namenspool
function natInfo(code){if(NAT[code])return NAT[code];if(String(code).startsWith('X:')){const n=code.slice(2);return {n,fl:isoFlag(NATX_ISO[n]||NATX_ISO[n.replace(/ /g,'_')])}}return null}
function realSquadOf(t){return typeof REAL_SQUADS!=='undefined'&&t&&!t.gone?REAL_SQUADS[t.name]||null:null}
// Spieler ohne Stärkewert (z. B. Namen aus Wikipedia-Kaderlisten): Stärke kommt aus dem Spiel.
// Rangfolge nach Bedeutung im Kader – als Stammkraft markierte Spieler zuerst, dann Rückennummer 1–11, 12–30 = Kader, höher = Nachwuchs – und Alter nahe 27.
// Danach wird die übliche Stärkeverteilung eines Kaders dieser Vereinsstärke vergeben (Stammelf um den Vereinswert, Bank darunter, Talente deutlich darunter).
function promStr(pl,base){const R=srng(hstr('ps'+base+pl.length+(pl[0]&&pl[0][0])));
  const sc=pl.map(([n,pos,a,nat,st,mv,no,key],i)=>{let v=key?40:0;if(no!=null)v+=no<=11?14:no<=25?6:no<=35?0:-10;v-=Math.abs(a-27)*.9;if(a<=19)v-=6;if(mv!=null)v+=Math.log10(mv+1)*8;return {i,v:v+R()*4,pos}});
  // je Position eigene Rangfolge: so bekommen auch Torhüter und Stürmer passende Stammkräfte
  const out=[],cnt={TW:1,AB:4,MF:4,ST:2};
  ['TW','AB','MF','ST'].forEach(pos=>{sc.filter(x=>x.pos===pos).sort((a,b)=>b.v-a.v).forEach((x,k)=>{const a=pl[x.i][2],n=cnt[pos];
    let s=k<n?base+1.5-k*.6:base-2.5-(k-n)*(pos==='TW'?7:1.6);if(a<=18&&!pl[x.i][7])s=Math.min(s,base-15);else if(a<=20&&!pl[x.i][7])s=Math.min(s,base-9);else if(a>=34)s-=1.5;
    out[x.i]=Math.max(20,s+(R()*2-1)*1.2)})});return out}
function buildRealSquad(id,old){const t=T(id),R=realSquadOf(t);if(!R)return null;const base=old||t.r||60;
  (t.sq||[]).forEach(pid=>{if(S.scout&&S.scout.list)delete S.scout.list[pid];delete P()[pid]});
  const est=promStr(R.p,base);
  const sq=R.p.map(([n,pos,a,nat,st,mv,no],i)=>{const s=st!=null?st:est[i];
    const pid=newPlayer(t,pos,s,a);const p=P()[pid];p.n=n;p.a=a;p.nat=natCode(nat);p.s=+clampS(s).toFixed(1);p.real=1;if(no!=null){p.no=no;p.noC=id}if(mv!=null){p.mvR=Math.round(mv*1e6);p.mvS=S.season}
    if(a<=23)p.pot=+Math.min(99,Math.max(p.s,p.s+(24-a)*1.4)).toFixed(1);return pid});
  // an die Stärkeskala der Spielwelt anpassen: die beste Elf erreicht wieder die bisherige Vereinsstärke, die Reihenfolge im Kader bleibt
  const d=base-xi(sq);if(Math.abs(d)>.3)sq.forEach(pid=>{const p=P()[pid];p.s=+clampS(p.s+d).toFixed(1);if(p.pot!=null)p.pot=+Math.min(99,p.pot+d).toFixed(1)});
  t.sq=sq;t.rsv=R.v;if(R.tr&&!(S.career&&S.career.club===id)){t.ppl=t.ppl||{};t.ppl.tr=R.tr}
  if(id===S.fav&&S.mgr)S.mgr.xi=null;
  sq.forEach(pid=>{try{if(typeof ensureContract==='function'&&!isAmClub(id))ensureContract(pid,id)}catch(e){}});recalc(id);return sq}
function applyRealSquads(){if(typeof REAL_SQUADS==='undefined')return 0;let n=0;
  for(const name in REAL_SQUADS){const id=Object.keys(S.teams).find(x=>S.teams[x].name===name&&!S.teams[x].gone);if(!id)continue;const t=T(id);
    if(t.rsv===REAL_SQUADS[name].v)continue;if(!t.sq){t.rsv=null;continue}buildRealSquad(id,t.r);n++}
  return n}

// ---------- Rückennummern ----------
// Jeder Spieler trägt im Verein eine feste, eindeutige Nummer. Echte Kader bringen ihre Nummern mit;
// alle anderen bekommen klassische Nummern nach Position (TW 1, Abwehr 2–5, Mittelfeld 6/8/10, Sturm 9/11, dann 12+).
function assignNumbers(id){const t=T(id);if(!t||!t.sq)return;const ps=t.sq.map(pid=>[pid,P()[pid]]).filter(x=>x[1]);
  const used=new Set();ps.forEach(([pid,p])=>{if(p.no!=null&&p.noC===id&&!used.has(p.no))used.add(p.no);else p.no=null});
  const pref={TW:[1,12,22,30],AB:[2,3,4,5,15,16,23,24],MF:[6,8,10,7,14,18,20,21],ST:[9,11,19,17,27]};
  ps.filter(([pid,p])=>p.no==null).sort((a,b)=>b[1].s-a[1].s).forEach(([pid,p])=>{let n=(pref[p.p]||[]).find(x=>!used.has(x));if(n==null){n=12;while(used.has(n))n++}p.no=n;used.add(n)});
  ps.forEach(([pid,p])=>p.noC=id)}
function shirtNo(pid,id){const p=P()[pid];if(!p)return '';if(p.no==null||p.noC!==id)assignNumbers(id);return p.no!=null?p.no:''}
