import type { Service } from './types';

const CATEGORY_IMAGES: Record<string, string> = {
  haircuts: '/images/haircut.jpg',
  'hair-coloring': '/images/salon-color.jpg',
  'hair-styling': '/images/styling.jpg',
  'hair-treatments': '/images/hair-wash.jpg',
  'other-services': '/images/hair-detail.jpg',
};

const FALLBACK_IMAGES = [
  '/images/haircut.jpg',
  '/images/salon-chair.jpg',
  '/images/hair-wash.jpg',
  '/images/hair-detail.jpg',
];

export function serviceImage(service: Service, index = 0): string {
  if (service.imageUrl) return service.imageUrl;
  return (
    CATEGORY_IMAGES[service.category?.slug] ??
    FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
  );
}