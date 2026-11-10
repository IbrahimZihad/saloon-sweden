'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  CalendarDays,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Scissors,
  Settings,
  Star,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useAdminAuth } from '@/components/admin/AdminAuthProvider';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'admin.nav.overview', icon: LayoutDashboard, adminOnly: false },
  { href: '/admin/appointments', label: 'admin.nav.appointments', icon: CalendarDays, adminOnly: false },
  { href: '/admin/services', label: 'admin.nav.services', icon: Scissors, adminOnly: true },
  { href: '/admin/categories', label: 'admin.nav.categories', icon: FolderTree, adminOnly: true },
  { href: '/admin/staff', label: 'admin.nav.staff', icon: Users, adminOnly: true },
  { href: '/admin/customers', label: 'admin.nav.customers', icon: UserRound, adminOnly: false },
  { href: '/admin/testimonials', label: 'admin.nav.testimonials', icon: Star, adminOnly: true },
  { href: '/admin/messages', label: 'admin.nav.messages', icon: Mail, adminOnly: false },
  { href: '/admin/gallery', label: 'admin.nav.gallery', icon: ImageIcon, adminOnly: true },
  { href: '/admin/settings', label: 'admin.nav.settings', icon: Settings, adminOnly: true },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAdminAuth();
  const { t, lang, setLang } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((n) => !n.adminOnly || user?.role === 'ADMIN');
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-ivory/10 px-6 py-6">
        <Link href="/admin" className="font-serif text-2xl text-ivory">Salong Admin</Link>
        <p className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-ivory/40">{t('admin.section')}</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
              isActive(href) ? 'bg-gold/20 text-gold' : 'text-ivory/60 hover:bg-ivory/5 hover:text-ivory',
            )}
          >
            <Icon size={17} strokeWidth={1.5} />
            {t(label)}
          </Link>
        ))}
      </nav>
      <div className="border-t border-ivory/10 px-6 py-5">
        <div className="mb-4 flex items-center gap-3 text-xs text-ivory/60" role="group" aria-label={lang === 'sv' ? 'Språk' : 'Language'}>
          <button
            type="button"
            onClick={() => setLang('sv')}
            aria-pressed={lang === 'sv'}
            className={cn('transition-colors hover:text-ivory', lang === 'sv' && 'text-gold')}
          >
            SV
          </button>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            onClick={() => setLang('en')}
            aria-pressed={lang === 'en'}
            className={cn('transition-colors hover:text-ivory', lang === 'en' && 'text-gold')}
          >
            EN
          </button>
        </div>
        <p className="text-sm text-ivory">{user?.name}</p>
        <p className="text-[0.65rem] uppercase tracking-[0.16em] text-ivory/40">{user?.role === 'ADMIN' ? t('admin.role.admin') : t('admin.role.staff')}</p>
        <div className="mt-4 flex items-center gap-4">
          <button onClick={logout} className="flex items-center gap-2 text-xs text-ivory/60 hover:text-ivory">
            <LogOut size={14} strokeWidth={1.5} /> {t('admin.logout')}
          </button>
          <Link href="/" className="text-xs text-ivory/60 hover:text-ivory">{t('admin.website')}</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-interface min-h-screen bg-ivory">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-charcoal lg:block">{sidebar}</aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-charcoal">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-ivory/90 px-6 py-4 backdrop-blur-md lg:hidden">
          <button onClick={() => setOpen(true)} aria-label={t('admin.menu')} className="text-ink">
            <Menu size={22} strokeWidth={1.5} />
          </button>
          <span className="font-serif text-lg">Salong Admin</span>
          <button onClick={logout} aria-label={t('admin.logout')} className="text-stone">
            <LogOut size={18} strokeWidth={1.5} />
          </button>
        </header>
        <main className="px-6 py-8 lg:px-10 lg:py-10">{children}</main>
      </div>

      {open && (
        <button className="fixed right-4 top-4 z-[60] text-ivory lg:hidden" onClick={() => setOpen(false)} aria-label={t('admin.close')}>
          <X size={24} />
        </button>
      )}
    </div>
  );
}