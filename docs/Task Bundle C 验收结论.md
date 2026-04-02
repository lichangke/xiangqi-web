# Task Bundle C 验收结论

## 文档定位
- 文档类型：阶段性验收结论
- 适用范围：Task Bundle C（演绎展示与移动端体验）
- 当前状态：有效
- 最后更新时间：2026-04-03

## 1. 当前结论
当前建议将 Task Bundle C 判定为：**短人工复核已通过，且当前已形成稳定快照，可进入 Review / Acceptance 判断。**

更准确地说：
- 技术验收：通过
- 二轮修正自动验证回收：已完成
- 围绕模板化的极窄精修：已完成
- 极窄精修后的自动验证：已完成
- 短人工复核：通过
- 稳定快照整理：已完成
- 当前阶段结论：Bundle C 当前已不只是“语义上可收口”，而是已经形成稳定快照；下一步应判断是否进入 Review / Acceptance

本结论的含义是：
当前 Bundle C 已不再卡在“统一时间线是否成立”“模板化是否仍明显不过线”“是否还需要继续极窄精修”，也不再卡在“工作树尚未形成稳定快照”。当前已确认：合法落子、`illegal_move`、`undo` 与移动端主链路均已过线；围绕“演绎模板化”最刺眼的那批问题，也已完成最后一轮窄精修并在短人工复核中得到“通过，可以收口”的明确结论。随后相关代码、测试与状态文档又已进一步收成稳定快照。

因此，当前正确口径已经从：
> 短人工复核已通过，Bundle C 可以阶段性收口

切换为：
> 短人工复核已通过，Bundle C 已形成稳定快照，可进入 Review / Acceptance 判断

另一个需要继续保持明确的口径是：当前代码虽然存在“决策 AI / 演绎 AI”的文档命名，但**实际实现并未接入外部大模型**。
当前真实落地仍应理解为：
- 决策层：规则引擎 + 启发式评分 + 结构化解释生成
- 演绎层：结构化输入 + 本地模板生成 / fallback

因此，本轮通过结论并不依赖“是否已接入 LLM”，而是基于当前本地模板层已经不再明显模板化到影响 Bundle C 收口判断，且仓库层面已整理出稳定快照。

## 2. 本轮已验证内容
### 代码实现已真实落盘
当前已确认二轮修正与最后一轮极窄精修相关真实代码改动涉及以下链路：
- apps/server/src/domain/ai/decision/standard-ai-decision.ts
- apps/server/src/domain/game/game-service.ts
- apps/server/src/domain/game/types.ts
- apps/server/src/domain/rules/xiangqi-rule-adapter.ts
- apps/web/src/App.tsx
- apps/web/src/presentation.ts
- packages/shared/src/index.ts
- tests/integration/auth-and-game-api.spec.ts
- tests/web/presentation.spec.ts
- 与当前收口直接相关的状态 / 验收文档

### 二轮修正与极窄精修自动验证结果
已由主会话直接执行并确认：
- `npm run build --workspace @xiangqi-web/server` → 通过
- `npm run build` → 通过
- `npm run db:generate` → 通过
- `npm run db:push` → 通过
- `npx vitest run tests/integration/auth-and-game-api.spec.ts` → 10/10 通过
- `npm test` → 21/21 通过
- 极窄精修后的追加回归：`npm test` 再次通过（21/21）
- 极窄精修后的追加回归：`npm run build` 再次通过
- 稳定快照整理时追加验证：`npm test` 再次通过（21/21）
- 稳定快照整理时追加验证：`npm run build` 再次通过

### 抽样复核与短人工复核结果
根据 2026-03-31 的主会话抽样复核与随后完成的短人工复核，当前已确认：
1. 事件叙述模板化已显著下降，不再主要表现为同一套句模轮流套 `illegal_move` / `undo` / `check`
2. turn 的 review / consensus / decision / highlight 连续回合同口型问题继续下降
3. 选句逻辑已从“主要随 turnNumber 命中”调整为“更多随回合语义特征命中”，相似回合不再稳定撞同一批句子
4. 用户已完成短人工复核，并明确给出“通过，可以收口”结论

## 3. 与上一轮相比的阶段变化
当前已经确认以下变化：
- Task Bundle C 不再停留在“演绎质量仍明显不过线、必须继续极窄精修”的口径
- 事件叙述模板化、turn 的 consensus / decision / review 首句骨架与 highlight 收尾重复感，均已继续下压
- 选句逻辑已改为更多受回合语义特征影响，而不只是简单随 turn 编号轮转
- 当前人工判断已从“继续精修 / 待短人工复核”切换为“通过，可以收口”
- 当前仓库状态已从“语义上可收口、快照待收稳”切换为“稳定快照已形成”

因此当前 Bundle C 的主要问题不再是“模板化是否过线”或“工作树如何收稳”，而是：
- **下一步应先进入 Review / Acceptance，还是转入后续增量工作**

## 4. 当前唯一待处理项
### 待处理项：决定稳定快照之后的阶段动作
当前不再存在新的演绎质量未决问题。
当前剩余的不是“还要不要继续精修”或“何时形成稳定快照”，而是：
- 是否基于当前稳定快照正式进入 Review / Acceptance
- 若暂不进入，后续应先转入 Bundle D 还是增量 SDD

## 5. 结论口径（当前推荐版本）
若当前需要对项目内做阶段结论，建议使用以下口径：

> Task Bundle C 二轮修正与围绕模板化的最后一轮极窄精修均已完成真实代码改动，并已通过构建验证、数据库链路验证、集成测试与全量测试回收。
> 当前已确认统一时间线主链路成立，`illegal_move`、`undo` 与移动端主链路均已过线；同时事件叙述与 turn 层模板化问题已继续下压，并已通过短人工复核。
> 当前相关代码、测试与状态文档也已整理为稳定快照。
> 因此，Task Bundle C 当前已形成稳定快照，可进入 Review / Acceptance 判断。

## 6. 下一步建议
下一步不再继续打磨 Bundle C 文案，也不再把重点放在“收稳工作树”上，而是：
1. 基于当前稳定快照，判断是否进入 Review / Acceptance
2. 若进入，则补齐对应 review / acceptance 材料
3. 若暂不进入，则明确后续是 Bundle D 还是增量 SDD

## 7. 当前提醒
当前应明确区分：
- **当前已完成项：Bundle C 稳定快照已形成**
- **当前待判断项：下一阶段动作尚未确定**
