# 执行协议（Execution Contract）

## 文档头信息
- 文档名称：execution-contract
- 当前状态：已确认
- 所属阶段：Execution Contract
- 所属项目：xiangqi-web / 网页版中国象棋项目
- 所属功能 / 子功能：Task Bundle D-2.6 执行协议（decision 输入契约 / prompt / 体验优化）
- 上游文档：spec.md, plan.md, tasks.md, review.md, docs/Task Bundle D-2.6 实现交接.md
- 创建时间：2026-04-11
- 最后更新时间：2026-04-12

## 关联更新检查
本文档更新后，至少检查是否需要同步更新：
- `sdd-status.md`
- `docs/Task Bundle D-2.6 实现交接.md`
- 当前执行摘要
- 必要时 `review.md`

若执行边界、权威输入、验证要求发生变化，应重新检查 handoff 条件是否仍成立。

---

## 1. 执行目标
本执行协议服务于 V1 的 **Task Bundle D-2.6（decision 输入契约 / prompt / 体验优化）**。

D-2.5 已完成以下关键收口：
1. 已确认 `codex.hiyo.top` 当前不应继续按 `chat/completions` 接入，而应按 `responses` 接入；
2. 已确认该 provider 在非流式 `responses` 下，最终 completed response 可能保持 `output / output_text` 为空；
3. 已通过最小矩阵试探确认：当前正文真实存在于 streaming `response.output_text.delta` 事件中；
4. 已将 decision provider 的 `responses` 分支改为流式 SSE delta 读取正文；
5. 已在真实主链路验证中确认 `bundle-d24-decision-provider-success`，说明当前页面层外部线上 provider 命中已成立。

因此，本轮目标不再是验证 provider 是否命中，而是：
> 在真实链路已成立的前提下，收清并优化 decision 输入契约、prompt 结构与输出体验质量。

---

## 2. 本轮执行范围
### 明确包含
- 梳理当前 decision provider 的真实输入来源与输入结构
- 明确当前 decision prompt 的职责边界、结构组织与输出约束
- 判断当前是否需要补充或重组：棋盘上下文、合法候选步、难度、历史摘要、输出 schema 等输入要素
- 对 `move + reason` 的输出稳定性、可解析性与体验质量做最小一轮优化
- 保持现有 `provider-success + legality check + fallback` 主链路不退化
- 为本轮形成新的验证口径、review 入口与状态推进基础

### 明确不包含
- 回退到 provider 协议、baseUrl、env、API key、命中性排查
- 把本轮扩写为完整 provider 平台治理
- 完整 secret 安全持久化体系
- narrative 重做
- 搜索型棋力引擎化改造
- 长时间 / 多样本 burn-in 专项
- 与当前切片无关的大重构

### 对应任务范围
- 任务组：任务组 E 的增量优化切片
- 当前轮次定位：Task Bundle D-2.6 / decision 输入契约 / prompt / 体验优化
- 对应用户故事：US3、US5、US6（以 decision 决策质量与体验质量为当前切入点）
- 对应 FR：FR-004 ~ FR-017、FR-023 ~ FR-027（以当前 decision 主链路相关约束为准）

---

## 3. 默认执行方式
### 执行模式
- [x] 阶段性汇报
- [ ] 静默执行为主
- [ ] 高频同步（仅特殊情况）

### 默认说明
- 默认由主会话基于当前已确认的 contract 继续推进 D-2.6 implement
- 普通阅读、梳理、局部试错与小范围 prompt 调整不需要逐条同步
- 完成本轮实现、形成明确验证结论、出现关键阻塞或需要用户拍板时再回报

---

## 4. 实现执行编排信息
### 执行代理
- 执行者：主会话直接实现（基于当前已确认 contract 进入 implement）
- 会话策略：单 repo + 单轮次 + 单 task bundle
- 当前 repo / cwd：xiangqi-web
- 当前轮次：项目启动 / Task Bundle D-2.6
- 当前 task bundle：Task Bundle D-2.6（decision 输入契约 / prompt / 体验优化）

### 本轮目标
- 明确当前 decision 输入契约的真实边界与缺口
- 明确当前 prompt 结构与优化点
- 明确本轮体验优化最小切入点与验证方式
- 为后续实现建立单一清晰入口

### 本次明确不做
- 不再证明 provider 是否命中
- 不做完整平台化治理
- 不做无边界的“整体 AI 变聪明”泛化优化

### 权威输入
#### 必读文档
- `spec.md`
- `plan.md`
- `tasks.md`
- `review.md`
- `execution-contract.md`
- `sdd-status.md`
- `docs/Task Bundle D-2.5 实现交接.md`
- `docs/Task Bundle D-2.5 真实页面 smoke 记录.md`
- `docs/Task Bundle D-2.6 实现交接.md`

