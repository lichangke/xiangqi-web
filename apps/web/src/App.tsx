import { useEffect, useMemo, useState } from 'react';
import type {
  CreateGameResponse,
  Difficulty,
  GameSummary,
  GetCurrentGameResponse,
  LoginResponse,
  ResignGameResponse,
  SubmitMoveResponse,
  ThemeKey,
  UndoGameResponse,
} from '@xiangqi-web/shared';
import {
  THEME_OPTIONS,
  buildCheckEvent,
  buildErrorEvent,
  buildFinishEvent,
  buildTimelineItems,
  buildUndoEvent,
  normalizeApiError,
  type RuntimeTimelineEvent,
} from './presentation';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] as const;
const DIFFICULTIES: Array<{ value: Difficulty; label: string }> = [
  { value: 'BEGINNER', label: '新手' },
  { value: 'NORMAL', label: '普通' },
  { value: 'HARD', label: '困难' },
  { value: 'MASTER', label: '大师' },
];

const PIECE_LABELS: Record<string, string> = {
  K: '帅',
  A: '仕',
  B: '相',
  N: '傌',
  R: '俥',
  C: '炮',
  P: '兵',
  k: '将',
  a: '士',
  b: '象',
  n: '馬',
  r: '車',
  c: '砲',
  p: '卒',
};

const STATUS_LABELS: Record<GameSummary['status'], string> = {
  ONGOING: '进行中',
  CHECKMATED: '将死',
  STALEMATE: '无子可走',
  RESIGNED: '已认输',
  DRAW: '和棋',
};

type BoardCell = {
  square: string;
  piece: string | null;
};

function parseApiError(error: unknown) {
  const normalized = normalizeApiError(error);
  return normalized.detail ?? normalized.message;
}

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw payload;
  }

  return payload as T;
}

function parseBoard(fen: string): BoardCell[][] {
  const boardFen = fen.split(' ')[0] ?? '';
  const rows = boardFen.split('/');

  return rows.map((row, rowIndex) => {
    const rank = 10 - rowIndex;
    const cells: BoardCell[] = [];

    for (const char of row) {
      const emptyCount = Number(char);
      if (!Number.isNaN(emptyCount) && emptyCount > 0) {
        for (let offset = 0; offset < emptyCount; offset += 1) {
          const file = FILES[cells.length];
          cells.push({ square: `${file}${rank}`, piece: null });
        }
        continue;
      }

      const file = FILES[cells.length];
      cells.push({ square: `${file}${rank}`, piece: char });
    }

    return cells;
  });
}

function pieceBelongsToUser(piece: string, game: GameSummary) {
  return game.userSide === 'red' ? piece === piece.toUpperCase() : piece === piece.toLowerCase();
}

function formatDifficulty(value: Difficulty) {
  return DIFFICULTIES.find((item) => item.value === value)?.label ?? value;
}

function formatGameResult(game: GameSummary | null) {
  if (!game) {
    return '暂无进行中对局';
  }

  if (!game.resultWinner) {
    return game.status === 'ONGOING' ? '未决' : '和局';
  }

  return game.resultWinner === game.userSide ? '你方领先' : 'AI 占优';
}

function getNextTimelineOrder(game: GameSummary | null, runtimeEvents: RuntimeTimelineEvent[]) {
  const completedTurns = game?.moves.length ? Math.max(...game.moves.map((move) => move.turnNumber)) : 0;
  const turnOrder = completedTurns * 2;
  const eventOrder = runtimeEvents.length ? Math.max(...runtimeEvents.map((item) => item.order)) : 0;
  return Math.max(turnOrder, eventOrder) + 1;
}

