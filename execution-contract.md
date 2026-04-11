# 执行协议（Execution Contract）

## 文档头信息
- 文档名称：execution-contract
- 当前状态：已确认
- 所属阶段：Execution Contract
- 所属项目：xiangqi-web / 网页版中国象棋项目
- 所属功能 / 子功能：Task Bundle D-2.5 执行协议（外部线上 provider 页面层稳定命中验证）
- 上游文档：spec.md, plan.md, tasks.md, review.md
- 创建时间：2026-04-09
- 最后更新时间：2026-04-11

## 关联更新检查
本文档更新后，至少检查是否需要同步更新：
- `sdd-status.md`
- `docs/Task Bundle D-2.5 实现交接.md`
- 当前执行摘要
- 必要时 `review.md`

若执行边界、权威输入、验证要求发生变化，应重新检查 handoff 条件是否仍成立。

---

## 1. 执行目标
本执行协议服务于 V1 的 **Task Bundle D-2.5（外部线上 provider 页面层稳定命中验证）**。

D-2.4 已完成 review 收口、页面 smoke 补验收与远端同步。D-2.5 当前轮已完成的关键收口是：
1. 已确认 `codex.hiyo.top` 当前不应继续按 `chat/completions` 接入，而应按 `responses` 接入；
2. 已确认该 provider 在非流式 `responses` 下，最终 completed response 可能保持 `output / output_text` 为空；
3. 已通过最小矩阵试探确认：当前正文真实存在于 streaming `response.output_text.delta` 事件中；
4. 已将 decision provider 的 `responses` 分支改为流式 SSE delta 读取正文；
5. 已在真实主链路验证中确认 `bundle-d24-decision-provider-success`，说明当前页面层外部线上 provider 命中已成立。

本轮目标不是更强棋力，不是 narrative 重做，不是完整 secret 持久化，也不是完整连通性平台，而是：
> 先把“页面层接入外部线上 provider 到底稳不稳”这件事单独验证清楚，并留下足够的观测与结论。

当前该目标已完成并回收。

---

## 2. 本轮执行范围
### 明确包含
- 以当前 D-2.4 已实现的 decision provider 主链路为前提，补一轮面向 **外部线上 provider** 的页面层稳定命中验证
- 为 decision provider 命中 / fallback / 空 response / 协议类型等结果补最小可观察日志或样本摘要
- 在后台配置真实线上 provider 的前提下，完成最小真实页面 smoke，并明确记录结果
- 判断“页面层是否稳定命中 provider”当前结论
- 补齐与上述验证直接相关的状态文档、smoke 记录与 review 结论

### 明确不包含
- decision 提示词重写
- 决策输入契约大改
- 搜索型棋力引擎化改造
- narrative 重做
- 完整 secret 安全持久化体系
- 完整 provider 健康检查 / 连通性测试平台
- 并发治理平台
- 擅自扩大到新的平台级重构

### 对应任务范围
- 任务组：任务组 E（D-2.5 增量切片）
- 当前轮次定位：Task Bundle D-2.5 / Verification + Review 回收
- 对应任务：围绕“外部线上 provider 页面层是否稳定命中”形成最小验证闭环，不视为 decision 体验、secret 或 provider 平台化能力全部完成

---

## 3. 默认执行方式
### 执行模式
- [x] 阶段性汇报
- [ ] 静默执行为主
- [ ] 高频同步（仅特殊情况）

### 默认说明
- 默认由主会话直接实现并回收本轮 D-2.5 切片
- 普通调试、局部试错、小范围结构调整不需要逐条同步
- 完成验证闭环、出现关键阻塞、发现范围漂移或需要用户拍板时再回报

---

## 4. 实现执行编排信息
### 执行代理
- 执行者：主会话直接实现
- 会话策略：单 repo + 单轮次 + 单 task bundle
- 当前 repo / cwd：xiangqi-web
- 当前轮次：项目启动 / Task Bundle D-2.5
- 当前 task bundle：Task Bundle D-2.5（外部线上 provider 页面层稳定命中验证）

### 本轮目标
- 验证页面层接入外部线上 provider 是否稳定命中
- 区分 provider 命中、fallback、空 response、协议类型等关键差异
- 保持当前 fallback 主链路不退化
- 形成足够清晰的文档化结论，支撑下一轮是否进入“decision 输入契约 / prompt / 体验优化”

### 权威输入
#### 必读文档
- `spec.md`
- `plan.md`
- `tasks.md`
- `review.md`
- `execution-contract.md`
- `sdd-status.md`
- `docs/Task Bundle D-2.4 实现交接.md`
- `docs/Task Bundle D-2.4 真实页面 smoke 记录.md`
- `docs/Task Bundle D-2.5 实现交接.md`

