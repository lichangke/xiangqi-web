# Task Bundle D-2.4 实现交接

## 文档定位
- 文档类型：实现交接
- 适用范围：Task Bundle D-2.4（decision 真实模型接入最小闭环）
- 当前状态：草案中
- 创建时间：2026-04-09
- 最后更新时间：2026-04-09

## 1. 本轮交接目标
在不扩写到完整模型平台、完整 secret 安全体系、完整连通性测试平台与大规模提示词打磨的前提下，完成 **Task Bundle D-2 的第四段**，让当前对局 AI 的 decision 从“本地启发式合法步打分”推进到“可优先尝试真实模型决策，失败时自动回退当前本地决策引擎”。

本轮只做四件事：
1. 新增 decision 的 server 侧真实模型决策承载位
2. 保持当前合法性校验与最终落子主链路不被破坏
3. decision 模型已配置，且 server env 中存在真实 API Key 承载位时，优先尝试真实模型生成候选落子
4. 失败时回退到当前本地 `StandardAiDecisionEngine` / fallback 决策路径，不打断对局主链路

一句话目标：
> 先把“对局 AI 真正接进 decision 模型，但不让合法落子与主链路因此变脆”这件事做实。

---

## 2. 对应任务范围
### 对应任务
- 本轮属于 D-2 的增量切片，不单独视为完整 Task Bundle D / E 收口
- 主要承接：
  - FR-004 ~ FR-017（对局 AI 决策主链路）
  - FR-023 ~ FR-027（模型配置与未配置状态约束）

### 当前实际切片
本轮交付不是整个 decision 系统重写，也不是完整博弈引擎升级，而是其第四段：**D-2.4 / decision 真实模型接入最小闭环**。

### 明确包含
- 识别当前对局 AI 决策入口在 `apps/server/src/domain/game/game-service.ts` → `StandardAiDecisionEngine`
- 将真实 decision 生成能力补到 server 侧承载位
- 允许 decision 运行时读取后台 `decision` model config，而不是新增第二主配置源
- 本轮允许 server env 仅承载真实 API Key；`modelName / baseUrl / enabled` 仍继续读取后台 `decision` model config
- 真实模型输出必须先过规则合法性校验，不能直接绕过规则层落盘
- 模型未配置、env 缺失真实 API Key、调用失败、超时、空结果、schema 非法或候选步非法时自动 fallback 到当前本地 decision 引擎
- 为 decision provider 成功 / 失败保留最小可观察日志或错误摘要
- 补齐必要测试、联调与状态文档

### 明确不包含
- narrative 提示词重写
- 演绎文案质量专项优化
- 完整 secret 持久化 / 加密体系
- 完整模型连通性测试平台
- 并发治理平台
- 搜索型象棋引擎大改造
- 把 D-2.3 narrative 链路重做一遍
- 顺手把 decision / narrative 一起升级成完整平台

---

## 3. 当前问题定义
本轮新专项的根因已经确认，不再停留在“AI 好像不够聪明”的主观表述：

1. 当前对局 AI 的 decision 链路实际仍走本地启发式打分
2. 后台虽然已有 `decision` 配置与启用状态，但当前对局主链路并未真正消费该配置去调用 provider
3. 因此页面上感受到的“对局 AI 智能不足”，根因首先是 **decision 尚未真实接入模型**，而不是单纯 prompt 不佳

所以，本轮不是“顺手优化 AI 不聪明”，而是：
> **把 decision 真实模型接入缺失，正式收敛成一个独立最小闭环专项。**

---

## 4. 交付完成定义
只有同时满足以下条件，才算 D-2.4 完成：

1. **真实 decision 接入成立**
   - 后台 `decision` 模型已配置且启用时，可尝试真实 decision 生成
   - server env 中存在 decision 运行所需真实 API Key 承载位
   - provider 返回结果能被当前 server 侧 decision 解析层吸收

