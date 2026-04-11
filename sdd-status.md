# SDD 状态卡（sdd-status）

## 文档头信息
- 文档名称：sdd-status
- 当前状态：有效
- 所属阶段：状态总览
- 所属项目：象棋网页版项目（暂定）
- 所属功能 / 子功能：Review / Task Bundle D-2.5（外部线上 provider 页面层稳定命中验证）
- 上游文档：docs/需求分析结论.md
- 创建时间：2026-03-26
- 最后更新时间：2026-04-11

## 1. 当前阶段
- 当前阶段：Review / Acceptance（Task Bundle D-2.5 已完成验证与结果回收）
- 当前阶段状态：Task Bundle D-2.5 已完成实现、真实验证、review 回写与状态收口。当前新结论是：**外部线上 provider 页面层稳定命中问题已收口；`codex.hiyo.top` 当前应按 `Responses API + streaming delta` 口径接入，且页面真实主链路 provider-success 已确认成立。**

## 2. 各核心文档状态
### spec.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：当前仍作为项目级权威规格输入

### plan.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：当前仍作为项目级方案输入

### tasks.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：当前 D-2.5 作为 D-2 增量切片推进，沿用已确认 tasks 作为项目级任务背景

### execution-contract.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：D-2.5 执行协议已完成其服务周期，并已按当前结果回写为收口状态；若继续推进下一轮，应新建新的入口文档与 contract，而不是继续停留在 D-2.5 语义

### docs/Task Bundle D-2.5 实现交接.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：D-2.5 当前轮交接文档已完成结果回写，不再处于草案中

### docs/Task Bundle D-2.5 真实页面 smoke 记录.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：已补本轮真实 provider 验证证据与兼容特征说明

### docs/Task Bundle D-2.4 实现交接.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：继续作为 D-2.4 实现约束与完成定义留痕保留

### docs/Task Bundle D-2.4 真实页面 smoke 记录.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：继续作为 D-2.4 页面层命中确认记录保留，为 D-2.5 提供上游事实依据

### review.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：当前已切换并承载 D-2.5 的结构化 review 结论

## 3. 当前中断点
### 上次停在什么位置
D-2.5 已完成从协议判断、最小矩阵试探、streaming delta 正文提取兼容，到真实主链路 provider-success 样本确认的完整闭环，并已完成文档回写。

### 为什么停下
当前已经不适合继续把问题停留在“provider 到底能不能命中”的验证上。真正未决的问题已切换为：
1. 是否进入 decision 输入契约 / prompt / 体验优化新一轮
2. 是否需要补更多真实样本做 burn-in，而不是继续争论当前链路是否成立

### 恢复时应先处理什么
恢复时不要再回退讨论：
- `codex.hiyo.top` 应该走哪种协议
- 当前 provider 是否真的能命中
- 当前最终 completed response 为什么为空

这些问题已经收口。恢复时应直接从以下顺序继续：
1. 判断下一轮是否切到 decision 输入契约 / prompt / 体验优化
2. 若需要长期稳定性论证，再定义新的 burn-in / 多样本验证切片
3. 更新新的 execution-contract，而不是继续停留在 D-2.5 语义下

## 4. 下一步唯一推荐动作
不要继续停留在 D-2.5。下一步应直接判断并收清：
1. 是否开启“decision 输入契约 / prompt / 体验优化”新一轮
2. 若开启，先新建对应执行入口文档与 execution-contract
3. 若暂不开启优化，而只想继续验证稳定性，则单独定义新的 burn-in 验证切片，不与当前 D-2.5 混写

## 5. 当前阻塞 / 未决问题
- D-2.5 本身的阻塞已解除
- 当前不再把以下问题视为本轮未决：
  - provider 协议类型
  - `.env` 是否加载
  - key 是否读取
  - `responses` 最终对象为空是否等于无正文
- 当前真正未决的是：
  - 下一轮问题切片如何定义
  - 是否优先做 decision 输入契约 / prompt / 体验优化
  - 是否需要更长时间、多样本的稳定性 burn-in

## 6. 最近执行痕迹摘要
- [2026-04-11] 已修正 server `.env` 加载顺序：优先读取项目内 `.env`
- [2026-04-11] 已确认 `codex.hiyo.top` 当前不应继续按 `chat/completions` 接入，而应按 `Responses API` 接入
- [2026-04-11] 已完成 `responses` 最小矩阵试探，确认：非流式最终对象为空，流式 `response.output_text.delta` 存在正文
- [2026-04-11] 已修改 `DecisionProviderService`，新增 `responses` 分支并改为流式 SSE delta 读取
- [2026-04-11] 已补 decision 相关集成测试并通过，构建通过
- [2026-04-11] 已在真实主链路验证中确认 `bundle-d24-decision-provider-success`，当前样本参数为：`gpt-5.4 + https://codex.hiyo.top/v1 + responses`
- [2026-04-11] 已补 D-2.5 smoke 记录、review 回写与状态卡回写

## 7. 当前执行范围（Implement / Review 阶段重点填写）
### 当前正在执行
- 当前轮 D-2.5 已收口，暂未进入新一轮 Implement

### 当前已完成
- 项目启动与需求讨论的第一轮收口
- `spec.md` / `plan.md` / `tasks.md` 第一轮落盘与确认
- Task Bundle A 完成并回收
- Task Bundle B 完成并回收
- Task Bundle C 完成、review 收口并推送
- Task Bundle D-1 review 收口与稳定快照形成
- Task Bundle D-2.1 review 收口、稳定快照形成并推送
- Task Bundle D-2.2 review 收口、稳定快照形成并推送
- Task Bundle D-2.3 执行协议、实现交接、代码实现、review 回写、页面补记与远端同步完成
- D-2.3 narrative provider 最小闭环已成立
- D-2.4 根因判断、真实实现、自动化验证、页面 smoke、review 回写与远端同步完成
- D-2.4 页面层 provider 命中样本已确认成立
- D-2.5 外部线上 provider 页面层稳定命中验证完成，provider-success 已确认成立

### 当前未完成
- 下一轮新的问题切片定义
- decision 输入契约 / prompt / 体验优化（若决定继续）
- 长时间 burn-in（若决定单独继续）

### 当前验证情况
- D-2.5 已完成：
  - 协议归因
  - 矩阵试探
  - 流式 delta 正文提取兼容
  - 真实主链路 provider-success
  - review / smoke / status 回写

## 8. 当前实现执行状态
- 当前执行代理：主会话直接实现
- 当前执行模式：主会话直推 / 当前处于 D-2.5 review 收口完成状态
- 当前会话策略：单任务隔离
- 当前 repo / cwd：xiangqi-web
- 当前轮次：项目启动 / Task Bundle D-2.5（已收口）
- 当前 task bundle：Task Bundle D-2.5（外部线上 provider 页面层稳定命中验证）
- 当前执行状态：d2-5-reviewed-and-closed
- 最近一次执行结果：D-2.5 已通过并回写完成
- 当前会话是否仍可复用：是（但若继续推进，建议切换到下一轮新边界）

## 9. 恢复提示
默认恢复顺序：
1. 先看本状态卡
2. 再看 `review.md`
3. 再看 `docs/Task Bundle D-2.5 真实页面 smoke 记录.md`
4. 若准备进入下一轮，再新建对应入口文档与 execution-contract
5. 不要再回退到“provider 是否能命中”的旧问题
