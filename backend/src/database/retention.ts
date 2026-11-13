import 'reflect-metadata';
import { config } from 'dotenv';
import { CustomersService } from '../customers/customers.service';
import { validateEnv } from '../config/env.validation';
import { DatabaseService } from './database.service';
import { RetentionService } from '../retention/retention.service';
import { createSequelize } from './sequelize.config';

/**
 * Manual GDPR retention run. The same job also runs daily inside the API
 * process; this entrypoint is useful for an ad-hoc run or an external scheduler.
 */
async function main(): Promise<void> {
  config();

  const env = validateEnv(process.env);
  const database = new DatabaseService(createSequelize());

  try {
    await database.connect();
    const retention = new RetentionService(database, new CustomersService(database), {
      customerMonths: env.RETENTION_CUSTOMER_MONTHS,
      contactMessageDays: env.RETENTION_CONTACT_MESSAGE_DAYS,
      notificationDays: env.RETENTION_NOTIFICATION_DAYS,
    });
    const result = await retention.run();
    console.log('[retention] Purged data:', result);
  } finally {
    await database.close();
  }
}

main().catch((error: unknown) => {
  console.error('[retention] Failed:', error);
  process.exitCode = 1;
});
