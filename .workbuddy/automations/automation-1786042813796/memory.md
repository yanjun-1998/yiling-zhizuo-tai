# 竞品雷达·每周扫描（automation-1786042813796）执行记忆

## 2026-08-10（首次执行）
- 数据源限制：REDFOX_API_KEY 未配置，douyin-search / xiaohongshu-search 技能不可用，本轮仅 WebSearch 覆盖。
- 最有效的检索入口：飞瓜数据地区榜（`dy.feigua.cn` / `dy3.feigua.cn`）
  - 山西省榜：`/rank/area/4/0/{day|month}/YYYYMMDD.html`
  - 太原市榜：`/rank/area/4/48/{day|month}/YYYYMMDD.html`
  - 教育校园行业榜：`/rank/growing/13/...`、`/rank/fans/13/...`
  这几个 URL 能直接拿到真实账号名+粉丝数+增量，下轮优先用。
- 本轮结果：新增账号 3、新增机构 6，存量修正 1（锐思校区 10→14）。accounts 68→71，institutions 48→54。
- 顶层字段完整保留（meta / accounts / institutions / teacherMoves / zhaosheng2026 / marketGaps）；`node --check` 通过。
- 部署：CloudStudio 尝试 3 次全失败（两次 400、一次 fetch failed）→ 线上工作台链接仍是旧数据，需手动重部署。
  GitHub：commit d197dc0 已确认推送到远端 main（首次 push 报 "Recv failure" 但实际已成功，**下轮遇到 push 超时不要直接判失败，先 `git ls-remote origin main` 复核**）。
- 邮件：已发 315675111@qq.com（周报 + 一封 GitHub 状态更正补充）。agent-mail 需两步：先调用拿 confirmation_token，再用**完全一致的 body**重发；body 改动一个字都会报 40001。

### 下轮注意
- 仓库有一批历史未提交改动（app.js / index.html / style.css 等），本任务用 `git add -A` 会一并提交，属正常。
- 已入库但仅有软文/榜单来源的：山西登科教育、众学稳尚 —— 后续需二次核实真实规模。
- 待观察对象：月照春山_语文提分版（山西语文提分号，2026年4-5月单月净涨约37万，需持续跟踪是否掉速）。
- 本轮未做存量账号停更（dormant）排查，下轮可用飞瓜太原市日榜逐个比对库内账号活跃度。

## 2026-08-16（第二轮执行）
- 数据源：REDFOX_API_KEY 仍未配置，douyin-search/xiaohongshu-search 不可用，仅 WebSearch 覆盖（报告已注明）。
- 检索入口：飞瓜太原市日榜（2026-05-24/06-04）、飞瓜教育校园涨粉榜、蝉妈妈直播页、教育宝/lfnews/各机构春招页。
- 新增：账号1（晋文源教育·抖音5.6万·山西中考教辅）、机构2（太原海豚高补·复读盘点标杆；山西新领域学堂·2004老牌三校区）。accounts 71→72，institutions 54→56。
- 存量更新：周校长 60w→68.3w（飞瓜太原日榜#13）；学大(晋阳街新校区)、福布斯(20+校区+教育主播岗)、高途(余柱呈清华物理线)、新东方(复读10班)；瑕之梦(梁老师)标 dormant。
- 客户最关心：本周未发现全新爆起的太原个人教育IP；新增以教辅/复读机构为主。月照春山_语文提分版无6-8月新数据，继续观察。
- 排除(低于2万/非教育)：学以恒1.3万、一方书桌1.2万、超哥家的赵老师(非教育)。
- 语法自检 node --check：通过。
- 部署：CloudStudio 成功（沙箱 1e82f75555f54f10877a320bdd75aba9，同链接）；GitHub push 成功（main c57930b）。本轮部署双双成功，较首轮改善。
- 邮件：agent-mail 两步确认后已 queue 至 315675111@qq.com。

### 下轮注意
- 抖音搜索技能依赖 REDFOX_API_KEY 仍未配；若后续配置可批量扩账号库。
- 月照春山_语文提分版 需下轮补飞瓜 6-8 月数据判断掉速与否。
- 戴氏教育/学好乐教育 在「太原小店区艺考文化课汇总」被提及但太原具体校区未确认，暂未入库，下轮可二次核实。
- 付费自习室/AI自习室在太原成趋势（山西晚报/人民网报道），不属 K12 培训范围，未入库；如需可单独立「自习室趋势」观察项。
