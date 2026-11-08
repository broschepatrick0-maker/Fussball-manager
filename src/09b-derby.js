// ---------- Derbys & Rivalitäten ----------
// Bekannte Rivalitäten (Intensität 1–3) plus automatische Stadt-/Lokalderbys: zwei Vereine aus demselben Ort in derselben Liga.
const DERBY_REAL=[
 ['FC Schalke 04','Borussia Dortmund','Revierderby',3],['FC Bayern München','TSV 1860 München','Münchner Stadtderby',3],['Hamburger SV','FC St. Pauli','Hamburger Stadtderby',3],
 ['Hamburger SV','Werder Bremen','Nordderby',3],['1. FC Köln','Borussia Mönchengladbach','Rheinisches Derby',3],['1. FC Nürnberg','SpVgg Greuther Fürth','Frankenderby',3],
 ['Eintracht Frankfurt','Kickers Offenbach','Mainderby',3],['Hertha BSC','1. FC Union Berlin','Berliner Stadtderby',3],['Hannover 96','Eintracht Braunschweig','Niedersachsenderby',3],
 ['VfB Stuttgart','Karlsruher SC','Baden-Württemberg-Derby',3],['1. FC Lokomotive Leipzig','BSG Chemie Leipzig','Leipziger Stadtderby',3],['1. FC Magdeburg','Hallescher FC','Mitteldeutsches Derby',3],
 ['FC Carl Zeiss Jena','FC Rot-Weiß Erfurt','Thüringenderby',3],['1. FC Kaiserslautern','1. FC Saarbrücken','Südwestderby',3],['Waldhof Mannheim','Karlsruher SC','Badisches Derby',3],
 ['Arminia Bielefeld','SC Preußen Münster','Westfalenderby',2],['VfL Osnabrück','SC Preußen Münster','Westfalen-Niedersachsen-Derby',2],['Arminia Bielefeld','SC Paderborn 07','OWL-Derby',2],
 ['1. FC Köln','Bayer 04 Leverkusen','Rheinderby',2],['1. FC Köln','Fortuna Düsseldorf','Rheinisches Derby',3],['Borussia Mönchengladbach','Fortuna Düsseldorf','Rheinisches Derby',2],
 ['VfL Bochum','FC Schalke 04','Revierderby',2],['VfL Bochum','Borussia Dortmund','Revierderby',2],['Rot-Weiss Essen','FC Schalke 04','Revierderby',2],['Rot-Weiss Essen','Rot-Weiß Oberhausen','Revierderby',2],
 ['MSV Duisburg','Rot-Weiss Essen','Revierderby',2],['Eintracht Frankfurt','SV Darmstadt 98','Hessenderby',2],['1. FSV Mainz 05','1. FC Kaiserslautern','Rheinland-Pfalz-Derby',2],['1. FSV Mainz 05','Eintracht Frankfurt','Rhein-Main-Derby',2],
 ['FC Augsburg','FC Bayern München','Bayerisches Derby',1],['FC Augsburg','TSV 1860 München','Bayerisches Derby',2],['FC Ingolstadt 04','Jahn Regensburg','Donauderby',2],['Würzburger Kickers','1. FC Schweinfurt 05','Unterfrankenderby',3],
 ['SC Freiburg','Karlsruher SC','Baden-Derby',2],['SC Freiburg','VfB Stuttgart','Baden-Württemberg-Derby',2],['1. FC Heidenheim','SSV Ulm 1846','Ostalb-Derby',2],['VfB Stuttgart','Stuttgarter Kickers','Stuttgarter Stadtderby',2],
 ['VfL Wolfsburg','Eintracht Braunschweig','Niedersachsenderby',2],['VfL Wolfsburg','Hannover 96','Niedersachsenderby',2],['Werder Bremen','VfB Oldenburg','Nordwestderby',1],['Holstein Kiel','VfB Lübeck','Schleswig-Holstein-Derby',2],
 ['Hansa Rostock','FC St. Pauli','Nordderby',2],['Hansa Rostock','Dynamo Dresden','Ostderby',2],['Dynamo Dresden','1. FC Lokomotive Leipzig','Sachsenderby',2],['Dynamo Dresden','FC Erzgebirge Aue','Sachsenderby',2],
 ['Chemnitzer FC','FC Erzgebirge Aue','Sachsenderby',2],['Chemnitzer FC','FSV Zwickau','Westsachsenderby',2],['FC Erzgebirge Aue','FSV Zwickau','Westsachsenderby',2],['BFC Dynamo','1. FC Union Berlin','Berliner Stadtderby',3],
 ['FC Energie Cottbus','Dynamo Dresden','Ostderby',2],['SV Babelsberg 03','FC Energie Cottbus','Brandenburgderby',2],['SC Verl','FC Gütersloh','Kreisderby Gütersloh',2],['Arminia Bielefeld','SC Verl','OWL-Derby',1],
['Waldhof Mannheim','VfR Mannheim','Mannheimer Stadtderby',2],['1. FC Saarbrücken','FC 08 Homburg','Saarderby',2],['Alemannia Aachen','1. FC Köln','Rheinlandderby',1],
 ['KSV Hessen Kassel','SV Darmstadt 98','Hessenderby',1],['Kickers Offenbach','SV Darmstadt 98','Hessenderby',2]];
