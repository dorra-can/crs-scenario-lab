/* ============================================================
   ENGINE WIRING
   Rules come from the inline <script id="crs-rules"> block (generated from
   data/crs-rules.json by scripts/build.py). The engine is engine/crs-engine.js.
   To change points/rules: edit data/crs-rules.json, then run scripts/build.py.
   ============================================================ */
const RULES = JSON.parse(document.getElementById('crs-rules').textContent);
const ENG = CRSEngine.createEngine(RULES);
const scoreCRS = ENG.score;
const fullProfile = ENG.full;
const ABIL = ENG.ABIL;

/* ============================================================
   FRIENDLY MODEL  ->  field profile
   ============================================================ */
const CLB_OPTS=[['H','CLB 10+'],['G','CLB 9'],['F','CLB 8'],['E','CLB 7'],['D','CLB 6'],['C','CLB 5'],['B','CLB 4'],['A','CLB 3 or less']];
const AGE_OPTS=[['A','17 or under'],['B','18'],['C','19'],['D','20'],['E','21'],['F','22'],['G','23'],['H','24'],['I','25'],['J','26'],['K','27'],['L','28'],['M','29'],['N','30'],['O','31'],['P','32'],['Q','33'],['R','34'],['S','35'],['T','36'],['U','37'],['V','38'],['W','39'],['X','40'],['Y','41'],['Z','42'],['AA','43'],['AB','44'],['AC','45+']];
const EDU_OPTS=[['A','None / < secondary'],['B','Secondary diploma'],['C','1-year post-secondary'],['D','2-year post-secondary'],['E','Bachelor / 3-year+'],['F','Two+ credentials (one 3-yr+)'],['G','Master / professional'],['H','Doctoral (PhD)']];
const CDNEXP_OPTS=[['A','None / < 1 yr'],['B','1 year'],['C','2 years'],['D','3 years'],['E','4 years'],['F','5 years+']];
const FOREIGN_OPTS=[['A','None / < 1 yr'],['B','1 year'],['C','2 years'],['D','3 years+']];
const STUDY_OPTS=[['none','None'],['sec','Secondary in Canada'],['s12','1–2 yr in Canada (+15)'],['s3','3 yr+ in Canada (+30)']];
const YESNO=[['A','No'],['B','Yes']];
const JOB_OPTS=[['A','No offer'],['00','NOC TEER 00'],['0123','TEER 0/1/2/3'],['45','TEER 4/5']];
const LANG1TYPE=[['B','English — IELTS'],['A','English — CELPIP'],['E','English — PTE Core'],['C','French — TEF Canada'],['D','French — TCF Canada']];
const SPLANG_OPTS=[['none','No test / none']].concat(CLB_OPTS.map(o=>[o[0],'2nd-lang '+o[1]]));

/* baseline friendly state (opens with a realistic profile) */
const state={
  spouse:false,
  age:'M', edu:'E', study:'none',
  l1type:'B', l1clb:'G',
  l2clb:'none',
  cdnexp:'B', foreign:'A',
  cert:'A', pnp:'A', sibling:'A', job:'A',
  spEdu:'A', spLang:'none', spExp:'A'
};

function buildProfile(s){
  const p={};
  if(s.spouse){ p.q1='E'; p.q2i='A'; p.q2ii='B'; } else { p.q1='F'; }
  p.q3=s.age; p.q4=s.edu;
  if(s.study==='none'){p.q4b='A';} else if(s.study==='sec'){p.q4b='B';p.q4c='A';}
  else if(s.study==='s12'){p.q4b='B';p.q4c='B';} else if(s.study==='s3'){p.q4b='B';p.q4c='C';}
  p.q5i='A'; p['q5i-a']=s.l1type;
  ABIL.forEach(a=>p['q5i-b-'+a]=s.l1clb);
  if(s.l2clb==='none'){ p.q5ii='C'; }
  else { p.q5ii='A'; ABIL.forEach(a=>p['q5ii-sol-'+a]=s.l2clb); }
  p.q6i=s.cdnexp; p.q6ii=s.foreign; p.q7=s.cert; p.q9=s.pnp; p.q10i=s.sibling;
  if(s.job==='A'){p.q8='A';} else {p.q8='B'; p.q8a=(s.job==='00'?'A':s.job==='0123'?'B':'C');}
  if(s.spouse){ p.q10=s.spEdu; p.q11=s.spExp;
    if(s.spLang==='none'){p.q12i='F';} else {p.q12i='A'; ABIL.forEach(a=>p['q12ii-fol-'+a]=s.spLang);} }
  return fullProfile(p);
}

