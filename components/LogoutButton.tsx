'use client';

import { useState } from 'react';
import { logout, isAdmin } from '@/lib/auth';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    setLoading(true);
    logout();
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {isAdmin() && (
        <a
          href="/#/admin"
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = '#/admin';
            window.location.reload();
          }}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            background: 'transparent',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.color = '#1f2937';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          Управление
        </a>
      )}
      <button
        onClick={handleLogout}
        disabled={loading}
        style={{
          padding: '8px 16px',
          fontSize: '13px',
          background: 'transparent',
          color: '#6b7280',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = '#f3f4f6';
          e.currentTarget.style.color = '#1f2937';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#6b7280';
        }}
      >
        {loading ? 'Выход...' : 'Выйти'}
      </button>
    </div>
  );
}
