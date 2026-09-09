import os, sys
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(_ROOT, "engine"))
import crs_engine as E
from crs_engine import score, full, ABIL
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# ---------- label maps ----------
AGE_LAB={'A':'17 or less','B':'18','C':'19','D':'20','E':'21','F':'22','G':'23','H':'24','I':'25','J':'26','K':'27','L':'28','M':'29','N':'30','O':'31','P':'32','Q':'33','R':'34','S':'35','T':'36','U':'37','V':'38','W':'39','X':'40','Y':'41','Z':'42','AA':'43','AB':'44','AC':'45 or more'}
EDU_LAB={'A':'None / < secondary','B':'Secondary diploma','C':'One-year post-secondary','D':'Two-year post-secondary','E':"Bachelor's / 3-year+",'F':'Two+ credentials (one 3-yr+)','G':"Master's / professional",'H':'Doctoral (PhD)'}
CLB_LAB={'H':'CLB 10+','G':'CLB 9','F':'CLB 8','E':'CLB 7','D':'CLB 6','C':'CLB 5','B':'CLB 4','A':'CLB 3 or less'}
CDN_LAB={'A':'None / < 1 yr','B':'1 year','C':'2 years','D':'3 years','E':'4 years','F':'5 years+'}
FOR_LAB={'A':'None / < 1 yr','B':'1 year','C':'2 years','D':'3 years+'}
TEST_LAB={'A':'CELPIP-G (Eng)','B':'IELTS (Eng)','E':'PTE Core (Eng)','C':'TEF Canada (Fr)','D':'TCF Canada (Fr)'}
YN={'A':'No','B':'Yes'}
JOB_LAB={'A':'No offer','00':'NOC TEER 00','0123':'TEER 0/1/2/3','45':'TEER 4/5'}
STUDY_LAB={'none':'No Canadian study','sec':'Secondary in Canada','s12':'1-2 year in Canada','s3':'3-year+ in Canada'}

# ---------- styling ----------
ARIAL=lambda **k: Font(name='Arial', **k)
NAVY='1F2A44'; ACCENT='284BC8'; LIGHT='EAEEFB'; GREY='F2F3F6'; LINE='D9DCE3'
thin=Side(style='thin', color=LINE)
border=Border(left=thin,right=thin,top=thin,bottom=thin)
def hdr(c):
    c.font=ARIAL(bold=True,color='FFFFFF',size=10); c.fill=PatternFill('solid',fgColor=ACCENT)
    c.alignment=Alignment(horizontal='center',vertical='center',wrap_text=True); c.border=border
def title(c,sz=16):
    c.font=ARIAL(bold=True,color=NAVY,size=sz)
def sub(c):
    c.font=ARIAL(color='5A6473',size=10)
def cell(c,val,bold=False,num=False,fill=None):
    c.value=val; c.font=ARIAL(bold=bold,size=10); c.border=border
    c.alignment=Alignment(horizontal='right' if num else 'left',vertical='center')
    if fill: c.fill=PatternFill('solid',fgColor=fill)

wb=Workbook()

# =========================================================
# SHEET 1 — Overview
# =========================================================
ws=wb.active; ws.title='Overview'
ws.sheet_view.showGridLines=False
ws.column_dimensions['A'].width=3
ws.column_dimensions['B'].width=30
for col in 'CDEFGHI': ws.column_dimensions[col].width=15
title(ws['B2'],18); ws['B2']='CRS Master Workbook'
sub(ws['B3']); ws['B3']='Canada Express Entry — Comprehensive Ranking System (score out of 1,200)'
rows_txt=[
 ('','',),
 ('What this is','A reference database of how every Express Entry CRS answer affects your score.'),
 ('','Built by reverse-engineering the official Government of Canada (IRCC) CRS calculator.'),
 ('Verification','The scoring engine behind these tables was checked against the official IRCC'),
 ('','calculator on 5,000+ random full profiles — exact match on the grand total and every'),
 ('','sub-score. Anchor checks: 379, 391, 353, 979, 432 all reproduced exactly.'),
 ('Rules current to','2026. Job offer / arranged-employment points = 0 (removed 25 March 2025).'),
 ('','',),
 ('Sheets','Point tables  —  the raw points each answer is worth (the backend rules).'),
 ('','Sensitivity - no spouse  —  each question swept one at a time from a single-applicant baseline.'),
 ('','Sensitivity - with spouse  —  same, from an accompanying-spouse baseline.'),
 ('','Marital comparison  —  how the single vs. with-spouse choice moves the score.'),
 ('','',),
 ('How the total is built','Total = Core/human capital + Spouse factors + Skill transferability + Additional points.'),
 ('','Core max 500 (with spouse) / 460 (without) incl. up to 40 spouse pts; skill transferability max 100;'),
 ('','additional max 600. Grand total capped at 1,200.'),
 ('','',),
 ('Key non-obvious rules','Language points depend on CLB level, not the specific test (exception: TCF Canada at CLB 4'),
 ('','scores 0 for the first language). French bonus pays 50 only when English is the FIRST language'),
 ('','at CLB 5+ and French is second at CLB 7+; French-as-first pays 25.'),
 ('','',),
 ('Baselines used','No spouse: single, age 29, bachelor, IELTS CLB 9 (all four), no work experience, no extras = 379.'),
 ('','With spouse: married + accompanying, age 29, bachelor, CLB 9, spouse with no credentials = 353.'),
 ('','',),
 ('Disclaimer','Independent tool; not affiliated with or endorsed by the Government of Canada / IRCC.'),
 ('','Estimates for planning; confirm any real application against the official calculator.'),
]
r=5
for a,b in rows_txt:
    if a: ws.cell(row=r,column=2,value=a).font=ARIAL(bold=True,color=ACCENT,size=10)
    if b: ws.cell(row=r,column=3,value=b).font=ARIAL(size=10,color='222833')
    r+=1

