import Image from 'next/image';
import type { ImageProps } from 'next/image';

/**
 * Uploaded media lives behind the /uploads proxy rewrite, not in /public, so the
 * Next image optimizer cannot read it from disk. Serve those unoptimized.
 */
export function MediaImage({ src, ...props }: ImageProps) {
  const isProxy = typeof src === 'string' && src.startsWith('/uploads');
  return <Image src={src} {...props} unoptimized={isProxy || props.unoptimized} />;
}