# SDD 状态卡（sdd-status）

## 文档头信息
- 文档名称：sdd-status
- 当前状态：有效
- 所属阶段：状态总览
- 所属项目：象棋网页版项目（暂定）
- 所属功能 / 子功能：Plan / 演绎体验重构（角色驱动的话剧式连续演绎）
- 上游文档：docs/需求分析结论.md
- 创建时间：2026-03-26
- 最后更新时间：2026-04-13

## 1. 当前阶段
- 当前阶段：Plan（演绎体验重构增量规格已确认，实施方案草案已落盘）
- 当前阶段状态：Task Bundle D-2.6 已完成 execution-contract、implement、review、稳定快照与网页实测排障补记，当前轮次已收口；Task Bundle D-2.7 已完成入口文档落盘、execution-contract 收口、3 条 burn-in 样本补齐、review 回写、稳定快照提交与远端推送，当前轮次已收口；Task Bundle D-2.8 已完成 implement 阶段的外部访问侧样本 / 扩展 burn-in 取样，已完成 `review.md` 结论确认，且已形成稳定快照 `99151f8` 并推送远端；当前“演绎体验重构”增量规格已由用户明确确认，并已完成文档命名收口为 `docs/演绎体验重构增量规格.md`；当前已正式进入 Plan 阶段，并已落盘 `docs/演绎体验重构实施方案草案.md`。

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

### docs/演绎体验重构增量规格.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：已作为当前轮次的已确认增量规格输入，正式承载“角色驱动的话剧式连续演绎重构”

### docs/演绎体验重构实施方案草案.md
- 状态：已创建（草案中）
- 是否已确认：否
- 备注：已作为当前轮次 Plan 阶段主文档落盘，正在收口实现路径、模块划分与 MVP 路径

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
- 备注：当前仍保留为 D-2.8 Review / Acceptance 已确认版本，结论口径为“当前边界内有条件通过，当前轮次已收口”

### docs/Task Bundle D-2.7 实现交接.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：已作为上一轮历史交接输入保留，不再承载当前轮主结论

## 3. 当前中断点
### 上次停在什么位置
D-2.8 已完成 implement 阶段的外部访问侧样本与扩展 burn-in，已完成 review 确认，并已形成稳定快照 `99151f8` 且推送远端。在此基础上，已完成“演绎体验重构”增量规格的收口、用户确认与文档命名收口，并已正式进入 Plan 阶段。

### 为什么停下
当前不是卡在 D-2.8，也不是卡在增量规格定义，而是因为新一轮已经切入 Plan：当前需要继续把实施方案收清，形成足以进入 Tasks 的模块划分、实施路径与验证策略。

### 恢复时应先处理什么
恢复时不要再回退讨论：
- D-2.8 是否已经收口
- 演绎体验重构增量规格是否还能不能进 Plan
- provider 协议、env、API key、provider 是否命中
- 是否应先做更长时间 burn-in 或更多外部访问样本

这些问题当前都不再是下一步首要动作。恢复时应直接从以下顺序继续：
1. 先看本状态卡与 `docs/演绎体验重构实施方案草案.md`
2. 接受 `docs/演绎体验重构增量规格.md` 已确认这个事实基线
3. 继续收口 Plan 主文档
4. 先完成 Plan，再决定是否进入 Tasks

## 4. 下一步唯一推荐动作
当前唯一推荐动作是：
1. 继续收口 `docs/演绎体验重构实施方案草案.md`
2. 优先把模块划分、MVP 路径、旧文档重审范围与验证策略收清
3. 在 Plan 未确认前，不进入新的 tasks / execution-contract

## 5. 当前阻塞 / 未决问题
- 当前没有阻塞 D-2.8 收口或增量规格确认的前置问题
- 当前不再把以下问题视为未决：
  - provider 协议类型
  - `.env` 是否加载
  - key 是否读取
  - `responses` 最终对象为空是否等于无正文
  - D-2.6 / D-2.7 execution-contract 是否已确认
  - D-2.6 / D-2.7 implement / review / 稳定快照是否已形成
  - D-2.8 narrative 扩展样本 500 是否等于主链路天然失效
  - D-2.8 是否仍缺 review / snapshot / push
  - 是否应先继续补更强外部访问样本 / 更长时间 burn-in
  - 演绎体验重构增量规格是否已确认