const DRB=new Map(),DRB_STOP=new Set(['Spvg','Markt','Sportverein','Spielvereinigung','Fußball','Fussball','Eintracht','Borussia','Union','Fortuna','Viktoria','Concordia','Germania','Alemannia','Dynamo','Lokomotive','Inter','United','Rapid','Olympia','Sportfreunde','Turnverein','Jahn','Hertha','Bayern','Phönix','Phoenix']);let DRB_NAMES=null;
function derbyNames(){if(DRB_NAMES)return DRB_NAMES;DRB_NAMES=new Map();DERBY_REAL.forEach(([a,b,n,i])=>{const k=[a,b].sort().join('|');DRB_NAMES.set(k,{n,i})});return DRB_NAMES}
function tTowns(id){const t=T(id);if(!t)return [];if(t._tt)return t._tt;const v=townTokens(resBase(t.name));Object.defineProperty(t,'_tt',{value:v,enumerable:false,configurable:true,writable:true});return v}
// Derby zwischen zwei Vereinen? → {n:Name, i:Intensität 1–3, real:bekannte Rivalität}
function derbyOf(a,b){if(!a||!b||a===b)return null;const k=a<b?a+'|'+b:b+'|'+a;if(DRB.has(k))return DRB.get(k);let r=null;const A=T(a),B=T(b);
  if(A&&B&&!A.cc&&!B.cc){const ra=isRes(A.name),rb=isRes(B.name);
    if(!ra&&!rb){const x=derbyNames().get([A.name,B.name].sort().join('|'));if(x)r={n:x.n,i:x.i,real:true}}
    if(!r&&ra===rb&&resBase(A.name)!==resBase(B.name)&&A.vb===B.vb){const tb=tTowns(b),town=tTowns(a).find(w=>tb.includes(w)&&!/\.$/.test(w)&&!/^[A-ZÄÖÜ]+$/.test(w)&&!DRB_STOP.has(w)&&townCnt(a,w)<=3);if(town)r={n:`${(T(a).lv||9)<=4?'Stadtderby':'Lokalderby'} ${town}`,i:1,real:false}}}
  DRB.set(k,r);return r}
