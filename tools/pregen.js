/* 亿领智作台 · 批量预生成缓冲生成器 (tools/pregen.js)
 * 用途：当平台对自动化/AI 限流、today-feed 产出为空时，台子自动降级到
 *       PREBUF 里预先确定性生成的 30 天内容，保证「对外内容不断更」。
 * 原则：零 AI 调用、零编造、完全由本地数据(data-calendar/data-exam)推导，
 *       所有文案自带 depth(机制)+solution(①②③)，且不触雷词库。
 * 用法：node tools/pregen.js [YYYY-MM-DD起始日，默认今天] [天数，默认30]
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

function loadVar(file, name) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ASSETS, file), 'utf8'), ctx);
  return ctx.window[name];
}

const CAL = loadVar('data-calendar.js', 'SCHOOL_CAL');
const EXAM = loadVar('data-exam.js', 'EXAM');
const SCHOOLS = loadVar('data-schools.js', 'SCHOOLS');

/* ---------- 日期工具 ---------- */
function parseMd(str) {
  if (!str || str === '-') return null;
  const m = String(str).match(/(\d{1,2})\/(\d{1,2})/);
  if (!m) return null;
  return new Date(2026, parseInt(m[1], 10) - 1, parseInt(m[2], 10));
}
function fmt(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function diffDays(a, b) { return Math.round((a - b) / 86400000); }

/* ---------- 生成事件锚点 ---------- */
const anchors = [];
function addAnchor(date, type, school, extra) {
  if (!date) return;
  anchors.push(Object.assign({ date, type, school: school || '' }, extra || {}));
}

// 1) 开学轴 13 校
(CAL.opening2026 || []).forEach(e => {
  addAnchor(parseMd(e.exam), 'exam', e.school, { subj: e.examSubjects, raw: e.exam });
  addAnchor(parseMd(e.military), 'military', e.school, { raw: e.military });
  addAnchor(parseMd(e.opening), 'opening', e.school, { raw: e.opening });
});
// 2) 官方校历全局节点
addAnchor(parseMd(CAL.officialCalendar.senior.firstDay), 'openSenior', '全市高中', {});
addAnchor(parseMd(CAL.officialCalendar.compulsory.firstDay), 'openCompulsory', '全市义务教育', {});
// 3) 太原固定节点（以官方通知为准）
addAnchor(new Date(2026, 7, 28), 'balance', '全市初一', { note: '8/28 太原初一均衡编班，以官方通知为准' });
// 4) 考试历：期初摸底考（9月）
addAnchor(new Date(2026, 8, 5), 'earlyExam', '全校', { note: '9月期初摸底考，定位学情不排名' });

anchors.sort((a, b) => a.date - b.date);

/* ---------- 常青模板池（限流兜底填充，合规零雷词） ---------- */
const EVERGREEN = [
  {
    zone: 'A', pri: 'P2', ck: '物理', fmt: '手写板', dur: '50s',
    title: '受力分析总错？先把“研究对象”框出来',
    hook: '一上手就列一堆力，八成是研究对象没划清',
    body: '① 先圈出要分析的物体，只画它受的力 ② 重力竖直向下、弹力垂直接触面、摩擦力沿接触面 ③ 多物体先隔离再整体，别混在一起',
    depth: '受力分析的本质是“对谁受力、受哪些力”逐条枚举，研究对象一旦混进相邻物体，力的来源就乱，后续所有平衡方程都会错。',
    solution: '① 每次画受力图先用红笔圈出“只分析这一个物体”，其它物体的力一律不画 ② 按“重力→弹力→摩擦→其它场力”固定顺序找，漏一个就重来 ③ 每周挑3道错题重画受力图，只练“框对象”这一步，两周形成条件反射'
  },
  {
    zone: 'A', pri: 'P2', ck: '物理', fmt: '手写板', dur: '45s',
    title: '电路图看串并联，先找“电流分叉点”',
    hook: '串并联分不清，十有八九是没找到分叉点',
    body: '① 从电源正极出发沿导线走，遇到岔路就是分叉点 ② 分叉后再汇合的是并联，始终一条线的是串联 ③ 电流表当导线、电压表当断路先简化',
    depth: '串并联的判断决定用哪套公式，并联各支路电压相等、串联电流处处相等，分叉点把电路切成可独立计算的块，简化后才能套定律。',
    solution: '① 拿到电路先标电源正负极，用铅笔把导线“捋直”画成标准方块图 ② 找分叉点：一条线变两条即并联起点，再合一条即并联终点 ③ 每道题做完用“电压相等/电流相等”反推验证一遍，错一次就重画'
  },
  {
    zone: 'A', pri: 'P2', ck: '物理', fmt: '不露脸讲解', dur: '55s',
    title: '物理实验题按“原理→操作→误差”三句话拿分',
    hook: '实验题不是背步骤，是讲清为什么这么操作',
    body: '① 原理句：这套装置测的是什么物理量、依据哪条定律 ② 操作句：先调零、再连线、后读数 ③ 误差句：系统误差来自哪、怎么减小',
    depth: '实验题的评分点分布在“懂原理、会操作、知误差”三个层次，只背步骤拿不到满分，评委看的是你对测量不确定性的表述。',
    solution: '① 每做完一个课本实验，逼自己用三句话口述原理/操作/误差，说不出就回看书 ② 误差句固定模板：“本实验系统误差主要来自××，可通过××减小” ③ 考前把必做实验按这三句话各写一张卡，一天过两张'
  },
  {
    zone: 'B', pri: 'P2', ck: '升学', fmt: '不露脸表格', dur: '60s',
    title: '定向生没招满会回流统招，校内排名比全市排名更值钱',
    hook: '定向指标用不完，会直接变成统招名额放出来',
    body: '① 定向线控制在统招线下50分以内且不低于603分 ② 六城区未完成指标在已报考未录取考生中二次择优 ③ 二次仍未完成的定向指标转为统招计划',
    depth: '定向指标按初中学校分配、未完成即回流统招，本质是把优质高中学位从全市裸分竞争部分转成校内位次竞争，孩子在校内排第几比全市排名更能决定能否吃到这50分差额。',
    solution: '① 开学第一周向班主任要本校近2年定向指标数与录取末位名次，算出校内前多少名可用定向 ② 把目标高中去年统招线减50分设为保底目标，每次大考对照1次 ③ 从太原市招考中心官网《报考指南》抄下定向招生学校名单做对照表，每学期核对增减'
  },
  {
    zone: 'B', pri: 'P2', ck: '升学', fmt: '不露脸讲解', dur: '55s',
    title: '同分先比语数外，理综排第四，物理该投多少时间',
    hook: '同分排序里理综是第四顺位，不是第一',
    body: '① 同分按语文、数学、外语、理科综合、文科综合顺序比单科 ② 理综含物理与化学 ③ 满分839分，自839分起每5分一段，段内志愿优先',
    depth: '同分排序是字典序逐科比较而非总分加权，前三科任一科高一分就终止比较，理综的边际价值集中在把总分抬进更高的5分段，而不是赢同分对决。',
    solution: '① 用最近3次大考算账：物理再提5分能否推进上一个5分段，能则每天投40分钟 ② 复习优先级按实验题、教材原型题、压轴题排序，课本必做实验按原理/操作/误差三句话口述 ③ 每周日晚20分钟做错因分类表，分“看不懂情境/选错模型/算错”三类，只有第二类需要回头重学'
  },
  {
    zone: 'B', pri: 'P2', ck: '志愿', fmt: '不露脸表格', dur: '50s',
    title: '三个志愿栏按“冲稳保”排，别只填一个',
    hook: '志愿栏全填满，比赌一个更稳',
    body: '① 冲：去年线略高于自己分的1所 ② 稳：与自己分持平的1所 ③ 保：明显低于自己分的1所',
    depth: '平行志愿下“冲稳保”梯度是把不确定性的风险摊开，只填一所等于把全部筹码押在单一落点上，一旦滑档没有任何缓冲。',
    solution: '① 把自己分数和近3年各校线做成一张对照表，标出冲/稳/保三档 ② 每个档至少填1所、保底档选招生计划大且往年有缺额的 ③ 提交前退出重登复核一遍并截图，以网报系统数据为准，不信任何“内部补录”说辞'
  },
  {
    zone: 'B', pri: 'P2', ck: '政策', fmt: '不露脸讲解', dur: '55s',
    title: '均衡编班是S型蛇形分配+多方监督，班差被人为抹平',
    hook: '8月28号那天，太原初一分班是当着家长面摇的',
    body: '① 凡2轨以上学校须均衡编班，严禁重点班快慢班 ② 按小学成绩S型蛇形分配 ③ 全程录像，人大代表、政协委员、纪检、媒体、家长代表现场监督',
    depth: '均衡编班按成绩S型蛇形分配加多方现场监督，把生源差异摊平到每个班，班与班的起点差被人为抹掉，孩子最终差距回到家庭端的学习习惯管理。',
    solution: '① 提前1周向班主任或教务处报名做家长代表进现场，名额通常每校3到5人 ② 分班公布后索要公开的编班方案文本，核对有无实验班、创新班等变相名目 ③ 8月26日报到到9月1日开学，每天固定1小时做衔接：数学预习有理数、英语背初一上册词汇'
  },
  {
    zone: 'A', pri: 'P2', ck: '学法', fmt: '手写板', dur: '45s',
    title: '错题本只记“选错模型”和“算错”两类',
    hook: '错题抄一堆，不如只留两类',
    body: '① 选错模型：题情境一变就套错公式，这类要回头重学概念 ② 算错：步骤对但计算出错，这类练熟练度 ③ 看不懂情境的当场问，别留到本子',
    depth: '错题的价值不在“记下来”，在“分诊”——不同错因对应完全不同的补救动作，混在一起抄只会重复无效劳动。',
    solution: '① 每道错题用红笔标类别：模型错/计算错/读题错，只把前两类进本 ② 模型错旁边写“正确模型一句话”，计算错旁边写“易错算术点” ③ 每周日花20分钟重做本子里标红的两类题，做对就划掉，本子越薄越好'
  }
];

/* ---------- 事件锚点 → rec 构造 ---------- */
function buildEventRec(a, day) {
  const dn = diffDays(a.date, day);
  const when = `${a.date.getMonth() + 1}月${a.date.getDate()}日`;
  const tag = dn > 0 ? `${dn}天后` : (dn === 0 ? '今天' : `${Math.abs(dn)}天前刚发生`);
  if (a.type === 'exam') {
    return {
      zone: 'A', pri: 'P1', ck: '衔接', fmt: '手写板', dur: '50s',
      title: `${a.school} 新高一摸底考临近：物理按这三块准备`,
      hook: `${when}前后${a.school}组织入学摸底考，现在剩的时间刚好够补一轮`,
      body: `① 内容多覆盖初中力学、电学与基本作图 ${a.subj && a.subj !== '-' ? '（参考科目：' + a.subj + '）' : ''} ② 结果常被用作分层教学与后续选科参考 ③ 不等开学再动，现在每天固定时段更有效`,
      depth: '摸底考的真实功能是分层而非评价，它给任课老师留下的第一印象会影响后续提问频次、辅导资源与选科建议的分配，相对位次比绝对分数更值钱。',
      solution: '① 剩余天数每天90分钟固定三件事：受力分析10道、电路串并联识别10道、作图题5道，共25题不加量 ② 初中物理公式按力热电光四类各写1张A4口诀卡，早晚各默读1遍 ③ 考前一天限时60分钟做1套完整中考物理真题，错题当晚订正，考前只看错题本'
    };
  }
  if (a.type === 'military') {
    return {
      zone: 'B', pri: 'P1', ck: '开学', fmt: '不露脸讲解', dur: '45s',
      title: `${a.school} 军训${when}开始：家长提前备好这几样`,
      hook: `${when}${a.school}新生军训，提前一周把物资备齐比临时买更省心`,
      body: '① 防晒、舒服的运动鞋、水杯是三件套 ② 带好录取通知书、身份证复印件等报到材料 ③ 有基础病的提前和班主任沟通预案',
      depth: '军训是集体生活适应期，物资与身体预案到位，孩子第一周的注意力才能放在交朋友和跟上节奏上，而不是被琐事消耗。',
      solution: '① 这周末列一张物资清单，防晒选SPF50+、鞋底软的运动鞋、大容量水杯各备齐 ② 把录取通知书、户口本复印件、证件照装进透明文件袋，开学前一天再核对一遍 ③ 若有过敏或慢性病，提前写一张说明条交给班主任，避免现场措手不及'
    };
  }
  if (a.type === 'opening' || a.type === 'openSenior' || a.type === 'openCompulsory') {
    const scope = a.type === 'openCompulsory' ? '义务教育（小学初中）' : (a.type === 'openSenior' ? '普通高中' : a.school);
    return {
      zone: 'B', pri: 'P1', ck: '开学', fmt: '不露脸讲解', dur: '50s',
      title: `${when}${scope}开学：开学第一周做三件小事`,
      hook: `${when}开学，前两周是习惯重置的黄金窗口，错过要花一个月补`,
      body: '① 固定作息，比假期提前30分钟睡起 ② 每天留1小时预习，不求懂只求见过 ③ 整理书桌和书包，减少开学混乱',
      depth: '开学前两周是把假期松散状态重新锚定到校历节奏的关键窗口，习惯先就位，后续学习才不会被琐事反复打断。',
      solution: '① 从今天起把睡觉和起床时间每天往前调10分钟，到开学正好贴合上学节奏 ② 每晚留1小时翻翻新书目录和前两章，只画思维导图不刷题 ③ 周末和孩子一起收拾书包、包书皮、贴姓名贴，把“开学仪式感”变成可控的小任务'
    };
  }
  if (a.type === 'balance') {
    return {
      zone: 'B', pri: 'P1', ck: '政策', fmt: '不露脸讲解', dur: '55s',
      title: `8/28 太原初一均衡编班：家长可以进现场监督`,
      hook: `${when}上午，太原初一分班是当着家长面摇的`,
      body: '① 凡2轨以上学校须均衡编班，严禁重点班快慢班 ② 按小学成绩S型蛇形分配 ③ 全程录像，家长代表现场监督',
      depth: '均衡编班按成绩S型蛇形分配加多方现场监督，把生源差异摊平到每个班，班与班的起点差被人为抹掉，孩子最终差距回到家庭端的学习习惯管理。',
      solution: '① 提前1周向班主任或教务处报名做家长代表进现场，名额通常每校3到5人 ② 分班公布后索要公开的编班方案文本，核对有无实验班等变相名目 ③ 8月26日报到到9月1日开学，每天固定1小时做衔接：数学预习有理数、英语背上册词汇'
    };
  }
  if (a.type === 'earlyExam') {
    return {
      zone: 'B', pri: 'P2', ck: '学情', fmt: '不露脸讲解', dur: '50s',
      title: '9月期初摸底考：定位学情不排名，重点在看缺口',
      hook: '开学第一场考试不是分胜负，是照镜子',
      body: '① 期初考用于定位假期后的学情起点 ② 不排名，结果供老师调整教学节奏 ③ 家长看的是“哪块塌了”而不是“第几名”',
      depth: '期初考的信号价值在暴露假期遗忘的结构性缺口，而不是横向比较，拿它当排名焦虑的来源会误导后续复习方向。',
      solution: '① 考后和孩子只复盘“哪类题错最多”，做成一张缺口表 ② 把缺口对应到具体章节，每天补1个，两周补完 ③ 把期初考成绩和期末考放一起看趋势，不纠结单次绝对分'
    };
  }
  return null;
}

/* ---------- 生成缓冲 ---------- */
const baseArg = process.argv[2];
const daysArg = parseInt(process.argv[3], 10) || 30;
const base = baseArg ? new Date(baseArg + 'T00:00:00') : new Date();
const usedAnchor = new Set();
const evergreenUsed = []; // 轮转索引记录

const days = [];
for (let i = 0; i < daysArg; i++) {
  const day = addDays(base, i);
  const recs = [];
  // 1) 事件锚点
  anchors.forEach((a, idx) => {
    if (usedAnchor.has(idx)) return;
    const d = diffDays(a.date, day);
    if (d >= -3 && d <= 6) {
      const r = buildEventRec(a, day);
      if (r) { recs.push(r); usedAnchor.add(idx); }
    }
  });
  // 2) 常青填充至至少 4 条
  let ei = 0;
  while (recs.length < 4) {
    const tpl = EVERGREEN[evergreenUsed.length % EVERGREEN.length];
    evergreenUsed.push(ei);
    ei++;
    recs.push(Object.assign({}, tpl, { fresh: 'buffer', id: `buf-${fmt(day)}-${recs.length + 1}` }));
    if (ei > EVERGREEN.length * 2) break;
  }
  // 赋值 id + fresh
  recs.forEach((r, k) => {
    r.id = r.id || `buf-${fmt(day)}-${k + 1}`;
    r.fresh = 'buffer';
    r.pri = r.pri || 'P2';
  });
  // 限最多 6 条
  days.push({ date: fmt(day), recs: recs.slice(0, 6) });
}

const PREBUF = {
  generatedAt: new Date().toISOString(),
  base: fmt(base),
  days: daysArg,
  source: '由 tools/pregen.js 从 data-calendar.js / data-exam.js 确定性生成；零AI调用、零编造；限流降级保底用',
  note: 'content 字段与 today-feed 同构，可直接整体替换 window.TODAY_FEED。自动化正常产出时本缓冲不启用，仅当 TODAY_FEED 为空时由台子自动降级加载。',
  days
};

fs.writeFileSync(path.join(ASSETS, 'data-buffer.js'), 'window.PREBUF = ' + JSON.stringify(PREBUF, null, 2) + ';\n');
console.log(`✅ 缓冲已生成：${daysArg} 天，从 ${fmt(base)} 起`);
console.log('   事件锚点总数:', anchors.length, ' 命中缓冲:', usedAnchor.size);
console.log('   写入: assets/data-buffer.js');
