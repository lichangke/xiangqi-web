import { useMemo, useState } from 'react';
import type {
  ApiErrorShape,
  CreateGameResponse,
  Difficulty,
  GameSummary,
  GetCurrentGameResponse,
  LoginResponse,
  ResignGameResponse,
  SubmitMoveResponse,
  UndoGameResponse,
} from '@xiangqi-web/shared';

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
  if (!error || typeof error !== 'object') {
    return '请求失败';
  }

  const candidate = error as { error?: ApiErrorShape; message?: string };
  return candidate.error?.detail ?? candidate.error?.message ?? candidate.message ?? '请求失败';
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

  const board = useMemo(() => (currentGame ? parseBoard(currentGame.currentFen) : []), [currentGame]);
  const hasOngoingGame = currentGame?.status === 'ONGOING';

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
      setMessage('登录成功，可以直接新开一局或继续已有对局。');
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
      setMessage(`已创建 ${formatDifficulty(difficulty)} 对局，请先手落子。`);
    } catch (createError) {
      setError(parseApiError(createError));
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
      setMessage('已取消选择。');
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
      const aiPart = data.aiMove ? `，AI 应对 ${data.aiMove.from}→${data.aiMove.to}` : '，本步后对局已结束';
      setMessage(`你已走 ${data.userMove.from}→${data.userMove.to}${aiPart}`);
    } catch (moveError) {
      setError(parseApiError(moveError));
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
      setMessage(`已撤销第 ${data.revertedTurnNumber} 回合，等待你重新落子。`);
    } catch (undoError) {
      setError(parseApiError(undoError));
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
    } catch (resignError) {
      setError(parseApiError(resignError));
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
  }

  if (!token) {
    return (
      <main className="page-shell">
        <section className="hero-card">
          <p className="eyebrow">Task Bundle B / 核心对局闭环</p>
          <h1>象棋网页版 · 最小对局页</h1>
          <p className="lead">
            当前已补到“登录 → 新建对局 → 点击选子 → 点击目标点落子 → AI 合法应对 → 悔棋 / 认输”的最小闭环。
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
          <p className="eyebrow">Task Bundle B / 核心对局闭环</p>
          <h1>你好，{profileName}</h1>
          <p className="lead">当前为最小棋盘页：新建对局、用户落子、AI 合法应对、悔棋与认输已经接通。</p>
        </div>
        <button className="ghost-button" type="button" onClick={handleLogout}>退出登录</button>
      </section>

      {message ? <p className="banner success">{message}</p> : null}
      {error ? <p className="banner error">{error}</p> : null}

      <section className="layout-grid">
        <div className="card board-card">
          <div className="board-head">
            <div>
              <h2>棋盘</h2>
              <p className="hint">点击己方棋子后，再点击目标点完成落子。</p>
            </div>
            {currentGame ? (
              <div className="meta-pills">
                <span>{STATUS_LABELS[currentGame.status]}</span>
                <span>{formatDifficulty(currentGame.difficulty)}</span>
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
              <p>当前没有进行中的对局，先从右侧选择一个难度开始。</p>
            </div>
          )}
        </div>

        <aside className="sidebar-stack">
          <section className="card">
            <h2>新建对局</h2>
            <div className="difficulty-list">
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
              <p className="hint">可直接选择一个难度开始新局。</p>
            )}
          </section>

          <section className="card">
            <h2>当前对局状态</h2>
            {currentGame ? (
              <ul className="status-list">
                <li><strong>状态：</strong>{STATUS_LABELS[currentGame.status]}</li>
                <li><strong>轮到：</strong>{currentGame.currentTurn === 'USER' ? '你' : currentGame.currentTurn === 'AI' ? 'AI' : '已结束'}</li>
                <li><strong>结果：</strong>{currentGame.resultWinner ? `${currentGame.resultWinner === currentGame.userSide ? '你方' : 'AI'}获胜` : '未决'}</li>
                <li><strong>认输结束：</strong>{currentGame.endedByResign ? '是' : '否'}</li>
              </ul>
            ) : (
              <p className="hint">暂无进行中对局。</p>
            )}

            <div className="action-row">
              <button type="button" disabled={!currentGame?.canUndo || actionLoading} onClick={() => void handleUndo()}>
                撤销最近完整回合
              </button>
              <button type="button" disabled={!currentGame || currentGame.status !== 'ONGOING' || actionLoading} onClick={() => void handleResign()}>
                认输
              </button>
            </div>
          </section>

          <section className="card moves-card">
            <h2>回合记录</h2>
            {currentGame?.moves.length ? (
              <ol>
                {currentGame.moves.map((move) => (
                  <li key={`${move.turnNumber}-${move.actor}-${move.from}-${move.to}`}>
                    第 {move.turnNumber} 回合 · {move.actor === 'USER' ? '你' : 'AI'}：{move.from} → {move.to}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="hint">尚未落子。</p>
            )}
          </section>
        </aside>
      </section>
    </main>
  );
}
