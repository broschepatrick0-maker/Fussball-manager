// Screenshot-Import mit simulierter Texterkennung (echte Zeilen aus lokalem Tesseract)
const {chromium}=require('playwright');const fs=require('fs');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const SP='/tmp/claude-0/-home-claude/fefefd0a-d0a2-5c84-8f2a-a9cae70994d7/scratchpad/';
const lines=JSON.parse(fs.readFileSync(SP+'l_4e5f2496.json'));
await p.route('**/tesseract.min.js',r=>r.fulfill({contentType:'application/javascript',body:`window.Tesseract={createWorker:async(l,o,c)=>{c.logger({status:'loading language traineddata',progress:1});return {recognize:async()=>({data:{lines:${JSON.stringify(lines)}.map(x=>({text:x.text,bbox:{y0:x.y0,y1:x.y1}}))}})}}}`}));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(900);
await p.evaluate(()=>{act('import')});await p.waitForTimeout(200);
await p.selectOption('#iVb','TH');await p.waitForTimeout(100);await p.selectOption('#iLv','11');await p.waitForTimeout(150);
const ups=await p.$$eval('#iUp option',o=>o.map(x=>x.value).filter(Boolean));
await p.selectOption('#iUp','1. Kreisklasse Mittelthüringen West');
await p.setInputFiles('#ocrIn','/mnt/user-data/attachments/fefefd0a-d0a2-5c84-8f2a-a9cae70994d7/4e5f2496-image.jpg');
await p.waitForTimeout(1500);
const txt=await p.$eval('#iTxt',t=>t.value);
await p.screenshot({path:'tests/ocr-mob.png',fullPage:true});
await p.fill('#iName','2. Kreisklasse Test X');await p.click('[data-act="icreate"]');await p.waitForTimeout(500);
const r=await p.evaluate(()=>{const l=S.leagues.find(x=>x.name==='2. Kreisklasse Test X');const o={n:l&&l.teams.length,up:l&&l.up,kreis:l&&l.kreis,level:l&&l.level};
  sim(99);newSeason();o.moves=S.log[0].lines.filter(x=>x.includes('Test B'));o.exp=exportLeagues().slice(0,200);return o});
console.log(JSON.stringify({ups:ups.length,txt:txt.split('\n'),...r},null,1));console.log(errs.slice(0,5));await b.close()})();
