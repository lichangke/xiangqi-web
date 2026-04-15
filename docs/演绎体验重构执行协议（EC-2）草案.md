# 演绎体验重构执行协议（EC-2）草案

## 文档头信息
- 文档名称：演绎体验重构执行协议（EC-2）草案
- 当前状态：草案中
- 所属阶段：Execution Contract
- 所属项目：xiangqi-web / 网页版中国象棋项目
- 所属功能 / 子功能：角色驱动的话剧式连续演绎重构 / EC-2 / Task Bundle P-2（server 普通回合 Narrative V2 主链）
- 上游文档：docs/演绎体验重构增量规格.md, docs/演绎体验重构实施方案.md, docs/演绎体验重构任务拆解.md
- 创建时间：2026-04-14
- 最后更新时间：2026-04-14

## 关联更新检查
本文档更新后，至少检查是否需要同步更新：
- `sdd-status.md`
- 当前执行摘要
- 必要时 `docs/演绎体验重构任务拆解.md`

若执行边界、汇报规则、验证要求发生变化，应重新检查当前实现是否仍按有效协议推进。

---

## 1. 执行目标
本轮 execution-contract 服务于“演绎体验重构”增量重构的第二个实现切片：
先把 **server 侧普通回合 Narrative V2 主链** 跑通，让普通合法回合能够返回接近目标体验的新结构，并让 `StoryState` 在普通回合链路中形成最小闭环。

本轮目标不是完成最终 UI 展示，也不是完成特殊事件迁移，而是先让后端主链具备：
- 新普通回合 request / response 组装
- `StoryState` 在普通回合中的持续使用 / 更新
- 角色出场与对白组织的最小闭环
- 返回结构不再依赖旧四段式假设

---

## 2. 本轮执行范围
### 明确包含
- 在 `apps/server/src/domain/ai/narrative/narrative-service.ts` 中建立普通回合 Narrative V2 主链
- 为普通回合组装新的 request 输入，显式消费：
  - 当前事实结果
  - `StoryState`
  - active roles / role hints
  - 普通回合 Narrative V2 目标结构
- 落地 Task T11 / T12 / T13 对应的最小实现：
  - 普通回合 Narrative V2 request / response 组装
  - `StoryState` 在普通回合中的规则化延续 / 更新接线
  - Role Casting & Dialogue Planning 最小闭环
- 在 `apps/server/src/routes/narrative.ts` 中做必要的最小 schema / route 对齐（仅当本轮主链需要）
- 若本轮 server 返回结构导致 web 类型消费断裂，允许在 `apps/web/src/presentation.ts` 做**最小类型消费适配**，但不进入新展示结构实现
- 若本轮实现确需 shared 契约补一两个小字段 / 小类型对齐，允许在 `packages/shared/src/index.ts` 做**最小补充**，但不重开 P-1

### 明确不包含
- `apps/web/src/App.tsx` 的展示结构改造
- `apps/web/src/styles.css` 的新样式实现
- 特殊事件结构迁移（illegal_move / undo / check / finish 的 V2 事件结构）
- `apps/server/src/domain/ai/narrative/narrative-fallback.ts` 的 fallback-v2 重做
- provider 参数档位 / timeout / thinkingLevel 收口
- 多供应商复杂调度、后台配置重做
- Prisma 层改动

### 对应任务范围
- 任务组：Task Bundle P-2
- 对应任务：T11、T12、T13
- 进入前提：EC-1 已完成并回收（当前已满足）

---

## 3. 默认执行方式
### 执行模式
- [x] 阶段性汇报
- [ ] 静默执行为主
- [ ] 高频同步（仅特殊情况）

### 默认说明
- 当前 bundle 已有明确上游输入与真实代码锚点；
- 执行中不需要频繁打断；
- 完成整个 P-2 后统一回收；
- 若发现普通回合 Narrative V2 无法在当前边界内落地，立即返回，不硬推到前端展示层或特殊事件层。

---

