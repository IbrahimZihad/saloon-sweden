import { z } from 'zod';

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined));

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1).refine((v) => v.startsWith('mysql://'), {
    message: 'DATABASE_URL must be a MySQL connection string (mysql://...)',
  }),
  TEST_DATABASE_URL: optionalString,
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  ADMIN_NAME: z.string().default('Salon Administrator'),
  ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  ADMIN_PASSWORD: z.string().min(8).default('ChangeThisPassword123!'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  EMAIL_HOST: optionalString,
  EMAIL_PORT: z.coerce.number().int().positive().default(587),
  EMAIL_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  EMAIL_USER: optionalString,
  EMAIL_PASSWORD: optionalString,
  EMAIL_FROM: z.string().default('Salon <no-reply@example.com>'),
  UPLOAD_DIRECTORY: z.string().default('uploads'),
  SEED_DEMO: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}