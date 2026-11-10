import { PrismaClient } from '@prisma/client';

const CATEGORIES = [
  { slug: 'haircuts', nameSv: 'Klippningar', nameEn: 'Haircuts', sortOrder: 1 },
  { slug: 'hair-coloring', nameSv: 'Färgning', nameEn: 'Hair Coloring', sortOrder: 2 },
  { slug: 'hair-styling', nameSv: 'Styling', nameEn: 'Hair Styling', sortOrder: 3 },
  { slug: 'hair-treatments', nameSv: 'Hårbehandlingar', nameEn: 'Hair Treatments', sortOrder: 4 },
  { slug: 'other-services', nameSv: 'Övriga tjänster', nameEn: 'Other Services', sortOrder: 5 },
];

export async function seedCategories(prisma: PrismaClient): Promise<void> {
  for (const category of CATEGORIES) {
    await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log(`[seed] ${CATEGORIES.length} service categories ready.`);
}