## 4. 实现执行编排信息
### 执行代理
- 执行者：推荐独立实现会话承接；若运行时仍不稳定，可由主会话按同一边界直接执行
- 会话策略：单任务隔离（同 repo / 同轮次 / 同 task bundle，不复用跨 bundle 混杂上下文）
- 模型：default
- 推理强度：high

### 当前执行范围
- 当前轮次：演绎体验重构增量 / EC-2
- 当前 task bundle：P-2（server 普通回合 Narrative V2 主链）
- 本次目标：让普通合法回合先能返回 Narrative V2 结构
- 本次明确不做：前端最终展示层、特殊事件、fallback-v2、成本 / timeout 收尾

### 权威输入
- 必读文档：
  - spec: `docs/演绎体验重构增量规格.md`
  - plan: `docs/演绎体验重构实施方案.md`
  - tasks: `docs/演绎体验重构任务拆解.md`
  - execution-contract: `docs/演绎体验重构执行协议（EC-2）草案.md`
  - sdd-status: `sdd-status.md`
- 补充材料：
  - `apps/server/src/domain/ai/narrative/narrative-service.ts`
  - `apps/server/src/routes/narrative.ts`
  - `apps/server/src/domain/ai/decision/standard-ai-decision.ts`
  - `packages/shared/src/index.ts`
  - `apps/web/src/presentation.ts`
- 若历史上下文与上述文档冲突，以本文档列出的权威输入为准。

### 修改边界
- 当前 repo / cwd：`/root/.openclaw/workspace/xiangqi-web`
- 允许修改目录 / 文件：
  - `apps/server/src/domain/ai/narrative/narrative-service.ts`
  - `apps/server/src/routes/narrative.ts`（仅限普通回合主链所需的最小对齐）
  - `apps/server/src/domain/ai/decision/standard-ai-decision.ts`（仅限 T12 所需的最小配合调整）
  - `packages/shared/src/index.ts`（仅限普通回合 V2 主链所需的最小契约补充，不重做 P-1）
  - `apps/web/src/presentation.ts`（仅限普通回合返回结构变化导致的最小类型消费适配，不进入新展示结构实现）
- 禁止修改目录 / 文件：
  - `apps/web/src/App.tsx`
  - `apps/web/src/styles.css`
  - `apps/server/src/domain/ai/narrative/narrative-fallback.ts`
  - `apps/server/prisma/**`
  - 任意与特殊事件迁移、fallback-v2、前端新卡片结构直接相关的大块实现文件
- 不允许擅自做出的结构性变更：
  - 不允许把当前 bundle 顺手扩大到 P-3 / P-4 / P-5
  - 不允许顺手推动移动端首屏 / 弱事实尾注最终 UI 方案落地
  - 不允许因主链实现方便而越界改 App / styles / Prisma

---

## 5. 汇报与返回规则
### 默认应返回
- 完成整个 Task Bundle P-2 后
- 出现关键阻塞时
- 普通回合 Narrative V2 只能部分完成时
- 发现需要改动 `apps/web/src/App.tsx`、`apps/server/src/domain/ai/narrative/narrative-fallback.ts` 或 Prisma 层时
- 发现必须回退到 Tasks / Plan 重新收边界时

### 默认不返回
- 普通调试过程
- 小范围 request / response 形状试探
- 局部角色出场顺序调整
- 单条命令细节

### 立即返回条件
出现以下情况时必须立即返回：
- 普通回合 Narrative V2 无法在当前契约下表达，只能先改前端主展示层才能继续
- `StoryState` 的普通回合更新规则需要回退到 Plan / Tasks 重新定义
- 为完成 P-2 被迫改动 `App.tsx`、`styles.css`、`narrative-fallback.ts` 或 Prisma
- 当前代码现状与已确认的 spec / plan / tasks 严重不一致
- 当前 bundle 需要并入 P-3 才能成立

### 返回内容
- 当前卡点 / 当前完成情况
- 已尝试动作
- 推荐方案
- 已完成项 / 未完成项
- 修改文件列表
- 执行命令
- 验证结果
- 风险 / 阻塞

