# Review / 验收结论

## 文档头信息
- 文档名称：review
- 当前状态：已确认
- 所属阶段：Review
- 所属项目：xiangqi-web / 网页版中国象棋项目
- 所属功能 / 子功能：Task Bundle D-2.3 Review / Acceptance（真实 narrative 模型接入最小闭环）
- 上游文档：spec.md, plan.md, tasks.md, execution-contract.md, docs/Task Bundle D-2.3 实现交接.md
- 创建时间：2026-04-07
- 最后更新时间：2026-04-08

## 关联更新检查
本文档形成结论后，至少检查是否需要同步更新：
- sdd-status.md
- tasks.md（完成情况 / 未完成项）
- 条件项是否需要同步写入状态卡
- 下一轮 feature / task 入口文档（仅在明确开启下一轮时）

---

## 1. Review 范围
### 本轮覆盖内容
- Task Bundle D-2.3 的真实代码改动、验证结果与结果回收
- server 侧 narrative 解析 / 编排入口与 `/api/narrative/resolve` 路由
- narrative provider 调用、schema 兼容、compact / 短 JSON / SSE chat completion chunk 兼容与 fallback 闭环
- 前端 timeline 对 runtime narrative 的接入与本地 fallback 保留
- narrative 运行时配置读取口径：后台 `narrative` model config + server env 中 `NARRATIVE_API_KEY`
- route 级 provider 回归测试、SSE 解析回归测试、前端演绎展示回归测试与全量测试 / 构建回归
- 当前轮本地稳定快照与远端同步结果
- 2026-04-08 客户端真实页面补充联调反馈（对局 AI 智能与演绎 AI 对话质量）

### 对应用户故事 / FR / 任务组
- 用户故事：US3、US5、US6（其中本轮以 D-2.3 增量切片方式承接）
- FR：FR-018 ~ FR-027
- 任务组：Task Bundle D-2.3（真实 narrative 模型接入最小闭环）

---

## 2. Spec 满足度
### 总体判断
- [ ] 满足
- [x] 基本满足
- [ ] 不满足

### 说明
- 若以 **Task Bundle D-2.3 当前约定边界** 来看，当前实现已经完成了本轮最核心闭环：
  1. 后台 `narrative` 模型已配置，且 server env 中存在 `NARRATIVE_API_KEY` 时，可尝试走真实 provider；
  2. provider 返回 compact / 短 JSON 形态时可被当前 server 侧 parser 正常吸收；
  3. provider 失败、超时、空响应、schema 非法或前置条件缺失时，会稳定退回 server / 前端既有 fallback，不打断 timeline 与主链路。
- 但若以 **完整模型配置产品能力** 或 **完整 provider / secret / 连通性平台** 来看，当前不能写成“全部满足”。本轮明确没有完成：
  - decision 模型外接
  - 完整 secret 安全持久化体系
  - 后台直接持久化真实 API Key 并供运行时消费
  - 完整模型连通性测试平台
  - narrative / decision 全链路平台化治理
- 因此，本轮正确口径应是：**D-2.3 边界内基本满足，可形成结构化 review 结论；但不等于完整模型平台、完整 secret 方案或整个 V1 已整体验收完成。**

---

## 3. 用户故事完成情况
### 用户故事 3（P1）
- 完成情况：阶段性受益
- 是否可独立成立：基本成立
- 说明：普通回合 narrative 与特殊事件 timeline 的统一展示结构继续成立；本轮新增真实 narrative 接入后，仍保持统一 `NarrativeResponseEnvelope` 与 fallback 语义，没有破坏事件展示主链路。

### 用户故事 5（P2）
- 完成情况：在 D-2.3 边界内阶段性完成
- 是否可独立成立：基本成立
- 说明：D-2.1 / D-2.2 已提供后台模型配置与运行状态基础；本轮继续落实 narrative 模型真实消费口径，使后台 `narrative` 配置不再只是结构占位，而能进入实际 runtime narrative 解析链路。

### 用户故事 6（P3）
- 完成情况：局部受益
- 是否可独立成立：否
- 说明：本轮将 server narrative 入口、provider schema 兼容与 fallback 边界做实，为后续扩展留下更清楚的结构承载位；但这不等于完整扩展架构或完整 AI 平台化能力已经成立。

---

