'use client';

import { useState, useEffect } from 'react';
import { login, isLoggedIn, initializeDefaultUsers } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    initializeDefaultUsers().then(() => {
      setIsAuthenticated(isLoggedIn());
      setIsLoading(false);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    const success = await login(username, password);
    if (success) {
      setIsAuthenticated(true);
    } else {
      setError('Неверный логин или пароль');
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'Inter', sans-serif" }}>
        <div>Загрузка...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8f9fa', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px', color: '#1a1a1a' }}>📋 Тех. отчёты</h1>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>Войдите для доступа к системе</p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#333' }}>Логин</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }} placeholder="Введите логин" required disabled={isLoggingIn} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#333' }}>Пароль</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' }} placeholder="Введите пароль" required disabled={isLoggingIn} />
          </div>

          {error && (
            <div style={{ padding: '12px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33', fontSize: '14px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={isLoggingIn} style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 600, color: 'white', background: isLoggingIn ? '#ccc' : '#2563eb', border: 'none', borderRadius: '8px', cursor: isLoggingIn ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
            {isLoggingIn ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
