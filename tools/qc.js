/* 亿领智作台 · 内容质量质检闸门 qc.js
 * 用途：校验数据层每条内容是否具备「深度(depth) + 可落地方案(solution)」，
 *       防止自动化写出干瘪的三段式。
 * 用法：node tools/qc.js            → 全量体检，不合格 exit 1
 *      node tools/qc.js --today    → 只检查当日自动化产出的三个文件
 *      node tools/qc.js --fresh    → 额外校验「热点新鲜度」（是否真的搜了新热点）
 *      node tools/qc.js --today --fresh → 每日自动化标配（质量 + 新鲜度 双闸门）
 * 判定规则（全部满足才算合格）：
 *   1) depth 存在且 ≥15 字
 *   2) solution 存在且含 ① ② ③ 三个序号
 *   3) solution 至少命中一项「量化/时间/方法」特征（数字、时间点、官网、分钟、%、次、条、周、天）
 *   4) solution 不含空泛套话黑名单
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

/* 需要质检的数据源：文件 → [全局变量, 取数组的路径] */
const TARGETS = [
  ['today-feed.js',   'TODAY_FEED', o => o.recs,   '今日行动(自动)'],
  ['hot-events.js',   'HOT',        o => o.events, '实时热点(自动)'],
  ['school-news.js',  'SCHOOL',     o => o.items,  '学校动态(自动)'],
  ['data-today.js',   'TODAY',      o => o.recs,   '今日行动(兜底样例)'],
  ['data-politics.js','DATA_POLITICS', o => o.topics, '政治选题库'],
  ['data-eduplan.js', 'DATA_EDUPLAN', o => o.topics, '升学规划选题库'],
  ['data-live.js',    'LIVE',       o => (o.topics || []), '直播选题库'],
  // 注：data-physics-content.js 的 content5 是「脚本模板(cat/fields/tpl)」而非内容条目，
  //     物理选题条目在 data-a.js，已单独达标，故不纳入 depth/solution 质检。
];

/* 空泛套话黑名单（命中即判不合格） */
const BLACKLIST = [
  '重点抓', '好好复习', '多做题', '提高效率', '加强练习', '认真对待',
  '培养兴趣', '打好基础', '注意方法', '合理安排', '积极沟通', '保持心态'
];

/* 量化特征：阿拉伯数字 / 中文数量 / 时间节点 / 官方入口 / 可复用方法名 */
const QUANT = new RegExp([
  '\\d',                                              // 阿拉伯数字
  '[一二三四五六七八九十两半]\\s*[条组次道年周天张份套步类本科门轮遍]', // 中文数量词
  '每天|每周|每月|每学期|当周|当天|分钟|小时|考前|开学|截止|学期初|学期末', // 时间
  '高一|高二|高三|初一|初二|初三|上学期|下学期|暑假|寒假',            // 学段时间
  '官网|官微|官方公告|招生办|教体局|招考中心',                        // 官方入口
  '模板|清单|对照表|索引|台账|证明|档案|分度值|口诀|框架|流程',        // 方法名
  '%|％'
].join('|'));

function loadVar(file, varName) {
  const p = path.join(ASSETS, file);
  if (!fs.existsSync(p)) return null;
  const src = fs.readFileSync(p, 'utf8');
  const w = {};
  try {
    (new Function('window', 'with(window){' + src + '}'))(w);
  } catch (e) {
    return { __err: e.message };
  }
  return w[varName] || null;
}

function checkItem(o) {
  const bad = [];
  const d = (o.depth || '').trim();
  const s = (o.solution || '').trim();

  if (!d) bad.push('缺depth');
  else if (d.length < 15) bad.push('depth过短(' + d.length + '字)');

  if (!s) bad.push('缺solution');
  else {
    const marks = ['①', '②', '③'].filter(m => s.includes(m)).length;
    if (marks < 3) bad.push('solution不足3条(只有' + marks + '个序号)');
    if (!QUANT.test(s)) bad.push('solution无量化/时间/方法特征');
    const hit = BLACKLIST.filter(b => s.includes(b));
    if (hit.length) bad.push('命中套话:' + hit.join('/'));
  }
  return bad;
}