/* ============================================================
   FACTOR DEFINITIONS (drive baseline form + vary panel + table)
   ============================================================ */
const FACTORS=[
  {key:'spouse',   name:'Application type',        group:'Core',     opts:[['0','Just me (no spouse)'],['1','With accompanying spouse']], get:s=>s.spouse?'1':'0', set:(s,v)=>s.spouse=(v==='1'), label:v=>v==='1'?'With spouse':'Just me'},
  {key:'age',      name:'Age',                     group:'Core',     opts:AGE_OPTS, get:s=>s.age, set:(s,v)=>s.age=v},
  {key:'edu',      name:'Education level',         group:'Core',     opts:EDU_OPTS, get:s=>s.edu, set:(s,v)=>s.edu=v},
  {key:'l1type',   name:'First language — test',   group:'Language', opts:LANG1TYPE, get:s=>s.l1type, set:(s,v)=>s.l1type=v},
  {key:'l1clb',    name:'First language — CLB',    group:'Language', opts:CLB_OPTS, get:s=>s.l1clb, set:(s,v)=>s.l1clb=v},
  {key:'l2clb',    name:'Second language — CLB',   group:'Language', opts:[['none','None']].concat(CLB_OPTS), get:s=>s.l2clb, set:(s,v)=>s.l2clb=v},
  {key:'cdnexp',   name:'Canadian work experience',group:'Experience',opts:CDNEXP_OPTS, get:s=>s.cdnexp, set:(s,v)=>s.cdnexp=v},
  {key:'foreign',  name:'Foreign work experience', group:'Experience',opts:FOREIGN_OPTS, get:s=>s.foreign, set:(s,v)=>s.foreign=v},
  {key:'study',    name:'Study in Canada',         group:'Additional',opts:STUDY_OPTS, get:s=>s.study, set:(s,v)=>s.study=v},
  {key:'cert',     name:'Certificate of qualification',group:'Additional',opts:YESNO, get:s=>s.cert, set:(s,v)=>s.cert=v},
  {key:'sibling',  name:'Sibling in Canada',       group:'Additional',opts:YESNO, get:s=>s.sibling, set:(s,v)=>s.sibling=v},
  {key:'pnp',      name:'Provincial nomination',   group:'Additional',opts:YESNO, get:s=>s.pnp, set:(s,v)=>s.pnp=v},
  {key:'job',      name:'Job offer (0 pts)',       group:'Additional',opts:JOB_OPTS, get:s=>s.job, set:(s,v)=>s.job=v},
  {key:'spEdu',    name:'Spouse — education',      group:'Spouse',   spouseOnly:true, opts:EDU_OPTS, get:s=>s.spEdu, set:(s,v)=>s.spEdu=v},
  {key:'spLang',   name:'Spouse — language CLB',   group:'Spouse',   spouseOnly:true, opts:[['none','None']].concat(CLB_OPTS), get:s=>s.spLang, set:(s,v)=>s.spLang=v},
  {key:'spExp',    name:'Spouse — Canadian experience',group:'Spouse',spouseOnly:true, opts:CDNEXP_OPTS, get:s=>s.spExp, set:(s,v)=>s.spExp=v}
];
const FMAP={}; FACTORS.forEach(f=>FMAP[f.key]=f);
function optLabel(f,v){ const o=f.opts.find(x=>x[0]===v); return o?o[1]:v; }

