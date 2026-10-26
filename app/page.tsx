import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect root to login page
  // basePath '/tech-reports' is automatically added by Next.js
  redirect('/login');
}
