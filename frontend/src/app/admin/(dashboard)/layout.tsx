'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/components/admin/AdminAuthProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { Spinner } from '@/components/admin/ui';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/admin/login');
  }, [loading, user, router]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-ivory"><Spinner /></div>;
  if (!user) return null;

  return <AdminShell>{children}</AdminShell>;
}