'use client';

import { useState } from 'react';

const API_BASE = 'http://localhost:3000';

export default function Home() {
  const [email, setEmail] = useState('mawaisrafiquesukhera@gmail.com');
  const [password, setPassword] = useState('@@Awais786$$');
  const [status, setStatus] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);

  async function login() {
    setStatus('Logging in...');

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(`Login failed: ${data.message ?? 'Unknown error'}`);
      return;
    }

    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
    setStatus('Login successful');
  }

  async function callMe() {
    setStatus('Calling protected route...');

    const res = await fetch(`${API_BASE}/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(`Protected call failed: ${data.message ?? 'Unauthorized'}`);
      return;
    }

    setUser(data);
    setStatus('Protected route succeeded');
  }

  async function getAllUsers() {
    setStatus('Getting all users...');

    const res = await fetch(`${API_BASE}/users/all-users`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(`Get all users failed: ${data.message ?? 'Unknown error'}`);
      return;
    }

    setAllUsers(data);
    setStatus(`Loaded ${data.length} user(s)`);
  }

  async function refreshAndRetry() {
    setStatus('Refreshing token...');

    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(`Refresh failed: ${data.message ?? 'Unknown error'}`);
      return;
    }

    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setStatus('Token refreshed successfully');
  }

  async function logout() {
    if (!accessToken) {
      setStatus('No active session to log out.');
      return;
    }

    setStatus('Logging out...');

    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(`Logout failed: ${data.message ?? 'Unknown error'}`);
      return;
    }

    setAccessToken('');
    setRefreshToken('');
    setUser(null);
    setStatus(data.message ?? 'Logged out successfully');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6 md:p-10">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Backend Testing
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Auth Demo
            </h1>
          </div>
        </div>

        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span>Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-3 focus:ring-blue-100"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-3 focus:ring-blue-100"
            />
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={login}
              className="rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              Login
            </button>
            <button
              onClick={callMe}
              className="rounded-xl bg-slate-800 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-slate-900"
            >
              Call /users/me
            </button>
            <button
              onClick={getAllUsers}
              className="rounded-xl bg-cyan-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-cyan-800"
            >
              All Users
            </button>
            <button
              onClick={refreshAndRetry}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-emerald-700"
            >
              Refresh token
            </button>
            <button
              onClick={logout}
              className="rounded-xl bg-rose-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-rose-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Status
          </p>
          <p className="text-slate-800">{status || 'Idle'}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            User
          </p>
          <pre className="whitespace-pre-wrap text-sm text-slate-700">
            {JSON.stringify(user, null, 2) || 'No user loaded'}
          </pre>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Access token
          </h2>
          {/* Changed break-all to break-words, and added whitespace-pre-wrap */}
          <pre className="wrap-break-word whitespace-pre-wrap text-xs leading-5 text-slate-700">
            {accessToken || 'Not set'}
          </pre>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Refresh token
          </h2>
          {/* Changed break-all to break-words, and added whitespace-pre-wrap */}
          <pre className="wrap-break-word whitespace-pre-wrap text-xs leading-5 text-slate-700">
            {refreshToken || 'Not set'}
          </pre>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          All Users ({allUsers.length})
        </h2>
        {allUsers.length === 0 ? (
          <p className="text-sm text-slate-500">No users loaded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {allUsers.map((u) => (
              <li
                key={u._id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="font-medium text-slate-800">{u.name}</span>
                <span className="text-slate-500">{u.email}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
