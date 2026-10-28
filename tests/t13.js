const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(800);
console.log(await p.evaluate(()=>({lg:S.leagues.filter(l=>l.vb==='TH').map(l=>l.name+':'+l.teams.length),cups:S.cups.filter(c=>c.vb==='TH'||/Thür|Kreispokal (West|Erfurt|Nord|Jena|Mittel|Ost|Rhön-)/.test(c.name)).map(c=>c.name+' '+c.teams.length)})));
for(let i=0;i<3;i++){await p.click('#bAll');await p.click('#bNew');await p.waitForTimeout(200);
console.log(i,await p.evaluate(()=>S.log[0].lines.filter(l=>/Thüring|Kreisoberliga|NOFV-Oberliga Süd|Meuselwitz|Rudolstadt/.test(l))));
console.log(await p.evaluate(()=>S.leagues.filter(l=>l.vb==='TH'||l.name==='NOFV-Oberliga Süd').map(l=>l.name+':'+l.teams.length).join(', ')));}
console.log(errs);await b.close()})();
