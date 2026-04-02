# 执行协议（Execution Contract）

## 文档头信息
- 文档名称：execution-contract
- 当前状态：已确认
- 所属阶段：Execution Contract
- 所属项目：xiangqi-web / 网页版中国象棋项目
- 所属功能 / 子功能：Task Bundle C 二轮修正执行协议
- 上游文档：spec.md, plan.md, tasks.md
- 创建时间：2026-03-27
- 最后更新时间：2026-03-28

## 关联更新检查
本文档更新后，至少检查是否需要同步更新：
- `sdd-status.md`
- `docs/Task Bundle C 实现交接.md`
- 当前执行摘要
- 必要时 `review.md`

若执行边界、权威输入、验证要求发生变化，应重新检查 handoff 条件是否仍成立。

---

## 1. 执行目标
本轮执行协议服务于 V1 实现的 **Task Bundle C 二轮修正**。

上一轮 Bundle C 已完成真实代码实现与技术验证，但人工走查未通过，因此本轮目标不是进入 Bundle D，也不是继续补草案，而是：
1. 在现有合法对局闭环之上，落地独立标准 AI 决策层与结构化解释输出
2. 让普通回合与特殊事件真正统一进入同一演绎时间线
3. 用已确认的输入输出契约、剧情线程摘要与成本策略完成一轮更稳定的演绎体验升级
4. 在不破坏合法落子、主题切换与手机端可用性的前提下，补齐 Bundle C 的体验缺口

---

## 2. 本轮执行范围
### 明确包含
- 落地独立标准 AI 决策层，稳定输出：`chosenMove / userMoveTag / aiMoveTag / situationShift / turnArc / storyThreadSummary`
- 在需要时补充可选字段：`highlightReason / riskLevel / pressureSide`
- 让普通回合与特殊事件共用统一时间线容器与统一 schema 转换链路
- 重点补齐 `illegal_move`、`undo` 进入演绎时间线的闭环
- 校验或补齐 `resign`、`check`、`finish` 在统一时间线中的表现一致性
- 按已确认契约落地演绎输入输出结构、schema 校验与 fallback
- 以系统规则化方式维护 `storyThreadSummary`，保持单份当前线程状态摘要滚动更新
- 按已确认成本策略落地普通回合 / 高光事件的分层调用与失败日志记录
- 做必要测试、回归验证与状态回写

### 明确不包含
- Bundle D 的主题偏好持久化、重新登录恢复、最近对局摘要
- 后台模型配置、运行策略、审计摘要、未配置状态闭环
- 新的多级 AI 链路或独立“标签 AI”
- 复杂训练体系、搜索型引擎化改造、无上限棋力追求
- 把未确认草案当作当前轮次实现依据

### 对应任务范围
- 任务组：任务组 C
- Task Bundle：Task Bundle C
- 当前轮次定位：Task Bundle C 二轮修正 / Implement handoff
- 对应任务：T13（独立决策层增强轮次）、T21（展示层消费与必要小补充）、T32、T33

---

## 3. 默认执行方式
### 执行模式
- [x] 阶段性汇报
- [ ] 静默执行为主
- [ ] 高频同步（仅特殊情况）

### 默认说明
- 默认以单个隔离 Coding Agent 会话执行本轮 Bundle C 修正
- 普通调试、局部样式微调、小范围试错不需要逐条同步
- 完成本轮 bundle、出现关键阻塞、发现范围漂移或需要用户拍板时再回报

---

## 4. 实现执行编排信息
### 执行代理
- 执行者：待创建的隔离 Coding Agent 会话
- 会话策略：单 repo + 单轮次 + 单 task bundle 隔离
- 当前 repo / cwd：xiangqi-web
- 当前轮次：项目启动 / Task Bundle C 二轮修正
- 当前 task bundle：Task Bundle C

### 本轮目标
- 完成独立标准 AI 决策层与结构化解释输出
- 完成特殊事件并入统一演绎时间线
- 完成 `storyThreadSummary` 系统规则化维护
- 完成演绎契约 / fallback / 成本策略的落地实现
- 保持已通过主链路无明显回归

### 权威输入
#### 必读文档
- `spec.md`
- `plan.md`
- `tasks.md`
- `execution-contract.md`
- `sdd-status.md`
- `docs/Task Bundle C 实现交接.md`

#### 当前轮次直接依据
- `docs/Task Bundle C 人工走查结果.md`
- `docs/Task Bundle C 验收结论.md`
- `docs/Task Bundle C 双 AI 协作链路.md`
- `docs/Task Bundle C 剧情线程摘要.md`
- `docs/Task Bundle C 演绎输入输出契约.md`
- `docs/Task Bundle C 成本与调用策略.md`
- `docs/Task Bundle C 人工走查清单.md`

