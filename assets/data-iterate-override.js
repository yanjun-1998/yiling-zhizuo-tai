/* 周日对标迭代 · 自动落地覆盖层（window.ITER_OVERRIDE）
 * 设计：只覆盖「运行时内存里的数据对象」，不改动基础 data-*.js 源文件 → 零破坏、可一键回滚。
 * 每周日自动化 automation-1786038038517 会重写本文件的 ITER_OVERRIDE 对象并自动重部署。
 * 匹配键：physics/eduplan/politics 用 title；live 用 theme；tier1 用 short(或 school)；moment 整体替换三个文案池。
 * 空覆盖 = 无操作（初始状态）。 */
window.ITER_OVERRIDE = {
  physics: {
    '"上课全听懂，做题全不会"到底哪出了问题': {
      hook: '孩子说听懂了、一做题就废——你第一反应是不是骂他不努力？其实他陷在「假性听懂」里：眼睛看了≠脑子会了。'
    }
  },
  eduplan: {},
  politics: {},
  live: {
    '山西考生多少分能上太原理工/山西大学': {
      hook: '报志愿最怕「亏分」，一分都不浪费——今天把太原理工和山西大学的录取位次一次讲透，别等填完才拍大腿。'
    }
  },
  tier1: {
    '山大附中': {
      depth: '一类校的分班考/月考在开学头两个月就把差距拉开，本质是「提前量」的较量——你暑假多预习一章，开学就多一分从容，后面追很吃力。'
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
