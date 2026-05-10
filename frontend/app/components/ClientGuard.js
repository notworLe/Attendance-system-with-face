'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isLoggedIn } from '../lib/auth';

const PUBLIC_PATHS = ['/auth/login', '/auth/register'];

export default function ClientGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
    if (!isPublic && !isLoggedIn()) {
      router.replace('/auth/login');
    }
  }, [pathname, router]);

  return children;
}
