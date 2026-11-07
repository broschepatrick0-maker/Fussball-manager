// ---------- Eigentümerstrukturen (echte Vereine) ----------
// t: ev = Mitgliederverein, aus = ausgegliedert (e.V. behält über 50+1 die Stimmenmehrheit),
//    konz = Konzernverein, werk = Werksklub, maz = Mäzen, kap = Kapitalgesellschaft (Ausland)
// fix: Geldgeber ist dauerhaft (zahlt jede Saison, steigt nie aus)
const OWN_T={ev:'Mitgliederverein',aus:'Ausgegliedert (50+1)',konz:'Konzernverein',werk:'Werksklub',maz:'Mäzenverein',kap:'Kapitalgesellschaft'};
const REAL_OWN={
  'RB Leipzig':{t:'konz',n:'Red Bull GmbH',d:'Red Bull hält rund 99 % der Anteile',fix:1},
  'VfL Wolfsburg':{t:'werk',n:'Volkswagen AG',d:'100-%-Tochter von VW, Ausnahme von der 50+1-Regel',fix:1},
  'Bayer 04 Leverkusen':{t:'werk',n:'Bayer AG',d:'100-%-Tochter der Bayer AG, Ausnahme von der 50+1-Regel',fix:1},
  'TSG Hoffenheim':{t:'maz',n:'Dietmar Hopp',d:'Hopp hält die Kapitalmehrheit, die Stimmenmehrheit liegt seit 2023 wieder beim e.V.',fix:1},
  'Viktoria Köln':{t:'maz',n:'Franz-Josef Wernze',d:'Mäzen und Hauptgesellschafter',fix:1},
  'FC Bayern München':{t:'aus',n:'FC Bayern München e.V. (rund 75 %)',d:'AG · Adidas, Audi und Allianz halten je rund 8 %'},
  'Borussia Dortmund':{t:'aus',n:'Ballspielverein Borussia 09 e.V.',d:'KGaA an der Börse · u. a. Evonik, Puma und Signal Iduna sind Aktionäre'},
  'Eintracht Frankfurt':{t:'aus',n:'Eintracht Frankfurt e.V.',d:'Fußball AG'},
  'VfB Stuttgart':{t:'aus',n:'VfB Stuttgart 1893 e.V.',d:'AG · u. a. Mercedes-Benz und Porsche halten Anteile'},
  'Hamburger SV':{t:'aus',n:'Hamburger SV e.V.',d:'AG · Klaus-Michael Kühne hält rund 15 %'},
  'Hertha BSC':{t:'aus',n:'Hertha BSC e.V.',d:'KGaA · der Großteil des Kapitals liegt bei Investoren'},
  'TSV 1860 München':{t:'aus',n:'TSV München von 1860 e.V.',d:'KGaA · Investor Hasan Ismaik hält 60 % des Kapitals, aber nur 49 % der Stimmen'},
  'Hannover 96':{t:'aus',n:'Hannover 96 e.V.',d:'KGaA · das Kapital liegt bei der Gesellschafterseite um Martin Kind'},
  'FC Augsburg':{t:'aus',n:'FC Augsburg 1907 e.V.',d:'KGaA · US-Investorengruppe um David Blitzer hält Anteile'},
  'FC Ingolstadt 04':{t:'aus',n:'FC Ingolstadt 04 e.V.',d:'Fußball GmbH · Audi hält rund 20 %'},
  'Werder Bremen':{t:'aus',n:'SV Werder Bremen e.V.',d:'KGaA · ein Bündnis Bremer Unternehmer hält Anteile'},
  'Kaiserslautern':{t:'aus',n:'1. FC Kaiserslautern e.V.',d:'KGaA · regionale Investorengruppe hält Anteile'},
  'Unterhaching':{t:'aus',n:'SpVgg Unterhaching e.V.',d:'KGaA an der Börse'},
  'Würzburger Kickers':{t:'aus',n:'FC Würzburger Kickers e.V.',d:'AG · Großsponsor Flyeralarm'},
  // Ausland
  'Red Bull Salzburg':{t:'konz',n:'Red Bull GmbH',d:'Konzernverein des Getränkeherstellers',fix:1},
  'Manchester City':{t:'kap',n:'City Football Group',d:'Mehrheit bei der Abu Dhabi United Group',fix:1},
  'Paris Saint-Germain':{t:'kap',n:'Qatar Sports Investments',d:'Staatsfonds aus Katar',fix:1},
  'Newcastle United':{t:'kap',n:'Public Investment Fund',d:'Staatsfonds aus Saudi-Arabien',fix:1},
  'Chelsea FC':{t:'kap',n:'BlueCo',d:'Konsortium um Todd Boehly und Clearlake Capital'},
  'Liverpool FC':{t:'kap',n:'Fenway Sports Group',d:'US-Investmentgruppe'},
  'Arsenal FC':{t:'kap',n:'Kroenke Sports & Entertainment',d:'Familie Kroenke aus den USA'},
  'Manchester United':{t:'kap',n:'Familie Glazer',d:'INEOS um Jim Ratcliffe hält rund ein Viertel'},
  'Aston Villa':{t:'kap',n:'V Sports',d:'Nassef Sawiris und Wes Edens'},
  'AC Mailand':{t:'kap',n:'RedBird Capital',d:'US-Investmentfirma'},
  'Inter Mailand':{t:'kap',n:'Oaktree Capital',d:'US-Investmentfirma'},
  'Juventus Turin':{t:'kap',n:'Exor',d:'Holding der Familie Agnelli, an der Börse'},
  'AS Rom':{t:'kap',n:'Friedkin Group',d:'Familie Friedkin aus den USA'},
  'SSC Neapel':{t:'kap',n:'Aurelio De Laurentiis',d:'Filmproduzent, Eigentümer seit 2004'},
  'Como 1907':{t:'kap',n:'Djarum-Gruppe',d:'Brüder Hartono aus Indonesien',fix:1},
  'Olympique Marseille':{t:'kap',n:'Frank McCourt',d:'US-Unternehmer'},
  'AS Monaco':{t:'kap',n:'Dmitri Rybolowlew',d:'Mehrheitseigner seit 2011'},
  'Paris FC':{t:'kap',n:'Familie Arnault',d:'Red Bull hält eine Minderheit'},
  'Real Madrid':{t:'ev',n:'Mitglieder (Socios)',d:'Verein im Besitz seiner Mitglieder'},
  'FC Barcelona':{t:'ev',n:'Mitglieder (Socis)',d:'Verein im Besitz seiner Mitglieder'},
  'Athletic Bilbao':{t:'ev',n:'Mitglieder (Socios)',d:'Verein im Besitz seiner Mitglieder'},
  'CA Osasuna':{t:'ev',n:'Mitglieder (Socios)',d:'Verein im Besitz seiner Mitglieder'}
};
function realOwn(id){const t=T(id);return t&&!isRes(t.name)?REAL_OWN[t.name]||null:null}
// Rechtsform ohne Eintrag: Profiklubs im Ausland sind Kapitalgesellschaften, alle anderen e.V.
function ownType(id){const r=realOwn(id);if(r)return r.t;const t=T(id);return t&&t.cc?'kap':'ev'}
// Dauerhafte Geldgeber echter Vereine als feste Investoren verankern
function ensureRealOwners(){if(!S.inv)S.inv={};let n=0;
  for(const id in S.teams){const r=realOwn(id);if(!r||!r.fix)continue;const z=FZ(id);if(!z)continue;
    const key='ro:'+S.teams[id].name;let inv=S.inv[key];
    if(inv&&inv.gone)continue;
    if(!inv){const lv=finLv(id)?finLv(id).lv:1;inv=S.inv[key]={id:key,n:r.n,k:OWN_T[r.t],o:'',w:Math.round((REVL[Math.max(1,Math.min(10,lv))]||1e5)*.3/1e3)*1e3,amb:1,pat:9999,club:null,since:S.season,put:0,best:lv,fix:1}}
    if(z.own!==key){if(z.own&&S.inv[z.own])S.inv[z.own].club=null;z.own=key;inv.club=id;n++}}
  return n}
