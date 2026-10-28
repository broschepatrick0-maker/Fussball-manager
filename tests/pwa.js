const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const ctx=await b.newContext();const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8777/');await p.waitForTimeout(2500);
const r1=await p.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();const m=await (await fetch('manifest.webmanifest')).json();return {sw:!!reg,active:!!(reg&&reg.active),manifest:m.name,icons:m.icons.length,cached:(await caches.keys()).length}});
console.log(JSON.stringify(r1));
await p.evaluate(()=>{sim(3);save()});await p.waitForTimeout(800);
await ctx.setOffline(true);await p.reload();await p.waitForTimeout(2000);
console.log('offline',await p.evaluate(()=>({round:S.round,title:document.title,teams:S.leagues.length})));
console.log(errs.slice(0,3));await b.close()})();