## 4. Tasks 完成情况
### 已完成任务
- D-2.3 当前切片已完成：
  - server 侧新增 `NarrativeService` 与 `/api/narrative/resolve` 路由承载位
  - provider URL 拼接收口，避免 `/v1` 路径被吞
  - server 入口显式读取仓库根 `.env`，并修复 `config.ts` 过早固化 env 的问题
  - provider 响应解析兼容 compact / 短 JSON 结构
  - narrative 运行时最小前置条件闭环：后台 `narrative` model config + env 中 `NARRATIVE_API_KEY`
  - provider 失败 / 空结果 / schema 非法 / 前置条件缺失时 server fallback 成立
  - 前端 runtime hydrate narrative 接入，同时保留前端本地 fallback，不打断 timeline
  - route 级 provider 回归测试补齐
  - 全量 `npm test` 与 `npm run build` 回归通过
  - 本地稳定快照已形成：`bd00d8b`《收稳 D-2.3 narrative 真实接入最小闭环与 review 回写》、`cb4e092`《修正 D-2.3 稳定快照与远端同步状态口径》
  - 远端同步已完成：`origin/main` 最新提交为 `cb4e092`

### 未完成任务
- 后台直接持久化真实 API Key 并供 runtime 安全消费的完整方案未纳入本轮
- decision 模型真实外接未纳入本轮
- 完整 provider / 并发治理 / 连通性测试平台未纳入本轮

### 偏差说明
- `spec.md` 中 FR-024 / FR-025 的项目级严格口径是：模型运行配置不应以 env-like 配置作为业务配置来源，环境变量仅用于系统级基础配置。
- 本轮为避免回流扩写到完整 secret 持久化体系，采取了 **最小例外口径**：
  - `modelName / baseUrl / enabled` 仍继续锚定后台 `narrative` model config；
  - env 仅承载真实 API Key，不扩写成完整 provider 主配置源。
- 这一本轮例外已在 D-2.3 执行协议和状态卡中明确限定，因此当前不视为范围跑偏，但必须保留在 review 条件项中，不得误写成项目级长期最终方案。

---

## 5. 验证结果概览
### 主链路验证
- 内容：narrative route provider 接入、compact response shape 解析、前端展示回归、全量测试与构建回归
- 结果：通过
- 说明：当前结论基于当前工作树真实执行结果形成，不是沿用旧轮次口头判断。

### 用户故事独立验证
- narrative provider route 最小闭环 → 通过
- 前端 timeline / fallback 展示回归 → 通过
- 后台 runtime model status 可见性 → 通过
- decision 真实外接 → 未验证（不在本轮范围）

### 验证明细
- `tests/integration/auth-and-game-api.spec.ts` 通过（19/19）
- `tests/web/presentation.spec.ts` 通过（6/6）
- `tests/rules/rule-adapter.spec.ts` 通过（6/6）
- 全量 `npm test` 通过（31/31）
- `npm run build` 通过
- 本地稳定快照已形成：`bd00d8b`、`cb4e092`
- 远端同步已完成：`origin/main` 最新为 `cb4e092`
- 关键新增 / 关键核对点包括：
  - `/api/narrative/resolve` 在 compact response shape 下可返回 `source=provider`
  - `fallbackUsed=false`
  - provider 请求命中 `https://codex.hiyo.top/v1/chat/completions`
  - provider 最低超时下限已抬到 20000ms
  - 当前已补 SSE chat completion chunk 解析与回归测试，说明 provider 若返回 `text/event-stream` 也可被当前 route 正常吸收
  - 当前前端 runtime narrative hydrate 失败时仍保留本地 fallback，不打断主链路

### 验证不足项
- 当前 narrative provider 成功验证主要基于 route 级注入 / mock、SSE 解析回归与当前工作树本地回归；页面层是否每次都稳定命中 provider，仍需结合后续专项日志或人工联调继续核实
- 当前没有把 `NARRATIVE_API_KEY` 的后台安全持久化和轮换流程纳入验证，因为这不在本轮范围内
- 当前没有把 narrative / decision 并发治理与完整连通性平台纳入验证，因为这不在本轮范围内
- 2026-04-08 客户端真实页面补测已暴露：即使当前最小链路闭环成立，**对局 AI 智能感** 与 **演绎 AI 对话质感** 仍未达到用户满意；这更像下一轮的 prompt / 输入契约 / 页面命中质量问题，而不是当前 D-2.3 route 级最小闭环被推翻

### 外部阻塞 / 条件项（如有）
- 条件项：当前 narrative runtime 仍依赖 env 中 `NARRATIVE_API_KEY` 作为最小承载位
- 是否阻断当前主线验收：不阻断当前 D-2.3 “最小闭环已成立、稳定快照已形成、远端同步已完成”的 review 结论；但仍不应外推为完整 provider / secret 平台已完成

---

## 6. 代码质量结构化判断
### 正确性
- 结论：基本通过
- 说明：route / service / parser / fallback / timeline 之间的链路已在测试与构建下闭环，provider compact 返回形态也已被当前实现兼容。

