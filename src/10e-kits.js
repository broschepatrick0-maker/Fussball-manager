// ---------- Trikots: Heim, Auswärts, Ausweich ----------
// Trikot = {s:Hemd, t:Zweitfarbe/Besatz, p:Muster, sh:Hose, so:Stutzen}
const KIT_PAT=[['uni','Einfarbig'],['streifen','Streifen'],['nadel','Nadelstreifen'],['ringel','Ringel'],['halb','Halbiert'],['schraeg','Schärpe'],['brustring','Brustring'],['aermel','Ärmel']];
// typische Vereinsfarben (nicht das exakte Design der aktuellen Saison): "Hemd,Besatz,Muster,Hose,Stutzen" je Heim;Auswärts;Ausweich
const KIT_REAL={
 'Real Madrid':'ffffff,d4af37,uni,ffffff,ffffff;1b2a4a,ffffff,uni,1b2a4a,1b2a4a;111111,d4af37,uni,111111,111111','FC Barcelona':'a50044,004d98,streifen,004d98,a50044;f5d300,a50044,uni,f5d300,f5d300;1b1b1b,a50044,uni,1b1b1b,1b1b1b','Liverpool FC':'c8102e,ffffff,uni,c8102e,c8102e;ffffff,c8102e,uni,ffffff,ffffff;0b1e3a,00b2a9,uni,0b1e3a,0b1e3a','Chelsea FC':'034694,ffffff,uni,034694,ffffff;f2f2f2,034694,uni,f2f2f2,f2f2f2;111111,d1d3d4,uni,111111,111111','Newcastle United':'111111,ffffff,streifen,111111,111111;ffffff,111111,uni,ffffff,ffffff;0f6e5a,ffffff,uni,0f6e5a,0f6e5a','FC Bayern München':'dc052d,ffffff,uni,dc052d,dc052d;ffffff,0a1e5c,uni,0a1e5c,ffffff;2b1d4d,f05a28,uni,2b1d4d,0a1e5c',
 'Borussia Dortmund':'fde100,000000,uni,000000,fde100;111111,fde100,uni,111111,111111;ffffff,fde100,uni,ffffff,ffffff',
 'RB Leipzig':'ffffff,dd0741,uni,ffffff,ffffff;0c2043,dd0741,uni,0c2043,0c2043;dd0741,ffffff,uni,dd0741,dd0741',
 'Bayer 04 Leverkusen':'e32221,000000,uni,000000,e32221;ffffff,e32221,uni,ffffff,ffffff;111111,e32221,uni,111111,111111',
 'Eintracht Frankfurt':'e1000f,000000,streifen,000000,000000;ffffff,000000,uni,ffffff,ffffff;111111,e1000f,uni,111111,111111',
 'VfB Stuttgart':'ffffff,e32219,brustring,ffffff,ffffff;e32219,ffffff,brustring,e32219,e32219;1a1a2e,e32219,brustring,1a1a2e,1a1a2e',
 'Borussia Mönchengladbach':'ffffff,111111,uni,ffffff,ffffff;111111,1d9053,uni,111111,111111;1d9053,ffffff,uni,1d9053,1d9053',
 'Werder Bremen':'1d9053,ffffff,uni,1d9053,1d9053;ffffff,1d9053,uni,ffffff,ffffff;111111,1d9053,uni,111111,111111',
 'VfL Wolfsburg':'65b32e,ffffff,uni,ffffff,65b32e;ffffff,65b32e,uni,ffffff,ffffff;0b2e1a,65b32e,uni,0b2e1a,0b2e1a',
 'SC Freiburg':'e2001a,ffffff,uni,111111,e2001a;ffffff,e2001a,uni,ffffff,ffffff;111111,e2001a,uni,111111,111111',
 '1. FSV Mainz 05':'c3141e,ffffff,uni,c3141e,c3141e;ffffff,c3141e,uni,ffffff,ffffff;111111,c3141e,uni,111111,111111',
 'FC Augsburg':'ba3733,ffffff,halb,ffffff,ba3733;ffffff,46714d,uni,ffffff,ffffff;46714d,ffffff,uni,46714d,46714d',
 'TSG Hoffenheim':'1961b5,ffffff,uni,1961b5,1961b5;ffffff,1961b5,uni,ffffff,ffffff;111827,1961b5,uni,111827,111827',
 '1. FC Union Berlin':'eb1923,ffffff,uni,eb1923,eb1923;ffffff,eb1923,uni,ffffff,ffffff;fde100,eb1923,uni,fde100,fde100',
 '1. FC Köln':'ffffff,ed1c24,uni,ffffff,ffffff;ed1c24,ffffff,uni,ed1c24,ed1c24;111111,ed1c24,uni,111111,111111',
 'Hamburger SV':'ffffff,0a3f86,uni,e2001a,0a3f86;0a3f86,ffffff,uni,0a3f86,0a3f86;111111,ffffff,uni,111111,111111',
 'FC St. Pauli':'6b4423,ffffff,uni,6b4423,6b4423;ffffff,6b4423,uni,ffffff,ffffff;111111,e2001a,uni,111111,111111',
 '1. FC Heidenheim':'e2001a,003b79,uni,003b79,e2001a;ffffff,003b79,uni,ffffff,ffffff;003b79,e2001a,uni,003b79,003b79',
 'FC Schalke 04':'004d9d,ffffff,uni,ffffff,004d9d;ffffff,004d9d,uni,ffffff,ffffff;111111,004d9d,uni,111111,111111',
 'Hertha BSC':'005ca9,ffffff,streifen,ffffff,005ca9;ffffff,005ca9,uni,ffffff,ffffff;111827,005ca9,uni,111827,111827',
 'Hannover 96':'c3141e,000000,uni,000000,c3141e;ffffff,1d9053,uni,ffffff,ffffff;1d9053,000000,uni,1d9053,1d9053',
 '1. FC Nürnberg':'ab1f2c,000000,uni,000000,ab1f2c;ffffff,ab1f2c,uni,ffffff,ffffff;111111,ab1f2c,uni,111111,111111',
 '1. FC Kaiserslautern':'e2001a,ffffff,uni,e2001a,e2001a;ffffff,e2001a,uni,ffffff,ffffff;111111,e2001a,uni,111111,111111',
 'Arminia Bielefeld':'004e95,000000,uni,000000,004e95;ffffff,004e95,uni,ffffff,ffffff;111111,004e95,uni,111111,111111',
 '1. FC Magdeburg':'005ca9,ffffff,uni,ffffff,005ca9;ffffff,005ca9,uni,ffffff,ffffff;111111,005ca9,uni,111111,111111',
 'VfL Bochum':'005ca9,ffffff,uni,005ca9,005ca9;ffffff,005ca9,uni,ffffff,ffffff;111111,005ca9,uni,111111,111111',
 'FC Energie Cottbus':'e2001a,ffffff,uni,ffffff,e2001a;ffffff,e2001a,uni,ffffff,ffffff;111111,e2001a,uni,111111,111111',
 'SpVgg Greuther Fürth':'009a44,ffffff,uni,ffffff,009a44;ffffff,009a44,uni,ffffff,ffffff;111111,009a44,uni,111111,111111',
 'Dynamo Dresden':'fdd800,000000,uni,000000,fdd800;111111,fdd800,uni,111111,111111;ffffff,fdd800,uni,ffffff,ffffff',
 'VfL Osnabrück':'5b2c86,ffffff,uni,ffffff,5b2c86;ffffff,5b2c86,uni,ffffff,ffffff;111111,5b2c86,uni,111111,111111',
 'Eintracht Braunschweig':'fdd800,005ca9,uni,005ca9,fdd800;005ca9,fdd800,uni,005ca9,005ca9;ffffff,fdd800,uni,ffffff,ffffff',
 'Holstein Kiel':'004a9f,ffffff,uni,ffffff,e2001a;ffffff,004a9f,uni,ffffff,ffffff;e2001a,004a9f,uni,e2001a,e2001a',
 'SV Darmstadt 98':'004e9e,ffffff,uni,ffffff,004e9e;ffffff,004e9e,uni,ffffff,ffffff;111111,004e9e,uni,111111,111111',
 'Karlsruher SC':'00489d,ffffff,uni,ffffff,00489d;ffffff,00489d,uni,ffffff,ffffff;111111,00489d,uni,111111,111111',
 'SC Paderborn 07':'005ca9,000000,uni,000000,005ca9;ffffff,005ca9,uni,ffffff,ffffff;111111,005ca9,uni,111111,111111',
 'SV Elversberg':'111111,ffffff,uni,111111,111111;ffffff,111111,uni,ffffff,ffffff;c8a24a,111111,uni,c8a24a,c8a24a',
 'Fortuna Düsseldorf':'e2001a,ffffff,uni,ffffff,e2001a;ffffff,e2001a,uni,ffffff,ffffff;111111,e2001a,uni,111111,111111',
 'Hansa Rostock':'005ca9,ffffff,uni,ffffff,005ca9;ffffff,e2001a,uni,ffffff,ffffff;111111,005ca9,uni,111111,111111',
 'Alemannia Aachen':'fdd800,000000,streifen,000000,fdd800;ffffff,000000,uni,ffffff,ffffff;111111,fdd800,uni,111111,111111',
 'Waldhof Mannheim':'003d7c,000000,streifen,000000,003d7c;ffffff,003d7c,uni,ffffff,ffffff;111111,003d7c,uni,111111,111111',
 '1. FC Saarbrücken':'003d7c,000000,streifen,000000,003d7c;ffffff,003d7c,uni,ffffff,ffffff;111111,003d7c,uni,111111,111111',
 'MSV Duisburg':'003d7c,ffffff,ringel,003d7c,003d7c;ffffff,003d7c,uni,ffffff,ffffff;111111,003d7c,uni,111111,111111',
 'Rot-Weiss Essen':'e2001a,ffffff,uni,ffffff,e2001a;ffffff,e2001a,uni,ffffff,ffffff;111111,e2001a,uni,111111,111111',
 'SC Preußen Münster':'111111,ffffff,uni,ffffff,111111;ffffff,111111,uni,ffffff,ffffff;1d9053,ffffff,uni,1d9053,1d9053',
 'SC Verl':'111111,ffffff,schraeg,ffffff,111111;ffffff,111111,schraeg,ffffff,ffffff;7a7a7a,111111,uni,7a7a7a,7a7a7a',
 'Jahn Regensburg':'e2001a,ffffff,uni,ffffff,e2001a;ffffff,e2001a,uni,ffffff,ffffff;111111,e2001a,uni,111111,111111',
 'Würzburger Kickers':'e2001a,ffffff,uni,ffffff,e2001a;ffffff,e2001a,uni,ffffff,ffffff;111111,e2001a,uni,111111,111111',
 'SV Meppen':'005ca9,ffffff,uni,005ca9,005ca9;ffffff,005ca9,uni,ffffff,ffffff;111111,005ca9,uni,111111,111111',
 'FC Ingolstadt 04':'111111,e2001a,halb,111111,111111;ffffff,e2001a,uni,ffffff,ffffff;e2001a,111111,uni,e2001a,e2001a',
 'Wehen Wiesbaden':'e2001a,111111,uni,111111,e2001a;ffffff,e2001a,uni,ffffff,ffffff;111111,c8a24a,uni,111111,111111',
 'Viktoria Köln':'e2001a,111111,uni,111111,e2001a;ffffff,e2001a,uni,ffffff,ffffff;111111,e2001a,uni,111111,111111',
 'Fortuna Köln':'e2001a,ffffff,uni,ffffff,e2001a;ffffff,e2001a,uni,ffffff,ffffff;111111,e2001a,uni,111111,111111',
 'SG Sonnenhof Großaspach':'111111,fdd800,uni,111111,111111;ffffff,111111,uni,ffffff,ffffff;fdd800,111111,uni,fdd800,fdd800',
 'TSV Havelse':'e2001a,ffffff,uni,ffffff,e2001a;ffffff,e2001a,uni,ffffff,ffffff;111111,e2001a,uni,111111,111111'
};
const KIT_TAB=[['h','Heim'],['a','Auswärts'],['x','Ausweich']];
function kitParse(str){const [s,t,p,sh,so]=str.split(',');return {s:'#'+s,t:'#'+t,p,sh:'#'+sh,so:'#'+so}}
function kitHash(n){let h=0;for(const c of n)h=(h*31+c.charCodeAt(0))>>>0;return h}
// Trikots eines Vereins: eigene > typische Vereinsfarben > aus dem Wappen abgeleitet > Standard
function kitsOf(id){const t=T(id);if(!t)return null;if(t.kits)return {...t.kits,src:'own'};
  const name=isRes(t.name)?resBase(t.name):t.name,k=crestKey(t.name,KIT_REAL)||crestKey(name,KIT_REAL);
  if(k){const [h,a,x]=KIT_REAL[k].split(';').map(kitParse);return {h,a,x,src:'real'}}
  const im=crestImg(id),cr=crestOf(id);let c1=im&&im.c1||cr&&cr.c1,c2=im&&im.c2||cr&&cr.c2,src='farben';
  if(!c1){const P=['#c8102e','#1e5aa8','#2e7d32','#111111','#ffd200','#5b2a86','#00a3e0','#f28c00'],h=kitHash(name);c1=P[h%P.length];c2=lum(c1)>.55?'#111111':'#ffffff';src='auto'}
  c2=c2||(lum(c1)>.55?'#111111':'#ffffff');const white=lum(c1)>.8;
  return {h:{s:c1,t:c2,p:'uni',sh:c2==='#ffffff'&&!white?'#ffffff':c1,so:c1},a:{s:white?c2:'#ffffff',t:white?'#ffffff':c1,p:'uni',sh:white?c2:'#ffffff',so:white?c2:'#ffffff'},x:{s:'#1b1f2a',t:c1,p:'uni',sh:'#1b1f2a',so:'#1b1f2a'},src}}
