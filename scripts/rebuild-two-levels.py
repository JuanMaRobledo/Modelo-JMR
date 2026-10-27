#!/usr/bin/env python3
"""Rebuild reader-facing levels from existing research without changing valuation inputs.

Usage: python scripts/rebuild-two-levels.py /path/to/Modelo-JMR-datos
Requires beautifulsoup4. Financial records remain in their existing repository.
"""
import argparse, copy, hashlib, html, json, re, unicodedata
from pathlib import Path
from bs4 import BeautifulSoup, Tag

APP=Path(__file__).resolve().parents[1]
VERSION='jmr-two-levels-v2-20261014'
def norm(t):
 return re.sub(r'\s+',' ',unicodedata.normalize('NFKD',t).encode('ascii','ignore').decode().lower()).strip()
def txt(n):return n.get_text(' ',strip=True)
def numeric(t):return bool(re.search(r'\d',t)) and len(t.split())<24
def calc_table(t):
 rows=t.find_all('tr'); cells=[txt(c) for r in rows[1:] for c in r.find_all(['td','th'])]
 if not cells:return False
 # Qualitative grids and bibliographies belong in the article, including long justifications.
 return sum(numeric(c) for c in cells)/len(cells)>=.36 and sum(numeric(c) for c in cells)>=3
def compact_table(t):
 out=BeautifulSoup(str(t),'html.parser').table;notes=[]
 for ri,row in enumerate(out.find_all('tr')):
  for ci,c in enumerate(row.find_all(['td','th'])):
   if len(txt(c).split())>24:
    notes.append(txt(c));c.clear();c.append('Nota '+str(len(notes)))
 return out,notes
def dedup(soup):
 seen=set()
 for node in list(soup.find_all(['p','table','blockquote'])):
  if node.parent is None:continue
  text=norm(txt(node))
  if len(text)<85:continue
  if text in seen:node.decompose()
  else:seen.add(text)
def build(record,valuation):
 tk=record['ticker'];s=BeautifulSoup(record.get('html',''),'html.parser')
 for n in list(s.find_all(['script','style','nav'])):n.decompose()
 # Original tables of contents will be regenerated for both levels.
 for n in list(s.find_all(['ul','ol'])):
  links=n.find_all('a',href=True)
  if links and all(a['href'].startswith('#') for a in links) and len(links)>4:n.decompose()
 dedup(s)
 art=BeautifulSoup('<div></div>','html.parser').div
 calc=BeautifulSoup('<div></div>','html.parser').div
 notes_count=0;calc_count=0
 for table in list(s.find_all('table')):
  if table.parent is None or not calc_table(table):continue
  calc_count+=1;ident=f'calculo-{tk.lower()}-{calc_count}'
  label=table.find_previous(['h2','h3','h4'])
  title=txt(label) if label else f'Tabla {calc_count}'
  heading=BeautifulSoup('<h3></h3>','html.parser').h3;heading['id']=ident;heading.string=title
  calc.append(heading)
  cleaned,notes=compact_table(table);calc.append(cleaned)
  p=BeautifulSoup('<p><a>Ver cálculo</a></p>','html.parser').p;p.a['href']='#'+ident
  table.replace_with(p)
  if notes:
   box=BeautifulSoup('<div></div>','html.parser').div
   for note in notes:
    q=BeautifulSoup('<p></p>','html.parser').p;q.string=note;box.append(q);notes_count+=1
   p.insert_before(box)
  ret=BeautifulSoup('<p><a href="#jmrArticleLevel">Volver al artículo</a></p>','html.parser').p;calc.append(ret)
 # Formula paragraphs move to calculations only when they contain no extended reasoning.
 for node in list(s.find_all(['pre','p'])):
  if node.parent is None:continue
  text=txt(node)
  if (node.name=='pre' or re.search(r'\b(?:FCFF|FCFE|WACC|Ke|NOPAT|VP|P[0123]|TV|g)\s*=',text)) and len(text.split())<=65:
   node.extract();calc.append(node)
 dedup(s)
 date=record.get('date') or valuation.get('fecha') or 'Fecha del expediente'
 title=record.get('company') or record.get('title') or tk
 intro=BeautifulSoup('<h1></h1><p class="jmr-editorial-meta"></p>','html.parser');intro.h1.string=title+' · análisis e inversión';intro.p.string=f'{tk} · Datos y tesis del expediente: {date}. Edición de lectura: 14-oct-2026.'
 art.extend(list(intro.contents))
 # Keep the existing dated research as the substantive article; no truncated teaser.
 for h in list(s.find_all('h1')):h.decompose()
 art.extend(list(s.contents))
 # Add reproducible operations directly from saved valuation records, not invented formulas.
 if valuation:
  h=BeautifulSoup('<h2 id="calculo-resumen">Operaciones del registro de valoración</h2>','html.parser').h2;calc.append(h)
  ve=valuation.get('valorEsperado') or {};hist=ve.get('historias') or []
  if hist:
   rows=[['Historia','Probabilidad','Valor por acción','Contribución']]
   for v in hist:
    p=v.get('probabilidad');val=v.get('valor')
    rows.append([v.get('nombre',v.get('id','')),p,val,p*val if isinstance(p,(int,float)) and isinstance(val,(int,float)) else 'N/D'])
   calc.append(BeautifulSoup(table_html(rows),'html.parser'))
  dm=valuation.get('descuentoMultiples') or {};ke=dm.get('costoPatrimonio')
  if isinstance(ke,(int,float)):
   calc.append(BeautifulSoup('<p>VPₙ = Precioₙ / (1 + Ke)ⁿ + Σ Dividendoₜ / (1 + Ke)ᵗ; Ke = '+html.escape(str(ke))+'.</p>','html.parser'))
   rows=[['Método','Escenario','Horizonte','Precio proyectado','Ke','Valor presente']]
   for m in dm.get('metodos',[]):
    for sc in ['conservador','base','optimista']:
     v=m.get(sc) or {}
     if not isinstance(v,dict):continue
     for i,(fy,vp) in enumerate(zip(v.get('fy') or [],v.get('vp') or []),1):rows.append([m.get('nombre'),sc,i,fy,ke,vp])
   if len(rows)>1:calc.append(BeautifulSoup(table_html(rows),'html.parser'))
  price=valuation.get('precio') if isinstance(valuation.get('precio'),(int,float)) else valuation.get('precioAnalisis');central=ve.get('valorCentral') or ve.get('dcfBase') or (dm.get('dcfHoy') or {}).get('base');mos=valuation.get('mos')
  if all(isinstance(v,(int,float)) for v in [price,central,mos]):
   calc.append(BeautifulSoup(table_html([['Operación','Sustitución','Resultado'],['Diferencia Base/precio',f'{central}/{price} − 1',central/price-1],['Precio con MOS',f'{central} × (1 − {mos})',central*(1-mos)]]),'html.parser'))
 link=valuation.get('hojaGoogle')
 if link:
  calc.append(BeautifulSoup('<p>Fórmulas y celdas de origen: <a href="'+html.escape(link,quote=True)+'" target="_blank" rel="noopener">Modelo de '+html.escape(tk)+'</a>.</p>','html.parser'))
 # Expose all interpretation in level 1; the second level has only tables and short operation labels.
 for p in calc.find_all('p'):
  if len(txt(p).split())>65:raise ValueError('Narrative calculation paragraph '+tk)
 return ''.join(str(x) for x in art.contents),''.join(str(x) for x in calc.contents),{'calculationTables':calc_count,'explanatoryNotesMovedToArticle':notes_count,'articleWords':len(txt(art).split()),'calculationWords':len(txt(calc).split())}
