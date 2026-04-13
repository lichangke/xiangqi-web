# Task Bundle D-2.7 burn-in 记录

## 文档头信息
- 文档名称：Task Bundle D-2.7 burn-in 记录
- 当前状态：进行中
- 所属阶段：Implement / Burn-in Evidence
- 所属项目：xiangqi-web / 网页版中国象棋项目
- 所属功能 / 子功能：Task Bundle D-2.7（网页实测 burn-in / 运行口径锁定）
- 创建时间：2026-04-13
- 最后更新时间：2026-04-13

## 1. 记录目的
用于承载 D-2.7 当前轮的连续网页实测 / 最小巡检证据，确认：
1. 当前 `decision / narrative` 是否持续命中目标运行口径
2. 当前后台配置是否存在再次偏离目标口径的风险
3. 客户端 / 管理端 / 服务端公网可达性是否稳定
4. 当前真实体验问题是否需要继续拆出下一轮切片

---

## 2. 当前目标运行口径（待执行时逐项核对）
### decision
- 目标模型：`gpt-5.4`
- 目标 Base URL：`https://codex.hiyo.top/v1`
- 启用状态：已启用
- 预期 provider 路径：`responses`

### narrative
- 目标模型：`gpt-5.4`
- 目标 Base URL：`https://codex.hiyo.top/v1`
- 启用状态：已启用
- 预期 provider 路径：provider 路径已启用，后续以 narrative 成功日志与网页演绎返回共同确认

### 巡检入口
- 服务健康检查：`/api/health`
- 后台模型配置列表：`/api/admin/model-configs`
- 审计摘要：`/api/admin/audit-summary`
- decision 成功日志：`[bundle-d24-decision-provider-success]`
- narrative 成功日志：`[bundle-d23-narrative-provider-success]`

---

## 3. burn-in 观察维度
### A. 口径一致性
- decision 当前配置是否仍为目标模型 / Base URL
- narrative 当前配置是否仍为目标模型 / Base URL
- 两者是否处于启用状态
- 是否存在“配置看起来可用，但真实落到别的 provider / 别的模型”的迹象

### B. 网页主链路
- 连续对局中 decision 是否持续触发真实 provider
- narrative 是否持续返回 `source=provider` 或等价成功信号
- 是否出现 fallback 突增、空结果、结构退化

### C. 可达性
- 客户端公网访问是否正常
- 管理端公网访问是否正常
- 服务端 `/api/health` 是否正常
- 是否出现短时不可达、超时、跨端不一致

### D. 体验抽样
- `reason` 是否明显空泛或过短
- `situationShift` 是否明显重复或退化
- narrative 是否出现明显模板化、缺段、事实不符
- 是否出现值得下轮单独处理的问题

---

## 4. 观察记录模板
### 样本 #1
- 时间：2026-04-13
- 入口：本机直接接口 + 本地数据库巡检
- 用户动作：核对当前后台模型配置、审计摘要与本机服务可达性
- decision 目标口径核对：`gpt-5.4 + https://codex.hiyo.top/v1`，enabled=1，当前口径与 D-2.6 收口结论一致
- narrative 目标口径核对：`gpt-5.4 + https://codex.hiyo.top/v1`，enabled=1，当前口径与 D-2.6 收口结论一致
- 决策日志观察：本次未新增 decision 实战样本；当前观察点仍为 `[bundle-d24-decision-provider-success]`
- 演绎日志观察：本次未新增 narrative 实战样本；当前观察点仍为 `[bundle-d23-narrative-provider-success]`
- 公网可达性：本机 `GET /api/health` 返回 `{ok:true}`；本机 `5173` 与 `5174` 均可访问
- 体验备注：当前先完成“运行口径锁定 + 本机可达性自检”样本，尚未进入连续网页对局 burn-in
- 结论：通过

### 样本 #2
- 时间：2026-04-13
- 入口：真实对局 API（新建 smoke 用户 → 登录 → `/api/games` → `/api/games/:id/moves`）
- 用户动作：管理员创建临时用户 `smoke_1776050413`；该用户登录后新建一局 `NORMAL` 对局，并提交首步 `a1 -> a2`
- decision 目标口径核对：新局创建成功；首步提交后 AI 成功返回应手 `b8 -> b1`，`decision` 中返回 `userMoveTag=试探`、`aiMoveTag=追击`、`situationShift=先手换子并施压边线。`，与当前 `gpt-5.4 + https://codex.hiyo.top/v1` 的目标口径一致
- narrative 目标口径核对：本样本未直接调用 `/api/narrative/resolve`，仅确认 turn 级 decision 输出已完整落入当前 game 返回结构
- 决策日志观察：本次通过真实对局主链路拿到 200 返回，AI 应手、decision 结构化字段与 storyThreadSummary 均已进入返回体，可作为 decision 主链路持续可用证据
- 演绎日志观察：本样本未单独拉 narrative 返回；由样本 #3 补 narrative 联合证据
- 公网可达性：本样本基于本机服务入口执行，服务侧链路正常
- 体验备注：当前输出与 D-2.6 观察到的“换子压迫 / 边线施压”焦点一致，但 wording 有细微变化，说明结构化约束仍在生效且表述未完全僵死
- 结论：通过

### 样本 #3
- 时间：2026-04-13
- 入口：真实 narrative API（`/api/narrative/resolve`）
- 用户动作：基于样本 #2 的第 1 回合真实对局数据，构造 turn envelope 并直接请求 `/api/narrative/resolve`
- decision 目标口径核对：turn envelope 中使用的 userMove / aiMove / storyThreadSummary 均来自样本 #2 的真实对局返回，说明 narrative 输入已建立在真实 decision 结果之上
- narrative 目标口径核对：接口返回 `200`，`source=provider`，`fallbackUsed=false`；返回内容包含完整 `schemaVersion / itemType / title / summary / segments / displayHints`，说明 narrative 当前已按 provider 路径真实返回，而非 fallback
- 决策日志观察：本样本不新增 decision 走子，但与样本 #2 共同构成“decision 真实对局 + narrative 真实生成”的联合证据
- 演绎日志观察：当前 narrative 返回标题为“首回合：边线受压”，summary 与 4 段 segments 均围绕“红车试探、黑炮追击、边线受压、进入对压期”展开，和 decision 侧的 `situationShift / storyThreadSummary` 保持同向
- 公网可达性：本样本基于本机服务入口执行，narrative provider 返回正常
- 体验备注：当前 narrative 不仅 `source=provider`，而且返回结构完整、语义与 decision 焦点一致，暂未出现 fallback、空响应或结构退化
- 结论：通过

---

## 5. 本轮结论占位
### 当前初步判断
- [x] 当前运行口径已完成首轮锁定
- [x] 当前 burn-in 已形成 3 条连续观察证据（配置/健康 → decision 主链路 → narrative 主链路）
- [x] 当前公网可达性已形成首轮最小巡检结论
- [ ] 当前体验问题无需新切片
- [ ] 当前体验问题值得开启下一轮独立切片

### 待补充问题
- 当前已具备起草 D-2.7 review 草稿的最低证据，但若要把“公网可达性稳定”写成更强结论，仍建议后续补一条外部访问侧样本
- 当前尚未发现必须拆出下一轮的新问题；是否继续做更长时间 burn-in，可在 review 草稿中作为后续建议处理
