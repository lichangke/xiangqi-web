# SDD 状态卡（sdd-status）

## 文档头信息
- 文档名称：sdd-status
- 当前状态：有效
- 所属阶段：状态总览
- 所属项目：象棋网页版项目（暂定）
- 所属功能 / 子功能：Review / Task Bundle D-2.3（真实 narrative 模型接入最小闭环）
- 上游文档：docs/需求分析结论.md
- 创建时间：2026-03-26
- 最后更新时间：2026-04-07

## 1. 当前阶段
- 当前阶段：Review（Task Bundle D-2.3 review 已形成并已完成远端同步）
- 当前阶段状态：Task Bundle D-2.3 已完成实现结果回收、review 回写、本地稳定快照提交与远端同步。当前结论是：**真实 narrative 模型接入最小闭环已成立，`/api/narrative/resolve` route 场景可命中 provider，compact / 短 JSON 形态可被当前 parser 正常兼容，provider 失败或前置条件缺失时 fallback 仍可稳定托底。当前 `review.md` 与 `sdd-status.md` 已同步切换到 D-2.3 review 结论状态，本地稳定快照已形成并已推送远端（最新远端提交 `cb4e092`，包含 `bd00d8b`《收稳 D-2.3 narrative 真实接入最小闭环与 review 回写》与 `cb4e092`《修正 D-2.3 稳定快照与远端同步状态口径》）；当前这一轮已完成本地与远端双侧收口。**

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
- 备注：当前已切换为 Task Bundle D-2.3 的结构化 review 结论；结论为“有条件通过 / 阶段性通过，远端同步已完成”

## 3. 当前中断点
### 上次停在什么位置
主会话已完成 D-2.3 的实现、验证、review 回写、本地稳定快照提交与远端 push；当前已不再停在“是否进入 review”“是否收稳当前工作树”或“远端是否同步成功”的判断，而是停在 **这一轮已正式收口后是否开启下一轮** 的动作点。

### 为什么停下
当前 narrative provider 最小闭环、route 级测试、前端展示回归与全量测试 / 构建都已完成，本地稳定快照也已提交形成 `bd00d8b`，随后又补入文档口径修正提交 `cb4e092`，并已成功推送到远端 `origin/main`。当前剩余差异不再是本轮收口，而是后续是否开启新切片的问题。

### 恢复时应先处理什么
恢复时不要再回退讨论“D-2.3 是否已形成 review”“provider 是否能接通”“是否已形成本地稳定快照”或“远端是否已同步”；应直接从 **下一轮判断** 继续：
1. 若要继续推进，先判断下一轮是补 D-2.3 真实页面联调记录，还是开启新切片
2. 若暂不继续，当前轮可视为已正式收口完成

## 4. 下一步唯一推荐动作
从 D-2.3 Review 切到 **下一轮判断**：
1. 判断是否需要补一轮 D-2.3 的真实页面人工联调记录
2. 若不补当前轮细化记录，则开始判断下一轮切片（如 decision 外接或完整 secret 方案）
3. 不要再重复回做 D-2.3 的收稳与远端同步动作

## 5. 当前阻塞 / 未决问题
- 当前无新的用户侧未决项
- 当前已确认 D-2.3 范围收敛在：
  - narrative 真实模型接入最小闭环
  - fallback narrative 保留
  - timeline 契约不变
  - server env 仅作为真实 API Key 的最小承载位，不扩写成完整 provider 主配置体系
- 当前明确未进入：
  - decision 模型外接
  - 完整 secret 安全体系
  - 完整模型连通性测试平台
  - 更完整 provider / 并发治理平台
- 当前真实 narrative 接入主阻塞已解除：
  - 正确 provider 口径已确定为 `https://codex.hiyo.top/v1` + `gpt-5.4`
  - 根 `.env` 已可被 server 入口正确读取
  - `config.ts` 已改为运行时读取 env
  - route 场景已可返回 `source=provider`
  - 已补 route 级 provider 回归测试锁定 compact response shape
- 当前剩余问题不再是“能否接通 provider”“是否已形成稳定快照”或“远端是否已同步”，而是：
  - 当前 env 承载 API Key 只是 D-2.3 的最小口径，不是项目最终 secret 方案
  - 真实后台页面手工联调记录尚未单独沉淀（如后续认为有必要，可作为下一轮补记）

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
- [2026-04-07] 主会话已成功将 `68f024b..cb4e092` 推送到 `origin/main`

## 7. 当前执行范围（Implement / Review 阶段重点填写）
### 当前正在执行
- D-2.3 当前轮已完成本地与远端双侧收口；当前仅待判断是否开启下一轮

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
- D-2.3 本地稳定快照已形成（`bd00d8b`、`cb4e092`）
- D-2.3 远端同步已完成（`origin/main` 最新为 `cb4e092`）

### 当前未完成
- 当前轮无必须未完成项

### 当前验证情况
- D-2.3 当前实现已完成一轮自动化验证：`npm test` 通过（30/30）、`npm run build` 通过
- D-2.3 已完成 route 级 provider 回归验证：
  - `/api/narrative/resolve` 在 compact response shape 下可返回 `source=provider`
  - `fallbackUsed=false`
- D-2.3 当前 provider route、parser 兼容、前端 timeline 接入与 fallback 语义已相互印证：当前 narrative provider 最小闭环已成立

## 8. 当前实现执行状态
- 当前执行代理：主会话直接实现
- 当前执行模式：主会话直推 / Review 已完成，本地稳定快照与远端同步均已完成
- 当前会话策略：单任务隔离
- 当前 repo / cwd：xiangqi-web
- 当前轮次：项目启动 / Task Bundle D-2.3
- 当前 task bundle：Task Bundle D-2.3（真实 narrative 模型接入最小闭环）
- 当前执行状态：d2-3-closed-local-and-remote-synced
- 最近一次执行结果：D-2.3 review 已形成，文档已回写，本地稳定快照与远端同步均已完成
- 当前会话是否仍可复用：是（可直接承接下一轮判断）

## 9. 恢复提示
默认恢复顺序：
1. 先看本状态卡
2. 再看 `review.md`
3. 再看 `execution-contract.md`
4. 再看 `docs/Task Bundle D-2.3 实现交接.md`
5. 直接进入下一轮判断，不要再回退到“是否进入 review”“provider 是否能接通”“是否已形成本地稳定快照”或“远端是否已同步”的旧问题
