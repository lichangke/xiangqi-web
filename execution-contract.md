# 执行协议（Execution Contract）

## 文档头信息
- 文档名称：execution-contract
- 当前状态：已确认
- 所属阶段：Execution Contract
- 所属项目：xiangqi-web / 网页版中国象棋项目
- 所属功能 / 子功能：Task Bundle D-2.7 执行协议（网页实测 burn-in / 运行口径锁定）
- 上游文档：spec.md, plan.md, tasks.md, review.md, docs/Task Bundle D-2.7 实现交接.md
- 创建时间：2026-04-11
- 最后更新时间：2026-04-13

## 关联更新检查
本文档更新后，至少检查是否需要同步更新：
- `sdd-status.md`
- `docs/Task Bundle D-2.7 实现交接.md`
- 当前执行摘要
- 必要时 `review.md`

若执行边界、权威输入、验证要求发生变化，应重新检查 handoff 条件是否仍成立。

---

## 1. 执行目标
本执行协议服务于 V1 的 **Task Bundle D-2.7（网页实测 burn-in / 运行口径锁定）**。

D-2.6 已完成以下关键收口：
1. 已完成 decision 输入契约、prompt 约束、噪音控制与 reason 质量约束的真实可验证闭环；
2. 已通过真实 provider 观察样本确认 `payloadSummary / responsesSummary` 可在主链路中观察；
3. 已通过网页实测与 provider token 消耗共同确认：decision / narrative 两条链路都已实际调用目标大模型；
4. 已补记两类真实运行问题：后台配置曾短暂偏离目标口径，客户端 / 管理端 / 服务端公网访问曾一度不可用。

因此，本轮目标不再是验证 provider 是否命中，而是：
> 在真实网页链路已成立的前提下，收清运行口径、最小 burn-in 观察与公网可达性巡检留痕，并判断是否暴露出下一轮值得继续下钻的新问题。

---

## 2. 本轮执行范围
### 明确包含
- 梳理当前 `decision / narrative` 目标运行口径与最小核对项
- 设计并执行一轮真实网页 burn-in 观察
- 补一轮客户端 / 管理端 / 服务端公网可达性最小巡检与留痕
- 观察真实网页体验中的 `reason / situationShift / narrative` 质量波动
- 形成本轮 review 所需的最小证据、状态回写与下一轮入口判断依据

### 明确不包含
- 回退到 provider 协议、baseUrl、env、API key、命中性排查
- 把本轮扩写为完整 provider 平台治理
- narrative 大重构
- 搜索型棋力引擎化改造
- 完整运维监控平台建设
- 与当前切片无关的大重构

### 对应任务范围
- 任务组：任务组 E 的增量稳定性切片
- 当前轮次定位：Task Bundle D-2.7 / 网页实测 burn-in / 运行口径锁定
- 对应用户故事：US3、US5、US6（以真实运行稳定性、配置一致性与体验观察为当前切入点）
- 对应 FR：FR-004 ~ FR-017、FR-023 ~ FR-031（以当前 decision / narrative 主链路与后台配置可用性相关约束为准）

---

## 3. 默认执行方式
### 执行模式
- [x] 阶段性汇报
- [ ] 静默执行为主
- [ ] 高频同步（仅特殊情况）

### 默认说明
- 默认由主会话基于当前已确认的 D-2.7 contract 继续推进 implement
- 普通阅读、梳理、观察项补充与小范围文字修订不需要逐条同步
- 完成本轮连续 burn-in 观察、形成明确验证结论、出现关键阻塞或需要用户拍板时再回报

---

## 4. 实现执行编排信息
### 执行代理
- 执行者：主会话直接实现（基于当前 D-2.7 草案继续推进）
- 会话策略：单 repo + 单轮次 + 单 task bundle
- 当前 repo / cwd：xiangqi-web
- 当前轮次：项目启动 / Task Bundle D-2.7
- 当前 task bundle：Task Bundle D-2.7（网页实测 burn-in / 运行口径锁定）

### 本轮目标
- 明确当前目标运行口径与最小核对清单
- 形成一轮可回看、可比较的网页 burn-in 观察记录
- 补齐公网可达性最小巡检结论
- 判断当前真实体验问题是否值得拆成下一轮独立切片
- 将本轮证据沉淀到 `docs/Task Bundle D-2.7 burn-in 记录.md`

### 本次明确不做
- 不再证明 provider 是否命中
- 不做完整平台化治理
- 不把本轮泛化为“整体 AI 变聪明”或棋力专项

### 权威输入
#### 必读文档
- `spec.md`
- `plan.md`
- `tasks.md`
- `review.md`
- `execution-contract.md`
- `sdd-status.md`
- `docs/Task Bundle D-2.6 实现交接.md`
- `docs/Task Bundle D-2.5 真实页面 smoke 记录.md`
- `docs/Task Bundle D-2.7 实现交接.md`
- `docs/Task Bundle D-2.7 burn-in 记录.md`

#### 当前轮次直接依据
- `74fdaad《补记D-2.6网页实测排障结论》`
- 当前网页实测已确认：decision / narrative 都已调用目标大模型
- 后台配置曾出现短暂偏离目标口径的真实事实
- 客户端 / 管理端 / 服务端公网访问曾一度不可用的真实事实
- 当前服务端存在 `GET /api/health` 健康检查入口
- 当前后台存在 `GET /api/admin/model-configs` 与 `GET /api/admin/audit-summary` 作为模型配置与变更留痕入口
- 当前 decision / narrative 分别存在 provider 成功日志，可作为 burn-in 观察点

