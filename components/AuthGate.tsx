'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const COOKIE_NAME = 'tech_reports_auth';

function getAuthCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getAuthCookie();
    if (token === 'authenticated') {
      setAuthorized(true);
    } else {
      router.replace('/login');
    }
  }, [router]);

  if (authorized === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0eeeb', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: '#6b7280', fontSize: 14 }}>
        Проверка авторизации…
      </div>
    );
  }

  return <>{children}</>;
}
