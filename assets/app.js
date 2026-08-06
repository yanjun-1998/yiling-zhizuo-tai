/* 亿领教育自用 AI 工作台 · 渲染层（架构：1 入口 + 3 模块 + 1 中台）
   把前面所有讨论（7本手册 + 战略决策 + 每日热点 + 八字 + 合规）全部接成一个能干活的工具。 */
(function(){
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s==null?'':s).replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

const CORE = window.CORE, DATA_A = window.DATA_A, TPL = window.TPL;
let TODAY = window.TODAY_FEED || window.TODAY, S = window.STRATEGY;
const POL = window.DATA_POLITICS, EDU = window.DATA_EDUPLAN, LIVE = window.LIVE;
let HOT = window.HOT || {events:[]};
let MY = window.MY_HOT || {events:[]};            // 云端共享库（对话同步写入）
let LM = [];                                       // 本机手动热点（localStorage）
const LM_KEY = 'wb_my_events';
function loadLocalMy(){ try{ const r=localStorage.getItem(LM_KEY); LM = r?JSON.parse(r):[]; if(!Array.isArray(LM)) LM=[]; }catch(e){ LM=[]; } }
function saveLocalMy(){ try{ localStorage.setItem(LM_KEY, JSON.stringify(LM)); }catch(e){} }

/* 太原/山西 教育情报站：学校与教研中心动态（window.SCHOOL，每日自动化更新 + 手动添加） */
let SCHOOL = window.SCHOOL || {items:[]};
let SCL_SHARE = window.SCHOOL_SHARE || {items:[]};   // 云端共享库（对话同步写入）
let SCLM = [];                                        // 本机手动学校动态（localStorage）
const SCL_KEY = 'wb_my_school';
function loadLocalSchool(){ try{ const r=localStorage.getItem(SCL_KEY); SCLM=r?JSON.parse(r):[]; if(!Array.isArray(SCLM)) SCLM=[]; }catch(e){ SCLM=[]; } }
function saveLocalSchool(){ try{ localStorage.setItem(SCL_KEY, JSON.stringify(SCLM)); }catch(e){} }
let SCLALL=[];
function rebuildSchool(){ SCLALL=(SCHOOL.items||[]).map(function(e){return Object.assign({},e,{_src:'auto'});}).concat((SCL_SHARE.items||[]).map(function(e){return Object.assign({},e,{_src:'share'});})).concat(SCLM.map(function(e){return Object.assign({},e,{_src:'mine'});})); }
function allSchool(){ return SCLALL; }

/* 合并全部热点：自动时事 + 云端共享库 + 本机手动（索引用于生成函数） */
let ALL = [];
function rebuildAll(){
  ALL = (HOT.events||[]).map(function(e){ return Object.assign({},e,{_src:'auto'}); })
    .concat((MY.events||[]).map(function(e){ return Object.assign({},e,{_src:'share'}); }))
    .concat(LM.map(function(e){ return Object.assign({},e,{_src:'mine'}); }));
}
function allEvents(){ return ALL; }

/* ---------- 工具 ---------- */
const TplMap = {};
window.TMAP = {};
window.TIER1MAP = {};
let toastTimer;
function toast(m){ const el=$('#toast'); if(!el) return; el.textContent=m; el.classList.add('on'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('on'),1800); }
function copy(t){
  if(!t) return;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(t).then(()=>toast('已复制')).catch(()=>fbCopy(t));
  } else fbCopy(t);
}
function fbCopy(t){
  const ta=document.createElement('textarea'); ta.value=t; document.body.appendChild(ta); ta.select();
  try{document.execCommand('copy'); toast('已复制');}catch(e){toast('复制失败，请手动选');}
  document.body.removeChild(ta);
}
function download(t,name){
  const blob=new Blob([t],{type:'text/plain;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name||'script.txt'; a.click();
  URL.revokeObjectURL(a.href); toast('已下载');
}
function switchTab(v){
  $$('.tab').forEach(t=>t.classList.toggle('on', t.dataset.v===v));
  $$('.view').forEach(s=>s.classList.toggle('on', s.id===v));
  window.scrollTo(0,0);
}

/* ---------- 身份 / 脚本生成引擎 ---------- */
function intro(zone){
  if(zone==='A') return '我是老闫，在太原教了10年初高中物理，专治"听懂了不会做"。';
  return '我是张姐，在太原做教育咨询第5年，晋源区亿领教育主理人。';
}
function genTopic(t, zone){
  const me = zone==='A'
    ? '我是老闫，在太原教了10年初高中物理，专治"听懂了不会做"。'
    : '我是张姐，在太原做教育咨询第5年，晋源区亿领教育主理人。';
  const nm = zone==='A' ? '老闫' : '张姐';
  const cta = '评论区扣「'+t.ck+'」，我把对应资料包发你。有具体问题直接喊"'+nm+'救我"。';
  const ang = t.angle || '';
  const body = t.body || '';
  let s='';
  s+='【标题】'+t.title+'\n';
  s+='【账号/形式】'+(zone==='A'?'老闫物理（A区）':'张姐规划（B区）')+'　|　'+t.fmt+'　|　'+t.dur+'　|　不露脸（手/板书/屏幕共享）\n\n';
  s+='— 口播稿（照读即可，已把热点揉成一段）—\n\n';
  const hk = t.hook || '';
  const hkTail = ang ? ('今天我专门从「'+ang+'」这个角度，给你讲明白。') : '今天一条视频讲清楚。';
  const hkSep = /[。！？.!?]$/.test(hk) ? '' : '，';
  s+= hk + hkSep + hkTail + '\n\n';
  s+= me + '\n\n';
  s+= '先说结论：' + body + (ang ? (' 我为什么强调「'+ang+'」？因为这才是大多数家长最容易忽略、也最吃亏的地方。') : '') + '\n\n';
  if(t.depth){ s+= '为什么是这样——' + t.depth + '\n\n'; }
  if(t.solution){
    const lead = zone==='A'
      ? '老闫带你捋一下，落到具体操作，能直接抄的动作就这几步——'
      : '张姐给你拆解到位，现在能落地的动作就这几个——';
    s+= lead + '\n';
    s+= t.solution + '\n\n';
    s+= '别光听个热闹，照着做就比干等强。\n\n';
    s+= '【结尾引导】' + cta + '\n';
  } else {
    s+= '具体怎么结合你家情况落地，' + (t.ck ? ('评论区扣「'+t.ck+'」') : '评论区聊聊') + '，我挨个帮你捋——别光焦虑，动作要具体。\n\n';
    s+= '【结尾引导】' + cta + '\n';
  }
  if(t.src) s+='【参考】'+t.src+'（数据以官方公告为准）\n';
  return s;
}
function genToday(r, i){
  const zone=r.zone;
  const me = zone==='A'
    ? '我是老闫，在太原教了10年初高中物理，专治"听懂了不会做"。'
    : '我是张姐，在太原做教育咨询第5年，晋源区亿领教育主理人。';
  const nm = zone==='A' ? '老闫' : '张姐';
  const cta = '评论区扣「'+r.ck+'」，我把对应资料包发你。有具体问题直接喊"'+nm+'救我"。';
  let s='';
  s+='【今日行动 #'+(i+1)+' · 优先级 '+r.pri+' · '+(zone==='A'?'老闫物理 A':'张姐规划 B')+'】\n';
  s+='【账号/形式】'+(zone==='A'?'老闫物理（A区）':'张姐规划（B区）')+'　|　'+r.fmt+'　|　'+r.dur+'　|　不露脸\n\n';
  s+='— 口播稿（照读即可）—\n\n';
  const tk = r.hook || '';
  const tw = r.why || '时效性强、现在发最容易爆';
  const tkSep = /[。！？.!?]$/.test(tk) ? '' : '，';
  const twTail = /[。！？.!?]$/.test(tw) ? '' : '。';
  s+= tk + tkSep + '今天这条我建议必须发——因为' + tw + twTail + '\n\n';
  s+= me + '\n\n';
  s+= '讲什么我给你捋好了：' + (r.body||'') + '\n\n';
  if(r.depth){ s+= '为什么值得你今天动——' + r.depth + '\n\n'; }
  if(r.solution){
    const lead = zone==='A'
      ? '老闫给你捋清楚，落到具体操作，能直接抄的动作就这几步——'
      : '张姐给你拆解到位，现在能落地的动作就这几个——';
    s+= lead + '\n' + r.solution + '\n\n';
    s+= '别光听个热闹，照着做就比干等强。\n\n';
  }
  s+= '【结尾引导】' + cta + '\n';
  return s;
}

/* 模板表单（content5 / TPL 共用） */
function regTpl(key, item){
  const fields = item.fields || item.f;
  const tpl = item.tpl || item.t;
  TplMap[key] = { fields, tpl, zone: item.zone };
  return '<div class="card" id="card-'+key+'">'
    + '<div class="ct">'+esc(item.cat||item.n)+'</div>'
    + '<div class="cb"><p class="muted">'+esc(item.desc||'')+'</p><div class="form">'
    + fields.map(f=>'<label>'+esc(f.l)+'<input data-k="'+esc(f.k)+'" placeholder="'+esc(f.p||'')+'"></label>').join('')
    + '</div><div class="row">'
    + '<button class="btn" onclick="genForm(\''+key+'\')">⚡ 生成口播稿</button>'
    + '<button class="btn s o" onclick="fillDemo(\''+key+'\')">填入示例</button>'
    + '</div>'
    + '<textarea class="out" readonly placeholder="点「生成口播稿」后，成稿出现在这里"></textarea>'
    + '<div class="row"><button class="btn s" onclick="copy(this.parentNode.previousElementSibling.value)">复制</button>'
    + '<button class="btn s" onclick="download(this.parentNode.previousElementSibling.value,\''+key+'.txt\')">下载 txt</button></div>'
    + '</div></div>';
}
function fillDemo(key){
  const m=TplMap[key]; const root=document.getElementById('card-'+key); if(!root) return;
  m.fields.forEach(f=>{ const el=root.querySelector('input[data-k="'+f.k+'"]'); if(el) el.value=f.p||''; });
  toast('已填入示例，点生成');
}
function genForm(key){
  const m=TplMap[key]; const root=document.getElementById('card-'+key); if(!root) return;
  const vals={};
  m.fields.forEach(f=>{ const el=root.querySelector('input[data-k="'+f.k+'"]'); vals[f.k]=(el&&el.value.trim())?el.value.trim():(f.p||''); });
  const out=m.tpl.replace(/\{\{(\w+)\}\}/g, (mm,k)=> vals[k]!==undefined?vals[k]:mm);
  root.querySelector('.out').value=out; toast('已生成，可复制');
}

/* 出稿：自动收进「📋 成稿」箱，按类型分好、不覆盖、不跳页 */
function autoTitle(text){
  const lines=(text||'').split('\n').map(function(l){return l.trim();}).filter(Boolean);
  let first=lines[0]||'成稿';
  first=first.replace(/^【.*?】\s*/,'').replace(/[#*]/g,'').trim();
  return first.length>16?first.slice(0,16)+'…':first;
}
function showOut(text){
  if(!text) return;
  pushDraft(autoTitle(text), text, '短视频');
  openDraftPanel();
  wbToast('已生成 · 已收进右下角「📋 成稿」箱');
}

/* ===== 成稿箱（全局累积，不覆盖，本地持久化） ===== */
const DRAFT_KEY='wb_drafts_v1';
let DRAFTS=[];
function loadDrafts(){ try{ const r=localStorage.getItem(DRAFT_KEY); DRAFTS=r?JSON.parse(r):[]; if(!Array.isArray(DRAFTS)) DRAFTS=[]; }catch(e){ DRAFTS=[]; } }
function saveDrafts(){ try{ localStorage.setItem(DRAFT_KEY, JSON.stringify(DRAFTS)); }catch(e){} }
function draftTagClass(t){ return ({'短视频':'dt-s','直播':'dt-l','直播物料':'dt-m','清单':'dt-c','复盘':'dt-r','合并':'dt-m'})[t]||'dt-s'; }
function draftHTML(){
  if(!DRAFTS.length) return '<p class="muted" style="padding:18px;text-align:center">还没有成稿。点任意「⚡ 出稿」按钮，内容会自动收进这里，按类型分好、不覆盖。</p>';
  return DRAFTS.slice().reverse().map(function(d){
    const fn=esc(d.title).replace(/["']/g,'');
    return '<div class="draft-item"><div class="draft-top"><span class="draft-tag '+draftTagClass(d.tag)+'">'+esc(d.tag)+'</span>'
      +'<span class="draft-title">'+esc(d.title)+'</span><span class="draft-time">'+esc(d.t)+'</span></div>'
      +'<textarea class="draft-text" readonly>'+esc(d.text)+'</textarea>'
      +'<div class="row"><button class="btn s" onclick="copy(this.parentNode.previousElementSibling.value)">复制</button>'
      +'<button class="btn s" onclick="download(this.parentNode.previousElementSibling.value,\''+fn+'.txt\')">下载</button>'
      +'<button class="btn s x" onclick="delDraft(\''+esc(d.id)+'\')">删除</button></div></div>';
  }).join('');
}
function renderDraftList(){
  const html=draftHTML();
  ['draftList','factory-drafts'].forEach(function(id){ const el=document.getElementById(id); if(el) el.innerHTML=html; });
}
function updateDraftBadge(){ const b=document.getElementById('draftCount'); if(b) b.textContent=DRAFTS.length; }
function openDraftPanel(){ const p=document.getElementById('draftPanel'); if(p) p.classList.remove('hide'); renderDraftList(); }
function closeDraftPanel(){ const p=document.getElementById('draftPanel'); if(p) p.classList.add('hide'); }
function pushDraft(title, text, tag){
  text=(text||'').replace(/\r\n/g,'\n');
  DRAFTS.push({id:Date.now()+'-'+Math.floor(Math.random()*1000), title:title||'未命名成稿', text:text, tag:tag||'短视频', t:new Date().toLocaleString('zh-CN',{hour12:false})});
  if(DRAFTS.length>60) DRAFTS=DRAFTS.slice(-60);
  saveDrafts(); renderDraftList(); updateDraftBadge();
}
function delDraft(id){ DRAFTS=DRAFTS.filter(function(d){return d.id!==id;}); saveDrafts(); renderDraftList(); updateDraftBadge(); }
function clearDrafts(){ if(!DRAFTS.length){ wbToast('成稿箱是空的'); return; } DRAFTS=[]; saveDrafts(); renderDraftList(); updateDraftBadge(); wbToast('已清空'); }
function mergeDrafts(){
  if(DRAFTS.length<2){ wbToast('至少2篇才能合并'); return; }
  const parts=DRAFTS.slice().reverse().map(function(d){ return '【'+d.tag+'】'+d.title+'\n'+d.text; });
  const combined='（以下为'+DRAFTS.length+'篇合并，可整体照读，也可按「────」拆回多条）\n\n'+parts.join('\n\n──────────\n\n');
  pushDraft('合并稿（'+DRAFTS.length+'篇）', combined, '合并');
  wbToast('已合并成1篇，在成稿箱最上面');
}
function showLive(text, title, tag){
  const box=document.getElementById('live-out');
  if(box){
    const fn=esc(title).replace(/["']/g,'');
    const card='<div class="card live-card"><div class="ct">'+esc(title)+'</div><div class="cb"><textarea class="outbig" readonly>'+esc(text)+'</textarea>'
      +'<div class="row"><button class="btn" onclick="copy(this.parentNode.previousElementSibling.value)">复制</button>'
      +'<button class="btn s" onclick="download(this.parentNode.previousElementSibling.value,\''+fn+'.txt\')">下载</button></div></div>';
    box.innerHTML=card+box.innerHTML;
    if(box.scrollIntoView) box.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  pushDraft(title, text, tag||'直播');
}

/* ===== 首页 · 今日行动台 ===== */
function renderHome(){
  const PRI={P0:3,P1:2,P2:1};
  const recs=(TODAY.recs||[]).slice().sort((a,b)=>PRI[b.pri]-PRI[a.pri]);
  let h='<div class="banner"><b>今日策略（'+esc(TODAY.date)+'）</b><br>'+esc(TODAY.strategy)+'</div>';
  h += hotZoneHTML('AB');
  h += renderTier1();
  h += schoolZoneHTML('AB', true);
  h+='<h2 class="sec">今日行动 · 按优先级排好，点 ⚡ 直接出稿</h2><div class="grid g2">';
  recs.forEach((r,i)=>{
    const zn = r.zone==='A'?'A':'B';
    const zc = r.zone==='A'?'badge a':'badge b';
    const pc = r.pri==='P0'?'p0':(r.pri==='P1'?'p1':'p2');
    h+='<div class="card act"><div class="arow"><span class="'+zc+'">'+(r.zone==='A'?'老闫物理':'张姐规划')+'</span>'
      +'<span class="pri '+pc+'">'+r.pri+'</span></div>'
      +'<div class="at">'+esc(r.title)+'</div>'
      +'<div class="aw"><b>为什么今天发：</b>'+esc(r.why)+'</div>'
      +'<div class="row"><button class="btn" onclick="showOut(genToday(TODAY.recs['+TODAY.recs.indexOf(r)+'],'+TODAY.recs.indexOf(r)+'))">⚡ 一键出稿</button>'+favBtn('home','rec_'+TODAY.recs.indexOf(r), r.title)+'</div></div>';
  });
  h+='</div>';

  h+='<h2 class="sec">今日 SOP 时间表</h2><div class="card"><ul class="sop">';
  CORE.sop.daily.forEach(x=>h+='<li><span class="tm">'+esc(x.t)+'</span><span>'+esc(x.a)+'</span></li>');
  h+='</ul></div>';

  h+='<h2 class="sec">双号人设速览（完整版在公共中台）</h2><div class="grid g2">';
  CORE.personas.forEach(p=>{
    h+='<div class="pcard"><div class="phead"><h3>'+esc(p.name)+'</h3><span>'+esc(p.tag)+' · '+esc(p.owner)+'</span></div><div class="pbody">'
      +'<div class="kv"><b>定位</b><span>'+esc(p.formula)+'</span></div>'
      +'<div class="kv"><b>状态</b><span>'+esc(p.status)+'</span></div>'
      +'<div class="kv"><b>受众</b><span>'+esc(p.audience)+'</span></div>'
      +'<div style="margin-top:10px;font-size:13px;color:var(--ink3)">简介备选（点复制）</div>';
    p.bio.forEach(b=>{ h+='<div class="bio"><div class="bt">'+esc(b.v)+' <button class="btn s o" style="float:right" onclick="copy(this.parentNode.nextElementSibling.textContent)">复制</button></div><div>'+esc(b.text).replace(/\n/g,'<br>')+'</div></div>'; });
    h+='</div></div>';
  });
  h+='</div>';
  $('#home').innerHTML=h;
}

/* ===== 第一梯队校动态（需求1：分班考/军训/月考/难度/进度 + depth + solution） ===== */
function tier1Resolve(){
  const head = (window.TIER1 && TIER1.headline) || [];
  const set = head.map(h=>Object.assign({}, h, {_head:true}));
  const schools = (window.SCHOOLS && SCHOOLS.schools) || [];
  const headNames = head.map(h=>h.school);
  const g = (window.TIER1 && TIER1.generic) || {};
  schools.forEach(function(s){
    if(s.tier!=='一类重点' && s.tier!=='民办优质') return;
    if(headNames.indexOf(s.name)>=0) return;
    const mil = (s.campuses&&s.campuses[0]&&s.campuses[0].military) || (s.placement&&s.placement.military) || '';
    const plc = s.placement || {};
    const seg = segOf(s);
    set.push({
      school:s.name, short:s.short||s.name, district:s.district||'', seg:seg, tier:s.tier,
      placement:{ time:plc.time||'以学校官方通知为准', src:plc.src||'学校通知' },
      military:{ time:mil||'以学校官方通知为准', src:'学校通知' },
      monthly:g.monthly, difficulty:g.difficulty, progress:g.progress,
      depth: seg==='high' ? g.depthHigh : g.depthJunior,
      solution: seg==='high' ? g.solutionHigh : g.solutionJunior
    });
  });
  set.sort(function(a,b){ if(a._head!==b._head) return a._head?-1:1; const r={'一类重点':0,'民办优质':1}; return (r[a.tier]||9)-(r[b.tier]||9); });
  return set;
}
function genTier1(d, zone){
  zone = zone || 'B';
  const nm = zone==='A'?'老闫':'张姐';
  const me = zone==='A' ? '我是老闫，在太原教了10年初高中物理，专治"听懂了不会做"。' : '我是张姐，在太原做教育咨询第5年，晋源区亿领教育主理人。';
  const cta = '评论区扣「'+(zone==='A'?'分班考':'一类校')+'」，我把这类校的备考节奏表发你。有具体问题直接喊"'+nm+'救我"。';
  const L=d.placement||{}, M=d.military||{}, Mo=d.monthly||{}, Di=d.difficulty||{}, Pr=d.progress||{};
  let s='';
  s+='【第一梯队校动态 · '+(d.short||d.school)+'（'+(d.district||'')+'·'+(d.tier||'')+'）】\n';
  s+='【账号/形式】'+(zone==='A'?'老闫物理（A区）':'张姐规划（B区）')+'　|　图文轮播　|　60s　|　不露脸\n\n';
  s+='— 口播稿（照读即可）—\n\n';
  s+= '太原家长最关心的「'+(d.short||d.school)+'」几个关键节点，我今天一次给你说清——\n\n';
  s+= me + '\n\n';
  s+= '① 分班考/摸底考时间：'+(L.time||'以学校官方通知为准')+'\n';
  s+= '② 军训时间：'+(M.time||'以学校官方通知为准')+'\n';
  s+= '③ 月考节奏：'+(Mo.schedule||'每月一次月考，以年级组通知为准')+'\n';
  s+= '④ 试卷难度特点：'+(Di.desc||'一类校梯度高、含拓展题')+'\n';
  s+= '⑤ 教学进度：'+(Pr.desc||'进度快于区平均')+'\n\n';
  if(d.depth){ s+= '为什么值得你今天关注——'+d.depth+'\n\n'; }
  if(d.solution){
    s+= (zone==='A'?'老闫给你捋清楚，落到具体操作，能直接抄的动作就这几步——':'张姐给你拆解到位，现在能落地的动作就这几个——')+'\n';
    s+= d.solution+'\n\n';
    s+= '别光听个热闹，照着做就比干等强。\n\n';
  }
  s+= '【结尾引导】'+cta+'\n';
  if(L.src||M.src) s+='【参考】'+(L.src||'')+(M.src?('；'+M.src):'')+'（数据以官方公告为准）\n';
  return s;
}
function renderTier1(){
  const list = tier1Resolve();
  if(!list.length) return '';
  let h='<div class="scl-group"><div class="scl-gtitle">🔥 第一梯队校动态（分班考 / 军训 / 月考 / 难度 / 进度） <span class="muted" style="font-size:12px">('+list.length+'所·难度仅定性·数据以官方为准)</span></div><div class="grid g2">';
  list.forEach(function(d,i){
    const key='t1_'+i; TIER1MAP[key]=d;
    h+='<div class="card hot"><div class="arow"><span class="badge t1">'+esc(d.tier||'一类重点')+'</span><span class="badge '+(d.seg==='high'?'zoneA':'zoneB')+'">'+(d.seg==='high'?'高中':'初中')+'</span>'+(d._head?'<span class="badge mine">头条</span>':'')+'</div>'
      +'<div class="at">【'+esc(d.short||d.school)+'】'+esc(d.district||'')+'</div>'
      +'<div class="aw"><b>分班考/摸底考：</b>'+esc((d.placement&&d.placement.time)||'以官方为准')+'</div>'
      +'<div class="aw"><b>军训：</b>'+esc((d.military&&d.military.time)||'以官方为准')+'</div>'
      +'<div class="aw"><b>月考/难度/进度：</b>'+esc((d.monthly&&d.monthly.schedule)||'')+'；'+esc((d.difficulty&&d.difficulty.desc)||'')+'</div>'
      +(d.depth?'<div class="muted" style="font-size:13px;margin-top:4px">🔍 '+esc(d.depth)+'</div>':'')
      +(d.solution?'<div class="muted" style="font-size:13px;margin-top:4px">📌 可落地：'+esc(d.solution.replace(/\n/g,'　'))+'</div>':'')
      +'<div class="row"><button class="btn s" onclick="showOut(genTier1(TIER1MAP[\''+key+'\'],\'B\'))">⚡ 张姐出稿</button><button class="btn s o" onclick="showOut(genTier1(TIER1MAP[\''+key+'\'],\'A\'))">⚡ 老闫出稿</button>'+favBtn('tier1', key, d.short||d.school)+'</div></div>';
  });
  h+='</div></div>';
  return h;
}

/* ===== A区 · 物理中心 ===== */
function renderZoneA(){
  let h='<div class="banner"><b>物理中心 · 老闫主用</b><br>初高中物理（高中主打）｜不露脸内容生产 + 选题 + 脚本 + 本地题库占位。定位公式：'+esc(CORE.personas[0].formula)+'</div>';
  h += hotZoneHTML('A');

  h+=fmHTML('A');

  h+='<h2 class="sec">物理选题库（6 大板块 · 点 ⚡ 出稿）</h2>';
  const secs=[...new Set(DATA_A.topics.map(t=>t.sec))];
  let zi=0;
  secs.forEach(sec=>{
    h+='<h3 class="sub">'+esc(sec)+'</h3><div class="grid g2">';
    DATA_A.topics.filter(t=>t.sec===sec).forEach(t=>{
      const key='za_'+(zi++); TMAP[key]=t;
      h+='<div class="card"><div class="at">'+esc(t.title)+' <span class="lv">'+esc(t.lv)+'</span></div>'
        +'<div class="aw">'+esc(t.hook)+'</div>'
        +'<div class="muted" style="font-size:13px">内容：'+esc(t.body)+'</div>'
        +'<div class="row"><button class="btn s" onclick="showOut(genTopic(TMAP[\''+key+'\'],\'A\'))">⚡ 出稿</button>'
        + favBtn('zoneA', key, t.title)
        +'<span class="tag">'+esc(t.fmt)+' · '+esc(t.dur)+'</span></div></div>';
    });
    h+='</div>';
  });

  h+='<h2 class="sec">物理 5 类脚本生成矩阵（填空即出稿）</h2><div class="grid g2">';
  (DATA_A.content5||[]).forEach((it,i)=>{ h+=regTpl('p5_'+i, it); });
  h+='</div>';

  h+='<h2 class="sec">不露脸拍摄方案（不辞职也能拍）</h2><div class="grid g2">';
  DATA_A.faceless.forEach(f=>{
    h+='<div class="card"><div class="ct">'+esc(f.n)+'</div><div class="cb">'
      +'<div class="kv"><b>设备</b><span>'+esc(f.gear)+'</span></div>'
      +'<div class="kv"><b>怎么做</b><span>'+esc(f.how)+'</span></div>'
      +'<div class="kv"><b>优点</b><span>'+esc(f.pro)+'</span></div>'
      +'<div class="kv"><b>注意</b><span>'+esc(f.tip)+'</span></div></div></div>';
  });
  h+='</div>';
  $('#zoneA').innerHTML=h;
}

/* ===== 选题万能公式生成器（手册5/6核心） ===== */
function fmHTML(zone){
  let inp='<div class="grid g2">';
  M.formula.inputs.forEach(f=>{ inp+='<label class="fld"><span>'+esc(f.label)+'</span><input data-k="'+f.k+'" placeholder="'+esc(f.ph)+'"></label>'; });
  inp+='</div>';
  return '<div class="card" id="fm-'+zone+'"><div class="ct">选题万能公式生成器 · 输入即出标题</div><div class="cb">'+inp
    +'<div class="row"><button class="btn" onclick="genFormula(\''+zone+'\')">⚡ 生成5个选题标题+钩子</button>'
    +'<button class="btn s o" onclick="showOut(document.getElementById(\'fm-out-'+zone+'\').value)">送脚本工厂</button></div>'
    +'<textarea id="fm-out-'+zone+'" class="out" readonly placeholder="生成后这里出现5个标题+开头钩子"></textarea></div></div>';
}
function genFormula(zone){
  const root=document.getElementById('fm-'+zone); if(!root) return;
  const v={}; M.formula.inputs.forEach(f=>{ const el=root.querySelector('[data-k="'+f.k+'"]'); v[f.k]=(el&&el.value.trim())?el.value.trim():''; });
  let out='';
  M.formula.rules.forEach(r=>{ const fill=s=>s.replace(/\{\{(\w+)\}\}/g,(m,k)=> v[k]||'（'+k+'）'); out+='【'+r.n+'】\n标题：'+fill(r.title)+'\n开头钩子：'+fill(r.hook)+'\n\n'; });
  document.getElementById('fm-out-'+zone).value=out.trim(); toast('已生成5个选题');
}

/* ===== 方法论工具箱（手册1/2/4/5/6 工具化） ===== */
function methodsBoxHTML(){
  let h='<div class="banner" style="background:#eef3ff"><b>方法论工具箱 · 来自7本运营手册</b><br>把手册里的"公式 / 铁律 / SOP"做成可直接用的小工具。</div>';

  h+='<h2 class="sec">① 敏感词自检（粘贴文案自动标红）</h2><div class="card"><div class="cb">'
    +'<textarea id="sc-input" class="out" placeholder="把要发的文案粘贴到这里，点检查..."></textarea>'
    +'<div class="row"><button class="btn" onclick="checkSensitive()">检查敏感词</button></div>'
    +'<div id="sc-out" class="sc-out"></div></div></div>';

  h+='<h2 class="sec">② 三收三不收 · 收生判定（手册1）</h2><div class="card" id="admit-box"><div class="cb"><div class="grid g2">'
    +M.admit.inputs.map(x=>'<label class="fld"><span>'+esc(x.label)+'</span><select data-k="'+x.k+'"><option value="yes">'+esc(x.yes)+'</option><option value="no">'+esc(x.no)+'</option></select></label>').join('')
    +'</div><div class="row"><button class="btn" onclick="judgeAdmit()">判定收不收</button></div>'
    +'<div id="admit-out"></div></div></div>';

  h+='<h2 class="sec">③ 直播复盘打分（手册4）</h2><div class="card" id="review-box"><div class="cb">'
    +M.liveReview.dims.map(d=>'<label class="fld"><span>'+esc(d.n)+' <em class="muted">('+esc(d.guide)+')</em></span><input data-k="'+d.k+'" placeholder="填实测值"></label>').join('')
    +'<div class="row"><button class="btn" onclick="reviewLive()">汇总复盘</button></div>'
    +'<textarea id="review-out" class="out" readonly></textarea></div></div>';

  h+='<h2 class="sec">④ 软引流话术生成（抖音站内不违规 · 手册2）</h2><div class="card"><div class="cb">'
    +'<label class="fld"><span>引导动作</span><input id="soft-goal" placeholder="领资料 / 听直播 / 进群"></label>'
    +'<div class="row"><button class="btn" onclick="genSoftLead()">生成话术</button></div>'
    +'<textarea id="soft-out" class="out" readonly></textarea></div></div>';

  h+='<h2 class="sec">⑤ 批量拍摄清单（半天拍10条 · 手册6）</h2><div class="card"><div class="cb"><div class="grid g2">'
    +'<label class="fld"><span>拍几条</span><input id="batch-count" placeholder="10"></label>'
    +'<label class="fld"><span>主要形式</span><input id="batch-form" placeholder="手写板俯拍"></label>'
    +'</div><div class="row"><button class="btn" onclick="genBatchPlan()">生成清单</button></div>'
    +'<textarea id="batch-out" class="out" readonly></textarea></div></div>';
  return h;
}
function checkSensitive(){
  const txt=document.getElementById('sc-input').value;
  if(!txt.trim()){ toast('先粘贴要检查的文案'); return; }
  let html='', found=0;
  CORE.compliance.sensitive.forEach(s=>{
    const variants=s[0].split(' / ');
    const hit=variants.find(v=> txt.indexOf(v)>=0);
    if(hit){ found++; html+='<div style="margin:6px 0"><span style="color:#c0392b;font-weight:600">'+esc(s[0])+'</span> → <span style="color:#1d7a46">'+esc(s[1])+'</span></div>'; }
  });
  html = found ? '<p class="muted">共检出 '+found+' 处，请按右侧替换：</p>'+html : '<div style="color:#1d7a46;font-weight:600">✅ 未发现敏感词，可发布</div>';
  document.getElementById('sc-out').innerHTML=html;
}
function judgeAdmit(){
  const v={};
  ['want','parent','base'].forEach(k=>{ const el=document.querySelector('#admit-box [data-k="'+k+'"]'); v[k]=el?el.value:''; });
  const r=M.admit.verdict(v);
  document.getElementById('admit-out').innerHTML='<div style="margin-top:8px;font-weight:600;color:'+(r.ok?'#1d7a46':'#c0392b')+'">'+(r.ok?'✅ 建议收':'⛔ 建议不收')+'：'+esc(r.reason)+'</div>';
}
function reviewLive(){
  const out=[];
  M.liveReview.dims.forEach(d=>{ const el=document.querySelector('#review-box [data-k="'+d.k+'"]'); out.push('· '+d.n+'：'+(el&&el.value.trim()?el.value.trim():'（未填）')); });
  document.getElementById('review-out').value=out.join('\n'); toast('已汇总复盘');
}
function genSoftLead(){
  const el=document.getElementById('soft-goal'); const goal=el&&el.value.trim()?el.value.trim():'';
  if(!goal){ toast('先填引导动作'); return; }
  const tpl=M.softLead.tpl[goal]||M.softLead.tpl['默认'];
  document.getElementById('soft-out').value=tpl.replace(/\{\{goal\}\}/g,goal); toast('已生成');
}
function genBatchPlan(){
  const c=document.getElementById('batch-count'), f=document.getElementById('batch-form');
  const v={ count:c&&c.value.trim()?c.value.trim():'10', form:f&&f.value.trim()?f.value.trim():'手写板俯拍' };
  document.getElementById('batch-out').value=M.batchPlan.checklist.map(x=>'□ '+x.replace(/\{\{(\w+)\}\}/g,(m,k)=>v[k])).join('\n'); toast('已生成拍摄清单');
}

/* ===== 政治中心 ===== */
function renderPolitics(){
  let h='<div class="banner"><b>政治中心 · 张姐主用</b><br>初高中政治 + 时政素材引擎 + 主观题采分（教研工具 Phase 2 占位）。政治独立个人 IP 在太原几乎空白，先发优势 ★★★。</div>';
  h += hotZoneHTML('B');
  h+=fmHTML('B');
  h+='<h2 class="sec">政治学科选题库（点 ⚡ 出稿）</h2><div class="grid g2">';
  let pi=0;
  POL.topics.forEach(t=>{
    const key='pl_'+(pi++); TMAP[key]=t;
    h+='<div class="card"><div class="at">'+esc(t.title)+' <span class="lv">'+esc(t.lv)+'</span></div>'
      +'<div class="aw">'+esc(t.hook)+'</div>'
      +'<div class="muted" style="font-size:13px">内容：'+esc(t.body)+'</div>'
      +'<div class="row"><button class="btn s" onclick="showOut(genTopic(TMAP[\''+key+'\'],\'B\'))">⚡ 出稿</button>'
      + favBtn('politics', key, t.title)
      +'<span class="tag">'+esc(t.fmt)+' · '+esc(t.dur)+'</span></div></div>';
  });
  h+='</div>';
  h+='<h2 class="sec">时政素材引擎 / 主观题采分（Phase 2 规划中）</h2>';
  h+='<div class="card"><div class="ct">'+esc(POL.engine.phase)+'</div><div class="cb"><p>'+esc(POL.engine.note)+'</p></div></div>';
  h+='<div class="grid g2" style="margin-top:12px">';
  POL.phase2.forEach(p=>{ h+='<div class="card"><div class="ct">'+esc(p.n)+'</div><div class="cb">'+esc(p.d)+'</div></div>'; });
  h+='</div>';
  $('#politics').innerHTML=h;
}

/* ===== 升学规划中心 ===== */
function renderEduplan(){
  let h='<div class="banner"><b>升学规划中心 · 双师共用</b><br>政策库 + 太原院校/录取数据库 + 智能规划方案 + 咨询接待（Phase 2 占位）。规划号最强对标：毛老师聊升学（15万粉）。</div>';
  h += hotZoneHTML('B');
  h += schoolZoneHTML('B', true);
  if(EDU.facts){
    const F=EDU.facts;
    h+='<h2 class="sec">2026 真实数据速查（联网核实 '+esc(F.asOf)+'，出稿前以官方为准）</h2>';
    h+='<div class="muted" style="font-size:13px;margin-bottom:10px">'+esc(F.note)+'</div><div class="grid g2">';
    [['中考',F.zhongkao],['高考',F.gaokao],['小升初',F.xiaoshengchu],['山西国企央企校招',F.qiye]].forEach(function(pair){
      h+='<div class="card"><div class="ct">'+esc(pair[0])+'</div><div class="cb">'+pair[1].map(function(r){return '<div class="kv"><b>'+esc(r[0])+'</b><span>'+esc(r[1])+'</span></div>';}).join('')+'</div></div>';
    });
    h+='</div>';
  }
  h+='<h2 class="sec">升学选题库（点 ⚡ 出稿，政策类已标来源）</h2>';
  const secs=[...new Set(EDU.topics.map(t=>t.sec))];
  let ei=0;
  secs.forEach(sec=>{
    h+='<h3 class="sub">'+esc(sec)+'</h3><div class="grid g2">';
    EDU.topics.filter(t=>t.sec===sec).forEach(t=>{
      const key='ed_'+(ei++); TMAP[key]=t;
      h+='<div class="card"><div class="at">'+esc(t.title)+' <span class="lv">'+esc(t.lv)+'</span></div>'
        +'<div class="aw">'+esc(t.hook)+'</div>'
        +'<div class="muted" style="font-size:13px">内容：'+esc(t.body)+'</div>'
        +(t.solution?'<div class="muted" style="font-size:13px;margin-top:4px">📌 已有落地方案：'+esc(t.solution.replace(/\n/g,'　'))+'</div>':'')
        +(t.src?'<div class="src">来源：'+esc(t.src)+'</div>':'')
        +'<div class="row"><button class="btn s" onclick="showOut(genTopic(TMAP[\''+key+'\'],\'B\'))">⚡ 出稿</button>'
        + favBtn('eduplan', key, t.title)
        +'<span class="tag">'+esc(t.fmt)+' · '+esc(t.dur)+'</span></div></div>';
    });
    h+='</div>';
  });

  h+='<h2 class="sec">太原升学年度日历（排期表）</h2><div class="card"><div class="cal">';
  EDU.calendar.forEach(c=>{ h+='<div class="calm"><b>'+esc(c.m)+'</b><ul>'+c.e.map(e=>'<li>'+esc(e)+'</li>').join('')+'</ul></div>'; });
  h+='</div></div>';

  h+='<h2 class="sec">官方信源（政策必须标来源）</h2><div class="card"><ul class="sop">';
  EDU.sources.forEach(s=>h+='<li><span class="tm">'+esc(s.n)+'</span><span>'+esc(s.w)+' <span class="muted">('+esc(s.u)+')</span></span></li>');
  h+='</ul></div>';

  h+='<h2 class="sec">60 分钟不露脸直播脚本结构（规划号）</h2><div class="card"><div class="ct">'+esc(EDU.live.n)+'</div><div class="cb"><ul class="sop">';
  EDU.live.struct.forEach(x=>h+='<li><span class="tm">'+esc(x.t)+'</span><span><b>'+esc(x.p)+'</b> ｜ '+esc(x.a)+'</span></li>');
  h+='</ul><p class="muted" style="margin-top:8px">'+EDU.live.tips.map(t=>'· '+t).join('<br>')+'</p></div></div>';

  h+='<h2 class="sec">政策库 / 院校库 / 智能规划（Phase 2 占位）</h2><div class="grid g2">';
  EDU.phase2.forEach(p=>{ h+='<div class="card"><div class="ct">'+esc(p.n)+'</div><div class="cb">'+esc(p.d)+'</div></div>'; });
  h+='</div>';
  $('#eduplan').innerHTML=h;
}

/* ===== 脚本工厂 ===== */
let factoryRendered=false;
function renderFactory(){
  let h='<div class="banner"><b>脚本工厂 · 填空即出稿</b><br>选模板 → 填空（或点"填入示例"）→ 生成带时间轴的口播稿。今日行动 / 选题库点 ⚡ 出的稿也会落在这里。</div>';
  h+='<h2 class="sec">通用脚本模板库</h2><div class="grid g2">';
  TPL.forEach((t,i)=>{ h+=regTpl('tpl_'+i, t); });
  h+='</div>';
  h+='<h2 class="sec">出稿区（所有成稿自动汇总，按类型分好、不覆盖）</h2>';
  h+='<div class="card"><div class="ct">提示</div><div class="cb">每点一次「⚡ 出稿」，内容都会自动收进右下角「📋 成稿」箱，可随时点开复制 / 下载；下面是本机成稿历史（与「📋 成稿」箱同步）。</div></div>';
  h+='<div id="factory-drafts"></div>';
  $('#factory').innerHTML=h;
  factoryRendered=true;
  renderDraftList();
}

/* ===== 公共中台 ===== */
function renderHub(){
  let h='';

  /* 战略情报 */
  h+='<h2 class="sec">战略情报 · 总纲与底盘</h2>';
  h+='<div class="card"><div class="ct">总纲</div><div class="cb"><b>'+esc(S.overview.slogan)+'</b></div></div>';
  h+='<div class="grid g2" style="margin-top:12px">';
  S.overview.bottom.forEach(b=>{ h+='<div class="card"><div class="ct">'+esc(b[0])+'</div><div class="cb">'+esc(b[1])+'</div></div>'; });
  h+='</div>';

  h+='<h2 class="sec">三大 IP 板块 / 双号矩阵分工</h2><div class="grid g3">';
  S.pillars.three.forEach(p=>{ h+='<div class="card"><div class="ct">'+esc(p[0])+'</div><div class="cb">'+esc(p[1])+'</div></div>'; });
  h+='</div>';
  h+='<div class="card" style="margin-top:12px"><div class="ct">分工铁律</div><div class="cb" style="color:#c0392b;font-weight:600">'+esc(S.pillars.rule)+'</div></div>';
  h+='<div class="card" style="margin-top:12px"><div class="ct">双号矩阵对照</div><div class="cb"><table class="mtb"><tr>'+S.pillars.matrix[0].map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr>'
    +S.pillars.matrix.slice(1).map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</table></div></div>';

  h+='<h2 class="sec">全学科对标清单（精选）</h2><div class="card"><div class="cb"><table class="mtb"><tr><th>学科</th><th>账号</th><th>体量</th><th>可借鉴</th><th>不学</th><th>与你</th></tr>'
    +S.benchmark.map(b=>'<tr><td>'+esc(b.subj)+'</td><td>'+esc(b.who)+'</td><td>'+esc(b.scale)+'</td><td>'+esc(b.learn)+'</td><td>'+esc(b.no)+'</td><td>'+esc(b.mine)+'</td></tr>').join('')+'</table></div></div>';

  h+='<h2 class="sec">空白市场机会</h2><div class="card"><div class="cb"><table class="mtb"><tr><th>优先级</th><th>机会</th><th>说明</th><th>归属</th></tr>'
    +S.opportunities.map(o=>'<tr><td>'+esc(o[0])+'</td><td>'+esc(o[1])+'</td><td>'+esc(o[2])+'</td><td>'+esc(o[3])+'</td></tr>').join('')+'</table></div></div>';

  h+='<h2 class="sec">打法方案精要</h2>';
  h+='<div class="card"><div class="ct">信任状公式</div><div class="cb"><b>'+esc(S.playbook.trust)+'</b></div></div>';
  function listCard(t,arr){ return '<div class="card"><div class="ct">'+t+'</div><div class="cb"><ul class="sop">'+arr.map(x=>'<li><span>'+esc(x)+'</span></li>').join('')+'</ul></div></div>'; }
  h+='<div class="grid g2" style="margin-top:12px">'
    +listCard('老闫人设设计',S.playbook.personaYan)
    +listCard('张姐人设设计',S.playbook.personaZhang)
    +listCard('物理号内容金矿',S.playbook.contentPhysics)
    +listCard('规划号内容金矿',S.playbook.contentPlan)+'</div>';
  h+='<div class="card" style="margin-top:12px"><div class="ct">引流漏斗</div><div class="cb">'+esc(S.playbook.funnel)+'</div></div>';
  h+='<div class="grid g3" style="margin-top:12px">';
  S.playbook.phases.forEach(p=>{ h+='<div class="card"><div class="ct">'+esc(p[0])+'</div><div class="cb">'+esc(p[1])+'</div></div>'; });
  h+='</div>';

  h+='<h2 class="sec">八字 / 改名决策看板</h2><div class="card"><div class="cb">'
    +'<div class="kv"><b>生辰</b><span>'+esc(S.fate.birthday)+'</span></div>'
    +'<div class="kv"><b>八字</b><span>'+esc(S.fate.bazi)+'</span></div>'
    +'<div class="kv"><b>幸运色</b><span>'+esc(S.fate.luckyColor)+'</span></div>'
    +'<div class="kv"><b>幸运数</b><span>'+esc(S.fate.luckyNum)+'</span></div>'
    +'<div class="kv"><b>改名决策</b><span>'+esc(S.fate.rename.decision)+'</span></div>'
    +'<div class="kv"><b>择时</b><span>'+esc(S.fate.rename.timingRule)+'</span></div>'
    +'<div class="kv"><b>动作</b><span>'+esc(S.fate.rename.action)+'</span></div>'
    +'<div class="kv"><b>说明</b><span>'+esc(S.fate.rename.note)+'</span></div>'
    +'</div></div>';

  h+='<h2 class="sec">热点自动化机制</h2><div class="card"><div class="cb">'
    +'<div class="kv"><b>任务</b><span>'+esc(S.hotAuto.task)+'</span></div>'
    +'<div class="kv"><b>输出</b><span>'+esc(S.hotAuto.output)+'</span></div>'
    +'<div class="kv"><b>邮箱</b><span>'+esc(S.hotAuto.email)+'</span></div>'
    +'<div class="kv"><b>用法</b><span>'+esc(S.hotAuto.usage)+'</span></div>'
    +'<div class="kv"><b>监控清单</b><span><ul class="sop">'+S.hotAuto.monitor.map(m=>'<li><span>'+esc(m)+'</span></li>').join('')+'</ul></span></div>'
    +'</div></div>';

  h += renderIterate();

  h+='<h2 class="sec">楚月事件范本（不露脸争议评论）</h2>';
  S.cases.forEach(c=>h+='<div class="card"><div class="ct">'+esc(c.name)+'</div><div class="cb">'+esc(c.desc)+'</div></div>');

  /* 双号人设卡完整版 */
  h+='<h2 class="sec">双号人设卡（完整）</h2><div class="grid g2">';
  CORE.personas.forEach(p=>{
    h+='<div class="pcard"><div class="phead"><h3>'+esc(p.name)+'</h3><span>'+esc(p.tag)+' · '+esc(p.owner)+' · '+esc(p.platform)+' · '+esc(p.status)+'</span></div><div class="pbody">'
      +'<div class="kv"><b>定位公式</b><span>'+esc(p.formula)+'</span></div>'
      +'<div class="kv"><b>主受众</b><span>'+esc(p.audience)+'</span></div>'
      +'<div class="kv"><b>出镜方式</b><span>'+esc(p.appear)+'</span></div>'
      +'<div class="kv"><b>信任状</b><span>'+p.trust.map(t=>'<span class="pill s">'+esc(t)+'</span>').join(' ')+'</span></div>'
      +'<div style="margin-top:10px;font-size:13px;color:var(--ink3)">简介备选（点复制）</div>';
    p.bio.forEach(b=>{ h+='<div class="bio"><div class="bt">'+esc(b.v)+' <button class="btn s o" style="float:right" onclick="copy(this.parentNode.nextElementSibling.textContent)">复制</button></div><div>'+esc(b.text).replace(/\n/g,'<br>')+'</div></div>'; });
    h+='<div style="margin-top:10px"><span class="pill p">禁止出现</span><div class="cb" style="margin-top:6px;font-size:13px">'+p.forbidden.map(f=>'· '+esc(f)).join('<br>')+'</div></div>'
      +'</div></div>';
  });
  h+='</div>';

  /* 合规红线 */
  h+='<h2 class="sec">合规红线</h2><div class="grid g2">';
  CORE.compliance.redlines.forEach(r=>{ h+='<div class="card"><div class="ct" style="color:#c0392b">'+esc(r.t)+'</div><div class="cb">'+esc(r.d)+'</div></div>'; });
  h+='</div>';
  h+='<h2 class="sec">敏感词替换表</h2><div class="card"><div class="cb"><table class="mtb"><tr><th>禁用</th><th>替换为</th></tr>'
    +CORE.compliance.sensitive.map(s=>'<tr><td>'+esc(s[0])+'</td><td>'+esc(s[1])+'</td></tr>').join('')+'</table></div></div>';

  /* 四维重塑 */
  h+='<h2 class="sec">四维重塑运营模型</h2><div class="grid g2">';
  CORE.fourDim.forEach(d=>{ h+='<div class="card"><div class="ct">'+esc(d.k)+' <span class="muted">'+esc(d.sub)+'</span></div><div class="cb"><ul class="sop">'+d.items.map(i=>'<li><span>'+esc(i)+'</span></li>').join('')+'</ul></div></div>'; });
  h+='</div>';

  /* 增长四阶段 */
  h+='<h2 class="sec">增长四阶段 · 当前位置</h2><div class="grid g4">';
  CORE.growth.forEach(g=>{ h+='<div class="card"'+(g.now?' style="border-color:var(--blue);border-width:2px"':'')+'>'
    +'<div class="ct">'+esc(g.n)+(g.now?' <span class="pill">当前</span>':'')+'</div>'
    +'<div class="cb"><b>目标：</b>'+esc(g.goal)+'<ul>'+g.todo.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>'
    +'<div style="margin-top:8px"><span class="pill g">达标线：'+esc(g.metric)+'</span></div></div></div>'; });
  h+='</div>';

  /* SOP */
  h+='<h2 class="sec">SOP 节奏表</h2><div class="grid g3">';
  h+='<div class="card"><div class="ct">每日</div><div class="cb"><ul class="sop">'+CORE.sop.daily.map(x=>'<li><span class="tm">'+esc(x.t)+'</span><span>'+esc(x.a)+'</span></li>').join('')+'</ul></div></div>';
  h+='<div class="card"><div class="ct">每周</div><div class="cb"><ul class="sop">'+CORE.sop.weekly.map(x=>'<li><span>'+esc(x)+'</span></li>').join('')+'</ul></div></div>';
  h+='<div class="card"><div class="ct">每月</div><div class="cb"><ul class="sop">'+CORE.sop.monthly.map(x=>'<li><span>'+esc(x)+'</span></li>').join('')+'</ul></div></div>';
  h+='</div>';

  /* 产品阶梯 */
  h+='<h2 class="sec">四层产品阶梯</h2><div class="card"><div class="cb"><table class="mtb"><tr><th>层级</th><th>定价</th><th>内容</th><th>作用</th><th>KPI</th></tr>'
    +CORE.ladder.map(l=>'<tr><td>'+esc(l.lv)+'</td><td>'+esc(l.price)+'</td><td>'+esc(l.what)+'</td><td>'+esc(l.why)+'</td><td>'+esc(l.kpi)+'</td></tr>').join('')+'</table></div></div>';

  /* 转化钩子 */
  h+='<h2 class="sec">转化钩子库</h2><div class="grid g2">';
  h+='<div class="card"><div class="ct">开头钩子（5 种）</div><div class="cb"><ul class="sop">'+CORE.hooks.open.map(x=>'<li><span><b>'+esc(x.n)+'</b> ｜ '+esc(x.e)+'</span></li>').join('')+'</ul></div></div>';
  h+='<div class="card"><div class="ct">转化钩子（6 种）</div><div class="cb"><ul class="sop">'+CORE.hooks.convert.map(x=>'<li><span><b>'+esc(x.n)+'</b> ｜ '+esc(x.e)+'</span></li>').join('')+'</ul></div></div>';
  h+='</div>';

  /* 私域承接 */
  h+='<h2 class="sec">私域承接话术</h2><div class="grid g2">';
  h+='<div class="card"><div class="ct">加好友话术</div><div class="cb"><div class="kv"><b>模板</b><span>'+esc(CORE.privateDomain.addFriend)+'</span></div></div></div>';
  h+='<div class="card"><div class="ct">前 14 天养熟节奏</div><div class="cb"><ul class="sop">'+CORE.privateDomain.firstTouch.map(x=>'<li><span>'+esc(x)+'</span></li>').join('')+'</ul></div></div>';
  h+='</div>';
  h+='<div class="card" style="margin-top:12px"><div class="ct">预热预售四阶段</div><div class="cb"><ul class="sop">'+CORE.privateDomain.preSale.map(x=>'<li><span><b>'+esc(x.p)+'</b> ｜ '+esc(x.a)+'</span></li>').join('')+'</ul><p class="muted" style="margin-top:8px">禁区：'+CORE.privateDomain.noNo.join(' / ')+'</p></div></div>';

  /* 幸运配置 */
  h+='<h2 class="sec">幸运配置（按生辰八字）</h2><div class="card"><div class="cb">'
    +'<div class="kv"><b>主色</b><span>'+esc(CORE.lucky.color)+'</span></div>'
    +'<div class="kv"><b>数字</b><span>'+esc(CORE.lucky.num)+'</span></div>'
    +'<div class="kv"><b>择时</b><span>'+esc(CORE.lucky.timing)+'</span></div>'
    +'<div class="kv"><b>说明</b><span>'+esc(CORE.lucky.note)+'</span></div></div></div>';

  h+=methodsBoxHTML();

  $('#hub').innerHTML=h;
}

/* ===== 周迭代对标（周日自动化草案展示） ===== */
function renderIterate(){
  var I=window.ITERATE;
  var h='<h2 class="sec">🔄 周迭代对标 · 每周日自动生成</h2>';
  if(!I||!I.drafts){
    h+='<div class="card"><div class="cb muted">暂无本周迭代。每周日自动化会联网对标 王芳英语 / 陈进步讲数学 / 张毅物理 / 王喆物理 / 张强数学 等太原教育达人，自动产出《对标报告 + 话术迭代》覆盖 物理 / 升学 / 直播 / 朋友圈 / 第一梯队 五类，并通过覆盖层（data-iterate-override.js）直接落地到工作台、自动重部署——每周都是最新，无需人工审。</div></div>';
    return h;
  }
  h+='<div class="card"><div class="ct">本周对标 · '+(I.week||'')+'（'+(I.date||'')+'）</div><div class="cb">'
    +'<div class="kv"><b>对标对象</b><span>'+((I.benchmark||[]).map(function(b){return esc(b.who)+'（'+esc(b.subj)+'）';}).join('、')||'—')+'</span></div>'
    +'<div class="kv"><b>应用方式</b><span>'+esc(I.note||'每周日自动化自动落地到覆盖层（data-iterate-override.js）并重部署，每周最新')+'</span></div>'
    +'</div></div>';

  h+='<h3 class="sub">📊 对标发现（达人有效打法）</h3><div class="card"><div class="cb"><table class="mtb"><tr><th>达人</th><th>学科</th><th>有效信号（可学）</th><th>映射咱们</th></tr>'
    +((I.benchmark||[]).map(function(b){return '<tr><td>'+esc(b.who)+'</td><td>'+esc(b.subj)+'</td><td>'+esc(b.signal)+'</td><td>'+esc(b.ref||'')+'</td></tr>';}).join(''))+'</table></div></div>';

  var cats=[['physics','物理中心（老闫 · 对标张毅/王喆/陈进步方法）'],['eduplan','升学规划中心（张姐 · 对标王芳/陈进步 IP 打法）'],['live','直播工作台（双号）'],['moment','朋友圈（亿领 · 调性对标）'],['tier1','第一梯队校动态（数据真实 · 迭代表达）']];
  cats.forEach(function(c){
    var list=(I.drafts&&I.drafts[c[0]])||[];
    if(!list.length) return;
    h+='<h3 class="sub">✏️ '+esc(c[1])+' · '+list.length+' 条迭代草案</h3><div class="grid g2">';
    list.forEach(function(d,idx){
      h+='<div class="card"><div class="ct">对标：'+esc(d.ref||'')+'</div><div class="cb">'
        +'<div class="kv"><b>差距</b><span>'+esc(d.gap||'')+'</span></div>'
        +'<div class="kv"><b>改写钩子</b><span>'+esc(d.hookNew||'')+'</span></div>'
        +'<div class="kv"><b>改写话术</b><span>'+esc(d.copyNew||'')+'</span></div>'
        +'<div class="kv"><b>保持</b><span>'+esc(d.keep||'')+'</span></div>'
        +'<div class="row"><button class="btn s o" onclick="moCopyIter(\''+c[0]+'\','+idx+')">复制本条</button>'+favBtn('iter', c[0]+'_'+idx, (d.ref||'')+' 改写草案')+'</div>'
        +'</div></div>';
    });
    h+='</div>';
  });
  return h;
}
function moCopyIter(cat,idx){
  var I=window.ITERATE; if(!I||!I.drafts||!I.drafts[cat]||!I.drafts[cat][idx]){ toast('无内容可复制'); return; }
  var d=I.drafts[cat][idx];
  var txt='【对标】'+(d.ref||'')+'\n【差距】'+(d.gap||'')+'\n【改写钩子】'+(d.hookNew||'')+'\n【改写话术】'+(d.copyNew||'')+'\n【保持】'+(d.keep||'');
  copy(txt); toast('已复制迭代草案');
}

/* ===== 直播工作台 ===== */
function buildLiveVersion(theme, zone, mins, goal, fudai, m, solution, depth){
  const cam = m==='手播不露脸' ? '露手不露脸，屏幕放PPT/志愿卡/数据截图，或屏幕共享' : '张姐真人出镜，面对镜头，注意背景整洁、打光';
  const modMins = Math.max(8, Math.round(mins*0.6/3));
  const open = zone==='B'
    ? '（开场钩子）'+theme+'——报志愿最怕信息差，今天我把压箱底的方法一次讲透。'
    : '（开场钩子）'+theme+'——物理提分不靠刷题量，靠把模型吃透，今天教你。';
  const g1 = zone==='B' ? '模块1：用一分一段表做位次定位，把"分数"翻译成"能上的学校区间"' : '模块1：力学三大模型拆解，受力分析不再丢分';
  const g2 = zone==='B' ? '模块2：冲稳保梯度怎么排，志愿顺序错了直接滑档' : '模块2：实验题五步法，白送的12分先拿稳';
  const g3 = zone==='B' ? '模块3：专业vs学校取舍，中分段优先专业、行业性强' : '模块3：近3年山西高考物理考点分布，刷题对准考纲';
  const depthLine = depth ? (' 先讲透底层逻辑：'+depth+'。') : '';
  const solSteps = solution ? solution.replace(/\n/g,'；') : '';
  const convert = zone==='B'
    ? '想要《山西院校近3年录取位次表》的，扣「位次」，我发你。更细的定位可以进粉丝群，下播我挑典型帮你看。'
    : '想要《物理高频考点速记卡》的扣「物理」，我发你。卡壳的题评论区喊"老闫救我"，下播挑典型讲。';
  const end = '明晚同一时间讲「'+(zone==='B'?'提前批报考避坑':'物理选择题秒杀技巧')+'」，点关注开播不迷路。';
  let s='【'+m+'版 ｜ 画面备注：'+cam+'】\n';
  s+='▶ 开场留人（前90秒）\n· '+open+depthLine+'\n· 价值：今天讲完你能自己上手'+(zone==='B'?'冲稳保定位':'物理提分3步')+'。\n· 预告：最后抽'+fudai+'，想要的扣666。\n\n';
  s+='▶ 干货模块（共约'+mins+'分钟）\n';
  s+='· 模块1（深度拆解）：'+(depth?depth:g1)+'（'+modMins+'分钟）\n';
  s+='· 模块2（具体落地动作）：'+(solSteps?solSteps:g2)+'（'+modMins+'分钟）\n';
  s+='· 模块3（案例/避坑）：'+g3+'（'+modMins+'分钟）\n';
  s+='· 每5分钟互动一次：评论区提问/扣字投票，保持停留。\n\n';
  s+='▶ 逼单转化（最后10分钟）\n· '+convert+'\n\n';
  s+='▶ 结尾预告\n· '+end+'\n';
  return s;
}
function syncLiveMode(){
  const acc=document.querySelector('#live-gen [data-k="lg-acc"]');
  const mode=document.querySelector('#live-gen [data-k="lg-mode"]');
  if(!acc||!mode) return;
  mode.value = acc.value==='A' ? '手播不露脸' : '露脸出镜';
}
function genLiveScript(){
  const root=document.getElementById('live-gen'); if(!root) return;
  const g=k=>{ const el=root.querySelector('[data-k="'+k+'"]'); return el&&el.value.trim()?el.value.trim():''; };
  const acc=g('lg-acc'), mode=g('lg-mode'), theme=g('lg-theme'), mins=parseInt(g('lg-mins'))||60, goal=g('lg-goal'), fudai=g('lg-fudai');
  const solution=g('lg-solution'), depth=g('lg-depth');
  if(!theme){ toast('先填直播主题'); return; }
  const zone = acc==='A'?'A':'B';
  let out='【直播脚本 · '+theme+'】\n账号：'+(zone==='A'?'老闫物理 A':'张姐规划 B')+' ｜ 形式：'+mode+' ｜ 时长：'+mins+'分钟 ｜ 目标：'+goal+'\n福袋设置：'+fudai+'\n\n';
  const modes = mode==='两种都要' ? ['手播不露脸','露脸出镜'] : [mode];
  modes.forEach(m=>{ out += buildLiveVersion(theme, zone, mins, goal, fudai, m, solution, depth) + '\n'; });
  showLive(out, '直播脚本 · '+theme, '直播');
}
function genLiveFromTopic(key){
  const t=window.TMAP[key]; if(!t) return;
  const set=(k,v)=>{ const el=document.querySelector('#live-gen [data-k="'+k+'"]'); if(el) el.value=v; };
  set('lg-acc', t.acc); set('lg-mode', t.acc==='A'?'手播不露脸':'露脸出镜'); set('lg-theme', t.theme); set('lg-mins','60'); set('lg-goal', t.goal||'引流到私域'); set('lg-fudai', t.fudai||''); set('lg-solution', t.solution||''); set('lg-depth', t.depth||'');
  switchTab('live'); genLiveScript();
}
function genPrep(){
  const out=LIVE.prep.map(x=>'□ '+x).join('\n');
  showLive('【直播前准备清单】\n'+out+'\n\n（开播前逐项勾，漏一项都可能翻车）', '直播前准备清单', '清单');
}
function reviewLiveNew(){
  const out=[];
  LIVE.review.forEach(d=>{ const el=document.querySelector('#review-box-live [data-k="'+d.k+'"]'); out.push('· '+d.k+'：'+(el&&el.value.trim()?el.value.trim():'（未填）')); });
  showLive('【直播复盘表 · '+LIVE.review.length+'项指标】\n'+out.join('\n')+'\n\n目标参考：\n'+LIVE.review.map(d=>'· '+d.k+' → '+d.target).join('\n'), '直播复盘 · '+LIVE.review.length+'项', '复盘');
}
function liveFilterQA(f){
  const box=document.getElementById('qa-box'); if(!box) return;
  const list = f==='all'?LIVE.qa:LIVE.qa.filter(q=>q.acc===f);
  let h='';
  list.forEach(q=>{ h+='<div class="card"><div class="at">Q：'+esc(q.q)+' <span class="lv">'+(q.acc==='A'?'老闫物理':'张姐规划')+'</span></div><div class="aw">A：'+esc(q.a)+'</div></div>'; });
  box.innerHTML=h;
}
function renderLive(){
  let h='<div class="banner"><b>直播工作台 · 双号通用</b><br>'+esc(LIVE.note)+'</div>';
  h += '<h2 class="sec">📤 本场成稿（点「生成」后，内容直接显示在这里，不用跳页）</h2><div id="live-out"></div>';
  h += hotZoneHTML('AB');

  h+='<h2 class="sec">直播选题库（点 ⚡ 直接生成双版脚本）</h2><div class="grid g2">';
  LIVE.topics.forEach((t,i)=>{ const key='lv_'+i; window.TMAP[key]=t;
    h+='<div class="card"><div class="at">'+esc(t.theme)+' <span class="lv">'+(t.acc==='A'?'老闫物理':'张姐规划')+'</span></div>'
      +'<div class="aw">'+esc(t.hook)+'</div>'
      +'<div class="row"><button class="btn s" onclick="genLiveFromTopic(\''+key+'\')">⚡ 生成直播脚本</button>'
      + favBtn('live', key, t.theme)
      +'<span class="tag">目标：'+esc(t.goal)+'</span></div></div>';
  });
  h+='</div>';

  h+='<h2 class="sec">直播脚本生成器（手播版 / 露脸版，可都要）</h2>';
  h+='<div class="card" id="live-gen"><div class="ct">填空即出完整直播脚本</div><div class="cb"><div class="grid g2">';
  h+='<label class="fld"><span>账号</span><select data-k="lg-acc" onchange="syncLiveMode()"><option value="B">张姐规划 B（可露脸）</option><option value="A">老闫物理 A（不露脸）</option></select></label>';
  h+='<label class="fld"><span>形式</span><select data-k="lg-mode"><option>两种都要</option><option>手播不露脸</option><option>露脸出镜</option></select></label>';
  h+='<label class="fld"><span>直播主题</span><input data-k="lg-theme" placeholder="如：冲稳保怎么排"></label>';
  h+='<label class="fld"><span>时长(分钟)</span><input data-k="lg-mins" placeholder="60"></label>';
  h+='<label class="fld"><span>本场目标</span><select data-k="lg-goal"><option>引流到私域</option><option>引导咨询/诊断</option><option>卖志愿卡/课程</option><option>纯建立信任</option><option>直播带货</option></select></label>';
  h+='<label class="fld"><span>福袋奖品</span><input data-k="lg-fudai" placeholder="《志愿填报避坑表》"></label>';
  h+='<label class="fld" style="grid-column:1/3"><span>具体方案（可选·留空则用通用框架）</span><textarea data-k="lg-solution" rows="3" placeholder="3条可落地的具体动作，如：①每天…②…③…（点直播选题库/热点可直接带入）"></textarea></label>';
  h+='<label class="fld" style="grid-column:1/3"><span>底层逻辑/深度（可选）</span><input data-k="lg-depth" placeholder="讲透这件事为什么是这样的规律/机制"></label>';
  h+='</div><div class="row"><button class="btn" onclick="genLiveScript()">⚡ 生成双版脚本</button>'
    +'<button class="btn s o" onclick="genLiveFromTopic(\'lv_0\')">示例：生成第一条</button></div></div></div>';

  h+='<h2 class="sec">话术表（可复制套用）</h2>';
  const talkMap=[['痛点挖掘',LIVE.talks.pain],['价值塑造',LIVE.talks.value],['紧迫感',LIVE.talks.urgency],['破冰信任',LIVE.talks.icebreak],['冲稳保',LIVE.talks.rush],['情绪疏导',LIVE.talks.emotion]];
  h+='<div class="grid g2">';
  talkMap.forEach(function(pair){ const n=pair[0], arr=pair[1];
    h+='<div class="card"><div class="ct">'+n+'</div><div class="cb"><ul class="sop">'+arr.map(function(x){return '<li><span>'+esc(x)+'</span></li>';}).join('')+'</ul>'
      +'<div class="row"><button class="btn s" onclick="copy(this.parentNode.previousElementSibling.textContent)">复制话术</button></div></div></div>';
  });
  h+='</div>';

  h+='<h2 class="sec">高频QA表（家长直播必问 + 标准答）</h2>';
  h+='<div class="row" style="margin-bottom:10px"><button class="btn s o" onclick="liveFilterQA(\'all\')">全部</button><button class="btn s o" onclick="liveFilterQA(\'B\')">张姐规划</button><button class="btn s o" onclick="liveFilterQA(\'A\')">老闫物理</button></div>';
  h+='<div class="grid g2" id="qa-box"></div>';

  h+='<h2 class="sec">互动福袋话术表</h2><div class="card"><div class="cb"><table class="mtb"><tr><th>时段</th><th>动作</th><th>话术</th></tr>'
    +LIVE.interact.map(function(x){return '<tr><td>'+esc(x.stage)+'</td><td>'+esc(x.act)+'</td><td>'+esc(x.script)+'</td></tr>';}).join('')+'</table></div></div>';

  h+='<h2 class="sec">直播前准备清单</h2><div class="card"><div class="ct">开播前逐项勾</div><div class="cb"><ul class="sop">'+LIVE.prep.map(function(x){return '<li><span>'+esc(x)+'</span></li>';}).join('')+'</ul>'
    +'<div class="row"><button class="btn" onclick="genPrep()">⚡ 生成勾选清单</button></div></div></div>';

  h+='<h2 class="sec">直播复盘表（指标 + 一键汇总）</h2><div class="card" id="review-box-live"><div class="ct">下播填实测，汇总复盘</div><div class="cb"><div class="grid g2">'
    +LIVE.review.map(function(d){return '<label class="fld"><span>'+esc(d.k)+'</span><input data-k="'+esc(d.k)+'" placeholder="实测值"></label>';}).join('')
    +'</div><div class="row"><button class="btn" onclick="reviewLiveNew()">汇总复盘</button></div></div></div>';

  h+='<h2 class="sec">直播间合规红线（叠加公共中台8条）</h2><div class="grid g2">';
  LIVE.redlines.forEach(function(r){ h+='<div class="card"><div class="ct" style="color:#c0392b">'+esc(r.t)+'</div><div class="cb">'+esc(r.d)+'</div></div>'; });
  h+='</div>';

  h+='<h2 class="sec">开播物料包（一键生成 PPT/志愿卡/截图/福袋）</h2>';
  h+='<div class="card"><div class="ct">选好上方账号和主题，一键出全套开播物料</div><div class="cb">';
  h+='<div class="row"><button class="btn" onclick="genLiveMaterial()">⚡ 生成开播物料包</button>';
  h+='<span class="tag">含 PPT分镜 + 志愿卡文字 + 数据截图清单 + 福袋设置</span></div></div>';

  $('#live').innerHTML=h;
  syncLiveMode();
  liveFilterQA('all');
}

/* ===== 文案中心（朋友圈 + 公众号推文 + 导出） ===== */
var CP_MOMENT=[]; var CP_ARTICLE='';
function copyMomentPool(zone){ return (window.COPY && COPY.moment[zone])||[]; }
function allSchoolList(){
  return allSchools();
}
function findSchool(name){
  if(!name) return null;
  return allSchoolList().filter(function(s){return s.name===name||s.short===name;})[0]||null;
}
function genMoment(zone, theme, school){
  var pool=copyMomentPool(zone).slice();
  for(var i=pool.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=pool[i];pool[i]=pool[j];pool[j]=t;}
  var picks=pool.slice(0,3);
  var cta=(window.COPY&&COPY.cta[zone])||'评论区扣「资料」领取。';
  var nm=zone==='A'?'老闫':'张姐';
  var intro=zone==='A'?'我是老闫，太原10年初高中物理。':'我是张姐，太原教育咨询第5年。';
  var schFact='';
  var m=findSchool(school);
  if(m){ schFact=m.short+'（'+m.district+'·'+m.nature+'·'+(segOf(m)==='high'?'高中':'初中')+(m.dingxiang?'·定向生校':'')+'）'; }
  var th=(theme?'【'+theme+'】'+(school?'·'+school:''):'')+'\n';
  var cards=[];
  cards.push(th+picks[0]+'\n\n'+cta);
  if(schFact) cards.push(intro+'\n刚扒到 '+schFact+'。'+(theme?('\n关于'+theme+'，'):'\n')+'想了解更细，评论区扣「资料」。');
  else cards.push(intro+'\n'+picks[1]+'\n\n'+cta);
  cards.push(picks[2]+'\n\n'+(school?('以'+school+'为例，'):'')+(theme?('关于'+theme+'，'):'')+'我的建议：先弄清楚规则，再谈努力。\n\n'+cta);
  return cards;
}
/* —— 公众号推文：版式（与你样例一致） —— */
var ARTICLE_CSS=`:root{--wx:#07c160;--ink:#1a1a1a;--sub:#666;--bg:#ededed;--card:#fff;--accent:#2b6cb0;--warn:#c0392b;--gold:#b45309}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
.phone{max-width:430px;margin:0 auto;background:var(--card);min-height:100vh;box-shadow:0 2px 18px rgba(0,0,0,.12);overflow:hidden}
.mp-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #f0f0f0}
.mp-avatar{width:34px;height:34px;border-radius:6px;background:linear-gradient(135deg,#ff7a45,#ff4d4f);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700}
.mp-name{font-size:15px;font-weight:600;color:#222}
.mp-sub{font-size:11px;color:#999}
.mp-follow{margin-left:auto;background:var(--wx);color:#fff;font-size:12px;padding:5px 12px;border-radius:4px;font-weight:600}
.cover{height:200px;background:linear-gradient(135deg,#1e3a8a 0%,#0ea5e9 100%);position:relative;display:flex;align-items:flex-end;padding:18px}
.cover .ctext{color:#fff}
.cover h1{margin:0;font-size:20px;line-height:1.4;font-weight:800;text-shadow:0 1px 4px rgba(0,0,0,.3)}
.cover .csub{font-size:12px;opacity:.92;margin-top:6px}
.article{padding:20px 18px 40px}
.title{font-size:21px;font-weight:800;line-height:1.4;color:var(--ink);margin:0 0 10px}
.byline{font-size:12px;color:#999;margin-bottom:18px;border-bottom:1px solid #f2f2f2;padding-bottom:12px}
.lead{background:#f7f9fc;border-left:4px solid var(--accent);padding:12px 14px;border-radius:0 8px 8px 0;font-size:15px;color:#333;line-height:1.7;margin-bottom:22px}
h2.sec{font-size:18px;font-weight:800;color:#fff;background:linear-gradient(90deg,#2563eb,#0ea5e9);display:inline-block;padding:6px 14px;border-radius:0 12px 12px 0;margin:26px 0 14px}
h3.sub{font-size:15px;color:var(--gold);font-weight:800;margin:16px 0 6px}
.p{font-size:15.5px;line-height:1.8;color:#2b2b2b;margin:0 0 14px}
.tip{background:#fff7e6;border:1px solid #ffe08a;border-radius:10px;padding:12px 14px;font-size:14px;color:#7a5b00;line-height:1.7;margin:14px 0}
.timeline{margin:0 0 8px;padding:0;list-style:none}
.timeline li{position:relative;padding:10px 0 10px 22px;border-left:2px solid #d6e4ff;margin-left:6px}
.timeline li:last-child{border-left-color:transparent}
.timeline li::before{content:"";position:absolute;left:-7px;top:14px;width:12px;height:12px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px #e8f0fe}
.tl-date{display:inline-block;background:#e8f0fe;color:#1d4ed8;font-weight:700;font-size:13px;padding:2px 9px;border-radius:6px;margin-right:8px}
.tl-school{font-size:15px;color:#1a1a1a;font-weight:600}
.tl-note{font-size:12.5px;color:#888;margin-top:3px;display:block}
.kv{margin:0;padding:0;list-style:none}
.kv li{display:flex;gap:8px;padding:5px 0;border-bottom:1px dashed #eee;font-size:14px;line-height:1.6}
.kv li .k{color:var(--accent);font-weight:700;min-width:74px;flex-shrink:0}
.tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:10px 0}
.tbl th{background:#e8f0fe;color:#1d4ed8;padding:7px 8px;text-align:left}
.tbl td{padding:7px 8px;border-bottom:1px solid #eee}
.footer-cta{margin-top:30px;background:linear-gradient(135deg,#eef6ff,#f7f0ff);border-radius:14px;padding:18px;text-align:center}
.footer-cta .big{font-size:16px;font-weight:800;color:#222}
.footer-cta .sm{font-size:13px;color:#666;margin-top:6px;line-height:1.7}
.end{text-align:center;color:#bbb;font-size:12px;margin:26px 0 6px;letter-spacing:2px}
.tagrow{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
.tagrow span{background:#f2f4f7;color:#555;font-size:12px;padding:4px 10px;border-radius:20px}
.hl{color:var(--warn);font-weight:800}
.solid{color:var(--accent);font-weight:700}`;
function mpHeadHTML(c){c=c||{};return '<div class="mp-head"><div class="mp-avatar">'+(c.avatarText||'并州')+'</div><div><div class="mp-name">'+(c.mpName||'太原升学指南')+'</div><div class="mp-sub">'+(c.mpSub||'本地教育资讯')+'</div></div><div class="mp-follow">+ 关注</div></div>';}
function coverHTML(c,title,sub){c=c||{};return '<div class="cover"><div class="ctext"><h1>'+esc(title)+'</h1><div class="csub">'+(sub||'')+'</div></div></div>';}
function endHTML(){return '<div class="footer-cta"><div class="big">📩 觉得有用？三连支持一下</div><div class="sm">点「在看」+「赞」+「转发」到家长群<br>下期想看哪所学校的深度解读？留言告诉我们</div></div><div class="tagrow"><span>#太原升学</span><span>#太原家长</span><span>#2026级新生</span></div><div class="end">—  END  —</div>';}
function escAttr(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

/* ===== 全局收藏（Fav）· localStorage 持久化，跨重部署不丢 ===== */
const Fav = {
  KEY:'yiling_fav_v1',
  load(){ try{ return JSON.parse(localStorage.getItem(this.KEY))||[]; }catch(e){ return []; } },
  save(a){ try{ localStorage.setItem(this.KEY, JSON.stringify(a)); }catch(e){} },
  has(uid){ return this.load().some(x=>x.uid===uid); },
  add(type,uid,title,text,img){ var a=this.load(); a.unshift({uid:uid,type:type,title:title,text:text||'',img:img||null,ts:Date.now()}); this.save(a); },
  remove(uid){ this.save(this.load().filter(x=>x.uid!==uid)); },
  list(){ return this.load(); }
};
window.Fav = Fav;
function favBtn(type, uid, title){
  var uid2=type+':'+uid;
  var on=Fav.has(uid2);
  return '<button class="favbtn'+(on?' on':'')+'" data-type="'+escAttr(type)+'" data-uid="'+escAttr(uid2)+'" data-title="'+escAttr(title||'')+'" onclick="Fav.toggle(this)">'+(on?'★已收藏':'☆收藏')+'</button>';
}
Fav.toggle = function(btn){
  var type=btn.getAttribute('data-type'), uid=btn.getAttribute('data-uid'), title=btn.getAttribute('data-title')||'';
  var card=btn.closest('.card');
  var text='', img=null;
  if(card){
    var c=card.cloneNode(true);
    var bs=c.querySelectorAll('button'); for(var i=0;i<bs.length;i++) bs[i].remove();
    text=(c.innerText||c.textContent||'').replace(/\s+/g,' ').replace(/☆收藏|★已收藏/g,'').trim();
    var im=card.querySelector('img'); if(im) img=im.getAttribute('src');
  }
  if(this.has(uid)){ this.remove(uid); btn.classList.remove('on'); btn.textContent='☆收藏'; toast('已取消收藏'); }
  else { this.add(type,uid,title,text,img); btn.classList.add('on'); btn.textContent='★已收藏'; toast('已收藏，随时回「★收藏」取用'); }
  if(window.renderFav) renderFav();
  if(window.updateFavBadge) updateFavBadge();
};
function favDel(uid){ Fav.remove(uid); if(window.renderFav) renderFav(); if(window.updateFavBadge) updateFavBadge(); }
function updateFavBadge(){ var el=document.getElementById('favCount'); if(el){ var n=Fav.list().length; el.textContent=n?('·'+n):''; } }
function renderFav(){
  var box=document.getElementById('fav'); if(!box) return;
  var list=Fav.list(); var h='';
  if(!list.length){
    h='<div class="card"><div class="cb muted">还没有收藏。看到好的选题、热点、文案、配图，点卡片上的「☆收藏」就能留下来，随时回这里取用。<br><br>收藏存在你这台设备的浏览器里，重部署不会丢；换设备 / 清缓存需要重新收藏。</div></div>';
    box.innerHTML=h; return;
  }
  var labels={home:'今日行动',hot:'实时热点',school:'学校/教研动态',tier1:'第一梯队',zoneA:'物理选题',politics:'政治选题',eduplan:'升学选题',live:'直播选题',moment:'朋友圈配图',iter:'周迭代草案'};
  var groups={}; list.forEach(function(x){ (groups[x.type]=groups[x.type]||[]).push(x); });
  Object.keys(groups).forEach(function(g){
    h+='<h2 class="sec">'+esc(labels[g]||g)+'（'+groups[g].length+'）</h2><div class="grid g2">';
    groups[g].forEach(function(x){
      h+='<div class="card">'
        + (x.img?'<img src="'+esc(x.img)+'" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-bottom:8px">':'')
        + '<div class="at">'+esc(x.title||'')+'</div>'
        + '<div class="aw" style="white-space:pre-wrap;font-size:13px;color:#3a4a5a;max-height:170px;overflow:auto">'+esc((x.text||''))+'</div>'
        + '<div class="row"><button class="btn s" onclick="copy(this.parentNode.previousElementSibling.innerText)">复制</button>'
        + '<button class="btn s x" onclick="favDel(\''+escAttr(x.uid)+'\')">移除</button></div></div>';
    });
    h+='</div>';
  });
  box.innerHTML=h;
}
window.favDel=favDel; window.updateFavBadge=updateFavBadge; window.renderFav=renderFav;

function dateStr(){var d=new Date();var p=function(n){return('0'+n).slice(-2);};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());}

function artOpening(o){
  var cal=(window.SCHOOL_CAL&&SCHOOL_CAL.opening2026)||[];
  var items=cal.slice().sort(function(a,b){var pa=(a.exam||'').match(/(\d+)\/(\d+)/),pb=(b.exam||'').match(/(\d+)\/(\d+)/);if(!pa)return 1;if(!pb)return -1;return (pa[1]-pb[1])||(pa[2]-pb[2]);});
  var tl=items.map(function(it){return '<li><span class="tl-date">'+(it.exam||'-')+'</span><span class="tl-school">'+esc(it.school)+'</span><span class="tl-note">'+(it.examSubjects||'')+(it.src?(' · '+it.src):'')+'</span></li>';}).join('');
  var tiers=(window.SCHOOL_CAL&&SCHOOL_CAL.keyClassTiers)||[];
  var sec3=tiers.map(function(t){return '<h2 class="sec">'+esc(t.school)+'</h2><p class="p">班型梯度：'+esc((t.tiers||[]).join(' &gt; '))+'</p><ul class="kv"><li><span class="k">分班依据</span><span>'+esc(t.rule||'')+'</span></li><li><span class="k">来源</span><span>'+esc(t.src||'')+'</span></li></ul>';}).join('');
  return '<div class="lead">8月已到，准初一、准高一家长最关心：<b>什么时候分班？有没有分班考试？</b>我们把太原市官方编班节点 + 各校已公布的分班考时间整理成这一篇最全汇总。建议<b>收藏+转发</b>到家庭群。</div>'
    +'<h2 class="sec">一、初一（初中）：先说结论——没有"分班考"</h2>'
    +'<p class="p">2026年太原市义务教育已全面推行<b>阳光分班 / 均衡编班</b>，电脑随机派位，<span class="hl">严禁重点班、快慢班</span>。政策层面<b>不存在选拔性质的"分班考试"</b>，只有统一的"均衡编班日"。</p>'
    +'<div class="tip">⚠️ 部分热门初中会在开学前后自行组织<b>学情摸底测试</b>，用于了解基础、方便教学分层，<b>不影响官方均衡编班结果</b>。以学校官方通知为准。</div>'
    +'<h2 class="sec">二、高一（高中）：分班考合规，时间集中在8月中旬</h2>'
    +'<p class="p">高中分班考试由各校自主安排，普遍采用"中考成绩×权重 + 入学摸底考×权重"综合排名分班。目前已汇总到的考试时间如下：</p>'
    +'<ul class="timeline">'+tl+'</ul>'
    +'<div class="tip">📌 标"官方"的来自各校新生报到须知，可信度最高；其余来自本地教育机构汇总，<b>建议以学校最新通知复核</b>。</div>'
    +'<h2 class="sec">三、三所一类校班型梯度</h2>'+sec3
    +'<h2 class="sec">四、给家长的 3 条提醒</h2>'
    +'<p class="p">1️⃣ 初一家长：不用焦虑"分班考"，均衡编班电脑随机、结果公平。<br>2️⃣ 高一家长：若目标校有分班考，假期别全放，适度复习初中核心知识（数学、英语、物理）。<br>3️⃣ 所有时间以官方为准，关注孩子录取通知书及学校官方公众号。</p>';
}
function artSchool(o){
  var m=findSchool(o.school);
  if(!m) return '<p class="p">未找到该校数据，换个关联学校或在情报站补充。</p>';
  var seg=segOf(m)==='high'?'高中':'初中';
  var h='<div class="lead"><b>'+esc(m.short||m.name)+'</b> 位于'+esc(m.district||'')+'，'+esc(m.nature||'')+'，属<b>'+(m.tier||'')+'</b>梯队，'+seg+'段（'+esc(m.type||'')+'）。下面是家长最想了解的硬信息。</div>';
  h+='<ul class="kv">';
  h+='<li><span class="k">行政区</span><span>'+esc(m.district||'-')+'</span></li>';
  h+='<li><span class="k">办学性质</span><span>'+esc(m.nature||'-')+'</span></li>';
  h+='<li><span class="k">学段类型</span><span>'+esc(m.type||'-')+'</span></li>';
  h+='<li><span class="k">层级</span><span>'+esc(m.tier||'-')+'</span></li>';
  if(m.dingxiang) h+='<li><span class="k">定向生校</span><span>是（可降分录取，详见中招政策）</span></li>';
  if(m.score2025!=null) h+='<li><span class="k">2025录取线</span><span>'+esc(m.score2025)+' 分</span></li>';
  if(m.group) h+='<li><span class="k">集团/举办方</span><span>'+esc(m.group)+'</span></li>';
  if(m.note) h+='<li><span class="k">备注</span><span>'+esc(m.note)+'</span></li>';
  h+='</ul>';
  if(m.events&&m.events.length){ h+='<h2 class="sec">近期动态</h2><ul class="kv">'+m.events.map(function(e){return '<li><span class="k">'+esc(e.date||'')+'</span><span>'+esc(e.title||'')+'</span></li>';}).join('')+'</ul>'; }
  h+='<h2 class="sec">近五年录取分数线</h2>'+schoolScoreHTML(m);
  if(segOf(m)==='high'){ h+='<h2 class="sec">班型与人数</h2>'+schoolClassHTML(m); }
  h+='<h2 class="sec">分班考时间</h2>'+schoolPlacementHTML(m);
  h+=schoolCampusHTML(m);
  h+='<h2 class="sec">学年校历（放假 / 考试）</h2>'+schoolCalendarHTML(m);
  var kt=(window.SCHOOL_CAL&&SCHOOL_CAL.keyClassTiers||[]).filter(function(t){return (m.short&&t.school.indexOf(m.short)>=0)||t.school===m.name;})[0];
  if(kt){h+='<h2 class="sec">班型梯度</h2><p class="p">'+(kt.tiers||[]).join(' &gt; ')+'</p><ul class="kv"><li><span class="k">分班依据</span><span>'+esc(kt.rule||'')+'</span></li></ul>';}
  h+='<div class="tip">💡 以上整理于 2026-08-06，数据来自教育局概况与公开名录；录取线 / 出口等随中招逐校核实后补充，<b>以学校官方与招考中心为准</b>。</div>';
  return h;
}
function artZhongkao(o){
  var u=(window.EXAM&&EXAM.zhongkao2026&&EXAM.zhongkao2026.unified)||[];
  var rows=u.map(function(r){return '<tr><td>'+esc(r.school)+'</td><td>'+esc(r.score)+'</td></tr>';}).join('');
  return '<div class="lead">2026太原中考总分 <b>'+(window.EXAM.zhongkao2026.total||'')+'</b> 分，最低控制线 <b>'+(window.EXAM.zhongkao2026.controlLine||'')+'</b> 分。以下为一类/二类校统招录取线（数据来自太原市招考中心）：</div>'
    +'<table class="tbl"><thead><tr><th>学校</th><th>2026录取线</th></tr></thead><tbody>'+rows+'</tbody></table>'
    +'<div class="tip">📌 定向生录取线≤统招线下50分且≥控制线；未用完计划二次定向，再转统招。具体以官方公告为准。</div>';
}
function artGaokao(o){
  var g=(window.EXAM&&EXAM.gaokao2025)||[];
  var cards=g.map(function(e){return '<h2 class="sec">'+esc(e.school)+'</h2><ul class="kv"><li><span class="k">清北</span><span>'+esc(e.qingbei||'-')+'</span></li><li><span class="k">C9</span><span>'+esc(e.c9||'-')+'</span></li><li><span class="k">985率</span><span>'+esc(e.rate985||'-')+'</span></li><li><span class="k">一本率</span><span>'+esc(e.rate1||'-')+'</span></li><li><span class="k">600+</span><span>'+esc(e.top600||'-')+'</span></li></ul><p class="p">'+esc(e.note||'')+'</p>';}).join('');
  return '<div class="lead">2025是山西新高考首届，下面是太原一类校公开出口数据（来自各校喜报，以官方为准）：</div>'+cards;
}
function artPolicy(o){
  var p=window.POLICY||{};
  var h='<div class="lead">太原家长必须搞懂的政策规则，一次讲清（整理自山西省招考中心/太原市教育局）。</div>';
  if(p.gaokao){h+='<h2 class="sec">高考：3+1+2</h2><p class="p">'+(p.gaokao.desc||'')+'</p><ul class="kv">'+(p.gaokao.keys||[]).map(function(k){return '<li><span class="k">·</span><span>'+esc(k)+'</span></li>';}).join('')+'</ul>';}
  if(p.zhongkao){h+='<h2 class="sec">中考：总分/录取</h2><ul class="kv">'
    +'<li><span class="k">总分</span><span>'+esc(p.zhongkao.total2026||'')+' 分（2025为'+esc(p.zhongkao.total2025||'')+'）</span></li>'
    +'<li><span class="k">构成</span><span>'+esc(p.zhongkao.breakdown2026||'')+'</span></li>'
    +'<li><span class="k">控制线</span><span>'+esc(p.zhongkao.controlLine2026||'')+'</span></li>'
    +'<li><span class="k">录取</span><span>'+esc(p.zhongkao.admitMode||'')+'</span></li>'
    +'<li><span class="k">定向生</span><span>'+esc(p.zhongkao.dxs||'')+'</span></li>'
    +'<li><span class="k">特长生</span><span>'+esc(p.zhongkao.tcStudent||'')+'</span></li></ul>';}
  if(p.zhaosheng){h+='<h2 class="sec">招生：公民同招/摇号</h2><ul class="kv"><li><span class="k">原则</span><span>'+esc(p.zhaosheng.citizenSameRecruit||'')+'</span></li><li><span class="k">民办摇号</span><span>'+esc(p.zhaosheng.miniShakeTime||'')+'</span></li><li><span class="k">转公校</span><span>'+esc(p.zhaosheng.transformedPublic||'')+'</span></li></ul>';}
  h+='<div class="tip">⚠️ 政策年度可能微调，最终以山西省招考中心、太原市教育局官方发布为准。</div>';
  return h;
}
function artCustom(o){
  var th=o.theme||'太原教育最新动态';
  var feed=(window.HOT&&HOT.events)||[];
  var ev=feed.length?feed[0]:null;
  var h='<div class="lead">'+(ev?esc(ev.hook||th):th)+'——今天用一条视频/一篇推文说清楚。</div>';
  if(ev){h+='<h2 class="sec">事件速览</h2><ul class="kv"><li><span class="k">事件</span><span>'+esc(ev.title||'')+'</span></li><li><span class="k">角度</span><span>'+esc(ev.angle||'')+'</span></li><li><span class="k">数据</span><span>'+esc(ev.data||'')+'</span></li><li><span class="k">来源</span><span>'+esc(ev.src||'')+'</span></li></ul>';}
  h+='<p class="p">'+esc(th)+'这件事，家长最容易踩的坑是只看表面、不看规则。下面把关键点拆开讲。</p>';
  h+='<h2 class="sec">关键提醒</h2><p class="p">① 先弄清政策与时间点；② 结合孩子实际定位；③ 提前准备材料与路径。具体可评论区扣「资料」领取整理好的要点。</p>';
  return h;
}
function defaultTitle(o){
  if(o.preset==='opening') return '太原初一、高一分班考试时间，最全一版汇总！家长请收好';
  if(o.preset==='school') return (o.school||'重点校')+' 深度解读：分数线·班型·怎么进好班';
  if(o.preset==='zhongkao') return '2026太原中考录取线最全汇总（一类/二类校）';
  if(o.preset==='gaokao') return '2025太原一类校高考出口盘点：清北/985/一本率';
  if(o.preset==='policy') return '太原家长必懂的升学政策：中考+高考+招生';
  return o.theme||'太原教育最新动态';
}
function buildArticleBody(o){
  if(o.preset==='opening') return artOpening(o);
  if(o.preset==='school') return artSchool(o);
  if(o.preset==='zhongkao') return artZhongkao(o);
  if(o.preset==='gaokao') return artGaokao(o);
  if(o.preset==='policy') return artPolicy(o);
  return artCustom(o);
}
function buildArticleDoc(o){
  var cover=window.COPY?COPY.cover:{};
  var title=o.title||defaultTitle(o);
  var sub=(o.preset==='opening'?'82所高中 · 分班考时间最全汇总':o.preset==='school'?'分数线·班型·备考建议':o.preset==='zhongkao'?'附最低控制线':o.preset==='gaokao'?'附各校出口数据':o.preset==='policy'?'中考+高考+招生':(o.theme||'本地教育资讯'));
  var nm=o.zone==='A'?'老闫':'张姐';
  var body=buildArticleBody(o);
  var doc='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>公众号推文预览 · '+esc(title)+'</title><style>'+ARTICLE_CSS+'</style></head><body><div class="phone">'
    +mpHeadHTML(cover)+coverHTML(cover,title,sub)
    +'<div class="article"><div class="title">'+esc(title)+'</div><div class="byline">'+(cover.mpName||'太原升学指南')+'　·　'+dateStr()+'　·　数据来自教育局/学校官方公开信息</div>'+body+endHTML()+'</div></div></body></html>';
  return doc;
}
function renderCopy(){
  var hs=allSchoolList();
  var opt='<option value="">（不指定，按主题生成）</option>'+hs.map(function(s){return '<option value="'+esc(s.name)+'">'+esc(s.short||s.name)+'</option>';}).join('');
  var h='<div class="banner"><b>文案中心 · 双号共用</b><br>一键生成「朋友圈文案」与「公众号推文」，内容直接调用情报底座（学校/政策/考试/开学轴）真实数据，推文可<b>导出成 .html 文件</b>直接进公众号编辑器。</div>';
  h+='<div class="card" style="margin-top:12px"><div class="card-h">📱 朋友圈文案</div><div class="row form2" style="align-items:end">'
    +'<label class="fld"><span>账号</span><select id="cpZone"><option value="B">张姐规划 B</option><option value="A">老闫物理 A</option></select></label>'
    +'<label class="fld"><span>主题</span><input id="cpTheme" placeholder="如：开学分班考 / 物理入门"></label>'
    +'<label class="fld"><span>关联学校</span><select id="cpSchool">'+opt+'</select></label>'
    +'<button class="btn" onclick="cpGenMoment()">⚡ 生成文案</button></div>'
    +'<div id="cpMomentOut" style="margin-top:10px"></div></div>';
  h+='<div class="card" style="margin-top:14px"><div class="card-h">📰 公众号推文（手机预览版，可导出）</div><div class="row form2" style="align-items:end">'
    +'<label class="fld"><span>账号</span><select id="cpZone2"><option value="B">张姐规划 B</option><option value="A">老闫物理 A</option></select></label>'
    +'<label class="fld"><span>推文类型</span><select id="cpPreset"><option value="opening">开学分班考汇总</option><option value="school">重点校深度解读</option><option value="zhongkao">中考分数线</option><option value="gaokao">高考出口成绩</option><option value="policy">政策解读</option><option value="custom">自定义主题</option></select></label>'
    +'<label class="fld"><span>关联学校</span><select id="cpSchool2">'+opt+'</select></label>'
    +'<label class="fld"><span>自定义标题(可选)</span><input id="cpTitle" placeholder="留空自动生成"></label>'
    +'<button class="btn" onclick="cpGenArticle()">⚡ 生成推文</button></div>'
    +'<div id="cpArticleOut" style="margin-top:12px"></div></div>';
  $('#copy').innerHTML=h;
}
function cpGenMoment(){
  var z=$('#cpZone').value, th=$('#cpTheme').value.trim(), sc=$('#cpSchool').value;
  CP_MOMENT=genMoment(z,th,sc);
  var html=CP_MOMENT.map(function(c,i){return '<div class="box" style="white-space:pre-wrap;line-height:1.7;font-size:14px;margin-bottom:10px">'+esc(c)+'<div style="margin-top:8px"><button class="btn s" onclick="cpCopyMoment('+i+')">复制</button></div></div>';}).join('');
  $('#cpMomentOut').innerHTML='<div style="font-size:13px;color:#888;margin-bottom:6px">生成 '+CP_MOMENT.length+' 条朋友圈文案：</div>'+html;
  wbToast('已生成朋友圈文案');
}
function cpCopyMoment(i){ if(CP_MOMENT[i]!=null){ copyText(CP_MOMENT[i]); wbToast('已复制'); } }
function cpGenArticle(){
  var z=$('#cpZone2').value, p=$('#cpPreset').value, sc=$('#cpSchool2').value, ti=$('#cpTitle').value.trim();
  CP_ARTICLE=buildArticleDoc({zone:z,preset:p,school:sc,title:ti,theme:ti});
  var fname='公众号推文_'+(ti||p)+'_'+dateStr()+'.html';
  var prev='<iframe srcdoc="'+escAttr(CP_ARTICLE)+'" style="width:100%;max-width:430px;height:640px;border:1px solid #eee;border-radius:12px;display:block"></iframe>';
  prev+='<div class="row" style="margin-top:10px;flex-wrap:wrap">'
    +'<button class="btn" onclick="cpDownloadArticle()">⬇ 导出 .html</button>'
    +'<button class="btn o" onclick="cpCopyArticleText()">📋 复制全文</button>'
    +'<button class="btn s" onclick="cpSaveArticleDraft()">📥 存成稿箱</button></div>';
  prev+='<div class="muted" style="font-size:12px;margin-top:6px">导出后可双击用浏览器打开预览，或把正文复制到公众号编辑器（排版已按公众号手机版还原）。</div>';
  $('#cpArticleOut').innerHTML=prev;
  wbToast('已生成推文，可预览/导出');
}
function cpDownloadArticle(){ if(CP_ARTICLE) download(CP_ARTICLE, '公众号推文_'+dateStr()+'.html'); }
function cpCopyArticleText(){ if(CP_ARTICLE){ var t=CP_ARTICLE.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); copyText(t); wbToast('已复制全文'); } }
function cpSaveArticleDraft(){ if(CP_ARTICLE){ var t=CP_ARTICLE.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); pushDraft('公众号推文 '+dateStr(), t, '公众号'); wbToast('已存成稿箱'); } }

/* ===== 朋友圈（需求2：亿领教育工作室每日文案 + 配图） ===== */
var MOMENT_OUT = [];
function renderMoment(){
  let h='<div class="banner"><b>朋友圈 · 亿领教育工作室每日文案 + 配图</b><br>选账号 + 主题（积极向上的教育理念 / 太原最近教育动态）→ 一键出 3-5 条可直接发的朋友圈文案，每条配「配图方案」（生图提示词可直接复制去豆包/即梦生图）。不露脸、合规。</div>';
  h+='<div class="card" style="margin-top:12px"><div class="card-h">📱 生成今日朋友圈</div><div class="row form2" style="align-items:end">'
    +'<label class="fld"><span>账号</span><select id="moZone"><option value="B">张姐规划 B</option><option value="A">老闫物理 A</option></select></label>'
    +'<label class="fld"><span>主题</span><select id="moTheme"><option value="education">积极向上的教育理念</option><option value="taiyuan">太原最近教育动态</option></select></label>'
    +'<button class="btn" onclick="moGen()">⚡ 生成文案</button></div>'
    +'<div id="moOut" style="margin-top:10px"></div></div>';
  h+='<div class="card" style="margin-top:14px"><div class="card-h">🖼 配图样张（已生成的 AI 配图，可直接取用）</div><div id="moGallery" class="grid g3"></div><div class="muted" style="font-size:12px;margin-top:8px">没有样张？点上方「生成文案」后，把生图提示词发我（AI），我帮你生成一批按主题的配图。</div></div>';
  $('#moment').innerHTML=h;
  renderMomentGallery();
}
function moGen(){
  var z=$('#moZone').value, th=$('#moTheme').value;
  MOMENT_OUT = genMomentCopy(z, th);
  var html = MOMENT_OUT.map(function(c,i){
    return '<div class="box" style="white-space:pre-wrap;line-height:1.7;font-size:14px;margin-bottom:12px;border-left:3px solid #0ea5e9;padding-left:10px">'
      + '<div style="font-weight:600;color:#1e3a8a;margin-bottom:4px">文案 #'+(i+1)+'</div>'
      + esc(c.text)
      + '<div style="margin-top:8px"><button class="btn s" onclick="moCopyText('+i+')">复制文案</button></div>'
      + '<div style="margin-top:10px;background:#f4f7fb;border-radius:8px;padding:8px;font-size:13px">'+esc(c.img)+'</div>'
      + '<div style="margin-top:6px"><button class="btn s o" onclick="moCopyImg('+i+')">复制生图提示词</button></div>'
      + '</div>';
  }).join('');
  $('#moOut').innerHTML='<div style="font-size:13px;color:#888;margin-bottom:6px">已生成 '+MOMENT_OUT.length+' 条朋友圈文案（每条含配图方案）：</div>'+html;
  wbToast('已生成朋友圈文案');
}
function moCopyText(i){ if(MOMENT_OUT[i]){ copyText(MOMENT_OUT[i].text); wbToast('已复制文案'); } }
function moCopyImg(i){ if(MOMENT_OUT[i]){ copyText(MOMENT_OUT[i].img); wbToast('已复制生图提示词'); } }
function renderMomentGallery(){
  var box=document.getElementById('moGallery'); if(!box) return;
  var imgs = (window.MOMENT_GALLERY||[]);
  if(!imgs.length){ box.innerHTML='<p class="muted">暂无样张（AI 配图生成后将自动出现在这里）。</p>'; return; }
  box.innerHTML=imgs.map(function(im,idx){
    return '<div class="card">'
      + '<img src="'+esc(im.src)+'" style="width:100%;border-radius:8px" alt="'+esc(im.label||'')+'">'
      + '<div class="muted" style="font-size:12px;margin-top:6px">'+esc(im.label||'')+'</div>'
      + (im.caption?'<div style="font-weight:600;margin-top:4px;color:#1f2d3d">'+esc(im.caption)+'</div>':'')
      + (im.copy?'<div style="font-size:13px;margin-top:6px;line-height:1.6;white-space:pre-wrap;color:#3a4a5a">'+esc(im.copy)+'</div>':'')
      + '<div style="margin-top:8px"><button class="btn s" onclick="moCopyGallery('+idx+')">复制配文</button>'+favBtn('moment','mg_'+idx, im.label||'朋友圈配图')+'</div>'
      + '</div>';
  }).join('');
}
function moCopyGallery(i){
  var g=window.MOMENT_GALLERY||[];
  if(g[i]&&g[i].copy){ copyText(g[i].copy); wbToast('已复制配文'); }
}
function genMomentCopy(zone, theme){
  zone = zone||'B';
  var M = window.MOMENT || {beliefs:[],taiyuanHooks:[],landing:{},img:{}};
  var intro = zone==='A' ? '我是老闫，在太原教了10年初高中物理，专治"听懂了不会做"。' : '我是张姐，晋源区亿领教育主理人。';
  var pool = theme==='taiyuan' ? (M.taiyuanHooks||[]) : (M.beliefs||[]);
  if(!pool.length) pool = M.beliefs||[];
  var landings = (M.landing&&M.landing[zone]) || (M.landing&&M.landing.B) || [];
  var imgs = (M.img&&M.img[theme]) || (M.img&&M.img.education) || [];
  var N = Math.min(4, pool.length);
  var out=[];
  for(var i=0;i<N;i++){
    var hook=pool[i];
    var land=landings[i % landings.length];
    var imgtxt=imgs.length?imgs[i % imgs.length]:'';
    var text='';
    text += (theme==='taiyuan'?'【太原教育动态】':'【教育理念】') + hook + '\n\n';
    text += intro + (theme==='taiyuan'?' 这条动态，太原家长一定用得上——':'') + '\n\n';
    text += (theme==='taiyuan'
      ? '提醒一句：这类信息每年都有家长漏看，认准官方通知、别信自媒体汇总，提前把节奏排好，孩子少走弯路。'
      : '教育这件事，慢就是快。把基础打牢、把习惯养好，后面的路会越走越宽。') + '\n\n';
    text += (land||'评论区扣「规划」，我把资料发你。');
    var imgBlock='【配图方案】\n图片主题：'+(theme==='taiyuan'?'太原教育动态信息卡':'积极向上的教育理念插画')+'\n生图提示词（复制去豆包/即梦/Midjourney）：\n'+imgtxt;
    out.push({text:text, img:imgBlock});
  }
  return out;
}

/* ===== 初始化 ===== */
function init(){
  $('#today').innerHTML = '📅 '+esc(TODAY.date)+' · 今日：'+(TODAY.recs[0]?esc(TODAY.recs[0].title):'');
  $$('.tab').forEach(t=>t.addEventListener('click', ()=>switchTab(t.dataset.v)));
  renderHome();
  renderZoneA();
  renderPolitics();
  renderEduplan();
  renderFactory();
  renderLive();
  renderSchool();
  renderCollect();
  renderCopy();
  renderMoment();
  renderHub();
  renderFav(); updateFavBadge();
  switchTab('home');
  bindAddHot();
  bindAddSchool();
  var fab=document.getElementById('draftFab'); if(fab) fab.onclick=openDraftPanel;
  var dcl=document.getElementById('draftClose'); if(dcl) dcl.onclick=closeDraftPanel;
  var dclr=document.getElementById('draftClear'); if(dclr) dclr.onclick=clearDrafts;
  var dmg=document.getElementById('draftMerge'); if(dmg) dmg.onclick=mergeDrafts;
  updateDraftBadge();
}
window.genForm=genForm; window.fillDemo=fillDemo; window.showOut=showOut; window.copy=copy; window.download=download;
window.genTopic=genTopic; window.genToday=genToday; window.genTopicFromHot=genTopicFromHot;
window.genFormula=genFormula; window.checkSensitive=checkSensitive; window.judgeAdmit=judgeAdmit;
window.reviewLive=reviewLive; window.genSoftLead=genSoftLead; window.genBatchPlan=genBatchPlan;
window.genLiveScript=genLiveScript; window.genLiveFromTopic=genLiveFromTopic; window.buildLiveVersion=buildLiveVersion; window.genPrep=genPrep; window.syncLiveMode=syncLiveMode;
window.showLive=showLive; window.pushDraft=pushDraft; window.delDraft=delDraft; window.clearDrafts=clearDrafts; window.mergeDrafts=mergeDrafts; window.openDraftPanel=openDraftPanel; window.closeDraftPanel=closeDraftPanel; window.loadDrafts=loadDrafts; window.renderDraftList=renderDraftList; window.updateDraftBadge=updateDraftBadge;
window.genShortFromHot=genShortFromHot; window.genLiveFromHot=genLiveFromHot; window.genLiveMaterial=genLiveMaterial; window.refreshHot=refreshHot;
window.refreshMy=refreshMy; window.openAddHot=openAddHot; window.closeAddHot=closeAddHot; window.delMyEvent=delMyEvent; window.syncMyHot=syncMyHot; window.addMyEvent=addMyEvent; window.aiEnrichOne=aiEnrichOne; window.aiEnrichAll=aiEnrichAll;
window.renderSchool=renderSchool; window.schoolZoneHTML=schoolZoneHTML; window.openAddSchool=openAddSchool; window.closeAddSchool=closeAddSchool; window.delSchoolEvent=delSchoolEvent; window.syncSchoolHot=syncSchoolHot; window.addSchoolEvent=addSchoolEvent; window.genShortFromSchool=genShortFromSchool; window.genLiveFromSchool=genLiveFromSchool; window.refreshSchool=refreshSchool;
window.renderCollect=renderCollect; window.schoolCompleteness=schoolCompleteness; window.collectListHTML=collectListHTML; window.renderCollectList=renderCollectList; window.genSchoolBrief=genSchoolBrief; window.aiCollectOne=aiCollectOne; window.aiCollectBatch=aiCollectBatch; window.openSchoolFill=openSchoolFill; window.closeSchoolFill=closeSchoolFill; window.renderEduplan=renderEduplan; window.renderLive=renderLive;
window.schoolSub=schoolSub; window.renderSchoolOverview=renderSchoolOverview; window.renderKeySchools=renderKeySchools; window.renderOpeningCalendar=renderOpeningCalendar; window.renderSchoolMap=renderSchoolMap; window.schoolDetail=schoolDetail; window.schoolDetailByName=schoolDetailByName; window.schoolDetailToTopic=schoolDetailToTopic; window.soView=soView; window.soRender=soRender; window.soRenderBody=soRenderBody; window.schoolCard=schoolCard; window.groupCards=groupCards; window.allSchools=allSchools; window.segOf=segOf; window.uniq=uniq; window.findSchool=findSchool; window.artSchool=artSchool; window.closeSchoolDetail=closeSchoolDetail; window.showOverlay=showOverlay; window.schoolScoreHTML=schoolScoreHTML; window.schoolClassHTML=schoolClassHTML; window.schoolPlacementHTML=schoolPlacementHTML; window.schoolCalendarHTML=schoolCalendarHTML; window.schoolCampusHTML=schoolCampusHTML; window.renderRival=renderRival; window.renderParent=renderParent;
window.reviewLiveNew=reviewLiveNew; window.liveFilterQA=liveFilterQA;
window.renderCopy=renderCopy; window.cpGenMoment=cpGenMoment; window.cpCopyMoment=cpCopyMoment; window.cpGenArticle=cpGenArticle; window.cpDownloadArticle=cpDownloadArticle; window.cpCopyArticleText=cpCopyArticleText; window.cpSaveArticleDraft=cpSaveArticleDraft; window.genMoment=genMoment; window.buildArticleDoc=buildArticleDoc;
window.renderMoment=renderMoment; window.moGen=moGen; window.moCopyText=moCopyText; window.moCopyImg=moCopyImg; window.genMomentCopy=genMomentCopy; window.renderMomentGallery=renderMomentGallery; window.moCopyGallery=moCopyGallery; window.moCopyIter=moCopyIter; window.renderIterate=renderIterate; window.renderHub=renderHub; window.renderZoneA=renderZoneA; window.renderPolitics=renderPolitics;
window.renderHome=renderHome;
window.renderTier1=renderTier1; window.genTier1=genTier1; window.tier1Resolve=tier1Resolve;

/* ===== 密码锁 ===== */
var APP_PASSCODE='324'; // 访问密码：改这一个数字即可（2026-08-06 起用 324）
function setupLock(){
  var ov=document.getElementById('lockOverlay');
  var inp=document.getElementById('lockInput');
  var err=document.getElementById('lockErr');
  var btn=document.getElementById('lockBtn');
  var box=document.querySelector('.lock-box');
  function tryUnlock(){
    if(inp.value.trim()===APP_PASSCODE){
      try{localStorage.setItem('wb_unlock','1');}catch(e){}
      ov.classList.add('hide'); init();
    }else{
      err.textContent='密码不对，再试试';
      box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
      inp.value=''; inp.focus();
    }
  }
  btn.addEventListener('click', tryUnlock);
  inp.addEventListener('keydown', function(e){ if(e.key==='Enter') tryUnlock(); });
  var rb=document.getElementById('relockBtn');
  if(rb) rb.addEventListener('click', function(){
    try{localStorage.removeItem('wb_unlock');}catch(e){}
    location.reload();
  });
  setTimeout(function(){ try{inp.focus();}catch(e){} }, 60);
}
/* 云端/本地实时拉取最新今日Feed，覆盖部署快照（绕过浏览器缓存） */
function loadLiveFeed(cb){
  if(window.TODAY_FEED && window.TODAY_FEED.recs && window.TODAY_FEED.recs.length){ cb&&cb(window.TODAY_FEED); return; }
  try{
    fetch('assets/today-feed.js',{cache:'no-store'}).then(function(r){return r.text();}).then(function(txt){
      try{ var obj=new Function(txt+'\nreturn window.TODAY_FEED;')(); if(obj&&obj.recs&&obj.recs.length){ window.TODAY_FEED=obj; cb&&cb(obj); } else cb&&cb(null); }
      catch(e){ cb&&cb(null); }
    }).catch(function(){ cb&&cb(null); });
  }catch(e){ cb&&cb(null); }
}
function refreshFeed(){
  loadLiveFeed(function(feed){
    if(feed){ TODAY=feed;
      try{ document.getElementById('today').innerHTML='📅 '+esc(feed.date)+' · 今日：'+(feed.recs[0]?esc(feed.recs[0].title):''); }catch(e){}
      try{ renderHome(); }catch(e){}
    }
  });
}
/* ===== 实时时事联动（window.HOT，每日自动化更新） ===== */
function loadHotEvents(cb){
  if(window.HOT && window.HOT.events && window.HOT.events.length){ cb&&cb(window.HOT); return; }
  try{
    fetch('assets/hot-events.js',{cache:'no-store'}).then(function(r){return r.text();}).then(function(txt){
      try{ var obj=new Function(txt+'\nreturn window.HOT;')(); if(obj&&obj.events&&obj.events.length){ window.HOT=obj; cb&&cb(obj); } else cb&&cb(null); }
      catch(e){ cb&&cb(null); }
    }).catch(function(){ cb&&cb(null); });
  }catch(e){ cb&&cb(null); }
}
function refreshHot(){
  loadHotEvents(function(fb){
    if(fb){ HOT=fb;
      try{ renderHome(); }catch(e){}
      try{ renderZoneA(); }catch(e){}
      try{ renderPolitics(); }catch(e){}
      try{ renderEduplan(); }catch(e){}
      try{ renderLive(); }catch(e){}
      try{ renderHub(); }catch(e){}
    }
  });
}
function loadMyEvents(cb){
  if(window.MY_HOT && window.MY_HOT.events){ cb&&cb(window.MY_HOT); return; }
  try{
    fetch('assets/my-events.js',{cache:'no-store'}).then(function(r){return r.text();}).then(function(txt){
      try{ var obj=new Function(txt+'\nreturn window.MY_HOT;')(); if(obj&&obj.events){ window.MY_HOT=obj; MY=obj; cb&&cb(obj); } else cb&&cb(null); }
      catch(e){ cb&&cb(null); }
    }).catch(function(){ cb&&cb(null); });
  }catch(e){ cb&&cb(null); }
}
function refreshMy(){
  loadMyEvents(function(fb){ if(fb){ rebuildAll(); try{renderHome();}catch(e){} try{renderZoneA();}catch(e){} try{renderPolitics();}catch(e){} try{renderEduplan();}catch(e){} try{renderLive();}catch(e){} try{renderHub();}catch(e){} } });
}
function wbToast(m){ var t=document.getElementById('toast'); if(!t) return; t.textContent=m; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2200); }
function copyText(t){ try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(t); return; } }catch(e){} var ta=document.createElement('textarea'); ta.value=t; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');}catch(_){} document.body.removeChild(ta); }
function openAddHot(){ var ov=document.getElementById('addHotOverlay'); if(ov) ov.classList.remove('hide'); }
function closeAddHot(){ var ov=document.getElementById('addHotOverlay'); if(ov) ov.classList.add('hide'); }
function addMyEvent(){
  var g=function(k){ var el=document.querySelector('#addHotForm [data-k="'+k+'"]'); return el?el.value.trim():''; };
  var title=g('ah-title'); if(!title){ wbToast('请填事件名'); return; }
  var zone=g('ah-zone')||'B', pri=g('ah-pri')||'P1';
  var angle=g('ah-angle'), data=g('ah-data'), hook=g('ah-hook'), topic=g('ah-topic'), live=g('ah-live'), src=g('ah-src'), sol=g('ah-solution'), dep=g('ah-depth');
  var need=!(angle&&data&&hook&&topic&&live);
  LM.push({ id:'m'+Date.now(), pri:pri, zone:zone, title:title, angle:angle, data:data, hook:hook, topic:topic||title, liveTheme:live||topic||title, src:src||'我刷到的', solution:sol, depth:dep, needEnrich:need });
  saveLocalMy(); closeAddHot();
  try{renderHome();}catch(e){} try{renderZoneA();}catch(e){} try{renderPolitics();}catch(e){} try{renderEduplan();}catch(e){} try{renderLive();}catch(e){}
  wbToast(need?'已存本机，点「🤖 AI补全」发我即可自动补齐':'已存本机，点热点即可出稿');
}
function delMyEvent(id){ LM=LM.filter(function(e){ return e.id!==id; }); saveLocalMy(); try{renderHome();}catch(e){} try{renderZoneA();}catch(e){} try{renderPolitics();}catch(e){} try{renderEduplan();}catch(e){} try{renderLive();}catch(e){} wbToast('已删除'); }
function syncMyHot(){
  if(!LM.length){ wbToast('本机还没有手动热点'); return; }
  var code='window.MY_HOT = { date:\'共享库\', note:\'手动共享热点库·由主理人对话同步写入\', events: '+JSON.stringify(LM)+' };\n';
  copyText(code);
  wbToast('已复制共享库代码，发给我（AI）即可让爱人看到');
}
function bindAddHot(){
  var ov=document.getElementById('addHotOverlay'); if(!ov) return;
  var c=document.getElementById('addHotCancel'), s=document.getElementById('addHotSave'), y=document.getElementById('addHotSync');
  if(c) c.onclick=closeAddHot; if(s) s.onclick=addMyEvent; if(y) y.onclick=syncMyHot;
  ov.addEventListener('click', function(e){ if(e.target===ov) closeAddHot(); });
}
function hotZoneHTML(zoneFilter){
  rebuildAll();
  const evs=ALL.filter(function(e){ return zoneFilter==='AB' ? true : (e.zone===zoneFilter || e.zone==='AB'); });
  let h='<h2 class="sec">🔥 实时时事（点热点即出稿）</h2>';
  h+='<div class="row" style="margin:-2px 0 10px;align-items:center;gap:10px">'
    +'<button class="btn s" onclick="openAddHot()">➕ 我刷到的热点</button>'
    +'<button class="btn s o" onclick="aiEnrichAll()">🤖 AI补全待补</button>'
    +'<span class="muted" style="font-size:12px">只填事件名，剩下的发我（AI）搜索补齐</span></div>';
  if(!evs.length){ h+='<p class="muted">暂无时事。点上面按钮，把刷到的热点加进来。</p>'; return h; }
  h+='<div class="grid g2">';
  evs.forEach(function(ev){
    const idx=ALL.indexOf(ev);
    const ctx = (zoneFilter==='AB') ? (ev.zone==='A'?'A':(ev.zone==='B'?'B':'B')) : zoneFilter;
    const pc = ev.pri==='P0'?'p0':(ev.pri==='P1'?'p1':'p2');
    const zc = ev.zone==='A'?'badge zoneA':'badge zoneB';
    const zlabel = ev.zone==='A'?'老闫物理':(ev.zone==='B'?'张姐规划':'双号');
    const src = ev._src==='mine'?'<span class="badge mine">我的</span>':(ev._src==='share'?'<span class="badge share">共享</span>':'<span class="badge auto">自动</span>');
    const del = ev._src==='mine' ? '<button class="btn s x" onclick="delMyEvent(\''+ev.id+'\')">✕删</button><button class="btn s o" onclick="aiEnrichOne(\''+ev.id+'\')">🤖补全</button>' : '';
    h+='<div class="card hot"><div class="arow"><span class="'+zc+'">'+zlabel+'</span>'
      +'<span class="pri '+pc+'">'+ev.pri+'</span>'+src+'</div>'
      +'<div class="at">'+esc(ev.title)+'</div>'
      +'<div class="aw">'+esc(ev.data)+'</div>'
      +'<div class="row">'
      +'<button class="btn s" onclick="genShortFromHot('+idx+',\''+ctx+'\')">⚡ 短视频</button>'
      +'<button class="btn s o" onclick="genLiveFromHot('+idx+')">📺 直播</button>'
      + favBtn('hot','ev_'+ev.id, ev.title)
      +del+'</div></div>';
  });
  h+='</div>';
  return h;
}
function genTopicFromHot(ev, zone){
  const obj={ title:ev.topic, hook:ev.hook, body:ev.data, angle:ev.angle, depth:ev.depth, solution:ev.solution, fmt:(zone==='A'?'手写板':'图文轮播'), dur:(zone==='A'?'50s':'55s'), ck:(zone==='A'?'物理':'位次'), src:ev.src };
  return genTopic(obj, zone);
}
function genShortFromHot(i, ctx){
  const ev=allEvents()[i]; if(!ev) return;
  const zone = ev.zone==='AB' ? ctx : ev.zone;
  showOut(genTopicFromHot(ev, zone));
}
function genLiveFromHot(i){
  const ev=allEvents()[i]; if(!ev) return;
  const set=(k,v)=>{ const el=document.querySelector('#live-gen [data-k="'+k+'"]'); if(el) el.value=v; };
  set('lg-acc', ev.zone==='A'?'A':'B'); set('lg-theme', ev.liveTheme||ev.topic); set('lg-mins','60'); set('lg-goal','引流到私域'); set('lg-fudai', LIVE.material.fudai.prize); set('lg-solution', ev.solution||''); set('lg-depth', ev.depth||'');
  syncLiveMode();
  switchTab('live'); genLiveScript();
}
function pickShots(theme, zone){
  if(!LIVE.shotMap) return LIVE.shotDefault||[];
  for(var i=0;i<LIVE.shotMap.length;i++){ var m=LIVE.shotMap[i]; for(var j=0;j<m.kw.length;j++){ if(theme.indexOf(m.kw[j])>=0) return m.items; } }
  return LIVE.shotDefault||[];
}
function buildCard(theme, zone){
  if(zone==='A'){
    return '【物理高频考点速记卡 · '+theme+'】\n· 本讲模型：_____\n· 3个必考公式：_____\n· 易错点：_____\n· 1道典型题：_____\n· 获取完整卡：评论区扣「物理」';
  }
  return '【山西志愿填报数据卡 · '+theme+'】\n· 你的省排名（位次）：_____\n· 对应可冲院校：_____\n· 对应稳妥院校：_____\n· 保底院校：_____\n· 近3年录取最低位次：_____\n· 获取完整表：评论区扣「位次」';
}
function genLiveMaterial(){
  const root=document.getElementById('live-gen'); if(!root) return;
  const acc=root.querySelector('[data-k="lg-acc"]'); const themeEl=root.querySelector('[data-k="lg-theme"]'); const fudaiEl=root.querySelector('[data-k="lg-fudai"]');
  const zone=(acc&&acc.value==='A')?'A':'B';
  const theme=(themeEl&&themeEl.value.trim())?themeEl.value.trim():'';
  const fudai=(fudaiEl&&fudaiEl.value.trim())?fudaiEl.value.trim():(zone==='B'?'《山西院校近3年录取位次表》':'《物理高频考点速记卡》');
  if(!theme){ wbToast('先在上方填直播主题，或点「直播选题库」选一条'); return; }
  const shots=pickShots(theme, zone);
  const card=buildCard(theme, zone);
  const method = zone==='B' ? '冲稳保 / 位次定位 / 选科决策' : '模型拆解 / 五步法';
  let out='【开播物料包 · '+(zone==='A'?'老闫物理 A':'张姐规划 B')+' ｜ 主题：'+theme+'】\n\n';
  out+='【一、PPT 分镜（7页，全部围绕「'+theme+'」）】\n';
  out+='· 封面页：'+theme+' ｜ 讲师 '+(zone==='A'?'老闫物理':'张姐·亿领教育')+' ｜ 本场福利：'+fudai+'\n';
  out+='· 痛点页：家长最焦虑的1个与「'+theme+'」相关的问题（大字号 + 1句扎心话）\n';
  out+='· 方法页：核心方法论（'+method+'，用三栏或流程图）\n';
  out+='· 数据页：放「'+theme+'」相关的官方数据截图，标红重点\n';
  out+='· 案例页：1个真实考生 / 学生取舍案例（隐去隐私）\n';
  out+='· 福利页：福袋口令 + '+fudai+' 领取方式\n';
  out+='· 结尾页：下场预告 + 关注引导\n\n';
  out+='【二、志愿卡 / 资料卡文字（直接发或打印，已代入主题）】\n'+card+'\n\n';
  out+='【三、数据截图清单（开播前备齐，围绕「'+theme+'」）】\n'+shots.map(function(x){return '□ '+x;}).join('\n')+'\n\n';
  out+='【四、福袋完整设置】\n'
    +'· 奖品：'+fudai+'\n'
    +'· 口令：'+(zone==='B'?'666 / 位次':'物理')+'\n'
    +'· 倒计时：开播后5分钟发，倒计时3分钟\n'
    +'· 发放：下播前私信 / 粉丝群发放，引导先点关注 + 加群\n'
    +'· 引流：想深度了解「'+theme+'」的扣「诊断」，进粉丝群领参与方式（不裸奔「加我微信」）\n\n';
  out+='【五、本场钩子话术】\n· 开场：'+theme+'——'+(zone==='B'?'报志愿最怕信息差，今天把压箱底方法讲透':'物理提分不靠刷题量，靠把模型吃透，今天教你')+'\n\n';
  out+='【六、相关高频QA（按账号挑3条，直播前过一遍）】\n'+LIVE.qa.filter(function(q){return q.acc===zone;}).slice(0,3).map(function(q){return 'Q：'+q.q+'\nA：'+q.a;}).join('\n\n')+'\n';
  showLive(out, '开播物料包 · '+theme, '直播物料');
}
function enrichCodeFor(items){
  var lines=items.map(function(e){ return '- 事件：'+e.title+' ｜ 账号：'+(e.zone==='A'?'老闫物理A':'张姐规划B')+(e.src?' ｜ 来源：'+e.src:''); });
  return '【请帮我联网搜索并补全以下太原教育IP热点（用于工作台共享库 my-events.js）】\n'+lines.join('\n')+'\n\n对每个事件，请搜索补全：切入角度(angle)、关键数据(data)、开场钩子(hook≤30字)、短视频选题(topic)、直播主题(liveTheme)、来源(src)。\n返回可直接写入 assets/my-events.js 的 window.MY_HOT 完整代码（events 数组，字段：id/pri/zone/title/angle/data/hook/topic/liveTheme/src，去掉 needEnrich 标记）。';
}
function aiEnrichOne(id){
  var e=LM.filter(function(x){return x.id===id;})[0]; if(!e){ wbToast('没找到该条'); return; }
  copyText(enrichCodeFor([e])); wbToast('已复制补全请求，发到对话里给我即可');
}
function aiEnrichAll(){
  var pend=LM.filter(function(x){return x.needEnrich;}); if(!pend.length){ wbToast('没有待补全的热点'); return; }
  copyText(enrichCodeFor(pend)); wbToast('已复制全部待补全请求，发我即可');
}

/* ===== 太原/山西 教育情报站（学校 + 教研中心动态） ===== */
function loadSchoolShare(cb){
  if(window.SCHOOL_SHARE && window.SCHOOL_SHARE.items){ cb&&cb(window.SCHOOL_SHARE); return; }
  try{
    fetch('assets/school-shared.js',{cache:'no-store'}).then(function(r){return r.text();}).then(function(txt){
      try{ var obj=new Function(txt+'\nreturn window.SCHOOL_SHARE;')(); if(obj&&obj.items){ window.SCHOOL_SHARE=obj; SCL_SHARE=obj; cb&&cb(obj); } else cb&&cb(null); }
      catch(e){ cb&&cb(null); }
    }).catch(function(){ cb&&cb(null); });
  }catch(e){ cb&&cb(null); }
}
function refreshSchool(){
  loadSchoolShare(function(fb){ if(fb){ rebuildSchool(); rerenderSchoolViews(); } });
}
function rerenderSchoolViews(){
  try{renderHome();}catch(e){} try{renderZoneA();}catch(e){} try{renderPolitics();}catch(e){} try{renderEduplan();}catch(e){} try{renderLive();}catch(e){} try{renderSchool();}catch(e){} try{renderHub();}catch(e){}
}
const SCL_TYPE={ edu:'教育局 / 教研中心', hs:'高中名校', ms:'初中名校', researcher:'教研员观点' };
function schoolZoneHTML(zoneFilter, compact){
  rebuildSchool();
  const evs=SCLALL.filter(function(e){ return zoneFilter==='AB' ? true : (e.zone===zoneFilter || e.zone==='AB'); });
  let h = compact ? '<h3 class="sub">🏫 学校 / 教研动态（点开情报站看全部）</h3>' : '<h2 class="sec">🏫 太原/山西教育情报（按来源分组）</h2>';
  if(compact){
    h+='<div class="row" style="margin:2px 0 10px"><button class="btn s" onclick="openAddSchool()">➕ 我刷到的</button><button class="btn s o" onclick="switchTab(\'school\')">查看情报站全部 →</button></div>';
  } else {
    h+='<div class="row" style="margin:-2px 0 12px;align-items:center;gap:10px"><button class="btn s" onclick="openAddSchool()">➕ 我刷到的学校/教研动态</button><span class="muted" style="font-size:12px">白天刷到的学校新闻，手动加进来就能出稿</span></div>';
  }
  const groups=['edu','hs','ms','researcher']; let any=false;
  groups.forEach(function(g){
    const gitems=evs.filter(e=>e.type===g);
    if(!gitems.length) return; any=true;
    h+='<div class="scl-group"><div class="scl-gtitle">'+SCL_TYPE[g]+' <span class="muted" style="font-size:12px">('+gitems.length+')</span></div><div class="grid g2">';
    const list = compact ? gitems.slice(0,2) : gitems;
    list.forEach(function(ev){
      const idx=SCLALL.indexOf(ev);
      const ctx = (zoneFilter==='AB') ? (ev.zone==='A'?'A':'B') : zoneFilter;
      const pc = ev.pri==='P0'?'p0':(ev.pri==='P1'?'p1':'p2');
      const zc = ev.zone==='A'?'badge zoneA':'badge zoneB';
      const zlabel = ev.zone==='A'?'老闫物理':(ev.zone==='B'?'张姐规划':'双号');
      const srcb = ev._src==='mine'?'<span class="badge mine">我的</span>':(ev._src==='share'?'<span class="badge share">共享</span>':'<span class="badge auto">自动</span>');
      const del = ev._src==='mine' ? '<button class="btn s x" onclick="delSchoolEvent(\''+ev.id+'\')">✕删</button>' : '';
      h+='<div class="card hot"><div class="arow"><span class="'+zc+'">'+zlabel+'</span><span class="pri '+pc+'">'+ev.pri+'</span>'+srcb+'</div>'
        +'<div class="at">'+esc(ev.school?('【'+ev.school+'】'):'')+esc(ev.title)+'</div>'
        +'<div class="aw">'+esc(ev.data)+'</div>'
        +'<div class="row"><button class="btn s" onclick="genShortFromSchool('+idx+')">⚡ 短视频</button><button class="btn s o" onclick="genLiveFromSchool('+idx+')">📺 直播</button>'+favBtn('school','sc_'+ev.id, (ev.school||'')+ev.title)+del+'</div></div>';
    });
    h+='</div></div>';
  });
  if(!any) h+='<p class="muted">暂无学校动态。点上面按钮，把刷到的学校/教研新闻加进来。</p>';
  return h;
}
function schoolSub(v){
  const box=document.getElementById('schoolSub'); if(!box) return;
  if(v==='overview') box.innerHTML=renderSchoolOverview();
  else if(v==='key') box.innerHTML=renderKeySchools();
  else if(v==='calendar') box.innerHTML=renderOpeningCalendar();
  else if(v==='map') box.innerHTML=renderSchoolMap();
  else if(v==='feed') box.innerHTML=schoolZoneHTML('AB',false);
  else if(v==='rival') box.innerHTML=renderRival();
  else if(v==='parent') box.innerHTML=renderParent();
  document.querySelectorAll('#school .subtab').forEach(b=>b.classList.toggle('on', b.dataset.sv===v));
}
function allSchools(){ return (window.SCHOOLS&&SCHOOLS.schools)||[]; }
function segOf(s){ return ['高级中学','完全中学','十二年一贯制'].indexOf(s.type)>=0 ? 'high':'junior'; }
function uniq(a){ var o={},r=[]; a.forEach(function(x){ if(!o[x]){o[x]=1;r.push(x);} }); return r; }
function schoolCard(s){
  const seg=segOf(s);
  const tierC = s.tier==='一类重点'?'t1':(s.tier&&s.tier.indexOf('民办')>=0?'tpri':'t2');
  const segBadge = seg==='high'?'zoneA':'zoneB';
  const segLabel = seg==='high'?'高中':'初中';
  const ding = s.dingxiang?' <span class="badge mine" title="定向生校">定</span>':'';
  return '<div class="card sch" data-seg="'+seg+'" data-tier="'+esc(s.tier||'')+'" data-dist="'+esc(s.district||'')+'">'
    +'<div class="sch-top"><span class="sch-name">'+esc(s.short||s.name)+'</span><span class="badge '+segBadge+'">'+segLabel+'</span>'+ding+'</div>'
    +'<div class="sch-meta">'+esc(s.district||'')+' · '+esc(s.nature||'')+' · <span class="'+tierC+'">'+esc(s.tier||'')+'</span></div>'
    + (s.score2025!=null?('<div class="sch-score">2025线 <b>'+esc(s.score2025)+'</b></div>'):'')
    + (s.group?('<div class="sch-feat">'+esc(s.group)+'</div>'):'')
    +'<div class="row" style="margin-top:6px"><button class="btn s" onclick="schoolDetail(\''+esc(s.name)+'\')">明细</button></div>'
    +'</div>';
}
function groupCards(list, key, order){
  const groups={};
  list.forEach(function(s){ (groups[s[key]]=groups[s[key]]||[]).push(s); });
  const head=order.filter(function(g){return groups[g];}).map(function(g){ return '<h3 class="sub" style="margin:14px 0 8px">'+esc(g)+' <span class="muted" style="font-size:12px">('+groups[g].length+' 所)</span></h3><div class="grid g3">'+groups[g].map(schoolCard).join('')+'</div>'; }).join('');
  const extra=Object.keys(groups).filter(function(g){return order.indexOf(g)<0;}).map(function(g){ return '<h3 class="sub" style="margin:14px 0 8px">'+esc(g)+' <span class="muted" style="font-size:12px">('+groups[g].length+' 所)</span></h3><div class="grid g3">'+groups[g].map(schoolCard).join('')+'</div>'; }).join('');
  return head+extra;
}
function soRenderBody(v, list){
  if(!list.length) return '<p class="muted">没有匹配的学校或条件。</p>';
  if(v==='district'){ return groupCards(list,'district', uniq(list.map(function(s){return s.district;}))); }
  if(v==='nature'){ return groupCards(list,'nature', (window.SCHOOLS.meta&&SCHOOLS.meta.natureDef)||['公办','民转公','民办']); }
  if(v==='tier'){ return groupCards(list,'tier', (window.SCHOOLS.meta&&SCHOOLS.meta.tierDef)||['一类重点','民办优质','民办普通','公办一般']); }
  return '<div class="grid g3">'+list.map(schoolCard).join('')+'</div>';
}
function soView(v){
  const body=document.getElementById('soBody'); if(!body) return;
  body.innerHTML=soRenderBody(v, allSchools());
  document.querySelectorAll('[data-sov]').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-sov')===v); });
}
function soRender(){
  const body=document.getElementById('soBody'); if(!body) return;
  const cur=document.querySelector('[data-sov].on'); const v=cur?cur.getAttribute('data-sov'):'overview';
  const q=(document.getElementById('soSearch')?document.getElementById('soSearch').value:'').trim();
  let list=allSchools();
  if(q) list=list.filter(function(s){ return (s.name+' '+s.short+' '+s.district+' '+s.nature+' '+s.tier).indexOf(q)>=0; });
  body.innerHTML=soRenderBody(v, list);
}
function renderSchoolOverview(){
  const S=window.SCHOOLS||{schools:[]};
  const schools=allSchools();
  const highN=schools.filter(function(s){return segOf(s)==='high';}).length;
  const junN=schools.filter(function(s){return segOf(s)==='junior';}).length;
  const dingN=schools.filter(function(s){return s.dingxiang;}).length;
  let h='<div class="kv" style="margin:4px 0 12px">'
    +'<b>📊 太原学校底座（注册表）：</b> 共 <b>'+schools.length+'</b> 所（高中段 '+highN+' · 初中段 '+junN+'）；定向生校 <b>'+dingN+'</b> 所。官方口径：普通高中 92 + 普通初中 126（含完全中学双计）。'
    +'</div>';
  h+='<div class="row" style="margin:6px 0 10px;flex-wrap:wrap;gap:6px">'
    +'<button class="btn s on" data-sov="overview" onclick="soView(\'overview\')">总览</button>'
    +'<button class="btn s" data-sov="district" onclick="soView(\'district\')">按区</button>'
    +'<button class="btn s" data-sov="nature" onclick="soView(\'nature\')">按性质</button>'
    +'<button class="btn s" data-sov="tier" onclick="soView(\'tier\')">按层级</button>'
    +'<input id="soSearch" class="mini" placeholder="搜校名/区/性质" oninput="soRender()" style="margin-left:auto;width:160px">'
    +'</div>';
  h+='<div id="soBody">'+soRenderBody('overview', schools)+'</div>';
  return h;
}
/* soFilter 已废弃（2026-08-06 重构四视图后由 soView/soRender 取代） */

/* ===== 学校明细·新增维度渲染（近五年分数线/班型/分班考/学年校历） ===== */
function schoolScoreHTML(s){
  if(s.scores5===null) return '<p class="muted">初中为对口 / 摇号入学，无“中招录取分数线”概念；升学路径见对口初中分配与民办摇号政策。</p>';
  if(!s.scores5||!s.scores5.length) return '<p class="muted">近五年录取分数线逐校核实补入中（本底座不编造分数）。2026 太原中考最低控制线 603 分。</p>';
  const years=uniq(s.scores5.map(function(x){return x.year;})).sort(function(a,b){return b-a;});
  let h='<div class="tbl-wrap"><table class="tbl"><thead><tr><th>年份</th><th>统招录取线</th><th>校区/备注</th></tr></thead><tbody>';
  years.forEach(function(y){
    s.scores5.filter(function(x){return x.year===y;}).forEach(function(r,i){
      h+='<tr><td>'+(i===0?y:'')+'</td><td><b>'+r.score+'</b></td><td>'+(r.campus||'')+'</td></tr>';
    });
  });
  h+='</tbody></table></div><div class="muted" style="font-size:11px">注：太原中考总分 2025 起为 850 分（此前 730 分）；以上为统招线，定向生线≤统招线下 50 分且≥控制线。来源：太原市招考中心 / 教育局公告。</div>';
  return h;
}
function schoolClassHTML(s){
  if(s.classes){
    if(Array.isArray(s.classes)) return '<div class="kv" style="margin-top:4px"><b>班型：</b>'+s.classes.map(function(x){return '<span class="chip">'+esc(x)+'</span>';}).join('')+'</div>';
    return '<div class="kv" style="margin-top:4px"><b>班型：</b>'+esc(s.classes)+'</div>';
  }
  const CAL=window.SCHOOL_CAL||{};
  const kt=(CAL.keyClassTiers||[]).filter(function(t){return (s.short&&t.school.indexOf(s.short)>=0)||t.school===s.name;})[0];
  if(kt){ return '<div class="kv" style="margin-top:4px"><b>班型分层：</b>'+kt.tiers.map(function(x){return '<span class="chip">'+esc(x)+'</span>';}).join('')+'<div class="muted" style="margin-top:4px">'+esc(kt.rule||'')+'（'+esc(kt.src||'')+'）</div></div>'; }
  return '<p class="muted">班型与人数以本校当年招生简章 / 分班公告为准，本底座逐校核实中。</p>';
}
function schoolPlacementHTML(s){
  if(s.placement){
    const p=s.placement;
    let h='<div class="kv" style="margin-top:4px"><b>分班考时间：</b>'+esc(p.time||'以本校通知为准')+'</div>';
    if(p.subjects&&p.subjects.length) h+='<div class="kv"><b>考试科目：</b>'+p.subjects.map(function(x){return '<span class="chip">'+esc(x)+'</span>';}).join('')+'</div>';
    if(p.scope) h+='<div class="kv"><b>考试范围：</b>'+esc(p.scope)+'</div>';
    if(p.basis) h+='<div class="muted" style="font-size:11px">'+esc(p.basis)+'</div>';
    if(p.src) h+='<div class="muted" style="font-size:11px">来源：'+esc(p.src)+'</div>';
    return h;
  }
  const CAL=window.SCHOOL_CAL||{};
  const op=(CAL.opening2026||[]).filter(function(o){return o.school===s.name||(s.short&&o.school.indexOf(s.short)>=0);})[0];
  if(op){ return '<div class="kv" style="margin-top:4px"><b>分班考：</b>'+(op.exam&&op.exam!=='-'?esc(op.exam)+'（'+esc(op.examSubjects||'')+'）':'8 月下旬入学摸底 / 分班考')+'；军训 '+(op.military||'以通知为准')+'；开学 '+esc(op.opening||'9/1')+'</div>'; }
  return '<div class="kv" style="margin-top:4px"><b>分班考：</b>高一 / 初一新生一般 8 月下旬入学摸底或分班考（具体以本校通知为准）；部分校 8/20 前后。</div>';
}
function schoolCalendarHTML(s){
  const CAL=window.SCHOOL_CAL||{};
  let h='<div class="kv" style="margin-top:6px"><b>主要节假日：</b>'+(CAL.holidays||[]).map(function(x){return '<span class="chip">'+esc(x.name)+'</span>';}).join('')+'</div>';
  h+='<div class="kv"><b>全年考试：</b>'+(CAL.examCalendar||[]).map(function(x){return '<span class="chip alt">'+esc(x.name)+'</span>';}).join('')+'</div>';
  h+='<div class="muted" style="font-size:11px">说明：'+(CAL.examCalendar||[]).map(function(x){return esc(x.name)+'（'+esc(x.time)+'）';}).join('；')+'</div>';
  return h;
}
function schoolCampusHTML(s){
  if(!s.campuses||!s.campuses.length) return '';
  let h='<h3 class="sub" style="margin-top:12px">🏫 分校区详情</h3>';
  s.campuses.forEach(function(c){
    h+='<div class="card" style="margin:6px 0;padding:10px">';
    h+='<div class="sch-top"><span class="sch-name">'+esc(c.name)+'</span></div>';
    if(c.addr) h+='<div class="muted">地址：'+esc(c.addr)+'</div>';
    const rows=[];
    if(c.boarding) rows.push(['寄宿',c.boarding]);
    if(c.plan2026) rows.push(['2026招生',c.plan2026]);
    if(c.phone) rows.push(['咨询电话',c.phone]);
    if(c.military) rows.push(['军训',c.military]);
    if(rows.length) h+='<ul class="kv" style="margin-top:6px">'+rows.map(function(r){return '<li><span class="k">'+esc(r[0])+'</span><span>'+esc(r[1])+'</span></li>';}).join('')+'</ul>';
    if(c.placement) h+='<div class="kv"><b>分班考：</b>'+esc(c.placement.time||'')+' · 科目 '+((c.placement.subjects||[]).map(function(x){return esc(x);})).join('、')+(c.placement.scope?(' · '+esc(c.placement.scope)):'')+'</div>';
    if(c.classes&&c.classes.length) h+='<div class="kv"><b>班型：</b>'+c.classes.map(function(x){return '<span class="chip">'+esc(x)+'</span>';}).join('')+'</div>';
    h+='</div>';
  });
  return h;
}

function findSchool(name){
  if(!name) return null;
  return allSchools().filter(function(s){ return s.name===name||s.short===name; })[0]||null;
}
function schoolDetail(name){
  const s=findSchool(name); if(!s) return;
  const seg = segOf(s)==='high'?'高中':'初中';
  let h='<div class="lock-box" style="max-width:560px;text-align:left"><h3>'+esc(s.name)+'</h3>'
    +'<div class="muted">'+esc(s.district||'')+' · '+esc(s.nature||'')+' · '+esc(s.tier||'')+' · '+seg+'（'+esc(s.type||'')+'）'+(s.dingxiang?' · 定向生校':'')+'</div>'
    +'<ul class="kv" style="margin-top:10px">'
    +'<li><span class="k">行政区</span><span>'+esc(s.district||'-')+'</span></li>'
    +'<li><span class="k">办学性质</span><span>'+esc(s.nature||'-')+'</span></li>'
    +'<li><span class="k">学段类型</span><span>'+esc(s.type||'-')+'</span></li>'
    +'<li><span class="k">层级</span><span>'+esc(s.tier||'-')+'</span></li>'
    + (s.dingxiang?'<li><span class="k">定向生</span><span>是</span></li>':'')
    + (s.score2025!=null?'<li><span class="k">2025录取线</span><span>'+esc(s.score2025)+' 分</span></li>':'')
    + (s.group?'<li><span class="k">集团/举办方</span><span>'+esc(s.group)+'</span></li>':'')
    + (s.note?'<li><span class="k">备注</span><span>'+esc(s.note)+'</span></li>':'')
    +'</ul>'
    + (s.events&&s.events.length?'<h3 class="sub" style="margin-top:12px">近期动态</h3><ul class="kv">'+s.events.map(function(e){return '<li><span class="k">'+esc(e.date||'')+'</span><span>'+esc(e.title||'')+'</span></li>';}).join('')+'</ul>':'')
    + '<h3 class="sub" style="margin-top:12px">📊 近五年录取分数线</h3>'+schoolScoreHTML(s)
    + (segOf(s)==='high'?'<h3 class="sub" style="margin-top:12px">🏫 班型与人数</h3>'+schoolClassHTML(s):'')
    + '<h3 class="sub" style="margin-top:12px">📝 分班考时间</h3>'+schoolPlacementHTML(s)
    + schoolCampusHTML(s)
    + '<h3 class="sub" style="margin-top:12px">📅 学年校历（放假 / 考试）</h3>'+schoolCalendarHTML(s)
    +'<div class="row" style="margin-top:12px"><button class="btn" onclick="closeSchoolDetail()">关闭</button>'
    +'<button class="btn s o" onclick="aiCollectOne(\''+esc(s.id)+'\')">🤖AI补全</button>'
    +'<button class="btn s o" onclick="schoolDetailToTopic(\''+esc(s.name)+'\')">⚡ 出短视频稿</button></div></div>';
  showOverlay('schoolDetailOverlay', h);
}
function schoolDetailToTopic(name){
  const s=findSchool(name); if(!s) return;
  const zone = segOf(s)==='high' ? 'A' : 'B';
  const facts=[s.district, s.nature, s.tier, segOf(s)==='high'?'高中':'初中'].filter(Boolean).join(' · ');
  const sc=(s.scores5&&s.scores5.length)?('；近五年线 '+s.scores5.map(function(x){return x.year+':'+x.score+(x.campus?('('+x.campus+')'):'');}).join('/')):'';
  const ev={ school:s.short||s.name, title:s.short||s.name+' 2026 择校解读', angle:'学校解读', data:facts+(s.score2025!=null?('；2025线'+s.score2025):'')+sc+(s.group?('；'+s.group):''), hook:(s.short||s.name)+'到底什么来头？', topic:(s.short||s.name)+' 真面目', liveTheme:(s.short||s.name)+' 择校怎么选', src:'学校库', zone:zone, pri:'P1' };
  showOut(genTopicFromHot(ev, zone));
  closeSchoolDetail();
}
function closeSchoolDetail(){ var o=document.getElementById('schoolDetailOverlay'); if(o) o.classList.add('hide'); }

/* ===== 学校情报采集中心（AI 辅助补全为主） ===== */
function schoolCompleteness(s){
  const isHigh=segOf(s)==='high';
  let have=0, total=0; const miss=[];
  total++;
  if(isHigh){ if(s.scores5&&s.scores5.length>=4){have++;} else miss.push('近五年录取线'); }
  else { have++; }
  total++; if(s.classes){have++;} else miss.push('班型与人数');
  total++; if(s.placement){have++;} else miss.push('分班考时间/科目');
  let level = (have===total)?'full':(have>=1?'part':'miss');
  return {score:have,total:total,level:level,miss:miss};
}
function collectBar(full,part,miss){
  const t=(full+part+miss)||1;
  const wf=Math.round(full/t*100), wp=Math.round(part/t*100);
  return '<div style="height:8px;border-radius:5px;background:#eef0f2;overflow:hidden;display:flex;margin-top:4px"><div style="width:'+wf+'%;background:#1a7f37"></div><div style="width:'+wp+'%;background:#b58105"></div></div>';
}
function collectListHTML(filter, q){
  let list=allSchools();
  if(filter==='miss') list=list.filter(function(s){return schoolCompleteness(s).level==='miss';});
  else if(filter==='part') list=list.filter(function(s){return schoolCompleteness(s).level==='part';});
  else if(filter==='key') list=list.filter(function(s){return s.tier==='一类重点'||s.tier==='民办优质';});
  if(q){ q=q.toLowerCase(); list=list.filter(function(s){return (s.name+s.short+(s.district||'')).toLowerCase().indexOf(q)>=0;}); }
  if(!list.length) return '<p class="muted">没有匹配的学校。</p>';
  return '<div class="grid g2">'+list.map(function(s){
    const c=schoolCompleteness(s);
    const badge=c.level==='full'?'<span style="color:#1a7f37;font-weight:600">✓完整</span>':(c.level==='part'?'<span style="color:#b58105;font-weight:600">△部分</span>':'<span style="color:#cf222e;font-weight:600">✗缺失</span>');
    const missc = c.miss.length?('<div class="muted" style="font-size:11px;margin-top:2px">缺：'+c.miss.join('、')+'</div>'):'';
    return '<div class="card" style="padding:8px"><div class="sch-top"><span class="sch-name">'+esc(s.short||s.name)+'</span>'+badge+'</div>'
      +'<div class="sch-meta">'+esc(s.district||'')+' · '+esc(s.nature||'')+' · '+esc(s.tier||'')+'</div>'
      +missc
      +'<div class="row" style="margin-top:6px">'
      +'<button class="btn s" onclick="schoolDetail(\''+esc(s.name)+'\')">明细</button>'
      +'<button class="btn s o" onclick="aiCollectOne(\''+esc(s.id)+'\')">🤖AI补全</button>'
      +'<button class="btn s" onclick="openSchoolFill(\''+esc(s.id)+'\')">📝补</button>'
      +'</div></div>';
  }).join('')+'</div>';
}
function renderCollectList(){
  const f=document.getElementById('collectFilter')?document.getElementById('collectFilter').value:'all';
  const q=document.getElementById('collectSearch')?document.getElementById('collectSearch').value:'';
  const box=document.getElementById('collectList'); if(box) box.innerHTML=collectListHTML(f,q);
}
function renderCollect(){
  const schools=allSchools();
  let complete=0, partial=0, missing=0; const byDist={};
  schools.forEach(function(s){
    const c=schoolCompleteness(s);
    if(c.level==='full') complete++; else if(c.level==='part') partial++; else missing++;
    const d=s.district||'未知'; byDist[d]=byDist[d]||{t:0,full:0,part:0,miss:0};
    byDist[d].t++; if(c.level==='full')byDist[d].full++; else if(c.level==='part')byDist[d].part++; else byDist[d].miss++;
  });
  const total=schools.length||1;
  let h='<div class="banner"><b>🎯 学校情报采集中心 · 双号共用</b><br>掌握太原全部 '+schools.length+' 所初高中最新信息。每校卡片点「🤖AI补全」→ 复制请求发给我 → 我联网搜官方/媒体数据补进库 → 你核对。重点校优先，全量按区推进。</div>';
  h+='<div class="kv" style="margin:8px 0"><b>总进度：</b> <span style="color:#1a7f37;font-weight:600">✓完整 '+complete+'</span> · <span style="color:#b58105;font-weight:600">△部分 '+partial+'</span> · <span style="color:#cf222e;font-weight:600">✗缺失 '+missing+'</span> / 共 '+schools.length+' 所（完整率 '+Math.round(complete/schools.length*100)+'%）</div>';
  h+='<h3 class="sub" style="margin:10px 0 6px">📍 按区进度</h3><div class="grid g2">';
  Object.keys(byDist).sort().forEach(function(d){
    const o=byDist[d];
    h+='<div class="card" style="padding:8px"><div class="sch-top"><span class="sch-name">'+esc(d)+'</span><span class="muted">'+o.full+'/'+o.t+'</span></div>'+collectBar(o.full,o.part,o.miss)+'</div>';
  });
  h+='</div>';
  h+='<div class="row" style="margin:12px 0 6px;flex-wrap:wrap;gap:6px">'
    +'<button class="btn s o" onclick="aiCollectBatch(\'key\')">🤖 批量补全重点校</button>'
    +'<button class="btn s" onclick="aiCollectBatch(\'all\')">🤖 补全全部缺失</button>'
    +'<select id="collectFilter" class="mini" onchange="renderCollectList()"><option value="all">全部</option><option value="miss">仅缺失</option><option value="part">仅部分</option><option value="key">仅重点校</option></select>'
    +'<input id="collectSearch" class="mini" placeholder="搜校名/区" oninput="renderCollectList()" style="width:140px">'
    +'</div>';
  h+='<div id="collectList">'+collectListHTML('all','')+'</div>';
  const box=document.getElementById('collect'); if(box) box.innerHTML=h;
}
function genSchoolBrief(s){
  const c=schoolCompleteness(s);
  const fields=[];
  if(c.miss.indexOf('近五年录取线')>=0) fields.push('2022-2026 近五年统招录取分数线（如多校区请按校区拆分，标注校区与来源）');
  if(c.miss.indexOf('班型与人数')>=0) fields.push('2026 班型设置与各层级人数（普通班/实验班/特色班，含招生总人数）');
  if(c.miss.indexOf('分班考时间/科目')>=0) fields.push('新高一/初一 分班考（摸底考）时间与考试科目、范围');
  fields.push('校区地址 / 2026 招生计划人数 / 咨询电话 / 军训时间');
  fields.push('最新放假安排与全年考试节点（若与通用校历不同）');
  return '请联网搜索并补全【太原市 · '+s.district+' · '+s.name+'】的最新信息。\n'
    +'学校属性：'+s.nature+' / '+s.tier+' / '+(segOf(s)==='high'?'高中段':'初中段')+(s.dingxiang?' / 定向生校':'')+'。\n'
    +'需补全字段：\n- '+fields.join('\n- ')+'\n'
    +'要求：以可核验的官方（太原市招考中心/教育局/学校官网）或权威媒体来源为准，不要编造；返回结构化 JSON：\n'
    +'{ "name":"'+s.name+'", "scores5":[{"year":2026,"score":null,"campus":"","src":""}], "classes":"...", "placement":{"time":"","subjects":[],"scope":"","basis":"","src":""}, "campuses":[{"name":"","addr":"","boarding":"","plan2026":"","phone":"","military":""}], "note":"" }\n'
    +'我会直接写入学校库并重新部署。';
}
function aiCollectOne(id){
  const s=allSchools().filter(function(x){return x.id===id;})[0]; if(!s) return;
  copyText(genSchoolBrief(s)); wbToast('已复制「'+(s.short||s.name)+'」补全请求，发到对话里给我即可');
}
function aiCollectBatch(kind){
  let list=allSchools();
  if(kind==='key') list=list.filter(function(s){return s.tier==='一类重点'||s.tier==='民办优质';});
  else list=list.filter(function(s){return schoolCompleteness(s).level!=='full';});
  if(!list.length){ wbToast('没有需要补全的学校'); return; }
  const head='请联网搜索并补全以下太原学校的最新信息（重点：近五年录取线/班型人数/分班考时间科目/校区招生电话军训）。每所返回结构化 JSON（同单校格式，不要编造，标注来源）：\n';
  const briefs=list.map(function(s){ return '【'+(s.short||s.name)+'】('+s.district+') 缺：'+schoolCompleteness(s).miss.join('、'); });
  copyText(head+briefs.map(function(b,i){return (i+1)+'. '+b;}).join('\n'));
  wbToast('已复制 '+list.length+' 所补全清单，发到对话里给我即可');
}
function openSchoolFill(id){
  const s=allSchools().filter(function(x){return x.id===id;})[0]; if(!s) return;
  const ta=document.getElementById('schoolFillText'); if(ta) ta.value=genSchoolBrief(s);
  const ov=document.getElementById('schoolFillOverlay'); if(ov) ov.classList.remove('hide');
}
function closeSchoolFill(){ var ov=document.getElementById('schoolFillOverlay'); if(ov) ov.classList.add('hide'); }

function renderKeySchools(){
  const S=window.SCHOOLS||{schools:[]}; const CAL=window.SCHOOL_CAL||{};
  const schools=allSchools();
  const key= schools.filter(function(s){ return segOf(s)==='high' && (s.tier==='一类重点'||s.tier==='民办优质'); });
  let h='<p class="muted" style="margin:4px 0 12px">太原一类重点 / 优质民办高中底座（共 '+key.length+' 所）。其余 200+ 所普通校 / 初中见「学校总览」。来源：教育局概况与公开名录，分数 / 出口随中招核实后补充。</p>';
  h+='<div class="grid g2">';
  key.forEach(function(s){
    let t=null;
    (CAL.keyClassTiers||[]).forEach(function(x){ var c=x.school.replace(/\(.*?\)/g,''); if(c.indexOf(s.short)>=0||s.name.indexOf(c)>=0) t=x; });
    h+='<div class="card key">'
      +'<div class="sch-top"><span class="sch-name">'+esc(s.short||s.name)+'</span><span class="badge zoneA">高中·'+esc(s.tier)+'</span></div>'
      +'<div class="muted">'+esc(s.district)+' · '+esc(s.nature)+(s.dingxiang?' · 定向生校':'')+'</div>'
      + (s.score2025!=null?('<p><b>2025录取线：</b>'+s.score2025+' 分</p>'):'')
      + (s.group?'<p><b>集团/举办方：</b>'+esc(s.group)+'</p>':'')
      + (s.note?'<p class="muted">'+esc(s.note)+'</p>':'')
      + (t?('<div class="kv" style="margin-top:6px"><b>班型分层：</b>'+t.tiers.map(function(x){return '<span class="chip">'+esc(x)+'</span>';}).join('')+'<div class="muted" style="margin-top:4px">'+esc(t.rule)+'</div></div>'):'')
      +'</div>';
  });
  h+='</div>';
  const jkey= schools.filter(function(s){ return segOf(s)==='junior' && s.tier==='一类重点'; });
  if(jkey.length){
    h+='<h3 class="sub" style="margin-top:18px">⭐ 一类重点初中（含热门民办 / 转公）</h3><div class="grid g2">';
    jkey.forEach(function(s){
      h+='<div class="card key"><div class="sch-top"><span class="sch-name">'+esc(s.short||s.name)+'</span><span class="badge zoneB">初中·'+esc(s.tier)+'</span></div>'
        +'<div class="muted">'+esc(s.district)+' · '+esc(s.nature)+(s.dingxiang?' · 定向生校':'')+'</div>'
        + (s.note?'<p class="muted">'+esc(s.note)+'</p>':'')
        +'</div>';
    });
    h+='</div>';
  } else {
    h+='<h3 class="sub" style="margin-top:18px">⭐ 关于初中头部校</h3><p class="muted">本底座按"每校一条实体"建册：多数头部初中的高中部以"完全中学"实体计入高中段，初中段单独列出的头部校较少。如需"太原最强初中榜"，可在「学校总览 · 按层级」筛选，或后续补充初中专项评价数据。</p>';
  }
  return h;
}
function renderOpeningCalendar(){
  const C=window.SCHOOL_CAL||{};
  let h='<p class="muted" style="margin:4px 0 12px">太原 K12 全年关键节点（备考 / 考试 / 招生 / 录取）。开学季各校明细见下方表格。</p>';
  const yn=(C.yearNodes||[]);
  if(yn.length){
    h+='<div class="timeline" style="margin-bottom:16px">';
    yn.forEach(function(n){
      const tc = n.type==='考试'?'t1':(n.type==='录取'?'tpri':(n.type==='政策'?'ok':'t2'));
      h+='<div class="tl"><span class="tl-dot '+tc+'"></span><div class="tl-b"><b>'+esc(n.term)+'</b> · '+esc(n.label)+'<div class="muted" style="font-size:11px">'+esc(n.detail)+'</div></div></div>';
    });
    h+='</div>';
  }
  if(C.officialCalendar){
    const oc=C.officialCalendar;
    h+='<div class="kv" style="margin-bottom:12px"><b>📅 太原市校历：</b> 高中 '+esc(oc.senior.summerStart)+'~'+esc(oc.senior.summerEnd)+' 暑假，<b>'+esc(oc.senior.firstDay)+'</b> 开学（高一军训）；义务段 '+esc(oc.compulsory.firstDay)+' 开学。</div>';
  }
  const rows=(C.opening2026||[]);
  if(rows.length){
    h+='<div class="tablewrap"><table class="tbl"><thead><tr><th>学校</th><th>报到/领通知</th><th>分班摸底考</th><th>科目</th><th>军训</th><th>开学</th></tr></thead><tbody>';
    rows.forEach(function(r){
      h+='<tr><td><b>'+esc(r.school)+'</b><br><span class="muted" style="font-size:11px">'+esc(r.district||'')+'</span></td>'
        +'<td>'+esc(r.report||'-')+'</td><td>'+esc(r.exam||'-')+'</td><td>'+esc(r.examSubjects||'-')+'</td><td>'+esc(r.military||'-')+'</td><td>'+esc(r.opening||'-')+'</td></tr>';
    });
    h+='</tbody></table></div>';
  }
  if(C.keyClassTiers && C.keyClassTiers.length){
    h+='<h3 class="sub" style="margin-top:18px">⭐ 头部校班型分层（2026）</h3><div class="grid g2">';
    C.keyClassTiers.forEach(function(t){
      h+='<div class="card"><div class="sch-name">'+esc(t.school)+'</div>'+t.tiers.map(function(x){return '<span class="chip">'+esc(x)+'</span>';}).join('')+'<div class="muted" style="margin-top:6px">'+esc(t.rule)+'</div></div>';
    });
    h+='</div>';
  }
  return h;
}
function renderSchoolMap(){
  const LAYOUT={
    '小店区':{x:64,y:80}, '迎泽区':{x:60,y:52}, '杏花岭区':{x:62,y:24},
    '万柏林区':{x:34,y:54}, '尖草坪区':{x:42,y:18}, '晋源区':{x:28,y:84},
    '古交市':{x:14,y:30}, '清徐县':{x:20,y:94}, '阳曲县':{x:62,y:8}, '娄烦县':{x:40,y:96}
  };
  const all=allSchools().map(function(s){ return {n:s.short||s.name,d:s.district,t:s.tier}; });
  let h='<p class="muted" style="margin:4px 0 10px">太原学校分布<b>示意图</b>（非精确测绘，仅示意方位）。图钉颜色：<span class="dot t1"></span>一类重点 <span class="dot t2"></span>其他 <span class="dot tpri"></span>民办优质。点图钉看明细。</p>';
  h+='<div class="map">';
  Object.keys(LAYOUT).forEach(function(d){ var p=LAYOUT[d]; h+='<div class="dist" style="left:'+p.x+'%;top:'+p.y+'%">'+d+'</div>'; });
  all.forEach(function(s){
    const p=LAYOUT[s.d]; if(!p) return;
    const c = s.t==='一类重点'?'t1':(s.t&&s.t.indexOf('民办优质')>=0?'tpri':'t2');
    const jx=(Math.random()*6-3).toFixed(1), jy=(Math.random()*6-3).toFixed(1);
    h+='<button class="pin '+c+'" style="left:'+(p.x*1+ +jx)+'%;top:'+(p.y*1+ +jy)+'%" title="'+esc(s.n)+'" onclick="schoolDetailByName(\''+esc(s.n)+'\')">●</button>';
  });
  h+='</div>';
  h+='<p class="muted" style="font-size:11px;margin-top:8px">注：各区学校密集，图钉位置为示意；精确信息见「学校总览 / 明细」。</p>';
  return h;
}
function schoolDetailByName(name){ schoolDetail(name); }
function showOverlay(id, html){
  let ov=document.getElementById(id);
  if(!ov){ ov=document.createElement('div'); ov.className='lock-overlay'; ov.id=id; document.body.appendChild(ov); }
  ov.innerHTML=html; ov.classList.remove('hide');
  ov.onclick=function(e){ if(e.target===ov) ov.classList.add('hide'); };
}
function renderRival(){
  const R=window.RIVAL||{};
  let h='<p class="muted" style="margin:4px 0 12px">太原本地对标账号 / 机构动作 / 空白市场。直播与选题的差异化，靠这张表找「别人没说的」。</p>';
  const Z=R.zhaosheng2026||{};
  if(Z.total){
    h+='<div class="kv" style="margin-bottom:12px"><b>📊 2026太原中招变化（来源：'+esc(Z.src||'')+'）：</b> 总计划 <b>'+esc(Z.total)+'</b> 人，普高率 <b>'+esc(Z.rate)+'</b>；扩招 <b>'+esc(Z.expandTotal)+'</b> 人（'+esc(Z.expandBreak||'')+'）。特色班：'+esc(Z.specialClass||'')+'。新增校：'+esc((Z.newSchools||[]).join('、'))+'。缩招：'+esc((Z.shrinkSchools||[]).join('、'))+'。</div>';
  }
  const ac=(R.accounts||[]);
  if(ac.length){
    h+='<h3 class="sub">🥊 对标账号（抖音/快手/小红书）</h3><div class="tablewrap"><table class="tbl"><thead><tr><th>账号</th><th>平台</th><th>定位</th><th>粉丝</th><th>强项</th><th>短板（我方机会）</th></tr></thead><tbody>';
    ac.forEach(function(a){
      h+='<tr><td><b>'+esc(a.name)+'</b></td><td>'+esc(a.platform||'')+'</td><td><span class="badge '+(a.zone&&a.zone.indexOf('A')>=0?'zoneA':'zoneB')+'">'+esc(a.zone||'')+'</span></td><td>'+esc(a.fans||'')+'</td><td>'+esc(a.strengths||'')+'</td><td>'+esc(a.gaps||'')+'</td></tr>';
    });
    h+='</tbody></table></div>';
  }
  const ins=(R.institutions||[]);
  if(ins.length){
    h+='<h3 class="sub" style="margin-top:16px">🏢 机构动作（抢流量）</h3><div class="grid g2">';
    ins.forEach(function(x){ h+='<div class="card"><div class="sch-name">'+esc(x.name)+'</div><div class="muted">'+esc(x.type||'')+'</div><p>'+esc(x.action2026||'')+'</p><div class="muted" style="font-size:11px">'+esc(x.note||'')+'</div></div>'; });
    h+='</div>';
  }
  const mg=(R.marketGaps||[]);
  if(mg.length){
    h+='<h3 class="sub" style="margin-top:16px">🎯 空白市场（我方卡位）</h3><ul class="kv">';
    mg.forEach(function(g){ h+='<li>'+esc(g)+'</li>'; });
    h+='</ul>';
  }
  return h;
}
function renderParent(){
  const P=window.PARENT||{};
  let h='<p class="muted" style="margin:4px 0 12px">分学段家长焦虑点 / 高频问题 / 内容钩子。选题和文案的「钩子」从这里来。</p>';
  const segs=(P.segments||[]);
  segs.forEach(function(s){
    h+='<div class="card" style="margin-bottom:10px"><div class="sch-top"><span class="sch-name">'+esc(s.stage)+'</span></div>';
    h+='<div class="kv"><b>😣 焦虑点：</b>'+ (s.pains||[]).map(function(p){return '<span class="chip">'+esc(p)+'</span>';}).join('')+'</div>';
    h+='<div class="kv"><b>❓ 高频问：</b>'+ (s.faq||[]).map(function(p){return '<span class="chip alt">'+esc(p)+'</span>';}).join('')+'</div>';
    h+='<div class="kv"><b>🪝 内容钩子：</b>'+ (s.hooks||[]).map(function(p){return '<span class="chip ok">'+esc(p)+'</span>';}).join('')+'</div></div>';
  });
  const cs=(P.crossStage||[]);
  if(cs.length){
    h+='<div class="kv" style="margin-top:8px"><b>🔁 跨学段共性：</b>'+cs.map(function(x){return '<span class="chip">'+esc(x)+'</span>';}).join('')+'</div>';
  }
  return h;
}
function renderSchool(){
  let h='<div class="banner"><b>太原教育情报站 · 双号共用</b><br>太原所有初高中底数 + 开学季时间轴 + 地标图 + 每日动态。看完你就知道「谁在干嘛」。</div>';
  h+='<div class="subtabs">'
    +'<button class="subtab on" data-sv="overview" onclick="schoolSub(\'overview\')">📋 学校总览</button>'
    +'<button class="subtab" data-sv="key" onclick="schoolSub(\'key\')">⭐ 重点校详情</button>'
    +'<button class="subtab" data-sv="calendar" onclick="schoolSub(\'calendar\')">🗓 全年行事历</button>'
    +'<button class="subtab" data-sv="map" onclick="schoolSub(\'map\')">📍 地标图</button>'
    +'<button class="subtab" data-sv="rival" onclick="schoolSub(\'rival\')">🥊 竞品情报</button>'
    +'<button class="subtab" data-sv="parent" onclick="schoolSub(\'parent\')">👪 家长需求</button>'
    +'<button class="subtab" data-sv="feed" onclick="schoolSub(\'feed\')">📰 实时动态</button>'
    +'</div>';
  h+='<div id="schoolSub">'+renderSchoolOverview()+'</div>';
  $('#school').innerHTML=h;
}
function genShortFromSchool(i){
  const ev=allSchool()[i]; if(!ev) return;
  const zone = ev.zone==='AB' ? 'B' : ev.zone;
  showOut(genTopicFromHot(ev, zone));
}
function genLiveFromSchool(i){
  const ev=allSchool()[i]; if(!ev) return;
  const root=document.getElementById('live-gen'); if(!root) return;
  const acc=root.querySelector('[data-k="lg-acc"]'); const theme=root.querySelector('[data-k="lg-theme"]');
  const sol=root.querySelector('[data-k="lg-solution"]'); const dep=root.querySelector('[data-k="lg-depth"]');
  const zone = ev.zone==='A'?'A':'B';
  if(acc) acc.value=zone; if(theme) theme.value=ev.liveTheme||ev.topic||ev.title;
  if(sol) sol.value=ev.solution||''; if(dep) dep.value=ev.depth||'';
  syncLiveMode();
  switchTab('live'); genLiveScript();
}
function openAddSchool(){ var ov=document.getElementById('addSchoolOverlay'); if(ov) ov.classList.remove('hide'); }
function closeAddSchool(){ var ov=document.getElementById('addSchoolOverlay'); if(ov) ov.classList.add('hide'); }
function addSchoolEvent(){
  const g=function(k){ var el=document.querySelector('#addSchoolForm [data-k="'+k+'"]'); return el?el.value.trim():''; };
  const title=g('as-title'); if(!title){ wbToast('请填动态标题'); return; }
  const school=g('as-school')||'未知名校';
  SCLM.push({ id:'sm'+Date.now(), pri:g('as-pri')||'P1', zone:g('as-zone')||'B', school:school, type:g('as-type')||'edu', title:title, angle:g('as-angle'), data:g('as-data'), hook:g('as-hook'), topic:g('as-topic')||title, liveTheme:g('as-live')||g('as-topic')||title, src:g('as-src')||'我刷到的', solution:g('as-solution'), depth:g('as-depth') });
  saveLocalSchool(); closeAddSchool(); rebuildSchool(); rerenderSchoolViews();
  wbToast('已存本机，点动态即可出稿');
}
function delSchoolEvent(id){ SCLM=SCLM.filter(function(e){ return e.id!==id; }); saveLocalSchool(); rebuildSchool(); rerenderSchoolViews(); wbToast('已删除'); }
function syncSchoolHot(){
  if(!SCLM.length){ wbToast('本机还没有手动学校动态'); return; }
  const code='window.SCHOOL_SHARE = { date:\'共享库\', note:\'手动共享学校动态库·由主理人对话同步写入\', items: '+JSON.stringify(SCLM)+' };\n';
  copyText(code);
  wbToast('已复制共享库代码，发给我（AI）即可让爱人看到');
}
function bindAddSchool(){
  const ov=document.getElementById('addSchoolOverlay'); if(!ov) return;
  const c=document.getElementById('addSchoolCancel'), s=document.getElementById('addSchoolSave'), y=document.getElementById('addSchoolSync');
  if(c) c.onclick=closeAddSchool; if(s) s.onclick=addSchoolEvent; if(y) y.onclick=syncSchoolHot;
  ov.addEventListener('click', function(e){ if(e.target===ov) closeAddSchool(); });
}

function boot(){
  var ok=false; try{ ok=localStorage.getItem('wb_unlock')==='1'; }catch(e){}
  if(ok){ var ov=document.getElementById('lockOverlay'); if(ov) ov.classList.add('hide'); loadLocalMy(); loadLocalSchool(); loadDrafts(); init(); refreshFeed(); refreshHot(); refreshMy(); refreshSchool(); }
  else { setupLock(); }
}
if(document.readyState!=='loading') boot();
else document.addEventListener('DOMContentLoaded', boot);
})();
