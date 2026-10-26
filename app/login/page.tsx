'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const COOKIE_NAME = 'tech_reports_auth';

function setAuthCookie(value: string, days = 30) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getAuthCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getAuthCookie();
    if (token === 'authenticated') {
      router.replace('/');
    } else {
      setCheckingSession(false);
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!password) {
      setError('Введите пароль');
      setLoading(false);
      return;
    }

    const sitePassword = process.env.NEXT_PUBLIC_SITE_PASSWORD || 'grafik2026';
    if (password === sitePassword) {
      setAuthCookie('authenticated');
      router.push('/');
      return;
    }

    setError('Неверный пароль');
    setLoading(false);
  };

  if (checkingSession) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0eeeb', fontFamily: "'Inter', sans-serif", color: '#6b7280', fontSize: 14 }}>
        Проверка сессии…
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0eeeb', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '400px', width: '100%', padding: '32px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px', color: '#1a1a1a' }}>📋 Тех. отчёты</h2>
        <p style={{ fontSize: '14px', textAlign: 'center', marginBottom: '24px', color: '#6b7280' }}>Войдите для доступа к системе</p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="password" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>Пароль</label>
            <input id="password" type="password" required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} placeholder="Введите пароль" autoComplete="current-password" />
          </div>

          {error && (
            <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: '500', background: loading ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
