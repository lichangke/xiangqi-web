# SDD 状态卡（sdd-status）

## 文档头信息
- 文档名称：sdd-status
- 当前状态：有效
- 所属阶段：状态总览
- 所属项目：象棋网页版项目（暂定）
- 所属功能 / 子功能：Review / Task Bundle D-2.3（真实 narrative 模型接入最小闭环）
- 上游文档：docs/需求分析结论.md
- 创建时间：2026-03-26
- 最后更新时间：2026-04-08

## 1. 当前阶段
- 当前阶段：Review（Task Bundle D-2.3 review 已形成；本地稳定快照已继续累积，远端尚未同步最新提交）
- 当前阶段状态：Task Bundle D-2.3 已完成实现结果回收、review 回写与本地稳定快照提交。当前结论是：**真实 narrative 模型接入最小闭环已成立，`/api/narrative/resolve` route 场景可命中 provider，compact / 短 JSON / SSE chat completion chunk 形态可被当前 parser 正常兼容，provider 失败或前置条件缺失时 fallback 仍可稳定托底。当前 `review.md` 与 `sdd-status.md` 已同步切换到 D-2.3 review 结论状态；远端 `origin/main` 仍停在 `68f024b`，而本地 `main` 已继续形成 `bd00d8b`、`cb4e092`、`06d9a93`、`998cdd9` 四个提交，当前工作树已收稳但尚未 push；下一步应先完成远端同步，再开启下一轮专项问题切片。**

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
- 备注：当前 D-2.3 作为 D-2 增量切片推进，沿用已确认 tasks 作为项目级任务背景

### execution-contract.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：当前执行协议已切换为 Task Bundle D-2.3（真实 narrative 模型接入最小闭环）

### docs/Task Bundle D-2.3 实现交接.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：D-2.3 handoff 文档已新建，并已完成当前轮结果回收

### review.md
- 状态：已创建（已确认）
- 是否已确认：是
- 备注：当前已切换为 Task Bundle D-2.3 的结构化 review 结论；结论为“有条件通过 / 阶段性通过”，并已补记 2026-04-08 客户端体验反馈与 SSE 解析回归口径

## 3. 当前中断点
### 上次停在什么位置
主会话此前已完成 D-2.3 的最小闭环实现、验证、review 回写与多轮本地稳定快照；最新客户端补测又把焦点推进到 **对局 AI 智能不足 / 演绎 AI 对话质量不满意**。同时，当前与 D-2.3 收口直接相关的提交已经在本地累计形成 `bd00d8b`、`cb4e092`、`06d9a93`、`998cdd9`，但远端 `origin/main` 仍停在 `68f024b`，说明现实停点已从“是否收口 D-2.3”变成 **先把当前本地稳定快照 push 到远端，再开启下一轮专项问题切片**。

### 为什么停下
当前 narrative provider 最小闭环、route 级测试、SSE 解析回归、前端展示回归与全量测试 / 构建都已完成；但客户端真实页面补测又明确暴露：**对局 AI 智能感** 与 **演绎 AI 对话质感** 仍未达到满意，而且当前新增稳定快照尚未完成远端同步。因此当前暂停点不是旧的 D-2.3 是否成立，而是：
1. 先把本地已形成的这批稳定快照 push 到远端
2. 再以新问题切片开启下一轮专项处理

### 恢复时应先处理什么
恢复时不要再回退讨论“D-2.3 是否已形成 review”“provider 是否能接通”这类旧问题；应直接从以下顺序继续：
1. 先确认当前这批已形成的本地稳定快照已完成远端同步
2. 再开启新一轮专项判断：把“对局 AI 智能不足”和“演绎 AI 对话不满意”拆开，分别核对输入、prompt、页面命中 provider 质量与 fallback 污染
3. 不要把最新客户端体验问题简单归因成“只改提示词”或“D-2.3 根本没接上”

## 4. 下一步唯一推荐动作
先把当前本地已形成的稳定快照推送远端；随后新起一轮，专项处理：
1. 对局 AI 是否因为输入不足 / fallback / 未稳定命中 provider 导致“智能感不够”
2. 演绎 AI 是否因为 prompt / schema / 上下文拼装导致“对话不满意”

