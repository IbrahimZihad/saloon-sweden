import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

export async function seedAdmin(prisma: PrismaClient): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@example.com').toLowerCase();
  const name = process.env.ADMIN_NAME ?? 'Salon Administrator';
  const password = process.env.ADMIN_PASSWORD ?? 'ChangeThisPassword123!';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] Admin account already exists (${email}) — password left untouched.`);
    return;
  }

  const passwordHash = await hash(password, 12);
  await prisma.user.create({
    data: { email, name, passwordHash, role: 'ADMIN', active: true },
  });
  console.log(`[seed] Created admin account: ${email} (password read from ADMIN_PASSWORD, not printed).`);
}