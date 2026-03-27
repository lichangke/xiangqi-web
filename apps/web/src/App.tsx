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
  buildNarrativeTurns,
  buildUndoEvent,
  normalizeApiError,
  type EventCard,
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
  const [mobilePanel, setMobilePanel] = useState<'narrative' | 'status' | 'settings'>('narrative');
  const [eventFeed, setEventFeed] = useState<EventCard[]>([]);
  const [revealedSegmentCounts, setRevealedSegmentCounts] = useState<Record<string, number>>({});

  const board = useMemo(() => (currentGame ? parseBoard(currentGame.currentFen) : []), [currentGame]);
  const hasOngoingGame = currentGame?.status === 'ONGOING';
  const narrativeTurns = useMemo(() => buildNarrativeTurns(currentGame, theme), [currentGame, theme]);
  const latestTurn = narrativeTurns.at(-1) ?? null;
  const latestEvent = eventFeed[0] ?? null;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 980px)');
    const syncLayout = (matches: boolean) => {
      setCompactLayout(matches);
      setDiscussionOpen(!matches);
      if (!matches) {
        setMobilePanel('narrative');
      }
    };

    syncLayout(mediaQuery.matches);
    const listener = (event: MediaQueryListEvent) => syncLayout(event.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (!narrativeTurns.length) {
      setRevealedSegmentCounts({});
      return;
    }

    const latest = narrativeTurns.at(-1);
    if (!latest) {
      return;
    }

    setRevealedSegmentCounts((previous) => {
      const next: Record<string, number> = {};
      for (const turn of narrativeTurns.slice(0, -1)) {
        next[turn.id] = turn.segments.length;
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
  }, [narrativeTurns]);

  function pushEvent(nextEvent: Omit<EventCard, 'id'> & { id?: string }) {
    setEventFeed((previous) => [{ ...nextEvent, id: nextEvent.id ?? `${Date.now()}-${Math.random()}` }, ...previous].slice(0, 8));
  }

  async function loadCurrentGame(nextToken: string) {
    const data = await requestJson<GetCurrentGameResponse>('/api/games/current', {
      headers: { Authorization: `Bearer ${nextToken}` },
    });
    setCurrentGame(data.game);
    setSelectedSquare(null);
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
      setEventFeed([]);
      setMessage(`已创建 ${formatDifficulty(difficulty)} 对局，讨论区会按回合逐段展开。`);
    } catch (createError) {
      const normalized = normalizeApiError(createError);
      setError(normalized.detail ?? normalized.message);
      pushEvent(buildErrorEvent(normalized));
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
        setMobilePanel('narrative');
      }

      const aiPart = data.aiMove ? `AI 应对 ${data.aiMove.from}→${data.aiMove.to}` : '本步后对局已结束';
      setMessage(`你已走 ${data.userMove.from}→${data.userMove.to}，${aiPart}。`);

      if (data.game.isCheck && data.game.status === 'ONGOING') {
        pushEvent(buildCheckEvent(data.game));
      }
      if (data.game.status !== 'ONGOING') {
        pushEvent(buildFinishEvent(data.game));
      }
    } catch (moveError) {
      const normalized = normalizeApiError(moveError);
      setError(normalized.detail ?? normalized.message);
      pushEvent(buildErrorEvent(normalized, `${selectedSquare} → ${square}`));
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
      pushEvent(buildUndoEvent(data.revertedTurnNumber));
    } catch (undoError) {
      const normalized = normalizeApiError(undoError);
      setError(normalized.detail ?? normalized.message);
      pushEvent(buildErrorEvent(normalized));
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
      pushEvent(buildFinishEvent(data.game));
    } catch (resignError) {
      const normalized = normalizeApiError(resignError);
      setError(normalized.detail ?? normalized.message);
      pushEvent(buildErrorEvent(normalized));
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
    setEventFeed([]);
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

  function renderEventCard() {
    return (
      <section className="card info-card">
        <div className="section-head">
          <div>
            <p className="section-kicker">特殊事件</p>
            <h2>提示模板</h2>
          </div>
          <button className="ghost-button tiny-button" type="button" onClick={() => setEventFeed([])} disabled={!eventFeed.length}>
            清空
          </button>
        </div>

        {eventFeed.length ? (
          <div className="event-list">
            {eventFeed.map((item) => (
              <article key={item.id} className={`event-card tone-${item.tone}`}>
                <div className="event-head">
                  <strong>{item.title}</strong>
                  {item.meta ? <span>{item.meta}</span> : null}
                </div>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="hint">非法落子、悔棋、认输、将军、终局反馈会在这里按模板展示。</p>
        )}
      </section>
    );
  }

  function renderNarrativeCard() {
    return (
      <section className="card info-card narrative-card">
        <div className="section-head">
          <div>
            <p className="section-kicker">讨论区</p>
            <h2>回合演绎</h2>
          </div>
          <span className="state-pill">{THEME_OPTIONS.find((item) => item.value === theme)?.label}</span>
        </div>

        {narrativeTurns.length ? (
          <div className="narrative-list">
            {narrativeTurns.slice().reverse().map((turn) => {
              const visibleCount = revealedSegmentCounts[turn.id] ?? turn.segments.length;
              const isLatestTurn = latestTurn?.id === turn.id;

              return (
                <article key={turn.id} className={`narrative-turn ${isLatestTurn ? 'narrative-turn-latest' : ''}`} aria-live={isLatestTurn ? 'polite' : undefined}>
                  <header>
                    <div>
                      <strong>{turn.title}</strong>
                      <span className="narrative-summary">{turn.summary}</span>
                    </div>
                    {isLatestTurn ? <span className="state-pill state-accent">逐段展开</span> : null}
                  </header>
                  <div className="narrative-segments">
                    {turn.segments.map((segment, index) => {
                      const visible = index < visibleCount;
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
          <p className="hint">新开一局后，这里会按“第 N 回合”的结构逐段展开讨论与落子说明。</p>
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

        <p className="hint">当前只做展示层切换，不做登录后恢复与跨端同步。</p>
      </section>
    );
  }

  if (!token) {
    return (
      <main className="page-shell">
        <section className="hero-card">
          <p className="eyebrow">Task Bundle C / 体验层补全</p>
          <h1>象棋网页版 · 演绎与移动端体验</h1>
          <p className="lead">
            当前目标不再只是“能走棋”，而是把回合演绎、特殊事件模板、移动端主链路和主题切换一起补成更像成品的一版。
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
          <p className="eyebrow">Task Bundle C / 演绎展示与移动端体验</p>
          <h1>你好，{profileName}</h1>
          <p className="lead">当前页面已切到体验层：回合演绎、事件模板、手机端折叠讨论区与三主题切换都在这里收口。</p>
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
                <h2>{latestTurn?.title ?? latestEvent?.title ?? '暂时还没有新演绎'}</h2>
                <p className="hint">{latestTurn?.summary ?? latestEvent?.body ?? '先完成一次落子，讨论区会在需要时再展开。'}</p>
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
                <p className="hint">移动端默认收起讨论区，避免长期压住棋盘；需要时再展开查看回合演绎、状态和设置。</p>
                <button type="button" onClick={() => setDiscussionOpen(true)}>展开讨论区</button>
              </section>
            ) : (
              <>
                <div className="mobile-tab-row card">
                  <button type="button" className={mobilePanel === 'narrative' ? 'tab-active' : ''} onClick={() => setMobilePanel('narrative')}>演绎</button>
                  <button type="button" className={mobilePanel === 'status' ? 'tab-active' : ''} onClick={() => setMobilePanel('status')}>状态</button>
                  <button type="button" className={mobilePanel === 'settings' ? 'tab-active' : ''} onClick={() => setMobilePanel('settings')}>设置</button>
                </div>
                {mobilePanel === 'narrative' ? renderNarrativeCard() : null}
                {mobilePanel === 'status' ? (
                  <>
                    {renderStatusCard()}
                    {renderEventCard()}
                  </>
                ) : null}
                {mobilePanel === 'settings' ? renderSettingsCard() : null}
              </>
            )}
          </aside>
        ) : (
          <aside className="sidebar-stack">
            {renderStatusCard()}
            {renderEventCard()}
            {renderNarrativeCard()}
            {renderSettingsCard()}
          </aside>
        )}
      </section>
    </main>
  );
}