/* which factors are varying -> {key:Set(values)} */
const vary={};

/* Spouse fields are relevant whenever ANY scenario in the current setup is
   "with accompanying spouse": either the baseline is with-spouse, or the
   Application type is being varied and includes the "with spouse" value. */
function spouseInPlay(){ return state.spouse || !!(vary['spouse'] && vary['spouse'].has('1')); }

/* ============================================================
   RENDER: baseline form
   ============================================================ */
const baseForm=document.getElementById('baseForm');
function renderForm(){
  baseForm.innerHTML='';
  let curGroup=null;
  FACTORS.forEach(f=>{
    if(f.spouseOnly && !spouseInPlay()) return;
    if(f.group!==curGroup){ curGroup=f.group;
      const gl=document.createElement('div'); gl.className='glabel';
      gl.textContent=(f.group==='Spouse' && !state.spouse) ? 'Spouse (for with-spouse scenarios)' : f.group;
      baseForm.appendChild(gl); }
    const field=document.createElement('div'); field.className='field';
    const lab=document.createElement('label'); lab.textContent=f.name; lab.htmlFor='b_'+f.key;
    const sel=document.createElement('select'); sel.className='ctl'; sel.id='b_'+f.key;
    f.opts.forEach(o=>{ const op=document.createElement('option'); op.value=o[0]; op.textContent=o[1]; sel.appendChild(op); });
    sel.value=f.get(state);
    sel.addEventListener('change',()=>{ f.set(state,sel.value);
      if(f.key==='spouse'){ renderForm(); renderVars(); }
      recompute(); });
    field.appendChild(lab); field.appendChild(sel); baseForm.appendChild(field);
  });
}

/* ============================================================
   RENDER: variable picker
   ============================================================ */
const varList=document.getElementById('varList');
function renderVars(){
  varList.innerHTML='';
  let curGroup=null;
  FACTORS.forEach(f=>{
    if(f.spouseOnly && !spouseInPlay()){ delete vary[f.key]; return; }
    if(f.group!==curGroup){ curGroup=f.group;
      const gl=document.createElement('div'); gl.className='glabel';
      gl.textContent=(f.group==='Spouse' && !state.spouse) ? 'Spouse (for with-spouse scenarios)' : f.group;
      varList.appendChild(gl); }
    const on=!!vary[f.key];
    const box=document.createElement('div'); box.className='var'+(on?' on':'');
    const h=document.createElement('div'); h.className='var-h';
    const sw=document.createElement('label'); sw.className='switch';
    sw.innerHTML='<input type="checkbox" '+(on?'checked':'')+' aria-label="Vary '+f.name+'"><span class="slider"></span>';
    sw.querySelector('input').addEventListener('change',e=>{
      if(e.target.checked){ vary[f.key]=new Set([f.get(state)]); } else { delete vary[f.key]; }
      if(f.key==='spouse') renderForm();
      renderVars(); recompute();
    });
    const nm=document.createElement('div'); nm.className='vname'; nm.textContent=f.name;
    const base=document.createElement('div'); base.className='vbase'; base.textContent=optLabel(f,f.get(state));
    h.appendChild(sw); h.appendChild(nm); h.appendChild(base); box.appendChild(h);
    const body=document.createElement('div'); body.className='var-body';
    if(on){
      const tools=document.createElement('div'); tools.className='var-tools';
      const all=document.createElement('button'); all.textContent='Select all';
      all.onclick=()=>{ vary[f.key]=new Set(f.opts.map(o=>o[0])); if(f.key==='spouse') renderForm(); renderVars(); recompute(); };
      const none=document.createElement('button'); none.textContent='Clear';
      none.onclick=()=>{ vary[f.key]=new Set(); if(f.key==='spouse') renderForm(); renderVars(); recompute(); };
      tools.appendChild(all); tools.appendChild(none); body.appendChild(tools);
      f.opts.forEach(o=>{
        const chip=document.createElement('span');
        const isCLB=/CLB|year|TEER/.test(o[1]);
        chip.className='opt'+(isCLB?' mini':'')+(vary[f.key].has(o[0])?' sel':'');
        chip.textContent=o[1];
        chip.onclick=()=>{ const set=vary[f.key]; if(set.has(o[0]))set.delete(o[0]); else set.add(o[0]); if(f.key==='spouse') renderForm(); renderVars(); recompute(); };
        body.appendChild(chip);
      });
    }
    box.appendChild(body); varList.appendChild(box);
  });
}

