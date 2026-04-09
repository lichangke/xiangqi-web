# SDD 状态卡（sdd-status）

## 文档头信息
- 文档名称：sdd-status
- 当前状态：有效
- 所属阶段：状态总览
- 所属项目：象棋网页版项目（暂定）
- 所属功能 / 子功能：Review / Task Bundle D-2.4（decision 真实模型接入最小闭环）
- 上游文档：docs/需求分析结论.md
- 创建时间：2026-03-26
- 最后更新时间：2026-04-09

## 1. 当前阶段
- 当前阶段：Review（Task Bundle D-2.4 已完成实现、自动化验证、真实页面 smoke 与状态回写）
- 当前阶段状态：Task Bundle D-2.4 已完成 **decision 真实模型接入最小闭环**：server 侧新增 `DecisionProviderService`，`GameService` 在后台 `decision` 模型配置启用且 server env 中存在 `DECISION_API_KEY` 时，会优先尝试真实 provider 生成候选步；provider 成功返回合法步时进入当前 `DecisionResult` 主链路，未配置、空响应、schema 非法、超时、抛错或非法候选步时稳定回退到本地 `StandardAiDecisionEngine`。当前自动化验证已通过：`npm test` 33/33 通过、`npm run build` 通过；并已补做真实页面 smoke，确认后台配置页、用户页真实落子主链路成立，且页面层 provider 命中样本已确认。当前结论可作为新一轮稳定快照提交并同步远端。

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
- 备注：当前 D-2.4 作为 D-2 增量切片推进，沿用已确认 tasks 作为项目级任务背景

### execution-contract.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：D-2.4 执行协议已按本轮真实实现、验证结果完成回收，不再处于 handoff 等待态

### docs/Task Bundle D-2.4 实现交接.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：D-2.4 handoff 文档已被主会话按约定范围落地实现，并已补回收结论

### docs/Task Bundle D-2.4 真实页面 smoke 记录.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：已补记录后台配置页、用户页真实页面 smoke 与页面层 provider 命中确认结果

### review.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：D-2.4 review 已回写，当前承载本轮实现、验证、页面 smoke 与边界条件结论

### docs/Task Bundle D-2.3 真实页面人工联调记录.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：继续作为 D-2.3 页面层补充留痕保留，不承担 D-2.4 当前轮入口职责

## 3. 当前中断点
### 上次停在什么位置
主会话已完成 D-2.4 的代码实现、自动化验证与真实页面 smoke：`GameService` 已不再只依赖本地启发式决策，而是会先尝试 `DecisionProviderService`；provider 成功返回合法步时进入当前 decision 结果生成链路，失败时稳定 fallback 到本地 decision 引擎。最新补验收已确认页面层 provider 命中样本成立。

### 为什么停下
本轮最小闭环已经做实，且页面层验证已经从“主链路不崩”推进到“页面真实命中 provider 已确认”。此时需要做的是把 review / 状态文档回写完整，并以当前稳定快照提交、推送远端。

### 恢复时应先处理什么
若后续继续推进，不要再回退讨论“D-2.4 是否接上”或“页面层是否能命中 provider”。恢复时应按以下顺序处理：
1. 先看本状态卡与 `review.md`，确认 D-2.4 已完成的边界、页面 smoke 结果与保留条件项
2. 再决定是否新开下一轮，专项处理外部线上 provider 稳定命中、decision 输入契约或棋力体验问题
3. 不要回退重做本轮最小闭环与页面命中确认

## 4. 下一步唯一推荐动作
以当前稳定快照完成本轮远端同步后，下一步优先级建议为：
1. 若继续推进，单独切片处理“外部线上 provider 页面层稳定命中验证”
2. 再视情况处理 decision 输入契约、提示词与棋力体验，而不是把 D-2.4 重新描述成“只是顺手调一下 AI”

## 5. 当前阻塞 / 未决问题
- D-2.4 核心阻塞已解除；decision provider 最小闭环与页面层命中确认均已成立
- 当前仍保留但不阻断本轮回收的条件项：
  - 真实 API Key 仍以 server env 中 `DECISION_API_KEY` 作为最小承载位，不是完整 secret 持久化方案
  - 当前页面 smoke 为避免外部服务波动，使用本地 mock provider 验证“页面主链路是否能真实命中 provider”；这不等于外部线上 provider 长期稳定性已全部收口
  - 当前 decision prompt / 输入契约只满足“最小闭环可运行”，不等于后续棋力与智能感问题已经全部收口
- 当前仍明确不把以下内容混入本轮：
  - narrative 重做
  - 演绎文案质量专项优化
  - 完整 secret 持久化体系
  - 完整 provider / 连通性 / 并发治理平台
  - 搜索型棋力引擎化改造