## 5. 当前阻塞 / 未决问题
- 当前无新的“D-2.3 是否成立”级别阻塞；route 级 narrative provider 最小闭环仍成立
- 当前已确认 D-2.3 范围收敛在：
  - narrative 真实模型接入最小闭环
  - fallback narrative 保留
  - timeline 契约不变
  - server env 仅作为真实 API Key 的最小承载位，不扩写成完整 provider 主配置体系
- 当前真实 narrative 接入主阻塞已解除：
  - 正确 provider 口径已确定为 `https://codex.hiyo.top/v1` + `gpt-5.4`
  - 根 `.env` 已可被 server 入口正确读取
  - `config.ts` 已改为运行时读取 env
  - route 场景已可返回 `source=provider`
  - 已补 route 级 provider 回归测试锁定 compact response shape
  - 已补 SSE chat completion chunk 解析回归，说明当前 provider 若以流式 chunk 形式返回也可被当前 route 吸收
- 当前真正未决的是下一轮体验问题：
  - 对局 AI 是否真的稳定命中大模型，以及输入是否足够支撑“智能感”
  - 演绎 AI 的 prompt / schema / 上下文拼装是否导致输出模板味重、棋局锚点弱、像轮流解说

## 6. 最近执行痕迹摘要
- [2026-04-04] 主会话完成 D-2.2 review 收口并形成稳定快照，提交 `68f024b`
- [2026-04-04] 用户确认按建议直接进入 D-2.3
- [2026-04-04] 主会话核对当前 narrative 现实入口，确认现状主要在 `apps/web/src/presentation.ts`
- [2026-04-04] 主会话将 `execution-contract.md` 切换为 Task Bundle D-2.3 执行协议
- [2026-04-04] 主会话新建 `docs/Task Bundle D-2.3 实现交接.md`
- [2026-04-04] 主会话将 `sdd-status.md` 切换到 Task Bundle D-2.3 当前轮状态
- [2026-04-05] 主会话核对当前实现阻塞，确认后台 `ModelConfig` 现状仅保留 `apiKeyMaskedHint`，无法直接为 narrative 运行时提供真实 API Key
- [2026-04-05] 主会话据此补充 D-2.3 实现口径：若本轮采用 env 落地，仅作为 server 侧真实密钥承载位，`modelName / baseUrl / enabled` 仍锚定后台 narrative model config
- [2026-04-05] 主会话已补齐前端 timeline 异步 narrative 承载点、server 侧 narrative resolve 入口与 env 承载位
- [2026-04-06] 主会话已定位并修复 provider URL 拼接错误（避免吞掉 `/v1`）
- [2026-04-06] 主会话已定位并修复 server 入口 `.env` 加载路径问题，改为显式读取仓库根 `.env`
- [2026-04-06] 主会话已定位并修复 `config.ts` 提前固化空 env 的问题，改为运行时读取 `process.env`
- [2026-04-06] 主会话已完成 narrative provider schema 收口：收紧 prompt，并补齐 compact / 短 JSON 兼容解析
- [2026-04-06] 主会话已完成超时收口：将 provider 最低超时下限抬到 20000ms，并把 temperature 收到 0.4
- [2026-04-06] 主会话已补强 route / service 可观察性日志，实际确认 route 场景可命中 provider
- [2026-04-06] 主会话已补一条 route 级 provider 回归测试，锁定 compact response shape 可被解析
- [2026-04-07] 主会话重新执行当前工作树验证：`npm test` 通过（30/30）、`npm run build` 通过
- [2026-04-07] 主会话已将 `review.md` 正式回写为 Task Bundle D-2.3 的结构化 review 结论
- [2026-04-07] 主会话已同步将 `sdd-status.md` 回写到 D-2.3 review 结论状态
- [2026-04-07] 主会话已提交本地稳定快照 `bd00d8b`《收稳 D-2.3 narrative 真实接入最小闭环与 review 回写》
- [2026-04-07] 主会话已提交文档口径修正 `cb4e092`《修正 D-2.3 稳定快照与远端同步状态口径》
- [2026-04-08] 主会话已补 SSE chat completion chunk 解析逻辑，并新增 route 级回归测试锁定 `text/event-stream` 返回下仍可返回 provider narrative
- [2026-04-08] 主会话已再次执行当前工作树验证：`npm test` 通过（31/31）、`npm run build` 通过
- [2026-04-08] 主会话已提交终态口径修正 `06d9a93`《回写 D-2.3 远端同步完成后的终态口径》
- [2026-04-08] 用户在客户端真实页面补测中反馈：对局 AI 大模型智能与演绎 AI 对话均不满意，疑似进入了新的 prompt / 输入契约 / 页面命中质量问题域
- [2026-04-08] 主会话已新增 `docs/Task Bundle D-2.3 真实页面人工联调记录.md`，并补充最新联调记录与状态回写，形成本地稳定快照 `998cdd9`《收稳 D-2.3 最新联调状态与 SSE 解析回归》；当前远端 `origin/main` 仍停在 `68f024b`，待 push