# =========================================================
# SHEET 2 — Point tables
# =========================================================
ws=wb.create_sheet('Point tables')
ws.sheet_view.showGridLines=False
ws.column_dimensions['A'].width=3
ws.column_dimensions['B'].width=34
for col in 'CDEF': ws.column_dimensions[col].width=16
title(ws['B2']); ws['B2']='CRS point tables (official values)'
sub(ws['B3']); ws['B3']='The points each answer is worth. "With spouse" applies to an accompanying spouse; those caps are lower but add up to 40 spouse points.'
r=5
def table(header, rows, startcol=2):
    global r
    ws.cell(row=r,column=startcol,value=header[0]); ws.cell(row=r,column=startcol).font=ARIAL(bold=True,size=11,color=NAVY)
    r+=1
    for j,h in enumerate(header[1]):
        c=ws.cell(row=r,column=startcol+j,value=h); hdr(c)
    r+=1
    for row in rows:
        for j,v in enumerate(row):
            c=ws.cell(row=r,column=startcol+j,value=v)
            cell(c,v,num=(j>0 and isinstance(v,(int,float))))
            if j==0: c.font=ARIAL(size=10)
        r+=1
    r+=1

table(('Age', ['Age','Without spouse','With spouse']),
      [[AGE_LAB[k], E.AGE[k][1], E.AGE[k][0]] for k in ['B','D','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','AA','AB','AC']])
table(('Level of education', ['Education','Without spouse','With spouse']),
      [[EDU_LAB[k], E.EDU[k][1], E.EDU[k][0]] for k in 'ABCDEFGH'])
table(('First official language — points PER ability', ['CLB level','Without spouse','With spouse']),
      [[CLB_LAB[k], E.FOL[k][1], E.FOL[k][0]] for k in 'HGFEDCB'])
table(('Second official language — points PER ability (max 24 / 22)', ['CLB level','Without spouse','With spouse']),
      [[CLB_LAB[k], E.SOL[k][1], E.SOL[k][0]] for k in 'HGFEDCB'])
table(('Canadian work experience', ['Years','Without spouse','With spouse']),
      [[CDN_LAB[k], E.CDN[k][1], E.CDN[k][0]] for k in 'BCDEF'])

# right column group
r2=5
def table_right(header, rows, startcol=8):
    global r2
    ws.cell(row=r2,column=startcol,value=header[0]).font=ARIAL(bold=True,size=11,color=NAVY)
    r2+=1
    for j,h in enumerate(header[1]):
        c=ws.cell(row=r2,column=startcol+j,value=h); hdr(c)
    r2+=1
    for row in rows:
        for j,v in enumerate(row):
            c=ws.cell(row=r2,column=startcol+j,value=v); cell(c,v,num=(j>0 and isinstance(v,(int,float))))
            if j==0: c.font=ARIAL(size=10)
        r2+=1
    r2+=1
for col in 'HIJKL': ws.column_dimensions[col].width=17
ws.column_dimensions['H'].width=34
table_right(('Spouse — education (max 10)', ['Level','Points']),[[EDU_LAB[k],E.SPEDU[k]] for k in 'ABCDEFGH'])
table_right(('Spouse — language PER ability (max 20)', ['CLB level','Points']),[[CLB_LAB[k],E.SPLANG[k]] for k in 'HGFEDCB'])
table_right(('Spouse — Canadian experience (max 10)', ['Years','Points']),[[CDN_LAB[k],E.SPCDN[k]] for k in 'ABCDEF'])
table_right(('Skill transferability (combined max 100)', ['Bucket','Max']),
      [['Education x language',50],['Education x Canadian exp',50],['Foreign exp x language',50],['Foreign x Canadian exp',50],['Certificate x language',50]])
