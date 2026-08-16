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
