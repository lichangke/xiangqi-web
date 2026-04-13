# SDD 状态卡（sdd-status）

## 文档头信息
- 文档名称：sdd-status
- 当前状态：有效
- 所属阶段：状态总览
- 所属项目：象棋网页版项目（暂定）
- 所属功能 / 子功能：Implement / Task Bundle D-2.7（网页实测 burn-in / 运行口径锁定）
- 上游文档：docs/需求分析结论.md
- 创建时间：2026-03-26
- 最后更新时间：2026-04-13

## 1. 当前阶段
- 当前阶段：Review（Task Bundle D-2.7 review 草稿已形成，等待确认是否收口）
- 当前阶段状态：Task Bundle D-2.6 已完成 execution-contract、implement、review、稳定快照与网页实测排障补记，当前轮次已收口；Task Bundle D-2.7 已完成入口文档落盘、execution-contract 收口、3 条 burn-in 样本补齐，并已形成 review 草稿。当前下一步不是继续盲目补实现，而是判断是否接受“当前边界内通过、后续仍可增强外部访问样本”的 review 口径。

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
- 备注：已完成 D-2.7 execution-contract 收口，可作为当前轮 implement 的权威执行入口

### docs/Task Bundle D-2.7 实现交接.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：已作为 D-2.7 当前轮权威交接输入，与 execution-contract 对齐，承载“网页实测 burn-in / 运行口径锁定”的问题切片

### docs/Task Bundle D-2.6 实现交接.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：已与 D-2.6 当前轮 execution-contract 对齐，承载上一轮问题切片与交接边界

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
- 状态：已创建（草案中）
- 是否已确认：否
- 备注：当前已切换并承载 D-2.7 的结构化 review 草稿，待用户确认后再正式收口

## 3. 当前中断点
### 上次停在什么位置
D-2.6 已完成 execution-contract 收口、五刀 implement 推进、两条真实 provider 观察样本、review 回写、稳定快照 commit / push，以及网页实测排障补记。随后 D-2.7 已完成入口文档落盘、execution-contract 收口、3 条 burn-in 样本补齐，并已形成 D-2.7 review 草稿。

### 为什么停下
当前并不是缺实现或缺最小 burn-in 证据，而是已经进入 D-2.7 review 草稿阶段。也就是说，当前未决问题从“怎么继续补样本”切换为“是否接受当前边界内通过的 review 口径，以及是否继续把增强项留到后续轮次”。

### 恢复时应先处理什么
恢复时不要再回退讨论：
- `codex.hiyo.top` 应该走哪种协议
- 当前 provider 是否真的能命中
- 当前最终 completed response 为什么为空
- D-2.6 的 contract / implement / review / 稳定快照是否已形成

这些问题已经收口。恢复时应直接从以下顺序继续：
1. 先看本状态卡与 `review.md`
2. 判断是否接受当前 D-2.7 review 草稿口径
3. 若接受，再回写为已确认并处理稳定快照；若不接受，再明确还要补哪类增强样本

## 4. 下一步唯一推荐动作
当前 D-2.7 的下一步唯一推荐动作是：
1. 审看并确认 D-2.7 review 草稿口径
2. 若接受“当前边界内通过 / 外部访问样本可作为后续增强项”，则将 `review.md` 回写为已确认
3. 随后检查工作树并决定是否形成稳定快照

## 5. 当前阻塞 / 未决问题
- 当前没有阻塞 D-2.7 进入 implement 的前置问题
- 当前不再把以下问题视为未决：
  - provider 协议类型
  - `.env` 是否加载
  - key 是否读取
  - `responses` 最终对象为空是否等于无正文
  - D-2.6 execution-contract 是否已确认
  - D-2.6 implement / review 是否已形成
  - D-2.6 稳定快照是否已提交并推送
  - D-2.7 是否已具备进入 implement 的 handoff 条件
- 当前真正待完成的是：
  - D-2.7 连续网页对局 burn-in 样本
  - decision / narrative 成功日志与网页体验的联合观察证据
  - 是否存在值得拆出下一轮的新问题