function kitRaw(k){const s=k.s,t=k.t,pat={uni:'',streifen:[22,40,58,76].map((x,i)=>i%2===0?`<rect x="${x}" y="0" width="9" height="70" fill="${t}"/>`:'').join(''),
   nadel:[26,34,42,50,58,66,74].map(x=>`<rect x="${x}" y="0" width="1.6" height="70" fill="${t}"/>`).join(''),ringel:[16,30,44].map(y=>`<rect x="0" y="${y}" width="100" height="7" fill="${t}"/>`).join(''),
   halb:`<rect x="50" y="0" width="50" height="70" fill="${t}"/>`,schraeg:`<path d="M20 10L32 6 82 62 70 66z" fill="${t}"/>`,brustring:`<rect x="0" y="24" width="100" height="9" fill="${t}"/>`,aermel:`<path d="M0 0H26V70H0zM74 0H100V70H74z" fill="${t}"/>`}[k.p]||'';
  const shirt='M31 6L17 10 3 28 13 37 22 29 22 64 78 64 78 29 87 37 97 28 83 10 69 6C64 13 36 13 31 6Z';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="134" viewBox="0 0 100 134"><defs><clipPath id="c"><path d="${shirt}"/></clipPath></defs>
   <g clip-path="url(#c)"><rect width="100" height="70" fill="${s}"/>${pat}<path d="M3 28L13 37 22 29V26L13 33 5 25z" fill="${t}"/><path d="M97 28L87 37 78 29V26L87 33 95 25z" fill="${t}"/></g>
   <path d="M31 6C36 13 64 13 69 6" fill="none" stroke="${t}" stroke-width="3"/><path d="${shirt}" fill="none" stroke="#1d1d1d" stroke-width="1.6" stroke-linejoin="round"/>
   <path d="M23 68H77L81 98H56L50 84 44 98H19Z" fill="${k.sh}" stroke="#1d1d1d" stroke-width="1.6" stroke-linejoin="round"/><path d="M24 70L21 96M76 70L79 96" stroke="${t}" stroke-width="2.4"/>
   <rect x="27" y="104" width="15" height="28" fill="${k.so}" stroke="#1d1d1d" stroke-width="1.4"/><rect x="58" y="104" width="15" height="28" fill="${k.so}" stroke="#1d1d1d" stroke-width="1.4"/>
   <rect x="27" y="104" width="15" height="5" fill="${t}"/><rect x="58" y="104" width="15" height="5" fill="${t}"/></svg>`}
function kitSVG(k,h){return `<img class="kit" height="${h}" width="${Math.round(h*100/134)}" alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(kitRaw(k))}">`}
function kitCard(id){const K=kitsOf(id);if(!K)return '';const mine=id===S.fav;
  const src={own:'Eigene Trikots',real:'Typische Vereinsfarben – nicht das exakte Design der aktuellen Saison',farben:'Aus den Vereinsfarben abgeleitet',auto:'Farben unbekannt – Standardtrikots'}[K.src];
  return `<div class="card"><div class="hd"><h3 class="ct" style="margin:0">Trikots</h3>${mine?'<button class="btn sm" data-act="kited">✏️ Trikots gestalten</button>':''}</div>
   <div class="kits">${KIT_TAB.map(([k,n])=>`<div>${kitSVG(K[k],120)}<b>${n}</b></div>`).join('')}</div><p class="note" style="margin-top:6px">${src}</p></div>`}