table_right(('Additional points (max 600)', ['Factor','Points']),
      [['Provincial nomination',600],['Study in Canada 3-yr+',30],['Study in Canada 1-2 yr',15],['French bonus (Eng CLB5+ first)',50],['French bonus (otherwise)',25],['Sibling in Canada',15],['Job offer (removed 2025)',0]])
ws.freeze_panes='A5'

# =========================================================
# Sensitivity generator
# =========================================================
BASE_NS=dict(q1='F', q3='M', q4='E', q4b='A', q5i='A')
BASE_NS['q5i-a']='B'
for a in ABIL: BASE_NS['q5i-b-'+a]='G'
BASE_NS['q5ii']='C'
BASE_WS=dict(BASE_NS); BASE_WS.update(dict(q1='E',q2i='A',q2ii='B',q10='A',q11='A',q12i='F'))

RESCOLS=[('GRAND_TOTAL','Total CRS'),('__delta','Delta vs base'),
 ('core_age','Age'),('core_education','Education'),('core_lang_first','Lang 1'),('core_lang_second','Lang 2'),
 ('core_cdn_exp','Cdn exp'),('core_subtotal','Core subtotal'),
 ('spouse_subtotal','Spouse subtotal'),('st_subtotal','Skill transfer.'),('add_subtotal','Additional')]

def sweep_rows(base, with_spouse):
    baseTotal=score(full(base))['GRAND_TOTAL']
    rows=[]
    def add(dim, choice, override):
        p=dict(base); p.update(override); res=score(full(p))
        rows.append((dim, choice, res, res['GRAND_TOTAL']-baseTotal))
    for k in ['B','D','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','AA','AB','AC']:
        add('Age', AGE_LAB[k], {'q3':k})
    for k in 'ABCDEFGH': add('Level of education', EDU_LAB[k], {'q4':k})
    add('Canadian study', STUDY_LAB['none'], {'q4b':'A'})
    add('Canadian study', STUDY_LAB['sec'], {'q4b':'B','q4c':'A'})
    add('Canadian study', STUDY_LAB['s12'], {'q4b':'B','q4c':'B'})
    add('Canadian study', STUDY_LAB['s3'], {'q4b':'B','q4c':'C'})
    for k in 'HGFEDCBA':
        ov={'q5i-a':'B'};
        for a in ABIL: ov['q5i-b-'+a]=k
        add('First language CLB (all 4)', CLB_LAB[k], ov)
    for t in ['A','B','E','C','D']:
        ov={'q5i-a':t}
        for a in ABIL: ov['q5i-b-'+a]='G'
        add('First language test (at CLB 9)', TEST_LAB[t], ov)
    add('Second language (French, all 4)', 'None', {'q5ii':'C'})
    for k in 'HGFEDCBA':
        ov={'q5ii':'A'}
        for a in ABIL: ov['q5ii-sol-'+a]=k
        add('Second language (French, all 4)', CLB_LAB[k], ov)
    for k in 'ABCDEF': add('Canadian work experience', CDN_LAB[k], {'q6i':k})
    for k in 'ABCD': add('Foreign work experience', FOR_LAB[k], {'q6ii':k})
    for k in 'AB': add('Certificate of qualification', YN[k], {'q7':k})
    add('Job offer (0 pts since 2025)', 'No offer', {'q8':'A'})
    add('Job offer (0 pts since 2025)', 'NOC TEER 00', {'q8':'B','q8a':'A'})
    add('Job offer (0 pts since 2025)', 'TEER 0/1/2/3', {'q8':'B','q8a':'B'})
    add('Job offer (0 pts since 2025)', 'TEER 4/5', {'q8':'B','q8a':'C'})
    for k in 'AB': add('Provincial nomination', YN[k], {'q9':k})
    for k in 'AB': add('Sibling in Canada', YN[k], {'q10i':k})
    if with_spouse:
        for k in 'ABCDEFGH': add('Spouse education', EDU_LAB[k], {'q10':k})
        for k in 'ABCDEF': add('Spouse Canadian experience', CDN_LAB[k], {'q11':k})
        add('Spouse first language (all 4)','None',{'q12i':'F'})
        for k in 'HGFEDCBA':
            ov={'q12i':'A'}
            for a in ABIL: ov['q12ii-fol-'+a]=k
            add('Spouse first language (all 4)', CLB_LAB[k], ov)
    return baseTotal, rows

