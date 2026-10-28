// ---------- Spielplan ----------
function schedule(ids){
  const t=shuffle(ids); if(t.length%2) t.push(null);
  const n=t.length, first=[]; let arr=t;
  for(let r=0;r<n-1;r++){
    const m=[];
    for(let i=0;i<n/2;i++){const a=arr[i],b=arr[n-1-i]; if(a&&b) m.push((r+i)%2?{h:b,a}:{h:a,a:b});}
    first.push(m); arr=[arr[0],arr[n-1],...arr.slice(1,n-1)];
  }
  return [...first,...first.map(rd=>rd.map(m=>({h:m.a,a:m.h})))];
}
// Doppelte Vereine (gleicher Name in mehreren Ligen, Altlast früherer Versionen) entfernen
function dedupeLeagues(){
  const seen=new Map(),car=(S.hist&&S.hist.career)||{};let n=0;
  const all=[];S.leagues.forEach(l=>{if(!l.foreign)l.teams.forEach(id=>all.push([id,l]))});
  all.sort((a,b)=>((car[b[0]]||[]).length-(car[a[0]]||[]).length));
  for(const [id,l] of all){const nm=T(id)&&T(id).name;if(!nm)continue;
    if(seen.has(nm)){l.teams=l.teams.filter(x=>x!==id);n++}else seen.set(nm,id)}
  return n;
}
function startSeason(){
  dedupeLeagues();
  noteHomes();
  S.leagues.forEach(l=>{l.pen={}});for(const [id,v] of Object.entries(S.penNext||{})){const l=lgOf(id);if(l)l.pen[id]=v}S.penNext={};
  for(const lg of S.leagues){lg.rounds=schedule(lg.teams);lg.played=0;lg.teams.forEach(id=>T(id).lv=lg.level)}
  S.round=0;S.done=false;
  buildCups();
  buildEuro();
}
