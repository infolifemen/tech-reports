import { redirect } from 'next/navigation';

export default function Home() {
  // For static export with basePath, use relative redirect
  redirect('./login/');
}
