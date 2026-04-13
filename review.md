# Review / 验收结论

## 文档头信息
- 文档名称：review
- 当前状态：草案中
- 所属阶段：Review
- 所属项目：xiangqi-web / 网页版中国象棋项目
- 所属功能 / 子功能：Task Bundle D-2.7 Review / Acceptance（网页实测 burn-in / 运行口径锁定）
- 上游文档：spec.md, plan.md, tasks.md, execution-contract.md, docs/Task Bundle D-2.7 实现交接.md, docs/Task Bundle D-2.7 burn-in 记录.md
- 创建时间：2026-04-13
- 最后更新时间：2026-04-13

## 关联更新检查
本文档形成结论后，至少检查是否需要同步更新：
- `sdd-status.md`
- `execution-contract.md`
- `docs/Task Bundle D-2.7 实现交接.md`
- 是否需要继续开启下一轮 feature / task 入口文档
- 当前仓库是否已形成稳定快照

---

## 1. Review 范围
### 本轮覆盖内容
- 当前 `decision / narrative` 目标运行口径锁定
- 后台模型配置、审计摘要与服务健康检查的最小巡检入口确认
- 真实对局 API 路径下的 decision 主链路样本
- 基于真实 turn 数据的 narrative 主链路样本
- D-2.7 burn-in 记录与最小联合证据沉淀

### 对应用户故事 / FR / 任务组
- 用户故事：US3、US5、US6（以真实运行稳定性、配置一致性与体验观察为当前切入点）
- FR：FR-004 ~ FR-017、FR-023 ~ FR-031
- 任务组：Task Bundle D-2.7（网页实测 burn-in / 运行口径锁定）

---

## 2. Spec 满足度
### 总体判断
- [x] 满足（以 D-2.7 当前约定边界来看）
- [ ] 基本满足
- [ ] 不满足

### 说明
若以 **D-2.7 当前边界** 来看，本轮已经完成的关键收口是：
1. 已将 `decision / narrative` 的目标运行口径重新锁定为 `gpt-5.4 + https://codex.hiyo.top/v1` 且当前均处于启用状态；
2. 已确认服务端 `/api/health`、后台模型配置列表与审计摘要可作为本轮最小巡检与留痕入口；
3. 已通过真实对局 API 样本确认 decision 主链路持续可用，而不是只停留在旧轮次历史结论；
4. 已通过真实 `/api/narrative/resolve` 样本确认 narrative 当前为 `source=provider / fallbackUsed=false`，说明 narrative 也不是靠 fallback 伪装成立；
5. 已形成 3 条连续证据：配置/健康 → decision 主链路 → narrative 主链路。

本轮明确没有完成：
- 更长时间、多样本的连续 burn-in
- 外部设备 / 外部网络侧的新增可达性样本
- 更系统的体验退化评估
- 完整监控平台或公网稳定性治理

因此，本轮正确口径应是：
**D-2.7 边界内通过；当前已完成运行口径锁定、最小巡检与 decision / narrative 联合主链路验证。若还要继续做更强结论，应在后续追加更长时间 burn-in 或外部访问侧样本，但这不阻断当前 review 草稿形成。**

---

## 3. 用户故事完成情况
### 用户故事 3（P1）
- 完成情况：通过
- 是否可独立成立：是
- 说明：当前 decision 与 narrative 均能基于真实对局事实继续产出并落回既有展示链路，未见“只剩 decision 或只剩 fallback narrative”的断链情况。

### 用户故事 5（P2）
- 完成情况：通过
- 是否可独立成立：是
- 说明：后台模型配置仍可驱动真实运行；本轮不仅确认配置值存在，还补了审计摘要与接口级样本，说明当前口径不只是数据库静态值。

### 用户故事 6（P3）
- 完成情况：阶段性通过
- 是否可独立成立：基本成立
- 说明：本轮不是做完整监控或公网治理，而是做“最小 burn-in + 运行口径锁定”。在这一边界内当前已成立；更强的稳定性结论仍需要后续增强样本支持。

---

## 4. Tasks 完成情况
### 已完成任务
- 已确认当前 `decision / narrative` 模型配置口径：`gpt-5.4 + https://codex.hiyo.top/v1`
- 已确认两者当前均处于启用状态
- 已确认服务端 `/api/health` 正常返回
- 已确认本机 `5173 / 5174` 可达
- 已确认后台存在 `model-configs / audit-summary` 作为最小巡检入口
- 已创建 `docs/Task Bundle D-2.7 burn-in 记录.md`
- 已形成样本 #1：运行口径锁定 + 本机可达性巡检
- 已形成样本 #2：真实对局 API 下的 decision 主链路样本
- 已形成样本 #3：真实 `/api/narrative/resolve` 下的 provider narrative 样本

### 未完成任务
- 更长时间、多样本的连续 burn-in
- 外部访问侧的新增公网样本
- D-2.7 review 最终确认与稳定快照

