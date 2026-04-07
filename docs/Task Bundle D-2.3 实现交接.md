# Task Bundle D-2.3 实现交接

## 文档定位
- 文档类型：实现交接
- 适用范围：Task Bundle D-2.3（真实 narrative 模型接入最小闭环）
- 当前状态：已确认
- 创建时间：2026-04-04
- 最后更新时间：2026-04-04

## 1. 本轮交接目标
在不扩写到 decision 外接、完整 secret 安全体系与完整连通性平台的前提下，完成 **Task Bundle D-2 的第三段**，让当前 narrative 从“前端本地模板生成”推进到“可优先尝试真实模型生成，失败时自动回退模板 narrative”。

本轮只做四件事：
1. 新增 narrative 的 server 侧生成入口
2. 保持当前 `NarrativeRequestEnvelope` / `NarrativeResponseEnvelope` 为主契约
3. narrative 模型已配置，且 server env 中存在真实 API Key 承载位时，优先尝试真实生成
4. 失败时回退到当前模板 narrative，不打断 timeline

一句话目标：
> 先把“真实 narrative 模型接进来，但不让主链路因此变脆”这件事做实。

---

## 2. 对应任务范围
### 对应任务
- 本轮属于 D-2 的增量切片，不单独视为完整 Task Bundle D / E 收口
- 主要承接：
  - FR-018 ~ FR-022（回合演绎与特殊事件展示）
  - FR-023 ~ FR-027（模型配置与未配置状态约束）

### 当前实际切片
本轮交付不是整个 narrative 系统重写，也不是 decision 外接，而是其第三段：**D-2.3 / 真实 narrative 模型接入最小闭环**。

### 明确包含
- 识别当前 narrative 生成入口仍在 `apps/web/src/presentation.ts`
- 将真实 narrative 生成能力补到 server 侧承载位
- 允许前端或 server 侧统一调用该 narrative 入口，但最终仍返回 `NarrativeResponseEnvelope`
- turn / event 两类 narrative 都保持统一 envelope 结构
- 模型未配置、env 缺失真实 API Key、调用失败、超时、空结果、schema 非法时自动 fallback
- 为失败原因保留最小可观察日志或错误摘要
- 补齐必要测试、联调与状态文档

### 明确不包含
- decision 模型真实外接
- 规则合法性链路改写
- AI 最终落子策略重构
- 完整 secret 管理与加密体系
- 完整模型连通性测试平台
- 将当前 timeline 展示重做为另一套 UI 协议
- 把 Bundle C / D 的全部历史边界一起打满

---

## 3. 交付完成定义
只有同时满足以下条件，才算 D-2.3 完成：

1. **真实 narrative 接入成立**
   - narrative 模型已配置时，可尝试真实 narrative 生成
   - 真实 narrative 结果受统一 schema 约束

2. **fallback 闭环成立**
   - 未配置 / 超时 / 失败 / schema 非法 / 空响应时，会退回模板 narrative
   - timeline 不断裂，且不影响对局主链路

3. **边界控制成立**
   - decision 继续走当前本地链路
   - 不因 narrative 接入而污染规则正确性与合法落子链路

4. **验证闭环成立**
   - 至少有与 narrative 生成、fallback、timeline 展示对应的自动化验证或集成验证
   - `npm test` 与 `npm run build` 不回退

5. **文档与状态回写成立**
   - `sdd-status.md` 已同步
   - 必要时更新 `review.md` 或补充 D-2.3 的验收记录入口

---

## 4. 建议实现顺序
1. 先补 narrative 运行时承载位与最小 server 侧入口
2. 再接后台 narrative model config 的读取与调用编排
3. 再把前端 timeline 生成改成“优先真实 narrative，失败退模板”
4. 最后补测试并做主链路回归

---

## 5. 关键边界提醒
- 当前轮是 **D-2.3**，不是“完整模型平台”
- narrative 真实接入 ≠ decision 也要一起外接
- 本轮若采用 env，仅将其用于 server 侧真实 API Key 承载；不要把 env 扩写成完整 provider 主配置源
- 不要顺手扩写到完整 secret / provider / 连通性平台
- 不要把当前 fallback 机制删掉；它是本轮最小闭环的一部分
- 若发现必须改 Plan / Tasks 级边界才能继续，应先返回，不要自行扩大范围

---

## 6. 权威输入
### 必读文档
- `spec.md`
- `plan.md`
- `tasks.md`
- `execution-contract.md`
- `sdd-status.md`
- `review.md`
- 本文档 `docs/Task Bundle D-2.3 实现交接.md`

### 重点参考
- `apps/web/src/presentation.ts` 中当前 narrative 生成、fallback 与 timeline resolve 逻辑
- `packages/shared/src/index.ts` 中当前 narrative 契约
- `plan.md` 中 Narrative 层与后台配置服务的边界
- D-2.1 / D-2.2 已完成的后台模型配置与未配置状态能力
- 当前后台 `ModelConfig` 现状仅保留 `apiKeyMaskedHint`，不保存可供运行时直接消费的真实 API Key；因此本轮若采用 env 落地，只能作为 server 侧真实密钥承载位，而不改写后台配置作为 `modelName / baseUrl / enabled` 主来源的地位
- Task Bundle C 已形成的 narrative 输入输出契约

若旧会话理解与以上文档冲突，以当前落盘文档为准。

---

## 7. 验证建议
至少覆盖：
- narrative 模型已配置且 server env 中存在真实 API Key 时，可走真实 narrative 生成
- narrative 返回结构符合 `NarrativeResponseEnvelope`
- schema 非法 / 空响应 / 超时 / 抛错 / env 缺失真实 API Key 时会 fallback
- turn narrative 与 event narrative 都能稳定进入时间线
- `tests/web/presentation.spec.ts`
- 必要的 server / integration 测试
- `npm test`
- `npm run build`

本轮当前已完成：
- `npm test` 通过（28/28）
- `npm run build` 通过
- 真实 provider 冒烟尚待本地填写 `NARRATIVE_API_KEY` 后执行

若有条件，补最小人工冒烟：
- 管理员已配置 narrative 模型 → 用户完成一回合 → 时间线正常出现 narrative
- narrative provider 失败 → 页面仍出现 fallback timeline，而不是空白或报错中断

---

## 8. 当前交接结论
- 当前 D-2.3 边界已清楚
- 当前适合由主会话直接实现并回收
- 当前明确只接 narrative，不接 decision
- 当前必须保留 fallback narrative，不允许为了“真实接入”牺牲主链路稳定性
