# 执行协议（Execution Contract）

## 文档头信息
- 文档名称：execution-contract
- 当前状态：已确认
- 所属阶段：Execution Contract
- 所属项目：xiangqi-web / 网页版中国象棋项目
- 所属功能 / 子功能：Task Bundle D-2.4 执行协议（decision 真实模型接入最小闭环）
- 上游文档：spec.md, plan.md, tasks.md, review.md
- 创建时间：2026-04-09
- 最后更新时间：2026-04-09

## 关联更新检查
本文档更新后，至少检查是否需要同步更新：
- `sdd-status.md`
- `docs/Task Bundle D-2.4 实现交接.md`
- 当前执行摘要
- 必要时 `review.md`

若执行边界、权威输入、验证要求发生变化，应重新检查 handoff 条件是否仍成立。

---

## 1. 执行目标
本轮执行协议服务于 V1 实现的 **Task Bundle D-2.4（decision 真实模型接入最小闭环）**。

D-2.3 已完成 review 收口并已推送远端。当前不回流扩写 D-2.3，也不把“narrative 文案质量优化”“完整 secret 安全方案”“完整连通性平台”混入这一轮，而是只把 **decision 真实模型接入** 做成最小闭环：
1. 服务端新增 decision 真实模型决策承载位
2. 当前对局主链路继续以“合法落子优先”为硬约束
3. 当后台 `decision` 模型已配置，且 server env 中存在真实 API Key 承载位时，可尝试走真实模型生成候选步
4. 当模型未配置、env 缺失真实 API Key、超时、返回空结果、schema 非法或候选步非法时，自动回退到当前本地 decision 引擎，不中断主链路

本轮目标不是 narrative 提示词重写，不是完整并发策略打满，不是完整 secret 安全体系，而是：
> 先把“decision 能真实接上后台配置模型，失败时还能平稳退回本地决策引擎”这件事做实。

---

## 2. 本轮执行范围
### 明确包含
- 新增 server 侧 decision 生成 / 编排入口
- 让 decision 运行时读取后台 `decision` 模型配置，而不是新增第二主配置源
- 本轮允许 server env 仅承载真实 API Key；`modelName / baseUrl / enabled` 仍继续读取后台 `decision` model config
- 对真实模型输出增加规则合法性校验，不能绕过规则层直接落子
- 保持当前 `GameService` / `DecisionResult` 主链路结构不被破坏
- 保持模型失败、超时、空结果、schema 非法、候选步非法时 fallback 到现有本地 decision 引擎
- 为真实 decision 调用失败记录最小日志或错误摘要，便于后续回看
- 补齐与上述链路直接相关的测试、验证与状态回写

### 明确不包含
- narrative 模型外接重做
- 演绎文案质量专项优化
- 完整 secret 安全持久化体系重构
- 完整模型连通性测试平台
- `maxConcurrentAiGames` 在真实模型链路中的完整限流兑现
- 搜索型棋力引擎化改造
- Bundle C 已通过部分的大回炉重写
- D-2.3 范围回流扩写

### 对应任务范围
- 任务组：任务组 E（D-2.4 增量切片）
- 当前轮次定位：Task Bundle D-2.4 / Implement + Review 回收
- 对应任务：围绕对局 AI 决策主链路与后台模型配置约束形成增量闭环，不视为 narrative / 平台化能力全部完成

---

## 3. 默认执行方式
### 执行模式
- [x] 阶段性汇报
- [ ] 静默执行为主
- [ ] 高频同步（仅特殊情况）

### 默认说明
- 默认由主会话直接实现并回收本轮 D-2.4 切片
- 普通调试、局部试错、小范围结构调整不需要逐条同步
- 完成最小闭环、出现关键阻塞、发现范围漂移或需要用户拍板时再回报

---

## 4. 实现执行编排信息
### 执行代理
- 执行者：主会话直接实现
- 会话策略：单 repo + 单轮次 + 单 task bundle
- 当前 repo / cwd：xiangqi-web
- 当前轮次：项目启动 / Task Bundle D-2.4
- 当前 task bundle：Task Bundle D-2.4（decision 真实模型接入最小闭环）

### 本轮目标
- 完成 decision 真实模型入口的 server 化
- 保持对局主链路合法性不回退
- 完成“已配置走真实模型 / 失败时回退本地 decision 引擎”的闭环
- 保持 narrative、规则合法性与当前页面主链路稳定

### 权威输入
#### 必读文档
- `spec.md`
- `plan.md`
- `tasks.md`
- `review.md`
- `execution-contract.md`
- `sdd-status.md`
- `docs/Task Bundle D-2.4 实现交接.md`

