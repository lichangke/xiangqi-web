# Task Bundle D-2.6 实现交接

## 文档定位
- 文档类型：实现交接
- 适用范围：Task Bundle D-2.6（decision 输入契约 / prompt / 体验优化）
- 当前状态：已确认
- 创建时间：2026-04-11
- 最后更新时间：2026-04-12

## 1. 本轮交接目标
在 D-2.5 已正式收口、`codex.hiyo.top` 的 `Responses API + streaming delta` 接入口径已确认、decision provider 真实主链路 `provider-success` 已成立的前提下，开启新一轮 **decision 输入契约 / prompt / 体验优化**。

本轮不再回答“provider 是否能命中”这一旧问题，而是把问题切片收敛为：
1. 当前 decision provider 实际喂给模型的输入契约是否足够清晰、稳定、可控；
2. 当前 prompt 是否能稳定引导模型输出更高质量、可解析、合法且更符合体验预期的结果；
3. 当前 decision 回包中的 `reason`、落子倾向与用户侧主观体验，是否需要做最小一轮优化与验证。

一句话目标：
> 在不回退 D-2.5 已收口结论的前提下，把问题主轴切换到 **decision 输入质量与输出体验质量**，并形成新的可执行入口。

---

## 2. 对应任务范围
### 当前实际切片
本轮属于 D-2 的新一轮增量切片，编号暂定为：
- **Task Bundle D-2.6 / decision 输入契约 / prompt / 体验优化**

### 明确包含
- 梳理并固化 decision provider 当前真实输入契约
- 明确当前 decision prompt 的职责、结构、约束与输出要求
- 判断是否需要把棋局上下文、合法候选步、难度档位、历史摘要、输出格式约束做更清晰的显式收口
- 针对 `move + reason` 的输出质量做最小一轮优化
- 保持当前 `provider-success + 合法性校验 + fallback` 主链路不退化
- 为本轮优化准备新的 execution-contract 与后续验证口径

### 明确不包含
- 回退到 provider 协议 / baseUrl / key / 命中性排查
- 把本轮直接扩写成完整 provider 平台治理
- 完整 secret 持久化 / 加密体系
- narrative 大重构
- 搜索型棋力引擎化改造
- 长时间 burn-in 专项
- 与当前切片无关的大范围前后端重构

---

## 3. 当前问题定义
D-2.5 已回答并收口：
1. `codex.hiyo.top` 应按 `Responses API` 接入；
2. 非流式最终 `output / output_text` 可能为空；
3. 正文来自 streaming `response.output_text.delta`；
4. 当前 decision provider 兼容修正后，真实主链路 provider-success 已成立。

因此，D-2.6 当前要回答的问题不再是“能不能命中”，而是：
> **在链路已成立的前提下，decision 输入给得是否对，prompt 写得是否够好，最终机器落子质量与 reason 体验是否值得优化？**

本轮默认优先级：
1. 输入契约清晰化
2. prompt 结构优化
3. 体验与 reason 质量验证

---

## 4. 初步完成定义
本轮后续若进入实现，至少应满足：
1. 已明确 decision 输入契约的权威结构与必要字段
2. 已明确 prompt 的职责边界、输出约束与不变量
3. 已完成一轮最小实现或实验性优化，并有可验证结果
4. 当前 provider-success 主链路与 fallback 不退化
5. 已形成新的 review / 状态 / 交接回写条件

---

## 5. 当前权威输入
### 必读文档
- `spec.md`
- `plan.md`
- `tasks.md`
- `sdd-status.md`
- `review.md`
- `execution-contract.md`
- `docs/Task Bundle D-2.5 实现交接.md`
- `docs/Task Bundle D-2.5 真实页面 smoke 记录.md`
- 本文档 `docs/Task Bundle D-2.6 实现交接.md`

### 重点代码入口
- `apps/server/src/domain/ai/decision/decision-provider-service.ts`
- `apps/server/src/domain/ai/decision/standard-ai-decision.ts`
- `apps/server/src/domain/game/game-service.ts`

若旧会话理解与以上已落盘文档冲突，以当前文档链为准。

---

## 6. 当前交接结论
- D-2.5 已完成收口，不再承载新问题
- D-2.6 的 execution-contract 已收清并确认，可作为当前轮 implement 的权威执行入口
- 当前已完成一轮真实 provider 下的观察型 smoke：在 `gpt-5.4 + https://codex.hiyo.top/v1 + responses` 口径下，`/api/games/:id/moves` 真实返回 200，provider-success 成立，且新增的 `payloadSummary / responsesSummary` 已在真实日志中出现；本轮真实样本中 AI 应手为 `b8b1`，`situationShift` 为“换子施压并破坏对方侧翼。”，说明 D-2.6 当前结构化 contract 已不只停留在测试层，而已进入真实链路可观察状态
- 下一步应从“已有真实观察样本”转向 review 收口判断：是继续补第二个真实样本，还是直接基于当前真实样本 + 定向验证准备 D-2.6 review 草稿
