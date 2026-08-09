/* 周日对标迭代 · 自动落地覆盖层（window.ITER_OVERRIDE）
 * 设计：只覆盖「运行时内存里的数据对象」，不改动基础 data-*.js 源文件 → 零破坏、可一键回滚。
 * 每周日自动化 automation-1786038038517 会重写本文件的 ITER_OVERRIDE 对象并自动重部署。
 * 匹配键：physics/eduplan/politics 用 title；live 用 theme；tier1 用 short(或 school)；moment 整体替换三个文案池。
 * 空覆盖 = 无操作（初始状态）。
 * 本周版本：2026-08-09（第 32 周）｜对标：王芳英语 / 陈进步讲数学 / 张毅物理 / 高中物理王哲 / 张强数学 / 太原升学直播生态
 * 借鉴维度：点名本地具体节点做代入、方法命名化（口诀·模板·索引卡）、微专题切分、标题三段式（时间+考试+章节）、官方文件可核验做信任锚
 * 回滚方法：把下方 ITER_OVERRIDE 各字段清空为 {} 即恢复基础数据原文。 */
window.ITER_OVERRIDE = {
  physics: {
    '"上课全听懂，做题全不会"到底哪出了问题': {
      hook: '听懂≠会做，中间差一个「合书复述」——三句话就能测出真懂还是假懂。'
    },
    '初中物理90分，到高一只剩60分的三个真实原因': {
      hook: '初中物理90分，高一月考掉到60——断点就在返校前这两周。',
      depth: '初中物理是「记住结论就能算」，高中是「先建模型再推过程」；认知方式没切换，再叠加矢量运算与函数图像这层数学工具断层，两道坎同时来，分数就断崖。',
      solution: '① 数学工具先补三项：矢量合成、三角函数特殊值、v-t 图像，每天 30 分钟，返校前至少过完一轮；\n② 建模能力练全流程：每天 1 道「读题→画受力图→列方程」，只画图不算数也算完成，两周累计 14 道；\n③ 听课方式从「记结论」改「跟推导」：每节课至少记下老师一次「为什么这么推」，当晚合书复述一遍，说不出就回看那一段。'
    },
    '初二这半年，决定初三能不能省力': {
      hook: '初二上学期就三块内容，哪一块松了，初三都要加倍还回来。',
      depth: '初二上学期是物理的「语感期」：声光热建立从现象到规律的转译习惯，力学（密度—压强—浮力）则是与初三电学并列的另一根主梁，这半年欠的账，初三要用双倍时间还。',
      solution: '① 声光热用「概念卡」过：每章做 20 张卡（现象＋条件＋结论），9 月底前刷完，考试里的基础题先稳住；\n② 力学按顺序推进：密度→压强→浮力，每周固定 2 小时专项，每周只攻 1 个小专题，不跳章；\n③ 从初二第一节课起固化「先画图再列式」：每道力学题必画受力示意图，一学期约 120 道，习惯就长在手上了。'
    },
    '高中物理错题本，90%的人做成了抄题本': {
      hook: '翻开孩子的错题本，如果满页只有题干、没有一行错因，这本就白抄了。'
    },
    '刷题量上去了成绩没动，问题出在这': {
      hook: '刷完三本册子成绩没动？缺的不是题量，是「每 20 道归一次类」这个动作。'
    },
    '别背公式了，物理公式的正确记法': {
      hook: '公式别硬背，只记三样：推导起点、适用条件、量纲自检。'
    }
  },
  eduplan: {
    '第三次补报志愿正在进行（8/5-8/7）': {
      hook: '普高三次补报已全部结束；还没着落的别慌，职高补报开到 9/20。',
      depth: '补报的本质是「招生计划余量的二次开放」——普高通道 8 月 7 日 18 时关闭后，孩子并没有出局，职业高中与五年制高职的补报窗口一直开到 9 月 20 日；真正的风险，是家长以为没戏了就停止查询，白白错过还挂着缺额的学校。',
      solution: '① 普高三次补报（末次 8 月 7 日 18 时）已全部结束，先登录山西招生考试网 www.sxkszx.cn 查孩子的真实录取状态，以平台显示为准；\n② 职业高中第二次补报仍在进行：8 月 4 日 8 时至 9 月 20 日 18 时，在同一平台补报，不再现场确认，以网报信息为准；\n③ 第一次补录后仍未被录取的，可直接联系招生学校现场网上补报，去之前先致电确认该校是否还有缺额计划。'
    },
    '太原定向生，到底哪类孩子真受益': {
      hook: '定向线卡在「统招线下 50 分以内、且不低于 603」——受益的只有三类孩子。'
    },
    '初升高的暑假，最该做的三件事': {
      hook: '离多数高中 8 月中旬返校只剩几天，暑假清单只剩三件事还来得及。',
      depth: '初升高暑假补的是「转换成本」而不是知识量——数学的抽象层级、英语的词汇密度、物理的建模方式在同一时间跳档，谁提前把这层转换做完，谁就在开学头两个月省下追赶的力气。',
      solution: '① 数学只挑「集合与函数」一章，每天 1 节 + 5 题，做完合书讲给家长听 3 分钟，讲不通就重看；\n② 英语中考 1600 词按「每天 30 词 + 1 篇分级阅读」滚动，返校前至少过完一轮，词汇断层是高一英语第一道坎；\n③ 物理每天只画 1 张受力分析图（不算数值），从初中「二力平衡」过渡到高中「多力共点」，累计 10 张手感就出来了。'
    },
    '高一上学期，最易被忽略的一次分水岭': {
      hook: '高一真正的分水岭不在期中，在开学头两周露出来的三个信号。'
    },
    '四大特色实验班，分数线怎么算': {
      hook: '四个特色实验班 2026 年门槛 713.2 分——就是中考总分的 85%。'
    }
  },
  politics: {
    '政治主观题，答不到点上的根本原因': {
      hook: '主观题失分不是背得少，是没建立「材料原句→课本术语」这层对应。'
    },
    '时政怎么复习才不白费': {
      hook: '时政刷得再多也不产生分数，除非每条都能反挂到 2 个课本考点上。'
    },
    '道法开卷考，为什么还是有人不及格': {
      hook: '开卷考真正在计时的是翻书——没有索引卡，会做的题也来不及写。'
    }
  },
  live: {
    '山西考生多少分能上太原理工/山西大学': {
      hook: '这两校每年录的是位次不是分数，位次表一拉，够不够一眼看出来。'
    },
    '冲稳保到底怎么排？平行志愿顺序错了白考': {
      hook: '平行志愿是分数优先、遵循顺序——顺序排错，高分会被自己前面的志愿截走。'
    },
    '山西国企央企怎么进（只讲公开规律）': {
      hook: '校招公告通常只挂 7–15 天，错过就是等一年——今晚只讲公开渠道。'
    },
    '高中物理力学三大模型（手播板书）': {
      hook: '力学大题翻来覆去就三个模型：连接体、传送带、板块。'
    },
    '物理实验题必拿的12分套路': {
      hook: '实验题采分点是固定的：读数、电路设计、误差分析，三块各有模板。'
    }
  },
  tier1: {
    '山大附中': {
      hook: '8 月 14 日起返校并参加入学摸底考，留给预习的时间已经以天计。',
      depth: '山大附中的入学摸底考不是走过场，它直接决定开学后的分层与教学起点——一类校教学进度普遍快于区平均 1–2 个章节，起点低一档，前两个月就要用双倍时间去追，这才是「提前量」的真实代价。'
    },
    '成成中学': {
      hook: '迎泽、晋源两校区分班考同一天、军训差三天，时间表别拿错。',
      depth: '成成的信息坑在「校区」不在「学校」：分班考 8 月 17–18 日两校区同步，军训迎泽 8 月 20–26 日、晋源 8 月 23–29 日错开近一周；家长群里转发的截图往往不标校区，照着另一个校区的时间准备就会白跑一趟。'
    }
  },
  moment: {}
};