### 偏差说明
- 本轮“可达性”证据以本机侧为主，不等于已证明公网外部访问长期稳定；
- 本轮 narrative 样本通过真实 API 验证 `source=provider / fallbackUsed=false`，但尚未补更多回合、更多事件类型的 narrative 样本；
- 当前尚未观察到必须拆出下一轮的新问题，但样本规模仍偏小。

---

## 5. 验证结果概览
### 主链路验证
- 内容：运行口径锁定、服务健康检查、真实对局 API decision 样本、真实 narrative API 样本
- 结果：通过
- 说明：当前结论建立在真实服务接口、真实数据库配置与真实返回结果之上，而非仅沿用 D-2.6 旧结论。

### 用户故事独立验证
- 后台模型口径锁定 → 通过
- 服务健康检查 → 通过
- decision 真实对局主链路 → 通过
- narrative 真实 provider 主链路 → 通过
- `source=provider / fallbackUsed=false` narrative 返回 → 通过

### 验证明细
- 样本 #1：
  - decision / narrative 当前配置均为 `gpt-5.4 + https://codex.hiyo.top/v1`
  - 两者当前均 `enabled=1`
  - `GET /api/health` 返回 `{ok:true}`
  - 本机 `5173 / 5174` 均可达
- 样本 #2：
  - 管理员创建临时用户 `smoke_1776050413`
  - 新用户登录成功，新建 `NORMAL` 对局成功
  - 用户首步 `a1 -> a2` 后，AI 应手 `b8 -> b1`
  - 返回体中 decision 结构完整，含 `userMoveTag / aiMoveTag / situationShift / storyThreadSummary`
- 样本 #3：
  - 基于样本 #2 的真实 turn 数据调用 `/api/narrative/resolve`
  - 返回 `200`
  - `source=provider`
  - `fallbackUsed=false`
  - narrative 返回标题、summary、segments 与 decision 焦点一致

### 外部阻塞 / 条件项（如有）
- 当前未发现阻断 D-2.7 当前边界 review 的外部阻塞项
- 当前仍保留的增强项是：
  - 外部访问侧新增样本
  - 更长时间 burn-in
  - 更系统的体验退化观察
这些增强项当前不阻断 review 草稿形成

---

## 6. 代码质量结构化判断
### 正确性
- 结论：通过
- 说明：当前 decision 与 narrative 两条链路都已在真实接口层跑通，未见明显断链或 fallback 冒充成功的情况。

### 可读性
- 结论：通过
- 说明：本轮主要是运行侧验证与文档沉淀，没有引入新的大块实现复杂度。

### 可维护性
- 结论：基本通过
- 说明：当前已把运行口径、证据入口与 burn-in 记录落盘，后续继续补样本不必再从零恢复；但公网访问稳定性仍缺少更正式的观测机制。

### 范围控制
- 结论：通过
- 说明：本轮严格停留在“运行口径锁定 + 最小 burn-in”，没有顺手扩写成完整平台治理或监控系统建设。

### 可验证性
- 结论：通过
- 说明：本轮具备配置、健康检查、decision、narrative 四类证据，且已形成结构化 burn-in 记录。

---

## 7. 问题与风险
- 当前公网可达性证据仍以本机侧为主，尚不足以直接推出“外部访问长期稳定”；
- 当前 burn-in 样本数量仍然偏小，尚未覆盖更多回合、更多难度或更多事件类型；
- 当前 narrative 虽已确认 `source=provider`，但尚未形成针对 schema 漂移、长回合、多事件场景的更系统观察。

---

## 8. 结论
### 总体结论
- [x] 通过（以 D-2.7 当前边界来看）
- [ ] 建议进入稳定快照收口
- [ ] 当前轮次已完全收口

### 结论说明
以 D-2.7 当前边界来看，当前已经完成：
1. 运行口径锁定
2. 最小巡检入口确认
3. decision 真实对局主链路样本
4. narrative 真实 provider 主链路样本
5. burn-in 结构化证据沉淀

因此，当前更准确的结论是：
**Task Bundle D-2.7 在当前边界内通过，已经具备形成 review 结论的最低证据。若要继续增强，可以追加外部访问样本与更长时间 burn-in；但这些更像增强项，而不是当前 review 草稿的前置阻塞。**

---

## 9. 后续建议
### 建议立即处理
- 若接受当前草稿口径，可继续把 D-2.7 review 从“草案中”收口为“已确认”
- 收口前需同步检查当前仓库未提交改动，并决定是否形成新的稳定快照

### 可放入下一轮迭代
- 外部访问侧新增样本
- 更长时间、多样本 burn-in
- 更系统的 narrative 退化 / schema 漂移观察
- 更正式的公网可达性巡检机制

---

## 10. 最终验收意见
### 用户验收意见
- 用户是否接受当前结论：待确认
- 其他验收备注：当前“通过”针对 D-2.7 当前边界；若要写成更强的公网稳定性结论，仍建议补外部访问侧样本

### 是否验收通过
- [ ] 是
- [ ] 否
- [x] 阶段性通过
