# SDD 状态卡（sdd-status）

## 文档头信息
- 文档名称：sdd-status
- 当前状态：有效
- 所属阶段：状态总览
- 所属项目：象棋网页版项目（暂定）
- 所属功能 / 子功能：Review / Task Bundle D-2.8（外部访问侧样本 / 扩展 burn-in）
- 上游文档：docs/需求分析结论.md
- 创建时间：2026-03-26
- 最后更新时间：2026-04-13

## 1. 当前阶段
- 当前阶段：Review（Task Bundle D-2.8 已确认收口，下一轮未开启）
- 当前阶段状态：Task Bundle D-2.6 已完成 execution-contract、implement、review、稳定快照与网页实测排障补记，当前轮次已收口；Task Bundle D-2.7 已完成入口文档落盘、execution-contract 收口、3 条 burn-in 样本补齐、review 回写、稳定快照提交与远端推送，当前轮次已收口；Task Bundle D-2.8 已完成 implement 阶段的外部访问侧样本 / 扩展 burn-in 取样，已完成 `review.md` 结论确认，且已形成稳定快照 `99151f8` 并推送远端；当前轮次已正式收口，若继续推进应先做下一轮入口判断。

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
- 备注：当前 D-2 系列作为增量切片推进，沿用已确认 tasks 作为项目级任务背景

### execution-contract.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：D-2.8 execution-contract 仍保留为本轮已完成实现边界的权威依据

### docs/Task Bundle D-2.8 实现交接.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：已作为 D-2.8 当前轮权威交接输入保留，承载“外部访问侧样本 / 扩展 burn-in”的问题切片

### docs/Task Bundle D-2.8 burn-in 记录.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：已承载 D-2.8 的外部访问侧样本、decision 扩展样本、narrative 扩展样本与异常定性记录，并已成为本轮 review 的确认依据

### review.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：当前已切换为 D-2.8 Review / Acceptance 已确认版本，结论口径为“当前边界内有条件通过，当前轮次已收口”

### docs/Task Bundle D-2.7 实现交接.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：已作为上一轮历史交接输入保留，不再承载当前轮主结论

## 3. 当前中断点
### 上次停在什么位置
D-2.8 已完成 implement 阶段的外部访问侧样本与扩展 burn-in，已完成 review 确认，并已形成稳定快照 `99151f8` 且推送远端。当前轮次已正式收口。

### 为什么停下
当前不是因为证据不足，也不是因为 review 口径未定，而是因为 D-2.8 已完成当前边界内的验证、review、稳定快照与远端推送。按照 SDD 规则，当前应先把轮次状态明确记为“已收口”，再决定是否开启下一轮增强项，而不是继续在已收口轮次内滚动补样本。

### 恢复时应先处理什么
恢复时不要再回退讨论：
- provider 协议、env、API key、provider 是否命中
- D-2.7 是否已经收口
- D-2.8 的 500 是否等于 narrative 主链路天然失效
- D-2.8 是否还需要继续补本轮收口证据

这些问题已经收口。恢复时应直接从以下顺序继续：
1. 先看本状态卡与 `review.md`
2. 接受 D-2.8 已正式收口这个事实基线
3. 再判断下一轮是否需要单独开启“更强外部访问样本 / 更长时间 burn-in”增强项
4. 若要继续推进，再为下一轮建立新的入口文档或 execution-contract

## 4. 下一步唯一推荐动作
当前唯一推荐动作是：
1. 做下一轮入口判断
2. 先判断是否把“不同设备 / 不同网络条件外部访问样本 + 更长时间 burn-in”单独收成一轮新增强项
3. 在未形成新入口前，不继续在 D-2.8 内滚动补样本

## 5. 当前阻塞 / 未决问题
- 当前没有阻塞 D-2.8 收口的前置问题
- 当前不再把以下问题视为未决：
  - provider 协议类型
  - `.env` 是否加载
  - key 是否读取
  - `responses` 最终对象为空是否等于无正文
  - D-2.6 / D-2.7 execution-contract 是否已确认
  - D-2.6 / D-2.7 implement / review / 稳定快照是否已形成
  - D-2.8 narrative 扩展样本 500 是否等于主链路天然失效
  - D-2.8 是否仍缺 review / snapshot / push
- 当前真正待回答的是：
  - 是否需要开启下一轮增强项
  - 下一轮若开启，应以“更强外部访问样本”为主，还是与“更长时间 burn-in / 更多 narrative 事件类型观察”合并
  - 下一轮应该采用多大边界，避免把增强项再次无限滚入当前轮