/* ============ 热点新鲜度闸门 ============
 * 目的：防止自动化「不去搜新热点、把昨天的原样端上来」。
 * 规则：
 *   F1 hot-events.date / today-feed.date 必须等于今天
 *   F2 每条 events 必须有 fresh 字段（'new' 今日新增 / 'carry' 延续）
 *   F3 fresh==='new' 至少 3 条，且占比不低于 40%
 *   F4 fresh==='carry' 必须写 progress（最新进展，≥8字），不许原样搬运
 *   F5 标题不得与归档（hot-archive.js 最近3天）中任何标题完全相同
 *   F6 每条必须有 src（来源出处），不许无源热点
 */
function todayStr() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function checkFresh() {
  const out = [];
  let fail = 0;
  const TODAY = todayStr();

  const HOT = loadVar('hot-events.js', 'HOT');
  const TF = loadVar('today-feed.js', 'TODAY_FEED');
  const ARCH = loadVar('hot-archive.js', 'HOT_ARCHIVE') || { days: [] };

  if (!HOT || HOT.__err) { out.push('❌ hot-events.js 无法解析'); return { out, fail: 1 }; }

  /* F1 日期 */
  [['hot-events.js', HOT], ['today-feed.js', TF]].forEach(([f, o]) => {
    if (!o || o.__err) { out.push('❌ ' + f + ' 无法解析'); fail++; return; }
    if (o.date !== TODAY) { out.push('❌ F1 ' + f + ' date=' + o.date + '，不是今天(' + TODAY + ')→ 说明本班没有更新热点'); fail++; }
    else out.push('✅ F1 ' + f + ' 日期为今天 ' + TODAY);
  });

  const evs = HOT.events || [];
  /* F2 fresh 字段 */
  const noFresh = evs.filter(e => !['new', 'carry'].includes(e.fresh));
  if (noFresh.length) { out.push('❌ F2 有 ' + noFresh.length + ' 条缺 fresh 标记(new/carry)：' + noFresh.map(e => (e.title || '').slice(0, 18)).join(' / ')); fail++; }
  else out.push('✅ F2 全部条目已标记 fresh');

  /* F3 新增数量与占比 */
  const news = evs.filter(e => e.fresh === 'new');
  const ratio = evs.length ? Math.round(news.length / evs.length * 100) : 0;
  if (news.length < 3) { out.push('❌ F3 今日新增仅 ' + news.length + ' 条（要求≥3）→ 必须重新联网搜索新热点'); fail++; }
  else if (ratio < 40) { out.push('❌ F3 新增占比 ' + ratio + '%（要求≥40%）→ 延续条目太多，需再搜'); fail++; }
  else out.push('✅ F3 今日新增 ' + news.length + ' 条 / 共 ' + evs.length + ' 条（' + ratio + '%）');

  /* F4 carry 必须带进展 */
  const badCarry = evs.filter(e => e.fresh === 'carry' && (!e.progress || String(e.progress).trim().length < 8));
  if (badCarry.length) { out.push('❌ F4 有 ' + badCarry.length + ' 条延续热点未写 progress(最新进展)：' + badCarry.map(e => (e.title || '').slice(0, 18)).join(' / ')); fail++; }
  else out.push('✅ F4 延续条目均已写最新进展');

  /* F5 与归档去重
     注意：必须排除「今天」这一天的归档条目。正常流程是「质检通过 → 再把当天标题写入归档」，
     若补跑后再次复检，今天的标题已在档内，不排除就会拿自己跟自己比，误报 100% 重复。 */
  const recent = (ARCH.days || []).filter(d => d.date !== TODAY).slice(0, 3);
  const oldTitles = new Set(recent.flatMap(d => d.titles || []));
  const dup = evs.filter(e => oldTitles.has(e.title));
  if (dup.length) { out.push('❌ F5 有 ' + dup.length + ' 条标题与最近3天完全相同（原样搬运）：' + dup.map(e => e.title.slice(0, 20)).join(' / ')); fail++; }
  else out.push('✅ F5 无与最近' + recent.length + '天重复的标题');

  /* F6 来源 */
  const noSrc = evs.filter(e => !e.src || String(e.src).trim().length < 4);
  if (noSrc.length) { out.push('❌ F6 有 ' + noSrc.length + ' 条无来源(src)：' + noSrc.map(e => (e.title || '').slice(0, 18)).join(' / ')); fail++; }
  else out.push('✅ F6 全部条目标注来源');

  return { out, fail };
}

