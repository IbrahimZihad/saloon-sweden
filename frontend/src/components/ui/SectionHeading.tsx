import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  className?: string;
  light?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
  light = false,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className,
      )}
    >
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h2
        className={cn(
          'heading-display text-balance text-4xl sm:text-5xl',
          light && '!text-ivory',
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={cn('mt-5 text-base leading-relaxed', light ? 'text-ivory/70' : 'text-stone')}>
          {subtitle}
        </p>
      )}
      <div className={cn('mt-7 h-px w-16 bg-gold', align === 'center' && 'mx-auto')} />
    </div>
  );
}