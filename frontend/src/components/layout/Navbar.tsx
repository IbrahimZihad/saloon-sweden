'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { cn } from '@/lib/utils';

interface NavbarProps {
  salonName: string;
  logoUrl?: string | null;
}

export function Navbar({ salonName, logoUrl }: NavbarProps) {
  const { t, lang, setLang } = useLanguage();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const links = [
    { href: '/', label: t('nav.home') },
    { href: '/services', label: t('nav.services') },
    { href: '/#team', label: t('nav.team') },
    { href: '/contact', label: t('nav.contact') },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href.split('#')[0]);

  const transparent = pathname === '/' && !scrolled && !open;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        transparent
          ? 'bg-transparent py-5'
          : 'border-b border-line bg-ivory/90 py-3 backdrop-blur-md',
      )}
    >
      <nav className="container-luxe flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3" aria-label={salonName}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={salonName} className="h-9 w-auto object-contain" />
          ) : (
            <span
              className={cn(
                'font-serif text-2xl tracking-wide transition-colors',
                transparent ? 'text-ivory' : 'text-ink',
              )}
            >
              {salonName}
            </span>
          )}
        </Link>

        <div className="hidden items-center gap-9 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'link-underline text-[0.78rem] uppercase tracking-[0.16em] transition-colors',
                transparent ? 'text-ivory/90 hover:text-ivory' : 'text-stone hover:text-ink',
                isActive(link.href) && (transparent ? 'text-ivory' : 'text-ink'),
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div
            className={cn(
              'hidden items-center gap-1 text-[0.72rem] tracking-[0.12em] sm:flex',
              transparent ? 'text-ivory/80' : 'text-stone',
            )}
            role="group"
            aria-label="Language"
          >
            <button
              onClick={() => setLang('sv')}
              className={cn('px-1.5 py-1 transition-colors', lang === 'sv' && (transparent ? 'text-ivory' : 'text-gold-dark'))}
              aria-pressed={lang === 'sv'}
            >
              SV
            </button>
            <span className="opacity-40">/</span>
            <button
              onClick={() => setLang('en')}
              className={cn('px-1.5 py-1 transition-colors', lang === 'en' && (transparent ? 'text-ivory' : 'text-gold-dark'))}
              aria-pressed={lang === 'en'}
            >
              EN
            </button>
          </div>

          <Link
            href="/booking"
            className={cn(
              'btn hidden !px-6 !py-2.5 text-[0.72rem] sm:inline-flex',
              transparent ? 'btn-gold' : 'btn-primary',
            )}
          >
            {t('nav.bookNow')}
          </Link>

          <button
            className={cn('lg:hidden', transparent ? 'text-ivory' : 'text-ink')}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t('nav.close') : t('nav.menu')}
            aria-expanded={open}
          >
            {open ? <X size={26} strokeWidth={1.5} /> : <Menu size={26} strokeWidth={1.5} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="animate-fade-in fixed inset-0 top-[64px] z-40 flex flex-col bg-ivory px-8 py-10 lg:hidden">
          <div className="flex flex-col gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-serif text-3xl text-ink"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-10 flex items-center gap-4">
            <Link href="/booking" className="btn btn-primary flex-1" onClick={() => setOpen(false)}>
              {t('nav.bookNow')}
            </Link>
            <div className="flex items-center gap-2 text-sm tracking-[0.12em] text-stone">
              <button onClick={() => setLang('sv')} className={cn(lang === 'sv' && 'text-gold-dark')}>SV</button>
              <span className="opacity-40">/</span>
              <button onClick={() => setLang('en')} className={cn(lang === 'en' && 'text-gold-dark')}>EN</button>
            </div>
          </div>
          <Link href="/admin" className="mt-8 text-xs uppercase tracking-[0.16em] text-stone-light" onClick={() => setOpen(false)}>
            {t('nav.admin')}
          </Link>
        </div>
      )}
    </header>
  );
}