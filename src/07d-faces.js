// ---------- Spielerbilder: gezeichnete Porträts ----------
// Jeder Spieler bekommt ein festes, aus seiner ID erzeugtes Gesicht (Hautton passend zur Nation, Frisur, Bart, Alter)
// im Trikot seines Vereins. Echte Fotos werden nicht verwendet.
const FACE_REG={af:['GHA','NGA','SEN','CMR','CIV','X:Mali','X:Guinea','X:Burkina Faso','X:DR Kongo','X:Kongo','X:Togo','X:Benin','X:Gambia','X:Sambia','X:Sierra Leone','X:Guinea-Bissau','X:Angola','X:Gabun','X:Kenia','X:Liberia','X:Haiti','X:Jamaika','X:Suriname','X:Komoren','X:Äquatorialguinea','X:Niger','X:Simbabwe','X:Uganda','X:Tansania','X:Ruanda','X:Burundi','X:Mosambik','X:Curaçao','X:Trinidad und Tobago','X:Kap Verde'],
  me:['MAR','TUN','SYR','AFG','TUR','X:Algerien','X:Ägypten','X:Irak','X:Iran','X:Libanon','X:Jordanien','X:Saudi-Arabien','X:Katar','X:Libyen','X:Mauretanien','X:Sudan','X:Tschad','ALB','KOS','X:Armenien','X:Aserbaidschan','X:Georgien','CYP','GRE'],
  as:['JPN','KOR','X:China','X:Vietnam','X:Thailand','X:Indonesien','X:Philippinen','X:Usbekistan','X:Kasachstan'],
  sa:['BRA','COL','X:Ecuador','X:Peru','X:Venezuela','X:Paraguay','X:Bolivien','X:Mexiko','X:Costa Rica','X:Panama','X:Honduras','X:Kuba','X:Dominikanische Republik','X:Nicaragua','X:El Salvador','X:Guatemala','X:Chile'],
  mx:['FRA','ENG','NED','BEL','POR','USA','X:Kanada','SUI','SWE']};
const FACE_REGOF=(()=>{const m={};for(const r in FACE_REG)FACE_REG[r].forEach(c=>m[c]=r);return m})();
const SKIN=['#f6d7c3','#efc6a8','#e2b08c','#d09a72','#b97f57','#9b6440','#7d4c2e','#5e3820','#46291a'];
function faceTone(nat,R){const r=FACE_REGOF[nat]||'eu',x=R();
  const pick=a=>a[Math.floor(R()*a.length)];
  if(r==='af')return pick([5,6,7,7,8,8]);if(r==='me')return pick([2,3,3,4]);if(r==='as')return pick([1,1,2]);
  if(r==='sa')return x<.25?pick([6,7,8]):pick([2,3,4,5]);if(r==='mx')return x<.3?pick([5,6,7,8]):x<.4?pick([3,4]):pick([0,1,1,2]);
  return x<.1?pick([5,6,7]):x<.18?pick([3,4]):pick([0,0,1,1,2])}
