// ---------- Europapokale ----------
const KOR=['Play-offs','Achtelfinale','Viertelfinale','Halbfinale','Finale'];
function euroDefaultQual(){ // 1. Saison: Reihenfolge nach Stärke
  const q={ucl:[],uel:[],uecl:[]};
  for(const lg of S.leagues.filter(l=>l.level===1)){
    const o=[...lg.teams].sort((a,b)=>T(b).r-T(a).r);
    q.ucl.push(...o.slice(0,4));q.uel.push(...o.slice(4,6));q.uecl.push(...o.slice(6,8));
  }
  return q;
}
function buildEuro(){
  if(!S.pool) return;
  const q=S.euroQual||euroDefaultQual(),used=new Set();
  const pool=[...S.pool].sort((a,b)=>(T(b).r+Math.random()*6)-(T(a).r+Math.random()*6));
  S.euro=EURO.map(def=>{
    let ids=[...new Set(q[def.id])].filter(id=>T(id)&&!used.has(id)).slice(0,36);
    ids.forEach(id=>used.add(id));
    while(ids.length<36){const p=pool.find(x=>!used.has(x));if(!p)break;used.add(p);ids.push(p)}
    return {id:def.id,name:def.name,short:def.short,type:'euro',teams:ids,mds:euroPairs(ids,def.md),R:def.md+5,steps:def.md+5,step:0,ko:[],winner:null,nmd:def.md};
  });
}
function euroPairs(ids,n){
  for(let tries=0;tries<200;tries++){
    const met=new Set(),home={},mds=[];let ok=true;
    ids.forEach(id=>home[id]=0);
    for(let d=0;d<n&&ok;d++){
      const left=shuffle(ids),md=[];
      while(left.length){
        const a=left.shift();
        let j=left.findIndex(b=>!met.has(a+'|'+b)&&T(a).cc!==T(b).cc);
        if(j<0) j=left.findIndex(b=>!met.has(a+'|'+b));
        if(j<0){ok=false;break}
        const b=left.splice(j,1)[0];met.add(a+'|'+b);met.add(b+'|'+a);
        const ah=home[a]<=home[b];md.push(ah?{h:a,a:b}:{h:b,a:a});home[ah?a:b]++;
      }
      mds.push(md);
    }
    if(ok) return mds;
  }
  return [];
}
function euroTable(e){
  const t={};e.teams.forEach(id=>t[id]={id,sp:0,s:0,u:0,n:0,tf:0,tg:0,p:0});
  e.mds.slice(0,Math.min(e.step,e.nmd)).forEach(md=>md.forEach(m=>{
    const H=t[m.h],A=t[m.a];H.sp++;A.sp++;H.tf+=m.hg;H.tg+=m.ag;A.tf+=m.ag;A.tg+=m.hg;
    if(m.hg>m.ag){H.s++;A.n++;H.p+=3}else if(m.hg<m.ag){A.s++;H.n++;A.p+=3}else{H.u++;A.u++;H.p++;A.p++}
  }));
  return Object.values(t).sort((a,b)=>b.p-a.p||(b.tf-b.tg)-(a.tf-a.tg)||b.tf-a.tf||T(b.id).r-T(a.id).r);
}
function tie(a,b,final){ // a = schlechter gesetzt, b hat Rückspiel
  if(final){const m={h:a,a:b,neutral:true};let [x,y]=play(a,b,true);m.hg=x;m.ag=y;
    if(x===y){m.hg+=pois(lam(T(a).r,T(b).r,false)/3);m.ag+=pois(lam(T(b).r,T(a).r,false)/3);m.et=true;
      if(m.hg===m.ag){let p=0,q=0;for(let i=0;i<5;i++){if(Math.random()<.75)p++;if(Math.random()<.75)q++}while(p===q){if(Math.random()<.75)p++;if(Math.random()<.75)q++}m.pen=[p,q]}}
    m.w=m.pen?(m.pen[0]>m.pen[1]?a:b):(m.hg>m.ag?a:b);return {a,b,l1:m,w:m.w,final:true}}
  const [x1,y1]=play(a,b),[x2,y2]=play(b,a);
  const ga=x1+y2,gb=y1+x2;let pen=null,w;
  if(ga!==gb) w=ga>gb?a:b; else {let p=0,q=0;for(let i=0;i<5;i++){if(Math.random()<.75)p++;if(Math.random()<.75)q++}while(p===q){if(Math.random()<.75)p++;if(Math.random()<.75)q++}pen=[p,q];w=p>q?a:b}
  return {a,b,l1:{h:a,a:b,hg:x1,ag:y1},l2:{h:b,a:a,hg:x2,ag:y2},agg:[ga,gb],pen,w};
}
function euroStep(e){
  if(e.step<e.nmd){e.mds[e.step].forEach(m=>{if(m.hg!=null)return;const [x,y]=play(m.h,m.a);m.hg=x;m.ag=y});e.step++;return}
  const k=e.step-e.nmd; // 0 Play-offs, 1 AF, 2 VF, 3 HF, 4 Finale
  if(k===0){const t=euroTable(e).map(r=>r.id);e.seed=t;
    const ties=[];for(let i=8;i<16;i++) ties.push(tie(t[31-i],t[i]));e.ko.push({name:KOR[0],ties})}
  else{
    const prev=k===1?null:e.ko[k-1].ties.map(x=>x.w);
    let pairs=[];
    if(k===1){const top=shuffle(e.seed.slice(0,8)),po=shuffle(e.ko[0].ties.map(x=>x.w));pairs=top.map((t,i)=>[po[i],t])}
    else{const w=shuffle(prev);for(let i=0;i<w.length;i+=2)pairs.push([w[i],w[i+1]])}
    e.ko.push({name:KOR[k],ties:pairs.map(([a,b])=>tie(a,b,k===4))});
    if(k===4) e.winner=e.ko[4].ties[0].w;
  }
  e.step++;
}
function euroReach(e,id){
  if(!e.teams.includes(id)) return null;
  if(e.winner===id) return 'Sieger';
  for(let k=e.ko.length-1;k>=0;k--) if(e.ko[k].ties.some(t=>t.a===id||t.b===id)) return e.ko[k].name;
  if(e.seed){const p=e.seed.indexOf(id)+1;return 'Ligaphase ('+p+'.)'}
  return 'Ligaphase';
}
function euroQualify(st){
  const q={ucl:[],uel:[],uecl:[]};
  for(const lg of S.leagues.filter(l=>l.level===1)){const o=st[lg.id];q.ucl.push(...o.slice(0,4));q.uel.push(...o.slice(4,6));q.uecl.push(...o.slice(6,8))}
  const cl=(S.euro||[]).find(e=>e.id==='ucl'),el=(S.euro||[]).find(e=>e.id==='uel'),ecl=(S.euro||[]).find(e=>e.id==='uecl');
  if(cl&&cl.winner) q.ucl.unshift(cl.winner); if(el&&el.winner) q.ucl.unshift(el.winner); if(ecl&&ecl.winner) q.uel.unshift(ecl.winner);
  // ein Verein nur in einem Wettbewerb
  const seen=new Set();for(const k of ['ucl','uel','uecl']) q[k]=q[k].filter(id=>!seen.has(id)&&seen.add(id));
  return q;
}
