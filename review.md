# Review / 验收结论

## 文档头信息
- 文档名称：review
- 当前状态：已确认
- 所属阶段：Review
- 所属项目：xiangqi-web / 网页版中国象棋项目
- 所属功能 / 子功能：Task Bundle D-2.5 Review / Acceptance（外部线上 provider 页面层稳定命中验证）
- 上游文档：spec.md, plan.md, tasks.md, execution-contract.md, docs/Task Bundle D-2.5 实现交接.md, docs/Task Bundle D-2.5 真实页面 smoke 记录.md
- 创建时间：2026-04-09
- 最后更新时间：2026-04-11

## 关联更新检查
本文档形成结论后，至少检查是否需要同步更新：
- sdd-status.md
- execution-contract.md
- docs/Task Bundle D-2.5 实现交接.md
- docs/Task Bundle D-2.5 真实页面 smoke 记录.md
- 下一轮 feature / task 入口文档（仅在明确开启下一轮时）

---

## 1. Review 范围
### 本轮覆盖内容
- 外部线上 provider 在 decision 页面主链路中的真实命中验证
- `.env` 真实加载口径修正（项目内 `.env` 优先）
- decision provider 对 `Responses API` 的兼容接入
- `codex.hiyo.top` 口径识别、请求协议修正与最小矩阵试探
- 对 `responses` 最终对象为空但 streaming delta 有正文的兼容修正
- provider-success / fallback 的真实链路验证与文档回收

### 对应用户故事 / FR / 任务组
- 用户故事：US3、US5、US6（以 D-2.5 增量验证切片承接）
- FR：FR-004 ~ FR-017、FR-023 ~ FR-027
- 任务组：Task Bundle D-2.5（外部线上 provider 页面层稳定命中验证）

---

## 2. Spec 满足度
### 总体判断
- [x] 满足（以 D-2.5 当前约定边界来看）
- [ ] 基本满足
- [ ] 不满足

### 说明
- 若以 **D-2.5 当前边界** 来看，本轮已经完成了关键问题的验证闭环：
  1. 已确认当前线上 provider `codex.hiyo.top` 不应继续按 `chat/completions` 接入，而应按 `responses` 接入；
  2. 已确认该 provider 在非流式 `responses` 下会出现 `200 / completed` 但 `output / output_text` 为空的真实现象；
  3. 已通过最小矩阵试探确认：该 provider 的正文可稳定经由 streaming `response.output_text.delta` 事件返回；
  4. 已将 decision provider 的 `responses` 分支改为流式 delta 累积正文；
  5. 已在真实页面主链路对应的本地 server smoke 中确认 provider-success，说明当前页面层 provider 命中已成立。
- 本轮明确没有完成：
  - decision 输入契约 / prompt 优化
  - 棋力与体验专项
  - 完整 provider 平台化治理
  - 完整 secret 安全持久化体系
- 因此，本轮正确口径应是：**D-2.5 边界内通过；当前外部线上 provider 页面层稳定命中问题已收口，不再阻塞进入下一轮 decision 输入契约 / prompt / 体验优化判断。**

---

## 3. 用户故事完成情况
### 用户故事 3（P1）
- 完成情况：通过
- 是否可独立成立：是
- 说明：decision provider 现已可在真实线上 provider 口径下生成合法 AI 应手，并保留合法性校验与 fallback 保护。

### 用户故事 5（P2）
- 完成情况：通过
- 是否可独立成立：是
- 说明：后台 `decision` 配置与 env 中 `DECISION_API_KEY` 已可共同驱动真实 provider runtime，且当前 provider 命中样本已在真实主链路中成立。

### 用户故事 6（P3）
- 完成情况：阶段性成立
- 是否可独立成立：基本成立
- 说明：本轮不是做完整模型平台，而是解决“当前 provider 口径真实能否命中”的问题。该问题已收口，但更高阶治理能力不在本轮范围内。

---

## 4. Tasks 完成情况
### 已完成任务
- 已修正 server `.env` 加载口径：优先读取 `xiangqi-web/.env`，再补 workspace 根 `.env`
- 已确认 `codex.hiyo.top` 的 provider 协议口径应为 `Responses API`
- 已补最小 body 矩阵试探，确认：
  - 非流式 `responses` 最终对象稳定为空
  - 流式 `responses` 事件中存在 `response.output_text.delta`
- 已修改 `apps/server/src/domain/ai/decision/decision-provider-service.ts`：
  - 支持 `chat_completions` + `responses` 双协议
  - `codex.hiyo.top` 默认走 `responses`
  - `responses` 分支改为流式 SSE 读取 `response.output_text.delta`
  - 保留 `responsesSummary` 结构摘要日志，记录 provider 最终对象结构特征
- 已补 decision 集成测试：
  - provider 返回合法步时命中 provider
  - provider 返回非法步时仍 fallback
- 已完成真实链路 smoke：在 `gpt-5.4 + https://codex.hiyo.top/v1` 下，日志出现 `bundle-d24-decision-provider-success`

### 未完成任务
- decision 输入契约 / prompt 优化
- 棋力体验专项
- 多样本长时间稳定性 burn-in
- 完整 provider / secret 平台化治理

