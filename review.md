# Review / 验收结论

## 文档头信息
- 文档名称：review
- 当前状态：已确认
- 所属阶段：Review
- 所属项目：xiangqi-web / 网页版中国象棋项目
- 所属功能 / 子功能：Task Bundle D-2.6 Review / Acceptance（decision 输入契约 / prompt / 体验优化）
- 上游文档：spec.md, plan.md, tasks.md, execution-contract.md, docs/Task Bundle D-2.6 实现交接.md, docs/Task Bundle D-2.5 真实页面 smoke 记录.md
- 创建时间：2026-04-12
- 最后更新时间：2026-04-12

## 关联更新检查
本文档形成结论后，至少检查是否需要同步更新：
- sdd-status.md
- execution-contract.md
- docs/Task Bundle D-2.6 实现交接.md
- 下一轮 feature / task 入口文档（仅在明确开启下一轮时）
- 当前仓库是否已形成稳定快照

---

## 1. Review 范围
### 本轮覆盖内容
- decision provider 输入契约显式化
- decision prompt 职责、读取顺序与输出约束收紧
- provider `reason` 质量清洗与 `situationShift` 兜底归一
- decision 请求体结构化升级（`positionState / difficultyGuide / legalMoveDigest / priorityCandidates / noiseControl / focusTags`）
- `chat_completions` 与 `responses` 双路径下的请求体级验证
- 至少 2 条真实 provider 下的观察型 smoke
- `payloadSummary / responsesSummary` 观测口径补齐

### 对应用户故事 / FR / 任务组
- 用户故事：US3、US5、US6（以 D-2.6 的 decision 决策质量与体验质量为当前切入点）
- FR：FR-004 ~ FR-017、FR-023 ~ FR-027
- 任务组：Task Bundle D-2.6（decision 输入契约 / prompt / 体验优化）

---

## 2. Spec 满足度
### 总体判断
- [x] 满足（以 D-2.6 当前约定边界来看）
- [ ] 基本满足
- [ ] 不满足

### 说明
若以 **D-2.6 当前边界** 来看，本轮已经完成的关键收口是：
1. 已把 decision 输入契约从“隐含结构”提升为显式 contract，并在请求体中固定为 `d2.6`；
2. 已明确 prompt 的读取顺序、输出形状、reason 约束与噪音控制原则；
3. 已将 `legalMoves` 从细节平铺改成“合法性清单”，并把更强语义集中到 `priorityCandidates`；
4. 已新增 `payloadSummary` 观测摘要，使真实 provider 成功/失败日志可直接看到本轮 contract 是否按预期发出；
5. 已完成 `chat_completions` / `responses` 双路径下的请求体级验证；
6. 已补 2 条真实 provider 下的观察样本，说明本轮 contract 不只停留在 mock / 集成测试层，而已进入真实链路可观察状态。

本轮明确没有完成：
- 多样本长时间 burn-in
- 棋力专项评测
- 完整 provider 平台治理
- commit / push 形成稳定快照

因此，本轮正确口径应是：
**D-2.6 边界内通过；decision 输入契约、prompt 约束、噪音控制与 reason 质量约束已形成真实可验证闭环。当前 review 可收口，但仓库快照尚未收稳。**

---

## 3. 用户故事完成情况
### 用户故事 3（P1）
- 完成情况：通过
- 是否可独立成立：是
- 说明：当前 decision 回包中的 `reason / situationShift / storyThreadSummary` 仍能稳定落回既有展示链路，且通过真实 provider 样本观察到了更贴近战术焦点的输出。

### 用户故事 5（P2）
- 完成情况：通过
- 是否可独立成立：是
- 说明：后台 `decision` 配置继续可驱动真实 provider runtime；在 `responses` 路径下，新的结构化 contract 已确认可真实发出并被消费。

### 用户故事 6（P3）
- 完成情况：阶段性通过
- 是否可独立成立：基本成立
- 说明：当前不是做完整模型平台，而是把 decision 输入质量、输出约束与可观测性收清。此目标当前已成立；更长期的 burn-in 与平台治理不在本轮范围内。

---

## 4. Tasks 完成情况
### 已完成任务
- 已在 `apps/server/src/domain/ai/decision/decision-provider-service.ts` 中显式固化 `inputContract` 与 `reasonConstraints`
- 已新增 provider `reason` 清洗逻辑，过滤空泛表述并截断过长输出
- 已在 `apps/server/src/domain/ai/decision/standard-ai-decision.ts` 中补 `situationShift` 兜底归一逻辑
- 已将 decision 请求体升级为结构化 payload，新增：
  - `requiredReadOrder`
  - `positionState`
  - `difficultyGuide`
  - `legalMoveDigest`
  - `priorityCandidates`
  - `noiseControl`
  - `focusTags`
- 已将 `legalMoves` 降噪为仅保留 `from / to` 作为合法性校验清单
- 已补请求体级集成测试：
  - `chat_completions` 路径
  - `responses` 路径
- 已在 success / failure 日志中补 `payloadSummary`
- 已完成 2 条真实 provider 下的观察型 smoke，并得到真实 `provider-success` 样本

### 未完成任务
- 更长时间、多样本的真实 burn-in
- 对 `priorityCandidates` 是否提升稳定性的更系统评测
- 稳定快照提交 / push

### 偏差说明
- 两条真实样本中 AI 落子均为 `b8b1`，这说明当前 provider 在这两种开局输入下收敛到相同高优先应手；但这还不足以外推为更广泛局面下的长期稳定结论。
- 当前 review 结论建立在“定向验证 + 两条真实样本”之上，不等于 burn-in 已完成。

