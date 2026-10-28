// ---------- Import (fussball.de) ----------
function parseTable(txt){
  const out=[];
  for(let line of txt.replace(/​/g,'').split(/\r?\n/)){
    line=line.trim(); if(!line) continue;
    if(/^(pl\.?|platz|mannschaft|verein|sp\.?|tabelle|legende|drucken)\b/i.test(line)) continue;
    let parts=line.split('\t').map(s=>s.trim()).filter(Boolean);
    let name=parts.find(p=>/[a-zA-ZäöüÄÖÜß]/.test(p)&&!/^\d+\.?$/.test(p))||'';
    if(!parts.length||parts.length===1) name=line;
    name=name.replace(/^\d+\.?\s+/,'').replace(/(\s+-?\d+(\s*:\s*\d+)?)+\s*$/,'').trim();
    const w=name.split(/\s+/);
    if(w.length%2===0){const h=w.length/2;if(w.slice(0,h).join(' ')===w.slice(h).join(' '))name=w.slice(0,h).join(' ')}
    if(name.length<2||!/[a-zA-ZäöüÄÖÜß]/.test(name)) continue;
    if(!out.includes(name)) out.push(name);
  }
  return out;
}
