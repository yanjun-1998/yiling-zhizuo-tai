/* 云端共享热点库（window.MY_HOT）
 * 用途：存放主理人手动添加、并希望夫妻俩共享的热点。
 * 维护方式：由主理人在对话中把热点发给我（AI），我写入此文件并重部署云端；
 *           每日早8/晚8 自动化只写 hot-events.js，绝不覆盖本文件。
 * 字段与 HOT.events 完全一致：{id,pri,zone,title,angle,data,hook,topic,liveTheme,src}
 */
window.MY_HOT = {
  date: '共享库',
  note: '手动共享热点库·由主理人对话同步写入，每日自动化不覆盖',
  events: []
};
