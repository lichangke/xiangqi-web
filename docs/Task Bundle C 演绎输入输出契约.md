# Task Bundle C 演绎输入输出契约

## 文档定位
- 文档类型：输入输出契约
- 适用范围：Task Bundle C AI 演绎升级（V1）
- 当前状态：已确认
- 最后更新时间：2026-03-27

## 1. 文档目的
本文件用于定义：
- 系统在调用 AI 演绎层前，必须先整理出什么样的结构化输入
- AI 必须返回什么样的结构化输出
- 普通回合与特殊事件如何统一进入前端时间线
- AI 失败或超时时，系统如何降级而不破坏主链路

本文件的目标不是设计 prompt 具体措辞，而是先把 **协议边界** 写死。

## 2. 硬边界
### 2.1 AI 不拥有事实判定权
AI 不能决定：
- 合法 / 非法
- 将军 / 终局
- 悔棋是否允许
- 当前轮到谁
- 最终落子是否合法
- 是否吃子 / 是否结束

这些事实必须全部由系统先计算，再作为结构化输入提供给 AI。

### 2.2 AI 只输出可展示文本与结构化段落
AI 返回内容只能用于：
- 普通回合演绎
- 特殊事件演绎
- 标题、摘要、分段内容、语气、亮点级别

AI 不得返回会直接影响业务状态的字段。

### 2.3 普通回合与特殊事件必须进入统一时间线
前端最终消费的数据模型，不应把“普通回合”和“特殊事件”拆成两套互不相干的展示系统。

统一原则：
- timeline item 可分为 `turn` 与 `event`
- 但前端时间线容器只有一套
- 特殊事件不再只是顶部提示 / banner，应能进入演绎时间线

## 3. 系统输入总模型
建议系统先统一构造一个 `NarrativeRequestEnvelope`，再根据类型分发给 AI。

### 3.1 顶层结构建议
```json
{
  "schemaVersion": "v1",
  "requestId": "string",
  "gameContext": {},
  "themeContext": {},
  "roleContext": {},
  "itemType": "turn | event",
  "itemPayload": {},
  "constraints": {},
  "fallbackPolicy": {}
}
```

## 4. 双 AI 协作边界
### 4.1 决策 AI
在人机对战中，机器落子本来就应由“决策 AI”基于棋盘局势生成。因此当前建议是：
- 机器最终落子由决策 AI 生成
- 与该次落子一并产出结构化叙事解释
- 这些结构化解释包括但不限于：
  - `userMove.semanticTag`
  - `aiMove.semanticTag`
  - `situationShift`
  - `turnArc`
  - `highlightReason`

也就是说：
> `semanticTag` 与 `situationShift` 优先由决策 AI 顺带产出，而不是再额外引入一个单独的“标签 AI”。

### 4.2 演绎 AI
演绎 AI 只消费以下内容：
- 决策 AI 输出的结构化叙事解释
- 剧情圣经
- 角色卡
- 当前主题
- 最近几回合的剧情线程摘要

演绎 AI 负责把这些结构化输入写成最终用户可见的剧情文本，但不重新决定机器怎么下，也不重新判定事实。

### 4.3 上下文隔离原则
- 决策 AI 的上下文以棋局事实、对局历史、策略目标为主，不应让它直接承担完整文案生成任务
- 演绎 AI 的上下文以剧情圣经、角色卡、结构化解释与剧情线程摘要为主，不应让它直接决定棋怎么下

## 5. 公共上下文字段
### 5.1 gameContext
建议至少包含：
- `gameId`
- `turnNumber`
- `userSide`
- `aiSide`
- `difficulty`
- `gameStatus`
- `isCheck`
- `isGameEnding`
- `storyThreadSummary`（最近几回合剧情主线摘要）

### 5.2 themeContext
建议至少包含：
- `storyThemeId`：例如 `border-council-night`
- `storyThemeName`：例如“边关夜议”
- `themeTone`
- `doNotUseStyles`（禁用表达）

### 5.3 roleContext
建议至少包含：
- `activeRoles`：本次允许出场的 2～4 个角色
- `roleCardsVersion`
- `roleHints`：按角色给出的发言倾向摘要

### 5.4 constraints
建议至少包含：
- `maxChars`
- `segmentCount`
- `language`
- `mustStayGroundedInFacts`（固定 true）
- `allowWorldExpansion`（V1 固定 false）
- `mustReturnJson`（固定 true）

### 5.5 fallbackPolicy
建议至少包含：
- `fallbackMode`：`template-minimal`
- `timeoutMs`
- `onSchemaInvalid`
- `onEmptyResponse`

## 6. 普通回合输入契约
### 6.1 itemType
```json
"itemType": "turn"
```

### 6.2 itemPayload（turn）建议字段
```json
{
  "turnNumber": 12,
  "userMove": {
    "from": "b3",
    "to": "b4",
    "pieceType": "炮",
    "semanticTag": "试探"
  },
  "aiMove": {
    "from": "h8",
    "to": "h7",
    "pieceType": "炮",
    "semanticTag": "压迫"
  },
  "capture": false,
  "checkState": {
    "before": false,
    "after": false
  },
  "situationShift": "局面仍在试探阶段，尚未进入强压收束",
  "narrativeGoal": "解释这一回合在剧情上的推进意义"
}
```

### 6.3 turn 输入要求
- `userMove` 与 `aiMove` 必须都来自系统已确认事实
- `semanticTag` 建议优先由决策 AI 在固定枚举内顺带产出，而不是由演绎 AI 自行推断
- `situationShift` 建议由决策 AI 基于棋盘全局与这一来一回的局势变化直接给出
- `storyThreadSummary` 负责补足整场演绎的连续性，避免演绎 AI 每回合像重新开机

