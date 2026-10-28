// Menü + Karriere: Start-Modi, Slots, Lizenzkurs, Bewerbung, Saisonende, Entlassung, Akademie
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(900);
const out={};
await p.evaluate(()=>openMenu());await p.waitForTimeout(300);
out.menuMain=await p.$$eval('.mbtn',x=>x.map(e=>e.querySelector('span').textContent));
await p.screenshot({path:'../../tests/menu-main.png'});
await p.click('[data-act="mscr:new"]');await p.waitForTimeout(150);
await p.fill('#mName','Patrick Testmann');
await p.click('[data-act="mstart:zero"]');await p.click('[data-act="mslot:2"]');
await p.screenshot({path:'../../tests/menu-new.png'});
await p.click('[data-act="mgo:career"]');await p.waitForTimeout(1500);
out.zero=await p.evaluate(()=>({mode:S.mode,slot:SLOT,c:{name:S.career.name,lic:S.career.lic,jobless:S.career.jobless,money:S.career.money,offers:(S.career.offers||[]).length},fav:S.fav,menuOpen:!!(view.ov&&view.ov.t==='menu')}));
await p.screenshot({path:'../../tests/career-jobless.png'});
// Kurs + Bewerbungen
out.flow=await p.evaluate(()=>{const r={};r.course=startCourse(1);for(let i=0;i<40;i++){simDay()} r.lic=S.career.lic;r.course2=S.career.course;
  const v=vacancies();r.vac=v.length;let got=null;for(const x of v){const a=applyJob(x);r.ans=(r.ans||[]).concat(a);if(a==="ok"){got=x;break}}r.apply=got?'ok':'none';
  if(!got&&S.career.offers&&S.career.offers.length){takeJob(S.career.offers[0].club);got=S.fav}
  r.fav=S.fav&&T(S.fav).name;r.goal=S.career.goal;return r});
await p.evaluate(()=>{view.tab='fav';view.ftab='karriere';view.ov=null;render()});await p.waitForTimeout(200);
await p.screenshot({path:'../../tests/career-tab.png',fullPage:false});
// eine Saison durchsimulieren
out.season=await p.evaluate(()=>{const s0=S.season;let g=0;while(S.season===s0&&g++<4000){if(S.done)newSeason();else simDay()}const c=S.career;return {season:S.season,club:S.fav&&T(S.fav).name,jobless:c.jobless,rep:c.rep,money:Math.round(c.money),hist:(c.hist||[]).slice(-2),conf:c.conf,lic:c.lic,news:(S.news||[]).slice(0,40).filter(n=>/Trainer|Vorstand|Gehalt|Ziel/.test(JSON.stringify(n))).slice(0,4)}});
// Entlassung erzwingen
out.fire=await p.evaluate(()=>{if(!S.fav)return 'kein Verein';fireCoach('Test');return {jobless:S.career.jobless,fav:S.fav,offers:(S.career.offers||[]).length}});
// Slots: Slot-Menü und Wechsel
await p.evaluate(()=>{save();return openMenu('slots')});await p.waitForTimeout(500);
out.slots=await p.$$eval('.mslot',x=>x.map(e=>e.innerText.replace(/\s+/g,' ').slice(0,90)));
await p.screenshot({path:'../../tests/menu-slots.png'});
// Wunschverein in Slot 3
await p.evaluate(()=>openMenu('new'));await p.waitForTimeout(200);
await p.fill('#mName','Wunsch Trainer');await p.click('[data-act="mstart:club"]');
await p.fill('#mQ','Schalke');await p.waitForTimeout(600);
const ch=await p.$('[data-act^="mclub:"]');if(ch)await ch.click();await p.click('[data-act="mslot:3"]');await p.click('[data-act="mgo:career"]');await p.waitForTimeout(1500);
out.club=await p.evaluate(()=>({slot:SLOT,fav:S.fav&&T(S.fav).name,lic:S.career.lic,goal:S.career.goal&&S.career.goal.txt}));
// Akademie
out.acad=await p.evaluate(()=>{try{const r=act('acadlv:2');return {lvl:S.acad&&S.acad.lv,ok:true}}catch(e){return e.message}});
// Freies Spiel
await p.evaluate(()=>openMenu('free'));await p.waitForTimeout(200);await p.click('[data-act="mslot:1"]');await p.click('[data-act="mgo:free"]');await p.waitForTimeout(1200);
out.free=await p.evaluate(()=>({mode:S.mode,slot:SLOT,career:!!S.career}));
// Theme
await p.evaluate(()=>openMenu('set'));await p.click('[data-act="mtheme:light"]');out.theme=await p.evaluate(()=>document.documentElement.dataset.theme);
await p.screenshot({path:'../../tests/menu-set.png'});
// Mobile
await p.setViewportSize({width:390,height:844});await p.evaluate(()=>openMenu('new'));await p.waitForTimeout(300);await p.screenshot({path:'../../tests/menu-mobile.png'});
out.hscroll=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
console.log(JSON.stringify(out,null,1));console.log('ERR',errs.slice(0,5));await b.close()})();
