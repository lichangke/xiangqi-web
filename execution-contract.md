# 执行协议（Execution Contract）

## 文档头信息
- 文档名称：execution-contract
- 当前状态：已确认
- 所属阶段：Execution Contract
- 所属项目：xiangqi-web / 网页版中国象棋项目
- 所属功能 / 子功能：Task Bundle D-2.8 执行协议（外部访问侧样本 / 扩展 burn-in）
- 上游文档：spec.md, plan.md, tasks.md, review.md, docs/Task Bundle D-2.8 实现交接.md
- 创建时间：2026-04-13
- 最后更新时间：2026-04-13

## 关联更新检查
本文档更新后，至少检查是否需要同步更新：
- `sdd-status.md`
- `docs/Task Bundle D-2.8 实现交接.md`
- 当前执行摘要
- 必要时 `review.md`

若执行边界、权威输入、验证要求发生变化，应重新检查 handoff 条件是否仍成立。

---

## 1. 执行目标
本执行协议服务于 V1 的 **Task Bundle D-2.8（外部访问侧样本 / 扩展 burn-in）**。

D-2.7 已完成以下关键收口：
1. 已完成运行口径锁定；
2. 已通过真实对局 API 样本确认 decision 主链路持续可用；
3. 已通过真实 `/api/narrative/resolve` 样本确认 narrative 当前为 `source=provider / fallbackUsed=false`；
4. 已形成 3 条连续证据：配置/健康 → decision 主链路 → narrative 主链路；
5. 已明确“外部访问侧样本 / 更长时间 burn-in”应作为后续增强项，而不回灌 D-2.7。

因此，本轮目标不再是证明链路存在，而是：
> 在当前链路已成立的前提下，补外部访问侧样本、扩展 burn-in，并判断当前是否出现新的退化模式或新问题信号。

---

## 2. 本轮执行范围
### 明确包含
- 补客户端 / 管理端 / 服务端的外部访问侧样本
- 扩展更多 decision 真实对局样本
- 扩展更多 narrative 真实样本，覆盖更多回合或事件类型
- 继续核对 `decision / narrative` 当前运行口径是否保持一致
- 记录 narrative 是否出现 fallback、结构退化、语义漂移、体验下降
- 形成本轮 review 所需的最小证据、状态回写与下一轮入口判断依据

### 明确不包含
- 回退到 provider 协议、baseUrl、env、API key、命中性排查
- 把本轮扩写为完整监控平台 / 运维治理体系
- 大范围 prompt 重构或模型平台重构
- 新的大功能切片开发
- 与当前切片无关的大重构

### 对应任务范围
- 任务组：任务组 E 的增量稳定性增强切片
- 当前轮次定位：Task Bundle D-2.8 / 外部访问侧样本 / 扩展 burn-in
- 对应用户故事：US3、US5、US6（以外部访问稳定性、扩展 burn-in 与体验稳定性为当前切入点）
- 对应 FR：FR-004 ~ FR-017、FR-023 ~ FR-031（以当前 decision / narrative 主链路与后台配置可用性相关约束为准）

---

## 3. 默认执行方式
### 执行模式
- [x] 阶段性汇报
- [ ] 静默执行为主
- [ ] 高频同步（仅特殊情况）

### 默认说明
- 默认由主会话基于当前已确认的 D-2.8 contract 继续推进 implement
- 普通阅读、局部观察、样本记录不需要逐条同步
- 完成外部访问样本、形成明确验证结论、出现关键阻塞或需要用户拍板时再回报

---

## 4. 实现执行编排信息
### 执行代理
- 执行者：主会话直接实现
- 会话策略：单 repo + 单轮次 + 单 task bundle
- 当前 repo / cwd：xiangqi-web
- 当前轮次：项目启动 / Task Bundle D-2.8
- 当前 task bundle：Task Bundle D-2.8（外部访问侧样本 / 扩展 burn-in）

### 本轮目标
- 形成外部访问侧样本
- 补更多 decision / narrative 扩展 burn-in 样本
- 识别 narrative 或运行链路的退化模式
- 判断当前是否仍属增强证据轮，还是已升级为新问题

### 本次明确不做
- 不再证明 provider 是否命中
- 不做完整监控治理
- 不把本轮泛化为新功能开发轮