## 6. 特殊事件输入契约
### 6.1 itemType
```json
"itemType": "event"
```

### 6.2 事件类型建议
V1 至少支持：
- `illegal_move`
- `undo`
- `resign`
- `check`
- `finish`

### 6.3 itemPayload（event）建议字段
```json
{
  "eventType": "illegal_move",
  "eventAtTurn": 12,
  "eventActor": "USER",
  "relatedMove": {
    "from": "b3",
    "to": "b8",
    "pieceType": "炮"
  },
  "eventReason": "方案未通过规则校验",
  "eventSemanticTag": "军议否决",
  "stateImpact": "棋盘保持原状，当前回合未推进",
  "narrativeGoal": "以剧情化但克制的方式说明该方案被否决"
}
```

### 6.4 特殊事件要求
- `eventType` 必须由系统枚举约束
- `eventReason` 必须基于系统事实，不允许 AI 自造事实
- 事件必须能进入统一时间线，而不只是 toast/banner

## 7. AI 输出总模型
建议 AI 固定返回 `NarrativeResponseEnvelope`。

### 7.1 顶层结构建议
```json
{
  "schemaVersion": "v1",
  "itemType": "turn | event",
  "title": "string",
  "summary": "string",
  "tone": "calm | tense | warning | decisive | elegiac",
  "highlightLevel": "low | medium | high",
  "segments": [],
  "displayHints": {}
}
```

## 8. 普通回合输出契约
### 8.1 segments（turn）建议结构
```json
[
  { "kind": "review", "label": "简评", "text": "..." },
  { "kind": "voices", "label": "发言", "text": "..." },
  { "kind": "consensus", "label": "共识", "text": "..." },
  { "kind": "decision", "label": "落子", "text": "..." }
]
```

### 8.2 turn 输出约束
- 默认 4 段
- 不允许缺失 `decision`
- `voices` 段应由 2～4 个角色短发言组成，但最终可压缩成单段文本
- `summary` 必须可用于时间线摘要

## 9. 特殊事件输出契约
### 9.1 segments（event）建议结构
V1 不强制 4 段，但建议至少包含：
- `event`
- `impact`
- `closure`

示例：
```json
[
  { "kind": "event", "label": "事件", "text": "..." },
  { "kind": "impact", "label": "影响", "text": "..." },
  { "kind": "closure", "label": "结论", "text": "..." }
]
```

### 9.2 event 输出约束
- 非法步与悔棋必须能形成独立时间线项
- 不允许事件文案写得像普通回合，只换标题
- 非法步应更接近“军议否决 / 裁断”
- 悔棋应更接近“推演回拨 / 改判”
- 终局应有收束感

## 10. 前端统一消费模型
前端建议不直接消费“AI 原始输出”，而先转换成统一时间线项，例如：

```json
{
  "id": "string",
  "kind": "turn | event",
  "title": "string",
  "summary": "string",
  "tone": "string",
  "highlightLevel": "string",
  "segments": [],
  "meta": {
    "turnNumber": 12,
    "eventType": null
  }
}
```

## 11. fallback 约定
### 11.1 触发条件
以下情况触发 fallback：
- 模型超时
- 返回非 JSON
- JSON schema 不合法
- 缺失必需字段
- 返回文本明显脱离事实

### 11.2 fallback 原则
- 保证时间线不断
- 保证普通回合和特殊事件仍可展示
- 质量降级，但不允许事实错乱

### 11.3 fallback 输出要求
fallback 仍要产出统一时间线项，只是文案由模板最小兜底生成。

## 12. 测试建议
### 12.1 契约层测试
至少应覆盖：
- turn 输入构造是否完整
- event 输入构造是否完整
- AI 输出 schema 校验
- fallback 触发条件

### 12.2 展示层测试
至少应覆盖：
- 普通回合与特殊事件都能进入同一时间线
- 非法步与悔棋不再只停留在提示区
- 缺失 AI 输出时能平稳降级

## 14. 本轮已确认事项
1. `semanticTag` 与 `situationShift` 优先由独立决策 AI 顺带产出，演绎 AI 只消费，不再引入额外单独的标签 AI
2. 决策 AI 这一版需要额外重构成独立标准 AI 决策层，而不是直接复用现有策略层
3. 第一版不强依赖独立的 `boardStateSummary` 字段，而更强调 `situationShift` + `storyThreadSummary`
4. `semanticTag` 第一版最终单步标签保留：`试探 / 抢位 / 压迫 / 解围 / 护驾 / 换子 / 佯动 / 追击 / 收束`
5. `storyThreadSummary` 默认 80～150 字、上限不超过 200 字，只保留 1 份当前线程状态摘要，并由最近 2～4 回合滚动更新形成
6. 双 AI 链路中 V1 必需字段为：`chosenMove / userMoveTag / aiMoveTag / situationShift / turnArc / storyThreadSummary`
7. V1 可选字段为：`highlightReason / riskLevel / pressureSide`
8. 特殊事件全部共用一套 schema
9. 特殊事件侧的 `eventSemanticTag` 需要收敛成固定枚举，并单独成文维护
10. 特殊事件 schema 中的 `extensions` 这一版先不限制成按事件类型的白名单字段
11. `tone` 与 `highlightLevel` 这一版先不再细化，先看效果
12. fallback 仅保留少量世界观气质、明确事件性质与克制判断口吻，不保留多角色群像、强表演感、长文案与大量意象词

## 15. 当前结论
本文件的核心结论是：

> 在 Task Bundle C 的 AI 演绎升级中，输入输出契约已固定为“独立决策 AI 产出结构化事实解释，演绎 AI 返回结构化可展示结果，并让普通回合与特殊事件统一进入同一时间线”。

本文件已作为当前轮次的已确认输入输出契约文档，可直接作为后续实现与验证的输入。