---

## 6. Coding Agent 权限边界
### 允许
- 按 T11、T12、T13 推进 server 普通回合 Narrative V2 主链
- 让普通合法回合返回新结构
- 小范围必要类型对齐
- 运行必要 build / typecheck / 测试

### 不允许
- 擅自修改已确认增量规格、实施方案或任务拆解边界
- 擅自扩大到 P-3 / P-4 / P-5
- 直接开始前端新展示结构实现
- 直接重写 fallback-v2
- 跳过验证直接宣称完成

---

## 7. 测试与验证要求
### 主链路验证
- 普通合法回合接口已能返回 Narrative V2 方向的新结构
- `StoryState` 已在普通回合链路中被消费，并在至少最小闭环内持续更新
- server / web 不因普通回合主链改造出现明显类型断裂

### 任务级验证
- T11 → 普通回合 request / response 已不再依赖旧四段式假设
- T12 → `StoryState` 在普通回合连续更新成立
- T13 → active roles / speaker order / 收束职责已形成最小闭环

### 建议验证命令
按以下顺序执行并记录结果：
1. `npm run build --workspace @xiangqi-web/shared`
2. `npm run build --workspace @xiangqi-web/server`
3. `npm run build --workspace @xiangqi-web/web`
4. 若已补到对应测试入口，补跑相关测试；若没有明确测试入口，再补最小人工样本验证

### 边界 / 异常验证
- 连续 3～5 回合时，`StoryState` 不应停留在固定默认值
- 普通回合新结构不应再只是旧 review / voices / consensus / decision 模板的机械换皮
- 若当前 provider 返回不稳定，本轮允许暂时保留既有 fallback，但不得把 fallback-v2 一并做掉

### 最低完成标准
- 无验证结果，不算完成
- 若只能生成新 request 但无法稳定解析 / 返回，不算完成
- 若只能靠前端最终展示改造才能证明结构成立，不算完成

---

## 8. 文档与状态更新要求
每完成当前 task bundle，至少同步更新：
- `sdd-status.md`
- 当前任务状态
- 当前验证情况
- 下一步动作
- 是否存在阻塞

默认原则：
> 实现执行返回不等于当前任务组已正式完成；必须先回收并回写文档，再决定是否进入 EC-3。

---

## 9. 回退规则
出现以下情况时应回退而非硬推：
- 当前 tasks 对 P-2 的边界定义仍不足以继续执行
- 普通回合 Narrative V2 无法在不进入 P-3 的情况下形成最小可验证闭环
- 现有 `StoryState` 设计不足以支撑普通回合主链，需要回退到 Tasks / Plan 重新收口

### 回退目标
- [ ] 回到 Specify
- [ ] 回到 Plan
- [x] 回到 Tasks
- [ ] 仅补充 Execution Contract

---

## 10. 完成定义
本轮当前 task bundle 只有同时满足以下条件才算完成：
- 已覆盖 T11、T12、T13 的约定范围
- 已形成真实代码改动
- 已完成必要验证（至少完成 shared / server / web build；必要时补最小人工样本或测试）
- 普通合法回合返回结构已形成 Narrative V2 最小闭环
- `StoryState` 已在普通回合主链中被真实消费并持续更新
- 已记录哪些内容明确留待 P-3 / P-4 / P-5
- 无未披露关键阻塞

---

## 11. 审核结论
### 本轮审核意见
- 当前 EC-1 / P-1 已完成并回收；EC-2 的进入前提已满足；
- 当前 P-2 的目标、代码锚点、验证方式与禁止越界边界已具备；
- **从内容充分性看，当前 EC-2 已基本具备进入 Implement 的条件。**
- **从阶段规则看，仍需用户明确确认后，才能正式切入 EC-2 的实现执行。**

### 是否允许进入 Implement
- [x] 是
- [ ] 否

### 当前判断
- **从内容充分性看：当前 EC-2 已具备进入 Implement 的条件。**
- **待用户明确确认后，可正式执行 EC-2 / Task Bundle P-2。**
