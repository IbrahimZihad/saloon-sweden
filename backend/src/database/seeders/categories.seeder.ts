import { ServiceCategory } from '../models';

const CATEGORIES = [
  { slug: 'haircuts', nameSv: 'Klippningar', nameEn: 'Haircuts', sortOrder: 1 },
  { slug: 'hair-coloring', nameSv: 'Färgning', nameEn: 'Hair Coloring', sortOrder: 2 },
  { slug: 'hair-styling', nameSv: 'Styling', nameEn: 'Hair Styling', sortOrder: 3 },
  { slug: 'hair-treatments', nameSv: 'Hårbehandlingar', nameEn: 'Hair Treatments', sortOrder: 4 },
  { slug: 'other-services', nameSv: 'Övriga tjänster', nameEn: 'Other Services', sortOrder: 5 },
];

export async function seedCategories(): Promise<void> {
  for (const category of CATEGORIES) {
    await ServiceCategory.findOrCreate({
      where: { slug: category.slug },
      defaults: category,
    });
  }
  console.log(`[seed] ${CATEGORIES.length} service categories ready.`);
}
