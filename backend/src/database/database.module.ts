import { Global, Module } from '@nestjs/common';
import { SEQUELIZE } from './database.constants';
import { DatabaseService } from './database.service';
import { createSequelize } from './sequelize.config';

/**
 * Provides the application-wide Sequelize connection. Models are registered on
 * the instance at construction time, so services can import model classes
 * directly and use their static query methods.
 */
@Global()
@Module({
  providers: [
    {
      provide: SEQUELIZE,
      useFactory: createSequelize,
    },
    DatabaseService,
  ],
  exports: [SEQUELIZE, DatabaseService],
})
export class DatabaseModule {}