## 7. 当前执行范围（Implement / Review 阶段重点填写）
### 当前正在执行
- 当前 D-2.3 文档与本地稳定快照口径已收稳，待将本地提交同步到远端后转入下一轮问题切片

### 当前已完成
- 项目启动与需求讨论的第一轮收口
- `spec.md` / `plan.md` / `tasks.md` 第一轮落盘与确认
- Task Bundle A 完成并回收
- Task Bundle B 完成并回收
- Task Bundle C 完成、review 收口并推送
- Task Bundle D-1 review 收口与稳定快照形成
- Task Bundle D-2.1 review 收口、稳定快照形成并推送
- Task Bundle D-2.2 review 收口、稳定快照形成并推送
- Task Bundle D-2.3 执行协议与实现交接文档落盘
- D-2.3 前端 timeline 异步 narrative 承载点补齐
- D-2.3 server narrative resolve 入口补齐
- D-2.3 env 承载位（`NARRATIVE_API_KEY`）与自动化验证闭环建立
- D-2.3 provider URL / env 加载 / config 读取时机问题已收口
- D-2.3 narrative provider schema 兼容与 compact response shape 兼容已落地
- D-2.3 route / service 可观察性日志已落地
- D-2.3 route 场景真实 provider 闭环已成立
- D-2.3 route 级 provider 回归测试已补齐
- D-2.3 review.md 与 sdd-status.md 已同步回写完成
- D-2.3 本地稳定快照已继续累积形成（`bd00d8b`、`cb4e092`、`06d9a93`、`998cdd9`）
- D-2.3 最新收口状态已在本地文档与提交中对齐

### 当前未完成
- 远端同步尚未完成（`origin/main` 仍停在 `68f024b`，本地 `main` ahead 4）

### 当前验证情况
- D-2.3 当前实现已完成一轮自动化验证：`npm test` 通过（31/31）、`npm run build` 通过
- D-2.3 已完成 route 级 provider 回归验证：
  - `/api/narrative/resolve` 在 compact response shape 下可返回 `source=provider`
  - `fallbackUsed=false`
- D-2.3 当前还已完成 SSE chat completion chunk 解析回归验证：
  - provider 返回 `text/event-stream` 时，`/api/narrative/resolve` 仍可稳定返回 `source=provider`
  - SSE 路径下 `fallbackUsed=false`
- D-2.3 当前 provider route、parser 兼容、前端 timeline 接入与 fallback 语义已相互印证：当前 narrative provider 最小闭环已成立

## 8. 当前实现执行状态
- 当前执行代理：主会话直接实现
- 当前执行模式：主会话直推 / 本地稳定快照已形成并继续累积，待完成远端同步
- 当前会话策略：单任务隔离
- 当前 repo / cwd：xiangqi-web
- 当前轮次：项目启动 / Task Bundle D-2.3 → 下一轮问题切片前的状态落盘
- 当前 task bundle：Task Bundle D-2.3（真实 narrative 模型接入最小闭环）
- 当前执行状态：d2-3-local-snapshots-ready-waiting-push
- 最近一次执行结果：当前工作树已收稳，本地 `main` 最新提交为 `998cdd9`，相对 `origin/main` ahead 4，待 push
- 当前会话是否仍可复用：是（可直接承接新一轮专项判断）

## 9. 恢复提示
默认恢复顺序：
1. 先看本状态卡
2. 再看 `review.md`
3. 再看 `docs/Task Bundle D-2.3 真实页面人工联调记录.md`
4. 再看 `execution-contract.md`
5. 直接从“先 push 当前本地稳定快照 → 新起一轮专项处理对局 AI / 演绎 AI 体验问题”继续，不要再回退到“D-2.3 是否成立”“provider 是否能接通”这类旧问题
