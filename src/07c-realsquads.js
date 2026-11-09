// ---------- Echte Kader ----------
// REAL_SQUADS (src/01d-squads.js): je Verein Trainer + Spieler [Name, Position, Alter, Nation, Stärke|null, Marktwert Mio. €|null].
// Der Kader ersetzt einmalig den erfundenen; ändert sich die Liste (neue Version), wird er erneut übernommen.
// Nationen: Namen aus der Liste werden auf die Spiel-Nationen abgebildet, sonst als eigene Nation mit Flagge geführt.
const NATX_ISO={Kanada:'CA',Australien:'AU',Belgien:'BE',Brasilien:'BR',Chile:'CL',China:'CN',Costa_Rica:'CR','Costa Rica':'CR',Ecuador:'EC',Ägypten:'EG',Finnland:'FI',Georgien:'GE',Island:'IS',Israel:'IL',Iran:'IR',Irak:'IQ',Jamaika:'JM',Kamerun:'CM',Kap_Verde:'CV','Kap Verde':'CV',Mali:'ML',Mexiko:'MX',Montenegro:'ME',Neuseeland:'NZ',Nordmazedonien:'MK',Paraguay:'PY',Peru:'PE',Slowakei:'SK',Slowenien:'SI',Südafrika:'ZA',Uruguay:'UY',Venezuela:'VE',Wales:'GB',Nordirland:'GB',Algerien:'DZ',Guinea:'GN',Gambia:'GM',Togo:'TG',Burkina_Faso:'BF','Burkina Faso':'BF','DR Kongo':'CD',Kongo:'CG',Angola:'AO',Armenien:'AM',Aserbaidschan:'AZ',Bulgarien:'BG',Estland:'EE',Lettland:'LV',Litauen:'LT',Luxemburg:'LU',Litauen2:'LT',Moldau:'MD',Belarus:'BY',Russland:'RU',Kasachstan:'KZ',Usbekistan:'UZ',Saudi_Arabien:'SA','Saudi-Arabien':'SA',Katar:'QA',Libanon:'LB',Jordanien:'JO',Indonesien:'ID',Philippinen:'PH',Thailand:'TH',Vietnam:'VN',Indien:'IN',Liechtenstein:'LI',Färöer:'FO',Malta:'MT',Haiti:'HT',Panama:'PA',Honduras:'HN',Guinea_Bissau:'GW','Guinea-Bissau':'GW',Simbabwe:'ZW',Sambia:'ZM',Kenia:'KE',Äquatorialguinea:'GQ',Gabun:'GA',Benin:'BJ',Niger:'NE',Sudan:'SD',Libyen:'LY',Tschad:'TD'};
const isoFlag=c=>c&&c.length===2?String.fromCodePoint(...[...c.toUpperCase()].map(ch=>0x1F1E6+ch.charCodeAt(0)-65)):'🏳️';
function natCode(name){const n=String(name||'').trim();if(!n)return 'DE';const hit=Object.entries(NAT).find(([k,v])=>v.n.toLowerCase()===n.toLowerCase()||k.toLowerCase()===n.toLowerCase());if(hit)return hit[0];
  const al={'deutschland':'DE','ger':'DE','türkiye':'TUR','bosnien-herzegowina':'BIH','bosnien und herzegowina':'BIH','côte d\'ivoire':'CIV','südkorea':'KOR','korea':'KOR','vereinigte staaten':'USA','tschechische republik':'CZE'};if(al[n.toLowerCase()])return al[n.toLowerCase()];return 'X:'+n}
// Flaggen auch für Nationen ohne eigenen Namenspool
function natInfo(code){if(NAT[code])return NAT[code];if(String(code).startsWith('X:')){const n=code.slice(2);return {n,fl:isoFlag(NATX_ISO[n]||NATX_ISO[n.replace(/ /g,'_')])}}return null}
function realSquadOf(t){return typeof REAL_SQUADS!=='undefined'&&t&&!t.gone?REAL_SQUADS[t.name]||null:null}
function buildRealSquad(id,old){const t=T(id),R=realSquadOf(t);if(!R)return null;const base=old||t.r||60;
  (t.sq||[]).forEach(pid=>{if(S.scout&&S.scout.list)delete S.scout.list[pid];delete P()[pid]});
  const sq=R.p.map(([n,pos,a,nat,st,mv])=>{const s=st!=null?st:Math.max(20,base-(a<=18?16:a<=20?11:a<=22?6:3)+gauss()*2);
    const pid=newPlayer(t,pos,s,a);const p=P()[pid];p.n=n;p.a=a;p.nat=natCode(nat);p.s=+clampS(s).toFixed(1);p.real=1;if(mv!=null){p.mvR=Math.round(mv*1e6);p.mvS=S.season}
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
