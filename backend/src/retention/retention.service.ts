import { Op, QueryTypes } from 'sequelize';
import { CustomersService } from '../customers/customers.service';
import { DatabaseService } from '../database/database.service';
import { ContactMessage, EmailNotification } from '../database/models';

export interface RetentionOptions {
  /** Months without a booking before a customer's personal data is anonymised. 0 disables. */
  customerMonths: number;
  /** Days after a contact message was handled before it is deleted. 0 disables. */
  contactMessageDays: number;
  /** Days before sent/failed e-mail notification logs are deleted. 0 disables. */
  notificationDays: number;
}

export interface RetentionResult {
  customersAnonymised: number;
  contactMessagesDeleted: number;
  notificationLogsDeleted: number;
}

/** Upper bound per run so a pathological backlog cannot block the daily job. */
const CUSTOMER_BATCH_SIZE = 250;
const CUSTOMER_RUN_LIMIT = 5000;

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function monthsAgo(now: Date, months: number): Date {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - months);
  return cutoff;
}

/**
 * GDPR retention job.
 *
 * Implements the periods published in the privacy policy:
 * - customers without a booking in the configured window are anonymised,
 *   while their appointment rows stay for bookkeeping purposes;
 * - handled contact messages are deleted;
 * - e-mail notification logs (recipient + body) are deleted.
 *
 * Customers who have opted in to marketing, or who have a booking inside the
 * window (including upcoming ones), are never touched.
 */
export class RetentionService {
  constructor(
    private readonly database: DatabaseService,
    private readonly customers: CustomersService,
    private readonly options: RetentionOptions,
  ) {}

  async run(now = new Date()): Promise<RetentionResult> {
    return {
      customersAnonymised: await this.anonymiseInactiveCustomers(now),
      contactMessagesDeleted: await this.deleteHandledContactMessages(now),
      notificationLogsDeleted: await this.deleteNotificationLogs(now),
    };
  }

  private async deleteHandledContactMessages(now: Date): Promise<number> {
    if (this.options.contactMessageDays <= 0) return 0;
    return ContactMessage.destroy({
      where: {
        handled: true,
        createdAt: { [Op.lt]: daysAgo(now, this.options.contactMessageDays) },
      },
    });
  }

  private async deleteNotificationLogs(now: Date): Promise<number> {
    if (this.options.notificationDays <= 0) return 0;
    return EmailNotification.destroy({
      where: {
        createdAt: { [Op.lt]: daysAgo(now, this.options.notificationDays) },
      },
    });
  }

  private async anonymiseInactiveCustomers(now: Date): Promise<number> {
    if (this.options.customerMonths <= 0) return 0;

    const cutoff = monthsAgo(now, this.options.customerMonths);
    let anonymised = 0;

    while (anonymised < CUSTOMER_RUN_LIMIT) {
      const rows = await this.database.query<Array<{ id: string }>>(
        `SELECT c.id AS id
           FROM \`Customer\` c
          WHERE c.marketingConsent = 0
            AND c.email NOT LIKE 'anonymized-%@removed.local'
            AND NOT EXISTS (
              SELECT 1
                FROM \`Appointment\` a
               WHERE a.customerId = c.id
                 AND a.startsAt >= :cutoff
            )
          ORDER BY c.createdAt ASC
          LIMIT :limit`,
        {
          replacements: { cutoff, limit: CUSTOMER_BATCH_SIZE },
          type: QueryTypes.SELECT,
        },
      );

      if (rows.length === 0) break;

      let succeededInBatch = 0;
      for (const row of rows) {
        try {
          await this.customers.erase(row.id);
          anonymised += 1;
          succeededInBatch += 1;
        } catch (error) {
          // A concurrent deletion or anonymisation is harmless; log and continue.
          console.error(`[retention] Failed to anonymise customer ${row.id}:`, error);
        }
      }

      // Avoid looping forever over the same failing rows.
      if (succeededInBatch === 0) break;
      if (rows.length < CUSTOMER_BATCH_SIZE) break;
    }

    return anonymised;
  }
}