## 6. 最近执行痕迹摘要
- [2026-04-11] 已修正 server `.env` 加载顺序：优先读取项目内 `.env`
- [2026-04-11] 已确认 `codex.hiyo.top` 当前不应继续按 `chat/completions` 接入，而应按 `Responses API` 接入
- [2026-04-11] 已完成 `responses` 最小矩阵试探，确认：非流式最终对象为空，流式 `response.output_text.delta` 存在正文
- [2026-04-11] 已修改 `DecisionProviderService`，新增 `responses` 分支并改为流式 SSE delta 读取正文
- [2026-04-11] 已补 decision 相关集成测试并通过，构建通过
- [2026-04-11] 已在真实主链路验证中确认 `bundle-d24-decision-provider-success`，当前样本参数为：`gpt-5.4 + https://codex.hiyo.top/v1 + responses`
- [2026-04-11] 已补 D-2.5 smoke 记录、review 回写与状态卡回写
- [2026-04-12] 已完成 D-2.6 execution-contract 与实现交接入口收口，并回写为“已确认”
- [2026-04-12] 已启动 D-2.6 implement 第一刀：在 `decision-provider-service.ts` 中显式固化 `inputContract / reasonConstraints / legalMoveCount`，并新增 provider reason 清洗；在 `standard-ai-decision.ts` 中新增 `situationShift` 兜底归一逻辑；最小验证已通过：`npm run build --workspace @xiangqi-web/server` 通过，`vitest` 定向 4 项通过（provider 合法步 / generic reason 兜底 / provider 非法步 fallback / 非法用户步保护）
- [2026-04-12] 已完成 D-2.6 implement 第二刀：进一步把 decision 输入组织升级为结构化 payload（新增 `requiredReadOrder`、`positionState`、`difficultyGuide`、`legalMoveDigest`），并新增“请求体级”集成测试，验证实际发给 provider 的 body 已包含上述结构；最小验证已通过：server build 通过，定向 vitest 5 项通过
- [2026-04-12] 已完成 D-2.6 implement 第三刀：新增 `priorityCandidates` 与 `noiseControl`，把详细语义集中到最多 8 个优先候选步，同时将 `legalMoves` 降噪为仅 `from/to` 校验清单；reason 约束新增 `focusTags`，明确优先落在压迫 / 解围 / 抢位 / 换子 / 收束 / 稳阵 / 试探；最小验证继续通过：server build 通过，定向 vitest 5 项通过
- [2026-04-12] 已完成 D-2.6 implement 第四刀：补齐 `responses` 路径下的请求体级集成测试，确认 `codex.hiyo.top / responses` 口径下同样会发出结构化 decision payload；同时在 decision provider 成功/失败日志中新增 `payloadSummary`，可直接观察 contractVersion、requiredReadOrder、priorityCandidateCount、priorityCandidateTags 与 noiseControl；最小验证继续通过：server build 通过，定向 vitest 6 项通过
- [2026-04-12] 已完成 D-2.6 implement 第五刀：跑通一轮真实 provider 下的观察型 smoke。使用 `gpt-5.4 + https://codex.hiyo.top/v1 + responses` 在真实 `/api/games/:id/moves` 链路上得到 `statusCode = 200`，日志中出现 `bundle-d24-decision-provider-success`，且 `payloadSummary` 与 `responsesSummary` 均已按预期出现；当前真实样本中 AI 走子为 `b8b1`，输出 `situationShift = 换子施压并破坏对方侧翼。`，说明 D-2.6 的结构化 contract、噪音控制与 reason 聚焦约束已进入真实链路可观察状态
- [2026-04-12] 已补第 2 条真实 provider 观察样本：在相同 `gpt-5.4 + https://codex.hiyo.top/v1 + responses` 口径下，用户落子改为 `a1 -> a3`，真实 `/api/games/:id/moves` 仍返回 200，AI 应手仍为 `b8b1`，但 `situationShift` 更新为“先手换子，顺势压迫边线。”，说明当前输出在相近局面下能保持战术焦点一致、具体表述有差异
- [2026-04-12] 已完成 D-2.6 review 回写：当前边界内通过，下一步建议直接形成稳定快照，而不是继续追加 implement 切片
- [2026-04-12] 已完成 D-2.6 稳定快照提交与远端推送：commit `bd645fe / 收稳 D-2.6 decision 输入契约与真实观察型验证` 已推送到 `origin/main`，当前工作树已清空
- [2026-04-13] 已补网页实测排障结论：用户已通过实际页面操作与大模型后台 token 消耗确认 decision / narrative 两条链路都已实际调用大模型；同时确认本轮曾出现两类短暂问题：其一，后台 `decision / narrative` 配置曾偏离当前目标口径，导致网页实测当下没有稳定命中目标大模型；其二，客户端 / 管理端 / 服务端公网访问曾一度不可用，后续在服务恢复后重新可达
- [2026-04-13] 已完成下一轮入口切换：新建 `docs/Task Bundle D-2.7 实现交接.md`，将问题主轴正式切换为“网页实测 burn-in / 运行口径锁定”；同时已将 `execution-contract.md` 切换为 D-2.7 草案，当前进入 execution-contract 收口阶段
- [2026-04-13] 已完成 D-2.7 首轮运行口径锁定与本机可达性巡检：本地数据库中的 `decision / narrative` 当前均为 `gpt-5.4 + https://codex.hiyo.top/v1` 且 enabled=1；`GET /api/health` 返回正常；本机 `5173 / 5174` 可达；已据此确认 D-2.7 execution-contract 可进入 implement