function faceSVG(pid,club){const p=P()[pid];if(!p)return '';const R=srng(hstr('face'+(p.real?p.n:pid)));
  const tone=faceTone(p.nat,R),skin=SKIN[tone],dark=tone>=5;
  const HAIR=dark||tone>=4?['#141010','#1d1512','#2a1d16']:['#2b1d14','#4a3020','#6b4a2b','#8a6234','#b98a4e','#d9b66e','#1a1412','#5a3a22'];
  let hc=HAIR[Math.floor(R()*HAIR.length)];if(FACE_REGOF[p.nat]==='as')hc='#15110f';
  if(p.a>=33&&R()<.35)hc='#8d8a86';
  const K=club&&typeof kitsOf==='function'?kitsOf(club):null,sh=K?K.h.s:'#5b6b62',st=K?K.h.t:'#ffffff';
  const styles=dark?['buzz','buzz','curl','afro','braids','bald','fade']:['short','short','side','buzz','long','quiff','bald','curlS'];
  let hs=styles[Math.floor(R()*styles.length)];if(hs==='bald'&&p.a<24&&R()<.7)hs='buzz';
  const beard=R()<(p.a<21?.08:p.a<26?.3:.5)?['stubble','full','goatee','stubble'][Math.floor(R()*4)]:'';
  const w=R()*4-2,jaw=R()*3,ey=R()*2-1,brow=R()<.5;
  const shade=c=>{const n=parseInt(c.slice(1),16),f=.82;return '#'+[n>>16,n>>8&255,n&255].map(v=>Math.round(v*f).toString(16).padStart(2,'0')).join('')};
  const sk2=shade(skin);
  const hair={short:`<path d="M${18-w} 27c0-12 7-17 14-17s14 5 14 17c-3-5-6-7-14-7s-11 2-14 7z" fill="${hc}"/>`,
    side:`<path d="M${17-w} 29c-1-13 7-19 15-19 9 0 15 6 15 16-6-2-13-5-20-4-4 1-7 3-10 7z" fill="${hc}"/>`,
    buzz:`<path d="M${18-w} 26c1-10 7-14 14-14s13 4 14 14c-4-4-8-5-14-5s-10 1-14 5z" fill="${hc}" opacity=".85"/>`,
    fade:`<path d="M${19-w} 24c1-9 6-13 13-13s12 4 13 13c-4-3-8-4-13-4s-9 1-13 4z" fill="${hc}"/>`,
    long:`<path d="M${16-w} 36c-3-17 5-26 16-26s19 9 16 26c-1-6-2-11-4-13-4-2-9-3-12-3s-8 1-12 3c-2 2-3 7-4 13z" fill="${hc}"/>`,
    quiff:`<path d="M${18-w} 27c0-11 5-18 15-18 6 0 12 3 13 9-1 2-1 5 0 9-3-5-7-6-14-6s-11 1-14 6z" fill="${hc}"/><path d="M28 10c5-4 13-3 16 2" stroke="${hc}" stroke-width="4" fill="none"/>`,
    curlS:`<g fill="${hc}">${[20,25,30,35,40,44].map((x,i)=>`<circle cx="${x}" cy="${17-(i%2)*2}" r="4.5"/>`).join('')}<path d="M18 26c0-7 6-11 14-11s14 4 14 11c-4-3-8-4-14-4s-10 1-14 4z"/></g>`,
    curl:`<g fill="${hc}">${[20,25,30,35,40,44].map((x,i)=>`<circle cx="${x}" cy="${16-(i%2)*2}" r="4"/>`).join('')}</g>`,
    afro:`<ellipse cx="32" cy="19" rx="17" ry="12" fill="${hc}"/>`,
    braids:`<path d="M${18-w} 27c0-11 6-16 14-16s14 5 14 16" fill="${hc}"/>${[21,26,31,36,41].map(x=>`<path d="M${x} 13v12" stroke="${shade(hc)}" stroke-width="1.2"/>`).join('')}`,
    bald:''}[hs];
  const bd={stubble:`<path d="M20 38c2 9 7 13 12 13s10-4 12-13c-2 3-6 5-12 5s-10-2-12-5z" fill="${hc}" opacity=".35"/>`,
    full:`<path d="M19 35c1 11 7 17 13 17s12-6 13-17c-2 4-4 6-6 6-2-2-4-3-7-3s-5 1-7 3c-2 0-4-2-6-6z" fill="${hc}"/>`,
    goatee:`<path d="M28 46c1 4 2 5 4 5s3-1 4-5c-1 1-3 1-4 1s-3 0-4-1z" fill="${hc}"/><path d="M27 42c2-1 3-1 5-1s3 0 5 1" stroke="${hc}" stroke-width="1.5" fill="none"/>`}[beard]||'';
  const wr=p.a>=32?`<path d="M23 ${29+ey}h4M37 ${29+ey}h4" stroke="${sk2}" stroke-width=".8"/>`:'';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#2a3a31"/><circle cx="32" cy="30" r="30" fill="#344a3e"/>
   <path d="M6 64c2-10 12-15 26-15s24 5 26 15z" fill="${sh}"/><path d="M26 49l6 6 6-6" fill="none" stroke="${st}" stroke-width="2.5"/>
   <rect x="27" y="40" width="10" height="11" rx="3" fill="${sk2}"/>
   <ellipse cx="17.5" cy="32" rx="2.6" ry="4" fill="${sk2}"/><ellipse cx="46.5" cy="32" rx="2.6" ry="4" fill="${sk2}"/>
   <path d="M${18-w/2} 28c0-10 6-15 14-15s14 5 14 15c0 ${10+jaw} -6 ${19+jaw/2} -14 ${19+jaw/2}s-14-${9+jaw/2}-14-19z" fill="${skin}"/>
   ${hair}
   <path d="M${23} ${26+ey}${brow?'q3-2 6 0':'h6'}M35 ${26+ey}${brow?'q3-2 6 0':'h6'}" stroke="${hc==='#8d8a86'?'#5a5550':hc}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
   <ellipse cx="26" cy="${30+ey}" rx="1.7" ry="1.4" fill="#1b1410"/><ellipse cx="38" cy="${30+ey}" rx="1.7" ry="1.4" fill="#1b1410"/>${wr}
   <path d="M32 31v6.5c-1 .6-2.2.6-3 0" stroke="${sk2}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
   ${bd}<path d="M28 ${42+jaw/3}q4 ${R()<.5?2:1} 8 0" stroke="#7a3e32" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>`;
  return 'data:image/svg+xml,'+encodeURIComponent(svg)}
const FACEC=new Map();
function faceImg(pid,club,cls){const k=pid+'|'+(club||'');let u=FACEC.get(k);if(!u){u=faceSVG(pid,club);if(FACEC.size>4000)FACEC.clear();FACEC.set(k,u)}
  return `<img class="${cls||'face'}" src="${u}" alt="" loading="lazy">`}