#### 当前轮次直接依据
- `spec.md` 中对局 AI 合法落子、后台模型配置与未配置状态的相关约束
- `plan.md` 中 AI decision 层与后台配置服务的结构边界
- `apps/server/src/domain/game/game-service.ts` 中当前 `decisionEngine.decide()` 的调用主链路
- `apps/server/src/domain/ai/decision/standard-ai-decision.ts` 中当前本地启发式 decision 逻辑
- D-2.1 / D-2.2 已完成的模型配置与未配置状态能力
- D-2.3 已完成的 provider URL / env / schema / fallback 最小经验
- 当前后台 `ModelConfig` 现状仅保留 `apiKeyMaskedHint`，不保存可供运行时直接消费的真实 API Key；因此本轮若采用 env 落地，只能作为 server 侧真实密钥承载位，而不改写后台配置作为 `modelName / baseUrl / enabled` 主来源的地位

若历史上下文、旧实现想法或未确认草案与以上文档冲突，以以上文档为准。

### 修改边界
#### 允许修改
- `apps/server/`
- `apps/web/`
- `packages/shared/`
- `tests/`
- 与当前轮次直接联动的状态 / 交接文档

#### 不允许修改
- 已确认的 `spec.md` / `plan.md` / `tasks.md` 边界
- 与当前切片无关的大重构
- 擅自扩写新的实现范围以“顺手做掉后续内容”
- 为追求“更强棋力”直接改造成复杂搜索引擎项目

---

## 5. 汇报与返回规则
### 默认应返回
- 完成 Task Bundle D-2.4 后
- 出现关键阻塞时
- 发现需要调整 Plan / Tasks / Contract 时
- 出现范围漂移风险时
- 当前切片只能部分完成时

### 默认不返回
- 普通调试过程
- 单条命令细节
- 小范围失败尝试
- 局部重命名与细碎清理

### 立即返回条件
出现以下情况必须立即返回：
- 关键前提不成立
- 需要扩大已确认范围
- 需要改动 Plan 级方案
- 当前 task 定义不足以继续执行
- 需要用户拍板
- 当前代码现状与权威文档严重不一致
- 核心验证失败且无法快速收敛
- 若要继续推进必须引入新的 provider SDK / 敏感配置机制，而当前项目无现成承载位
- 若发现仅靠 env 落地仍不足以满足“后台 decision 模型已配置即可运行”的既定口径，需要先回到当前执行协议修订，而不是直接扩写到完整 secret 持久化体系

---

## 6. 测试与验证要求
### 主链路验证
- 后台 decision 配置存在且 server env 中存在真实 API Key 时，系统可尝试走真实 decision 生成
- decision 结果需满足当前对局主链路的合法性要求
- decision 生成失败、超时、空结果、schema 非法、候选步非法，或 env 缺失真实 API Key 时，会稳定 fallback 到本地 decision 引擎
- 对局主链路不因真实 decision 接入而断裂
- narrative 展示与页面主链路不回退

### 回归验证
本轮已执行并通过：
- 与 decision 生成、合法性校验、fallback 直接相关的集成测试
- 必要的 server / integration 测试
- `npm test`（33/33 通过）
- `npm run build`（通过）

### 最低完成标准
- 无验证结果，不算完成
- 无法执行验证时，必须说明原因、影响范围与剩余风险

---

## 7. 文档与状态更新要求
本轮完成后，至少同步更新：
- `sdd-status.md`
- 当前验证结果摘要
- 当前执行状态
- 下一步动作
- 是否存在阻塞

默认原则：
> 代码改完不等于 handoff 完成；只有代码、验证、状态卡和当前结论形成一致闭环，才算本轮 handoff 完成。

---

## 8. 回退规则
出现以下情况时应回退而非硬推：
- 已确认文档之间存在关键冲突
- 当前 task 定义不足以支撑继续实现
- 当前实现代价远超预期并影响阶段策略
- 为满足本轮目标必须扩大到 narrative 重做、完整 secret 体系或 provider 层重构

### 回退目标
- [ ] 回到 Specify
- [ ] 回到 Plan
- [ ] 回到 Tasks
- [x] 回到 Execution Contract / 当前交接边界修订

---

## 9. 完成定义
本轮 Task Bundle D-2.4 只有同时满足以下条件才算完成：
- 已覆盖本轮约定范围
- 已形成真实代码改动
- 已完成必要验证
- 已更新状态记录
- 无未披露关键阻塞
- 明确说明是否已形成 decision 真实模型接入最小闭环
- 明确说明 narrative 是否仍保持当前链路（默认应保持）

---

## 10. 审核结论
### 本轮审核意见
- D-2.3 已完成 review 收口并形成远端稳定快照
- 当前已决定进入 D-2.4，且本轮已按约定范围完成实现与验证
- `docs/Task Bundle D-2.4 实现交接.md` 已作为 handoff 文档被实际消费并回收
- 当前执行协议已完成其本轮职责，可直接支撑稳定快照提交与远端同步

### 是否允许进入 Implement
- [x] 是
- [ ] 否