/* ============================================================
   COMPUTE + RENDER results
   ============================================================ */
const SUBCOLS=[
  ['core_age','Age'],['core_education','Educ.'],['core_lang_first','Lang 1'],['core_lang_second','Lang 2'],
  ['core_cdn_exp','Cdn exp'],['spouse_subtotal','Spouse'],['st_subtotal','Skill trans.'],['add_subtotal','Additional']
];
let lastRows=[], lastVaryKeys=[], sortState={col:'GRAND_TOTAL',dir:-1};

function cartesian(keys){
  let combos=[{}];
  keys.forEach(k=>{
    const vals=[...vary[k]]; const next=[];
    combos.forEach(c=>vals.forEach(v=>{ const n=Object.assign({},c); n[k]=v; next.push(n); }));
    combos=next;
  });
  return combos;
}

function recompute(){
  const baseProfile=buildProfile(state);
  const baseRes=scoreCRS(baseProfile);
  renderBaseline(baseRes);

  const vkeys=FACTORS.map(f=>f.key).filter(k=>vary[k]&&vary[k].size>0);
  lastVaryKeys=vkeys;
  const combos=cartesian(vkeys);
  const warn=document.getElementById('warnBox');
  const total=combos.length;
  const CAP=4000;
  if(vkeys.some(k=>vary[k].size===0)){}
  const capped = total>CAP;
  const use = capped?combos.slice(0,CAP):combos;
  warn.className='warn'+(capped?' show':'');
  if(capped) warn.textContent='This combination produces '+total.toLocaleString()+' scenarios. Showing the first '+CAP.toLocaleString()+'. Narrow the values you selected (fewer factors, or fewer values each) for a focused comparison.';

  const rows=use.map(combo=>{
    const s=Object.assign({},state);
    Object.keys(combo).forEach(k=>FMAP[k].set(s,combo[k]));
    const res=scoreCRS(buildProfile(s));
    return {combo, res, total:res.GRAND_TOTAL, isBase:vkeys.every(k=>combo[k]===FMAP[k].get(state))};
  });
  lastRows=rows;
  renderTable(rows, vkeys, baseRes);
  renderSummary(rows, baseRes, total, capped);
  document.getElementById('scenCount').textContent = rows.length.toLocaleString()+(capped?' of '+total.toLocaleString():'')+' scenario'+(rows.length===1?'':'s');
  saveState();
}

function renderBaseline(r){
  document.getElementById('baseScore').textContent=r.GRAND_TOTAL;
  document.getElementById('baseBar').style.width=Math.min(100,r.GRAND_TOTAL/1200*100)+'%';
  const rows=[
    ['Core / human capital',r.core_subtotal],
    ['Spouse factors',r.spouse_subtotal],
    ['Skill transferability',r.st_subtotal],
    ['Additional points',r.add_subtotal]
  ];
  const bd=document.getElementById('baseBreak'); bd.innerHTML='';
  rows.forEach(([n,v])=>{ const d=document.createElement('div'); d.className='row';
    d.innerHTML='<span class="nm">'+n+'</span><span class="vl">'+v+'</span>'; bd.appendChild(d); });
  const sum=document.createElement('div'); sum.className='row sum';
  sum.innerHTML='<span class="nm">Total CRS</span><span class="vl" style="color:var(--accent)">'+r.GRAND_TOTAL+'</span>';
  bd.appendChild(sum);
}