#### 当前轮次直接依据
- D-2.5 已确认的 provider 接入与 streaming delta 兼容事实
- `apps/server/src/domain/ai/decision/decision-provider-service.ts` 中当前 provider 请求、输出解析与日志逻辑
- `apps/server/src/domain/ai/decision/standard-ai-decision.ts` 中当前本地决策与 explanation 结构
- `apps/server/src/domain/game/game-service.ts` 中当前用户落子后 provider 优先 / fallback 次序

若历史上下文、旧会话理解或未确认草案与以上文档冲突，以以上文档为准。

### 修改边界
#### 允许修改
- `apps/server/`
- `tests/`
- 与当前轮次直接联动的状态 / review / 实现交接文档

#### 不允许修改
- 已确认的 `spec.md` / `plan.md` / `tasks.md` 边界
- 与当前切片无关的大重构
- 擅自把本轮扩写成 provider 平台、完整 secret 系统或棋力大改专项
- 回退并重打 D-2.5 已收口结论

---

## 5. 汇报与返回规则
### 默认应返回
- 完成 Task Bundle D-2.6 的 contract 收口后
- 出现关键阻塞时
- 发现需要调整 Plan / Tasks / Contract 时
- 出现范围漂移风险时
- 当前切片只能部分完成时

### 默认不返回
- 普通阅读过程
- 单条命令细节
- 小范围失败尝试
- 局部文字调整

### 立即返回条件
出现以下情况必须立即返回：
- 关键前提不成立
- 需要扩大已确认范围
- 需要改动 Plan 级方案
- 当前 task 定义不足以继续执行
- 需要用户拍板
- 当前代码现状与权威文档严重不一致
- 若要继续推进必须切换为 burn-in / 平台治理 / 棋力专项等新问题切片

---

## 6. 测试与验证要求
### 主链路验证
- 当前优化不得破坏既有 `provider-success` 主链路
- 当前优化不得破坏 legality check 与 fallback
- 当前优化后，decision 输出仍需可解析、可验证、可落回当前主链路

### 本轮任务级验证
至少覆盖并回报：
- decision 输入契约的现状梳理结果
- prompt 或输入结构优化后的最小验证结果
- 若涉及 server 逻辑改动，补充对应测试或 smoke
- 若影响构建，补跑 `npm run build --workspace @xiangqi-web/server`

### 边界 / 异常验证
- provider 返回正文但 schema 不稳定时是否仍可识别
- reason 为空、过短、过泛化时是否需要特殊处理
- 输入上下文裁剪后是否影响合法性与稳定性判断

### 最低完成标准
- 无清晰输入契约结论，不算完成
- 无最小验证结果，不算完成
- 无状态记录与结论回写，不算完成

---

## 7. 文档与状态更新要求
本轮完成后，至少同步更新：
- `sdd-status.md`
- `review.md`
- `docs/Task Bundle D-2.6 实现交接.md`
- 当前执行状态
- 下一步动作
- 是否存在阻塞

默认原则：
> 本轮不是泛泛讨论“prompt 还能优化”，而是要把 decision 输入契约与体验优化问题收成新的可执行闭环。

---

## 8. 回退规则
出现以下情况时应回退而非硬推：
- 已确认文档之间存在关键冲突
- 当前 task 定义不足以支撑继续优化
- 当前优化目标实际上已经变成 burn-in / provider 平台治理 / 棋力专项
- 为满足本轮目标必须扩大到完整前后端或产品层大改

### 回退目标
- [ ] 回到 Specify
- [ ] 回到 Plan
- [ ] 回到 Tasks
- [x] 仅补充 Execution Contract

---

## 9. 完成定义
本轮 Task Bundle D-2.6 只有同时满足以下条件才算完成：
- 已覆盖本轮约定范围
- 已明确 decision 输入契约与 prompt 优化入口
- 已形成真实实现或最小验证结果
- 已更新状态记录
- 无未披露关键阻塞

---

## 10. 审核结论
### 本轮审核意见
- D-2.6 的问题边界已从 D-2.5 的 provider 命中验证中剥离出来，并已收敛为独立的 implement 入口
- 本轮已明确：decision 输入契约、prompt 结构与体验优化是当前唯一问题主轴；provider 协议 / baseUrl / 命中性不再作为本轮前置讨论项
- 当前 execution-contract 已具备可执行版本，允许据此进入 D-2.6 implement

### 进入 Implement 前的最小执行顺序
1. 先固化 decision 输入契约与 prompt 组织入口
2. 再做 `move + reason` 的最小实现 / 调整与验证
3. 最后回写 D-2.6 的 review / status / 实现交接结果

### 是否允许进入 Implement
- [x] 是
- [ ] 否
