# 家长需求周更新 · 执行记录

## 关键约定（跨次沿用）
- 唯一可写文件：`assets/data-parent-weekly.js`（覆盖层）。基础库 data-parent.js / data-schools.js / app.js / index.html 一律不动。
- **变量名坑位**：任务描述里写的 `window.CAL` 实际是 **`window.SCHOOL_CAL`**（data-calendar.js）；hot-events.js 是 `window.HOT`（对象，含 `events` 数组，字段 pri/zone/fresh/title/angle/hook/topic/depth/solution）。
- 读取数据的可靠方式：`node -e "global.window={}; require('./assets/xxx.js'); ..."`。
- 合规：不碰国企/太钢/纪检；只用官方可核验概念；不编分数线/录取率。839/720 属官方总分口径（并教〔2025〕5号），可用。
- 邮件走 `mcp__agent-mail__SendMessage`，首次调用必返 CONFIRMATION_REQUIRED，需带 confirmation_token 重发一次（自动化指令已含预授权）。
- 部署链接固定：https://1e82f75555f54f10877a320bdd75aba9.gz2.agentos-app.net ；密码 324。

## 2026-08-10（W33）· 首次执行
- 季节：summer_bridge（7-8月 暑假衔接 & 分班考 & 中考后）
- 落地 focus 7 条；语法自检通过；git commit 14f39c5 已推送；CloudStudio 部署成功（链接未变）；邮件已发至 315675111@qq.com。
- 本周切入角度（供下次避重）：①各校分班考日期自定/差两周，勿信第三方汇总表 ②考初中知识 vs 考高一新内容两套备考法 ③按本校科目表算物理占比排复习序列 ④8/28均衡编班六方监督·预期管理 ⑤新高一物理原始分非赋分·选科倒推 ⑥现初二看2027中考新政（839→720/历史开卷/生地转等级）⑦小升初统筹按区关闸（杏花岭8/12）。
- 上一版（8/07，非本自动化产出）角度：真题摸底、专业倒推法选科、中考后物理衔接、小升初两条线材料、初二升初三力学预习——已全部换掉。

## 下次执行提示
- 8/17 那周：分班考进入尾声+军训期（多校 8/20-8/29），可转向「分班结果出来后怎么看待班型」「军训期作息与开学适应」「8/24高中开学 vs 9/1初中开学的时间差」。
- 8/24、8/31 那周：转 sept_open 前夜，focus 应向「开学适应/第一次月考/选科拍板」过渡。
