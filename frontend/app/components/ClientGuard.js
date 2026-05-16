'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isLoggedIn } from '../lib/auth';
import { useAuth } from '../lib/AuthContext';

const PUBLIC_PATHS = ['/auth/login', '/auth/register'];
const ADMIN_PATHS = ['/students', '/settings'];

export default function ClientGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, loading } = useAuth();

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
    if (!isPublic && !isLoggedIn()) {
      router.replace('/auth/login');
      return;
    }

    if (!loading && !isPublic) {
      const isAdminPath = ADMIN_PATHS.some(p => pathname.startsWith(p));
      if (isAdminPath && role !== 'admin') {
         router.replace('/');
      }
    }
  }, [pathname, router, role, loading]);

  return children;
}