/* ============ 平台合规闸门（雷词扫描）============
 * 缘起：2026-08-07 老闫物理号简介因「专治/10年/提分/救我」被抖音处罚。
 * 目的：把「凭感觉写文案」变成机器过闸——任何数据文件里出现 P0/P1 雷词，质检直接判不合格。
 * 词库来源：assets/data-compliance.js（COMPLIANCE.rules），改词只改那一个文件。
 * 用法：node tools/qc.js --bio   （全量质检时自动包含）
 */
function checkBio() {
  const out = [];
  let fail = 0;

  const C = loadVar('data-compliance.js', 'COMPLIANCE');
  if (!C || C.__err || !C.rules) {
    out.push('❌ data-compliance.js 无法解析，雷词库缺失');
    return { out, fail: 1 };
  }

  /* 只扫 P0/P1（P2 为软风险，仅提示不判死） */
  const hard = C.rules.filter(r => r.level === 'P0' || r.level === 'P1');
  const soft = C.rules.filter(r => r.level === 'P2');

  /* 「文案类」文件 = 内容会被直接搬到抖音/朋友圈/公众号发出去的。
     其余为「情报类」（学校库/分数线/政策/校园动态），里面出现
     "招生、报名、第一中学" 属客观陈述，只对它们扫 scope:'all' 的绝对红线。 */
  const COPY_FILES = new Set([
    'data-core.js', 'data-strategy.js', 'data-tpl.js', 'data-copy.js',
    'data-live.js', 'data-livecard.js', 'data-article.js',
    'moments.js', 'data-moment.js',
    'data-a.js', 'data-b.js', 'data-physics-content.js',
    'data-politics.js', 'data-eduplan.js', 'data-methods.js',
    'today-feed.js', 'data-today.js', 'data-iterate-override.js'
  ]);
  const isCopy = f => COPY_FILES.has(f);
  const applies = (rule, f) => (rule.scope === 'all') || isCopy(f);

  /* 「情报类」文件整体豁免：里面记录的是客观事实与他人内容，
     例如竞品账号的简介原文里带「提分」、学校库里的真实校名「太钢一中」、
     民办校学费、政策原文。这些不会变成我方对外文案，判违规纯属误伤。 */
  const INTEL_FILES = new Set([
    'data-schools.js', 'data-school-aliases.js', 'data-school-history.js', 'data-scorelines.js', 'data-politics-news.js',
    'data-rival.js', 'data-calendar.js', 'data-policy.js', 'data-exam.js',
    'data-tier1.js', 'data-taiyuan-geo.js', 'data-parent-weekly.js',
    'school-news.js', 'school-shared.js', 'school-scan-list.js',
    'my-events.js', 'iterate-latest.js', 'hot-events.js'
  ]);

  /* 扫描范围：assets 下所有 .js，排除词库自身、归档与情报类 */
  const SKIP = new Set(['data-compliance.js', 'hot-archive.js']);
  const files = fs.readdirSync(ASSETS)
    .filter(f => f.endsWith('.js') && !SKIP.has(f) && !INTEL_FILES.has(f));

  const hits = [];     // P0/P1 命中
  const softHits = []; // P2 命中

  files.forEach(f => {
    const src = fs.readFileSync(path.join(ASSETS, f), 'utf8');
    const lines = src.split('\n');
    lines.forEach((line, idx) => {
      /* 跳过注释行，避免把说明文字误判 */
      const t = line.trim();
      if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
      /* 白名单：合规红线清单、敏感词替换对照表这类「故意写出雷词做反面教材」的行，
         在行尾加 /* qc-ok *​/ 标记即可豁免。防止防火墙把自己烧了。 */
      if (line.includes('qc-ok')) return;
      hard.forEach(rule => {
        if (!applies(rule, f)) return;
        rule.words.forEach(w => {
          if (line.includes(w)) {
            hits.push({ f, ln: idx + 1, w, level: rule.level, cat: rule.cat, fix: rule.fix });
          }
        });
      });
      soft.forEach(rule => {
        if (!applies(rule, f)) return;
        rule.words.forEach(w => {
          if (line.includes(w)) softHits.push({ f, ln: idx + 1, w, cat: rule.cat });
        });
      });
    });
  });

  if (hits.length) {
    fail = hits.length;
    out.push('❌ 发现 ' + hits.length + ' 处 P0/P1 违规表述（会导致平台处罚，必须清除）：');
    hits.forEach(h => {
      out.push('   [' + h.level + '·' + h.cat + '] ' + h.f + ':' + h.ln + ' → 「' + h.w + '」');
      out.push('        整改：' + h.fix);
    });
  } else {
    out.push('✅ 全站 ' + files.length + ' 个数据文件，无 P0/P1 违规表述');
  }

  if (softHits.length) {
    out.push('⚠️  另有 ' + softHits.length + ' 处 P2 软风险（不判不合格，但叠加会加重处罚）：');
    softHits.slice(0, 10).forEach(h => out.push('   [P2·' + h.cat + '] ' + h.f + ':' + h.ln + ' → 「' + h.w + '」'));
    if (softHits.length > 10) out.push('   … 其余 ' + (softHits.length - 10) + ' 处略');
  }

  return { out, fail };
}

