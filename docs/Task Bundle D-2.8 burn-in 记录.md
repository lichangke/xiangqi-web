# Task Bundle D-2.8 burn-in 记录

## 文档头信息
- 文档名称：Task Bundle D-2.8 burn-in 记录
- 当前状态：进行中
- 所属阶段：Implement / Burn-in Evidence
- 所属项目：xiangqi-web / 网页版中国象棋项目
- 所属功能 / 子功能：Task Bundle D-2.8（外部访问侧样本 / 扩展 burn-in）
- 创建时间：2026-04-13
- 最后更新时间：2026-04-13

## 1. 记录目的
用于承载 D-2.8 当前轮的外部访问侧样本与扩展 burn-in 证据，确认：
1. 外部网络 / 外部设备视角下，客户端 / 管理端 / 服务端是否持续可达
2. 更多 decision / narrative 样本下，目标运行口径是否仍稳定成立
3. 当前是否开始出现 fallback、结构退化、语义漂移或新的问题切片信号

---

## 2. 当前目标运行口径
### decision
- 目标模型：`gpt-5.4`
- 目标 Base URL：`https://codex.hiyo.top/v1`
- 启用状态：已启用
- 预期 provider 路径：`responses`

### narrative
- 目标模型：`gpt-5.4`
- 目标 Base URL：`https://codex.hiyo.top/v1`
- 启用状态：已启用
- 预期 provider 路径：provider 路径已启用，后续以 narrative 成功样本持续确认

---

## 3. 观察维度
### A. 外部访问侧样本
- 客户端外部访问
- 管理端外部访问
- 服务端健康检查外部访问

### B. decision 扩展 burn-in
- 更多真实对局样本
- 多步决策后是否出现明显单一或异常漂移

### C. narrative 扩展 burn-in
- 更多回合 / 更多事件类型样本
- 是否持续 `source=provider / fallbackUsed=false`
- 是否出现结构退化、空响应、语义不一致

### D. 新问题信号
- 是否已值得从“增强证据轮”升级为新问题轮

---

## 4. 样本记录
### 样本 #1
- 时间：2026-04-13
- 类型：外部访问侧样本
- 动作：使用机器内网地址 `10.3.0.3` 分别访问 `5173 / 5174 / 3000/api/health`
- 结果：`5173` 返回 web HTML；`5174` 返回 admin HTML；`/api/health` 返回 `{ok:true,"service":"xiangqi-web-server"}`
- 备注：当前三端均监听 `0.0.0.0`，说明至少在非 localhost 的内网访问视角下，客户端 / 管理端 / 服务端可达性成立
- 结论：通过

### 样本 #2
- 时间：2026-04-13
- 类型：decision 扩展 burn-in
- 动作：通过内网地址 `10.3.0.3:3000` 创建临时用户 `smoke_d28_1776062138`，新建 `MASTER` 对局，并连续提交两步用户走子：`b3 -> e3`、`c4 -> c5`
- 结果：
  - 第 1 回合：AI 应手 `h8 -> h1`，`situationShift=先手换子施压并简化局面。`
  - 第 2 回合：AI 应手 `h1 -> f1`，`situationShift=换子压迫并收束边线。`
  - 两回合均返回 200，decision 结构化字段持续完整
- 备注：与 D-2.7 相比，当前已不只停留在首步单样本，而是拿到了外部访问视角下的多回合 decision 样本
- 结论：通过

### 样本 #3
- 时间：2026-04-13
- 类型：narrative 扩展 burn-in（异常样本）
- 动作：基于 D-2.8 新增的多回合真实对局数据，手工构造 turn envelope 并调用 `/api/narrative/resolve`
- 结果：返回 `500 / INTERNAL_ERROR`
- 备注：该异常后续已被进一步定性——更可能来自**手工构造的扩展 envelope 不符合真实前端形状**，而不是 narrative 主链路天然不稳定
- 结论：异常（已定性为样本构造问题优先）

### 样本 #4
- 时间：2026-04-13
- 类型：narrative 扩展 burn-in（按真实前端 envelope 重放）
- 动作：按 `apps/web/src/presentation.ts` 中真实 `buildTurnEnvelope` 形状补齐 `capture / checkState / narrativeGoal` 等字段后，再次调用 `/api/narrative/resolve`
- 结果：返回 `200`，`source=provider`，`fallbackUsed=false`，返回 narrative 标题为“黑炮追击得手”，结构完整，segments 数量为 4
- 备注：当前已可确认：前一条 500 更像是**手工扩展样本构造不符合真实前端 envelope 约束**，而不是 narrative 真实主链路在扩展 burn-in 中天然失效
- 结论：通过

### 样本 #5
- 时间：2026-04-13
- 类型：外部访问侧 API 样本
- 动作：使用 `10.3.0.3:3000` 在外部访问等价视角下完成 admin 登录，并调用 `/api/admin/model-configs` 与 `/api/admin/audit-summary?limit=3`
- 结果：均返回 `200`；`decision / narrative` 当前配置仍显示 `gpt-5.4 + https://codex.hiyo.top/v1` 且 `enabled=true`；审计摘要可正常返回最近用户创建记录
- 备注：这说明外部访问侧不仅静态页面可达，后台关键 API 入口也可用
- 结论：通过

### 样本 #6
- 时间：2026-04-13
- 类型：narrative 多回合扩展 burn-in
- 动作：基于同一局 `MASTER` 对局，按真实前端 envelope 形状分别重放第 1 / 第 2 回合的 `/api/narrative/resolve`
- 结果：
  - Turn 1：`200 / source=provider / fallbackUsed=false`，返回标题“黑炮追击得手”
  - Turn 2：`200 / source=provider / fallbackUsed=false`，返回标题“黑炮换仕，边线收紧”
  - 两回合均返回 4 段 narrative segments
- 备注：当前 narrative 扩展样本已不止一条，而是在多回合下持续保持 provider 路径成立与结构完整
- 结论：通过

---

## 5. 当前判断占位
- [x] 已形成外部访问侧样本
- [x] 已形成扩展 burn-in 样本
- [x] narrative 稳定性继续成立
- [ ] 已暴露新的问题切片

## 6. 待补充问题
- 当前已拿到 2 条外部访问侧样本与多回合 narrative 样本，可开始评估是否具备 D-2.8 review 入口
- 若还要把“外部访问稳定性”写得更强，后续仍可继续补不同设备 / 不同网络条件样本
