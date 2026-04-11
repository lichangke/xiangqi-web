# Task Bundle D-2.5 真实页面 smoke 记录

## 文档头信息
- 文档名称：Task Bundle D-2.5 真实页面 smoke 记录
- 当前状态：已确认
- 所属阶段：Review / Smoke Evidence
- 所属项目：xiangqi-web / 网页版中国象棋项目
- 所属功能 / 子功能：Task Bundle D-2.5（外部线上 provider 页面层稳定命中验证）
- 创建时间：2026-04-11
- 最后更新时间：2026-04-11

## 1. 记录目的
补录 D-2.5 当前轮的真实页面 / 真实链路验证证据，确认：
1. 外部线上 provider 页面层命中是否成立
2. 当前 provider 的真实兼容特征是什么
3. 当前结论是否足以支撑 D-2.5 收口

---

## 2. 本轮关键验证背景
在 D-2.4 已确认 decision 最小闭环成立、页面层 provider 命中样本存在之后，D-2.5 继续追问的是：
> 外部线上 provider 在页面层到底是否稳定命中，而不是只在 mock / 本地样本下能命中。

本轮围绕 `codex.hiyo.top` 做了以下收敛：
- 先确认协议口径：应走 `Responses API`
- 再确认最终对象行为：非流式 `completed` 但 `output / output_text` 为空
- 再确认正文真实位置：streaming `response.output_text.delta`
- 最后将 decision provider 改为直接读取 streaming delta，并用真实链路验证

---

## 3. 最小矩阵试探摘要
### 非流式 responses
对以下 body 形状进行了最小矩阵试探：
- `input` 纯字符串
- `input` 消息数组
- `instructions + input`
- `text.format = json_object`

共同结果：
- `status = 200`
- `responseStatus = completed`
- `output_text = 0`
- `output = []`
- `contentItemCount = 0`
- 但 `usage.output_tokens > 0`

结论：
> 非流式最终 response 对象在当前 provider 下表现为“真空”。

### 流式 responses
对消息数组 + `stream: true` 的最小体形进行了验证。

共同结果：
- 出现大量 `response.output_text.delta`
- 可累积出真实正文文本
- 但最终 completed response 仍可能保持空 `output / output_text`

关键样例：
`{"move":{"from":"a1","to":"a2"},"reason":"test"}`

结论：
> 正文真实存在于 streaming delta，而不是最终 `output / output_text`。

---

## 4. decision provider 代码侧兼容修正
### 修正前
- `codex.hiyo.top` 仍按 `chat/completions` 或非流式最终对象思路消费
- 结果：协议不匹配或 `provider_empty_response:responses`

### 修正后
- `codex.hiyo.top` 默认按 `responses`
- `responses` 分支改为流式 SSE 读取 `response.output_text.delta`
- 对最终 completed response 继续保留 `responsesSummary` 摘要日志，仅用于记录 provider 特征，不再作为唯一正文来源

---

## 5. 最终真实主链路样本
在恢复 decision 配置为：
- `modelName = gpt-5.4`
- `baseUrl = https://codex.hiyo.top/v1`

并使用当前真实 `.env` 中的 `DECISION_API_KEY` 后，重跑真实主链路，得到以下关键日志：

```text
[bundle-d24-decision-provider-success] {
  providerStatus: 200,
  providerTimeoutMs: 20000,
  modelName: 'gpt-5.4',
  baseUrl: 'https://codex.hiyo.top/v1',
  wireApi: 'responses',
  responsesSummary: {
    responseStatus: 'completed',
    hasOutputText: false,
    outputLength: 0,
    contentItemCount: 0
  },
  move: 'b8b1'
}
```

### 核心说明
- provider-success 已成立
- 说明当前 decision provider 已成功消费 streaming delta 正文
- 同时最终 `responsesSummary` 仍为空，进一步证明：
  > 当前 provider 的正文返回路径在 streaming delta，而不在最终 completed response 对象中

---

## 6. 当前结论
### 本轮确认成立
- 外部线上 provider 页面层命中已成立
- `codex.hiyo.top` 当前应按 `Responses API + streaming delta` 口径接入
- 当前 decision provider 已按该口径修正并通过真实链路验证

### 本轮明确排除
- 不是 `.env` 未加载
- 不是 key 未读取
- 不是 provider 协议仍接错
- 不是“最终对象为空就等于无正文”

### 当前仍不在本轮范围内
- decision prompt / 输入契约优化
- 棋力与体验专项
- 长时间 burn-in
- 完整 provider / secret 平台化治理

---

## 7. 可直接复用的经验结论
1. `codex.hiyo.top` 在 `Responses API` 下，非流式最终 response 可能 `completed` 但为空
2. 正文可经 streaming `response.output_text.delta` 返回
3. 若客户端只依赖 `response.output` / `output_text`，会误判为“空 response”
4. 当前有效修正方案是：先累积 delta，再解析 JSON / 正文
