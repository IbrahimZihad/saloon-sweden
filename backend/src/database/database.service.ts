import { Transaction } from 'sequelize';
import type { QueryOptions } from 'sequelize';
import type { Sequelize } from 'sequelize-typescript';

export class DatabaseService {
  constructor(readonly sequelize: Sequelize) {}

  async connect(): Promise<void> {
    await this.sequelize.authenticate();
  }

  async close(): Promise<void> {
    await this.sequelize.close();
  }

  /** Runs a callback inside a READ COMMITTED transaction. */
  transaction<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T> {
    return this.sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
      callback,
    );
  }

  async query<T = unknown>(sql: string, options?: QueryOptions): Promise<T> {
    return (await this.sequelize.query(sql, options)) as T;
  }

  async ping(): Promise<void> {
    await this.sequelize.query('SELECT 1');
  }
}