若历史上下文、旧会话理解或未确认草案与以上文档冲突，以以上文档为准。

### 修改边界
#### 允许修改
- 与 burn-in 记录、运行口径锁定、最小巡检直接相关的文档
- `apps/server/`、`apps/web/`、`apps/admin/` 中与最小自检、日志或配置可观测性直接相关的必要代码
- 与当前轮次直接联动的状态 / review / 实现交接文档

#### 不允许修改
- 已确认的 `spec.md` / `plan.md` / `tasks.md` 边界
- 与当前切片无关的大重构
- 擅自把本轮扩写成 provider 平台、完整监控系统或棋力专项
- 回退并重打 D-2.6 已收口结论

---

## 5. 汇报与返回规则
### 默认应返回
- 完成 Task Bundle D-2.7 的 execution-contract 收口后
- 完成一轮 burn-in 观察并形成明确结论后
- 出现关键阻塞时
- 发现需要调整 Plan / Tasks / Contract 时
- 发现当前切片只能部分完成时

### 默认不返回
- 普通阅读过程
- 单条命令细节
- 小范围失败尝试
- 局部文字调整

### 立即返回条件
出现以下情况必须立即返回：
- 关键前提不成立
- 需要扩大已确认范围
- 需要改动 Plan 级方案
- 当前 task 定义不足以继续执行
- 需要用户拍板
- 当前代码现状与权威文档严重不一致
- 若要继续推进必须切换为完整运维治理 / 平台治理 / 棋力专项等新问题切片

---

## 6. 测试与验证要求
### 主链路验证
- 当前 burn-in / 巡检动作不得破坏既有 decision / narrative 主链路
- 当前观察应能够区分“目标口径命中”与“配置漂移 / 可达性异常”
- 当前结论应建立在真实网页链路，而不是仅依赖服务端单点日志

### 本轮任务级验证
至少覆盖并回报：
- 当前目标运行口径与核对项
- 一轮连续网页 burn-in 观察结果
- 客户端 / 管理端 / 服务端公网可达性最小巡检结果
- 当前后台模型配置与审计摘要是否可形成最小留痕证据
- 若有代码改动，对应最小验证结果（必要时 build / 定向测试 / 人工 smoke）

### 边界 / 异常验证
- 后台配置偏离目标口径时，是否能被当前最小观察口径及时发现
- 公网访问异常时，是否能形成最小留痕而不是只剩口头描述
- `reason / situationShift / narrative` 若出现重复、空泛或明显退化，是否可被当前 burn-in 记录捕捉

### 最低完成标准
- 无清晰运行口径结论，不算完成
- 无连续 burn-in 观察记录，不算完成
- 无公网巡检结论，不算完成
- 无状态记录与结论回写，不算完成
- 无 `docs/Task Bundle D-2.7 burn-in 记录.md` 的实际证据沉淀，不算完成

---

## 7. 文档与状态更新要求
本轮完成后，至少同步更新：
- `sdd-status.md`
- `review.md`
- `docs/Task Bundle D-2.7 实现交接.md`
- 当前执行状态
- 下一步动作
- 是否存在阻塞

默认原则：
> 本轮不是泛泛讨论“网页已经能用了”，而是要把真实运行稳定性、配置一致性与 burn-in 观察收成新的可执行闭环。

---

## 8. 回退规则
出现以下情况时应回退而非硬推：
- 已确认文档之间存在关键冲突
- 当前 task 定义不足以支撑继续 burn-in / 巡检
- 当前优化目标实际上已经变成完整平台治理 / 监控系统建设 / 棋力专项
- 为满足本轮目标必须扩大到完整前后端或产品层大改

### 回退目标
- [ ] 回到 Specify
- [ ] 回到 Plan
- [ ] 回到 Tasks
- [x] 仅补充 Execution Contract

---

## 9. 完成定义
本轮 Task Bundle D-2.7 只有同时满足以下条件才算完成：
- 已覆盖本轮约定范围
- 已形成运行口径核对项与 burn-in 观察记录
- 已形成最小巡检或最小实现 / 留痕结果
- 已更新状态记录
- 无未披露关键阻塞

---

## 10. 审核结论
### 本轮审核意见
- D-2.7 的问题边界已从 D-2.6 的 decision 输入契约 / prompt / 体验优化中剥离出来，并已收敛为独立入口
- 本轮已明确：真实网页 burn-in、运行口径锁定与公网可达性最小巡检是当前唯一问题主轴；provider 协议 / baseUrl / 命中性不再作为本轮前置讨论项
- 当前 execution-contract 已具备可执行版本，且已有具体核对入口：`/api/health`、后台模型配置、审计摘要、decision / narrative provider 成功日志
- 当前已完成首轮运行口径锁定与本机可达性巡检，可据此进入 D-2.7 implement

### 进入 Implement 前的最小执行顺序
1. 先固化当前目标运行口径与最小核对项
2. 再建立并填写 `docs/Task Bundle D-2.7 burn-in 记录.md`
3. 执行一轮真实网页 burn-in 与公网最小巡检
4. 最后回写 D-2.7 的 review / status / 实现交接结果

### 是否允许进入 Implement
- [x] 是
- [ ] 否