// Trikotfarben fürs 2D-Board: Heimteam im Heimtrikot, Gast im Trikot mit dem größten Kontrast
function kitCols(hid,aid){const H=kitsOf(hid),A=kitsOf(aid);const h=H?H.h.s:'#d64545';
  const dist=(x,y)=>{const p=parseInt(x.slice(1),16),q=parseInt(y.slice(1),16);return Math.abs((p>>16)-(q>>16))+Math.abs((p>>8&255)-(q>>8&255))+Math.abs((p&255)-(q&255))};
  let a=A?[A.h,A.a,A.x].find(k=>dist(k.s,h)>=160):null;a=a?a.s:(A?[A.h,A.a,A.x].sort((p,q)=>dist(q.s,h)-dist(p.s,h))[0].s:'#2f6fdf');return {h,a}}
function kitEditorHTML(o){const k=o.d[o.tab];const sw=f=>`<div class="crsw">${CR_COL.map(c=>`<button class="crc${k[f]===c?' on':''}" style="background:${c}" data-act="kts:${f}:${c.slice(1)}" aria-label="Farbe ${c}"></button>`).join('')}</div>`;
  return `<div class="ovc crested"><div class="seg crseg">${KIT_TAB.map(([t,n])=>`<button class="${o.tab===t?'on':''}" data-act="kts:tab:${t}">${n}</button>`).join('')}</div>
   <div class="kits big">${KIT_TAB.map(([t,n])=>`<div class="${o.tab===t?'on':''}">${kitSVG(o.d[t],o.tab===t?150:90)}<b>${n}</b></div>`).join('')}</div>
   <h4>Muster</h4><div class="seg crseg">${KIT_PAT.map(([v,n])=>`<button class="${k.p===v?'on':''}" data-act="kts:p:${v}">${n}</button>`).join('')}</div>
   <h4>Trikot</h4>${sw('s')}<h4>Zweitfarbe (Muster, Kragen, Bündchen)</h4>${sw('t')}<h4>Hose</h4>${sw('sh')}<h4>Stutzen</h4>${sw('so')}
   <div class="crrow"><button class="btn" data-act="kts:reset">Zurücksetzen</button><button class="btn pri" data-act="kts:save">Speichern</button></div></div>`}
function kitAct(v,w){const o=view.ov;if(!o||o.t!=='kit')return;const t=T(S.fav);
  if(v==='tab')o.tab=w;else if(v==='reset'){const b={...t};delete b.kits;const sv=t.kits;delete t.kits;const K=kitsOf(S.fav);if(sv)t.kits=sv;o.d={h:{...K.h},a:{...K.a},x:{...K.x}}}
  else if(v==='save'){t.kits={h:o.d.h,a:o.d.a,x:o.d.x};view.ov=null;save();toast('Trikots gespeichert');return}
  else if(v==='p')o.d[o.tab].p=w;else o.d[o.tab][v]='#'+w}