### 权威输入
#### 必读文档
- `spec.md`
- `plan.md`
- `tasks.md`
- `review.md`
- `execution-contract.md`
- `sdd-status.md`
- `docs/Task Bundle D-2.7 实现交接.md`
- `docs/Task Bundle D-2.7 burn-in 记录.md`
- `docs/Task Bundle D-2.8 实现交接.md`

#### 当前轮次直接依据
- D-2.7 已确认收口
- 当前目标口径：`gpt-5.4 + https://codex.hiyo.top/v1`
- 当前服务端存在 `/api/health`
- 当前后台存在 `model-configs / audit-summary`
- 当前 decision / narrative 已有真实主链路样本

若历史上下文、旧会话理解或未确认草案与以上文档冲突，以以上文档为准。

### 修改边界
#### 允许修改
- 与外部访问样本、扩展 burn-in、最小巡检直接相关的文档
- `apps/server/`、`apps/web/`、`apps/admin/` 中与最小可观测性增强直接相关的必要代码
- 与当前轮次直接联动的状态 / review / 实现交接文档

#### 不允许修改
- 已确认的 `spec.md` / `plan.md` / `tasks.md` 边界
- 擅自把本轮扩写成监控平台、运维治理或新功能开发
- 回退并重打 D-2.6 / D-2.7 已收口结论

---

## 5. 汇报与返回规则
### 默认应返回
- 完成外部访问侧样本后
- 完成一轮扩展 burn-in 并形成明确结论后
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
- 若要继续推进必须切换为完整平台治理 / 新功能开发等新问题切片

---

## 6. 测试与验证要求
### 主链路验证
- 当前 burn-in / 巡检动作不得破坏既有 decision / narrative 主链路
- 当前观察应能区分“目标口径持续成立”与“外部访问 / 多样本场景下开始退化”
- 当前结论应建立在真实访问和真实样本，而不只是本机静态检查

### 本轮任务级验证
至少覆盖并回报：
- 外部访问侧样本结果
- 扩展后的 decision / narrative 样本结果
- narrative 是否持续 `source=provider / fallbackUsed=false`
- 若有代码改动，对应最小验证结果

### 边界 / 异常验证
- 外部访问异常时，是否可形成最小留痕
- 多样本下 decision 是否开始明显单一或异常漂移
- narrative 是否开始出现 fallback、schema 退化或语义不一致

### 最低完成标准
- 无外部访问侧样本，不算完成
- 无扩展 burn-in 样本，不算完成
- 无状态记录与结论回写，不算完成

---

## 7. 文档与状态更新要求
本轮完成后，至少同步更新：
- `sdd-status.md`
- `review.md`
- `docs/Task Bundle D-2.8 实现交接.md`
- 当前执行状态
- 下一步动作
- 是否存在阻塞

默认原则：
> 本轮不是泛泛“再看看稳不稳”，而是把外部访问侧样本与扩展 burn-in 收成新的增强证据闭环。

---

## 8. 回退规则
出现以下情况时应回退而非硬推：
- 已确认文档之间存在关键冲突
- 当前 task 定义不足以支撑继续样本补强
- 当前优化目标实际上已经变成完整平台治理 / 新功能开发
- 为满足本轮目标必须扩大到完整产品层大改

### 回退目标
- [ ] 回到 Specify
- [ ] 回到 Plan
- [ ] 回到 Tasks
- [x] 仅补充 Execution Contract

---

## 9. 完成定义
本轮 Task Bundle D-2.8 只有同时满足以下条件才算完成：
- 已覆盖本轮约定范围
- 已形成外部访问侧样本与扩展 burn-in 记录
- 已形成最小判断：仍属增强证据轮 / 已升级为新问题
- 已更新状态记录
- 无未披露关键阻塞

---

## 10. 审核结论
### 本轮审核意见
- D-2.8 的问题边界已从 D-2.7 的已收口增强项中剥离出来，并已收敛为独立入口
- 本轮已明确：外部访问侧样本、扩展 burn-in、narrative 多样本稳定性观察是当前唯一问题主轴
- 当前 execution-contract 已具备可执行版本，允许据此进入 D-2.8 implement

### 进入 Implement 前的最小执行顺序
1. 先补外部访问侧样本
2. 再补扩展 burn-in 样本
3. 最后回写 D-2.8 的 review / status / 实现交接结果

### 是否允许进入 Implement
- [x] 是
- [ ] 否
