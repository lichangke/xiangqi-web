import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

function AdminApp() {
  return (
    <main className="admin-shell">
      <section className="panel">
        <p className="tag">Task Bundle A / 管理端骨架</p>
        <h1>后台管理前端入口已就位</h1>
        <p>
          本轮先建立独立管理端壳层，后续 Bundle D 将继续补齐模型配置、运行策略与审计摘要页面。
        </p>
        <ul>
          <li>后端已具备管理员创建用户 / 禁用用户 / 重置密码基础 API</li>
          <li>模型配置表与运行策略表已在 schema 中落盘</li>
          <li>V1 仍保持“模型业务配置只允许后台来源”的约束</li>
        </ul>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>,
);
