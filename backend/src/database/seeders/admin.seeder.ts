import { hash } from 'bcryptjs';
import { Role } from '../enums';
import { User } from '../models';

export async function seedAdmin(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@example.com').toLowerCase();
  const name = process.env.ADMIN_NAME ?? 'Salon Administrator';
  const password = process.env.ADMIN_PASSWORD ?? 'ChangeThisPassword123!';

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    console.log(`[seed] Admin account already exists (${email}) — password left untouched.`);
    return;
  }

  const passwordHash = await hash(password, 12);
  await User.create({ email, name, passwordHash, role: Role.ADMIN, active: true });
  console.log(`[seed] Created admin account: ${email} (password read from ADMIN_PASSWORD, not printed).`);
}
