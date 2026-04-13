# Task Bundle D-2.7 实现交接

## 文档定位
- 文档类型：实现交接
- 适用范围：Task Bundle D-2.7（网页实测 burn-in / 运行口径锁定）
- 当前状态：已确认
- 创建时间：2026-04-13
- 最后更新时间：2026-04-13

## 1. 本轮交接目标
在 D-2.6 已正式收口、decision / narrative 两条链路都已通过网页实测与 provider token 消耗共同确认“确实调用了目标大模型”的前提下，开启新一轮 **网页实测 burn-in / 运行口径锁定**。

本轮不再回答以下旧问题：
1. `codex.hiyo.top` 应该走哪种协议；
2. provider 是否真的能命中；
3. `responses` 最终对象为空是否代表没有正文；
4. D-2.6 的 contract / implement / review / 稳定快照是否已经形成。

这些问题都已收口。本轮要回答的新问题是：
1. 当前真实网页链路在连续使用下，是否能稳定保持命中目标 provider；
2. `decision / narrative` 的后台运行口径，是否存在再次偏离当前目标配置的风险；
3. 客户端 / 管理端 / 服务端公网可达性，是否需要最小一轮巡检与留痕；
4. 当前 decision / narrative 的真实用户体验，是否存在需要作为下一轮独立切片继续下钻的问题。

一句话目标：
> 在不回退 D-2.6 已收口结论的前提下，把问题主轴切换到 **真实网页运行稳定性、配置口径一致性与最小 burn-in 观察**，并形成新的可执行入口。

---

## 2. 对应任务范围
### 当前实际切片
本轮属于 Task Bundle D 的新一轮增量切片，编号暂定为：
- **Task Bundle D-2.7 / 网页实测 burn-in / 运行口径锁定**

### 明确包含
- 梳理真实网页链路下的最小 burn-in 观察口径
- 固化当前目标运行口径（至少覆盖 `decision / narrative` 的目标模型、baseUrl、启用状态与预期 provider 路径）
- 设计或补齐最小自检 / 留痕方式，用于发现后台配置再次偏离当前目标口径
- 补一轮客户端 / 管理端 / 服务端公网可达性最小巡检与记录
- 观察真实网页体验中的 `reason / situationShift / narrative` 质量问题是否需要下钻
- 为本轮 burn-in 与运行口径锁定准备新的 execution-contract 与后续 review 入口

### 明确不包含
- 回退到 provider 协议 / baseUrl / key / 命中性排查
- 把本轮直接扩写成完整 provider 平台治理
- narrative 大重构
- 棋力专项评测或搜索型引擎化改造
- 完整运维监控平台建设
- 与当前切片无关的大范围前后端重构

---

## 3. 当前问题定义
D-2.6 已经回答并收口：
1. provider 主链路已成立；
2. decision 输入契约、prompt 约束、噪音控制与 reason 质量约束已形成真实可验证闭环；
3. 网页实测与 provider token 消耗已共同确认，decision / narrative 两条链路都已实际调用大模型。

因此，D-2.7 当前要回答的问题不再是“能不能调起来”，而是：
> **在真实网页已可用的前提下，这条链路是否足够稳定、口径是否足够锁定、是否已经暴露出下一轮值得单独切片的问题。**

本轮默认优先级：
1. 运行口径锁定
2. 网页实测 burn-in
3. 公网可达性巡检留痕
4. 体验问题抽样与分级

---

## 4. 初步完成定义
本轮后续若进入实现，至少应满足：
1. 已明确当前目标运行口径与最小核对项
2. 已形成一轮连续网页实测 / burn-in 记录，而不是单点命中样本
3. 已对客户端 / 管理端 / 服务端公网可达性形成最小巡检结论
4. 已对真实体验问题做最小分类：无需继续 / 值得继续 / 应拆新切片
5. 已形成新的 review / 状态 / 交接回写条件

### 当前建议核对项
- `GET /api/health` 可正常返回服务健康状态
- `GET /api/admin/model-configs` 可确认 `decision / narrative` 的 `modelName / baseUrl / enabled / isConfigured`
- `GET /api/admin/audit-summary` 可作为后台配置变更的最小留痕入口
- decision 成功日志继续以 `[bundle-d24-decision-provider-success]` 为主观察点，重点看 `modelName / baseUrl / wireApi / payloadSummary / responsesSummary`
- narrative 成功日志继续以 `[bundle-d23-narrative-provider-success]` 为主观察点，重点看是否持续出现 provider 成功信号
- burn-in 证据默认记录到 `docs/Task Bundle D-2.7 burn-in 记录.md`

---

## 5. 当前权威输入
### 必读文档
- `spec.md`
- `plan.md`
- `tasks.md`
- `sdd-status.md`
- `review.md`
- `execution-contract.md`
- `docs/Task Bundle D-2.6 实现交接.md`
- `docs/Task Bundle D-2.5 真实页面 smoke 记录.md`
- `docs/Task Bundle D-2.7 burn-in 记录.md`
- 本文档 `docs/Task Bundle D-2.7 实现交接.md`

### 重点事实依据
- `74fdaad《补记D-2.6网页实测排障结论》`
- 用户已通过网页实测与 provider 后台 token 消耗确认：decision / narrative 两条链路都已实际调用目标大模型
- D-2.6 当前轮次已完成 review 收口与稳定快照，不再回退旧问题

若旧会话理解与以上已落盘文档冲突，以当前文档链为准。

---

## 6. 当前交接结论
- D-2.6 已完成收口，不再承载新问题
- D-2.7 的问题主轴已切换为：**真实网页 burn-in + 运行口径锁定**
- 当前已明确两类值得进入下一轮的问题来源：
  1. **后台配置曾短暂偏离当前目标口径**，说明真实运行链路存在“配置漂移风险”而不是“协议未解”问题
  2. **客户端 / 管理端 / 服务端公网访问曾一度不可用**，说明真实用户体验还受“可达性稳定”影响，值得做最小巡检留痕
- 下一步应先收清 D-2.7 的 execution-contract，再决定是否直接进入本轮 implement

---

## 7. 下一步建议
### 建议立即处理
1. 已完成 `execution-contract.md` 收口，可据此进入 D-2.7 implement
2. 继续填写 `docs/Task Bundle D-2.7 burn-in 记录.md`
3. 用后台模型配置、审计摘要、服务健康检查与 provider 成功日志共同构成最小 burn-in 观察口径
4. 进入连续网页对局 burn-in，并回写 review / status

### 可放入本轮执行阶段的观察点
- 连续网页对局中 decision / narrative 是否持续命中目标口径
- `reason / situationShift` 是否存在明显重复、空泛或体验退化
- 公网访问异常是否可复现、是否具备最小定位线索
- 后台当前配置是否存在再次漂移风险
- `GET /api/health`、`GET /api/admin/model-configs`、`GET /api/admin/audit-summary` 是否能为当前轮提供最小可回看证据
