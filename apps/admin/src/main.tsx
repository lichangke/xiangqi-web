import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import type {
  AdminModelConfig,
  GetAdminModelConfigsResponse,
  LoginResponse,
  UpdateAdminModelConfigResponse,
} from '@xiangqi-web/shared';
import './styles.css';

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    detail?: string;
  };
};

type DraftsState = Record<string, {
  modelName: string;
  baseUrl: string;
  apiKey: string;
  thinkingLevel: string;
  enabled: boolean;
}>;

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => ({} as ApiErrorPayload));
  if (!response.ok) {
    throw payload;
  }
  return payload as T;
}

function parseApiError(error: unknown) {
  const payload = error as ApiErrorPayload;
  return payload.error?.detail ?? payload.error?.message ?? '请求失败';
}

function toDraft(config: AdminModelConfig) {
  return {
    modelName: config.modelName,
    baseUrl: config.baseUrl,
    apiKey: '',
    thinkingLevel: config.thinkingLevel,
    enabled: config.enabled,
  };
}

function buildInitialDrafts(configs: AdminModelConfig[]): DraftsState {
  return Object.fromEntries(configs.map((config) => [config.configKey, toDraft(config)]));
}

function AdminApp() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [token, setToken] = useState('');
  const [configs, setConfigs] = useState<AdminModelConfig[]>([]);
  const [drafts, setDrafts] = useState<DraftsState>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [runtimeNotice, setRuntimeNotice] = useState('');

  const hasEnabledConfig = useMemo(() => configs.some((config) => config.enabled && config.isConfigured), [configs]);

  async function loadConfigs(nextToken: string) {
    setLoadingConfigs(true);
    try {
      const data = await requestJson<GetAdminModelConfigsResponse>('/api/admin/model-configs', {
        headers: { Authorization: `Bearer ${nextToken}` },
      });
      setConfigs(data.configs);
      setDrafts(buildInitialDrafts(data.configs));
      setRuntimeNotice(data.modelRuntimeStatus.message ?? '后台已具备最小模型配置入口。');
    } finally {
      setLoadingConfigs(false);
    }
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoginLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await requestJson<LoginResponse>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (data.user.role !== 'ADMIN') {
        throw { error: { message: '当前账号不是管理员，无法进入后台配置页' } };
      }

      setToken(data.token);
      await loadConfigs(data.token);
      setMessage('管理员登录成功，可以开始补齐模型配置。');
    } catch (loginError) {
      setToken('');
      setConfigs([]);
      setDrafts({});
      setError(parseApiError(loginError));
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSave(configKey: string) {
    const draft = drafts[configKey];
    if (!draft || !token) {
      return;
    }

    setSavingKey(configKey);
    setError('');
    setMessage('');

    try {
      const data = await requestJson<UpdateAdminModelConfigResponse>(`/api/admin/model-configs/${configKey}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draft),
      });

      setConfigs((previous) => previous.map((config) => (config.configKey === configKey ? data.config : config)));
      setDrafts((previous) => ({
        ...previous,
        [configKey]: toDraft(data.config),
      }));
      setRuntimeNotice(data.modelRuntimeStatus.message ?? '至少已有一个模型配置启用，前台可继续新开对局。');
      setMessage(`已保存 ${configKey === 'decision' ? '对局决策' : '演绎'} 模型配置。`);
    } catch (saveError) {
      setError(parseApiError(saveError));
    } finally {
      setSavingKey(null);
    }
  }

  useEffect(() => {
    document.title = token ? '象棋后台管理 / 模型配置' : '象棋后台管理';
  }, [token]);

  if (!token) {
    return (
      <main className="admin-shell">
        <section className="panel login-panel">
          <p className="tag">Task Bundle D-2.1 / 后台模型配置</p>
          <h1>管理员登录</h1>
          <p className="muted">本轮先补齐模型配置管理与“未配置”状态闭环，运行策略和审计摘要留到后续子轮。</p>
          <form className="admin-form" onSubmit={handleLogin}>
            <label>
              用户名
              <input value={username} onChange={(event) => setUsername(event.target.value)} />
            </label>
            <label>
              密码
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <button type="submit" disabled={loginLoading}>{loginLoading ? '登录中…' : '进入后台'}</button>
          </form>
          <p className="muted">默认管理员账号：admin / admin123</p>
          {error ? <p className="error-text">{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell admin-app-shell">
      <section className="panel hero-panel">
        <div>
          <p className="tag">Task Bundle D-2.1 / 模型配置闭环</p>
          <h1>后台模型配置</h1>
          <p className="muted">当前先保证管理员能填写模型名称、Base URL、API Key、思考强度并启用配置；前台在未配置时会明确提示，而不是静默失败。</p>
        </div>
        <button type="button" className="ghost-button" onClick={() => {
          setToken('');
          setConfigs([]);
          setDrafts({});
          setMessage('');
          setError('');
        }}>
          退出后台
        </button>
      </section>

      {message ? <p className="banner success">{message}</p> : null}
      {error ? <p className="banner error">{error}</p> : null}
      <section className="panel status-panel">
        <h2>当前运行状态</h2>
        <p className="muted">{runtimeNotice || '正在检查模型配置状态…'}</p>
        <div className="pill-row">
          <span className={`pill ${hasEnabledConfig ? 'pill-success' : 'pill-warning'}`}>
            {hasEnabledConfig ? '已有可用模型配置' : '暂无启用中的模型配置'}
          </span>
          <span className="pill">{loadingConfigs ? '加载中…' : `配置条目 ${configs.length}`}</span>
        </div>
      </section>

      <section className="config-grid">
        {configs.map((config) => {
          const draft = drafts[config.configKey] ?? toDraft(config);
          return (
            <article key={config.configKey} className="panel config-card">
              <div className="config-card-head">
                <div>
                  <p className="tag small-tag">{config.configKey === 'decision' ? '对局决策模型' : '演绎模型'}</p>
                  <h2>{config.configKey === 'decision' ? 'Decision Config' : 'Narrative Config'}</h2>
                </div>
                <span className={`pill ${config.enabled && config.isConfigured ? 'pill-success' : 'pill-warning'}`}>
                  {config.enabled && config.isConfigured ? '已启用' : config.isConfigured ? '已配置未启用' : '未完成配置'}
                </span>
              </div>

              <div className="admin-form compact-form">
                <label>
                  模型名称
                  <input
                    value={draft.modelName}
                    onChange={(event) => setDrafts((previous) => ({
                      ...previous,
                      [config.configKey]: { ...draft, modelName: event.target.value },
                    }))}
                    placeholder="例如：gpt-4.1-mini / kimi-k2"
                  />
                </label>

                <label>
                  Base URL
                  <input
                    value={draft.baseUrl}
                    onChange={(event) => setDrafts((previous) => ({
                      ...previous,
                      [config.configKey]: { ...draft, baseUrl: event.target.value },
                    }))}
                    placeholder="https://api.example.com/v1"
                  />
                </label>

                <label>
                  API Key
                  <input
                    type="password"
                    value={draft.apiKey}
                    onChange={(event) => setDrafts((previous) => ({
                      ...previous,
                      [config.configKey]: { ...draft, apiKey: event.target.value },
                    }))}
                    placeholder={config.apiKeyMaskedHint ? `已保存：${config.apiKeyMaskedHint}（留空表示沿用）` : '首次保存时必填'}
                  />
                </label>

                <label>
                  思考强度
                  <input
                    value={draft.thinkingLevel}
                    onChange={(event) => setDrafts((previous) => ({
                      ...previous,
                      [config.configKey]: { ...draft, thinkingLevel: event.target.value },
                    }))}
                    placeholder="normal"
                  />
                </label>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(event) => setDrafts((previous) => ({
                      ...previous,
                      [config.configKey]: { ...draft, enabled: event.target.checked },
                    }))}
                  />
                  <span>保存后立即启用该配置</span>
                </label>
              </div>

              <div className="config-meta">
                <span>已保存 Key：{config.apiKeyMaskedHint || '暂无'}</span>
                <span>最近更新时间：{config.updatedAt ? new Date(config.updatedAt).toLocaleString('zh-CN') : '暂无'}</span>
              </div>

              <button type="button" disabled={savingKey === config.configKey} onClick={() => void handleSave(config.configKey)}>
                {savingKey === config.configKey ? '保存中…' : '保存配置'}
              </button>
            </article>
          );
        })}
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>,
);