// wie viele Vereine der Liga denselben Ortsnamen tragen? (in Großstadt-Ligen ist nicht jedes Spiel ein Derby)
function townCnt(id,w){const l=lgOf(id);if(!l)return 1;if(!l._tc||l._tc.n!==l.teams.length){const c={};l.teams.forEach(x=>new Set(tTowns(x)).forEach(t=>c[t]=(c[t]||0)+1));Object.defineProperty(l,'_tc',{value:{n:l.teams.length,c},enumerable:false,configurable:true,writable:true})}return l._tc.c[w]||1}
function drbKey(a,b){return a<b?a+'|'+b:b+'|'+a}
// nach dem Spiel: direkter Vergleich, Stimmung, Nachricht
function derbyAfter(m){const d=derbyOf(m.h,m.a);if(!d)return;const k=drbKey(m.h,m.a),R=(S.drb=S.drb||{});const e=R[k]||(R[k]={w:{},d:0,n:0,last:null});
  e.n++;if(m.hg===m.ag)e.d++;else{const w=m.hg>m.ag?m.h:m.a;e.w[w]=(e.w[w]||0)+1}e.last={s:S.season,h:m.h,a:m.a,hg:m.hg,ag:m.ag};
  if(m.hg!==m.ag){const w=m.hg>m.ag?m.h:m.a,l=w===m.h?m.a:m.h;const tw=T(w),tl_=T(l);tw.mo=Math.min(100,(tw.mo??60)+2*d.i);tl_.mo=Math.max(5,(tl_.mo??60)-2*d.i);
    if(S.fav&&(w===S.fav||l===S.fav))try{addNews({cat:'fav',clubs:[S.fav],h:w===S.fav?`Derbysieg! ${T(S.fav).name} gewinnt das ${d.n}`:`Derbyniederlage: ${T(S.fav).name} verliert das ${d.n}`,b:`${T(m.h).name} – ${T(m.a).name} ${m.hg}:${m.ag}. ${w===S.fav?'Die Fans feiern bis tief in die Nacht, die Stimmung im Team steigt.':'Die Fans sind bedient, die Stimmung im Team leidet.'} Bilanz: ${e.w[S.fav]||0} Siege, ${e.d} Remis, ${e.w[S.fav===m.h?m.a:m.h]||0} Niederlagen.`,imp:d.i>=2?3:2})}catch(x){}}
  else if(S.fav&&(m.h===S.fav||m.a===S.fav))try{addNews({cat:'fav',clubs:[S.fav],h:`${d.n} endet unentschieden`,b:`${T(m.h).name} – ${T(m.a).name} ${m.hg}:${m.ag}.`,imp:2})}catch(x){}
  if(d.i>=3&&!(S.fav&&(m.h===S.fav||m.a===S.fav))&&(T(m.h).lv||9)<=2)try{addNews({cat:'de',h:`${d.n}: ${T(m.h).name} – ${T(m.a).name} ${m.hg}:${m.ag}`,b:m.hg===m.ag?'Kein Sieger im Derby.':`${T(m.hg>m.ag?m.h:m.a).name} gewinnt das Prestigeduell.`,imp:2})}catch(x){}}
// Derby-Zuschlag im Spiel: Der Außenseiter wächst über sich hinaus, die Favoritenrolle zählt weniger
function derbyBoost(h,a,rh,ra){const d=derbyOf(h,a);if(!d)return [rh,ra];const b=1+d.i;return rh<ra?[rh+b,ra]:[rh,ra+b]}
const derbyTag=(h,a)=>{const d=derbyOf(h,a);return d?`<span class="tag derby" title="${esc(d.n)}">🔥 ${esc(d.n)}</span>`:''};
function rivalsOf(id){const t=T(id);if(!t)return [];const out=[];const base=resBase(t.name);
  DERBY_REAL.forEach(([a,b,n,i])=>{const o=a===base?b:b===base?a:null;if(!o)return;const oid=Object.keys(S.teams).find(x=>S.teams[x].name===o&&!S.teams[x].gone);if(oid&&!isRes(t.name))out.push({id:oid,n,i})});
  const lg=lgOf(id);if(lg)lg.teams.forEach(x=>{if(x===id||out.some(r=>r.id===x))return;const d=derbyOf(id,x);if(d)out.push({id:x,n:d.n,i:d.i})});return out.sort((a,b)=>b.i-a.i)}
function rivalsCard(id){const rv=rivalsOf(id);if(!rv.length)return '';const R=S.drb||{};
  return `<div class="card"><h3 class="ct">Derbys & Rivalen</h3>${rv.map(r=>{const e=R[drbKey(id,r.id)],w=e?(e.w[id]||0):0,l=e?(e.w[r.id]||0):0,d=e?e.d:0,lst=e&&e.last;
    return `<div class="orow"><span>${'🔥'.repeat(r.i)} ${tl(r.id)} <span class="meta">${esc(r.n)}${lgOf(r.id)&&lgOf(id)&&lgOf(r.id)!==lgOf(id)?` · spielt in der ${esc(lgOf(r.id).name)}`:''}</span></span><span class="meta nw">${e?`${w} S · ${d} U · ${l} N${lst?` · zuletzt ${lst.hg}:${lst.ag}`:''}`:'noch kein Duell'}</span></div>`}).join('')}</div>`}
