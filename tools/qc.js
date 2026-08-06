/* 亿领智作台 · 内容质量质检闸门 qc.js
 * 用途：校验数据层每条内容是否具备「深度(depth) + 可落地方案(solution)」，
 *       防止自动化写出干瘪的三段式。
 * 用法：node tools/qc.js            → 全量体检，不合格 exit 1
 *      node tools/qc.js --today    → 只检查当日自动化产出的三个文件
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

function main() {
  const onlyToday = process.argv.includes('--today');
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

  if (badAll) {
    console.log('\n【不合格处理要求】必须重写上述条目的 depth / solution：');
    console.log('  depth    = 一句话底层逻辑（为什么是这样的机制/规律，≥15字）');
    console.log('  solution = ① ② ③ 三条可落地动作，每条含量化指标/时间节点/具体方法或官方入口');
    console.log('  严禁「重点抓XX」「好好复习」这类正确废话。');
    process.exit(1);
  }
  process.exit(0);
}

main();