function renderSummary(rows, baseRes, total, capped){
  const wrap=document.getElementById('summary');
  const totals=rows.map(r=>r.total);
  const max=Math.max(...totals), min=Math.min(...totals);
  const base=baseRes.GRAND_TOTAL;
  const range=max-min;
  const varNames=lastVaryKeys.map(k=>FMAP[k].name);
  const stats=[
    ['Baseline', base, 'accent', '/ 1200'],
    ['Highest', max, 'gain', (max-base>=0?'+':'')+(max-base)+' vs base'],
    ['Lowest', min, 'loss', (min-base>=0?'+':'')+(min-base)+' vs base'],
    ['Spread', range, '', 'max − min'],
    ['Varying', varNames.length, '', varNames.length? varNames.join(', ').slice(0,42) : 'nothing yet']
  ];
  wrap.innerHTML='';
  stats.forEach(([k,v,cls,s])=>{
    const d=document.createElement('div'); d.className='stat';
    d.innerHTML='<div class="k">'+k+'</div><div class="v '+cls+'">'+(typeof v==='number'?v:v)+'</div><div class="s">'+s+'</div>';
    wrap.appendChild(d);
  });
}

function renderTable(rows, vkeys, baseRes){
  const thead=document.querySelector('#rtable thead');
  const tbody=document.querySelector('#rtable tbody');
  const base=baseRes.GRAND_TOTAL;
  const maxTotal=Math.max(...rows.map(r=>r.total),1);
  const minTotal=Math.min(...rows.map(r=>r.total));

  // header
  const cols=[];
  if(vkeys.length===0) cols.push({id:'__base',label:'Scenario',num:false});
  vkeys.forEach(k=>cols.push({id:'v_'+k,label:FMAP[k].name,num:false,vkey:k}));
  cols.push({id:'GRAND_TOTAL',label:'Total CRS',num:true});
  cols.push({id:'__delta',label:'Δ base',num:true});
  SUBCOLS.forEach(sc=>cols.push({id:sc[0],label:sc[1],num:true,sub:true}));

  thead.innerHTML='';
  const tr=document.createElement('tr');
  cols.forEach(c=>{
    const th=document.createElement('th'); th.className=(c.num?'num ':'')+(sortState.col===c.id?'sorted':'');
    th.innerHTML=c.label+' <span class="arr">'+(sortState.col===c.id?(sortState.dir<0?'▼':'▲'):'▲')+'</span>';
    th.onclick=()=>{ if(sortState.col===c.id) sortState.dir*=-1; else {sortState.col=c.id; sortState.dir=(c.num?-1:1);} renderTable(rows,vkeys,baseRes); };
    tr.appendChild(th);
  });
  thead.appendChild(tr);

  // sort
  const sorted=rows.slice().sort((a,b)=>{
    let av,bv;
    const c=sortState.col;
    if(c==='GRAND_TOTAL'||c==='__delta'){ av=a.total; bv=b.total; }
    else if(c.startsWith('v_')){ const k=c.slice(2); av=optLabel(FMAP[k],a.combo[k]); bv=optLabel(FMAP[k],b.combo[k]); }
    else if(c.startsWith('__')){ av=a.total; bv=b.total; }
    else { av=a.res[c]||0; bv=b.res[c]||0; }
    if(typeof av==='string') return sortState.dir*av.localeCompare(bv);
    return sortState.dir*(av-bv);
  });

  tbody.innerHTML='';
  sorted.forEach(r=>{
    const tr=document.createElement('tr'); if(r.isBase) tr.className='base-row';
    if(vkeys.length===0){ const td=document.createElement('td'); td.innerHTML='Baseline profile'; tr.appendChild(td); }
    vkeys.forEach(k=>{ const td=document.createElement('td');
      td.innerHTML='<span class="valchip">'+optLabel(FMAP[k],r.combo[k])+'</span>'; tr.appendChild(td); });
    // total + bar
    const tdT=document.createElement('td'); tdT.className='num';
    const w=Math.round((r.total-Math.min(minTotal,0))/(maxTotal-Math.min(minTotal,0)||1)*70)+8;
    tdT.innerHTML='<span class="tbar'+(r.total===0?' b0':'')+'" style="width:'+w+'px"></span> <span class="total-cell">'+r.total+'</span>'+(r.isBase?'<span class="tag-base">BASE</span>':'');
    tr.appendChild(tdT);
    // delta
    const d=r.total-base; const tdD=document.createElement('td'); tdD.className='num';
    tdD.innerHTML='<span class="delta '+(d>0?'pos':d<0?'neg':'zero')+'">'+(d>0?'+':'')+d+'</span>';
    tr.appendChild(tdD);
    SUBCOLS.forEach(sc=>{ const td=document.createElement('td'); td.className='num'; td.textContent=r.res[sc[0]]||0; tr.appendChild(td); });
    tbody.appendChild(tr);
  });
}

