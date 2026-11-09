# Kaderliste (xlsx) -> src/01d-squads.js (bestehende Einträge bleiben, neue Vereine kommen dazu bzw. ersetzen)
import sys,json,math,pandas as pd,datetime
src=sys.argv[1];import os;F=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','src','01d-squads.js')
try:
    s=open(F).read();cur=json.loads(s[s.index('{'):s.rindex('}')+1].split('\n// END')[0]) if 'REAL_SQUADS=' in s else {}
except Exception: cur={}
x=pd.read_excel(src,sheet_name=None)
k=x['Kader'];k=k[k['Name'].notna()&k['Verein'].notna()]
k=k[~k['Name'].astype(str).str.contains(r'\(Beispiel\)')]
tr={};t=x.get('Trainer')
if t is not None:
    for _,r in t.iterrows():
        if isinstance(r.get('Cheftrainer'),str) and r['Cheftrainer'].strip():tr[r['Verein']]=r['Cheftrainer'].strip()
num=lambda v:None if v is None or (isinstance(v,float) and math.isnan(v)) else v
mvcol=[c for c in k.columns if str(c).startswith('Marktwert')]
new={}
for club,g in k.groupby('Verein',sort=False):
    pl=[]
    for _,r in g.iterrows():
        pos=str(r['Position']).strip().upper();pos=pos if pos in('TW','AB','MF','ST') else 'MF'
        a=num(r['Alter']);st=num(r.get('Stärke (optional)'));mv=num(r[mvcol[0]]) if mvcol else None
        pl.append([str(r['Name']).strip(),pos,int(a) if a else 25,str(r['Nation']).strip() if isinstance(r['Nation'],str) else 'Deutschland',round(float(st),1) if st else None,float(mv) if mv is not None else None])
    new[club]={'tr':tr.get(club),'v':datetime.date.today().isoformat()+'-'+str(len(pl)),'p':pl}
for c,v in tr.items():
    if c not in new and c in cur:cur[c]['tr']=v
cur.update(new)
open(F,'w').write('// Echte Kader (vom Nutzer geliefert bzw. aus Wikipedia-Kaderlisten): Name, Position, Alter, Nation, Stärke (optional), Marktwert in Mio. € (optional), Rückennummer (optional), Stammkraft 1 (optional)\nvar REAL_SQUADS='+json.dumps(cur,ensure_ascii=False)+';\n')
print('Vereine:',{c:len(v['p']) for c,v in new.items()},'gesamt',len(cur))