def write_sweep(sheetname, base, with_spouse, base_desc):
    ws=wb.create_sheet(sheetname)
    ws.sheet_view.showGridLines=False
    baseTotal, rows=sweep_rows(base, with_spouse)
    title(ws['A1']); ws['A1']=sheetname
    sub(ws['A2']); ws['A2']='Baseline = %s  (score %d). Each row changes ONE answer; everything else stays at baseline. Delta = change vs baseline.'%(base_desc, baseTotal)
    hrow=4
    heads=['Question','Answer']+[h for _,h in RESCOLS]
    for j,h in enumerate(heads):
        c=ws.cell(row=hrow,column=1+j,value=h); hdr(c)
    ws.column_dimensions['A'].width=30; ws.column_dimensions['B'].width=24
    for j in range(len(RESCOLS)): ws.column_dimensions[get_column_letter(3+j)].width=12
    rr=hrow+1
    last_dim=None
    for dim,choice,res,delta in rows:
        band = LIGHT if (hash(dim)%2==0) else 'FFFFFF'
        c=ws.cell(row=rr,column=1,value=dim); cell(c,dim); c.font=ARIAL(size=10,bold=(dim!=last_dim))
        if dim==last_dim: c.value=''
        cell(ws.cell(row=rr,column=2,value=choice),choice)
        vals=[]
        for key,_ in RESCOLS:
            v = delta if key=='__delta' else res[key]
            vals.append(v)
        for j,v in enumerate(vals):
            c=ws.cell(row=rr,column=3+j,value=v); cell(c,v,num=True)
            if RESCOLS[j][0]=='GRAND_TOTAL': c.font=ARIAL(bold=True,size=10)
            if RESCOLS[j][0]=='__delta':
                if v>0: c.font=ARIAL(size=10,color='1E8E5A')
                elif v<0: c.font=ARIAL(size=10,color='C33B36')
                else: c.font=ARIAL(size=10,color='8A93A2')
        last_dim=dim
        rr+=1
    ws.freeze_panes='C5'
    return baseTotal

write_sweep('Sensitivity - no spouse', BASE_NS, False, 'single, age 29, bachelor, IELTS CLB 9, no experience, no extras')
write_sweep('Sensitivity - with spouse', BASE_WS, True, 'married + accompanying spouse, age 29, bachelor, CLB 9, spouse no credentials')

# =========================================================
# Marital comparison
# =========================================================
ws=wb.create_sheet('Marital comparison')
ws.sheet_view.showGridLines=False
title(ws['A1']); ws['A1']='Marital status & accompanying spouse'
sub(ws['A2']); ws['A2']='Same personal profile (age 29, bachelor, CLB 9, 1 yr Canadian work); only marital / spouse choice changes.'
P=dict(q3='M',q4='E',q4b='A',q5i='A'); P['q5i-a']='B'
for a in ABIL: P['q5i-b-'+a]='G'
P['q5ii']='C'; P['q6i']='B'
scen=[
 ('Single', dict(P, q1='F')),
 ('Married, spouse accompanying (spouse: no credentials)', dict(P, q1='E',q2i='A',q2ii='B',q10='A',q11='A',q12i='F')),
 ('Married, spouse accompanying (spouse: strong profile)', dict(P, q1='E',q2i='A',q2ii='B',q10='H',q11='F',q12i='A',**{'q12ii-fol-'+a:'G' for a in ABIL})),
 ('Married, spouse NOT accompanying', dict(P, q1='E',q2i='A',q2ii='A')),
 ('Married, spouse is Canadian citizen / PR', dict(P, q1='E',q2i='B')),
]
heads=['Scenario']+[h for _,h in RESCOLS if h!='Delta vs base']
for j,h in enumerate(heads):
    hdr(ws.cell(row=4,column=1+j,value=h))
ws.column_dimensions['A'].width=48
for j in range(len(heads)-1): ws.column_dimensions[get_column_letter(2+j)].width=13
rr=5
for name,prof in scen:
    res=score(full(prof))
    cell(ws.cell(row=rr,column=1,value=name),name)
    cols=[k for k,h in RESCOLS if h!='Delta vs base']
    for j,key in enumerate(cols):
        c=ws.cell(row=rr,column=2+j,value=res[key]); cell(c,res[key],num=True)
        if key=='GRAND_TOTAL': c.font=ARIAL(bold=True,size=10)
    rr+=1
ws.freeze_panes='B5'

_OUT = os.path.join(_ROOT, "data", "CRS_Master_Workbook.xlsx")
wb.save(_OUT)
print('saved', _OUT)