### 可读性
- 结论：通过
- 说明：server narrative 逻辑集中到 `apps/server/src/domain/ai/narrative/` 与 `/api/narrative/resolve` 路由，职责边界比此前分散在前端本地生成时更清楚。

### 可维护性
- 结论：基本通过
- 说明：当前结构已形成 server narrative 承载位，并保留前端 fallback；后续若扩展完整 provider 平台或 secret 体系，仍有明确增量落点。

### 范围控制
- 结论：通过
- 说明：当前没有顺手把 decision 模型外接、完整 secret、完整连通性平台一起打满，整体仍收敛在 D-2.3 已确认边界内。

### 可验证性
- 结论：通过
- 说明：本轮 review 结论已基于当前工作树重新执行测试与构建，并已形成对应本地稳定快照与远端同步，不是只复述上轮状态卡。

### 可选增强项（按需要填写）
- 简洁性：通过；本轮只补最小 narrative runtime 闭环，不扩写成完整平台
- 一致性：基本通过；server / web / tests / status 已能对齐到当前 D-2.3 口径
- 鲁棒性：基本通过；provider 前置条件缺失、空响应、schema 非法和失败时均有 fallback
- 可扩展性：通过；后续扩展 secret、decision、观测与治理时已有清晰承载位
- 性能合理性：通过；provider 超时下限与返回解析已做最小收口，未引入明显额外阻塞点

---

## 7. 问题与风险
- 当前通过结论只覆盖 **Task Bundle D-2.3（真实 narrative 模型接入最小闭环）**，不应外推为完整模型平台、完整 secret 体系或整个 V1 已通过。
- 当前 env 承载真实 API Key 只是 D-2.3 的最小落地口径，不应误当成项目长期终态方案。
- 当前 narrative 真实 provider 最小闭环已成立，但页面层“是否稳定命中 + 命中后体验是否达标”仍未完全收口。
- 最新客户端补测反馈已把问题重心从“是否能接通 provider”推进到“对局 AI 输入是否足够、演绎 AI prompt / schema 是否把输出带歪”；若要继续推进，应按新一轮问题切片处理，不应回退成“D-2.3 是否成立”的旧问题。

---

## 8. 结论
### 总体结论
- [ ] 通过
- [x] 有条件通过
- [ ] 不通过
- [x] 建议进入下一步判断
- [ ] 当前轮次已收口但暂不开启下一轮

### 结论说明
- 以 D-2.3 当前约定边界来看，代码、验证与结果回收已经足够支撑 **真实 narrative 模型接入最小闭环** 的 review 结论。
- 当前之所以不是“完全通过”，核心保留边界是：
  1. **本结论只覆盖 D-2.3，不覆盖完整 secret 体系、decision 外接、完整 provider / 连通性平台**
  2. **当前虽然本地稳定快照与远端同步均已完成，但这不等于后续平台化能力已经完成**
  3. **2026-04-08 客户端补测已明确暴露“对局 AI 智能感 / 演绎 AI 对话质感”未达满意；这构成下一轮需要单独处理的体验 / prompt / 输入契约问题，但不推翻本轮 route 级最小闭环已成立的 review 结论**
- 因此，当前最准确的结论是：**Task Bundle D-2.3 有条件通过 / 阶段性通过；本轮最小 narrative provider 闭环已成立，本地稳定快照已形成，远端同步已完成；若继续推进，应以新的问题切片处理页面命中质量与 prompt / 输入契约问题。**

---

## 9. 后续建议
### 建议立即处理
- 当前 D-2.3 route 级最小闭环已完成本地与远端双侧收口，无需再回退重做旧的提交与 push
- 下一步优先级已更新为：
  1. 新起一轮，专项判断“对局 AI 智能不足”和“演绎 AI 对话不满意”到底分别是 **输入不足 / prompt 问题 / 页面未稳定命中 provider / fallback 污染** 中的哪一类
  2. 在专项判断前，不要把最新客户端体验问题简单归因为“D-2.3 没接上”或“只要改几个提示词就行”

### 可放入下一轮迭代
- 真实 API Key 的安全持久化与运行期读取方案
- decision 模型真实外接
- narrative / decision 并发治理
- 完整模型连通性测试平台
- 更完整的 provider 观测与审计能力

---

## 10. 最终验收意见
### 用户验收意见
- 用户是否接受当前结论：当前已要求将 D-2.3 的 `review.md` 与 `sdd-status.md` 一起回写到远端同步完成后的最终终态口径
- 用户是否接受条件项不阻断当前主线验收：当前按“阶段性通过，但保留范围边界；本地稳定快照与远端同步均已完成”处理
- 其他验收备注：当前“有条件通过”主要指范围边界，而不是本轮最小 narrative provider 闭环未成立

### 是否验收通过
- [ ] 是
- [ ] 否
- [x] 阶段性通过