## 7. 当前执行范围（Implement / Review 阶段重点填写）
### 当前正在执行
- 正在执行 D-2.7 implement：网页实测 burn-in / 运行口径锁定
- 当前状态：已完成首轮运行口径锁定与本机可达性巡检，正在等待补连续网页对局样本

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
- D-2.6 新一轮实现入口文档、execution-contract 收口与已确认回写完成
- D-2.6 implement 第一刀已落：decision 输入契约显式化、provider reason 清洗与 `situationShift` 兜底归一已完成，最小定向验证通过
- D-2.6 implement 第二刀已落：decision 请求体已升级为结构化 payload（`positionState / difficultyGuide / legalMoveDigest / requiredReadOrder`），请求体级集成测试已通过
- D-2.6 implement 第三刀已落：decision 请求体新增 `priorityCandidates / noiseControl / focusTags`，legalMoves 已降噪为校验清单，候选步语义集中到优先候选组，请求体级验证继续通过
- D-2.6 implement 第四刀已落：`responses` 路径请求体级验证已通过，provider 成功/失败日志已可直接观察 payloadSummary 与 responsesSummary
- D-2.6 implement 第五刀已落：真实 provider 下的观察型 smoke 已完成，当前已拿到一条真实 200 样本，能同时观察 `payloadSummary / responsesSummary / move / situationShift`
- D-2.6 已补第 2 条真实 provider 观察样本，当前共有 2 条真实 200 样本
- D-2.6 review 已形成：当前边界内通过，下一步建议进入稳定快照收口
- D-2.6 稳定快照已形成并推送：`bd645fe` 已推送到 `origin/main`，当前工作树干净
- D-2.7 入口文档已落盘：`docs/Task Bundle D-2.7 实现交接.md` 已创建
- D-2.7 execution-contract 已收口并确认：当前已可作为“网页实测 burn-in / 运行口径锁定”的执行入口
- D-2.7 burn-in 记录已创建：已完成首轮“运行口径锁定 + 本机可达性巡检”样本

### 当前未完成
- D-2.7 review 尚未确认
- 若要把“公网可达性稳定”写成更强结论，后续仍可补一条外部访问侧样本
- 当前 review、状态卡与 burn-in 记录已产生新的未提交改动；若要宣告本轮收口完成，仍需再形成稳定快照

### 当前验证情况
- D-2.5 已完成并收口
- D-2.6 已完成 execution-contract、implement、review 与稳定快照四段收口
- 当前最小验证通过：server build 通过；定向 vitest 6 项通过
- 当前真实观察样本已获得 2 条：均为 `gpt-5.4 + https://codex.hiyo.top/v1 + responses` 下 `/api/games/:id/moves` 返回 200，provider-success 成立，payloadSummary / responsesSummary 可见
- 当前已补网页实测验证：用户已实际测试并结合大模型后台 token 消耗确认，decision / narrative 两条链路都已实际调用大模型
- 当前 D-2.7 已新增首轮本机验证：数据库模型配置、健康检查与本机前端可达性均已符合当前目标口径
- 当前 D-2.7 已补齐 2 条更具体运行样本：
  - 样本 #2：真实对局 API 路径下，新建 smoke 用户、创建对局、提交首步后 AI 正常应手，decision 结构化输出完整
  - 样本 #3：基于真实 turn 数据调用 `/api/narrative/resolve`，返回 `source=provider / fallbackUsed=false`，narrative 结构完整且与 decision 焦点一致
- 当前 D-2.7 review 草稿已形成：当前边界内阶段性通过，外部访问侧样本可作为后续增强项

## 8. 当前实现执行状态
- 当前执行代理：主会话直接实现
- 当前执行模式：D-2.7 review 草稿中
- 当前会话策略：单任务隔离
- 当前 repo / cwd：xiangqi-web
- 当前轮次：项目启动 / Task Bundle D-2.7（review 草稿已形成）
- 当前 task bundle：Task Bundle D-2.7（网页实测 burn-in / 运行口径锁定）
- 当前执行状态：d2-7-review-drafting
- 最近一次执行结果：已完成 3 条 burn-in 样本与 D-2.7 review 草稿；当前待用户确认是否接受草稿口径并决定是否收口
- 当前会话是否仍可复用：是

## 9. 恢复提示
默认恢复顺序：
1. 先看本状态卡
2. 再看 `review.md`
3. 判断是否接受当前 D-2.7 review 草稿口径
4. 若接受，再回写为已确认并处理稳定快照
5. 不要再回退到“provider 是否能命中”的旧问题
