'use client';

import { useEffect, useRef, useState } from 'react';
import { cloneElement, isValidElement } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadImage } from '@/lib/admin-api';
import { MediaImage } from '@/components/ui/MediaImage';
import { useAdminText } from '@/lib/admin-i18n';
import type { AppointmentStatus } from '@/lib/types';

function translateNode(node: ReactNode, translate: (text: string) => string): ReactNode {
  if (typeof node === 'string') return translate(node);
  if (Array.isArray(node)) return node.map((child) => translateNode(child, translate));
  if (isValidElement<{ children?: ReactNode }>(node) && node.props.children !== undefined) {
    return cloneElement(node, undefined, translateNode(node.props.children, translate));
  }
  return node;
}

export function Spinner({ label = 'Laddar…' }: { label?: string }) {
  const tr = useAdminText();
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-stone">
      <Loader2 size={18} className="animate-spin text-gold-dark" />
      {tr(label)}
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  const tr = useAdminText();
  return <p className="border border-[#b23b3b]/30 bg-[#b23b3b]/5 px-4 py-3 text-sm text-[#b23b3b]">{tr(message)}</p>;
}

export function AdminText({ children }: { children: string }) {
  const tr = useAdminText();
  return <>{tr(children)}</>;
}

export function EmptyState({ message }: { message: string }) {
  const tr = useAdminText();
  return <p className="py-16 text-center text-sm text-stone-light">{tr(message)}</p>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('border border-line bg-white', className)}>{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const tr = useAdminText();
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl text-ink">{tr(title)}</h1>
        {subtitle && <p className="mt-1 text-sm text-stone">{tr(subtitle)}</p>}
      </div>
      {action}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const tr = useAdminText();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-ink/50 p-4 backdrop-blur-sm sm:p-8">
      <div
        className={cn('animate-fade-in relative my-auto w-full border border-line bg-ivory', wide ? 'max-w-3xl' : 'max-w-lg')}
        role="dialog"
        aria-modal="true"
        aria-label={tr(title)}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-serif text-xl text-ink">{tr(title)}</h2>
          <button onClick={onClose} aria-label="Stäng" className="text-stone hover:text-ink">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  const tr = useAdminText();
  return (
    <div>
      <label className="field-label">{tr(label)}</label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  PENDING: 'bg-[#b0925a]/15 text-gold-dark',
  CONFIRMED: 'bg-[#3e6b4f]/12 text-[#3e6b4f]',
  COMPLETED: 'bg-charcoal/10 text-charcoal',
  CANCELLED: 'bg-[#b23b3b]/10 text-[#b23b3b]',
  NO_SHOW: 'bg-stone/15 text-stone',
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: 'Väntande',
  CONFIRMED: 'Bekräftad',
  COMPLETED: 'Genomförd',
  CANCELLED: 'Avbokad',
  NO_SHOW: 'Utebliven',
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const tr = useAdminText();
  return (
    <span className={cn('inline-block px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.1em]', STATUS_STYLES[status])}>
      {tr(STATUS_LABELS[status])}
    </span>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  const tr = useAdminText();
  return <th className={cn('px-4 py-3 text-left text-[0.65rem] font-medium uppercase tracking-[0.14em] text-stone-light', className)}>{translateNode(children, tr)}</th>;
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  const tr = useAdminText();
  return <td className={cn('px-4 py-3.5 text-sm text-charcoal', className)}>{translateNode(children, tr)}</td>;
}

type ButtonVariant = 'primary' | 'gold' | 'outline' | 'ghost' | 'danger';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  gold: 'btn-gold',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'border border-[#b23b3b]/40 bg-[#b23b3b]/5 text-[#b23b3b] hover:bg-[#b23b3b]/10',
};

export function Button({
  variant = 'primary',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean }) {
  const tr = useAdminText();
  return (
    <button
      className={cn('btn inline-flex items-center justify-center gap-2', BUTTON_VARIANTS[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {translateNode(children, tr)}
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  const tr = useAdminText();
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-charcoal">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-gold' : 'bg-sand-dark',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all',
            checked ? 'left-[1.125rem]' : 'left-0.5',
          )}
        />
      </button>
      {label && tr(label)}
    </label>
  );
}

export function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const tr = useAdminText();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { url } = await uploadImage(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Uppladdning misslyckades.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <label className="field-label">{tr(label)}</label>
      <div className="flex items-start gap-4">
        {value ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-line bg-cream">
            <MediaImage src={value} alt="" fill sizes="80px" className="object-cover" />
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label={tr('Ta bort bild')}
              className="absolute right-0 top-0 bg-ink/60 p-1 text-ivory hover:bg-ink"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-dashed border-sand-dark bg-cream text-stone-light">
            <Upload size={18} strokeWidth={1.5} />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <input
            className="field"
            placeholder={tr('/uploads/… eller https://…')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" loading={busy} onClick={() => inputRef.current?.click()} className="px-3 py-1.5 text-xs">
              Ladda upp
            </Button>
            <span className="text-xs text-stone-light">{tr('JPEG/PNG/WebP · max 5 MB')}</span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          {error && <p className="field-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}