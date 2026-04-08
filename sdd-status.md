# SDD 状态卡（sdd-status）

## 文档头信息
- 文档名称：sdd-status
- 当前状态：有效
- 所属阶段：状态总览
- 所属项目：象棋网页版项目（暂定）
- 所属功能 / 子功能：Execution Contract / Task Bundle D-2.4（decision 真实模型接入最小闭环）
- 上游文档：docs/需求分析结论.md
- 创建时间：2026-03-26
- 最后更新时间：2026-04-09

## 1. 当前阶段
- 当前阶段：Execution Contract（Task Bundle D-2.4 已定义并允许进入 Implement）
- 当前阶段状态：Task Bundle D-2.3 已完成实现结果回收、review 回写、稳定快照提交与远端同步，远端 `origin/main` 最新提交为 `0abe747`。当前新结论是：**真实 narrative 模型接入最小闭环已成立；而“对局 AI 智能不足”的根因已通过代码核查明确为 decision 链路尚未真实接入模型，当前仍走本地启发式决策。因此下一步已正式切换为 D-2.4：decision 真实模型接入最小闭环。**

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
- 状态：已创建（草案中）
- 是否已确认：否
- 备注：当前执行协议已切换为 Task Bundle D-2.4（decision 真实模型接入最小闭环），待确认后进入实现

### docs/Task Bundle D-2.4 实现交接.md
- 状态：已创建（草案中）
- 是否已确认：否
- 备注：D-2.4 handoff 文档已落盘，已明确本轮范围、完成定义与验证方向

### review.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：当前仍承载 Task Bundle D-2.3 的结构化 review 结论；待 D-2.4 完成后再切到新一轮 review

### docs/Task Bundle D-2.3 真实页面人工联调记录.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：当前作为 D-2.3 页面层补充验收留痕保留，不承担 D-2.4 入口文档职责

## 3. 当前中断点
### 上次停在什么位置
主会话已完成 D-2.3 narrative 真实接入最小闭环的实现、验证、review 回写与远端同步；随后基于真实页面补测，专项核查“对局 AI 智能不足”的根因，已确认当前对局主链路实际仍走 `GameService -> StandardAiDecisionEngine` 的本地启发式 decision，而不是后台 `decision` 模型 provider。

### 为什么停下
当前已经不适合继续把问题描述成“再调一调 AI 智能感”或“顺手改几个提示词”。真正需要推进的是一个新的最小闭环：
1. 让 `decision` 模型真实进入对局 AI 决策主链路
2. 同时保持规则合法性校验与本地 fallback 不退化

### 恢复时应先处理什么
恢复时不要再回退讨论“D-2.3 是否成立”“narrative 是否接上”这类旧问题；应直接从以下顺序继续：
1. 先确认 `execution-contract.md` 与 `docs/Task Bundle D-2.4 实现交接.md` 已满足 handoff 条件
2. 再实现 `decision` 真实模型接入最小闭环
3. 最后做合法性校验、fallback、自动化验证与真实页面最小 smoke

## 4. 下一步唯一推荐动作
确认 D-2.4 执行协议后，直接进入实现：
1. 为 decision 增加 server 侧真实模型承载位
2. 让后台 `decision` model config + server env API Key 构成最小运行前提
3. 对模型输出先做规则合法性校验
4. 失败时退回当前本地 decision 引擎

## 5. 当前阻塞 / 未决问题
- D-2.3 级别阻塞已解除；narrative provider 最小闭环已成立并已推送远端
- 当前真正未决的是 D-2.4：
  - `decision` provider 调用入口应落在何处，才能不破坏当前 `GameService` 主链路
  - 模型输出采用什么最小 schema，才能稳定映射到合法候选步
  - 当模型输出非法步、空结果、超时或 schema 非法时，如何无缝退回本地 decision 引擎
- 当前明确不把以下内容混入本轮：
  - 演绎文案质量专项优化
  - narrative 重做
  - 完整 secret 持久化体系
  - 完整 provider / 连通性 / 并发治理平台

## 6. 最近执行痕迹摘要
- [2026-04-04] 主会话完成 D-2.2 review 收口并形成稳定快照，提交 `68f024b`
- [2026-04-04] 用户确认按建议直接进入 D-2.3
- [2026-04-04 ~ 2026-04-08] 主会话完成 D-2.3 narrative 真实模型接入最小闭环实现、SSE 解析回归、review 回写与页面层补充联调记录
- [2026-04-08] 主会话提交 `998cdd9`《收稳 D-2.3 最新联调状态与 SSE 解析回归》
- [2026-04-08] 主会话提交 `0abe747`《统一 D-2.3 本地收口与远端待同步口径》并成功 push，远端 `main` 更新到 `0abe747`
- [2026-04-08] 主会话核查“对局 AI 智能不足”根因，确认当前 `GameService` 中对局 AI 决策仍走 `StandardAiDecisionEngine` 本地启发式打分，不消费后台 `decision` provider
- [2026-04-09] 用户确认不要把问题误当成“顺手修一下 AI 不聪明”，而要正式定义成新专项
- [2026-04-09] 主会话已新建 `docs/Task Bundle D-2.4 实现交接.md`，并将 `execution-contract.md` 切换到 D-2.4 草案入口

## 7. 当前执行范围（Implement / Review 阶段重点填写）
### 当前正在执行
- 定义并收口 D-2.4 / decision 真实模型接入最小闭环的当前轮入口文档

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
- D-2.4 根因判断已完成：当前 decision 尚未真实接入模型，仍走本地启发式链路

### 当前未完成
- D-2.4 执行协议确认
- D-2.4 真实实现
- D-2.4 自动化验证与页面 smoke
- D-2.4 review 回写

### 当前验证情况
- D-2.3 已完成自动化验证：`npm test` 通过（31/31）、`npm run build` 通过
- D-2.3 已完成 route 级 provider 回归验证：`/api/narrative/resolve` 可在 compact 与 SSE 场景下返回 `source=provider`
- D-2.4 当前已完成的是**问题定义验证**：代码层已确认 decision 主链路尚未真实接入 provider

## 8. 当前实现执行状态
- 当前执行代理：主会话直接实现
- 当前执行模式：主会话直推 / 当前处于 D-2.4 handoff 入口确认阶段
- 当前会话策略：单任务隔离
- 当前 repo / cwd：xiangqi-web
- 当前轮次：项目启动 / Task Bundle D-2.4
- 当前 task bundle：Task Bundle D-2.4（decision 真实模型接入最小闭环）
- 当前执行状态：d2-4-contract-defined-waiting-implement
- 最近一次执行结果：D-2.4 入口文档已落盘，待确认后进入实现
- 当前会话是否仍可复用：是（可直接承接 D-2.4 实现）

## 9. 恢复提示
默认恢复顺序：
1. 先看本状态卡
2. 再看 `execution-contract.md`
3. 再看 `docs/Task Bundle D-2.4 实现交接.md`
4. 如需确认旧结论，再看 `review.md`
5. 直接从“实现 decision 真实模型接入最小闭环”继续，不要再回退到“D-2.3 是否成立”“narrative 是否接上”这类旧问题