## 6. 最近执行痕迹摘要
- [2026-04-08] 主会话提交 `0abe747`《统一 D-2.3 本地收口与远端待同步口径》并成功 push，远端 `main` 更新到 `0abe747`
- [2026-04-08] 主会话核查“对局 AI 智能不足”根因，确认当前 `GameService` 中对局 AI 决策仍走 `StandardAiDecisionEngine` 本地启发式打分，不消费后台 `decision` provider
- [2026-04-09] 用户确认不要把问题误当成“顺手修一下 AI 不聪明”，而要正式定义成新专项
- [2026-04-09] 主会话新建 `docs/Task Bundle D-2.4 实现交接.md` 并将 `execution-contract.md` 切换到 D-2.4
- [2026-04-09] 主会话完成 D-2.4 代码实现：新增 `apps/server/src/domain/ai/decision/decision-provider-service.ts`，`GameService` 接入 provider 编排，`StandardAiDecisionEngine` 补出 `buildDecisionFromMove()` 以复用现有 decision 结果结构，`config.ts` 增加 `DECISION_API_KEY` 读取
- [2026-04-09] 主会话补齐 D-2.4 集成测试：覆盖 provider 返回合法步命中与 provider 返回非法步 fallback 场景
- [2026-04-09] 主会话完成自动化回归：`npm test` 33/33 通过，`npm run build` 通过
- [2026-04-09] 主会话补做 `docs/Task Bundle D-2.4 真实页面 smoke 记录.md`，确认后台配置页与用户页真实页面主链路成立，且页面层 provider 命中样本已确认

## 7. 当前执行范围（Implement / Review 阶段重点填写）
### 当前正在执行
- 回写 D-2.4 页面 smoke 结果到 review / 状态文档，并以当前稳定快照提交与同步远端

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
- D-2.4 根因判断已完成：确认当前 decision 尚未真实接入模型的旧问题
- D-2.4 真实实现已完成：decision provider 承载位、合法性校验与 fallback 闭环已接入主链路
- D-2.4 自动化验证已完成：新增集成测试通过，全量测试与构建回归通过
- D-2.4 真实页面 smoke 已完成：页面主链路稳定，页面层 provider 命中样本已确认
- D-2.4 review / 状态回写已完成

### 当前未完成
- 外部线上 provider 的页面层长期稳定命中验证（不在本轮范围）
- decision 体验质量专项优化（不在本轮范围）
- 完整 secret 持久化与 provider 平台化能力（不在本轮范围）

### 当前验证情况
- D-2.4 已完成集成验证：
  - provider 返回合法步时，AI 最终采用 provider 结果并生成当前 decision 结构
  - provider 返回非法步时，系统稳定 fallback 到本地 decision 引擎，且 AI 最终落子仍合法
- D-2.4 已完成自动化回归：`npm test` 通过（33/33）、`npm run build` 通过
- D-2.4 已完成真实页面 smoke：
  - 后台配置页可正常保存 decision 配置
  - 用户页真实落子后，AI 可正常给出合法应手
  - 页面讨论区真实出现 provider 返回的 `reason`，说明页面层 provider 命中成立
- D-2.3 narrative 路由相关回归仍保持通过，说明本轮未破坏既有 narrative 最小闭环

## 8. 当前实现执行状态
- 当前执行代理：主会话直接实现
- 当前执行模式：主会话直推 / 当前处于 D-2.4 已实现已验证已补页面 smoke待同步状态
- 当前会话策略：单任务隔离
- 当前 repo / cwd：xiangqi-web
- 当前轮次：项目启动 / Task Bundle D-2.4
- 当前 task bundle：Task Bundle D-2.4（decision 真实模型接入最小闭环）
- 当前执行状态：d2-4-implemented-verified-smoke-confirmed-ready-sync
- 最近一次执行结果：D-2.4 decision 真实模型接入最小闭环已做实，真实页面 smoke 与页面层 provider 命中已确认，可直接作为新的稳定快照提交并推送
- 当前会话是否仍可复用：是（可继续承接 push 后的下一轮判断）

## 9. 恢复提示
默认恢复顺序：
1. 先看本状态卡
2. 再看 `review.md`
3. 再看 `docs/Task Bundle D-2.4 真实页面 smoke 记录.md`
4. 如需确认边界，再看 `execution-contract.md`
5. 不要再回退到“decision 是否真实接上”“页面层是否能命中 provider”这类已收口问题；如继续推进，应直接处理外部 provider 稳定性、provider 命中观测或下一轮体验专项