/* 应用覆盖（幂等，可重复调用） */
window.applyIterOverride = function(O){
  O = O || window.ITER_OVERRIDE; if(!O) return;
  function byTitle(arr, key){ for(var i=0;i<arr.length;i++){ if(arr[i] && arr[i].title===key) return arr[i]; } return null; }
  if(window.DATA_A && DATA_A.topics) Object.keys(O.physics||{}).forEach(function(k){ var it=byTitle(DATA_A.topics,k); if(it) Object.assign(it, O.physics[k]); });
  if(window.DATA_EDUPLAN && DATA_EDUPLAN.topics) Object.keys(O.eduplan||{}).forEach(function(k){ var it=byTitle(DATA_EDUPLAN.topics,k); if(it) Object.assign(it, O.eduplan[k]); });
  if(window.DATA_POLITICS && DATA_POLITICS.topics) Object.keys(O.politics||{}).forEach(function(k){ var it=byTitle(DATA_POLITICS.topics,k); if(it) Object.assign(it, O.politics[k]); });
  if(window.LIVE && LIVE.topics) Object.keys(O.live||{}).forEach(function(k){ LIVE.topics.forEach(function(t){ if(t.theme===k) Object.assign(t, O.live[k]); }); });
  if(window.TIER1 && TIER1.headline) Object.keys(O.tier1||{}).forEach(function(k){ TIER1.headline.forEach(function(h){ if((h.short||h.school)===k) Object.assign(h, O.tier1[k]); }); });
  if(window.MOMENT){
    if(O.moment && O.moment.beliefs) MOMENT.beliefs = O.moment.beliefs;
    if(O.moment && O.moment.taiyuanHooks) MOMENT.taiyuanHooks = O.moment.taiyuanHooks;
    if(O.moment && O.moment.landing) MOMENT.landing = O.moment.landing;
    if(O.moment && O.moment.img) MOMENT.img = O.moment.img;
  }
};
window.applyIterOverride(window.ITER_OVERRIDE);
