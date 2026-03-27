import { useState } from 'react';
import type { LoginResponse } from '@xiangqi-web/shared';

export function App() {
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('demo123');
  const [token, setToken] = useState('');
  const [profile, setProfile] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error?.message ?? '登录失败');
      }

      const data = payload as LoginResponse;
      setToken(data.token);

      const meResponse = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const mePayload = await meResponse.json();
      if (!meResponse.ok) {
        throw new Error(mePayload.error?.message ?? '读取用户信息失败');
      }

      setProfile(JSON.stringify(mePayload.user, null, 2));
    } catch (loginError) {
      setProfile('');
      setToken('');
      setError(loginError instanceof Error ? loginError.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Task Bundle A / 基础框架验证</p>
        <h1>象棋网页版 · 用户端骨架</h1>
        <p className="lead">
          当前页面用于验证用户名密码登录链路，后续棋盘、讨论区与对局主链路将在后续 bundle 继续补齐。
        </p>
      </section>

      <section className="grid">
        <form className="card" onSubmit={handleLogin}>
          <h2>登录演示</h2>
          <label>
            用户名
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>
            密码
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button type="submit" disabled={loading}>{loading ? '登录中…' : '登录并读取 /api/auth/me'}</button>
          {error ? <p className="error">{error}</p> : null}
        </form>

        <aside className="card status-card">
          <h2>当前状态</h2>
          <ul>
            <li>✅ 单仓全栈骨架：web / admin / server / shared</li>
            <li>✅ Prisma + SQLite schema 初稿</li>
            <li>✅ Fastify 登录接口</li>
            <li>✅ 规则适配层 baseline（优先评估 xiangqi.js；当前通过自定义适配层封装 elephantops）</li>
            <li>✅ 新建对局 / 读取当前对局 API</li>
          </ul>
          <p className="hint">默认演示账号：demo / demo123</p>
        </aside>
      </section>

      <section className="card output-card">
        <h2>登录结果</h2>
        <pre>{token ? `token: ${token}\n\nuser:\n${profile}` : '尚未登录'}</pre>
      </section>
    </main>
  );
}