/* ── 过期判定（供「漏跑守护」自动化调用）───────────────────────────
 * node tools/qc.js --stale
 *   exit 0 = 数据新鲜，无需补跑
 *   exit 2 = 数据过期（超 STALE_H 小时），必须立即补跑一班
 * 判定固化在脚本里，不依赖 AI 主观判断。
 */
const STALE_H = 14; // 早8→晚8 间隔12h，留2h容差；超14h即说明至少漏了一班

function ageHours(obj) {
  if (!obj) return null;
  if (obj.updatedAt) {
    const t = Date.parse(obj.updatedAt);
    if (!isNaN(t)) return (Date.now() - t) / 3600000;
  }
  if (obj.date) {
    const t = Date.parse(obj.date + 'T08:00:00+08:00');
    if (!isNaN(t)) return (Date.now() - t) / 3600000;
  }
  return null;
}

function staleCheck() {
  const files = [
    ['hot-events.js', 'HOT', '实时热点库'],
    ['today-feed.js', 'TODAY_FEED', '今日行动'],
    ['school-news.js', 'SCHOOL', '学校情报站'],
  ];
  console.log('=== 数据新鲜度检查（阈值 ' + STALE_H + ' 小时）===');
  console.log('当前时间：' + new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
  let worst = 0, anyStale = false, missing = false;

  files.forEach(([file, varName, label]) => {
    const obj = loadVar(file, varName);
    if (!obj || obj.__err) {
      console.log('❌ ' + label.padEnd(12) + ' 文件缺失或解析失败 → 需补跑');
      missing = true;
      return;
    }
    const h = ageHours(obj);
    if (h == null) {
      console.log('⚠️  ' + label.padEnd(12) + ' 无 updatedAt/date，无法判定 → 保守视为需补跑');
      missing = true;
      return;
    }
    if (h > worst) worst = h;
    const stale = h > STALE_H;
    if (stale) anyStale = true;
    console.log((stale ? '❌ ' : '✅ ') + label.padEnd(12)
      + ' 更新于 ' + h.toFixed(1) + ' 小时前'
      + '（' + (obj.updatedAt || obj.date || '?') + '）'
      + (stale ? '  → 已过期' : ''));
  });

  console.log('---');
  if (anyStale || missing) {
    console.log('【判定】需要补跑：最旧数据已 ' + worst.toFixed(1) + ' 小时未更新（阈值 ' + STALE_H + 'h）。');
    console.log('请立即执行一次完整的热点更新流程（搜索新热点 → 重写三个数据文件 → 跑 --today --fresh 质检 → 重部署）。');
    process.exit(2);
  }
  console.log('【判定】数据新鲜（最旧 ' + worst.toFixed(1) + ' 小时），无需补跑。本次守护任务到此结束，不要做任何其他事。');
  process.exit(0);
}

function main() {
  if (process.argv.includes('--stale')) return staleCheck();
  const onlyToday = process.argv.includes('--today');
  /* --today 自动开启新鲜度闸门：自动化 prompt 里只写了 --today，
     若靠 prompt 记得加 --fresh 就会漏检，故在此强制绑定。 */
  const doFresh = process.argv.includes('--fresh') || onlyToday;
  const list = onlyToday
    ? TARGETS.filter(t => ['today-feed.js', 'hot-events.js', 'school-news.js'].includes(t[0]))
    : TARGETS;

  let totalAll = 0, badAll = 0;
  const report = [];

  list.forEach(([file, varName, pick, label]) => {
    const obj = loadVar(file, varName);
    if (!obj) { report.push(['⚠️ ', label.padEnd(18), file + ' 未找到或未定义 ' + varName].join(' ')); return; }
    if (obj.__err) { report.push(['❌', label.padEnd(18), file + ' 解析失败: ' + obj.__err].join(' ')); badAll++; return; }
    let arr = [];
    try { arr = pick(obj) || []; } catch (e) { arr = []; }
    if (!Array.isArray(arr) || !arr.length) { report.push(['⚠️ ', label.padEnd(18), file + ' 无条目'].join(' ')); return; }

    const fails = [];
    arr.forEach((o, i) => {
      const bad = checkItem(o);
      if (bad.length) fails.push('    #' + (i + 1) + ' 《' + (o.title || o.theme || o.school || '无题').slice(0, 26) + '》→ ' + bad.join('、'));
    });
    totalAll += arr.length;
    badAll += fails.length;
    const flag = fails.length ? '❌' : '✅';
    report.push(flag + ' ' + label.padEnd(18) + file.padEnd(26) + (arr.length - fails.length) + '/' + arr.length + ' 达标');
    fails.forEach(f => report.push(f));
  });

  console.log('=== 亿领智作台 · 内容质量质检 ' + (onlyToday ? '(当日自动化产出)' : '(全量)') + ' ===');
  report.forEach(r => console.log(r));
  console.log('---');
  console.log('总计 ' + (totalAll - badAll) + '/' + totalAll + ' 达标' + (badAll ? '，不合格 ' + badAll + ' 条' : ''));

  /* ── 结构完整性闸门：updatedAt / fresh 字段必须写 ──────────────
   * 规范固化在质检里，不依赖自动化 prompt 记得提醒。
   * updatedAt 缺失 → 前端过期哨兵失效、漏跑守护误判，属于致命缺陷。
   */
  let structFail = 0;
  if (onlyToday) {
    const structOut = [];
    [['hot-events.js', 'HOT', 'events', '实时热点库'],
     ['today-feed.js', 'TODAY_FEED', 'recs', '今日行动'],
     ['school-news.js', 'SCHOOL', 'items', '学校情报站']].forEach(([file, varName, key, label]) => {
      const obj = loadVar(file, varName);
      if (!obj || obj.__err) { structOut.push('❌ ' + label.padEnd(12) + ' 文件缺失/解析失败'); structFail++; return; }
      const probs = [];
      if (!obj.updatedAt) {
        probs.push('缺 updatedAt（致命：前端过期哨兵靠它判定）');
      } else {
        const t = Date.parse(obj.updatedAt);
        if (isNaN(t)) probs.push('updatedAt 格式非法（应为 YYYY-MM-DDTHH:mm:ss+08:00）');
        else if ((Date.now() - t) / 3600000 > 3) probs.push('updatedAt 不是本班时间（' + ((Date.now() - t) / 3600000).toFixed(1) + 'h前），必须写成本次写入的真实时刻');
      }
      const arr = obj[key] || [];
      const noFresh = arr.filter(o => !o.fresh).length;
      if (noFresh) probs.push(noFresh + ' 条缺 fresh 字段（应为 "new" 或 "carry"）');
      const carryNoProg = arr.filter(o => o.fresh === 'carry' && !o.progress).length;
      if (carryNoProg) probs.push(carryNoProg + ' 条 fresh:"carry" 但没写 progress（延续项必须写今天的新进展）');
      if (probs.length) { structFail += probs.length; structOut.push('❌ ' + label.padEnd(12) + probs.join('；')); }
      else structOut.push('✅ ' + label.padEnd(12) + 'updatedAt + fresh 字段完整');
    });
    console.log('\n=== 结构完整性质检（updatedAt / fresh）===');
    structOut.forEach(l => console.log(l));
    console.log('---');
    console.log(structFail ? '结构不合格：' + structFail + ' 项' : '结构全部通过');
  }

  let freshFail = 0;
  if (doFresh) {
    const r = checkFresh();
    freshFail = r.fail;
    console.log('\n=== 热点新鲜度质检（是否真的搜了新热点）===');
    r.out.forEach(l => console.log(l));
    console.log('---');
    console.log(freshFail ? '新鲜度不合格：' + freshFail + ' 项' : '新鲜度全部通过');
  }

  /* ── 合规闸门：任何时候都跑（雷词是硬伤，比内容干瘪严重得多）── */
  let bioFail = 0;
  {
    const r = checkBio();
    bioFail = r.fail;
    console.log('\n=== 平台合规质检（抖音雷词扫描）===');
    r.out.forEach(l => console.log(l));
    console.log('---');
    console.log(bioFail ? '合规不合格：' + bioFail + ' 处 P0/P1 违规' : '合规全部通过');
  }

  if (bioFail) {
    console.log('\n【合规不合格处理要求】这是会导致账号被处罚的硬伤，优先级高于一切：');
    console.log('  1. 按上面每条的「整改」提示逐处改写，不要只删词、要换成合规表达；');
    console.log('  2. 改完重跑 node tools/qc.js 确认归零，再部署；');
    console.log('  3. 词库在 assets/data-compliance.js（COMPLIANCE.rules），新踩的坑要补进去，别只改文案。');
  }

  if (badAll) {
    console.log('\n【质量不合格处理要求】必须重写上述条目的 depth / solution：');
    console.log('  depth    = 一句话底层逻辑（为什么是这样的机制/规律，≥15字）');
    console.log('  solution = ① ② ③ 三条可落地动作，每条含量化指标/时间节点/具体方法或官方入口');
    console.log('  严禁「重点抓XX」「好好复习」这类正确废话。');
  }
  if (freshFail) {
    console.log('\n【新鲜度不合格处理要求】说明本班没有真正去搜新热点，必须：');
    console.log('  1. 重新联网检索太原/山西近24小时教育动态（教育局官网、招考中心、本地媒体、平台热榜）；');
    console.log('  2. 至少产出 3 条全新事件并标 fresh:"new"，新增占比≥40%；');
    console.log('  3. 昨天已有的事件若仍有效，标 fresh:"carry" 并写 progress（今天比昨天多了什么进展）；');
    console.log('  4. 每条必须写 src（来源+日期），不许无源热点。');
  }

  if (structFail) {
    console.log('\n【结构不合格处理要求】必须补齐字段后重跑：');
    console.log('  1. 每个数据文件顶层加 "updatedAt": "YYYY-MM-DDTHH:mm:ss+08:00"，值 = 你本次写入的真实时刻（精确到秒）；');
    console.log('     这个字段是前端「数据新鲜度哨兵」和「漏跑守护」的唯一判定依据，漏写会导致工作台永久误报过期。');
    console.log('  2. 每个条目加 "fresh"："new"（本班新搜到）或 "carry"（延续昨日）；');
    console.log('  3. fresh:"carry" 的条目必须再加 "progress"：今天比昨天多了什么新进展。');
  }

  process.exit(badAll || freshFail || structFail || bioFail ? 1 : 0);
}

main();