- 当前真正待回答的是：
  - 何时由用户正式确认 `docs/演绎体验重构实施方案草案.md` 可进入 Tasks
  - 旧的 Task Bundle C 演绎契约、剧情线程摘要与成本策略文档在 Tasks / execution-contract 阶段应如何重审 / supersede

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
- [2026-04-13] 已根据最新用户体验反馈确认：当前最优先增量问题已切换为“演绎体验重构”，而不是继续做外部访问增强验证
- [2026-04-13] 已创建新的增量入口文档：`docs/演绎体验重构增量规格草案.md`
- [2026-04-13] 已继续把“普通回合新可见结构 / 简评共识落子的去留 / 角色个性强度 / 连续戏感机制”收成带明确推荐口径的增量规格草案
- [2026-04-13] 已进一步收掉剩余主要阻断点：补齐了普通回合对白与场记关系、特殊事件结构、移动端弱事实层表现、显示长度策略，并正式写入“演绎生成成本上限可以设得很高”的规格口径
- [2026-04-13] 已完成 `docs/演绎体验重构增量规格.md` 的确认回写与文档命名收口
- [2026-04-13] 已正式进入 Plan 阶段，并创建 `docs/演绎体验重构实施方案草案.md`
- [2026-04-13] 已继续把 Plan 收成更贴近真实代码承载点的版本：补齐 server / web / shared 当前锚点、迁移策略、推荐切片顺序与验证命令
- [2026-04-13] 已继续专门收口 `StoryState` 更新规则、provider 参数档位映射与更贴近执行的任务拆分颗粒度；当前 Plan 已基本具备进入 Tasks 的条件

## 7. 当前执行范围（Implement / Review 阶段重点填写）
### 当前正在执行
- 当前正在执行：Plan 收口（`docs/演绎体验重构实施方案草案.md`）
- 当前状态：已从 new-specify-draft-open 切换为 plan-draft-open

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
- 已完成“演绎体验重构”增量问题的入口落盘：`docs/演绎体验重构增量规格.md`
- 已完成 `docs/演绎体验重构增量规格.md` 的已确认回写与文档命名收口
- 已完成 `docs/演绎体验重构实施方案草案.md` 落盘

### 当前未完成
- `docs/演绎体验重构实施方案草案.md` 仍处于草案阶段，尚未确认进入 Tasks
- 旧的 Task Bundle C 演绎契约、剧情线程摘要与成本策略文档在 Tasks / execution-contract 阶段的重审 / supersede 范围仍待正式回写

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
- 当前新一轮尚处于 Plan 草案收口阶段，尚无实现层验证动作，验证重点已切换为“实施方案是否足以支撑后续 Tasks”
- 当前已确认增量规格输入：`docs/演绎体验重构增量规格.md`
- 当前已落盘 Plan 主文档：`docs/演绎体验重构实施方案草案.md`
- 当前 Plan 已补齐真实代码锚点：`apps/server/src/domain/ai/narrative/narrative-service.ts`、`apps/server/src/domain/ai/narrative/narrative-fallback.ts`、`apps/web/src/presentation.ts`、`packages/shared/src/index.ts`
- 当前 Plan 已补齐：`StoryState` 更新规则、provider 参数映射方向、以及更贴近执行的 Task Group P-1 ~ P-5 拆分建议

## 8. 当前实现执行状态
- 当前执行代理：主会话直接编排
- 当前执行模式：plan-draft-open
- 当前会话策略：单问题切片
- 当前 repo / cwd：xiangqi-web
- 当前轮次：演绎体验重构增量 Plan
- 当前 task bundle：未进入新的 task bundle / execution-contract
- 当前执行状态：plan-draft-open-waiting-refinement
- 最近一次执行结果：已将 `docs/演绎体验重构实施方案草案.md` 推进到“基本具备进入 Tasks 条件”的状态；当前等待用户确认是否正式进入 Tasks
- 当前会话是否仍可复用：是

## 9. 恢复提示
默认恢复顺序：
1. 先看本状态卡
2. 再看 `docs/演绎体验重构实施方案草案.md`
3. 接受 `docs/演绎体验重构增量规格.md` 已确认、当前已进入 Plan 的事实基线
4. 继续收口实施方案
5. 不要再回退到“能不能进 Plan”“provider 是否命中”“D-2.8 是否还缺 snapshot”或“是否先继续补外部访问样本”的旧问题