## 6. 最近执行痕迹摘要
- [2026-04-11] 已修正 server `.env` 加载顺序：优先读取项目内 `.env`
- [2026-04-11] 已确认 `codex.hiyo.top` 当前不应继续按 `chat/completions` 接入，而应按 `Responses API` 接入
- [2026-04-11] 已完成 `responses` 最小矩阵试探，确认：非流式最终对象为空，流式 `response.output_text.delta` 存在正文
- [2026-04-11] 已修改 `DecisionProviderService`，新增 `responses` 分支并改为流式 SSE delta 读取正文
- [2026-04-11] 已补 decision 相关集成测试并通过，构建通过
- [2026-04-11] 已在真实主链路验证中确认 `bundle-d24-decision-provider-success`，当前样本参数为：`gpt-5.4 + https://codex.hiyo.top/v1 + responses`
- [2026-04-12] 已完成 D-2.6 review 回写与稳定快照提交
- [2026-04-13] 已完成 D-2.7 运行口径锁定、3 条 burn-in 样本、review 收口与远端推送
- [2026-04-13] 已完成 D-2.8 下一轮入口判断：确认后续最推荐动作是“外部访问侧样本 / 扩展 burn-in”
- [2026-04-13] 已完成 D-2.8 入口文档与 execution-contract 落盘
- [2026-04-13] 已完成 D-2.8 外部访问侧样本、多回合 decision 样本、多回合 narrative 样本与 narrative 500 异常定性
- [2026-04-13] 已完成 D-2.8 review 确认、稳定快照 `99151f8` 与远端推送

## 7. 当前执行范围（Implement / Review 阶段重点填写）
### 当前正在执行
- 当前无正在执行中的 D-2.8 implement / review 子任务
- 当前状态：D-2.8 已收口，当前等待下一轮入口判断

### 当前已完成
- 项目启动与需求讨论的第一轮收口
- `spec.md` / `plan.md` / `tasks.md` 第一轮落盘与确认
- Task Bundle A 完成并回收
- Task Bundle B 完成并回收
- Task Bundle C 完成、review 收口并推送
- Task Bundle D-1 ~ D-2.7 各轮收口与推送
- D-2.8 下一轮入口判断已完成
- D-2.8 入口文档与 execution-contract 已落盘并确认
- D-2.8 已补第一条外部访问侧样本：使用 `10.3.0.3` 访问 `5173 / 5174 / 3000/api/health` 均成功
- D-2.8 已补第二条外部访问侧样本：通过 `10.3.0.3:3000` 完成 admin 登录，并成功调用 `model-configs / audit-summary`
- D-2.8 已补多回合 decision 扩展 burn-in：`MASTER` 对局下连续两回合返回 200，decision 结构化输出持续完整
- D-2.8 已完成 narrative 扩展样本定性：
  - 手工简化 envelope 下出现 `500 / INTERNAL_ERROR`
  - 按真实前端 `buildTurnEnvelope` 形状补齐字段后，`/api/narrative/resolve` 返回 `200 / source=provider / fallbackUsed=false`
- D-2.8 已补多回合 narrative 扩展样本：同一局第 1 / 2 回合 narrative 均返回 `200 / source=provider / fallbackUsed=false`
- D-2.8 review 已确认：当前结论为“当前边界内有条件通过”
- D-2.8 已形成稳定快照并推送远端：`99151f8 / 收口 D-2.8 burn-in 与 review 确认`

### 当前未完成
- 下一轮增强项尚未立项
- 若要把“外部访问稳定性”写成更强结论，后续仍可继续补不同设备 / 不同网络条件样本
- 更长时间、多样本 burn-in 与更多 narrative 事件类型观察尚未纳入新一轮边界

### 当前验证情况
- D-2.6 / D-2.7 已分别完成对应验证与收口
- 当前 D-2.8 已新增两条外部访问侧样本：
  - `10.3.0.3:5173 / 5174 / 3000/api/health` 均返回正常
  - `10.3.0.3:3000` 下的 admin 登录、`model-configs`、`audit-summary` 均返回正常
- 当前 D-2.8 已新增多回合 decision 扩展 burn-in：`MASTER` 对局下连续两回合返回 200，decision 结构化输出持续存在
- 当前 D-2.8 已完成 narrative 扩展样本复现与修正重放：
  - 简化 envelope 下返回 `500 / INTERNAL_ERROR`
  - 按真实前端 envelope 重放后返回 `200 / source=provider / fallbackUsed=false`
- 当前 D-2.8 已新增多回合 narrative 扩展样本：第 1 / 2 回合均返回 `200 / source=provider / fallbackUsed=false`
- 当前 D-2.8 的最新判断：外部访问、decision 扩展 burn-in、narrative 多回合样本当前继续成立；当前轮次已按“有条件通过”口径正式收口

## 8. 当前实现执行状态
- 当前执行代理：主会话直接实现
- 当前执行模式：D-2.8 closed / next-entry pending
- 当前会话策略：单任务隔离
- 当前 repo / cwd：xiangqi-web
- 当前轮次：项目启动 / Task Bundle D-2.8（外部访问侧样本 / 扩展 burn-in）
- 当前 task bundle：Task Bundle D-2.8（外部访问侧样本 / 扩展 burn-in）
- 当前执行状态：d2-8-closed-waiting-next-entry
- 最近一次执行结果：已完成 D-2.8 review 确认、稳定快照 `99151f8` 与远端推送；当前等待下一轮入口判断
- 当前会话是否仍可复用：是

## 9. 恢复提示
默认恢复顺序：
1. 先看本状态卡
2. 再看 `review.md`
3. 直接接受 D-2.8 已收口这个事实基线
4. 再做下一轮入口判断
5. 不要再回退到“provider 是否命中”或“D-2.8 是否还缺 snapshot”的旧问题
