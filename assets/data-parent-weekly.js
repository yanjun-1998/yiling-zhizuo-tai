// 每周家长焦点覆盖层（由「家长需求周更新」自动化重写本文件，不污染 data-parent.js 基础库）
// 清空本文件为 window.PARENT_WEEKLY={focus:[],seasonKey:null} 即可一键还原
(function(){
  var d = new Date();
  // ISO 周号
  var onejan = new Date(d.getFullYear(),0,1);
  var week = Math.ceil((((d - onejan)/86400000) + onejan.getDay()+1)/7);
  var wk = d.getFullYear()+'-W'+ (week<10?'0':'') + week;
  window.PARENT_WEEKLY = {
    asOf: "2026-08-07",
    weekKey: wk,
    seasonKey: "summer_bridge",
    focus: [
      "8月中旬起分班考集中，家长现在最该帮孩子做『真题摸底』而不是盲目刷题",
      "新高一选科别等开学，暑期用『专业倒推法』先圈定2个组合，开学不慌",
      "中考录取后别彻底放松，物理衔接高一内容暑假过一遍，开学直接领跑",
      "小升初摇号前，公办保底校和民办校两条线的材料都要提前备齐",
      "初二升初三的暑假，物理力学先预习——这是中考物理最大的坑"
    ],
    note: "每周自动化根据当前季节(PARENT.seasons)+实时热点刷新 focus；覆盖层可一键回滚"
  };
})();
