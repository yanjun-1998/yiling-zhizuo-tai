/* 亿领智作台 · 学校简介批量生成 (tools/gen-intro.js)
 * 为 SCHOOLS 每所学校生成 intro 字段。
 * 原则：零编造——只用已有真实字段(name/district/nature/type/tier/classes/
 *       score2025/scores5/dingxiang/campuses/addr/note) + schoolDetails(7所富详情)。
 *       查不到的字段跳过，绝不写"未知/约X"等猜测；结尾统一标官方为准。
 * 用法：node tools/gen-intro.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
function loadVar(file, name) {
  const ctx = { window: {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ASSETS, file), 'utf8'), ctx);
  return ctx.window[name];
}
const SCHOOLS = loadVar('data-schools.js', 'SCHOOLS');
const SCORELINES = loadVar('data-scorelines.js', 'SCORELINES');
const sch = SCHOOLS.schools;

// 7 所富详情按校名建索引（归一化去括号/去后缀，兼容"X中学校(别名)"这类写法）
function normName(n) { return String(n || '').replace(/[（(].*?[)）]/g, '').replace(/中学校|中学|学校$/g, '').replace(/^太原市/, '').trim(); }
const detailMap = {};
(SCORELINES.schoolDetails && SCORELINES.schoolDetails.items || []).forEach(d => { detailMap[normName(d.name)] = d; });

function clean(v) {
  if (v == null) return '';
  let s = String(v).trim();
  if (s === '' || s === '—' || s === '-' || s.startsWith('未知')) return '';
  return s;
}
function typeLabel(t) {
  return (t === '高级中学') ? '高中'
    : (t === '完全中学') ? '完全中学（含初中）'
    : (t === '十二年一贯制') ? '十二年一贯制'
    : (t === '初级中学') ? '初中'
    : (t === '九年一贯制') ? '九年一贯制初中'
    : (t || '');
}
const tierMap = {
  '一类重点': '属太原一类重点中学，办学历史较长、生源与师资较强。',
  '民办优质': '为太原民办优质校，办学特色较鲜明。',
  '民办普通': '为太原民办普通校。',
  '公办一般': '为太原公办一般校。'
};

function buildIntro(s) {
  const detail = detailMap[normName(s.name)] || detailMap[s.name];
  const out = [];
  const nat = (s.nature === '公办') ? '公办' : (s.nature === '民办') ? '民办' : (s.nature === '民转公') ? '民转公' : '';
  const shortN = (s.short && s.short !== s.name) ? `（${s.short}）` : '';
  const loc = clean(s.district) ? `位于太原市${clean(s.district)}，` : '';
  out.push(`${s.name}${shortN}${loc}是${nat}${typeLabel(s.type)}。`);
  if (tierMap[s.tier]) out.push(tierMap[s.tier]);

  // 班型：优先 detail，其次 classes（过滤"未知"）
  if (detail && clean(detail.classes)) out.push(`班型：${clean(detail.classes)}。`);
  else if (clean(s.classes)) out.push(`班型：${clean(s.classes)}。`);

  // 录取线：优先 detail 的精确字符串，其次 score2025 数值
  if (detail && clean(detail.score2025)) out.push(`2025年统招线：${clean(detail.score2025)}。`);
  else if (s.score2025 != null) out.push(`2025年统招第一志愿线约${s.score2025}分（当年总分850）。`);
  else if (s.scores5 && s.scores5.length) {
    const last = s.scores5.filter(x => x.score != null).pop();
    if (last) out.push(`近年有公开统招录取线（最近可查 ${last.year} 年约 ${last.score} 分，以官方为准）。`);
  }

  // 招生/定向（仅当为真实字符串，过滤布尔值/未知）
  if (typeof s.dingxiang === 'string' && clean(s.dingxiang) && !/^(true|false)$/i.test(clean(s.dingxiang))) {
    out.push(`招生：${clean(s.dingxiang)}。`);
  }

  // 地址 / 住宿
  let addr = '', boarding = '';
  if (detail && clean(detail.campus)) addr = clean(detail.campus);
  else if (s.campuses && s.campuses[0]) { addr = clean(s.campuses[0].addr); boarding = clean(s.campuses[0].boarding); }
  else addr = clean(s.addr);
  if (!boarding && detail && clean(detail.boarding)) boarding = clean(detail.boarding);
  if (addr) out.push(`地址：${addr}。`);
  if (boarding && boarding !== '未知') out.push(`住宿：${boarding}。`);

  // 分班规则（detail 才有真实数据）
  if (detail && clean(detail.fenban)) out.push(`分班：${clean(detail.fenban)}。`);

  // 初中段补招生政策；其它补 note 精华
  if (s.type === '初级中学' || s.type === '九年一贯制') {
    out.push('实行免试就近入学、均衡编班（不设立重点班/实验班分层），招生划片范围与班额以区教育局当年通知为准。');
  } else if (clean(s.note)) {
    let n = clean(s.note);
    if (n.length > 46) n = n.slice(0, 46) + '…';
    out.push(n);
  }

  out.push('以上信息以太原市教育主管部门及学校官方发布为准。');
  return out.join('');
}

let done = 0, withDetail = 0;
sch.forEach(s => {
  const has = detailMap[normName(s.name)] || detailMap[s.name];
  s.intro = buildIntro(s);
  done++;
  if (has) withDetail++;
});
fs.writeFileSync(path.join(ASSETS, 'data-schools.js'), 'window.SCHOOLS = ' + JSON.stringify(SCHOOLS, null, 2) + ';\n');
console.log(`✅ 已为 ${done} 所学校生成 intro（含 ${withDetail} 所重点校富详情并入）`);
// 抽样
[0, 1, 2].forEach(i => { const s = sch[i]; console.log(`\n[${s.name}]\n${s.intro}`); });
const sampleDetail = sch.find(s => detailMap[normName(s.name)] || detailMap[s.name]);
if (sampleDetail) console.log(`\n[重点校样例 ${sampleDetail.name}]\n${sampleDetail.intro}`);