def table_html(rows):
 return '<table><thead><tr>'+''.join('<th>'+html.escape(str(c))+'</th>' for c in rows[0])+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+html.escape(str(c) if c is not None else 'N/D')+'</td>' for c in r)+'</tr>' for r in rows[1:])+'</tbody></table>'
def main():
 ap=argparse.ArgumentParser();ap.add_argument('data',type=Path);a=ap.parse_args();manifest=[]
 vals={}
 for f in a.data.joinpath('valoraciones').glob('*.json'):
  j=json.loads(f.read_text());tk=j.get('ticker');old=vals.get(tk)
  if tk and (not old or str(j.get('savedAt',''))>str(old.get('savedAt',''))):vals[tk]=j
 for f in sorted(a.data.joinpath('analisis').glob('*.json')):
  rec=json.loads(f.read_text());tk=rec.get('ticker')
  if not tk:continue
  if rec.get('analysisSchema')==VERSION:
   manifest.append(rec['editorialMigration']);continue
  original=rec['html'];val=vals.get(tk) or rec.get('linkedValuation') or {}
  article,calc,stats=build(rec,val)
  migration={'ticker':tk,'sourcePath':str(f.relative_to(a.data)),'sourceSha256':hashlib.sha256(original.encode()).hexdigest(),'version':VERSION,'financialInputsChanged':False,**stats}
  rec.update({'articleHtml':article,'calculationHtml':calc,'analysisSchema':VERSION,'editorialMigration':migration})
  # html remains the complete original and git preserves every previous version.
  f.write_text(json.dumps(rec,ensure_ascii=False,indent=2)+'\n');manifest.append(migration)
 out=a.data/'auditorias'/'migracion-dos-niveles-2026-10-14.json';out.parent.mkdir(exist_ok=True)
 out.write_text(json.dumps({'schema':VERSION,'assets':manifest,'count':len(manifest)},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'count':len(manifest),'assets':[{k:v for k,v in m.items() if k not in ['sourceSha256','sourcePath','version']} for m in manifest]},ensure_ascii=False))
if __name__=='__main__':main()
