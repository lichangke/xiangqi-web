import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import type {
  AdminModelConfig,
  AuditSummaryItem,
  GetAdminModelConfigsResponse,
  GetAuditSummaryResponse,
  GetRuntimePolicyResponse,
  LoginResponse,
  RegistrationMode,
  RuntimePolicySummary,
  UpdateAdminModelConfigResponse,
  UpdateRuntimePolicyResponse,
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

type RuntimePolicyDraft = {
  maxConcurrentAiGames: number;
  maxOngoingGamesPerUser: number;
  registrationMode: RegistrationMode;
  maxUndoPerGame: number;
};

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

function toRuntimePolicyDraft(policy: RuntimePolicySummary): RuntimePolicyDraft {
  return {
    maxConcurrentAiGames: policy.maxConcurrentAiGames,
    maxOngoingGamesPerUser: policy.maxOngoingGamesPerUser,
    registrationMode: policy.registrationMode,
    maxUndoPerGame: policy.maxUndoPerGame,
  };
}

function formatAuditMeta(item: AuditSummaryItem) {
  const who = item.actorUsername ? `操作者：${item.actorUsername}` : '操作者：系统';
  return `${who} · ${new Date(item.createdAt).toLocaleString('zh-CN')}`;
}

function AdminApp() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [token, setToken] = useState('');
  const [configs, setConfigs] = useState<AdminModelConfig[]>([]);
  const [drafts, setDrafts] = useState<DraftsState>({});
  const [runtimePolicy, setRuntimePolicy] = useState<RuntimePolicySummary | null>(null);
  const [runtimePolicyDraft, setRuntimePolicyDraft] = useState<RuntimePolicyDraft | null>(null);
  const [auditItems, setAuditItems] = useState<AuditSummaryItem[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savingRuntimePolicy, setSavingRuntimePolicy] = useState(false);
  const [runtimeNotice, setRuntimeNotice] = useState('');

  const hasEnabledConfig = useMemo(() => configs.some((config) => config.enabled && config.isConfigured), [configs]);

  async function loadConfigs(nextToken: string) {
    setLoadingConfigs(true);
    try {
      const [configsData, runtimePolicyData, auditData] = await Promise.all([
        requestJson<GetAdminModelConfigsResponse>('/api/admin/model-configs', {
          headers: { Authorization: `Bearer ${nextToken}` },
        }),
        requestJson<GetRuntimePolicyResponse>('/api/admin/runtime-policy', {
          headers: { Authorization: `Bearer ${nextToken}` },
        }),
        requestJson<GetAuditSummaryResponse>('/api/admin/audit-summary?limit=8', {
          headers: { Authorization: `Bearer ${nextToken}` },
        }),
      ]);

      setConfigs(configsData.configs);
      setDrafts(buildInitialDrafts(configsData.configs));
      setRuntimeNotice(configsData.modelRuntimeStatus.message ?? '后台已具备最小模型配置入口。');
      setRuntimePolicy(runtimePolicyData.runtimePolicy);
      setRuntimePolicyDraft(toRuntimePolicyDraft(runtimePolicyData.runtimePolicy));
      setAuditItems(auditData.items);
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
      setMessage('管理员登录成功，可以继续推进模型配置、运行策略与审计摘要。');
    } catch (loginError) {
      setToken('');
      setConfigs([]);
      setDrafts({});
      setRuntimePolicy(null);
      setRuntimePolicyDraft(null);
      setAuditItems([]);
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
      const auditData = await requestJson<GetAuditSummaryResponse>('/api/admin/audit-summary?limit=8', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuditItems(auditData.items);
    } catch (saveError) {
      setError(parseApiError(saveError));
    } finally {
      setSavingKey(null);
    }
  }

  async function handleSaveRuntimePolicy() {
    if (!token || !runtimePolicyDraft) {
      return;
    }

    setSavingRuntimePolicy(true);
    setError('');
    setMessage('');

    try {
      const [policyData, auditData] = await Promise.all([
        requestJson<UpdateRuntimePolicyResponse>('/api/admin/runtime-policy', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(runtimePolicyDraft),
        }),
        requestJson<GetAuditSummaryResponse>('/api/admin/audit-summary?limit=8', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setRuntimePolicy(policyData.runtimePolicy);
      setRuntimePolicyDraft(toRuntimePolicyDraft(policyData.runtimePolicy));
      setAuditItems(auditData.items);
      setMessage('已保存运行策略。');
    } catch (saveError) {
      setError(parseApiError(saveError));
    } finally {
      setSavingRuntimePolicy(false);
    }
  }

  useEffect(() => {
    document.title = token ? '象棋后台管理 / 模型配置与运行策略' : '象棋后台管理';
  }, [token]);

  if (!token) {
    return (
      <main className="admin-shell">
        <section className="panel login-panel">
          <p className="tag">Task Bundle D-2.2 / 运行策略与审计摘要</p>
          <h1>管理员登录</h1>
          <p className="muted">本轮聚焦运行策略管理与轻量审计摘要，不在这一轮混入真实模型接入。</p>
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
          <p className="tag">Task Bundle D-2.2 / 运行策略与审计摘要</p>
          <h1>后台管理</h1>
          <p className="muted">当前轮继续补齐后台管理面：模型配置保持可用，新增运行策略管理与关键审计摘要查看。</p>
        </div>
        <button type="button" className="ghost-button" onClick={() => {
          setToken('');
          setConfigs([]);
          setDrafts({});
          setRuntimePolicy(null);
          setRuntimePolicyDraft(null);
          setAuditItems([]);
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
          {runtimePolicy ? <span className="pill">注册模式：{runtimePolicy.registrationMode}</span> : null}
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

      <section className="config-grid two-wide-grid">
        <article className="panel config-card">
          <div className="config-card-head">
            <div>
              <p className="tag small-tag">Task Bundle D-2.2</p>
              <h2>运行策略</h2>
            </div>
            <span className="pill pill-success">Runtime Policy</span>
          </div>

          {runtimePolicyDraft ? (
            <div className="admin-form compact-form">
              <label>
                AI 对局并发上限
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={runtimePolicyDraft.maxConcurrentAiGames}
                  onChange={(event) => setRuntimePolicyDraft((previous) => previous ? {
                    ...previous,
                    maxConcurrentAiGames: Number(event.target.value),
                  } : previous)}
                />
              </label>

              <label>
                单账号同时进行中的对局数上限
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={runtimePolicyDraft.maxOngoingGamesPerUser}
                  onChange={(event) => setRuntimePolicyDraft((previous) => previous ? {
                    ...previous,
                    maxOngoingGamesPerUser: Number(event.target.value),
                  } : previous)}
                />
              </label>

              <label>
                注册模式
                <select
                  value={runtimePolicyDraft.registrationMode}
                  onChange={(event) => setRuntimePolicyDraft((previous) => previous ? {
                    ...previous,
                    registrationMode: event.target.value as RegistrationMode,
                  } : previous)}
                >
                  <option value="CLOSED">CLOSED</option>
                  <option value="INVITE_ONLY">INVITE_ONLY</option>
                  <option value="OPEN">OPEN</option>
                </select>
              </label>

              <label>
                每局最大悔棋次数
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={runtimePolicyDraft.maxUndoPerGame}
                  onChange={(event) => setRuntimePolicyDraft((previous) => previous ? {
                    ...previous,
                    maxUndoPerGame: Number(event.target.value),
                  } : previous)}
                />
              </label>
            </div>
          ) : <p className="muted">正在加载运行策略…</p>}

          <div className="config-meta">
            <span>策略键：{runtimePolicy?.policyKey ?? 'system'}</span>
            <span>最近更新时间：{runtimePolicy?.updatedAt ? new Date(runtimePolicy.updatedAt).toLocaleString('zh-CN') : '暂无'}</span>
          </div>

          <button type="button" disabled={savingRuntimePolicy || !runtimePolicyDraft} onClick={() => void handleSaveRuntimePolicy()}>
            {savingRuntimePolicy ? '保存中…' : '保存运行策略'}
          </button>
        </article>

        <article className="panel config-card">
          <div className="config-card-head">
            <div>
              <p className="tag small-tag">Task Bundle D-2.2</p>
              <h2>轻量审计摘要</h2>
            </div>
            <span className="pill pill-warning">最近 8 条</span>
          </div>

          <div className="audit-list">
            {auditItems.length ? auditItems.map((item) => (
              <article key={item.id} className="audit-item">
                <div className="audit-item-head">
                  <strong>{item.summary}</strong>
                  <span className="pill">{item.action}</span>
                </div>
                <p className="muted">{formatAuditMeta(item)}</p>
                <p className="hint">目标：{item.targetType}{item.targetId ? ` / ${item.targetId}` : ''}</p>
              </article>
            )) : <p className="muted">当前还没有审计摘要记录。</p>}
          </div>
        </article>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>,
);