#### 当前轮次直接依据
- D-2.4 已形成的 decision provider 主链路与 fallback 约束
- D-2.4 review 结论：页面层 provider 命中已经在本地 mock provider 下确认成立
- D-2.5 当前已确认的新事实：`codex.hiyo.top` 必须按 `Responses API + streaming delta` 口径接入
- `apps/server/src/domain/ai/decision/decision-provider-service.ts` 中当前 provider 调用、streaming delta 读取与日志逻辑
- `apps/server/src/domain/game/game-service.ts` 中当前用户落子后 provider 优先 / fallback 次序
- 后台 `decision` 模型配置现状仍为：`modelName / baseUrl / enabled` 锚定后台配置，真实 API Key 仍以 env 承载

若历史上下文、旧会话理解或未确认草案与以上文档冲突，以以上文档为准。

### 修改边界
#### 允许修改
- `apps/server/`
- `apps/web/`
- `tests/`
- 与当前轮次直接联动的状态 / smoke / review 文档

#### 不允许修改
- 已确认的 `spec.md` / `plan.md` / `tasks.md` 边界
- 与当前切片无关的大重构
- 擅自扩写新的实现范围以“顺手做掉后续内容”
- 把当前验证专项直接扩写成完整 provider 平台或完整 secret 系统

---

## 5. 汇报与返回规则
### 默认应返回
- 完成 Task Bundle D-2.5 后
- 出现关键阻塞时
- 发现需要调整 Plan / Tasks / Contract 时
- 出现范围漂移风险时
- 当前切片只能部分完成时

### 默认不返回
- 普通调试过程
- 单条命令细节
- 小范围失败尝试
- 局部重命名与细碎清理

### 立即返回条件
出现以下情况必须立即返回：
- 关键前提不成立
- 需要扩大已确认范围
- 需要改动 Plan 级方案
- 当前 task 定义不足以继续执行
- 需要用户拍板
- 当前代码现状与权威文档严重不一致
- 核心验证失败且无法快速收敛
- 若要继续推进必须引入新的平台级连通性设施，而当前项目无现成承载位
- 若要继续推进必须把 scope 扩写到完整 secret 持久化或完整 provider 平台，应先回到当前执行协议修订，而不是直接扩写实现

---

## 6. 测试与验证要求
### 主链路验证
- 后台 decision 配置切换到外部线上 provider 后，页面真实落子时系统能够尝试走真实 provider
- 能区分并记录至少以下结果之一：
  - provider 成功命中
  - 前置条件缺失
  - 网络 / fetch 失败
  - 超时
  - schema 非法
  - 候选步非法
  - fallback 生效
- 即使 provider 不稳定，页面主链路也不得因此断裂
- 最终必须给出当前结论：稳定命中 / 不稳定命中 / 受条件限制命中

### 回归验证
至少执行并回报：
- 与 decision provider 命中观测、fallback 与页面 smoke 直接相关的验证
- 必要的 server / integration 测试
- 若本轮代码改动触发回归风险，补跑 `npm test`
- 若本轮代码改动影响构建，补跑 `npm run build`

### 最低完成标准
- 无真实页面样本，不算完成
- 无命中 / 失败类型归因，不算完成
- 无状态记录与结论回写，不算完成

---

## 7. 文档与状态更新要求
本轮完成后，至少同步更新：
- `sdd-status.md`
- `review.md`
- `docs/Task Bundle D-2.5 实现交接.md`
- `docs/Task Bundle D-2.5 真实页面 smoke 记录.md`
- 当前执行状态
- 下一步动作
- 是否存在阻塞

默认原则：
> 本轮不是“多跑几下页面”就算完成；只有样本、归因、结论与状态卡形成一致闭环，才算本轮 handoff 完成。

---

## 8. 回退规则
出现以下情况时应回退而非硬推：
- 已确认文档之间存在关键冲突
- 当前 task 定义不足以支撑继续验证
- 当前实现代价远超预期并影响阶段策略
- 为满足本轮目标必须扩大到完整 secret 体系、完整 provider 平台或大范围前后端重构

### 回退目标
- [ ] 回到 Specify
- [ ] 回到 Plan
- [ ] 回到 Tasks
- [x] 回到 Execution Contract / 当前交接边界修订

---

## 9. 完成定义
本轮 Task Bundle D-2.5 只有同时满足以下条件才算完成：
- 已覆盖本轮约定范围
- 已形成真实页面样本与必要的代码 / 日志 / 文档改动（如有）
- 已完成必要验证
- 已更新状态记录
- 无未披露关键阻塞
- 明确说明“外部线上 provider 页面层是否稳定命中”的当前结论
- 明确说明当前是否适合进入下一轮 decision 输入契约 / prompt / 体验优化

当前以上条件均已满足。

---

## 10. 审核结论
### 本轮审核意见
- D-2.5 已完成协议判断、最小矩阵试探、streaming delta 正文兼容修正与真实主链路 provider-success 验证
- `docs/Task Bundle D-2.5 实现交接.md`、`review.md`、`sdd-status.md` 与 smoke 记录已完成回写
- 当前执行协议已完成其服务周期，不再停留在“待 Implement”的草案状态

### 是否允许进入 Implement
- [x] 是（对 D-2.5 而言已执行完成）
- [ ] 否

### 当前结果判断
- [x] 本轮已完成并回收
- [ ] 当前仍待执行
