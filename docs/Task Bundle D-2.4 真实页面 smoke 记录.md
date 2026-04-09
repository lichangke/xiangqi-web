# Task Bundle D-2.4 真实页面 smoke 记录

## 文档定位
- 文档类型：真实页面 smoke 记录
- 适用范围：Task Bundle D-2.4（decision 真实模型接入最小闭环）
- 当前状态：已确认
- 创建时间：2026-04-09
- 最后更新时间：2026-04-09

## 1. 目标
在自动化测试之外，补一轮 **真实页面最小 smoke**，确认 D-2.4 不只是 server / integration 层闭环成立，而且前台页面真实落子后，decision provider 也能在页面主链路中被命中，而不是只剩 fallback。

## 2. smoke 环境
### 页面入口
- 用户端：`http://127.0.0.1:5173`
- 管理端：`http://127.0.0.1:5174`
- 服务端：`http://127.0.0.1:3000`

### 账号
- 管理员：`admin / admin123`
- 普通用户：`demo / demo123`

### 临时 smoke 配置
为避免依赖外部真实 provider 稳定性，本轮页面 smoke 采用 **本地 mock decision provider**：
- mock 地址：`http://127.0.0.1:19001/v1`
- server env 临时注入：`DECISION_API_KEY="smoke-decision-key"`
- 后台 `decision` model config 临时改为：
  - `modelName = smoke-decision`
  - `baseUrl = http://127.0.0.1:19001/v1`
  - `enabled = true`

说明：
- 本轮 smoke 目标是确认“页面主链路能否真实命中 provider”，不是验证外部线上 provider 的可用性
- smoke 结束后，已恢复 `.env` 与后台 `decision` 配置到原口径

## 3. 第一次尝试中暴露的问题
第一次页面 smoke 一度出现：
- server 日志记录 `bundle-d24-decision-server-fallback`
- `failureReason = fetch failed`

后续复盘确认：
- 这不构成“页面层一定打不到 provider”的结论
- 根因主要是当时 smoke 过程不够收敛：中途混入了页面点击试错、接口直调、重启 server、切换 `.env` 与 mock provider 的动作，导致样本不够干净
- 因此后续重新做了一轮单链路、可归因的页面 smoke

## 4. 第二次 smoke 实际步骤
### 步骤 1：确认 mock provider 本身可用
直接向 `http://127.0.0.1:19001/v1/chat/completions` 发请求，返回正常 JSON，说明 mock provider 可用。

### 步骤 2：确认后台配置已切到 mock provider
管理员登录管理端后，将 `decision` 配置切到本地 mock provider，并确认保存成功。

### 步骤 3：确认 server 侧可命中 provider
在 server 侧提交一手新的合法用户走法：
- 用户：`b1 -> c3`

返回结果中，AI 应手为：
- `h1 -> f1`

更关键的是，返回载荷中的：
- `aiMove.decision.situationShift = 页面 smoke：mock provider 已返回合法应手。`

这说明：
- 请求已真实到达 provider
- provider 返回内容已被 server 解析
- provider 返回的 `reason` 已真实进入 `DecisionResult`
- 当前不是 fallback 结果

### 步骤 4：回到真实页面确认展示层命中
重新打开用户端页面并登录 `demo` 后，在真实页面讨论区中可见：
- 第 2 回合：`你方 马 b1→c3，AI 炮 h1→f1。`
- 且“简评”正文中出现：
  - `页面 smoke：mock provider 已返回合法应手。`

这一步证明的不只是接口层，而是：
> 页面真实展示链路已经把 provider 命中的内容带到了用户可见层。

## 5. 页面命中证据
### 证据 1：mock provider 日志
本地 mock provider 日志出现：
- `POST /v1/chat/completions HTTP/1.1 200`

### 证据 2：server 返回载荷
server 返回中包含：
- `aiMove.from = h1`
- `aiMove.to = f1`
- `aiMove.decision.situationShift = 页面 smoke：mock provider 已返回合法应手。`

### 证据 3：页面讨论区展示
用户端页面真实显示：
- `你方 马 b1→c3，AI 炮 h1→f1。`
- 讨论区正文中含：`页面 smoke：mock provider 已返回合法应手。`

## 6. smoke 结论
本轮 D-2.4 真实页面 smoke 结论如下：

1. **页面主链路成立**
   - 用户端可正常登录、进入当前对局并完成真实落子
   - AI 可正常返回一手合法应手
   - 页面不会因 decision provider 接入而中断

2. **页面层 provider 命中成立**
   - provider 请求真实发出并被 mock 服务接收
   - provider 返回结果被 server 解析并进入 `DecisionResult`
   - provider 返回的 `reason` 已真实出现在页面时间线展示中

3. **fallback 并非唯一页面结果**
   - 先前出现的 `fetch failed` 只是第一次 smoke 样本不干净，不构成“页面层无法命中 provider”的结论
   - 重新收敛后的 smoke 已确认：页面层 provider 命中可以成立

## 7. 当前仍保留的边界
- 本轮 smoke 使用的是本地 mock provider，不是外部线上真实 provider
- 因此本轮确认的是：
  - **页面主链路可以真实命中 provider**
  - 不是“线上外部 provider 在任意环境下都已完全稳定”
- 若后续继续推进，可再单独补：
  - 外部真实 provider 的页面层稳定命中验证
  - 更高阶 decision 输入契约 / 提示词 / 棋力体验专项

## 8. 收尾说明
- `.env` 已恢复原样
- 后台 `decision` model config 已恢复到 smoke 前口径
- 临时 mock provider 与临时 smoke server 已停止
- 本文档结论已可用于回写 `review.md` 与 `sdd-status.md`