---

## 5. 验证结果概览
### 主链路验证
- 内容：decision contract 显式化、reason 清洗、结构化 payload、双路径请求体级验证、真实 provider 观察型 smoke
- 结果：通过
- 说明：当前结论基于实际代码、定向测试与真实 provider 观察结果形成，不是沿用旧轮次口头判断。

### 用户故事独立验证
- provider 合法步命中 → 通过
- provider 非法步 fallback → 通过
- generic reason 兜底 → 通过
- `chat_completions` 请求体结构验证 → 通过
- `responses` 请求体结构验证 → 通过
- 非法用户步保护 → 通过

### 验证明细
- `npm run build --workspace @xiangqi-web/server` 通过
- decision 定向集成测试通过：
  - `should use decision provider move when provider returns a legal move`
  - `should send structured decision contract payload to provider`
  - `should send structured decision contract payload to responses provider`
  - `should use fallback situation shift when provider reason is too generic`
  - `should fallback to local decision engine when provider returns an illegal move`
  - `should reject illegal moves without polluting game state`
- 真实 provider 样本 1：
  - 口径：`gpt-5.4 + https://codex.hiyo.top/v1 + responses`
  - 用户落子：`a1 -> a2`
  - AI 应手：`b8 -> b1`
  - `situationShift`：`换子施压并破坏对方侧翼。`
  - `payloadSummary` / `responsesSummary` 已出现
- 真实 provider 样本 2：
  - 口径：`gpt-5.4 + https://codex.hiyo.top/v1 + responses`
  - 用户落子：`a1 -> a3`
  - AI 应手：`b8 -> b1`
  - `situationShift`：`先手换子，顺势压迫边线。`
  - `payloadSummary` / `responsesSummary` 已出现

### 外部阻塞 / 条件项（如有）
- 当前未再把“provider 是否能命中”视为阻塞项
- 当前仍保留的条件项仅为：是否需要继续做 burn-in 与更大样本体验观察；这不阻断本轮 review 收口

---

## 6. 代码质量结构化判断
### 正确性
- 结论：通过
- 说明：当前 provider 输出仍需经过合法性校验；非法 provider move 仍会 fallback；真实与测试链路均未见主链路回退。

### 可读性
- 结论：通过
- 说明：decision provider 结构虽然变厚，但 contract、summary、reason 清洗与 wire-api 分支仍集中在单一服务文件中，职责边界清楚。

### 可维护性
- 结论：基本通过
- 说明：输入契约现已显式化，后续若继续改 prompt 或 payload 结构，不再需要靠散落会话记忆恢复；不过 `decision-provider-service.ts` 体积继续增长，后续若再迭代一轮以上，可考虑拆出 payload-builder / summary-builder。

### 范围控制
- 结论：通过
- 说明：本轮严格停留在 decision 输入质量、输出约束与可观测性，没有顺手把 narrative、棋力专项或 provider 平台治理一起扩写。

### 可验证性
- 结论：通过
- 说明：本轮同时具备 build、定向 vitest 与 2 条真实 provider 样本，验证链比前几刀更完整。

---

## 7. 问题与风险
- 当前 2 条真实样本都收敛到 `b8b1`，说明“高优先候选收敛”是个真实现象，但还需要更多样本才能判断这是否会在更复杂局面下过于单一。
- `payloadSummary` 目前主要用于日志观察，尚未形成更正式的 smoke 文档或审计表结构。
- 当前 review 虽已可形成，但**仓库仍存在与本轮直接相关的未提交改动**；因此现在只能说“review 语义已收口”，还不能说“本轮稳定快照已形成”。

---

## 8. 结论
### 总体结论
- [x] 通过
- [x] 建议进入稳定快照收口
- [ ] 当前轮次已收口但暂不开启下一轮

### 结论说明
以 D-2.6 当前边界来看，当前已经完成：
1. decision 输入契约显式化
2. prompt 读取顺序、噪音控制与输出约束收口
3. provider `reason` 的质量清洗与体验兜底
4. `chat_completions` / `responses` 双路径请求体级验证
5. 2 条真实 provider 下的观察样本
6. 真实日志中 `payloadSummary / responsesSummary` 的可观测性补齐

因此，当前最准确的结论是：
**Task Bundle D-2.6 通过；decision 输入契约 / prompt / 体验优化这一轮已形成可验证闭环，并已在真实 provider 链路中拿到观察样本。下一步不应继续无限追加实现切片，而应先收稳当前工作树，形成稳定快照。**

---

## 9. 后续建议
### 建议立即处理
- 将本轮结果回写到 `sdd-status.md` 与 D-2.6 相关文档
- 形成当前工作树的稳定快照（commit / 如有需要再 push）

### 可放入下一轮迭代
- 更大样本的真实 burn-in
- `priorityCandidates` 对输出稳定性的更系统评估
- 更正式的 smoke evidence 文档化
- provider / decision 观测结果结构化沉淀
- 棋力体验专项评估

---

## 10. 最终验收意见
### 用户验收意见
- 用户是否接受当前结论：当前已按要求补齐第 2 条真实样本，并据此完成 D-2.6 review 收口草稿
- 其他验收备注：当前“通过”针对 D-2.6 当前边界；本轮尚未形成稳定快照，因此收口后第一优先动作应是把仓库收稳

### 是否验收通过
- [x] 是
- [ ] 否
- [ ] 阶段性通过
