'use client';

import { useState, useEffect } from 'react';
import {
  listUsers,
  addUser,
  updatePassword,
  removeUser,
  isAdmin,
  getCurrentUser,
} from '@/lib/auth';

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const [users, setUsers] = useState<Array<{ username: string; isAdmin: boolean }>>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshUsers = async () => {
    setLoading(true);
    try {
      const u = await listUsers();
      setUsers(u);
    } catch (e) {
      console.error('refreshUsers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin()) {
      onBack();
      return;
    }
    setCurrentUser(getCurrentUser());
    refreshUsers();
  }, [onBack]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!newUsername || !newPassword) { setMessage('Заполните все поля'); return; }
    setLoading(true);
    const success = await addUser(newUsername, newPassword, newIsAdmin);
    if (success) {
      await refreshUsers();
      setNewUsername(''); setNewPassword(''); setNewIsAdmin(false);
      setMessage(`Пользователь ${newUsername} добавлен`);
    } else {
      setMessage('Ошибка: пользователь с таким именем уже существует или недостаточно прав');
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (username: string) => {
    setMessage('');
    if (!editPassword) { setMessage('Введите новый пароль'); return; }
    setLoading(true);
    const success = await updatePassword(username, editPassword);
    if (success) {
      setEditingUser(null); setEditPassword('');
      setMessage(`Пароль для ${username} обновлён`);
    } else { setMessage('Ошибка обновления пароля'); }
    setLoading(false);
  };

  const handleRemoveUser = async (username: string) => {
    if (username === currentUser) { setMessage('Нельзя удалить самого себя'); return; }
    if (confirm(`Удалить пользователя ${username}?`)) {
      setLoading(true);
      const success = await removeUser(username);
      if (success) { await refreshUsers(); setMessage(`Пользователь ${username} удалён`); }
      else { setMessage('Ошибка удаления'); }
      setLoading(false);
    }
  };

  const btnBase: React.CSSProperties = { padding: '8px 16px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>🔐 Управление пользователями</h1>
        <button onClick={onBack} style={{ ...btnBase, padding: '10px 20px', background: '#2563eb', color: 'white', fontSize: '14px' }}>← Назад к отчётам</button>
      </div>
      <div style={{ padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', color: '#1e40af', fontSize: '13px', marginBottom: '24px' }}>
        ☁️ <strong>Облачная синхронизация:</strong> все пользователи хранятся в Supabase и доступны с любого устройства.
      </div>
      {message && (
        <div style={{ padding: '12px 16px', background: message.includes('Ошибка') || message.includes('Нельзя') || message.includes('существует') ? '#fef2f2' : '#f0fdf4', border: `1px solid ${message.includes('Ошибка') || message.includes('Нельзя') || message.includes('существует') ? '#fecaca' : '#bbf7d0'}`, borderRadius: '8px', color: message.includes('Ошибка') || message.includes('Нельзя') || message.includes('существует') ? '#dc2626' : '#16a34a', fontSize: '14px', marginBottom: '24px', whiteSpace: 'pre-line' }}>
          {message}
        </div>
      )}
      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#1a1a2e' }}>Добавить нового пользователя</h2>
        <form onSubmit={handleAddUser}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#5a5a72' }}>Логин</label>
              <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #e0e0e0', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' }} placeholder="ivanov" required disabled={loading} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#5a5a72' }}>Пароль</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #e0e0e0', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' }} placeholder="••••••••" required disabled={loading} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#5a5a72', cursor: 'pointer', marginBottom: '16px' }}>
            <input type="checkbox" checked={newIsAdmin} onChange={(e) => setNewIsAdmin(e.target.checked)} style={{ cursor: 'pointer' }} disabled={loading} />
            Администратор (может управлять пользователями)
          </label>
          <button type="submit" disabled={loading} style={{ ...btnBase, padding: '12px 24px', background: loading ? '#9ca3af' : '#2563eb', color: 'white', fontSize: '14px', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
            {loading ? 'Добавление...' : '+ Добавить пользователя'}
          </button>
        </form>
      </div>
      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#1a1a2e' }}>Список пользователей ({users.length})</h2>
          <button onClick={refreshUsers} disabled={loading} style={{ ...btnBase, background: '#e5e7eb', color: '#374151' }}>{loading ? 'Загрузка...' : 'Обновить'}</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {users.map((user) => (
            <div key={user.username} style={{ padding: '14px 16px', background: '#f8f9fb', borderRadius: '10px', border: '1px solid #e8eaed' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }}>{user.username}</span>
                  {user.isAdmin && <span style={{ padding: '2px 8px', background: '#2563eb', color: 'white', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Админ</span>}
                  {user.username === currentUser && <span style={{ padding: '2px 8px', background: '#16a34a', color: 'white', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>Вы</span>}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setEditingUser(editingUser === user.username ? null : user.username)} disabled={loading} style={{ ...btnBase, background: editingUser === user.username ? '#6b7280' : '#f59e0b', color: 'white' }}>{editingUser === user.username ? 'Отмена' : 'Пароль'}</button>
                  <button onClick={() => handleRemoveUser(user.username)} disabled={user.username === currentUser || loading} style={{ ...btnBase, background: user.username === currentUser ? '#e5e7eb' : '#ef4444', color: user.username === currentUser ? '#9ca3af' : 'white', cursor: user.username === currentUser || loading ? 'not-allowed' : 'pointer' }}>Удалить</button>
                </div>
              </div>
              {editingUser === user.username && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e8eaed' }}>
                  <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Новый пароль" style={{ flex: 1, padding: '8px 12px', fontSize: '14px', border: '1px solid #e0e0e0', borderRadius: '6px', outline: 'none' }} disabled={loading} />
                  <button onClick={() => handleUpdatePassword(user.username)} disabled={loading} style={{ ...btnBase, background: '#16a34a', color: 'white' }}>{loading ? '...' : 'Сохранить'}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