2. **合法性闭环成立**
   - 真实模型返回的候选步必须经过规则层合法性校验
   - 非法候选步不能直接进入对局结果
   - 对局主链路仍保证“AI 最终落子合法”这一硬约束

3. **fallback 闭环成立**
   - 未配置 / 超时 / 失败 / schema 非法 / 空响应 / 非法候选步时，会自动退回当前本地 decision 引擎
   - 用户端不会因为真实 decision 接入失败而出现回合中断

4. **边界控制成立**
   - 本轮不强绑 narrative 文案质量问题一起收口
   - 不扩写到完整 provider / secret / 并发治理平台
   - 不把象棋棋力追求无限上纲成搜索引擎改造项目

5. **验证闭环成立**
   - 至少有与 decision 生成、合法性校验、fallback 退回对应的自动化验证或集成验证
   - `npm test` 与 `npm run build` 不回退
   - 若条件允许，补一轮最小真实页面 smoke：用户下一回合后，AI 真实走出一手合法应对

6. **文档与状态回写成立**
   - `sdd-status.md` 已同步到 D-2.4 当前轮入口
   - 必要时更新 `review.md` 或新增 D-2.4 的验收记录入口

---

## 5. 建议实现顺序
1. 先补 decision 运行时承载位与最小 server 侧入口
2. 再接后台 `decision` model config 的读取与调用编排
3. 再定义“模型输出 → 候选步解析 → 规则合法性校验 → 最终落子 / fallback”的闭环
4. 最后补测试并做主链路回归

---

## 6. 关键边界提醒
- 当前轮是 **D-2.4**，不是“完整模型平台”
- decision 真实接入 ≠ narrative 也要一起重做
- 本轮若采用 env，仅将其用于 server 侧真实 API Key 承载；不要把 env 扩写成完整 provider 主配置源
- 不要删掉当前本地 `StandardAiDecisionEngine`；它是本轮 fallback 的基础
- 不要为了“更聪明”直接绕过规则层；合法性约束优先于模型自由发挥
- 若发现必须改 Plan / Tasks 级边界才能继续，应先返回，不要自行扩大范围

---

## 7. 权威输入
### 必读文档
- `spec.md`
- `plan.md`
- `tasks.md`
- `execution-contract.md`
- `sdd-status.md`
- `review.md`
- 本文档 `docs/Task Bundle D-2.4 实现交接.md`

### 重点参考
- `apps/server/src/domain/game/game-service.ts` 中当前对局 AI 决策主链路
- `apps/server/src/domain/ai/decision/standard-ai-decision.ts` 中当前本地 decision 决策实现
- `apps/server/src/domain/auth/auth-service.ts` 中后台 `decision` 模型配置与状态口径
- `apps/server/src/config.ts` 中当前 env 读取方式
- D-2.1 / D-2.2 已完成的后台模型配置与未配置状态能力
- D-2.3 已形成的 provider 解析、fallback、日志与最小 env 承载经验

若旧会话理解与以上文档冲突，以当前落盘文档为准。

---

## 8. 验证建议
至少覆盖：
- `decision` 模型已配置且 server env 中存在真实 API Key 时，可尝试真实 decision 生成
- 真实模型返回候选步后，会经过规则层合法性校验
- schema 非法 / 空响应 / 超时 / 抛错 / env 缺失真实 API Key / 非法候选步时会 fallback 到当前本地 decision 引擎
- AI 最终落子仍然合法，不破坏对局主链路
- 必要的 server / integration 测试
- `npm test`
- `npm run build`

若有条件，补最小人工冒烟：
- 管理员已配置 decision 模型 → 用户完成一回合 → AI 返回合法应手
- decision provider 失败 → 页面仍能看到 fallback 后的合法应手，而不是主链路中断

---

## 9. 当前交接结论
- 当前 D-2.4 边界已清楚
- 当前适合由主会话直接实现并回收
- 当前明确只接 decision，不把 narrative 文案质量一起打包收口
- 当前必须保留规则合法性与 fallback 决策链路，不允许为了“真实接入”牺牲对局稳定性