export function App() {
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('demo123');
  const [token, setToken] = useState('');
  const [currentGame, setCurrentGame] = useState<GameSummary | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [theme, setTheme] = useState<ThemeKey>('classic');
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [compactLayout, setCompactLayout] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'timeline' | 'status' | 'settings'>('timeline');
  const [runtimeEvents, setRuntimeEvents] = useState<RuntimeTimelineEvent[]>([]);
  const [revealedSegmentCounts, setRevealedSegmentCounts] = useState<Record<string, number>>({});

  const board = useMemo(() => (currentGame ? parseBoard(currentGame.currentFen) : []), [currentGame]);
  const hasOngoingGame = currentGame?.status === 'ONGOING';
  const timelineItems = useMemo(() => buildTimelineItems(currentGame, theme, runtimeEvents), [currentGame, theme, runtimeEvents]);
  const latestTimelineItem = timelineItems[0] ?? null;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 980px)');
    const syncLayout = (matches: boolean) => {
      setCompactLayout(matches);
      setDiscussionOpen(!matches);
      if (!matches) {
        setMobilePanel('timeline');
      }
    };

    syncLayout(mediaQuery.matches);
    const listener = (event: MediaQueryListEvent) => syncLayout(event.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (!timelineItems.length) {
      setRevealedSegmentCounts({});
      return;
    }

    const latest = timelineItems[0];
    if (!latest) {
      return;
    }

    setRevealedSegmentCounts((previous) => {
      const next: Record<string, number> = {};
      for (const item of timelineItems.slice(1)) {
        next[item.id] = item.segments.length;
      }
      next[latest.id] = Math.min(previous[latest.id] ?? 1, latest.segments.length);
      return next;
    });

    const timers = latest.segments.slice(1).map((_, index) => window.setTimeout(() => {
      setRevealedSegmentCounts((previous) => ({
        ...previous,
        [latest.id]: Math.max(previous[latest.id] ?? 1, index + 2),
      }));
    }, 320 * (index + 1)));

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [timelineItems]);

  async function loadCurrentGame(nextToken: string) {
    const data = await requestJson<GetCurrentGameResponse>('/api/games/current', {
      headers: { Authorization: `Bearer ${nextToken}` },
    });
    setCurrentGame(data.game);
    setSelectedSquare(null);
    setRuntimeEvents([]);
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

      setToken(data.token);
      setProfileName(data.user.username);
      await loadCurrentGame(data.token);
      setMessage('登录成功，可以直接新开一局，或继续当前棋局。');
    } catch (loginError) {
      setToken('');
      setProfileName('');
      setCurrentGame(null);
      setRuntimeEvents([]);
      setError(parseApiError(loginError));
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleCreateGame(difficulty: Difficulty) {
    if (!token) {
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const data = await requestJson<CreateGameResponse>('/api/games', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ difficulty }),
      });

      setCurrentGame(data.game);
      setSelectedSquare(null);
      setRuntimeEvents([]);
      setMessage(`已创建 ${formatDifficulty(difficulty)} 对局，统一时间线会按回合与事件逐段展开。`);
    } catch (createError) {
      const normalized = normalizeApiError(createError);
      setError(normalized.detail ?? normalized.message);
      setRuntimeEvents((previous) => {
        const order = getNextTimelineOrder(currentGame, previous);
        return [buildErrorEvent(currentGame, theme, normalized, undefined, order), ...previous].slice(0, 12);
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBoardClick(square: string, piece: string | null) {
    if (!currentGame || currentGame.status !== 'ONGOING' || currentGame.currentTurn !== 'USER' || actionLoading) {
      return;
    }

    if (!selectedSquare) {
      if (piece && pieceBelongsToUser(piece, currentGame)) {
        setSelectedSquare(square);
        setMessage(`已选中 ${square}`);
      }
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setMessage('已取消当前选择。');
      return;
    }

    if (piece && pieceBelongsToUser(piece, currentGame)) {
      setSelectedSquare(square);
      setMessage(`已切换到 ${square}`);
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const data = await requestJson<SubmitMoveResponse>(`/api/games/${currentGame.id}/moves`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: selectedSquare, to: square }),
      });

      setCurrentGame(data.game);
      setSelectedSquare(null);
      if (compactLayout) {
        setDiscussionOpen(false);
        setMobilePanel('timeline');
      }

      const aiPart = data.aiMove ? `AI 应对 ${data.aiMove.from}→${data.aiMove.to}` : '本步后对局已结束';
      setMessage(`你已走 ${data.userMove.from}→${data.userMove.to}，${aiPart}。`);

      setRuntimeEvents((previous) => {
        const next = [...previous];
        if (data.game.isCheck && data.game.status === 'ONGOING') {
          next.unshift(buildCheckEvent(data.game, theme, getNextTimelineOrder(data.game, next)));
        }
        if (data.game.status !== 'ONGOING') {
          next.unshift(buildFinishEvent(data.game, theme, getNextTimelineOrder(data.game, next)));
        }
        return next.slice(0, 12);
      });
    } catch (moveError) {
      const normalized = normalizeApiError(moveError);
      setError(normalized.detail ?? normalized.message);
      setRuntimeEvents((previous) => {
        const order = getNextTimelineOrder(currentGame, previous);
        return [buildErrorEvent(currentGame, theme, normalized, `${selectedSquare} → ${square}`, order), ...previous].slice(0, 12);
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUndo() {
    if (!currentGame || !currentGame.canUndo || actionLoading || !window.confirm('确认悔棋？这会撤销最近一个完整回合。')) {
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const data = await requestJson<UndoGameResponse>(`/api/games/${currentGame.id}/undo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentGame(data.game);
      setSelectedSquare(null);
      setMessage(`已撤销第 ${data.revertedTurnNumber} 回合，轮到你重新落子。`);
      setRuntimeEvents((previous) => [
        buildUndoEvent(data.game, theme, data.revertedTurnNumber, getNextTimelineOrder(data.game, previous)),
        ...previous,
      ].slice(0, 12));
    } catch (undoError) {
      const normalized = normalizeApiError(undoError);
      setError(normalized.detail ?? normalized.message);
      setRuntimeEvents((previous) => [
        buildErrorEvent(currentGame, theme, normalized, undefined, getNextTimelineOrder(currentGame, previous)),
        ...previous,
      ].slice(0, 12));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResign() {
    if (!currentGame || currentGame.status !== 'ONGOING' || actionLoading || !window.confirm('确认认输并结束本局吗？')) {
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const data = await requestJson<ResignGameResponse>(`/api/games/${currentGame.id}/resign`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentGame(data.game);
      setSelectedSquare(null);
      setMessage('你已认输，本局结束。');
      setRuntimeEvents((previous) => [
        buildFinishEvent(data.game, theme, getNextTimelineOrder(data.game, previous)),
        ...previous,
      ].slice(0, 12));
    } catch (resignError) {
      const normalized = normalizeApiError(resignError);
      setError(normalized.detail ?? normalized.message);
      setRuntimeEvents((previous) => [
        buildErrorEvent(currentGame, theme, normalized, undefined, getNextTimelineOrder(currentGame, previous)),
        ...previous,
      ].slice(0, 12));
    } finally {
      setActionLoading(false);
    }
  }

  function handleLogout() {
    setToken('');
    setProfileName('');
    setCurrentGame(null);
    setSelectedSquare(null);
    setMessage('');
    setError('');
    setRuntimeEvents([]);
    setRevealedSegmentCounts({});
  }

  function renderStatusCard() {
    return (
      <section className="card info-card">
        <div className="section-head">
          <div>
            <p className="section-kicker">当前对局</p>
            <h2>状态与操作</h2>
          </div>
          {currentGame ? <span className={`state-pill ${currentGame.isCheck ? 'state-warning' : ''}`}>{STATUS_LABELS[currentGame.status]}</span> : null}
        </div>

        {currentGame ? (
          <>
            <ul className="status-list">
              <li><strong>轮到：</strong>{currentGame.currentTurn === 'USER' ? '你' : currentGame.currentTurn === 'AI' ? 'AI' : '已结束'}</li>
              <li><strong>难度：</strong>{formatDifficulty(currentGame.difficulty)}</li>
              <li><strong>局势：</strong>{currentGame.isCheck && currentGame.status === 'ONGOING' ? '将军中' : formatGameResult(currentGame)}</li>
              <li><strong>悔棋：</strong>{currentGame.undoCount}/5</li>
              <li><strong>认输结束：</strong>{currentGame.endedByResign ? '是' : '否'}</li>
            </ul>

            <div className="story-thread-card">
              <p className="section-kicker">当前剧情线程</p>
              <div className="story-thread-grid">
                <div>
                  <strong>阶段</strong>
                  <span>{currentGame.storyThreadSummary.currentPhase}</span>
                </div>
                <div>
                  <strong>压力侧</strong>
                  <span>{currentGame.storyThreadSummary.pressureSide}</span>
                </div>
                <div>
                  <strong>焦点</strong>
                  <span>{currentGame.storyThreadSummary.recentFocus}</span>
                </div>
              </div>
              <p className="hint">{currentGame.storyThreadSummary.mainConflict}</p>
              <p className="hint">→ {currentGame.storyThreadSummary.carryForward}</p>
            </div>

            <div className="action-row">
              <button type="button" disabled={!currentGame.canUndo || actionLoading} onClick={() => void handleUndo()}>
                撤销最近完整回合
              </button>
              <button type="button" disabled={currentGame.status !== 'ONGOING' || actionLoading} onClick={() => void handleResign()}>
                认输
              </button>
            </div>
          </>
        ) : (
          <p className="hint">暂无进行中对局。</p>
        )}
      </section>
    );
  }

  function renderTimelineCard() {
    return (
      <section className="card info-card narrative-card">
        <div className="section-head">
          <div>
            <p className="section-kicker">讨论区</p>
            <h2>统一演绎时间线</h2>
          </div>
          <span className="state-pill">{THEME_OPTIONS.find((item) => item.value === theme)?.label}</span>
        </div>

        {timelineItems.length ? (
          <div className="timeline-list">
            {timelineItems.map((item, index) => {
              const visibleCount = revealedSegmentCounts[item.id] ?? item.segments.length;
              const isLatestItem = index === 0;
              return (
                <article
                  key={item.id}
                  className={`timeline-item tone-${item.tone} ${item.kind === 'event' ? 'timeline-item-event' : 'timeline-item-turn'} ${isLatestItem ? 'timeline-item-latest' : ''}`}
                  aria-live={isLatestItem ? 'polite' : undefined}
                >
                  <header>
                    <div>
                      <strong>{item.title}</strong>
                      <span className="narrative-summary">{item.summary}</span>
                    </div>
                    <div className="timeline-meta-pills">
                      {item.meta.tag ? <span className="state-pill">{item.meta.tag}</span> : null}
                      {item.meta.eventType ? <span className="state-pill">{item.meta.eventType}</span> : null}
                      {isLatestItem ? <span className="state-pill state-accent">逐段展开</span> : null}
                    </div>
                  </header>
                  <div className="narrative-segments">
                    {item.segments.map((segment, segmentIndex) => {
                      const visible = segmentIndex < visibleCount;
                      return (
                        <div
                          key={segment.id}
                          className={[
                            'narrative-segment',
                            `segment-${segment.kind}`,
                            visible ? 'segment-visible' : 'segment-pending',
                          ].join(' ')}
                        >
                          <span className="segment-kind-label">{segment.label}</span>
                          <span>{visible ? segment.text : segment.pendingText}</span>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="hint">新开一局后，这里会把普通回合与特殊事件一起收进同一条时间线。</p>
        )}
      </section>
    );
  }

  function renderSettingsCard() {
    return (
      <section className="card info-card">
        <div className="section-head">
          <div>
            <p className="section-kicker">设置</p>
            <h2>主题切换</h2>
          </div>
          <span className="state-pill">即时生效</span>
        </div>

        <div className="theme-grid" role="radiogroup" aria-label="页面主题切换">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`theme-chip ${theme === option.value ? 'theme-chip-active' : ''}`}
              onClick={() => setTheme(option.value)}
            >
              <strong>{option.label}</strong>
              <span>{option.hint}</span>
            </button>
          ))}
        </div>

        <p className="hint">当前只做展示层即时切换，不做登录后恢复与跨端同步。</p>
      </section>
    );
  }

  if (!token) {
    return (
      <main className="page-shell">
        <section className="hero-card">
          <p className="eyebrow">Task Bundle C / 二轮修正</p>
          <h1>象棋网页版 · 统一时间线与移动端体验</h1>
          <p className="lead">
            当前目标不再只是“能走棋”，而是把标准决策层（规则 + 启发式评分）、剧情线程摘要、特殊事件时间线和移动端主链路一起补到更稳定的一版。
          </p>
        </section>

        <section className="grid single-column">
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
            <button type="submit" disabled={loginLoading}>{loginLoading ? '登录中…' : '登录进入对局页'}</button>
            <p className="hint">默认演示账号：demo / demo123</p>
            {error ? <p className="error">{error}</p> : null}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell game-page">
      <section className="hero-card hero-inline">
        <div>
          <p className="eyebrow">Task Bundle C / 统一演绎时间线</p>
          <h1>你好，{profileName}</h1>
          <p className="lead">当前页面已切到统一时间线：合法回合、非法步、悔棋、将军与终局都进入同一条讨论链路。</p>
        </div>
        <div className="hero-actions">
          {compactLayout ? (
            <button className="ghost-button" type="button" onClick={() => setDiscussionOpen((value) => !value)}>
              {discussionOpen ? '收起讨论区' : '展开讨论区'}
            </button>
          ) : null}
          <button className="ghost-button" type="button" onClick={handleLogout}>退出登录</button>
        </div>
      </section>

      {message ? <p className="banner success">{message}</p> : null}
      {error ? <p className="banner error">{error}</p> : null}

      <section className="layout-grid">
        <div className="primary-column">
          <div className="card board-card">
            <div className="board-head">
              <div>
                <h2>棋盘</h2>
                <p className="hint">点击己方棋子后，再点击目标点完成落子。移动端会优先保证棋盘可见。</p>
              </div>
              {currentGame ? (
                <div className="meta-pills">
                  <span>{STATUS_LABELS[currentGame.status]}</span>
                  <span>{formatDifficulty(currentGame.difficulty)}</span>
                  <span>{THEME_OPTIONS.find((item) => item.value === theme)?.label}</span>
                  <span>悔棋 {currentGame.undoCount}/5</span>
                </div>
              ) : null}
            </div>

            {currentGame ? (
              <div className="board-grid" role="grid" aria-label="象棋棋盘">
                {board.flat().map((cell, index) => {
                  const isSelected = selectedSquare === cell.square;
                  const userOwned = cell.piece ? pieceBelongsToUser(cell.piece, currentGame) : false;
                  return (
                    <button
                      key={`${cell.square}-${index}`}
                      type="button"
                      className={[
                        'board-cell',
                        (index + Math.floor(index / 9)) % 2 === 0 ? 'dark-cell' : 'light-cell',
                        isSelected ? 'selected-cell' : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => void handleBoardClick(cell.square, cell.piece)}
                      disabled={actionLoading || currentGame.currentTurn !== 'USER' || currentGame.status !== 'ONGOING'}
                    >
                      <span className="cell-corner">{cell.square}</span>
                      {cell.piece ? (
                        <span className={`piece ${userOwned ? 'piece-red' : 'piece-black'}`}>
                          {PIECE_LABELS[cell.piece] ?? cell.piece}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="empty-board-state">
                <p>当前没有进行中的对局，先从下方选择一个难度开始。</p>
              </div>
            )}

            {compactLayout ? (
              <div className="board-footnote">
                <div>
                  <p className="section-kicker">移动端提示</p>
                  <strong>讨论区默认折叠，棋盘始终优先。</strong>
                </div>
                <button className="ghost-button tiny-button" type="button" onClick={() => setDiscussionOpen(true)}>
                  查看讨论区
                </button>
              </div>
            ) : null}
          </div>

          <section className="card quick-actions-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">开局入口</p>
                <h2>新建对局</h2>
              </div>
              {compactLayout ? <span className="state-pill">竖屏优先</span> : <span className="state-pill">横屏可侧边常驻</span>}
            </div>
            <div className="difficulty-list difficulty-inline">
              {DIFFICULTIES.map((difficulty) => (
                <button
                  key={difficulty.value}
                  type="button"
                  disabled={actionLoading || hasOngoingGame}
                  onClick={() => void handleCreateGame(difficulty.value)}
                >
                  {difficulty.label}
                </button>
              ))}
            </div>
            {hasOngoingGame ? (
              <p className="inline-notice">当前已有一局进行中的对局，请先继续当前棋局，或点“认输”结束后再新开。</p>
            ) : (
              <p className="hint">主题切换放在设置区，不占主操作区位置。</p>
            )}
          </section>

          {compactLayout && !discussionOpen ? (
            <section className="card collapsed-summary-card">
              <div>
                <p className="section-kicker">折叠摘要</p>
                <h2>{latestTimelineItem?.title ?? '暂时还没有新演绎'}</h2>
                <p className="hint">{latestTimelineItem?.summary ?? '先完成一次落子，统一时间线会在需要时再展开。'}</p>
              </div>
              <button type="button" onClick={() => setDiscussionOpen(true)}>展开查看</button>
            </section>
          ) : null}
        </div>

        {compactLayout ? (
          <aside className="mobile-sidebar">
            {!discussionOpen ? (
              <section className="card collapsed-panel-card">
                <p className="section-kicker">讨论区默认折叠</p>
                <h2>先把棋盘留给你</h2>
                <p className="hint">移动端默认收起统一时间线，避免长期压住棋盘；需要时再展开查看演绎、状态和设置。</p>
                <button type="button" onClick={() => setDiscussionOpen(true)}>展开讨论区</button>
              </section>
            ) : (
              <>
                <div className="mobile-tab-row card">
                  <button type="button" className={mobilePanel === 'timeline' ? 'tab-active' : ''} onClick={() => setMobilePanel('timeline')}>时间线</button>
                  <button type="button" className={mobilePanel === 'status' ? 'tab-active' : ''} onClick={() => setMobilePanel('status')}>状态</button>
                  <button type="button" className={mobilePanel === 'settings' ? 'tab-active' : ''} onClick={() => setMobilePanel('settings')}>设置</button>
                </div>
                {mobilePanel === 'timeline' ? renderTimelineCard() : null}
                {mobilePanel === 'status' ? renderStatusCard() : null}
                {mobilePanel === 'settings' ? renderSettingsCard() : null}
              </>
            )}
          </aside>
        ) : (
          <aside className="sidebar-stack">
            {renderStatusCard()}
            {renderTimelineCard()}
            {renderSettingsCard()}
          </aside>
        )}
      </section>
    </main>
  );
}
