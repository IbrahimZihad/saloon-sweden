import { describe, expect, it } from 'vitest';
import { serviceImage } from './service-image';
import type { Service } from './types';

function makeService(partial: Partial<Service>): Service {
  return {
    id: 's1',
    categoryId: 'c1',
    slug: 'test',
    nameSv: 'Test',
    nameEn: 'Test',
    descriptionSv: null,
    descriptionEn: null,
    price: '100.00',
    durationMinutes: 30,
    imageUrl: null,
    active: true,
    sortOrder: 0,
    category: { id: 'c1', slug: 'haircuts', nameSv: 'Klippningar', nameEn: 'Haircuts', sortOrder: 1, active: true },
    ...partial,
  };
}

describe('serviceImage', () => {
  it('prefers an explicit image URL', () => {
    expect(serviceImage(makeService({ imageUrl: '/uploads/custom.jpg' }))).toBe('/uploads/custom.jpg');
  });

  it('falls back to the category image', () => {
    expect(serviceImage(makeService({ imageUrl: null }))).toBe('/images/haircut.jpg');
  });

  it('uses a deterministic fallback for an unknown category', () => {
    const service = makeService({
      imageUrl: null,
      category: { id: 'c9', slug: 'unknown', nameSv: 'Okänd', nameEn: 'Unknown', sortOrder: 9, active: true },
    });
    expect(serviceImage(service, 0)).toBe('/images/haircut.jpg');
    expect(serviceImage(service, 1)).toBe('/images/salon-chair.jpg');
    expect(serviceImage(service, 4)).toBe('/images/haircut.jpg');
  });
});