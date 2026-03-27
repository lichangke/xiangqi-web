# 象棋网页版项目

## 当前状态
- 当前阶段：Implement（Task Bundle A 已完成回收并提交，待安排 Task Bundle B）
- 当前锚点文档：`sdd-status.md`
- 本轮重点：单仓全栈骨架、数据库初稿、用户名密码认证、规则适配层 baseline、新建/读取对局基础 API

## 当前目录结构
- `apps/web/`：用户端 React + Vite 骨架，含登录链路验证页
- `apps/admin/`：管理端 React + Vite 壳层
- `apps/server/`：Fastify + Prisma 服务端，含认证、用户管理、对局基础接口、规则适配层
- `packages/shared/`：共享类型与常量
- `tests/rules/`：规则适配层测试
- `tests/integration/`：认证与对局接口集成测试
- `docs/`：需求、实现记录与阶段文档

## 关键实现说明
- 技术栈保持 TypeScript 全栈单仓：React + Vite、Fastify、Prisma、SQLite。
- 模型业务配置口径未改动：当前只在数据库 schema 中预留 `ModelConfig` / `RuntimePolicy`，未引入 env-like 业务配置源。
- 规则层通过自定义 `RuleAdapter` 封装，业务层不直接依赖第三方规则库 API。
- 规则 baseline 方面，原计划优先评估 `xiangqi.js`；本轮实际排查发现 npm registry 中不存在可直接使用的 `xiangqi.js` 包，当前先以 `elephantops` 作为可运行 baseline，并保持适配层可替换。

## 开发与验证命令
```bash
npm install
npm run db:migrate
npm run db:seed
npm test
npm run build
npm run dev:server
npm run dev:web
npm run dev:admin
```

默认演示账号：
- 管理员：`admin / admin123`
- 普通用户：`demo / demo123`

## 环境变量约定
参考 `.env.example`：
- `PORT`：服务端端口
- `DATABASE_URL`：SQLite 连接串
- `JWT_SECRET`：登录签名密钥

说明：这些环境变量仅用于系统级基础配置；模型运行配置仍应以后台持久化配置为唯一业务来源。
