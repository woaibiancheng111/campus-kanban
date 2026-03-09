'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

type BoardColumn = {
  id: string;
  name: string;
  cards?: { id: string; title: string; description?: string }[];
};

export default function Home() {
  const [email, setEmail] = useState('alice@campus.edu');
  const [password, setPassword] = useState('P@ssw0rd!');
  const [token, setToken] = useState('');
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [boardId, setBoardId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('token') || '';
    setToken(t);
  }, []);

  async function login() {
    try {
      setLoading(true);
      setError('');
      const data = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('token', data.accessToken);
      setToken(data.accessToken);
      await loadWorkspaces();
    } catch (e: any) {
      setError(`登录失败：${e.message || '请检查账号密码'}`);
    } finally {
      setLoading(false);
    }
  }

  async function register() {
    try {
      setLoading(true);
      setError('');
      await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName: 'Alice' }),
      });
      await login();
    } catch (e: any) {
      setError(`注册失败：${e.message || '请更换邮箱重试'}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkspaces() {
    const ws = await apiFetch('/api/v1/workspaces');
    setWorkspaces(ws);
    if (ws[0]) {
      const projects = await apiFetch(`/api/v1/workspaces/${ws[0].id}/projects`);
      if (projects[0]) {
        const boards = await apiFetch(`/api/v1/projects/${projects[0].id}/boards`);
        if (boards[0]) {
          setBoardId(boards[0].id);
          const cols = await apiFetch(`/api/v1/boards/${boards[0].id}/columns?includeCards=true`);
          setColumns(cols);
        }
      }
    }
  }

  async function moveCard(cardId: string, toColumnId: string, toPosition: number) {
    await apiFetch(`/api/v1/cards/${cardId}/move`, {
      method: 'POST',
      body: JSON.stringify({ toColumnId, toPosition }),
    });
    const cols = await apiFetch(`/api/v1/boards/${boardId}/columns?includeCards=true`);
    setColumns(cols);
  }

  useEffect(() => {
    if (token) loadWorkspaces();
  }, [token]);

  return (
    <main className="page">
      <div className="header">
        <div>
          <h1 className="title">Campus Kanban</h1>
          <p className="sub">校园团队任务看板（MVP） · 支持登录、看板展示、卡片跨列移动</p>
        </div>
      </div>

      <section className="panel">
        <div className="loginRow">
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="邮箱" />
          <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码" type="password" />
          <button className="btn" disabled={loading} onClick={login}>{loading ? '处理中...' : '登录'}</button>
          <button className="btn secondary" disabled={loading} onClick={register}>注册</button>
          <button className="btn ghost" disabled={loading || !token} onClick={() => loadWorkspaces()}>刷新看板</button>
        </div>
        <div className="meta">工作区数量：{workspaces.length}（默认测试账号：alice@campus.edu / P@ssw0rd!）</div>
        {error ? <div className="error">{error}</div> : null}
      </section>

      <div className="boardWrap">
        {columns.map((col) => (
          <section key={col.id} className="column">
            <h3 className="columnTitle">
              {col.name}
              <span className="badge">{(col.cards || []).length}</span>
            </h3>
            {(col.cards || []).map((card) => (
              <article key={card.id} className="card">
                <p className="cardTitle">{card.title}</p>
                <p className="cardDesc">{card.description || '暂无描述'}</p>
                <div className="row">
                  {columns
                    .filter((c) => c.id !== col.id)
                    .map((target) => (
                      <button
                        key={target.id}
                        className="smallBtn"
                        onClick={() => moveCard(card.id, target.id, (target.cards || []).length)}
                      >
                        移到 {target.name}
                      </button>
                    ))}
                </div>
              </article>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
