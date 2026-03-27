# Task Bundle C 特殊事件统一 Schema 草案

## 文档定位
- 文档类型：事件 Schema 草案
- 适用范围：Task Bundle C AI 演绎升级（V1）
- 当前状态：草案
- 最后更新时间：2026-03-27

## 1. 文档目的
本文件用于定义 V1 中“特殊事件”进入演绎链路时的统一结构。

它主要回答四个问题：
1. 非法步、悔棋、将军、认输、终局等事件，是否使用一套统一结构
2. 统一结构中哪些字段是所有事件都必须带的
3. 哪些字段允许按事件类型扩展
4. 这些事件如何稳定进入统一时间线，而不是退化成零散提示

## 2. 总体结论
当前建议：

> V1 的特殊事件全部共用一套统一 Schema，并允许在统一主干之上，为个别事件增加少量可选扩展字段。

也就是说：
- 不为每种事件拆一套完全不同的数据结构
- 但也不要求所有事件强行塞进完全相同的细字段里
- 采用“统一主干 + 少量按类型扩展”的方式

这样更适合 V1：
- 前端接入简单
- 演绎 AI 消费简单
- 测试与 fallback 更稳定
- 后续扩展事件类型成本更低

## 3. 适用事件范围
V1 当前建议纳入以下特殊事件：
- `illegal_move`
- `undo`
- `check`
- `resign`
- `finish`

如后续补充：
- `draw`
- `timeout`
- `reconnect_notice`

也应优先复用同一主干 Schema，而不是另起炉灶。

## 4. 统一主干结构
建议所有特殊事件统一使用 `EventNarrativePayload`。

```json
{
  "eventId": "string",
  "eventType": "illegal_move | undo | check | resign | finish",
  "eventAtTurn": 12,
  "eventActor": "USER | AI | SYSTEM",
  "eventSemanticTag": "string",
  "eventReason": "string",
  "stateImpact": "string",
  "narrativeGoal": "string",
  "relatedMove": {},
  "storyThreadSummary": {},
  "extensions": {}
}
```

## 5. 必填字段建议

## 5.1 eventId
- 事件唯一标识
- 用于前端时间线去重、日志追踪、调试定位

## 5.2 eventType
表示当前是哪一类特殊事件。

V1 固定枚举：
- `illegal_move`
- `undo`
- `check`
- `resign`
- `finish`

## 5.3 eventAtTurn
- 表示事件归属到哪个回合节点
- 对于非法步这类“未推进回合”的事件，也应挂到当前尝试回合号

## 5.4 eventActor
表示事件的主要触发方。

建议取值：
- `USER`
- `AI`
- `SYSTEM`

### 示例
- 非法步：通常为 `USER`
- 悔棋：通常为 `USER`
- 将军：可能是 `USER` 或 `AI`
- 终局：也可由 `SYSTEM` 归档输出

## 5.5 eventSemanticTag
表示该事件在叙事上的归类标签。

示例：
- 非法步：`军议否决`
- 悔棋：`推演回拨`
- 将军：`正面施压`
- 认输：`主动收局`
- 终局：`胜负已定`

### 原则
- 它是事件侧的语义标签
- 不和普通回合的 `userMoveTag / aiMoveTag` 强行混用
- 但同样属于“结构化叙事解释层”

## 5.6 eventReason
- 由系统基于事实生成的简短原因说明
- 不允许 AI 自造规则原因

示例：
- `该走法未通过规则校验`
- `本次操作回退上一完整回合`
- `本手已形成将军`
- `用户主动认输`
- `将/帅已无合法脱困路径`

## 5.7 stateImpact
描述该事件对当前棋局状态造成了什么影响。

示例：
- `棋盘保持原状，当前回合未推进`
- `棋局回退到上一完整回合后的状态`
- `对方进入被将军状态`
- `当前对局立即结束`

## 5.8 narrativeGoal
告诉演绎 AI：这条事件文案最核心要完成什么。

示例：
- `以克制方式说明该方案被否决`
- `强调局势被回拨而非简单撤销`
- `突出压迫感与局势紧迫度`
- `给出收束感而非单纯播报`

## 6. 通用可选字段建议

## 6.1 relatedMove
当事件与某一步具体操作有关时，建议带上：

```json
{
  "from": "b3",
  "to": "b8",
  "pieceType": "炮"
}
```

### 适用
- 非法步
- 将军
- 终局前关键着法（可选）

## 6.2 storyThreadSummary
- 用于保持事件演绎也能接在整局故事线上
- 不让事件文案像孤立弹框

## 6.3 extensions
用于承接按事件类型差异化的附加信息。

原则：
- 统一主干外的差异都放这里
- 前端与演绎 AI 可以按 `eventType` 读取
- 不污染统一主干字段

## 7. 按事件类型的扩展字段建议

## 7.1 illegal_move
建议扩展：
```json
{
  "validationStage": "rule_check",
  "rejectedBy": "SYSTEM"
}
```

