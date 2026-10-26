'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function LoginPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/'); }, [router]);
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", color: '#6b7280' }}>Перенаправление...</div>;
}