若历史上下文、旧实现想法或未确认草案与以上文档冲突，以以上文档为准。

### 修改边界
#### 允许修改
- `apps/web/`
- `apps/server/`
- `packages/shared/`
- `tests/`
- 与当前轮次直接联动的状态 / 交接文档

#### 不允许修改
- Bundle D 相关用户数据与后台能力
- 已确认的 `spec.md` / `plan.md` 边界
- 与当前 bundle 无关的大重构
- 擅自扩写新的实现范围以“顺手做掉后续内容”

---

## 5. 汇报与返回规则
### 默认应返回
- 完成 Task Bundle C 二轮修正后
- 出现关键阻塞时
- 发现需要调整 Plan / Tasks / Contract 时
- 出现范围漂移风险时
- 当前 bundle 只能部分完成时

### 默认不返回
- 普通调试过程
- 单条命令细节
- 局部样式修改
- 小范围失败尝试

### 立即返回条件
出现以下情况必须立即返回：
- 关键前提不成立
- 需要扩大已确认范围
- 需要改动 Plan 级方案
- 当前 task 定义不足以继续执行
- 需要用户拍板
- 当前代码现状与权威文档严重不一致
- 核心验证失败且无法快速收敛

### 返回内容
- 当前完成情况 / 当前卡点
- 已尝试动作
- 修改文件列表
- 执行命令
- 验证结果
- 未完成项 / 风险 / 阻塞
- 推荐下一步

---

## 6. Coding Agent 权限边界
### 允许
- 按当前已确认文档执行 Task Bundle C 二轮修正
- 做小范围必要调整
- 做合理局部重构
- 运行必要验证
- 修复实现中直接暴露的小问题（前提是不扩大范围）

### 不允许
- 擅自修改已确认 Spec
- 擅自进入 Bundle D
- 引入新的多级 AI 结构或后台配置闭环
- 跳过验证直接宣称完成
- 用历史会话里的未确认内容覆盖当前落盘文档

---

## 7. 测试与验证要求
### 主链路验证
- 合法落子 → AI 合法应对 → 时间线更新正常
- 决策层能稳定产出必需字段
- 普通回合与特殊事件都能进入统一时间线
- 非法步与悔棋不再只停留在提示区
- 主题切换与手机端主链路无明显回归

### 任务级验证
- 决策层输出包含：`chosenMove / userMoveTag / aiMoveTag / situationShift / turnArc / storyThreadSummary`
- `storyThreadSummary` 更新符合单份当前线程状态摘要约束
- `illegal_move`、`undo` 可形成独立时间线项
- fallback 在超时 / 非 JSON / schema 非法时可稳定触发
- 记录“失败原因 + 回合类型 + 事件类型”的组合日志

### 回归验证
至少执行并回报：
- `tests/web/presentation.spec.ts`
- `tests/integration/auth-and-game-api.spec.ts`
- `npm test`
- `npm run build`

### 人工验收建议
若条件允许，应按 `docs/Task Bundle C 人工走查清单.md` 再做一轮人工走查；若当前无法实做人工走查，也必须明确哪些项仍待用户真实设备确认。

### 最低完成标准
- 无验证结果，不算完成
- 无法执行验证时，必须说明原因、影响范围与剩余风险

---

## 8. 文档与状态更新要求
本轮完成后，至少同步更新：
- `sdd-status.md`
- 当前验证结果摘要
- 当前执行状态
- 下一步动作
- 是否存在阻塞

默认原则：
> 代码改完不等于 handoff 完成；只有代码、验证、状态卡和当前结论形成一致闭环，才算本轮 handoff 完成。

---

## 9. 回退规则
出现以下情况时应回退而非硬推：
- 已确认文档之间存在关键冲突
- 当前 task 定义不足以支撑继续实现
- 当前实现代价远超预期并影响阶段策略
- 为满足本轮目标必须扩大到 Bundle D 或 Plan 级改动

### 回退目标
- [ ] 回到 Specify
- [ ] 回到 Plan
- [ ] 回到 Tasks
- [x] 回到 Execution Contract / 当前交接边界修订

---

## 10. 完成定义
本轮 Task Bundle C 二轮修正只有同时满足以下条件才算完成：
- 已覆盖本轮约定范围
- 已形成真实代码改动
- 已完成必要验证
- 已更新状态记录
- 无未披露关键阻塞
- 明确说明是否已具备重新做人工走查的条件

---

## 11. 审核结论
### 本轮审核意见
- 已按当前状态卡恢复到 Bundle C，不进入 Bundle D
- 已将新的实现交接材料落盘为 `docs/Task Bundle C 实现交接.md`
- 当前执行协议已切换到 Task Bundle C 二轮修正，可直接用于新的隔离 Coding Agent handoff

### 是否允许进入 Implement
- [x] 是
- [ ] 否