/* ---- CSV export ---- */
function toCSV(){
  const vkeys=lastVaryKeys;
  const head=['scenario_index'].concat(vkeys.map(k=>FMAP[k].name))
    .concat(['total_crs','delta_vs_baseline'])
    .concat(SUBCOLS.map(s=>s[1]))
    .concat(['core_subtotal']);
  const base=scoreCRS(buildProfile(state)).GRAND_TOTAL;
  const lines=[head.join(',')];
  lastRows.forEach((r,i)=>{
    const cells=[i+1].concat(vkeys.map(k=>'"'+optLabel(FMAP[k],r.combo[k]).replace(/"/g,'""')+'"'))
      .concat([r.total, r.total-base])
      .concat(SUBCOLS.map(s=>r.res[s[0]]||0))
      .concat([r.res.core_subtotal]);
    lines.push(cells.join(','));
  });
  return lines.join('\n');
}
document.getElementById('csvBtn').onclick=()=>{
  const csv=toCSV();
  const ov=document.getElementById('csvOverlay');
  document.getElementById('csvText').value=csv;
  ov.hidden=false;
  const ta=document.getElementById('csvText'); ta.focus(); ta.select();
};
document.getElementById('csvClose').onclick=()=>{document.getElementById('csvOverlay').hidden=true;};
document.getElementById('csvOverlay').addEventListener('click',e=>{ if(e.target.id==='csvOverlay') e.currentTarget.hidden=true; });
document.getElementById('csvCopy').onclick=async()=>{
  const btn=document.getElementById('csvCopy'); const t=document.getElementById('csvText').value;
  try{ await navigator.clipboard.writeText(t); btn.textContent='Copied ✓'; }
  catch(e){ document.getElementById('csvText').select(); document.execCommand&&document.execCommand('copy'); btn.textContent='Copied ✓'; }
  setTimeout(()=>btn.textContent='Copy to clipboard',1400);
};

/* ---- reset ---- */
document.getElementById('clearVars').onclick=()=>{ Object.keys(vary).forEach(k=>delete vary[k]); renderVars(); recompute(); };

/* ---- theme toggle ---- */
const root=document.documentElement;
document.getElementById('themeBtn').onclick=()=>{
  const cur=root.getAttribute('data-theme');
  const sysDark=window.matchMedia('(prefers-color-scheme:dark)').matches;
  const next = cur ? (cur==='dark'?'light':'dark') : (sysDark?'light':'dark');
  root.setAttribute('data-theme',next);
  try{localStorage.setItem('crs_theme',next);}catch(e){}
};
try{const t=localStorage.getItem('crs_theme'); if(t)root.setAttribute('data-theme',t);}catch(e){}

/* ---- persist config (per-viewer convenience) ---- */
function saveState(){ try{ localStorage.setItem('crs_state',JSON.stringify(state));
  localStorage.setItem('crs_vary',JSON.stringify(Object.fromEntries(Object.entries(vary).map(([k,v])=>[k,[...v]])))); }catch(e){} }
function loadState(){
  try{
    const s=JSON.parse(localStorage.getItem('crs_state')||'null'); if(s)Object.assign(state,s);
    const v=JSON.parse(localStorage.getItem('crs_vary')||'null');
    if(v)Object.keys(v).forEach(k=>{ if(FMAP[k]) vary[k]=new Set(v[k]); });
  }catch(e){}
}

/* ---- reference tables ---- */
function buildRef(){
  const grid=document.getElementById('refGrid');
  const tbl=(title,head,rows)=>{
    let h='<div class="ref-card"><h3>'+title+'</h3><table><thead><tr>'+head.map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>';
    rows.forEach(r=>{ h+='<tr>'+r.map((c,i)=>'<td'+(i?' style="text-align:right;font-family:var(--mono)"':'')+'>'+c+'</td>').join('')+'</tr>'; });
    return h+'</tbody></table></div>';
  };
  // all values derived from RULES so the reference auto-updates with the rules file
  const A=RULES.age, E=RULES.education, F1=RULES.first_official_language_per_ability, CW=RULES.canadian_work_experience, AD=RULES.additional, SB=RULES.study_bonus;
  const ns=(t,k)=>t[k][1], sp=(t,k)=>t[k][0];
  let out='';
  out+=tbl('Age (points)',['Age','No spouse','With spouse'],[['20–29',ns(A,'D'),sp(A,'D')],['30',ns(A,'N'),sp(A,'N')],['33',ns(A,'Q'),sp(A,'Q')],['35',ns(A,'S'),sp(A,'S')],['40',ns(A,'X'),sp(A,'X')],['44',ns(A,'AB'),sp(A,'AB')],['45+',ns(A,'AC'),sp(A,'AC')]]);
  out+=tbl('Education (points)',['Level','No spouse','With spouse'],EDU_OPTS.map(o=>[o[1],ns(E,o[0]),sp(E,o[0])]));
  out+=tbl('First language — per ability',['CLB','No spouse','With spouse'],CLB_OPTS.filter(o=>o[0]!=='A').map(o=>[o[1],ns(F1,o[0]),sp(F1,o[0])]));
  out+=tbl('Canadian work experience',['Years','No spouse','With spouse'],['B','C','D','E','F'].map(k=>[CDNEXP_OPTS.find(o=>o[0]===k)[1],ns(CW,k),sp(CW,k)]));
  out+=tbl('Skill transferability (max '+RULES.caps.skill_transferability_total+')',['Bucket','Max'],[['Education × language',50],['Education × Cdn exp',50],['Foreign exp × language',50],['Foreign × Cdn exp',50],['Certificate × language',50]]);
  out+=tbl('Spouse factors (max 40)',['Factor','Max'],[['Education',10],['Language ('+RULES.caps.spouse_language_total+' max)',RULES.caps.spouse_language_total],['Canadian experience',10]]);
  out+=tbl('Additional points',['Factor','Points'],[['Provincial nomination',AD.provincial_nomination],['Study in Canada 3yr+',SB.three_year_plus],['Study 1–2 yr',SB.one_or_two_year],['French bonus',AD.french_only+' / '+AD.french_with_english_clb5],['Sibling in Canada',AD.sibling_in_canada],['Job offer',AD.job_offer]]);
  grid.innerHTML=out;
}

/* ---- boot ---- */
loadState();
if(Object.keys(vary).length===0){ vary['age']=new Set(['L','M','N','O','P']); } // opens with Age 28–32 comparison
renderForm(); renderVars(); buildRef(); recompute();