'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

export default function Home() {
  const [email, setEmail] = useState('alice@campus.edu');
  const [password, setPassword] = useState('P@ssw0rd!');
  const [token, setToken] = useState('');
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [boardId, setBoardId] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('token') || '';
    setToken(t);
  }, []);

  async function login() {
    const data = await apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('token', data.accessToken);
    setToken(data.accessToken);
    await loadWorkspaces();
  }

  async function register() {
    await apiFetch('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName: 'Alice' }),
    });
    await login();
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
    <main style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Campus Kanban</h1>
      <p>登录后查看看板，点击按钮把卡片移动到下一列。</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
        <button onClick={login}>登录</button>
        <button onClick={register}>注册</button>
      </div>

      <h3>Workspaces: {workspaces.length}</h3>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        {columns.map((col) => (
          <section key={col.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 8, width: 280 }}>
            <h4>{col.name}</h4>
            {(col.cards || []).map((card: any) => (
              <div key={card.id} style={{ border: '1px solid #eee', marginBottom: 8, padding: 8, borderRadius: 6 }}>
                <strong>{card.title}</strong>
                <p style={{ margin: '4px 0' }}>{card.description}</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {columns
                    .filter((c) => c.id !== col.id)
                    .map((target) => (
                      <button key={target.id} onClick={() => moveCard(card.id, target.id, (target.cards || []).length)}>
                        移到 {target.name}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