### 说明
- 第一版不需要复杂错误码体系直接暴露给演绎层
- 只要能说明“被规则否决”即可

## 7.2 undo
建议扩展：
```json
{
  "undoCountUsed": 2,
  "undoCountRemaining": 3,
  "rollbackScope": "last_full_turn"
}
```

### 说明
- 悔棋是产品体验重点之一
- 该事件不应只显示“已撤销”，而应能解释“回拨了哪一层”

## 7.3 check
建议扩展：
```json
{
  "checkedSide": "RED",
  "sourceMove": {}
}
```

## 7.4 resign
建议扩展：
```json
{
  "winner": "AI",
  "loser": "USER"
}
```

## 7.5 finish
建议扩展：
```json
{
  "winner": "RED",
  "loser": "BLACK",
  "finishReason": "checkmate"
}
```

### 第一版建议的 finishReason
- `checkmate`
- `resign`
- `rule_settlement`

## 8. 演绎 AI 输入约束
特殊事件进入演绎 AI 时，应遵守：
- 事件事实必须已由系统判定完成
- 演绎 AI 只能基于 `eventType + eventSemanticTag + eventReason + stateImpact + storyThreadSummary + extensions` 生成文本
- 演绎 AI 不能自己补写不存在的规则理由
- 演绎 AI 不能把事件重新改写成普通回合口吻

## 9. 前端统一消费建议
前端仍建议统一转成 timeline item：

```json
{
  "id": "string",
  "kind": "event",
  "eventType": "illegal_move",
  "title": "string",
  "summary": "string",
  "tone": "warning",
  "highlightLevel": "medium",
  "segments": [],
  "meta": {
    "turnNumber": 12,
    "actor": "USER"
  }
}
```

### 原则
- 事件项仍然走统一时间线
- 只是 `kind=event`
- 前端可按 `eventType` 轻微调整视觉权重，但不另起一套展示系统

## 10. fallback 建议
如果事件演绎生成失败：
- 仍必须产出统一事件项
- 不允许事件在时间线中消失
- fallback 文案可简短，但必须保留：
  - 事件是什么
  - 为什么发生
  - 对局面造成了什么影响

### 例：非法步 fallback
- `军议否决：该走法未通过规则校验，棋盘保持原状。`

### 例：悔棋 fallback
- `推演回拨：已撤销上一完整回合，当前回到上一个判断点。`

## 11. 示例

## 11.1 非法步示例
```json
{
  "eventId": "evt-001",
  "eventType": "illegal_move",
  "eventAtTurn": 12,
  "eventActor": "USER",
  "eventSemanticTag": "军议否决",
  "eventReason": "该走法未通过规则校验",
  "stateImpact": "棋盘保持原状，当前回合未推进",
  "narrativeGoal": "以克制方式说明方案被否决",
  "relatedMove": {
    "from": "b3",
    "to": "b8",
    "pieceType": "炮"
  },
  "storyThreadSummary": {
    "currentPhase": "对压期",
    "mainConflict": "黑方持续施压，红方正在寻找稳局路径"
  },
  "extensions": {
    "validationStage": "rule_check",
    "rejectedBy": "SYSTEM"
  }
}
```

## 11.2 悔棋示例
```json
{
  "eventId": "evt-002",
  "eventType": "undo",
  "eventAtTurn": 16,
  "eventActor": "USER",
  "eventSemanticTag": "推演回拨",
  "eventReason": "本次操作回退上一完整回合",
  "stateImpact": "棋局回退到上一完整回合后的状态",
  "narrativeGoal": "强调局势被回拨而不是简单撤销",
  "storyThreadSummary": {
    "currentPhase": "抢势期",
    "mainConflict": "双方仍在争夺主动，局面尚未定型"
  },
  "extensions": {
    "undoCountUsed": 2,
    "undoCountRemaining": 3,
    "rollbackScope": "last_full_turn"
  }
}
```

## 12. 测试建议
至少应覆盖：
1. 所有事件类型都能通过统一 Schema 校验
2. 非法步与悔棋能稳定进入时间线而不是只留提示
3. extensions 缺失时，主干字段仍可支撑最小演绎
4. fallback 下仍能产出完整事件项
5. 不同事件类型不会因为共用 Schema 而互相污染字段含义

## 13. 当前待确认事项
1. `finishReason` 第一版是否只保留 `checkmate / resign / rule_settlement`
2. `eventSemanticTag` 是否要收敛成固定枚举表并单独成文
3. `extensions` 是否要进一步限制成按事件类型的白名单字段
4. 前端是否需要对 `illegal_move / undo / finish` 设置更高视觉权重

## 14. 当前结论
本草案的核心结论是：

> Task Bundle C 的特殊事件在 V1 中应采用“统一主干 Schema + 少量按类型扩展字段”的方式接入演绎链路，从而保证非法步、悔棋、将军、认输、终局都能稳定进入同一时间线，并被演绎 AI 以受控方式生成事件文本。

本文件当前仍为草案，待后续进一步确认后，再决定是否正式并入输入输出契约与执行协议。