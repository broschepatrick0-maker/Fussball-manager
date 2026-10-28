// ---------- Import (fussball.de) ----------
function parseTable(txt){
  const out=[];parseTable.known=null;
  for(let line of txt.replace(/​/g,'').split(/\r?\n/)){
    line=line.trim(); if(!line) continue;
    if(/^(pl\.?|platz|mannschaft|verein|sp\.?|tabelle|legende|drucken)\b/i.test(line)) continue;
    let parts=line.split('\t').map(s=>s.trim()).filter(Boolean);
    let name=parts.find(p=>/[a-zA-ZäöüÄÖÜß]/.test(p)&&!/^\d+\.?$/.test(p))||'';
    if(!parts.length||parts.length===1) name=line;
    name=name.replace(/^\d+\.?\s+/,'');
    // Tabellenwerte abschneiden (Spiele, Tore x:y, Punkte) – eine einzelne Zahl am Ende (Jahr, Mannschaftsnummer) bleibt
    if(/\d+\s*:\s*\d+/.test(name))name=name.replace(/(\s+-?\d+)*\s+\d+\s*:\s*\d+.*$/,'');
    else name=name.replace(/(\s+-?\d+){2,}\s*$/,'');
    name=name.trim();if(/\bzg\.?$/i.test(name))continue;
    if(typeof ocrClean==='function'){name=ocrClean(name);if(!name)continue;if(typeof ocrMatch==='function')name=ocrMatch(name,parseTable.known||(parseTable.known=knownNames()))}
    const w=name.split(/\s+/);
    if(w.length%2===0){const h=w.length/2;if(w.slice(0,h).join(' ')===w.slice(h).join(' '))name=w.slice(0,h).join(' ')}
    if(name.length<2||!/[a-zA-ZäöüÄÖÜß]/.test(name)) continue;
    if(!out.includes(name)) out.push(name);
  }
  return out;
}