### 偏差说明
- 本轮通过验证发现，`codex.hiyo.top` 的 `Responses API` 最终 completed response 可能保持空 `output / output_text`；当前有效消费方式是直接从 streaming delta 累积正文。
- 这是 provider 当前真实行为特征，不应再按 OpenAI 常规“最终 response.output 一定含正文”的前提实现。

---

## 5. 验证结果概览
### 主链路验证
- 内容：`Responses API` 接口口径验证、流式正文兼容、decision provider success / fallback、真实主链路 smoke
- 结果：通过
- 说明：当前结论基于当前工作树与真实 provider 返回结果形成，不是沿用旧轮次口头判断。

### 用户故事独立验证
- `.env` 加载修正 → 通过
- provider 协议修正（chat → responses）→ 通过
- 非流式空 response 归因 → 通过
- 流式 delta 正文提取 → 通过
- decision provider success → 通过
- fallback 保护未退化 → 通过

### 验证明细
- `npm run build --workspace @xiangqi-web/server` 通过
- decision 相关集成测试通过：
  - `should use decision provider move when provider returns a legal move`
  - `should fallback to local decision engine when provider returns an illegal move`
- Responses 最小矩阵试探结论：
  - 非流式 A/B/C/D：`200 / completed`，但 `output_text = 0`、`output = []`
  - 流式 E/F：存在大量 `response.output_text.delta`，其中 E 可返回标准 JSON 文本 `{"move":{"from":"a1","to":"a2"},"reason":"test"}`
- 真实链路最终成功样本：
  - `providerStatus: 200`
  - `modelName: gpt-5.4`
  - `baseUrl: https://codex.hiyo.top/v1`
  - `wireApi: responses`
  - `move: b8b1`
  - 同时 `responsesSummary` 显示最终 completed response 仍为空对象结构，证明当前成功依赖 streaming delta，而非最终 `output / output_text`

### 外部阻塞 / 条件项（如有）
- 当前未再把“外部线上 provider 页面层是否能命中”视为阻塞项
- 保留事项仅为：是否需要进一步做多样本 burn-in 与体验优化，但这不阻断本轮通过

---

## 6. 代码质量结构化判断
### 正确性
- 结论：通过
- 说明：当前 provider 协议、正文提取与合法性校验已在测试与真实主链路下闭环。

### 可读性
- 结论：通过
- 说明：decision provider 逻辑仍集中在 `decision-provider-service.ts`，新增 `responses` 分支与摘要日志后职责边界仍清晰。

### 可维护性
- 结论：基本通过
- 说明：provider 特例（`codex.hiyo.top` → responses）已收口到服务层，不需要把调用方改成分叉处理。

### 范围控制
- 结论：通过
- 说明：本轮只解决“线上 provider 页面层命中是否成立”的问题，没有顺手把下一轮 prompt / 棋力 / secret 平台化一起打满。

### 可验证性
- 结论：通过
- 说明：本轮从协议判断、矩阵试探、流式改造到真实 smoke 均有当前工作树执行证据。

---

## 7. 问题与风险
- `codex.hiyo.top` 当前 provider 行为存在一个需要记录的兼容特征：**最终 completed response 可能为空，但 streaming delta 仍可返回正文**。
- 当前“稳定命中已成立”的结论建立在本轮真实样本与兼容修正之上，不外推为长期 burn-in 已完成。
- 若下一轮需要继续提升体验，问题应切换到：
  - decision 输入契约
  - prompt / reason 质量
  - 棋力与用户感知
  而不是再回退到“provider 是否能命中”的旧问题。

---

## 8. 结论
### 总体结论
- [x] 通过
- [x] 建议进入下一步判断
- [ ] 当前轮次已收口但暂不开启下一轮

### 结论说明
- 以 D-2.5 当前边界来看，当前已经完成：
  1. 外部线上 provider 页面层命中问题的真实归因
  2. `Responses API` 接入协议修正
  3. streaming delta 正文提取兼容
  4. 真实主链路 provider-success 样本确认
- 因此，当前最准确的结论是：
  **Task Bundle D-2.5 通过；外部线上 provider 页面层命中已成立，且其真实兼容特征已被记录。若继续推进，应进入新的问题切片，而不是继续停留在“能否命中 provider”的验证阶段。**

---

## 9. 后续建议
### 建议立即处理
- 将本轮结果回写到 `sdd-status.md` 与 D-2.5 相关文档
- 基于当前稳定快照形成下一轮入口判断

### 可放入下一轮迭代
- decision 输入契约优化
- prompt / reason 质量优化
- 多样本长期稳定性 burn-in
- 更细的 provider 观测与审计
- secret / provider 平台化治理
- 棋力体验专项评估

---

## 10. 最终验收意见
### 用户验收意见
- 用户是否接受当前结论：本轮已按要求将结果正式落盘收口
- 其他验收备注：当前“通过”仅针对 D-2.5 当前边界；下一轮若继续推进，应切换问题入口而不是回退到 provider 命中问题

### 是否验收通过
- [x] 是
- [ ] 否
- [ ] 阶段性通过
