# Task Bundle D-2.5 实现交接

## 文档定位
- 文档类型：实现交接
- 适用范围：Task Bundle D-2.5（外部线上 provider 页面层稳定命中验证）
- 当前状态：已确认
- 创建时间：2026-04-09
- 最后更新时间：2026-04-11

## 1. 本轮交接目标
在 D-2.4 已确认“decision 真实模型接入最小闭环成立，且页面层 provider 命中样本已确认”的前提下，进一步补一轮 **面向外部线上 provider 的页面层稳定命中验证**。

本轮实际完成了以下四件事：
1. 确认 `codex.hiyo.top` 这条口径不应继续按 `chat/completions` 接入，而应按 `responses` 接入
2. 通过最小矩阵试探确认：非流式 `responses` 最终对象为空，但流式 `response.output_text.delta` 可稳定返回正文
3. 将 decision provider 的 `responses` 分支改为流式 SSE delta 累积正文
4. 在真实主链路验证中确认 `bundle-d24-decision-provider-success`，说明页面层外部线上 provider 命中已成立

一句话结论：
> “页面层接入外部线上 provider 到底稳不稳”这一问题，当前已形成可验证、可回写、可复现的闭环结论：**已成立。**

---

## 2. 对应任务范围
### 对应任务
- 本轮属于 D-2 的增量切片，不单独视为完整 Task Bundle D / E 收口
- 主要承接：
  - FR-004 ~ FR-017（对局 AI 决策主链路）
  - FR-023 ~ FR-027（模型配置与未配置状态约束）
  - D-2.4 之后的新验证问题：页面层外部 provider 稳定命中验证

### 当前实际切片
本轮交付不是继续重写 decision，也不是直接优化棋力，而是其第五段：**D-2.5 / 外部线上 provider 页面层稳定命中验证**。

### 明确包含
- 基于当前 D-2.4 实现，对外部线上 provider 做页面层 smoke
- 补最小可观察结果：provider 成功命中、fallback、空 response、协议类型、streaming delta 事实
- 在后台 `decision` model config 真实切到外部 provider 时，观察用户端真实页面落子链路结果
- 保持 fallback 主链路不退化
- 补齐必要 smoke 记录、review 与状态文档

### 明确不包含
- decision prompt 重写
- 决策输入契约大改
- 棋力专项优化
- narrative 重做
- 完整 secret 持久化 / 加密体系
- 完整 provider 健康检查平台
- 并发治理平台
- 搜索型象棋引擎大改造

---

## 3. 当前问题定义（已收口）
D-2.4 已经回答了两个问题：
1. decision 是否已真实接入模型主链路 → **已接入**
2. 页面层是否完全打不到 provider → **不是，页面层命中样本已确认存在**

D-2.5 最终回答的是：
> **外部线上 provider 在页面层是否稳定命中？**

当前已形成的最终结论是：
- `codex.hiyo.top` 应按 `Responses API` 接入
- 非流式 `responses` 最终对象可能保持 `completed` 但 `output / output_text` 为空
- 当前有效实现方式是：直接读取 streaming `response.output_text.delta`
- 经真实主链路 smoke 验证，页面层 provider 命中已成立

也就是说，本轮不再停留在“接没接上”的旧问题，而已经把：
> **页面层对外部线上 provider 是否成立**
收口为：
> **已成立，且兼容特征已明确。**

---

## 4. 交付完成定义（完成）
本轮已满足以下完成条件：

1. **真实页面样本成立**
   - 已完成一轮面向外部线上 provider 的真实主链路 smoke
   - 用户端真实落子链路已被观察和记录

2. **可归因闭环成立**
   - 已区分并记录：
     - 协议接错（chat/completions）
     - 非流式 completed 但空 output
     - 流式 delta 有正文
     - provider-success 成立
   - 不再停留于模糊的“好像没打到 / 好像不太稳”

3. **主链路稳定性成立**
   - 页面主链路未因 provider 改造而断裂
   - fallback 仍可用
   - provider-success 已出现

4. **边界控制成立**
   - 未将本轮扩写为 prompt / 棋力 / secret 平台化专项

5. **文档与状态回写成立**
   - review / status / smoke 已回写

6. **下一步判断成立**
   - 当前已不需要继续停留在“provider 是否能命中”的验证阶段
   - 若继续推进，应切换到新的问题切片

---

## 5. 本轮关键实现与发现
### 关键实现
- 修正 server `.env` 加载顺序：优先 `xiangqi-web/.env`
- 在 `decision-provider-service.ts` 中新增 `responses` 分支
- 针对 `codex.hiyo.top` 默认优先选择 `responses`
- 通过最小矩阵试探确认：
  - 非流式最终对象为空
  - 流式 delta 存在正文
- 将 `responses` 分支改为流式 SSE 读取 `response.output_text.delta`
- 保留 `responsesSummary` 结构摘要日志，记录 provider 最终对象结构特征

### 本轮最重要的新事实
- 当前 provider 的“最终 completed response 为空”并不等于“无正文”
- 正文真实存在于 streaming delta 事件中
- 当前 decision provider 已按此兼容事实修正并验证成功

---

## 6. 真实验证摘要
### 最小矩阵试探结论
- 非流式 A/B/C/D：`200 / completed`，但 `output_text = 0`、`output = []`
- 流式 E/F：存在大量 `response.output_text.delta`
- 其中 E 可稳定返回标准 JSON 文本：
  `{"move":{"from":"a1","to":"a2"},"reason":"test"}`

### 最终真实主链路样本
- `providerStatus: 200`
- `modelName: gpt-5.4`
- `baseUrl: https://codex.hiyo.top/v1`
- `wireApi: responses`
- `move: b8b1`
- provider-success 日志已出现
- 同时 `responsesSummary` 显示最终对象仍为空，证明当前成功依赖 streaming delta，而不是最终 `output / output_text`

---

## 7. 权威输入
### 必读文档
- `spec.md`
- `plan.md`
- `tasks.md`
- `execution-contract.md`
- `sdd-status.md`
- `review.md`
- `docs/Task Bundle D-2.4 实现交接.md`
- `docs/Task Bundle D-2.4 真实页面 smoke 记录.md`
- 本文档 `docs/Task Bundle D-2.5 实现交接.md`

### 重点参考
- `apps/server/src/domain/ai/decision/decision-provider-service.ts`
- `apps/server/src/domain/game/game-service.ts`
- `apps/web/src/App.tsx`
- `docs/Task Bundle D-2.5 真实页面 smoke 记录.md`

若旧会话理解与以上文档冲突，以当前落盘文档为准。

---

## 8. 当前交接结论
- 当前 D-2.5 已完成收口，不再处于“草案中”
- 当前问题“外部线上 provider 页面层是否稳定命中”已形成结论：**成立**
- 当前不应再回退讨论“provider 是否能打通”这类旧问题
- 若继续推进，应以新的问题切片进入下一轮，而不是继续停留在 D-2.5 验证阶段
