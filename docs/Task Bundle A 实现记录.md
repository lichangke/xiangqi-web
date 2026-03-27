# Task Bundle A 实现记录

## 本轮目标
围绕 Task Bundle A 完成以下实现：
- T01：建立单仓全栈项目骨架
- T02：设计数据库初稿与基础配置约束
- T11：接入规则适配层 baseline 并完成典型规则测试
- T12：在合理范围内推进新建对局 / 读取对局基础接口

## 实现结果
### 1. 工程骨架
已建立以下单仓结构：
- `apps/web`：用户端
- `apps/admin`：管理端
- `apps/server`：服务端
- `packages/shared`：共享类型
- `tests/rules` / `tests/integration`：规则与接口测试

### 2. 数据库与配置约束
已在 `apps/server/prisma/schema.prisma` 落下以下实体：
- `User`
- `UserPreference`
- `GameSession`
- `ModelConfig`
- `RuntimePolicy`
- `AuditLog`

并通过 Prisma migration 落盘首个初始化迁移。

当前环境变量仅承载系统级基础配置：
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`

未把模型业务配置放入 env，仍保持后台唯一业务配置源的约束。

### 3. 认证与用户管理基础
服务端已提供：
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:userId/status`
- `POST /api/admin/users/:userId/reset-password`

并提供种子账号：
- `admin / admin123`
- `demo / demo123`

### 4. 规则适配层 baseline
- 规则层统一封装在 `apps/server/src/domain/rules/xiangqi-rule-adapter.ts`
- 业务层仅面向 `RuleAdapter` 接口编程
- 本轮优先评估了 `xiangqi.js` 路线，但实际 npm registry 中未找到可直接落地的可用包；因此当前以 `elephantops` 作为可运行 baseline，通过适配层隔离具体库实现

当前适配层已提供：
- 初始局面 FEN
- 合法走法生成
- 落子合法性校验
- 落子后新局面与状态摘要
- 基础终局状态读取

### 5. 典型规则测试
已覆盖以下样例：
- 马腿
- 象眼
- 炮架（无炮架不能吃子）
- 将帅照面暴露
- 自陷将

### 6. 对局基础接口
已实现：
- `POST /api/games`：新建对局
- `GET /api/games/current`：读取当前进行中对局

当前能力聚焦 Bundle A 基线：
- 能创建并持久化一局进行中的对局
- 能读取当前进行中对局
- 已接上单账号 1 局进行中对局限制的基础校验

## 本轮验证
### 自动化验证
- `npm test`：11 个测试全部通过
- `npm run build`：shared / server / web / admin 全部构建通过

### 运行态验证
- 启动 `npm run dev:server`
- `GET /api/health` 返回正常
- 使用 `demo / demo123` 实测登录成功
- 实测新建对局成功
- 实测读取当前对局成功

## 主会话回收结论
- 已接受本轮规则 baseline 采用 `elephantops` 的实现方案。
- 当前回收结论为：Task Bundle A 可以正式收口并提交。
- 下一步默认进入 Task Bundle B，但进入前仍应按当前阶段文档继续收口范围与执行边界。

## 已知限制 / 风险
1. 规则 baseline 目前不是最初口头优先项 `xiangqi.js`，而是可替换的 `elephantops` 适配落地；后续若发现更贴近目标规则附录的库，可在不破坏业务层的前提下替换。
2. 长将 / 长捉 / 循环 / 和棋专项规则仍未进入本轮范围，后续应按 spec 继续补专项规则附录与测试集。
3. 当前前端只实现骨架与登录验证页，完整棋盘主链路留待 Bundle B 继续推进。
